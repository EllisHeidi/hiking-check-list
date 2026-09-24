"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, Loader2, Minus, Plus } from "lucide-react";
import { addToList, removeFromList, setFinalGoal } from "@/lib/actions/mountains";
import { buttonClass } from "@/components/ui/styles";

/** Add/remove a mountain from your kill list, or make it your final objective. */
export function ListControls({
  mountainId,
  onList,
  isFinal,
  compact = false,
}: {
  mountainId: string;
  onList: boolean;
  isFinal: boolean;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      router.refresh();
    });

  const spinner = pending && <Loader2 className="size-4 animate-spin" aria-hidden />;

  if (compact) {
    return onList ? (
      <button type="button" disabled={pending} onClick={() => run(() => removeFromList(mountainId))} className={buttonClass.secondary}>
        {spinner || <Check className="size-4" aria-hidden />} On your list
      </button>
    ) : (
      <button type="button" disabled={pending} onClick={() => run(() => addToList(mountainId))} className={buttonClass.primary}>
        {spinner || <Plus className="size-4" aria-hidden />} Add to list
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {onList ? (
          <button type="button" disabled={pending} onClick={() => run(() => removeFromList(mountainId))} className={buttonClass.secondary}>
            {spinner || <Minus className="size-4" aria-hidden />} Remove from my list
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => run(() => addToList(mountainId))} className={buttonClass.primary}>
            {spinner || <Plus className="size-4" aria-hidden />} Add to my list
          </button>
        )}
        {isFinal ? (
          <span className="inline-flex min-h-12 items-center gap-2 px-2 font-mono text-xs uppercase tracking-[0.16em] text-ember">
            <Flag className="size-4" aria-hidden /> Your final objective
          </span>
        ) : (
          <button type="button" disabled={pending} onClick={() => run(() => setFinalGoal(mountainId))} className={buttonClass.ghost}>
            <Flag className="size-4" aria-hidden /> Make final objective
          </button>
        )}
      </div>
      {error && <p className="text-sm text-ember-600" role="alert">{error}</p>}
    </div>
  );
}
