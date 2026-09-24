import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImagePlus, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getHike } from "@/lib/queries/hikes";
import { resolveUnlocked } from "@/lib/queries/unlocked";
import { fmtDate, fmtDuration, fmtInt, fmtKm } from "@/lib/format";
import { Container } from "@/components/ui/Section";
import { FormMessage } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/styles";
import { StatusBadge } from "@/components/mountains/StatusBadge";
import { DeleteHikeButton } from "@/components/hikes/DeleteHikeButton";
import { UnlockBanner } from "@/components/achievements/UnlockBanner";

export const metadata: Metadata = { title: "Hike" };

export default async function HikePage({ params, searchParams }: PageProps<"/hikes/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/hikes/${id}`);
  const [hike, sp] = await Promise.all([getHike(id), searchParams]);
  if (!hike) notFound();
  const unlocked = await resolveUnlocked(sp.unlocked);
  const isOwner = hike.user_id === user.id;
  const photos = hike.photos.filter((p) => p.url);

  return (
    <>
      <UnlockBanner achievements={unlocked} />
      <section className="relative isolate overflow-hidden bg-ink text-stone-50">
        {(photos[0]?.url || hike.mountain.image_url) && (
          <Image
            src={photos[0]?.url ?? hike.mountain.image_url!}
            alt={photos[0]?.caption ?? hike.mountain.name}
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/30" />
        <Container className="flex min-h-[55svh] flex-col justify-between py-6">
          <Link
            href={isOwner ? "/hikes" : `/mountains/${hike.mountain.slug}`}
            className="inline-flex min-h-11 w-fit items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-stone-50/80 hover:text-stone-50"
          >
            <ArrowLeft className="size-4" aria-hidden /> {isOwner ? "My hikes" : hike.mountain.name}
          </Link>
          <div className="pb-2">
            <StatusBadge conquered={hike.completed} onImage />
            <h1 className="font-display mt-4 text-[clamp(3rem,12vw,8rem)]">{hike.mountain.name}</h1>
            <p className="mt-2 font-mono text-lg">{fmtDate(hike.completion_date, { weekday: "long" })}</p>
          </div>
        </Container>
      </section>

      <Container className="max-w-4xl py-10">
        {sp.photos === "failed" && (
          <div className="mb-6">
            <FormMessage error="The hike was saved, but some photos didn't upload. Edit the hike to try again." />
          </div>
        )}

        <dl className="grid grid-cols-2 gap-6 border-y border-ink/15 py-6 sm:grid-cols-4">
          <Metric label="Distance" value={fmtKm(hike.distance_km)} />
          <Metric label="Elevation gain" value={hike.elevation_gain_m != null ? `+${fmtInt(hike.elevation_gain_m)} m` : "—"} />
          <Metric label="Moving time" value={fmtDuration(hike.moving_time_minutes)} />
          <Metric label="Summit" value={hike.mountain.elevation ? `${fmtInt(hike.mountain.elevation)} m` : "—"} />
        </dl>

        {hike.notes && (
          <section className="mt-10">
            <p className="eyebrow">Notes</p>
            <p className="mt-3 max-w-prose whitespace-pre-line text-lg leading-relaxed">{hike.notes}</p>
          </section>
        )}

        {photos.length > 0 && (
          <section className="mt-10">
            <p className="eyebrow mb-3">Photos</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((p) => (
                <a
                  key={p.id}
                  href={p.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-[4/5] overflow-hidden rounded-xs bg-sand"
                >
                  <Image src={p.url!} alt={p.caption ?? `Photo from ${hike.mountain.name}`} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-500 hover:scale-[1.03]" />
                </a>
              ))}
            </div>
          </section>
        )}

        {isOwner && photos.length === 0 && (
          <Link
            href={`/hikes/${hike.id}/edit`}
            className="mt-10 flex min-h-24 items-center justify-center gap-2 rounded-sm border border-dashed border-ink/25 font-mono text-xs uppercase tracking-[0.14em] text-slate hover:border-forest hover:text-forest"
          >
            <ImagePlus className="size-5" aria-hidden /> Add photos from this hike
          </Link>
        )}

        <div className="mt-12 flex flex-wrap gap-3 border-t border-ink/10 pt-6">
          <Link href={`/mountains/${hike.mountain.slug}`} className={buttonClass.secondary}>
            View mountain
          </Link>
          {isOwner && (
            <>
              <Link href={`/hikes/${hike.id}/edit`} className={buttonClass.secondary}>
                <Pencil className="size-4" aria-hidden /> Edit
              </Link>
              <DeleteHikeButton hikeId={hike.id} mountainName={hike.mountain.name} redirectTo="/hikes" />
            </>
          )}
        </div>
      </Container>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="font-display mt-1 text-3xl tabular-nums sm:text-4xl">{value}</dd>
    </div>
  );
}
