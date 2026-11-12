import { ChevronRight, Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { embeddedName, formatDay, initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Employees",
};

export const dynamic = "force-dynamic";

type EmployeeRow = {
  id: string;
  name: string;
  phone: string;
  joined_on: string;
  leaves_on: string | null;
  is_full_time: boolean;
  project_id: string | null;
  projects: unknown;
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; deployment?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const deploymentFilter = params.deployment ?? "";

  const { data } = await supabase
    .from("employees")
    .select(
      "id, name, phone, joined_on, leaves_on, is_full_time, project_id, projects(name)",
    )
    .eq("user_id", user.id)
    .order("name");

  const employees = (data ?? []) as EmployeeRow[];

  const deployedCount = employees.filter(
    (employee) => employee.project_id,
  ).length;
  const notDeployedCount = employees.length - deployedCount;

  const filtered = employees.filter((employee) => {
    if (deploymentFilter === "deployed" && !employee.project_id) return false;
    if (deploymentFilter === "not" && employee.project_id) return false;
    if (query) {
      const needle = query.toLowerCase();
      if (
        !employee.name.toLowerCase().includes(needle) &&
        !employee.phone.includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  const tiles = [
    { key: "", label: "Team", count: employees.length },
    { key: "deployed", label: "Deployed", count: deployedCount },
    { key: "not", label: "Not deployed", count: notDeployedCount },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Employees"
        description="People on the team, when they joined and when they leave. Open someone to change the project they are deployed to."
        action={
          <Link
            href="/employees/new"
            className={buttonVariants({ variant: "primary" })}
          >
            <Plus className="h-4 w-4" />
            Add employee
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {tiles.map((tile) => {
          const active = deploymentFilter === tile.key;
          return (
            <Link
              key={tile.label}
              href={
                active || !tile.key
                  ? "/employees"
                  : `/employees?deployment=${tile.key}`
              }
              className={`rounded-2xl border bg-white px-4 py-3 transition ${
                active
                  ? "border-brand-600 ring-2 ring-brand-600/15"
                  : "border-forest-900/10 hover:bg-cream-50"
              }`}
            >
              <p className="font-mono text-xl font-bold text-forest-900">
                {tile.count}
              </p>
              <p className="text-[11px] font-semibold text-ink/45">
                {tile.label}
              </p>
            </Link>
          );
        })}
      </div>

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        {deploymentFilter ? (
          <input type="hidden" name="deployment" value={deploymentFilter} />
        ) : null}
        <div className="relative flex-1">
          <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by name or number"
            className="pl-9"
            aria-label="Search employees"
          />
        </div>
        <button type="submit" className="sr-only">
          Search
        </button>
        <Link
          href="/employees"
          className={buttonVariants({ variant: "outline" })}
        >
          Reset
        </Link>
      </form>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={
              employees.length === 0 ? "No employees yet" : "No matching people"
            }
            description={
              employees.length === 0
                ? "Add your first team member — full-time staff don't need a leaving date."
                : "Try a different search or clear the filters."
            }
            action={
              employees.length === 0 ? (
                <Link
                  href="/employees/new"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Add employee
                </Link>
              ) : (
                <Link
                  href="/employees"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Clear filters
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-t-2xl md:block">
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="border-b border-forest-900/8 bg-cream-50/60 text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    <th className="w-20 px-3 py-3" />
                    <th className="px-5 py-3 text-center font-semibold">
                      Employee
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Contact
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Project
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Joined
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Leaving
                    </th>
                    <th className="w-20 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/8">
                  {filtered.map((employee) => {
                    const projectName = embeddedName(employee.projects);
                    return (
                      <tr
                        key={employee.id}
                        className="group relative cursor-pointer transition hover:bg-cream-50"
                      >
                        <td className="w-20 py-3 pl-5 pr-2 text-center">
                          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                            {initials(employee.name)}
                          </div>
                        </td>
                        <td className="truncate px-5 py-3.5 text-center text-sm font-semibold text-forest-900">
                          <Link
                            href={`/employees/${employee.id}`}
                            aria-label={`Open ${employee.name}`}
                            className="absolute inset-0"
                          >
                            <span className="sr-only">
                              Open {employee.name}
                            </span>
                          </Link>
                          {employee.name}
                        </td>
                        <td className="truncate px-5 py-3.5 text-center font-mono text-xs text-ink/55">
                          {employee.phone}
                        </td>
                        <td className="truncate px-5 py-3.5 text-center text-sm text-ink/55">
                          {projectName ?? (
                            <span className="text-ink/35">Not deployed</span>
                          )}
                        </td>
                        <td className="truncate px-5 py-3.5 text-center text-xs text-ink/55">
                          {formatDay(employee.joined_on)}
                        </td>
                        <td className="truncate px-5 py-3.5 text-center text-xs text-ink/55">
                          {employee.is_full_time
                            ? "Full time"
                            : employee.leaves_on
                              ? formatDay(employee.leaves_on)
                              : "—"}
                        </td>
                        <td className="w-20 py-3.5 pl-2 pr-5 text-center">
                          <Link
                            href={`/employees/${employee.id}`}
                            aria-label={`Open ${employee.name}`}
                            className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink/30 transition group-hover:bg-white group-hover:text-forest-900"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-forest-900/8 md:hidden">
              {filtered.map((employee) => {
                const projectName = embeddedName(employee.projects);
                return (
                  <li key={employee.id}>
                    <Link
                      href={`/employees/${employee.id}`}
                      className="flex items-center gap-3 px-4 py-4 transition active:bg-cream-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                        {initials(employee.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-forest-900">
                          {employee.name}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-ink/45">
                          {employee.phone}
                          {employee.is_full_time
                            ? " · Full time"
                            : employee.leaves_on
                              ? ` · Leaves ${formatDay(employee.leaves_on)}`
                              : ""}
                        </p>
                        <p
                          className={`mt-0.5 truncate text-[11px] font-medium ${
                            projectName ? "text-brand-700" : "text-ink/40"
                          }`}
                        >
                          {projectName ?? "Not deployed"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink/25" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
