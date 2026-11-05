import { Tags } from "lucide-react";
import type { Metadata } from "next";

import { createCategory, setCategoryArchived } from "./actions";
import { DeleteCategoryButton } from "@/components/delete-category-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import type { Category } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Categories",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;

  const { data } = await supabase
    .from("categories")
    .select("id, name, color, is_archived")
    .eq("user_id", user.id)
    .order("is_archived")
    .order("name");

  const categories = (data ?? []) as Category[];

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Categories"
        description="Categories make your monthly totals meaningful. Archive one to hide it from new expenses, or delete it; past expenses keep their records and become uncategorised."
      />

      {params.saved ? (
        <div className="mb-4 rounded-lg border border-brand-600/20 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Category saved.
        </div>
      ) : null}

      {params.error ? (
        <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger">
          {params.error}
        </div>
      ) : null}

      <Card className="mb-6">
        <form action={createCategory}>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="name">New category</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={40}
                placeholder="e.g. Travel, Software, Client meals"
              />
            </div>

            <div>
              <Label>Colour</Label>
              <div className="flex h-10 items-center gap-2">
                {CATEGORY_COLORS.map((color, index) => (
                  <label key={color} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      defaultChecked={index === 0}
                      className="peer sr-only"
                    />
                    <span
                      className="block h-6 w-6 rounded-full ring-offset-2 ring-offset-white transition peer-checked:ring-2 peer-checked:ring-forest-900"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <SubmitButton className="sm:mb-0">Add category</SubmitButton>
          </div>
        </form>
      </Card>

      <Card>
        {categories.length === 0 ? (
          <EmptyState
            icon={<Tags className="h-5 w-5" />}
            title="No categories yet"
            description="Add your first category above. Default categories are created automatically with your account."
          />
        ) : (
          <ul className="divide-y divide-forest-900/8">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <p className="truncate text-sm font-medium text-forest-900">
                    {category.name}
                  </p>
                  {category.is_archived ? (
                    <Badge variant="default">Archived</Badge>
                  ) : null}
                </div>

                <div className="ml-auto flex w-full shrink-0 flex-wrap items-center justify-end gap-1 sm:w-auto">
                  <form action={setCategoryArchived}>
                    <input type="hidden" name="id" value={category.id} />
                    <input
                      type="hidden"
                      name="archived"
                      value={category.is_archived ? "false" : "true"}
                    />
                    <SubmitButton variant="ghost" size="sm">
                      {category.is_archived ? "Restore" : "Archive"}
                    </SubmitButton>
                  </form>

                  <DeleteCategoryButton
                    categoryId={category.id}
                    categoryName={category.name}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
