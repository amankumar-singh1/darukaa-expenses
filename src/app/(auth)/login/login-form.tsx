"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function LoginForm({ initialError = "" }: { initialError?: string }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Those credentials do not match an account. Check your email and password."
            : signInError.message,
        );
        setLoading(false);
        return;
      }

      toast.success("Welcome back");
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      const destination = next && next.startsWith("/") ? next : "/dashboard";
      router.replace(destination);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not sign in. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="eyebrow mb-2 text-brand-700">Welcome back</p>
      <h1 className="text-2xl font-bold tracking-tight text-forest-900">
        Sign in to your workspace
      </h1>
      <p className="mt-2 text-sm leading-6 text-ink/55">
        Pick up where you left off and keep your records up to date.
      </p>

      {!configured ? (
        <div className="mt-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs leading-5 text-forest-900">
          Supabase is not configured yet. Add
          <code className="mx-1 whitespace-nowrap rounded bg-white px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          and
          <code className="mx-1 whitespace-nowrap rounded bg-white px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>
          to{" "}
          <code className="whitespace-nowrap font-mono text-[11px]">
            .env.local
          </code>
          , then restart the dev server.
        </div>
      ) : null}

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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
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

        {error ? (
          <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm leading-5 text-danger">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/55">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
