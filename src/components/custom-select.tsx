'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number | undefined | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  className = '',
  disabled = false,
  size = 'md',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-4 py-3 text-base'
      : 'px-3.5 py-2.5 text-sm';

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded-xl ${sizeClasses} flex items-center justify-between gap-2 text-left font-medium text-slate-800 shadow-2xs transition-all duration-200 ${
          isOpen ? 'ring-2 ring-blue-500/20 border-blue-500 bg-white' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0 text-blue-600">{selectedOption.icon}</span>
          )}
          <span className="truncate font-semibold">
            {selectedOption ? selectedOption.label : <span className="text-slate-400 font-normal">{placeholder}</span>}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Options Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-0.5"
          >
            {options.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 italic">Nenhuma opção disponível</div>
            ) : (
              options.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors font-medium text-left ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {opt.icon && (
                        <span className={`shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                          {opt.icon}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate">{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-slate-400 font-normal truncate">{opt.sublabel}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      {opt.badge && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
