/**
 * Tiny, dependency-free canvas confetti.
 *
 * Draws a burst of colored particles on a full-screen overlay canvas, animates
 * them with gravity + drift, then removes itself. Respects the user's
 * "Reduce Motion" preference (no-op when set). Safe on web and native — it only
 * touches the DOM in the browser.
 *
 * Usage:
 *   const stop = launchConfetti();      // fire-and-forget
 *   ...
 *   stop?.();                           // optional early cleanup
 */

type ConfettiOptions = {
  /** Number of particles. Default 140. */
  count?: number;
  /** Milliseconds before the overlay fades out and is removed. Default 2600. */
  durationMs?: number;
  /** Aurora Glass palette by default. */
  colors?: string[];
};

const DEFAULT_COLORS = [
  "#8be3d6", // aurora teal
  "#7cc7ff", // sky
  "#c9a2ff", // violet
  "#ff9ecd", // magenta
  "#ffe58a", // gold
  "#ffffff", // white sparkle
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  shape: 0 | 1; // 0 = rect, 1 = circle
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function launchConfetti(options: ConfettiOptions = {}): (() => void) | void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (prefersReducedMotion()) return;

  const { count = 140, durationMs = 2600, colors = DEFAULT_COLORS } = options;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60;" +
    "transition:opacity 500ms ease-out;opacity:1;";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  // Two launch origins (lower-left and lower-right) firing up and inward,
  // like party poppers, plus a gentle top sprinkle.
  const particles: Particle[] = [];
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

  for (let i = 0; i < count; i++) {
    const fromLeft = i % 2 === 0;
    const originX = fromLeft ? w * 0.12 : w * 0.88;
    const originY = h * 0.92;
    const angle = fromLeft
      ? -Math.PI / 2 + (Math.random() * 0.7 - 0.1) // up + slightly right
      : -Math.PI / 2 - (Math.random() * 0.7 - 0.1); // up + slightly left
    const speed = 8 + Math.random() * 9;
    particles.push({
      x: originX + (Math.random() - 0.5) * 40,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: pick(colors),
      shape: Math.random() > 0.5 ? 1 : 0,
    });
  }

  const gravity = 0.22;
  const drag = 0.992;
  let raf = 0;
  let start = 0;
  let removed = false;

  const cleanup = () => {
    if (removed) return;
    removed = true;
    cancelAnimationFrame(raf);
    canvas.remove();
  };

  const tick = (ts: number) => {
    if (!start) start = ts;
    const elapsed = ts - start;

    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.vy += gravity;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.95;
      if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx.restore();
    }

    // Begin fading a little before the end.
    if (elapsed > durationMs - 500) {
      canvas.style.opacity = "0";
    }
    if (elapsed > durationMs) {
      cleanup();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return cleanup;
}
