<script lang="ts">
  /** A single labelled slider. */
  export interface Control {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
  }

  let {
    title = "Glass",
    note,
    controls,
    values = $bindable(),
    color = $bindable(),
    onReset,
  }: {
    title?: string;
    /** Optional caption under the title (e.g. "Drives every component →"). */
    note?: string;
    controls: Control[];
    /** The reactive values object the sliders read/write (one key per control). */
    values: Record<string, number>;
    /** Optional bindable color; the swatch is hidden when omitted. */
    color?: string;
    onReset: () => void;
  } = $props();
</script>

<aside class="controls">
  <div class="controls-head">
    <strong>{title}</strong>
    <button onclick={onReset}>Reset</button>
  </div>
  {#if note}<p class="controls-note">{note}</p>{/if}

  {#if color !== undefined}
    <label class="color-row">
      <span>Color<b>{color}</b></span>
      <input type="color" bind:value={color} />
    </label>
  {/if}

  {#each controls as c}
    <label>
      <span>{c.label}<b>{values[c.key]}</b></span>
      <input type="range" min={c.min} max={c.max} step={c.step} bind:value={values[c.key]} />
    </label>
  {/each}
</aside>

<style>
  /* Sticky within its section's rail, so each section's panel stays in view
     while you scroll that section and never overlaps the next one's. */
  .controls {
    position: sticky;
    top: 64px;
    box-sizing: border-box;
    width: 220px;
    padding: 0.9rem 1rem 1.1rem;
    background: rgba(10, 13, 24, 0.92);
    border: 1px solid #1d2236;
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
    pointer-events: auto;
    z-index: 20;
    font-size: 0.82rem;
  }
  .controls-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .controls-head button {
    background: #161b2e;
    color: #c9cde0;
    border: 1px solid #2a3050;
    border-radius: 8px;
    padding: 0.2rem 0.6rem;
    font: inherit;
    cursor: pointer;
  }
  .controls-note {
    margin: 0.3rem 0 0.2rem;
    color: #8b90a8;
    font-size: 0.72rem;
  }
  .controls label {
    display: block;
    margin-top: 0.7rem;
  }
  .controls label span {
    display: flex;
    justify-content: space-between;
    color: #c9cde0;
    margin-bottom: 0.2rem;
  }
  .controls label b {
    color: #fff;
    font-variant-numeric: tabular-nums;
  }
  .controls input[type="range"] {
    width: 100%;
  }
  .color-row input[type="color"] {
    width: 100%;
    height: 28px;
    padding: 0;
    border: 1px solid #2a3050;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
  }
</style>
