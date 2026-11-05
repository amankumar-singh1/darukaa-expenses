"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream-50 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-forest-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink/50">
        The page could not be loaded. Try again, and if the problem continues
        check your Supabase configuration.
      </p>
      <Button onClick={reset} className="mt-6" size="sm">
        Try again
      </Button>
    </div>
  );
}
