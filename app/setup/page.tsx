import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buttonClass } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Setup" };

const keySteps = [
  {
    title: "Create a Supabase project",
    body: "supabase.com → New project. Pick the region closest to you.",
  },
  {
    title: "Run the SQL",
    body: "Run npm run db:bundle, then paste supabase/setup.sql into Supabase → SQL Editor and click Run.",
  },
  {
    title: "Add your keys",
    body: "Copy .env.example to .env.local and fill in the Project URL and publishable (anon) key from Project Settings → API Keys.",
  },
  {
    title: "Restart the dev server",
    body: "Stop npm run dev and start it again so Next.js picks up .env.local.",
  },
];

const databaseSteps = [
  {
    title: "Open the SQL Editor",
    body: "Supabase dashboard → SQL Editor → New query.",
  },
  {
    title: "Run setup.sql",
    body: "Paste the whole of supabase/setup.sql (generate it with npm run db:bundle) and click Run. It creates the tables, security rules, storage buckets, mountains and achievements — and a profile for any account you've already made.",
  },
  {
    title: "Come back",
    body: "Reload this app. You'll land on your dashboard.",
  },
];

export default async function SetupPage({ searchParams }: PageProps<"/setup">) {
  const { reason } = await searchParams;
  const needsDatabase = isSupabaseConfigured() && reason === "database";
  if (isSupabaseConfigured() && !needsDatabase) redirect("/");

  const steps = needsDatabase ? databaseSteps : keySteps;

  return (
    <main className="topo min-h-dvh px-4 py-12 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Base camp · Setup required</p>
        <h1 className="font-display mt-3 text-6xl sm:text-7xl">
          Mountain
          <br />
          Kill List
        </h1>
        <p className="mt-4 text-lg text-slate">
          {needsDatabase
            ? "You're signed in, but the database hasn't been set up yet. Three steps to the trailhead:"
            : "The app is running, but it isn't connected to a database yet. Four steps to the trailhead:"}
        </p>

        <ol className="mt-10 border-t border-ink/15">
          {steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[3rem_1fr] gap-2 border-b border-ink/15 py-6">
              <span className="font-mono text-sm text-ember">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="font-display text-2xl">{s.title}</h2>
                <p className="mt-1 text-slate">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {needsDatabase ? (
          <Link href="/" className={`${buttonClass.primary} mt-8`}>
            I&apos;ve run it — try again
          </Link>
        ) : (
          <pre className="mt-8 overflow-x-auto rounded-sm bg-ink p-4 font-mono text-sm text-stone-50">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...`}
          </pre>
        )}
        <p className="mt-6 text-sm text-mist">Full instructions are in README.md.</p>
      </div>
    </main>
  );
}
