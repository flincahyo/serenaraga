import React from 'react';

export const AdminSkeleton = ({ rows = 4 }: { rows?: number }) => {
  return (
    <div className="space-y-4 animate-pulse pt-2">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
          <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-md"></div>
        </div>
        <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
      </div>

      {/* List/Cards Skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-700/50 rounded-md"></div>
              <div className="h-3 w-1/4 bg-zinc-100 dark:bg-zinc-800/50 rounded-md"></div>
            </div>
            <div className="shrink-0 space-y-2 text-right">
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700/50 rounded-md ml-auto"></div>
              <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-md ml-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
