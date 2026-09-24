import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, LogOut, Search, Trophy } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getProfileView } from "@/lib/queries/profile-view";
import { signOut } from "@/lib/actions/auth";
import { Container } from "@/components/ui/Section";
import { buttonClass } from "@/components/ui/styles";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = { title: "Profile" };

export default async function MyProfilePage() {
  const me = await requireProfile("/profile");
  const view = await getProfileView(me.username, me.id);
  if (!view) return null;

  return (
    <>
      <ProfileView view={view} signedIn />
      <Container className="pb-16">
        <div className="grid grid-cols-2 gap-2 border-t border-ink/15 pt-6 sm:grid-cols-4">
          <Link href="/achievements" className={buttonClass.secondary}>
            <Trophy className="size-4" aria-hidden /> Achievements
          </Link>
          <Link href="/stats" className={buttonClass.secondary}>
            <BarChart3 className="size-4" aria-hidden /> Statistics
          </Link>
          <Link href="/people" className={buttonClass.secondary}>
            <Search className="size-4" aria-hidden /> Find hikers
          </Link>
          <form action={signOut}>
            <button type="submit" className={`${buttonClass.ghost} min-h-12 w-full`}>
              <LogOut className="size-4" aria-hidden /> Log out
            </button>
          </form>
        </div>
      </Container>
    </>
  );
}
