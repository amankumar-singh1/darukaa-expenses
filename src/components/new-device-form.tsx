"use client";

import { Loader2, Plus } from "lucide-react";
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

export function NewDeviceForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const finalType = type === "Other" ? customType.trim() : type;
    const result = await createDevice({ code, name, type: finalType });
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="AudioMoth #1 (green case)"
            />
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
