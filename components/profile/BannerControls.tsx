"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { removeBanner, setBanner } from "@/lib/actions/profile";
import { downscaleImage } from "@/lib/images";
import { validatePhoto } from "@/lib/validation/hike";

const item =
  "flex min-h-11 w-full cursor-pointer items-center gap-2.5 px-3.5 text-left text-sm transition-colors hover:bg-sand focus-visible:bg-sand focus-visible:outline-none";

/** "⋯" menu on your own banner: change or remove the banner photo. */
export function BannerControls({ hasCustom }: { hasCustom: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onFile(file: File | undefined) {
    setOpen(false);
    if (!file) return;
    const problem = validatePhoto({ name: "Photo", type: file.type, size: file.size });
    if (problem) return setError(problem);
    setError(null);
    start(async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setError("Your session has expired.");
      // Wide banner: 2400px on the long edge is plenty, and keeps it well under the 5 MB limit.
      const small = await downscaleImage(file, 2400, 0.85);
      const ext = small.type === "image/png" ? "png" : small.type === "image/webp" ? "webp" : "jpg";
      const path = `${auth.user.id}/banner-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, small, { contentType: small.type });
      const res = upErr ? { ok: false, error: "Upload failed. Try a smaller photo." } : await setBanner(path);
      if (!res.ok) return setError(res.error ?? "Couldn't save your banner.");
      router.refresh();
    });
  }

  function onRemove() {
    setOpen(false);
    setError(null);
    start(async () => {
      const res = await removeBanner();
      if (!res.ok) return setError(res.error ?? "Couldn't remove your banner.");
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="absolute top-2.5 right-2.5 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={pending ? "Updating banner" : "Banner options"}
        className="inline-flex size-10 items-center justify-center rounded-full bg-ink/45 text-stone-50 backdrop-blur-sm transition-colors hover:bg-ink/70 disabled:opacity-70"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <MoreHorizontal className="size-5" aria-hidden />}
      </button>

      {open && (
        <div role="menu" className="w-48 animate-rise overflow-hidden rounded-sm border border-ink/10 bg-stone-50 py-1 shadow-card">
          <button type="button" role="menuitem" className={`${item} text-ink`} onClick={() => fileRef.current?.click()} autoFocus>
            <Camera className="size-4 text-slate" aria-hidden />
            {hasCustom ? "Change banner" : "Add banner photo"}
          </button>
          {hasCustom && (
            <button type="button" role="menuitem" className={`${item} text-ember-600`} onClick={onRemove}>
              <Trash2 className="size-4" aria-hidden />
              Remove banner
            </button>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && (
        <p role="alert" className="max-w-64 rounded-sm bg-ink/80 px-2 py-1 text-right text-xs text-stone-50">
          {error}
        </p>
      )}
    </div>
  );
}
