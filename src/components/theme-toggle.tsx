'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-xl border border-transparent" />; // Skeleton to prevent layout shift
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
      aria-label="Alternar tema"
      title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
    >
      <Sun className="h-4 w-4 absolute transition-all scale-100 opacity-100 rotate-0 dark:scale-0 dark:opacity-0 dark:-rotate-90" />
      <Moon className="h-4 w-4 absolute transition-all scale-0 opacity-0 rotate-90 dark:scale-100 dark:opacity-100 dark:rotate-0" />
    </button>
  );
}
