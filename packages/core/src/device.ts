/**
 * Shared WebGPU device acquisition. All Kussetsu surfaces on a page share one
 * GPUDevice — adapters/devices are expensive and there is no reason to hold
 * more than one for a handful of decorative surfaces.
 */

export interface GpuContext {
  readonly adapter: GPUAdapter;
  readonly device: GPUDevice;
  readonly format: GPUTextureFormat;
}

let cached: Promise<GpuContext | null> | null = null;

/** True if `navigator.gpu` exists at all. Cheap synchronous check. */
export function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator && !!navigator.gpu;
}

/**
 * Acquire (and memoize) the shared GPU context. Resolves to `null` when WebGPU
 * is unavailable or an adapter/device cannot be obtained — callers fall back.
 */
export function getGpuContext(): Promise<GpuContext | null> {
  if (cached) return cached;
  cached = acquire();
  return cached;
}

async function acquire(): Promise<GpuContext | null> {
  if (!hasWebGPU()) return null;
  let adapter: GPUAdapter | null = null;
  try {
    adapter = await navigator.gpu.requestAdapter({ powerPreference: "low-power" });
  } catch {
    adapter = null;
  }
  if (!adapter) return null;

  let device: GPUDevice;
  try {
    device = await adapter.requestDevice();
  } catch {
    return null;
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  return { adapter, device, format };
}

/** Reset the memoized context. Intended for tests. */
export function _resetGpuContextForTests(): void {
  cached = null;
}
