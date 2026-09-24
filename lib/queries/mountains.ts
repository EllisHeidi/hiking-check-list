import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format";
import type { Mountain } from "@/types";

const MOUNTAIN_COLUMNS =
  "id, name, slug, elevation, region, country, difficulty, description, route_name, route_description, image_url, latitude, longitude, google_maps_url, distance_km, elevation_gain_m, sort_order, is_final_goal";

function normalize(row: Record<string, unknown>): Mountain {
  return {
    ...(row as unknown as Mountain),
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    distance_km: toNumber(row.distance_km),
  };
}

/** All mountains in progression order. */
export const getMountains = cache(async (): Promise<Mountain[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mountains")
    .select(MOUNTAIN_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Could not load mountains: ${error.message}`);
  return (data ?? []).map(normalize);
});

export const getMountainBySlug = cache(async (slug: string): Promise<Mountain | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mountains")
    .select(MOUNTAIN_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load mountain: ${error.message}`);
  return data ? normalize(data) : null;
});
