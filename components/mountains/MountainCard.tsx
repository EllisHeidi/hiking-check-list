import { MountainImage } from "@/components/mountains/MountainImage";
import Link from "next/link";
import type { Mountain } from "@/types";
import { fmtDate, fmtInt } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export interface MountainCompletion {
  firstSummit: string | null;
  timesClimbed: number;
}

export function MountainCard({
  mountain,
  completion,
  index,
}: {
  mountain: Mountain;
  completion?: MountainCompletion;
  index?: number;
}) {
  const conquered = Boolean(completion && completion.timesClimbed > 0);
  return (
    <Link
      href={`/mountains/${mountain.slug}`}
      className="group block overflow-hidden rounded-sm border border-ink/10 bg-stone-50 shadow-card transition-shadow hover:shadow-lg focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <MountainImage
          src={mountain.image_url}
          alt={`${mountain.name}${mountain.region ? `, ${mountain.region}` : ""}`}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 90vw"
          className={`transition-transform duration-700 group-hover:scale-[1.03] ${
            conquered ? "" : "grayscale-[35%] saturate-75"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <StatusBadge conquered={conquered} onImage count={completion?.timesClimbed ?? 0} />
        </div>
        {index != null && (
          <span className="absolute top-3 right-3 font-mono text-xs text-stone-50/80">
            {String(index).padStart(2, "0")}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 text-stone-50">
          <p className="font-display text-3xl leading-none">{mountain.name}</p>
          <p className="mt-1 font-mono text-sm">
            {mountain.elevation ? `${fmtInt(mountain.elevation)} m` : "Elevation TBC"}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
        <div>
          <dt className="eyebrow">Region</dt>
          <dd className="mt-0.5 truncate">{mountain.region ?? "—"}</dd>
        </div>
        <div>
          <dt className="eyebrow">Difficulty</dt>
          <dd className="mt-0.5">{mountain.difficulty ?? "—"}</dd>
        </div>
        {conquered && completion && (
          <>
            <div>
              <dt className="eyebrow">First summit</dt>
              <dd className="mt-0.5">{fmtDate(completion.firstSummit)}</dd>
            </div>
            <div>
              <dt className="eyebrow">Climbed</dt>
              <dd className="mt-0.5">
                {completion.timesClimbed} {completion.timesClimbed === 1 ? "time" : "times"}
              </dd>
            </div>
          </>
        )}
      </dl>
    </Link>
  );
}
