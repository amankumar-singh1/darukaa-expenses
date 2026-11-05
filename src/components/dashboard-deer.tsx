import type { CSSProperties } from "react";

const deerMask: CSSProperties = {
  backgroundImage:
    "linear-gradient(to top, #0a1f16 0%, #0e2a1d 45%, rgba(14, 42, 29, 0.65) 72%, rgba(14, 42, 29, 0) 100%)",
  maskImage: "url('/brand/dear-img.webp')",
  maskRepeat: "no-repeat",
  maskPosition: "bottom center",
  maskSize: "contain",
  WebkitMaskImage: "url('/brand/dear-img.webp')",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "bottom center",
  WebkitMaskSize: "contain",
};

export function DashboardDeer() {
  return (
    <div
      aria-hidden="true"
      className="dashboard-deer pointer-events-none relative mt-auto h-[190px] w-full select-none md:h-[260px]"
    >
      <div className="absolute bottom-0 left-1/2 h-20 w-[64%] -translate-x-1/2 rounded-[50%] bg-forest-900/[0.06] blur-2xl" />
      {/* Layering strengthens the deer's soft mask so its base reads dark green. */}
      {[0, 1, 2].map((layer) => (
        <div
          key={layer}
          className="absolute inset-x-0 bottom-0 mx-auto h-full w-full max-w-4xl opacity-90"
          style={deerMask}
        />
      ))}
    </div>
  );
}
