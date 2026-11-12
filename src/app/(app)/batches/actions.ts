"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { batchSchema } from "@/lib/validation";

type BatchResult = { ok: true } | { ok: false; error: string };

export async function createBatch(input: unknown): Promise<BatchResult> {
  const { supabase, user } = await requireUser();
  const parsed = batchSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the batch details.",
    };
  }

  const data = parsed.data;
  const { error } = await supabase.from("batches").insert({
    user_id: user.id,
    code: data.code,
    vendor_name: data.vendorName,
    starts_on: data.startsOn,
    ends_on: data.endsOn,
    vendor_phone: data.vendorPhone,
  });

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "You already have a batch with that number."
          : error.message,
    };
  }

  revalidatePath("/batches");

  return { ok: true };
}

export async function updateBatch(
  id: unknown,
  input: unknown,
): Promise<BatchResult> {
  const { supabase, user } = await requireUser();
  const parsedId = z.string().uuid().safeParse(id);

  if (!parsedId.success) {
    return { ok: false, error: "Batch not found." };
  }

  const parsed = batchSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the batch details.",
    };
  }

  const data = parsed.data;
  const { error } = await supabase
    .from("batches")
    .update({
      code: data.code,
      vendor_name: data.vendorName,
      starts_on: data.startsOn,
      ends_on: data.endsOn,
      vendor_phone: data.vendorPhone,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "You already have a batch with that number."
          : error.message,
    };
  }

  revalidatePath("/batches");
  revalidatePath(`/batches/${parsedId.data}`);

  return { ok: true };
}
