// Screen-space juice for the play canvas: cap spin, motion trails, impact dust,
// and goal confetti + screen shake. This lives in the routes (UI) layer on
// purpose — it uses Math.random and wall-clock feel — so the deterministic
// `src/game/` core stays pure. Nothing here affects gameplay or physics.
//
// Two coordinate spaces are in play:
//   • trails + dust are drawn INSIDE the camera transform (base-screen space),
//     so they stay pinned to the pitch as the camera eases.
//   • confetti is drawn OUTSIDE the camera transform (final-screen space), so a
//     goal celebration rains over the whole viewport regardless of zoom.

type Ctx = CanvasRenderingContext2D;

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // seconds remaining
  ttl: number; // seconds total (for fade)
  size: number;
  color: string;
  rot: number;
  vrot: number;
  gravity: number;
};

export type FxState = {
  spin: Map<string, number>; // accumulated rotation angle per cap id
  prev: Map<string, { x: number; y: number }>; // prev base-screen pos per cap
  spd: Map<string, { vx: number; vy: number }>; // prev base-screen velocity per cap
  trails: Map<string, { x: number; y: number }[]>; // recent base-screen positions
  dust: Particle[];
  confetti: Particle[];
  shake: number; // current shake magnitude in css px; decays each frame
};

export const createFx = (): FxState => ({
  spin: new Map(),
  prev: new Map(),
  spd: new Map(),
  trails: new Map(),
  dust: [],
  confetti: [],
  shake: 0,
});

const CONFETTI_COLORS = [
  "#2f7bff",
  "#ff5a3c",
  "#ffcf33",
  "#1fb457",
  "#ff7a1a",
  "#a855f7",
  "#22d3ee",
  "#ffffff",
];

const TRAIL_LEN = 7;
const TRAIL_MIN_SPEED = 260; // px/s of base-screen motion before a trail shows
const DUST_MIN_SPEED = 420; // impact speed below which no dust puffs

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/**
 * Update per-cap spin + trail from this frame's motion, spawning impact dust on
 * a sudden slow-down or a bounce. Returns the spin angle to hand to drawCap.
 */
export const updateCapFx = (
  fx: FxState,
  id: string,
  sx: number,
  sy: number,
  radius: number,
  dt: number,
): number => {
  const prev = fx.prev.get(id);
  let vx = 0;
  let vy = 0;
  if (prev && dt > 0) {
    vx = (sx - prev.x) / dt;
    vy = (sy - prev.y) / dt;
  }
  const speed = Math.hypot(vx, vy);

  // Spin proportional to rolling speed, direction from the dominant axis.
  let angle = fx.spin.get(id) ?? 0;
  const dir = Math.abs(vx) > Math.abs(vy) ? Math.sign(vx) : Math.sign(vy) || 1;
  angle += (speed / Math.max(1, radius)) * dt * 0.9 * dir;
  fx.spin.set(id, angle);

  // Impact dust: a hard slow-down or a direction reversal while fast.
  const prevV = fx.spd.get(id);
  if (prevV) {
    const prevSpeed = Math.hypot(prevV.vx, prevV.vy);
    const dot = prevV.vx * vx + prevV.vy * vy;
    const hardStop = prevSpeed > DUST_MIN_SPEED && speed < prevSpeed * 0.55;
    const bounce = prevSpeed > DUST_MIN_SPEED && speed > DUST_MIN_SPEED && dot < 0;
    if (hardStop || bounce) spawnDust(fx, sx, sy, Math.min(1, prevSpeed / 2200));
  }
  fx.spd.set(id, { vx, vy });
  fx.prev.set(id, { x: sx, y: sy });

  // Motion trail (recent positions), only while genuinely moving.
  let trail = fx.trails.get(id);
  if (!trail) {
    trail = [];
    fx.trails.set(id, trail);
  }
  if (speed > TRAIL_MIN_SPEED) {
    trail.push({ x: sx, y: sy });
    while (trail.length > TRAIL_LEN) trail.shift();
  } else if (trail.length) {
    trail.shift(); // let the tail dissipate when it stops
  }
  return angle;
};

