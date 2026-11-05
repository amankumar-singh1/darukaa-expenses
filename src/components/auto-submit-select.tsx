"use client";

import type { ComponentProps } from "react";

import { Select } from "@/components/ui/select";

export function AutoSubmitSelect({
  onChange,
  ...props
}: ComponentProps<"select">) {
  return (
    <Select
      {...props}
      onChange={(event) => {
        onChange?.(event);
        event.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
