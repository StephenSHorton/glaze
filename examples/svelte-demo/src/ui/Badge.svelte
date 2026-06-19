<script lang="ts">
  import { GlassPanel } from "@glaze/svelte";
  import type { Snippet } from "svelte";
  import { glassTheme } from "./theme";

  const theme = glassTheme();

  let { children, color = "#e6ebf2" }: { children: Snippet; color?: string } = $props();
</script>

<GlassPanel {...theme()} class="gz-badge" radius={999} {color}>
  <span class="inner" style="--badge: {color};">{@render children()}</span>
</GlassPanel>

<style>
  :global(.gz-badge) {
    display: inline-flex;
    overflow: hidden;
  }
  .inner {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.8rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    /* Translucent rich color: the saturated badge hue at ~70% alpha so the glass
       refraction shows through (slightly denser at the top), with a thin top
       highlight for the glassy edge. Dark text for contrast. */
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--badge), transparent 26%),
      color-mix(in srgb, var(--badge), transparent 38%)
    );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
    color: #14172e;
    white-space: nowrap;
  }
</style>
