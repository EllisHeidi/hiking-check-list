import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rule mb-6 flex items-end justify-between gap-4 pt-5">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="font-display mt-1 text-3xl sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-slate hover:text-ink"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function StatBlock({ value, label, accent = false }: { value: ReactNode; label: string; accent?: boolean }) {
  return (
    <div className="border-l border-ink/15 pl-4">
      <p className={`font-display text-4xl tabular-nums sm:text-5xl ${accent ? "text-ember" : ""}`}>{value}</p>
      <p className="eyebrow mt-2">{label}</p>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="topo rounded-sm border border-dashed border-ink/20 px-6 py-12 text-center">
      <p className="font-display text-3xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-slate">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="pt-8 pb-6 sm:pt-12">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl sm:text-7xl">{title}</h1>
        {children}
      </div>
    </header>
  );
}
