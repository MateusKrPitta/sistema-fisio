'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  FileText,
  TrendingUp,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Activity,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PatientItem } from '@/lib/clinical-report-engine';
import {
  generateEvolutionReportPdf,
  EvolutionChartPoint,
  EvolutionSessionItem,
} from '@/lib/pdf-report-generator';

interface EvolutionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: PatientItem | null;
  patientsList?: PatientItem[];
}

type PeriodOption = '7d' | '15d' | '30d' | '60d' | '90d' | 'all' | 'custom';
type AiTone = 'clinical' | 'patient_friendly' | 'goals';

export function stripHtml(html?: string | null): string {
  if (!html || typeof html !== 'string') return '';
  let text = html;

  // Replace br/p/div/li with spaces/newlines before stripping
  text = text
    .replace(/<br\s*[\/]?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '');

  // Strip all HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode standard HTML entities
  text = text
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');

  // Strip any leftover encoded tags
  text = text.replace(/<[^>]*>/g, '');

  return text.replace(/\s+/g, ' ').trim();
}

export function EvolutionReportModal({
  isOpen,
  onClose,
  patient: initialPatient,
  patientsList = [],
}: EvolutionReportModalProps) {
  // State for selected patient
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(initialPatient || null);

  // Period state (default: last 30 days)
  const defaultDates = useMemo(() => {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    const start = new Date(today);
    start.setDate(today.getDate() - 30);
    const startStr = start.toISOString().split('T')[0];
    return { startStr, endStr };
  }, []);

  const [startDate, setStartDate] = useState(defaultDates.startStr);
  const [endDate, setEndDate] = useState(defaultDates.endStr);

  // AI tone
  const [tone, setTone] = useState<AiTone>('clinical');

  // Data fetching & AI state
  const [loadingData, setLoadingData] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [sessions, setSessions] = useState<EvolutionSessionItem[]>([]);
  const [sessionsPage, setSessionsPage] = useState(1);
  const SESSIONS_PER_PAGE = 3;

  const totalSessionsPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (sessionsPage - 1) * SESSIONS_PER_PAGE;
    return sessions.slice(start, start + SESSIONS_PER_PAGE);
  }, [sessions, sessionsPage]);
  
  // AI results
  const [aiSummary, setAiSummary] = useState('');
  const [aiGains, setAiGains] = useState<string[]>([]);
  const [aiAlerts, setAiAlerts] = useState<string[]>([]);
  const [aiNextSteps, setAiNextSteps] = useState<string[]>([]);
  const [chartData, setChartData] = useState<EvolutionChartPoint[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync initial patient
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    } else if (patientsList.length > 0 && !selectedPatient) {
      setSelectedPatient(patientsList[0]);
    }
  }, [initialPatient, patientsList]);

  // Compute period label
  const dateRange = useMemo(() => {
    const formatPt = (d: string) => (d ? d.split('-').reverse().join('/') : '');
    const label = startDate && endDate ? `${formatPt(startDate)} a ${formatPt(endDate)}` : 'Período Completo';
    return {
      startDate,
      endDate,
      label,
    };
  }, [startDate, endDate]);

  // Fetch patient evolutions / appointments
  const fetchEvolutionsAndGenerate = async () => {
    if (!selectedPatient) return;

    setLoadingData(true);
    setLoadingAi(true);
    setHasGenerated(false);

    try {
      // 1. Fetch appointments/evolutions
      const evolutionsRes = await api.get(`/patients/${selectedPatient.id}/evolutions?limit=100`).catch(() => null);

      // 2. Fetch form-records (evaluations/body map)
      const formParams = new URLSearchParams();
      if (dateRange.startDate) formParams.set('startDate', dateRange.startDate);
      if (dateRange.endDate) formParams.set('endDate', dateRange.endDate);
      const formQuery = formParams.toString() ? `?${formParams.toString()}` : '';

      const formRecordsRes = await api.get(`/patients/${selectedPatient.id}/form-records${formQuery}`).catch(() => null);

      const rawEvolutions = evolutionsRes?.data?.data || evolutionsRes?.data || [];
      const rawFormRecords = formRecordsRes?.data?.data || formRecordsRes?.data || [];

      // Combine and filter within date range
      const collectedSessions: EvolutionSessionItem[] = [];

      (Array.isArray(rawEvolutions) ? rawEvolutions : []).forEach((ev: any) => {
        const evDate = ev.date || (ev.createdAt ? ev.createdAt.split('T')[0] : '');
        if (!evDate) return;

        // Date range filter
        if (dateRange.startDate && evDate < dateRange.startDate) return;
        if (dateRange.endDate && evDate > dateRange.endDate) return;

        collectedSessions.push({
          id: ev.id,
          date: evDate,
          notes: stripHtml(ev.notes || ''),
          painScale: ev.painScale ?? undefined,
          specialty: ev.specialty || 'Fisioterapia',
        });
      });

      (Array.isArray(rawFormRecords) ? rawFormRecords : []).forEach((fr: any) => {
        const frDate = fr.recordDate || (fr.createdAt ? fr.createdAt.split('T')[0] : '');
        if (!frDate) return;

        if (dateRange.startDate && frDate < dateRange.startDate) return;
        if (dateRange.endDate && frDate > dateRange.endDate) return;

        let painScale: number | undefined = undefined;
        if (fr.answers?.painScale !== undefined) painScale = Number(fr.answers.painScale);
        if (fr.answers?.eva !== undefined) painScale = Number(fr.answers.eva);

        collectedSessions.push({
          id: `fr_${fr.id}`,
          date: frDate,
          notes: stripHtml(fr.notes || fr.template?.title || 'Avaliação Clínica'),
          painScale,
          specialty: 'Avaliação',
        });
      });

      // Sort chronologically (oldest to newest)
      collectedSessions.sort((a, b) => (a.date > b.date ? 1 : -1));

      // Remove exact duplicate timestamps
      const uniqueSessions = collectedSessions.filter(
        (s, idx, arr) => idx === 0 || s.date !== arr[idx - 1].date || s.notes !== arr[idx - 1].notes
      );

      setSessions(uniqueSessions);
      setSessionsPage(1);

      // 3. Request AI Evolution Analysis with token-optimized payload
      const aiRes = await api.post(`/patients/${selectedPatient.id}/evolution-ai-report`, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        periodLabel: dateRange.label,
        tone,
        patientName: selectedPatient.name,
        sessions: uniqueSessions.map((s) => ({
          date: s.date,
          notes: s.notes,
          painScale: s.painScale,
        })),
      });

      const aiData = aiRes?.data || aiRes;
      if (aiData) {
        setAiSummary(aiData.summary || '');
        setAiGains(Array.isArray(aiData.gains) ? aiData.gains : []);
        setAiAlerts(Array.isArray(aiData.alerts) ? aiData.alerts : []);
        setAiNextSteps(Array.isArray(aiData.nextSteps) ? aiData.nextSteps : []);
        setChartData(Array.isArray(aiData.chartData) ? aiData.chartData : []);
        setHasGenerated(true);
      }
    } catch (err) {
      console.error('Erro ao gerar relatório evolutivo:', err);
    } finally {
      setLoadingData(false);
      setLoadingAi(false);
    }
  };

  const handleCopySummary = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    if (!selectedPatient) return;
    generateEvolutionReportPdf({
      patient: selectedPatient,
      periodLabel: dateRange.label,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      summary: aiSummary,
      gains: aiGains,
      alerts: aiAlerts,
      nextSteps: aiNextSteps,
      chartData,
      sessions,
      tone,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold">Relatório de Evoluções com IA</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  IA Copilot
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Interpretação clínica automatizada, gráfico de progresso e síntese do período
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* 1. SELEÇÃO DE PACIENTE & CAMPO ÚNICO DE PERÍODO ENTRE DATAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Patient Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Paciente</span>
              </label>
              {patientsList.length > 0 && !initialPatient ? (
                <select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const found = patientsList.find((p) => String(p.id) === e.target.value);
                    if (found) setSelectedPatient(found);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (CPF: {p.cpf})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                    {selectedPatient?.name || 'Selecione um paciente'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">CPF: {selectedPatient?.cpf || '-'}</p>
                </div>
              )}
            </div>

            {/* Single Period Field between dates */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Período das Evoluções (Entre Datas)</span>
              </label>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 sm:p-2 flex items-center gap-2 shadow-2xs">
                <div className="flex-1 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-750">
                  <span className="text-[11px] font-bold text-slate-400">De:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                  />
                </div>

                <span className="text-slate-400 font-bold text-xs">até</span>

                <div className="flex-1 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-750">
                  <span className="text-[11px] font-bold text-slate-400">Até:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. TOM DA IA E BOTÃO DE GERAÇÃO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Foco do Laudo:</span>
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setTone('clinical')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    tone === 'clinical' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Técnico / Prontuário
                </button>
                <button
                  type="button"
                  onClick={() => setTone('patient_friendly')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    tone === 'patient_friendly' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Paciente & Família
                </button>
                <button
                  type="button"
                  onClick={() => setTone('goals')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    tone === 'goals' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Metas & Condutas
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchEvolutionsAndGenerate}
              disabled={loadingAi || !selectedPatient}
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:shadow-lg"
            >
              {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{hasGenerated ? 'Atualizar Análise IA' : 'Gerar Relatório com IA'}</span>
            </button>
          </div>

          {/* 3. RESULTADOS DA IA (QUANDO GERADO) */}
          {hasGenerated && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* INTERACTIVE EVOLUTION CHART */}
              {chartData.length > 0 && (
                <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span>Curva de Evolução no Período ({sessions.length} sessões)</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Comparativo temporal entre intensidade de Dor (EVA) e Ganho Funcional Estimado (%)
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-red-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                        <span>Dor (EVA 0-10)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span>Score Funcional (%)</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart Graphic */}
                  <div className="w-full overflow-x-auto py-2">
                    <div className="min-w-[600px] h-48 relative flex items-end justify-between px-4 pb-8 pt-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      {/* Grid Background Horizontal Lines */}
                      <div className="absolute inset-x-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
                        <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full"></div>
                        <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full"></div>
                        <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full"></div>
                      </div>

                      {/* Data Columns & Points */}
                      {chartData.map((pt, idx) => {
                        const painHeight = Math.max(8, (pt.pain / 10) * 100);
                        const funcHeight = Math.max(8, (pt.functionalScore / 100) * 100);

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative px-1">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-12 bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap z-20">
                              <span className="font-bold">{pt.date}:</span> EVA {pt.pain}/10 • Funcional {pt.functionalScore}%
                            </div>

                            {/* Dual Bars / Curves */}
                            <div className="flex items-end gap-1.5 w-full max-w-[40px] justify-center h-full pb-1">
                              {/* Pain Bar */}
                              <div
                                style={{ height: `${painHeight}%` }}
                                className="w-3 rounded-t-md bg-gradient-to-t from-red-600 to-rose-400 shadow-2xs group-hover:brightness-110 transition-all flex items-start justify-center pt-0.5"
                                title={`Dor: ${pt.pain}/10`}
                              >
                                <span className="text-[9px] font-black text-white leading-none">{pt.pain}</span>
                              </div>

                              {/* Functional Bar */}
                              <div
                                style={{ height: `${funcHeight}%` }}
                                className="w-3 rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 shadow-2xs group-hover:brightness-110 transition-all flex items-start justify-center pt-0.5"
                                title={`Funcional: ${pt.functionalScore}%`}
                              >
                                <span className="text-[9px] font-black text-white leading-none">{pt.functionalScore}%</span>
                              </div>
                            </div>

                            {/* X-axis Date label */}
                            <span className="absolute bottom-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {pt.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* AI CLINICAL SYNTHESIS CARD */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Parecer da IA sobre o Período</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>

                <textarea
                  value={aiSummary}
                  onChange={(e) => setAiSummary(e.target.value)}
                  rows={4}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="Parecer gerado pela IA..."
                />
              </div>

              {/* GAINS, ALERTS & NEXT STEPS 3-BOX GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ganhos */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                  <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ganhos e Progressos</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {aiGains.map((g, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alertas */}
                <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                  <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Pontos de Atenção</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {aiAlerts.map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Próximos Passos */}
                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 space-y-2">
                  <h5 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Conduta Recomendada</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {aiNextSteps.map((n, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* TIMELINE OF SESSIONS TABLE (PAGINADA) */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Sessões Analisadas ({sessions.length})
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{dateRange.label}</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Nenhuma anotação de sessão encontrada para o período selecionado.
                    </div>
                  ) : (
                    paginatedSessions.map((s, idx) => (
                      <div key={s.id || idx} className="p-3.5 sm:px-5 flex items-start justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              {s.date.split('-').reverse().join('/')}
                            </span>
                            {s.painScale !== undefined && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                                EVA {s.painScale}/10
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                            {stripHtml(s.notes) || 'Atendimento de fisioterapia realizado.'}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-semibold">{s.specialty}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Controls */}
                {sessions.length > SESSIONS_PER_PAGE && (
                  <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-[11px]">
                      Página <strong>{sessionsPage}</strong> de <strong>{totalSessionsPages}</strong> • {sessions.length} sessões no total
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                        disabled={sessionsPage <= 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                        title="Página Anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <span className="px-2 font-bold font-mono text-[11px] text-slate-700 dark:text-slate-200">
                        {sessionsPage} / {totalSessionsPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSessionsPage((p) => Math.min(totalSessionsPages, p + 1))}
                        disabled={sessionsPage >= totalSessionsPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                        title="Próxima Página"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {hasGenerated && (
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Exportar PDF Oficial (A4)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
