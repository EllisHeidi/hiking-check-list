"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { mountainSchema, slugify, mapsUrl, type MountainInput } from "@/lib/validation/mountain";

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

// --- Your list -------------------------------------------------------------

export async function addToList(mountainId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!uuid.safeParse(mountainId).success) return { ok: false, error: "Unknown mountain." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_mountains")
    .upsert(
      { user_id: user.id, mountain_id: mountainId, sort_order: await nextSortOrder(supabase, user.id) },
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

/** Swap a mountain with its neighbour in your list. */
export async function moveInList(mountainId: string, direction: "up" | "down"): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  if (!uuid.safeParse(mountainId).success) return { ok: false, error: "Unknown mountain." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_mountains")
    .select("id, mountain_id, sort_order")
    .eq("user_id", user.id)
    .eq("is_final_goal", false)
    .order("sort_order")
    .order("created_at");
  const rows = data ?? [];
  const i = rows.findIndex((r) => r.mountain_id === mountainId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return { ok: true };

  // Renumber so ties never block a swap, then swap the two.
  const order = rows.map((r) => r.id as string);
  [order[i], order[j]] = [order[j], order[i]];
  const results = await Promise.all(
    order.map((id, n) => supabase.from("user_mountains").update({ sort_order: n + 1 }).eq("id", id).eq("user_id", user.id)),
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Couldn't reorder." };
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
    .insert({ user_id: user.id, mountain_id: data.id, sort_order: await nextSortOrder(supabase, user.id) });

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
