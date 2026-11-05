"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteExpense } from "@/app/(app)/expenses/actions";
import { Button } from "@/components/ui/button";

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteExpense(expenseId);

    if (!result.ok) {
      toast.error(result.error);
      setPending(false);
      return;
    }

    toast.success("Expense deleted");
    router.replace("/expenses");
    router.refresh();
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="danger-ghost"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Confirm delete
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Cancel
      </Button>
    </div>
  );
}
