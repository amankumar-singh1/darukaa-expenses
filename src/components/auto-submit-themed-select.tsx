"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ThemedSelect, type ThemedSelectOption } from "@/components/themed-select";

// Navigates with the selected filter applied, preserving other search params.
export function AutoSubmitThemedSelect({
  name,
  value,
  options,
  placeholder,
  ariaLabel,
  className,
}: {
  name: string;
  value: string;
  options: readonly ThemedSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) {
      params.set(name, nextValue);
    } else {
      params.delete(name);
    }
    const query = params.toString();
    router.push(query ? `?${query}` : "?");
  }

  return (
    <ThemedSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}
