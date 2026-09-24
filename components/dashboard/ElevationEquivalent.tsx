import type { UserStats } from "@/types";
import { fmtInt } from "@/lib/format";
import { shortName } from "@/lib/calculations/stats";

/** Cumulative elevation gain expressed in multiples of your final objective. A comparison — not altitude reached. */
export function ElevationEquivalent({ stats }: { stats: UserStats }) {
  const goal = stats.finalGoal;
  const kili = goal?.elevation;
  if (!goal || !kili) return null;
  const name = shortName(goal.name);
  const whole = Math.floor(stats.finalGoalMultiple);
  const partial = stats.finalGoalMultiple - whole;
  const icons = Math.min(whole, 12);

  return (
    <div className="rounded-sm border border-ink/10 bg-stone-50 p-5 sm:p-8">
      <p className="eyebrow">{name} equivalent</p>
      <p className="mt-4 text-slate">You have climbed</p>
      <p className="font-display text-6xl tabular-nums sm:text-7xl">
        {fmtInt(stats.totalElevationM)}
        <span className="text-[0.45em] text-slate"> m</span>
      </p>
      <p className="mt-2 text-lg">
        That&apos;s{" "}
        <strong className="font-display text-3xl text-ember">{stats.finalGoalMultiple.toFixed(2)}×</strong>{" "}
        {goal.name}.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-1.5" aria-hidden>
        {Array.from({ length: icons }, (_, i) => (
          <Peak key={i} fill={1} />
        ))}
        {whole < 12 && <Peak fill={partial} />}
        {whole >= 12 && <span className="font-mono text-xs text-slate">+{whole - 12}</span>}
      </div>

      <p className="mt-6 border-t border-ink/10 pt-4 text-sm text-mist">
        Total elevation gained across all your hikes, compared with {name}&apos;s {fmtInt(kili)} m summit.
        It&apos;s an elevation comparison — not the altitude you&apos;ve actually reached.
      </p>
    </div>
  );
}

function Peak({ fill }: { fill: number }) {
  const id = `peak-${Math.round(fill * 100)}`;
  return (
    <svg viewBox="0 0 40 28" className="h-7 w-10">
      <defs>
        <clipPath id={id}>
          <rect x="0" y={28 - 28 * fill} width="40" height={28 * fill} />
        </clipPath>
      </defs>
      <path d="M1 27 L15 5 L21 13 L26 7 L39 27 Z" className="fill-none stroke-ink/30" strokeWidth="1.2" />
      <path d="M1 27 L15 5 L21 13 L26 7 L39 27 Z" className="fill-ember" clipPath={`url(#${id})`} />
    </svg>
  );
}
