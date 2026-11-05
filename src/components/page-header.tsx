import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  actionClassName,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  actionClassName?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="eyebrow mb-2 text-brand-700">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-forest-900 md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/55">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className={cn("flex items-center gap-2", actionClassName)}>
          {action}
        </div>
      ) : null}
    </div>
  );
}
