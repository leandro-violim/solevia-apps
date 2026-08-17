// Pure canvas-2D drawing helpers for the "vibrant cartoon arcade" look.
// All functions work in SCREEN space (post pitch->screen projection).

import { type CapStyle } from "../caps/styles";

type Ctx = CanvasRenderingContext2D;
type Rect = { x: number; y: number; w: number; h: number };

export const ARCADE = {
  grassLight: "#46cf6d",
  grassDark: "#3cbb61",
  grassEdge: "#2f9e50",
  line: "#f6fff9",
  team: ["#2f7bff", "#ff5a3c"] as [string, string],
  teamRim: ["#a9cbff", "#ffb7a8"] as [string, string],
  teamShade: ["#1f57c8", "#d33f27"] as [string, string],
  keeper: "#ffc02e",
  keeperRim: "#ffe08a",
  keeperShade: "#d18a00",
  gold: "#ffcf33",
  post: "#ffffff",
  capStroke: "#0e2c1a",
  shadow: "rgba(10, 30, 18, 0.28)",
};

const roundRectPath = (ctx: Ctx, r: Rect, radius: number) => {
  // Degenerate rect (transient 1×1 canvas during first layout) → nothing to draw.
  if (r.w <= 0 || r.h <= 0) {
    ctx.beginPath();
    return;
  }
  const rad = Math.max(0, Math.min(radius, r.w / 2, r.h / 2));
  ctx.beginPath();
  ctx.moveTo(r.x + rad, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, rad);
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, rad);
  ctx.closePath();
};

/**
 * The pitch: mown grass stripes + a soft vignette + bold white markings
 * (border, halfway line, center circle/spot, penalty boxes + arcs), all
 * proportional to the screen rect so it's flip-agnostic (the rect is symmetric).
 * `scale` is pitch-units -> screen-pixels so line weights read consistently.
 */
export const drawPitch = (ctx: Ctx, r: Rect, scale: number) => {
  const radius = 18 * Math.max(0.5, scale);
  ctx.save();
  roundRectPath(ctx, r, radius);
  ctx.clip();

  // Mown vertical stripes.
  const stripes = 10;
  const sw = r.w / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? ARCADE.grassLight : ARCADE.grassDark;
    ctx.fillRect(r.x + i * sw, r.y, sw + 1, r.h);
  }
  // Soft top-down light + edge vignette for depth.
  const vg = ctx.createRadialGradient(
    r.x + r.w / 2,
    r.y + r.h * 0.35,
    r.h * 0.2,
    r.x + r.w / 2,
    r.y + r.h / 2,
    r.h * 0.95,
  );
  vg.addColorStop(0, "rgba(255,255,255,0.10)");
  vg.addColorStop(0.7, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(8,40,22,0.22)");
  ctx.fillStyle = vg;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();

  // Markings.
  const lw = Math.max(2, 3 * scale);
  ctx.save();
  ctx.strokeStyle = ARCADE.line;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  const inset = lw;
  roundRectPath(
    ctx,
    { x: r.x + inset, y: r.y + inset, w: r.w - inset * 2, h: r.h - inset * 2 },
    radius,
  );
  ctx.stroke();

  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  // Halfway line + center circle + spot.
  ctx.beginPath();
  ctx.moveTo(cx, r.y + inset);
  ctx.lineTo(cx, r.y + r.h - inset);
  ctx.stroke();
  const cr = r.h * 0.17;
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = ARCADE.line;
  ctx.beginPath();
  ctx.arc(cx, cy, lw * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Penalty boxes + arcs at each end.
  const boxW = r.w * 0.12;
  const boxH = r.h * 0.55;
  for (const left of [true, false]) {
    const bx = left ? r.x + inset : r.x + r.w - inset - boxW;
    const by = cy - boxH / 2;
    ctx.strokeRect(bx, by, boxW, boxH);
    // penalty spot
    const spotX = left ? r.x + r.w * 0.09 : r.x + r.w * 0.91;
    ctx.beginPath();
    ctx.arc(spotX, cy, lw * 0.8, 0, Math.PI * 2);
    ctx.fill();
    // arc
    ctx.beginPath();
    const a = r.h * 0.13;
    if (left) ctx.arc(bx + boxW, cy, a, -Math.PI / 2.4, Math.PI / 2.4);
    else ctx.arc(bx, cy, a, Math.PI - Math.PI / 2.4, Math.PI + Math.PI / 2.4);
    ctx.stroke();
  }
  ctx.restore();
};

/**
 * A goal: white/gold frame with posts and a hatched net, drawn in the outward
 * rect `g` (protruding beyond the pitch end line). `side` picks which vertical
 * edge is the mouth (open) vs the back of the net.
 */
export const drawGoal = (ctx: Ctx, g: Rect, side: "left" | "right", scale: number) => {
  const lw = Math.max(3, 4 * scale);
  ctx.save();
  // Net backing.
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRectPath(ctx, g, 6 * scale);
  ctx.fill();
  // Net hatch.
  ctx.save();
  roundRectPath(ctx, g, 6 * scale);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  const step = Math.max(7, 9 * scale);
  for (let x = g.x - g.h; x < g.x + g.w + g.h; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, g.y);
    ctx.lineTo(x + g.h, g.y + g.h);
    ctx.moveTo(x + g.h, g.y);
    ctx.lineTo(x, g.y + g.h);
    ctx.stroke();
  }
  ctx.restore();
  // Frame: top + bottom bars + the back post; the mouth (goal-line side) stays open.
  const backX = side === "left" ? g.x : g.x + g.w;
  ctx.strokeStyle = ARCADE.post;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + g.w, g.y);
  ctx.moveTo(g.x, g.y + g.h);
  ctx.lineTo(g.x + g.w, g.y + g.h);
  ctx.moveTo(backX, g.y);
  ctx.lineTo(backX, g.y + g.h);
  ctx.stroke();
  ctx.restore();
};

