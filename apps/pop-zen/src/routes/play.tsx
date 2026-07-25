import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { z } from "zod";
import { AdBanner } from "../components/AdBanner";
import { showInterstitial, preloadInterstitial } from "../lib/ads";
import { Bubble } from "../components/Bubble";
import { VideoAdPlaceholder } from "../components/VideoAdPlaceholder";
import { computeScore, formatTime, getPhase, TOTAL_PHASES } from "../lib/game-config";
import { playPop, unlockAudio } from "../lib/pop-sound";
import {
  usePhaseRecords,
  resetRun,
  recordRunPhase,
  getRunTotal,
  commitRunTotal,
} from "../lib/records";
import { pickQuote } from "../lib/quotes";

const searchSchema = z.object({
  phase: z.number().int().min(1).max(TOTAL_PHASES).optional().default(1),
});

export const Route = createFileRoute("/play")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Play — Zen Bubbles" },
      { name: "description", content: "Pop plastic bubbles to relax. Beat your best time each phase." },
      { property: "og:title", content: "Play — Zen Bubbles" },
      { property: "og:description", content: "Pop plastic bubbles to relax." },
    ],
  }),
  component: PlayPage,
});

type BubbleState = { id: number; x: number; y: number; size: number; drift: number; popped: boolean };

function layoutBubbles(
  count: number,
  size: number,
  width: number,
  height: number,
): BubbleState[] {
  const padding = 6;
  const step = size + padding;
  const cols = Math.max(1, Math.floor(width / step));
  const rows = Math.max(1, Math.ceil(count / cols));

  // Spread the bubbles across the whole play area instead of clustering them
  // in a centered block (which left large empty margins on tall phones,
  // especially on the early phases with few, large bubbles). Each bubble is
  // centered inside its own grid cell. If the field is too small to give every
  // bubble a cell at least `size` wide/tall, fall back to tight centered
  // packing so bubbles never overlap.
  const cellW = width / cols;
  const cellH = height / rows;
  const spread = cellW >= size && cellH >= size;

  const totalW = cols * step - padding;
  const totalH = rows * step - padding;
  const offsetX = Math.max(0, (width - totalW) / 2);
  const offsetY = Math.max(0, (height - totalH) / 2);

  const bubbles: BubbleState[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Center the final (possibly partial) row for a tidier look.
    const rowCount = Math.min(cols, count - row * cols);
    const rowIndent = spread ? ((cols - rowCount) * cellW) / 2 : 0;
    // Slight jitter so it doesn't look like a rigid grid
    const jitterX = (Math.random() - 0.5) * padding * 0.8;
    const jitterY = (Math.random() - 0.5) * padding * 0.8;
    bubbles.push({
      id: i,
      x: spread
        ? rowIndent + col * cellW + (cellW - size) / 2 + jitterX
        : offsetX + col * step + jitterX,
      y: spread
        ? row * cellH + (cellH - size) / 2 + jitterY
        : offsetY + row * step + jitterY,
      size,
      drift: Math.random() * 3,
      popped: false,
    });
  }
  return bubbles;
}

/**
 * Usable height (in px) for laying out bubbles inside the play field.
 *
 * On web this is just the field's own height (the DOM banner reserves its space).
 *
 * On native the AdMob banner is a native overlay and the web container reports
 * itself as full-screen-tall, so "field height minus a bit" isn't reliable. We
 * instead anchor to the ACTUAL visible viewport bottom (`visualViewport.height`)
 * minus a fixed reserve for the banner + home-indicator safe area. Because it's
 * measured from the visible viewport, it doesn't matter if the web view is
 * taller than the screen — the bottom row always lands above the banner.
 */
function usableFieldHeight(el: HTMLElement): number {
  if (!Capacitor.isNativePlatform() || typeof window === "undefined") {
    return el.clientHeight;
  }

  const rect = el.getBoundingClientRect();
  const vpH = window.visualViewport?.height ?? window.innerHeight;

  // Home-indicator safe area.
  let safe = 0;
  try {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom);pointer-events:none;";
    document.body.appendChild(probe);
    safe = probe.getBoundingClientRect().height;
    probe.remove();
  } catch {
    safe = 0;
  }

  // Real banner height when known (published by ads.ts), min 100px ("large"
  // banner) so nothing is clipped before the banner reports its size.
  const cssVar = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--ad-banner-h"),
  );
  const banner = Math.max(Number.isFinite(cssVar) ? cssVar : 0, 100);

  const reserve = banner + safe + 16; // + small breathing gap
  return Math.max(160, vpH - reserve - rect.top);
}

