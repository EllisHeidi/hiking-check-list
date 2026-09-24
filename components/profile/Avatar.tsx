import Image from "next/image";

export function Avatar({
  profile,
  size = 40,
  className = "",
}: {
  profile: { username: string; display_name: string | null; avatar_url: string | null };
  size?: number;
  className?: string;
}) {
  const name = profile.display_name?.trim() || profile.username;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt={`${name}'s profile photo`}
        width={size}
        height={size}
        className={`shrink-0 rounded-full border border-ink/10 object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-forest font-display text-stone-50 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  );
}
