// WebGPU 2D painter: one instanced draw call for all rounded rects, plus text
// rasterized to textures (string -> 2D canvas -> GPU texture -> quad). Geometry is
// in CSS px; the framebuffer is DPR-scaled, so NDC conversion is DPR-independent.
import type { RGBA } from "./scene";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  color: RGBA; // straight rgba 0..1
}

export interface TextItem {
  x: number;
  y: number;
  text: string;
  size: number;
  weight: number;
  color: RGBA;
}

const RECT_WGSL = /* wgsl */ `
struct Viewport { size: vec2f };
@group(0) @binding(0) var<uniform> vp: Viewport;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) local: vec2f,
  @location(1) half: vec2f,
  @location(2) radius: f32,
  @location(3) color: vec4f,
};

const QUAD = array<vec2f, 6>(
  vec2f(0,0), vec2f(1,0), vec2f(0,1),
  vec2f(0,1), vec2f(1,0), vec2f(1,1),
);

@vertex
fn vs(@builtin(vertex_index) vi: u32,
      @location(0) rect: vec4f,
      @location(1) radius: f32,
      @location(2) color: vec4f) -> VSOut {
  let q = QUAD[vi];
  let px = rect.xy + q * rect.zw;
  let clip = vec2f(px.x / vp.size.x * 2.0 - 1.0, -(px.y / vp.size.y * 2.0 - 1.0));
  let half = rect.zw * 0.5;
  var out: VSOut;
  out.pos = vec4f(clip, 0.0, 1.0);
  out.local = (q - 0.5) * rect.zw;
  out.half = half;
  out.radius = min(radius, min(half.x, half.y));
  out.color = color;
  return out;
}

fn sdRoundBox(p: vec2f, b: vec2f, r: f32) -> f32 {
  let q = abs(p) - b + vec2f(r);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  let d = sdRoundBox(in.local, in.half, in.radius);
  let aa = fwidth(d);
  let alpha = 1.0 - smoothstep(-aa, aa, d);
  let a = in.color.a * alpha;
  return vec4f(in.color.rgb * a, a); // premultiplied
}
`;

const TEXT_WGSL = /* wgsl */ `
struct Viewport { size: vec2f };
struct QuadRect { rect: vec4f };
@group(0) @binding(0) var<uniform> vp: Viewport;
@group(0) @binding(1) var<uniform> qr: QuadRect;
@group(0) @binding(2) var samp: sampler;
@group(0) @binding(3) var tex: texture_2d<f32>;

struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
const Q = array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1), vec2f(0,1),vec2f(1,0),vec2f(1,1));

@vertex fn vs(@builtin(vertex_index) vi: u32) -> VSOut {
  let q = Q[vi];
  let px = qr.rect.xy + q * qr.rect.zw;
  let clip = vec2f(px.x/vp.size.x*2.0-1.0, -(px.y/vp.size.y*2.0-1.0));
  var o: VSOut; o.pos = vec4f(clip,0,1); o.uv = q; return o;
}
@fragment fn fs(in: VSOut) -> @location(0) vec4f {
  return textureSample(tex, samp, in.uv); // texture already premultiplied
}
`;

const PREMUL_BLEND: GPUBlendState = {
  color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
};

const FLOATS_PER_RECT = 12; // [x,y,w,h][radius,pad,pad,pad][r,g,b,a]
const RECT_STRIDE = FLOATS_PER_RECT * 4;

