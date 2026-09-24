import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { Plus, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserList, searchCatalogue } from "@/lib/queries/mountains";
import { fmtInt } from "@/lib/format";
import { Container, PageHeader } from "@/components/ui/Section";
import { buttonClass, inputClass } from "@/components/ui/styles";
import { ListControls } from "@/components/mountains/ListControls";

export const metadata: Metadata = { title: "Add mountains" };

export default async function AddMountainsPage({ searchParams }: PageProps<"/mountains/add">) {
  const user = await requireUser("/mountains/add");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const [results, list] = await Promise.all([searchCatalogue(q), getUserList(user.id)]);
  const onList = new Set(list.map((m) => m.id));

  return (
    <Container className="max-w-3xl pb-16">
      <PageHeader eyebrow="The catalogue" title="Add mountains">
        <Link href="/mountains/new" className={buttonClass.primary}>
          <Plus className="size-4" aria-hidden /> New mountain
        </Link>
      </PageHeader>

      <Form action="/mountains/add" className="flex gap-2">
        <label htmlFor="q" className="sr-only">Search mountains</label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mist" aria-hidden />
          <input id="q" name="q" defaultValue={q} placeholder="Name, region or country" className={`${inputClass} pl-10`} />
        </div>
        <button type="submit" className={buttonClass.secondary}>Search</button>
      </Form>

      <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
        {results.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
            <Link href={`/mountains/${m.slug}`} className="min-w-0 flex-1 hover:text-forest">
              <p className="font-display truncate text-2xl">{m.name}</p>
              <p className="font-mono text-xs text-slate">
                {m.elevation ? `${fmtInt(m.elevation)} m` : "— m"}
                {[m.region, m.country].filter(Boolean).length > 0 && ` · ${[m.region, m.country].filter(Boolean).join(", ")}`}
              </p>
            </Link>
            <ListControls mountainId={m.id} onList={onList.has(m.id)} isFinal={false} compact />
          </li>
        ))}
        {results.length === 0 && (
          <li className="py-8 text-slate">
            No mountains match “{q}”.{" "}
            <Link href="/mountains/new" className="text-forest underline underline-offset-4">Add it to the catalogue</Link>.
          </li>
        )}
      </ul>
    </Container>
  );
}
