/**
 * P1-T10 — first-run "How to Play" onboarding. Shows once (localStorage flag) on
 * the home screen, with Cowork's hand-popping hero + three calm steps. Reuses the
 * shared Modal (P1-T8). Client-only decision (effect) so there's no SSR mismatch.
 */
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { t } from "../lib/i18n";
import heroImg from "../assets/scene/loading-hero.webp";

const KEY = "zb_onboarded";

export function Onboarding() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setOpen(true);
    } catch {
      /* storage unavailable — skip onboarding rather than nag */
    }
  }, []);
  if (!open) return null;

  const done = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Modal onClose={done} closeLabel={t("bonus.close")}>
      <img
        src={heroImg}
        alt=""
        aria-hidden
        loading="lazy"
        className="mb-4 h-40 w-full rounded-xl object-cover"
        style={{ objectPosition: "50% 42%" }}
      />
      <h2 className="text-2xl font-extrabold text-foreground">{t("onboarding.title")}</h2>
      <ol className="mx-auto mt-4 max-w-[16rem] space-y-3 text-left">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {n}
            </span>
            <span className="text-sm text-muted-foreground">{t(`onboarding.step${n}`)}</span>
          </li>
        ))}
      </ol>
      <button onClick={done} className="btn btn-primary mt-6 w-full">
        {t("onboarding.cta")}
      </button>
    </Modal>
  );
}
