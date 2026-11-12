"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import {
  deviceBatchSchema,
  deviceSchema,
  deviceStatusSchema,
  type DeviceStatus,
} from "@/lib/validation";

type DeviceResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

type SimpleResult = { ok: true } | { ok: false; error: string };

export async function deleteDevice(code: string): Promise<SimpleResult> {
  const { supabase, user } = await requireUser();

  const trimmed = (code ?? "").trim().toUpperCase();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(trimmed)) {
    return { ok: false, error: "Invalid device reference." };
  }

  const { data: device } = await supabase
    .from("devices")
    .select("status")
    .eq("code", trimmed)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!device) {
    return { ok: false, error: "Device not found." };
  }

  if (device.status !== "available") {
    return {
      ok: false,
      error: "Mark the device available before deleting it.",
    };
  }

  const { error } = await supabase
    .from("devices")
    .delete()
    .eq("code", trimmed)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/devices");

  return { ok: true };
}

export async function createDevice(input: unknown): Promise<DeviceResult> {
  const { supabase, user } = await requireUser();
  const parsed = deviceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the device details.",
    };
  }

  const data = parsed.data;
  const { error } = await supabase.from("devices").insert({
    code: data.code,
    user_id: user.id,
    type: data.type,
    status: data.projectId ? "occupied" : "available",
    project_id: data.projectId ?? null,
    batch_id: data.batchId,
  });

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? `A device with ID ${data.code} already exists.`
          : error.message,
    };
  }

  revalidatePath("/devices");
  revalidatePath("/projects");

  return { ok: true, code: data.code };
}

export async function updateDeviceStatus(input: unknown): Promise<SimpleResult> {
  const { supabase, user } = await requireUser();
  const parsed = deviceStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the status change.",
    };
  }

  const data = parsed.data;

  if (data.status === "occupied" && !data.projectId) {
    return { ok: false, error: "Choose the project where this device is deployed." };
  }

  const patch: Record<string, unknown> = {
    status: data.status as DeviceStatus,
    note: data.note,
  };

  // Occupied points at a project; available detaches it; damaged keeps it.
  if (data.status === "occupied") patch.project_id = data.projectId;
  if (data.status === "available") patch.project_id = null;

  const { error } = await supabase
    .from("devices")
    .update(patch)
    .eq("code", data.code)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/devices");
  revalidatePath(`/devices/${data.code}`);
  revalidatePath("/projects");

  return { ok: true };
}

export async function updateDeviceBatch(
  input: unknown,
): Promise<SimpleResult> {
  const { supabase, user } = await requireUser();
  const parsed = deviceBatchSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the batch.",
    };
  }

  const { data, error } = await supabase
    .from("devices")
    .update({ batch_id: parsed.data.batchId })
    .eq("code", parsed.data.code)
    .eq("user_id", user.id)
    .select("code");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data?.length) {
    return { ok: false, error: "Device not found." };
  }

  revalidatePath("/devices");
  revalidatePath(`/devices/${parsed.data.code}`);
  revalidatePath("/batches");
  revalidatePath("/devices/labels");

  return { ok: true };
}
