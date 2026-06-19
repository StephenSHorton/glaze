<script lang="ts">
  import { GlassPanel } from "@glaze/svelte";
  import { glassTheme } from "./theme";

  const theme = glassTheme();

  let {
    value = $bindable(50),
    min = 0,
    max = 100,
  }: { value?: number; min?: number; max?: number } = $props();
</script>

<GlassPanel {...theme()} class="gz-slider" radius={999} color="#b9c4ff">
  <input class="range" type="range" bind:value {min} {max} aria-label="slider" />
</GlassPanel>

<style>
  :global(.gz-slider) {
    display: block;
    overflow: hidden;
    box-sizing: border-box;
    /* Horizontal padding so the thumb can't reach the very edge — matches the
       ~8px vertical inset of the thumb within the track. */
    padding: 0 8px;
  }
  .range {
    -webkit-appearance: none;
    appearance: none;
    display: block;
    width: 100%;
    height: 38px;
    margin: 0;
    background: transparent;
    cursor: pointer;
  }
  .range::-webkit-slider-runnable-track {
    height: 38px;
    background: transparent;
  }
  .range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    margin-top: 8px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
  .range::-moz-range-track {
    height: 38px;
    background: transparent;
  }
  .range::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border: none;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
</style>
