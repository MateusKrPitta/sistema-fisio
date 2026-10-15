'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Sparkles, Activity, CheckCircle2, Info } from 'lucide-react';
import { CustomSelect, SelectOption } from '@/components/custom-select';
import { mrcMuscleOptions, MRC_MOVEMENTS_LIST } from '@/lib/clinical-presets';

export interface MRCTestItem {
  id: string;
  movement: string;
  customMovement?: string;
  side: 'Direito' | 'Esquerdo' | '';
  observation: 'Sim' | 'Não' | '';
  observationText?: string;
  score: string;
}

interface MRCMuscleScaleSectionProps {
  answers: Record<string, any>;
  onChange: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  scaleTitle?: string;
  scaleIndex?: number;
  onRemoveScale?: () => void;
  readOnly?: boolean;
}

export function parseMRCTestsFromAnswers(answers: Record<string, any>): MRCTestItem[] {
  if (Array.isArray(answers.mrc_tests) && answers.mrc_tests.length > 0) {
    return answers.mrc_tests;
  }

  // Fallback: parse from legacy key format (e.g. "Flexão do Braço (Bíceps) - Direito")
  const parsedItems: MRCTestItem[] = [];
  const entries = Object.entries(answers || {});

  entries.forEach(([key, val]) => {
    if (!val || typeof val !== 'string' || key.includes('- Observação') || key === 'mrc_tests') return;

    // Check if key ends with "- Direito" or "- Esquerdo"
    let side: 'Direito' | 'Esquerdo' | '' = '';
    let movement = '';

    if (key.endsWith(' - Direito') || key.endsWith(' (Direito)')) {
      side = 'Direito';
      movement = key.replace(/ - Direito$| \(Direito\)$/, '').trim();
    } else if (key.endsWith(' - Esquerdo') || key.endsWith(' (Esquerdo)')) {
      side = 'Esquerdo';
      movement = key.replace(/ - Esquerdo$| \(Esquerdo\)$/, '').trim();
    }

    if (side && movement) {
      // Find possible observation for this key
      const obsKey = `${key} - Observação`;
      const obsVal = answers[obsKey];
      let observation: 'Sim' | 'Não' | '' = 'Não';
      let observationText = '';

      if (obsVal) {
        if (String(obsVal).toLowerCase().startsWith('sim')) {
          observation = 'Sim';
          observationText = String(obsVal).replace(/^sim:?\s*/i, '').trim();
        } else {
          observation = 'Não';
        }
      }

      parsedItems.push({
        id: `legacy_${parsedItems.length + 1}`,
        movement,
        side,
        observation,
        observationText,
        score: String(val),
      });
    }
  });

  return parsedItems;
}

