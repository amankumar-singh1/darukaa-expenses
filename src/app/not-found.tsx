import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream-50 px-6 text-center">
      <Logo width={130} />
      <p className="eyebrow mt-10 text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-forest-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink/50">
        The page you are looking for does not exist, or the expense was
        removed.
      </p>
      <Link
        href="/dashboard"
        className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-6`}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>
    </div>
  );
}
