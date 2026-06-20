<script lang="ts">
  import { setContext, onMount, type Snippet } from "svelte";
  import { captureBackdrop } from "@kussetsu/core";
  import { GLASS_SCENE_KEY, type GlassSceneContext } from "./context";

  interface Props {
    children: Snippet;
    class?: string;
    /** Device-pixel-ratio cap for the backdrop snapshot. */
    maxDpr?: number;
    [key: string]: unknown;
  }

  let { children, class: className = "", maxDpr = 2, ...rest }: Props = $props();

  let sceneEl: HTMLDivElement;
  let backdrop = $state<HTMLCanvasElement | null>(null);
  let failed = $state(false);

  // Shared with descendant <GlassPanel>s. Getters keep `backdrop`/`failed`
  // reactive across the component boundary.
  const scene: GlassSceneContext = {
    getSceneEl: () => sceneEl,
    get backdrop() {
      return backdrop;
    },
    get failed() {
      return failed;
    },
  };
  setContext(GLASS_SCENE_KEY, scene);

  onMount(async () => {
    try {
      // Make sure backdrop images are decoded before we snapshot.
      const imgs = Array.from(sceneEl.querySelectorAll("img"));
      await Promise.all(imgs.map((im) => im.decode().catch(() => {})));
      const { source } = await captureBackdrop(sceneEl, { maxDpr });
      backdrop = source;
    } catch (err) {
      console.warn("[kussetsu] backdrop capture failed; panels fall back to CSS glass:", err);
      failed = true;
    }
  });
</script>

<div bind:this={sceneEl} class={className} style="position: relative; isolation: isolate;" {...rest}>
  {@render children()}
</div>
