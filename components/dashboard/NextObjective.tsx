import { MountainImage } from "@/components/mountains/MountainImage";
import Link from "next/link";
import type { Mountain } from "@/types";
import { fmtInt } from "@/lib/format";
import { buttonClass } from "@/components/ui/styles";

export function NextObjective({ mountain }: { mountain: Mountain }) {
  return (
    <article className="relative isolate overflow-hidden rounded-sm bg-ink text-stone-50">
      <MountainImage
        src={mountain.image_url}
        alt={`${mountain.name}${mountain.region ? `, ${mountain.region}` : ""}`}
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="-z-10"
        priority
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      <div className="flex min-h-[26rem] flex-col justify-end p-5 sm:min-h-[32rem] sm:p-8">
        <span className="w-fit rounded-xs bg-forest px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.16em]">
          Next objective
        </span>
        <h2 className="font-display mt-4 text-6xl sm:text-8xl">{mountain.name}</h2>
        <p className="mt-2 font-mono text-lg">
          {mountain.elevation ? `${fmtInt(mountain.elevation)} m` : "Elevation TBC"}
          {mountain.region && <span className="text-stone-50/70"> · {mountain.region.toUpperCase()}</span>}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/mountains/${mountain.slug}`} className={buttonClass.ember}>
            View mountain
          </Link>
          <Link
            href={`/hikes/new?mountain=${mountain.slug}`}
            className={`${buttonClass.secondary} border-stone-50/40 text-stone-50 hover:border-stone-50 hover:bg-stone-50 hover:text-ink`}
          >
            Log it
          </Link>
        </div>
      </div>
    </article>
  );
}
