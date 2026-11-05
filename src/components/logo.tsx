import Image from "next/image";

import { cn } from "@/lib/utils";

export function Logo({
  variant = "dark",
  width = 140,
  className,
}: {
  variant?: "dark" | "white";
  width?: number;
  className?: string;
}) {
  const src =
    variant === "white"
      ? "/brand/darukaa-white.webp"
      : "/brand/darukaa-dark.webp";

  return (
    <Image
      src={src}
      alt="Darukaa"
      width={width}
      height={Math.round(width * (228 / 1570))}
      priority
      className={cn("h-auto", className)}
    />
  );
}
