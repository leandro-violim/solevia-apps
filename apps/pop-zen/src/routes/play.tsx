import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { z } from "zod";
import { AdBanner } from "../components/AdBanner";
import {
  maybeShowInterstitial,
  maybeShowWorldInterstitial,
  noteRunCompleted,
  preloadInterstitial,
  refreshBanner,
  showRewarded,
} from "../lib/ads";
import { Bubble } from "../components/Bubble";
import { Shields } from "../components/Shields";
import { WorldIntro } from "../components/WorldIntro";
import { ItemHud } from "../components/ItemHud";
import {
  getCount,
  buyConsumable,
  consumeItem,
  subscribeInventory,
  priceOfConsumable,
  CONSUMABLE_EMOJI,
} from "../lib/consumables";
import { PopParticles } from "../components/PopParticles";
import { ComboHud } from "../components/ComboHud";
import { burstParticles } from "../lib/pop-particles";
import { registerPop, resetCombo, getMaxCombo } from "../lib/combo";
import { JUICE } from "../lib/juice";
import { CONFIG } from "../lib/config";
import {
  addCoins,
  getCoins,
  subscribeCoins,
  coinsForScore,
  coinsForZenBubbles,
} from "../lib/economy";
import { rollMysteryReward, type SpecialType } from "../lib/specials";
import { rollObjectives, checkObjectives, nextObjective, type Objective } from "../lib/objectives";
import {
  resetRunStats,
  noteRunPop,
  noteRunCombo,
  noteRunPhaseCleared,
  getRunStats,
  commitStats,
  registerRevive,
  getRunRevives,
} from "../lib/run-stats";
import { checkAchievements } from "../lib/achievements";
import { seededRand, recordDailyResult } from "../lib/daily-challenge";
import { track } from "../lib/analytics";
import { unlockZenSkins } from "../lib/skins";
import { ChallengeGoals } from "../components/ChallengeGoals";
import { CoinBalance } from "../components/CoinBalance";
import { CoinIcon, PlayIcon } from "../components/icons";
import fieldSheet from "../assets/scene/field-sheet.webp";
import {
  computeTimeAttackScore,
  formatCountdown,
  formatTime,
  getPhase,
  stageConfig,
  roundOf,
  phaseInRound,
  mechanicOf,
  PHASES_PER_ROUND,
  TOTAL_STAGES,
} from "../lib/game-config";
import { layoutBubbles, type BubbleState } from "../lib/layout";
import { playPop, playMilestone, playCoinTick, unlockAudio } from "../lib/pop-sound";
import { launchConfetti } from "../lib/confetti";
import { fadeMusicIn, fadeMusicOut } from "../lib/music";
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
  phase: z.number().int().min(1).max(TOTAL_STAGES).optional().default(1),
  mode: z.enum(["zen", "time-attack"]).optional().default("time-attack"),
  difficulty: z.enum(["easy", "normal", "hard"]).optional().default("normal"),
  daily: z.coerce.number().optional().default(0), // 1 = date-seeded daily challenge (§12)
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
 * P1-T4 — isolated Time Attack countdown. Owns the 100ms interval so a tick
 * re-renders only this node (not the up-to-86 bubbles), and fires `onExpire`
 * once when the deadline is reached. Turns coral in the final seconds.
 */
function Countdown({
  deadline,
  onExpire,
  lowMs = 5000,
}: {
  deadline: number;
  onExpire: () => void;
  lowMs?: number;
}) {
  const [left, setLeft] = useState(() => Math.max(0, deadline - Date.now()));
  const firedRef = useRef(false);
  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const l = Math.max(0, deadline - Date.now());
      setLeft(l);
      if (l <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [deadline, onExpire]);
  return <span className={left <= lowMs ? "text-coral" : undefined}>{formatCountdown(left)}</span>;
}

/** Animated count-up for the phase score — eases 0→`to` and fires `onTick(i)` a
 *  fixed number of times so a rising "plim plim plim" can play along with it. */
