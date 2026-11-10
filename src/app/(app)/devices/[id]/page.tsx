import { ArrowLeft, Printer, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeviceQr } from "@/components/device-qr";
import { DeviceStatusActions } from "@/components/device-status-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
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
    .select("code, name, type, status, note, created_at, updated_at")
    .eq("code", code)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const device = data as {
    code: string;
    name: string;
    type: string;
    status: DeviceStatus;
    note: string | null;
    created_at: string;
    updated_at: string;
  };

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
            <Badge variant="outline">
              <QrCode className="h-3 w-3" />
              <span className="font-mono">{device.code}</span>
            </Badge>
            <Badge variant={STATUS_BADGE[device.status] ?? "default"}>
              {DEVICE_STATUS_LABELS[device.status] ?? device.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-forest-900 md:text-3xl">
            {device.name}
          </h1>
          <p className="mt-2 text-sm text-ink/50">{device.type}</p>
        </div>

        <Link
          href={`/devices/labels?code=${encodeURIComponent(device.code)}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <Printer className="h-4 w-4" />
          Print label
        </Link>
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
        <Card>
          <CardHeader>
            <CardTitle>Update status</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceStatusActions code={device.code} status={device.status} />
            <p className="mt-4 text-xs text-ink/60">
              Occupied = out in the field · Available = back in the office ·
              Damaged = needs repair
            </p>
          </CardContent>
        </Card>

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
