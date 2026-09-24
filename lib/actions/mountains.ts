"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { mountainSchema, slugify, mapsUrl, type MountainInput } from "@/lib/validation/mountain";
import { isStage, stageForElevation, type StageKey } from "@/lib/stages";

type Result = { ok: true; slug?: string } | { ok: false; error: string };

const uuid = z.uuid();

function revalidateLists() {
  for (const p of ["/", "/mountains", "/mountains/add", "/mountains/manage", "/stats", "/achievements", "/profile", "/hikes/new"]) {
    revalidatePath(p);
  }
  revalidatePath("/mountains/[slug]", "page");
  revalidatePath("/profile/[username]", "page");
}

async function nextSortOrder(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("user_mountains")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("is_final_goal", false)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number | undefined) ?? 0) + 1;
}

async function defaultStage(supabase: Awaited<ReturnType<typeof createClient>>, mountainId: string) {
  // Progression mountains keep their suggested stage; others get one from elevation.
  const { data } = await supabase.from("mountains").select("*").eq("id", mountainId).maybeSingle();
  const suggested = (data as { starter_stage?: unknown } | null)?.starter_stage;
  return isStage(suggested) ? suggested : stageForElevation((data?.elevation as number | null | undefined) ?? null);
}

// --- Your list -------------------------------------------------------------

export async function addToList(mountainId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!uuid.safeParse(mountainId).success) return { ok: false, error: "Unknown mountain." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_mountains")
    .upsert(
      {
        user_id: user.id,
        mountain_id: mountainId,
        sort_order: await nextSortOrder(supabase, user.id),
        stage: await defaultStage(supabase, mountainId),
      },
      { onConflict: "user_id,mountain_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: "Couldn't add it to your list." };
  revalidateLists();
  return { ok: true };
}

export async function removeFromList(mountainId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!uuid.safeParse(mountainId).success) return { ok: false, error: "Unknown mountain." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_mountains")
    .delete()
    .eq("user_id", user.id)
    .eq("mountain_id", mountainId);
  if (error) return { ok: false, error: "Couldn't remove it." };
  revalidateLists();
  return { ok: true };
}

/**
 * Save a new order (and stage) for your list, from drag and drop. `entries`
 * must be exactly the mountains currently on your list, excluding the final
 * objective, in their new order.
 */
export async function reorderList(entries: { mountainId: string; stage: StageKey }[]): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (
    !Array.isArray(entries) ||
    entries.length > 500 ||
    !entries.every((e) => e && uuid.safeParse(e.mountainId).success && isStage(e.stage))
  ) {
    return { ok: false, error: "Invalid order." };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_mountains")
    .select("id, mountain_id")
    .eq("user_id", user.id)
    .eq("is_final_goal", false);
  const rowByMountain = new Map((data ?? []).map((r) => [r.mountain_id as string, r.id as string]));
  const ids = entries.map((e) => e.mountainId);
  const sameSet =
    ids.length === rowByMountain.size && new Set(ids).size === ids.length && ids.every((id) => rowByMountain.has(id));
  // Stale order (list changed in another tab) — ask the client to refresh.
  if (!sameSet) return { ok: false, error: "Your list changed — refresh and try again." };

  const results = await Promise.all(
    entries.map((e, i) =>
      supabase
        .from("user_mountains")
        .update({ sort_order: i + 1, stage: e.stage })
        .eq("id", rowByMountain.get(e.mountainId)!)
        .eq("user_id", user.id),
    ),
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Couldn't save the new order." };
  revalidateLists();
  return { ok: true };
}

/** Make a mountain your final objective (adds it to your list if needed). */
export async function setFinalGoal(mountainId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!uuid.safeParse(mountainId).success) return { ok: false, error: "Unknown mountain." };

  const supabase = await createClient();
  // Clear the old one first — only one final objective is allowed per hiker.
  const cleared = await supabase
    .from("user_mountains")
    .update({ is_final_goal: false })
    .eq("user_id", user.id)
    .eq("is_final_goal", true);
  if (cleared.error) return { ok: false, error: "Couldn't change your final objective." };

  const { error } = await supabase
    .from("user_mountains")
    .upsert(
      { user_id: user.id, mountain_id: mountainId, is_final_goal: true },
      { onConflict: "user_id,mountain_id" },
    );
  if (error) return { ok: false, error: "Couldn't change your final objective." };
  // If it was newly added to the list, give it a stage too.
  await supabase
    .from("user_mountains")
    .update({ stage: await defaultStage(supabase, mountainId) })
    .eq("user_id", user.id)
    .eq("mountain_id", mountainId)
    .is("stage", null);
  revalidateLists();
  return { ok: true };
}

export async function clearFinalGoal(): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_mountains")
    .update({ is_final_goal: false, sort_order: await nextSortOrder(supabase, user.id) })
    .eq("user_id", user.id)
    .eq("is_final_goal", true);
  if (error) return { ok: false, error: "Couldn't change your final objective." };
  revalidateLists();
  return { ok: true };
}

// --- The shared catalogue ----------------------------------------------------

function toRow(input: MountainInput) {
  return { ...input, google_maps_url: mapsUrl(input) };
}

export async function createMountain(raw: unknown): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  const parsed = mountainSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const base = slugify(parsed.data.name);

  // Find a free slug: base, base-2, base-3…
  const { data: taken } = await supabase.from("mountains").select("slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r) => r.slug as string));
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;

  // created_by / starter flags are also forced server-side by a trigger.
  const { data, error } = await supabase
    .from("mountains")
    .insert({ ...toRow(parsed.data), slug, created_by: user.id })
    .select("id, slug")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't create the mountain. Try again." };

  await supabase
    .from("user_mountains")
    .insert({
      user_id: user.id,
      mountain_id: data.id,
      sort_order: await nextSortOrder(supabase, user.id),
      stage: stageForElevation(parsed.data.elevation),
    });

  revalidateLists();
  return { ok: true, slug: data.slug };
}

export async function updateMountain(mountainId: string, raw: unknown): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!uuid.safeParse(mountainId).success) return { ok: false, error: "Unknown mountain." };
  const parsed = mountainSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // RLS: only the creator can update.
  const { data, error } = await supabase
    .from("mountains")
    .update(toRow(parsed.data))
    .eq("id", mountainId)
    .eq("created_by", user.id)
    .select("slug")
    .maybeSingle();
  if (error) return { ok: false, error: "Couldn't save the mountain." };
  if (!data) return { ok: false, error: "Only the hiker who added this mountain can edit it." };
  revalidateLists();
  return { ok: true, slug: data.slug };
}

