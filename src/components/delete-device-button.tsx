"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteDevice } from "@/app/(app)/devices/actions";
import { Button } from "@/components/ui/button";

export function DeleteDeviceButton({ code }: { code: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteDevice(code);

    if (!result.ok) {
      toast.error(result.error);
      setPending(false);
      return;
    }

    toast.success(`${code} deleted`);
    router.replace("/devices");
    router.refresh();
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-danger/30 text-danger hover:bg-danger-50 hover:text-danger"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="danger"
        onClick={handleDelete}
        disabled={pending}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Confirm delete
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Cancel
      </Button>
    </div>
  );
}
