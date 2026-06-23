# kussetsu v0.2.0

**"React Three Fiber for 2D UI" just got real.** v0.1.0 proved you could paint a React tree on the GPU. v0.2.0 is the first big DX pass that makes it something you can actually build an app in: a declarative `<GpuCanvas>` you drop in like any component, a typed `<View>` / `<Text>` authoring API, R3F-style hooks (`useFrame` / `useViewport` / `useGpuRoot`), percentage layout, real borders, a hardened device-loss/resize runtime, and — finally — a way to *see* what the renderer is doing through an otherwise-opaque canvas.

This is a **backward-compatible minor release. No breaking changes.** The lowercase `<view>` / `<text>` host elements still work as an untyped escape hatch, and zero-arg `onActivate` handlers stay assignable — your v0.1.0 code compiles and runs unchanged.

## Highlights

- **Declarative `<GpuCanvas>` mount** that owns the canvas, runs in an effect, tears down StrictMode-safe, and renders a `fallback` when WebGPU is missing or the device is lost.
- **Typed `<View>` / `<Text>` authoring API** — full type-checking and autocomplete at zero runtime cost, sidestepping the `@types/react` SVG `view` / `text` intrinsic collision ([#2](https://github.com/StephenSHorton/kussetsu/issues/2)).
- **R3F-style hooks** — `useFrame((dt) => …)`, `useViewport()`, and `useGpuRoot()`, proving React context propagates across the custom reconciler.
- **Real layout** — percentage / proportional sizing, per-side padding + `rowGap` / `columnGap`, distributed `justify` values, and a `border` / `borderColor` stroke primitive.
- **Runtime robustness** — `onDeviceLost` / `onError`, automatic `ResizeObserver` repaints, root-scoped `setGlassOverride`, a `{ debug: true }` perf overlay, and imperative camera / hit-test escapes.
- **`useSpring` over colors and vectors** — spring an RGBA or an `(x, y)` in one hook; the scalar form is unchanged.

## Added

### Authoring & React surface

- **`<GpuCanvas>` — declarative mount.** Owns the canvas and a `position: relative` wrapper, creates the `GpuRoot` in an effect, re-renders children on updates, and tears down on unmount behind a StrictMode-safe gate. Shows `fallback` when WebGPU is absent or the device is lost. `createGpuRoot` remains the lower-level escape hatch.
  - Extends `GpuRootOptions`, so the full options surface — `camera`, `pageScroll`, `textSelectable`, `background`, `debug`, `onDeviceLost`, `onError` — is available as props; changing those props tears down and recreates the root.
  - `onCreated?: (root: GpuRoot) => void` fires once after the root is created, handing you the imperative escape hatch.
  - The wrapper `<div>` accepts `className` and a `style` that merges over the default position/size.
- **Typed `<View>` / `<Text>` components** — the recommended authoring API. At runtime they're still the strings `"view"` / `"text"` (so they compile to the exact same GPU host elements the reconciler builds — zero runtime cost), but they're typed as `FC<NodeProps>` for full type-checking and autocomplete.
- **JSX-vs-React-SVG-intrinsic collision fix ([#2](https://github.com/StephenSHorton/kussetsu/issues/2)).** The capitalised `<View>` / `<Text>` bypass `JSX.IntrinsicElements` entirely, sidestepping `@types/react`'s SVG `view` / `text` intrinsics whose `style: CSSProperties` collided with Kussetsu's `style: Style` — so `background: rgba(...)` and friends now type-check. (For transparency: the collision is sidestepped for the recommended API, not eliminated at the intrinsic level — the lowercase escape-hatch intrinsics still lean on internal `@ts-expect-error` SVG overrides, as the components' header comment states.)
- **`<View>` / `<Text>` `children` are typed `React.ReactNode`** (was `unknown`), on both the components and the lowercase intrinsics, so JSX children type-check instead of being opaque.

### Hooks & animation

- **`useFrame((dt) => …)`** — a per-frame callback (`dt` = clamped seconds since the last frame) registered through the context bridge. The render loop repaints every frame while any `useFrame` is mounted, driving animation.
  - `dt` is clamped (`Math.min(0.1, …)`, seeded at `1/60` on the first tick) so a backgrounded or sleep/wake tab can't deliver a multi-second delta that teleports a `pos += vel * dt` animation.
  - Callbacks fire exactly once per `requestAnimationFrame` tick via a dedicated tick path (**not** inside `renderFrame`), so the low-frequency fallback timer never double-ticks them or drives them with a bad `dt`.
- **`useViewport()`** — returns the canvas CSS size `{ width, height }` and re-renders the component on resize, fed by both the `window` `resize` event and the canvas `ResizeObserver`.
- **`useGpuRoot()`** — returns the tree's imperative `GpuControls` (`GpuRoot` minus `render` / `destroy`), so components can call `setCamera` / `hitTest` / `setGlassOverride` / etc. from inside the tree.
- **React context bridge across the custom reconciler.** `runtime.render` now wraps the rendered tree in `<KussetsuContext.Provider>`, and the hooks read it via `useContext` — proving React context propagates through the custom reconciler, the same property react-three-fiber relies on. Calling `useFrame` / `useViewport` / `useGpuRoot` outside a Kussetsu tree throws a clear, descriptive error.
- **`useSpring` vector / RGBA overload.** A new `useSpring<T extends readonly number[]>(target: T)` overload springs each component independently under one shared config and returns a same-shape tuple (RGBA in → RGBA out): `useSpring(rgba("#5C5CFF"))`. It re-seeds its value/velocity arrays when the target's length changes between renders and re-kicks when any component changes. The scalar `number → number` form keeps its identical signature, physics, and exact settle.

### Layout & style

- **Percentage / proportional sizing.** `width` / `height` / `minWidth` / `maxWidth` / `minHeight` / `maxHeight` and a new flex-`basis` now accept a `"NN%"` string (percentage of parent) in addition to px, wired to Yoga's percent setters. `width: "stretch"` (cross-axis fill) is preserved, and a `Size` type is exported.
- **Per-side padding + gap axes.** `paddingX` / `paddingY` / `paddingTop` / `paddingRight` / `paddingBottom` / `paddingLeft`, plus `rowGap` / `columnGap`, applied via Yoga Edge/Gutter specificity so the more specific value wins (e.g. `padding` + `paddingTop`).
- **Distributed `justify`.** `justify` now also accepts `"space-between"`, `"space-around"`, and `"space-evenly"`, mapped to Yoga's `SpaceBetween` / `SpaceAround` / `SpaceEvenly`.
- **`border` / `borderColor` stroke primitive.** A hairline/outline stroke on the box edge that follows the `radius` / `cornerSmoothing` corners, works with or without a `background`, defaults to a faint white hairline when no color is set, floors sub-pixel widths to a crisp ~1px line, and is packed as `unorm8x4` into the rect pipeline's spare instance slot (no extra draw call, no stride growth). A glass/material node's own box ignores the stroke, but plain children inside a glass subtree still get their border painted.

### Runtime & robustness

- **`onDeviceLost` / `onError` options** (on `createGpuRoot` and `<GpuCanvas>`). On WebGPU device loss a `stopped` flag halts both the rAF and the `setTimeout` fallback loops (and guards `renderFrame` / `frame`), `onDeviceLost` fires with `{ reason, message }` (skipping the self-teardown `"destroyed"` reason), and `<GpuCanvas>` flips to its `fallback`. `onError` forwards uncaptured GPU errors advisorily while the loop continues. (Note: stopping a dead loop is what prevents the per-frame console flood; device loss and uncaptured errors still each log once, so `onError` is additive notification, not log suppression.)
- **Automatic resize via `ResizeObserver`.** An observer on the canvas marks the scene dirty on any element-level box-size change (resizable panels, collapsing sidebars), repainting where only the `window` `resize` listener fired before. Both the observer and the window listener are wired and both torn down on destroy; the observer is guarded with a `typeof` check so it no-ops where `ResizeObserver` is absent.
- **`root.setGlassOverride(params | null)`** (also `useGpuRoot().setGlassOverride`). A root-scoped glass override: a partial `GlassParams` merged over `GLASS_DEFAULTS` (with `tintColor` defensively cloned, never aliased to the shared default), or `null` to clear. Resolved per-root in `renderFrame` as `glassOverride ?? (glassTuning.enabled ? glassTuning.params : null)`, so the root override wins and the process-wide `glassTuning` global is only the fallback. It repaints on change.
- **`{ debug: true }` perf overlay.** An opt-in, absolutely-positioned DOM readout appended to the canvas's parent and updated ~2×/sec, showing **fps**, **mean frame-ms**, and **per-frame draw counts** (rect / glass / material / particle). fps is computed from real elapsed time so it stays correct under timer throttling. Created only when `debug` is set and removed on destroy — handy because a single opaque canvas otherwise hides DevTools' element and perf panels.
- **Imperative `GpuRoot` escapes.** `getCamera()` (returns a fresh copy — mutate it and nothing happens; go through `setCamera`), `setCamera({ tx?, ty?, scale? })` (partial, repaints), `resetCamera()` (identity transform), `hitTest(x, y)` (deepest contained node id at a canvas-relative point, accounting for camera + per-region scroll, else `null`), `resize()` (marks dirty so the next `renderFrame` re-reads `painter.size()` — a lazy re-measure), and `getCanvas()`. All are also reachable from components via `useGpuRoot()` as `GpuControls`.

### Events, helpers & types

- **Hover events.** New optional `onPointerEnter` / `onPointerLeave` on `NodeProps`; either one makes the node interactive and wires `pointerenter` / `pointerleave` on its invisible DOM proxy — so you build hover and highlight in plain React, no shader required.
- **Richer activation.** `onActivate` now receives an `ActivateEvent` (`button` + `altKey` / `ctrlKey` / `metaKey` / `shiftKey`), built from both click and keyboard Enter/Space — so cmd-click and modifier handling are plain React. Zero-arg handlers stay assignable, so it's non-breaking.
- **`rgba(hexOrCss, alpha?)` helper.** Converts a hex / `rgb()` / named color into a `0..1` straight-alpha `RGBA` tuple; an optional `alpha` overrides the parsed value. Throws on unparseable input. Scope is intentionally tight: the named-color set is small (`black`, `white`, `transparent`, `red`, `green`, `blue`, `gray` / `grey`, `slate` — names like `orange` throw), and `var(--x)`, `currentColor`, `hsl()`, and `color-mix()` are not resolved (they throw).
- **`MaterialSpec` / shader JSDoc.** `MaterialSpec` now carries full JSDoc for the `fn material` signature, the in-scope `u` helpers, and the `uniforms → u.c0..u.c3` lane mapping — all shown on hover.
- **Shader-compile error feedback.** A `material` shader that fails to compile logs a console error with the line remapped back to **your** author source, and the bad shader is flagged so it never blanks the frame (skipped in prod, magenta fill in dev). (Detection is async, so the very first frame may draw the invalid pipeline before recovery; non-compile pipeline-creation failures are not covered.)
- **`>16` uniforms warning.** Passing more than 16 material uniform floats logs a one-time dev warning per shader; only the first 16 (`u.c0..u.c3`) upload, the rest are ignored.
- **`PostProcess` type exported** (the `"bloom"` literal), defined in `scene.ts` and re-exported from the package root.
- **`ParticleSpec` re-export** from the package root, so consumers can `import { ParticleSpec } from "kussetsu"`.
- **Dev-mode footgun warnings.** At mount, in non-production, the runtime warns once if the canvas has ~0 CSS size and once if its parent computes to `position: static` (which misaligns the accessibility/input overlay).

### Tooling & docs

- **`test:types` CI fixture (`test/types/`).** A committed `consumer.tsx` is type-checked via `npm run test:types` (build the lib, then `tsc --noEmit` against the built package) with positive shapes plus `@ts-expect-error` negative guards. It runs in CI on push to `main` and on every pull request, and covers far more than `View` / `Text` typings — `rgba`, the `useSpring` overloads, the hooks, `GpuCanvas` / `createGpuRoot` options, `Size` / percent, `ActivateEvent`, and `postProcess`.
- **README / `package.json` refresh.** The README now documents `onActivate(e)` / hover, `rgba()`, particles, `postProcess: "bloom"`, the 16-float uniforms cap, and the full layout/sizing/border surface (per-side padding, `rowGap` / `columnGap`, percentage `Size`, `stretch`, `border` / `borderColor`). `package.json` gains an R3F-anchored description, expanded keywords, `engines` (node `>= 18`), and a `bugs` URL.
- **Tailwind / CSS compat diagnostics.** The compat layer still doesn't auto-map `border` (use the native fields), but it now ships explicit, user-facing error messages for `border` / `border-*` / `border-width` / `border-color` / `border-style` / `outline` that point you to the native `border` + `borderColor` fields instead of silently dropping the value.

## Changed

- **Authoring API is now `<View>` / `<Text>`** (capitalised). The lowercase `<view>` / `<text>` host elements remain declared in `JSX.IntrinsicElements` and are still consumed by the reconciler's `createInstance("view" | "text")`, so they keep working at runtime as an untyped escape hatch — fully backward compatible.
- **`onActivate` signature widened** `() => void` → `(e: ActivateEvent) => void`. Additive: zero-arg handlers stay assignable.
- **`glassTuning` global redocumented.** Behavior is unchanged, but its header comment now flags it as a process-wide mutable global that overrides every mounted root, mutates outside React (no auto-repaint), and persists across tests — steering callers toward the root-scoped `setGlassOverride`. The global still works as a dev convenience / fallback.

## Upgrade

This is a drop-in minor — **no code changes required**.

```sh
npm i kussetsu@latest
```

- The lowercase `<view>` / `<text>` host elements still work (now as an untyped escape hatch). Migrate to `<View>` / `<Text>` when you want type-checking, but nothing forces you to.
- Zero-arg `onActivate={() => …}` handlers still type-check and run; the `ActivateEvent` argument is purely additive.
- `createGpuRoot`, the `glassTuning` global, and every 0.1.0 primitive (glass / material / particles / postProcess, the scalar `useSpring`) are unchanged.

## Known limitations / deferred

- **No `box-shadow`** — needs a dedicated shadow pass; future work.
- **No group `opacity`** — needs offscreen subtree compositing; deferred.
- **No automatic CSS/Tailwind `border` mapping** — use the native `border` + `borderColor` fields. The compat layer now emits explicit errors pointing you there instead of silently dropping the value.
- **`rgba()` is intentionally narrow** — only a small named-color set (`black` / `white` / `transparent` / `red` / `green` / `blue` / `gray` / `slate`) plus hex and `rgb()`; `var(--x)`, `currentColor`, `hsl()`, `color-mix()`, and unlisted names throw rather than resolve.

## Install

```sh
npm i kussetsu@0.2.0
```
