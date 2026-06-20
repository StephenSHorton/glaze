/**
 * A small library of WGSL helpers injected before user code so effects compose
 * like utility functions. Intentionally modest for v1 — hashing, value noise,
 * fbm, an HSV->RGB convenience, and a rounded-box SDF cover most decorative
 * shader needs. Everything is prefixed `kussetsu_` to avoid clobbering user names,
 * with a few unprefixed conveniences that are very unlikely to collide.
 */
export const KUSSETSU_PRELUDE = /* wgsl */ `
const KUSSETSU_PI: f32 = 3.14159265359;
const KUSSETSU_TAU: f32 = 6.28318530718;

fn kussetsu_hash21(p: vec2f) -> f32 {
  var h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

fn kussetsu_noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = kussetsu_hash21(i + vec2f(0.0, 0.0));
  let b = kussetsu_hash21(i + vec2f(1.0, 0.0));
  let c = kussetsu_hash21(i + vec2f(0.0, 1.0));
  let d = kussetsu_hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn kussetsu_fbm(p0: vec2f) -> f32 {
  var p = p0;
  var value = 0.0;
  var amplitude = 0.5;
  for (var i = 0; i < 5; i = i + 1) {
    value = value + amplitude * kussetsu_noise(p);
    p = p * 2.0;
    amplitude = amplitude * 0.5;
  }
  return value;
}

fn kussetsu_hsv2rgb(c: vec3f) -> vec3f {
  let k = vec4f(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  let p = abs(fract(vec3f(c.x) + k.xyz) * 6.0 - vec3f(k.w));
  return c.z * mix(vec3f(k.x), clamp(p - vec3f(k.x), vec3f(0.0), vec3f(1.0)), c.y);
}

// Signed distance to a rounded box centered at the origin.
// p: point, b: half-size, r: corner radius.
fn kussetsu_sd_round_box(p: vec2f, b: vec2f, r: f32) -> f32 {
  let q = abs(p) - b + vec2f(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, vec2f(0.0))) - r;
}
`;