export async function deleteMountain(mountainId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!uuid.safeParse(mountainId).success) return { ok: false, error: "Unknown mountain." };

  const supabase = await createClient();
  const { data: inUse } = await supabase.rpc("mountain_in_use_by_others", { p_mountain: mountainId });
  if (inUse) return { ok: false, error: "Other hikers have this mountain on their list, so it can't be deleted. Remove it from your list instead." };

  const { count: hikes } = await supabase
    .from("user_hikes")
    .select("id", { count: "exact", head: true })
    .eq("mountain_id", mountainId)
    .eq("user_id", user.id);
  if (hikes) return { ok: false, error: "You've logged hikes on this mountain. Delete those first, or just remove it from your list." };

  const { error, count } = await supabase
    .from("mountains")
    .delete({ count: "exact" })
    .eq("id", mountainId)
    .eq("created_by", user.id);
  if (error || !count) return { ok: false, error: "Only the hiker who added this mountain can delete it." };
  revalidateLists();
  return { ok: true };
}

/** Attach a cover photo the browser uploaded to mountain-images/{uid}/… */
export async function setMountainCover(mountainId: string, path: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!uuid.safeParse(mountainId).success || !path.startsWith(`${user.id}/`) || path.includes("..")) {
    return { ok: false, error: "Invalid photo." };
  }
  const supabase = await createClient();
  const { data: pub } = supabase.storage.from("mountain-images").getPublicUrl(path);
  const { data: ok } = await supabase.rpc("set_mountain_image", { p_mountain: mountainId, p_url: pub.publicUrl });
  if (!ok) {
    await supabase.storage.from("mountain-images").remove([path]);
    return { ok: false, error: "This mountain already has a cover photo." };
  }
  revalidateLists();
  return { ok: true };
}