function rgbaCss(c: RGBA): string {
  return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${c[3]})`;
}

export class Painter {
  private constructor(
    private device: GPUDevice,
    private context: GPUCanvasContext,
    private format: GPUTextureFormat,
    private canvas: HTMLCanvasElement,
    private rectPipeline: GPURenderPipeline,
    private textPipeline: GPURenderPipeline,
    private vpBuffer: GPUBuffer,
    private rectBindGroup: GPUBindGroup,
    private sampler: GPUSampler,
  ) {}

  static async create(canvas: HTMLCanvasElement): Promise<Painter> {
    if (!navigator.gpu) throw new Error("WebGPU not supported (navigator.gpu is undefined)");
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("No GPUAdapter");
    const device = await adapter.requestDevice();
    device.lost.then((info) => console.error("WebGPU device lost:", info.reason, info.message));

    const context = canvas.getContext("webgpu") as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: "premultiplied" });

    const rectModule = device.createShaderModule({ code: RECT_WGSL });
    const rectPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: rectModule,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: RECT_STRIDE,
            stepMode: "instance",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x4" },
              { shaderLocation: 1, offset: 16, format: "float32" },
              { shaderLocation: 2, offset: 32, format: "float32x4" },
            ],
          },
        ],
      },
      fragment: { module: rectModule, entryPoint: "fs", targets: [{ format, blend: PREMUL_BLEND }] },
      primitive: { topology: "triangle-list" },
    });

    const textModule = device.createShaderModule({ code: TEXT_WGSL });
    const textPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: textModule, entryPoint: "vs" },
      fragment: { module: textModule, entryPoint: "fs", targets: [{ format, blend: PREMUL_BLEND }] },
      primitive: { topology: "triangle-list" },
    });

    const vpBuffer = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const rectBindGroup = device.createBindGroup({
      layout: rectPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: vpBuffer } }],
    });
    const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

    const p = new Painter(device, context, format, canvas, rectPipeline, textPipeline, vpBuffer, rectBindGroup, sampler);
    p.resize();
    return p;
  }

  /** CSS-pixel size of the canvas; also resizes the backing store to DPR. */
  size(): { cssWidth: number; cssHeight: number } {
    return this.resize();
  }
  private resize() {
    const dpr = window.devicePixelRatio || 1;
    // getBoundingClientRect reflects the CSS-rendered size, independent of the
    // width/height ATTRIBUTES we set below — so no attribute->layout feedback.
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(rect.width));
    const cssHeight = Math.max(1, Math.round(rect.height));
    const max = this.device.limits.maxTextureDimension2D;
    this.canvas.width = Math.min(cssWidth * dpr, max);
    this.canvas.height = Math.min(cssHeight * dpr, max);
    return { cssWidth, cssHeight };
  }

  // ── text texture cache (by content+style) ───────────────────────────────
  private texCache = new Map<string, { view: GPUTextureView; cssW: number; cssH: number }>();
  private rectBuffers: GPUBuffer[] = [];

  private getText(item: TextItem) {
    const key = `${item.size}|${item.weight}|${rgbaCss(item.color)}|${item.text}`;
    let entry = this.texCache.get(key);
    if (entry) return entry;

    const dpr = window.devicePixelRatio || 1;
    const font = `${item.weight} ${item.size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const measure = document.createElement("canvas").getContext("2d")!;
    measure.font = font;
    const m = measure.measureText(item.text);
    const cssW = Math.ceil(m.width) + 2;
    const ascent = m.actualBoundingBoxAscent || item.size * 0.8;
    const descent = m.actualBoundingBoxDescent || item.size * 0.2;
    const cssH = Math.ceil(ascent + descent) + 2;

    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.round(cssW * dpr));
    off.height = Math.max(1, Math.round(cssH * dpr));
    const ctx = off.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.fillStyle = rgbaCss(item.color);
    ctx.textBaseline = "alphabetic";
    ctx.fillText(item.text, 1, ascent + 1);

    const texture = this.device.createTexture({
      size: [off.width, off.height],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.device.queue.copyExternalImageToTexture(
      { source: off, flipY: false },
      { texture, premultipliedAlpha: true },
      [off.width, off.height],
    );
    entry = { view: texture.createView(), cssW, cssH };
    this.texCache.set(key, entry);
    return entry;
  }

  frame(rects: Rect[], texts: TextItem[]) {
    const { cssWidth, cssHeight } = this.resize();
    this.device.queue.writeBuffer(this.vpBuffer, 0, new Float32Array([cssWidth, cssHeight, 0, 0]));

    // instance buffer for rects
    let instanceBuffer: GPUBuffer | null = null;
    if (rects.length) {
      instanceBuffer = this.device.createBuffer({
        size: rects.length * RECT_STRIDE,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      const data = new Float32Array(rects.length * FLOATS_PER_RECT);
      rects.forEach((r, i) => {
        const o = i * FLOATS_PER_RECT;
        data[o] = r.x; data[o + 1] = r.y; data[o + 2] = r.w; data[o + 3] = r.h;
        data[o + 4] = r.radius;
        data[o + 8] = r.color[0]; data[o + 9] = r.color[1]; data[o + 10] = r.color[2]; data[o + 11] = r.color[3];
      });
      this.device.queue.writeBuffer(instanceBuffer, 0, data);
    }

    // per-text quad-rect uniform buffers (pooled by slot)
    const textEntries = texts.map((t) => this.getText(t));
    while (this.rectBuffers.length < texts.length) {
      this.rectBuffers.push(this.device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }));
    }
    const textBindGroups: GPUBindGroup[] = [];
    texts.forEach((t, i) => {
      const e = textEntries[i];
      this.device.queue.writeBuffer(this.rectBuffers[i], 0, new Float32Array([t.x, t.y, e.cssW, e.cssH]));
      textBindGroups.push(
        this.device.createBindGroup({
          layout: this.textPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: this.vpBuffer } },
            { binding: 1, resource: { buffer: this.rectBuffers[i] } },
            { binding: 2, resource: this.sampler },
            { binding: 3, resource: e.view },
          ],
        }),
      );
    });

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    if (instanceBuffer) {
      pass.setPipeline(this.rectPipeline);
      pass.setBindGroup(0, this.rectBindGroup);
      pass.setVertexBuffer(0, instanceBuffer);
      pass.draw(6, rects.length);
    }
    textBindGroups.forEach((bg) => {
      pass.setPipeline(this.textPipeline);
      pass.setBindGroup(0, bg);
      pass.draw(6);
    });

    pass.end();
    this.device.queue.submit([encoder.finish()]);
    instanceBuffer?.destroy();
  }
}
