import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-24">
      <div className="flex flex-col items-center gap-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}
