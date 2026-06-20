<script lang="ts">
  import { GlassPanel } from "@kussetsu/svelte";
  import { glassTheme } from "./theme";

  const theme = glassTheme();

  let {
    options,
    value = $bindable(),
  }: { options: string[]; value?: string } = $props();

  if (value === undefined) value = options[0];
</script>

<GlassPanel {...theme()} class="gz-seg">
  <div class="seg" role="tablist">
    {#each options as opt}
      <button
        class="opt"
        class:active={opt === value}
        role="tab"
        aria-selected={opt === value}
        type="button"
        onclick={() => (value = opt)}
      >
        {opt}
      </button>
    {/each}
  </div>
</GlassPanel>

<style>
  :global(.gz-seg) {
    display: inline-flex;
    overflow: hidden;
  }
  .seg {
    display: inline-flex;
    padding: 4px;
    gap: 2px;
  }
  .opt {
    all: unset;
    box-sizing: border-box;
    padding: 0.45rem 1rem;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 600;
    color: #d7dcf0;
    cursor: pointer;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
    transition:
      background 0.15s,
      color 0.15s;
  }
  .opt.active {
    background: rgba(255, 255, 255, 0.85);
    color: #11142a;
    text-shadow: none;
  }
</style>
