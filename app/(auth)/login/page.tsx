import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <>
      <p className="eyebrow">Welcome back</p>
      <h1 className="font-display mt-2 text-5xl">Log in</h1>
      <p className="mt-2 mb-8 text-slate">Pick up the trail where you left it.</p>
      <LoginForm next={next} linkError={sp.error === "link"} />
      <p className="mt-8 text-sm text-slate">
        New here?{" "}
        <Link href="/register" className="font-medium text-forest underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </>
  );
}
