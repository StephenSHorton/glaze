/**
 * std140-style layout for a WGSL uniform struct built from `@uniform`
 * declarations. We only support float-based scalar/vector types in v1, so the
 * backing store is always a single Float32Array and writes are plain float copies.
 *
 * WGSL uniform address-space alignment rules:
 *   f32   -> size 4,  align 4
 *   vec2f -> size 8,  align 8
 *   vec3f -> size 12, align 16
 *   vec4f -> size 16, align 16
 * The struct's total size is rounded up to a multiple of 16 (min 16).
 */

export type WgslType = "f32" | "vec2f" | "vec3f" | "vec4f";

const SIZE: Record<WgslType, number> = { f32: 4, vec2f: 8, vec3f: 12, vec4f: 16 };
const ALIGN: Record<WgslType, number> = { f32: 4, vec2f: 8, vec3f: 16, vec4f: 16 };
/** Number of f32 lanes a value of this type carries. */
export const FLOATS: Record<WgslType, number> = { f32: 1, vec2f: 2, vec3f: 3, vec4f: 4 };

export interface UniformField {
  readonly name: string;
  readonly type: WgslType;
  /** Byte offset within the uniform buffer. */
  readonly offset: number;
}

export interface UniformLayout {
  readonly fields: readonly UniformField[];
  /** Total buffer size in bytes (multiple of 16, min 16). */
  readonly size: number;
  readonly byName: ReadonlyMap<string, UniformField>;
}

const roundUp = (n: number, multiple: number): number =>
  Math.ceil(n / multiple) * multiple;

/** Compute the byte layout for an ordered list of `(name, type)` declarations. */
export function computeLayout(
  decls: ReadonlyArray<{ name: string; type: WgslType }>,
): UniformLayout {
  const fields: UniformField[] = [];
  const byName = new Map<string, UniformField>();
  let cursor = 0;

  for (const { name, type } of decls) {
    cursor = roundUp(cursor, ALIGN[type]);
    const field: UniformField = { name, type, offset: cursor };
    fields.push(field);
    byName.set(name, field);
    cursor += SIZE[type];
  }

  const size = Math.max(16, roundUp(cursor, 16));
  return { fields, size, byName };
}
