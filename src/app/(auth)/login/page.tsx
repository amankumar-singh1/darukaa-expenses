import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const initialError =
    params.error === "link"
      ? "That confirmation link is invalid or has expired. Try signing in, or request a new link."
      : "";

  return <LoginForm initialError={initialError} />;
}
