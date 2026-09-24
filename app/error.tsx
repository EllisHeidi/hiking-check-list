"use client";

import { buttonClass } from "@/components/ui/form";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="topo flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Weather turned</p>
      <h1 className="font-display mt-3 text-6xl sm:text-7xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-slate">
        {error.message.includes("Supabase") ? error.message : "We couldn't load this page. Try again in a moment."}
      </p>
      <button type="button" onClick={reset} className={`${buttonClass.primary} mt-8`}>
        Try again
      </button>
    </main>
  );
}
