import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/Section";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const profile = await requireProfile("/profile/edit");
  return (
    <Container className="max-w-xl pb-16">
      <PageHeader eyebrow="Settings" title="Edit profile" back="/profile" />
      <ProfileEditForm profile={profile} />
    </Container>
  );
}
