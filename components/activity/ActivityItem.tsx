import Image from "next/image";
import Link from "next/link";
import type { ActivityItem as Item } from "@/types";
import { displayName, fmtDate, fmtDuration, fmtInt, fmtKm, timeAgo } from "@/lib/format";
import { Avatar } from "@/components/profile/Avatar";
import { AchievementIcon } from "@/components/achievements/AchievementIcon";

function headline(item: Item, you: boolean) {
  const who = you ? "You" : displayName(item.user);
  const mountain = item.hike?.mountain;
  switch (item.activity_type) {
    case "mountain_conquered":
      return (
        <>
          <strong>{who}</strong> conquered{" "}
          {mountain ? <Link href={`/mountains/${mountain.slug}`} className="font-semibold text-ember hover:underline">{mountain.name}</Link> : "a mountain"}
        </>
      );
    case "hike_completed":
      return (
        <>
          <strong>{who}</strong> completed a {item.hike?.distance_km ? fmtKm(item.hike.distance_km) : ""} hike
          {mountain && (
            <>
              {" "}on <Link href={`/mountains/${mountain.slug}`} className="font-semibold hover:underline">{mountain.name}</Link>
            </>
          )}
        </>
      );
    case "achievement_earned":
      return (
        <>
          <strong>{who}</strong> earned <span className="font-semibold text-forest">{item.achievement?.name ?? "an achievement"}</span>
        </>
      );
  }
}

export function ActivityRow({ item, currentUserId, compact = false }: { item: Item; currentUserId?: string; compact?: boolean }) {
  const you = item.user.id === currentUserId;
  const hike = item.hike;
  return (
    <article className="flex gap-3 py-4 sm:gap-4">
      <Link href={`/profile/${item.user.username}`} className="shrink-0" aria-label={displayName(item.user)}>
        <Avatar profile={item.user} size={compact ? 36 : 44} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="leading-snug">{headline(item, you)}</p>
        <p className="mt-0.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-mist">
          @{item.user.username} · <time dateTime={item.created_at}>{timeAgo(item.created_at)}</time>
        </p>

        {!compact && hike && (
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
            {hike.mountain?.elevation != null && <Stat label="Summit" value={`${fmtInt(hike.mountain.elevation)} m`} />}
            <Stat label="Distance" value={fmtKm(hike.distance_km)} />
            <Stat label="Elevation" value={hike.elevation_gain_m != null ? `+${fmtInt(hike.elevation_gain_m)} m` : "—"} />
            <Stat label="Time" value={fmtDuration(hike.moving_time_minutes)} />
            <Stat label="Date" value={fmtDate(hike.completion_date)} />
          </dl>
        )}

        {!compact && hike && hike.photos.some((p) => p.url) && (
          <div className="mt-3 grid max-w-md grid-cols-3 gap-1">
            {hike.photos.filter((p) => p.url).map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-xs bg-sand">
                <Image src={p.url!} alt={p.caption ?? `Photo from ${hike.mountain?.name ?? "the hike"}`} fill sizes="150px" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
      {item.activity_type === "achievement_earned" && item.achievement && (
        <AchievementIcon name={item.achievement.icon} className="size-6 shrink-0 text-forest" />
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-mist">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
