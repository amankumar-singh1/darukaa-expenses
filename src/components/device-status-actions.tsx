"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateDeviceStatus } from "@/app/(app)/devices/actions";
import type { DeviceStatus } from "@/lib/validation";

export function DeviceStatusActions({
  code,
  status,
}: {
  code: string;
  status: DeviceStatus;
}) {
  const router = useRouter();
  const [showDamage, setShowDamage] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<DeviceStatus | null>(null);

  async function setStatus(next: DeviceStatus, damageNote?: string) {
    setPending(next);
    const result = await updateDeviceStatus({
      code,
      status: next,
      note: damageNote,
    });
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setShowDamage(false);
    setNote("");
    toast.success(
      next === "occupied"
        ? "Device marked occupied — out in the field."
        : next === "available"
          ? "Device marked available — back in the office."
          : "Device marked damaged.",
    );
    router.refresh();
  }

  async function confirmDamage() {
    if (!note.trim()) {
      toast.error("Add a short note about the damage.");
      return;
    }
    await setStatus("damaged", note.trim());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {status !== "occupied" ? (
          <Button
            onClick={() => setStatus("occupied")}
            disabled={pending !== null}
          >
            {pending === "occupied" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Mark occupied
          </Button>
        ) : null}

        {status !== "available" ? (
          <Button
            variant="outline"
            onClick={() => setStatus("available")}
            disabled={pending !== null}
          >
            {pending === "available" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {status === "damaged" ? "Mark repaired" : "Mark available"}
          </Button>
        ) : null}

        {status !== "damaged" ? (
          <Button
            variant="danger-ghost"
            onClick={() => setShowDamage((open) => !open)}
            disabled={pending !== null}
          >
            Mark damaged
          </Button>
        ) : null}
      </div>

      {showDamage && status !== "damaged" ? (
        <div className="space-y-2 rounded-xl border border-danger/25 bg-danger-50/50 p-4">
          <Label htmlFor="damage-note">What happened?</Label>
          <Textarea
            id="damage-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. housing cracked, mic torn during retrieval"
            rows={3}
          />
          <Button
            variant="danger"
            size="sm"
            onClick={confirmDamage}
            disabled={pending !== null}
          >
            {pending === "damaged" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Confirm damage
          </Button>
        </div>
      ) : null}
    </div>
  );
}
