import type { Metadata } from "next";

import { ExpenseForm } from "@/components/expense-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Add expense",
};

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const { supabase, user } = await requireUser();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("name");

  return (
    <>
      <PageHeader
        eyebrow="New record"
        title="Add expense"
        description="Record what you spent and attach the invoice as proof."
      />
      <ExpenseForm categories={categories ?? []} />
    </>
  );
}
