<script lang="ts">
  import { getContext, onDestroy, type Snippet } from "svelte";
  import { createShaderSurface, GLAZE_GLASS, type ShaderSurface, type Uniforms } from "@glaze/core";
  import { GLASS_SCENE_KEY, type GlassSceneContext } from "./context";

  interface Props {
    children: Snippet;
    class?: string;
    /** Corner radius in CSS px. Defaults to the element's computed border-radius. */
    radius?: number;
    /** Frost amount (0 = perfectly clear, see-through glass). */
    blur?: number;
    /** Edge bend strength. */
    refraction?: number;
    /** Chromatic split at the rim. */
    dispersion?: number;
    /** Rim refraction band width. */
    rim?: number;
    /** Glass color (any CSS color). Drives both the tint wash and the solid frost. */
    color?: string;
    /** Tint amount toward `color` (0 = none). */
    tint?: number;
    /** Highlight intensity. */
    specular?: number;
    /** Make the panel draggable. */
    drag?: boolean;
    [key: string]: unknown;
  }

  let {
    children,
    class: className = "",
    radius,
    blur = 0,
    refraction = 0.05,
    dispersion = 0.006,
    rim = 0.05,
    color = "#e6ebf2",
    tint = 0.04,
    specular = 1,
    drag = false,
    ...rest
  }: Props = $props();

  const scene = getContext<GlassSceneContext>(GLASS_SCENE_KEY);

  // Parse any CSS color string to linear-ish 0..1 RGB (re-runs only on change).
  const DEFAULT_RGB: [number, number, number] = [0.902, 0.922, 0.949];
  function parseColor(c: string): [number, number, number] {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return DEFAULT_RGB;
      ctx.fillStyle = c;
      const s = ctx.fillStyle;
      if (s[0] === "#") {
        const n = parseInt(s.slice(1, 7), 16);
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
      }
      const nums = s.match(/[\d.]+/g);
      if (nums && nums.length >= 3) return [+nums[0] / 255, +nums[1] / 255, +nums[2] / 255];
      return DEFAULT_RGB;
    } catch {
      return DEFAULT_RGB;
    }
  }
  let colorRgb = $derived(parseColor(color));

  let panelEl: HTMLDivElement;
  let surface: ShaderSurface | null = null;
  let resolvedRadius = 24;

  // Drag offset (transform). origin/size are recomputed from rects each frame,
  // so dragging keeps the glass glued to the right backdrop pixels for free.
  let x = $state(0);
  let y = $state(0);
  let hover = $state(0);
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let bx = 0;
  let by = 0;

  // Pushed to the shader every frame. Reads the current (reactive) prop values,
  // so binding props to sliders updates the glass live — with zero uniform code
  // on the consumer's side.
  function frameUniforms(): Uniforms | null {
    const sceneEl = scene?.getSceneEl();
    if (!sceneEl || !panelEl) return null;
    const s = sceneEl.getBoundingClientRect();
    const p = panelEl.getBoundingClientRect();
    const w = s.width || 1;
    const h = s.height || 1;
    return {
      origin: [(p.left - s.left) / w, (p.top - s.top) / h],
      size: [p.width / w, p.height / h],
      radius: radius ?? resolvedRadius,
      blur: blur * 0.001,
      refraction,
      dispersion,
      rim,
      color: colorRgb,
      tintAmount: tint,
      specular,
      hover,
    };
  }

  function cssGlassFallback() {
    if (!panelEl) return;
    panelEl.style.backdropFilter = "blur(8px) saturate(150%)";
    (panelEl.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
      "blur(8px) saturate(150%)";
    panelEl.style.background = "rgba(255,255,255,0.10)";
  }

  $effect(() => {
    const backdrop = scene?.backdrop; // reactive dependency
    if (surface || !panelEl) return;
    if (scene?.failed) {
      cssGlassFallback();
      return;
    }
    if (!backdrop) return;

    resolvedRadius = radius ?? (parseFloat(getComputedStyle(panelEl).borderTopLeftRadius) || 24);
    surface = createShaderSurface(panelEl, {
      wgsl: GLAZE_GLASS,
      textures: { backdrop },
      uniforms: {
        origin: [0, 0],
        size: [1, 1],
        radius: resolvedRadius,
        blur: blur * 0.001,
        refraction,
        dispersion,
        rim,
        tint: [1, 1, 1],
        tintAmount: tint,
        specular,
        hover: 0,
      },
      uniformsPerFrame: frameUniforms,
      fallback: { kind: "css", value: "rgba(255,255,255,0.10)" },
    });
  });

  onDestroy(() => surface?.destroy());

  function onpointerdown(e: PointerEvent) {
    if (!drag) return;
    dragging = true;
    hover = 1;
    sx = e.clientX;
    sy = e.clientY;
    bx = x;
    by = y;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onpointermove(e: PointerEvent) {
    if (!dragging) return;
    x = bx + (e.clientX - sx);
    y = by + (e.clientY - sy);
  }
  function onpointerup() {
    dragging = false;
  }
</script>

<div
  bind:this={panelEl}
  class={className}
  data-glaze-panel
  style="position: relative; isolation: isolate; transform: translate({x}px, {y}px); {radius != null ? `border-radius: ${radius}px;` : ''} {drag ? 'cursor: grab; touch-action: none;' : ''}"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointerenter={() => (hover = 1)}
  onpointerleave={() => !dragging && (hover = 0)}
  {...rest}
>
  {@render children()}
</div>
