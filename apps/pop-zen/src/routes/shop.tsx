import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CoinBalance } from "../components/CoinBalance";
import {
  SKINS,
  ZEN_SKINS,
  THEMES,
  type CosmeticDef,
  priceOf,
  isOwned,
  isEquipped,
  buy,
  equip,
  grantOwned,
} from "../lib/skins";
import { getCoins, spendCoins } from "../lib/economy";
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
  // §3 rewarded: watch to knock the discount off, then buy at the reduced price.
  const onWatchDiscount = async (item: CosmeticDef) => {
    if (busy) return;
    setBusy(true);
    const watched = await showRewarded("shop_discount");
    if (watched) {
      const discounted = Math.round(priceOf(item) * (1 - CONFIG.ads.rewarded.shopDiscountPct));
      if (getCoins() >= discounted) {
        spendCoins(discounted, `skin:${item.id}:discounted`);
        grantOwned(item.id, "rewarded_discount");
        equip(item.id);
      }
    }
    setBusy(false);
    refresh();
  };

  return (
    <div
      className="screen-fade mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
    >
      <header className="flex items-center justify-between py-3">
        <Link to="/" className="text-sm font-medium text-muted-foreground">
          {t("common.home")}
        </Link>
        <h1 className="text-sm font-semibold text-foreground">{t("shop.title")}</h1>
        <CoinBalance className="text-sm font-semibold text-foreground" />
      </header>

      <Section
        title={t("shop.skins")}
        items={SKINS}
        onBuy={onBuy}
        onEquip={onEquip}
        onWatch={onWatchDiscount}
        busy={busy}
      />
      <Section
        title={t("shop.zenSkins")}
        items={ZEN_SKINS}
        onBuy={onBuy}
        onEquip={onEquip}
        onWatch={onWatchDiscount}
        busy={busy}
      />
      <Section
        title={t("shop.themes")}
        items={THEMES}
        onBuy={onBuy}
        onEquip={onEquip}
        onWatch={onWatchDiscount}
        busy={busy}
      />
    </div>
  );
}

function Section({
  title,
  items,
  onBuy,
  onEquip,
  onWatch,
  busy,
}: {
  title: string;
  items: CosmeticDef[];
  onBuy: (i: CosmeticDef) => void;
  onEquip: (i: CosmeticDef) => void;
  onWatch: (i: CosmeticDef) => void;
  busy: boolean;
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
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    onClick={() => onBuy(item)}
                    disabled={!affordable}
                    className="btn btn-primary w-full py-2 text-xs"
                  >
                    <CoinIcon size={14} className="text-primary-foreground" />
                    {price}
                  </button>
                  <button
                    onClick={() => onWatch(item)}
                    disabled={busy}
                    className="btn btn-ghost w-full gap-1 py-1.5 text-[11px] text-accent"
                  >
                    <PlayIcon size={12} />
                    {t("shop.watchDiscount", {
                      pct: Math.round(CONFIG.ads.rewarded.shopDiscountPct * 100),
                    })}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
