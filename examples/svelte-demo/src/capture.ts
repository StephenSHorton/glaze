/**
 * Rasterize text into a transparent <canvas> so it can be uploaded as a GPU
 * texture and refracted by the glass shader.
 *
 * Why Canvas 2D and not an SVG <foreignObject> snapshot of the real DOM node?
 * Browsers TAINT any image produced from <foreignObject> (it could embed
 * cross-origin content), and a tainted source is rejected by
 * `copyExternalImageToTexture` — so the polyfill route can't reach the GPU.
 * A 2D canvas we draw ourselves is same-origin and untainted. The production
 * path for capturing arbitrary live DOM is the native HTML-in-Canvas API
 * (`copyElementImageToTexture`), which is designed to avoid this taint but is
 * still Chromium-only / behind a flag in mid-2026.
 */
export function renderHeadline(
  text: string,
  width: number,
  height: number,
  fontSize = 44,
): HTMLCanvasElement {
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, w / 2, h / 2);

  return canvas;
}
