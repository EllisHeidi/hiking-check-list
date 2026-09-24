import Image from "next/image";
import Link from "next/link";
import { InstallAppButton } from "@/components/InstallAppButton";

const HERO =
  "https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?auto=format&fit=crop&w=1600&q=80";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <Image
          src={HERO}
          alt="Sunrise from the summit slopes of Kilimanjaro, with Mawenzi peak in silhouette"
          fill
          priority
          sizes="55vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/30" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-stone-50">
          <p className="eyebrow text-stone-50/70">Cape Town → Western Cape → 5,895 m</p>
          <p className="font-display mt-3 max-w-md text-6xl">Conquer mountains. Build your elevation.</p>
        </div>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-10">
        <Link href="/login" className="font-display flex w-fit items-center gap-2.5 text-2xl tracking-wide">
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="size-9 rounded-sm" priority />
          Mountain Kill List
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
        <div className="mx-auto w-full max-w-sm">
          <InstallAppButton className="w-full" />
        </div>
      </main>
    </div>
  );
}
