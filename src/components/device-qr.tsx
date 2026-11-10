"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { cn } from "@/lib/utils";

export function DeviceQr({
  code,
  size = 160,
  className,
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(`${window.location.origin}/devices/${code}`, {
      width: size * 2,
      margin: 1,
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code, size]);

  if (!src) {
    return <div className={cn("animate-pulse rounded bg-cream-100", className)} style={{ width: size, height: size }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`QR code for device ${code}`}
      width={size}
      height={size}
      className={className}
    />
  );
}
