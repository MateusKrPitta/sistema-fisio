'use client';

import React from 'react';
import { CustomField } from '@/lib/clinical-presets';
import { Smile, Meh, Frown, Check } from 'lucide-react';
import { InteractivePainBodyMap, PainMarker } from '@/components/interactive-pain-body-map';

interface FieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  index: number;
  allAnswers?: Record<string, any>;
  onAnswerChange?: (key: string, value: any) => void;
}

export const getPainRatingBadge = (val: number) => {
  if (val === 0) return { label: 'Sem Dor', bg: 'bg-emerald-500 text-white', icon: <Smile className="w-3.5 h-3.5" /> };
  if (val <= 3) return { label: 'Dor Leve', bg: 'bg-emerald-600 text-white', icon: <Smile className="w-3.5 h-3.5" /> };
  if (val <= 6) return { label: 'Dor Moderada', bg: 'bg-amber-500 text-white', icon: <Meh className="w-3.5 h-3.5" /> };
  if (val <= 8) return { label: 'Dor Forte', bg: 'bg-orange-600 text-white', icon: <Frown className="w-3.5 h-3.5" /> };
  return { label: 'Dor Máxima', bg: 'bg-rose-600 text-white', icon: <Frown className="w-3.5 h-3.5" /> };
};

export function FieldRenderer({ field, value, onChange, index, allAnswers, onAnswerChange }: FieldRendererProps) {
  let fieldOptions: string[] = [];
  if (Array.isArray(field.options)) fieldOptions = field.options;
  else if (typeof field.options === 'string') {
    try {
      fieldOptions = JSON.parse(field.options);
    } catch {
      fieldOptions = [];
    }
  }

  const labelLower = (field.label || '').toLowerCase();
  const isRightSide = labelLower.includes('direito') || labelLower.includes(' dir.') || labelLower.endsWith(' - d') || labelLower.includes('(direito)');
  const isLeftSide = labelLower.includes('esquerdo') || labelLower.includes(' esq.') || labelLower.endsWith(' - e') || labelLower.includes('(esquerdo)');

  const isO2Field =
    labelLower.includes('o2') ||
    labelLower.includes('oxigênio') ||
    labelLower.includes('oxigenio');

  const o2AmountVal =
    allAnswers?.['Qual a quantidade de O2?'] ??
    allAnswers?.[`${field.id || field.label}_amount`] ??
    '';

  const isBodyMapField =
    field.fieldType === 'body_map' ||
    labelLower.includes('body map') ||
    labelLower.includes('mapa de dor') ||
    labelLower.includes('pontos de dor');

  // Parse markers if field is body map
  let parsedMarkers: PainMarker[] = [];
  if (isBodyMapField) {
    if (Array.isArray(value)) {
      parsedMarkers = value;
    } else if (typeof value === 'string') {
      try {
        const p = JSON.parse(value);
        if (Array.isArray(p)) parsedMarkers = p;
      } catch {
        parsedMarkers = [];
      }
    }
  }

  const cardStyling = isRightSide
    ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/90 dark:border-blue-900/60 hover:border-blue-400/90 shadow-2xs'
    : isLeftSide
    ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200/90 dark:border-purple-900/60 hover:border-purple-400/90 shadow-2xs'
    : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${cardStyling}`}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {isRightSide && (
            <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
              Direito (D)
            </span>
          )}
          {isLeftSide && (
            <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-2xs">
              Esquerdo (E)
            </span>
          )}
        </div>
        {field.helpText && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{field.helpText}</p>}
      </div>

      {/* BODY MAP (Desenho Anatômico e Pontos de Dor) */}
      {isBodyMapField && (
        <div className="pt-2">
          <InteractivePainBodyMap
            markers={parsedMarkers}
            onChange={(newMarkers) => {
              onChange(newMarkers);
              if (onAnswerChange) {
                onAnswerChange('markers', newMarkers);
                onAnswerChange('totalPoints', newMarkers.length);
              }
            }}
            showInstructions={true}
          />
        </div>
      )}

      {/* SCALE 0-10 (EVA) */}
      {field.fieldType === 'scale_0_10' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Intensidade (0 a 10):</span>
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
                      : 'bg-white dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
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
      {field.fieldType === 'single_select' && !isBodyMapField && (
        <div className="space-y-1.5 pt-1">
          {fieldOptions.map((opt, optIdx) => {
            const isSelected = String(value) === String(opt);
            const activeBgClass = isSelected
              ? isLeftSide
                ? 'bg-purple-100/80 dark:bg-purple-950/80 border-purple-500 text-purple-950 dark:text-purple-200 font-bold shadow-2xs'
                : 'bg-blue-50/90 dark:bg-blue-950/80 border-blue-500 text-blue-950 dark:text-blue-200 font-bold shadow-2xs'
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs';

            return (
              <label
                key={optIdx}
                className={`group flex items-center space-x-3 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${activeBgClass}`}
              >
                <input
                  type="radio"
                  name={`field_${field.id || index}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => onChange(opt)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                    isSelected
                      ? isLeftSide
                        ? 'border-purple-600 bg-purple-600 ring-2 ring-purple-600/20'
                        : 'border-blue-600 bg-blue-600 ring-2 ring-blue-600/20'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-slate-400'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs leading-snug">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* MULTI SELECT */}
      {field.fieldType === 'multi_select' && !isBodyMapField && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {fieldOptions.map((opt, optIdx) => {
            const selectedList: string[] = Array.isArray(value) ? value : [];
            const isSelected = selectedList.includes(opt);
            return (
              <label
                key={optIdx}
                className={`group flex items-center space-x-3 p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/80 border-blue-500 text-blue-950 dark:text-blue-200 font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
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
                  className="sr-only"
                />
                <div
                  className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-blue-400'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="leading-snug">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* NUMBER INPUT */}
      {field.fieldType === 'number' && !isBodyMapField && (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            step="any"
            value={value !== undefined ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className="w-full sm:w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all"
          />
          {field.unit && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{field.unit}</span>}
        </div>
      )}

      {/* TEXT INPUT */}
      {field.fieldType === 'text' && !isBodyMapField && (
        <input
          type="text"
          value={value !== undefined ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite a resposta ou observação..."
          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all"
        />
      )}

      {/* LONG TEXT */}
      {field.fieldType === 'long_text' && !isBodyMapField && (
        <textarea
          rows={3}
          value={value !== undefined ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Descreva detalhadamente as conclusões clínicas..."
          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all resize-none"
        />
      )}

      {/* BOOLEAN */}
      {field.fieldType === 'boolean' && !isBodyMapField && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                value === true
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20'
                  : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Sim / Presente
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(false);
                if (isO2Field && onAnswerChange) {
                  onAnswerChange('Qual a quantidade de O2?', '');
                  onAnswerChange(`${field.id || field.label}_amount`, '');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                value === false
                  ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Não / Ausente
            </button>
          </div>

          {/* Conditional field for O2 quantity appearing directly beside when Sim is selected */}
          {isO2Field && value === true && (
            <div className="flex items-center space-x-2.5 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 rounded-xl shadow-2xs">
              <label className="text-xs font-bold text-blue-900 dark:text-blue-300 whitespace-nowrap">
                Qual a quantidade de O2?
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={o2AmountVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (onAnswerChange) {
                      onAnswerChange('Qual a quantidade de O2?', val);
                      onAnswerChange(`${field.id || field.label}_amount`, val);
                    }
                  }}
                  placeholder="Ex: 2"
                  className="w-20 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400">L/min</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
