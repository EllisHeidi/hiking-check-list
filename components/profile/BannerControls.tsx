"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { removeBanner, setBanner } from "@/lib/actions/profile";
import { downscaleImage } from "@/lib/images";
import { validatePhoto } from "@/lib/validation/hike";

const chip =
  "inline-flex min-h-10 items-center gap-1.5 rounded-sm bg-ink/55 px-3 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-stone-50 backdrop-blur-sm transition-colors hover:bg-ink/75 disabled:opacity-60";

/** Upload / remove your own profile banner. Shown only on your own profile. */
export function BannerControls({ hasCustom }: { hasCustom: boolean }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onFile(file: File | undefined) {
    if (!file) return;
    const problem = validatePhoto({ name: "Photo", type: file.type, size: file.size });
    if (problem) return setError(problem);
    setError(null);
    setBusy("upload");
    start(async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setBusy(null);
        return setError("Your session has expired.");
      }
      // Wide banner: 2400px on the long edge is plenty, and keeps it well under the 5 MB limit.
      const small = await downscaleImage(file, 2400, 0.85);
      const ext = small.type === "image/png" ? "png" : small.type === "image/webp" ? "webp" : "jpg";
      const path = `${auth.user.id}/banner-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, small, { contentType: small.type });
      const res = upErr ? { ok: false, error: "Upload failed. Try a smaller photo." } : await setBanner(path);
      setBusy(null);
      if (!res.ok) return setError(res.error ?? "Couldn't save your banner.");
      router.refresh();
    });
  }

  function onRemove() {
    setError(null);
    setBusy("remove");
    start(async () => {
      const res = await removeBanner();
      setBusy(null);
      if (!res.ok) return setError(res.error ?? "Couldn't remove your banner.");
      router.refresh();
    });
  }

  return (
    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <label className={`${chip} cursor-pointer ${pending ? "pointer-events-none opacity-60" : ""}`}>
          {busy === "upload" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Camera className="size-3.5" aria-hidden />}
          {busy === "upload" ? "Uploading…" : hasCustom ? "Change banner" : "Add banner"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {hasCustom && (
          <button type="button" onClick={onRemove} disabled={pending} className={chip} aria-label="Remove banner photo">
            {busy === "remove" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <X className="size-3.5" aria-hidden />}
            <span className="hidden sm:inline">Remove</span>
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="max-w-64 rounded-sm bg-ink/80 px-2 py-1 text-right text-xs text-stone-50">
          {error}
        </p>
      )}
    </div>
  );
}
