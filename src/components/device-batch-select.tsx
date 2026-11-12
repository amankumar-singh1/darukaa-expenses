"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { updateDeviceBatch } from "@/app/(app)/devices/actions";
import { ThemedSelect } from "@/components/themed-select";
import { cn } from "@/lib/utils";

export function DeviceBatchSelect({
  code,
  batchId,
  batches,
}: {
  code: string;
  batchId: string | null;
  batches: { id: string; code: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(batchId ?? "");
  const [pending, setPending] = useState(false);

  async function onChange(next: string) {
    if (pending) return;
    const previous = value;
    setValue(next);
    setPending(true);
    const result = await updateDeviceBatch({
      code,
      batchId: next || null,
    });
    setPending(false);

    if (!result.ok) {
      setValue(previous);
      toast.error(result.error);
      return;
    }

    toast.success(
      next
        ? `${code} moved to ${batches.find((batch) => batch.id === next)?.code ?? "the batch"}.`
        : `${code} removed from its batch.`,
    );
    router.refresh();
  }

  return (
    <ThemedSelect
      value={value}
      onChange={onChange}
      options={[
        { value: "", label: "No batch" },
        ...batches.map((batch) => ({
          value: batch.id,
          label: batch.code,
        })),
      ]}
      placeholder="No batch"
      ariaLabel={`Batch for ${code}`}
      className={cn("w-full", pending && "opacity-60")}
    />
  );
}
