import { getContext } from "svelte";

export const GLASS_THEME_KEY = Symbol("kussetsu-glass-theme");

/**
 * Shared glass props from the control panel. Components spread these, then
 * override the few that define their identity (a badge's color, a pill's
 * radius), honoring the rest.
 */
export interface GlassThemeProps {
  color: string;
  radius: number;
  blur: number;
  bgBlur: number;
  refraction: number;
  dispersion: number;
  rim: number;
  tint: number;
  specular: number;
}

export type GlassThemeFn = () => Partial<GlassThemeProps>;

/**
 * Read the shared glass theme. Returns a function giving the current material
 * props — spread it into a <GlassPanel>. Falls back to `{}` (panel defaults)
 * when there's no theme provider.
 */
export function glassTheme(): GlassThemeFn {
  return getContext<GlassThemeFn>(GLASS_THEME_KEY) ?? (() => ({}));
}
