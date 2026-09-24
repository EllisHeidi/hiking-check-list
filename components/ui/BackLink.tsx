"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { onImageButtonClass } from "./styles";

// Same language as the outlined buttons, just compact.
const defaultClass =
  "inline-flex min-h-11 items-center gap-2 rounded-sm border border-ink/25 bg-transparent px-3.5 font-mono text-xs font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-stone-50";

/**
 * "← Back": goes back in history when you arrived from within the app,
 * otherwise (opened directly / from a shared link) goes to `fallback`.
 */
export function BackLink({
  fallback,
  label = "Back",
  variant = "default",
  className = "",
}: {
  fallback: string;
  label?: string;
  /** "onImage" for use on top of hero photos. */
  variant?: "default" | "onImage";
  className?: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      onClick={(e) => {
        const cameFromApp = typeof document !== "undefined" && document.referrer.startsWith(window.location.origin);
        if (cameFromApp && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className={`${variant === "onImage" ? onImageButtonClass : defaultClass} ${className}`}
    >
      <ArrowLeft className="size-4" strokeWidth={2} aria-hidden /> {label}
    </Link>
  );
}
