"use client";

import { ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Scanner = {
  start: (
    camera: { facingMode: string },
    config: { fps: number; qrbox: number },
    onSuccess: (decodedText: string) => void,
    onError: () => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

// Camera only works on HTTPS (or localhost) — the Vercel deploy provides it.
export function DeviceScanner() {
  const router = useRouter();
  const scannerRef = useRef<Scanner | null>(null);
  const startRef = useRef<Promise<void> | null>(null);
  const foundRef = useRef(false);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode("device-scan-region") as unknown as Scanner;
        scannerRef.current = scanner;
        const started = scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decoded) => {
            if (foundRef.current) return;
            foundRef.current = true;
            // QRs contain the full device URL; fall back to treating the
            // decoded text itself as the device ID.
            const match = decoded.match(/\/devices\/([A-Za-z0-9_-]+)/);
            const code = (match ? match[1] : decoded.trim()).toUpperCase();
            if (code) router.push(`/devices/${code}`);
          },
          () => {
            // per-frame decode errors are normal — ignore them
          },
        );
        startRef.current = started;
        await started;
        if (cancelled) {
          // unmounted while the camera was still starting
          await scanner.stop().catch(() => {});
          scanner.clear();
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        setError(
          /permission/i.test(message)
            ? "Camera permission denied. Allow camera access, or use the manual ID below."
            : /notreadable|notfound|track/i.test(message)
              ? "Camera busy — wait a moment and refresh."
              : "Camera unavailable. Open this page over HTTPS (the deployed site) or use the manual ID below.",
        );
      } finally {
        startRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      void (async () => {
        // wait for start to finish before stopping — stop() during a
        // pending start() is what crashes the scanner
        await startRef.current?.catch(() => {});
        try {
          await scanner.stop();
          scanner.clear();
        } catch {
          // already stopped
        }
      })();
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Card className="overflow-hidden">
        <div className="relative aspect-square w-full bg-forest-900">
          <div
            id="device-scan-region"
            className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-2xl border-2 border-lime-300/80 shadow-[0_0_0_9999px_rgba(14,42,29,0.35)]" />
          </div>
        </div>
        <CardContent className="flex items-center justify-center gap-2 py-4 text-xs text-ink/55">
          {error ? (
            <p className="text-center text-danger">{error}</p>
          ) : (
            <>
              <ScanLine className="h-4 w-4" />
              Point the camera at a device QR label
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const code = manualCode.trim().toUpperCase();
              if (code) router.push(`/devices/${code}`);
            }}
            className="flex gap-2"
          >
            <Input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Manual fallback — type device ID"
              aria-label="Device ID"
              className="font-mono uppercase"
            />
            <Button type="submit" variant="outline">
              Open
            </Button>
          </form>
          <p className="mt-2 text-[11px] text-ink/50">
            No QR? Type the device ID (e.g. AUDIO-001) to open its page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
