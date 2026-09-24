import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getAchievements, getEarnedAchievements } from "@/lib/queries/achievements";
import { getHikesForUser } from "@/lib/queries/hikes";
import { getUserList } from "@/lib/queries/mountains";
import { computeStats } from "@/lib/calculations/stats";
import { achievementProgress } from "@/lib/achievements/progress";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Section";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const user = await requireUser("/achievements");
  const [achievements, earned, hikes, mountains] = await Promise.all([
    getAchievements(),
    getEarnedAchievements(user.id),
    getHikesForUser(user.id),
    getUserList(user.id),
  ]);
  const stats = computeStats(hikes, mountains);
  const finalId = mountains.find((m) => m.is_final_goal)?.id;
  const summitedFinal = hikes.some((h) => h.completed && h.mountain_id === finalId);
  const earnedAt = new Map(earned.map((e) => [e.achievement_id, e.earned_at]));

  const unlocked = achievements
    .filter((a) => earnedAt.has(a.id))
    .sort((a, b) => (earnedAt.get(b.id)! > earnedAt.get(a.id)! ? 1 : -1));
  const locked = achievements
    .filter((a) => !earnedAt.has(a.id))
    .map((a) => ({ a, p: achievementProgress(a, stats, summitedFinal) }))
    .sort((x, y) => y.p.ratio - x.p.ratio);

  return (
    <Container className="pb-16">
      <PageHeader eyebrow={`${unlocked.length} of ${achievements.length} earned`} title="Achievements" back="/profile" />
      <p className="-mt-2 mb-10 max-w-prose text-slate">
        Awarded automatically every time you log a hike. No claiming, no streaks — just the mountains.
      </p>

      <section>
        <SectionHeading title="Earned" />
        {unlocked.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unlocked.map((a, i) => (
              <div key={a.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <AchievementBadge achievement={a} earnedAt={earnedAt.get(a.id)!} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate">Log your first summit to earn First Summit.</p>
        )}
      </section>

      <section className="mt-14">
        <SectionHeading title="Locked" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {locked.map(({ a, p }) => (
            <AchievementBadge key={a.id} achievement={a} earnedAt={null} progress={p} />
          ))}
        </div>
      </section>
    </Container>
  );
}
