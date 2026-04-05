import { Skeleton } from '@/components/ui/skeleton';

export default function ToolLoading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </main>
  );
}
