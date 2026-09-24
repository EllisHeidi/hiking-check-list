import type { Metadata } from "next";
import { MountainImage } from "@/components/mountains/MountainImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BadgeCheck, ExternalLink, MapPin, Pencil, Plus, Sparkles } from "lucide-react";
import { mapsUrl } from "@/lib/validation/mountain";
import { requireUser } from "@/lib/auth";
import { getMountainBySlug, getUserList } from "@/lib/queries/mountains";
import { getHikesForMountain } from "@/lib/queries/hikes";
import { getMountainLeaderboard } from "@/lib/queries/leaderboard";
import { getFollowingIds } from "@/lib/queries/profiles";
import { MountainLeaderboard } from "@/components/mountains/MountainLeaderboard";
import { fmtDate, fmtInt, fmtKm } from "@/lib/format";
import { Container, SectionHeading } from "@/components/ui/Section";
import { buttonClass, onImageButtonClass } from "@/components/ui/styles";
import { BackLink } from "@/components/ui/BackLink";
import { StatusBadge } from "@/components/mountains/StatusBadge";
import { HikeRow } from "@/components/hikes/HikeRow";
import { ListControls } from "@/components/mountains/ListControls";
import { CoverControls } from "@/components/mountains/CoverControls";

// AI cover generation can take up to a minute.
export const maxDuration = 60;

export async function generateMetadata({ params }: PageProps<"/mountains/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMountainBySlug(slug);
  return { title: m?.name ?? "Mountain" };
}

