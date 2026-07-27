import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for wrapping this web app into iOS + Android binaries.
 * Not used by the web build. See NATIVE.md for the wrap workflow.
 */
const config: CapacitorConfig = {
  appId: "app.solevia.zenbubbles",
  appName: "Zen Bubbles",
  // Folder Capacitor copies into the native apps. It must contain the static
  // `index.html` shell produced by the mobile SPA build:
  //   bun run build:mobile      (uses vite.config.mobile.ts)
  // That build emits the static site into `dist/client`.
  // VERIFY after your first `bun run build:mobile`:
  //   find dist -name index.html
  // and set webDir to whichever folder contains index.html if it differs.
  webDir: "dist/client",
  ios: {
    contentInset: "always",
  },
  android: {
    backgroundColor: "#171326",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
