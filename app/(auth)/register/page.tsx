import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <p className="eyebrow">Your road to Kilimanjaro</p>
      <h1 className="font-display mt-2 text-5xl">Start the list</h1>
      <p className="mt-2 mb-8 text-slate">Twenty objectives. One final summit.</p>
      <RegisterForm />
      <p className="mt-8 text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-forest underline underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  );
}
