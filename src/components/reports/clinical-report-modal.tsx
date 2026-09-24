'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  X,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  PatientItem,
  EvaluationRecord,
  ParsedScaleGroup,
  formatDateTime,
} from '@/lib/clinical-report-engine';
import { AiCopilotCard } from './ai-copilot-card';
import { ScaleComparativeTable } from './scale-comparative-table';

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
  const [selectedScaleKey, setSelectedScaleKey] = useState<string>('all');

  const activeScaleGroup =
    selectedScaleKey === 'all'
      ? null
      : parsedScaleGroups.find((g) => g.scaleKey === selectedScaleKey) || null;

  return (
    <AnimatePresence>
      {patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-all"
            onClick={onClose}
          />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-slate-50 dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] h-[92vh] flex flex-col overflow-hidden border border-slate-200/90 dark:border-slate-800 z-10"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-xs">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Laudo Clínico: {patient.name}
                </h2>
                <div className="flex items-center flex-wrap gap-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>
                    CPF: <strong className="text-slate-700 dark:text-slate-300">{patient.cpf}</strong>
                  </span>
                  <span>
                    • Total de Avaliações: <strong className="text-blue-700 dark:text-blue-500">{patientRecords.length}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Imprimir Laudo Clínico / Salvar PDF"
              >
                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="hidden sm:inline">Imprimir Laudo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scale Selector Bar */}
          <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto hide-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Escala Clínica:
            </span>

            {/* Tab: All Scales Overview */}
            <button
              type="button"
              onClick={() => setSelectedScaleKey('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                selectedScaleKey === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visão Geral ({parsedScaleGroups.length} escalas)</span>
            </button>

            {/* Individual Scales */}
            {parsedScaleGroups.map((scaleGroup) => {
              const isSelected = selectedScaleKey === scaleGroup.scaleKey;
              return (
                <button
                  key={scaleGroup.scaleKey}
                  type="button"
                  onClick={() => setSelectedScaleKey(scaleGroup.scaleKey)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{scaleGroup.scaleTitle}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {scaleGroup.sessions.length}x
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-6">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-semibold">Carregando relatório e agregando escalas...</p>
              </div>
            ) : patientRecords.length === 0 ? (
              <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">Nenhuma avaliação registrada</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Este paciente ainda não possui avaliações ou fichas preenchidas no prontuário.
                </p>
              </div>
            ) : selectedScaleKey !== 'all' && activeScaleGroup ? (
              /* SPECIFIC SCALE VIEW */
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                        Escala Clínica Selecionada
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-white">{activeScaleGroup.scaleTitle}</h3>
                      <p className="text-xs text-slate-300">
                        Categoria: <strong className="text-cyan-300">{activeScaleGroup.category}</strong> • Avaliada em{' '}
                        <strong className="text-white">{activeScaleGroup.sessions.length} sessão(ões)</strong>
                      </p>
                    </div>

                    {activeScaleGroup.sessions[activeScaleGroup.sessions.length - 1]?.scoreSummary && (
                      <div className="bg-white/10 border border-white/20 p-3.5 rounded-2xl text-right backdrop-blur-xs">
                        <span className="text-[10px] font-bold text-blue-200 uppercase block">Resultado Atual</span>
                        <span className="text-xl font-black text-white">
                          {activeScaleGroup.sessions[activeScaleGroup.sessions.length - 1].scoreSummary}
                        </span>
                      </div>
                    )}
                  </div>

                  {activeScaleGroup.sessions[activeScaleGroup.sessions.length - 1]?.clinicalInterpretation && (
                    <div className="bg-white/10 border border-white/15 p-3 rounded-xl text-xs flex items-center space-x-2 text-cyan-200">
                      <Info className="w-4 h-4 text-cyan-300 shrink-0" />
                      <span>
                        <strong>Classificação Clínica:</strong>{' '}
                        {activeScaleGroup.sessions[activeScaleGroup.sessions.length - 1].clinicalInterpretation}
                      </span>
                    </div>
                  )}
                </div>

                {/* ✨ AI Copilot Card */}
                <AiCopilotCard
                  patientId={patient.id}
                  patientName={patient.name}
                  patientPhone={patient.phone}
                  scaleKey={activeScaleGroup.scaleKey}
                  scaleTitle={activeScaleGroup.scaleTitle}
                  sessions={activeScaleGroup.sessions}
                />

                {/* Comparative Table */}
                <ScaleComparativeTable sessions={activeScaleGroup.sessions} />

                {/* Session Logs */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 px-1">Histórico das Sessões desta Escala</h4>

                  {activeScaleGroup.sessions.map((sess, sIdx) => (
                    <div
                      key={sess.recordId}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            #{sIdx + 1}
                          </div>
                          <div>
                            <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              {sIdx === 0 ? '1ª Avaliação Inicial' : `${sIdx + 1}ª Reavaliação`} • {sess.date}
                            </h5>
                            <p className="text-xs text-slate-400">
                              Fisioterapeuta: <strong>{sess.evaluatorName}</strong>
                              {sess.evaluatorCrefito ? ` (CREFITO: ${sess.evaluatorCrefito})` : ''}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-3 py-1 rounded-full border flex items-center space-x-1 self-start sm:self-auto ${
                            sess.isSigned
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {sess.isSigned ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{sess.isSigned ? 'Assinado pelo Paciente' : 'Assinatura Pendente'}</span>
                        </span>
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sess.items.map((it, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">{it.label}</span>
                            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                              {it.value} {it.unit || ''}
                            </p>
                          </div>
                        ))}
                      </div>

                      {sess.notes && (
                        <div className="bg-blue-50/60 dark:bg-blue-900/20 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-800/50 text-xs space-y-1">
                          <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider block">
                            Observações do Fisioterapeuta:
                          </span>
                          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{sess.notes}</p>
                        </div>
                      )}

                      {sess.isSigned && sess.signatureImage && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Assinatura Digital do Paciente
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                              Assinado por: {sess.signedByName || patient.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Data e Hora: {formatDateTime(sess.signedAt)}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                            <img src={sess.signatureImage} alt="Assinatura" className="max-h-16 object-contain dark:invert" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* OVERVIEW MODE */
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white p-6 rounded-3xl shadow-md space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Visão Geral de Todas as Avaliações do Paciente
                    </h3>
                  </div>
                  <p className="text-xs text-slate-100 leading-relaxed max-w-2xl">
                    Este paciente possui <strong className="text-white">{patientRecords.length} avaliação(ões)</strong> e{' '}
                    <strong className="text-white">{parsedScaleGroups.length} escala(s) clínica(s)</strong> diferentes
                    aplicadas. Clique em qualquer escala na barra superior para ver a evolução detalhada e o laudo
                    específico de cada uma.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parsedScaleGroups.map((scaleGroup) => {
                    const lastSess = scaleGroup.sessions[scaleGroup.sessions.length - 1];
                    return (
                      <div
                        key={scaleGroup.scaleKey}
                        onClick={() => setSelectedScaleKey(scaleGroup.scaleKey)}
                        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-800 uppercase">
                            {scaleGroup.category}
                          </span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {scaleGroup.sessions.length} sessão(ões)
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{scaleGroup.scaleTitle}</h4>
                          {lastSess?.scoreSummary && (
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500 mt-1">
                              Último Resultado: {lastSess.scoreSummary}
                            </p>
                          )}
                          {lastSess?.clinicalInterpretation && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {lastSess.clinicalInterpretation}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-500 font-bold">
                          <span>Ver Evolução desta Escala ➔</span>
                        </div>
                      </div>
                    );
                  })}
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
