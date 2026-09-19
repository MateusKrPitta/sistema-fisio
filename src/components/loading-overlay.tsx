import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = 'Carregando...' }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center space-y-4 min-w-[240px]"
          >
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-sm font-bold text-slate-700 text-center">{message}</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
