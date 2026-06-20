<script lang="ts">
  import { GlassPanel } from "@kussetsu/svelte";
  import type { Snippet } from "svelte";
  import { glassTheme } from "./theme";

  const theme = glassTheme();

  let {
    children,
    variant = "primary",
    onclick,
  }: {
    children: Snippet;
    variant?: "primary" | "secondary" | "ghost";
    onclick?: () => void;
  } = $props();

  const color = { primary: "#8ea0ff", secondary: "#e6ebf2", ghost: "#e6ebf2" }[variant];
</script>

<GlassPanel {...theme()} class="gz-btn gz-btn-{variant}" {color}>
  <button class="inner" {onclick} type="button">{@render children()}</button>
</GlassPanel>

<style>
  :global(.gz-btn) {
    display: inline-flex;
    overflow: hidden;
  }
  /* Emphasis is set by the content layer (independent of the glass sliders):
     primary = filled accent, secondary = subtle frost, ghost = outline. */
  :global(.gz-btn-secondary) {
    border: 1px solid rgba(255, 255, 255, 0.22);
  }
  :global(.gz-btn-ghost) {
    border: 1px solid rgba(255, 255, 255, 0.5);
  }

  .inner {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1.25rem;
    font: inherit;
    font-weight: 600;
    font-size: 0.92rem;
    color: #fff;
    cursor: pointer;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
    white-space: nowrap;
  }
  .inner:active {
    transform: translateY(1px);
  }

  :global(.gz-btn-primary) .inner {
    background: linear-gradient(180deg, rgba(126, 140, 255, 0.82), rgba(92, 102, 235, 0.86));
    font-weight: 700;
  }
  :global(.gz-btn-secondary) .inner {
    background: rgba(255, 255, 255, 0.16);
  }
  :global(.gz-btn-ghost) .inner {
    color: #eef0fb;
  }
</style>
