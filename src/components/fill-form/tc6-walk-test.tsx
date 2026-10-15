'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  Info,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { borgScaleOptions, calculateTC6Prediction, TC6CalculationResult } from '@/lib/clinical-presets';
import { CustomSelect } from '@/components/custom-select';

interface TC6WalkTestSectionProps {
  answers: Record<string, any>;
  onChange: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  scaleTitle?: string;
  scaleIndex?: number;
  patient?: any;
  onRemoveScale?: () => void;
  readOnly?: boolean;
}

// ATS Standard Phrases for each minute
const ATS_MINUTELY_PHRASES: Record<number, string> = {
  1: 'Você está indo muito bem. Faltam 5 minutos.',
  2: 'Continue com esse bom trabalho. Faltam 4 minutos.',
  3: 'Você está na metade do teste. Faltam 3 minutos.',
  4: 'Mantenha esse bom ritmo. Faltam apenas 2 minutos.',
  5: 'Você está quase no final! Falta apenas 1 minuto.',
  6: 'Tempo esgotado! Pare exatamente onde você está.',
};

const genderOptions = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' },
];

const borgOptions = [
  { value: '', label: 'Selecione...' },
  ...borgScaleOptions.map((opt) => ({ value: opt, label: opt })),
];

export function TC6WalkTestSection({
  answers,
  onChange,
  scaleTitle = 'Teste TC6 (6 Minutos)',
  scaleIndex = 0,
  patient,
  onRemoveScale,
  readOnly = false,
}: TC6WalkTestSectionProps) {
  // --- 1. CRONÔMETRO STATE ---
  const TOTAL_SECONDS = 360; // 6 minutes = 360s
  const [secondsLeft, setSecondsLeft] = useState<number>(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'countdown' | 'countup'>('countdown');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [atsAlertText, setAtsAlertText] = useState<string>('');
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play Beep with Web Audio API (Native, reliable, no external files)
  const triggerAudioBeep = (freq = 880, duration = 0.25) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy handled
    }
  };

  // Timer loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setTestFinished(true);
            setAtsAlertText(ATS_MINUTELY_PHRASES[6]);
            triggerAudioBeep(980, 0.6);
            return 0;
          }

          const newSec = prev - 1;
          const elapsedSec = TOTAL_SECONDS - newSec;

          // Check for minute markers (1m, 2m, 3m, 4m, 5m)
          if (elapsedSec % 60 === 0 && elapsedSec < TOTAL_SECONDS) {
            const minuteReached = elapsedSec / 60;
            const phrase = ATS_MINUTELY_PHRASES[minuteReached];
            if (phrase) {
              setAtsAlertText(phrase);
              triggerAudioBeep(660, 0.2);
            }
          }

          return newSec;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  const handleStartTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(TOTAL_SECONDS);
      setTestFinished(false);
      setAtsAlertText('');
    }
    setIsRunning(true);
    triggerAudioBeep(520, 0.15);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
    triggerAudioBeep(440, 0.12);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(TOTAL_SECONDS);
    setTestFinished(false);
    setAtsAlertText('');
    triggerAudioBeep(380, 0.12);
  };

  // Format time (MM:SS)
  const displaySeconds = timerMode === 'countdown' ? secondsLeft : TOTAL_SECONDS - secondsLeft;
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100));

  // --- 2. CONTADOR DE VOLTAS & METRAGEM ---
  const [lapLength, setLapLength] = useState<number>(30); // Standard corridor: 30 meters
  const [lapCount, setLapCount] = useState<number>(0);
  const [extraMeters, setExtraMeters] = useState<string>('');

  // Sync distance to answers
  const updateAnswerField = (field: string, value: any) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const rawActualDistance =
    answers['Distância Total Percorrida'] ??
    answers['distancia_total'] ??
    answers['Distância Total'] ??
    '';

  const handleAddLap = (multiplier = 1) => {
    const newLaps = Math.max(0, lapCount + multiplier);
    setLapCount(newLaps);
    const extra = parseFloat(extraMeters) || 0;
    const computedTotal = newLaps * lapLength + extra;
    updateAnswerField('Distância Total Percorrida', computedTotal);
  };

  const handleExtraMetersChange = (val: string) => {
    setExtraMeters(val);
    const extra = parseFloat(val) || 0;
    const computedTotal = lapCount * lapLength + extra;
    updateAnswerField('Distância Total Percorrida', computedTotal);
  };

  // --- 3. DADOS BIOMÉTRICOS & CÁLCULO DO PREVISTO ---
  // Resolve patient default attributes
  const defaultGender = useMemo(() => {
    const g = patient?.gender || patient?.sexo || '';
    if (String(g).toLowerCase().startsWith('m')) return 'Masculino';
    if (String(g).toLowerCase().startsWith('f')) return 'Feminino';
    return 'Masculino';
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

  const gender = answers['TC6_Sexo'] || defaultGender;
  const age = answers['TC6_Idade'] !== undefined ? Number(answers['TC6_Idade']) : defaultAge;
  const heightCm = answers['TC6_Altura'] !== undefined ? Number(answers['TC6_Altura']) : 165;
  const weightKg = answers['TC6_Peso'] !== undefined ? Number(answers['TC6_Peso']) : 70;
  const equation = (answers['TC6_Equacao'] as 'dourado' | 'britto' | 'enright') || 'dourado';

  const actualDistanceNum = parseFloat(String(rawActualDistance).replace(',', '.')) || 0;

  // Compute Predicted Distance
  const tc6Result: TC6CalculationResult = useMemo(() => {
    return calculateTC6Prediction({
      gender,
      age: age || 60,
      heightCm: heightCm || 165,
      weightKg: weightKg || 70,
      actualDistance: actualDistanceNum,
      equation,
    });
  }, [gender, age, heightCm, weightKg, actualDistanceNum, equation]);

  // Sync predicted result to answers on change so it saves to the backend record
  useEffect(() => {
    if (tc6Result.predictedDistance > 0) {
      onChange((prev) => {
        const next = { ...prev };
        next['Distância Prevista (m)'] = tc6Result.predictedDistance;
        next['Referência Bibliográfica'] = 'Equações de Referência para o Teste de Caminhada de Seis Minutos em Indivíduos Saudáveis - Victor Zuniga Dourado (UNIFESP)';
        if (actualDistanceNum > 0) {
          next['% do Previsto'] = `${tc6Result.percentagePredicted}%`;
          next['Diferença Realizado vs Previsto'] = `${tc6Result.difference > 0 ? '+' : ''}${tc6Result.difference} m`;
          next['Classificação TC6'] = tc6Result.classification;
        }
        return next;
      });
    }
  }, [tc6Result.predictedDistance, tc6Result.percentagePredicted, actualDistanceNum]);

  // Sync initial biometric defaults
  useEffect(() => {
    onChange((prev) => {
      const updates: Record<string, any> = {};
      if (prev['TC6_Sexo'] === undefined) updates['TC6_Sexo'] = defaultGender;
      if (prev['TC6_Idade'] === undefined && defaultAge) updates['TC6_Idade'] = defaultAge;
      if (prev['TC6_Altura'] === undefined) updates['TC6_Altura'] = 165;
      if (prev['TC6_Peso'] === undefined) updates['TC6_Peso'] = 70;
      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [defaultGender, defaultAge]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* HEADER DA ESCALA */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            {scaleIndex + 1}
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              <span>{scaleTitle}</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-extrabold px-2 py-0.5 rounded-md border border-blue-400/30">
                Cardiorrespiratória
              </span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider">
              Capacidade funcional submáxima • ATS 6-Minute Walk Test
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {actualDistanceNum > 0 && (
            <div className="flex items-center space-x-2.5 bg-slate-800/90 dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Realizado / Previsto</p>
                <p className="text-sm font-black text-white">
                  {actualDistanceNum}m / {tc6Result.predictedDistance}m
                </p>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${tc6Result.badgeBg}`}>
                {tc6Result.percentagePredicted}%
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
            1. PAINEL DO CRONÔMETRO DE 6 MINUTOS
           ======================================================== */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white p-5 sm:p-6 border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                  <span>Cronômetro Oficial do TC6</span>
                  {isRunning && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Em Andamento
                    </span>
                  )}
                  {testFinished && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                      ✓ Finalizado
                    </span>
                  )}
                </h5>
                <p className="text-[11px] text-slate-400">
                  Duração padrão de 6 minutos com sinalizações e frases de incentivo da ATS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTimerMode(timerMode === 'countdown' ? 'countup' : 'countdown')}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Alternar entre contagem regressiva e progressiva"
              >
                {timerMode === 'countdown' ? 'Regressivo (6→0)' : 'Progressivo (0→6)'}
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  soundEnabled
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title={soundEnabled ? 'Avisos sonoros ligados' : 'Avisos sonoros mudos'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* TIMER DISPLAY & CONTROLS */}
          <div className="py-6 flex flex-col items-center justify-center">
            {/* BIG CLOCK DISPLAY */}
            <div className="relative flex flex-col items-center">
              <div
                className={`font-mono text-5xl sm:text-6xl md:text-7xl font-black tracking-wider transition-colors ${
                  testFinished
                    ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                    : isRunning
                    ? 'text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'text-slate-300'
                }`}
              >
                {formattedTime}
              </div>

              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                {timerMode === 'countdown' ? 'Tempo Restante' : 'Tempo Percorrido'}
              </span>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full max-w-md bg-slate-800/80 rounded-full h-2.5 mt-5 overflow-hidden border border-slate-700/60">
              <div
                className={`h-full transition-all duration-1000 rounded-full ${
                  testFinished
                    ? 'bg-emerald-500'
                    : progressPercent > 80
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* CONTROLS BUTTONS */}
            <div className="flex items-center gap-3 mt-6">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{secondsLeft === 0 ? 'Reiniciar Teste' : secondsLeft === TOTAL_SECONDS ? 'Iniciar Teste TC6' : 'Continuar Teste'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseTimer}
                  className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-amber-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pausar Teste</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetTimer}
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-700 transition-all cursor-pointer"
                title="Zerar cronômetro"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Zerar</span>
              </button>
            </div>
          </div>

          {/* ATS MINUTELY INCENTIVE BANNER */}
          {atsAlertText && (
            <div className="mt-2 bg-blue-950/70 border border-blue-500/40 rounded-2xl p-3.5 flex items-center gap-3 animate-fadeIn">
              <span className="text-xl">📢</span>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                  Instrução Padronizada da ATS aos Pacientes:
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white italic">
                  &ldquo;{atsAlertText}&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            2. CÁLCULO DO PREVISTO & COMPARAÇÃO (REQUISITO PRINCIPAL)
           ======================================================== */}
        <div className="rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Cálculo da Distância Prevista e Comparativo</span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    Cálculo Automático
                  </span>
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compara a distância percorrida com o valor esperado pela equação de referência
                </p>
              </div>
            </div>

            {/* SELETOR DE EQUAÇÃO */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-2 pr-1">Fórmula:</span>
              <button
                type="button"
                onClick={() => updateAnswerField('TC6_Equacao', 'dourado')}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${
                  equation === 'dourado'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Dourado (UNIFESP)
              </button>
              <button
                type="button"
                onClick={() => updateAnswerField('TC6_Equacao', 'britto')}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${
                  equation === 'britto'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Britto (Brasil)
              </button>
              <button
                type="button"
                onClick={() => updateAnswerField('TC6_Equacao', 'enright')}
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${
                  equation === 'enright'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Enright (ATS)
              </button>
            </div>
          </div>

          {/* CAMPOS BIOMÉTRICOS DE ENTRADA */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Sexo Biológico
              </label>
              <CustomSelect
                value={gender}
                onChange={(val) => updateAnswerField('TC6_Sexo', String(val))}
                options={genderOptions}
                size="sm"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Idade (anos)
              </label>
              <input
                type="number"
                value={age || ''}
                onChange={(e) => updateAnswerField('TC6_Idade', parseInt(e.target.value, 10) || 0)}
                placeholder="Ex: 60"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                value={heightCm || ''}
                onChange={(e) => updateAnswerField('TC6_Altura', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 168"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Peso Corporal (kg)
              </label>
              <input
                type="number"
                value={weightKg || ''}
                onChange={(e) => updateAnswerField('TC6_Peso', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 72"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* FACILITADOR DE VOLTAS DE CORREDOR */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Contador Rápido de Voltas (Corredor)
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Volta padrão: <strong>{lapLength} metros</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleAddLap(-1)}
                  disabled={lapCount <= 0}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-red-500 disabled:opacity-30 rounded-lg cursor-pointer"
                  title="Diminuir 1 volta"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-black text-slate-900 dark:text-white">
                  {lapCount} voltas ({lapCount * lapLength}m)
                </span>
                <button
                  type="button"
                  onClick={() => handleAddLap(1)}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-500 rounded-lg cursor-pointer"
                  title="Adicionar 1 volta"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="+ Metros finais"
                  value={extraMeters}
                  onChange={(e) => handleExtraMetersChange(e.target.value)}
                  className="w-28 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* COMPARATIVO DESTACADO (CARD FINAL DE RESULTADOS) */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/60 p-5 border border-blue-500/30 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-blue-500/20">
              {/* DISTÂNCIA REALIZADA */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-center sm:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Distância Realizada (Paciente)
                </span>
                <div className="flex items-baseline justify-center sm:justify-start gap-1.5 mt-1">
                  <input
                    type="number"
                    value={rawActualDistance}
                    onChange={(e) => updateAnswerField('Distância Total Percorrida', e.target.value)}
                    placeholder="0"
                    className="w-28 bg-slate-800 border border-blue-500/50 rounded-xl px-2.5 py-1 text-2xl font-black text-white text-center sm:text-left focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-sm font-extrabold text-blue-400">metros</span>
                </div>
              </div>

              {/* DISTÂNCIA PREVISTA */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-center sm:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Distância Prevista (Equação)
                </span>
                <div className="flex items-baseline justify-center sm:justify-start gap-1.5 mt-1">
                  <span className="text-3xl font-black text-indigo-300">
                    {tc6Result.predictedDistance}
                  </span>
                  <span className="text-sm font-extrabold text-indigo-400">metros</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Ref: {tc6Result.equationUsed.split(' - ')[0]}
                </span>
              </div>

              {/* % DO PREVISTO */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-center sm:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  % Alcançado do Previsto
                </span>
                <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
                  <span className="text-3xl font-black text-white">
                    {actualDistanceNum > 0 ? `${tc6Result.percentagePredicted}%` : '---'}
                  </span>
                  {actualDistanceNum > 0 && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${tc6Result.badgeBg}`}>
                      {tc6Result.difference > 0 ? `+${tc6Result.difference}m` : `${tc6Result.difference}m`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* PARECER / CLASSIFICAÇÃO */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">
                  <strong>Classificação Funcional:</strong> {tc6Result.classification}
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Padrão de normalidade: ≥ 80% do previsto
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            3. SINAIS VITAIS BASAIS E FINAIS (BORG, SPO2, FC, PA)
           ======================================================== */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h5 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Sinais Vitais e Escala de Borg (Basal vs Final)</span>
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PARÂMETROS BASAIS (REPOUSO) */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                1. Parâmetros Basais (Em Repouso Pré-Teste)
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">SpO2 Basal</label>
                  <input
                    type="number"
                    value={answers['SpO2 Basal'] || ''}
                    onChange={(e) => updateAnswerField('SpO2 Basal', e.target.value)}
                    placeholder="Ex: 98%"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">FC Basal</label>
                  <input
                    type="number"
                    value={answers['FC Basal'] || ''}
                    onChange={(e) => updateAnswerField('FC Basal', e.target.value)}
                    placeholder="Ex: 75 bpm"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PA Basal</label>
                  <input
                    type="text"
                    value={answers['PA Basal'] || ''}
                    onChange={(e) => updateAnswerField('PA Basal', e.target.value)}
                    placeholder="120x80"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dispneia Basal (Borg)</label>
                  <CustomSelect
                    value={answers['Dispneia Basal (Borg)'] || ''}
                    onChange={(val) => updateAnswerField('Dispneia Basal (Borg)', String(val))}
                    options={borgOptions}
                    size="sm"
                    placeholder="Selecione..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fadiga Basal (Borg)</label>
                  <CustomSelect
                    value={answers['Fadiga Basal (Borg)'] || ''}
                    onChange={(val) => updateAnswerField('Fadiga Basal (Borg)', String(val))}
                    options={borgOptions}
                    size="sm"
                    placeholder="Selecione..."
                  />
                </div>
              </div>
            </div>

            {/* PARÂMETROS FINAIS (PÓS-TESTE) */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                2. Parâmetros Imediatos (Pós-6 Minutos)
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">SpO2 Final</label>
                  <input
                    type="number"
                    value={answers['SpO2 Final'] || ''}
                    onChange={(e) => updateAnswerField('SpO2 Final', e.target.value)}
                    placeholder="Ex: 95%"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">FC Final</label>
                  <input
                    type="number"
                    value={answers['FC Final'] || ''}
                    onChange={(e) => updateAnswerField('FC Final', e.target.value)}
                    placeholder="Ex: 110 bpm"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PA Final</label>
                  <input
                    type="text"
                    value={answers['PA Final'] || ''}
                    onChange={(e) => updateAnswerField('PA Final', e.target.value)}
                    placeholder="135x85"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dispneia Final (Borg)</label>
                  <CustomSelect
                    value={answers['Dispneia Final (Borg)'] || ''}
                    onChange={(val) => updateAnswerField('Dispneia Final (Borg)', String(val))}
                    options={borgOptions}
                    size="sm"
                    placeholder="Selecione..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fadiga Final (Borg)</label>
                  <CustomSelect
                    value={answers['Fadiga Final (Borg)'] || ''}
                    onChange={(val) => updateAnswerField('Fadiga Final (Borg)', String(val))}
                    options={borgOptions}
                    size="sm"
                    placeholder="Selecione..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* OBSERVAÇÕES / INTERCORRÊNCIAS */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              Observações Clínicas e Intercorrências do Teste
            </label>
            <textarea
              rows={2}
              value={answers['Observações / Intercorrências'] || ''}
              onChange={(e) => updateAnswerField('Observações / Intercorrências', e.target.value)}
              placeholder="Descreva pausas durante o teste, sintomas relatados (tontura, claudicação), uso de oxigênio suplementar ou intercorrências..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* REFERÊNCIA BIBLIOGRÁFICA OFICIAL TC6 */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-black uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-300">
                Referência Bibliográfica do Teste:
              </span>
            </div>
            <div className="pl-6 border-l-2 border-blue-500/70 space-y-1">
              <p className="font-black text-xs text-slate-900 dark:text-slate-100">
                Equações de Referência para o Teste de Caminhada de Seis Minutos em Indivíduos Saudáveis
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic">
                Reference Equations for the 6-Minute Walk Test in Healthy Individuals
              </p>
              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 pt-0.5">
                Victor Zuniga Dourado
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Departamento de Ciências da Saúde, Universidade Federal de São Paulo (UNIFESP), Campus Baixada Santista, Santos, São Paulo - Brasil
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
