import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfileView } from "@/lib/queries/profile-view";
import { getProfileCard } from "@/lib/queries/profiles";
import { displayName } from "@/lib/format";
import { ProfileView } from "@/components/profile/ProfileView";

export async function generateMetadata({ params }: PageProps<"/profile/[username]">): Promise<Metadata> {
  const { username } = await params;
  const card = await getProfileCard(username);
  return { title: card ? `${displayName(card)} (@${card.username})` : "Profile" };
}

// Publicly reachable (shareable). RLS decides what a visitor can see.
export default async function ProfilePage({ params }: PageProps<"/profile/[username]">) {
  const { username } = await params;
  const user = await getCurrentUser();
  const view = await getProfileView(decodeURIComponent(username), user?.id ?? null);
  if (!view) notFound();
  return <ProfileView view={view} signedIn={Boolean(user)} />;
}
