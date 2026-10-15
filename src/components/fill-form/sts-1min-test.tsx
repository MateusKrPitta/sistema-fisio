'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  RotateCw,
  Volume2,
  VolumeX,
  BookOpen,
  Info,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  borgScaleOptions,
  calculateSTS1MinNorms,
  STS1MinCalculationResult,
} from '@/lib/clinical-presets';
import { CustomSelect } from '@/components/custom-select';

const borgOptions = [
  { value: '', label: 'Selecione...' },
  ...borgScaleOptions.map((opt) => ({ value: opt, label: opt })),
];

interface STS1MinTestSectionProps {
  answers: Record<string, any>;
  onChange: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  scaleTitle?: string;
  scaleIndex?: number;
  patient?: any;
  onRemoveScale?: () => void;
  readOnly?: boolean;
}

const TOTAL_SECONDS = 60;

export function STS1MinTestSection({
  answers,
  onChange,
  scaleTitle = 'Teste de Sentar e Levantar em 1 Minuto (TSL 1 min)',
  scaleIndex,
  patient,
  onRemoveScale,
  readOnly = false,
}: STS1MinTestSectionProps) {
  // Timer State (60s countdown)
  const [secondsLeft, setSecondsLeft] = useState<number>(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Context for beeps
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = (freq = 800, duration = 0.15, type: OscillatorType = 'sine') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            clearInterval(timerRef.current!);
            // Final completion beep (fanfare tone)
            playBeep(900, 0.4, 'triangle');
            setTimeout(() => playBeep(1200, 0.6, 'sine'), 250);
            return 0;
          }

          const nextSec = prev - 1;

          // Alert at 30 seconds (halfway)
          if (nextSec === 30) {
            playBeep(650, 0.25, 'sine');
          }

          // Countdown last 3 seconds
          if (nextSec <= 3 && nextSec >= 1) {
            playBeep(750, 0.12, 'square');
          }

          return nextSec;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  const handleStartPause = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(TOTAL_SECONDS);
      setIsRunning(true);
      playBeep(880, 0.2);
    } else {
      setIsRunning((prev) => {
        const next = !prev;
        if (next) playBeep(880, 0.2);
        return next;
      });
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(TOTAL_SECONDS);
  };

  const updateAnswerField = (fieldName: string, value: any) => {
    onChange((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Patient Biometrics
  const defaultGender = useMemo(() => {
    if (!patient) return 'Feminino';
    const g = String(patient.gender || patient.sexo || '').toLowerCase();
    if (g.startsWith('m')) return 'Masculino';
    return 'Feminino';
  }, [patient]);

  const defaultAge = useMemo(() => {
    if (!patient) return 50;
    if (patient.age && Number(patient.age) > 0) return Number(patient.age);
    if (patient.birthDate) {
      const birth = new Date(patient.birthDate);
      if (!isNaN(birth.getTime())) {
        const diff = Date.now() - birth.getTime();
        const ageDate = new Date(diff);
        const calculated = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (calculated > 0 && calculated < 120) return calculated;
      }
    }
    return 50;
  }, [patient]);

  const gender = answers['TSL_Sexo'] || defaultGender;
  const age = answers['TSL_Idade'] !== undefined ? Number(answers['TSL_Idade']) : defaultAge;

  // Repetitions
  const repetitions =
    answers['Repetições Realizadas (1 min)'] !== undefined
      ? Number(answers['Repetições Realizadas (1 min)'])
      : answers['sts_reps'] !== undefined
      ? Number(answers['sts_reps'])
      : 0;

  const handleAddReps = (delta: number) => {
    const nextVal = Math.max(0, repetitions + delta);
    updateAnswerField('Repetições Realizadas (1 min)', nextVal);
    updateAnswerField('sts_reps', nextVal);
    playBeep(520, 0.08, 'sine');
  };

  // Normative Calculation (Strassmann et al., 2013)
  const normResult: STS1MinCalculationResult = useMemo(() => {
    return calculateSTS1MinNorms({
      gender,
      age: age || 50,
      repetitions,
    });
  }, [gender, age, repetitions]);

  // Sync calculated normative results to answers state
  useEffect(() => {
    onChange((prev) => {
      const next = { ...prev };
      next['Mediana Prevista (p50)'] = `${normResult.p50} reps`;
      next['sts_p50'] = normResult.p50;
      next['Limite Inferior da Normalidade (p2,5)'] = `${normResult.p2_5} reps`;
      next['sts_p2_5'] = normResult.p2_5;
      next['Faixa Etária de Referência'] = normResult.ageGroup;
      next['Referência Bibliográfica'] =
        'Strassmann et al. (2013) • Population-based reference values for the 1-min sit-to-stand test • Int J Public Health';
      next['sts_reference'] =
        'Strassmann A, Steurer-Stey C, Lana KD, Zoller M, Turk AJ, Suter P, Puhan MA. Int J Public Health 2013; 58(6):949-53.';

      if (repetitions > 0) {
        next['% da Mediana (p50)'] = `${normResult.percentageOfMedian}%`;
        next['sts_perc_p50'] = `${normResult.percentageOfMedian}%`;
        next['Percentil Atingido'] = normResult.percentileRank;
        next['sts_percentile_rank'] = normResult.percentileRank;
        next['Classificação Funcional'] = normResult.classification;
        next['sts_classification'] = normResult.classification;
      }
      return next;
    });
  }, [normResult.p50, normResult.p2_5, normResult.percentageOfMedian, repetitions]);

  // Sync initial biometric defaults
  useEffect(() => {
    onChange((prev) => {
      const updates: Record<string, any> = {};
      if (prev['TSL_Sexo'] === undefined) updates['TSL_Sexo'] = defaultGender;
      if (prev['TSL_Idade'] === undefined && defaultAge) updates['TSL_Idade'] = defaultAge;
      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [defaultGender, defaultAge]);

  const timerPercentage = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      {/* HEADER DA ESCALA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Cardiorrespiratória • Capacidade Funcional
            </span>
            <span className="text-xs text-slate-400 font-bold">Protocolo de 60s</span>
          </div>
          <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {scaleTitle}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Avaliação da capacidade funcional submáxima e resistência muscular de membros inferiores em cadeira padronizada.
          </p>
        </div>

        {onRemoveScale && !readOnly && (
          <button
            type="button"
            onClick={onRemoveScale}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
          >
            Remover do laudo
          </button>
        )}
      </div>

      {/* ========================================================
          1. CRONÔMETRO PROFISSIONAL DE 1 MINUTO COM ÁUDIO
         ======================================================== */}
      <div className="rounded-3xl bg-slate-950 text-white p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Glow de fundo */}
        <div
          className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
            isRunning ? 'bg-indigo-500/20' : secondsLeft === 0 ? 'bg-emerald-500/25' : 'bg-blue-500/10'
          }`}
        />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Informações do Cronômetro */}
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isRunning
                  ? 'bg-indigo-500 text-white animate-pulse shadow-lg shadow-indigo-500/40'
                  : secondsLeft === 0
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Timer className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                  Cronômetro Oficial de 60s
                </span>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title={soundEnabled ? 'Silenciar avisos sonoros' : 'Ativar avisos sonoros'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                </button>
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  00:{String(secondsLeft).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {secondsLeft === 0
                    ? '✓ Concluído!'
                    : isRunning
                    ? secondsLeft <= 30
                      ? 'Metade final! Mantenha o ritmo'
                      : 'Em andamento...'
                    : 'Pronto para iniciar'}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full md:max-w-xs space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>Decorrido: {TOTAL_SECONDS - secondsLeft}s</span>
              <span>Total: 60s</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  secondsLeft <= 10
                    ? 'bg-rose-500'
                    : secondsLeft <= 30
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          </div>

          {/* Controles de Play/Pause/Reset */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleStartPause}
              className={`flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-md cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30'
                  : secondsLeft === 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{secondsLeft === 0 ? 'Reiniciar 1 min' : secondsLeft === TOTAL_SECONDS ? 'Iniciar Teste' : 'Continuar'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition-all cursor-pointer"
              title="Zerar cronômetro para 60s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CONTADOR DE REPETIÇÕES RÁPIDO & PARÂMETROS DO PACIENTE
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CONTADOR DE REPETIÇÕES (COLUNA ESQUERDA - 7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Desempenho em 1 Minuto
              </span>
              <h5 className="font-extrabold text-base text-slate-900 dark:text-white">
                Contador de Repetições de Sentar e Levantar
              </h5>
            </div>
            <button
              type="button"
              onClick={() => handleAddReps(-repetitions)}
              disabled={repetitions === 0}
              className="text-[11px] font-bold text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
              title="Zerar contagem"
            >
              Zerar Repetições
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
            {/* Display Grande de Repetições */}
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={0}
                value={repetitions || ''}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  updateAnswerField('Repetições Realizadas (1 min)', val);
                  updateAnswerField('sts_reps', val);
                }}
                placeholder="0"
                className="w-28 sm:w-32 bg-white dark:bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-2 text-center text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-600"
              />
              <span className="text-sm font-black text-slate-600 dark:text-slate-300">
                repetições
              </span>
            </div>

            {/* Botões Rápidos */}
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <button
                type="button"
                onClick={() => handleAddReps(-1)}
                disabled={repetitions <= 0}
                className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 font-black text-lg transition-all cursor-pointer"
                title="Subtrair 1 repetição"
              >
                <Minus className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => handleAddReps(1)}
                className="px-5 h-11 flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
                title="Adicionar 1 repetição"
              >
                <Plus className="w-5 h-5" />
                <span>+1 Rep</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddReps(5)}
                className="px-3.5 h-11 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl font-bold text-xs transition-all cursor-pointer"
                title="Adicionar 5 repetições"
              >
                +5
              </button>
            </div>
          </div>

          {/* Registro de Pausas durante o minuto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Pausas durante o teste
              </label>
              <input
                type="text"
                value={answers['Pausas Realizadas'] || answers['sts_pauses'] || ''}
                onChange={(e) => {
                  updateAnswerField('Pausas Realizadas', e.target.value);
                  updateAnswerField('sts_pauses', e.target.value);
                }}
                placeholder="Ex: Nenhuma pausa ou 1 pausa de 6s"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Altura da Cadeira / Apoio
              </label>
              <input
                type="text"
                defaultValue="46 cm (Padronizada sem braços)"
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* PARÂMETROS BIOMÉTRICOS PARA NORMATIZAÇÃO (COLUNA DIREITA - 5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Tabela de Strassmann et al. (2013)
            </span>
            <h5 className="font-extrabold text-base text-slate-900 dark:text-white">
              Parâmetros Populacionais
            </h5>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Sexo para Tabela de Referência
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateAnswerField('TSL_Sexo', 'Feminino')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    gender === 'Feminino'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Feminino (Women)
                </button>
                <button
                  type="button"
                  onClick={() => updateAnswerField('TSL_Sexo', 'Masculino')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    gender === 'Masculino'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Masculino (Men)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Idade do Paciente (Anos)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={age || ''}
                  onChange={(e) => updateAnswerField('TSL_Idade', parseInt(e.target.value) || 0)}
                  placeholder="Ex: 58"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  Faixa: {normResult.ageGroup}
                </span>
              </div>
            </div>

            {/* Resumo de Percentis da Faixa */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                Valores Normativos ({gender} • {normResult.ageGroup}):
              </span>
              <div className="grid grid-cols-5 gap-1 text-center font-bold">
                <div className="bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-[9px] text-slate-400">p2.5</span>
                  <span className="text-rose-500 font-black">{normResult.p2_5}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-[9px] text-slate-400">p25</span>
                  <span className="text-amber-500 font-black">{normResult.p25}</span>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/60 p-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <span className="block text-[9px] text-indigo-500 font-black">p50</span>
                  <span className="text-indigo-600 dark:text-indigo-300 font-black">{normResult.p50}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-[9px] text-slate-400">p75</span>
                  <span className="text-teal-500 font-black">{normResult.p75}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-[9px] text-slate-400">p97.5</span>
                  <span className="text-emerald-500 font-black">{normResult.p97_5}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. RESULTADO CLÍNICO COMPARATIVO EM TEMPO REAL
         ======================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 shadow-lg border border-indigo-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400">
          <Sparkles className="w-5 h-5" />
          <h5 className="font-black text-sm uppercase tracking-wider text-indigo-200">
            Estratificação de Desempenho Funcional (Strassmann et al., 2013)
          </h5>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* REPETIÇÕES REALIZADAS */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Repetições Realizadas
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black text-white">{repetitions}</span>
              <span className="text-xs font-bold text-indigo-300">reps em 1 min</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {normResult.isBelowLowerLimit ? '⚠️ Abaixo do limite inferior' : 'Desempenho avaliado'}
            </span>
          </div>

          {/* MEDIANA POPULACIONAL (P50) */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Mediana Populacional (P50)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black text-indigo-300">{normResult.p50}</span>
              <span className="text-xs font-bold text-indigo-400">reps esperadas</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Faixa P25-P75: {normResult.p25} a {normResult.p75} reps
            </span>
          </div>

          {/* % DA MEDIANA (P50) */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              % da Mediana Prevista
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-white">
                {repetitions > 0 ? `${normResult.percentageOfMedian}%` : '---'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {repetitions >= normResult.p50 ? '≥ 100% da média populacional' : '< 100% da média populacional'}
            </span>
          </div>

          {/* PERCENTIL ATINGIDO */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Percentil Populacional
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">
                {repetitions > 0 ? normResult.percentileRank : '---'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Limite inferior (p2,5): {normResult.p2_5} reps
            </span>
          </div>
        </div>

        {/* Parecer Diagnóstico Resumido */}
        <div className="pt-3 border-t border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {normResult.isBelowLowerLimit ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-200">
              <strong>Classificação Clínica:</strong> {normResult.classification}
            </span>
          </div>

          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${normResult.badgeBg}`}>
            {repetitions > 0 ? normResult.percentileRank : 'Aguardando Teste'}
          </span>
        </div>
      </div>

      {/* ========================================================
          4. SINAIS VITAIS BASAIS E FINAIS (BORG, SPO2, FC, PA)
         ======================================================== */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Sinais Vitais e Percepção de Esforço (Basal vs Final)</span>
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* BASAL */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              1. Parâmetros Basais (Pré-Teste)
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">SpO2 Basal</label>
                <input
                  type="number"
                  value={answers['SpO2 Basal'] || answers['sts_spo2_basal'] || ''}
                  onChange={(e) => {
                    updateAnswerField('SpO2 Basal', e.target.value);
                    updateAnswerField('sts_spo2_basal', e.target.value);
                  }}
                  placeholder="98%"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">FC Basal</label>
                <input
                  type="number"
                  value={answers['FC Basal'] || answers['sts_fc_basal'] || ''}
                  onChange={(e) => {
                    updateAnswerField('FC Basal', e.target.value);
                    updateAnswerField('sts_fc_basal', e.target.value);
                  }}
                  placeholder="76 bpm"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PA Basal</label>
                <input
                  type="text"
                  value={answers['PA Basal'] || answers['sts_pa_basal'] || ''}
                  onChange={(e) => {
                    updateAnswerField('PA Basal', e.target.value);
                    updateAnswerField('sts_pa_basal', e.target.value);
                  }}
                  placeholder="120x80"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dispneia Basal (Borg)</label>
                <CustomSelect
                  value={answers['Dispneia Basal (Borg)'] || answers['sts_borg_dispneia_basal'] || ''}
                  onChange={(val) => {
                    updateAnswerField('Dispneia Basal (Borg)', String(val));
                    updateAnswerField('sts_borg_dispneia_basal', String(val));
                  }}
                  options={borgOptions}
                  size="sm"
                  placeholder="Selecione..."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fadiga Basal (Borg)</label>
                <CustomSelect
                  value={answers['Fadiga Basal (Borg)'] || answers['sts_borg_fadiga_basal'] || ''}
                  onChange={(val) => {
                    updateAnswerField('Fadiga Basal (Borg)', String(val));
                    updateAnswerField('sts_borg_fadiga_basal', String(val));
                  }}
                  options={borgOptions}
                  size="sm"
                  placeholder="Selecione..."
                />
              </div>
            </div>
          </div>

          {/* FINAL */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              2. Parâmetros Imediatos (Pós-1 Minuto)
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">SpO2 Final</label>
                <input
                  type="number"
                  value={answers['SpO2 Final'] || answers['sts_spo2_final'] || ''}
                  onChange={(e) => {
                    updateAnswerField('SpO2 Final', e.target.value);
                    updateAnswerField('sts_spo2_final', e.target.value);
                  }}
                  placeholder="96%"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">FC Final</label>
                <input
                  type="number"
                  value={answers['FC Final'] || answers['sts_fc_final'] || ''}
                  onChange={(e) => {
                    updateAnswerField('FC Final', e.target.value);
                    updateAnswerField('sts_fc_final', e.target.value);
                  }}
                  placeholder="115 bpm"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PA Final</label>
                <input
                  type="text"
                  value={answers['PA Final'] || answers['sts_pa_final'] || ''}
                  onChange={(e) => {
                    updateAnswerField('PA Final', e.target.value);
                    updateAnswerField('sts_pa_final', e.target.value);
                  }}
                  placeholder="130x85"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dispneia Final (Borg)</label>
                <CustomSelect
                  value={answers['Dispneia Final (Borg)'] || answers['sts_borg_dispneia_final'] || ''}
                  onChange={(val) => {
                    updateAnswerField('Dispneia Final (Borg)', String(val));
                    updateAnswerField('sts_borg_dispneia_final', String(val));
                  }}
                  options={borgOptions}
                  size="sm"
                  placeholder="Selecione..."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fadiga Final (Borg)</label>
                <CustomSelect
                  value={answers['Fadiga Final (Borg)'] || answers['sts_borg_fadiga_final'] || ''}
                  onChange={(val) => {
                    updateAnswerField('Fadiga Final (Borg)', String(val));
                    updateAnswerField('sts_borg_fadiga_final', String(val));
                  }}
                  options={borgOptions}
                  size="sm"
                  placeholder="Selecione..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* OBSERVAÇÕES E CONDUTA */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
            Observações Clínicas / Sintomas / Intercorrências
          </label>
          <textarea
            rows={2}
            value={answers['Observações / Sintomas / Intercorrências'] || answers['sts_obs'] || ''}
            onChange={(e) => {
              updateAnswerField('Observações / Sintomas / Intercorrências', e.target.value);
              updateAnswerField('sts_obs', e.target.value);
            }}
            placeholder="Descreva sintomas relatados durante ou após o teste (fadiga em quadríceps, tontura), equilíbrio ao sentar/levantar ou intercorrências..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ========================================================
          5. REFERÊNCIA BIBLIOGRÁFICA OFICIAL (STRASSMANN ET AL.)
         ======================================================== */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-black uppercase tracking-wider text-[11px] text-indigo-900 dark:text-indigo-300">
            Referência Bibliográfica e Valores Normativos:
          </span>
        </div>
        <div className="pl-6 border-l-2 border-indigo-500/70 space-y-1">
          <p className="font-black text-xs text-slate-900 dark:text-slate-100">
            Population-based reference values for the 1-min sit-to-stand test
          </p>
          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
            Strassmann A, Steurer-Stey C, Lana KD, Zoller M, Turk AJ, Suter P, Puhan MA.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            <em>International Journal of Public Health</em>. 2013 Dec;58(6):949-53. doi: 10.1007/s00038-013-0504-z. PMID: 23974352.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
            Nota metodológica: Os percentis (p2.5 a p97.5) fornecem parâmetros populacionais estratificados por gênero e faixas etárias de 5 anos para adultos de 20 a 79 anos.
          </p>
        </div>
      </div>
    </div>
  );
}