function CountUp({
  to,
  durationMs = 950,
  onTick,
  className,
}: {
  to: number;
  durationMs?: number;
  onTick?: (i: number) => void;
  className?: string;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (to <= 0) {
      setVal(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const TICKS = 14;
    let ticked = 0;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(Math.round(eased * to));
      const should = Math.floor(eased * TICKS);
      while (ticked < should) {
        onTick?.(ticked);
        ticked += 1;
      }
      if (t < 1) raf = requestAnimationFrame(loop);
      else setVal(to);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs, onTick]);
  return <span className={className}>{val.toLocaleString()}</span>;
}

/** Zen's field: a calm, moderate spread that regenerates endlessly. */
const ZEN_FIELD: ReturnType<typeof getPhase> = {
  phase: 1,
  bubbles: 30,
  size: 54,
  timeLimitMs: 0,
  key: "phase3",
};

/** Pop for Fun: each renewed sheet varies the bubble SIZE + count a little, so no
 *  two sheets look the same. */
function rollZenField(): { bubbles: number; size: number } {
  return {
    size: Math.round(42 + Math.random() * 36), // 42–78 px
    bubbles: Math.round(22 + Math.random() * 14), // 22–36
  };
}

/** Pop for Fun: seed a few bubbles as already-popped — like a real, partly-used
 *  bubble-wrap sheet (up to ~18%, always leaving plenty to pop). */
function prePopSome(list: BubbleState[]): BubbleState[] {
  const maxPre = Math.floor(list.length * 0.18);
  let pre = 0;
  return list.map((b) =>
    pre < maxPre && Math.random() < 0.25 ? ((pre += 1), { ...b, popped: true }) : b,
  );
}

function PlayPage() {
  const { phase, mode, difficulty, daily } = Route.useSearch();
  const navigate = useNavigate({ from: "/play" });
  const isZen = mode === "zen";
  const isDaily = daily === 1; // §12 date-seeded Time Attack run
  // Zen makes specials rare; Time Attack full-rate (§7/§9). Primitive → effect-safe.
  const specialsMul = isZen ? CONFIG.specials.zenMultiplier : 1;
  const cfg = isZen ? ZEN_FIELD : stageConfig(phase, difficulty);
  // Rounds / "worlds" (Pop Challenge only). Round 1 = classic grid, 2 = off-grid
  // jitter, 3 = drifting bubbles you must tap dead-center, 4 = sliding shields.
  // Zen (Pop for Fun) stays the plain endless grid regardless of `phase`.
  const round = isZen ? 1 : roundOf(phase);
  const pir = isZen ? phase : phaseInRound(phase); // in-round phase (1–8)
  const mech = isZen ? "grid" : mechanicOf(phase);
  const fieldJitter = mech === "jitter" ? 0.9 : 0;
  const { submit, records } = usePhaseRecords();

  // Round-4 shield elements, read live by `isCovered` to block covered pops.
  const shieldBarsRef = useRef<HTMLDivElement[]>([]);
  const [fieldWidth, setFieldWidth] = useState(0);
  // Candy-Crush-style "entering World N" flourish, shown when a run crosses into
  // a new round (world 2–4 → its first phase). Dismisses into the phase.
  const [showWorldIntro, setShowWorldIntro] = useState(false);

  // Consumable power-ups (Bombs, Time Freeze) — Pop Challenge only. Live counts
  // re-read on any inventory change. Bomb is armed then detonated on a bubble tap.
  const [, setInvVersion] = useState(0);
  useEffect(() => {
    const a = subscribeInventory(() => setInvVersion((v) => v + 1));
    const b = subscribeCoins(() => setInvVersion((v) => v + 1));
    return () => {
      a();
      b();
    };
  }, []);
  const [bombArmed, setBombArmed] = useState(false);
  const bombArmedRef = useRef(false);
  const [itemFlash, setItemFlash] = useState<string | null>(null);
  // Rewarded-video "earn coins" between stages — capped per run (anti-abuse).
  const coinAdsUsedRef = useRef(0);
  // A bubble is blocked when its centre currently sits under a patrolling shield.
  const isCovered = useCallback((rect: DOMRect): boolean => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (const bar of shieldBarsRef.current) {
      const s = bar.getBoundingClientRect();
      if (cx >= s.left && cx <= s.right && cy >= s.top && cy <= s.bottom) return true;
    }
    return false;
  }, []);
  // Stable so <Bubble>'s memo holds; only round 4 passes it (else undefined).
  const canPop = useCallback((r: DOMRect) => !isCovered(r), [isCovered]);

  const fieldRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [startAt, setStartAt] = useState<number | null>(null);
  // P1-T4: Time Attack countdown — wall-clock ms when the phase's time runs out.
  // null in Zen and before the first pop. Extended by a revive.
  const [deadline, setDeadline] = useState<number | null>(null);
  const [reviveBusy, setReviveBusy] = useState(false); // rewarded-ad in flight
  const [state, setState] = useState<"ready" | "playing" | "timeup" | "done">("ready");
  const [result, setResult] = useState<{
    score: number;
    timeMs: number;
    timeLeftMs: number; // countdown remaining at the moment of clearing
    comboBonus: number;
    maxCombo: number;
  } | null>(null);
  // Guards the phase-complete handler so the score is submitted exactly once,
  // even though React re-runs state updaters/effects in dev (StrictMode).
  const settledRef = useRef(false);
  // True once the first bubble of this phase is popped (starts the clock). A ref,
  // not state, so handlePop stays referentially stable and <Bubble>'s memo works.
  const startedRef = useRef(false);
  // Pop for Fun: the current sheet's rolled size/count (stable across a re-layout,
  // re-rolled on each new/renewed sheet).
  const zenFieldRef = useRef<{ bubbles: number; size: number }>({ bubbles: 30, size: 54 });
  // Pop for Fun: guards the delayed sheet-renewal so it's scheduled exactly once.
  const renewPendingRef = useRef(false);
  // §7 golden/mystery bonus points accumulated this phase, added to the score.
  const bonusPointsRef = useRef(0);
  // Wall-clock at run start, for the run_end duration_s analytics param (P1-T6).
  const runStartAtRef = useRef(0);
  // §8 objectives — rolled once per RUN; completion tracked in a ref Set.
  const objectivesRef = useRef<Objective[]>([]);
  const completedRef = useRef<Set<string>>(new Set());
  const [objVersion, setObjVersion] = useState(0); // bump to re-render the HUD
  const [objToast, setObjToast] = useState<Objective | null>(null);
  useEffect(() => {
    if (isZen) unlockZenSkins(); // §6/P1-T7 — Zen set free once you play Zen
  }, [isZen]);

  // Re-check objectives against live run-stats; toast + re-render on completion.
  const scanObjectives = useCallback(() => {
    const newly = checkObjectives(objectivesRef.current, completedRef.current);
    if (newly.length > 0) {
      // Replace each completed goal with a fresh, harder one so goals never run out.
      let list = objectivesRef.current;
      for (const done of newly) {
        list = list.filter((o) => o.id !== done.id);
        list = [...list, nextObjective(list)];
      }
      objectivesRef.current = list;
      setObjToast(newly[newly.length - 1]);
      setObjVersion((v) => v + 1);
    }
  }, []);

  // Auto-dismiss the objective toast.
  useEffect(() => {
    if (!objToast) return;
    const id = window.setTimeout(() => setObjToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [objToast]);

  // Auto-dismiss the power-up flash ("+2s", "Bomb armed").
  useEffect(() => {
    if (!itemFlash) return;
    const id = window.setTimeout(() => setItemFlash(null), 1400);
    return () => window.clearTimeout(id);
  }, [itemFlash]);

  // Arm a Bomb (next bubble tap detonates it). Toggles off if tapped again.
  const armBomb = useCallback(() => {
    if (getCount("bomb") <= 0) return;
    const next = !bombArmedRef.current;
    bombArmedRef.current = next;
    setBombArmed(next);
    setItemFlash(next ? t("items.bombArmed") : null);
  }, []);

  // Use a Time Freeze: extend the running countdown. Only while the clock runs.
  const freezeTime = useCallback(() => {
    if (deadline === null || state !== "playing") return;
    if (!consumeItem("freeze")) return;
    setDeadline((d) => (d === null ? d : d + CONFIG.consumables.freezeMs));
    setItemFlash(t("items.frozen", { s: Math.round(CONFIG.consumables.freezeMs / 1000) }));
  }, [deadline, state]);

  // Between-stage restock: buy a power-up with coins (subscribeInventory re-renders).
  const buyItem = useCallback((id: "bomb" | "freeze") => {
    buyConsumable(id);
  }, []);

  // §3/§4 watch a rewarded video → earn coins toward items. Capped per run.
  const [adBusy, setAdBusy] = useState(false);
  const watchForCoins = useCallback(async () => {
    if (adBusy) return;
    if (coinAdsUsedRef.current >= CONFIG.ads.rewarded.coinRewardMaxPerRun) return;
    setAdBusy(true);
    const watched = await showRewarded("earn_coins_stage");
    if (watched) {
      coinAdsUsedRef.current += 1;
      addCoins(CONFIG.ads.rewarded.coinReward, "rewarded_stage");
    }
    setAdBusy(false);
  }, [adBusy]);

  // Build field for this phase
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = usableFieldHeight(el);
    setFieldWidth(w);
    if (isZen) {
      // Pop for Fun: fresh sheet → new random size/count + a few pre-popped.
      zenFieldRef.current = rollZenField();
      const zf = zenFieldRef.current;
      setBubbles(
        prePopSome(layoutBubbles(zf.bubbles, zf.size, w, h, Math.random, { phase, specialsMul })),
      );
    } else {
      setBubbles(
        layoutBubbles(cfg.bubbles, cfg.size, w, h, isDaily ? seededRand(phase) : Math.random, {
          phase: pir,
          specialsMul,
          jitter: fieldJitter,
        }),
      );
    }
    setStartAt(null);
    setDeadline(null);
    setReviveBusy(false);
    setState("ready");
    // Announce a new world when arriving at its first phase (worlds 2–4).
    setShowWorldIntro(!isZen && round > 1 && pir === 1);
    setResult(null);
    settledRef.current = false;
    startedRef.current = false;
    bonusPointsRef.current = 0;
    bombArmedRef.current = false; // never carry an armed bomb into a new phase
    setBombArmed(false);
    resetCombo(); // fresh phase → no lingering combo chain
    // Start a brand-new full-run total when entering phase 1 — or when arriving
    // at a later phase that isn't a valid continuation (e.g. an edited ?phase=3
    // deep link), so stale scores from a prior run can't inflate the finish total.
    if (phase === 1 || !runHasPhase(phase - 1)) {
      resetRun();
      // Fresh run → reset run-stats and draw new objectives (§8, Time Attack only).
      resetRunStats();
      objectivesRef.current = isZen ? [] : rollObjectives();
      completedRef.current = new Set();
      setObjVersion((v) => v + 1);
      runStartAtRef.current = Date.now();
      coinAdsUsedRef.current = 0; // reset the per-run rewarded-coins cap
      track("run_start", { mode, difficulty, phase_start: phase }); // P1-T6
    }
    // Warm up the interstitial now so it's ready (if online) by phase end.
    void preloadInterstitial();
    // Ask for a fresh banner creative for the new phase (rate-limited internally
    // to stay within AdMob's refresh policy).
    void refreshBanner();
  }, [
    phase,
    pir,
    round,
    fieldJitter,
    cfg.bubbles,
    cfg.size,
    specialsMul,
    isZen,
    isDaily,
    mode,
    difficulty,
  ]);

  // Re-lay-out the field when the native ad banner reports its real height,
  // so bubbles clear it exactly. Only while "ready" so an in-progress game
  // isn't disturbed.
  useEffect(() => {
    const onResize = () => {
      const el = fieldRef.current;
      if (!el || state !== "ready") return;
      const w = el.clientWidth;
      const h = usableFieldHeight(el);
      setFieldWidth(w);
      if (isZen) {
        // Keep the CURRENT sheet's rolled size (don't re-roll on a banner resize).
        const zf = zenFieldRef.current;
        setBubbles(
          prePopSome(layoutBubbles(zf.bubbles, zf.size, w, h, Math.random, { phase, specialsMul })),
        );
      } else {
        setBubbles(
          layoutBubbles(cfg.bubbles, cfg.size, w, h, isDaily ? seededRand(phase) : Math.random, {
            phase: pir,
            specialsMul,
            jitter: fieldJitter,
          }),
        );
      }
    };
    window.addEventListener("ad-banner-resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("ad-banner-resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [state, cfg.bubbles, cfg.size, phase, pir, fieldJitter, specialsMul, isDaily, isZen]);

  // Freeze the animated full-screen aurora while actively playing — a large
  // blurred, continuously-animated layer under the field's backdrop-blur is a
  // battery/jank cost on mobile Safari, worst on the 60-bubble phase. It resumes
  // on the ready/done screens.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("game-playing", state === "playing");
    return () => document.body.classList.remove("game-playing");
  }, [state]);

  // A celebratory firework burst when a phase is cleared (the score also counts up
  // with a rising "plim" — see the done dialog).
  useEffect(() => {
    if (state !== "done") return;
    const stop = launchConfetti({ count: 46 });
    return () => {
      if (typeof stop === "function") stop();
    };
  }, [state]);

  // F7: music plays BETWEEN phases (done / time-up) but not during active popping.
  useEffect(() => {
    if (state === "done" || state === "timeup") fadeMusicIn();
    else fadeMusicOut();
    return () => fadeMusicOut();
  }, [state]);

  // cx/cy = the popped bubble's centre (field-local px), variant = its tint.
  // Passed in by <Bubble> so this callback stays referentially stable (reads no
  // bubble state) and drives the particle burst without a re-render.
  const handlePop = useCallback(
    (id: number, cx: number, cy: number, variant: number, special: SpecialType) => {
      // Armed Bomb power-up: this tap detonates a blast at (cx,cy) instead of a
      // normal single pop — clears the tapped bubble + its cluster, spends one bomb.
      if (bombArmedRef.current) {
        bombArmedRef.current = false;
        setBombArmed(false);
        consumeItem("bomb");
        if (!startedRef.current) {
          startedRef.current = true;
          unlockAudio();
          setStartAt(Date.now());
          setState("playing");
          if (!isZen && cfg.timeLimitMs > 0) setDeadline(Date.now() + cfg.timeLimitMs);
        }
        playPop();
        popHaptic();
        noteRunPop("normal");
        burstParticles(cx, cy, variant, 30, 1.9, "#ff9a6a");
        const r2 = CONFIG.consumables.bombRadiusFactor;
        setBubbles((prev) =>
          prev.map((b) => {
            if (b.popped) return b;
            const dx = b.x + b.size / 2 - cx;
            const dy = b.y + b.size / 2 - cy;
            if (b.id === id || Math.hypot(dx, dy) <= b.size * r2) return { ...b, popped: true };
            return b;
          }),
        );
        scanObjectives();
        return;
      }
      if (!startedRef.current) {
        startedRef.current = true;
        unlockAudio();
        setStartAt(Date.now());
        setState("playing");
        // P1-T4: start the Time Attack countdown from the first pop (Zen is timeless).
        if (!isZen && cfg.timeLimitMs > 0) setDeadline(Date.now() + cfg.timeLimitMs);
      }
      // Combo (feedback-only in Zen; feeds score in Time Attack — see §9). Drives
      // the rising pitch, the milestone flourish, and the HUD (via subscribeCombo).
      const { combo, milestone } = registerPop();
      noteRunCombo(combo); // §8/§10 run stats
      noteRunPop(special);
      playPop(combo); // pitch rises with the combo, hard-capped in JUICE.combo.pitchCeil
      popHaptic(); // light Taptic-Engine tap on each pop (native iOS; respects system haptics)
      burstParticles(cx, cy, variant); // juice: tinted particle burst from the pop point
      if (milestone !== null) {
        playMilestone(milestone); // distinct calm chime
        track("combo_milestone", { milestone, mode }); // P1-T6
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
      if (special !== "normal") track("special_bubble_popped", { type: special }); // P1-T6
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

      scanObjectives(); // §8 — coins + toast if a goal just completed
    },
    [scanObjectives, mode, isZen, cfg.timeLimitMs],
  ); // constant within a phase (isZen/timeLimit don't change), so <Bubble> memo holds

  // Detect phase completion once the field is cleared, and record it exactly
  // once. Kept out of the pop handler's updater so it can't double-submit.
  useEffect(() => {
    if (state !== "playing") return;
    if (bubbles.length === 0 || bubbles.some((b) => !b.popped)) return;

    // §9 Zen: endless — clearing the field grants gentle coins and lays a fresh
    // one; there's no score, phase, or finish. The player leaves via Exit.
    if (isZen) {
      const golden = bubbles.filter((b) => b.special === "golden").length;
      commitStats(bubbles.length, golden, getMaxCombo(), false); // §10 cumulative stats
      checkAchievements();
      addCoins(coinsForZenBubbles(bubbles.length), "zen");
      // Renew the sheet after a short beat — NOT synchronously — so the tap that
      // cleared the last bubble (its trailing click) lands on the cleared sheet and
      // can't carry over to auto-pop a bubble on the fresh one. Guarded so it fires
      // once, and no-ops if the player left (fieldRef is null).
      if (!renewPendingRef.current) {
        renewPendingRef.current = true;
        window.setTimeout(() => {
          renewPendingRef.current = false;
          const el = fieldRef.current;
          if (!el) return;
          zenFieldRef.current = rollZenField();
          const zf = zenFieldRef.current;
          setBubbles(
            prePopSome(
              layoutBubbles(
                zf.bubbles,
                zf.size,
                el.clientWidth,
                usableFieldHeight(el),
                Math.random,
                {
                  phase,
                  specialsMul,
                },
              ),
            ),
          );
        }, 220);
      }
      resetCombo();
      return;
    }

    // Time Attack: settle the phase exactly once.
    if (settledRef.current) return;
    settledRef.current = true;
    const t = startAt !== null ? Date.now() - startAt : 0;
    const timeLeftMs = deadline !== null ? Math.max(0, deadline - Date.now()) : 0;
    noteRunPhaseCleared(t); // §8/§10
    scanObjectives();
    track("phase_cleared", { mode, phase, time_left_s: Math.round(timeLeftMs / 1000) }); // P1-T6
    // §9: the Time Attack score rewards the countdown time LEFT (clear faster →
    // keep more time → higher), plus the best-combo bonus + §7 special points.
    const base = computeTimeAttackScore(cfg.bubbles, timeLeftMs, cfg.timeLimitMs);
    const maxCombo = getMaxCombo();
    const comboBonus =
      maxCombo >= JUICE.combo.minShown ? maxCombo * JUICE.combo.scoreBonusPerCombo : 0;
    const score = base + comboBonus + bonusPointsRef.current;
    setResult({ score, timeMs: t, timeLeftMs, comboBonus, maxCombo });
    submit(pir, score, t); // best-per-phase, aggregated across worlds/rounds
    recordRunPhase(phase, score); // run continuity is keyed by the global stage
    setState("done");
  }, [
    bubbles,
    state,
    startAt,
    deadline,
    cfg.bubbles,
    cfg.size,
    phase,
    pir,
    submit,
    scanObjectives,
    isZen,
    specialsMul,
    isDaily,
    mode,
    cfg.timeLimitMs,
  ]);

  const record = records[pir];
  const isLast = phase >= TOTAL_STAGES;
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

  const nextPhase = useCallback(async () => {
    const next = Math.min(phase + 1, TOTAL_STAGES);
    // Interstitial on a WORLD change (crossing into a new round) — a natural
    // "level complete" break, ~3× per full run, cooldown-gated (see ads.ts).
    if (!isZen && roundOf(next) > roundOf(phase)) {
      await maybeShowWorldInterstitial("world_change");
    }
    navigate({ to: "/play", search: { phase: next, mode, difficulty, daily } });
  }, [navigate, phase, mode, difficulty, daily, isZen]);

  // End of a Time Attack run: total the phases, award coins (§1), fire the
  // run-end interstitial (§2 — a natural break, capped), then celebrate.
  const goFinish = useCallback(
    async (endedBy: "completed" | "timeout" = "completed") => {
      const rs = getRunStats();
      commitStats(rs.popped, rs.goldenPopped, rs.maxCombo, true); // §10 cumulative stats
      checkAchievements();
      const total = getRunTotal();
      const { beat, prevBest } = commitRunTotal(total);
      if (isDaily) recordDailyResult(total); // §12 — daily best + first-play bonus coins
      const coins = coinsForScore(total);
      addCoins(coins, "time_attack_run");
      track("run_end", {
        mode,
        difficulty,
        score: total,
        phase_reached: phase,
        bubbles_popped: rs.popped,
        max_combo: rs.maxCombo,
        duration_s: Math.round((Date.now() - runStartAtRef.current) / 1000),
        ended_by: endedBy,
      }); // P1-T6
      noteRunCompleted();
      await maybeShowInterstitial("run_end");
      navigate({ to: "/finish", search: { total, prevBest, beat: beat ? 1 : 0, coins } });
    },
    [navigate, isDaily, mode, difficulty, phase],
  );

  // P1-T4: the countdown hit 0 with bubbles still up → offer a revive / end run.
  const handleTimeUp = useCallback(() => {
    setState((s) => (s === "playing" ? "timeup" : s));
    track("time_up", { mode, phase });
  }, [mode, phase]);

  // Revives left this run? (Time Attack only; capped by CONFIG.ads.rewarded.)
  const canRevive = !isZen && getRunRevives() < CONFIG.ads.rewarded.maxRevivesPerRun;

  // Watch a rewarded ad to add +reviveSeconds and resume the phase.
  const onRevive = useCallback(async () => {
    if (reviveBusy) return;
    setReviveBusy(true);
    const watched = await showRewarded("revive"); // web/dev simulates success
    if (watched) {
      registerRevive(); // run-scoped cap + lifetime stat
      checkAchievements(); // "use your first revive"
      track("revive_used", { mode, phase });
      setDeadline(Date.now() + CONFIG.ads.rewarded.reviveSeconds * 1000);
      setState("playing");
    }
    setReviveBusy(false);
  }, [reviveBusy, mode, phase]);

  const restart = useCallback(() => {
    const el = fieldRef.current;
    if (!el) return;
    setFieldWidth(el.clientWidth);
    setBubbles(
      layoutBubbles(
        cfg.bubbles,
        cfg.size,
        el.clientWidth,
        usableFieldHeight(el),
        isDaily ? seededRand(phase) : Math.random,
        {
          phase: pir,
          specialsMul,
          jitter: fieldJitter,
        },
      ),
    );
    setStartAt(null);
    setDeadline(null);
    setReviveBusy(false);
    setState("ready");
    setResult(null);
    settledRef.current = false;
    startedRef.current = false;
    bonusPointsRef.current = 0;
    resetCombo();
  }, [cfg.bubbles, cfg.size, phase, pir, fieldJitter, specialsMul, isDaily]);

  const remaining = useMemo(() => bubbles.filter((b) => !b.popped).length, [bubbles]);

  return (
    <div
      className="screen-fade flex min-h-dvh flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* The play screen sits on the app's own calm navy shell (styles.css body
          bg-grad + soft aqua aurora) — same as the home/menus — so the whole
          screen reads as one integrated surface. */}
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          to="/"
          onClick={() => {
            // P1-T6: a mid-run exit ends the run (covers Zen, which has no finish).
            if (startedRef.current) {
              const rs = getRunStats();
              track("run_end", {
                mode,
                difficulty,
                score: getRunTotal(),
                phase_reached: phase,
                bubbles_popped: rs.popped,
                max_combo: rs.maxCombo,
                duration_s: Math.round((Date.now() - runStartAtRef.current) / 1000),
                ended_by: "quit",
              });
            }
          }}
          className="hud-chip px-3 py-1.5 text-sm font-semibold text-muted-foreground"
        >
          {t("play.exit")}
        </Link>
        <div className="hud-chip flex-col gap-0 px-4 py-1">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {isZen
              ? t("home.zen")
              : t("play.worldPhase", { world: round, phase: pir, per: PHASES_PER_ROUND })}
          </div>
          {!isZen && <div className="text-sm font-semibold text-foreground">{t(cfg.key)}</div>}
        </div>
        <div className="hud-chip min-w-[3.25rem] justify-center px-3 py-1.5 font-mono text-sm tabular-nums">
          {isZen ? (
            <span aria-hidden>∞</span>
          ) : state === "playing" && deadline !== null ? (
            <Countdown deadline={deadline} onExpire={handleTimeUp} />
          ) : state === "timeup" ? (
            <span className="text-coral">{formatCountdown(0)}</span>
          ) : state === "done" && result ? (
            formatCountdown(result.timeLeftMs)
          ) : (
            formatCountdown(cfg.timeLimitMs)
          )}
        </div>
      </header>

      <div className="px-4 pb-2 text-center text-xs text-muted-foreground">
        {t("play.bubblesLeft", { n: remaining, best: record?.bestScore ?? 0 })}
      </div>

      <div
        className="relative flex flex-1 px-2 pb-2"
        style={{
          // On native the AdMob banner is an overlay at the bottom — reserve its
          // height (+ safe area) so the field square finishes a few px ABOVE it,
          // never under it. On web the inline banner already sits below the field.
          paddingBottom: Capacitor.isNativePlatform()
            ? "calc(var(--ad-banner-h, 100px) + env(safe-area-inset-bottom) + 10px)"
            : undefined,
        }}
      >
        <div
          ref={fieldRef}
          className="relative w-full flex-1 overflow-hidden rounded-3xl border border-white/10"
          style={{
            isolation: "isolate",
            // Leandro's pick: a soft 20% black veil over the app's navy shell,
            // with the real bubble-wrap on top. rgba(0,0,0,0.20).
            background: "rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* The REAL crinkly bubble-wrap photo blended (soft-light) onto the base
              so it reads as genuine, see-through bubble wrap. Pocket SCALE tracks
              the phase's bubble size (cfg.size); ~10 pockets across the 1125px
              source → tile width ≈ size × 10. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${fieldSheet})`,
              backgroundSize: `${Math.round(cfg.size * 10)}px auto`,
              backgroundRepeat: "repeat",
              backgroundPosition: "center",
              opacity: 0.7,
              mixBlendMode: "soft-light",
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
              moving={mech === "moving"}
              centerHitFrac={mech === "moving" ? 0.58 : 1}
              canActivate={mech === "shielded" ? canPop : undefined}
              onPop={handlePop}
            />
          ))}

          {/* Round-4 patrolling shields (block covered pops; see isCovered). */}
          {mech === "shielded" && state !== "done" && (
            <Shields fieldWidth={fieldWidth} barsRef={shieldBarsRef} />
          )}

          {/* Pop particle burst — canvas overlay above the bubbles, below the UI overlays. */}
          <PopParticles fieldRef={fieldRef} />

          {/* Combo readout + milestone flourish (feedback-only). */}
          <ComboHud />

          {/* Candy-Crush-style "entering World N" flourish (worlds 2–4). */}
          {showWorldIntro && <WorldIntro round={round} onDone={() => setShowWorldIntro(false)} />}

          {/* Consumable power-ups (Pop Challenge only): Bomb + Time Freeze. */}
          {!isZen && (state === "ready" || state === "playing") && !showWorldIntro && (
            <ItemHud
              bombCount={getCount("bomb")}
              freezeCount={getCount("freeze")}
              bombArmed={bombArmed}
              onBomb={armBomb}
              onFreeze={freezeTime}
              freezeDisabled={state !== "playing" || deadline === null}
            />
          )}

          {/* Power-up flash ("+2s", "Bomb armed"). */}
          {itemFlash && (
            <div className="pointer-events-none absolute inset-x-0 top-28 z-10 flex justify-center">
              <div className="zc-milestone inline-flex items-center gap-1">{itemFlash}</div>
            </div>
          )}

          {/* §8 objective-complete toast — brief, centered (no longer a top-left
              overlay covering a bubble). */}
          {objToast && (
            <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center">
              <div className="zc-milestone inline-flex items-center gap-1">
                {t("obj.complete", { coins: objToast.reward })}
                <CoinIcon size={14} className="text-gold" />
              </div>
            </div>
          )}

          {state === "ready" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
              {!isZen && phase === 1 && objectivesRef.current.length > 0 ? (
                // Pop Challenge intro: show today's goals before the run starts.
                <div className="zbonus-card w-full max-w-xs rounded-2xl border border-white/10 bg-popover p-5 text-center shadow-xl">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    {t("challenge.goalsTitle")}
                  </div>
                  <div className="mt-3">
                    <ChallengeGoals
                      objectives={objectivesRef.current}
                      completed={completedRef.current}
                    />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-primary">
                    {t("challenge.goalsHint")}
                  </div>
                </div>
              ) : (
                <div className="hud-chip px-5 py-2 text-sm font-semibold">
                  {t("play.tapToStart")}
                </div>
              )}
            </div>
          )}

          {state === "timeup" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
              <div className="zb-dialog">
                <div className="text-3xl font-extrabold text-accent">{t("play.timeUp")}</div>
                {canRevive && (
                  <p className="mx-auto mt-2 max-w-[15rem] text-sm text-muted-foreground">
                    {t("play.timeUpLine")}
                  </p>
                )}
                <div className="mt-5 flex flex-col gap-2">
                  {canRevive && (
                    <button
                      onClick={onRevive}
                      disabled={reviveBusy}
                      className="btn btn-primary w-full gap-1.5"
                    >
                      <PlayIcon size={16} />
                      {t("play.revive", { s: CONFIG.ads.rewarded.reviveSeconds })}
                    </button>
                  )}
                  <button
                    onClick={() => goFinish("timeout")}
                    disabled={reviveBusy}
                    className="btn btn-ghost w-full text-sm"
                  >
                    {t("play.endRun")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {state === "done" && result && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
              <div className="zb-dialog">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("play.phaseComplete", { phase })}
                </div>
                <div className="mt-2 text-5xl font-extrabold text-primary">
                  <CountUp to={result.score} onTick={playCoinTick} />
                </div>
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
                {!isZen && objectivesRef.current.length > 0 && (
                  // How close you are to the challenge goals, after each phase.
                  <div className="mt-3 rounded-lg bg-white/5 p-3">
                    <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {t("challenge.progressTitle")}
                    </div>
                    <ChallengeGoals
                      key={objVersion}
                      objectives={objectivesRef.current}
                      completed={completedRef.current}
                      showProgress
                    />
                  </div>
                )}
                {isLast && (
                  <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs italic text-foreground">
                    “{finaleQuote}”
                  </div>
                )}
                {/* Candy-Crush-style pre-next-stage restock: buy power-ups (or
                    watch a video for coins) before heading into the next stage. */}
                {!isZen && !isLast && (
                  <div className="mt-3 rounded-lg bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        {t("items.restock")}
                      </span>
                      <CoinBalance className="text-xs font-semibold text-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => buyItem("bomb")}
                        disabled={getCoins() < priceOfConsumable("bomb")}
                        className="btn btn-secondary w-full justify-between gap-1 py-2 text-xs disabled:opacity-40"
                      >
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden>{CONSUMABLE_EMOJI.bomb}</span>×{getCount("bomb")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CoinIcon size={12} className="text-gold" />
                          {priceOfConsumable("bomb")}
                        </span>
                      </button>
                      <button
                        onClick={() => buyItem("freeze")}
                        disabled={getCoins() < priceOfConsumable("freeze")}
                        className="btn btn-secondary w-full justify-between gap-1 py-2 text-xs disabled:opacity-40"
                      >
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden>{CONSUMABLE_EMOJI.freeze}</span>×{getCount("freeze")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CoinIcon size={12} className="text-gold" />
                          {priceOfConsumable("freeze")}
                        </span>
                      </button>
                    </div>
                    {coinAdsUsedRef.current < CONFIG.ads.rewarded.coinRewardMaxPerRun && (
                      <button
                        onClick={watchForCoins}
                        disabled={adBusy}
                        className="btn btn-ghost mt-2 w-full gap-1 py-2 text-xs text-accent disabled:opacity-40"
                      >
                        <PlayIcon size={13} />
                        {t("shop.watchEarn", { coins: CONFIG.ads.rewarded.coinReward })}
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => (isLast ? goFinish() : nextPhase())}
                    className="btn btn-primary w-full"
                  >
                    {isLast ? t("play.finish") : t("play.nextPhase")}
                  </button>
                  <button onClick={restart} className="btn btn-ghost w-full text-sm">
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
    </div>
  );
}
