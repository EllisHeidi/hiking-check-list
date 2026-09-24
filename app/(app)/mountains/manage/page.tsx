import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserList } from "@/lib/queries/mountains";
import { getHikesForUser } from "@/lib/queries/hikes";
import { conqueredMountainIds } from "@/lib/calculations/stats";
import { Container, EmptyState, PageHeader } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { ManageListRow } from "@/components/mountains/ManageListRow";

export const metadata: Metadata = { title: "Edit your list" };

export default async function ManageListPage() {
  const user = await requireUser("/mountains/manage");
  const [list, hikes] = await Promise.all([getUserList(user.id), getHikesForUser(user.id)]);
  const conquered = conqueredMountainIds(hikes);
  const ladder = list.filter((m) => !m.is_final_goal);
  const finalGoal = list.find((m) => m.is_final_goal);

  return (
    <Container className="max-w-2xl pb-16">
      <PageHeader eyebrow={`${list.length} objectives`} title="Edit your list">
        <div className="flex gap-2">
          <Link href="/mountains" className={buttonClass.secondary}>Done</Link>
          <Link href="/mountains/add" className={buttonClass.primary}>
            <Plus className="size-4" aria-hidden /> Add
          </Link>
        </div>
      </PageHeader>
      <p className="-mt-2 mb-6 text-sm text-slate">
        Reorder with the arrows, flag your final objective, or remove mountains. Removing a mountain never deletes hikes you&apos;ve logged on it.
      </p>

      {list.length === 0 ? (
        <EmptyState
          title="Your list is empty"
          body="Add mountains from the catalogue, or create your own."
          action={<Link href="/mountains/add" className={buttonClass.primary}>Add mountains</Link>}
        />
      ) : (
        <>
          <ol className="divide-y divide-ink/10 border-y border-ink/10">
            {ladder.map((m, i) => (
              <ManageListRow
                key={m.id}
                mountain={m}
                index={i + 1}
                isFirst={i === 0}
                isLast={i === ladder.length - 1}
                conquered={conquered.has(m.id)}
              />
            ))}
          </ol>

          <p className="eyebrow mt-10 mb-2">Final objective</p>
          {finalGoal ? (
            <ul className="border-y border-ink/10">
              <ManageListRow mountain={finalGoal} index={null} isFirst isLast conquered={conquered.has(finalGoal.id)} />
            </ul>
          ) : (
            <p className="text-slate">None yet — tap the flag on any mountain above to set one.</p>
          )}
        </>
      )}
    </Container>
  );
}
