import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExpenseForm } from "@/components/expense-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import type { AttachmentWithUrl, Expense } from "@/lib/types";

export const metadata: Metadata = {
  title: "Edit expense",
};

export const dynamic = "force-dynamic";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const [{ data: expenseData }, { data: categories }] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "*, categories(id, name, color), attachments(id, expense_id, user_id, storage_path, file_name, mime_type, size_bytes, created_at)",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, color")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("name"),
  ]);

  if (!expenseData) {
    notFound();
  }

  const expense = expenseData as Expense;
  const attachments: AttachmentWithUrl[] = await Promise.all(
    (expense.attachments ?? []).map(async (attachment) => {
      const { data: signed } = await supabase.storage
        .from("receipts")
        .createSignedUrl(attachment.storage_path, 60 * 10);

      return {
        id: attachment.id,
        storage_path: attachment.storage_path,
        file_name: attachment.file_name,
        mime_type: attachment.mime_type,
        size_bytes: attachment.size_bytes,
        url: signed?.signedUrl ?? null,
      };
    }),
  );

  return (
    <>
      <PageHeader
        eyebrow="Edit record"
        title="Edit expense"
        description="Update the details or manage the invoice attached to this expense."
      />
      <ExpenseForm
        categories={categories ?? []}
        expense={expense}
        existingAttachments={attachments}
      />
    </>
  );
}
