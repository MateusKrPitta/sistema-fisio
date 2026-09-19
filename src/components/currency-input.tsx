'use client';

import React from 'react';

interface CurrencyInputProps {
  value: number | string | undefined | null;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  const val = Number(value);
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = 'R$ 0,00',
  className = '',
  disabled = false,
}: CurrencyInputProps) {
  // Convert number to integer cents for mask manipulation
  const cents = Math.round((Number(value) || 0) * 100);

  const formatDisplay = (numCents: number) => {
    const floatVal = numCents / 100;
    return floatVal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const numericCents = Number(rawDigits) || 0;
    const numericFloat = numericCents / 100;
    onChange(numericFloat);
  };

  return (
    <div className="relative">
      <input
        type="text"
        disabled={disabled}
        value={formatDisplay(cents)}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all ${className} ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
        }`}
      />
    </div>
  );
}
