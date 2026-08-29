import { useEffect, useRef, useState } from "react";
import { subscribeCombo } from "../lib/combo";
import { JUICE } from "../lib/juice";
import { t } from "../lib/i18n";

/**
 * Calm combo readout + milestone popup. Subscribes to the combo state machine
 * (so the bubble field never re-renders on combo changes) and paints a small
 * "x4" near the top of the field that pulses on each increment and fades on
 * reset, plus a brief "Combo x10!" flourish at milestones. Pointer-events:none
 * so it never blocks a bubble. Kept deliberately subtle to stay "zen".
 */
export function ComboHud() {
  const [combo, setCombo] = useState(0);
  const [pulse, setPulse] = useState(0); // bumps each pop → retriggers the pulse animation
  const [milestone, setMilestone] = useState<number | null>(null);
  const msTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const unsub = subscribeCombo((e) => {
      setCombo(e.combo);
      if (!e.reset) setPulse((p) => p + 1);
      if (e.milestone) {
        setMilestone(e.milestone);
        if (msTimer.current) clearTimeout(msTimer.current);
        msTimer.current = setTimeout(() => setMilestone(null), JUICE.combo.milestoneHoldMs);
      }
    });
    return () => {
      unsub();
      if (msTimer.current) clearTimeout(msTimer.current);
    };
  }, []);

  const show = combo >= JUICE.combo.minShown;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-2"
    >
      <div
        className="zc-combo"
        style={{
          opacity: show ? 1 : 0,
          transition: `opacity ${JUICE.combo.readoutFadeMs}ms ease`,
        }}
      >
        {/* key={pulse} remounts this span each pop so the pulse keyframe replays */}
        <span key={pulse} className="zc-combo-val">
          ×{combo}
        </span>
      </div>

      {milestone !== null && (
        <div key={milestone} className="zc-milestone">
          {t("combo.milestone", { n: milestone })}
        </div>
      )}
    </div>
  );
}
