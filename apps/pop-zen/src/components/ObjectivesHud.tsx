import type { Objective } from "../lib/objectives";
import { t } from "../lib/i18n";

/**
 * Compact per-run objectives list (§8) — top-left of the field, non-nagging.
 * Completed objectives get a satisfying check + strike-through. Pointer-events
 * off so it never blocks a bubble.
 */
export function ObjectivesHud({
  objectives,
  completed,
}: {
  objectives: Objective[];
  completed: Set<string>;
}) {
  if (objectives.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1">
      {objectives.map((o) => {
        const done = completed.has(o.id);
        return (
          <div
            key={o.id}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm ${
              done
                ? "bg-primary/20 text-primary line-through"
                : "bg-background/40 text-muted-foreground"
            }`}
          >
            {done ? "✓ " : "○ "}
            {t(o.labelKey, { n: o.n })}
          </div>
        );
      })}
    </div>
  );
}
