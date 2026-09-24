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
  if (!card) return { title: "Profile" };
  const title = `${displayName(card)} (@${card.username})`;
  const description = `Follow ${displayName(card)}'s road to the summit on Mountain Kill List.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(card.avatar_url ? { images: [{ url: card.avatar_url }] } : {}),
    },
  };
}

// Publicly reachable (shareable). RLS decides what a visitor can see.
export default async function ProfilePage({ params }: PageProps<"/profile/[username]">) {
  const { username } = await params;
  const user = await getCurrentUser();
  const view = await getProfileView(decodeURIComponent(username), user?.id ?? null);
  if (!view) notFound();
  return <ProfileView view={view} signedIn={Boolean(user)} back="/activity" />;
}
