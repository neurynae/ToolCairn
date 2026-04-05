import { Skeleton } from '@/components/ui/skeleton';

export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="mb-8 h-32 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
