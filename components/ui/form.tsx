"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { buttonClass, inputClass } from "./styles";

export { buttonClass, inputClass };

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
