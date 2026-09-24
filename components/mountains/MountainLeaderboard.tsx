import Link from "next/link";
import { Timer, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/queries/leaderboard";
import { displayName, fmtDate, fmtDuration, fmtKm } from "@/lib/format";
import { Avatar } from "@/components/profile/Avatar";

const TOP = 10;

/** Per-mountain rankings: most summits and fastest logged time. */
export function MountainLeaderboard({
  mostSummits,
  fastest,
  viewerId,
  followingIds,
  mountainSlug,
}: {
  mostSummits: LeaderboardEntry[];
  fastest: LeaderboardEntry[];
  viewerId: string;
  followingIds: string[];
  mountainSlug: string;
}) {
  if (mostSummits.length === 0) {
    return (
      <div className="topo rounded-sm border border-dashed border-ink/20 px-6 py-10 text-center">
        <Trophy className="mx-auto size-6 text-mist" aria-hidden />
        <p className="font-display mt-2 text-2xl">No summits yet</p>
        <p className="mt-1 text-slate">Be the first to top the board.</p>
        <Link href={`/hikes/new?mountain=${mountainSlug}`} className="mt-4 inline-block text-sm text-forest underline underline-offset-4">
          Log a hike here
        </Link>
      </div>
    );
  }

  const following = new Set(followingIds);
  const myRank = mostSummits.findIndex((e) => e.user.id === viewerId) + 1;

  return (
    <div className="space-y-8">
      {myRank > 0 && (
        <p className="text-sm text-slate">
          You&apos;re <strong className="text-ink">#{myRank}</strong> of {mostSummits.length} for summits here.
        </p>
      )}
      <div className="grid gap-8 md:grid-cols-2">
        <Board
          title="Most summits"
          icon={<Trophy className="size-4" aria-hidden />}
          entries={mostSummits}
          viewerId={viewerId}
          following={following}
          stat={(e) => (
            <>
              <span className="font-display text-2xl tabular-nums">{e.summits}×</span>
              <span className="block text-[0.65rem] text-mist">since {fmtDate(e.firstSummit, { day: undefined })}</span>
            </>
          )}
        />
        <Board
          title="Fastest time"
          icon={<Timer className="size-4" aria-hidden />}
          entries={fastest}
          viewerId={viewerId}
          following={following}
          empty="No moving times logged yet."
          stat={(e) => (
            <>
              <span className="font-display text-2xl tabular-nums">{fmtDuration(e.fastest!.minutes)}</span>
              <span className="block text-[0.65rem] text-mist">{fmtKm(e.fastest!.distanceKm)}</span>
            </>
          )}
        />
      </div>
      <p className="text-xs text-mist">
        Public profiles only. Fastest time is moving time as logged — routes vary, so the distance is shown too.
      </p>
    </div>
  );
}

function Board({
  title,
  icon,
  entries,
  viewerId,
  following,
  stat,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  entries: LeaderboardEntry[];
  viewerId: string;
  following: Set<string>;
  stat: (e: LeaderboardEntry) => React.ReactNode;
  empty?: string;
}) {
  const top = entries.slice(0, TOP);
  const meIndex = entries.findIndex((e) => e.user.id === viewerId);
  // Always show your own row, even if you're outside the top 10.
  const rows = meIndex >= TOP ? [...top, entries[meIndex]] : top;

  return (
    <section>
      <p className="eyebrow mb-2 flex items-center gap-2 text-charcoal">
        {icon} {title}
      </p>
      {rows.length === 0 ? (
        <p className="border-y border-ink/10 py-4 text-sm text-slate">{empty}</p>
      ) : (
        <ol className="divide-y divide-ink/10 border-y border-ink/10">
          {rows.map((e) => {
            const rank = entries.indexOf(e) + 1;
            const me = e.user.id === viewerId;
            return (
              <li key={e.user.id} className={`flex items-center gap-3 py-2.5 ${me ? "-mx-2 rounded-sm bg-ember/10 px-2" : ""}`}>
                <span
                  className={`w-6 shrink-0 text-center font-mono text-sm ${rank === 1 ? "font-medium text-ember" : "text-mist"}`}
                >
                  {rank}
                </span>
                <Link href={`/profile/${e.user.username}`} className="flex min-w-0 flex-1 items-center gap-2.5 hover:text-forest">
                  <Avatar profile={e.user} size={32} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {me ? "You" : displayName(e.user)}
                    </span>
                    <span className="block truncate font-mono text-[0.65rem] text-mist">
                      @{e.user.username}
                      {!me && following.has(e.user.id) && <span className="ml-1.5 text-forest">· following</span>}
                    </span>
                  </span>
                </Link>
                <span className="shrink-0 text-right leading-tight">{stat(e)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
