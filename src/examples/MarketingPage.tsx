import { useEffect, useState } from "react";
import type { GlassSpec, RGBA } from "../core/scene";

// Kussetsu's marketing site — built IN Kussetsu. A light, visionOS-style world: soft pastel
// blobs as the backdrop, a FIXED frosted-glass nav that refracts + disperses them (and the
// content) as the page scrolls beneath it. The nav reads the BACKDROP (rects + text), and
// shader fills draw after the glass pass, so the colour beneath glass is soft pastel rects,
// not a shader gradient — which suits the airy aesthetic. Route: "/" (demo moved to ?demo).

const REPO = "https://github.com/StephenSHorton/kussetsu";
const NAV_H = 66;

const BASE: RGBA = [0.95, 0.96, 0.99, 1]; // near-white world
const INK: RGBA = [0.11, 0.13, 0.22, 1]; // headings
const SLATE: RGBA = [0.34, 0.38, 0.49, 1]; // body
const FAINT: RGBA = [0.52, 0.56, 0.66, 1];
const ACCENT: RGBA = [0.36, 0.4, 0.95, 1]; // indigo
const WHITE: RGBA = [1, 1, 1, 1];

const P = {
  lavender: [0.80, 0.82, 0.99, 1] as RGBA,
  mint: [0.76, 0.95, 0.87, 1] as RGBA,
  peach: [1.0, 0.86, 0.79, 1] as RGBA,
  sky: [0.78, 0.91, 1.0, 1] as RGBA,
  violet: [0.89, 0.80, 0.99, 1] as RGBA,
  rose: [1.0, 0.83, 0.90, 1] as RGBA,
};

// frosted-light glass — heavier frost, gentle bend, white-ward tint, soft sheen
const NAV_GLASS: GlassSpec = { refraction: 0.05, blur: 9, tint: 0.16, tintColor: WHITE, rim: 12, specular: 0.1, dispersion: 0.035 };
const CARD_GLASS: GlassSpec = { refraction: 0.07, blur: 12, tint: 0.22, tintColor: WHITE, rim: 13, specular: 0.09, dispersion: 0.03 };
const CTA_GLASS: GlassSpec = { refraction: 0.08, blur: 8, tint: 0.14, tintColor: WHITE, rim: 14, specular: 0.16, dispersion: 0.05 };

type Blob = { x: number; y: number; w: number; h: number; color: RGBA };

function Blobs({ blobs }: { blobs: Blob[] }) {
  // big, soft, low-saturation rounded rects = the backdrop the glass refracts
  return (
    <>
      {blobs.map((b, i) => (
        <view key={i} style={{ absolute: { x: b.x, y: b.y }, width: b.w, height: b.h, radius: Math.min(b.w, b.h) / 2, cornerSmoothing: 0.6, background: b.color }} />
      ))}
    </>
  );
}

function goDemo() {
  window.location.search = "?demo";
}
function goRepo() {
  window.open(REPO, "_blank", "noopener");
}

function NavLink({ label, onActivate }: { label: string; onActivate: () => void }) {
  return (
    <view role="button" ariaLabel={label} onActivate={onActivate} style={{ height: 36, direction: "row", align: "center", justify: "center", padding: 12, radius: 9, cornerSmoothing: 0.6 }}>
      <text style={{ fontSize: 15, fontWeight: 600, color: SLATE }}>{label}</text>
    </view>
  );
}

function Nav({ vw }: { vw: number }) {
  return (
    <view glass={NAV_GLASS} style={{ absolute: { x: 0, y: 0 }, width: vw, height: NAV_H, direction: "row", align: "center", padding: 26, gap: 4 }}>
      <text style={{ fontSize: 21, fontWeight: 800, color: INK }}>Kussetsu</text>
      <view style={{ grow: 1 }} />
      <view style={{ direction: "row", align: "center", gap: 6 }}>
        <NavLink label="Demo" onActivate={goDemo} />
        <NavLink label="GitHub" onActivate={goRepo} />
        <view role="button" ariaLabel="Get started" onActivate={goRepo} style={{ height: 38, direction: "row", align: "center", justify: "center", padding: 18, radius: 11, cornerSmoothing: 0.6, background: ACCENT }}>
          <text style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>Get started</text>
        </view>
      </view>
    </view>
  );
}

function PillButton({ label, glass, fill, onActivate }: { label: string; glass?: boolean; fill?: RGBA; onActivate: () => void }) {
  const base = { height: 52, shrink: 0, direction: "row", align: "center", justify: "center", padding: 28, radius: 14, cornerSmoothing: 0.6 } as const;
  const color = fill ? WHITE : INK;
  const inner = <text style={{ fontSize: 16, fontWeight: 700, color }}>{label}</text>;
  return glass ? (
    <view role="button" ariaLabel={label} onActivate={onActivate} glass={CTA_GLASS} style={base}>{inner}</view>
  ) : (
    <view role="button" ariaLabel={label} onActivate={onActivate} style={{ ...base, background: fill ?? ACCENT }}>{inner}</view>
  );
}

