'use client';

import React from 'react';
import { SlidersHorizontal, Plus, Layers, X } from 'lucide-react';
import { CustomSelect } from '@/components/custom-select';
import { CATEGORIES_LIST, ClinicalPreset } from '@/lib/clinical-presets';

interface ScaleBuilderDeckProps {
  moduleCategory: string;
  onCategoryChange: (category: string) => void;
  selectedPresetToLoad: string;
  onPresetSelect: (preset: string) => void;
  availablePresets: ClinicalPreset[];
  loadedPresets: string[];
  onAddPreset: () => void;
  onRemovePreset: (presetName: string) => void;
}

export function ScaleBuilderDeck({
  moduleCategory,
  onCategoryChange,
  selectedPresetToLoad,
  onPresetSelect,
  availablePresets,
  loadedPresets,
  onAddPreset,
  onRemovePreset,
}: ScaleBuilderDeckProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Seleção de Escalas & Módulos Clínicos
            </h3>
            <p className="text-xs text-slate-400">Combine múltiplos testes e escalas clínicas para compor a sessão</p>
          </div>
        </div>

        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
          {loadedPresets.length} escala(s) ativa(s)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5">
        {/* CATEGORIA */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Categoria Clínica
          </label>
          <CustomSelect
            value={moduleCategory}
            onChange={(val) => onCategoryChange(String(val))}
            options={CATEGORIES_LIST.map((cat) => ({ value: cat, label: cat }))}
          />
        </div>

        {/* CARREGAR ESCALA PRONTA */}
        <div className="sm:col-span-8">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Carregar Escala Pronta (Selecione e Adicione)
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <CustomSelect
                value={selectedPresetToLoad}
                onChange={(val) => onPresetSelect(String(val))}
                options={availablePresets.map((p) => ({ value: p.label, label: p.label }))}
                placeholder="Selecione uma escala pronta para adicionar..."
              />
            </div>
            <button
              type="button"
              onClick={onAddPreset}
              disabled={!selectedPresetToLoad}
              className="inline-flex h-[42px] items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Escala</span>
            </button>
          </div>
        </div>

        {/* Escalas carregadas (Chips) */}
        {loadedPresets.length > 0 && (
          <div className="sm:col-span-12 pt-1 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Escalas Selecionadas nesta Avaliação ({loadedPresets.length}):
            </label>
            <div className="flex flex-wrap gap-2.5">
              {loadedPresets.map((presetName) => (
                <div
                  key={presetName}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>{presetName}</span>
                  <button
                    type="button"
                    onClick={() => onRemovePreset(presetName)}
                    className="p-0.5 hover:bg-slate-700 hover:text-red-400 text-slate-400 rounded-md transition-colors cursor-pointer ml-1"
                    title={`Remover ${presetName}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
