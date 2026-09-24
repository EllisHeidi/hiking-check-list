import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, ListOrdered, Map as MapIcon, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserList } from "@/lib/queries/mountains";
import { getHikesForUser } from "@/lib/queries/hikes";
import { conqueredMountainIds, firstSummitDates, computeStats } from "@/lib/calculations/stats";
import { Container, EmptyState, PageHeader } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { MountainCard, type MountainCompletion } from "@/components/mountains/MountainCard";
import { FinalObjective } from "@/components/mountains/FinalObjective";
import { MountainMap } from "@/components/map/MountainMap";

export const metadata: Metadata = { title: "Mountains" };

export default async function MountainsPage({ searchParams }: PageProps<"/mountains">) {
  const user = await requireUser("/mountains");
  const [mountains, hikes, sp] = await Promise.all([getUserList(user.id), getHikesForUser(user.id), searchParams]);
  const view = sp.view === "map" ? "map" : "grid";

  const conquered = conqueredMountainIds(hikes);
  const firstDates = firstSummitDates(hikes);
  const completion = (id: string): MountainCompletion => ({
    firstSummit: firstDates.get(id) ?? null,
    timesClimbed: hikes.filter((h) => h.mountain_id === id && h.completed).length,
  });
  const order = new Map(mountains.map((m, i) => [m.id, i + 1]));

  const ladder = mountains.filter((m) => !m.is_final_goal);
  const finalGoal = mountains.find((m) => m.is_final_goal);
  const stats = computeStats(hikes, mountains);

  return (
    <>
      <Container>
        <PageHeader eyebrow={`${stats.mountainsConquered} of ${mountains.length} conquered`} title="Your list">
          <div className="flex flex-wrap gap-2">
          <Link href="/mountains/manage" className={buttonClass.secondary}>
            <ListOrdered className="size-4" aria-hidden /> Edit list
          </Link>
          <Link href="/mountains/add" className={buttonClass.primary}>
            <Plus className="size-4" aria-hidden /> Add mountains
          </Link>
          <div className="flex rounded-sm border border-ink/15 p-0.5" role="tablist" aria-label="View">
            {[
              { v: "grid", label: "Cards", icon: LayoutGrid },
              { v: "map", label: "Map", icon: MapIcon },
            ].map(({ v, label, icon: Icon }) => (
              <Link
                key={v}
                href={v === "grid" ? "/mountains" : "/mountains?view=map"}
                role="tab"
                aria-selected={view === v}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xs px-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] ${
                  view === v ? "bg-ink text-stone-50" : "text-slate hover:text-ink"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
          </div>
        </PageHeader>

        {mountains.length === 0 ? (
          <div className="pb-16">
            <EmptyState
              title="Your list is empty"
              body="Build your own kill list from the catalogue, or add a mountain that isn't there yet."
              action={<Link href="/mountains/add" className={buttonClass.primary}>Add mountains</Link>}
            />
          </div>
        ) : view === "map" ? (
          <div className="pb-16">
            <MountainMap mountains={mountains} conqueredIds={[...conquered]} />
          </div>
        ) : (
          <div className="grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ladder.map((m) => (
              <MountainCard key={m.id} mountain={m} completion={completion(m.id)} index={order.get(m.id)} />
            ))}
          </div>
        )}
      </Container>

      {finalGoal && view === "grid" && (
        <FinalObjective
          mountain={finalGoal}
          conquered={conquered.has(finalGoal.id)}
          highestSoFar={stats.highestSummit?.elevation ?? null}
        />
      )}
    </>
  );
}
