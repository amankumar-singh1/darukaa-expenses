import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BatchForm } from "@/components/batch-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { formatDay } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Batch",
};

export const dynamic = "force-dynamic";

export default async function BatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: batch } = await supabase
    .from("batches")
    .select(
      "id, code, vendor_name, vendor_phone, starts_on, ends_on, devices(count)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!batch) {
    notFound();
  }

  const count = batch.devices?.[0]?.count ?? 0;
  const expired = batch.ends_on < new Date().toISOString().slice(0, 10);

  return (
    <>
      <Link
        href="/batches"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-forest-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to batches
      </Link>

      <PageHeader
        eyebrow="Operations"
        title={batch.code}
        description={`${batch.vendor_name || "Vendor not set"} · ${formatDay(batch.starts_on)} → ${formatDay(batch.ends_on)} · ${count} ${count === 1 ? "device" : "devices"} · ${expired ? "Expired" : "Active"}`}
      />

      <BatchForm batch={batch} />
    </>
  );
}
