// WGSL effects for the demo. Each defines `fn paint(uv: vec2f) -> vec4f` and
// declares its reactive inputs with `@uniform` / images with `@texture`.
// Built-ins: globals.{time,mouse,resolution,scroll,dpr}.
// Prelude helpers: glaze_fbm, glaze_noise, glaze_hsv2rgb, glaze_sd_round_box, ...

export const AURORA = /* wgsl */ `
@uniform intensity: f32;
@uniform warm: f32;
@uniform tint: vec3f;

fn paint(uv: vec2f) -> vec4f {
  let t = globals.time;
  var p = uv * vec2f(2.2, 3.4);
  let n1 = glaze_fbm(p + vec2f(t * 0.03, t * 0.06));
  let n2 = glaze_fbm(p * 1.7 - vec2f(t * 0.045, 0.0));
  let bands = smoothstep(0.15, 0.95, n1 * 0.7 + n2 * 0.55);
  let cold = vec3f(0.04, 0.17, 0.45);
  let hot = u.tint;
  var col = mix(cold, hot, clamp(bands * (0.5 + u.warm), 0.0, 1.0));
  let d = distance(uv, globals.mouse);
  col += hot * 0.30 * smoothstep(0.5, 0.0, d) * u.intensity;
  col *= mix(1.0, 0.45, smoothstep(0.25, 1.0, uv.y));
  col *= 0.5 + 1.1 * u.intensity;
  return vec4f(col, 1.0);
}
`;

export const RIPPLE = /* wgsl */ `
@uniform hover: f32;
@uniform accent: vec3f;

fn paint(uv: vec2f) -> vec4f {
  let t = globals.time;
  let d = distance(uv, globals.mouse);
  let ring = sin(d * 38.0 - t * 5.0) * 0.5 + 0.5;
  let glow = smoothstep(0.7, 0.0, d) * u.hover;
  let base = vec3f(0.10, 0.12, 0.22);
  let col = base + u.accent * (0.12 + 0.55 * ring * glow);
  return vec4f(col, 1.0);
}
`;

// Full-bleed background: the grass photo, softly blurred (3x3 tent), with a
// gentle vignette so the glass panel reads against it.
export const GRASS_BG = /* wgsl */ `
@texture grass;

fn gblur(uv: vec2f, r: f32) -> vec3f {
  var s = textureSample(grass, grass_smp, uv).rgb * 0.25;
  s += textureSample(grass, grass_smp, uv + vec2f( r, 0.0)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(-r, 0.0)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(0.0,  r)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(0.0, -r)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f( r,  r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f(-r,  r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f( r, -r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f(-r, -r)).rgb * 0.0625;
  return s;
}

fn paint(uv: vec2f) -> vec4f {
  var c = gblur(uv, 0.006);
  let d = distance(uv, vec2f(0.5, 0.5));
  c *= mix(1.0, 0.78, smoothstep(0.15, 0.95, d));
  return vec4f(c, 1.0);
}
`;

// Clear refractive glass: samples the SAME grass at this fragment's position in
// the stage (so it lines up seamlessly with the background), then BENDS the
// sample near the rounded edges like a real glass slab — plus chromatic
// dispersion, a light frost, white specular/rim/glint. Neutral (no color tint),
// see-through, opaque. origin/size place the panel within the stage in 0..1.
export const GLASS_REFRACT = /* wgsl */ `
@texture grass;
@uniform origin: vec2f;   // panel top-left, in stage UV (0..1)
@uniform size: vec2f;     // panel size, in stage UV (0..1)
@uniform radius: f32;     // corner radius, CSS px
@uniform hover: f32;      // 0..1 pointer presence

fn gblur(uv: vec2f, r: f32) -> vec3f {
  var s = textureSample(grass, grass_smp, uv).rgb * 0.25;
  s += textureSample(grass, grass_smp, uv + vec2f( r, 0.0)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(-r, 0.0)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(0.0,  r)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(0.0, -r)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f( r,  r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f(-r,  r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f( r, -r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f(-r, -r)).rgb * 0.0625;
  return s;
}

fn paint(uv: vec2f) -> vec4f {
  let res = globals.resolution;
  let aspect = res.x / max(res.y, 1.0);
  let t = globals.time;

  // Rounded-rect SDF in aspect-corrected local space.
  let p = (uv - vec2f(0.5)) * vec2f(aspect, 1.0);
  let halfb = vec2f(0.5 * aspect, 0.5) - vec2f(0.004);
  let rr = clamp(u.radius / max(res.y, 1.0), 0.02, 0.5);
  let d = glaze_sd_round_box(p, halfb, rr);

  // SDF gradient ≈ glass surface normal direction.
  let e = 0.0022;
  let gx = glaze_sd_round_box(p + vec2f(e, 0.0), halfb, rr) - glaze_sd_round_box(p - vec2f(e, 0.0), halfb, rr);
  let gy = glaze_sd_round_box(p + vec2f(0.0, e), halfb, rr) - glaze_sd_round_box(p - vec2f(0.0, e), halfb, rr);
  var n = vec2f(gx, gy);
  n = n / max(length(n), 1e-4);

  // Refraction concentrated toward the rounded border (like a real bevel).
  let edge = smoothstep(0.12, 0.0, -d);            // ~1 right at the edge, 0 inside
  let baseUV = u.origin + uv * u.size;             // seamless with the background
  let refrUV = baseUV + n * edge * 0.06 * u.size;  // bend the sample outward near edges

  // Softly-blurred base sample (coherent with the blurred background), then a
  // subtle chromatic split at the edges only.
  var col = gblur(refrUV, 0.005);
  let ca = 0.006 * edge * length(u.size);
  col.r = mix(col.r, textureSample(grass, grass_smp, refrUV + n * ca).r, edge);
  col.b = mix(col.b, textureSample(grass, grass_smp, refrUV - n * ca).b, edge);

  // Glass passes light: gentle brighten + a touch of desaturation. Neutral.
  let luma = dot(col, vec3f(0.299, 0.587, 0.114));
  col = mix(col, vec3f(luma), 0.05);
  col *= 1.06;

  // White specular highlights — natural, not colored.
  let dir = normalize(vec2f(0.55, 0.8));
  let proj = dot(uv - vec2f(0.5), dir);
  let sweep = smoothstep(0.085, 0.0, abs(proj - 0.26 * sin(t * 0.3)));
  let rim = smoothstep(0.010, 0.0, abs(d));
  let lit = clamp(0.5 - 0.55 * n.y - 0.2 * n.x, 0.0, 1.0);
  let sheen = smoothstep(0.62, 0.0, uv.y);
  let glint = smoothstep(0.22, 0.0, distance(uv, globals.mouse)) * u.hover;

  col += vec3f(1.0) * rim * (0.10 + 0.30 * lit);
  col += vec3f(1.0) * sweep * 0.10;
  col += vec3f(1.0) * sheen * 0.05 * edge;
  col += vec3f(1.0) * glint * 0.14;

  return vec4f(col, 1.0); // opaque: you see the (refracted) grass through the glass
}
`;

