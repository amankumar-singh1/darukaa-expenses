import { forwardRef, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full resize-y rounded-lg border border-forest-900/15 bg-white px-3 py-2.5 text-sm leading-6 text-ink shadow-[0_1px_1px_rgba(14,42,29,0.03)] outline-none transition placeholder:text-ink/35 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15",
        className,
      )}
      {...props}
    />
  );
});
