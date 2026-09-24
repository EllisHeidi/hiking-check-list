"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteHike } from "@/lib/actions/hikes";

export function DeleteHikeButton({
  hikeId,
  mountainName,
  redirectTo,
}: {
  hikeId: string;
  mountainName: string;
  redirectTo?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const base =
    "inline-flex min-h-11 items-center gap-2 px-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors";

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`${base} text-slate hover:text-ember-600`}>
        <Trash2 className="size-4" aria-hidden /> Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={`Delete ${mountainName} hike?`}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await deleteHike(hikeId);
            if (!res.ok) return setError(true);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          })
        }
        className={`${base} bg-ember text-stone-50 hover:bg-ember-600`}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
        {error ? "Retry" : "Confirm"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className={`${base} text-slate hover:text-ink`}>
        Cancel
      </button>
    </div>
  );
}
