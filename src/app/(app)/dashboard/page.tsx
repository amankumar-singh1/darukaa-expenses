import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  ArrowRight,
  FileCheck2,
  Paperclip,
  Plus,
  ReceiptText,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DashboardDeer } from "@/components/dashboard-deer";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { formatExpenseDate, formatINR, formatMonthYear } from "@/lib/money";
import { cn, firstName } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

type MonthExpense = {
  amount_minor: number;
  category_id: string | null;
  categories: { name: string; color: string } | null;
  attachments: { id: string }[];
};

type RecentExpense = {
  id: string;
  name: string;
  amount_minor: number;
  expense_date: string;
  vendor: string | null;
  categories: { name: string; color: string } | null;
  attachments: { id: string }[];
};

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [{ data: monthRows }, { data: recentRows }] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount_minor, category_id, categories(name, color), attachments(id)")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("expense_date", monthStart)
      .lte("expense_date", monthEnd),
    supabase
      .from("expenses")
      .select(
        "id, name, amount_minor, expense_date, vendor, categories(name, color), attachments(id)",
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthExpenses = (monthRows ?? []) as unknown as MonthExpense[];
  const recentExpenses = (recentRows ?? []) as unknown as RecentExpense[];
  const total = monthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount_minor),
    0,
  );
  const proofCount = monthExpenses.filter(
    (expense) => expense.attachments.length > 0,
  ).length;
  const proofPercent =
    monthExpenses.length === 0
      ? 0
      : Math.round((proofCount / monthExpenses.length) * 100);

  const categoryTotals = new Map<
    string,
    { name: string; color: string; total: number }
  >();

  for (const expense of monthExpenses) {
    const key = expense.category_id ?? "uncategorized";
    const current = categoryTotals.get(key) ?? {
      name: expense.categories?.name ?? "Uncategorised",
      color: expense.categories?.color ?? "#94a3b8",
      total: 0,
    };
    current.total += Number(expense.amount_minor);
    categoryTotals.set(key, current);
  }

  const categories = Array.from(categoryTotals.values()).sort(
    (a, b) => b.total - a.total,
  );

  const displayName =
    (user.user_metadata?.full_name as string | undefined) || user.email || "";

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName(displayName, user.email)}`}
        description="Here is where your business spending stands this month."
        actionClassName="hidden md:flex"
        action={
          <Link
            href="/expenses/new"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <Plus className="h-4 w-4" />
            Add expense
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="relative overflow-hidden border-forest-900 bg-forest-900 text-white sm:col-span-2 xl:col-span-1">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-lime-300/15 blur-2xl" />
          <CardContent className="relative px-5 py-5">
            <p className="eyebrow text-lime-300/80">
              Spent in {formatMonthYear(now)}
            </p>
            <p className="mt-4 font-mono text-3xl font-semibold tracking-tight">
              {formatINR(total)}
            </p>
            <p className="mt-2 text-xs text-white/50">
              {monthExpenses.length}{" "}
              {monthExpenses.length === 1 ? "expense" : "expenses"} recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-5 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-ink/45">
                  Proof attached
                </p>
                <p className="mt-3 font-mono text-3xl font-semibold text-forest-900">
                  {proofPercent}%
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/35 text-forest-900">
                <FileCheck2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-ink/45">
              {proofCount} of {monthExpenses.length} expenses have an invoice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-5 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-ink/45">
                  Expenses this month
                </p>
                <p className="mt-3 font-mono text-3xl font-semibold text-forest-900">
                  {monthExpenses.length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/35 text-forest-900">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>
            <Link
              href="/expenses"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              View all expenses
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
            <span className="text-[11px] font-medium text-ink/40">
              This month
            </span>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink/45">
                Add an expense to see how your spending splits up.
              </p>
            ) : (
              <div className="space-y-4">
                {categories.slice(0, 6).map((category) => (
                  <div key={category.name}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="flex items-center gap-2 font-medium text-forest-900">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>
                      <span className="font-mono text-[11px] text-ink/55">
                        {formatINR(category.total)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-cream-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(
                            4,
                            total === 0 ? 0 : (category.total / total) * 100,
                          )}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent expenses</CardTitle>
            <Link
              href="/expenses"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          {recentExpenses.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="h-5 w-5" />}
              title="No expenses yet"
              description="Add your first expense and attach the invoice as proof."
              action={
                <Link
                  href="/expenses/new"
                  className={buttonVariants({ size: "sm" })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add expense
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-forest-900/8">
              {recentExpenses.map((expense) => (
                <li key={expense.id}>
                  <Link
                    href={`/expenses/${expense.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-cream-50"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold"
                      style={{
                        backgroundColor: `${expense.categories?.color ?? "#94a3b8"}18`,
                        color: expense.categories?.color ?? "#94a3b8",
                      }}
                    >
                      {(expense.categories?.name ?? "O").slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-forest-900">
                        {expense.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-[11px] text-ink/45">
                        {formatExpenseDate(expense.expense_date)}
                        {expense.categories?.name ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-ink/20" />
                            {expense.categories.name}
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {expense.attachments.length > 0 ? (
                        <Paperclip
                          className="h-3.5 w-3.5 text-brand-600"
                          aria-label="Invoice attached"
                        />
                      ) : null}
                      <span
                        className={cn(
                          "font-mono text-sm font-semibold text-forest-900",
                        )}
                      >
                        {formatINR(Number(expense.amount_minor))}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <DashboardDeer />
    </>
  );
}
