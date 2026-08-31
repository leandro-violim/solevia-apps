/**
 * "How to Play" modal. Cowork's hand-popping hero + three calm steps, in the
 * shared Modal (P1-T8). F6: no longer auto-shown on launch — the game is meant to
 * be intuitive; this now opens on demand from Settings. Controlled via `open`.
 */
import { Modal } from "./Modal";
import { t } from "../lib/i18n";
import heroImg from "../assets/scene/loading-hero.webp";

export function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Modal onClose={onClose} closeLabel={t("bonus.close")}>
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
      <button onClick={onClose} className="btn btn-primary mt-6 w-full">
        {t("onboarding.cta")}
      </button>
    </Modal>
  );
}
