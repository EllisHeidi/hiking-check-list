"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS, isActive } from "./nav-items";
import { Avatar } from "@/components/profile/Avatar";

type NavUser = { username: string; display_name: string | null; avatar_url: string | null } | null;

export function DesktopNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="font-display shrink-0 text-2xl tracking-wide">
          Mountain Kill List
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-3 py-5 font-mono text-[0.7rem] uppercase tracking-[0.16em] transition-colors ${
                  active ? "text-ink" : "text-slate hover:text-ink"
                }`}
              >
                {item.desktopLabel}
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-ember" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/hikes/new"
                className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-forest px-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-stone-50 transition-colors hover:bg-forest-600 sm:px-4"
              >
                <Plus className="size-4" aria-hidden />
                <span className="hidden sm:inline">Log hike</span>
                <span className="sr-only sm:hidden">Log a hike</span>
              </Link>
              <Link href="/profile" className="hidden md:block" aria-label="Your profile">
                <Avatar profile={user} size={36} />
              </Link>
            </>
          ) : (
            <Link href="/login" className="font-mono text-xs uppercase tracking-[0.16em] text-forest">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-stone-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-forest" : "text-mist"
                }`}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
