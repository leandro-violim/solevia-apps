import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useT } from "../lib/i18n";
import { itemsByType, isItemUnlocked, isAudioPackUnlocked, type Item } from "../game/economy/catalog";
import { loadBalance, earn, spend, EARN, rewardedEarnsLeft, recordRewardedEarn } from "../game/economy/currency";
import { loadOwned, unlock } from "../game/economy/inventory";
import { loadProgress } from "../game/campaign/storage";
import { loadPitchStyleId, savePitchStyleId } from "../game/pitches/storage";
import { loadCapStyleId, saveCapStyleId } from "../game/caps/storage";
import { pitchStyleById } from "../game/pitches/styles";
import { styleById } from "../game/caps/styles";
import { drawPitch, drawCap } from "../game/render/draw";
import { capSpriteReady, capSpriteImage } from "../lib/cap-sprites";
import { gameAudio } from "../lib/audio";
import { packPreviewFile } from "../lib/samples";
import { rewardedAvailable, showRewarded } from "../lib/ads";
import {
  trackCabinetOpened,
  trackLockedItemTapped,
  trackItemUnlocked,
  trackItemEquipped,
  trackCurrencyEarned,
  trackCurrencySpent,
  trackAudioPreviewed,
  trackRewardedOffered,
  trackRewardedWatched,
  trackRewardedSkipped,
} from "../lib/analytics";

export const Route = createFileRoute("/cabinet")({
  head: () => ({ meta: [{ title: "Cap Kickers — Cabinet" }] }),
  component: CabinetPage,
});

const GOLD = "#ffcf33";
const SESSION_BAL = "capkickers.cabinetBal";

/** Local (not UTC) YYYY-MM-DD — the day boundary the daily bonuses use. */
function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Displayed balance that counts up toward the real balance (the reward moment). */
function useCountUp(target: number): number {
  let seed = target;
  try {
    const raw = sessionStorage.getItem(SESSION_BAL);
    if (raw !== null) {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0 && n <= target) seed = n;
    }
  } catch {
    /* ignore */
  }
  const [display, setDisplay] = useState(seed);
  const prev = useRef(seed);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    try {
      sessionStorage.setItem(SESSION_BAL, String(target));
    } catch {
      /* ignore */
    }
    if (from === target) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 550);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return display;
}

/** Canvas preview of a pitch or cap; audio items get a drawn note glyph. */
function Preview({ item, dim }: { item: Item; dim: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || item.type === "audio") return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const S = 4;
    const W = 84;
    const H = 64;
    c.width = W * S;
    c.height = H * S;
    const draw = () => {
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (item.type === "pitch") {
        drawPitch(ctx, { x: 3, y: 3, w: W - 6, h: H - 6 }, 0.32, pitchStyleById(item.styleId));
      } else {
        // Realistic sprite when it's decoded; vector cap until then.
        drawCap(ctx, W / 2, H / 2, 22, styleById(item.styleId), { sprite: capSpriteReady(item.styleId) });
      }
    };
    draw();
    if (item.type === "cap") {
      const img = capSpriteImage(item.styleId);
      if (img && !(img.complete && img.naturalWidth > 0)) {
        img.addEventListener("load", draw, { once: true });
        return () => img.removeEventListener("load", draw);
      }
    }
  }, [item]);

  if (item.type === "audio") {
    return (
      <div
        className="flex h-16 w-full items-center justify-center rounded-xl"
        style={{ background: "#123", opacity: dim ? 0.55 : 1 }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 18V6l10-2v12" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="3" fill={GOLD} />
          <circle cx="19" cy="16" r="3" fill={GOLD} />
        </svg>
      </div>
    );
  }
  return <canvas ref={ref} className="h-16 w-full rounded-xl" style={{ opacity: dim ? 0.55 : 1 }} />;
}

