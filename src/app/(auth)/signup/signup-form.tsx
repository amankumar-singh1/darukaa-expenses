"use client";

import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function SignupForm() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        toast.success("Account created");
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSubmittedEmail(email.trim());
      setLoading(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create your account. Please try again.",
      );
      setLoading(false);
    }
  }

  if (submittedEmail) {
    return (
      <div>
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <MailCheck className="h-5 w-5" />
        </div>
        <p className="eyebrow mb-2 text-brand-700">One more step</p>
        <h1 className="text-2xl font-bold tracking-tight text-forest-900">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/55">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-forest-900">
            {submittedEmail}
          </span>
          . Open it to activate your account, then sign in.
        </p>
        <div className="mt-6 rounded-xl border border-forest-900/10 bg-white px-4 py-3 text-xs leading-5 text-ink/55">
          Nothing yet? Check your spam folder. Supabase&apos;s built-in email
          service is rate-limited, so wait a minute before requesting another.
        </div>
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
      <p className="eyebrow mb-2 text-brand-700">Get started</p>
      <h1 className="text-2xl font-bold tracking-tight text-forest-900">
        Create your workspace
      </h1>
      <p className="mt-2 text-sm leading-6 text-ink/55">
        One account, your expenses, and every invoice in one place.
      </p>

      {!configured ? (
        <div className="mt-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs leading-5 text-forest-900">
          Supabase is not configured yet. Add your project URL and anon key to{" "}
          <code className="whitespace-nowrap font-mono text-[11px]">
            .env.local
          </code>{" "}
          before creating an account.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Aman Singh"
          />
        </div>

        <div>
          <Label htmlFor="email">Work email</Label>
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

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink/40 transition hover:text-forest-900"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
          />
        </div>

        {error ? (
          <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm leading-5 text-danger">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/55">
        Already have an account?{" "}
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
