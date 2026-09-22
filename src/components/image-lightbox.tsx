'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate?: (newIndex: number) => void;
  title?: string;
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  title,
}: ImageLightboxProps) {
  useEffect(() => {
    if (currentIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0 && onNavigate) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1 && onNavigate) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  if (currentIndex === null || !images[currentIndex]) return null;

  const currentSrc = images[currentIndex];
  const hasMultiple = images.length > 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
      >
        {/* Top bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl flex items-center justify-between text-white py-2 px-1 z-10"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xs sm:text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
              Foto {currentIndex + 1} de {images.length}
            </span>
            {title && (
              <span className="text-xs sm:text-sm text-slate-300 font-medium truncate max-w-xs sm:max-w-md">
                {title}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar visualizador (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center image container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl flex-1 flex items-center justify-center my-auto p-2"
        >
          {hasMultiple && currentIndex > 0 && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex - 1)}
              className="absolute left-2 sm:-left-12 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-lg hover:scale-110 z-10 cursor-pointer"
              title="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <motion.img
            key={currentSrc}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            src={currentSrc}
            alt={`Imagem ${currentIndex + 1}`}
            className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 select-none"
          />

          {hasMultiple && currentIndex < images.length - 1 && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(currentIndex + 1)}
              className="absolute right-2 sm:-right-12 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-lg hover:scale-110 z-10 cursor-pointer"
              title="Próxima foto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom thumbnail strip if multiple images */}
        {hasMultiple && onNavigate && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 bg-black/40 rounded-2xl backdrop-blur-xs border border-white/10"
          >
            {images.map((thumb, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigate(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  idx === currentIndex
                    ? 'border-blue-500 scale-105 shadow-md'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={thumb} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