function PlayPage() {
  const { phase } = Route.useSearch();
  const navigate = useNavigate({ from: "/play" });
  const cfg = getPhase(phase);
  const { submit, records } = usePhaseRecords();

  const fieldRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [state, setState] = useState<"ready" | "playing" | "done" | "ad">("ready");
  const [result, setResult] = useState<{ score: number; timeMs: number } | null>(null);
  // Guards the phase-complete handler so the score is submitted exactly once,
  // even though React re-runs state updaters/effects in dev (StrictMode).
  const settledRef = useRef(false);

  // Build field for this phase
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = usableFieldHeight(el);
    setBubbles(layoutBubbles(cfg.bubbles, cfg.size, w, h));
    setStartAt(null);
    setElapsed(0);
    setState("ready");
    setResult(null);
    settledRef.current = false;
    // Entering phase 1 starts a brand-new full-run total.
    if (phase === 1) resetRun();
    // Warm up the interstitial now so it's ready (if online) by phase end.
    void preloadInterstitial();
  }, [phase, cfg.bubbles, cfg.size]);

  // Re-lay-out the field when the native ad banner reports its real height,
  // so bubbles clear it exactly. Only while "ready" so an in-progress game
  // isn't disturbed.
  useEffect(() => {
    const onResize = () => {
      const el = fieldRef.current;
      if (!el || state !== "ready") return;
      setBubbles(
        layoutBubbles(cfg.bubbles, cfg.size, el.clientWidth, usableFieldHeight(el)),
      );
    };
    window.addEventListener("ad-banner-resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("ad-banner-resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [state, cfg.bubbles, cfg.size]);

  // Timer
  useEffect(() => {
    if (state !== "playing" || startAt === null) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startAt), 100);
    return () => window.clearInterval(id);
  }, [state, startAt]);

  const handlePop = useCallback(
    (id: number) => {
      if (state === "ready") {
        unlockAudio();
        setStartAt(Date.now());
        setState("playing");
      }
      playPop();
      // Pure state update only — no side effects here, so React re-running this
      // updater (StrictMode/concurrent) can't submit the score twice.
      setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)));
    },
    [state],
  );

  // Detect phase completion once the field is cleared, and record it exactly
  // once. Kept out of the pop handler's updater so it can't double-submit.
  useEffect(() => {
    if (state !== "playing" || settledRef.current) return;
    if (bubbles.length === 0 || bubbles.some((b) => !b.popped)) return;
    settledRef.current = true;
    const t = startAt !== null ? Date.now() - startAt : elapsed;
    const score = computeScore(cfg.bubbles, t);
    setElapsed(t);
    setResult({ score, timeMs: t });
    submit(phase, score, t);
    // Accumulate this phase's score into the current full-run total.
    recordRunPhase(phase, score);
    setState("done");
  }, [bubbles, state, startAt, elapsed, cfg.bubbles, phase, submit]);

  const record = records[phase];
  const isLast = phase >= TOTAL_PHASES;
  // Ad gating: show the video ad only after phases 2, 4, and the finale.
  // Full-screen ads on every phase get flagged by app store reviewers as
  // disruptive; every-other-phase pacing is the common accepted pattern.
  const showAdOnFinish = isLast || phase % 2 === 0;
  const isNewBestScore = !!result && result.score > (record?.prevBestScore ?? 0);
  const isNewBestTime =
    !!result &&
    ((record?.prevBestTimeMs ?? 0) === 0 || result.timeMs < (record?.prevBestTimeMs ?? 0));
  // Stable per-run quote for the phase-5 finale.
  const finaleQuote = useMemo(
    () => (isLast && result ? pickQuote(result.score + result.timeMs) : ""),
    [isLast, result],
  );
  // Skip idle float animation on the densest phase to save CPU/battery.
  const stillBubbles = cfg.bubbles >= 60;

  const nextPhase = useCallback(() => {
    navigate({ to: "/play", search: { phase: Math.min(phase + 1, TOTAL_PHASES) } });
  }, [navigate, phase]);

  // End of the 5-phase run: total up every phase, compare to the all-time best,
  // and send the player to the celebration / encouragement screen.
  const goFinish = useCallback(() => {
    const total = getRunTotal();
    const { beat, prevBest } = commitRunTotal(total);
    navigate({
      to: "/finish",
      search: { total, prevBest, beat: beat ? 1 : 0 },
    });
  }, [navigate]);

  const restart = useCallback(() => {
    const el = fieldRef.current;
    if (!el) return;
    setBubbles(
      layoutBubbles(cfg.bubbles, cfg.size, el.clientWidth, usableFieldHeight(el)),
    );
    setStartAt(null);
    setElapsed(0);
    setState("ready");
    setResult(null);
    settledRef.current = false;
  }, [cfg.bubbles, cfg.size]);

  const remaining = useMemo(() => bubbles.filter((b) => !b.popped).length, [bubbles]);

  return (
    <div className="flex min-h-screen flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-sm font-medium text-muted-foreground">
          ← Exit
        </Link>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Phase {phase} of {TOTAL_PHASES}
          </div>
          <div className="text-sm font-semibold text-foreground">{cfg.label} bubbles</div>
        </div>
        <div className="w-10 text-right font-mono text-sm tabular-nums text-foreground">
          {formatTime(elapsed)}
        </div>
      </header>

      <div className="px-4 pb-2 text-center text-xs text-muted-foreground">
        {remaining} bubbles left · Best: {record?.bestScore ?? 0} pts
      </div>

      <div className="relative flex flex-1 px-2">
        <div
          ref={fieldRef}
          className="relative w-full flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          {bubbles.map((b) => (
            <Bubble
              key={b.id}
              x={b.x}
              y={b.y}
              size={b.size}
              popped={b.popped}
              driftDelay={b.drift}
              still={stillBubbles}
              onPop={() => handlePop(b.id)}
            />
          ))}

          {state === "ready" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-foreground/70 px-5 py-2 text-sm font-medium text-primary-foreground">
                Tap any bubble to start
              </div>
            </div>
          )}

          {state === "done" && result && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div className="mx-4 w-full max-w-xs rounded-2xl bg-card p-6 text-center shadow-xl">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Phase {phase} complete
                </div>
                <div className="mt-2 text-4xl font-bold text-primary">{result.score}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Time {formatTime(result.timeMs)}
                </div>
                <div className="mt-3 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                  {isNewBestScore ? "New best score! " : ""}
                  {isNewBestTime ? "New best time! " : ""}
                  {!isNewBestScore && !isNewBestTime
                    ? `Best ${record?.bestScore ?? 0} · ${formatTime(record?.bestTimeMs ?? 0)}`
                    : null}
                </div>
                {isLast && (
                  <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs italic text-foreground">
                    “{finaleQuote}”
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      const proceed = () =>
                        isLast ? goFinish() : nextPhase();
                      if (!showAdOnFinish) {
                        proceed();
                      } else if (Capacitor.isNativePlatform()) {
                        // Real AdMob interstitial on device, then continue.
                        await showInterstitial();
                        proceed();
                      } else {
                        // Web/dev: show the in-app placeholder overlay instead.
                        setState("ad");
                      }
                    }}
                    className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow"
                  >
                    {showAdOnFinish
                      ? isLast
                        ? "Watch ad · Finish"
                        : "Watch ad · Next phase"
                      : isLast
                        ? "Finish"
                        : "Next phase"}
                  </button>
                  <button
                    onClick={restart}
                    className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground"
                  >
                    Replay this phase
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Web/dev only: on native the AdMob banner overlays the bottom of the
          screen and the play field is sized to clear it (see usableFieldHeight). */}
      {!Capacitor.isNativePlatform() && <AdBanner inline />}

      {state === "ad" && (
        <VideoAdPlaceholder
          onComplete={() => {
            if (isLast) {
              goFinish();
            } else {
              nextPhase();
            }
          }}
        />
      )}
    </div>
  );
}