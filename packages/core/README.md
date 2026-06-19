# @glaze/core

Framework-agnostic engine for [Glaze](https://github.com/StephenSHorton/glaze) — paint a WGSL shader behind a real DOM element via a per-element WebGPU canvas, with reactive uniforms, accessible-by-default behavior, and a mandatory fallback.

```ts
import { createShaderSurface } from "@glaze/core";

const surface = createShaderSurface(document.querySelector("section.hero")!, {
  wgsl: `
    @uniform intensity: f32;
    fn paint(uv: vec2f) -> vec4f {
      let n = glaze_fbm(uv * 4.0 + globals.time * 0.1);
      return vec4f(vec3f(0.3, 0.5, 0.9) * n * u.intensity, 1.0);
    }`,
  uniforms: { intensity: 0.6 },
  fallback: { kind: "css", value: "#101426" },
});

// later — reactive update, no render-loop code:
surface.setUniforms({ intensity: 0.2 });

// teardown:
surface.destroy();
```

## API

- `createShaderSurface(target: HTMLElement, options: ShaderOptions): ShaderSurface`
- `ShaderSurface`: `{ setUniforms(u), pause(), resume(), destroy(), active }`
- Also exported: `hasWebGPU()`, `getGpuContext()`, `assembleShader()`, `computeLayout()`, `GLAZE_PRELUDE`.

### The shader contract

Define `fn paint(uv: vec2f) -> vec4f` (uv is `0..1`, origin top-left). Built-in globals: `globals.time`, `globals.mouse`, `globals.resolution`, `globals.scroll`, `globals.dpr`. Declare custom uniforms with `@uniform name: f32 | vec2f | vec3f | vec4f;` and read as `u.name`.

See the [root README](https://github.com/StephenSHorton/glaze) for the full design rationale and v1 scope.

MIT
