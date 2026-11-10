import type { Metadata } from "next";
import Link from "next/link";

import { DeviceQr } from "@/components/device-qr";
import { PrintButton } from "@/components/print-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Device labels",
};

export const dynamic = "force-dynamic";

export default async function DeviceLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const singleCode = (params.code ?? "").trim().toUpperCase();

  let query = supabase
    .from("devices")
    .select("code, name, type")
    .eq("user_id", user.id)
    .order("code")
    .limit(500);

  if (singleCode) {
    query = query.eq("code", singleCode);
  }

  const { data } = await query;
  const devices = (data ?? []) as { code: string; name: string; type: string }[];

  return (
    <>
      {/* print: show only the label grid */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print { body * { visibility: hidden !important; } .print-labels, .print-labels * { visibility: visible !important; } .print-labels { position: absolute; inset: 0; padding: 8mm; } .print-label { break-inside: avoid; } }`,
        }}
      />

      <div className="print-hide">
        <PageHeader
          eyebrow="Operations"
          title="QR labels"
          description="Print on sticker paper, cut, and laminate before sticking on hardware — field labels fade fast."
          action={
            <>
              <Link
                href="/devices"
                className={buttonVariants({ variant: "outline" })}
              >
                Back to devices
              </Link>
              {devices.length > 0 ? <PrintButton /> : null}
            </>
          }
        />
      </div>

      {devices.length === 0 ? (
        <Card>
          <EmptyState
            icon={<span className="text-lg">🏷️</span>}
            title="Nothing to print"
            description={
              singleCode
                ? `No device with ID ${singleCode}. Check the ID and try again.`
                : "Add devices first — their labels will show up here."
            }
          />
        </Card>
      ) : (
        <div className="print-labels grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {devices.map((device) => (
            <div
              key={device.code}
              className="print-label flex flex-col items-center gap-2 rounded-xl border border-forest-900/15 bg-white px-3 py-4 text-center"
            >
              <DeviceQr code={device.code} size={110} />
              <p className="font-mono text-sm font-bold text-forest-900">
                {device.code}
              </p>
              <p className="text-[10px] leading-tight text-ink/55">
                {device.name} · {device.type}
              </p>
              <p className="text-[8px] uppercase tracking-widest text-ink/35">
                Darukaa Earth
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
