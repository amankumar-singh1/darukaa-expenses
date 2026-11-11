"use client";

import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createDevice } from "@/app/(app)/devices/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemedSelect } from "@/components/themed-select";
import { DEVICE_TYPE_OPTIONS } from "@/lib/validation";

export function NewDeviceForm({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [deployed, setDeployed] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (deployed && !projectId) {
      setError("Choose the project where the device is already deployed.");
      return;
    }

    setPending(true);
    const finalType = type === "Other" ? customType.trim() : type;
    const result = await createDevice({
      code,
      type: finalType,
      projectId: deployed ? projectId : null,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success(`${result.code} registered.`);
    router.push(`/devices/${result.code}`);
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="py-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="code">Device ID</Label>
            <Input
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="AUDIO-001"
              autoCapitalize="characters"
              className="font-mono uppercase"
            />
            <p className="mt-1.5 text-xs text-ink/60">
              This is what goes inside the QR — pick a short ID you can read off
              the hardware.
            </p>
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <ThemedSelect
              id="type"
              value={type}
              onChange={setType}
              options={DEVICE_TYPE_OPTIONS}
              placeholder="Select device type"
              ariaLabel="Device type"
            />
            {type === "Other" ? (
              <div className="mt-2">
                <Input
                  value={customType}
                  onChange={(event) => setCustomType(event.target.value)}
                  placeholder="What kind of device is it?"
                  aria-label="Custom device type"
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-forest-900/10 bg-cream-50/60 p-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-forest-900">
              <input
                type="checkbox"
                checked={deployed}
                onChange={(event) => {
                  setDeployed(event.target.checked);
                  if (!event.target.checked) setProjectId("");
                }}
                className="h-4 w-4 accent-brand-600"
              />
              Already deployed?
            </label>
            <p className="mt-1 pl-6 text-xs text-ink/60">
              Tick this if the device is already out in the field. It will be
              saved as Occupied at the project you pick.
            </p>

            {deployed ? (
              <div className="mt-3">
                {projects.length === 0 ? (
                  <p className="text-xs text-ink/60">
                    No projects yet.{" "}
                    <Link href="/projects" className="font-semibold text-brand-700">
                      Add a project
                    </Link>{" "}
                    first.
                  </p>
                ) : (
                  <>
                    <Label htmlFor="project">Project</Label>
                    <ThemedSelect
                      id="project"
                      value={projectId}
                      onChange={setProjectId}
                      options={projects.map((project) => ({
                        value: project.id,
                        label: project.name,
                      }))}
                      placeholder="Select project"
                      ariaLabel="Project"
                    />
                  </>
                )}
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs font-medium text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add device
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
