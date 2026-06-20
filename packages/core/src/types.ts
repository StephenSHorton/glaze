/** A scalar (number / boolean) or vector (number[] / Float32Array) uniform value. */
export type UniformValue = number | boolean | readonly number[] | Float32Array;

/** A bag of uniform values, keyed by the name used in `@uniform <name>` in WGSL. */
export type Uniforms = Record<string, UniformValue>;

/**
 * A source for a `@texture` binding. A string is treated as an image URL
 * (loaded same-origin to avoid CORS surprises); other values are anything
 * `copyExternalImageToTexture` accepts and are uploaded directly.
 */
export type TextureSource =
  | string
  | ImageBitmap
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | OffscreenCanvas;

/** Textures to bind, keyed by the name used in `@texture <name>;` in WGSL. */
export type Textures = Record<string, TextureSource>;

/**
 * What Kussetsu renders when WebGPU is unavailable, the shader fails to compile,
 * or the device is lost. A fallback is mandatory by design: a Kussetsu surface
 * should never leave a blank hole on an unsupported client.
 */
export type Fallback =
  /** Apply a CSS value as the element's `background` (e.g. a gradient). */
  | { readonly kind: "css"; readonly value: string }
  /** Apply a solid background color. */
  | { readonly kind: "color"; readonly value: string }
  /** Set a background image URL (e.g. a build-time poster of the shader). */
  | { readonly kind: "image"; readonly url: string }
  /** Render nothing. Only valid when the element is legible without the shader. */
  | { readonly kind: "none" };

export interface ShaderOptions {
  /**
   * WGSL source. Must define `fn paint(uv: vec2f) -> vec4f`.
   * Declare custom uniforms with `@uniform <name>: <type>;` (f32 | vec2f | vec3f | vec4f).
   * Built-in globals are available as `globals.time`, `globals.mouse`,
   * `globals.resolution`, `globals.scroll`, `globals.dpr`.
   * Custom uniforms are available as `u.<name>`.
   */
  readonly wgsl: string;
  /** Initial uniform values, keyed by name. */
  readonly uniforms?: Uniforms;
  /**
   * Called once per rendered frame to supply uniforms that change every frame
   * (e.g. a panel's position within a backdrop). Returned values are merged and
   * uploaded before the draw. Return `null` to skip. Keep it cheap.
   */
  readonly uniformsPerFrame?: () => Uniforms | null;
  /**
   * Images to bind, keyed by the name used in `@texture <name>;` in WGSL.
   * Sample in WGSL with `textureSample(name, name_smp, uv)`.
   */
  readonly textures?: Textures;
  /**
   * What to show when the GPU path is unavailable. Mandatory by design.
   * Defaults to `{ kind: "none" }` only if omitted — but you should always set one.
   */
  readonly fallback?: Fallback;
  /**
   * Honor `prefers-reduced-motion`. When `"freeze"` (default), the animation
   * loop is disabled and a single static frame is rendered (time pinned to
   * `posterTime`). When `"ignore"`, the shader animates regardless.
   */
  readonly reducedMotion?: "freeze" | "ignore";
  /** The `globals.time` value used for the frozen/static frame. Default 0. */
  readonly posterTime?: number;
  /** Pause rendering while the element is scrolled out of view. Default true. */
  readonly pauseWhenOffscreen?: boolean;
  /** Device-pixel-ratio cap, to bound cost on high-DPR / low-power devices. Default 2. */
  readonly maxDpr?: number;
  /** Called once if Kussetsu falls back instead of rendering on the GPU. */
  readonly onFallback?: (reason: FallbackReason) => void;
  /** Called once the GPU surface is live and the first frame has been drawn. */
  readonly onReady?: () => void;
}

export type FallbackReason =
  | "no-webgpu"
  | "no-adapter"
  | "no-device"
  | "device-lost"
  | "shader-error"
  | "texture-error"
  | "context-error";

export interface ShaderSurface {
  /** Merge new uniform values and request a redraw. Unknown keys warn (dev) and are ignored. */
  setUniforms(next: Uniforms): void;
  /** Pause the render loop. */
  pause(): void;
  /** Resume the render loop (no-op under reduced-motion freeze). */
  resume(): void;
  /** Tear down: stop rendering, release GPU resources, remove the canvas, restore styles. */
  destroy(): void;
  /** True if the GPU path is live; false if the surface fell back. */
  readonly active: boolean;
}
