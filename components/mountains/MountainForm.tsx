"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { createMountain, deleteMountain, updateMountain } from "@/lib/actions/mountains";
import { DIFFICULTIES } from "@/lib/validation/mountain";
import { Field, FormMessage } from "@/components/ui/form";
import { buttonClass, inputClass } from "@/components/ui/styles";
import type { Mountain } from "@/types";

const FIELDS = [
  "name", "elevation", "region", "country", "difficulty", "description",
  "route_name", "route_description", "distance_km", "elevation_gain_m", "latitude", "longitude",
] as const;
type Values = Record<(typeof FIELDS)[number], string>;

export function MountainForm({ mountain }: { mountain?: Mountain }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [v, setV] = useState<Values>(() =>
    Object.fromEntries(FIELDS.map((f) => [f, mountain?.[f] != null ? String(mountain[f]) : ""])) as Values,
  );
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      setError(null);
      const res = mountain ? await updateMountain(mountain.id, v) : await createMountain(v);
      if (!res.ok) return setError(res.error);
      router.push(`/mountains/${res.slug}`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!mountain) return;
    start(async () => {
      const res = await deleteMountain(mountain.id);
      if (!res.ok) {
        setConfirmDelete(false);
        return setError(res.error);
      }
      router.push("/mountains");
      router.refresh();
    });
  }

  const input = (k: keyof Values, props: React.ComponentProps<"input"> = {}) => (
    <input id={k} value={v[k]} onChange={set(k)} className={inputClass} {...props} />
  );

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <FormMessage error={error ?? undefined} />

      <Field label="Name" htmlFor="name">
        {input("name", { required: true, maxLength: 80, placeholder: "Lion's Head" })}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Elevation (m)" htmlFor="elevation">
          {input("elevation", { type: "number", inputMode: "numeric", min: 1, max: 9000, placeholder: "669" })}
        </Field>
        <Field label="Difficulty" htmlFor="difficulty">
          <select id="difficulty" value={v.difficulty} onChange={set("difficulty")} className={inputClass}>
            <option value="">—</option>
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Region" htmlFor="region">
          {input("region", { maxLength: 80, placeholder: "Cape Town" })}
        </Field>
        <Field label="Country" htmlFor="country">
          {input("country", { maxLength: 60, placeholder: "South Africa" })}
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <textarea id="description" rows={3} maxLength={2000} value={v.description} onChange={set("description")} className={inputClass} />
      </Field>

      <fieldset className="space-y-6 border-t border-ink/10 pt-6">
        <legend className="eyebrow pr-2 text-charcoal">Route (optional)</legend>
        <Field label="Route name" htmlFor="route_name">
          {input("route_name", { maxLength: 120, placeholder: "Skeleton Gorge" })}
        </Field>
        <Field label="Route description" htmlFor="route_description">
          <textarea id="route_description" rows={3} maxLength={2000} value={v.route_description} onChange={set("route_description")} className={inputClass} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Route distance (km)" htmlFor="distance_km">
            {input("distance_km", { type: "number", inputMode: "decimal", step: "0.1", min: 0.1 })}
          </Field>
          <Field label="Route elevation gain (m)" htmlFor="elevation_gain_m">
            {input("elevation_gain_m", { type: "number", inputMode: "numeric", min: 0 })}
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-6 border-t border-ink/10 pt-6">
        <legend className="eyebrow pr-2 text-charcoal">Location (optional)</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Latitude" htmlFor="latitude" hint="e.g. -33.9357">
            {input("latitude", { type: "number", inputMode: "decimal", step: "any", min: -90, max: 90 })}
          </Field>
          <Field label="Longitude" htmlFor="longitude" hint="e.g. 18.3890">
            {input("longitude", { type: "number", inputMode: "decimal", step: "any", min: -180, max: 180 })}
          </Field>
        </div>
        <p className="text-sm text-mist">A Google Maps link is created automatically. Add a cover photo on the mountain&apos;s page after saving.</p>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6">
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {mountain ? "Save mountain" : "Add mountain"}
        </button>
        {mountain &&
          (confirmDelete ? (
            <span className="flex items-center gap-1">
              <button type="button" onClick={onDelete} disabled={pending} className={`${buttonClass.ember} min-h-11`}>
                Delete for good
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className={buttonClass.ghost}>
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className={buttonClass.ghost}>
              <Trash2 className="size-4" aria-hidden /> Delete mountain
            </button>
          ))}
      </div>
    </form>
  );
}
