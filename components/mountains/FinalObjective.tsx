import Image from "next/image";
import Link from "next/link";
import type { Mountain } from "@/types";
import { fmtInt } from "@/lib/format";
import { buttonClass } from "@/components/ui/form";

/** Full-bleed Kilimanjaro feature — visually separate from every other objective. */
export function FinalObjective({
  mountain,
  conquered,
  highestSoFar,
}: {
  mountain: Mountain;
  conquered: boolean;
  highestSoFar: number | null;
}) {
  const elevation = mountain.elevation ?? 0;
  const pct = highestSoFar && elevation ? Math.min(100, Math.round((highestSoFar / elevation) * 100)) : 0;
  const flag = mountain.country === "Tanzania" ? " 🇹🇿" : "";

  return (
    <section className="relative isolate overflow-hidden bg-ink text-stone-50">
      {mountain.image_url && (
        <Image
          src={mountain.image_url}
          alt={`Summit slopes of ${mountain.name} at sunrise`}
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-70"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />

      <div className="mx-auto flex min-h-[34rem] max-w-7xl flex-col justify-end px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <p className="eyebrow text-stone-50/70">The final objective</p>
        <h2 className="font-display mt-3 text-[clamp(4rem,16vw,11rem)]">
          {mountain.name.replace(/^Mount\s+/i, "")}
        </h2>
        <p className="mt-3 font-mono text-xl sm:text-2xl">
          {fmtInt(elevation)} m <span className="text-stone-50/60">· {mountain.country}{flag}</span>
        </p>

        <div className="mt-10 max-w-xl">
          <div className="flex justify-between font-mono text-xs uppercase tracking-[0.16em] text-stone-50/70">
            <span>Highest so far {highestSoFar ? `${fmtInt(highestSoFar)} m` : "—"}</span>
            <span>{pct}% of the way up</span>
          </div>
          <div className="mt-2 h-1 bg-stone-50/15">
            <div className="h-full origin-left animate-grow bg-ember" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-8">
          <Link
            href={`/mountains/${mountain.slug}`}
            className={`${buttonClass.secondary} border-stone-50/40 text-stone-50 hover:border-stone-50 hover:bg-stone-50 hover:text-ink`}
          >
            {conquered ? "View summit" : "View objective"}
          </Link>
        </div>
      </div>
    </section>
  );
}
