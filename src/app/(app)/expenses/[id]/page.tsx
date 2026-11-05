import {
  ArrowLeft,
  FileText,
  ImageIcon,
  Paperclip,
  Pencil,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { canPreviewInline, fileTypeLabel } from "@/lib/files";
import { formatExpenseDate, formatFileSize, formatINR } from "@/lib/money";
import type { AttachmentWithUrl, Expense } from "@/lib/types";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/validation";

export const metadata: Metadata = {
  title: "Expense",
};

export const dynamic = "force-dynamic";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("expenses")
    .select(
      "*, categories(id, name, color), attachments(id, expense_id, user_id, storage_path, file_name, mime_type, size_bytes, created_at)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const expense = data as Expense;
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

  const paymentLabel = expense.payment_method
    ? PAYMENT_METHOD_LABELS[expense.payment_method as PaymentMethod]
    : null;

  const hasBusinessDetails =
    expense.invoice_number ||
    expense.tax_amount_minor !== null ||
    expense.client_project ||
    expense.is_billable;

  return (
    <>
      <Link
        href="/expenses"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-forest-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to expenses
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {expense.categories ? (
              <Badge variant="outline">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: expense.categories.color }}
                />
                {expense.categories.name}
              </Badge>
            ) : (
              <Badge variant="default">Uncategorised</Badge>
            )}
            {expense.is_billable ? (
              <Badge variant="lime">Billable</Badge>
            ) : null}
            {attachments.length > 0 ? (
              <Badge variant="green">
                <Paperclip className="h-3 w-3" />
                Proof attached
              </Badge>
            ) : (
              <Badge variant="danger">No proof</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-900 md:text-3xl">
            {expense.name}
          </h1>
          <p className="mt-2 text-sm text-ink/50">
            {formatExpenseDate(expense.expense_date)}
            {expense.vendor ? ` · ${expense.vendor}` : ""}
            {paymentLabel ? ` · ${paymentLabel}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/expenses/${expense.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
          <DeleteExpenseButton expenseId={expense.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="px-5 py-6">
              <p className="text-xs font-semibold text-ink/40">Total amount</p>
              <p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-forest-900">
                {formatINR(Number(expense.amount_minor))}
              </p>
              {expense.tax_amount_minor !== null ? (
                <p className="mt-2 text-xs text-ink/45">
                  Includes{" "}
                  <span className="font-mono">
                    {formatINR(Number(expense.tax_amount_minor))}
                  </span>{" "}
                  GST / tax
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice / proof</CardTitle>
              <span className="text-[11px] font-medium text-ink/40">
                {attachments.length}{" "}
                {attachments.length === 1 ? "file" : "files"}
              </span>
            </CardHeader>

            {attachments.length === 0 ? (
              <EmptyState
                icon={<ImageIcon className="h-5 w-5" />}
                title="No invoice attached"
                description="Add a photo or PDF so this expense is backed by proof."
                action={
                  <Link
                    href={`/expenses/${expense.id}/edit`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    Attach invoice
                  </Link>
                }
              />
            ) : (
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {attachments.map((attachment) =>
                    !canPreviewInline(attachment.mime_type) ? (
                      <a
                        key={attachment.id}
                        href={attachment.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-forest-900/10 bg-cream-50 p-3 transition hover:border-brand-600/30 hover:bg-brand-50/40"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-forest-900/60 shadow-sm">
                          <FileText className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-forest-900">
                            {attachment.file_name}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-ink/40">
                            {fileTypeLabel(attachment.mime_type)} ·{" "}
                            {formatFileSize(attachment.size_bytes)}
                          </span>
                        </span>
                      </a>
                    ) : (
                      <a
                        key={attachment.id}
                        href={attachment.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-xl border border-forest-900/10 bg-cream-50"
                      >
                        <div className="relative aspect-[4/3] w-full bg-cream-100">
                          {attachment.url ? (
                            <Image
                              src={attachment.url}
                              alt={attachment.file_name}
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 100vw, 50vw"
                              className="object-cover transition duration-300 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-ink/30">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <span className="truncate text-[11px] font-medium text-forest-900">
                            {attachment.file_name}
                          </span>
                          <span className="shrink-0 text-[10px] text-ink/35">
                            {formatFileSize(attachment.size_bytes)}
                          </span>
                        </div>
                      </a>
                    ),
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <DetailRow label="Date" value={formatExpenseDate(expense.expense_date)} />
              <DetailRow
                label="Category"
                value={expense.categories?.name ?? "Uncategorised"}
              />
              <DetailRow label="Vendor" value={expense.vendor ?? "—"} />
              <DetailRow label="Payment" value={paymentLabel ?? "—"} />
              <DetailRow
                label="Recorded"
                value={new Date(expense.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
            </CardContent>
          </Card>

          {hasBusinessDetails ? (
            <Card>
              <CardHeader>
                <CardTitle>Business details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <DetailRow
                  label="Invoice no."
                  value={expense.invoice_number ?? "—"}
                />
                <DetailRow
                  label="GST / tax"
                  value={
                    expense.tax_amount_minor !== null
                      ? formatINR(Number(expense.tax_amount_minor))
                      : "—"
                  }
                  mono
                />
                <DetailRow
                  label="Client / project"
                  value={expense.client_project ?? "—"}
                />
                <DetailRow
                  label="Billable"
                  value={expense.is_billable ? "Yes" : "No"}
                />
              </CardContent>
            </Card>
          ) : null}

          {expense.note ? (
            <Card>
              <CardHeader>
                <CardTitle>Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink/65">
                  {expense.note}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-ink/40">{label}</span>
      <span
        className={
          mono
            ? "text-right font-mono text-xs font-medium text-forest-900"
            : "text-right text-xs font-medium text-forest-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
