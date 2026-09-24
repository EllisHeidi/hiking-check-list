import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format";
import type { Profile } from "@/types";

export interface LeaderboardEntry {
  user: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  summits: number;
  firstSummit: string | null;
  /** Fastest logged moving time on a summit, with that hike's distance. */
  fastest: { minutes: number; distanceKm: number | null; hikeId: string } | null;
}

/**
 * Everyone who has summited a mountain. RLS only returns hikes from public
 * profiles (and your own), so private hikers never appear to others.
 */
export async function getMountainLeaderboard(mountainId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_hikes")
    .select("id, user_id, completion_date, moving_time_minutes, distance_km, user:profiles ( id, username, display_name, avatar_url )")
    .eq("mountain_id", mountainId)
    .eq("completed", true)
    .limit(2000);
  if (error) throw new Error(`Could not load the leaderboard: ${error.message}`);

  const byUser = new Map<string, LeaderboardEntry>();
  for (const row of data ?? []) {
    const user = row.user as unknown as LeaderboardEntry["user"] | null;
    if (!user) continue;
    const e = byUser.get(user.id) ?? { user, summits: 0, firstSummit: null, fastest: null };
    e.summits += 1;
    const date = row.completion_date as string | null;
    if (date && (!e.firstSummit || date < e.firstSummit)) e.firstSummit = date;
    const minutes = row.moving_time_minutes as number | null;
    if (minutes && (!e.fastest || minutes < e.fastest.minutes)) {
      e.fastest = { minutes, distanceKm: toNumber(row.distance_km), hikeId: row.id as string };
    }
    byUser.set(user.id, e);
  }

  const entries = [...byUser.values()];
  const mostSummits = [...entries].sort(
    (a, b) => b.summits - a.summits || (a.firstSummit ?? "9").localeCompare(b.firstSummit ?? "9"),
  );
  const fastest = entries
    .filter((e) => e.fastest)
    .sort((a, b) => a.fastest!.minutes - b.fastest!.minutes);
  return { mostSummits, fastest, hikers: entries.length };
}
