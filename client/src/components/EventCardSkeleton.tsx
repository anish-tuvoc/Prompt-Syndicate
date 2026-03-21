export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
      {/* Image placeholder */}
      <div className="aspect-video w-full skeleton-shimmer dark:skeleton-shimmer" />

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />

        {/* Stars */}
        <div className="h-3 w-24 rounded-md skeleton-shimmer" />

        {/* Location */}
        <div className="space-y-2">
          <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
          <div className="h-3 w-2/5 rounded-md skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
