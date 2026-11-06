import { Skeleton } from "@/components/skeleton";

export default function ExpensesLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-48 md:h-10 md:w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:flex-1" />
        <Skeleton className="h-10 w-full sm:w-52" />
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="mb-3 flex items-center justify-between px-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-white">
        <div className="divide-y divide-forest-900/8">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="mx-5 h-14 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
