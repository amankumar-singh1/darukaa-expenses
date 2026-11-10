"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import {
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
    name: data.name,
    type: data.type,
    status: "available",
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
  const { error } = await supabase
    .from("devices")
    .update({
      status: data.status as DeviceStatus,
      note: data.note,
    })
    .eq("code", data.code)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/devices");
  revalidatePath(`/devices/${data.code}`);

  return { ok: true };
}
