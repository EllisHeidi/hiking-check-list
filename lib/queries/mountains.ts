import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/format";
import type { Mountain } from "@/types";
import { isStage, stageForElevation } from "@/lib/stages";

export const MOUNTAIN_COLUMNS =
  "id, created_by, is_starter, name, slug, elevation, region, country, difficulty, description, route_name, route_description, image_url, image_credit, image_credit_url, latitude, longitude, google_maps_url, distance_km, elevation_gain_m, sort_order, is_final_goal";

export function normalizeMountain(row: Record<string, unknown>): Mountain {
  return {
    ...(row as unknown as Mountain),
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    distance_km: toNumber(row.distance_km),
  };
}

/**
 * A hiker's personal kill list, in their order. `is_final_goal`, `sort_order`
 * and `stage` are the hiker's own (from user_mountains), not the catalogue
 * defaults. The final goal is always last. RLS returns an empty list for
 * private hikers you can't see.
 */
export const getUserList = cache(async (userId: string): Promise<Mountain[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_mountains")
    .select(`sort_order, is_final_goal, stage, mountain:mountains ( ${MOUNTAIN_COLUMNS} )`)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load your list: ${error.message}`);

  const list = (data ?? [])
    .filter((r) => r.mountain)
    .map((r) => {
      const m = normalizeMountain(r.mountain as unknown as Record<string, unknown>);
      return {
        ...m,
        sort_order: r.sort_order as number,
        is_final_goal: r.is_final_goal as boolean,
        stage: isStage(r.stage) ? r.stage : stageForElevation(m.elevation),
      };
    });
  return [...list.filter((m) => !m.is_final_goal), ...list.filter((m) => m.is_final_goal)];
});

/** The shared catalogue, optionally filtered by name/region. */
export async function searchCatalogue(query = "", limit = 60): Promise<Mountain[]> {
  const supabase = await createClient();
  // The seeded progression first (in its order), then hiker-added mountains A–Z.
  let q = supabase
    .from("mountains")
    .select(`${MOUNTAIN_COLUMNS}, starter_stage`)
    .order("is_starter", { ascending: false })
    .order("sort_order")
    .order("name")
    .limit(limit);
  const term = query.trim().replace(/[%_,()]/g, "");
  if (term) q = q.or(`name.ilike.%${term}%,region.ilike.%${term}%,country.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw new Error(`Could not load mountains: ${error.message}`);
  return (data ?? []).map(normalizeMountain);
}

export const getMountainBySlug = cache(async (slug: string): Promise<Mountain | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mountains")
    .select(MOUNTAIN_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load mountain: ${error.message}`);
  return data ? normalizeMountain(data) : null;
});

/** Mountains for the hike form: your list first, then the rest of the catalogue. */
export async function getHikeFormMountains(userId: string) {
  const [list, catalogue] = await Promise.all([getUserList(userId), searchCatalogue("", 500)]);
  const onList = new Set(list.map((m) => m.id));
  return { list, others: catalogue.filter((m) => !onList.has(m.id)) };
}
