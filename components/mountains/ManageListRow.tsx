"use client";

import { useTransition, type CSSProperties, type ReactNode, type Ref } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flag, Loader2, X } from "lucide-react";
import { clearFinalGoal, removeFromList, setFinalGoal } from "@/lib/actions/mountains";
import { fmtInt } from "@/lib/format";
import type { Mountain } from "@/types";

const iconBtn =
  "inline-flex size-11 items-center justify-center rounded-sm text-slate transition-colors hover:bg-sand hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";

export function ManageListRow({
  mountain,
  index,
  conquered,
  handle,
  rowRef,
  style,
  dragging = false,
}: {
  mountain: Mountain;
  index: number | null;
  conquered: boolean;
  /** Drag handle (from the sortable list). */
  handle?: ReactNode;
  rowRef?: Ref<HTMLLIElement>;
  style?: CSSProperties;
  dragging?: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });
  const final = mountain.is_final_goal;

  return (
    <li
      ref={rowRef}
      style={style}
      className={`relative flex items-center gap-1 border-t border-ink/10 bg-paper py-2 sm:gap-2 ${pending ? "opacity-60" : ""} ${
        dragging ? "z-10 rounded-sm shadow-card ring-1 ring-forest/40" : ""
      }`}
    >
      {handle}
      <span className="w-7 shrink-0 text-right font-mono text-xs text-mist">
        {pending ? <Loader2 className="ml-auto size-4 animate-spin" aria-hidden /> : final ? "" : String(index).padStart(2, "0")}
      </span>
      <Link href={`/mountains/${mountain.slug}`} className="min-w-0 flex-1 py-2 pl-1 hover:text-forest">
        <span className="block truncate font-medium">
          {conquered && <span className="mr-1.5 text-ember">✓</span>}
          {mountain.name}
        </span>
        <span className="font-mono text-xs text-mist">{mountain.elevation ? `${fmtInt(mountain.elevation)} m` : "— m"}</span>
      </Link>

      {final ? (
        <button type="button" disabled={pending} onClick={() => run(clearFinalGoal)} className={`${iconBtn} text-ember`} aria-label="Unset final objective" title="Your final objective — click to unset">
          <Flag className="size-4 fill-current" />
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={() => run(() => setFinalGoal(mountain.id))} className={iconBtn} aria-label={`Make ${mountain.name} your final objective`} title="Make final objective">
          <Flag className="size-4" />
        </button>
      )}
      <button type="button" disabled={pending} onClick={() => run(() => removeFromList(mountain.id))} className={`${iconBtn} hover:text-ember-600`} aria-label={`Remove ${mountain.name} from your list`}>
        <X className="size-4" />
      </button>
    </li>
  );
}
