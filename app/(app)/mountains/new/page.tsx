import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/Section";
import { MountainForm } from "@/components/mountains/MountainForm";

export const metadata: Metadata = { title: "New mountain" };

export default async function NewMountainPage() {
  await requireUser("/mountains/new");
  return (
    <Container className="max-w-2xl pb-16">
      <PageHeader eyebrow="Add to the catalogue" title="New mountain" />
      <p className="-mt-2 mb-8 text-slate">
        It goes on your list straight away, and other hikers can add it to theirs.
      </p>
      <MountainForm />
    </Container>
  );
}
