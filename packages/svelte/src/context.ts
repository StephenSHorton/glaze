export const GLASS_SCENE_KEY = Symbol("kussetsu-scene");

/** Shared by <GlassScene> to its <GlassPanel> descendants. */
export interface GlassSceneContext {
  /** The scene element whose backdrop was captured. */
  getSceneEl(): HTMLElement | undefined;
  /** The captured backdrop canvas, or null until capture completes. Reactive. */
  readonly backdrop: HTMLCanvasElement | null;
  /** True if capture failed (panels should use the CSS-glass fallback). Reactive. */
  readonly failed: boolean;
}
