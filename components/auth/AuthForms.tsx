"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signIn,
  signUp,
  requestPasswordReset,
  updatePassword,
  type AuthState,
} from "@/lib/actions/auth";
import { Field, FormMessage, Input, SubmitButton } from "@/components/ui/form";

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? "/"} />
      {linkError && !state && <FormMessage error="That link is invalid or has expired." />}
      <FormMessage error={state?.error} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.fields?.email} />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-slate underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton pendingLabel="Logging in…" className="w-full">
        Log in
      </SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, undefined);
  if (state?.message) return <FormMessage message={state.message} />;
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <Field label="Name" htmlFor="display_name">
        <Input id="display_name" name="display_name" autoComplete="name" maxLength={60} defaultValue={state?.fields?.display_name} />
      </Field>
      <Field label="Username" htmlFor="username" hint="3–24 letters, numbers or underscores.">
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          pattern="[A-Za-z0-9_]{3,24}"
          defaultValue={state?.fields?.username}
        />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.fields?.email} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <SubmitButton pendingLabel="Creating account…" className="w-full">
        Create account
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} message={state?.message} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton pendingLabel="Sending…" className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(updatePassword, undefined);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <Field label="New password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field label="Confirm password" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Set new password
      </SubmitButton>
    </form>
  );
}
