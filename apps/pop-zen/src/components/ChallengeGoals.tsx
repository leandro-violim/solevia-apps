/**
 * Pop Challenge goals panel. Replaces the old on-field objectives overlay (which
 * covered the top-left bubble). Used two ways:
 *  - intro (before the run starts): the goals + their coin rewards.
 *  - progress (between phases): each goal with a live count / done state.
 */
import type { Objective } from "../lib/objectives";
import { getRunStats } from "../lib/run-stats";
import { t } from "../lib/i18n";
import { CheckIcon, CoinIcon } from "./icons";

export function ChallengeGoals({
  objectives,
  completed,
  showProgress = false,
}: {
  objectives: Objective[];
  completed: Set<string>;
  showProgress?: boolean;
}) {
  if (objectives.length === 0) return null;
  const s = getRunStats();

  return (
    <ul className="mx-auto max-w-[15rem] space-y-2 text-left">
      {objectives.map((o) => {
        const done = completed.has(o.id) || o.done(s);
        const cur = o.current(s);
        return (
          <li key={o.id} className="flex items-center gap-2.5 text-sm">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={
                done
                  ? { background: "rgba(51,224,198,0.2)", color: "var(--gs-green-2)" }
                  : { border: "1px solid rgba(38,48,74,0.22)" }
              }
            >
              {done && <CheckIcon size={12} />}
            </span>
            <span
              className={done ? "line-through" : undefined}
              style={{ color: done ? "var(--gs-green-2)" : "var(--gs-ink)" }}
            >
              {t(o.labelKey, { n: o.n })}
            </span>
            <span className="ml-auto shrink-0 text-xs tabular-nums">
              {done ? (
                <span className="inline-flex items-center gap-1 font-semibold text-gold">
                  +{o.reward}
                  <CoinIcon size={12} className="text-gold" />
                </span>
              ) : showProgress && cur !== null ? (
                <span style={{ color: "var(--gs-ink-soft)" }}>
                  {Math.min(cur, o.n)}/{o.n}
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1"
                  style={{ color: "var(--gs-ink-soft)" }}
                >
                  +{o.reward}
                  <CoinIcon size={12} className="text-gold" />
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