function Hero({ vw, vh }: { vw: number; vh: number }) {
  const h = Math.max(640, vh);
  const cx = vw / 2;
  const blobs: Blob[] = [
    { x: cx - 560, y: 80, w: 420, h: 420, color: P.lavender },
    { x: cx + 180, y: 40, w: 460, h: 460, color: P.sky },
    { x: cx - 220, y: 280, w: 520, h: 520, color: P.mint },
    { x: cx + 320, y: 360, w: 360, h: 360, color: P.peach },
    { x: cx - 640, y: 360, w: 320, h: 320, color: P.violet },
    { x: cx + 80, y: 540, w: 300, h: 300, color: P.rose },
  ];
  return (
    <view style={{ width: "stretch", height: h, direction: "column", align: "center", justify: "center" }}>
      <Blobs blobs={blobs} />
      <view style={{ width: Math.min(880, vw - 80), direction: "column", align: "center", gap: 26 }}>
        <text role="heading" level={1} style={{ fontSize: 68, fontWeight: 800, color: INK }}>Interfaces, painted on the GPU.</text>
        <text style={{ maxWidth: 660, fontSize: 20, fontWeight: 500, color: SLATE }}>
          Kussetsu renders your React with WebGPU — refraction, shaders, real spring physics — while the DOM stays a clean, invisible layer for accessibility and input. This whole page is proof: the glass above refracts what scrolls beneath it, the way CSS never could.
        </text>
        <view style={{ direction: "row", gap: 14, align: "center" }}>
          <PillButton label="Get started" fill={ACCENT} onActivate={goRepo} />
          <PillButton label="See the live demo" glass onActivate={goDemo} />
        </view>
      </view>
    </view>
  );
}

interface Feature { title: string; body: string; color: RGBA; }
const FEATURES: Feature[] = [
  { title: "Own the renderer", body: "A custom React reconciler paints every pixel on WebGPU. No DOM nodes to fight, no compositor to beg.", color: P.lavender },
  { title: "Beyond CSS", body: "Refraction, chromatic dispersion, per-element WGSL shaders, GPU particles. Effects CSS has no syntax for.", color: P.mint },
  { title: "Accessible by design", body: "An invisible DOM mirrors every interactive node — real roles, focus, find-in-page, screen readers. The GPU is just the paint.", color: P.peach },
];

function Features({ vw }: { vw: number }) {
  const cardW = 320, gap = 26;
  const gridW = FEATURES.length * cardW + (FEATURES.length - 1) * gap;
  const x0 = Math.round((vw - gridW) / 2);
  const cx = vw / 2;
  const blobs: Blob[] = [
    { x: cx - 480, y: 60, w: 380, h: 380, color: P.sky },
    { x: cx + 160, y: 120, w: 420, h: 420, color: P.violet },
    { x: cx - 120, y: 220, w: 360, h: 360, color: P.peach },
  ];
  return (
    <view style={{ width: "stretch", height: 620, direction: "column", align: "center", justify: "center" }}>
      <Blobs blobs={blobs} />
      <view style={{ absolute: { x: x0, y: 150 }, width: gridW, direction: "row", gap }}>
        {FEATURES.map((f) => (
          <view key={f.title} glass={CARD_GLASS} style={{ width: cardW, height: 300, shrink: 0, radius: 22, cornerSmoothing: 0.6, direction: "column", padding: 28, gap: 12, justify: "end" }}>
            <view style={{ width: 44, height: 44, radius: 13, cornerSmoothing: 0.6, background: f.color }} />
            <text role="heading" level={3} style={{ fontSize: 22, fontWeight: 800, color: INK }}>{f.title}</text>
            <text style={{ fontSize: 15, fontWeight: 500, color: SLATE }}>{f.body}</text>
          </view>
        ))}
      </view>
    </view>
  );
}

function Footer({ vw }: { vw: number }) {
  return (
    <view style={{ width: "stretch", height: 200, direction: "column", align: "center", justify: "center", gap: 10 }}>
      <text style={{ fontSize: 16, fontWeight: 700, color: SLATE }}>Real React · a custom reconciler · WebGPU · an invisible, accessible DOM</text>
      <text style={{ fontSize: 13, color: FAINT }}>This page is built in Kussetsu — every pixel is WGSL output on one canvas.</text>
      <view style={{ direction: "row", gap: 8, align: "center" }}>
        <NavLink label="GitHub" onActivate={goRepo} />
        <NavLink label="Live demo" onActivate={goDemo} />
      </view>
    </view>
  );
}

export function MarketingPage() {
  const [, force] = useState(0);
  useEffect(() => {
    const onResize = () => force((x) => x + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 860;
  return (
    <view style={{ width: vw, height: vh, background: BASE }}>
      {/* scrollable body — the nav (a sibling, drawn over) refracts whatever scrolls under it */}
      <view style={{ width: vw, height: vh, overflow: "scroll", direction: "column" }}>
        <Hero vw={vw} vh={vh} />
        <Features vw={vw} />
        <Footer vw={vw} />
      </view>
      <Nav vw={vw} />
    </view>
  );
}
