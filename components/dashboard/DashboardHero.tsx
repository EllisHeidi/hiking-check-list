import type { UserStats } from "@/types";
import { Container } from "@/components/ui/Section";

export function DashboardHero({ stats, name }: { stats: UserStats; name: string }) {
  return (
    <section className="topo border-b border-ink/10">
      <Container className="pt-10 pb-10 sm:pt-16 sm:pb-14">
        <p className="eyebrow">Logbook of {name}</p>
        <h1 className="font-display mt-3 text-[clamp(3.5rem,13vw,9.5rem)]">
          Mountain
          <br />
          Kill List
        </h1>
        <p className="mt-4 text-xl text-charcoal sm:text-2xl">Your road to Kilimanjaro.</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-slate">
          Cape Town → Western Cape → 2,000 m+ → {stats.kilimanjaroElevation?.toLocaleString("en-US") ?? "5,895"} m
        </p>

        <div className="mt-10 grid items-end gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
          <p className="font-display text-7xl tabular-nums sm:text-8xl">
            {stats.mountainsConquered}
            <span className="text-mist"> / {stats.totalMountains}</span>
          </p>
          <div className="pb-2">
            <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.16em]">
              <span>Conquered</span>
              <span className="text-ember">{stats.percentComplete}% complete</span>
            </div>
            <div
              className="mt-2 grid h-3 gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${Math.max(stats.totalMountains, 1)}, minmax(0, 1fr))` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={stats.totalMountains}
              aria-valuenow={stats.mountainsConquered}
              aria-label="Mountains conquered"
            >
              {Array.from({ length: stats.totalMountains }, (_, i) => (
                <span
                  key={i}
                  className={`${i < stats.mountainsConquered ? "bg-ember" : "bg-ink/10"} ${
                    i === stats.totalMountains - 1 ? "bg-ink/30" : ""
                  } ${i < stats.mountainsConquered && i === stats.totalMountains - 1 ? "!bg-ember" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