/**
 * A bottle-cap in a chosen style: drop shadow, crimped rim, radial-shaded body,
 * a style-specific top marking (crown dots / ribs / ring / nub), a shine, and a
 * bold outline. `selected` adds a pulsing gold ring.
 */
export const drawCap = (
  ctx: Ctx,
  x: number,
  y: number,
  radius: number,
  style: CapStyle,
  opts: { selected?: boolean; pulse?: number } = {},
) => {
  const r = radius;
  // Drop shadow.
  ctx.save();
  ctx.fillStyle = ARCADE.shadow;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.12, y + r * 0.42, r * 0.98, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Crimped rim + ridge ticks (crown caps get a finer flute).
  ctx.fillStyle = style.rim;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = style.shade;
  ctx.lineWidth = Math.max(1, r * 0.09);
  const ticks = style.pattern === "crown" ? 22 : 16;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }

  // Body (inset), radial-shaded.
  const br = r * 0.78;
  const grad = ctx.createRadialGradient(x - br * 0.35, y - br * 0.4, br * 0.15, x, y, br);
  grad.addColorStop(0, style.rim);
  grad.addColorStop(0.45, style.base);
  grad.addColorStop(1, style.shade);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, br, 0, Math.PI * 2);
  ctx.fill();

  // Style-specific top marking.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, br, 0, Math.PI * 2);
  ctx.clip();
  if (style.pattern === "ribbed") {
    ctx.strokeStyle = style.shade;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(1, r * 0.08);
    for (let i = -3; i <= 3; i++) {
      const rx = x + i * br * 0.28;
      ctx.beginPath();
      ctx.moveTo(rx, y - br);
      ctx.lineTo(rx, y + br);
      ctx.stroke();
    }
  } else if (style.pattern === "ring") {
    ctx.strokeStyle = style.top;
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, br * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style.pattern === "nub") {
    ctx.fillStyle = style.top;
    ctx.beginPath();
    ctx.arc(x, y, br * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else if (style.pattern === "crown") {
    ctx.fillStyle = style.top;
    const dots = 8;
    for (let i = 0; i < dots; i++) {
      const a = (i / dots) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * br * 0.58, y + Math.sin(a) * br * 0.58, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Shine.
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(x - br * 0.32, y - br * 0.38, br * 0.36, br * 0.22, -0.7, 0, Math.PI * 2);
  ctx.fill();

  // Bold outline.
  ctx.strokeStyle = ARCADE.capStroke;
  ctx.lineWidth = Math.max(1.5, r * 0.11);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  if (opts.selected) {
    const p = opts.pulse ?? 0;
    ctx.strokeStyle = ARCADE.gold;
    ctx.lineWidth = Math.max(2.5, r * 0.2);
    ctx.beginPath();
    ctx.arc(x, y, r + r * (0.28 + 0.1 * p), 0, Math.PI * 2);
    ctx.stroke();
  }
};

/** The keeper: a chunky amber puck with gloves + a bold outline. */
export const drawKeeper = (ctx: Ctx, x: number, y: number, radius: number) => {
  const r = radius;
  ctx.save();
  ctx.fillStyle = ARCADE.shadow;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.12, y + r * 0.42, r * 0.98, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
  grad.addColorStop(0, ARCADE.keeperRim);
  grad.addColorStop(0.5, ARCADE.keeper);
  grad.addColorStop(1, ARCADE.keeperShade);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Gloves: two small pads left/right.
  ctx.fillStyle = "#fff4d6";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + s * r * 0.62, y, r * 0.34, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = ARCADE.keeperShade;
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
};
