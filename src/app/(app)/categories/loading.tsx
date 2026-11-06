import { Skeleton } from "@/components/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-40 md:h-10 md:w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      <div className="rounded-2xl border border-forest-900/10 bg-white p-5">
        <p className="text-sm font-semibold text-ink">New category</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-white">
        <ul className="divide-y divide-forest-900/8">
          {Array.from({ length: 8 }).map((_, index) => (
            <li
              key={index}
              className="flex items-center gap-3 px-5 py-4"
            >
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 flex-1 rounded-md" />
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
