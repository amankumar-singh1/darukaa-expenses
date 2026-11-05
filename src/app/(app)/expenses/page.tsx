import {
  ChevronRight,
  Plus,
  ReceiptText,
  Search,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProofButton } from "@/components/proof-button";

import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { formatExpenseDate, formatINR } from "@/lib/money";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Expenses",
};

export const dynamic = "force-dynamic";

type ExpenseRow = {
  id: string;
  name: string;
  amount_minor: number;
  expense_date: string;
  vendor: string | null;
  categories: { name: string; color: string } | null;
  attachments: { id: string }[];
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const categoryFilter = params.category ?? "";

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name, color, is_archived")
    .eq("user_id", user.id)
    .order("name");

  const categories = (categoryRows ?? []) as Category[];

  let expensesQuery = supabase
    .from("expenses")
    .select(
      "id, name, amount_minor, expense_date, vendor, categories(name, color), attachments(id)",
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (query) {
    const safeQuery = query.replace(/[(),%_]/g, " ").trim();
    if (safeQuery) {
      expensesQuery = expensesQuery.or(
        `name.ilike.%${safeQuery}%,vendor.ilike.%${safeQuery}%`,
      );
    }
  }

  if (categoryFilter) {
    expensesQuery = expensesQuery.eq("category_id", categoryFilter);
  }

  const { data: expenseRows } = await expensesQuery;
  const expenses = (expenseRows ?? []) as unknown as ExpenseRow[];
  const shownTotal = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount_minor),
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Expenses"
        description="Search, review, and open any expense to see its invoice proof."
        action={
          <Link
            href="/expenses/new"
            className={buttonVariants({ variant: "primary" })}
          >
            <Plus className="h-4 w-4" />
            Add expense
          </Link>
        }
      />

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search by expense or vendor"
            className="pl-9"
            aria-label="Search expenses"
          />
        </div>
        <AutoSubmitSelect
          key={categoryFilter}
          name="category"
          defaultValue={categoryFilter}
          aria-label="Filter by category"
          className="sm:w-52"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.is_archived ? " (archived)" : ""}
            </option>
          ))}
        </AutoSubmitSelect>
        <button type="submit" className="sr-only">
          Search
        </button>
        <Link
          href="/expenses"
          className={buttonVariants({ variant: "outline" })}
        >
          Reset
        </Link>
      </form>

      <div className="mb-3 px-1">
        <p className="text-xs text-ink/45">
          {expenses.length}{" "}
          {expenses.length === 1 ? "expense" : "expenses"}
          {expenses.length === 100 ? " (first 100)" : ""}
        </p>
      </div>

      <Card>
        {expenses.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="h-5 w-5" />}
            title={query || categoryFilter ? "No matching expenses" : "No expenses yet"}
            description={
              query || categoryFilter
                ? "Try a different search or clear the filters."
                : "Add your first expense and attach the invoice as proof."
            }
            action={
              query || categoryFilter ? (
                <Link
                  href="/expenses"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Clear filters
                </Link>
              ) : (
                <Link
                  href="/expenses/new"
                  className={buttonVariants({ size: "sm" })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add expense
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-t-2xl md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-forest-900/8 bg-cream-50/60 text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Expense</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Proof
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Amount
                    </th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/8">
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="group transition hover:bg-cream-50"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-ink/55">
                        {formatExpenseDate(expense.expense_date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="block max-w-xs truncate text-sm font-semibold text-forest-900 group-hover:text-brand-700"
                        >
                          {expense.name}
                        </Link>
                        {expense.vendor ? (
                          <p className="mt-0.5 truncate text-[11px] text-ink/40">
                            {expense.vendor}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5">
                        {expense.categories ? (
                          <Badge variant="outline">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor: expense.categories.color,
                              }}
                            />
                            {expense.categories.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-ink/35">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {expense.attachments.length > 0 ? (
                          <ProofButton
                            expenseId={expense.id}
                            count={expense.attachments.length}
                            className="mx-auto"
                          />
                        ) : (
                          <span className="text-xs text-ink/25">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-sm font-semibold text-forest-900">
                        {formatINR(Number(expense.amount_minor))}
                      </td>
                      <td className="px-3 py-3.5">
                        <Link
                          href={`/expenses/${expense.id}`}
                          aria-label={`Open ${expense.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-ink/30 transition group-hover:bg-white group-hover:text-forest-900"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-forest-900/8 md:hidden">
              {expenses.map((expense) => (
                <li key={expense.id}>
                  <div className="flex items-center gap-3 px-4 py-4 transition active:bg-cream-50">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-forest-900">
                          {expense.name}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-[11px] text-ink/45">
                          {formatExpenseDate(expense.expense_date)}
                          {expense.categories?.name ? (
                            <>
                              <span className="h-1 w-1 rounded-full bg-ink/20" />
                              {expense.categories.name}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-forest-900">
                        {formatINR(Number(expense.amount_minor))}
                      </span>
                    </Link>

                    {expense.attachments.length > 0 ? (
                      <ProofButton
                        expenseId={expense.id}
                        count={expense.attachments.length}
                      />
                    ) : null}

                    <Link
                      href={`/expenses/${expense.id}`}
                      aria-label={`Open ${expense.name}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink/30 transition hover:bg-white hover:text-forest-900"
                    >
                      <ChevronRight className="h-4 w-4 text-ink/25" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {expenses.length > 0 ? (
          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 rounded-b-2xl border-t border-forest-900/8 bg-cream-50/90 px-5 py-3 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
              Total · {expenses.length}{" "}
              {expenses.length === 1 ? "expense" : "expenses"}
            </p>
            <p className="font-mono text-base font-semibold text-forest-900">
              {formatINR(shownTotal)}
            </p>
          </div>
        ) : null}
      </Card>
    </>
  );
}
