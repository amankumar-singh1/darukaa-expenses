"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemedSelect } from "@/components/themed-select";
import { updateDeviceStatus } from "@/app/(app)/devices/actions";
import type { DeviceStatus } from "@/lib/validation";

export function DeviceStatusActions({
  code,
  status,
  projectId,
  projects,
}: {
  code: string;
  status: DeviceStatus;
  projectId: string | null;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [showDamage, setShowDamage] = useState(false);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(projectId ?? "");
  const [pending, setPending] = useState<DeviceStatus | null>(null);

  async function setStatus(next: DeviceStatus, damageNote?: string) {
    if (next === "occupied" && !selected) {
      toast.error("Choose the project where this device is deployed.");
      return;
    }

    setPending(next);
    const result = await updateDeviceStatus({
      code,
      status: next,
      note: damageNote,
      projectId: next === "occupied" ? selected : null,
    });
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const projectName = projects.find((project) => project.id === selected)?.name;

    setShowDamage(false);
    setNote("");
    toast.success(
      next === "occupied"
        ? `Device marked occupied at ${projectName ?? "the project"}.`
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
      {status !== "occupied" ? (
        projects.length === 0 ? (
          <p className="rounded-xl border border-forest-900/10 bg-cream-50/60 px-4 py-3 text-xs text-ink/60">
            No projects yet.{" "}
            <Link href="/projects" className="font-semibold text-brand-700">
              Add a project
            </Link>{" "}
            before marking a device occupied.
          </p>
        ) : (
          <div className="rounded-xl border border-forest-900/10 bg-cream-50/60 p-4">
            <Label>Project</Label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <ThemedSelect
                value={selected}
                onChange={setSelected}
                options={projects.map((project) => ({
                  value: project.id,
                  label: project.name,
                }))}
                placeholder="Where is it deployed?"
                ariaLabel="Project"
                className="flex-1"
              />
              <Button
                onClick={() => setStatus("occupied")}
                disabled={pending !== null}
                className="shrink-0"
              >
                {pending === "occupied" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Mark occupied
              </Button>
            </div>
          </div>
        )
      ) : null}

      <div className="flex flex-wrap gap-2">
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
            className="border border-danger/30"
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
            maxLength={100}
          />
          <p className="text-xs text-ink/50">Describe within 100 characters.</p>
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
