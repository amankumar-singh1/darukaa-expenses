import Image from "next/image";

import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh overflow-x-hidden lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest-900 lg:block">
        <Image
          src="/brand/hero.webp"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-900/65 to-forest-900/20" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo variant="white" width={150} />
          <div>
            <p className="eyebrow text-lime-300">Built for clarity</p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl">
              Every expense, backed by its invoice.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
              Track business spending, attach proof, and keep your books ready
              for tax time.
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-dvh min-w-0 flex-col bg-cream-50">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Logo width={122} />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-2">
          <div className="w-full min-w-0 max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
