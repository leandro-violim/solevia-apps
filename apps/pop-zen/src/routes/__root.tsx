import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { initAds, showBanner, hideBanner } from "../lib/ads";
import { initAnalytics, track, logScreenView, setUserProps } from "../lib/analytics";
import { LANG } from "../lib/i18n";
import { AchievementToast } from "../components/AchievementToast";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      // viewport-fit=cover is REQUIRED for env(safe-area-inset-*) to return real
      // values. Without it those insets are 0, so with the edge-to-edge web view
      // (ios.contentInset "never") the header draws under the status bar / notch.
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Zen Bubbles" },
      {
        name: "description",
        content: "A calming bubble-wrap popping game with soothing phases of shrinking bubbles.",
      },
      { property: "og:title", content: "Zen Bubbles" },
      {
        property: "og:description",
        content: "Relax and pop plastic bubbles across soothing phases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0B1020" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Routes where the bottom banner must be HIDDEN — full-screen moments whose
// bottom buttons would otherwise sit under the native banner overlay (the AdMob
// "Google-served ads obscuring content" fix). Add future full-screen dialogs here.
const BANNER_HIDDEN_ROUTES = new Set<string>(["/finish"]);

// Map a route pathname to a stable GA4 screen_name for navigation analysis.
const SCREEN_NAMES = new Set([
  "map",
  "play",
  "finish",
  "shop",
  "settings",
  "records",
  "achievements",
  "about",
  "privacy",
  "terms",
]);
function screenNameFor(pathname: string): string {
  if (pathname === "/") return "home";
  const seg = pathname.replace(/^\//, "").split("/")[0];
  return SCREEN_NAMES.has(seg) ? seg : seg || "home";
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [adsReady, setAdsReady] = useState(false);

  // Initialize AdMob once (no-op on web/dev). Banner show/hide is driven by the
  // route below, not here, so full-screen routes can suppress it.
  useEffect(() => {
    // P1-T6: load Firebase off the critical path (idle), then mark ready.
    initAnalytics();
    track("game_ready");
    setUserProps({ app_language: LANG }); // segment the LatAm launch (pt/es/en)
    let cancelled = false;
    (async () => {
      await initAds();
      if (!cancelled) setAdsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // GA4 navigation tracking: one screen_view per route change (deduped in
  // logScreenView), so Path/Funnel explorations can see how users move.
  useEffect(() => {
    logScreenView(screenNameFor(pathname));
  }, [pathname]);

  // Show the banner on normal screens; hide it on full-screen routes (Finish)
  // so no button/CTA is ever covered. Idempotent (see ads.ts), so re-running on
  // every navigation is cheap. No-op on web/dev.
  useEffect(() => {
    if (!adsReady) return;
    if (BANNER_HIDDEN_ROUTES.has(pathname)) void hideBanner();
    else void showBanner();
  }, [adsReady, pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <AchievementToast />
    </QueryClientProvider>
  );
}
