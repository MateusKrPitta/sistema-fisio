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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden printable-modal-wrapper">
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
            className="printable-modal-box relative bg-slate-50 dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] h-[92vh] flex flex-col overflow-hidden border border-slate-200/90 dark:border-slate-800 z-10"
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

              <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-300 text-xs text-slate-800 bg-slate-100 p-3 rounded-xl">
                <div>Paciente: <strong className="text-slate-950 font-bold">{patient.name}</strong></div>
                <div>CPF: <strong className="text-slate-950 font-bold">{patient.cpf || 'Não informado'}</strong></div>
                <div>Telefone: <strong className="text-slate-950 font-bold">{patient.phone || 'Não informado'}</strong></div>
              </div>
            </div>

            {/* Screen Header Bar */}
            <div className="print:hidden px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-xs">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Prontuário & Avaliações: {patient.name}
                  </h2>
                  <div className="flex items-center flex-wrap gap-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>
                      CPF: <strong className="text-slate-700 dark:text-slate-300">{patient.cpf}</strong>
                    </span>
                    <span>
                      • Total de Avaliações: <strong className="text-blue-700 dark:text-blue-500">{patientRecords.length}</strong>
                    </span>
                    {activeSession && (
                      <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        {activeSession.sessionTitle} • {activeSession.formattedDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* PDF Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                  title="Gerar e Baixar Arquivo PDF Oficial Completo"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>Baixar PDF Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="printable-content-body flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-6 print:p-0 print:overflow-visible">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Carregando avaliações e histórico do paciente...</p>
                </div>
              ) : evaluationSessions.length === 0 ? (
                <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-3">
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
                <div className="space-y-6">
                  {/* Back to Evaluations Button */}
                  <div className="flex items-center justify-between print:hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedRecordId(null)}
                      className="inline-flex items-center space-x-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar para Lista de Avaliações</span>
                    </button>
                  </div>

                  {/* Session Header Banner */}
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md space-y-3 print:bg-white print:text-slate-900 print:border print:border-slate-300 print:shadow-none print:p-4 print:rounded-xl break-inside-avoid page-break-avoid">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-300 print:text-blue-700 uppercase tracking-wider block">
                          Avaliação Fisioterapêutica Selecionada
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-white print:text-slate-950">
                          {activeSession.sessionTitle} • {activeSession.formattedDate}
                        </h3>
                        <p className="text-xs text-slate-300 print:text-slate-600">
                          Fisioterapeuta: <strong className="text-white print:text-slate-900">{activeSession.evaluatorName}</strong>
                          {activeSession.evaluatorCrefito ? ` (CREFITO: ${activeSession.evaluatorCrefito})` : ''} •{' '}
                          <strong className="text-cyan-300 print:text-slate-900">
                            {activeSession.scales.length > 0 ? activeSession.scales.length : (activeSession.modulesCount || 1)} escala(s) aplicada(s)
                          </strong>
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full border flex items-center space-x-1.5 self-start sm:self-auto ${
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
                    <div className="py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-slate-400 space-y-3">
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
                          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 text-center text-xs text-slate-500">
                            Nenhum item preenchido encontrado para esta avaliação.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {activeSession.scales.map((scale, scIdx) => (
                              <div
                                key={scale.scaleKey}
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 print:shadow-none print:border-slate-300 print:rounded-xl print:p-4 break-inside-avoid page-break-avoid"
                              >
                                {/* Scale Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 print:bg-slate-800">
                                      #{scIdx + 1}
                                    </div>
                                    <div>
                                      <h5 className="font-black text-sm text-slate-900 dark:text-slate-100 print:text-slate-950">
                                        {scale.scaleTitle}
                                      </h5>
                                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                        {scale.category}
                                      </span>
                                    </div>
                                  </div>

                                  {scale.scoreSummary && (
                                    <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-3 py-1.5 rounded-xl text-right">
                                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase block">
                                        Resultado Obtido
                                      </span>
                                      <span className="text-base font-black text-blue-950 dark:text-blue-200">
                                        {scale.scoreSummary}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Clinical Interpretation if any */}
                                {scale.clinicalInterpretation && (
                                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs flex items-center space-x-2 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 print:border-slate-200">
                                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>
                                      <strong>Classificação Clínica:</strong> {scale.clinicalInterpretation}
                                    </span>
                                  </div>
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

                  {/* MAIN TABLE OF EVALUATIONS */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4 print:shadow-none print:border-slate-300">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                        Avaliações e Reavaliações Registradas ({evaluationSessions.length})
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">
                        Total de {totalScalesCount} escalas clínicas distintas no prontuário
                      </span>
                    </div>

                    <div className="overflow-x-auto">
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
