"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createEmployee } from "@/app/(app)/employees/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemedSelect } from "@/components/themed-select";

export function NewEmployeeForm({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [joinedOn, setJoinedOn] = useState("");
  const [leavesOn, setLeavesOn] = useState("");
  const [fullTime, setFullTime] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Give the employee a name.");
      return;
    }

    if (!phone.trim()) {
      setError("Add a contact number.");
      return;
    }

    if (!joinedOn) {
      setError("Pick the joining date.");
      return;
    }

    if (!fullTime && !leavesOn) {
      setError("Add a leaving date, or mark them full time.");
      return;
    }

    setPending(true);
    const result = await createEmployee({
      name,
      phone,
      joinedOn,
      isFullTime: fullTime,
      leavesOn: fullTime ? null : leavesOn,
      projectId: projectId || null,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success(`${name.trim()} added to the team.`);
    setName("");
    setPhone("");
    setJoinedOn("");
    setLeavesOn("");
    setFullTime(false);
    setProjectId("");
    router.push("/employees");
  }

  return (
    <Card className="mb-6">
      <CardContent className="py-5">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="employee-name">Name</Label>
              <Input
                id="employee-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Ravi Kumar"
                maxLength={120}
              />
            </div>

            <div>
              <Label htmlFor="employee-phone">Contact number</Label>
              <Input
                id="employee-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                maxLength={20}
              />
            </div>

            <div>
              <Label htmlFor="employee-joined">Joined on</Label>
              <Input
                id="employee-joined"
                type="date"
                value={joinedOn}
                onChange={(event) => setJoinedOn(event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="employee-leaves">Leaving on</Label>
              {fullTime ? (
                <p className="flex h-10 items-center rounded-lg border border-forest-900/10 bg-cream-50/60 px-3 text-sm text-ink/50">
                  Full time — no leaving date
                </p>
              ) : (
                <Input
                  id="employee-leaves"
                  type="date"
                  value={leavesOn}
                  onChange={(event) => setLeavesOn(event.target.value)}
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-forest-900">
                <input
                  type="checkbox"
                  checked={fullTime}
                  onChange={(event) => {
                    setFullTime(event.target.checked);
                    if (event.target.checked) setLeavesOn("");
                  }}
                  className="h-4 w-4 accent-brand-600"
                />
                Full time employee
              </label>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="employee-project">Project</Label>
              <ThemedSelect
                id="employee-project"
                value={projectId}
                onChange={setProjectId}
                options={[
                  { value: "", label: "Not deployed" },
                  ...projects.map((project) => ({
                    value: project.id,
                    label: project.name,
                  })),
                ]}
                placeholder="Not deployed"
                ariaLabel="Project"
              />
              <p className="mt-1.5 text-xs text-ink/60">
                Optional — leave as not deployed until they are assigned.
              </p>
            </div>
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
            Add employee
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
