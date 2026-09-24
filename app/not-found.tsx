import Link from "next/link";
import { buttonClass } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <main className="topo flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">404 · Off route</p>
      <h1 className="font-display mt-3 text-7xl sm:text-8xl">Wrong ridge</h1>
      <p className="mt-3 max-w-sm text-slate">This page doesn&apos;t exist, or it&apos;s on a private profile.</p>
      <Link href="/" className={`${buttonClass.primary} mt-8`}>
        Back to base camp
      </Link>
    </main>
  );
}