/** A small puff of ground dust at an impact point (base-screen space). */
export const spawnDust = (fx: FxState, x: number, y: number, intensity: number) => {
  const n = 4 + Math.floor(intensity * 5);
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(30, 90) * (0.5 + intensity);
    fx.dust.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 20,
      life: rand(0.25, 0.5),
      ttl: 0.5,
      size: rand(2, 5),
      color: "rgba(232,248,239,1)",
      rot: 0,
      vrot: 0,
      gravity: 60,
    });
  }
};

/** A celebratory confetti burst from (cx, cy) in final-screen space. */
export const spawnConfetti = (fx: FxState, cx: number, cy: number, count: number) => {
  for (let i = 0; i < count; i++) {
    const a = rand(-Math.PI * 0.85, -Math.PI * 0.15); // fan upward
    const sp = rand(220, 620);
    fx.confetti.push({
      x: cx + rand(-40, 40),
      y: cy + rand(-20, 20),
      vx: Math.cos(a) * sp + rand(-60, 60),
      vy: Math.sin(a) * sp,
      life: rand(1.1, 1.9),
      ttl: 1.9,
      size: rand(6, 12),
      color: CONFETTI_COLORS[Math.floor(rand(0, CONFETTI_COLORS.length))],
      rot: rand(0, Math.PI * 2),
      vrot: rand(-10, 10),
      gravity: 720,
    });
  }
};

/** Fire the full goal celebration: confetti rain + a screen-shake kick. */
export const goalCelebration = (fx: FxState, cssW: number, cssH: number) => {
  spawnConfetti(fx, cssW / 2, cssH * 0.34, 90);
  fx.shake = Math.max(fx.shake, 15);
};

const stepParticles = (arr: Particle[], dt: number) => {
  for (const p of arr) {
    p.life -= dt;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vrot * dt;
  }
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i].life <= 0) arr.splice(i, 1);
};

/** Advance all particles + decay the shake. Call once per frame. */
export const stepFx = (fx: FxState, dt: number) => {
  stepParticles(fx.dust, dt);
  stepParticles(fx.confetti, dt);
  fx.shake *= Math.pow(0.02, dt); // ~decays to near-zero in ~0.5s, framerate-independent
  if (fx.shake < 0.3) fx.shake = 0;
};

/** Current shake offset (call after stepFx). Random jitter within the magnitude. */
export const shakeOffset = (fx: FxState): { x: number; y: number } =>
  fx.shake > 0
    ? { x: rand(-fx.shake, fx.shake), y: rand(-fx.shake, fx.shake) }
    : { x: 0, y: 0 };

/** Draw one cap's motion trail as fading ghost discs (base-screen space). */
export const drawTrail = (ctx: Ctx, fx: FxState, id: string, radius: number, color: string) => {
  const trail = fx.trails.get(id);
  if (!trail || trail.length < 2) return;
  ctx.save();
  for (let i = 0; i < trail.length; i++) {
    const f = (i + 1) / trail.length; // older = smaller/fainter
    ctx.globalAlpha = 0.24 * f;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, radius * (0.5 + 0.4 * f), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

/** Draw dust puffs (base-screen space, inside the camera transform). */
export const drawDust = (ctx: Ctx, fx: FxState) => {
  ctx.save();
  for (const p of fx.dust) {
    ctx.globalAlpha = Math.max(0, (p.life / p.ttl) * 0.7);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

/** Draw confetti as tumbling rectangles (final-screen space). */
export const drawConfetti = (ctx: Ctx, fx: FxState) => {
  ctx.save();
  for (const p of fx.confetti) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.5));
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
    ctx.restore();
  }
  ctx.restore();
};
