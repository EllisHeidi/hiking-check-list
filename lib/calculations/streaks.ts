import type { Hike } from "@/types";

// Weekly streaks: a "hike week" is any Monday–Sunday week with at least one
// logged hike (summit or attempt). Weeks follow South African time.

export const STREAK_TIME_ZONE = "Africa/Johannesburg";
const DAY = 24 * 60 * 60 * 1000;

const parse = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Monday of the week containing this calendar date (YYYY-MM-DD). */
export function weekStart(date: string) {
  const t = parse(date);
  const weekday = (new Date(t).getUTCDay() + 6) % 7; // Mon = 0 … Sun = 6
  return iso(t - weekday * DAY);
}

export function todayInSA(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: STREAK_TIME_ZONE }); // YYYY-MM-DD
}

export interface StreakInfo {
  /** Consecutive hike weeks, counting this week if you've hiked, else up to last week. */
  current: number;
  longest: number;
  /** done = hiked this week; at-risk = streak alive but this week still needs a hike; none = no streak. */
  status: "done" | "at-risk" | "none";
  /** Days left this week including today (Sunday = 1). */
  daysLeft: number;
  /** The last `weeks` weeks, oldest first, for the strip. */
  recent: { week: string; hiked: boolean; current: boolean; hikes: number; elevationM: number; distanceKm: number }[];
  /** Next streak milestone to aim for (null once past the last one). */
  nextMilestone: { weeks: number; name: string } | null;
  /** Highest milestone already reached. */
  reachedMilestone: { weeks: number; name: string } | null;
  totalHikeWeeks: number;
}

export const STREAK_MILESTONES = [
  { weeks: 4, name: "Month on the trail" },
  { weeks: 8, name: "Two-month push" },
  { weeks: 13, name: "A full season" },
  { weeks: 26, name: "Half a year" },
  { weeks: 52, name: "Year-round hiker" },
] as const;

export function computeStreak(
  hikes: (Pick<Hike, "completion_date"> & Partial<Pick<Hike, "elevation_gain_m" | "distance_km">>)[],
  today = todayInSA(),
  weeks = 12,
): StreakInfo {
  const hikeWeeks = new Set(
    hikes
      .map((h) => h.completion_date)
      .filter((d): d is string => Boolean(d) && d! <= today)
      .map(weekStart),
  );

  const thisWeek = weekStart(today);
  const lastWeek = iso(parse(thisWeek) - 7 * DAY);
  const hasThis = hikeWeeks.has(thisWeek);
  const hasLast = hikeWeeks.has(lastWeek);

  let current = 0;
  const from = hasThis ? thisWeek : hasLast ? lastWeek : null;
  if (from) {
    for (let t = parse(from); hikeWeeks.has(iso(t)); t -= 7 * DAY) current++;
  }

  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of [...hikeWeeks].sort()) {
    const t = parse(w);
    run = prev !== null && t - prev === 7 * DAY ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }

  const weekday = (new Date(parse(today)).getUTCDay() + 6) % 7;
  // Per-week totals for the ridgeline.
  const totals = new Map<string, { hikes: number; elevationM: number; distanceKm: number }>();
  for (const h of hikes) {
    if (!h.completion_date || h.completion_date > today) continue;
    const w = weekStart(h.completion_date);
    const t = totals.get(w) ?? { hikes: 0, elevationM: 0, distanceKm: 0 };
    t.hikes += 1;
    t.elevationM += h.elevation_gain_m ?? 0;
    t.distanceKm += h.distance_km ?? 0;
    totals.set(w, t);
  }
  const recent = Array.from({ length: weeks }, (_, i) => {
    const week = iso(parse(thisWeek) - (weeks - 1 - i) * 7 * DAY);
    const t = totals.get(week) ?? { hikes: 0, elevationM: 0, distanceKm: 0 };
    return { week, hiked: hikeWeeks.has(week), current: week === thisWeek, ...t };
  });

  const nextMilestone = STREAK_MILESTONES.find((m) => m.weeks > current) ?? null;
  const reachedMilestone = [...STREAK_MILESTONES].reverse().find((m) => m.weeks <= longest) ?? null;

  return {
    current,
    longest,
    status: hasThis ? "done" : hasLast ? "at-risk" : "none",
    daysLeft: 7 - weekday,
    recent,
    totalHikeWeeks: hikeWeeks.size,
    nextMilestone: nextMilestone ? { ...nextMilestone } : null,
    reachedMilestone: reachedMilestone ? { ...reachedMilestone } : null,
  };
}
