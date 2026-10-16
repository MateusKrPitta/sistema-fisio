'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileDown,
  X,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  PatientItem,
  EvaluationRecord,
  ParsedScaleGroup,
  EvaluationSessionDetail,
  aggregateRecordsByEvaluationSession,
  parseScaleGroupsFromRecords,
  formatDateTime,
} from '@/lib/clinical-report-engine';
import { AiCopilotCard } from './ai-copilot-card';
import { generateClinicalReportPdf, AiToneReports } from '@/lib/pdf-report-generator';
import { stripHtml } from './evolution-report-modal';

interface ClinicalReportModalProps {
  patient: PatientItem | null;
  patientRecords: EvaluationRecord[];
  parsedScaleGroups: ParsedScaleGroup[];
  loading: boolean;
  onClose: () => void;
}

export function ClinicalReportModal({
  patient,
  patientRecords,
  parsedScaleGroups,
  loading,
  onClose,
}: ClinicalReportModalProps) {
  // selectedRecordId: null means Table/Overview of all evaluations
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [loadedDetailsMap, setLoadedDetailsMap] = useState<Record<number, EvaluationRecord>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [currentAiReport, setCurrentAiReport] = useState<{ text: string; toneLabel: string } | null>(null);
  const [allAiToneReports, setAllAiToneReports] = useState<AiToneReports | undefined>(undefined);

  const handleReportChange = useCallback((text: string, toneLabel: string, allReports?: AiToneReports) => {
    setCurrentAiReport({ text, toneLabel });
    if (allReports) {
      setAllAiToneReports(allReports);
    }
  }, []);

  // Merge lightweight summaries with full records loaded on-demand
  const mergedRecords = useMemo(() => {
    return patientRecords.map((r) => {
      if (loadedDetailsMap[r.id]) {
        return loadedDetailsMap[r.id];
      }
      return r;
    });
  }, [patientRecords, loadedDetailsMap]);

  // Compute scale groups dynamically from merged records
  const currentScaleGroups = useMemo(() => {
    return parseScaleGroupsFromRecords(mergedRecords);
  }, [mergedRecords]);

  // Group all records by session
  const evaluationSessions: EvaluationSessionDetail[] = useMemo(() => {
    return aggregateRecordsByEvaluationSession(mergedRecords, currentScaleGroups);
  }, [mergedRecords, currentScaleGroups]);

  // Find active session if selected
  const activeSession = useMemo(() => {
    if (!selectedRecordId) return null;
    return evaluationSessions.find((s) => s.recordId === selectedRecordId) || null;
  }, [selectedRecordId, evaluationSessions]);

  // Fetch full details of an evaluation on demand when clicked
  const handleOpenEvaluation = async (recordId: number) => {
    setSelectedRecordId(recordId);

    const existing = mergedRecords.find((r) => r.id === recordId);
    if (existing?.answers && (existing.template?.modules?.length || (existing as any).detailsLoaded)) {
      return; // Already loaded!
    }

    if (patient) {
      setLoadingDetailId(recordId);
      try {
        const res: any = await api.get(`/patients/${patient.id}/form-records/${recordId}`);
        const fullRecord: EvaluationRecord = res?.data || res;
        if (fullRecord && fullRecord.id) {
          setLoadedDetailsMap((prev) => ({
            ...prev,
            [fullRecord.id]: fullRecord,
          }));
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes completos da avaliação:', err);
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  const totalScalesCount = useMemo(() => {
    if (currentScaleGroups.length > 0) return currentScaleGroups.length;
    const setOfTitles = new Set<string>();
    mergedRecords.forEach((r) => {
      if (r.template?.title) {
        r.template.title.split('+').forEach((t) => setOfTitles.add(t.trim()));
      }
    });
    return setOfTitles.size || mergedRecords.length;
  }, [currentScaleGroups, mergedRecords]);

  const handleDownloadPdf = () => {
    if (!patient) return;
    setIsGeneratingPdf(true);
    try {
      generateClinicalReportPdf({
        patient,
        patientRecords: mergedRecords,
        selectedSession: activeSession,
        parsedScaleGroups: currentScaleGroups,
        aiReportText: currentAiReport?.text,
        aiToneLabel: currentAiReport?.toneLabel,
        aiToneReports: allAiToneReports,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      {patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-6 overflow-hidden printable-modal-wrapper">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="printable-modal-backdrop absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-all"
            onClick={onClose}
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="printable-modal-box relative bg-slate-50 dark:bg-slate-950 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-screen sm:max-h-[94vh] h-full sm:h-[92vh] flex flex-col overflow-hidden border-0 sm:border border-slate-200/90 dark:border-slate-800 z-10"
          >
            {/* Print Only Official Medical Header */}
            <div className="hidden print:flex flex-col border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                    FisioMovie • Laudo Clínico de Fisioterapia
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Relatório e Evolução Clínica de Avaliações Fisioterapêuticas
                  </p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>Data de Emissão: <strong className="text-slate-900">{new Date().toLocaleDateString('pt-BR')}</strong></p>
                  <p>Total de Registros: <strong className="text-slate-900">{patientRecords.length}</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-300 text-xs text-slate-800 bg-slate-100 p-3 rounded-xl">
                <div>Paciente: <strong className="text-slate-950 font-bold">{patient.name}</strong></div>
                <div>Telefone: <strong className="text-slate-950 font-bold">{patient.phone || 'Não informado'}</strong></div>
              </div>
            </div>

            {/* Screen Header Bar - Sticky & Mobile First com Botão Fechar Sempre Visível */}
            <div className="print:hidden px-3.5 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 shadow-xs sticky top-0 z-20">
              <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm sm:text-lg shadow-md shadow-blue-500/20 shrink-0">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    {patient.name}
                  </h2>
                  <div className="flex items-center flex-wrap gap-x-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    <span>
                      Avaliações: <strong className="text-blue-700 dark:text-blue-500">{patientRecords.length}</strong>
                    </span>
                    {activeSession && (
                      <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 text-[10px] truncate max-w-[140px] sm:max-w-none">
                        {activeSession.sessionTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de Ação com Botão Fechar Proeminente */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                {/* PDF Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-2.5 sm:px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  title="Gerar e Baixar Arquivo PDF Oficial Completo"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span className="hidden md:inline">Baixar PDF Oficial</span>
                  <span className="inline md:hidden">PDF</span>
                </button>

                {/* Botão Fechar - Somente o X */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/60 dark:text-slate-300 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0 shadow-2xs group focus:ring-2 focus:ring-red-500/20"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-600 group-hover:text-red-600 dark:text-slate-300" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="printable-content-body flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 print:p-0 print:overflow-visible">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Carregando avaliações e histórico do paciente...</p>
                </div>
              ) : evaluationSessions.length === 0 ? (
                <div className="py-20 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">Nenhuma avaliação registrada</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Este paciente ainda não possui avaliações ou fichas preenchidas no prontuário.
                  </p>
                </div>
              ) : activeSession ? (
                /* ============================================================ */
                /* VIEW A: SPECIFIC EVALUATION SESSION (ALL SCALES OF THIS DATE) */
                /* ============================================================ */
                <div className="space-y-4 sm:space-y-6">
                  {/* Back to Evaluations & Direct Close Bar */}
                  <div className="flex items-center justify-between gap-2 print:hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedRecordId(null)}
                      className="inline-flex items-center space-x-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar para Lista de Avaliações</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 shadow-xs transition-colors cursor-pointer"
                      title="Fechar"
                      aria-label="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Session Header Banner */}
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md space-y-3 print:bg-white print:text-slate-900 print:border print:border-slate-300 print:shadow-none print:p-4 print:rounded-xl break-inside-avoid page-break-avoid">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-300 print:text-blue-700 uppercase tracking-wider block">
                          Avaliação Fisioterapêutica Selecionada
                        </span>
                        <h3 className="text-base sm:text-lg md:text-xl font-black text-white print:text-slate-950">
                          {activeSession.sessionTitle} • {activeSession.formattedDate}
                        </h3>
                        <p className="text-xs text-slate-300 print:text-slate-600 mt-0.5">
                          Fisioterapeuta: <strong className="text-white print:text-slate-900">{activeSession.evaluatorName}</strong>
                          {activeSession.evaluatorCrefito ? ` (CREFITO: ${activeSession.evaluatorCrefito})` : ''} •{' '}
                          <strong className="text-cyan-300 print:text-slate-900">
                            {activeSession.scales.length > 0 ? activeSession.scales.length : (activeSession.modulesCount || 1)} escala(s) aplicada(s)
                          </strong>
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full border flex items-center space-x-1.5 self-start sm:self-auto shrink-0 ${
                          activeSession.isSigned
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 print:bg-emerald-50 print:text-emerald-800 print:border-emerald-300'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30 print:bg-amber-50 print:text-amber-800 print:border-amber-300'
                        }`}
                      >
                        {activeSession.isSigned ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400" />
                        )}
                        <span>{activeSession.isSigned ? 'Assinado pelo Paciente' : 'Assinatura Pendente'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Loading Full Evaluation Details State */}
                  {loadingDetailId === selectedRecordId && activeSession.scales.length === 0 ? (
                    <div className="py-24 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Carregando detalhes e escalas da avaliação #{activeSession.recordIndex + 1}...
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Buscando perguntas, respostas, pontuações e imagens do prontuário
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* List of All Scales Evaluated in This Session */}
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 px-1 print:text-slate-950 flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <span>Escalas e Testes Realizados Nesta Avaliação ({activeSession.scales.length})</span>
                        </h4>

                        {activeSession.scales.length === 0 ? (
                          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 text-center text-xs text-slate-500">
                            Nenhum item preenchido encontrado para esta avaliação.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {activeSession.scales.map((scale, scIdx) => (
                              <div
                                key={scale.scaleKey}
                                className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-3.5 sm:space-y-4 print:shadow-none print:border-slate-300 print:rounded-xl print:p-4 break-inside-avoid page-break-avoid"
                              >
                                {/* Scale Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-2 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 print:bg-slate-800">
                                      #{scIdx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-black text-sm text-slate-900 dark:text-slate-100 print:text-slate-950">
                                        {scale.scaleTitle}
                                      </h5>
                                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                        {scale.category}
                                      </span>
                                    </div>
                                  </div>

                                  {scale.scoreSummary && (
                                    <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-3 py-1.5 rounded-xl text-left sm:text-right w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end shrink-0">
                                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase block">
                                        Resultado Obtido
                                      </span>
                                      <span className="text-sm sm:text-base font-black text-blue-950 dark:text-blue-200">
                                        {scale.scoreSummary}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Clinical Interpretation if any */}
                                {scale.clinicalInterpretation && (
                                  scale.scaleKey === 'prep2' || (scale.scaleTitle || '').toLowerCase().includes('prep') ? (
                                    <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-blue-200/90 dark:border-blue-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                                          <span>Algoritmo PREP2 • Estratificação de Membro Superior</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'dinamometria_fpm' || (scale.scaleTitle || '').toLowerCase().includes('dinamometria') || (scale.scaleTitle || '').toLowerCase().includes('preensão') ? (
                                    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-emerald-200/90 dark:border-emerald-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                                          <span>Dinamometria FPM • Predição Novaes et al. & EWGSOP2</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'tc6' || (scale.scaleTitle || '').toLowerCase().includes('tc6') || (scale.scaleTitle || '').toLowerCase().includes('caminhada') ? (
                                    <div className="bg-gradient-to-r from-sky-50/90 via-blue-50/70 to-slate-50 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-sky-200/90 dark:border-sky-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-sky-900 dark:text-sky-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-sky-600 shrink-0" />
                                          <span>Teste TC6 • Referência Victor Zuniga Dourado (UNIFESP)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-sky-200 dark:border-sky-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-sky-100 dark:border-sky-900/50">
                                        Ref: Victor Zuniga Dourado • Equações de Referência para o Teste de Caminhada de Seis Minutos em Indivíduos Saudáveis • UNIFESP
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'tsl_1min' || (scale.scaleTitle || '').toLowerCase().includes('sentar e levantar') || (scale.scaleTitle || '').toLowerCase().includes('tsl') || (scale.scaleTitle || '').toLowerCase().includes('sit-to-stand') || (scale.scaleTitle || '').toLowerCase().includes('sts') ? (
                                    <div className="bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-slate-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-indigo-200/90 dark:border-indigo-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
                                          <span>Sentar e Levantar (TSL 1 min) • Referência Strassmann et al. (2013)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-indigo-100 dark:border-indigo-900/50">
                                        Ref: Strassmann A, Steurer-Stey C, Lana KD, Zoller M, Turk AJ, Suter P, Puhan MA. Population-based reference values for the 1-min sit-to-stand test. Int J Public Health (2013)
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'moca' || (scale.scaleTitle || '').toLowerCase().includes('moca') || (scale.scaleTitle || '').toLowerCase().includes('montreal') ? (
                                    <div className="bg-gradient-to-r from-purple-50/90 via-violet-50/70 to-slate-50 dark:from-purple-950/40 dark:via-violet-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-purple-200/90 dark:border-purple-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-purple-900 dark:text-purple-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-purple-600 shrink-0" />
                                          <span>Montreal Cognitive Assessment (MoCA) • Versão Brasileira (UNIFESP)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-purple-100 dark:border-purple-900/50">
                                        Ref: Nasreddine ZS et al. (2005) • Adaptação Brasileira: Bertolucci, Sarmento & Wajman (UNIFESP-SP, 2007) • Corte Normalidade: ≥ 26/30 pts
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'berg' || (scale.scaleTitle || '').toLowerCase().includes('berg') || (scale.scaleTitle || '').toLowerCase().includes('bbs') ? (
                                    <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-slate-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-amber-200/90 dark:border-amber-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                                          <span>Escala de Berg (BBS) • Equilíbrio Funcional e Risco de Queda</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-amber-100 dark:border-amber-900/50">
                                        Ref: Berg K, Wood-Dauphinee S, Williams JI, Gayton D. (1989) • Escore Total: 0 a 56 pts • Corte de Risco Elevado: ≤ 40 pts
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'barthel' || (scale.scaleTitle || '').toLowerCase().includes('barthel') ? (
                                    <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/70 to-slate-50 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-teal-200/90 dark:border-teal-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-teal-900 dark:text-teal-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-teal-600 shrink-0" />
                                          <span>Índice de Barthel • Avaliação de Autonomia e AVDs</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-teal-100 dark:border-teal-900/50">
                                        Ref: Mahoney FI, Barthel DW. (1965) • Escore Total: 0 a 100 pontos • 100 pts: Totalmente Independente
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'nihss' || (scale.scaleTitle || '').toLowerCase().includes('nihss') ? (
                                    <div className="bg-gradient-to-r from-rose-50/90 via-red-50/70 to-slate-50 dark:from-rose-950/40 dark:via-red-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-rose-200/90 dark:border-rose-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-rose-900 dark:text-rose-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-rose-600 shrink-0" />
                                          <span>Escala de AVC do NIH (NIHSS) • Déficit Neurológico</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-rose-100 dark:border-rose-900/50">
                                        Ref: Lyden P et al. (1999) • National Institutes of Health Stroke Scale • Escore de 0 a 42 pontos
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'manovacuometria' || (scale.scaleTitle || '').toLowerCase().includes('manovacuometria') ? (
                                    <div className="bg-gradient-to-r from-cyan-50/90 via-sky-50/70 to-slate-50 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-cyan-200/90 dark:border-cyan-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-cyan-900 dark:text-cyan-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-cyan-600 shrink-0" />
                                          <span>Manovacuometria • Força Muscular Respiratória (PImáx / PEmáx)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-cyan-100 dark:border-cyan-900/50">
                                        Ref: Neder JA, Andreoni S, Lerario MC, Nery LE. (1999) • Equações de Referência para População Brasileira
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'peak_flow' || (scale.scaleTitle || '').toLowerCase().includes('peak flow') ? (
                                    <div className="bg-gradient-to-r from-blue-50/90 via-cyan-50/70 to-slate-50 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-blue-200/90 dark:border-blue-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                                          <span>Peak Flow (PFE) & Pico de Fluxo de Tosse (PFT)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-blue-100 dark:border-blue-900/50">
                                        Ref: Leith DE et al. • Eficácia de Tosse: &gt; 270 L/min Eficaz | 160-270 L/min Insuficiente | &lt; 160 L/min Ineficaz
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'mmrc' || (scale.scaleTitle || '').toLowerCase().includes('mmrc') ? (
                                    <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-slate-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-orange-200/90 dark:border-orange-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-orange-900 dark:text-orange-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-orange-600 shrink-0" />
                                          <span>Escala de Dispneia - mMRC (Medical Research Council)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-orange-700 dark:text-orange-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-orange-200 dark:border-orange-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-orange-100 dark:border-orange-900/50">
                                        Ref: Fletcher CM et al. • American Thoracic Society / GOLD • Graus 0 a 4 de limitação respiratória
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'nyha' || (scale.scaleTitle || '').toLowerCase().includes('nyha') ? (
                                    <div className="bg-gradient-to-r from-red-50/90 via-rose-50/70 to-slate-50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-red-200/90 dark:border-red-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-red-900 dark:text-red-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-red-600 shrink-0" />
                                          <span>Classificação Funcional Cardíaca (NYHA)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-red-200 dark:border-red-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-red-100 dark:border-red-900/50">
                                        Ref: New York Heart Association (NYHA) • Classificação funcional de insuficiência cardíaca (Classes I a IV)
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'forca_muscular_mrc' || (scale.scaleTitle || '').toLowerCase().includes('força muscular') ? (
                                    <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-indigo-200/90 dark:border-indigo-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
                                          <span>Escala de Força Muscular Periférica (MRC 0-5)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-indigo-100 dark:border-indigo-900/50">
                                        Ref: Medical Research Council (MRC) • Graduação Padronizada de Força Muscular Manual (Graus 0 a 5)
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'eva_dor' || (scale.scaleTitle || '').toLowerCase().includes('eva') || (scale.scaleTitle || '').toLowerCase().includes('body map') ? (
                                    <div className="bg-gradient-to-r from-rose-50/90 via-pink-50/70 to-slate-50 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-rose-200/90 dark:border-rose-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-rose-900 dark:text-rose-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-rose-600 shrink-0" />
                                          <span>Escala Visual Analógica (EVA) & Mapeamento de Dor (Body Map)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-rose-100 dark:border-rose-900/50">
                                        Ref: Huskisson EC. (1974) • Avaliação Quantitativa da Intensidade da Dor (0 a 10) e Mapeamento Topográfico Anatômico
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'sf36' || (scale.scaleTitle || '').toLowerCase().includes('sf-36') ? (
                                    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-emerald-200/90 dark:border-emerald-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                                          <span>Questionário de Qualidade de Vida (SF-36)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-emerald-100 dark:border-emerald-900/50">
                                        Ref: Ware JE Jr, Sherbourne CD. (1992) • Validação Brasileira: Ciconelli RM et al. (UNIFESP, 1999)
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'psqi' || (scale.scaleTitle || '').toLowerCase().includes('psqi') ? (
                                    <div className="bg-gradient-to-r from-violet-50/90 via-indigo-50/70 to-slate-50 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-violet-200/90 dark:border-violet-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-violet-900 dark:text-violet-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-violet-600 shrink-0" />
                                          <span>Índice de Qualidade do Sono de Pittsburgh (PSQI)</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-violet-200 dark:border-violet-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-violet-100 dark:border-violet-900/50">
                                        Ref: Buysse DJ et al. (1989) • Validação Brasileira: Bertolazi AN et al. (2011)
                                      </p>
                                    </div>
                                  ) : scale.scaleKey === 'bioimpedancia' || (scale.scaleTitle || '').toLowerCase().includes('bioimpedância') ? (
                                    <div className="bg-gradient-to-r from-cyan-50/90 via-teal-50/70 to-slate-50 dark:from-cyan-950/40 dark:via-teal-950/30 dark:to-slate-900/40 p-4 rounded-2xl border border-cyan-200/90 dark:border-cyan-800/80 print:border-slate-300 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2 text-cyan-900 dark:text-cyan-300 font-black text-xs uppercase tracking-wider">
                                          <Activity className="w-4 h-4 text-cyan-600 shrink-0" />
                                          <span>Bioimpedância e Composição Corporal</span>
                                        </div>
                                        {scale.scoreSummary && (
                                          <span className="text-[11px] font-black text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-700">
                                            {scale.scoreSummary}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                        {scale.clinicalInterpretation}
                                      </p>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-cyan-100 dark:border-cyan-900/50">
                                        Ref: Análise por Bioimpedância Elétrica Tetrapolar • Parâmetros de Eutrofia e Distribuição de Massa Magra / Gordura
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs flex items-center space-x-2 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 print:border-slate-200">
                                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                                      <span>
                                        <strong>Classificação Clínica:</strong> {scale.clinicalInterpretation}
                                      </span>
                                    </div>
                                  )
                                )}

                                {/* Items Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-2">
                                  {scale.items.map((it, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 print:border-slate-200 text-xs"
                                    >
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-slate-600 uppercase block">
                                        {it.label}
                                      </span>
                                      <p className="font-extrabold text-slate-900 dark:text-slate-100 print:text-slate-950 mt-0.5">
                                        {it.value} {it.unit || ''}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Session Notes & Digital Signature */}
                      {(activeSession.notes || (activeSession.isSigned && activeSession.signatureImage)) && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 print:shadow-none print:border-slate-300 print:rounded-xl print:p-4 break-inside-avoid page-break-avoid">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 print:text-slate-950">
                            Observações e Assinatura da Avaliação
                          </h4>

                          {activeSession.notes && (
                            <div className="bg-blue-50/60 dark:bg-blue-900/20 print:bg-blue-50/40 p-3.5 rounded-2xl print:rounded-xl border border-blue-100 dark:border-blue-800/50 print:border-blue-200 text-xs space-y-1">
                              <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 print:text-blue-900 uppercase tracking-wider block">
                                Observações do Fisioterapeuta:
                              </span>
                              <p className="text-slate-800 dark:text-slate-200 print:text-slate-900 whitespace-pre-wrap leading-relaxed">
                                {stripHtml(activeSession.notes)}
                              </p>
                            </div>
                          )}

                          {activeSession.isSigned && activeSession.signatureImage && (
                            <div className="bg-slate-50 dark:bg-slate-800 print:bg-slate-50 p-3.5 rounded-2xl print:rounded-xl border border-slate-200/80 dark:border-slate-700 print:border-slate-300 flex items-center justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 print:text-slate-600 uppercase tracking-wider block">
                                  Assinatura Digital do Paciente
                                </span>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 print:text-slate-950 mt-0.5">
                                  Assinado por: {activeSession.signedByName || patient.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600">
                                  Data e Hora: {formatDateTime(activeSession.signedAt)}
                                </p>
                              </div>
                              <div className="bg-white dark:bg-slate-900 print:bg-white p-2 rounded-xl border border-slate-200 dark:border-slate-700 print:border-slate-300 shrink-0">
                                <img
                                  src={activeSession.signatureImage}
                                  alt="Assinatura"
                                  className="max-h-16 object-contain dark:invert print:invert-0"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ✨ FINAL SECTION: Assistente IA • Parecer Clínico no Final da Avaliação */}
                      <div className="pt-2">
                        <AiCopilotCard
                          patientId={patient.id}
                          patientName={patient.name}
                          patientPhone={patient.phone}
                          scaleKey={`session_${activeSession.recordId}`}
                          scaleTitle={`${activeSession.sessionTitle} (${activeSession.scales.length} escalas)`}
                          sessions={currentScaleGroups.flatMap((g) => g.sessions.filter((s) => s.recordId === activeSession.recordId))}
                          onReportChange={handleReportChange}
                          onPdfExport={(reportText, toneLabel, allReports) => {
                            generateClinicalReportPdf({
                              patient,
                              patientRecords: mergedRecords,
                              selectedSession: activeSession,
                              parsedScaleGroups: currentScaleGroups,
                              aiReportText: reportText,
                              aiToneLabel: toneLabel,
                              aiToneReports: allReports,
                            });
                          }}
                        />
                      </div>

                      {/* Barra de Ações Inferior • Voltar & Fechar */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordId(null)}
                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Voltar para Lista de Avaliações</span>
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          className="w-10 h-10 inline-flex items-center justify-center text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-all cursor-pointer"
                          title="Fechar"
                          aria-label="Fechar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ============================================================ */
                /* VIEW B: MAIN TABLE OF ALL EVALUATIONS PERFORMED (DEFAULT)    */
                /* ============================================================ */
                <div className="space-y-6">
                  {/* Overview Hero Banner */}
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white p-6 rounded-3xl shadow-md space-y-3 print:bg-white print:text-slate-900 print:border print:border-slate-300 print:shadow-none print:p-4 print:rounded-xl break-inside-avoid page-break-avoid">
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-5 h-5 text-amber-300 print:text-blue-600" />
                      <h3 className="text-base sm:text-lg font-black text-white print:text-slate-950">
                        Histórico de Todas as Avaliações Realizadas
                      </h3>
                    </div>
                    <p className="text-xs text-slate-100 print:text-slate-700 leading-relaxed max-w-2xl">
                      Clique em qualquer avaliação na tabela abaixo para abrir o laudo completo com todas as escalas
                      aplicadas naquela data, resultados, testes e o parecer clínico do assistente.
                    </p>
                  </div>

                  {/* MAIN CONTAINER OF EVALUATIONS */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-3.5 sm:p-6 space-y-4 print:shadow-none print:border-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-100 dark:border-slate-800 sm:border-0 sm:pb-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                        Avaliações Realizadas ({evaluationSessions.length})
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">
                        Total de {totalScalesCount} escalas clínicas no prontuário
                      </span>
                    </div>

                    {/* 📱 CARDS MOBILE (Para telas de aplicativo / smartphones) */}
                    <div className="block md:hidden space-y-3">
                      {evaluationSessions.map((sess, sIdx) => {
                        const scaleCount = sess.scales.length > 0 ? sess.scales.length : (sess.modulesCount || 1);
                        const isLoadingThis = loadingDetailId === sess.recordId;

                        return (
                          <div
                            key={sess.recordId}
                            onClick={() => handleOpenEvaluation(sess.recordId)}
                            className="bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs active:scale-[0.99] space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  #{sIdx + 1}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                                    {sess.sessionTitle}
                                  </h5>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {sess.formattedDate}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border inline-flex items-center space-x-1 shrink-0 ${
                                  sess.isSigned
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                }`}
                              >
                                {sess.isSigned ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-amber-600" />
                                )}
                                <span>{sess.isSigned ? 'Assinado' : 'Pendente'}</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                              <span className="truncate">
                                Prof.: <strong>{sess.evaluatorName}</strong>
                              </span>
                              <span className="inline-flex items-center space-x-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60 text-[11px] font-bold shrink-0">
                                <Layers className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span>{scaleCount} escala{scaleCount === 1 ? '' : 's'}</span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEvaluation(sess.recordId);
                              }}
                              disabled={isLoadingThis}
                              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                            >
                              {isLoadingThis ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Abrindo Avaliação...</span>
                                </>
                              ) : (
                                <>
                                  <span>Visualizar Avaliação Completa</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* 💻 TABELA DESKTOP */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-3.5 px-4">Sessão / Avaliação</th>
                            <th className="py-3.5 px-4">Data</th>
                            <th className="py-3.5 px-4">Fisioterapeuta</th>
                            <th className="py-3.5 px-4">Qtd. de Escalas</th>
                            <th className="py-3.5 px-4">Assinatura</th>
                            <th className="py-3.5 px-4 text-right print:hidden">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {evaluationSessions.map((sess, sIdx) => {
                            const scaleCount = sess.scales.length > 0 ? sess.scales.length : (sess.modulesCount || 1);
                            const isLoadingThis = loadingDetailId === sess.recordId;

                            return (
                              <tr
                                key={sess.recordId}
                                onClick={() => handleOpenEvaluation(sess.recordId)}
                                className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                              >
                                {/* Session Title */}
                                <td className="py-4 px-4 font-black text-slate-900 dark:text-slate-100">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      #{sIdx + 1}
                                    </div>
                                    <span className="text-xs sm:text-sm font-black">{sess.sessionTitle}</span>
                                  </div>
                                </td>

                                {/* Date */}
                                <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                                  {sess.formattedDate}
                                </td>

                                {/* Evaluator */}
                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{sess.evaluatorName}</span>
                                  {sess.evaluatorCrefito && (
                                    <span className="text-[10px] text-slate-400 font-mono">CREFITO: {sess.evaluatorCrefito}</span>
                                  )}
                                </td>

                                {/* Clean Compact Scale Count */}
                                <td className="py-4 px-4">
                                  <span className="inline-flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-xl border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold">
                                    <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>
                                      {scaleCount} escala{scaleCount === 1 ? '' : 's'} aplicada{scaleCount === 1 ? '' : 's'}
                                    </span>
                                  </span>
                                </td>

                                {/* Signature Status */}
                                <td className="py-4 px-4">
                                  <span
                                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border inline-flex items-center space-x-1 ${
                                      sess.isSigned
                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                        : 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                    }`}
                                  >
                                    {sess.isSigned ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-amber-600" />
                                    )}
                                    <span>{sess.isSigned ? 'Assinado' : 'Pendente'}</span>
                                  </span>
                                </td>

                                {/* Action Button */}
                                <td className="py-4 px-4 text-right print:hidden">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEvaluation(sess.recordId);
                                    }}
                                    disabled={isLoadingThis}
                                    className="inline-flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                  >
                                    {isLoadingThis ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Carregando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>Abrir Avaliação</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
