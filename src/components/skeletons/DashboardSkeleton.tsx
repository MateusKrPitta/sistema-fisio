'use client';

import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col w-full animate-pulse">
      {/* Header Placeholder */}
      <div className="p-4 sm:p-6 md:p-8 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-2" />
        <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
      </div>

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-full">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-8 w-20 bg-slate-300 dark:bg-slate-700 rounded-lg" />
              <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          ))}
        </div>

        {/* Two-Column Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart / List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-64 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl flex items-center justify-center" />
          </div>

          {/* Agenda Today Side Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center space-x-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md" />
                    <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
