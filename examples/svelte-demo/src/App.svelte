<script lang="ts">
  import Intro from "./Intro.svelte";
  import Glass from "./Glass.svelte";

  let view = $state<"glass" | "intro">("glass");
</script>

<nav class="topnav">
  <span class="brand">Glaze</span>
  <div class="tabs">
    <button class:active={view === "glass"} onclick={() => (view = "glass")}>Liquid Glass</button>
    <button class:active={view === "intro"} onclick={() => (view = "intro")}>Overview</button>
  </div>
</nav>

{#if view === "glass"}
  <Glass />
{:else}
  <Intro />
{/if}

<style>
  :global(body) {
    margin: 0;
    background: #05060c;
    color: #e7e9f3;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    line-height: 1.55;
  }

  .topnav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1100px;
    margin: 0 auto;
    padding: 1rem 1.25rem 0.25rem;
  }
  .brand {
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .tabs {
    display: flex;
    gap: 0.4rem;
  }
  .tabs button {
    background: #0c1020;
    border: 1px solid #1d2236;
    color: #c9cde0;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .tabs button.active {
    background: #fff;
    color: #0b1020;
    border-color: #fff;
    font-weight: 600;
  }
</style>
