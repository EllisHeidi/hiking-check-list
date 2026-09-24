import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getHikesForUser, type HikeSort } from "@/lib/queries/hikes";
import { getUserList } from "@/lib/queries/mountains";
import { computeStats } from "@/lib/calculations/stats";
import { fmtDec, fmtInt } from "@/lib/format";
import { Container, EmptyState, PageHeader } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { HikeRow } from "@/components/hikes/HikeRow";

export const metadata: Metadata = { title: "My hikes" };

const SORTS: { value: HikeSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "longest", label: "Longest" },
  { value: "elevation", label: "Most elevation" },
];

export default async function HikesPage({ searchParams }: PageProps<"/hikes">) {
  const user = await requireUser("/hikes");
  const sp = await searchParams;
  const sort = SORTS.some((s) => s.value === sp.sort) ? (sp.sort as HikeSort) : "newest";
  const [hikes, mountains] = await Promise.all([
    getHikesForUser(user.id, { sort, withPhotos: true }),
    getUserList(user.id),
  ]);
  const stats = computeStats(hikes, mountains);

  return (
    <Container className="pb-16">
      <PageHeader eyebrow="Logbook" title="My hikes">
        <div className="flex gap-2">
          <Link href="/stats" className={buttonClass.secondary}>
            <BarChart3 className="size-4" aria-hidden /> Stats
          </Link>
          <Link href="/hikes/new" className={buttonClass.primary}>
            <Plus className="size-4" aria-hidden /> Log hike
          </Link>
        </div>
      </PageHeader>

      {hikes.length > 0 && (
        <p className="font-mono text-sm text-slate">
          {stats.totalHikes} hikes · {fmtDec(stats.totalDistanceKm)} km · +{fmtInt(stats.totalElevationM)} m
        </p>
      )}

      <nav aria-label="Sort hikes" className="mt-6 flex gap-1 overflow-x-auto border-b border-ink/10 no-scrollbar">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={s.value === "newest" ? "/hikes" : `/hikes?sort=${s.value}`}
            aria-current={sort === s.value ? "page" : undefined}
            className={`relative min-h-11 shrink-0 px-3 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] ${
              sort === s.value ? "text-ink" : "text-slate hover:text-ink"
            }`}
          >
            {s.label}
            {sort === s.value && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-ember" />}
          </Link>
        ))}
      </nav>

      {hikes.length ? (
        <div className="divide-y divide-ink/10">
          {hikes.map((h) => (
            <HikeRow key={h.id} hike={h} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="The logbook is empty"
            body="Every summit starts with the first entry. Log a hike to start building distance and elevation."
            action={<Link href="/hikes/new" className={buttonClass.primary}>Log your first hike</Link>}
          />
        </div>
      )}
    </Container>
  );
}
