'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastFn {
  (options: { title: string; description?: string; type?: ToastType; duration?: number }): void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

interface ToastContextType {
  toast: ToastFn;
  showToast: (title: string, type?: ToastType, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const baseToast = useCallback(
    ({ title, description, type = 'info', duration = 4000 }: { title: string; description?: string; type?: ToastType; duration?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, title, description, type, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 5));

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = useMemo(() => {
    const fn = (options: { title: string; description?: string; type?: ToastType; duration?: number }) => {
      baseToast(options);
    };

    fn.success = (title: string, description?: string) => {
      baseToast({ title, description, type: 'success' });
    };
    fn.error = (title: string, description?: string) => {
      baseToast({ title, description, type: 'error' });
    };
    fn.info = (title: string, description?: string) => {
      baseToast({ title, description, type: 'info' });
    };
    fn.warning = (title: string, description?: string) => {
      baseToast({ title, description, type: 'warning' });
    };

    return fn as ToastFn;
  }, [baseToast]);

  const showToast = useCallback(
    (title: string, type: ToastType = 'info', description?: string) => {
      toast({ title, description, type });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {/* Global Custom Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, x: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start space-x-3 backdrop-blur-md transition-all ${
                  isSuccess
                    ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-500/10'
                    : isError
                    ? 'bg-slate-900/95 text-white border-red-500/40 shadow-red-500/10'
                    : isWarning
                    ? 'bg-slate-900/95 text-white border-amber-500/40 shadow-amber-500/10'
                    : 'bg-slate-900/95 text-white border-blue-500/40 shadow-blue-500/10'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                    isSuccess
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isError
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                  {isError && <AlertCircle className="w-5 h-5" />}
                  {isWarning && <AlertTriangle className="w-5 h-5" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="font-bold text-sm leading-snug">{t.title}</h4>
                  {t.description && <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{t.description}</p>}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
