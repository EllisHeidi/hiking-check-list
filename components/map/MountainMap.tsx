import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import type { Mountain } from "@/types";
import { fmtInt } from "@/lib/format";

/**
 * V1 map: a lightweight SVG plot of the Western Cape objectives by lat/lng,
 * plus a list with Google Maps links. The props are the contract — swap the
 * body for a Leaflet/Mapbox map later without touching callers.
 */
export interface MountainMapProps {
  mountains: Pick<Mountain, "id" | "name" | "slug" | "elevation" | "latitude" | "longitude" | "google_maps_url" | "is_final_goal" | "region">[];
  conquered: Set<string>;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const W = 640;
const H = 400;
const PAD = 36;

export function MountainMap({ mountains, conquered }: MountainMapProps) {
  const local = mountains.filter((m) => !m.is_final_goal && m.latitude != null && m.longitude != null);
  const lats = local.map((m) => m.latitude!);
  const lngs = local.map((m) => m.longitude!);
  const [minLat, maxLat] = [Math.min(...lats) - 0.15, Math.max(...lats) + 0.15];
  const [minLng, maxLng] = [Math.min(...lngs) - 0.2, Math.max(...lngs) + 0.2];
  const x = (lng: number) => PAD + ((lng - minLng) / (maxLng - minLng || 1)) * (W - PAD * 2);
  const y = (lat: number) => PAD + ((maxLat - lat) / (maxLat - minLat || 1)) * (H - PAD * 2);
  const finalGoal = mountains.find((m) => m.is_final_goal);
  const finalDistanceKm =
    finalGoal?.latitude != null && finalGoal.longitude != null && local.length
      ? haversineKm(
          lats.reduce((a, b) => a + b, 0) / lats.length,
          lngs.reduce((a, b) => a + b, 0) / lngs.length,
          finalGoal.latitude,
          finalGoal.longitude,
        )
      : null;

  // Greedy label placement: right of the marker, else left, else hover-only.
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const labels = new Map<string, { x: number; anchor: "start" | "end" }>();
  const hits = (b: { x: number; y: number; w: number; h: number }) =>
    placed.some((p) => b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y);
  for (const m of [...local].sort((a, b) => Number(conquered.has(b.id)) - Number(conquered.has(a.id)))) {
    const px = x(m.longitude!);
    const py = y(m.latitude!);
    const w = m.name.length * 6.4;
    placed.push({ x: px - 8, y: py - 12, w: 16, h: 14 });
    const right = { x: px + 10, y: py - 8, w, h: 12 };
    const left = { x: px - 10 - w, y: py - 8, w, h: 12 };
    if (right.x + w < W && !hits(right)) {
      placed.push(right);
      labels.set(m.id, { x: px + 10, anchor: "start" });
    } else if (left.x > 0 && !hits(left)) {
      placed.push(left);
      labels.set(m.id, { x: px - 10, anchor: "end" });
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
      <figure className="topo relative overflow-hidden rounded-sm border border-ink/10 bg-stone-50">
        {local.length > 0 ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Map of Western Cape objectives">
            {local.map((m) => {
              const done = conquered.has(m.id);
              return (
                <a key={m.id} href={`/mountains/${m.slug}`}>
                  <title>{`${m.name}${m.elevation ? ` · ${fmtInt(m.elevation)} m` : ""}`}</title>
                  <path
                    d={`M ${x(m.longitude!)} ${y(m.latitude!) - 11} l 7 12 h -14 z`}
                    className={done ? "fill-ember" : "fill-none stroke-forest"}
                    strokeWidth={1.5}
                  />
                  {labels.has(m.id) && (
                    <text
                      x={labels.get(m.id)!.x}
                      y={y(m.latitude!) + 1}
                      textAnchor={labels.get(m.id)!.anchor}
                      className="fill-charcoal font-mono text-[10px]"
                    >
                      {m.name}
                    </text>
                  )}
                </a>
              );
            })}
          </svg>
        ) : (
          <p className="p-8 text-slate">Add coordinates to mountains to see them on the map.</p>
        )}
        {finalGoal && (
          <figcaption className="absolute right-3 bottom-3 rounded-xs bg-ink px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-stone-50">
            {finalGoal.name}
            {finalDistanceKm ? ` → ~${fmtInt(Math.round(finalDistanceKm / 100) * 100)} km` : " → off map"}
          </figcaption>
        )}
      </figure>

      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {mountains.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-3">
            <MapPin className={`size-4 shrink-0 ${conquered.has(m.id) ? "text-ember" : "text-mist"}`} aria-hidden />
            <Link href={`/mountains/${m.slug}`} className="min-w-0 flex-1 truncate hover:underline">
              {m.name}
            </Link>
            <span className="font-mono text-xs text-mist">
              {m.latitude != null ? `${m.latitude.toFixed(2)}, ${m.longitude?.toFixed(2)}` : "no coords"}
            </span>
            {m.google_maps_url && (
              <a
                href={m.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-11 items-center justify-center text-slate hover:text-forest"
                aria-label={`Open ${m.name} in Google Maps`}
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
