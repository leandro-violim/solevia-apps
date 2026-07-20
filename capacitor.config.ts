import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for wrapping this web app into iOS + Android binaries.
 * Not used by the web build. See NATIVE.md for the wrap workflow.
 */
const config: CapacitorConfig = {
  appId: "com.bubblepop.calm",
  appName: "Bubble Pop Calm",
  webDir: "dist",
  ios: {
    contentInset: "always",
  },
  android: {
    backgroundColor: "#e6f7f5",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;