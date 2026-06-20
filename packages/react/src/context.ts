import { createContext } from "react";

/** Shared by <GlassScene> with its <GlassPanel> descendants. */
export interface GlassSceneContextValue {
  /** Returns the scene element whose backdrop was captured (stable identity). */
  getSceneEl: () => HTMLElement | null;
  /** The captured backdrop canvas, or null until capture completes. */
  backdrop: HTMLCanvasElement | null;
  /** True if capture failed (panels should use the CSS-glass fallback). */
  failed: boolean;
}

export const GlassSceneContext = createContext<GlassSceneContextValue | null>(null);
