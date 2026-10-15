'use client';

import React, { useMemo, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Trash2,
  Info,
  Sparkles,
  Award,
} from 'lucide-react';
import { calculateFPMNovaes, FPMCalculationResult } from '@/lib/clinical-presets';
import { CustomSelect } from '@/components/custom-select';

const unitOptions = [
  { value: 'kgf (Quilograma-força)', label: 'kgf (Quilograma-força) - Padrão' },
  { value: 'N (Newtons)', label: 'N (Newtons)' },
  { value: 'lbs (Libras)', label: 'lbs (Libras)' },
];

const genderEquationOptions = [
  { value: 'Feminino (0)', label: 'Feminino (Sexo = 0)' },
  { value: 'Masculino (1)', label: 'Masculino (Sexo = 1)' },
];

interface FPMDynamometrySectionProps {
  answers: Record<string, any>;
  onChange: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  scaleTitle?: string;
  scaleIndex?: number;
  patient?: any;
  onRemoveScale?: () => void;
  readOnly?: boolean;
}

export function FPMDynamometrySection({
  answers,
  onChange,
  scaleTitle = 'Força de Preensão Palmar (FPP/FPM) • Dinamometria',
  scaleIndex = 0,
  patient,
  onRemoveScale,
  readOnly = false,
}: FPMDynamometrySectionProps) {
  // Helper to update specific answer key
  const updateField = (key: string, val: any) => {
    onChange((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  // 1. Patient biometric defaults
  const defaultGender = useMemo(() => {
    const g = patient?.gender || patient?.sexo || '';
    if (String(g).toLowerCase().startsWith('m')) return 'Masculino (1)';
    if (String(g).toLowerCase().startsWith('f')) return 'Feminino (0)';
    return 'Feminino (0)';
  }, [patient]);

  const defaultAge = useMemo(() => {
    if (patient?.birthDate || patient?.birthdate) {
      const bDate = new Date(patient.birthDate || patient.birthdate);
      if (!isNaN(bDate.getTime())) {
        const today = new Date();
        let a = today.getFullYear() - bDate.getFullYear();
        const m = today.getMonth() - bDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) a--;
        return a;
      }
    }
    if (patient?.age) return parseInt(String(patient.age), 10);
    return 60;
  }, [patient]);

  // Read current values
  const genderSelection = answers['fpm_gender'] || answers['Sexo para equação'] || defaultGender;
  const age = answers['fpm_age'] !== undefined ? Number(answers['fpm_age']) : defaultAge;
  const weightKg = answers['fpm_weight'] !== undefined ? Number(answers['fpm_weight']) : 70;
  const dominantHand = answers['Mão Dominante'] || answers['fpm_dominant_hand'] || 'Direita';
  const dynamometerModel = answers['Dinamômetro / Modelo'] || answers['fpm_model'] || 'Jamar Hidráulico';
  const unit = answers['Unidade de Medida'] || answers['fpm_unit'] || 'kgf (Quilograma-força)';

  // Measurements
  const r1 = answers['Mão Direita - Tentativa 1'] ?? '';
  const r2 = answers['Mão Direita - Tentativa 2'] ?? '';
  const r3 = answers['Mão Direita - Tentativa 3'] ?? '';

  const l1 = answers['Mão Esquerda - Tentativa 1'] ?? '';
  const l2 = answers['Mão Esquerda - Tentativa 2'] ?? '';
  const l3 = answers['Mão Esquerda - Tentativa 3'] ?? '';

  // Calculate prediction and best values using Novaes et al. (2009)
  const fpmResult: FPMCalculationResult = useMemo(() => {
    const isMale = String(genderSelection).includes('(1)') || String(genderSelection).toLowerCase().startsWith('m');
    return calculateFPMNovaes({
      age: age || 60,
      weightKg: weightKg || 70,
      gender: isMale ? 1 : 0,
      dominantHand,
      rightAttempts: [r1, r2, r3],
      leftAttempts: [l1, l2, l3],
    });
  }, [age, weightKg, genderSelection, dominantHand, r1, r2, r3, l1, l2, l3]);

  // Automatically sync computed values to answers map for persistence and reports
  useEffect(() => {
    onChange((prev) => {
      const updates: Record<string, any> = {};

      if (fpmResult.bestRight > 0 && prev['Mão Direita - Maior Valor'] !== fpmResult.bestRight) {
        updates['Mão Direita - Maior Valor'] = fpmResult.bestRight;
      }
      if (fpmResult.bestLeft > 0 && prev['Mão Esquerda - Maior Valor'] !== fpmResult.bestLeft) {
        updates['Mão Esquerda - Maior Valor'] = fpmResult.bestLeft;
      }

      if (fpmResult.measuredDominant > 0) {
        updates['Resultado Medido - Mão Dominante'] = fpmResult.measuredDominant;
        updates['Resultado Previsto - Mão Dominante'] = fpmResult.predictedDominant;
        updates['% do Previsto - Mão Dominante'] = `${fpmResult.percDominant}%`;
      }

      if (fpmResult.measuredNonDominant > 0) {
        updates['Resultado Medido - Mão Não Dominante'] = fpmResult.measuredNonDominant;
        updates['Resultado Previsto - Mão Não Dominante'] = fpmResult.predictedNonDominant;
        updates['% do Previsto - Mão Não Dominante'] = `${fpmResult.percNonDominant}%`;
      }

      if (fpmResult.measuredDominant > 0) {
        updates['Classificação e Parecer Funcional'] = fpmResult.classification;
      }

      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [fpmResult]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* HEADER DA ESCALA */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            {scaleIndex + 1}
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              <span>{scaleTitle}</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-extrabold px-2 py-0.5 rounded-md border border-purple-400/30">
                Força Muscular
              </span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider">
              Dinamometria Manual • Equações Preditivas Brasileiras (Novaes et al., 2009)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {fpmResult.measuredDominant > 0 && (
            <div className="flex items-center space-x-2.5 bg-slate-800/90 dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Mão Dominante</p>
                <p className="text-sm font-black text-white">
                  {fpmResult.measuredDominant} kgf / {fpmResult.predictedDominant} kgf
                </p>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${fpmResult.badgeBg}`}>
                {fpmResult.percDominant}%
              </span>
            </div>
          )}

          {onRemoveScale && (
            <button
              type="button"
              onClick={onRemoveScale}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Remover escala"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* ========================================================
            1. PROTOCOLO PADRONIZADO DA AVALIAÇÃO
           ======================================================== */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-extrabold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Protocolo Padronizado de Dinamometria</span>
            </div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
              ASHT / Sociedade Internacional de Biomecânica
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>Posicionamento:</strong> Paciente sentado em cadeira sem braços, ombro aduzido junto ao tronco em posição neutra, cotovelo flexionado a 90° e antebraço em posição neutra (sem pronação/supinação).
            <br />
            <strong>Execução:</strong> Preensão máxima sustentada por 3 a 5 segundos sem compensações do tronco. Realizar 3 tentativas alternadas entre as mãos com intervalo mínimo de 30 segundos. Registrar o maior valor alcançado.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Dinamômetro / Modelo
              </label>
              <input
                type="text"
                value={dynamometerModel}
                onChange={(e) => updateField('Dinamômetro / Modelo', e.target.value)}
                placeholder="Ex: Jamar Hidráulico, Saehan"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Unidade de Medida
              </label>
              <CustomSelect
                value={unit}
                onChange={(val) => updateField('Unidade de Medida', String(val))}
                options={unitOptions}
                size="sm"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Mão Dominante
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateField('Mão Dominante', 'Direita')}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    dominantHand === 'Direita'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Direita (D)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('Mão Dominante', 'Esquerda')}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    dominantHand === 'Esquerda'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Esquerda (E)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. REGISTRO DAS MEDIDAS (TABELA DE 3 TENTATIVAS)
           ======================================================== */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="bg-slate-100 dark:bg-slate-800/80 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Registro das Medidas de Preensão (3 Tentativas)</span>
            </h5>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              O maior valor é computado automaticamente
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-5">Mão Avaliada</th>
                  <th className="p-3.5 text-center">Tentativa 1 (kgf)</th>
                  <th className="p-3.5 text-center">Tentativa 2 (kgf)</th>
                  <th className="p-3.5 text-center">Tentativa 3 (kgf)</th>
                  <th className="p-3.5 pr-5 text-right font-black text-purple-700 dark:text-purple-400">
                    Maior Valor (kgf)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* LINHA MÃO DIREITA */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 pl-5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Mão Direita</span>
                    {dominantHand === 'Direita' && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md font-extrabold">
                        Dominante
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0.0"
                      value={r1}
                      onChange={(e) => updateField('Mão Direita - Tentativa 1', e.target.value)}
                      className="w-20 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0.0"
                      value={r2}
                      onChange={(e) => updateField('Mão Direita - Tentativa 2', e.target.value)}
                      className="w-20 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0.0"
                      value={r3}
                      onChange={(e) => updateField('Mão Direita - Tentativa 3', e.target.value)}
                      className="w-20 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-3.5 pr-5 text-right font-black text-base text-purple-700 dark:text-purple-300">
                    {fpmResult.bestRight > 0 ? `${fpmResult.bestRight} kgf` : '---'}
                  </td>
                </tr>

                {/* LINHA MÃO ESQUERDA */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 pl-5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span>Mão Esquerda</span>
                    {dominantHand === 'Esquerda' && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md font-extrabold">
                        Dominante
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0.0"
                      value={l1}
                      onChange={(e) => updateField('Mão Esquerda - Tentativa 1', e.target.value)}
                      className="w-20 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0.0"
                      value={l2}
                      onChange={(e) => updateField('Mão Esquerda - Tentativa 2', e.target.value)}
                      className="w-20 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0.0"
                      value={l3}
                      onChange={(e) => updateField('Mão Esquerda - Tentativa 3', e.target.value)}
                      className="w-20 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-3.5 pr-5 text-right font-black text-base text-purple-700 dark:text-purple-300">
                    {fpmResult.bestLeft > 0 ? `${fpmResult.bestLeft} kgf` : '---'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================
            3. DADOS BIOMÉTRICOS & EQUAÇÃO DE NOVAES ET AL. (2009)
           ======================================================== */}
        <div className="rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Equações de Predição do Estudo Brasileiro (Novaes et al., 2009)</span>
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                FPM-D = 39,996 − (0,382 × idade) + (0,174 × peso) + (13,628 × sexo) • Sexo: 0 = Mulher, 1 = Homem
              </p>
            </div>
          </div>

          {/* INPUTS BIOMÉTRICOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Sexo para Equação
              </label>
              <CustomSelect
                value={genderSelection}
                onChange={(val) => updateField('fpm_gender', String(val))}
                options={genderEquationOptions}
                size="sm"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Idade do Paciente (anos)
              </label>
              <input
                type="number"
                value={age || ''}
                onChange={(e) => updateField('fpm_age', parseInt(e.target.value, 10) || 0)}
                placeholder="Ex: 60"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Peso Corporal (kg)
              </label>
              <input
                type="number"
                value={weightKg || ''}
                onChange={(e) => updateField('fpm_weight', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 70"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* PAINEL COMPARATIVO DE RESULTADOS */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40 p-5 border border-purple-500/30 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-purple-500/20">
              {/* CARD MÃO DOMINANTE */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Mão Dominante ({dominantHand})
                  </span>
                  {fpmResult.measuredDominant > 0 && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${fpmResult.badgeBg}`}>
                      {fpmResult.percDominant}% do previsto
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Medido (Real)</span>
                    <span className="text-2xl font-black text-white">
                      {fpmResult.measuredDominant > 0 ? `${fpmResult.measuredDominant} kgf` : '---'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Previsto (Novaes)</span>
                    <span className="text-xl font-black text-purple-300">
                      {fpmResult.predictedDominant} kgf
                    </span>
                  </div>
                </div>

                {fpmResult.measuredDominant > 0 && (
                  <p className="text-[11px] text-slate-300 font-medium">
                    Diferença:{' '}
                    <strong className={fpmResult.diffDominant >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {fpmResult.diffDominant >= 0 ? `+${fpmResult.diffDominant} kgf` : `${fpmResult.diffDominant} kgf`}
                    </strong>
                  </p>
                )}
              </div>

              {/* CARD MÃO NÃO DOMINANTE */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    Mão Não Dominante ({dominantHand === 'Direita' ? 'Esquerda' : 'Direita'})
                  </span>
                  {fpmResult.measuredNonDominant > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {fpmResult.percNonDominant}% do previsto
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Medido (Real)</span>
                    <span className="text-2xl font-black text-white">
                      {fpmResult.measuredNonDominant > 0 ? `${fpmResult.measuredNonDominant} kgf` : '---'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Previsto (Novaes)</span>
                    <span className="text-xl font-black text-indigo-300">
                      {fpmResult.predictedNonDominant} kgf
                    </span>
                  </div>
                </div>

                {fpmResult.measuredNonDominant > 0 && (
                  <p className="text-[11px] text-slate-300 font-medium">
                    Diferença:{' '}
                    <strong className={fpmResult.diffNonDominant >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {fpmResult.diffNonDominant >= 0 ? `+${fpmResult.diffNonDominant} kgf` : `${fpmResult.diffNonDominant} kgf`}
                    </strong>
                  </p>
                )}
              </div>
            </div>

            {/* CLASSIFICAÇÃO / CONCLUSÃO CLÍNICA */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">
                  <strong>Interpretação Clínica:</strong> {fpmResult.classification}
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Ponto de corte Sarcopenia EWGSOP2: Homens &lt; 27 kgf • Mulheres &lt; 16 kgf
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            4. OBSERVAÇÕES, COMPENSAÇÕES E CONDUTA
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Observações / Dor / Limitações / Compensações
            </label>
            <textarea
              rows={2}
              value={answers['Observações / Dor / Limitações / Compensações'] || ''}
              onChange={(e) => updateField('Observações / Dor / Limitações / Compensações', e.target.value)}
              placeholder="Anotar dor em punho/dedos, queixas de artrite, desvios ulnar/radial, compensação de ombro..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Conduta Fisioterapêutica / Metas / Reavaliação
            </label>
            <textarea
              rows={2}
              value={answers['Conduta / Metas / Reavaliação'] || ''}
              onChange={(e) => updateField('Conduta / Metas / Reavaliação', e.target.value)}
              placeholder="Treino resistido progressivo de preensão, exercícios com massinha/molas, metas para 60 dias..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
