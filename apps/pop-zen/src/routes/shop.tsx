import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { ScreenShell } from "../components/gameshell";

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
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  const [busy, setBusy] = useState(false);

  const onBuy = (item: CosmeticDef) => {
    if (buy(item.id) === "ok") equip(item.id);
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
  const onWatchEarn = async () => {
    if (busy) return;
    setBusy(true);
    const watched = await showRewarded("shop_earn_coins");
    if (watched) addCoins(CONFIG.ads.rewarded.coinReward, "rewarded_shop");
    setBusy(false);
    refresh();
  };

  return (
    <ScreenShell title={t("shop.title")} nav="shop">
      {/* Earn coins by watching a rewarded video — clearly ADDS coins. */}
      <button
        onClick={onWatchEarn}
        disabled={busy}
        className="gs-btn gs-btn--ghost mt-2 w-full gap-2 px-4 py-3 text-sm disabled:opacity-50"
      >
        <PlayIcon size={15} />
        {t("shop.watchEarn", { coins: CONFIG.ads.rewarded.coinReward })}
      </button>

      <ItemsSection coins={getCoins()} onBuy={onBuyItem} />
      <Section title={t("shop.skins")} items={SKINS} onBuy={onBuy} onEquip={onEquip} />
      <Section title={t("shop.zenSkins")} items={ZEN_SKINS} onBuy={onBuy} onEquip={onEquip} />
    </ScreenShell>
  );
}

const INK = { color: "var(--gs-ink)" };

function ItemsSection({ coins, onBuy }: { coins: number; onBuy: (id: ConsumableId) => void }) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] gs-muted">
        {t("shop.items")}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {CONSUMABLES.map((c) => {
          const price = priceOfConsumable(c.id);
          return (
            <div key={c.id} className="gs-panel p-3 text-center">
              <div className="flex items-center justify-between">
                <span className="text-2xl leading-none" aria-hidden>
                  {CONSUMABLE_EMOJI[c.id]}
                </span>
                <span className="text-[11px] gs-muted">×{getCount(c.id)}</span>
              </div>
              <div className="mt-1 text-left text-sm font-bold" style={INK}>
                {t(`items.${c.id}` as "items.bomb")}
              </div>
              <p className="mt-0.5 text-left text-[11px] leading-snug gs-muted">
                {t(`items.${c.id}Desc` as "items.bombDesc")}
              </p>
              <button
                onClick={() => onBuy(c.id)}
                disabled={coins < price}
                className="gs-btn mt-2 w-full gap-1 px-2 py-2 text-xs disabled:opacity-40"
              >
                <CoinIcon size={14} className="text-white" />
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
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] gs-muted">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const owned = isOwned(item.id);
          const equipped = isEquipped(item.id);
          const price = priceOf(item);
          const affordable = getCoins() >= price;
          return (
            <div key={item.id} className="gs-panel p-3">
              <img
                src={item.thumb}
                alt=""
                aria-hidden
                loading="lazy"
                className="mb-2 h-20 w-full rounded-xl border border-white/40 object-cover"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={INK}>
                  {item.name}
                </span>
                {item.rarity !== "starter" && (
                  <span className="text-[10px] uppercase tracking-wide gs-muted">
                    {t(`rarity.${item.rarity}` as "rarity.common")}
                  </span>
                )}
              </div>

              {equipped ? (
                <div
                  className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full bg-[color:var(--gs-green-2)]/20 py-2 text-xs font-bold"
                  style={{ color: "var(--gs-green-edge)" }}
                >
                  <CheckIcon size={13} />
                  {t("shop.equipped")}
                </div>
              ) : owned ? (
                <button
                  onClick={() => onEquip(item)}
                  className="gs-btn gs-btn--ghost mt-2 w-full px-2 py-2 text-xs"
                >
                  {t("shop.equip")}
                </button>
              ) : (
                <button
                  onClick={() => onBuy(item)}
                  disabled={!affordable}
                  className="gs-btn mt-2 w-full gap-1 px-2 py-2 text-xs disabled:opacity-40"
                >
                  <CoinIcon size={14} className="text-white" />
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
