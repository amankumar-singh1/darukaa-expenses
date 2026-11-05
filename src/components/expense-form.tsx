"use client";

import { ChevronDown, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  InvoiceUploader,
  type PendingFile,
} from "@/components/invoice-uploader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createExpense,
  updateExpense,
} from "@/app/(app)/expenses/actions";
import type { AttachmentInput, AttachmentWithUrl } from "@/lib/types";
import { todayISO } from "@/lib/money";
import {
  removeReceipts,
  uploadReceipt,
} from "@/lib/upload";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, expenseSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FormValues = {
  name: string;
  amount: string;
  expenseDate: string;
  categoryId: string;
  vendor: string;
  paymentMethod: string;
  note: string;
  invoiceNumber: string;
  taxAmount: string;
  clientProject: string;
  isBillable: boolean;
};

type ExpenseForForm = {
  id: string;
  name: string;
  amount_minor: number;
  expense_date: string;
  category_id: string | null;
  vendor: string | null;
  payment_method: string | null;
  note: string | null;
  invoice_number: string | null;
  tax_amount_minor: number | null;
  client_project: string | null;
  is_billable: boolean;
};

export function ExpenseForm({
  categories,
  expense = null,
  existingAttachments = [],
}: {
  categories: { id: string; name: string; color: string }[];
  expense?: ExpenseForForm | null;
  existingAttachments?: AttachmentWithUrl[];
}) {
  const router = useRouter();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [existing, setExisting] =
    useState<AttachmentWithUrl[]>(existingAttachments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: expense?.name ?? "",
      amount: expense ? (expense.amount_minor / 100).toFixed(2) : "",
      expenseDate: expense?.expense_date ?? todayISO(),
      categoryId: expense?.category_id ?? "",
      vendor: expense?.vendor ?? "",
      paymentMethod: expense?.payment_method ?? "",
      note: expense?.note ?? "",
      invoiceNumber: expense?.invoice_number ?? "",
      taxAmount:
        expense?.tax_amount_minor != null
          ? (expense.tax_amount_minor / 100).toFixed(2)
          : "",
      clientProject: expense?.client_project ?? "",
      isBillable: expense?.is_billable ?? false,
    },
  });

  async function onSubmit(values: FormValues) {
    setFormError("");

    const parsed = expenseSchema.safeParse({
      id: expense?.id,
      name: values.name,
      amount: values.amount,
      expenseDate: values.expenseDate,
      categoryId: values.categoryId || null,
      vendor: values.vendor,
      paymentMethod: values.paymentMethod || null,
      note: values.note,
      invoiceNumber: values.invoiceNumber,
      taxAmount: values.taxAmount,
      clientProject: values.clientProject,
      isBillable: values.isBillable,
      attachments: [],
      keepAttachmentIds: existing.map((attachment) => attachment.id),
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setFormError(firstIssue?.message ?? "Check the expense details.");

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          typeof field === "string" &&
          field !== "attachments" &&
          field !== "keepAttachmentIds"
        ) {
          setError(field as keyof FormValues, {
            type: "validate",
            message: issue.message,
          });
        }
      }

      return;
    }

    const expenseId = expense?.id ?? crypto.randomUUID();
    const uploaded: AttachmentInput[] = [];

    setIsSubmitting(true);

    try {
      for (let index = 0; index < pendingFiles.length; index += 1) {
        setStatus(
          `Uploading invoice ${index + 1} of ${pendingFiles.length}…`,
        );
        const metadata = await uploadReceipt(
          pendingFiles[index].file,
          expenseId,
        );
        uploaded.push(metadata);
      }

      setStatus("Saving expense…");

      const payload = {
        ...parsed.data,
        id: expenseId,
        attachments: uploaded,
        keepAttachmentIds: existing.map((attachment) => attachment.id),
      };

      const result = expense
        ? await updateExpense(payload)
        : await createExpense(payload);

      if (!result.ok) {
        await removeReceipts(uploaded.map((item) => item.storagePath));
        toast.error(result.error);
        setStatus("");
        setIsSubmitting(false);
        return;
      }

      toast.success(expense ? "Expense updated" : "Expense added");
      router.push(`/expenses/${result.id}`);
      router.refresh();
    } catch (caught) {
      await removeReceipts(uploaded.map((item) => item.storagePath));
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Could not save the expense. Please try again.",
      );
      setStatus("");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Expense name</Label>
            <Input
              id="name"
              placeholder="e.g. Client lunch, cab to airport, Adobe subscription"
              {...register("name", {
                required: "Give the expense a name",
              })}
            />
            {errors.name?.message ? (
              <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink/40">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="pl-7 font-mono"
                  {...register("amount", {
                    required: "Enter an amount",
                  })}
                />
              </div>
              {errors.amount?.message ? (
                <p className="mt-1 text-xs text-danger">
                  {errors.amount.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="expenseDate">Date</Label>
              <Input
                id="expenseDate"
                type="date"
                {...register("expenseDate", {
                  required: "Choose a date",
                })}
              />
              {errors.expenseDate?.message ? (
                <p className="mt-1 text-xs text-danger">
                  {errors.expenseDate.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select id="categoryId" {...register("categoryId")}>
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment method</Label>
              <Select id="paymentMethod" {...register("paymentMethod")}>
                <option value="">Not specified</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="vendor">Vendor / merchant</Label>
              <Input
                id="vendor"
                placeholder="e.g. IndiGo, WeWork, Amazon"
                {...register("vendor")}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Why was this spent? Add anything useful for later."
                {...register("note")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice / proof</CardTitle>
          <span className="text-[11px] font-medium text-ink/40">
            Private to your account
          </span>
        </CardHeader>
        <CardContent>
          <InvoiceUploader
            pendingFiles={pendingFiles}
            onPendingChange={setPendingFiles}
            existing={existing}
            onRemoveExisting={(id) =>
              setExisting((items) =>
                items.filter((attachment) => attachment.id !== id),
              )
            }
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      <Card>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-forest-900">
                Business details
              </p>
              <p className="mt-0.5 text-[11px] text-ink/40">
                Optional — invoice number, GST, client or project.
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-ink/40 transition group-open:rotate-180" />
          </summary>

          <div className="grid gap-4 border-t border-forest-900/8 px-5 py-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="invoiceNumber">Invoice number</Label>
              <Input
                id="invoiceNumber"
                placeholder="e.g. INV-2026-014"
                {...register("invoiceNumber")}
              />
            </div>

            <div>
              <Label htmlFor="taxAmount">GST / tax amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink/40">
                  ₹
                </span>
                <Input
                  id="taxAmount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7 font-mono"
                  {...register("taxAmount")}
                />
              </div>
              {errors.taxAmount?.message ? (
                <p className="mt-1 text-xs text-danger">
                  {errors.taxAmount.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="clientProject">Client / project</Label>
              <Input
                id="clientProject"
                placeholder="e.g. Darukaa — Biodiversity"
                {...register("clientProject")}
              />
            </div>

            <div className="flex items-end pb-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-forest-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-forest-900/25 accent-brand-600"
                  {...register("isBillable")}
                />
                Billable to a client
              </label>
            </div>
          </div>
        </details>
      </Card>

      {formError ? (
        <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm leading-5 text-danger">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={expense ? `/expenses/${expense.id}` : "/expenses"}
          className={cn(buttonVariants({ variant: "outline" }), "sm:w-auto")}
        >
          Cancel
        </Link>

        <div className="flex items-center gap-3">
          {status ? (
            <span className="text-xs text-ink/45">{status}</span>
          ) : null}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {expense ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </div>
    </form>
  );
}
