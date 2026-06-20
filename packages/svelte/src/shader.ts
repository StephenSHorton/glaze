import { createShaderSurface, type ShaderOptions, type Uniforms } from "@kussetsu/core";
import type { Action } from "svelte/action";

export type ShaderActionOptions = ShaderOptions;

/**
 * Svelte action: paint a reactive WGSL shader behind an element.
 *
 * ```svelte
 * <script>
 *   import { shader } from "@kussetsu/svelte";
 *   let intensity = $state(0.4);
 *   const wgsl = `
 *     @uniform intensity: f32;
 *     fn paint(uv: vec2f) -> vec4f {
 *       return vec4f(vec3f(kussetsu_fbm(uv * 4.0 + globals.time * 0.1)) * u.intensity, 1.0);
 *     }`;
 * </script>
 *
 * <section use:shader={{ wgsl, uniforms: { intensity }, fallback: { kind: "css", value: "#101426" } }}>
 *   <h1>Real, selectable, accessible text on top of a live shader.</h1>
 * </section>
 * ```
 *
 * When the `uniforms` object changes (because it references reactive state),
 * the action diffs and pushes the new values to the GPU. If `wgsl` itself
 * changes, the surface is recreated (useful for hot-swapping / HMR).
 */
export const shader: Action<HTMLElement, ShaderActionOptions> = (node, options) => {
  let current = options;
  let surface = createShaderSurface(node, current);

  return {
    update(next: ShaderActionOptions) {
      if (next.wgsl !== current.wgsl) {
        surface.destroy();
        surface = createShaderSurface(node, next);
        current = next;
        return;
      }
      current = next;
      if (next.uniforms) surface.setUniforms(next.uniforms as Uniforms);
    },
    destroy() {
      surface.destroy();
    },
  };
};
