/**
 * An opaque strip pinned over the OS status-bar (safe-area) region. On scrollable
 * text pages (About / Privacy / Terms) the whole page scrolls, so without this the
 * text rides up UNDER the transparent status bar and collides with the clock /
 * battery / notch. This masks that region with the app background so the status
 * bar stays readable and nothing scrolls into it.
 */
export function StatusBarCover() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50"
      style={{
        height: "env(safe-area-inset-top)",
        background: "var(--bg-0)",
      }}
    />
  );
}
