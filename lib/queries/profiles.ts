import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileCard } from "@/types";

/** Limited card — available for private profiles too (name, avatar, counts). */
export async function getProfileCard(username: string): Promise<ProfileCard | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_profile_card", { p_username: username });
  if (error) throw new Error(`Could not load profile: ${error.message}`);
  const row = (data as ProfileCard[] | null)?.[0];
  if (!row) return null;
  return { ...row, follower_count: Number(row.follower_count), following_count: Number(row.following_count) };
}

/** Full profile — RLS returns null when the profile is private and not yours. */
export async function getFullProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, is_public, created_at")
    .eq("id", id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function searchProfiles(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_profiles", { p_query: query });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return (data ?? []) as Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "is_public">[];
}

export async function isFollowing(followerId: string, followingId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  return (count ?? 0) > 0;
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  return (data ?? []).map((r) => r.following_id as string);
}
