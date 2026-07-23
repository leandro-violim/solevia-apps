/**
 * Placeholder ad slot fixed at the bottom of the screen.
 * Reserves the exact space a real AdMob banner will occupy after wrapping
 * this app with Capacitor for the App Store / Play Store.
 */
export function AdBanner() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center border-t border-border/60 bg-card/80 backdrop-blur-sm"
      style={{
        height: "72px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Advertisement placeholder"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="rounded border border-border px-1.5 py-0.5">Ad</span>
        <span>Banner ad space</span>
      </div>
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