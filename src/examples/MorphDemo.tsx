import { useEffect, useState } from "react";
import { useSpring } from "../core/useSpring";
import type { RGBA } from "../core/scene";

// Springs + squircles. Click a shape: the card springs to it — size, corner radius, corner
// SMOOTHING (superellipse), and color all animate with real, interruptible spring physics
// (bouncy overshoot, and you can interrupt mid-flight). Two things CSS can't: a true
// squircle (border-radius is a circular arc, not a superellipse) and momentum-carrying,
// interruptible spring motion. Route: ?spring

const INK: RGBA = [0.04, 0.05, 0.1, 1];
const WHITE: RGBA = [0.97, 0.98, 1, 1];
const MUTED: RGBA = [0.62, 0.67, 0.8, 1];
const CHIP: RGBA = [0.12, 0.14, 0.22, 1];
const CHIP_ON: RGBA = [0.3, 0.36, 0.62, 1];

interface Preset { name: string; w: number; h: number; radius: number; sm: number; color: [number, number, number]; }
const PRESETS: Preset[] = [
  { name: "Rounded", w: 300, h: 300, radius: 44, sm: 0, color: [0.36, 0.4, 0.95] },
  { name: "Squircle", w: 300, h: 300, radius: 86, sm: 1, color: [0.1, 0.72, 0.66] },
  { name: "Circle", w: 300, h: 300, radius: 150, sm: 0, color: [0.96, 0.45, 0.2] },
  { name: "Pill", w: 440, h: 168, radius: 84, sm: 0.4, color: [0.86, 0.32, 0.56] },
  { name: "Card", w: 440, h: 280, radius: 18, sm: 0.6, color: [0.56, 0.35, 0.95] },
];
const BOUNCY = { stiffness: 190, damping: 13 };
const SMOOTH = { stiffness: 190, damping: 22 };

export function MorphDemo() {
  const [i, setI] = useState(1);
  const [, redraw] = useState(0);
  useEffect(() => {
    const h = () => redraw((t) => t + 1);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const p = PRESETS[i];
  const w = useSpring(p.w, BOUNCY);
  const h = useSpring(p.h, BOUNCY);
  const radius = useSpring(p.radius, BOUNCY);
  const sm = useSpring(p.sm, SMOOTH);
  const cr = useSpring(p.color[0], SMOOTH);
  const cg = useSpring(p.color[1], SMOOTH);
  const cb = useSpring(p.color[2], SMOOTH);

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const btnW = 560;

  return (
    <view style={{ width: vw, height: vh, background: INK }}>
      {/* title */}
      <view style={{ absolute: { x: Math.round(vw / 2) - 240, y: 56 }, width: 480, direction: "column", align: "center", gap: 8 }}>
        <text role="heading" level={1} style={{ fontSize: 32, fontWeight: 800, color: WHITE }}>Springs + Squircles</text>
        <text style={{ fontSize: 16, fontWeight: 600, color: MUTED }}>real spring physics · superellipse corners</text>
      </view>

      {/* round vs squircle reference (same radius, different smoothing) */}
      <view style={{ absolute: { x: vw - 250, y: 120 }, direction: "row", gap: 16 }}>
        <view style={{ direction: "column", align: "center", gap: 6 }}>
          <view style={{ width: 90, height: 90, radius: 34, cornerSmoothing: 0, background: [0.3, 0.34, 0.5, 1] }} />
          <text style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>round</text>
        </view>
        <view style={{ direction: "column", align: "center", gap: 6 }}>
          <view style={{ width: 90, height: 90, radius: 34, cornerSmoothing: 1, background: [0.4, 0.55, 0.95, 1] }} />
          <text style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>squircle</text>
        </view>
      </view>

      {/* the morphing shape (spring-animated, kept centered as it resizes) */}
      <view style={{ absolute: { x: Math.round((vw - w) / 2), y: Math.round((vh - h) / 2) }, width: Math.round(w), height: Math.round(h), radius, cornerSmoothing: sm, background: [cr, cg, cb, 1] }} />

      {/* preset buttons */}
      <view style={{ absolute: { x: Math.round((vw - btnW) / 2), y: vh - 96 }, width: btnW, direction: "row", justify: "center", gap: 12 }}>
        {PRESETS.map((pp, idx) => (
          <view
            key={pp.name}
            role="button"
            ariaLabel={`Morph to ${pp.name}`}
            onActivate={() => setI(idx)}
            style={{ height: 44, shrink: 0, direction: "row", align: "center", justify: "center", padding: 18, radius: 14, cornerSmoothing: 0.6, background: idx === i ? CHIP_ON : CHIP }}
          >
            <text style={{ fontSize: 14, fontWeight: 700, color: idx === i ? WHITE : [0.78, 0.82, 0.94, 1] }}>{pp.name}</text>
          </view>
        ))}
      </view>
    </view>
  );
}
