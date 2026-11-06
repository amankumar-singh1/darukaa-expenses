import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-56 md:h-10 md:w-72" />
          <Skeleton className="h-4 w-72 md:w-96" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl bg-forest-900/70 sm:col-span-2 xl:col-span-1" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-72 rounded-2xl border border-forest-900/10 bg-white lg:col-span-2">
          <Skeleton className="m-5 h-4 w-32" />
          <div className="space-y-4 px-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="h-72 rounded-2xl border border-forest-900/10 bg-white lg:col-span-3">
          <Skeleton className="m-5 h-4 w-28" />
          <div className="divide-y divide-forest-900/8">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="mx-5 h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
