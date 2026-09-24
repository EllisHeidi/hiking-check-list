import "server-only";
import { getAchievements } from "./achievements";

/** Resolve `?unlocked=slug,slug` (set after logging a hike) to achievement definitions. */
export async function resolveUnlocked(param: string | string[] | undefined) {
  if (typeof param !== "string" || !param) return [];
  const slugs = new Set(param.split(",").slice(0, 14));
  const all = await getAchievements();
  return all.filter((a) => slugs.has(a.slug));
}
