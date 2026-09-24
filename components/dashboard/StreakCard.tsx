import Link from "next/link";
import { Check, Flame, Hourglass, Trophy } from "lucide-react";
import type { StreakInfo } from "@/lib/calculations/streaks";
import { fmtDate, fmtDec, fmtInt } from "@/lib/format";

/**
 * Weekly streak: consecutive Monday–Sunday weeks with at least one hike.
 * The last 12 weeks are drawn as a ridgeline — each hiking week is a peak
 * as tall as the elevation gained that week; missed weeks are valleys.
 */
export function StreakCard({ streak }: { streak: StreakInfo }) {
  const { current, longest, status, daysLeft, recent, nextMilestone, reachedMilestone } = streak;
  const alive = current > 0;
  const prevTarget = [0, 4, 8, 13, 26, 52].filter((w) => w <= current).pop() ?? 0;
  const progress = nextMilestone ? (current - prevTarget) / (nextMilestone.weeks - prevTarget) : 1;

  return (
    <div className="relative isolate overflow-hidden rounded-sm bg-ink p-5 text-stone-50 sm:p-7">
      {/* Warm glow while the streak is alive. */}
      {alive && (
        <div
          aria-hidden
          className="absolute -top-24 -right-16 -z-10 size-64 rounded-full bg-ember/25 blur-3xl"
        />
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow text-stone-50/60">Weekly streak</p>
        <StatusChip status={status} daysLeft={daysLeft} />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Flame
          className={`size-14 shrink-0 ${
            alive
              ? "animate-flicker fill-ember/40 text-ember drop-shadow-[0_0_14px_rgba(194,84,45,0.65)]"
              : "text-stone-50/25"
          }`}
          strokeWidth={1.5}
          aria-hidden
        />
        <div>
          <p className="font-display text-7xl leading-none tabular-nums sm:text-8xl">
            {current}
            <span className="ml-2 text-[0.35em] text-stone-50/60">{current === 1 ? "week" : "weeks"}</span>
          </p>
          {longest > 0 ? (
            <p className="mt-1 font-mono text-xs text-stone-50/60">
              Best {longest} {longest === 1 ? "week" : "weeks"}
              {reachedMilestone && <> · {reachedMilestone.name}</>}
            </p>
          ) : (
            <p className="mt-1 font-mono text-xs text-stone-50/60">Your first peak is one hike away</p>
          )}
        </div>
      </div>

      <Ridgeline weeks={recent} />

      {nextMilestone ? (
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3 font-mono text-[0.65rem] uppercase tracking-[0.14em]">
            <span className="flex items-center gap-1.5 text-stone-50/70">
              <Trophy className="size-3.5 text-ember" aria-hidden /> Next: {nextMilestone.name}
            </span>
            <span className="text-stone-50/50">
              {current}/{nextMilestone.weeks} wks
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-50/10">
            <div
              className="h-full origin-left animate-grow rounded-full bg-gradient-to-r from-ember/70 to-ember"
              style={{ width: `${Math.max(3, Math.round(progress * 100))}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-5 flex items-center gap-2 font-mono text-xs text-ember">
          <Trophy className="size-4" aria-hidden /> Every milestone conquered. Legend.
        </p>
      )}

      {status === "none" && (
        <Link
          href="/hikes/new"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-sm bg-ember px-5 font-mono text-xs font-medium uppercase tracking-[0.16em] text-stone-50 transition-colors hover:bg-ember-600"
        >
          Start a streak
        </Link>
      )}

      <p className="mt-5 border-t border-stone-50/10 pt-3 text-xs text-stone-50/45">
        One hike a week (Mon–Sun) keeps it alive — summits and turned-back attempts both count. Peak height is the
        elevation you gained that week.
      </p>
    </div>
  );
}

function StatusChip({ status, daysLeft }: { status: StreakInfo["status"]; daysLeft: number }) {
  const base = "inline-flex items-center gap-1.5 rounded-xs px-2 py-1 font-mono text-[0.6rem] font-medium uppercase tracking-[0.14em]";
  if (status === "done") {
    return (
      <span className={`${base} bg-forest text-stone-50`} role="status">
        <Check className="size-3" strokeWidth={3} aria-hidden /> Done this week
      </span>
    );
  }
  if (status === "at-risk") {
    return (
      <span className={`${base} animate-pulse bg-ember text-stone-50`} role="status">
        <Hourglass className="size-3" aria-hidden />
        {daysLeft === 1 ? "Last day!" : `${daysLeft} days left`}
      </span>
    );
  }
  return (
    <span className={`${base} border border-stone-50/25 text-stone-50/70`} role="status">
      No streak yet
    </span>
  );
}

/** The last 12 weeks as a mountain range: hiking weeks are peaks, sized by elevation gained. */
function Ridgeline({ weeks }: { weeks: StreakInfo["recent"] }) {
  const W = 360;
  const H = 96;
  const base = H - 4;
  const step = W / weeks.length;
  const maxGain = Math.max(...weeks.map((w) => w.elevationM), 1);
  const peakH = (w: StreakInfo["recent"][number]) =>
    w.hiked ? 30 + 48 * Math.sqrt(w.elevationM / maxGain) : 10 + ((w.week.charCodeAt(9) % 3) * 3);
  const shape = (i: number, h: number) => {
    const x = step * i + step / 2;
    const half = step * 0.95;
    return { x, d: `M ${x - half} ${base} L ${x - half * 0.35} ${base - h * 0.62} L ${x} ${base - h} L ${x + half * 0.4} ${base - h * 0.7} L ${x + half} ${base} Z` };
  };
  // Draw valleys first so hiked peaks overlap them.
  const order = weeks.map((w, i) => ({ w, i })).sort((a, b) => Number(a.w.hiked) - Number(b.w.hiked));

  return (
    <figure className="mt-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${weeks.filter((w) => w.hiked).length} of the last ${weeks.length} weeks had a hike`}>
        <defs>
          <linearGradient id="peak-hiked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e07a4f" />
            <stop offset="1" stopColor="#a8441f" />
          </linearGradient>
        </defs>
        {order.map(({ w, i }) => {
          const h = peakH(w);
          const { x, d } = shape(i, h);
          return (
            <g key={w.week}>
              <title>
                {`Week of ${fmtDate(w.week)}${
                  w.hiked
                    ? ` — ${w.hikes} ${w.hikes === 1 ? "hike" : "hikes"}, ${fmtDec(w.distanceKm)} km, +${fmtInt(w.elevationM)} m`
                    : " — no hike"
                }`}
              </title>
              <path
                d={d}
                fill={w.hiked ? "url(#peak-hiked)" : "rgba(244,240,232,0.08)"}
                stroke={w.current && !w.hiked ? "rgba(244,240,232,0.45)" : "none"}
                strokeDasharray={w.current && !w.hiked ? "3 3" : undefined}
              />
              {w.hiked && <circle cx={x} cy={base - h - 5} r={2.5} fill="#f4f0e8" />}
            </g>
          );
        })}
        <line x1="0" x2={W} y1={base + 0.5} y2={base + 0.5} stroke="rgba(244,240,232,0.15)" />
      </svg>
      <figcaption className="mt-1.5 flex justify-between font-mono text-[0.6rem] uppercase tracking-[0.12em] text-stone-50/45">
        <span>12 weeks ago</span>
        <span>This week</span>
      </figcaption>
    </figure>
  );
}
