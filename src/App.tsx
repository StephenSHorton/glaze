import { useState } from "react";
import type { RGBA } from "./scene";

const WHITE: RGBA = [0.96, 0.97, 1, 1];
const MUTED: RGBA = [0.66, 0.71, 0.83, 1];
const ACCENT: RGBA = [0.42, 0.48, 0.96, 1];
const CARD: RGBA = [0.1, 0.12, 0.19, 1];
const PAGE: RGBA = [0.035, 0.045, 0.08, 1];

// Authored as ordinary React. <view>/<text> are our host elements; there is NO
// DOM behind them — the custom reconciler paints them on the GPU.
export function App() {
  const [count, setCount] = useState(0);

  return (
    <view style={{ direction: "column", align: "center", justify: "center", padding: 40, background: PAGE }}>
      <view style={{ width: 460, direction: "column", gap: 16, padding: 32, radius: 22, background: CARD }}>
        <text role="heading" level={1} style={{ width: "stretch", fontSize: 27, fontWeight: 700, color: WHITE }}>
          GPU-rendered UI
        </text>
        <text role="paragraph" style={{ width: "stretch", fontSize: 15, color: MUTED }}>
          Every visible pixel here is painted by a WGSL shader on WebGPU.
        </text>
        <text role="paragraph" style={{ width: "stretch", fontSize: 15, color: MUTED }}>
          The DOM only carries semantics + input — invisible and weightless.
        </text>

        <text style={{ width: "stretch", fontSize: 16, fontWeight: 600, color: [0.55, 0.62, 1, 1] }}>
          Clicked {count} times
        </text>

        <view
          role="button"
          ariaLabel="Increment the counter"
          onActivate={() => setCount((c) => c + 1)}
          style={{ width: "stretch", direction: "row", align: "center", justify: "center", padding: 13, radius: 12, background: ACCENT }}
        >
          <text style={{ fontSize: 15, fontWeight: 600, color: WHITE }}>Increment ↑</text>
        </view>
      </view>
    </view>
  );
}
