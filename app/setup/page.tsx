import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Setup" };

const steps = [
  {
    title: "Create a Supabase project",
    body: "supabase.com → New project. Pick the region closest to you.",
  },
  {
    title: "Run the SQL",
    body: "SQL Editor → run each file in supabase/migrations in order, then supabase/seed/01_mountains.sql and 02_achievements.sql. Or use the Supabase CLI: supabase link && supabase db push.",
  },
  {
    title: "Add your keys",
    body: "Copy .env.example to .env.local and fill in the Project URL, anon key and service-role key from Project Settings → API.",
  },
  {
    title: "Restart the dev server",
    body: "Stop npm run dev and start it again so Next.js picks up .env.local.",
  },
];

export default function SetupPage() {
  if (isSupabaseConfigured()) redirect("/");

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
          The app is running, but it isn&apos;t connected to a database yet. Four steps to the trailhead:
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

        <pre className="mt-8 overflow-x-auto rounded-sm bg-ink p-4 font-mono text-sm text-stone-50">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...`}
        </pre>
        <p className="mt-6 text-sm text-mist">Full instructions are in README.md.</p>
      </div>
    </main>
  );
}
