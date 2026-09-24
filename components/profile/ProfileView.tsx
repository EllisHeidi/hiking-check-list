import Link from "next/link";
import { Lock, Settings } from "lucide-react";
import type { getProfileView } from "@/lib/queries/profile-view";
import { displayName, fmtDec, fmtInt, fmtKm } from "@/lib/format";
import { Container, EmptyState, SectionHeading } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";
import { ShareProfileButton } from "./ShareProfileButton";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";

type View = NonNullable<Awaited<ReturnType<typeof getProfileView>>>;

export function ProfileView({ view, signedIn }: { view: View; signedIn: boolean }) {
  const { card } = view;
  const name = displayName(card);

  return (
    <Container className="pb-16">
      <header className="flex flex-col gap-6 pt-10 pb-8 sm:flex-row sm:items-end sm:pt-14">
        <Avatar profile={card} size={112} className="border-2 border-stone-50 shadow-card" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-5xl sm:text-7xl">{name}</h1>
          <p className="mt-1 font-mono text-sm text-slate">@{card.username}</p>
          {view.visible && view.profile.bio && <p className="mt-3 max-w-prose text-lg italic text-charcoal">“{view.profile.bio}”</p>}
          <p className="mt-4 flex gap-6 font-mono text-xs uppercase tracking-[0.16em]">
            <span>
              <strong className="text-base text-ink">{card.following_count}</strong> <span className="text-slate">Following</span>
            </span>
            <span>
              <strong className="text-base text-ink">{card.follower_count}</strong> <span className="text-slate">Followers</span>
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {view.isSelf ? (
            <>
              <ShareProfileButton username={card.username} name={name} isSelf variant="primary" />
              <Link href="/profile/edit" className={buttonClass.secondary}>
                <Settings className="size-4" aria-hidden /> Edit profile
              </Link>
            </>
          ) : (
            <>
              {signedIn ? (
                <FollowButton targetId={card.id} initialFollowing={view.following} />
              ) : (
                <Link href={`/login?next=${encodeURIComponent(`/profile/${card.username}`)}`} className={buttonClass.primary}>
                  Log in to follow
                </Link>
              )}
              <ShareProfileButton username={card.username} name={name} isSelf={false} />
            </>
          )}
        </div>
      </header>

      {!view.visible ? (
        <div className="flex items-center gap-4 rounded-sm border border-ink/15 bg-stone-50 p-6">
          <Lock className="size-6 shrink-0 text-slate" aria-hidden />
          <div>
            <p className="font-display text-2xl">This logbook is private</p>
            <p className="text-slate">{name} hasn&apos;t made their hikes and stats public.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-14">
          <dl className="grid grid-cols-2 gap-y-8 border-y border-ink/15 py-8 sm:grid-cols-5">
            <Stat value={view.stats.mountainsConquered} label="Mountains" accent />
            <Stat value={view.stats.totalHikes} label="Hikes" />
            <Stat value={`${fmtDec(view.stats.totalDistanceKm)} km`} label="Distance" />
            <Stat value={`${fmtInt(view.stats.totalElevationM)} m`} label="Elevation" />
            <Stat value={view.stats.highestSummit ? `${fmtInt(view.stats.highestSummit.elevation)} m` : "—"} label="Highest" />
          </dl>

          <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr]">
            <section>
              <SectionHeading title="Recent hikes" href={view.isSelf ? "/hikes" : undefined} />
              {view.hikes.length ? (
                <ul className="divide-y divide-ink/10 border-b border-ink/10">
                  {view.hikes.slice(0, 6).map((h) => (
                    <li key={h.id}>
                      <Link href={`/hikes/${h.id}`} className="flex items-baseline justify-between gap-4 py-4 hover:bg-sand/40">
                        <span className="font-display min-w-0 truncate text-2xl">
                          {h.completed && <span className="mr-2 text-ember">✓</span>}
                          {h.mountain.name}
                        </span>
                        <span className="shrink-0 text-right font-mono text-sm">
                          {fmtKm(h.distance_km)}
                          <span className="ml-3 text-slate">+{fmtInt(h.elevation_gain_m ?? 0)} m</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No hikes yet" body="The first entry is still out there." />
              )}
            </section>

            <section>
              <SectionHeading title="Achievements" href={view.isSelf ? "/achievements" : undefined} />
              {view.achievements.length ? (
                <div className="space-y-4">
                  {view.achievements.map((a) => (
                    <AchievementBadge key={a.id} achievement={a} earnedAt={a.earnedAt} size="sm" />
                  ))}
                </div>
              ) : (
                <p className="text-slate">None earned yet.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </Container>
  );
}

function Stat({ value, label, accent }: { value: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="eyebrow mt-1">{label}</dt>
      <dd className={`font-display text-4xl tabular-nums ${accent ? "text-ember" : ""}`}>{value}</dd>
    </div>
  );
}
