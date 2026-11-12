"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { updateEmployeeProject } from "@/app/(app)/employees/actions";
import { ThemedSelect } from "@/components/themed-select";
import { cn } from "@/lib/utils";

export function EmployeeDeployment({
  employeeId,
  employeeName,
  projectId,
  projects,
  className,
}: {
  employeeId: string;
  employeeName: string;
  projectId: string | null;
  projects: { id: string; name: string }[];
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(projectId ?? "");
  const [pending, setPending] = useState(false);

  async function onChange(next: string) {
    if (pending) return;
    const previous = value;
    setValue(next);
    setPending(true);
    const result = await updateEmployeeProject({
      id: employeeId,
      projectId: next || null,
    });
    setPending(false);

    if (!result.ok) {
      setValue(previous);
      toast.error(result.error);
      return;
    }

    toast.success(
      next
        ? `${employeeName} deployed.`
        : `${employeeName} marked not deployed.`,
    );
    router.refresh();
  }

  return (
    <ThemedSelect
      value={value}
      onChange={onChange}
      options={[
        { value: "", label: "Not deployed" },
        ...projects.map((project) => ({
          value: project.id,
          label: project.name,
        })),
      ]}
      placeholder="Not deployed"
      ariaLabel={`Deployment for ${employeeName}`}
      className={cn("w-44 shrink-0", className, pending && "opacity-60")}
    />
  );
}
