<script lang="ts">
  import { GlassPanel } from "@kussetsu/svelte";
  import { glassTheme } from "./theme";

  const theme = glassTheme();

  let { checked = $bindable(false), label }: { checked?: boolean; label?: string } = $props();
</script>

<label class="row">
  {#if label}<span class="label">{label}</span>{/if}
  <GlassPanel
    {...theme()}
    class="gz-toggle"
    radius={999}
    color={checked ? "#8fffc4" : "#e6ebf2"}
    tint={checked ? 0.22 : 0.05}
  >
    <button
      class="track"
      role="switch"
      aria-checked={checked}
      aria-label={label ?? "toggle"}
      type="button"
      onclick={() => (checked = !checked)}
    >
      <span class="knob" class:on={checked}></span>
    </button>
  </GlassPanel>
</label>

<style>
  .row {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    cursor: pointer;
  }
  .label {
    font-size: 0.92rem;
    color: #eef0fb;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
  }
  :global(.gz-toggle) {
    display: inline-flex;
    overflow: hidden;
  }
  .track {
    all: unset;
    box-sizing: border-box;
    display: block;
    width: 52px;
    height: 30px;
    cursor: pointer;
  }
  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    transition: transform 0.18s cubic-bezier(0.3, 1.4, 0.5, 1);
  }
  .knob.on {
    transform: translateX(22px);
  }
</style>
