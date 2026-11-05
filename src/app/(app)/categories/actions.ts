"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";

export async function createCategory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Check the category.";
    redirect(`/categories?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: parsed.data.name,
    color: parsed.data.color,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "You already have a category with that name."
        : error.message;
    redirect(`/categories?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/categories");
  redirect("/categories?saved=1");
}

type DeleteCategoryResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteCategory(
  id: string,
): Promise<DeleteCategoryResult> {
  const { supabase, user } = await requireUser();

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, error: "Invalid category reference." };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");

  return { ok: true };
}

export async function setCategoryArchived(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const archived = formData.get("archived") === "true";

  if (!id) {
    redirect("/categories");
  }

  await supabase
    .from("categories")
    .update({ is_archived: archived })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/categories");
  redirect("/categories");
}