export default async function MountainPage({ params }: PageProps<"/mountains/[slug]">) {
  const { slug } = await params;
  const user = await requireUser(`/mountains/${slug}`);
  const mountain = await getMountainBySlug(slug);
  if (!mountain) notFound();

  const [hikes, list, board, followingIds] = await Promise.all([
    getHikesForMountain(user.id, mountain.id),
    getUserList(user.id),
    getMountainLeaderboard(mountain.id),
    getFollowingIds(user.id),
  ]);
  const listEntry = list.find((m) => m.id === mountain.id);
  const isFinal = Boolean(listEntry?.is_final_goal);
  const isCreator = mountain.created_by === user.id;
  const hasCoords = mountain.latitude != null && mountain.longitude != null;
  const approximate = mountain.coordinate_accuracy === "approximate";
  const canSetCover = !mountain.image_url || isCreator;
  const aiCover = Boolean(mountain.image_url?.includes("/mountain-images/") && mountain.image_url.includes("/ai-"));
  const summits = hikes.filter((h) => h.completed);
  const conquered = summits.length > 0;
  const firstSummit = summits.map((h) => h.completion_date).filter(Boolean).sort()[0] ?? null;

  const facts = [
    { label: "Elevation", value: mountain.elevation ? `${fmtInt(mountain.elevation)} m` : "TBC" },
    { label: "Region", value: mountain.region ?? "—" },
    { label: "Country", value: mountain.country ?? "—" },
    { label: "Difficulty", value: mountain.difficulty ?? "—" },
    { label: "Route distance", value: fmtKm(mountain.distance_km) },
    { label: "Elevation gain", value: mountain.elevation_gain_m != null ? `${fmtInt(mountain.elevation_gain_m)} m` : "—" },
  ];

  return (
    <>
      <section className={`relative isolate overflow-hidden bg-ink text-stone-50 ${isFinal ? "min-h-[80svh]" : ""}`}>
        <MountainImage
          src={mountain.image_url}
          alt={`${mountain.name}${mountain.region ? `, ${mountain.region}` : ""}`}
          priority
          sizes="100vw"
          className="-z-10"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/30" />
        <Container className="flex min-h-[70svh] flex-col justify-between py-6 sm:min-h-[36rem]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <BackLink fallback="/mountains" variant="onImage" />
            {isCreator && (
              <Link
                href={`/mountains/${mountain.slug}/edit`}
                className={onImageButtonClass}
              >
                <Pencil className="size-4" aria-hidden /> Edit mountain
              </Link>
            )}
          </div>
          <div className="pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge conquered={conquered} onImage count={summits.length} />
              {isFinal && (
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-stone-50/80">Your final objective</span>
              )}
              {!listEntry && (
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-stone-50/80">Not on your list</span>
              )}
            </div>
            <h1 className="font-display mt-4 text-[clamp(3.5rem,14vw,10rem)]">{mountain.name}</h1>
            <p className="mt-2 font-mono text-xl sm:text-2xl">
              {mountain.elevation ? `${fmtInt(mountain.elevation)} m` : "Elevation TBC"}
              {mountain.region && <span className="text-stone-50/70"> · {mountain.region}</span>}
            </p>
            {mountain.image_credit && (
              <p className="mt-3 font-mono text-[0.65rem] tracking-[0.06em] text-stone-50/60">
                Photo:{" "}
                {mountain.image_credit_url ? (
                  <a href={mountain.image_credit_url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-stone-50 hover:underline">
                    {mountain.image_credit}
                  </a>
                ) : (
                  mountain.image_credit
                )}
              </p>
            )}
            {aiCover && (
              <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-stone-50/70">
                <Sparkles className="size-3.5" aria-hidden /> AI-generated image
              </p>
            )}
            {canSetCover && (
              <div className="mt-5">
                <CoverControls mountainId={mountain.id} aiEnabled={Boolean(process.env.OPENAI_API_KEY)} replacing={Boolean(mountain.image_url)} />
              </div>
            )}
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16 lg:py-14">
        <div className="space-y-12">
          {mountain.verification_note && (
            <div role="note" className="flex gap-3 rounded-sm border border-ember/40 bg-ember/5 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-ember" aria-hidden />
              <p className="text-sm text-charcoal">{mountain.verification_note}</p>
            </div>
          )}
          <ListControls mountainId={mountain.id} onList={Boolean(listEntry)} isFinal={isFinal} />
          <div
            className={`flex flex-wrap items-center justify-between gap-4 rounded-sm border p-5 ${
              conquered ? "border-ember/30 bg-ember/5" : "border-ink/15 bg-stone-50"
            }`}
          >
            {conquered ? (
              <div>
                <p className="font-display text-4xl text-ember">✓ Conquered</p>
                <p className="mt-1 text-slate">
                  First summit {fmtDate(firstSummit)} · climbed {summits.length}×
                </p>
              </div>
            ) : (
              <div>
                <p className="font-display text-4xl">○ Objective</p>
                <p className="mt-1 text-slate">Not summited yet.</p>
              </div>
            )}
            <Link href={`/hikes/new?mountain=${mountain.slug}`} className={conquered ? buttonClass.secondary : buttonClass.ember}>
              <Plus className="size-4" aria-hidden />
              {conquered ? "Log another hike" : "Add hike"}
            </Link>
          </div>

          {mountain.description && (
            <section>
              <SectionHeading eyebrow="About" title="The mountain" />
              <p className="max-w-prose text-lg leading-relaxed text-charcoal">{mountain.description}</p>
            </section>
          )}

          <section>
            <SectionHeading eyebrow={mountain.route_name ?? "Route"} title="Route information" />
            <p className="max-w-prose leading-relaxed text-charcoal">
              {mountain.route_description ?? "No route information yet. Add it to this mountain in the database."}
            </p>
          </section>

          <section>
            <SectionHeading eyebrow={`${hikes.length} logged`} title="Your history" />
            {hikes.length ? (
              <div className="divide-y divide-ink/10 border-y border-ink/10">
                {hikes.map((h) => (
                  <HikeRow key={h.id} hike={h} hideMountain />
                ))}
              </div>
            ) : (
              <p className="text-slate">You haven&apos;t logged a hike here yet.</p>
            )}
          </section>

          <section>
            <SectionHeading
              eyebrow={`${board.hikers} ${board.hikers === 1 ? "hiker" : "hikers"} · ${board.mostSummits.reduce((n, e) => n + e.summits, 0)} summits`}
              title="Leaderboard"
            />
            <MountainLeaderboard
              mostSummits={board.mostSummits}
              fastest={board.fastest}
              viewerId={user.id}
              followingIds={followingIds}
              mountainSlug={mountain.slug}
            />
          </section>
        </div>

        <aside className="space-y-10">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-ink/15 pt-6">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="eyebrow">{f.label}</dt>
                <dd className="mt-1 font-mono text-lg">{f.value}</dd>
              </div>
            ))}
          </dl>

          <section className="rounded-sm border border-ink/10 bg-stone-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-2">
                <MapPin className="size-3.5" aria-hidden /> Location
              </p>
              {hasCoords && mountain.coordinate_accuracy === "verified" && (
                <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-forest">
                  <BadgeCheck className="size-3.5" aria-hidden /> Verified
                </span>
              )}
              {hasCoords && approximate && (
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-earth">≈ Approximate</span>
              )}
            </div>
            <p className="mt-3 font-mono text-lg">
              {hasCoords
                ? approximate
                  ? `≈ ${mountain.latitude!.toFixed(2)}°, ${mountain.longitude!.toFixed(2)}°`
                  : `${mountain.latitude!.toFixed(4)}°, ${mountain.longitude!.toFixed(4)}°`
                : "Coordinates not set"}
            </p>
            {hasCoords && approximate && (
              <p className="mt-1 text-sm text-earth">Approximate area — not the exact summit.</p>
            )}
            <p className="mt-1 text-sm text-mist">{[mountain.region, mountain.country].filter(Boolean).join(", ")}</p>
            <a
              href={mapsUrl(mountain)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonClass.secondary} mt-5 w-full`}
            >
              {hasCoords ? (approximate ? "Open area in Google Maps" : "Open in Google Maps") : "Search Google Maps"}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </section>
        </aside>
      </Container>
    </>
  );
}
