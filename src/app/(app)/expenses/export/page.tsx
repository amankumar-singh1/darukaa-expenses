import {
  format,
} from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import { CustomExportCard } from "@/components/custom-export-card";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Export expenses",
};

export const dynamic = "force-dynamic";

const MONTH_RE = /^\d{4}-(?:0[1-9]|1[0-2])$/;

function toInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const today = toInputValue(now);

  const month =
    params.month && MONTH_RE.test(params.month)
      ? params.month
      : format(now, "yyyy-MM");

  return (
    <>
      <Link
        href="/expenses"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-mt-2 mb-3 gap-2 self-start text-ink/55 hover:text-forest-900",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to expenses
      </Link>
      <PageHeader
        eyebrow="Reports"
        title="Export expenses"
        description="Download a CSV or Excel file. Monthly is the recommended default; use custom ranges for dates or weeks."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/35 text-forest-900">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Monthly export</CardTitle>
                <p className="mt-1 text-[11px] text-ink/45">Expected use for your regular GST/tax filing.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="month">Month to export</Label>
                <Input
                  id="month"
                  name="month"
                  type="month"
                  min="2020-01"
                  max={format(now, "yyyy-MM")}
                  defaultValue={month}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/api/expenses/export?month=${month}&format=csv`}
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "gap-2",
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Download CSV
                </Link>
                <Link
                  href={`/api/expenses/export?month=${month}&format=xlsx`}
                  className={cn(
                    buttonVariants({ variant: "primary" }),
                    "gap-2",
                  )}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Excel
                </Link>
              </div>

              <p className="text-[11px] leading-5 text-ink/40">
                Includes date, expense, amount, category, vendor, payment method, invoice number, tax, client/project, billable flag, note and proof status.
              </p>
            </form>
          </CardContent>
        </Card>

        <CustomExportCard today={today} />
      </div>
    </>
  );
}
