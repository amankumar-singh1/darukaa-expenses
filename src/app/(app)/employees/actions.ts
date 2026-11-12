"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { employeeDeploymentSchema, employeeSchema } from "@/lib/validation";

type EmployeeResult = { ok: true } | { ok: false; error: string };

export async function createEmployee(
  input: unknown,
): Promise<EmployeeResult> {
  const { supabase, user } = await requireUser();
  const parsed = employeeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the employee details.",
    };
  }

  const data = parsed.data;
  const { error } = await supabase.from("employees").insert({
    user_id: user.id,
    name: data.name,
    phone: data.phone,
    joined_on: data.joinedOn,
    leaves_on: data.isFullTime ? null : data.leavesOn,
    is_full_time: data.isFullTime,
    project_id: data.projectId || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/employees");
  revalidatePath("/projects");

  return { ok: true };
}

export async function updateEmployeeProject(
  input: unknown,
): Promise<EmployeeResult> {
  const { supabase, user } = await requireUser();
  const parsed = employeeDeploymentSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Check the deployment details." };
  }

  const { error } = await supabase
    .from("employees")
    .update({ project_id: parsed.data.projectId })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/employees");
  revalidatePath("/projects");

  return { ok: true };
}

export async function deleteEmployee(id: unknown): Promise<EmployeeResult> {
  const { supabase, user } = await requireUser();
  const parsed = z.string().uuid().safeParse(id);

  if (!parsed.success) {
    return { ok: false, error: "Employee not found." };
  }

  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/employees");
  revalidatePath("/projects");

  return { ok: true };
}
