import Image from "next/image";
import Link from "next/link";
import { Lock, Mountain as MountainIcon, Settings } from "lucide-react";
import type { getProfileView } from "@/lib/queries/profile-view";
import { displayName, fmtDec, fmtInt, fmtKm } from "@/lib/format";
import { shortName } from "@/lib/calculations/stats";
import { Container, EmptyState, SectionHeading } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { MountainImage } from "@/components/mountains/MountainImage";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";
import { ShareProfileButton } from "./ShareProfileButton";
import { BannerControls } from "./BannerControls";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";

type View = NonNullable<Awaited<ReturnType<typeof getProfileView>>>;

// Two equal buttons on phones; natural width from sm up.
const actionBtn = "w-full min-w-0 px-3 sm:w-auto sm:px-6";

export function ProfileView({ view, signedIn }: { view: View; signedIn: boolean }) {
  const { card } = view;
  const name = displayName(card);
  const cover = view.visible ? view.cover : null;
  const customBanner = view.visible ? (view.profile.banner_url ?? null) : null;
  const finalGoal = view.visible ? view.stats.finalGoal : null;

  return (
    <Container className="pb-16">
      {/* Banner: full-bleed on phones, rounded card from sm up. */}
      <div className="relative -mx-4 h-36 overflow-hidden bg-forest sm:mx-0 sm:mt-8 sm:h-52 sm:rounded-sm">
        {customBanner ? (
          <Image src={customBanner} alt={`${name}'s banner photo`} fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
        ) : cover ? (
          <MountainImage src={cover.image_url} alt={cover.is_final_goal ? `${cover.name}, ${name}'s final objective` : cover.name} sizes="(min-width: 1280px) 1200px, 100vw" priority />
        ) : (
          <div className="topo absolute inset-0 opacity-40" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
        {finalGoal && (
          <p className="absolute right-4 bottom-3 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-stone-50/85">
            <MountainIcon className="size-3.5" aria-hidden />
            Road to {shortName(finalGoal.name)}
          </p>
        )}
        {view.isSelf && <BannerControls hasCustom={Boolean(customBanner)} />}
      </div>

      <header className="relative pb-8">
        <div className="-mt-12 flex items-end justify-between gap-4 sm:-mt-16">
          <Avatar profile={card} size={104} className="ring-4 ring-paper shadow-card" />
          {/* Desktop actions sit beside the avatar. */}
          <div className="hidden gap-2 pb-1 sm:flex">
            <Actions view={view} signedIn={signedIn} name={name} />
          </div>
        </div>

        <h1 className="font-display mt-4 text-[clamp(2.5rem,11vw,4.5rem)] leading-[0.9] break-words">{name}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate">
          <span>@{card.username}</span>
          <span aria-hidden className="text-dune">•</span>
          <span>
            <strong className="text-ink">{card.following_count}</strong> following
          </span>
          <span>
            <strong className="text-ink">{card.follower_count}</strong> {card.follower_count === 1 ? "follower" : "followers"}
          </span>
        </p>
        {view.visible && view.profile.bio && (
          <p className="mt-3 max-w-prose text-base italic text-charcoal sm:text-lg">“{view.profile.bio}”</p>
        )}

        {/* Phone actions: two equal buttons under the name. */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:hidden">
          <Actions view={view} signedIn={signedIn} name={name} />
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
        <div className="space-y-12">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-ink/10 bg-ink/10 sm:grid-cols-4">
            <Stat label="Mountains" accent>
              {view.stats.mountainsConquered}
              {view.stats.totalMountains > 0 && <span className="text-[0.5em] text-mist"> / {view.stats.totalMountains}</span>}
            </Stat>
            <Stat label="Hikes">{view.stats.totalHikes}</Stat>
            <Stat label="Distance">
              {fmtDec(view.stats.totalDistanceKm)}
              <Unit>km</Unit>
            </Stat>
            <Stat label="Elevation">
              {fmtInt(view.stats.totalElevationM)}
              <Unit>m</Unit>
            </Stat>
            <div className="col-span-2 flex items-center justify-between gap-4 bg-stone-50 px-4 py-3.5 sm:col-span-4">
              <dt className="eyebrow">Highest summit</dt>
              <dd className="min-w-0 truncate text-right">
                {view.stats.highestSummit ? (
                  <Link href={`/mountains/${view.stats.highestSummit.slug}`} className="hover:text-forest">
                    <span className="font-medium">{view.stats.highestSummit.name}</span>
                    <span className="ml-2 font-mono text-sm text-slate">{fmtInt(view.stats.highestSummit.elevation)} m</span>
                  </Link>
                ) : (
                  <span className="text-sm text-mist">No summits yet</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <section>
              <SectionHeading title="Recent hikes" href={view.isSelf ? "/hikes" : undefined} />
              {view.hikes.length ? (
                <ul className="divide-y divide-ink/10 border-b border-ink/10">
                  {view.hikes.slice(0, 6).map((h) => (
                    <li key={h.id}>
                      <Link href={`/hikes/${h.id}`} className="flex items-center justify-between gap-4 py-3.5 hover:bg-sand/40">
                        <span className="min-w-0">
                          <span className="font-display block truncate text-2xl">
                            {h.completed && <span className="mr-2 text-ember">✓</span>}
                            {h.mountain.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-right font-mono text-sm leading-tight">
                          {fmtKm(h.distance_km)}
                          <span className="block text-xs text-slate">+{fmtInt(h.elevation_gain_m ?? 0)} m</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : view.isSelf ? (
                <EmptyState
                  title="No hikes yet"
                  body="Log your first hike and it'll show up here."
                  action={<Link href="/hikes/new" className={buttonClass.primary}>Log a hike</Link>}
                />
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
                <p className="text-slate">None earned yet — the first one comes with the first summit.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </Container>
  );
}

function Actions({ view, signedIn, name }: { view: View; signedIn: boolean; name: string }) {
  const { card } = view;
  if (view.isSelf) {
    return (
      <>
        <ShareProfileButton username={card.username} name={name} isSelf variant="primary" className={actionBtn} />
        <Link href="/profile/edit" className={`${buttonClass.secondary} ${actionBtn}`}>
          <Settings className="size-4" aria-hidden /> Edit
          <span className="hidden sm:inline">profile</span>
        </Link>
      </>
    );
  }
  return (
    <>
      {signedIn ? (
        <FollowButton targetId={card.id} initialFollowing={view.following} className={actionBtn} />
      ) : (
        <Link href={`/login?next=${encodeURIComponent(`/profile/${card.username}`)}`} className={`${buttonClass.primary} ${actionBtn}`} aria-label={`Log in to follow ${name}`}>
          Follow
        </Link>
      )}
      <ShareProfileButton username={card.username} name={name} isSelf={false} className={actionBtn} />
    </>
  );
}

function Unit({ children }: { children: React.ReactNode }) {
  return <span className="ml-1 text-[0.5em] text-slate">{children}</span>;
}

function Stat({ label, accent, children }: { label: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse bg-stone-50 px-4 py-4">
      <dt className="eyebrow mt-1">{label}</dt>
      <dd className={`font-display text-4xl tabular-nums sm:text-5xl ${accent ? "text-ember" : ""}`}>{children}</dd>
    </div>
  );
}
