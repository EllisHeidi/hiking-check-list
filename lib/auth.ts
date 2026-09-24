import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

/**
 * The authenticated user for this request, verified with the Supabase Auth
 * server. This is the ONLY source of user identity for writes — never trust
 * an id sent from the browser.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, is_public, created_at")
    .eq("id", user.id)
    .single();
  return (data as Profile | null) ?? null;
});

/** For private pages: returns the user or redirects to /login. */
export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

export async function requireProfile(next?: string) {
  await requireUser(next);
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}
