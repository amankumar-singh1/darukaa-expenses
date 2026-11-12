"use client";

import { Loader2, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createBatch, updateBatch } from "@/app/(app)/batches/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BatchValues = {
  id: string;
  code: string;
  vendor_name: string;
  vendor_phone: string;
  starts_on: string;
  ends_on: string;
};

export function BatchForm({ batch }: { batch?: BatchValues }) {
  const router = useRouter();
  const editing = Boolean(batch);
  const [code, setCode] = useState(batch?.code ?? "");
  const [vendorName, setVendorName] = useState(batch?.vendor_name ?? "");
  const [vendorPhone, setVendorPhone] = useState(batch?.vendor_phone ?? "");
  const [startsOn, setStartsOn] = useState(batch?.starts_on ?? "");
  const [endsOn, setEndsOn] = useState(batch?.ends_on ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Give the batch a number.");
      return;
    }

    if (!vendorName.trim()) {
      setError("Add the vendor's name.");
      return;
    }

    if (!vendorPhone.trim()) {
      setError("Add the vendor's contact number.");
      return;
    }

    if (!startsOn || !endsOn) {
      setError("Pick the date the batch arrived and the date it goes back.");
      return;
    }

    if (endsOn < startsOn) {
      setError("The until date must be after the from date.");
      return;
    }

    setPending(true);
    const payload = { code, vendorName, vendorPhone, startsOn, endsOn };
    const result = batch
      ? await updateBatch(batch.id, payload)
      : await createBatch(payload);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success(
      editing ? `${code.toUpperCase()} updated.` : `${code.toUpperCase()} added.`,
    );

    if (editing) {
      router.refresh();
    } else {
      router.push("/batches");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="py-5">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="batch-code">Batch no.</Label>
              <Input
                id="batch-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="BATCH-01"
                maxLength={40}
                className="font-mono uppercase"
              />
            </div>

            <div>
              <Label htmlFor="batch-vendor">Vendor name</Label>
              <Input
                id="batch-vendor"
                value={vendorName}
                onChange={(event) => setVendorName(event.target.value)}
                placeholder="e.g. Sound Ecology Rentals"
                maxLength={120}
              />
            </div>

            <div>
              <Label htmlFor="batch-phone">Vendor contact</Label>
              <Input
                id="batch-phone"
                type="tel"
                value={vendorPhone}
                onChange={(event) => setVendorPhone(event.target.value)}
                placeholder="+91 98765 43210"
                maxLength={20}
              />
            </div>

            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="batch-starts">With us from</Label>
                <Input
                  id="batch-starts"
                  type="date"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="batch-ends">Until</Label>
                <Input
                  id="batch-ends"
                  type="date"
                  value={endsOn}
                  onChange={(event) => setEndsOn(event.target.value)}
                />
              </div>
            </div>
          </div>

          {editing ? (
            <p className="text-xs text-ink/60">
              To extend the rental, move the until date later and save.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs font-medium text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editing ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editing ? "Save changes" : "Add batch"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
