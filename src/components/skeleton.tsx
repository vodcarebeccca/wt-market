export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-border/50 ${className || ""}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-36 rounded-none rounded-t-xl" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <div className="space-y-5">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
          <Skeleton className="h-20" />
          <Skeleton className="h-12" />
        </div>
      </div>
    </div>
  );
}