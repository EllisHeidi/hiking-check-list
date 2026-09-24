import Link from "next/link";
import { ArrowDown, Check } from "lucide-react";
import type { Mountain } from "@/types";
import { fmtInt } from "@/lib/format";
import { shortName } from "@/lib/calculations/stats";

/**
 * Altitude ladder: every objective as a bar scaled to its elevation, with the
 * final goal set apart below a break. Status comes from the user's hikes.
 */
export function Progression({
  mountains,
  conquered,
  compact = false,
}: {
  mountains: Mountain[];
  conquered: Set<string>;
  compact?: boolean;
}) {
  const ladder = mountains.filter((m) => !m.is_final_goal);
  const finalGoal = mountains.find((m) => m.is_final_goal);
  const maxLocal = Math.max(...ladder.map((m) => m.elevation ?? 0), 1);
  // Scale so the tallest local peak fills ~85% and the final goal can overflow.
  const scale = (el: number | null) => (el ? Math.max(6, (el / maxLocal) * 85) : 4);
  const nextId = ladder.find((m) => !conquered.has(m.id))?.id;

  return (
    <div>
      <ol className="space-y-px">
        {ladder.map((m, i) => {
          const done = conquered.has(m.id);
          const isNext = m.id === nextId;
          return (
            <li key={m.id}>
              <Link
                href={`/mountains/${m.slug}`}
                className={`group grid grid-cols-[1.75rem_1fr_auto] items-center gap-3 rounded-xs px-1 transition-colors hover:bg-sand/60 ${
                  compact ? "py-1.5" : "py-2.5"
                }`}
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-full border ${
                    done ? "border-ember bg-ember text-stone-50" : isNext ? "border-forest text-forest" : "border-ink/25 text-transparent"
                  }`}
                  aria-label={done ? "Conquered" : "Not conquered"}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>

                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`truncate font-medium ${done ? "text-ink" : "text-charcoal/80"}`}>{m.name}</span>
                    {isNext && (
                      <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-forest">Next</span>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-ink/[0.06]">
                    <div
                      className={`h-full origin-left animate-grow ${done ? "bg-ember" : isNext ? "bg-forest" : "bg-dune"}`}
                      style={{ width: `${scale(m.elevation)}%`, animationDelay: `${i * 40}ms` }}
                    />
                  </div>
                </div>

                <span className={`w-20 text-right font-mono text-sm tabular-nums ${done ? "text-ink" : "text-mist"}`}>
                  {m.elevation ? `${fmtInt(m.elevation)} m` : "— m"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {finalGoal && (
        <>
          <div className="flex items-center gap-3 py-4 pl-1 text-mist">
            <ArrowDown className="size-5" aria-hidden />
            <span className="h-px flex-1 border-t border-dashed border-ink/25" />
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em]">
              +{fmtInt((finalGoal.elevation ?? 0) - maxLocal)} m
            </span>
          </div>
          <Link
            href={`/mountains/${finalGoal.slug}`}
            className={`flex items-end justify-between gap-4 rounded-sm px-4 py-5 transition-colors ${
              conquered.has(finalGoal.id) ? "bg-ember text-stone-50" : "bg-ink text-stone-50 hover:bg-charcoal"
            }`}
          >
            <div>
              <p className="eyebrow text-stone-50/60">{conquered.has(finalGoal.id) ? "✓ Conquered" : "Final objective"}</p>
              <p className="font-display mt-1 text-4xl sm:text-5xl">{shortName(finalGoal.name)}</p>
            </div>
            <p className="font-mono text-lg tabular-nums sm:text-xl">
              {finalGoal.elevation ? `${fmtInt(finalGoal.elevation)} m` : "— m"}
            </p>
          </Link>
        </>
      )}
    </div>
  );
}
