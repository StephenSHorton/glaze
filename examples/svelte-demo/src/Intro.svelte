<script lang="ts">
  import { shader } from "@glaze/svelte";
  import { AURORA, RIPPLE } from "./shaders";

  // Reactive shader inputs — these are ordinary Svelte state.
  let intensity = $state(0.6);
  let warm = $state(true);
  let hover = $state(0);

  const tint: [number, number, number] = [0.85, 0.42, 0.95];
  const accent: [number, number, number] = [0.35, 0.7, 1.0];

  let active = $state<boolean | null>(null);
</script>

<div class="wrap">
  <!-- The hero is a real <section>. The aurora paints behind it on a
       per-element canvas; the heading, paragraph and link below are real,
       selectable, focusable, crawlable DOM sitting on top. -->
  <section
    class="hero"
    use:shader={{
      wgsl: AURORA,
      uniforms: { intensity, warm: warm ? 1 : 0, tint },
      fallback: { kind: "css", value: "linear-gradient(160deg, #0b1020, #241a3a)" },
      onReady: () => (active = true),
      onFallback: () => (active = false),
    }}
  >
    <p class="eyebrow">Glaze</p>
    <h1>Shaders that pass the screen-reader test.</h1>
    <p class="lede">
      This headline is real text on top of a live WGSL shader. You can select it,
      copy it, find it with Ctrl/Cmd+F, and a screen reader will read it — because
      the GPU only paints the <em>background</em>. The DOM still owns everything else.
    </p>
    <a class="cta" href="#start">Get started</a>
  </section>

  <section class="panel">
    <h2>Reactive uniforms</h2>
    <p>These controls write straight into the shader's uniforms — no render loop, no buffer code.</p>

    <label>
      Intensity: {intensity.toFixed(2)}
      <input type="range" min="0" max="1" step="0.01" bind:value={intensity} />
    </label>

    <label class="checkbox">
      <input type="checkbox" bind:checked={warm} />
      Warm palette
    </label>

    <button
      class="ripple"
      use:shader={{
        wgsl: RIPPLE,
        uniforms: { hover, accent },
        fallback: { kind: "color", value: "#161a2c" },
      }}
      onpointerenter={() => (hover = 1)}
      onpointerleave={() => (hover = 0)}
    >
      Hover me — the ripple is a shader bound to <code>hover</code>
    </button>

    <p class="status">
      GPU surface:
      {#if active === null}<span>initializing…</span>
      {:else if active}<span class="ok">live (WebGPU)</span>
      {:else}<span class="warn">fell back (no WebGPU) — still fully legible</span>{/if}
    </p>
  </section>

  <section class="panel">
    <h2>Try the things every other GPU-UI demo quietly breaks</h2>
    <ol>
      <li><strong>Find-in-page:</strong> press Ctrl/Cmd+F and search “Get started”. It highlights inside the shimmer.</li>
      <li><strong>Selection:</strong> triple-click the headline and drag — native text selection over a live shader.</li>
      <li><strong>Screen reader:</strong> turn on VoiceOver/NVDA — the heading, paragraph and link read in order. Zero a11y-mirror code.</li>
      <li><strong>DevTools:</strong> inspect the hero — it’s real <code>&lt;section&gt;</code>/<code>&lt;h1&gt;</code>, not pixels.</li>
      <li><strong>Reduced motion:</strong> enable “Reduce motion” in your OS — the aurora freezes to a static frame automatically.</li>
      <li><strong>No WebGPU:</strong> open in a browser without WebGPU — the hero falls back to a CSS gradient; layout and text are identical.</li>
    </ol>
  </section>
</div>

<style>
  .wrap {
    max-width: 820px;
    margin: 0 auto;
    padding: 1rem 1.25rem 6rem;
  }

  .hero {
    min-height: 60vh;
    border-radius: 20px;
    padding: clamp(2rem, 6vw, 4.5rem);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 1rem;
    overflow: hidden;
  }

  .eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    font-size: 0.78rem;
    font-weight: 600;
    opacity: 0.8;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 6vw, 3.4rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .lede {
    margin: 0;
    max-width: 46ch;
    font-size: 1.05rem;
    color: #eef0fb;
  }

  .cta {
    align-self: flex-start;
    margin-top: 0.5rem;
    background: #ffffff;
    color: #0b1020;
    text-decoration: none;
    font-weight: 600;
    padding: 0.7rem 1.3rem;
    border-radius: 999px;
  }

  .panel {
    margin-top: 2.5rem;
    padding: 1.5rem;
    border: 1px solid #1d2236;
    border-radius: 16px;
    background: #0a0d18;
  }

  .panel h2 {
    margin-top: 0;
    font-size: 1.25rem;
  }

  label {
    display: block;
    margin: 1rem 0 0.25rem;
    font-weight: 500;
  }

  label.checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input[type="range"] {
    width: 100%;
    margin-top: 0.4rem;
  }

  .ripple {
    margin-top: 1.5rem;
    position: relative;
    border: 1px solid #2a3050;
    border-radius: 12px;
    color: #eef0fb;
    background: transparent;
    padding: 1rem 1.25rem;
    font: inherit;
    cursor: pointer;
    overflow: hidden;
  }

  .ripple code,
  .panel code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.05em 0.35em;
    border-radius: 5px;
    font-size: 0.9em;
  }

  .status {
    margin-top: 1.25rem;
    font-size: 0.95rem;
  }
  .status .ok {
    color: #6ee7a8;
    font-weight: 600;
  }
  .status .warn {
    color: #f5c451;
    font-weight: 600;
  }

  ol {
    margin: 0;
    padding-left: 1.25rem;
  }
  ol li {
    margin: 0.5rem 0;
  }
</style>
