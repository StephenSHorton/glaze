export { createShaderSurface } from "./surface.js";
export { getGpuContext, hasWebGPU } from "./device.js";
export { assembleShader } from "./wgsl.js";
export { computeLayout } from "./layout.js";
export { KUSSETSU_PRELUDE } from "./prelude.js";
export { KUSSETSU_GLASS } from "./glass-shader.js";
export { captureBackdrop, supportsNativeCapture } from "./backdrop.js";

export type {
  ShaderOptions,
  ShaderSurface,
  Uniforms,
  UniformValue,
  Fallback,
  FallbackReason,
} from "./types.js";
export type { WgslType, UniformLayout, UniformField } from "./layout.js";
export type { GpuContext } from "./device.js";
export type { ParsedShader } from "./wgsl.js";
export type { CaptureResult, CaptureOptions } from "./backdrop.js";