function CabinetPage() {
  const t = useT();
  const today = localToday();
  const completed = loadProgress().completed;
  const [balance, setBalance] = useState(() => loadBalance());
  const [owned, setOwned] = useState<string[]>(() => loadOwned());
  const [equippedPitch, setEquippedPitch] = useState(() => loadPitchStyleId());
  const [equippedCap, setEquippedCap] = useState(() => loadCapStyleId());
  const [watchLeft, setWatchLeft] = useState(() => rewardedEarnsLeft(today));
  const [busy, setBusy] = useState(false);
  const shown = useCountUp(balance);

  useEffect(() => {
    trackCabinetOpened("menu");
  }, []);

  const syncPacks = (nextOwned: string[]) => {
    gameAudio.setPacks({
      crowd: isAudioPackUnlocked("crowd", nextOwned, completed),
      stadium: isAudioPackUnlocked("stadium", nextOwned, completed),
    });
  };

  const equip = (item: Item) => {
    if (item.type === "pitch") {
      savePitchStyleId(item.styleId);
      setEquippedPitch(item.styleId);
    } else if (item.type === "cap") {
      saveCapStyleId(item.styleId);
      setEquippedCap(item.styleId);
    }
    trackItemEquipped(item.id, item.type);
    gameAudio.sfx("clack");
  };

  const buy = (item: Item) => {
    if (item.unlock.kind !== "coins") return;
    const cost = item.unlock.cost;
    if (balance < cost) {
      trackLockedItemTapped(item.id, item.type, false);
      return;
    }
    if (spend(cost)) {
      const next = unlock(item.id);
      setOwned(next);
      setBalance(loadBalance());
      trackCurrencySpent(item.id, cost);
      trackItemUnlocked(item.id, item.type, "coins");
      if (item.type === "audio") syncPacks(next);
      gameAudio.sfx("clack");
    }
  };

  const previewAudio = (item: Item) => {
    const file = packPreviewFile(item.styleId);
    if (!file) return;
    void gameAudio.previewSample(file);
    trackAudioPreviewed(item.styleId);
  };

  const watchForCaps = async () => {
    if (busy || !rewardedAvailable() || rewardedEarnsLeft(today) <= 0) return;
    setBusy(true);
    trackRewardedOffered();
    try {
      const earned = await showRewarded();
      if (earned) {
        recordRewardedEarn(today);
        setBalance(earn(EARN.rewardedWatch));
        setWatchLeft(rewardedEarnsLeft(today));
        trackRewardedWatched();
        trackCurrencyEarned("rewarded", EARN.rewardedWatch);
      } else {
        trackRewardedSkipped();
      }
    } finally {
      setBusy(false);
    }
  };

  const reqText = (item: Item): string =>
    item.unlock.kind === "progress"
      ? t(item.unlock.requires === "beat-veteran" ? "cabinet.reqVeteran" : "cabinet.reqCampaign")
      : "";

  const Niche = ({ item }: { item: Item }) => {
    const unlocked = isItemUnlocked(item, owned, completed);
    const equipped =
      (item.type === "pitch" && equippedPitch === item.styleId) ||
      (item.type === "cap" && equippedCap === item.styleId);
    const name =
      item.type === "audio"
        ? t(item.styleId === "crowd" ? "cabinet.packCrowd" : "cabinet.packStadium")
        : item.type === "pitch"
          ? pitchStyleById(item.styleId).name
          : styleById(item.styleId).name;
    const affordable = item.unlock.kind === "coins" && balance >= item.unlock.cost;

    return (
      <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-2 shadow-[0_4px_0_#cdddd3]">
        <div className="relative w-full" style={{ boxShadow: equipped ? `0 0 0 3px ${GOLD}` : "none", borderRadius: 12 }}>
          <Preview item={item} dim={!unlocked} />
        </div>
        <span className="font-display text-xs uppercase tracking-wide text-foreground">{name}</span>

        {unlocked ? (
          item.type === "audio" ? (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase text-primary">{t("cabinet.owned")}</span>
              <button onClick={() => previewAudio(item)} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold uppercase text-foreground/70">
                {t("cabinet.preview")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => equip(item)}
              disabled={equipped}
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase"
              style={{ background: equipped ? GOLD : "#e9f8ef", color: equipped ? "#3a2b00" : "#128040" }}
            >
              {t(equipped ? "cabinet.equipped" : "cabinet.equip")}
            </button>
          )
        ) : item.unlock.kind === "coins" ? (
          // Audio niches carry a Preview + Buy pair; stack them so neither button
          // overflows the narrow 1/3-width card. Pitches/caps keep the single button.
          <div className={item.type === "audio" ? "flex w-full flex-col items-center gap-1" : "flex items-center gap-1"}>
            {item.type === "audio" && (
              <button onClick={() => previewAudio(item)} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold uppercase text-foreground/60">
                {t("cabinet.preview")}
              </button>
            )}
            <button
              onClick={() => buy(item)}
              className="flex items-center justify-center gap-0.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase leading-none"
              style={{ background: affordable ? GOLD : "#eee", color: affordable ? "#3a2b00" : "#999" }}
            >
              <span>⬤</span> {item.unlock.cost}
            </button>
          </div>
        ) : (
          <span className="px-1 text-center text-[10px] font-semibold leading-tight text-muted-foreground">
            🔒 {reqText(item)}
          </span>
        )}
      </div>
    );
  };

  const Section = ({ titleKey, type }: { titleKey: string; type: "pitch" | "cap" | "audio" }) => (
    <div className="mt-5 w-full">
      <h2 className="font-display mb-2 text-sm uppercase tracking-widest text-muted-foreground">{t(titleKey)}</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {itemsByType(type).map((item) => (
          <Niche key={item.id} item={item} />
        ))}
      </div>
    </div>
  );

  const canWatch = rewardedAvailable() && watchLeft > 0;

  return (
    <div
      className="flex screen flex-col items-center px-5 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
    >
      <div className="flex w-full max-w-md items-center justify-between">
        <Link to="/" className="font-display text-sm uppercase tracking-wide text-muted-foreground">
          ‹ {t("common.back")}
        </Link>
        <div className="font-display rounded-full bg-white px-3 py-1 text-lg shadow-[0_3px_0_#cdddd3]">
          <span style={{ color: GOLD }}>⬤</span> <span className="text-foreground">{shown}</span>{" "}
          <span className="text-xs uppercase text-muted-foreground">{t("cabinet.caps")}</span>
        </div>
      </div>

      <h1 className="font-display mt-3 text-4xl uppercase tracking-tight text-foreground">{t("cabinet.title")}</h1>
      <p className="mt-1 max-w-xs text-center text-sm font-medium text-muted-foreground">{t("cabinet.subtitle")}</p>

      <button
        onClick={watchForCaps}
        disabled={!canWatch || busy}
        className="arcade-btn arcade-btn--gold mt-4 px-6 py-2.5 text-base disabled:opacity-45"
      >
        {canWatch ? t("cabinet.watch", { n: EARN.rewardedWatch }) : t("cabinet.watchDone")}
      </button>

      <div className="w-full max-w-md">
        <Section titleKey="cabinet.secPitches" type="pitch" />
        <Section titleKey="cabinet.secCaps" type="cap" />
        <Section titleKey="cabinet.secAudio" type="audio" />
      </div>
    </div>
  );
}
