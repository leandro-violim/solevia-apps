import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { z } from "zod";
import { AdBanner } from "../components/AdBanner";
import { showInterstitial, preloadInterstitial, refreshBanner } from "../lib/ads";
import { Bubble } from "../components/Bubble";
import { PopParticles } from "../components/PopParticles";
import { ComboHud } from "../components/ComboHud";
import { burstParticles } from "../lib/pop-particles";
import { registerPop, resetCombo, getMaxCombo } from "../lib/combo";
import { JUICE } from "../lib/juice";
import { CONFIG } from "../lib/config";
import { addCoins } from "../lib/economy";
import { rollMysteryReward, type SpecialType } from "../lib/specials";
import { VideoAdPlaceholder } from "../components/VideoAdPlaceholder";
import sheetBg from "../assets/bubbles/bubble-sheet.jpg";
import { computeScore, formatTime, getPhase, TOTAL_PHASES } from "../lib/game-config";
import { layoutBubbles, type BubbleState } from "../lib/layout";
import { playPop, playMilestone, unlockAudio, resetAudio } from "../lib/pop-sound";
import { popHaptic } from "../lib/haptics";
import {
  usePhaseRecords,
  resetRun,
  runHasPhase,
  recordRunPhase,
  getRunTotal,
  commitRunTotal,
} from "../lib/records";
import { pickQuote } from "../lib/quotes";
import { t } from "../lib/i18n";

const searchSchema = z.object({
  phase: z.number().int().min(1).max(TOTAL_PHASES).optional().default(1),
});

export const Route = createFileRoute("/play")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Play — Zen Bubbles" },
      {
        name: "description",
        content: "Pop plastic bubbles to relax. Beat your best time each phase.",
      },
      { property: "og:title", content: "Play — Zen Bubbles" },
      { property: "og:description", content: "Pop plastic bubbles to relax." },
    ],
  }),
  component: PlayPage,
});

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

/**
 * Isolated clock. Owns the 100ms interval + elapsed state so a timer tick
 * re-renders only this node — not the (up to 60) bubbles in the field.
 */
