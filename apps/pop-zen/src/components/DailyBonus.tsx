import { useEffect, useRef, useState } from "react";
import { PopParticles } from "./PopParticles";
import { burstParticles } from "../lib/pop-particles";
import { playMilestone, unlockAudio } from "../lib/pop-sound";
import { JUICE } from "../lib/juice";
import {
  isBonusAvailable,
  getPendingDayCount,
  consumeBonus,
  trackDailyBonus,
  installBonusDevHelpers,
  DAILY_BONUS,
} from "../lib/daily-bonus";
import { t } from "../lib/i18n";

/**
 * Once-a-day "Daily Bonus" pop-up (P1-T5). Shows on the first open of each
 * calendar day, reuses the combo-milestone gold flourish on Claim, and persists
 * the streak (`daily-bonus.ts`). Feedback-only — no gameplay effects.
 *
 * The open/day-count decision runs on the CLIENT (in an effect), never during
 * SSR — so there's no hydration mismatch from reading localStorage.
 */
export function DailyBonus() {
  const [open, setOpen] = useState(false);
  const [dayCount, setDayCount] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);
  const claimBtnRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    installBonusDevHelpers(); // dev-only; no-op in release builds
    if (isBonusAvailable()) {
      const n = getPendingDayCount();
      setDayCount(n);
      setOpen(true);
      trackDailyBonus("daily_bonus_shown", n);
    }
  }, []);

  if (!open) return null;

  const flourish = () => {
    // Reuse the combo-milestone reward: calm chime + gold particle burst.
    unlockAudio();
    playMilestone(DAILY_BONUS.claimSoundLevel);
    const btn = claimBtnRef.current;
    const ov = overlayRef.current;
    if (btn && ov) {
      const b = btn.getBoundingClientRect();
      const o = ov.getBoundingClientRect();
      burstParticles(
        b.left + b.width / 2 - o.left,
        b.top + b.height / 2 - o.top,
        0,
        DAILY_BONUS.claimParticles,
        DAILY_BONUS.claimSpeedMul,
        JUICE.combo.milestoneTint, // gold
      );
    }
  };

  const claim = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    consumeBonus(); // persist today's visit (advances the streak)
    trackDailyBonus("daily_bonus_claimed", dayCount);
    flourish();
    window.setTimeout(() => setOpen(false), 850); // let the flourish play, then close
  };

  const dismiss = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    consumeBonus(); // coming back counts even without claiming
    setOpen(false);
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss(); // tap the backdrop to dismiss
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-6 backdrop-blur-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="zbonus-card relative w-full max-w-xs rounded-2xl bg-card p-6 text-center shadow-xl">
        <button
          onClick={dismiss}
          aria-label={t("bonus.close")}
          className="absolute right-3 top-3 text-lg leading-none text-muted-foreground"
        >
          ✕
        </button>
        <div className="text-4xl" aria-hidden>
          🎁
        </div>
        <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {t("bonus.title")}
        </div>
        <div className="mt-1 text-4xl font-bold text-primary">
          {t("bonus.day", { n: dayCount })}
        </div>
        <p className="mx-auto mt-2 max-w-[15rem] text-sm text-muted-foreground">
          {t("bonus.line")}
        </p>
        <button
          ref={claimBtnRef}
          onClick={claim}
          className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow active:scale-[0.98]"
        >
          {t("bonus.claim")}
        </button>
      </div>

      {/* Flourish canvas on top; pointer-events:none so the buttons still work. */}
      <PopParticles fieldRef={overlayRef} />
    </div>
  );
}
