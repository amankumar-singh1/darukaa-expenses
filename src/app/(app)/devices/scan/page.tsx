import { ScanLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeviceScanner } from "@/components/device-scanner";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Scan device",
};

export default function ScanDevicePage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Scan device"
        description="Scan a device's QR label to open it, then mark it occupied when it goes to the field and available when it comes back."
        action={
          <Link
            href="/devices"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to devices
          </Link>
        }
      />
      <DeviceScanner />
    </>
  );
}
