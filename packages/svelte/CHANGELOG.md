# @kussetsu/svelte

## 0.1.0

### Minor Changes

- First public release of Kussetsu (屈折, "refraction") — reactive WGSL-glass UI as a paint primitive behind real DOM.

  - `@kussetsu/core`: framework-agnostic engine — per-element WebGPU surface, captured backdrop, reactive uniforms, `@texture` support, the `KUSSETSU_GLASS` shader (refraction / frost / bgBlur / dispersion / specular), and a mandatory CSS fallback.
  - `@kussetsu/svelte`: `<GlassScene>` / `<GlassPanel>` components and a `use:shader` action.
  - `@kussetsu/react`: `<GlassScene>` / `<GlassPanel>` components and a `useShader` hook.

### Patch Changes

- Updated dependencies
  - @kussetsu/core@0.1.0
