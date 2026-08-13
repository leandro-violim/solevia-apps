import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for wrapping this web app into iOS + Android binaries.
 * Not used by the web build. See NATIVE.md for the wrap workflow.
 */
const config: CapacitorConfig = {
  appId: "app.solevia.capkickers",
  appName: "Cap Kickers",
  // Folder Capacitor copies into the native apps. It must contain the static
  // `index.html` shell produced by the mobile SPA build:
  //   bun run build:mobile      (uses vite.config.mobile.ts)
  // That build emits the static site into `dist/client`.
  // VERIFY after your first `bun run build:mobile`:
  //   find dist -name index.html
  // and set webDir to whichever folder contains index.html if it differs.
  webDir: "dist/client",
  ios: {
    // "never" = the web view owns the full screen (edge to edge). The app draws
    // into the safe areas itself via CSS env(safe-area-inset-*), so the WKWebView
    // must NOT add its own content insets — "always" double-insets the content and
    // makes every screen slightly taller than the viewport, which is what caused
    // the stray scroll on all screens.
    contentInset: "never",
  },
  android: {
    backgroundColor: "#0f6b3a",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
