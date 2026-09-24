import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getHikesForUser } from "@/lib/queries/hikes";
import { getUserList } from "@/lib/queries/mountains";
import { computeStats, firstSummitDates } from "@/lib/calculations/stats";
import { monthlyTotals } from "@/lib/calculations/monthly";
import { fmtDate, fmtDec, fmtInt } from "@/lib/format";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Section";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ElevationEquivalent } from "@/components/dashboard/ElevationEquivalent";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { computeStreak } from "@/lib/calculations/streaks";
import { BarChart } from "@/components/stats/BarChart";

export const metadata: Metadata = { title: "Statistics" };

export default async function StatsPage() {
  const user = await requireUser("/stats");
  const [hikes, mountains] = await Promise.all([getHikesForUser(user.id), getUserList(user.id)]);
  const stats = computeStats(hikes, mountains);
  const months = monthlyTotals(hikes, 12);

  // Summit progression: each mountain's first summit, in the order you reached them.
  const firstDates = firstSummitDates(hikes);
  const summits = mountains
    .filter((m) => firstDates.has(m.id) && m.elevation != null)
    .map((m) => ({ m, date: firstDates.get(m.id)! }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const summitBars = summits.map(({ m, date }, i) => ({
    key: m.id,
    label: m.name.split(" ")[0].slice(0, 8),
    value: m.elevation ?? 0,
    detail: `${m.name} · ${fmtInt(m.elevation ?? 0)} m · ${fmtDate(date)}`,
    // Solid when this summit set a new personal high.
    highlight: summits.slice(0, i).every((s) => (s.m.elevation ?? 0) < (m.elevation ?? 0)),
  }));

  return (
    <Container className="pb-16">
      <PageHeader eyebrow="Last 12 months & all time" title="Statistics" back="/hikes" />

      <section>
        <StatsGrid stats={stats} extended />
      </section>

      <section className="mt-14">
        <SectionHeading eyebrow="By month" title="Mileage" />
        <div className="grid gap-4 lg:grid-cols-3">
          <BarChart
            title="Distance"
            caption={`${fmtDec(months.reduce((s, m) => s + m.distanceKm, 0))} km`}
            data={months.map((m) => ({ key: m.key, label: m.label, value: m.distanceKm }))}
            format={(v) => `${fmtDec(v)} km`}
          />
          <BarChart
            title="Elevation"
            caption={`${fmtInt(months.reduce((s, m) => s + m.elevationM, 0))} m`}
            data={months.map((m) => ({ key: m.key, label: m.label, value: m.elevationM }))}
            format={(v) => `${fmtInt(v)} m`}
            tone="earth"
          />
          <BarChart
            title="Hikes"
            caption={`${months.reduce((s, m) => s + m.hikes, 0)} total`}
            data={months.map((m) => ({ key: m.key, label: m.label, value: m.hikes }))}
            format={(v) => `${fmtInt(v)}`}
          />
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionHeading eyebrow="First summits, in order" title="Elevation progression" />
          {summits.length ? (
            <BarChart
              title="Summit elevation"
              caption={stats.highestSummit ? `Highest ${fmtInt(stats.highestSummit.elevation)} m` : undefined}
              tone="ember"
              data={summitBars}
              format={(v) => `${fmtInt(v)} m`}
            />
          ) : (
            <p className="text-slate">Summit a mountain to start the progression.</p>
          )}
          <p className="mt-2 text-sm text-mist">Solid bars set a new personal high. Hover a bar for details.</p>
        </div>
        <div className="space-y-8">
          <StreakCard streak={computeStreak(hikes)} />
          <ElevationEquivalent stats={stats} />
        </div>
      </section>
    </Container>
  );
}
