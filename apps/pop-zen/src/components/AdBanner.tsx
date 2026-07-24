import { Capacitor } from "@capacitor/core";

/**
 * Ad slot. On native it reserves the space the real AdMob banner (a native
 * view pinned to the bottom of the screen) draws over. On web/dev it shows a
 * labeled placeholder so the layout is visible while developing.
 *
 * Two layout modes:
 *  - default (fixed): pinned to the bottom of the viewport. Use on scrollable
 *    screens (records, privacy, …) so it stays in view; pair with <AdBannerSpacer/>.
 *  - inline: rendered in normal document flow as the last item of a full-height
 *    flex column. Use on the play screen so the play field sizes itself to the
 *    space ABOVE the banner and bubbles can never be covered by it — no
 *    safe-area math required.
 */
export function AdBanner({ inline = false }: { inline?: boolean }) {
  return (
    <div
      className={
        (inline ? "relative shrink-0 " : "fixed inset-x-0 bottom-0 z-40 ") +
        "flex items-center justify-center border-t border-border/60 bg-card/80 backdrop-blur-sm"
      }
      style={{
        // content-box so the banner's total footprint is the full 72px plus the
        // home-indicator safe area — the space a real AdMob banner needs.
        boxSizing: "content-box",
        height: "72px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Advertisement"
    >
      {/* The label only shows on web/dev. On native the AdMob banner covers
          this area, so we leave it empty (just the reserved space). */}
      {!Capacitor.isNativePlatform() && (
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="rounded border border-border px-1.5 py-0.5">Ad</span>
          <span>Banner ad space</span>
        </div>
      )}
    </div>
  );
}

/** Spacer to keep content clear of the fixed banner. */
export function AdBannerSpacer() {
  return (
    <div
      aria-hidden
      style={{
        height: "calc(72px + env(safe-area-inset-bottom))",
      }}
    />
  );
}