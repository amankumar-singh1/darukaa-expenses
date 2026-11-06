"use client";

import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import Link from "next/link";
import { Download, FileSpreadsheet, ReceiptText } from "lucide-react";
import { useState } from "react";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function toInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function CustomExportCard({ today }: { today: string }) {
  const now = new Date();
  const [from, setFrom] = useState(() => toInputValue(subDays(now, 30)));
  const [to, setTo] = useState(today);

  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(lastMonthStart);

  const quickRanges = [
    { label: "This week", from: toInputValue(thisWeekStart), to: toInputValue(thisWeekEnd) },
    { label: "Last week", from: toInputValue(lastWeekStart), to: toInputValue(lastWeekEnd) },
    { label: "Last month", from: toInputValue(lastMonthStart), to: toInputValue(lastMonthEnd) },
    { label: "Last 30 days", from: toInputValue(subDays(now, 30)), to: today },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-lime-300">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Custom export</CardTitle>
            <p className="mt-1 text-[11px] text-ink/45">Pick exact dates or a quick range.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="from-date">From date</Label>
              <DatePicker
                value={from}
                onChange={setFrom}
                min="2020-01-01"
                max={today}
                ariaLabel="From date"
              />
            </div>
            <div>
              <Label htmlFor="to-date">To date</Label>
              <DatePicker
                value={to}
                onChange={setTo}
                min={from}
                max={today}
                ariaLabel="To date"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickRanges.map((range) => (
              <Button
                key={range.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFrom(range.from);
                  setTo(range.to);
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/api/expenses/export?from=${from}&to=${to}&format=csv`}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-forest-900 px-4 text-sm font-semibold text-cream-50 transition-colors hover:bg-forest-800",
              )}
            >
              <Download className="h-4 w-4" />
              CSV
            </Link>
            <Link
              href={`/api/expenses/export?from=${from}&to=${to}&format=xlsx`}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700",
              )}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Link>
          </div>

          <p className="text-[11px] leading-5 text-ink/40">
            Weeks and last month use the same custom range; choose one above, then download.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
