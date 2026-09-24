import { z } from "zod";

// Shared by the hike form (client) and the server actions (authoritative).

export const PHOTO_MAX_BYTES = 10 * 1024 * 1024; // matches the hike-photos bucket limit
export const PHOTO_MAX_COUNT = 10;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validatePhoto(file: { type: string; size: number; name: string }): string | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: use JPG, PNG or WebP.`;
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return `${file.name}: larger than ${PHOTO_MAX_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

function isRealDate(s: string) {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function notInFuture(s: string) {
  // One day of slack for timezones ahead of the server.
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return s <= tomorrow;
}

export const hikeSchema = z.object({
  mountainId: z.uuid({ message: "Choose a mountain." }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
    .refine(isRealDate, "Enter a valid date.")
    .refine((s) => s >= "1900-01-01", "Enter a valid date.")
    .refine(notInFuture, "The date can't be in the future."),
  completed: z.boolean(),
  distanceKm: z
    .number({ message: "Enter the distance." })
    .gt(0, "Distance must be more than 0 km.")
    .lt(1000, "That's a long way — check the distance."),
  elevationGainM: z
    .number({ message: "Enter the elevation gain." })
    .int("Use whole metres.")
    .min(0, "Elevation gain can't be negative.")
    .lt(20000, "Check the elevation gain."),
  movingTimeMinutes: z
    .number()
    .int()
    .positive("Moving time must be more than 0.")
    .lt(20160, "Moving time must be under 14 days.")
    .nullable(),
  notes: z.string().trim().max(4000, "Keep notes under 4,000 characters.").optional(),
});

export type HikeInput = z.infer<typeof hikeSchema>;

export type FieldErrors = Partial<Record<keyof HikeInput | "photos" | "form", string>>;

export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = (issue.path[0] as keyof FieldErrors) ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
