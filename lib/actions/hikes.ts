"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { HIKE_PHOTO_BUCKET } from "@/lib/queries/hikes";
import { hikeSchema, fieldErrorsFrom, PHOTO_MAX_COUNT, type FieldErrors, type HikeInput } from "@/lib/validation/hike";

export type HikeActionResult =
  | { ok: true; hikeId: string; userId: string; unlocked: string[] }
  | { ok: false; errors: FieldErrors };

function toRow(input: HikeInput) {
  return {
    mountain_id: input.mountainId,
    completion_date: input.date,
    completed: input.completed,
    distance_km: input.distanceKm,
    elevation_gain_m: input.elevationGainM,
    moving_time_minutes: input.movingTimeMinutes,
    notes: input.notes || null,
  };
}

async function earnedIds(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.achievement_id as string));
}

/** Achievements earned by this change — shown with an unlock animation. */
async function newlyUnlocked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  before: Set<string>,
) {
  const { data } = await supabase
    .from("user_achievements")
    .select("achievement_id, achievement:achievements ( slug )")
    .eq("user_id", userId);
  return (data ?? [])
    .filter((r) => !before.has(r.achievement_id as string))
    .map((r) => (r.achievement as unknown as { slug: string } | null)?.slug)
    .filter((s): s is string => Boolean(s));
}

function revalidateAll() {
  for (const p of ["/", "/hikes", "/mountains", "/stats", "/achievements", "/activity", "/profile"]) {
    revalidatePath(p);
  }
  revalidatePath("/mountains/[slug]", "page");
  revalidatePath("/profile/[username]", "page");
}

export async function createHike(raw: HikeInput): Promise<HikeActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, errors: { form: "Your session has expired. Log in again." } };

  const parsed = hikeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const before = await earnedIds(supabase, user.id);

  // user_id comes from the verified session, never from the client.
  const { data, error } = await supabase
    .from("user_hikes")
    .insert({ ...toRow(parsed.data), user_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, errors: { form: "Could not save the hike. Try again." } };

  const unlocked = await newlyUnlocked(supabase, user.id, before);
  revalidateAll();
  return { ok: true, hikeId: data.id, userId: user.id, unlocked };
}

export async function updateHike(hikeId: string, raw: HikeInput): Promise<HikeActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, errors: { form: "Your session has expired. Log in again." } };
  if (!z.uuid().safeParse(hikeId).success) return { ok: false, errors: { form: "Unknown hike." } };

  const parsed = hikeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const before = await earnedIds(supabase, user.id);

  // RLS restricts this to the owner; the explicit user_id filter is defence in depth.
  const { data, error } = await supabase
    .from("user_hikes")
    .update(toRow(parsed.data))
    .eq("id", hikeId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, errors: { form: "Could not update the hike. Try again." } };
  if (!data) return { ok: false, errors: { form: "Hike not found." } };

  const unlocked = await newlyUnlocked(supabase, user.id, before);
  revalidateAll();
  return { ok: true, hikeId, userId: user.id, unlocked };
}

/**
 * Register photos the browser has already uploaded to Storage.
 * Both the Storage policy and the hike_photos RLS policy require the path to be
 * {auth.uid()}/{hikeId}/… and the hike to belong to the caller.
 */
export async function attachPhotos(hikeId: string, paths: string[]): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired." };
  if (!z.uuid().safeParse(hikeId).success) return { ok: false, error: "Unknown hike." };

  const prefix = `${user.id}/${hikeId}/`;
  const clean = paths.filter((p) => p.startsWith(prefix) && !p.includes("..")).slice(0, PHOTO_MAX_COUNT);
  if (clean.length === 0) return { ok: true };

  const supabase = await createClient();
  const { count } = await supabase
    .from("hike_photos")
    .select("id", { count: "exact", head: true })
    .eq("hike_id", hikeId);
  if ((count ?? 0) + clean.length > PHOTO_MAX_COUNT) {
    return { ok: false, error: `A hike can have at most ${PHOTO_MAX_COUNT} photos.` };
  }

  const { error } = await supabase
    .from("hike_photos")
    .insert(clean.map((storage_path) => ({ hike_id: hikeId, storage_path, user_id: user.id })));
  if (error) return { ok: false, error: "Could not save photos." };

  revalidateAll();
  return { ok: true };
}

export async function deletePhoto(photoId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !z.uuid().safeParse(photoId).success) return { ok: false };
  const supabase = await createClient();

  const { data: photo } = await supabase
    .from("hike_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!photo) return { ok: false };

  await supabase.storage.from(HIKE_PHOTO_BUCKET).remove([photo.storage_path]);
  await supabase.from("hike_photos").delete().eq("id", photoId).eq("user_id", user.id);
  revalidateAll();
  return { ok: true };
}

export async function deleteHike(hikeId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !z.uuid().safeParse(hikeId).success) return { ok: false };
  const supabase = await createClient();

  // Remove the image files first; the rows cascade with the hike.
  const { data: photos } = await supabase
    .from("hike_photos")
    .select("storage_path")
    .eq("hike_id", hikeId)
    .eq("user_id", user.id);
  if (photos?.length) {
    await supabase.storage.from(HIKE_PHOTO_BUCKET).remove(photos.map((p) => p.storage_path));
  }

  const { error, count } = await supabase
    .from("user_hikes")
    .delete({ count: "exact" })
    .eq("id", hikeId)
    .eq("user_id", user.id);
  if (error || !count) return { ok: false };

  revalidateAll();
  return { ok: true };
}
