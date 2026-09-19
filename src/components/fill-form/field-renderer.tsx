'use client';

import React from 'react';
import { CustomField } from '@/lib/clinical-presets';
import { Smile, Meh, Frown } from 'lucide-react';

interface FieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  index: number;
}

export const getPainRatingBadge = (val: number) => {
  if (val === 0) return { label: 'Sem Dor', bg: 'bg-emerald-500 text-white', icon: <Smile className="w-3.5 h-3.5" /> };
  if (val <= 3) return { label: 'Dor Leve', bg: 'bg-emerald-600 text-white', icon: <Smile className="w-3.5 h-3.5" /> };
  if (val <= 6) return { label: 'Dor Moderada', bg: 'bg-amber-500 text-white', icon: <Meh className="w-3.5 h-3.5" /> };
  if (val <= 8) return { label: 'Dor Forte', bg: 'bg-orange-600 text-white', icon: <Frown className="w-3.5 h-3.5" /> };
  return { label: 'Dor Máxima', bg: 'bg-rose-600 text-white', icon: <Frown className="w-3.5 h-3.5" /> };
};

export function FieldRenderer({ field, value, onChange, index }: FieldRendererProps) {
  let fieldOptions: string[] = [];
  if (Array.isArray(field.options)) fieldOptions = field.options;
  else if (typeof field.options === 'string') {
    try {
      fieldOptions = JSON.parse(field.options);
    } catch {
      fieldOptions = [];
    }
  }

  return (
    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-3">
      <div>
        <label className="block text-xs sm:text-sm font-bold text-slate-800">
          {field.label}
          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.helpText && <p className="text-[11px] text-slate-500 mt-0.5">{field.helpText}</p>}
      </div>

      {/* SCALE 0-10 (EVA) */}
      {field.fieldType === 'scale_0_10' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Intensidade (0 a 10):</span>
            {value !== undefined && value !== '' && (
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                  getPainRatingBadge(Number(value)).bg
                }`}
              >
                {getPainRatingBadge(Number(value)).icon}
                <span>
                  {value}/10 - {getPainRatingBadge(Number(value)).label}
                </span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
            {Array.from({ length: 11 }, (_, i) => i).map((num) => {
              const isSelected = Number(value) === num && value !== '' && value !== undefined;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num)}
                  className={`h-9 sm:h-10 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SINGLE SELECT (Multiple choice with score options) */}
      {field.fieldType === 'single_select' && (
        <div className="space-y-1.5 pt-1">
          {fieldOptions.map((opt, optIdx) => {
            const isSelected = String(value) === String(opt);
            return (
              <label
                key={optIdx}
                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 text-xs'
                }`}
              >
                <input
                  type="radio"
                  name={`field_${field.id || index}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* MULTI SELECT */}
      {field.fieldType === 'multi_select' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {fieldOptions.map((opt, optIdx) => {
            const selectedList: string[] = Array.isArray(value) ? value : [];
            const isSelected = selectedList.includes(opt);
            return (
              <label
                key={optIdx}
                className={`flex items-center space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedList, opt]);
                    } else {
                      onChange(selectedList.filter((item) => item !== opt));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* NUMBER INPUT */}
      {field.fieldType === 'number' && (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            step="any"
            value={value !== undefined ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
          />
          {field.unit && <span className="text-xs font-bold text-slate-500">{field.unit}</span>}
        </div>
      )}

      {/* TEXT INPUT */}
      {field.fieldType === 'text' && (
        <input
          type="text"
          value={value !== undefined ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite a resposta ou observação..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
        />
      )}

      {/* LONG TEXT */}
      {field.fieldType === 'long_text' && (
        <textarea
          rows={3}
          value={value !== undefined ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Descreva detalhadamente as conclusões clínicas..."
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:bg-white focus:border-blue-500 focus:outline-none transition-all resize-none"
        />
      )}

      {/* BOOLEAN */}
      {field.fieldType === 'boolean' && (
        <div className="flex items-center space-x-3 pt-1">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              value === true
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Sim / Presente
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              value === false
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Não / Ausente
          </button>
        </div>
      )}
    </div>
  );
}
