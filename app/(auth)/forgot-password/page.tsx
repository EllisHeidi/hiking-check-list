import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-5xl">Reset password</h1>
      <p className="mt-2 mb-8 text-slate">We&apos;ll email you a link to set a new one.</p>
      <ForgotPasswordForm />
      <p className="mt-8 text-sm text-slate">
        <Link href="/login" className="font-medium text-forest underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </>
  );
}
