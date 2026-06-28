export function SkeletonBlock({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-[#1A2335] ${className}`} />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-6">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="mt-4 h-10 w-72 max-w-full" />
        <SkeletonBlock className="mt-4 h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass-panel rounded-lg p-4">
            <SkeletonBlock className="h-12 w-12" />
            <SkeletonBlock className="mt-8 h-5 w-24" />
            <SkeletonBlock className="mt-3 h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-52" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonBlock key={index} className="h-16" />
      ))}
    </div>
  );
}
