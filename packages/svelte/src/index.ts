// High-level components: wrap a backdrop in <GlassScene>, drop <GlassPanel>s
// over it, and get refractive glass with zero texture/uniform/capture code.
export { default as GlassScene } from "./GlassScene.svelte";
export { default as GlassPanel } from "./GlassPanel.svelte";

// Low-level primitive: bind a raw WGSL shader to an element.
export { shader } from "./shader";
export type { ShaderActionOptions } from "./shader";

// Re-export the core types most Svelte users will reference.
export type {
  ShaderOptions,
  ShaderSurface,
  Uniforms,
  UniformValue,
  Fallback,
  FallbackReason,
} from "@kussetsu/core";
