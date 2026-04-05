import { Skeleton } from '@/components/ui/skeleton';

export default function StackLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
