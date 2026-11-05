"use client";

import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not send the reset link. Please try again.",
      );
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div>
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <MailCheck className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-forest-900">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/55">
          If an account exists for{" "}
          <span className="font-semibold text-forest-900">{email}</span>, a
          password reset link is on its way.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex text-sm font-semibold text-brand-700 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-2 text-brand-700">Account recovery</p>
      <h1 className="text-2xl font-bold tracking-tight text-forest-900">
        Reset your password
      </h1>
      <p className="mt-2 text-sm leading-6 text-ink/55">
        Enter the email you signed up with and we&apos;ll send you a secure
        link.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>

        {error ? (
          <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm leading-5 text-danger">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/55">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
