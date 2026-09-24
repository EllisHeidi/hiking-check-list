import type { UserStats } from "@/types";
import { fmtDec, fmtInt } from "@/lib/format";
import { StatBlock } from "@/components/ui/Section";

const unit = (u: string) => <span className="ml-1 text-[0.5em] text-slate">{u}</span>;

export function StatsGrid({ stats, extended = false }: { stats: UserStats; extended?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      <StatBlock value={<>{fmtDec(stats.totalDistanceKm)}{unit("km")}</>} label="Hiked" />
      <StatBlock value={<>{fmtInt(stats.totalElevationM)}{unit("m")}</>} label="Elevation gained" />
      <StatBlock value={stats.mountainsConquered} label="Mountains" accent />
      <StatBlock
        value={stats.highestSummit ? <>{fmtInt(stats.highestSummit.elevation)}{unit("m")}</> : "—"}
        label={stats.highestSummit ? `Highest · ${stats.highestSummit.name}` : "Highest summit"}
      />
      {extended && (
        <>
          <StatBlock value={stats.totalHikes} label="Total hikes" />
          <StatBlock value={<>{fmtDec(stats.longestHikeKm)}{unit("km")}</>} label="Longest hike" />
          <StatBlock value={<>{fmtDec(stats.averageDistanceKm)}{unit("km")}</>} label="Average hike" />
          <StatBlock value={`${stats.percentComplete}%`} label="List complete" />
        </>
      )}
    </div>
  );
}
