import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { NewDeviceForm } from "@/components/new-device-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Add device",
};

export default async function NewDevicePage() {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  const projects = (data ?? []) as { id: string; name: string }[];

  const { data: batchData } = await supabase
    .from("batches")
    .select("id, code")
    .eq("user_id", user.id)
    .order("code");

  const batches = (batchData ?? []) as { id: string; code: string }[];

  return (
    <>
      <Link
        href="/devices"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-forest-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to devices
      </Link>

      <PageHeader
        eyebrow="Operations"
        title="Add device"
        description="Register a device, print its QR label, and stick the label on the hardware. The QR opens this device's page when scanned."
      />

      <NewDeviceForm projects={projects} batches={batches} />
    </>
  );
}
