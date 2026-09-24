"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { attachPhotos, createHike, deletePhoto, updateHike } from "@/lib/actions/hikes";
import {
  hikeSchema,
  fieldErrorsFrom,
  validatePhoto,
  PHOTO_MAX_COUNT,
  PHOTO_TYPES,
  type FieldErrors,
  type HikeInput,
} from "@/lib/validation/hike";
import { downscaleImage, extensionFor } from "@/lib/images";
import { Field, FormMessage, buttonClass, inputClass } from "@/components/ui/form";
import type { HikePhoto } from "@/types";

type MountainOption = { id: string; name: string; elevation: number | null };

export interface HikeFormInitial {
  id: string;
  mountainId: string;
  date: string;
  completed: boolean;
  distanceKm: number | null;
  elevationGainM: number | null;
  movingTimeMinutes: number | null;
  notes: string | null;
  photos: HikePhoto[];
}

type Pending = { file: File; preview: string };

export function HikeForm({
  mountains,
  defaultMountainId,
  today,
  initial,
}: {
  mountains: { list: MountainOption[]; others: MountainOption[] };
  defaultMountainId?: string;
  today: string;
  initial?: HikeFormInitial;
}) {
  const router = useRouter();
  const [mountainId, setMountainId] = useState(initial?.mountainId ?? defaultMountainId ?? "");
  const [date, setDate] = useState(initial?.date ?? today);
  const [completed, setCompleted] = useState(initial?.completed ?? true);
  const [distance, setDistance] = useState(initial?.distanceKm?.toString() ?? "");
  const [gain, setGain] = useState(initial?.elevationGainM?.toString() ?? "");
  const [hours, setHours] = useState(initial?.movingTimeMinutes ? String(Math.floor(initial.movingTimeMinutes / 60)) : "");
  const [minutes, setMinutes] = useState(initial?.movingTimeMinutes ? String(initial.movingTimeMinutes % 60) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [existing, setExisting] = useState<HikePhoto[]>(initial?.photos ?? []);
  const [pending, setPending] = useState<Pending[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<string | null>(null);

  // Revoke preview URLs on unmount only (individual removals revoke their own).
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const selected = useMemo(
    () => [...mountains.list, ...mountains.others].find((m) => m.id === mountainId),
    [mountains, mountainId],
  );
  const busy = status !== null;
  const photoSlots = PHOTO_MAX_COUNT - existing.length - pending.length;

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: Pending[] = [];
    const problems: string[] = [];
    for (const file of Array.from(files)) {
      const problem = validatePhoto(file);
      if (problem) problems.push(problem);
      else if (next.length < photoSlots) next.push({ file, preview: URL.createObjectURL(file) });
      else problems.push(`Up to ${PHOTO_MAX_COUNT} photos per hike.`);
    }
    setPending((p) => [...p, ...next]);
    setErrors((e) => ({ ...e, photos: problems[0] }));
  }

  function removePending(i: number) {
    setPending((p) => {
      URL.revokeObjectURL(p[i].preview);
      return p.filter((_, j) => j !== i);
    });
  }

  async function removeExisting(photo: HikePhoto) {
    setExisting((e) => e.filter((p) => p.id !== photo.id));
    const res = await deletePhoto(photo.id);
    if (!res.ok) {
      setExisting((e) => [...e, photo]);
      setErrors((e) => ({ ...e, photos: "Couldn't remove that photo." }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = hours ? Number(hours) : 0;
    const m = minutes ? Number(minutes) : 0;
    const input: HikeInput = {
      mountainId,
      date,
      completed,
      distanceKm: distance === "" ? NaN : Number(distance),
      elevationGainM: gain === "" ? NaN : Number(gain),
      movingTimeMinutes: hours || minutes ? Math.round(h * 60 + m) : null,
      notes: notes.trim() || undefined,
    };

    const parsed = hikeSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      return;
    }
    if (minutes && (m < 0 || m > 59)) {
      setErrors({ movingTimeMinutes: "Minutes must be between 0 and 59." });
      return;
    }
    setErrors({});
    setStatus(initial ? "Saving…" : "Logging hike…");

    const res = initial ? await updateHike(initial.id, parsed.data) : await createHike(parsed.data);
    if (!res.ok) {
      setErrors(res.errors);
      setStatus(null);
      return;
    }

    if (pending.length) {
      setStatus(`Uploading ${pending.length} photo${pending.length > 1 ? "s" : ""}…`);
      const supabase = createClient();
      const paths: string[] = [];
      for (const p of pending) {
        const file = await downscaleImage(p.file);
        // Path must start with {userId}/{hikeId}/ — enforced by Storage + RLS policies.
        const path = `${res.userId}/${res.hikeId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
        const { error } = await supabase.storage
          .from("hike-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (!error) paths.push(path);
      }
      const attached = await attachPhotos(res.hikeId, paths);
      if (!attached.ok || paths.length < pending.length) {
        // The hike is saved; send them to it and flag the photo problem there.
        router.push(`/hikes/${res.hikeId}?photos=failed`);
        return;
      }
    }

    const q = res.unlocked.length ? `?unlocked=${res.unlocked.join(",")}` : "";
    router.push(`/hikes/${res.hikeId}${q}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <FormMessage error={errors.form} />

      <Field label="Mountain" htmlFor="mountain" error={errors.mountainId}>
        <select
          id="mountain"
          value={mountainId}
          onChange={(e) => setMountainId(e.target.value)}
          className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%235b5850%22 stroke-width=%221.5%22/></svg>')] bg-[length:12px_8px] bg-[right_1rem_center] bg-no-repeat pr-10`}
          aria-invalid={Boolean(errors.mountainId)}
          required
        >
          <option value="" disabled>
            Choose a mountain…
          </option>
          {[
            { label: "Your list", items: mountains.list },
            { label: "Other mountains", items: mountains.others },
          ]
            .filter((g) => g.items.length)
            .map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.elevation ? ` — ${m.elevation.toLocaleString("en-US")} m` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
      </Field>

      <fieldset>
        <legend className="eyebrow mb-2 text-charcoal">Outcome</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, label: "Summited", sub: selected ? `Conquer ${selected.name}` : "Reached the top" },
            { v: false, label: "Attempt", sub: "Turned back / training" },
          ].map((o) => (
            <label
              key={String(o.v)}
              className={`cursor-pointer rounded-sm border p-4 transition-colors ${
                completed === o.v ? "border-forest bg-forest text-stone-50" : "border-ink/20 bg-stone-50 hover:border-ink/40"
              }`}
            >
              <input type="radio" name="completed" className="sr-only" checked={completed === o.v} onChange={() => setCompleted(o.v)} />
              <span className="font-display block text-2xl">{o.label}</span>
              <span className={`text-sm ${completed === o.v ? "text-stone-50/75" : "text-slate"}`}>{o.sub}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Date" htmlFor="date" error={errors.date}>
          <input id="date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={inputClass} aria-invalid={Boolean(errors.date)} required />
        </Field>
        <Field label="Distance (km)" htmlFor="distance" error={errors.distanceKm}>
          <input
            id="distance"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0.1"
            placeholder="12.4"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.distanceKm)}
            required
          />
        </Field>
        <Field label="Elevation gain (m)" htmlFor="gain" error={errors.elevationGainM}>
          <input
            id="gain"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            placeholder="850"
            value={gain}
            onChange={(e) => setGain(e.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.elevationGainM)}
            required
          />
        </Field>
        <Field label="Moving time" htmlFor="hours" error={errors.movingTimeMinutes} hint="Optional">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input id="hours" type="number" inputMode="numeric" min="0" max="335" placeholder="5" value={hours} onChange={(e) => setHours(e.target.value)} className={`${inputClass} pr-10`} aria-label="Hours" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs text-mist">h</span>
            </div>
            <div className="relative">
              <input id="minutes" type="number" inputMode="numeric" min="0" max="59" placeholder="30" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${inputClass} pr-10`} aria-label="Minutes" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs text-mist">min</span>
            </div>
          </div>
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" error={errors.notes}>
        <textarea
          id="notes"
          rows={5}
          maxLength={4000}
          placeholder="Conditions, route, who you went with, what the summit felt like…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <div>
        <p className="eyebrow mb-2 text-charcoal">Photos</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {existing.map((p) => (
            <Thumb key={p.id} src={p.url ?? ""} alt={p.caption ?? "Hike photo"} onRemove={() => removeExisting(p)} />
          ))}
          {pending.map((p, i) => (
            <Thumb key={p.preview} src={p.preview} alt={p.file.name} onRemove={() => removePending(i)} />
          ))}
          {photoSlots > 0 && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-ink/30 text-slate transition-colors hover:border-forest hover:text-forest">
              <ImagePlus className="size-6" aria-hidden />
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em]">Add</span>
              <input
                type="file"
                accept={PHOTO_TYPES.join(",")}
                multiple
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <p className={`mt-2 text-sm ${errors.photos ? "text-ember-600" : "text-mist"}`} role={errors.photos ? "alert" : undefined}>
          {errors.photos ?? `JPG, PNG or WebP, up to 10 MB each. ${PHOTO_MAX_COUNT} max.`}
        </p>
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 border-t border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <button type="submit" disabled={busy} className={`${buttonClass.primary} w-full sm:w-auto`}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {status ?? (initial ? "Save changes" : "Log hike")}
        </button>
      </div>
    </form>
  );
}

function Thumb({ src, alt, onRemove }: { src: string; alt: string; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-sm bg-sand">
      {/* Blob/signed URLs from the picker — next/image isn't useful for a transient preview. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt={alt} className="size-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 inline-flex size-9 items-center justify-center rounded-full bg-ink/70 text-stone-50 hover:bg-ink"
        aria-label={`Remove ${alt}`}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
