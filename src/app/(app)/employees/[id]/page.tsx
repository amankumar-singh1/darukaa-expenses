import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployeeDeployment } from "@/components/employee-deployment";
import { DeleteEmployeeButton } from "@/components/delete-employee-button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { embeddedName, formatDay } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Employee",
};

export const dynamic = "force-dynamic";

export default async function EmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: employee } = await supabase
    .from("employees")
    .select(
      "id, name, phone, joined_on, leaves_on, is_full_time, project_id, projects(name)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!employee) {
    notFound();
  }

  const { data: projectData } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  const projects = (projectData ?? []) as { id: string; name: string }[];
  const projectName = embeddedName(employee.projects);

  return (
    <>
      <Link
        href="/employees"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 transition hover:text-forest-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Employees
      </Link>

      <PageHeader
        eyebrow="Projects"
        title={employee.name}
        description={`${projectName ?? "Not deployed"} · Joined ${formatDay(employee.joined_on)}`}
        action={
          <DeleteEmployeeButton
            id={employee.id}
            name={employee.name}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink/50">Contact</dt>
                <dd>
                  <a
                    href={`tel:${employee.phone.replace(/\s/g, "")}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {employee.phone}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink/50">Joined on</dt>
                <dd className="text-forest-900">
                  {formatDay(employee.joined_on)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink/50">Employment</dt>
                <dd className="text-forest-900">
                  {employee.is_full_time
                    ? "Full time"
                    : employee.leaves_on
                      ? `Leaving ${formatDay(employee.leaves_on)}`
                      : "No leaving date"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:w-80">
          <CardHeader>
            <CardTitle>Deployment</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeDeployment
              employeeId={employee.id}
              employeeName={employee.name}
              projectId={employee.project_id}
              projects={projects}
              className="w-full"
            />
            <p className="mt-3 text-xs text-ink/60">
              Pick the project this person is working on. “Not deployed” keeps
              them on the team but off-site.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
