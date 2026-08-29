import { useEffect, useRef, useState } from "react";
import { PopParticles } from "./PopParticles";
import { burstParticles } from "../lib/pop-particles";
import { playMilestone, unlockAudio } from "../lib/pop-sound";
import { JUICE } from "../lib/juice";
import {
  isBonusAvailable,
  getPendingDayCount,
  getPendingCoins,
  claimDailyBonus,
  trackBonusShown,
  installBonusDevHelpers,
  DAILY_BONUS,
} from "../lib/daily-bonus";
import { t } from "../lib/i18n";

/**
 * Once-a-day "Daily Bonus" pop-up (§4/§5). Shows on the first open of each
 * calendar day, grants coins scaled by streak day (with one-miss freeze), and
 * reuses the combo-milestone gold flourish on Claim. The open/day decision runs
 * on the CLIENT (effect), never during SSR.
 */
export function DailyBonus() {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(1);
  const [coins, setCoins] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const claimBtnRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    installBonusDevHelpers();
    if (isBonusAvailable()) {
      const n = getPendingDayCount();
      setDay(n);
      setCoins(getPendingCoins());
      setOpen(true);
      trackBonusShown(n);
    }
  }, []);

  if (!open) return null;

  const flourish = () => {
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
    claimDailyBonus(); // credits coins + advances streak + logs
    flourish();
    window.setTimeout(() => setOpen(false), 850);
  };

  const dismiss = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    claimDailyBonus(); // coming back still credits the day's gift (no flourish)
    setOpen(false);
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
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
        <div className="mt-1 text-3xl font-bold text-primary">{t("bonus.day", { n: day })}</div>
        <div className="mt-1 text-lg font-semibold text-accent">{t("bonus.reward", { coins })}</div>
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

      <PopParticles fieldRef={overlayRef} />
    </div>
  );
}
