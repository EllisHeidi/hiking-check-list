import { DesktopNav, MobileNav } from "@/components/navigation/Nav";
import { getCurrentProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <>
      <DesktopNav user={profile} />
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      {profile && <MobileNav />}
    </>
  );
}
