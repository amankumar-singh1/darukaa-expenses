import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "bg-cream-100 text-forest-900",
        lime: "bg-lime-300/45 text-forest-900",
        green: "bg-brand-50 text-brand-700",
        outline: "border border-forest-900/15 bg-white text-forest-900",
        danger: "bg-danger-50 text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
