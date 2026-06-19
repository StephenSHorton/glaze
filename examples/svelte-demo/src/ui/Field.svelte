<script lang="ts">
  import { GlassPanel } from "@glaze/svelte";
  import { glassTheme } from "./theme";

  const theme = glassTheme();

  let {
    value = $bindable(""),
    label,
    placeholder = "",
  }: { value?: string; label?: string; placeholder?: string } = $props();
</script>

<label class="field">
  {#if label}<span class="label">{label}</span>{/if}
  <GlassPanel {...theme()} class="gz-field">
    <input class="input" type="text" bind:value {placeholder} />
  </GlassPanel>
</label>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #c9cde0;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
  }
  :global(.gz-field) {
    display: block;
    overflow: hidden;
  }
  .input {
    all: unset;
    box-sizing: border-box;
    display: block;
    width: 100%;
    padding: 0.7rem 0.95rem;
    font: inherit;
    font-size: 0.92rem;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
  }
  .input::placeholder {
    color: rgba(255, 255, 255, 0.55);
  }
</style>
