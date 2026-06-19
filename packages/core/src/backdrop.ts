/**
 * Capture a scene's backdrop subtree into an untainted canvas that can be
 * uploaded as a GPU texture and refracted by the glass shader.
 *
 * Tiers:
 * - NATIVE (future): the Chromium HTML-in-Canvas API
 *   (`GPUQueue.copyElementImageToTexture`) captures a live DOM subtree straight
 *   into a GPU texture, untainted by design. Origin-trial-only in 2026, so not
 *   the default yet — `supportsNativeCapture()` probes for it.
 * - HTML2CANVAS (default today): rasterizes the subtree to an untainted 2D
 *   canvas in pure JS. Works cross-browser; approximate fidelity. Same-origin
 *   images only (cross-origin taints).
 *
 * The SVG <foreignObject> route is deliberately NOT used: it taints the result,
 * and `copyExternalImageToTexture` rejects tainted sources with a SecurityError.
 */

export interface CaptureResult {
  /** An untainted canvas; pass straight into a surface's `textures`. */
  readonly source: HTMLCanvasElement;
  readonly quality: "native" | "approx";
}

export interface CaptureOptions {
  /** Device-pixel-ratio cap for the snapshot. Default 2. */
  readonly maxDpr?: number;
  /**
   * Return true to EXCLUDE an element from the snapshot. Defaults to excluding
   * the glass panels themselves (`[data-glaze-panel]`, so the scene can't
   * photograph its own glass) and anything marked `[data-glaze-no-capture]`
   * (crisp UI — labels, headings — that should sit on top of the glass rather
   * than be refracted by it).
   */
  readonly exclude?: (el: Element) => boolean;
  /** Background fill; null = transparent (default). */
  readonly backgroundColor?: string | null;
}

/** True if the native HTML-in-Canvas capture path is available. */
export function supportsNativeCapture(): boolean {
  return (
    typeof GPUQueue !== "undefined" &&
    "copyElementImageToTexture" in (GPUQueue.prototype as object)
  );
}

const defaultExclude = (el: Element): boolean =>
  el instanceof HTMLElement &&
  (el.hasAttribute("data-glaze-panel") || el.hasAttribute("data-glaze-no-capture"));

export async function captureBackdrop(
  sceneEl: HTMLElement,
  opts: CaptureOptions = {},
): Promise<CaptureResult> {
  // Wait for web fonts so text rasterizes with the right glyphs.
  const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
  if (fonts?.ready) {
    try {
      await fonts.ready;
    } catch {
      /* ignore */
    }
  }

  const dpr = Math.min(opts.maxDpr ?? 2, globalThis.devicePixelRatio || 1);
  const exclude = opts.exclude ?? defaultExclude;

  const mod = (await import("html2canvas")) as {
    default: (el: HTMLElement, o?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  };
  const html2canvas = mod.default;

  const source = await html2canvas(sceneEl, {
    backgroundColor: opts.backgroundColor ?? null,
    scale: dpr,
    logging: false,
    useCORS: true,
    ignoreElements: (el: Element) => exclude(el),
  });

  return { source, quality: "approx" };
}
