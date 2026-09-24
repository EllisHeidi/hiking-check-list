"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import type { Mountain } from "@/types";
import { fmtInt } from "@/lib/format";
import { mapsUrl } from "@/lib/validation/mountain";

export type MapMountain = Pick<
  Mountain,
  "id" | "name" | "slug" | "elevation" | "latitude" | "longitude" | "coordinate_accuracy" | "is_final_goal" | "region" | "country"
>;

export interface MountainMapProps {
  mountains: MapMountain[];
  conqueredIds: string[];
}

// Leaflet needs `window`, so the map itself only renders in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="topo flex h-full items-center justify-center text-sm text-mist">Loading map…</div>,
});

const LOCAL_RADIUS_KM = 700;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/**
 * Interactive terrain map of your list. It frames the main cluster of peaks
 * (e.g. the Western Cape); far-away objectives like Kilimanjaro are listed as
 * "off the map" and can be flown to.
 */
export function MountainMap({ mountains, conqueredIds }: MountainMapProps) {
  const conquered = useMemo(() => new Set(conqueredIds), [conqueredIds]);
  const [focus, setFocus] = useState<[number, number] | null>(null);

  const { located, local, far, bounds } = useMemo(() => {
    const located = mountains.filter((m) => m.latitude != null && m.longitude != null);
    if (!located.length) return { located, local: [], far: [], bounds: null };
    const c = { lat: median(located.map((m) => m.latitude!)), lng: median(located.map((m) => m.longitude!)) };
    const dist = (m: MapMountain) => haversineKm(c.lat, c.lng, m.latitude!, m.longitude!);
    const local = located.filter((m) => dist(m) <= LOCAL_RADIUS_KM);
    const far = located.filter((m) => dist(m) > LOCAL_RADIUS_KM).map((m) => ({ m, km: dist(m) }));
    const frame = local.length ? local : located;
    const lats = frame.map((m) => m.latitude!);
    const lngs = frame.map((m) => m.longitude!);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    return { located, local, far, bounds };
  }, [mountains]);

  const unlocated = mountains.filter((m) => m.latitude == null || m.longitude == null);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div>
        {/* `isolate` keeps Leaflet's high z-index panes under the sticky header / bottom nav. */}
        <div className="relative isolate h-[420px] overflow-hidden rounded-sm border border-ink/15 sm:h-[520px]">
          {located.length ? (
            <LeafletMap mountains={located} conquered={conquered} bounds={bounds} focus={focus} />
          ) : (
            <p className="topo flex h-full items-center justify-center p-8 text-center text-slate">
              Add coordinates to mountains to see them on the map.
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-slate">
            <Legend fill="#c2542d" stroke="#7a2f14" /> Conquered
            <Legend fill="#f4f0e8" stroke="#1f3a2e" /> Objective
            <Legend fill="#f4f0e8" stroke="#1f3a2e" dashed /> Approx.
          </span>
          {focus && (
            <button
              type="button"
              onClick={() => setFocus(null)}
              className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-ink/25 px-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] hover:bg-ink hover:text-stone-50"
            >
              Back to {local.length ? "the Western Cape" : "all peaks"}
            </button>
          )}
        </div>

        {far.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-mist">Off the map:</span>
            {far.map(({ m, km }) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setFocus([m.latitude!, m.longitude!])}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-ink px-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-stone-50 hover:bg-charcoal"
              >
                <Navigation className="size-3.5 text-ember" aria-hidden />
                {m.name} · {fmtInt(Math.round(km / 100) * 100)} km
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-mist">Drag to pan, pinch or use + / − to zoom. Tap a peak for details.</p>
      </div>

      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {mountains.map((m) => {
          const has = m.latitude != null && m.longitude != null;
          const approx = m.coordinate_accuracy === "approximate";
          return (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <button
                type="button"
                disabled={!has}
                onClick={() => has && setFocus([m.latitude!, m.longitude!])}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm hover:bg-sand disabled:opacity-40"
                aria-label={has ? `Show ${m.name} on the map` : `${m.name} has no coordinates`}
              >
                <MapPin className={`size-4 ${conquered.has(m.id) ? "text-ember" : "text-mist"}`} aria-hidden />
              </button>
              <Link href={`/mountains/${m.slug}`} className="min-w-0 flex-1 truncate hover:underline">
                {m.name}
              </Link>
              <span className="font-mono text-xs text-mist">
                {has ? `${approx ? "≈ " : ""}${m.elevation ? `${fmtInt(m.elevation)} m` : "—"}` : "no coords"}
              </span>
              <a
                href={mapsUrl(m)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-9 items-center justify-center text-slate hover:text-forest"
                aria-label={`Open ${m.name} in Google Maps`}
              >
                <ExternalLink className="size-4" />
              </a>
            </li>
          );
        })}
        {unlocated.length > 0 && (
          <li className="py-2 text-xs text-mist">
            {unlocated.length} {unlocated.length === 1 ? "mountain has" : "mountains have"} no coordinates yet.
          </li>
        )}
      </ul>
    </div>
  );
}

function Legend({ fill, stroke, dashed = false }: { fill: string; stroke: string; dashed?: boolean }) {
  return (
    <svg width="14" height="13" viewBox="0 0 26 24" aria-hidden>
      <path d="M13 2 L24 22 H2 Z" fill={fill} stroke={stroke} strokeWidth="2.5" strokeDasharray={dashed ? "3 2" : undefined} />
    </svg>
  );
}
