import { Check, Circle } from "lucide-react";

export function StatusBadge({ conquered, onImage = false }: { conquered: boolean; onImage?: boolean }) {
  if (conquered) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xs bg-ember px-2 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-stone-50">
        <Check className="size-3" strokeWidth={3} aria-hidden />
        Conquered
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] ${
        onImage ? "border-stone-50/50 bg-ink/30 text-stone-50 backdrop-blur-sm" : "border-ink/25 text-slate"
      }`}
    >
      <Circle className="size-2.5" aria-hidden />
      Objective
    </span>
  );
}