// Like GLASS_REFRACT, but ALSO refracts a captured DOM snapshot (`content`,
// a transparent-background raster of real page text) and composites it over the
// grass — so live DOM text appears to bend through the glass.
export const GLASS_DOM = /* wgsl */ `
@texture grass;
@texture content;
@uniform origin: vec2f;
@uniform size: vec2f;
@uniform radius: f32;
@uniform hover: f32;

fn gblur(uv: vec2f, r: f32) -> vec3f {
  var s = textureSample(grass, grass_smp, uv).rgb * 0.25;
  s += textureSample(grass, grass_smp, uv + vec2f( r, 0.0)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(-r, 0.0)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(0.0,  r)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f(0.0, -r)).rgb * 0.125;
  s += textureSample(grass, grass_smp, uv + vec2f( r,  r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f(-r,  r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f( r, -r)).rgb * 0.0625;
  s += textureSample(grass, grass_smp, uv + vec2f(-r, -r)).rgb * 0.0625;
  return s;
}

fn paint(uv: vec2f) -> vec4f {
  let res = globals.resolution;
  let aspect = res.x / max(res.y, 1.0);
  let t = globals.time;

  let p = (uv - vec2f(0.5)) * vec2f(aspect, 1.0);
  let halfb = vec2f(0.5 * aspect, 0.5) - vec2f(0.004);
  let rr = clamp(u.radius / max(res.y, 1.0), 0.02, 0.5);
  let d = glaze_sd_round_box(p, halfb, rr);

  let e = 0.0022;
  let gx = glaze_sd_round_box(p + vec2f(e, 0.0), halfb, rr) - glaze_sd_round_box(p - vec2f(e, 0.0), halfb, rr);
  let gy = glaze_sd_round_box(p + vec2f(0.0, e), halfb, rr) - glaze_sd_round_box(p - vec2f(0.0, e), halfb, rr);
  var n = vec2f(gx, gy);
  n = n / max(length(n), 1e-4);

  // Thin, pronounced refraction right at the rim so the interior text stays
  // 1:1 with the background (seamless) and only bends at the glass edge.
  let edge = smoothstep(0.05, 0.0, -d);
  let baseUV = u.origin + uv * u.size;
  let refrUV = baseUV + n * edge * 0.05 * u.size;
  let ca = 0.006 * edge * length(u.size);

  // Grass base (blurred), with edge chromatic split.
  var col = gblur(refrUV, 0.005);
  col.r = mix(col.r, textureSample(grass, grass_smp, refrUV + n * ca).r, edge);
  col.b = mix(col.b, textureSample(grass, grass_smp, refrUV - n * ca).b, edge);

  // Refracted DOM text composited over the grass, dispersed at the edges.
  let txt = textureSample(content, content_smp, refrUV);
  let tr = textureSample(content, content_smp, refrUV + n * ca).r;
  let tb = textureSample(content, content_smp, refrUV - n * ca).b;
  let tcol = vec3f(mix(txt.r, tr, edge), txt.g, mix(txt.b, tb, edge));
  col = mix(col, tcol, txt.a);

  let luma = dot(col, vec3f(0.299, 0.587, 0.114));
  col = mix(col, vec3f(luma), 0.05);
  col *= 1.06;

  let dir = normalize(vec2f(0.55, 0.8));
  let proj = dot(uv - vec2f(0.5), dir);
  let sweep = smoothstep(0.085, 0.0, abs(proj - 0.26 * sin(t * 0.3)));
  let rim = smoothstep(0.010, 0.0, abs(d));
  let lit = clamp(0.5 - 0.55 * n.y - 0.2 * n.x, 0.0, 1.0);
  let sheen = smoothstep(0.62, 0.0, uv.y);
  let glint = smoothstep(0.22, 0.0, distance(uv, globals.mouse)) * u.hover;

  col += vec3f(1.0) * rim * (0.10 + 0.30 * lit);
  col += vec3f(1.0) * sweep * 0.10;
  col += vec3f(1.0) * sheen * 0.05 * edge;
  col += vec3f(1.0) * glint * 0.14;

  return vec4f(col, 1.0);
}
`;
