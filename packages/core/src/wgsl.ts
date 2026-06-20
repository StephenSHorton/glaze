import { KUSSETSU_PRELUDE } from "./prelude.js";
import type { WgslType } from "./layout.js";

export interface TextureBinding {
  readonly name: string;
  /** Bind-group binding index of the texture itself. */
  readonly binding: number;
  /** Bind-group binding index of its sampler (`<name>_smp`). */
  readonly samplerBinding: number;
}

export interface ParsedShader {
  /** Custom uniform declarations, in source order. */
  readonly decls: ReadonlyArray<{ name: string; type: WgslType }>;
  /** Texture bindings declared with `@texture`, in source order. */
  readonly textures: readonly TextureBinding[];
  /** The full, ready-to-compile WGSL module. */
  readonly module: string;
}

const VALID_TYPES = new Set<WgslType>(["f32", "vec2f", "vec3f", "vec4f"]);

/** Normalize the few common WGSL vector spellings to the `vec2f` short form. */
function normalizeType(raw: string): WgslType | null {
  const t = raw.trim();
  const map: Record<string, WgslType> = {
    "f32": "f32",
    "vec2f": "vec2f",
    "vec2<f32>": "vec2f",
    "vec3f": "vec3f",
    "vec3<f32>": "vec3f",
    "vec4f": "vec4f",
    "vec4<f32>": "vec4f",
  };
  const out = map[t];
  return out && VALID_TYPES.has(out) ? out : null;
}

// Matches: @uniform <name> : <type> ;   (whitespace-tolerant)
const UNIFORM_RE = /@uniform\s+([A-Za-z_]\w*)\s*:\s*([A-Za-z0-9_<>]+)\s*;/g;

// Matches: @texture <name> ;   (whitespace-tolerant)
const TEXTURE_RE = /@texture\s+([A-Za-z_]\w*)\s*;/g;

/**
 * Parse `@uniform` declarations out of user WGSL and assemble the final module.
 * Throws on an unsupported uniform type so the author gets a clear build-time
 * error rather than a silently black surface.
 */
export function assembleShader(userWgsl: string): ParsedShader {
  const decls: Array<{ name: string; type: WgslType }> = [];

  let stripped = userWgsl.replace(UNIFORM_RE, (_full, name: string, rawType: string) => {
    const type = normalizeType(rawType);
    if (!type) {
      throw new Error(
        `[kussetsu] uniform "${name}" has unsupported type "${rawType}". ` +
          `Supported in v1: f32, vec2f, vec3f, vec4f.`,
      );
    }
    decls.push({ name, type });
    return ""; // remove the declaration from user source
  });

  // Textures get bindings after globals (0) and the user uniform struct (1, if any).
  const textures: TextureBinding[] = [];
  const texBase = decls.length > 0 ? 2 : 1;
  stripped = stripped.replace(TEXTURE_RE, (_full, name: string) => {
    const i = textures.length;
    textures.push({ name, binding: texBase + i * 2, samplerBinding: texBase + i * 2 + 1 });
    return ""; // remove the declaration from user source
  });

  if (!/\bfn\s+paint\s*\(/.test(stripped)) {
    throw new Error(
      `[kussetsu] shader is missing its entry point. Define ` +
        `\`fn paint(uv: vec2f) -> vec4f\` in your WGSL.`,
    );
  }

  const userStruct =
    decls.length > 0
      ? `struct KussetsuUser {\n` +
        decls.map((d) => `  ${d.name}: ${d.type},`).join("\n") +
        `\n};\n@group(0) @binding(1) var<uniform> u: KussetsuUser;\n`
      : "";

  const textureDecls = textures
    .map(
      (t) =>
        `@group(0) @binding(${t.binding}) var ${t.name}: texture_2d<f32>;\n` +
        `@group(0) @binding(${t.samplerBinding}) var ${t.name}_smp: sampler;\n`,
    )
    .join("");

  const module = /* wgsl */ `
struct KussetsuGlobals {
  resolution: vec2f,
  mouse: vec2f,
  time: f32,
  scroll: f32,
  dpr: f32,
  _pad0: f32,
};
@group(0) @binding(0) var<uniform> globals: KussetsuGlobals;
${userStruct}${textureDecls}${KUSSETSU_PRELUDE}

${stripped}

struct KussetsuVsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn kussetsu_vs(@builtin(vertex_index) vi: u32) -> KussetsuVsOut {
  // One oversized triangle covering the viewport.
  var pts = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  let xy = pts[vi];
  var out: KussetsuVsOut;
  out.position = vec4f(xy, 0.0, 1.0);
  // uv origin at top-left, matching screen/DOM convention.
  out.uv = vec2f(xy.x * 0.5 + 0.5, 1.0 - (xy.y * 0.5 + 0.5));
  return out;
}

@fragment
fn kussetsu_fs(in: KussetsuVsOut) -> @location(0) vec4f {
  return paint(in.uv);
}
`;

  return { decls, textures, module };
}
