import {
  ChevronRight,
  Plus,
  QrCode,
  ScanLine,
  Tags,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AutoSubmitThemedSelect } from "@/components/auto-submit-themed-select";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import {
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_OPTIONS,
  DEVICE_STATUSES,
  type DeviceStatus,
} from "@/lib/validation";

export const metadata: Metadata = {
  title: "Devices",
};

export const dynamic = "force-dynamic";

type DeviceRow = {
  code: string;
  name: string;
  type: string;
  status: string;
  note: string | null;
};

const STATUS_BADGE: Record<DeviceStatus, "green" | "lime" | "danger"> = {
  available: "green",
  occupied: "lime",
  damaged: "danger",
};

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const query = (params.q ?? "").trim().toUpperCase();
  const statusFilter = params.status ?? "";

  const { data } = await supabase
    .from("devices")
    .select("code, name, type, status, note")
    .eq("user_id", user.id)
    .order("code")
    .limit(500);

  const devices = (data ?? []) as DeviceRow[];
  const counts = Object.fromEntries(
    DEVICE_STATUSES.map((status) => [
      status,
      devices.filter((device) => device.status === status).length,
    ]),
  ) as Record<DeviceStatus, number>;

  const filtered = devices.filter((device) => {
    if (statusFilter && device.status !== statusFilter) return false;
    if (
      query &&
      !device.code.includes(query) &&
      !device.name.toLowerCase().includes(query.toLowerCase()) &&
      !device.type.toLowerCase().includes(query.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Devices"
        description="Every Darukaa Earth device in one place. Print QR labels, stick them on the hardware, and scan them on your phone when they go out or come back."
        action={
          <>
            <Link
              href="/devices/labels"
              className={buttonVariants({ variant: "outline" })}
            >
              <Tags className="h-4 w-4" />
              Print labels
            </Link>
            <Link
              href="/devices/scan"
              className={buttonVariants({ variant: "secondary" })}
            >
              <ScanLine className="h-4 w-4" />
              Scan
            </Link>
            <Link
              href="/devices/new"
              className={buttonVariants({ variant: "primary" })}
            >
              <Plus className="h-4 w-4" />
              Add device
            </Link>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {DEVICE_STATUSES.map((status) => (
          <Link
            key={status}
            href={
              statusFilter === status
                ? "/devices"
                : `/devices?status=${status}`
            }
            className={`rounded-2xl border bg-white px-4 py-3 transition ${
              statusFilter === status
                ? "border-brand-600 ring-2 ring-brand-600/15"
                : "border-forest-900/10 hover:bg-cream-50"
            }`}
          >
            <p className="font-mono text-xl font-bold text-forest-900">
              {counts[status]}
            </p>
            <p className="text-[11px] font-semibold text-ink/45">
              {DEVICE_STATUS_LABELS[status]}
            </p>
          </Link>
        ))}
      </div>

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <QrCode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by ID, name, or type"
            className="pl-9"
            aria-label="Search devices"
          />
        </div>
        <AutoSubmitThemedSelect
          name="status"
          value={statusFilter}
          options={DEVICE_STATUS_OPTIONS}
          placeholder="All statuses"
          ariaLabel="Filter by status"
          className="sm:w-44"
        />
        <button type="submit" className="sr-only">
          Search
        </button>
        <Link href="/devices" className={buttonVariants({ variant: "outline" })}>
          Reset
        </Link>
      </form>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<QrCode className="h-5 w-5" />}
            title={devices.length === 0 ? "No devices yet" : "No matching devices"}
            description={
              devices.length === 0
                ? "Add your first device, then print its QR label and stick it on the hardware."
                : "Try a different search or clear the filters."
            }
            action={
              devices.length === 0 ? undefined : (
                <Link
                  href="/devices"
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
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-forest-900/8 bg-cream-50/60 text-[10px] uppercase tracking-[0.14em] text-ink/40">
                    <th className="px-5 py-3 font-semibold">Device ID</th>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/8">
                  {filtered.map((device) => (
                    <tr
                      key={device.code}
                      className="group transition hover:bg-cream-50"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-semibold text-forest-900">
                        {device.code}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/devices/${device.code}`}
                          className="block max-w-xs truncate text-sm font-semibold text-forest-900 group-hover:text-brand-700"
                        >
                          {device.name}
                        </Link>
                        {device.note && device.status === "damaged" ? (
                          <p className="mt-0.5 max-w-xs truncate text-[11px] text-danger">
                            {device.note}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-ink/55">
                        {device.type}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={STATUS_BADGE[device.status as DeviceStatus]}>
                          {DEVICE_STATUS_LABELS[device.status as DeviceStatus] ?? device.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5">
                        <Link
                          href={`/devices/${device.code}`}
                          aria-label={`Open ${device.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-ink/30 transition group-hover:bg-white group-hover:text-forest-900"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-forest-900/8 md:hidden">
              {filtered.map((device) => (
                <li key={device.code}>
                  <Link
                    href={`/devices/${device.code}`}
                    className="flex items-center gap-3 px-4 py-4 transition active:bg-cream-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-forest-900">
                        {device.name}
                      </p>
                      <p className="mt-1 flex items-center gap-2 font-mono text-[11px] text-ink/45">
                        {device.code}
                        <span className="h-1 w-1 rounded-full bg-ink/20" />
                        {device.type}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[device.status as DeviceStatus]}>
                      {DEVICE_STATUS_LABELS[device.status as DeviceStatus] ?? device.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink/25" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
