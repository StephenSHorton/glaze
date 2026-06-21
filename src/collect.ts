// Turn the laid-out scene tree into flat draw/semantics lists. Pre-order traversal
// = parents before children (correct paint order) and logical reading order (for AT).
import { type ElementNode, type RGBA, firstText, textOf } from "./scene";
import type { Rect, TextItem } from "./webgpu";
import type { SemNode } from "./a11y";

const FOCUS_RING: RGBA = [0.35, 0.95, 1.0, 1]; // bright cyan, clearly distinct

export function collectRects(root: ElementNode, focusedId: number | null): Rect[] {
  const out: Rect[] = [];
  const walk = (n: ElementNode) => {
    const s = n.props.style ?? {};
    // Focus ring: a slightly-larger accent rect painted BEHIND the node — the GPU
    // side of the "invisible proxy has focus, paint the ring ourselves" bridge.
    if (focusedId != null && n.id === focusedId) {
      const r = (s.radius ?? 0) + 4;
      out.push({ x: n.x - 4, y: n.y - 4, w: n.w + 8, h: n.h + 8, radius: r, color: FOCUS_RING });
    }
    if (s.background) out.push({ x: n.x, y: n.y, w: n.w, h: n.h, radius: s.radius ?? 0, color: s.background });
    for (const c of n.children) if (c.kind === "element") walk(c);
  };
  walk(root);
  return out;
}

export function collectTexts(root: ElementNode): TextItem[] {
  const out: TextItem[] = [];
  const walk = (n: ElementNode) => {
    if (n.type === "text") {
      const s = n.props.style ?? {};
      const str = textOf(n);
      if (str)
        out.push({
          x: n.x,
          y: n.y,
          text: str,
          size: s.fontSize ?? 16,
          weight: s.fontWeight ?? 400,
          color: s.color ?? [1, 1, 1, 1],
        });
    }
    for (const c of n.children) if (c.kind === "element") walk(c);
  };
  walk(root);
  return out;
}

export function collectSemantics(root: ElementNode): SemNode[] {
  const out: SemNode[] = [];
  const walk = (n: ElementNode) => {
    const role = n.props.role;
    if (role) {
      out.push({
        id: String(n.id),
        role,
        label: n.props.ariaLabel ?? firstText(n),
        rect: { x: n.x, y: n.y, width: n.w, height: n.h },
        focusable: role === "button",
        level: n.props.level,
        onActivate: n.props.onActivate,
      });
    }
    for (const c of n.children) if (c.kind === "element") walk(c);
  };
  walk(root);
  return out;
}
