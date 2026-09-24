import type { Achievement, UserStats } from "@/types";

export interface AchievementProgress {
  /** 0–1 */
  ratio: number;
  label: string;
}

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/**
 * How close a user is to an achievement. Awarding happens in the database
 * (public.sync_user_achievements); this only drives the progress bars.
 */
export function achievementProgress(
  a: Achievement,
  stats: UserStats,
  summitedFinalGoal: boolean,
): AchievementProgress {
  const target = a.requirement_value;
  let current = 0;
  let unit = "";
  switch (a.requirement_type) {
    case "mountains_completed":
      current = stats.mountainsConquered;
      unit = target === 1 ? " mountain" : " mountains";
      break;
    case "single_hike_km":
      current = stats.longestHikeKm;
      unit = " km";
      break;
    case "total_distance_km":
      current = stats.totalDistanceKm;
      unit = " km";
      break;
    case "total_elevation_m":
      current = stats.totalElevationM;
      unit = " m";
      break;
    case "summit_elevation_m":
      current = stats.highestSummit?.elevation ?? 0;
      unit = " m";
      break;
    case "final_goal":
      return {
        ratio: summitedFinalGoal ? 1 : 0,
        label: summitedFinalGoal ? "Summited" : "Not yet",
      };
  }
  return {
    ratio: target > 0 ? Math.min(1, current / target) : 1,
    label: `${nf.format(Math.min(current, target))} / ${nf.format(target)}${unit}`,
  };
}
