"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    gstin: formData.get("gstin"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Check your details.";
    redirect(`/settings?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: parsed.data.fullName || null,
    gstin: parsed.data.gstin,
  });

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
