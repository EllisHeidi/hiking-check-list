import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getHikeFormMountains } from "@/lib/queries/mountains";
import { Container, PageHeader } from "@/components/ui/Section";
import { HikeForm } from "@/components/hikes/HikeForm";

export const metadata: Metadata = { title: "Log a hike" };

export default async function NewHikePage({ searchParams }: PageProps<"/hikes/new">) {
  const user = await requireUser("/hikes/new");
  const [mountains, sp] = await Promise.all([getHikeFormMountains(user.id), searchParams]);
  const preselected = [...mountains.list, ...mountains.others].find((m) => m.slug === sp.mountain)?.id;

  return (
    <Container className="max-w-2xl pb-16">
      <PageHeader eyebrow="New entry" title="Log a hike" />
      <HikeForm
        mountains={mountains}
        defaultMountainId={preselected}
        today={new Date().toISOString().slice(0, 10)}
      />
    </Container>
  );
}
