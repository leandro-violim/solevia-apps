/**
 * Game-style shell components (Project C, v1.3) — reusable, render-layer-only
 * pieces used by the Home, world/phase map and menus. Visual styling lives in
 * the ".gs-*" classes in styles.css; these components own structure + assets.
 * See store-assets/PROJECT-C-DESIGN.md §11.
 */
import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { t } from "../lib/i18n";
import wrapSheet from "../assets/scene/wrap-sheet.webp";
import poppedSprite from "../assets/bubbles/real-bubble-popped.webp";
import mascotIdle from "../assets/shell/mascot-idle.webp";
import islandTrees from "../assets/shell/island-trees.webp";
import islandHex from "../assets/shell/island-hex.webp";

/* 1 — Glossy primary button (actions). Navigation uses <Link className="gs-btn">. */
export function GlossyButton({
  children,
  onClick,
  hero = false,
  className = "",
  style,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  hero?: boolean;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`gs-btn ${hero ? "gs-btn--hero" : ""} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

/* 2 — Icon tile */
export function IconTile({
  children,
  variant = "purple",
  badge,
  size = 70,
  className = "",
  style,
}: {
  children: ReactNode;
  variant?: "purple" | "blue" | "pink" | "gold";
  badge?: ReactNode;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const v = variant === "purple" ? "" : `gs-tile--${variant}`;
  return (
    <div
      className={`gs-tile ${v} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42, ...style }}
    >
      {children}
      {badge != null && <span className="gs-tile__badge">{badge}</span>}
    </div>
  );
}

/* 3 — Resource pill */
export function ResourcePill({
  icon,
  children,
  plus = false,
  className = "",
}: {
  icon: ReactNode;
  children: ReactNode;
  plus?: boolean;
  className?: string;
}) {
  return (
    <span className={`gs-pill ${className}`}>
      {plus && <span className="gs-pill__plus" aria-hidden>+</span>}
      <span aria-hidden style={{ fontSize: 15 }}>{icon}</span>
      {children}
    </span>
  );
}

/* 4 — Hex map node */
export function HexNode({
  n,
  state = "locked",
  hereLabel,
  size = 54,
  style,
}: {
  n: number;
  state?: "done" | "current" | "locked";
  hereLabel?: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div className={`gs-node is-${state}`} style={{ width: size, height: size, ...style }}>
      {state === "current" && <span className="gs-node__glow" aria-hidden />}
      {state === "current" && hereLabel && <span className="gs-node__here">{hereLabel}</span>}
      <span className="gs-hex" aria-hidden />
      <span className="gs-node__num">{state === "done" ? "★" : state === "locked" ? "🔒" : n}</span>
    </div>
  );
}

/* 7 — Island (real bubble-wrap platform) */
export function Island({
  variant = "trees",
  width = 220,
  className = "",
  style,
}: {
  variant?: "trees" | "hex";
  width?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={variant === "hex" ? islandHex : islandTrees}
      alt=""
      aria-hidden
      className={`gs-island ${className}`}
      style={{ width, height: "auto", ...style }}
    />
  );
}

/* 8 — Mascot (bubble-buddy) */
export function Mascot({
  size = 76,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={mascotIdle}
      alt=""
      aria-hidden
      className={`gs-mascot ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  );
}

/* 6 — Bubble-wrap teaser: a real sheet with a few bubbles auto-popping on a
   loop (reduced-motion → static via the global guard in styles.css). */
export function WrapTeaser({
  ribbon,
  onClick,
  width = 150,
  className = "",
  style,
}: {
  ribbon: string;
  onClick?: () => void;
  width?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const spots = [
    { top: "24%", left: "20%", delay: "0s" },
    { top: "58%", left: "38%", delay: "1.5s" },
    { top: "32%", left: "68%", delay: "2.6s" },
    { top: "70%", left: "74%", delay: "0.8s" },
    { top: "74%", left: "24%", delay: "3.4s" },
  ];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ribbon}
      className={`gs-teaser ${className}`}
      style={{ width, border: 0, background: "transparent", padding: 0, cursor: "pointer", ...style }}
    >
      <div
        className="gs-teaser__patch"
        style={{ height: width * 0.78, backgroundImage: `url(${wrapSheet})` }}
      >
        {spots.map((s, i) => (
          <span
            key={i}
            className="gs-popspot"
            aria-hidden
            style={{
              top: s.top,
              left: s.left,
              animationDelay: s.delay,
              backgroundImage: `url(${poppedSprite})`,
            }}
          />
        ))}
      </div>
      <span className="gs-ribbon">{ribbon}</span>
    </button>
  );
}

/* 5 — Bottom nav (5 tabs, raised green Home in the centre) */
export function BottomNav({
  active = "home",
  height = 64,
}: {
  active?: "shop" | "records" | "home" | "achievements" | "settings";
  height?: number;
}) {
  return (
    <nav className="gs-nav" style={{ height }} aria-label={t("nav.settings")}>
      <Link to="/shop" className="gs-nav__btn" aria-label={t("home.shop")}
        aria-current={active === "shop" ? "page" : undefined}>🛍️</Link>
      <Link to="/records" className="gs-nav__btn" aria-label={t("home.viewRecords")}
        aria-current={active === "records" ? "page" : undefined}>📊</Link>
      <Link to="/" className="gs-nav__btn gs-nav__btn--home" aria-label={t("home.title")}
        aria-current={active === "home" ? "page" : undefined}>🫧</Link>
      <Link to="/achievements" className="gs-nav__btn" aria-label={t("home.achievements")}
        aria-current={active === "achievements" ? "page" : undefined}>🏆</Link>
      <Link to="/settings" className="gs-nav__btn" aria-label={t("nav.settings")}
        aria-current={active === "settings" ? "page" : undefined}>⚙️</Link>
    </nav>
  );
}

/* Ambient CSS float bubble (no image) */
export function FloatBubble({ size, style }: { size: number; style?: CSSProperties }) {
  return <span className="gs-float" aria-hidden style={{ width: size, height: size, ...style }} />;
}
