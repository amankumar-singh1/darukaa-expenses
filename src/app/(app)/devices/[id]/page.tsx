import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteDeviceButton } from "@/components/delete-device-button";
import { DeviceBatchSelect } from "@/components/device-batch-select";
import { DeviceQr } from "@/components/device-qr";
import { DeviceStatusActions } from "@/components/device-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { embeddedName, embeddedOne, formatDay } from "@/lib/utils";
import {
  DEVICE_STATUS_LABELS,
  type DeviceStatus,
} from "@/lib/validation";

export const metadata: Metadata = {
  title: "Device",
};

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<DeviceStatus, "green" | "lime" | "danger"> = {
  available: "green",
  occupied: "lime",
  damaged: "danger",
};

export default async function DevicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const code = decodeURIComponent(id).toUpperCase();
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("devices")
    .select(
      "code, type, status, note, project_id, created_at, updated_at, projects(name), batches(id, code, vendor_name, starts_on, ends_on, vendor_phone)",
    )
    .eq("code", code)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const { data: projectData } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  const projects = (projectData ?? []) as { id: string; name: string }[];

  const { data: batchData } = await supabase
    .from("batches")
    .select("id, code")
    .eq("user_id", user.id)
    .order("code");

  const batchOptions = (batchData ?? []) as { id: string; code: string }[];

  const device = data as {
    code: string;
    type: string;
    status: DeviceStatus;
    note: string | null;
    project_id: string | null;
    projects: unknown;
    batches: unknown;
    created_at: string;
    updated_at: string;
  };

  const projectName = embeddedName(device.projects);
  const batch = embeddedOne<{
    id: string;
    code: string;
    vendor_name: string;
    starts_on: string;
    ends_on: string;
    vendor_phone: string;
  }>(device.batches);

  return (
    <>
      <Link
        href="/devices"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-forest-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to devices
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE[device.status] ?? "default"}>
              {DEVICE_STATUS_LABELS[device.status] ?? device.status}
            </Badge>
          </div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-forest-900 md:text-3xl">
            {device.code}
          </h1>
          <p className="mt-2 text-sm text-ink/50">{device.type}</p>
          <p className="mt-1 text-sm text-ink/50">
            {projectName ? (
              <>
                Deployed at{" "}
                <span className="font-semibold text-forest-900">
                  {projectName}
                </span>
              </>
            ) : (
              "Not deployed at any project"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DeleteDeviceButton code={device.code} status={device.status} />
        </div>
      </div>

      {device.status === "damaged" && device.note ? (
        <div className="mb-6 rounded-xl border border-danger/25 bg-danger-50/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-danger">
            Damage note
          </p>
          <p className="mt-1 text-sm text-forest-900">{device.note}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceStatusActions
                code={device.code}
                status={device.status}
                projectId={device.project_id}
                projects={projects}
              />
              <p className="mt-4 text-xs text-ink/60">
                Occupied = out in the field · Available = back in the office ·
                Damaged = needs repair
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceBatchSelect
                code={device.code}
                batchId={batch?.id ?? null}
                batches={batchOptions}
              />

              {batch ? (
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink/50">Vendor</dt>
                    <dd className="text-right text-forest-900">
                      {batch.vendor_name || "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink/50">With us</dt>
                    <dd className="text-right text-forest-900">
                      {formatDay(batch.starts_on)}
                      <span className="text-ink/40"> → </span>
                      {formatDay(batch.ends_on)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink/50">Vendor contact</dt>
                    <dd>
                      <a
                        href={`tel:${batch.vendor_phone.replace(/\s/g, "")}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {batch.vendor_phone}
                      </a>
                    </dd>
                  </div>
                </dl>
              ) : null}

              <p className="mt-3 text-xs text-ink/60">
                {batchOptions.length === 0 ? (
                  <>
                    No batches yet.{" "}
                    <Link
                      href="/batches/new"
                      className="font-semibold text-brand-700"
                    >
                      Add a batch
                    </Link>{" "}
                    to assign this device.
                  </>
                ) : (
                  "Pick the rental batch this device came with."
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:w-72">
          <CardHeader>
            <CardTitle>QR label</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <DeviceQr code={device.code} size={180} />
            <p className="text-center text-[11px] text-ink/50">
              Scanning opens this device on the phone it was scanned with.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
