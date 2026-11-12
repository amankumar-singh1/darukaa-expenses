import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { NewEmployeeForm } from "@/components/new-employee-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Add employee",
};

export default async function NewEmployeePage() {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  const projects = (data ?? []) as { id: string; name: string }[];

  return (
    <>
      <Link
        href="/employees"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-forest-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to employees
      </Link>

      <PageHeader
        eyebrow="Projects"
        title="Add employee"
        description="Record who joined, their contact number, and when they leave. Tick full time if there is no leaving date."
      />

      <NewEmployeeForm projects={projects} />
    </>
  );
}
