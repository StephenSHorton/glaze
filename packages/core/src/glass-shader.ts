/**
 * The built-in glass shader used by the <GlassScene>/<GlassPanel> abstraction.
 * It refracts a single `backdrop` texture — a captured snapshot of the scene
 * behind the panel — sampling it at the panel's rect within the scene
 * (`origin`/`size`, in scene UV) so the interior stays 1:1 with the real
 * backdrop and only the rounded rim bends.
 *
 * Uniforms the library drives for you (the consumer never writes these):
 *   origin/size  — panel rect in scene UV (updated every frame)
 *   radius       — corner radius (CSS px)
 *   blur         — frost amount (texture-uv radius), 0 = perfectly clear
 *   refraction   — edge bend strength
 *   dispersion   — chromatic split at the rim
 *   rim          — rim refraction band width
 *   tint/tintAmount — optional glass tint
 *   specular     — highlight intensity (rim/sweep/sheen/glint)
 *   hover        — 0..1 pointer presence (drives the glint)
 */
export const GLAZE_GLASS = /* wgsl */ `
@texture backdrop;
@uniform origin: vec2f;
@uniform size: vec2f;
@uniform radius: f32;
@uniform blur: f32;
@uniform refraction: f32;
@uniform dispersion: f32;
@uniform rim: f32;
@uniform color: vec3f;
@uniform tintAmount: f32;
@uniform specular: f32;
@uniform hover: f32;

// Powdered/matte frost: a clean CSS-style Gaussian blur of the backdrop plus a
// soft matte veil that BUILDS toward a fully solid, opaque panel as the amount
// rises — like dusting more and more frosting on until you can't see through.
fn frost(uv: vec2f, amount: f32) -> vec3f {
  let f = clamp(amount / 0.02, 0.0, 1.0); // 0..1 over the slider range
  if (f <= 0.001) { return textureSample(backdrop, backdrop_smp, uv).rgb; }
  let scale = max(globals.resolution.y, 1.0);

  // Smooth Gaussian blur via a golden-angle disc — no axis-aligned cross
  // pattern, the way a CSS blur() looks. k circularizes the kernel for the
  // backdrop's aspect (the panel covers size-fraction of the wider scene).
  let radius = 0.002 + f * 0.007;
  let k = (globals.resolution.y / max(globals.resolution.x, 1.0)) * (u.size.x / max(u.size.y, 1e-4));
  var col = textureSample(backdrop, backdrop_smp, uv).rgb;
  var wsum = 1.0;
  let GA = 2.3999632; // golden angle
  for (var i = 1; i <= 20; i = i + 1) {
    let fi = f32(i);
    let ang = fi * GA;
    let rad = sqrt(fi / 20.0) * radius;
    let off = vec2f(cos(ang) * k, sin(ang)) * rad;
    let w = exp(-1.8 * (rad / radius) * (rad / radius));
    col += textureSample(backdrop, backdrop_smp, uv + off).rgb * w;
    wsum += w;
  }
  col = col / wsum;

  // Powder veil — soft cloud + fine grain, mixed in proportional to amount, so
  // f = 1 is fully solid matte (the backdrop is completely hidden).
  let cloud = glaze_fbm(uv * scale * 0.14);
  let grain = glaze_hash21(floor(uv * globals.resolution / 2.0)) - 0.5;
  let powder = u.color * (0.95 + 0.05 * cloud) + grain * 0.025;
  col = mix(col, powder, f);

  return col;
}

fn paint(uv: vec2f) -> vec4f {
  let res = globals.resolution;
  let aspect = res.x / max(res.y, 1.0);

  // Rounded-rect SDF in aspect-corrected local space.
  let p = (uv - vec2f(0.5)) * vec2f(aspect, 1.0);
  let halfb = vec2f(0.5 * aspect, 0.5) - vec2f(0.004);
  let rr = clamp(u.radius / max(res.y, 1.0), 0.02, 0.5);
  let d = glaze_sd_round_box(p, halfb, rr);

  // SDF gradient ~ glass surface normal.
  let e = 0.0022;
  let gx = glaze_sd_round_box(p + vec2f(e, 0.0), halfb, rr) - glaze_sd_round_box(p - vec2f(e, 0.0), halfb, rr);
  let gy = glaze_sd_round_box(p + vec2f(0.0, e), halfb, rr) - glaze_sd_round_box(p - vec2f(0.0, e), halfb, rr);
  var n = vec2f(gx, gy);
  n = n / max(length(n), 1e-4);

  // Refraction concentrated in the rim band; interior stays seamless.
  let edge = smoothstep(max(u.rim, 0.001), 0.0, -d);
  let baseUV = u.origin + uv * u.size;
  let refrUV = baseUV + n * edge * u.refraction * u.size;
  let ca = u.dispersion * edge * length(u.size);

  // Fade the rim's chromatic refraction as powder builds, so full frost is
  // genuinely solid (no see-through grass at the edge).
  let frostF = clamp(u.blur / 0.02, 0.0, 1.0);
  let caEdge = edge * (1.0 - frostF);
  var col = frost(refrUV, u.blur);
  col.r = mix(col.r, textureSample(backdrop, backdrop_smp, refrUV + n * ca).r, caEdge);
  col.b = mix(col.b, textureSample(backdrop, backdrop_smp, refrUV - n * ca).b, caEdge);

  // Optional color tint + a touch of brightening.
  col = mix(col, u.color, u.tintAmount);
  col *= 1.04;

  // Static specular highlights (rim, top sheen, pointer glint), scaled by the
  // specular uniform. No animated sweep.
  let rimHi = smoothstep(0.010, 0.0, abs(d));
  let lit = clamp(0.5 - 0.55 * n.y - 0.2 * n.x, 0.0, 1.0);
  let sheen = smoothstep(0.62, 0.0, uv.y);
  let glint = smoothstep(0.22, 0.0, distance(uv, globals.mouse)) * u.hover;

  col += vec3f(1.0) * rimHi * (0.10 + 0.30 * lit) * u.specular;
  col += vec3f(1.0) * sheen * 0.05 * edge * u.specular;
  col += vec3f(1.0) * glint * 0.14 * u.specular;

  return vec4f(col, 1.0);
}
`;
