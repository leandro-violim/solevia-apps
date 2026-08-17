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

const TAU = Math.PI * 2;

// Trace a scalloped circle (a crimped bottle-cap edge): radius ripples `bumps`
// times by ±amp. Leaves the path open for fill/stroke.
const scallopPath = (ctx: Ctx, x: number, y: number, base: number, amp: number, bumps: number) => {
  const steps = bumps * 6;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TAU;
    const rr = base + amp * Math.cos(bumps * a);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
};

/**
 * A realistic bottle-cap in a chosen style: soft shadow, a crimped scalloped
 * metal edge with grooves, a liner ring, a domed glossy top (radial shade +
 * specular highlight), an embossed style marking, and a bold outline.
 * `selected` adds a pulsing gold ring.
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
  const crown = style.pattern === "crown";
  const bumps = crown ? 21 : 30;
  const amp = r * (crown ? 0.075 : 0.05);

  // Contact shadow.
  ctx.save();
  ctx.fillStyle = ARCADE.shadow;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.5, r * 1.02, r * 0.72, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Crimped scalloped metal edge, lit by a directional metallic gradient.
  scallopPath(ctx, x, y, r - amp, amp, bumps);
  const edge = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  edge.addColorStop(0, style.rim);
  edge.addColorStop(0.5, style.base);
  edge.addColorStop(1, style.shade);
  ctx.fillStyle = edge;
  ctx.fill();
  // Crimp grooves (one dark radial line per flute).
  ctx.strokeStyle = "rgba(0,0,0,0.26)";
  ctx.lineWidth = Math.max(0.6, r * 0.03);
  for (let i = 0; i < bumps; i++) {
    const a = ((i + 0.5) / bumps) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r - amp * 2.2), y + Math.sin(a) * (r - amp * 2.2));
    ctx.lineTo(x + Math.cos(a) * (r + amp * 0.2), y + Math.sin(a) * (r + amp * 0.2));
    ctx.stroke();
  }
  // Edge outline.
  scallopPath(ctx, x, y, r - amp, amp, bumps);
  ctx.strokeStyle = ARCADE.capStroke;
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();

  // Liner ring (inner boundary of the crimp).
  const br = r * 0.74;
  ctx.beginPath();
  ctx.arc(x, y, br + r * 0.06, 0, TAU);
  ctx.strokeStyle = "rgba(0,0,0,0.16)";
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();

  // Domed glossy top.
  const dome = ctx.createRadialGradient(x - br * 0.42, y - br * 0.46, br * 0.08, x, y, br * 1.06);
  dome.addColorStop(0, style.rim);
  dome.addColorStop(0.42, style.base);
  dome.addColorStop(1, style.shade);
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.arc(x, y, br, 0, TAU);
  ctx.fill();

  // Embossed style marking (drawn with a faint dark offset for a stamped look).
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, br, 0, TAU);
  ctx.clip();
  const emboss = (draw: (dx: number, dy: number, color: string) => void) => {
    draw(0, r * 0.03, "rgba(0,0,0,0.22)");
    draw(0, 0, style.top);
  };
  if (style.pattern === "ribbed") {
    for (let i = -3; i <= 3; i++) {
      const rx = x + i * br * 0.3;
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = Math.max(1, r * 0.07);
      ctx.beginPath();
      ctx.moveTo(rx, y - br);
      ctx.lineTo(rx, y + br);
      ctx.stroke();
    }
  } else if (style.pattern === "ring") {
    emboss((dx, dy, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, r * 0.11);
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, br * 0.52, 0, TAU);
      ctx.stroke();
    });
  } else if (style.pattern === "nub") {
    emboss((dx, dy, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, br * 0.32, 0, TAU);
      ctx.fill();
    });
  } else if (style.pattern === "crown") {
    emboss((dx, dy, color) => {
      ctx.fillStyle = color;
      const dots = 8;
      for (let i = 0; i < dots; i++) {
        const a = (i / dots) * TAU;
        ctx.beginPath();
        ctx.arc(x + dx + Math.cos(a) * br * 0.56, y + dy + Math.sin(a) * br * 0.56, r * 0.085, 0, TAU);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r * 0.11, 0, TAU);
      ctx.fill();
    });
  }
  ctx.restore();

  // Specular highlight (soft sheen + a sharp glint).
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(x - br * 0.34, y - br * 0.4, br * 0.34, br * 0.19, -0.7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(x - br * 0.42, y - br * 0.47, br * 0.11, br * 0.06, -0.7, 0, TAU);
  ctx.fill();

  if (opts.selected) {
    const p = opts.pulse ?? 0;
    ctx.strokeStyle = ARCADE.gold;
    ctx.lineWidth = Math.max(2.5, r * 0.2);
    scallopPath(ctx, x, y, r + r * (0.24 + 0.09 * p), amp, bumps);
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
