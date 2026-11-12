import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BatchForm } from "@/components/batch-form";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Add batch",
};

export default function NewBatchPage() {
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
        title="Add batch"
        description="Record who the devices are rented from, their contact number, and how long the batch stays with us."
      />

      <BatchForm />
    </>
  );
}
