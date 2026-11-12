import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "D";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(name?: string | null, email?: string | null) {
  const source = name?.trim();
  if (source) {
    return source.split(/\s+/)[0];
  }

  return email?.split("@")[0] ?? "there";
}

// A to-one embed comes back as an object at runtime, but the untyped Supabase
// client types it as an array — accept both.
export function embeddedOne<T>(value: unknown): T | null {
  const first = Array.isArray(value) ? value[0] : value;
  return (first as T | null) ?? null;
}

export function embeddedName(value: unknown): string | null {
  return embeddedOne<{ name?: string }>(value)?.name ?? null;
}

export function formatDay(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
