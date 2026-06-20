import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { captureBackdrop } from "@kussetsu/core";
import { GlassSceneContext, type GlassSceneContextValue } from "./context";

export interface GlassSceneProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Device-pixel-ratio cap for the backdrop snapshot. */
  maxDpr?: number;
}

/**
 * Captures a snapshot of its own subtree on mount and shares it (via context)
 * with any descendant <GlassPanel>, which refracts it. Mark crisp overlay UI
 * with `data-kussetsu-no-capture` to keep it on top of the glass.
 */
export function GlassScene({ children, maxDpr = 2, style, ...rest }: GlassSceneProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [backdrop, setBackdrop] = useState<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    let cancelled = false;
    void (async () => {
      try {
        // Make sure backdrop images are decoded before we snapshot.
        const imgs = Array.from(el.querySelectorAll("img"));
        await Promise.all(imgs.map((im) => im.decode().catch(() => {})));
        const { source } = await captureBackdrop(el, { maxDpr });
        if (!cancelled) setBackdrop(source);
      } catch (err) {
        console.warn("[kussetsu] backdrop capture failed; panels fall back to CSS glass:", err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [maxDpr]);

  const getSceneEl = useCallback(() => sceneRef.current, []);
  const value = useMemo<GlassSceneContextValue>(
    () => ({ getSceneEl, backdrop, failed }),
    [getSceneEl, backdrop, failed],
  );

  const sceneStyle: CSSProperties = { position: "relative", isolation: "isolate", ...style };

  return (
    <GlassSceneContext.Provider value={value}>
      <div ref={sceneRef} style={sceneStyle} {...rest}>
        {children}
      </div>
    </GlassSceneContext.Provider>
  );
}
