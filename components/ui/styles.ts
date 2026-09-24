// Shared class strings. Kept out of "use client" modules so Server Components
// receive the actual strings (not client references).

export const inputClass =
  "block w-full rounded-sm border border-ink/20 bg-stone-50 px-3.5 py-3 text-base text-ink placeholder:text-mist " +
  "transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest aria-invalid:border-ember";

export const buttonClass = {
  primary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-forest px-6 font-mono text-xs font-medium uppercase tracking-[0.16em] text-stone-50 transition-colors hover:bg-forest-600 disabled:opacity-60",
  secondary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-ink/25 bg-transparent px-6 font-mono text-xs font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-stone-50 disabled:opacity-60",
  ember:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-ember px-6 font-mono text-xs font-medium uppercase tracking-[0.16em] text-stone-50 transition-colors hover:bg-ember-600 disabled:opacity-60",
  ghost:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-3 font-mono text-xs uppercase tracking-[0.16em] text-slate transition-colors hover:text-ink disabled:opacity-60",
};
