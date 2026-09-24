import type { Metadata } from "next";
import Link from "next/link";
import { GripVertical, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserList } from "@/lib/queries/mountains";
import { getHikesForUser } from "@/lib/queries/hikes";
import { conqueredMountainIds } from "@/lib/calculations/stats";
import { Container, EmptyState, PageHeader } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { ManageListRow } from "@/components/mountains/ManageListRow";
import { SortableList } from "@/components/mountains/SortableList";

export const metadata: Metadata = { title: "Edit your list" };

export default async function ManageListPage() {
  const user = await requireUser("/mountains/manage");
  const [list, hikes] = await Promise.all([getUserList(user.id), getHikesForUser(user.id)]);
  const conquered = conqueredMountainIds(hikes);
  const ladder = list.filter((m) => !m.is_final_goal);
  const finalGoal = list.find((m) => m.is_final_goal);

  return (
    <Container className="max-w-2xl pb-16">
      <PageHeader eyebrow={`${list.length} objectives`} title="Edit your list" back="/mountains">
        <div className="flex gap-2">
          <Link href="/mountains" className={buttonClass.secondary}>Done</Link>
          <Link href="/mountains/add" className={buttonClass.primary}>
            <Plus className="size-4" aria-hidden /> Add
          </Link>
        </div>
      </PageHeader>
      <p className="-mt-2 mb-6 text-sm text-slate">
        Drag the <GripVertical className="inline size-4 align-text-bottom" aria-label="grip" /> handle to reorder, flag your final
        objective, or remove mountains. Removing a mountain never deletes hikes you&apos;ve logged on it.
      </p>

      {list.length === 0 ? (
        <EmptyState
          title="Your list is empty"
          body="Add mountains from the catalogue, or create your own."
          action={<Link href="/mountains/add" className={buttonClass.primary}>Add mountains</Link>}
        />
      ) : (
        <>
          {/* Keyed on the server order so it resets after adds/removes/saves. */}
          <SortableList
            key={ladder.map((m) => m.id).join(",")}
            mountains={ladder}
            conqueredIds={[...conquered]}
          />

          <p className="eyebrow mt-8 mb-2">Final objective</p>
          {finalGoal ? (
            <ul className="border-b border-ink/10">
              <ManageListRow mountain={finalGoal} index={null} conquered={conquered.has(finalGoal.id)} />
            </ul>
          ) : (
            <p className="text-slate">None yet — tap the flag on any mountain above to set one.</p>
          )}
        </>
      )}
    </Container>
  );
}
