import type { Hike } from "@/types";

export interface MonthBucket {
  key: string; // YYYY-MM
  label: string; // "Sep"
  year: number;
  distanceKm: number;
  elevationM: number;
  hikes: number;
}

/** Totals for each of the last `months` calendar months, oldest first, including empty months. */
export function monthlyTotals(hikes: Hike[], months = 12, now = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const index = new Map<string, MonthBucket>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    const bucket: MonthBucket = {
      key,
      label: d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }),
      year: d.getUTCFullYear(),
      distanceKm: 0,
      elevationM: 0,
      hikes: 0,
    };
    buckets.push(bucket);
    index.set(key, bucket);
  }
  for (const h of hikes) {
    const bucket = h.completion_date ? index.get(h.completion_date.slice(0, 7)) : undefined;
    if (!bucket) continue;
    bucket.distanceKm += h.distance_km ?? 0;
    bucket.elevationM += h.elevation_gain_m ?? 0;
    bucket.hikes += 1;
  }
  for (const b of buckets) b.distanceKm = Math.round(b.distanceKm * 10) / 10;
  return buckets;
}
