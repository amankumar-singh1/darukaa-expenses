import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-semibold tracking-wide text-forest-900",
        className,
      )}
      {...props}
    />
  );
}
