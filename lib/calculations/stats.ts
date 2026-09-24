import type { Hike, Mountain, UserStats } from "@/types";

/** Mountain ids the user has at least one completed hike on. */
export function conqueredMountainIds(hikes: Pick<Hike, "completed" | "mountain_id">[]): Set<string> {
  return new Set(hikes.filter((h) => h.completed).map((h) => h.mountain_id));
}

/** Earliest completion date per conquered mountain. */
export function firstSummitDates(hikes: Hike[]): Map<string, string> {
  const dates = new Map<string, string>();
  for (const h of hikes) {
    if (!h.completed || !h.completion_date) continue;
    const prev = dates.get(h.mountain_id);
    if (!prev || h.completion_date < prev) dates.set(h.mountain_id, h.completion_date);
  }
  return dates;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Every dashboard/profile statistic, derived from the user's hikes.
 * Distance and elevation count every logged hike (including turned-back
 * attempts); conquered/highest only count completed summits.
 * Mirrors public.sync_user_achievements() in the database.
 */
export function computeStats(hikes: Hike[], mountains: Pick<Mountain, "is_final_goal" | "elevation">[]): UserStats {
  const conquered = conqueredMountainIds(hikes);
  const totalDistanceKm = hikes.reduce((s, h) => s + (h.distance_km ?? 0), 0);
  const totalElevationM = hikes.reduce((s, h) => s + (h.elevation_gain_m ?? 0), 0);
  const withDistance = hikes.filter((h) => h.distance_km != null);
  const longestHikeKm = withDistance.reduce((m, h) => Math.max(m, h.distance_km ?? 0), 0);

  let highestSummit: UserStats["highestSummit"] = null;
  for (const h of hikes) {
    const el = h.mountain.elevation;
    if (!h.completed || el == null) continue;
    if (!highestSummit || el > highestSummit.elevation) {
      highestSummit = { name: h.mountain.name, elevation: el, slug: h.mountain.slug };
    }
  }

  const kilimanjaroElevation = mountains.find((m) => m.is_final_goal)?.elevation ?? null;

  return {
    mountainsConquered: conquered.size,
    totalMountains: mountains.length,
    percentComplete: mountains.length ? Math.round((conquered.size / mountains.length) * 100) : 0,
    totalHikes: hikes.length,
    totalDistanceKm: round1(totalDistanceKm),
    totalElevationM: Math.round(totalElevationM),
    highestSummit,
    longestHikeKm: round1(longestHikeKm),
    averageDistanceKm: withDistance.length ? round1(totalDistanceKm / withDistance.length) : 0,
    kilimanjaroElevation,
    kilimanjaroMultiple: kilimanjaroElevation
      ? Math.round((totalElevationM / kilimanjaroElevation) * 100) / 100
      : 0,
  };
}

/** First mountain in progression order not yet conquered; the final goal only once everything else is done. */
export function nextObjective(mountains: Mountain[], conquered: Set<string>): Mountain | null {
  const remaining = mountains.filter((m) => !conquered.has(m.id));
  return remaining.find((m) => !m.is_final_goal) ?? remaining[0] ?? null;
}
