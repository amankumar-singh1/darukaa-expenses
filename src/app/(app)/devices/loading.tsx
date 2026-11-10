import { Skeleton } from "@/components/skeleton";

export default function DevicesLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-40 md:h-10 md:w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:flex-1" />
        <Skeleton className="h-10 w-full sm:w-44" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-white">
        <div className="divide-y divide-forest-900/8">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="mx-5 h-14 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
