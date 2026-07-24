// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
// NOTE: The static build used to wrap this app with Capacitor lives in a
// separate config, `vite.config.mobile.ts` (run via `bun run build:mobile`).
// It bypasses the Lovable Cloudflare preset — which breaks SPA prerendering —
// and emits a static SPA into `dist/client` for the native shell. This web
// config stays as-is so the normal web build/deploy is unaffected.
