import { Skeleton } from "@/components/skeleton";

export default function ExportLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-28" />
      <div className="mb-7 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-56 md:h-10 md:w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-forest-900/10 bg-white">
          <div className="border-b border-forest-900/8 px-5 py-4">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-4 px-5 py-4">
            <Skeleton className="h-10 w-full sm:w-48" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-forest-900/10 bg-white">
          <div className="border-b border-forest-900/8 px-5 py-4">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-4 px-5 py-4">
            <Skeleton className="h-10 w-full sm:w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
