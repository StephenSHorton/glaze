import { useEffect, useRef, useState } from "react";

// A spring-physics primitive. Animate a number toward `target` with a real damped spring
// (not a keyframed transition): INTERRUPTIBLE — change the target mid-flight and it
// continues from the current value + velocity, no snap, with natural overshoot/settle.
// Each settling frame re-renders React → the reconciler commits → the GPU repaints; when
// the spring comes to rest it stops the loop entirely. This is what CSS transitions can't
// do (they restart from a keyframe and can't carry momentum through an interruption).

export interface SpringConfig {
  stiffness?: number; // spring constant (higher = snappier)
  damping?: number; // friction (lower = bouncier)
  mass?: number;
}
const DEFAULT: Required<SpringConfig> = { stiffness: 170, damping: 18, mass: 1 };

export function useSpring(target: number, config: SpringConfig = {}): number {
  const cfg = { ...DEFAULT, ...config };
  const [value, setValue] = useState(target);
  const s = useRef({ value: target, vel: 0, target, raf: 0, last: 0 });
  s.current.target = target; // keep the target live without restarting React state

  useEffect(() => {
    const st = s.current;
    const step = (now: number) => {
      const dt = Math.min(0.064, st.last ? (now - st.last) / 1000 : 1 / 60);
      st.last = now;
      // semi-implicit Euler on a damped harmonic oscillator
      const force = -cfg.stiffness * (st.value - st.target) - cfg.damping * st.vel;
      st.vel += (force / cfg.mass) * dt;
      st.value += st.vel * dt;
      if (Math.abs(st.value - st.target) < 0.01 && Math.abs(st.vel) < 0.05) {
        st.value = st.target; st.vel = 0; st.raf = 0; st.last = 0;
        setValue(st.target); // final exact value, then stop
        return;
      }
      setValue(st.value);
      st.raf = requestAnimationFrame(step);
    };
    if (!st.raf) { st.last = 0; st.raf = requestAnimationFrame(step); } // (re)kick on target change
    return () => { if (st.raf) cancelAnimationFrame(st.raf); st.raf = 0; };
  }, [target, cfg.stiffness, cfg.damping, cfg.mass]);

  return value;
}
