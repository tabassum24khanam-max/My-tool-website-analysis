export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  );
}

export function SectionSkeleton() {
  return (
    <div className="card space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </div>
  );
}
