"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type ProfileState = { error?: string; message?: string } | undefined;

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "Username: 3–24 letters, numbers or underscores.")
    .refine((u) => u !== "edit", "That username is reserved."),
  display_name: z.string().trim().max(60, "Name: 60 characters max."),
  bio: z.string().trim().max(280, "Bio: 280 characters max."),
  is_public: z.boolean(),
});

export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session has expired." };

  const parsed = profileSchema.safeParse({
    username: String(formData.get("username") ?? ""),
    display_name: String(formData.get("display_name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    is_public: formData.get("is_public") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      display_name: parsed.data.display_name || null,
      bio: parsed.data.bio || null,
      is_public: parsed.data.is_public,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.code === "23505" ? "That username is taken." : "Could not save your profile." };
  }
  revalidatePath("/", "layout");
  return { message: "Profile saved." };
}

/** Save an avatar the browser uploaded to avatars/{uid}/… */
export async function setAvatar(path: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !path.startsWith(`${user.id}/`) || path.includes("..")) return { ok: false };

  const supabase = await createClient();
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Storage path of a banner we uploaded to avatars/{uid}/…, or null for anything else. */
function ownBannerPath(url: string | null | undefined, userId: string) {
  const marker = "/storage/v1/object/public/avatars/";
  const i = url?.indexOf(marker) ?? -1;
  if (!url || i < 0) return null;
  const path = decodeURIComponent(url.slice(i + marker.length));
  return path.startsWith(`${userId}/banner-`) ? path : null;
}

async function replaceBanner(userId: string, newUrl: string | null) {
  const supabase = await createClient();
  const { data: current } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const { error } = await supabase.from("profiles").update({ banner_url: newUrl }).eq("id", userId);
  if (error) return { ok: false as const, error: error.code === "PGRST204" || /banner_url/.test(error.message) ? "Banners need a quick database update — run the profile banner SQL in Supabase." : "Couldn't save your banner." };
  // Tidy up the previous upload.
  const old = ownBannerPath((current as { banner_url?: string | null } | null)?.banner_url, userId);
  if (old) await supabase.storage.from("avatars").remove([old]);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

/** Save a banner the browser uploaded to avatars/{uid}/banner-… */
export async function setBanner(path: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !path.startsWith(`${user.id}/banner-`) || path.includes("..")) return { ok: false, error: "Invalid photo." };
  const supabase = await createClient();
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const res = await replaceBanner(user.id, data.publicUrl);
  if (!res.ok) await supabase.storage.from("avatars").remove([path]);
  return res;
}

/** Go back to the default banner (your final objective's photo). */
export async function removeBanner(): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in first." };
  return replaceBanner(user.id, null);
}
