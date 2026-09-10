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
  const ink = { color: "var(--gs-ink)" };
  return (
    <Modal
      onClose={onClose}
      closeLabel={t("bonus.close")}
      overlayClassName="gs-dialog-overlay"
      panelClassName="gs-panel relative max-h-[86vh] w-full max-w-sm overflow-y-auto p-6 text-center"
      closeClassName="text-[color:var(--gs-ink-soft)] hover:text-[color:var(--gs-ink)]"
    >
      <img
        src={heroImg}
        alt=""
        aria-hidden
        className="mb-4 h-36 w-full rounded-2xl border-2 border-white/70 object-cover"
        style={{ objectPosition: "50% 40%" }}
      />
      <h2 className="text-2xl font-extrabold" style={ink}>
        {t("onboarding.title")}
      </h2>
      <p className="mt-1 text-sm gs-muted">{t("onboarding.intro")}</p>

      <div className="mt-4 space-y-3 text-left">
        {/* Pop Challenge — the timed mode + its rules. */}
        <div className="rounded-2xl p-3" style={{ background: "rgba(51,224,198,0.12)" }}>
          <div className="flex items-center gap-2">
            <FlameIcon size={16} className="text-gold" />
            <span className="font-bold" style={ink}>
              {t("onboarding.challengeTitle")}
            </span>
            <span className="ml-auto text-[10px] uppercase tracking-wide gs-muted">
              {t("onboarding.challengeTag")}
            </span>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm gs-muted">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex gap-2">
                <span aria-hidden style={{ color: "var(--gs-green-2)" }}>
                  •
                </span>
                <span>{t(`onboarding.challengeRule${n}` as "onboarding.challengeRule1")}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pop for Fun — the relaxed, endless mode. */}
        <div className="rounded-2xl p-3" style={{ background: "rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2">
            <span className="font-bold" style={ink}>
              {t("onboarding.funTitle")}
            </span>
            <span className="ml-auto text-[10px] uppercase tracking-wide gs-muted">
              {t("onboarding.funTag")}
            </span>
          </div>
          <p className="mt-2 text-sm gs-muted">{t("onboarding.funDesc")}</p>
        </div>
      </div>

      <button onClick={onClose} className="gs-btn mt-5 w-full py-3.5">
        {t("onboarding.cta")}
      </button>
    </Modal>
  );
}
