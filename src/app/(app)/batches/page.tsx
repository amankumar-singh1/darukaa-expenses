import { Boxes, ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { formatDay } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Batches",
};

export const dynamic = "force-dynamic";

type BatchRow = {
  id: string;
  code: string;
  vendor_name: string;
  vendor_phone: string;
  starts_on: string;
  ends_on: string;
  devices: { count: number }[];
};

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.status ?? "";

  const { data } = await supabase
    .from("batches")
    .select(
      "id, code, vendor_name, vendor_phone, starts_on, ends_on, devices(count)",
    )
    .eq("user_id", user.id)
    .order("starts_on", { ascending: false });

  const batches = (data ?? []) as BatchRow[];
  const today = new Date().toISOString().slice(0, 10);

  const activeCount = batches.filter((batch) => batch.ends_on >= today).length;
  const expiredCount = batches.length - activeCount;

  const filtered = batches.filter((batch) => {
    if (statusFilter === "active" && batch.ends_on < today) return false;
    if (statusFilter === "expired" && batch.ends_on >= today) return false;
    if (query) {
      if (
        !batch.code.toLowerCase().includes(query) &&
        !batch.vendor_name.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  const tiles = [
    { key: "", label: "Batches", count: batches.length },
    { key: "active", label: "Active", count: activeCount },
    { key: "expired", label: "Expired", count: expiredCount },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Batches"
        description="Devices arrive from the vendor in batches and go back in batches. Record the vendor and the rental period, then pick the batch when adding a device."
        action={
          <Link
            href="/batches/new"
            className={buttonVariants({ variant: "primary" })}
          >
            <Plus className="h-4 w-4" />
            Add batch
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {tiles.map((tile) => {
          const active = statusFilter === tile.key;
          return (
            <Link
              key={tile.label}
              href={
                active || !tile.key
                  ? "/batches"
                  : `/batches?status=${tile.key}`
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
        {statusFilter ? (
          <input type="hidden" name="status" value={statusFilter} />
        ) : null}
        <div className="relative flex-1">
          <Boxes className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by batch no. or vendor"
            className="pl-9"
            aria-label="Search batches"
          />
        </div>
        <button type="submit" className="sr-only">
          Search
        </button>
        <Link href="/batches" className={buttonVariants({ variant: "outline" })}>
          Reset
        </Link>
      </form>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-5 w-5" />}
            title={batches.length === 0 ? "No batches yet" : "No matching batches"}
            description={
              batches.length === 0
                ? "Add the first batch — you'll pick it when registering the devices that came with it."
                : "Try a different search or clear the filters."
            }
            action={
              batches.length === 0 ? (
                <Link
                  href="/batches/new"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Add batch
                </Link>
              ) : (
                <Link
                  href="/batches"
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
                      Batch no.
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Vendor
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      From
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Until
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Devices
                    </th>
                    <th className="w-20 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/8">
                  {filtered.map((batch) => {
                    const expired = batch.ends_on < today;
                    const count = batch.devices?.[0]?.count ?? 0;
                    return (
                      <tr
                        key={batch.id}
                        className="group relative cursor-pointer transition hover:bg-cream-50"
                      >
                        <td className="w-20 py-3 pl-5 pr-2 text-center">
                          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                            <Boxes className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="truncate px-5 py-3.5 text-center font-mono text-xs font-semibold text-forest-900">
                          <Link
                            href={`/batches/${batch.id}`}
                            aria-label={`Open ${batch.code}`}
                            className="absolute inset-0"
                          >
                            <span className="sr-only">Open {batch.code}</span>
                          </Link>
                          {batch.code}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <p className="truncate text-sm text-ink/55">
                            {batch.vendor_name || "—"}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[10px] text-ink/40">
                            {batch.vendor_phone}
                          </p>
                        </td>
                        <td className="truncate px-5 py-3.5 text-center text-xs text-ink/55">
                          {formatDay(batch.starts_on)}
                        </td>
                        <td className="truncate px-5 py-3.5 text-center text-xs text-ink/55">
                          {formatDay(batch.ends_on)}
                        </td>
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <Badge variant={expired ? "danger" : "green"}>
                            {expired ? "Expired" : "Active"}
                          </Badge>
                        </td>
                        <td className="truncate px-5 py-3.5 text-center text-xs text-ink/55">
                          {count}
                        </td>
                        <td className="w-20 py-3.5 pl-2 pr-5 text-center">
                          <Link
                            href={`/batches/${batch.id}`}
                            aria-label={`Open ${batch.code}`}
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
              {filtered.map((batch) => {
                const expired = batch.ends_on < today;
                const count = batch.devices?.[0]?.count ?? 0;
                return (
                  <li key={batch.id}>
                    <Link
                      href={`/batches/${batch.id}`}
                      className="flex items-center gap-3 px-4 py-4 transition active:bg-cream-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                        <Boxes className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm font-semibold text-forest-900">
                          {batch.code}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-ink/45">
                          {batch.vendor_name || "Vendor not set"} · {count}{" "}
                          {count === 1 ? "device" : "devices"}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-ink/45">
                          {formatDay(batch.starts_on)} →{" "}
                          {formatDay(batch.ends_on)}
                        </p>
                      </div>
                      <Badge variant={expired ? "danger" : "green"}>
                        {expired ? "Expired" : "Active"}
                      </Badge>
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
