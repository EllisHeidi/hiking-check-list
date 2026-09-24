import { z } from "zod";

export const DIFFICULTIES = ["Easy", "Moderate", "Hard", "Strenuous", "Extreme"] as const;

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v == null || Number.isNaN(v) ? null : Number(v)), schema.nullable());

const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(max).nullable());

export const mountainSchema = z.object({
  name: z.string().trim().min(2, "Give the mountain a name.").max(80, "Keep the name under 80 characters."),
  elevation: optionalNumber(z.number().int("Use whole metres.").positive("Elevation must be above 0.").max(9000, "Check the elevation.")),
  region: optionalText(80),
  country: optionalText(60),
  difficulty: z.preprocess((v) => (v ? v : null), z.enum(DIFFICULTIES).nullable()),
  description: optionalText(2000),
  route_name: optionalText(120),
  route_description: optionalText(2000),
  distance_km: optionalNumber(z.number().gt(0, "Distance must be above 0.").lt(1000)),
  elevation_gain_m: optionalNumber(z.number().int().min(0).lt(20000)),
  latitude: optionalNumber(z.number().min(-90).max(90, "Latitude is between -90 and 90.")),
  longitude: optionalNumber(z.number().min(-180).max(180, "Longitude is between -180 and 180.")),
});

export type MountainInput = z.infer<typeof mountainSchema>;

export function slugify(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "mountain"
  );
}

/**
 * Google Maps link. Always opens at the exact coordinates when we have them;
 * only falls back to a place-name search when a mountain has no coordinates.
 */
export function mapsUrl(m: { name: string; region: string | null; latitude: number | null; longitude: number | null }) {
  if (m.latitude != null && m.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${Number(m.latitude)},${Number(m.longitude)}`;
  }
  const q = [m.name, m.region].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
