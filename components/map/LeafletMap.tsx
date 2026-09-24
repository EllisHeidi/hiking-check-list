"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { fmtInt } from "@/lib/format";
import { mapsUrl } from "@/lib/validation/mountain";
import type { MapMountain } from "./MountainMap";

/** Triangle peak marker in the app's colours; dashed when the location is approximate. */
function peakIcon(done: boolean, approximate: boolean) {
  const fill = done ? "#c2542d" : "#f4f0e8";
  const stroke = done ? "#7a2f14" : "#1f3a2e";
  const dash = approximate ? `stroke-dasharray="3 2"` : "";
  return L.divIcon({
    className: "",
    iconSize: [26, 24],
    iconAnchor: [13, 22],
    popupAnchor: [0, -20],
    html: `<svg width="26" height="24" viewBox="0 0 26 24" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.35))">
      <path d="M13 2 L24 22 H2 Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" ${dash}/>
    </svg>`,
  });
}

/** Fit the view to the local peaks, or fly to a focused one. */
function Viewport({ bounds, focus }: { bounds: L.LatLngBoundsExpression | null; focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo(focus, 9, { duration: 1.2 });
    else if (bounds) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11 });
  }, [map, bounds, focus]);
  return null;
}

export default function LeafletMap({
  mountains,
  conquered,
  bounds,
  focus,
}: {
  mountains: MapMountain[];
  conquered: Set<string>;
  bounds: [[number, number], [number, number]] | null;
  focus: [number, number] | null;
}) {
  return (
    <MapContainer
      center={[-33.6, 19.6]}
      zoom={7}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      {/* OpenTopoMap terrain tiles: free, no API key (attribution required). */}
      <TileLayer
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
        attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
      />

      <Viewport bounds={bounds} focus={focus} />

      {mountains.map((m) => {
        const done = conquered.has(m.id);
        const approximate = m.coordinate_accuracy === "approximate";
        return (
          <Marker key={m.id} position={[m.latitude!, m.longitude!]} icon={peakIcon(done, approximate)} title={m.name}>
            <Popup>
              <div style={{ fontFamily: "var(--font-sans)", minWidth: 180 }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, textTransform: "uppercase", margin: 0, lineHeight: 1 }}>
                  {m.name}
                </p>
                <p style={{ margin: "4px 0 0", fontFamily: "var(--font-mono)", fontSize: 12, color: "#5b5850" }}>
                  {m.elevation ? `${fmtInt(m.elevation)} m` : "Elevation TBC"}
                  {done ? " · ✓ Conquered" : ""}
                </p>
                <p style={{ margin: "4px 0 8px", fontSize: 12, color: approximate ? "#8a7358" : "#1f3a2e" }}>
                  {approximate ? "≈ Approximate area — not the exact summit" : m.coordinate_accuracy === "verified" ? "✓ Verified location" : ""}
                </p>
                <a href={`/mountains/${m.slug}`} style={{ color: "#1f3a2e", fontWeight: 600, marginRight: 12 }}>
                  View mountain
                </a>
                <a href={mapsUrl(m)} target="_blank" rel="noopener noreferrer" style={{ color: "#5b5850" }}>
                  Google Maps ↗
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
