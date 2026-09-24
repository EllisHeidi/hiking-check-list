import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getFollowingIds } from "@/lib/queries/profiles";
import { getActivityFor } from "@/lib/queries/activity";
import { Container, EmptyState, PageHeader } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { ActivityRow } from "@/components/activity/ActivityItem";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({ searchParams }: PageProps<"/activity">) {
  const user = await requireUser("/activity");
  const sp = await searchParams;
  const includeMine = sp.mine !== "0";
  const following = await getFollowingIds(user.id);
  const feed = await getActivityFor(includeMine ? [user.id, ...following] : following, 50);

  return (
    <Container className="max-w-3xl pb-16">
      <PageHeader eyebrow={`Following ${following.length}`} title="Activity">
        <Link href="/people" className={buttonClass.secondary}>
          <Search className="size-4" aria-hidden /> Find hikers
        </Link>
      </PageHeader>

      <nav aria-label="Filter" className="flex gap-1 border-b border-ink/10">
        {[
          { href: "/activity", label: "You & following", active: includeMine },
          { href: "/activity?mine=0", label: "Following only", active: !includeMine },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`relative min-h-11 px-3 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] ${
              t.active ? "text-ink" : "text-slate hover:text-ink"
            }`}
          >
            {t.label}
            {t.active && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-ember" />}
          </Link>
        ))}
      </nav>

      {feed.length ? (
        <div className="divide-y divide-ink/10">
          {feed.map((item) => (
            <ActivityRow key={item.id} item={item} currentUserId={user.id} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Quiet on the mountain"
            body={following.length ? "No activity from the people you follow yet." : "Follow other hikers to see their summits here."}
            action={<Link href="/people" className={buttonClass.primary}>Find hikers</Link>}
          />
        </div>
      )}
    </Container>
  );
}
