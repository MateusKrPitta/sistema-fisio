'use client';

import React from 'react';

export function FinancialSkeleton() {
  return (
    <div className="flex-1 flex flex-col w-full animate-pulse">
      {/* Header Placeholder */}
      <div className="p-4 sm:p-6 md:p-8 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60">
        <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl mb-2" />
        <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
      </div>

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-full">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-8 w-32 bg-slate-300 dark:bg-slate-700 rounded-lg" />
              <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="h-10 w-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>

        {/* Table Frame */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 5 }).map((_, r) => (
              <div key={r} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
