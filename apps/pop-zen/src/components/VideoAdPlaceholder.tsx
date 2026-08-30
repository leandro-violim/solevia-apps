import { useEffect, useState } from "react";
import bubbleImg from "../assets/bubble.webp";

type Props = {
  onComplete: () => void;
  /** Seconds until Continue is enabled. */
  duration?: number;
};

/**
 * Between-phase full-screen "video ad" placeholder.
 * Same lifecycle a real AdMob rewarded/interstitial call will use once we
 * swap it out inside the Capacitor build.
 */
export function VideoAdPlaceholder({ onComplete, duration = 5 }: Props) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-foreground/95 px-6 text-center text-primary-foreground"
      role="dialog"
      aria-label="Video advertisement"
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-foreground/60">
        Advertisement
      </div>
      <div className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl bg-primary/20">
        <img
          src={bubbleImg}
          alt=""
          className="h-40 w-40 animate-pulse opacity-90"
          width={160}
          height={160}
        />
        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-medium">
          Video ad placeholder
        </div>
      </div>
      <p className="mt-6 max-w-xs text-sm text-primary-foreground/70">
        A short video ad plays between phases. Real ads appear once AdMob is connected in the native
        build.
      </p>
      <button
        onClick={onComplete}
        disabled={remaining > 0}
        className="mt-6 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity disabled:opacity-40"
      >
        {remaining > 0 ? `Continue in ${remaining}s` : "Continue"}
      </button>
    </div>
  );
}
