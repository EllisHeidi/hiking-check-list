import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format";
import type { Hike, HikePhoto } from "@/types";

export const HIKE_PHOTO_BUCKET = "hike-photos";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

export const HIKE_SELECT = `
  id, user_id, mountain_id, completed, completion_date, distance_km,
  elevation_gain_m, moving_time_minutes, notes, created_at,
  mountain:mountains ( id, name, slug, elevation, region, image_url, is_final_goal ),
  photos:hike_photos ( id, hike_id, storage_path, caption, created_at )
`;

export type HikeSort = "newest" | "longest" | "elevation";

export function normalizeHike(row: Record<string, unknown>): Hike {
  const photos = ((row.photos as HikePhoto[] | null) ?? []).slice().sort((a, b) =>
    a.storage_path.localeCompare(b.storage_path),
  );
  return {
    ...(row as unknown as Hike),
    distance_km: toNumber(row.distance_km),
    photos,
  };
}

/** Attach short-lived signed URLs to every photo (bucket is private). RLS decides who may sign. */
export async function signPhotos<T extends { photos: HikePhoto[] }>(
  supabase: SupabaseClient,
  items: T[],
): Promise<T[]> {
  const paths = items.flatMap((i) => i.photos.map((p) => p.storage_path));
  if (paths.length === 0) return items;
  const { data } = await supabase.storage.from(HIKE_PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  const urls = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return items.map((i) => ({
    ...i,
    photos: i.photos.map((p) => ({ ...p, url: urls.get(p.storage_path) ?? null })),
  }));
}

/** A user's hikes (RLS hides private users' hikes from others). */
export const getHikesForUser = cache(
  async (userId: string, opts: { sort?: HikeSort; withPhotos?: boolean; limit?: number } = {}) => {
    const supabase = await createClient();
    let q = supabase.from("user_hikes").select(HIKE_SELECT).eq("user_id", userId);
    if (opts.sort === "longest") q = q.order("distance_km", { ascending: false, nullsFirst: false });
    else if (opts.sort === "elevation") q = q.order("elevation_gain_m", { ascending: false, nullsFirst: false });
    q = q.order("completion_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);

    const { data, error } = await q;
    if (error) throw new Error(`Could not load hikes: ${error.message}`);
    const hikes = (data ?? []).map(normalizeHike);
    return opts.withPhotos ? signPhotos(supabase, hikes) : hikes;
  },
);

export async function getHike(id: string): Promise<Hike | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_hikes").select(HIKE_SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  const [hike] = await signPhotos(supabase, [normalizeHike(data)]);
  return hike;
}

export async function getHikesForMountain(userId: string, mountainId: string): Promise<Hike[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_hikes")
    .select(HIKE_SELECT)
    .eq("user_id", userId)
    .eq("mountain_id", mountainId)
    .order("completion_date", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`Could not load hikes: ${error.message}`);
  return signPhotos(supabase, (data ?? []).map(normalizeHike));
}
