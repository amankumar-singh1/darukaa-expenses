import type { Metadata } from "next";
import Link from "next/link";

import { DeviceQr } from "@/components/device-qr";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { embeddedOne } from "@/lib/utils";

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
    .select("code, batches(code)")
    .eq("user_id", user.id)
    .order("code")
    .limit(500);

  if (singleCode) {
    query = query.eq("code", singleCode);
  }

  const { data } = await query;
  const devices = (data ?? []) as { code: string; batches: unknown }[];

  return (
    <>
      {/* print: show only the label grid, as fixed-size cut-out cards */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print {
  aside, header, nav, .dot-grid, .print-hide { display: none !important; }
  main { padding-left: 0 !important; }
  .app-shell { padding: 0 !important; min-height: 0 !important; display: block !important; }
  .print-labels { display: grid !important; grid-template-columns: repeat(auto-fill, 40mm); gap: 6mm; padding: 6mm !important; justify-content: space-evenly; align-content: start; background: #fff !important; }
  .print-label { width: 40mm !important; height: 40mm !important; break-inside: avoid; page-break-inside: avoid; padding: 1.5mm !important; gap: 0.75mm !important; }
  .print-label img:first-of-type { width: 22mm !important; height: 22mm !important; }
  .print-label img:last-of-type { width: 18mm !important; height: auto !important; }
  .print-label p { line-height: 1.1 !important; }
}`,
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
          {devices.map((device) => {
            const batch =
              embeddedOne<{ code: string }>(device.batches)?.code ?? "";
            return (
              <div
                key={device.code}
                className="print-label flex flex-col items-center gap-2 rounded-xl border border-forest-900/15 bg-white py-4 text-center"
              >
                <DeviceQr code={device.code} size={110} />
                <p className="font-mono text-sm font-bold text-forest-900">
                  {device.code}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-ink/45">
                  {batch}
                </p>
                <Logo variant="dark" width={64} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
