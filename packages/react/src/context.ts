import { createContext } from "react";

/** Shared by <GlassScene> with its <GlassPanel> descendants. */
export interface GlassSceneContextValue {
  /** Returns the scene element whose backdrop was captured (stable identity). */
  getSceneEl: () => HTMLElement | null;
  /** The captured backdrop canvas, or null until capture completes. */
  backdrop: HTMLCanvasElement | null;
  /** True if capture failed (panels should use the CSS-glass fallback). */
  failed: boolean;
  /**
   * Current backdrop-sample offset in scene UV, read per-frame by each panel.
   * Non-zero only when the scene drives a parallax drift; the scene translates
   * the visible backdrop by the matching amount so the glass stays seam-free.
   */
  getParallax?: () => readonly [number, number];
}

export const GlassSceneContext = createContext<GlassSceneContextValue | null>(null);
