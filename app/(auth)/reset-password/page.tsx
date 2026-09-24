import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Set new password" };

export default async function ResetPasswordPage() {
  // The recovery link signs the user in via /auth/confirm before landing here.
  const user = await getCurrentUser();
  return (
    <>
      <h1 className="font-display text-5xl">New password</h1>
      {user ? (
        <>
          <p className="mt-2 mb-8 text-slate">Choose a new password for {user.email}.</p>
          <ResetPasswordForm />
        </>
      ) : (
        <p className="mt-4 text-slate">
          This page opens from the link in your reset email.{" "}
          <Link href="/forgot-password" className="font-medium text-forest underline underline-offset-4">
            Request a new link
          </Link>
          .
        </p>
      )}
    </>
  );
}
