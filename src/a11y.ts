// The invisible DOM "semantics overlay" (Flutter's flt-semantics model): one
// transparent, correctly-tagged, focusable DOM proxy per interactive/semantic node,
// positioned over the GPU-painted pixels. Screen readers, keyboard nav, and focus
// all work even though every visible pixel is drawn by WebGPU. This is the piece
// Zed's GPUI deferred — and the reason canvas UIs are usually a11y black boxes.
import type { Role } from "./scene";

export interface SemNode {
  id: string;
  role: Role;
  label: string;
  rect: { x: number; y: number; width: number; height: number };
  focusable: boolean;
  level?: number;
  onActivate?: () => void;
}

export interface FocusBridge {
  setFocusRing(nodeId: string | null, keyboard: boolean): void;
}

interface Proxy {
  el: HTMLElement;
  node: SemNode;
}

const TAG: Record<Role, keyof HTMLElementTagNameMap> = { button: "button", heading: "h2", paragraph: "p" };
const INTERACTIVE: Record<Role, boolean> = { button: true, heading: false, paragraph: false };

export class SemanticsOverlay {
  private root: HTMLElement;
  private pool = new Map<string, Proxy>();
  private keyboardActive = false;

  constructor(container: HTMLElement, private bridge: FocusBridge) {
    this.root = container;
    addEventListener("keydown", () => (this.keyboardActive = true), true);
    addEventListener("pointerdown", () => (this.keyboardActive = false), true);
    this.root.addEventListener("focusin", (e) => {
      const id = (e.target as HTMLElement).dataset.nodeId ?? null;
      this.bridge.setFocusRing(id, this.keyboardActive);
    });
    this.root.addEventListener("focusout", () => this.bridge.setFocusRing(null, false));
  }

  private tagFor(node: SemNode): string {
    return node.role === "heading" ? `h${Math.min(6, Math.max(1, node.level ?? 2))}` : TAG[node.role];
  }

  /** Diff a flat node list against the pool. Reuse, never recreate. Per commit. */
  syncFromScene(nodes: readonly SemNode[]): void {
    const seen = new Set<string>();
    const focusedId = (document.activeElement as HTMLElement | null)?.dataset?.nodeId;

    for (const node of nodes) {
      seen.add(node.id);
      let proxy = this.pool.get(node.id);
      if (!proxy || proxy.el.tagName.toLowerCase() !== this.tagFor(node)) {
        const fresh = this.createProxy(node);
        if (proxy) proxy.el.replaceWith(fresh);
        else this.root.appendChild(fresh);
        proxy = { el: fresh, node };
        this.pool.set(node.id, proxy);
      }
      this.updateProxy(proxy, node);
      proxy.node = node;
    }

    for (const [id, proxy] of this.pool) {
      if (!seen.has(id)) {
        proxy.el.remove();
        this.pool.delete(id);
      }
    }

    // DOM order == AT reading/tab order.
    for (const node of nodes) {
      const el = this.pool.get(node.id)?.el;
      if (el) this.root.appendChild(el);
    }

    if (focusedId && this.pool.has(focusedId)) {
      const el = this.pool.get(focusedId)!.el;
      if (document.activeElement !== el) el.focus({ preventScroll: true });
    }
  }

  private createProxy(node: SemNode): HTMLElement {
    const el = document.createElement(this.tagFor(node));
    el.dataset.nodeId = node.id;
    Object.assign(el.style, {
      position: "absolute",
      top: "0",
      left: "0",
      margin: "0",
      padding: "0",
      border: "0",
      background: "transparent",
      color: "transparent",
      outline: "none", // real ring is GPU-painted via the bridge
      appearance: "none",
      font: "inherit",
      pointerEvents: INTERACTIVE[node.role] ? "auto" : "none",
    } as Partial<CSSStyleDeclaration>);

    el.addEventListener("click", (e) => {
      e.preventDefault();
      this.pool.get(node.id)?.node.onActivate?.();
    });
    el.addEventListener("keydown", (e) => {
      // <button> already fires click on Enter/Space; this covers role-emulated nodes.
      if ((e.key === "Enter" || e.key === " ") && node.role !== "button") {
        e.preventDefault();
        this.pool.get(node.id)?.node.onActivate?.();
      }
    });
    return el;
  }

  private updateProxy(proxy: Proxy, node: SemNode): void {
    const { el } = proxy;
    const prev = proxy.node;
    const r = node.rect;
    if (prev === node || prev.rect.x !== r.x || prev.rect.y !== r.y || prev.rect.width !== r.width || prev.rect.height !== r.height) {
      el.style.transform = `translate(${r.x}px, ${r.y}px)`;
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
    }
    el.setAttribute("aria-label", node.label);
    if (node.role === "heading" || node.role === "paragraph") el.textContent = node.label;
    if (node.role === "heading") el.setAttribute("aria-level", String(node.level ?? 2));
    el.tabIndex = node.focusable ? 0 : -1;
  }
}
