// Standalone build config used ONLY to produce the static SPA bundle that
// Capacitor wraps into iOS / Android binaries. Run it with:
//
//   bun run build:mobile
//
// Why a separate config? The app's normal web build (vite.config.ts) uses
// Lovable's TanStack Start setup, which targets Cloudflare (an SSR server).
// A Capacitor WebView can't run a server — it loads static files off disk —
// and the Cloudflare preset also breaks TanStack Start's SPA prerender step
// (it looks for the server at `dist/server/...`, which the Cloudflare preset
// never creates). This config uses the plain TanStack Start Vite plugin with
// SPA mode enabled, which prerenders a single static `index.html` shell that
// boots the client-side router. The game is 100% client-side (records live in
// localStorage, no server functions), so nothing is lost by shipping it as a
// static SPA. Output lands in `dist/client` — that's what capacitor.config.ts
// points `webDir` at.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          outputPath: "index.html",
          crawlLinks: false,
        },
      },
    }),
    viteReact(),
  ],
  build: {
    outDir: "dist",
  },
});
