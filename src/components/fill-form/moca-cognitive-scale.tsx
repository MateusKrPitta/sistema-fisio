'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  Info,
  ChevronDown,
  Volume2,
  HelpCircle,
  Eye,
  GraduationCap,
  Check,
} from 'lucide-react';
import {
  calculateMoCAScore,
  MoCACalculationResult,
} from '@/lib/clinical-presets';
import { CustomSelect } from '@/components/custom-select';

interface MocaCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  extra?: React.ReactNode;
  compact?: boolean;
}

function MocaCheckbox({
  checked,
  onChange,
  label,
  sublabel,
  extra,
  compact = false,
}: MocaCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`group w-full flex items-start text-left rounded-2xl border transition-all cursor-pointer ${
        compact ? 'p-3 space-x-2.5 items-center' : 'p-3.5 space-x-3'
      } ${
        checked
          ? 'bg-purple-500/10 border-purple-500/60 dark:border-purple-500/70 shadow-2xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
          compact ? '' : 'mt-0.5'
        } ${
          checked
            ? 'bg-purple-600 border-purple-600 text-white shadow-xs ring-2 ring-purple-600/20'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 group-hover:border-purple-400'
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <span
            className={`text-xs font-bold leading-tight ${
              checked
                ? 'text-purple-950 dark:text-purple-200'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {label}
          </span>
          {extra}
        </div>
        {sublabel && (
          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

function MocaTileCheckbox({
  checked,
  onChange,
  label,
  sublabel,
  category,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sublabel?: string;
  category?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`group w-full p-3.5 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
        checked
          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
          : 'bg-slate-50 dark:bg-slate-950/70 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="font-mono text-xs font-black uppercase tracking-wider truncate">{label}</span>
        <div
          className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
            checked
              ? 'bg-white text-purple-600 border-white'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-purple-400'
          }`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>
      {category && (
        <span className={`text-[10px] block truncate ${checked ? 'text-purple-200' : 'text-slate-400'}`}>
          {category}
        </span>
      )}
      <span className={`text-[10px] font-bold mt-2 block ${checked ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
        {checked ? '✓ Evocado (1 pt)' : sublabel || 'Não evocou'}
      </span>
    </button>
  );
}

function MocaOrientationTile({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`group w-full p-3 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
        checked
          ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
          : 'bg-slate-50 dark:bg-slate-950/70 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-xs font-bold truncate">{label}</span>
        <div
          className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
            checked
              ? 'bg-white text-sky-600 border-white'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-sky-400'
          }`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>
      <span className={`text-[10px] font-bold mt-1.5 block ${checked ? 'text-sky-100' : 'text-slate-400'}`}>
        {checked ? '✓ Correto (1 pt)' : 'Incorreto (0 pt)'}
      </span>
    </button>
  );
}

interface MoCACognitiveScaleSectionProps {
  answers: Record<string, any>;
  onChange: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  scaleTitle?: string;
  scaleIndex?: number;
  patient?: any;
  onRemoveScale?: () => void;
  readOnly?: boolean;
}

export function MoCACognitiveScaleSection({
  answers,
  onChange,
  scaleTitle = 'Montreal Cognitive Assessment (MoCA)',
  scaleIndex,
  patient,
  onRemoveScale,
  readOnly = false,
}: MoCACognitiveScaleSectionProps) {
  // Fluency Timer (60s countdown for Letter "F")
  const [fluencyTimer, setFluencyTimer] = useState<number>(60);
  const [isFluencyRunning, setIsFluencyRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFluencyRunning) {
      timerRef.current = setInterval(() => {
        setFluencyTimer((prev) => {
          if (prev <= 1) {
            setIsFluencyRunning(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFluencyRunning]);

  const handleStartFluencyTimer = () => {
    if (fluencyTimer === 0) setFluencyTimer(60);
    setIsFluencyRunning(!isFluencyRunning);
  };

  const handleResetFluencyTimer = () => {
    setIsFluencyRunning(false);
    setFluencyTimer(60);
  };

  const updateAnswerField = (fieldName: string, value: any) => {
    onChange((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const toggleCheckbox = (fieldName: string) => {
    const current = !!answers[fieldName];
    updateAnswerField(fieldName, !current);
  };

  // Escolaridade
  const educationYears =
    answers['moca_education_years'] !== undefined
      ? Number(answers['moca_education_years'])
      : answers['Anos de Escolaridade'] !== undefined
      ? Number(answers['Anos de Escolaridade'])
      : 12;

  // Real-time MoCA Calculation
  const mocaResult: MoCACalculationResult = useMemo(() => {
    return calculateMoCAScore(answers, educationYears);
  }, [answers, educationYears]);

  // Sync results to answers state for backend storage
  useEffect(() => {
    onChange((prev) => {
      const next = { ...prev };
      next['Escore Total MoCA'] = `${mocaResult.totalScore}/30 pontos`;
      next['moca_total_score'] = mocaResult.totalScore;
      next['Classificação Cognitiva MoCA'] = mocaResult.classification;
      next['moca_classification'] = mocaResult.classification;
      next['moca_raw_score'] = mocaResult.rawScore;
      next['moca_education_bonus'] = mocaResult.educationBonus;
      next['MoCA - Visuoespacial / Executiva'] = `${mocaResult.domains.visuospatialExecutive}/5 pts`;
      next['MoCA - Nomeação de Animais'] = `${mocaResult.domains.naming}/3 pts`;
      next['MoCA - Atenção e Concentração'] = `${mocaResult.domains.attention}/6 pts`;
      next['MoCA - Linguagem e Fluência'] = `${mocaResult.domains.language}/3 pts`;
      next['MoCA - Abstração (Semelhanças)'] = `${mocaResult.domains.abstraction}/2 pts`;
      next['MoCA - Evocação Tardia (Memória)'] = `${mocaResult.domains.delayedRecall}/5 pts`;
      next['MoCA - Orientação Têmporo-Espacial'] = `${mocaResult.domains.orientation}/6 pts`;
      next['MoCA - Escolaridade'] = `${educationYears} anos (${mocaResult.educationBonus > 0 ? '+1 pt bônus (≤ 12 anos)' : 'Sem bônus'})`;
      next['MoCA - Referência Científica'] =
        'Montreal Cognitive Assessment (MoCA) • Nasreddine ZS et al. (2005) • Adaptação Brasileira UNIFESP (Bertolucci et al.)';
      return next;
    });
  }, [mocaResult.totalScore, mocaResult.rawScore, mocaResult.educationBonus, educationYears]);

  const scoreProgress = (mocaResult.totalScore / 30) * 100;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xs space-y-4 sm:space-y-6">
      {/* HEADER DA ESCALA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Neurológica • Rastreio Cognitivo Global
            </span>
            <span className="text-xs text-slate-400 font-bold">Total: 30 Pontos</span>
          </div>
          <h4 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {scaleTitle}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Versão Brasileira (UNIFESP-SP) • Rastreio sensível para Comprometimento Cognitivo Leve (CCL) e Demências.
          </p>
        </div>

        {onRemoveScale && !readOnly && (
          <button
            type="button"
            onClick={onRemoveScale}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer self-end sm:self-auto"
          >
            Remover do laudo
          </button>
        )}
      </div>

      {/* ========================================================
          PAINEL DE PONTUAÇÃO AO VIVO E CORREÇÃO POR ESCOLARIDADE
         ======================================================== */}
      <div className="rounded-2xl sm:rounded-3xl bg-slate-950 text-white p-4 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative z-10">
          {/* Escore MoCA */}
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-600/30 shrink-0">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
                Pontuação Total Ajustada
              </span>
              <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-5xl font-black text-white font-mono">
                  {mocaResult.totalScore}
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-400">/ 30</span>
                {mocaResult.educationBonus > 0 && (
                  <span className="text-[11px] sm:text-xs font-bold text-amber-400 bg-amber-950/70 border border-amber-700/60 px-2 py-0.5 rounded-lg">
                    +1 pt escolaridade (≤ 12 anos)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seletor de Escolaridade */}
          <div className="bg-slate-900/90 p-2.5 sm:p-3 rounded-2xl border border-slate-800 flex items-center gap-2.5 sm:gap-3 w-full md:w-auto min-w-0 md:min-w-[260px]">
            <GraduationCap className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Escolaridade do Paciente
              </span>
              <CustomSelect
                value={educationYears}
                onChange={(val) => {
                  const num = parseInt(String(val), 10);
                  updateAnswerField('moca_education_years', num);
                  updateAnswerField('Anos de Escolaridade', num);
                }}
                options={[
                  { value: 8, label: '≤ 8 anos (Ensino Fundamental)' },
                  { value: 11, label: '11 anos (Ensino Médio)' },
                  { value: 12, label: '12 anos (Colegial completo) [+1 pt]' },
                  { value: 15, label: '13 a 15 anos (Superior incompleto)' },
                  { value: 16, label: '≥ 16 anos (Superior completo / Pós)' },
                ]}
                size="sm"
                triggerClassName="bg-slate-800 border-slate-700 text-white hover:bg-slate-750"
              />
            </div>
          </div>

          {/* Classificação Diagnóstica */}
          <div className="text-left md:text-right w-full md:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Estratificação Clínica
            </span>
            <span className={`inline-block text-xs font-black px-3 py-1.5 rounded-xl mt-1 ${mocaResult.badgeBg}`}>
              {mocaResult.classification}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Nota de corte de normalidade: ≥ 26 pontos
            </span>
          </div>
        </div>

        {/* Barra de Progresso Total */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
            <span>Escore Bruto: {mocaResult.rawScore} pts</span>
            <span>Ajustado: {mocaResult.totalScore} / 30 pts ({Math.round(scoreProgress)}%)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                mocaResult.totalScore >= 26
                  ? 'bg-emerald-500'
                  : mocaResult.totalScore >= 18
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${scoreProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          DOMÍNIOS DO MOCA (1 A 8)
         ======================================================== */}
      <div className="space-y-5">
        {/* DOMÍNIO 1: VISUOESPACIAL / EXECUTIVA (5 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                1
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Visuoespacial / Executiva
              </h5>
            </div>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.visuospatialExecutive} / 5 pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trilha Alternada */}
            <MocaCheckbox
              checked={!!answers['moca_trail']}
              onChange={() => toggleCheckbox('moca_trail')}
              label="Trilha Alternada (1 ponto)"
              sublabel="Ligou alternando números e letras em ordem ascendente (1-A-2-B-3-C-4-D-5-E) sem cruzar linhas."
            />

            {/* Cópia do Cubo */}
            <MocaCheckbox
              checked={!!answers['moca_cube']}
              onChange={() => toggleCheckbox('moca_cube')}
              label="Cópia do Cubo (1 ponto)"
              sublabel="Desenho tridimensional correto com todas as 12 linhas presentes e faces paralelas."
            />
          </div>

          {/* Desenho do Relógio (3 pontos: Contorno, Números, Ponteiros) */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Desenho do Relógio (Onze horas e dez minutos • 11:10)
              </span>
              <span className="text-[11px] font-bold text-slate-400">Total: 3 pontos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MocaCheckbox
                checked={!!answers['moca_clock_contour']}
                onChange={() => toggleCheckbox('moca_clock_contour')}
                label="Contorno circular"
                extra={<span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">1 pt</span>}
                compact
              />
              <MocaCheckbox
                checked={!!answers['moca_clock_numbers']}
                onChange={() => toggleCheckbox('moca_clock_numbers')}
                label="Números 1 a 12"
                extra={<span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">1 pt</span>}
                compact
              />
              <MocaCheckbox
                checked={!!answers['moca_clock_hands']}
                onChange={() => toggleCheckbox('moca_clock_hands')}
                label="Ponteiros em 11:10"
                extra={<span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">1 pt</span>}
                compact
              />
            </div>
          </div>
        </div>

        {/* DOMÍNIO 2: NOMEAÇÃO (3 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                2
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Nomeação de Animais
              </h5>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.naming} / 3 pts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MocaCheckbox
              checked={!!answers['moca_lion']}
              onChange={() => toggleCheckbox('moca_lion')}
              label="1. Leão"
              sublabel="Nomeou corretamente (1 pt)"
            />
            <MocaCheckbox
              checked={!!answers['moca_rhino']}
              onChange={() => toggleCheckbox('moca_rhino')}
              label="2. Rinoceronte"
              sublabel="Nomeou corretamente (1 pt)"
            />
            <MocaCheckbox
              checked={!!answers['moca_camel']}
              onChange={() => toggleCheckbox('moca_camel')}
              label="3. Camelo / Dromedário"
              sublabel="Nomeou corretamente (1 pt)"
            />
          </div>
        </div>

        {/* DOMÍNIO 3: MEMÓRIA (REGISTRO / APRENDIZAGEM - SEM PONTOS IMEDIATOS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                3
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Memória (Registro e Aprendizagem)
              </h5>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Sem pontuação imediata</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800 text-xs space-y-2">
            <p className="font-semibold text-amber-900 dark:text-amber-300">
              Leia a lista de palavras (1 por segundo). O paciente deve repeti-las. Faça 2 tentativas para fixação.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs font-black">
              {['Rosto', 'Veludo', 'Igreja', 'Margarida', 'Vermelho'].map((w) => (
                <span key={w} className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white shadow-xs">
                  {w}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1">
              * A evocação com pontuação (5 pontos) será realizada após aproximadamente 5 minutos na Seção 7.
            </p>
          </div>
        </div>

        {/* DOMÍNIO 4: ATENÇÃO (6 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                4
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Atenção e Concentração
              </h5>
            </div>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.attention} / 6 pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Dígitos Direta */}
            <MocaCheckbox
              checked={!!answers['moca_digits_forward']}
              onChange={() => toggleCheckbox('moca_digits_forward')}
              label="Ordem Direta (1 pt)"
              sublabel={
                <>
                  <span className="font-mono text-purple-600 dark:text-purple-400 block mt-0.5 font-extrabold">
                    2 - 1 - 8 - 5 - 4
                  </span>
                  <span className="text-[10px] text-slate-400">Repetiu corretamente</span>
                </>
              }
            />

            {/* Dígitos Inversa */}
            <MocaCheckbox
              checked={!!answers['moca_digits_backward']}
              onChange={() => toggleCheckbox('moca_digits_backward')}
              label="Ordem Inversa (1 pt)"
              sublabel={
                <>
                  <span className="font-mono text-purple-600 dark:text-purple-400 block mt-0.5 font-extrabold">
                    7 - 4 - 2 → (2 - 4 - 7)
                  </span>
                  <span className="text-[10px] text-slate-400">Repetiu invertido</span>
                </>
              }
            />

            {/* Vigilância Letra A */}
            <MocaCheckbox
              checked={!!answers['moca_vigilance_a']}
              onChange={() => toggleCheckbox('moca_vigilance_a')}
              label="Vigilância - Letra A (1 pt)"
              sublabel={
                <>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 font-mono">
                    F B <strong>A</strong> C M N <strong>A</strong> <strong>A</strong> J K L B <strong>A</strong> F <strong>A</strong> K D E <strong>A</strong> <strong>A</strong> <strong>A</strong> J <strong>A</strong> M O F <strong>A</strong> <strong>A</strong> B
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">Acertou (≤ 1 erro)</span>
                </>
              }
            />
          </div>

          {/* Subtração Seriada de 7 (3 pontos) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Subtração Seriada de 7 (Partindo de 100)
              </span>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                4-5 acertos: 3 pts • 2-3 acertos: 2 pts • 1 acerto: 1 pt
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'moca_sub_93', label: '93 (100 - 7)' },
                { key: 'moca_sub_86', label: '86 (93 - 7)' },
                { key: 'moca_sub_79', label: '79 (86 - 7)' },
                { key: 'moca_sub_72', label: '72 (79 - 7)' },
                { key: 'moca_sub_65', label: '65 (72 - 7)' },
              ].map((sub) => {
                const isChecked = !!answers[sub.key];
                return (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() => toggleCheckbox(sub.key)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                        isChecked ? 'bg-white text-purple-600 border-white' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* DOMÍNIO 5: LINGUAGEM (3 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center font-black text-xs">
                5
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Linguagem e Fluência Verbal
              </h5>
            </div>
            <span className="text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.language} / 3 pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MocaCheckbox
              checked={!!answers['moca_sentence_1']}
              onChange={() => toggleCheckbox('moca_sentence_1')}
              label="Repetição de Frase 1 (1 ponto)"
              sublabel={
                <>
                  <p className="text-slate-600 dark:text-slate-300 italic mt-0.5">
                    &ldquo;Eu somente sei que é João quem será ajudado hoje.&rdquo;
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">Repetição exata sem erros</span>
                </>
              }
            />

            <MocaCheckbox
              checked={!!answers['moca_sentence_2']}
              onChange={() => toggleCheckbox('moca_sentence_2')}
              label="Repetição de Frase 2 (1 ponto)"
              sublabel={
                <>
                  <p className="text-slate-600 dark:text-slate-300 italic mt-0.5">
                    &ldquo;O gato sempre se esconde embaixo do sofá quando o cachorro está na sala.&rdquo;
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">Repetição exata sem erros</span>
                </>
              }
            />
          </div>

          {/* Fluência Verbal Fonêmica (Letra F em 1 min) */}
          <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-300 block">
                  Fluência Verbal Fonêmica: Letra &ldquo;F&rdquo; (1 Minuto)
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Dizer o maior número possível de palavras que comecem com a letra <strong>F</strong> em 60s (critério de pontuação: <strong>≥ 11 palavras</strong>).
                </p>
              </div>

              {/* Cronômetro Rápido da Fluência */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 text-white font-mono font-black text-sm px-3 py-1.5 rounded-xl border border-slate-700">
                  00:{String(fluencyTimer).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={handleStartFluencyTimer}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  {isFluencyRunning ? 'Pausar' : fluencyTimer === 0 ? 'Reiniciar' : 'Disparar 60s'}
                </button>
                <button
                  type="button"
                  onClick={handleResetFluencyTimer}
                  className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                  title="Zerar para 60s"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => toggleCheckbox('moca_fluency_f')}
                className={`group flex items-center space-x-2.5 p-2.5 px-3 rounded-xl border transition-all cursor-pointer text-left ${
                  answers['moca_fluency_f']
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-teal-200/80 dark:border-teal-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                    answers['moca_fluency_f']
                      ? 'bg-white text-teal-700 border-white'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 group-hover:border-teal-500'
                  }`}
                >
                  {answers['moca_fluency_f'] && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold">
                  Atingiu ≥ 11 palavras válidas com a letra &ldquo;F&rdquo; (1 ponto)
                </span>
              </button>

              <div className="flex items-center gap-1.5 sm:ml-auto">
                <span className="text-[11px] font-bold text-slate-500">Palavras ditas:</span>
                <input
                  type="number"
                  placeholder="Ex: 14"
                  value={answers['moca_fluency_count'] || ''}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 0;
                    updateAnswerField('moca_fluency_count', count);
                    if (count >= 11) updateAnswerField('moca_fluency_f', true);
                  }}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DOMÍNIO 6: ABSTRAÇÃO (2 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center font-black text-xs">
                6
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Abstração (Semelhanças)
              </h5>
            </div>
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.abstraction} / 2 pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MocaCheckbox
              checked={!!answers['moca_abs_transport']}
              onChange={() => toggleCheckbox('moca_abs_transport')}
              label="Trem — Bicicleta (1 ponto)"
              sublabel="Resposta aceita: Meios de transporte / veículos / servem para viajar."
            />

            <MocaCheckbox
              checked={!!answers['moca_abs_measure']}
              onChange={() => toggleCheckbox('moca_abs_measure')}
              label="Relógio — Régua (1 ponto)"
              sublabel="Resposta aceita: Instrumentos de medição / medem grandezas (tempo e comprimento)."
            />
          </div>
        </div>

        {/* DOMÍNIO 7: EVOCAÇÃO TARDIA (5 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 flex items-center justify-center font-black text-xs">
                7
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Evocação Tardia (Memória Retentiva - 5 Pontos)
              </h5>
            </div>
            <span className="text-xs font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.delayedRecall} / 5 pts
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pontue <strong>1 ponto apenas para palavras lembradas espontaneamente SEM PISTAS</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'moca_recall_face', label: 'Rosto', category: 'Parte do corpo' },
              { key: 'moca_recall_velvet', label: 'Veludo', category: 'Tipo de tecido' },
              { key: 'moca_recall_church', label: 'Igreja', category: 'Edifício / Construção' },
              { key: 'moca_recall_daisy', label: 'Margarida', category: 'Tipo de flor' },
              { key: 'moca_recall_red', label: 'Vermelho', category: 'Uma cor' },
            ].map((w) => (
              <MocaTileCheckbox
                key={w.key}
                checked={!!answers[w.key]}
                onChange={() => toggleCheckbox(w.key)}
                label={w.label}
                category={w.category}
              />
            ))}
          </div>
        </div>

        {/* DOMÍNIO 8: ORIENTAÇÃO (6 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 flex items-center justify-center font-black text-xs">
                8
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Orientação Têmporo-Espacial
              </h5>
            </div>
            <span className="text-xs font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.orientation} / 6 pts
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { key: 'moca_orient_day', label: 'Dia do Mês' },
              { key: 'moca_orient_month', label: 'Mês' },
              { key: 'moca_orient_year', label: 'Ano' },
              { key: 'moca_orient_weekday', label: 'Dia da Semana' },
              { key: 'moca_orient_place', label: 'Lugar' },
              { key: 'moca_orient_city', label: 'Cidade' },
            ].map((item) => (
              <MocaOrientationTile
                key={item.key}
                checked={!!answers[item.key]}
                onChange={() => toggleCheckbox(item.key)}
                label={item.label}
              />
            ))}
          </div>
        </div>

        {/* OBSERVAÇÕES E NOTAS COGNITIVAS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
            Observações Clínicas e Comportamentais Durante a Aplicação
          </label>
          <textarea
            rows={2}
            value={answers['moca_observations'] || answers['Observações Cognitivas / Comportamentais'] || ''}
            onChange={(e) => {
              updateAnswerField('moca_observations', e.target.value);
              updateAnswerField('Observações Cognitivas / Comportamentais', e.target.value);
            }}
            placeholder="Anote nível de cooperação, queixas de esquecimento relatadas por familiares, ansiedade frente aos testes ou flutuações atencionais..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* ========================================================
          REFERÊNCIA OFICIAL DO MOCA
         ======================================================== */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
          <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="font-black uppercase tracking-wider text-[11px] text-purple-900 dark:text-purple-300">
            Referência Científica e Validação Brasileira:
          </span>
        </div>
        <div className="pl-6 border-l-2 border-purple-500/70 space-y-1">
          <p className="font-black text-xs text-slate-900 dark:text-slate-100">
            Montreal Cognitive Assessment (MoCA) • Versão Experimental Brasileira
          </p>
          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
            Nasreddine ZS, Phillips NA, Bédirian V, et al. <em>The Montreal Cognitive Assessment, MoCA: a brief screening tool for mild cognitive impairment</em>. J Am Geriatr Soc. 2005.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Adaptação e normatização brasileira: <strong>Ana Luisa Rosas Sarmento, Paulo Henrique Ferreira Bertolucci, José Roberto Wajman (UNIFESP-SP, 2007)</strong>. Website oficial: <em>www.mocatest.org</em>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
            Critério normativo: Pontuação máxima de 30 pontos. Nota de corte recomendada: ≥ 26 pontos para cognição normal. Pontuações de 18 a 25 sugerem Comprometimento Cognitivo Leve (CCL). Adiciona-se 1 ponto para indivíduos com 12 anos ou menos de escolaridade formal.
          </p>
        </div>
      </div>
    </div>
  );
}
