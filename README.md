# Glaze

**Shaders as a reactive, accessible-by-default paint primitive for the web.**

**[▶ Live demo](https://stephenshorton.github.io/glaze/)** — drag the glass card and tune it live. Best in Chrome/Edge or Safari 26+ (WebGPU); falls back to CSS glass elsewhere.

Glaze lets you paint a WGSL shader *behind* any real DOM element — a hero background, a button glow, a nav — while the element's text, links, focus, and accessibility stay 100% real DOM. The GPU is strictly the **paint layer** for elements you opt in; the browser keeps doing everything it's good at (text shaping, IME, selection, find-in-page, SEO, layout, native scrolling).

> `<style>` is CPU paint. `<shader>` is GPU paint.

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

Move the slider and the shader responds — no render loop, no buffer code, no `device.createBuffer`.

## Why this and not "render the whole UI on the GPU"

Painting your entire UI to a canvas (Flutter Web, Figma-style) means opting out of 20 years of browser platform integration *all at once* — text shaping, accessibility (pixels are invisible to screen readers), IME, selection, find-in-page, autofill, links, SEO, native scrolling. Even Figma, Google Docs, and Miro are retreating toward hybrid (Chrome's HTML-in-Canvas).

Glaze takes the disciplined inverse: **keep the DOM authoritative, use the GPU only as opt-in paint.** Text and accessibility aren't "solved" — they're *never removed*, so there's no a11y mirror to drift, no glyph atlas, no reimplemented layout. The hard problems that kill GPU-UI frameworks simply don't exist here.

The one genuinely hard problem — GPU-canvas ↔ DOM scroll/transform sync — is neutralized by using a **per-element canvas that scrolls natively with its element** (a sibling in document flow), never a shared full-screen overlay tracking boxes from a worker (the known-broken pattern that tears on scroll).

## Packages

| Package | What it is |
| --- | --- |
| [`@glaze/core`](packages/core) | Framework-agnostic engine. Per-element WebGPU canvas, WGSL `paint(uv)->vec4f` wrapping, uniform plumbing, built-in `time`/`mouse`/`scroll`/`resolution`/`dpr`, reduced-motion freeze, mandatory fallback. Imperative `createShaderSurface(el, opts)` API. |
| [`@glaze/svelte`](packages/svelte) | The `use:shader` action: bind uniforms directly to Svelte `$state`. |

React/Vue/vanilla bindings are intentionally *not* in v1 — the core is already framework-agnostic, so they're thin additions, not rewrites.

## The shader contract

You write WGSL that defines one entry point:

```wgsl
fn paint(uv: vec2f) -> vec4f { /* uv is 0..1, origin top-left */ }
```

Available inside `paint`:

- **Built-in globals:** `globals.time` (seconds), `globals.mouse` (0..1, within the element), `globals.resolution` (px), `globals.scroll` (0..1 progress through viewport), `globals.dpr`.
- **Your uniforms:** declare `@uniform name: f32;` (or `vec2f`/`vec3f`/`vec4f`) and read as `u.name`. Bind them to state via the `uniforms` option.
- **Prelude helpers:** `glaze_fbm`, `glaze_noise`, `glaze_hash21`, `glaze_hsv2rgb`, `glaze_sd_round_box`, plus `GLAZE_PI` / `GLAZE_TAU`.

What you **never** write: `navigator.gpu`, canvas setup, bind groups, the vertex stage, uniform packing, a render loop, or backend selection.

## Accessible & correct by default

- **Text/links/focus/SEO**: untouched — they're the real DOM element you decorated. The canvas is `aria-hidden` and `pointer-events: none`.
- **`prefers-reduced-motion`**: animation auto-freezes to a single static frame (`posterTime`).
- **Mandatory fallback**: no WebGPU, a shader compile error, or a lost device → your declared `fallback` (`css` gradient / `color` / `image` / `none`). A Glaze surface never leaves a blank hole.
- **Offscreen**: rendering pauses when the element scrolls out of view (`IntersectionObserver`).

## Run the demo

```bash
npm install
npm run build        # build @glaze/core and @glaze/svelte
npm run dev:demo     # open http://localhost:5273
```

The demo is the "killer demo": an aurora hero where you can Ctrl/Cmd+F the headline, select and copy text, run a screen reader, inspect real `<section>`/`<h1>` in DevTools, watch it freeze under reduced-motion, and see it fall back to a CSS gradient with identical layout when WebGPU is absent — all over a live shader.

## v1 scope (honest limits)

**In:** per-element shader paint, reactive uniforms, built-in globals, prelude helpers, reduced-motion, mandatory fallback, WebGPU rendering.

**Deliberately out of v1** (and why):

- **No shared overlay / DOM-into-shader sampling** — depends on Chromium-only HTML-in-Canvas and silently blanks cross-origin content.
- **No multi-pass / compute** (fluid sims, ping-pong, bloom) — a constrained fragment-over-a-quad surface is what keeps it simple and correct.
- **No WebGL2 fallback compiler** — a WGSL→GLSL transpiler is a multi-year subsystem; v1 is WebGPU + a static fallback.
- **No text on the GPU, ever** — text stays DOM. That's the whole point.
- **No routing/SSR/file-format** — Glaze is a library you drop into your existing app, not a metaframework.

This is a proof-of-value v1. If frontend engineers want framework-native, reactive, accessible-by-default shader effects, the framework ambition (and a designer-facing authoring layer) can earn their way in later.

## License

MIT
