import { forwardRef, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-10 w-full rounded-lg border border-forest-900/15 bg-white px-3 text-sm text-ink shadow-[0_1px_1px_rgba(14,42,29,0.03)] outline-none transition placeholder:text-ink/35 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 disabled:cursor-not-allowed disabled:bg-cream-100 disabled:text-ink/50",
          className,
        )}
        {...props}
      />
    );
  },
);
