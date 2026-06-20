import { useEffect, useRef } from "react";
import { createShaderSurface, type ShaderOptions, type ShaderSurface, type Uniforms } from "@kussetsu/core";

export type UseShaderOptions = ShaderOptions;

/**
 * Paint a reactive WGSL shader behind an element. Returns a ref to attach:
 *
 * ```tsx
 * const ref = useShader<HTMLElement>({
 *   wgsl,
 *   uniforms: { intensity },
 *   fallback: { kind: "css", value: "#101426" },
 * });
 * return <section ref={ref}><h1>Real text over a live shader.</h1></section>;
 * ```
 *
 * The surface is recreated only when `wgsl` changes; uniform changes are diffed
 * and pushed to the GPU on every render.
 */
export function useShader<T extends HTMLElement = HTMLElement>(options: UseShaderOptions) {
  const ref = useRef<T | null>(null);
  const surfaceRef = useRef<ShaderSurface | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const surface = createShaderSurface(el, optionsRef.current);
    surfaceRef.current = surface;
    return () => {
      surface.destroy();
      surfaceRef.current = null;
    };
    // Recreate only when the shader source itself changes (HMR / hot-swap).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.wgsl]);

  useEffect(() => {
    if (surfaceRef.current && options.uniforms) {
      surfaceRef.current.setUniforms(options.uniforms as Uniforms);
    }
  });

  return ref;
}
