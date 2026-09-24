import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMountainBySlug } from "@/lib/queries/mountains";
import { Container, PageHeader } from "@/components/ui/Section";
import { MountainForm } from "@/components/mountains/MountainForm";

export const metadata: Metadata = { title: "Edit mountain" };

export default async function EditMountainPage({ params }: PageProps<"/mountains/[slug]/edit">) {
  const { slug } = await params;
  const user = await requireUser(`/mountains/${slug}/edit`);
  const mountain = await getMountainBySlug(slug);
  // Only the hiker who added a mountain can edit it (RLS enforces this on save too).
  if (!mountain || mountain.created_by !== user.id) notFound();

  return (
    <Container className="max-w-2xl pb-16">
      <PageHeader eyebrow="Catalogue" title={`Edit ${mountain.name}`} back={`/mountains/${mountain.slug}`} />
      <MountainForm mountain={mountain} />
    </Container>
  );
}
