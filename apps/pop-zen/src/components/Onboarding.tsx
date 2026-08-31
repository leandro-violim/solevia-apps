/**
 * "How to Play" modal. Cowork's hand-popping hero + an explanation of the two
 * modes (Pop Challenge / Pop for Fun) with the Challenge rules, in the shared
 * Modal (P1-T8). F6: no longer auto-shown on launch — the game is meant to be
 * intuitive; this opens on demand from Settings. Controlled via `open`.
 */
import { Modal } from "./Modal";
import { t } from "../lib/i18n";
import { FlameIcon } from "./icons";
import heroImg from "../assets/scene/loading-hero.webp";

export function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Modal onClose={onClose} closeLabel={t("bonus.close")}>
      <img
        src={heroImg}
        alt=""
        aria-hidden
        className="mb-4 h-36 w-full rounded-xl object-cover"
        style={{ objectPosition: "50% 40%" }}
      />
      <h2 className="text-2xl font-extrabold text-foreground">{t("onboarding.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("onboarding.intro")}</p>

      <div className="mt-4 space-y-3 text-left">
        {/* Pop Challenge — the timed mode + its rules. */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <FlameIcon size={16} className="text-gold" />
            <span className="font-bold text-foreground">{t("onboarding.challengeTitle")}</span>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("onboarding.challengeTag")}
            </span>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex gap-2">
                <span aria-hidden className="text-primary">
                  •
                </span>
                <span>{t(`onboarding.challengeRule${n}` as "onboarding.challengeRule1")}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pop for Fun — the relaxed, endless mode. */}
        <div className="rounded-xl border border-border/60 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{t("onboarding.funTitle")}</span>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("onboarding.funTag")}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t("onboarding.funDesc")}</p>
        </div>
      </div>

      <button onClick={onClose} className="btn btn-primary mt-5 w-full">
        {t("onboarding.cta")}
      </button>
    </Modal>
  );
}
