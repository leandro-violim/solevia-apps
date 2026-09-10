/**
 * Game-style shell components (Project C, v1.3) — reusable, render-layer-only
 * pieces used by the Home, world/phase map and menus. Visual styling lives in
 * the ".gs-*" classes in styles.css; these components own structure + assets.
 * See store-assets/PROJECT-C-DESIGN.md §11.
 */
import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { t } from "../lib/i18n";
import { CoinBalance } from "./CoinBalance";
import { AdBanner, AdBannerSpacer } from "./AdBanner";
import wrapSheet from "../assets/scene/wrap-sheet.webp";
import poppedSprite from "../assets/bubbles/real-bubble-popped.webp";
import mascotIdle from "../assets/shell/mascot-idle.webp";
import mascotCheer from "../assets/shell/mascot-cheer.webp";
import islandTrees from "../assets/shell/island-trees.webp";
import islandHex from "../assets/shell/island-hex.webp";
import nodeDone from "../assets/shell/node-done.webp";
import nodeCurrent from "../assets/shell/node-current.webp";
import nodeLocked from "../assets/shell/node-locked.webp";
import sky from "../assets/scene/sky.webp";

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
      {plus && (
        <span className="gs-pill__plus" aria-hidden>
          +
        </span>
      )}
      <span aria-hidden style={{ fontSize: 15 }}>
        {icon}
      </span>
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
  const tile = state === "done" ? nodeDone : state === "current" ? nodeCurrent : nodeLocked;
  return (
    <div className={`gs-node is-${state}`} style={{ width: size, height: size, ...style }}>
      {state === "current" && hereLabel && <span className="gs-node__here">{hereLabel}</span>}
      <img
        src={tile}
        alt=""
        aria-hidden
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
      {state === "current" && (
        <span
          className="gs-node__num"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            paddingTop: "12%",
          }}
        >
          {n}
        </span>
      )}
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

/* 8 — Mascot (bubble-buddy): idle or cheering (arms up) */
export function Mascot({
  size = 76,
  variant = "idle",
  className = "",
  style,
}: {
  size?: number;
  variant?: "idle" | "cheer";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={variant === "cheer" ? mascotCheer : mascotIdle}
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
      style={{
        width,
        border: 0,
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        ...style,
      }}
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
      <Link
        to="/shop"
        className="gs-nav__btn"
        aria-label={t("home.shop")}
        aria-current={active === "shop" ? "page" : undefined}
      >
        🛍️
      </Link>
      <Link
        to="/records"
        className="gs-nav__btn"
        aria-label={t("home.viewRecords")}
        aria-current={active === "records" ? "page" : undefined}
      >
        📊
      </Link>
      <Link
        to="/"
        className="gs-nav__btn gs-nav__btn--home"
        aria-label={t("home.title")}
        aria-current={active === "home" ? "page" : undefined}
      >
        🫧
      </Link>
      <Link
        to="/achievements"
        className="gs-nav__btn"
        aria-label={t("home.achievements")}
        aria-current={active === "achievements" ? "page" : undefined}
      >
        🏆
      </Link>
      <Link
        to="/settings"
        className="gs-nav__btn"
        aria-label={t("nav.settings")}
        aria-current={active === "settings" ? "page" : undefined}
      >
        ⚙️
      </Link>
    </nav>
  );
}

/* Game-style screen shell: sky background + sticky header (back · title · coins)
   + scrollable content + optional bottom nav + ad. Used by the menu screens. */
export function ScreenShell({
  title,
  children,
  nav,
  back = "/",
  coins = true,
  ad = true,
}: {
  title: string;
  children: ReactNode;
  nav?: "shop" | "records" | "home" | "achievements" | "settings";
  back?: string;
  coins?: boolean;
  ad?: boolean;
}) {
  return (
    <div
      className="gs-home screen-fade relative flex min-h-dvh flex-col"
      style={{
        backgroundImage: `url(${sky})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <header
        className="gs-topwash sticky top-0 z-20 flex items-center gap-2 px-3 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <Link
          to={back}
          aria-label={t("home.title")}
          className="gs-nav__btn"
          style={{ width: 42, height: 42 }}
        >
          ←
        </Link>
        <h1 className="text-lg font-extrabold" style={{ color: "var(--gs-ink)" }}>
          {title}
        </h1>
        {coins && (
          <Link to="/shop" aria-label={t("home.shop")} className="ml-auto">
            <ResourcePill icon="🪙" plus>
              <CoinBalance />
            </ResourcePill>
          </Link>
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 pb-6">{children}</main>

      {nav && <BottomNav active={nav} />}
      {ad && (
        <>
          <AdBannerSpacer />
          <AdBanner />
        </>
      )}
    </div>
  );
}

/* Ambient CSS float bubble (no image) */
export function FloatBubble({ size, style }: { size: number; style?: CSSProperties }) {
  return <span className="gs-float" aria-hidden style={{ width: size, height: size, ...style }} />;
}
