import { ArrowLeft, ChevronRight, FolderKanban, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deviceTypeIcon } from "@/components/device-type-icon";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { embeddedOne, formatDay, initials } from "@/lib/utils";
import {
  DEVICE_STATUS_LABELS,
  type DeviceStatus,
} from "@/lib/validation";

export const metadata: Metadata = {
  title: "Project",
};

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<DeviceStatus, "green" | "lime" | "danger"> = {
  available: "green",
  occupied: "lime",
  damaged: "danger",
};

type ProjectDevice = {
  code: string;
  type: string;
  status: DeviceStatus;
  batches: unknown;
};

type ProjectEmployee = {
  id: string;
  name: string;
  joined_on: string;
  leaves_on: string | null;
  is_full_time: boolean;
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  const { data } = await supabase
    .from("devices")
    .select("code, type, status, batches(code)")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("code");

  const devices = (data ?? []) as ProjectDevice[];

  const { data: peopleData } = await supabase
    .from("employees")
    .select("id, name, joined_on, leaves_on, is_full_time")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("name");

  // Only people still with us count as working here, same as the project list.
  const today = new Date().toISOString().slice(0, 10);
  const employees = ((peopleData ?? []) as ProjectEmployee[]).filter(
    (employee) => !employee.leaves_on || employee.leaves_on >= today,
  );

  return (
    <>
      <Link
        href="/projects"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-forest-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to projects
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-900 md:text-3xl">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {devices.length} {devices.length === 1 ? "device" : "devices"} ·{" "}
            {employees.length} {employees.length === 1 ? "person" : "people"}{" "}
            deployed here
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <h2 className="text-sm font-semibold text-forest-900">Devices</h2>
          <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-semibold text-ink/55">
            {devices.length}
          </span>
        </div>

        {devices.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-5 w-5" />}
            title="No devices here yet"
            description="Mark a device occupied and pick this project to see it here."
          />
        ) : (
          <div className="grid gap-3 border-t border-forest-900/8 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {devices.map((device) => {
              const Icon = deviceTypeIcon(device.type);
              const batch = embeddedOne<{ code: string }>(device.batches)?.code;
              return (
                <Link
                  key={device.code}
                  href={`/devices/${device.code}`}
                  className="rounded-xl border border-forest-900/10 p-4 transition hover:border-brand-600/40 hover:bg-cream-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant={STATUS_BADGE[device.status] ?? "default"}>
                      {DEVICE_STATUS_LABELS[device.status] ?? device.status}
                    </Badge>
                  </div>
                  <p className="mt-3 truncate font-mono text-sm font-semibold text-forest-900">
                    {device.code}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-ink/45">
                    {device.type}
                    {batch ? ` · ${batch}` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <h2 className="text-sm font-semibold text-forest-900">People</h2>
          <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-semibold text-ink/55">
            {employees.length}
          </span>
        </div>

        {employees.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No one deployed here yet"
            description="Open an employee and pick this project to see them here."
          />
        ) : (
          <div className="grid gap-3 border-t border-forest-900/8 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {employees.map((employee) => (
              <Link
                key={employee.id}
                href={`/employees/${employee.id}`}
                className="flex items-center gap-3 rounded-xl border border-forest-900/10 p-4 transition hover:border-brand-600/40 hover:bg-cream-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                  {initials(employee.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forest-900">
                    {employee.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-ink/45">
                    {employee.is_full_time
                      ? "Full time"
                      : employee.leaves_on
                        ? `Until ${formatDay(employee.leaves_on)}`
                        : `Joined ${formatDay(employee.joined_on)}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink/25" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
