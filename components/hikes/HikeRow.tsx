import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import type { Hike } from "@/types";
import { fmtDate, fmtDuration, fmtInt, fmtKm } from "@/lib/format";
import { DeleteHikeButton } from "./DeleteHikeButton";

export function HikeRow({
  hike,
  hideMountain = false,
  readOnly = false,
}: {
  hike: Hike;
  hideMountain?: boolean;
  readOnly?: boolean;
}) {
  const photos = hike.photos.filter((p) => p.url);
  return (
    <article className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {!hideMountain && (
            <Link href={`/hikes/${hike.id}`} className="font-display text-3xl hover:text-forest">
              {hike.mountain.name}
            </Link>
          )}
          {hideMountain && (
            <Link href={`/hikes/${hike.id}`} className="font-display text-2xl hover:text-forest">
              {fmtDate(hike.completion_date, { weekday: "short" })}
            </Link>
          )}
          <span
            className={`font-mono text-[0.65rem] uppercase tracking-[0.16em] ${hike.completed ? "text-ember" : "text-mist"}`}
          >
            {hike.completed ? "✓ Summit" : "○ Attempt"}
          </span>
        </div>

        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {!hideMountain && <Metric label="Date" value={fmtDate(hike.completion_date)} />}
          <Metric label="Distance" value={fmtKm(hike.distance_km)} />
          <Metric label="Elevation" value={hike.elevation_gain_m != null ? `+${fmtInt(hike.elevation_gain_m)} m` : "—"} />
          <Metric label="Moving" value={fmtDuration(hike.moving_time_minutes)} />
        </dl>

        {hike.notes && <p className="mt-3 line-clamp-2 max-w-prose text-slate">{hike.notes}</p>}

        {photos.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
            {photos.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/hikes/${hike.id}`} className="relative size-20 shrink-0 overflow-hidden rounded-xs bg-sand sm:size-24">
                <Image src={p.url!} alt={p.caption ?? `Photo from ${hike.mountain.name}`} fill sizes="96px" className="object-cover" />
              </Link>
            ))}
            {photos.length > 5 && (
              <Link href={`/hikes/${hike.id}`} className="flex size-20 shrink-0 items-center justify-center rounded-xs bg-sand font-mono text-sm sm:size-24">
                +{photos.length - 5}
              </Link>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex gap-1 sm:flex-col sm:items-end">
          <Link
            href={`/hikes/${hike.id}/edit`}
            className="inline-flex min-h-11 items-center gap-2 px-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-slate hover:text-ink"
          >
            <Pencil className="size-4" aria-hidden /> Edit
          </Link>
          <DeleteHikeButton hikeId={hike.id} mountainName={hike.mountain.name} />
        </div>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-mist">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
