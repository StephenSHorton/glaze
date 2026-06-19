# @glaze/svelte

Svelte binding for [Glaze](https://github.com/StephenSHorton/glaze) — a `use:shader` action that paints a reactive WGSL shader behind any element, with uniforms bound straight to component state.

```svelte
<script>
  import { shader } from "@glaze/svelte";
  let intensity = $state(0.6);
</script>

<section
  use:shader={{
    wgsl: `
      @uniform intensity: f32;
      fn paint(uv: vec2f) -> vec4f {
        let n = glaze_fbm(uv * 4.0 + globals.time * 0.1);
        return vec4f(vec3f(0.3, 0.5, 0.9) * n * u.intensity, 1.0);
      }`,
    uniforms: { intensity },
    fallback: { kind: "css", value: "#101426" },
  }}
>
  <h1>Real, selectable, accessible text over a live shader.</h1>
</section>

<input type="range" min="0" max="1" step="0.01" bind:value={intensity} />
```

When the `uniforms` object changes (because it references reactive `$state`), the action pushes new values to the GPU. When `wgsl` changes, the surface is recreated (handy for HMR).

Requires `svelte@^5` (peer dependency). Wraps [`@glaze/core`](https://www.npmjs.com/package/@glaze/core); see the root README for the design rationale and the shader contract.

MIT
