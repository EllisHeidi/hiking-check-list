// Stage keys for user_mountains.stage. Stages are stored (and a sensible default
// is set when a mountain is added) but not shown in the UI.

export const STAGE_KEYS = ["start", "build", "advanced", "high", "extreme"] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export function isStage(v: unknown): v is StageKey {
  return typeof v === "string" && (STAGE_KEYS as readonly string[]).includes(v);
}

/** Default stage for a mountain added to a list, from its elevation. */
export function stageForElevation(elevation: number | null | undefined): StageKey {
  if (elevation == null || elevation < 1000) return "start";
  if (elevation < 1300) return "build";
  if (elevation < 1600) return "advanced";
  if (elevation < 2150) return "high";
  return "extreme";
}
