import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getUserList } from "@/lib/queries/mountains";
import { getHikesForUser } from "@/lib/queries/hikes";
import { getActivityFor } from "@/lib/queries/activity";
import { getFollowingIds } from "@/lib/queries/profiles";
import { resolveUnlocked } from "@/lib/queries/unlocked";
import { computeStats, conqueredMountainIds, nextObjective } from "@/lib/calculations/stats";
import { displayName } from "@/lib/format";
import { Container, EmptyState, SectionHeading } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { NextObjective } from "@/components/dashboard/NextObjective";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ElevationEquivalent } from "@/components/dashboard/ElevationEquivalent";
import { Progression } from "@/components/mountains/Progression";
import { FinalObjective } from "@/components/mountains/FinalObjective";
import { ActivityRow } from "@/components/activity/ActivityItem";
import { UnlockBanner } from "@/components/achievements/UnlockBanner";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const profile = await requireProfile();
  const [mountains, hikes, followingIds, sp] = await Promise.all([
    getUserList(profile.id),
    getHikesForUser(profile.id),
    getFollowingIds(profile.id),
    searchParams,
  ]);
  const [activity, unlocked] = await Promise.all([
    getActivityFor([profile.id, ...followingIds], 6),
    resolveUnlocked(sp.unlocked),
  ]);

  const stats = computeStats(hikes, mountains);
  const conquered = conqueredMountainIds(hikes);
  const next = nextObjective(mountains, conquered);
  const finalGoal = mountains.find((m) => m.is_final_goal);

  return (
    <>
      <UnlockBanner achievements={unlocked} />
      <DashboardHero stats={stats} name={displayName(profile)} />

      <Container className="grid gap-12 py-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16 lg:py-14">
        <div className="space-y-12">
          {next && (
            <section aria-label="Next objective">
              <NextObjective mountain={next} />
            </section>
          )}

          <section>
            <SectionHeading eyebrow="Calculated from your hikes" title="Your stats" href="/stats" linkLabel="All stats" />
            {hikes.length ? (
              <StatsGrid stats={stats} extended />
            ) : (
              <EmptyState
                title="No hikes yet"
                body="Log your first hike and your distance, elevation and summits will build up here."
                action={<Link href="/hikes/new" className={buttonClass.primary}>Log a hike</Link>}
              />
            )}
          </section>

          <ElevationEquivalent stats={stats} />
        </div>

        <div className="space-y-12">
          <section>
            <SectionHeading eyebrow="Altitude ladder" title="Your progression" href="/mountains" linkLabel="Mountains" />
            <Progression mountains={mountains} conquered={conquered} compact />
          </section>

          <section>
            <SectionHeading eyebrow="You & people you follow" title="Recent activity" href="/activity" />
            {activity.length ? (
              <div className="divide-y divide-ink/10">
                {activity.map((a) => (
                  <ActivityRow key={a.id} item={a} currentUserId={profile.id} compact />
                ))}
              </div>
            ) : (
              <p className="text-slate">
                Nothing yet.{" "}
                <Link href="/people" className="text-forest underline underline-offset-4">Find hikers to follow</Link>.
              </p>
            )}
          </section>
        </div>
      </Container>

      {finalGoal && (
        <FinalObjective
          mountain={finalGoal}
          conquered={conquered.has(finalGoal.id)}
          highestSoFar={stats.highestSummit?.elevation ?? null}
        />
      )}
    </>
  );
}
