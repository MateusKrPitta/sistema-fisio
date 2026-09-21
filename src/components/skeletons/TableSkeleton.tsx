'use client';

import React from 'react';

interface TableSkeletonProps {
  title?: string;
  subtitle?: string;
  columnsCount?: number;
  rowsCount?: number;
}

export function TableSkeleton({
  title = 'Carregando dados...',
  subtitle = 'Aguarde um momento enquanto preparamos as informações',
  columnsCount = 5,
  rowsCount = 5,
}: TableSkeletonProps) {
  return (
    <div className="flex-1 flex flex-col w-full animate-pulse">
      {/* Top Header Placeholder */}
      <div className="p-4 sm:p-6 md:p-8 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-2" />
        <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
      </div>

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-full">
        {/* Search & Actions Bar Placeholder */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="h-10 w-full sm:w-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg hidden md:block" />
            <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Table Container Placeholder */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 py-3.5 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 gap-4">
            <div className="col-span-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="col-span-3 h-4 bg-slate-200 dark:bg-slate-700 rounded-md hidden sm:block" />
            <div className="col-span-3 h-4 bg-slate-200 dark:bg-slate-700 rounded-md hidden md:block" />
            <div className="col-span-2 h-4 bg-slate-200 dark:bg-slate-700 rounded-md text-right ml-auto w-12" />
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: rowsCount }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-12 py-4 px-6 items-center gap-4">
                {/* Avatar + Main Info */}
                <div className="col-span-12 sm:col-span-4 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="col-span-3 hidden sm:block">
                  <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>

                {/* Column 3 */}
                <div className="col-span-3 hidden md:block">
                  <div className="h-3.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                </div>

                {/* Actions */}
                <div className="col-span-12 sm:col-span-2 flex items-center justify-end space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="flex items-center space-x-2">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
