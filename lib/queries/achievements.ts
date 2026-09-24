import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Achievement, EarnedAchievement } from "@/types";

export const getAchievements = cache(async (): Promise<Achievement[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("id, name, slug, description, icon, requirement_type, requirement_value, sort_order")
    .order("sort_order");
  if (error) throw new Error(`Could not load achievements: ${error.message}`);
  return (data ?? []) as Achievement[];
});

export const getEarnedAchievements = cache(async (userId: string): Promise<EarnedAchievement[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_achievements")
    .select("achievement_id, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  if (error) throw new Error(`Could not load achievements: ${error.message}`);
  return (data ?? []) as EarnedAchievement[];
});
