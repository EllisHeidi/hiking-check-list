import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

const PROFILE_COLUMNS = "id, username, display_name, avatar_url, bio, is_public, created_at";

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

/**
 * The signed-in user's profile. If the row is missing (e.g. the account was
 * created before the database was set up) it's created on the fly.
 * Returns null when signed out or when the database isn't set up yet.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();

  const load = () => supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  let { data, error } = await load();
  if (error) return null; // tables missing → database not set up
  if (!data) {
    await supabase.rpc("ensure_profile");
    ({ data, error } = await load());
  }
  return (data as Profile | null) ?? null;
});

/**
 * For private pages: returns the user, or redirects to /login when signed out.
 * Signed in without a profile means the database isn't set up — send them to
 * /setup rather than /login (which would bounce back here and loop).
 */
export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/setup?reason=database");
  return user;
}

export async function requireProfile(next?: string) {
  await requireUser(next);
  return (await getCurrentProfile())!;
}
