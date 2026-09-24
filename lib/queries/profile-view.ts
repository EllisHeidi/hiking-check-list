import "server-only";
import { getProfileCard, getFullProfile, isFollowing } from "./profiles";
import { getHikesForUser } from "./hikes";
import { getUserList } from "./mountains";
import { getAchievements, getEarnedAchievements } from "./achievements";
import { computeStats } from "@/lib/calculations/stats";

/**
 * Everything a profile page needs. For private profiles (that aren't yours)
 * RLS returns no hikes/achievements, and we only expose the limited card.
 */
export async function getProfileView(username: string, viewerId: string | null) {
  const card = await getProfileCard(username);
  if (!card) return null;

  const isSelf = viewerId === card.id;
  const full = await getFullProfile(card.id);
  const visible = Boolean(full); // RLS: public, or it's you

  if (!visible) {
    return {
      card,
      profile: null,
      isSelf,
      visible: false as const,
      following: viewerId && !isSelf ? await isFollowing(viewerId, card.id) : false,
    };
  }

  const [hikes, mountains, achievements, earned, following] = await Promise.all([
    getHikesForUser(card.id, { withPhotos: false }),
    getUserList(card.id),
    getAchievements(),
    getEarnedAchievements(card.id),
    viewerId && !isSelf ? isFollowing(viewerId, card.id) : Promise.resolve(false),
  ]);

  const earnedMap = new Map(earned.map((e) => [e.achievement_id, e.earned_at]));
  return {
    card,
    profile: full!,
    isSelf,
    visible: true as const,
    following,
    hikes,
    stats: computeStats(hikes, mountains),
    /** Banner photo: the hiker's final objective, else the last mountain on their list with a photo. */
    cover: mountains.find((m) => m.is_final_goal && m.image_url) ?? [...mountains].reverse().find((m) => m.image_url) ?? null,
    achievements: achievements
      .filter((a) => earnedMap.has(a.id))
      .map((a) => ({ ...a, earnedAt: earnedMap.get(a.id)! })),
  };
}
