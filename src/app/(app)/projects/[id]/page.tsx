import { ArrowLeft, ChevronRight, FolderKanban } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deviceTypeIcon } from "@/components/device-type-icon";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
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
    .select("code, type, status")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("code");

  const devices = (data ?? []) as ProjectDevice[];

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
            {devices.length} {devices.length === 1 ? "device" : "devices"}{" "}
            deployed here
          </p>
        </div>
      </div>

      <Card>
        {devices.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-5 w-5" />}
            title="Nothing deployed here yet"
            description="Mark a device occupied and pick this project to see it listed here."
          />
        ) : (
          <ul className="divide-y divide-forest-900/8">
            {devices.map((device) => {
              const Icon = deviceTypeIcon(device.type);
              return (
                <li key={device.code}>
                  <Link
                    href={`/devices/${device.code}`}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-cream-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-semibold text-forest-900">
                        {device.code}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-ink/45">
                        {device.type}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[device.status] ?? "default"}>
                      {DEVICE_STATUS_LABELS[device.status] ?? device.status}
                    </Badge>
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
