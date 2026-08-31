/**
 * P1-T8 — one inline-SVG icon set (no icon-font, no raster). Single 2px stroke
 * weight, rounded caps/joins, 24×24 grid, `currentColor` so each icon inherits
 * the surrounding text colour (tint the coin with `text-gold`). Replaces the
 * loose emoji (🏆 📅 🔥 🎁 🪙 ⚙️ ⭐ 🔒 ▶ ✕) used across menus + HUD.
 */
import type { ReactNode, SVGProps } from "react";

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

function Svg({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function TrophyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a2 2 0 0 0 0 4h1" />
      <path d="M17 6h3a2 2 0 0 1 0 4h-1" />
      <path d="M12 14v3" />
      <path d="M8.5 20h7" />
      <path d="M10 17h4v3h-4z" />
    </Svg>
  );
}

export function BombIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10.5" cy="14" r="6.5" />
      <path d="M15 9.5l2-2" />
      <path d="M17.5 7.5l1.2-1.2" />
      <path d="M19.5 6.2l.8.3M18.2 4.5l.3.8" />
    </Svg>
  );
}

export function FreezeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5L4.2 16.5" />
      <path d="M12 6l2 2-2 2-2-2 2-2Z" opacity="0" />
    </Svg>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.5v3M16 3.5v3" />
    </Svg>
  );
}

export function FlameIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3s5 3.6 5 8.5A5 5 0 0 1 7 12c0-1.7.8-3 1.6-3.9C8.7 9.6 9.8 10 10.5 9c.8-1.2.2-3.4 1.5-6Z" />
    </Svg>
  );
}

export function GiftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 11.5h16V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-7.5Z" />
      <path d="M3 8.5h18v3H3z" />
      <path d="M12 8.5v12" />
      <path d="M12 8.5C11 6 9.5 5 8 5a2 2 0 0 0 0 3.5h4Z" />
      <path d="M12 8.5C13 6 14.5 5 16 5a2 2 0 0 1 0 3.5h-4Z" />
    </Svg>
  );
}

export function CoinIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
    </Svg>
  );
}

export function GearIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19" />
    </Svg>
  );
}

export function StarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 17.9l-5.25 2.65 1-5.85L3.5 9.7l5.9-.9L12 3.5Z" />
    </Svg>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2.5" />
    </Svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

/** Small filled check for completed objectives / equipped state. */
export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12.5 10 17.5 19.5 7" />
    </Svg>
  );
}
