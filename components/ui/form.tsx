"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "block w-full rounded-sm border border-ink/20 bg-stone-50 px-3.5 py-3 text-base text-ink placeholder:text-mist " +
  "transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest aria-invalid:border-ember";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="eyebrow mb-2 block text-charcoal">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-ember-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-mist">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

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

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof buttonClass;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${buttonClass[variant]} ${className}`}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? pendingLabel ?? children : children}
    </button>
  );
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`border-l-2 py-2 pl-3 text-sm ${error ? "border-ember text-ember-600" : "border-forest text-forest"}`}
    >
      {error ?? message}
    </p>
  );
}
