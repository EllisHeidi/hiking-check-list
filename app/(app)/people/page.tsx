import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { Lock, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { searchProfiles } from "@/lib/queries/profiles";
import { displayName } from "@/lib/format";
import { Container, PageHeader } from "@/components/ui/Section";
import { inputClass, buttonClass } from "@/components/ui/styles";
import { Avatar } from "@/components/profile/Avatar";
import { ProfileLinkField, ShareProfileButton } from "@/components/profile/ShareProfileButton";

export const metadata: Metadata = { title: "Find hikers" };

export default async function PeoplePage({ searchParams }: PageProps<"/people">) {
  const me = await requireProfile("/people");
  const sp = await searchParams;
  const raw = typeof sp.q === "string" ? sp.q.trim().slice(0, 200) : "";
  // A pasted profile link goes straight to that profile.
  const linked = raw.match(/\/profile\/([A-Za-z0-9_]{3,24})\/?(?:[?#].*)?$/);
  if (linked) redirect(`/profile/${linked[1].toLowerCase()}`);
  const q = raw.replace(/^@/, "").slice(0, 40);
  const results = q.length >= 2 ? (await searchProfiles(q)).filter((p) => p.id !== me.id) : [];

  return (
    <Container className="max-w-2xl pb-16">
      <PageHeader eyebrow="Social" title="Find hikers" />
      <Form action="/people" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search by username or name
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mist" aria-hidden />
          <input id="q" name="q" defaultValue={q} placeholder="Username, name or profile link" autoCapitalize="none" className={`${inputClass} pl-10`} />
        </div>
        <button type="submit" className={buttonClass.primary}>
          Search
        </button>
      </Form>

      {q.length >= 2 && (
        <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
          {results.length ? (
            results.map((p) => (
              <li key={p.id}>
                <Link href={`/profile/${p.username}`} className="flex min-h-16 items-center gap-4 py-3 hover:bg-sand/40">
                  <Avatar profile={p} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{displayName(p)}</p>
                    <p className="font-mono text-xs text-slate">@{p.username}</p>
                  </div>
                  {!p.is_public && <Lock className="size-4 text-mist" aria-label="Private profile" />}
                </Link>
              </li>
            ))
          ) : (
            <li className="py-6 text-slate">No hikers match “{q}”.</li>
          )}
        </ul>
      )}
      {q.length === 1 && <p className="mt-6 text-slate">Type at least 2 characters.</p>}

      <section className="mt-14 rounded-sm border border-ink/10 bg-stone-50 p-5 sm:p-6">
        <p className="eyebrow">Your profile link</p>
        <p className="mt-2 mb-4 text-slate">
          Send this to friends so they can find and follow you.
          {!me.is_public &&
            " Your profile is private, so they'll only see your name until you make it public in Edit profile."}
        </p>
        <ProfileLinkField username={me.username} />
        <div className="mt-3 sm:hidden">
          <ShareProfileButton username={me.username} name={me.display_name || me.username} isSelf />
        </div>
      </section>
    </Container>
  );
}
