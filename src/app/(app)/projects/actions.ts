"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = projectSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Check the project.";
    redirect(`/projects?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    name: parsed.data.name,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "You already have a project with that name."
        : error.message;
    redirect(`/projects?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/projects");
  redirect("/projects?saved=1");
}
