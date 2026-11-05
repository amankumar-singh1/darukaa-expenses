import { format, parseISO } from "date-fns";

export function formatINR(minorUnits: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}

export function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

export function toMajorUnits(minorUnits: number) {
  return (minorUnits / 100).toFixed(2);
}

export function formatExpenseDate(value: string) {
  return format(parseISO(value), "d MMM yyyy");
}

export function formatMonthYear(date = new Date()) {
  return format(date, "MMMM yyyy");
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
