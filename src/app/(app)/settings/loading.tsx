import { Skeleton } from "@/components/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-7 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-32 md:h-10 md:w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-forest-900/10 bg-white p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-6 h-10 w-full" />
          <Skeleton className="mt-6 h-5 w-16" />
          <div className="mt-6 grid gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="rounded-2xl border border-forest-900/10 bg-white p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-16 w-full" />
          <Skeleton className="mt-4 h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
