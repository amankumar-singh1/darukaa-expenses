"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import {
  ALLOWED_MIME_TYPES,
  MAX_ATTACHMENTS,
  MAX_FILE_BYTES,
} from "@/lib/files";
import type { AttachmentInput } from "@/lib/types";
import { expenseSchema } from "@/lib/validation";

type CreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type SimpleResult = { ok: true } | { ok: false; error: string };

function validateAttachments(
  attachments: AttachmentInput[],
  userId: string,
  expenseId: string,
) {
  if (attachments.length > MAX_ATTACHMENTS) {
    return `Attach up to ${MAX_ATTACHMENTS} files per expense.`;
  }

  for (const attachment of attachments) {
    if (
      !attachment.storagePath.startsWith(`${userId}/${expenseId}/`) ||
      attachment.storagePath.includes("..")
    ) {
      return "One of the attachments is invalid. Remove it and try again.";
    }

    if (!ALLOWED_MIME_TYPES.has(attachment.mimeType)) {
      return "Attachments must be a PDF, JPEG, PNG, WebP, HEIC, or HEIF file.";
    }

    if (attachment.sizeBytes > MAX_FILE_BYTES) {
      return "Each attachment must be 10 MB or smaller.";
    }
  }

  return null;
}

async function categoryBelongsToUser(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  categoryId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function createExpense(input: unknown): Promise<CreateResult> {
  const { supabase, user } = await requireUser();
  const parsed = expenseSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the expense details.",
    };
  }

  const data = parsed.data;
  const expenseId = data.id ?? crypto.randomUUID();
  const attachmentError = validateAttachments(
    data.attachments,
    user.id,
    expenseId,
  );

  if (attachmentError) {
    return { ok: false, error: attachmentError };
  }

  if (
    data.categoryId &&
    !(await categoryBelongsToUser(supabase, data.categoryId, user.id))
  ) {
    return { ok: false, error: "Choose a valid category." };
  }

  const { error } = await supabase.from("expenses").insert({
    id: expenseId,
    user_id: user.id,
    name: data.name,
    amount_minor: Math.round(data.amount * 100),
    currency: "INR",
    expense_date: data.expenseDate,
    category_id: data.categoryId || null,
    vendor: data.vendor,
    payment_method: data.paymentMethod ?? null,
    note: data.note,
    invoice_number: data.invoiceNumber,
    tax_amount_minor:
      data.taxAmount === null ? null : Math.round(data.taxAmount * 100),
    client_project: data.clientProject,
    is_billable: data.isBillable,
    status: "recorded",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.attachments.length > 0) {
    const { error: attachmentError } = await supabase
      .from("attachments")
      .insert(
        data.attachments.map((attachment) => ({
          expense_id: expenseId,
          user_id: user.id,
          storage_path: attachment.storagePath,
          file_name: attachment.fileName,
          mime_type: attachment.mimeType,
          size_bytes: attachment.sizeBytes,
        })),
      );

    if (attachmentError) {
      await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId)
        .eq("user_id", user.id);
      await supabase.storage
        .from("receipts")
        .remove(data.attachments.map((attachment) => attachment.storagePath));

      return { ok: false, error: attachmentError.message };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");

  return { ok: true, id: expenseId };
}

export async function updateExpense(input: unknown): Promise<CreateResult> {
  const { supabase, user } = await requireUser();
  const parsed = expenseSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the expense details.",
    };
  }

  const data = parsed.data;

  if (!data.id) {
    return { ok: false, error: "Missing expense reference." };
  }

  const { data: existing } = await supabase
    .from("expenses")
    .select("id")
    .eq("id", data.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Expense not found." };
  }

  const attachmentError = validateAttachments(
    data.attachments,
    user.id,
    data.id,
  );

  if (attachmentError) {
    return { ok: false, error: attachmentError };
  }

  if (
    data.categoryId &&
    !(await categoryBelongsToUser(supabase, data.categoryId, user.id))
  ) {
    return { ok: false, error: "Choose a valid category." };
  }

  const { data: currentAttachments } = await supabase
    .from("attachments")
    .select("id, storage_path")
    .eq("expense_id", data.id)
    .eq("user_id", user.id);

  const current = currentAttachments ?? [];
  const keepIds = new Set(
    data.keepAttachmentIds ?? current.map((attachment) => attachment.id),
  );
  const removed = current.filter(
    (attachment) => !keepIds.has(attachment.id),
  );
  const remainingCount = current.length - removed.length;

  if (remainingCount + data.attachments.length > MAX_ATTACHMENTS) {
    return {
      ok: false,
      error: `Attach up to ${MAX_ATTACHMENTS} files per expense.`,
    };
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      name: data.name,
      amount_minor: Math.round(data.amount * 100),
      expense_date: data.expenseDate,
      category_id: data.categoryId || null,
      vendor: data.vendor,
      payment_method: data.paymentMethod ?? null,
      note: data.note,
      invoice_number: data.invoiceNumber,
      tax_amount_minor:
        data.taxAmount === null ? null : Math.round(data.taxAmount * 100),
      client_project: data.clientProject,
      is_billable: data.isBillable,
    })
    .eq("id", data.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (removed.length > 0) {
    await supabase.storage
      .from("receipts")
      .remove(removed.map((attachment) => attachment.storage_path));
    await supabase
      .from("attachments")
      .delete()
      .in(
        "id",
        removed.map((attachment) => attachment.id),
      )
      .eq("user_id", user.id);
  }

  if (data.attachments.length > 0) {
    const { error: attachmentError } = await supabase
      .from("attachments")
      .insert(
        data.attachments.map((attachment) => ({
          expense_id: data.id,
          user_id: user.id,
          storage_path: attachment.storagePath,
          file_name: attachment.fileName,
          mime_type: attachment.mimeType,
          size_bytes: attachment.sizeBytes,
        })),
      );

    if (attachmentError) {
      return { ok: false, error: attachmentError.message };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${data.id}`);

  return { ok: true, id: data.id };
}

export async function deleteExpense(id: string): Promise<SimpleResult> {
  const { supabase, user } = await requireUser();

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, error: "Invalid expense reference." };
  }

  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");

  return { ok: true };
}

export async function deleteAttachment(id: string): Promise<SimpleResult> {
  const { supabase, user } = await requireUser();

  const { data: attachment } = await supabase
    .from("attachments")
    .select("id, expense_id, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attachment) {
    return { ok: false, error: "Attachment not found." };
  }

  await supabase.storage.from("receipts").remove([attachment.storage_path]);

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/expenses/${attachment.expense_id}`);
  revalidatePath("/expenses");

  return { ok: true };
}
