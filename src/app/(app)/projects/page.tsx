import { ChevronRight, FolderKanban } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { createProject } from "./actions";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Projects",
};

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  devices: { count: number }[];
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;

  const { data } = await supabase
    .from("projects")
    .select("id, name, devices(count)")
    .eq("user_id", user.id)
    .order("name");

  const projects = (data ?? []) as ProjectRow[];

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Projects"
        description="The sites your devices get deployed to. Add a project here, then pick it when you mark a device occupied."
      />

      {params.error ? (
        <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger">
          {params.error}
        </div>
      ) : null}

      <Card className="mb-6">
        <form action={createProject}>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="name">New project</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={80}
                placeholder="e.g. Western Ghats acoustic survey"
              />
            </div>
            <SubmitButton>Add project</SubmitButton>
          </div>
        </form>
      </Card>

      <Card>
        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-5 w-5" />}
            title="No projects yet"
            description="Add your first project above. Devices marked occupied will point at it."
          />
        ) : (
          <ul className="divide-y divide-forest-900/8">
            {projects.map((project) => {
              const count = project.devices?.[0]?.count ?? 0;
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-cream-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-forest-900">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink/45">
                        {count} {count === 1 ? "device" : "devices"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink/25" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
