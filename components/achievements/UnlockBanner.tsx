"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Achievement } from "@/types";
import { AchievementIcon } from "./AchievementIcon";

/** Shown once after logging a hike that unlocked achievements. */
export function UnlockBanner({ achievements }: { achievements: Pick<Achievement, "slug" | "name" | "description" | "icon">[] }) {
  const [open, setOpen] = useState(true);
  if (!open || achievements.length === 0) return null;

  return (
    <div role="status" className="fixed inset-x-3 top-20 z-50 mx-auto max-w-md space-y-2 md:top-24">
      {achievements.map((a, i) => (
        <div
          key={a.slug}
          className="flex animate-unlock items-center gap-4 rounded-sm border border-ember/40 bg-ink p-4 text-stone-50 shadow-2xl"
          style={{ animationDelay: `${i * 180}ms` }}
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ember">
            <AchievementIcon name={a.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ember">Achievement unlocked</p>
            <p className="font-display text-2xl">{a.name}</p>
            {a.description && <p className="text-sm text-stone-50/70">{a.description}</p>}
          </div>
          {i === 0 && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-1 inline-flex size-11 items-center justify-center self-start text-stone-50/60 hover:text-stone-50"
              aria-label="Dismiss"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
