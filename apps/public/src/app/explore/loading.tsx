import { Skeleton } from '@/components/ui/skeleton';

export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