export function MRCMuscleScaleSection({
  answers,
  onChange,
  scaleTitle = 'Escala de Força Muscular (MRC)',
  scaleIndex = 0,
  onRemoveScale,
  readOnly = false,
}: MRCMuscleScaleSectionProps) {
  // Movement Options for Select 1
  const movementOptions: SelectOption[] = MRC_MOVEMENTS_LIST.map((mov) => ({
    value: mov,
    label: mov,
  }));

  // Side Options for Select 2
  const sideOptions: SelectOption[] = [
    { value: 'Direito', label: 'Direito', badge: 'D', colorDot: 'bg-blue-600' },
    { value: 'Esquerdo', label: 'Esquerdo', badge: 'E', colorDot: 'bg-purple-600' },
  ];

  // Observation Options for Select 3
  const observationOptions: SelectOption[] = [
    { value: 'Não', label: 'Não', badge: 'Normal', colorDot: 'bg-emerald-500' },
    { value: 'Sim', label: 'Sim', badge: 'Com alteração', colorDot: 'bg-amber-500' },
  ];

  // Initialize tests
  const initialTests = parseMRCTestsFromAnswers(answers);
  const [tests, setTests] = useState<MRCTestItem[]>(() => {
    if (initialTests.length > 0) return initialTests;
    return [
      {
        id: 'test_1',
        movement: '',
        side: '',
        observation: '',
        observationText: '',
        score: '',
      },
    ];
  });

  // Sync internal state if external answers change externally (e.g. record reset/load)
  useEffect(() => {
    const parsed = parseMRCTestsFromAnswers(answers);
    if (parsed.length > 0) {
      setTests(parsed);
    }
  }, [answers.mrc_tests]);

  // Sync back to parent form answers
  const updateAnswers = (updatedTests: MRCTestItem[], generalNotes?: string) => {
    setTests(updatedTests);
    onChange((prev) => {
      const next = { ...prev };
      next.mrc_tests = updatedTests;

      // Also set standard composite keys for backward/report compatibility
      updatedTests.forEach((t) => {
        const movName =
          t.movement === 'Outro Músculo / Movimento Específico' && t.customMovement
            ? t.customMovement
            : t.movement;

        if (movName && t.side) {
          const compKey = `${movName} - ${t.side}`;
          if (t.score) {
            next[compKey] = t.score;
          }
          if (t.observation) {
            next[`${compKey} - Observação`] =
              t.observation === 'Sim'
                ? t.observationText
                  ? `Sim: ${t.observationText}`
                  : 'Sim'
                : 'Não';
          }
        }
      });

      if (generalNotes !== undefined) {
        next['Observações / Assimetrias de Força Muscular'] = generalNotes;
      }

      return next;
    });
  };

  const handleAddTest = () => {
    const newTest: MRCTestItem = {
      id: `test_${Date.now()}_${tests.length + 1}`,
      movement: '',
      side: '',
      observation: '',
      observationText: '',
      score: '',
    };
    const updated = [...tests, newTest];
    updateAnswers(updated);
  };

  const handleRemoveTest = (indexToRemove: number) => {
    if (tests.length <= 1) return;
    const removedItem = tests[indexToRemove];
    const updated = tests.filter((_, idx) => idx !== indexToRemove);

    onChange((prev) => {
      const next = { ...prev };
      next.mrc_tests = updated;
      const movName =
        removedItem.movement === 'Outro Músculo / Movimento Específico' && removedItem.customMovement
          ? removedItem.customMovement
          : removedItem.movement;
      if (movName && removedItem.side) {
        delete next[`${movName} - ${removedItem.side}`];
        delete next[`${movName} - ${removedItem.side} - Observação`];
      }
      return next;
    });

    setTests(updated);
  };

  const handleUpdateTest = (index: number, field: keyof MRCTestItem, value: any) => {
    const updated = tests.map((item, idx) => {
      if (idx === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'observation' && value === 'Não') {
          updatedItem.observationText = '';
        }
        return updatedItem;
      }
      return item;
    });
    updateAnswers(updated);
  };

  const generalNotesVal =
    answers['Observações / Assimetrias de Força Muscular'] ??
    answers['observacoes_forca'] ??
    '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
      {/* Scale Header */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            {scaleIndex + 1}
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              <span>{scaleTitle}</span>
              <span className="hidden sm:inline-flex text-[10px] bg-blue-500/20 text-blue-300 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Escala MRC (0-5)
              </span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              {tests.length} movimento(s) avaliado(s)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddTest}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Movimento</span>
            </button>
          )}

          {onRemoveScale && !readOnly && (
            <button
              type="button"
              onClick={onRemoveScale}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={`Remover escala "${scaleTitle}"`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-7 space-y-6 bg-slate-50/50 dark:bg-slate-900/60">
        {/* Info Banner */}
        <div className="bg-indigo-50/70 dark:bg-slate-950/80 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-xs text-indigo-950 dark:text-indigo-200 space-y-0.5">
            <p className="font-bold">Estrutura Padronizada de Avaliação de Força Muscular</p>
            <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed text-[11px]">
              Selecione obrigatoriamente o <strong>Movimento</strong>, o <strong>Lado (Direito ou Esquerdo)</strong> e a <strong>Observação (Sim ou Não)</strong> para cada grupo muscular. Mantenha a pontuação de 0 a 5 conforme o grau de força do paciente.
            </p>
          </div>
        </div>

        {/* List of Test Cards */}
        <div className="space-y-5">
          {tests.map((testItem, tIdx) => {
            const isRightSide = testItem.side === 'Direito';
            const isLeftSide = testItem.side === 'Esquerdo';

            const cardBorder = isRightSide
              ? 'border-blue-300 dark:border-blue-800/80 ring-1 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/30'
              : isLeftSide
              ? 'border-purple-300 dark:border-purple-800/80 ring-1 ring-purple-500/20 bg-purple-50/30 dark:bg-purple-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90';

            return (
              <div
                key={testItem.id || tIdx}
                className={`rounded-2xl border p-4 sm:p-6 transition-all shadow-2xs space-y-4 ${cardBorder}`}
              >
                {/* Test Card Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-black text-xs flex items-center justify-center">
                      {tIdx + 1}
                    </span>
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                      {testItem.movement ? testItem.movement : `Teste #${tIdx + 1}`}
                    </h5>

                    {isRightSide && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
                        Direito (D)
                      </span>
                    )}
                    {isLeftSide && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-2xs">
                        Esquerdo (E)
                      </span>
                    )}
                  </div>

                  {tests.length > 1 && !readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTest(tIdx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                      title="Remover este teste"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* The 3 Standard Mandatory Selects */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
                  {/* SELECT 1: NOME DO MOVIMENTO */}
                  <div className="md:col-span-5 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      1. Nome do Movimento <span className="text-red-500 font-extrabold">*</span>
                    </label>
                    <CustomSelect
                      value={testItem.movement}
                      onChange={(val) => handleUpdateTest(tIdx, 'movement', String(val))}
                      options={movementOptions}
                      placeholder="Selecione o movimento..."
                      disabled={readOnly}
                    />

                    {/* Specific custom movement name input */}
                    {testItem.movement === 'Outro Músculo / Movimento Específico' && (
                      <input
                        type="text"
                        value={testItem.customMovement || ''}
                        onChange={(e) => handleUpdateTest(tIdx, 'customMovement', e.target.value)}
                        placeholder="Digite o nome do músculo / movimento..."
                        disabled={readOnly}
                        className="w-full mt-2 bg-white dark:bg-slate-950 border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    )}
                  </div>

                  {/* SELECT 2: LADO (DIREITO / ESQUERDO) */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      2. Lado <span className="text-red-500 font-extrabold">*</span>
                    </label>
                    <CustomSelect
                      value={testItem.side}
                      onChange={(val) => handleUpdateTest(tIdx, 'side', val)}
                      options={sideOptions}
                      placeholder="Direito / Esquerdo..."
                      disabled={readOnly}
                    />
                  </div>

                  {/* SELECT 3: OBSERVAÇÃO (SIM / NÃO) */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      3. Observação <span className="text-red-500 font-extrabold">*</span>
                    </label>
                    <CustomSelect
                      value={testItem.observation}
                      onChange={(val) => handleUpdateTest(tIdx, 'observation', val)}
                      options={observationOptions}
                      placeholder="Sim / Não..."
                      disabled={readOnly}
                    />
                  </div>

                  {/* CONDITIONAL OBSERVATION TEXT IF SIM */}
                  {testItem.observation === 'Sim' && (
                    <div className="md:col-span-12 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 rounded-xl p-3 space-y-1.5">
                      <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        Descreva a Observação Clínica (ex: dor, tremor, assimetria, fadiga):
                      </label>
                      <input
                        type="text"
                        value={testItem.observationText || ''}
                        onChange={(e) => handleUpdateTest(tIdx, 'observationText', e.target.value)}
                        placeholder="Ex: Queixa de dor na contração, compensação com trapézio..."
                        disabled={readOnly}
                        className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* MRC SCORE RADIOS (0 A 5) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Grau de Força Muscular (Escala MRC 0 a 5) <span className="text-red-500 font-extrabold">*</span>
                    </label>
                    {testItem.score && (
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                          isLeftSide ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                        }`}
                      >
                        Grau {testItem.score.split(' - ')[0]}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mrcMuscleOptions.map((opt, optIdx) => {
                      const isSelected = testItem.score === opt;
                      const activeClass = isSelected
                        ? isLeftSide
                          ? 'bg-purple-100/90 dark:bg-purple-950/80 border-purple-500 text-purple-950 dark:text-purple-200 font-bold shadow-2xs'
                          : 'bg-blue-50/90 dark:bg-blue-950/80 border-blue-500 text-blue-950 dark:text-blue-200 font-bold shadow-2xs'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300';

                      return (
                        <label
                          key={optIdx}
                          className={`flex items-center space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${activeClass}`}
                        >
                          <input
                            type="radio"
                            name={`mrc_score_${testItem.id}_${tIdx}`}
                            value={opt}
                            checked={isSelected}
                            disabled={readOnly}
                            onChange={() => handleUpdateTest(tIdx, 'score', opt)}
                            className={`w-4 h-4 ${
                              isLeftSide
                                ? 'text-purple-600 focus:ring-purple-500'
                                : 'text-blue-600 focus:ring-blue-500'
                            }`}
                          />
                          <span className="leading-tight">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Another Movement Button */}
        {!readOnly && (
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddTest}
              className="inline-flex items-center space-x-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:border-blue-300 font-bold px-4 py-2.5 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Outro Movimento / Teste</span>
            </button>

            <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
              Total: {tests.length} movimento(s) configurado(s)
            </span>
          </div>
        )}

        {/* General Notes for MRC */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Observações Gerais / Assimetrias de Força Muscular (Opcional)
          </label>
          <textarea
            rows={2}
            value={generalNotesVal}
            onChange={(e) => updateAnswers(tests, e.target.value)}
            disabled={readOnly}
            placeholder="Anotar assimetrias globais, fadiga ou considerações adicionais do teste..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
