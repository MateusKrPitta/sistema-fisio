'use client';

import React from 'react';

export function CalendarSkeleton() {
  return (
    <div className="flex-1 flex flex-col w-full animate-pulse">
      {/* Header Placeholder */}
      <div className="p-4 sm:p-6 md:p-8 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60">
        <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl mb-2" />
        <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
      </div>

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-full">
        {/* Calendar Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-7 w-48 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-9 w-32 bg-slate-300 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>

        {/* Calendar Grid Frame */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 min-h-[500px]">
          <div className="grid grid-cols-7 gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md mx-auto w-12" />
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 auto-rows-[90px]">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between"
              >
                <div className="h-3 w-5 bg-slate-200 dark:bg-slate-700 rounded-md" />
                {i % 3 === 0 && <div className="h-4 w-full bg-blue-100 dark:bg-blue-900/40 rounded-md mt-1" />}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
