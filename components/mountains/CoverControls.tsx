"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setMountainCover } from "@/lib/actions/mountains";
import { generateMountainCover } from "@/lib/actions/ai";
import { downscaleImage, extensionFor } from "@/lib/images";
import { validatePhoto } from "@/lib/validation/hike";

/** Upload a cover photo, or generate one with AI, for a mountain that needs one. */
export function CoverControls({ mountainId, aiEnabled, replacing }: { mountainId: string; aiEnabled: boolean; replacing: boolean }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"upload" | "ai" | null>(null);
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
      const small = await downscaleImage(file, 2400, 0.85);
      const path = `${auth.user.id}/${crypto.randomUUID()}.${extensionFor(small.type)}`;
      const { error: upErr } = await supabase.storage.from("mountain-images").upload(path, small, { contentType: small.type });
      const res = upErr ? { ok: false as const, error: "Upload failed. Try again." } : await setMountainCover(mountainId, path);
      setBusy(null);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  function onGenerate() {
    setError(null);
    setBusy("ai");
    start(async () => {
      const res = await generateMountainCover(mountainId);
      setBusy(null);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  const btn =
    "inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors disabled:opacity-60";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <label className={`${btn} cursor-pointer border-stone-50/40 bg-ink/40 text-stone-50 backdrop-blur-sm hover:border-stone-50`}>
          {busy === "upload" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
          {busy === "upload" ? "Uploading…" : replacing ? "Replace photo" : "Add cover photo"}
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
        {aiEnabled && (
          <button type="button" onClick={onGenerate} disabled={pending} className={`${btn} border-stone-50/40 bg-ink/40 text-stone-50 backdrop-blur-sm hover:border-stone-50`}>
            {busy === "ai" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {busy === "ai" ? "Generating… (up to a minute)" : "Generate with AI"}
          </button>
        )}
      </div>
      {error && (
        <p className="w-fit rounded-xs bg-ink/70 px-2 py-1 text-sm text-stone-50" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
