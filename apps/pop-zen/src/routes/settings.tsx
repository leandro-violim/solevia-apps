import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_VERSION, useSoundSetting } from "../lib/settings";
import { usePhaseRecords } from "../lib/records";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Zen Bubbles" },
      {
        name: "description",
        content:
          "Adjust sound, reset your records, and view app version for Zen Bubbles.",
      },
      { property: "og:title", content: "Settings — Zen Bubbles" },
      {
        property: "og:description",
        content: "Sound, records, and app info.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { enabled, toggle } = useSoundSetting();
  const { reset } = usePhaseRecords();

  return (
    <main
      className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground">
          ← Home
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <div className="w-10" />
      </header>

      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Pop sound</div>
            <div className="text-xs text-muted-foreground">
              Play a soft pop when a bubble bursts.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => toggle(!enabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              enabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Motion is reduced automatically when your device has "Reduce Motion"
          turned on in accessibility settings.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="text-sm font-medium text-foreground">Your data</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Records are stored only on this device. Resetting cannot be undone.
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                "Reset all records? This will erase your best scores and times for every phase. This cannot be undone.",
              )
            ) {
              reset();
              alert("Records reset.");
            }
          }}
          className="mt-3 w-full rounded-full border border-rose-300 bg-background py-3 text-sm font-medium text-rose-600"
        >
          Reset records
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="text-sm font-medium text-foreground">About</div>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <Link to="/about" className="text-primary underline">
              About & Support
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link to="/terms" className="text-primary underline">
              Terms of Use
            </Link>
          </li>
        </ul>
        <div className="mt-4 text-[11px] text-muted-foreground">
          Zen Bubbles · v{APP_VERSION}
        </div>
      </section>
    </main>
  );
}