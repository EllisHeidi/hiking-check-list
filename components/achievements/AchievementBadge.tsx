import type { Achievement } from "@/types";
import { fmtDate } from "@/lib/format";
import type { AchievementProgress } from "@/lib/achievements/progress";
import { AchievementIcon } from "./AchievementIcon";

export function AchievementBadge({
  achievement,
  earnedAt,
  progress,
  size = "md",
}: {
  achievement: Pick<Achievement, "name" | "description" | "icon" | "slug">;
  earnedAt: string | null;
  progress?: AchievementProgress;
  size?: "sm" | "md";
}) {
  const earned = Boolean(earnedAt);

  if (size === "sm") {
    return (
      <div className="flex items-center gap-3" title={achievement.description ?? undefined}>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            earned ? "bg-forest text-stone-50" : "border border-dashed border-ink/25 text-mist"
          }`}
        >
          <AchievementIcon name={achievement.icon} className="size-5" />
        </span>
        <span className={`font-display text-xl ${earned ? "" : "text-mist"}`}>{achievement.name}</span>
      </div>
    );
  }

  return (
    <article
      className={`flex h-full flex-col rounded-sm border p-5 ${
        earned ? "border-forest/30 bg-stone-50 shadow-card" : "border-ink/10 bg-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-14 items-center justify-center rounded-full ${
            earned ? "bg-forest text-stone-50" : "border border-dashed border-ink/25 text-mist"
          }`}
        >
          <AchievementIcon name={achievement.icon} className="size-7" />
        </span>
        <span className={`font-mono text-[0.6rem] uppercase tracking-[0.16em] ${earned ? "text-ember" : "text-mist"}`}>
          {earned ? "Earned" : "Locked"}
        </span>
      </div>
      <h3 className={`font-display mt-4 text-3xl ${earned ? "" : "text-charcoal/70"}`}>{achievement.name}</h3>
      <p className="mt-1 flex-1 text-sm text-slate">{achievement.description}</p>

      {earned ? (
        <p className="mt-4 font-mono text-xs text-slate">{fmtDate(earnedAt)}</p>
      ) : progress ? (
        <div className="mt-4">
          <div className="h-1 bg-ink/10">
            <div className="h-full origin-left animate-grow bg-forest" style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
          </div>
          <p className="mt-2 font-mono text-xs text-slate">{progress.label}</p>
        </div>
      ) : null}
    </article>
  );
}