function Timer({ startAt }: { startAt: number }) {
  const [ms, setMs] = useState(() => Math.max(0, Date.now() - startAt));
  useEffect(() => {
    const tick = () => setMs(Math.max(0, Date.now() - startAt));
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [startAt]);
  return <>{formatTime(ms)}</>;
}

function PlayPage() {
  const { phase } = Route.useSearch();
  const navigate = useNavigate({ from: "/play" });
  const cfg = getPhase(phase);
  const { submit, records } = usePhaseRecords();

  const fieldRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [state, setState] = useState<"ready" | "playing" | "done" | "ad">("ready");
  const [result, setResult] = useState<{
    score: number;
    timeMs: number;
    comboBonus: number;
    maxCombo: number;
  } | null>(null);
  // Guards the phase-complete handler so the score is submitted exactly once,
  // even though React re-runs state updaters/effects in dev (StrictMode).
  const settledRef = useRef(false);
  // True once the first bubble of this phase is popped (starts the clock). A ref,
  // not state, so handlePop stays referentially stable and <Bubble>'s memo works.
  const startedRef = useRef(false);
  // §7 golden/mystery bonus points accumulated this phase, added to the score.
  const bonusPointsRef = useRef(0);

  // Build field for this phase
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = usableFieldHeight(el);
    setBubbles(layoutBubbles(cfg.bubbles, cfg.size, w, h, Math.random, { phase, specialsMul: 1 }));
    setStartAt(null);
    setState("ready");
    setResult(null);
    settledRef.current = false;
    startedRef.current = false;
    bonusPointsRef.current = 0;
    resetCombo(); // fresh phase → no lingering combo chain
    // Start a brand-new full-run total when entering phase 1 — or when arriving
    // at a later phase that isn't a valid continuation (e.g. an edited ?phase=3
    // deep link), so stale scores from a prior run can't inflate the finish total.
    if (phase === 1 || !runHasPhase(phase - 1)) resetRun();
    // Warm up the interstitial now so it's ready (if online) by phase end.
    void preloadInterstitial();
    // Ask for a fresh banner creative for the new phase (rate-limited internally
    // to stay within AdMob's refresh policy).
    void refreshBanner();
  }, [phase, cfg.bubbles, cfg.size]);

  // Re-lay-out the field when the native ad banner reports its real height,
  // so bubbles clear it exactly. Only while "ready" so an in-progress game
  // isn't disturbed.
  useEffect(() => {
    const onResize = () => {
      const el = fieldRef.current;
      if (!el || state !== "ready") return;
      setBubbles(
        layoutBubbles(cfg.bubbles, cfg.size, el.clientWidth, usableFieldHeight(el), Math.random, {
          phase,
          specialsMul: 1,
        }),
      );
    };
    window.addEventListener("ad-banner-resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("ad-banner-resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [state, cfg.bubbles, cfg.size, phase]);

  // Freeze the animated full-screen aurora while actively playing — a large
  // blurred, continuously-animated layer under the field's backdrop-blur is a
  // battery/jank cost on mobile Safari, worst on the 60-bubble phase. It resumes
  // on the ready/done screens.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("game-playing", state === "playing");
    return () => document.body.classList.remove("game-playing");
  }, [state]);

  // cx/cy = the popped bubble's centre (field-local px), variant = its tint.
  // Passed in by <Bubble> so this callback stays referentially stable (reads no
  // bubble state) and drives the particle burst without a re-render.
  const handlePop = useCallback(
    (id: number, cx: number, cy: number, variant: number, special: SpecialType) => {
      if (!startedRef.current) {
        startedRef.current = true;
        unlockAudio();
        setStartAt(Date.now());
        setState("playing");
      }
      // Combo (feedback-only in Zen; feeds score in Time Attack — see §9). Drives
      // the rising pitch, the milestone flourish, and the HUD (via subscribeCombo).
      const { combo, milestone } = registerPop();
      playPop(combo); // pitch rises with the combo, hard-capped in JUICE.combo.pitchCeil
      popHaptic(); // light Taptic-Engine tap on each pop (native iOS; respects system haptics)
      burstParticles(cx, cy, variant); // juice: tinted particle burst from the pop point
      if (milestone !== null) {
        playMilestone(milestone); // distinct calm chime
        const tier = (JUICE.combo.milestones as readonly number[]).indexOf(milestone);
        // Bigger, faster, GOLD-tinted burst so a milestone reads as a reward.
        burstParticles(
          cx,
          cy,
          variant,
          JUICE.combo.milestoneParticles + tier * 5,
          1.5,
          JUICE.combo.milestoneTint,
        );
      }

      // §7 special-bubble effects (a "time" mystery reward folds into points until
      // §9 adds the Time Attack countdown).
      if (special === "golden") {
        addCoins(CONFIG.specials.goldenBonusCoins, "golden");
        bonusPointsRef.current += CONFIG.specials.goldenBonusPoints;
        burstParticles(cx, cy, variant, 18, 1.4, JUICE.combo.milestoneTint);
      } else if (special === "mystery") {
        const r = rollMysteryReward(Math.random);
        if (r.kind === "coins") addCoins(r.amount, "mystery");
        else bonusPointsRef.current += r.amount;
        burstParticles(cx, cy, variant, 16, 1.4);
      } else if (special === "bomb") {
        burstParticles(cx, cy, variant, 26, 1.7, "#ff9a6a");
      }

      // Pure state update. A Bomb also pops un-popped neighbours within its blast.
      setBubbles((prev) => {
        if (special !== "bomb") {
          return prev.map((b) => (b.id === id ? { ...b, popped: true } : b));
        }
        return prev.map((b) => {
          if (b.id === id) return { ...b, popped: true };
          if (b.popped) return b;
          const dx = b.x + b.size / 2 - cx;
          const dy = b.y + b.size / 2 - cy;
          if (Math.hypot(dx, dy) <= b.size * CONFIG.specials.bombRadiusFactor) {
            return { ...b, popped: true };
          }
          return b;
        });
      });
    },
    [],
  ); // stable: reads timing from refs, so <Bubble>'s memo skips un-popped bubbles

  // Detect phase completion once the field is cleared, and record it exactly
  // once. Kept out of the pop handler's updater so it can't double-submit.
  useEffect(() => {
    if (state !== "playing" || settledRef.current) return;
    if (bubbles.length === 0 || bubbles.some((b) => !b.popped)) return;
    settledRef.current = true;
    const t = startAt !== null ? Date.now() - startAt : 0;
    const base = computeScore(cfg.bubbles, t);
    // Record-combo reward: the highest combo reached this phase adds points.
    // (Combo scoring lives ONLY on this branch for now — see the v1.4 mode-split
    // note; it is not part of the shipping v1.2 build.)
    const maxCombo = getMaxCombo();
    const comboBonus =
      maxCombo >= JUICE.combo.minShown ? maxCombo * JUICE.combo.scoreBonusPerCombo : 0;
    const score = base + comboBonus + bonusPointsRef.current; // + §7 golden/mystery points
    setResult({ score, timeMs: t, comboBonus, maxCombo });
    submit(phase, score, t);
    // Accumulate this phase's score into the current full-run total.
    recordRunPhase(phase, score);
    setState("done");
  }, [bubbles, state, startAt, cfg.bubbles, phase, submit]);

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
      layoutBubbles(cfg.bubbles, cfg.size, el.clientWidth, usableFieldHeight(el), Math.random, {
        phase,
        specialsMul: 1,
      }),
    );
    setStartAt(null);
    setState("ready");
    setResult(null);
    settledRef.current = false;
    startedRef.current = false;
    bonusPointsRef.current = 0;
    resetCombo();
  }, [cfg.bubbles, cfg.size, phase]);

  const remaining = useMemo(() => bubbles.filter((b) => !b.popped).length, [bubbles]);

  return (
    <div className="flex min-h-dvh flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-sm font-medium text-muted-foreground">
          {t("play.exit")}
        </Link>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {t("play.phaseOf", { phase, total: TOTAL_PHASES })}
          </div>
          <div className="text-sm font-semibold text-foreground">{t(cfg.key)}</div>
        </div>
        <div className="w-10 text-right font-mono text-sm tabular-nums text-foreground">
          {state === "playing" && startAt !== null ? (
            <Timer startAt={startAt} />
          ) : (
            formatTime(state === "done" && result ? result.timeMs : 0)
          )}
        </div>
      </header>

      <div className="px-4 pb-2 text-center text-xs text-muted-foreground">
        {t("play.bubblesLeft", { n: remaining, best: record?.bestScore ?? 0 })}
      </div>

      <div className="relative flex flex-1 px-2">
        <div
          ref={fieldRef}
          className="relative w-full flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          {/* Bubble-wrap SHEET behind the grid — the NATURAL photo, faint and
              teal-tinted ENTIRELY via the CSS filter (image is not pre-darkened)
              so the Aurora shows through and tints the plastic. Sits on the
              aurora, below the bubbles. Values ported 1:1 from
              _reference/zen-final-look.html — do not add a dark gradient over it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${sheetBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.22,
              filter: "brightness(.5) saturate(.45) hue-rotate(150deg)",
            }}
          />
          {bubbles.map((b) => (
            <Bubble
              key={b.id}
              id={b.id}
              x={b.x}
              y={b.y}
              size={b.size}
              popped={b.popped}
              variant={b.variant}
              special={b.special}
              driftDelay={b.drift}
              still={stillBubbles}
              onPop={handlePop}
            />
          ))}

          {/* Pop particle burst — canvas overlay above the bubbles, below the UI overlays. */}
          <PopParticles fieldRef={fieldRef} />

          {/* Combo readout + milestone flourish (feedback-only). */}
          <ComboHud />

          {state === "ready" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-foreground/70 px-5 py-2 text-sm font-medium text-primary-foreground">
                {t("play.tapToStart")}
              </div>
            </div>
          )}

          {state === "done" && result && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div className="mx-4 w-full max-w-xs rounded-2xl bg-card p-6 text-center shadow-xl">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("play.phaseComplete", { phase })}
                </div>
                <div className="mt-2 text-4xl font-bold text-primary">{result.score}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("play.time", { time: formatTime(result.timeMs) })}
                </div>
                {result.comboBonus > 0 && (
                  <div className="mt-1 text-sm font-semibold text-accent">
                    {t("play.comboBonus", { n: result.maxCombo, pts: result.comboBonus })}
                  </div>
                )}
                <div className="mt-3 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                  {isNewBestScore ? t("play.newBestScore") : ""}
                  {isNewBestTime ? t("play.newBestTime") : ""}
                  {!isNewBestScore && !isNewBestTime
                    ? t("play.bestLine", {
                        score: record?.bestScore ?? 0,
                        time: formatTime(record?.bestTimeMs ?? 0),
                      })
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
                      const proceed = () => (isLast ? goFinish() : nextPhase());
                      if (!showAdOnFinish) {
                        proceed();
                      } else if (Capacitor.isNativePlatform()) {
                        // Real AdMob interstitial on device, then continue.
                        await showInterstitial();
                        // The interstitial takes over the audio session; rebuild
                        // it so bubble pops are audible again on the next phase.
                        resetAudio();
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
                        ? t("play.watchFinish")
                        : t("play.watchNext")
                      : isLast
                        ? t("play.finish")
                        : t("play.nextPhase")}
                  </button>
                  <button
                    onClick={restart}
                    className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground"
                  >
                    {t("play.replayPhase")}
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
            unlockAudio(); // reactivate audio after the placeholder ad
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
