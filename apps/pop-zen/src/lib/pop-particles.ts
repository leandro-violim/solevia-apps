/**
 * Pop particle burst — a single GPU-composited <canvas> overlay driven by one
 * requestAnimationFrame loop, with a FIXED pre-allocated particle pool.
 *
 * Why canvas + a fixed pool (not DOM nodes per pop): rapid popping must never
 * allocate a flood of objects or DOM. The pool is a ring buffer of `maxAlive`
 * structs reused forever; a burst overwrites the oldest slots, so on-screen
 * particles are hard-capped and the fast-popper case stays allocation-free and
 * smooth. The loop parks itself when nothing is alive and wakes on the next pop.
 *
 * Coordinates are field-local CSS pixels (a bubble's centre) — the same space
 * the canvas is sized to (inset-0 over the play field).
 */
import { JUICE } from "./juice";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // ms remaining
  size: number;
  r: number;
  g: number;
  b: number;
};

const CFG = JUICE.particles;

// Pre-parsed tint channels (one per bubble variant).
const TINTS = CFG.tints.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
});

// Fixed pool — allocated once, reused forever.
const pool: P[] = Array.from({ length: CFG.maxAlive }, () => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 0,
  size: 0,
  r: 255,
  g: 255,
  b: 255,
}));
let head = 0; // ring-buffer write cursor → naturally drops the oldest

let canvas: HTMLCanvasElement | null = null;
let cctx: CanvasRenderingContext2D | null = null;
let cssW = 0;
let cssH = 0;
let raf = 0;
let lastTs = 0;

const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function attachCanvas(el: HTMLCanvasElement): void {
  canvas = el;
  cctx = el.getContext("2d");
}

export function detachCanvas(el: HTMLCanvasElement): void {
  if (canvas !== el) return; // ignore a stale unmount (StrictMode double-invoke)
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  lastTs = 0;
  canvas = null;
  cctx = null;
}

/** Size the backing store to the field in device pixels for crisp dots. */
export function resizeCanvas(widthCss: number, heightCss: number): void {
  if (!canvas || !cctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2 — plenty, cheaper
  cssW = widthCss;
  cssH = heightCss;
  canvas.width = Math.max(1, Math.round(widthCss * dpr));
  canvas.height = Math.max(1, Math.round(heightCss * dpr));
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS px
}

/**
 * Emit a burst from (x, y) tinted to bubble `variant`. Field-local CSS px.
 * `count`/`speedMul` default to a normal pop; pass larger values for a milestone
 * flourish (P1-T2 reuses this engine — see combo handling in play.tsx).
 */
export function burstParticles(
  x: number,
  y: number,
  variant: number,
  count = 0,
  speedMul = 1,
): void {
  if (prefersReducedMotion || !cctx) return; // respect reduced-motion; no-op until attached
  const tint = TINTS[variant % TINTS.length] ?? TINTS[0];
  const n = count > 0 ? count : rand(CFG.countMin, CFG.countMax + 1) | 0;
  for (let i = 0; i < n; i++) {
    const p = pool[head];
    head = (head + 1) % pool.length; // wrap → overwrite oldest (the cap)
    const ang = rand(0, Math.PI * 2);
    const sp = rand(CFG.speedMin, CFG.speedMax) * speedMul;
    const bright = 1 + rand(-CFG.brightnessJitter, CFG.brightnessJitter);
    p.x = x;
    p.y = y;
    p.vx = Math.cos(ang) * sp;
    p.vy = Math.sin(ang) * sp;
    p.life = CFG.lifeMs;
    p.size = rand(CFG.sizeMin, CFG.sizeMax);
    p.r = Math.max(0, Math.min(255, tint.r * bright));
    p.g = Math.max(0, Math.min(255, tint.g * bright));
    p.b = Math.max(0, Math.min(255, tint.b * bright));
  }
  if (!raf) {
    lastTs = 0;
    raf = requestAnimationFrame(tick);
  }
}

function tick(ts: number): void {
  if (!cctx) {
    raf = 0;
    return;
  }
  const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016; // seconds, clamped
  lastTs = ts;

  cctx.clearRect(0, 0, cssW, cssH);
  const damp = Math.max(0, 1 - CFG.drag * dt);
  let alive = 0;

  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (p.life <= 0) continue;
    p.life -= dt * 1000;
    if (p.life <= 0) continue;
    p.vx *= damp;
    p.vy = p.vy * damp + CFG.gravityY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const a = p.life / CFG.lifeMs; // linear fade to 0
    cctx.globalAlpha = a * a; // ease-out so they fade gently at the end
    cctx.fillStyle = `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`;
    cctx.beginPath();
    cctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    cctx.fill();
    alive++;
  }
  cctx.globalAlpha = 1;

  if (alive > 0) {
    raf = requestAnimationFrame(tick);
  } else {
    raf = 0;
    lastTs = 0;
  }
}
