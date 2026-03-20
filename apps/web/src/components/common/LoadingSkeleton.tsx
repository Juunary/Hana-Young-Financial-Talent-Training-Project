import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn("bg-muted animate-pulse rounded-financial", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-financial border border-border bg-card p-6">
      <LoadingSkeleton className="mb-3 h-4 w-1/3" />
      <LoadingSkeleton className="mb-2 h-8 w-1/2" />
      <LoadingSkeleton className="h-3 w-1/4" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <LoadingSkeleton className="mb-2 h-8 w-64" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
