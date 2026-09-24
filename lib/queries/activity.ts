import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format";
import { signPhotos } from "./hikes";
import type { ActivityItem, HikePhoto } from "@/types";

const ACTIVITY_SELECT = `
  id, activity_type, created_at,
  user:profiles ( id, username, display_name, avatar_url ),
  hike:user_hikes (
    id, completed, completion_date, distance_km, elevation_gain_m, moving_time_minutes,
    mountain:mountains ( id, name, slug, elevation, region, image_url, is_final_goal ),
    photos:hike_photos ( id, hike_id, storage_path, caption )
  ),
  achievement:achievements ( id, name, slug, icon )
`;

/**
 * Activity from the given users, newest first. RLS additionally hides anyone
 * whose profile is private, so following a private user reveals nothing.
 */
export async function getActivityFor(userIds: string[], limit = 30): Promise<ActivityItem[]> {
  if (userIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity")
    .select(ACTIVITY_SELECT)
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load activity: ${error.message}`);

  const items = (data ?? []).map((row) => {
    const r = row as unknown as ActivityItem;
    const hike = r.hike
      ? {
          ...r.hike,
          distance_km: toNumber(r.hike.distance_km),
          photos: ((r.hike.photos as HikePhoto[] | null) ?? []).slice(0, 3),
        }
      : null;
    return { ...r, hike, photos: hike?.photos ?? [] };
  });

  const signed = await signPhotos(supabase, items);
  return signed.map(({ photos, ...item }) => ({
    ...item,
    hike: item.hike ? { ...item.hike, photos } : null,
  }));
}
