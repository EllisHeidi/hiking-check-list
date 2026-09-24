import { Activity, Footprints, Home, Mountain, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Home", desktopLabel: "Home", icon: Home },
  { href: "/mountains", label: "Mountains", desktopLabel: "Mountains", icon: Mountain },
  { href: "/hikes", label: "Hikes", desktopLabel: "My Hikes", icon: Footprints },
  { href: "/activity", label: "Activity", desktopLabel: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", desktopLabel: "Profile", icon: User },
] as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/profile") return pathname === "/profile" || pathname.startsWith("/profile/") || pathname === "/achievements";
  if (href === "/hikes") return pathname.startsWith("/hikes") || pathname === "/stats";
  return pathname === href || pathname.startsWith(`${href}/`);
}
