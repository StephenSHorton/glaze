// Turn the laid-out scene tree into flat draw/semantics lists, applying the
// pan/zoom CAMERA (world -> screen) as we go. Pre-order = parents before children
// (correct paint order) and logical reading order (for AT).
import { type Camera, type ElementNode, type RGBA, firstText, textOf } from "./scene";
import type { GlassPanel, Rect, TextItem } from "./webgpu";
import type { SemNode } from "./a11y";

const FOCUS_RING: RGBA = [0.35, 0.95, 1.0, 1];
const GLASS_TINT: RGBA = [0.82, 0.87, 1, 1];

const sx = (x: number, c: Camera) => x * c.scale + c.tx;
const sy = (y: number, c: Camera) => y * c.scale + c.ty;

export function collectRects(root: ElementNode, focusedId: number | null, cam: Camera): Rect[] {
  const out: Rect[] = [];
  const walk = (n: ElementNode) => {
    const s = n.props.style ?? {};
    if (focusedId != null && n.id === focusedId) {
      const r = ((s.radius ?? 0) + 4) * cam.scale;
      out.push({ x: sx(n.x, cam) - 4, y: sy(n.y, cam) - 4, w: n.w * cam.scale + 8, h: n.h * cam.scale + 8, radius: r, color: FOCUS_RING });
    }
    if (s.background && !n.props.glass) {
      out.push({ x: sx(n.x, cam), y: sy(n.y, cam), w: n.w * cam.scale, h: n.h * cam.scale, radius: (s.radius ?? 0) * cam.scale, color: s.background });
    }
    for (const c of n.children) if (c.kind === "element") walk(c);
  };
  walk(root);
  return out;
}

export function collectTexts(root: ElementNode, cam: Camera): TextItem[] {
  const out: TextItem[] = [];
  const walk = (n: ElementNode) => {
    if (n.type === "text") {
      const s = n.props.style ?? {};
      const str = textOf(n);
      if (str) {
        out.push({
          x: sx(n.x, cam),
          y: sy(n.y, cam),
          text: str,
          size: (s.fontSize ?? 16) * cam.scale,
          weight: s.fontWeight ?? 400,
          color: s.color ?? [1, 1, 1, 1],
        });
      }
    }
    for (const c of n.children) if (c.kind === "element") walk(c);
  };
  walk(root);
  return out;
}

export function collectGlass(root: ElementNode, cam: Camera): GlassPanel[] {
  const out: GlassPanel[] = [];
  const walk = (n: ElementNode) => {
    const g = n.props.glass;
    if (g) {
      out.push({
        x: sx(n.x, cam),
        y: sy(n.y, cam),
        w: n.w * cam.scale,
        h: n.h * cam.scale,
        radius: (n.props.style?.radius ?? 22) * cam.scale,
        refraction: g.refraction ?? 0.09, // fraction of size — scale-invariant
        frost: (g.frost ?? 2) * cam.scale,
        tint: g.tint ?? 0.05,
        tintColor: g.tintColor ?? GLASS_TINT,
        rim: (g.rim ?? 22) * cam.scale,
      });
    }
    for (const c of n.children) if (c.kind === "element") walk(c);
  };
  walk(root);
  return out;
}

export function collectSemantics(root: ElementNode, cam: Camera): SemNode[] {
  const out: SemNode[] = [];
  const walk = (n: ElementNode) => {
    const role = n.props.role;
    const draggable = n.props.draggable;
    if (role || draggable) {
      out.push({
        id: String(n.id),
        role,
        draggable,
        onDrag: n.props.onDrag,
        label: n.props.ariaLabel ?? firstText(n),
        rect: { x: sx(n.x, cam), y: sy(n.y, cam), width: n.w * cam.scale, height: n.h * cam.scale },
        focusable: role === "button" || !!draggable,
        level: n.props.level,
        onActivate: n.props.onActivate,
      });
    }
    for (const c of n.children) if (c.kind === "element") walk(c);
  };
  walk(root);
  return out;
}
