import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CoinBalance } from "../components/CoinBalance";
import {
  SKINS,
  ZEN_SKINS,
  type CosmeticDef,
  priceOf,
  isOwned,
  isEquipped,
  buy,
  equip,
} from "../lib/skins";
import { getCoins, addCoins } from "../lib/economy";
import {
  CONSUMABLES,
  type ConsumableId,
  getCount,
  buyConsumable,
  priceOfConsumable,
  CONSUMABLE_EMOJI,
} from "../lib/consumables";
import { showRewarded } from "../lib/ads";
import { CONFIG } from "../lib/config";
import { t } from "../lib/i18n";
import { CoinIcon, CheckIcon, PlayIcon } from "../components/icons";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Zen Bubbles" },
      { name: "description", content: "Spend coins on bubble skins and background themes." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  // Bump to re-read owned/equipped after any action.
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  const [busy, setBusy] = useState(false);

  const onBuy = (item: CosmeticDef) => {
    if (buy(item.id) === "ok") equip(item.id); // auto-equip a fresh purchase
    refresh();
  };
  const onEquip = (item: CosmeticDef) => {
    equip(item.id);
    refresh();
  };
  const onBuyItem = (id: ConsumableId) => {
    buyConsumable(id);
    refresh();
  };
  // §3 rewarded: watch a video to EARN coins toward any skin/item.
  const onWatchEarn = async () => {
    if (busy) return;
    setBusy(true);
    const watched = await showRewarded("shop_earn_coins");
    if (watched) addCoins(CONFIG.ads.rewarded.coinReward, "rewarded_shop");
    setBusy(false);
    refresh();
  };

  return (
    <div
      className="screen-fade mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[calc(var(--ad-banner-h,72px)+env(safe-area-inset-bottom)+1.25rem)]"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
    >
      <header className="flex items-center justify-between py-3">
        <Link to="/" className="text-sm font-medium text-muted-foreground">
          {t("common.home")}
        </Link>
        <h1 className="text-sm font-semibold text-foreground">{t("shop.title")}</h1>
        <CoinBalance className="text-sm font-semibold text-foreground" />
      </header>

      {/* §3 Earn coins by watching a rewarded video — clearly ADDS coins. */}
      <button
        onClick={onWatchEarn}
        disabled={busy}
        className="btn btn-secondary mt-1 w-full gap-2 py-3 text-sm"
      >
        <PlayIcon size={15} />
        {t("shop.watchEarn", { coins: CONFIG.ads.rewarded.coinReward })}
      </button>

      <ItemsSection coins={getCoins()} onBuy={onBuyItem} />
      <Section title={t("shop.skins")} items={SKINS} onBuy={onBuy} onEquip={onEquip} />
      <Section title={t("shop.zenSkins")} items={ZEN_SKINS} onBuy={onBuy} onEquip={onEquip} />
    </div>
  );
}

/** Power-ups (consumables): Bomb + Time Freeze, bought with coins. */
function ItemsSection({ coins, onBuy }: { coins: number; onBuy: (id: ConsumableId) => void }) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {t("shop.items")}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {CONSUMABLES.map((c) => {
          const price = priceOfConsumable(c.id);
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-3 text-center">
              <div className="flex items-center justify-between">
                <span className="text-2xl leading-none" aria-hidden>
                  {CONSUMABLE_EMOJI[c.id]}
                </span>
                <span className="text-[11px] text-muted-foreground">×{getCount(c.id)}</span>
              </div>
              <div className="mt-1 text-left text-sm font-semibold text-foreground">
                {t(`items.${c.id}` as "items.bomb")}
              </div>
              <p className="mt-0.5 text-left text-[11px] leading-snug text-muted-foreground">
                {t(`items.${c.id}Desc` as "items.bombDesc")}
              </p>
              <button
                onClick={() => onBuy(c.id)}
                disabled={coins < price}
                className="btn btn-primary mt-2 w-full py-2 text-xs disabled:opacity-40"
              >
                <CoinIcon size={14} className="text-primary-foreground" />
                {price}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Section({
  title,
  items,
  onBuy,
  onEquip,
}: {
  title: string;
  items: CosmeticDef[];
  onBuy: (i: CosmeticDef) => void;
  onEquip: (i: CosmeticDef) => void;
}) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const owned = isOwned(item.id);
          const equipped = isEquipped(item.id);
          const price = priceOf(item);
          const affordable = getCoins() >= price;
          return (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-3">
              <img
                src={item.thumb}
                alt=""
                aria-hidden
                loading="lazy"
                className="mb-2 h-20 w-full rounded-xl border border-white/10 object-cover"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{item.name}</span>
                {item.rarity !== "starter" && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.rarity}
                  </span>
                )}
              </div>

              {equipped ? (
                <div className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full bg-primary/15 py-2 text-xs font-semibold text-primary">
                  <CheckIcon size={13} />
                  {t("shop.equipped")}
                </div>
              ) : owned ? (
                <button
                  onClick={() => onEquip(item)}
                  className="btn btn-ghost mt-2 w-full py-2 text-xs"
                >
                  {t("shop.equip")}
                </button>
              ) : (
                <button
                  onClick={() => onBuy(item)}
                  disabled={!affordable}
                  className="btn btn-primary mt-2 w-full py-2 text-xs"
                >
                  <CoinIcon size={14} className="text-primary-foreground" />
                  {price}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
