'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Link2,
  MessageSquare,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
} from 'lucide-react';
import { CustomField } from '@/lib/clinical-presets';

export interface ScaleGroup {
  id: string | number;
  title: string;
  category?: string;
  fields: any[];
}

interface EvaluationHistoryListProps {
  formRecords: any[];
  patient: any;
  isAdmin: boolean;
  expandedRecordIds: number[];
  onToggleExpand: (id: number) => void;
  onStartEdit: (record: any) => void;
  onRequestDelete: (record: any) => void;
}

export const formatDateSafe = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    const clean = String(dateString).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};

export const formatDateTimeSafe = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const getAnswerForField = (field: CustomField | any, answersMap: Record<string, any>, index?: number) => {
  if (!answersMap || typeof answersMap !== 'object') return undefined;
  if (field.id && answersMap[field.id] !== undefined) return answersMap[field.id];
  if (field.label && answersMap[field.label] !== undefined) return answersMap[field.label];
  if (field.id && answersMap[String(field.id)] !== undefined) return answersMap[String(field.id)];

  const foundKey = Object.keys(answersMap).find(
    (k) =>
      k.toLowerCase() === (field.label || '').toLowerCase() ||
      (index !== undefined && (k.endsWith(`_${index + 1}`) || k.endsWith(`_${index}`)))
  );
  if (foundKey) return answersMap[foundKey];
  return undefined;
};

export const parseAnswers = (rawAnswers: any): Record<string, any> => {
  if (!rawAnswers) return {};
  if (typeof rawAnswers === 'object') return rawAnswers;
  try {
    return JSON.parse(rawAnswers);
  } catch {
    return {};
  }
};

export const extractScaleGroups = (template: any): ScaleGroup[] => {
  if (!template) return [];
  const scaleGroups: ScaleGroup[] = [];
  const rawModules =
    template.modules && Array.isArray(template.modules) && template.modules.length > 0 ? template.modules : [template];

  rawModules.forEach((mod: any, mIdx: number) => {
    const rawFields = mod.fields || template.fields || [];
    if (!Array.isArray(rawFields) || rawFields.length === 0) return;

    const parsedFields = rawFields.map((f: any) => {
      let parsedOpts = f.options;
      if (typeof parsedOpts === 'string') {
        try {
          parsedOpts = JSON.parse(parsedOpts);
        } catch {
          parsedOpts = [];
        }
      }
      return { ...f, options: parsedOpts || [] };
    });

    scaleGroups.push({
      id: mod.id || mIdx,
      title: mod.name || template.title || 'Escala Clínica',
      category: mod.category || template.category || 'Avaliação Clínica',
      fields: parsedFields,
    });
  });

  return scaleGroups;
};

export function EvaluationHistoryList({
  formRecords,
  patient,
  isAdmin,
  expandedRecordIds,
  onToggleExpand,
  onStartEdit,
  onRequestDelete,
}: EvaluationHistoryListProps) {
  const getSignUrl = (token?: string) => {
    if (!token) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/assinar/${token}`;
    }
    return `/assinar/${token}`;
  };

  const handleCopySignLink = (e: React.MouseEvent, token?: string) => {
    e.stopPropagation();
    if (!token) return;
    const url = getSignUrl(token);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  };

  const handleSendWhatsApp = (e: React.MouseEvent, token?: string, patientName?: string, phone?: string) => {
    e.stopPropagation();
    if (!token) return;
    const url = getSignUrl(token);
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const pName = patientName || patient?.fullName || patient?.name || 'Paciente';
    const msg = encodeURIComponent(
      `Olá ${pName}! Segue o link para você visualizar e assinar digitalmente sua avaliação fisioterapêutica:\n\n${url}\n\nPor favor, acesse o link para conferir o resumo e registrar sua assinatura.`
    );
    const waUrl =
      cleanPhone.length >= 10 ? `https://wa.me/55${cleanPhone}?text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const calculateRecordBadge = (record: any) => {
    const recAnswers = parseAnswers(record.answers);
    const title = (record.template?.title || '').toLowerCase();

    // 1. Glasgow
    if (title.includes('glasgow') || Object.keys(recAnswers).some((k) => k.toLowerCase().includes('glasgow') || k.toLowerCase().includes('ocular'))) {
      let total = 0;
      Object.values(recAnswers).forEach((v) => {
        const num = parseInt(String(v).charAt(0), 10);
        if (!isNaN(num)) total += num;
      });
      if (total > 0) {
        return {
          title: 'GLASGOW',
          score: `${total} / 15 pts`,
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      }
    }

    // 2. Ashworth
    if (title.includes('ashworth') || title.includes('espasticidade') || Object.keys(recAnswers).some((k) => k.toLowerCase().includes('espasticidade') || k.toLowerCase().includes('ashworth'))) {
      const grauKey = Object.keys(recAnswers).find((k) => k.toLowerCase().includes('grau') || k.toLowerCase().includes('espasticidade'));
      if (grauKey && recAnswers[grauKey]) {
        return {
          title: 'ASHWORTH',
          score: `Grau ${String(recAnswers[grauKey]).split(' - ')[0]}`,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      }
    }

    // 3. Tronco TCT
    if (title.includes('tronco') || title.includes('tct')) {
      let total = 0;
      Object.values(recAnswers).forEach((v) => {
        const str = String(v);
        if (str.startsWith('25')) total += 25;
        else if (str.startsWith('12')) total += 12;
      });
      return {
        title: 'TRONCO TCT',
        score: `${total} / 100 pts`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {formRecords.map((record, index) => {
        const isExpanded = expandedRecordIds.includes(record.id);
        const isSigned = (record.signatureStatus || record.signature_status) === 'assinado';
        const sigToken = record.signatureToken || record.signature_token;
        const rDate = record.recordDate || record.record_date || record.createdAt;
        const formattedDate = formatDateSafe(rDate);
        const recordScales = extractScaleGroups(record.template);
        const recAnswers = parseAnswers(record.answers);
        const answersCount = Object.keys(recAnswers).length;
        const badgeScore = calculateRecordBadge(record);

        return (
          <div
            key={record.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:border-slate-300"
          >
            {/* Header Accordion */}
            <div
              onClick={() => onToggleExpand(record.id)}
              className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  #{formRecords.length - index}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {formRecords.length - index === 1
                        ? '1ª Avaliação Inicial'
                        : `${formRecords.length - index}ª Reavaliação`}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isSigned
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {isSigned ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                      <span>{isSigned ? 'Assinatura Registrada' : 'Assinatura Pendente'}</span>
                    </span>

                    <span>•</span>
                    <span>{answersCount} item(ns)</span>
                    {record.template?.title && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{record.template.title}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges & Actions */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                {badgeScore && (
                  <div className={`px-3 py-1 rounded-xl border text-right font-black text-xs ${badgeScore.badgeClass}`}>
                    <span className="text-[9px] uppercase font-bold block opacity-75">{badgeScore.title}</span>
                    <span>{badgeScore.score}</span>
                  </div>
                )}

                {/* Share Link Buttons */}
                {sigToken && (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleCopySignLink(e, sigToken)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white shadow-2xs"
                      title="Copiar link para o paciente assinar"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleSendWhatsApp(e, sigToken, patient?.fullName || patient?.name, patient?.phone)
                      }
                      className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-emerald-200 bg-emerald-50/50 shadow-2xs"
                      title="Enviar link de assinatura via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(record);
                  }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  title="Editar esta avaliação"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(record);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Excluir esta avaliação (Apenas Administrador)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="p-2 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-100 p-6 bg-slate-50/50 space-y-6"
                >
                  {/* Signature Proof Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSigned
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          isSigned ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-500 text-white shadow-xs'
                        }`}
                      >
                        {isSigned ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-xs sm:text-sm">
                          {isSigned
                            ? 'Avaliação Assinada Digitalmente pelo Paciente'
                            : 'Assinatura Pendente do Paciente'}
                        </h5>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {isSigned
                            ? `Assinado por ${record.signedByName || record.signed_by_name || patient?.name} em ${formatDateTimeSafe(
                                record.signedAt || record.signed_at
                              )}`
                            : 'Envie o link para o paciente visualizar a prévia da avaliação e assinar digitalmente.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* If signed, signature image */}
                  {isSigned && (record.signatureImage || record.signature_image) && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Assinatura Digital Gravada:
                      </span>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-start">
                        <img
                          src={record.signatureImage || record.signature_image}
                          alt="Assinatura do Paciente"
                          className="max-h-24 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {record.notes && (
                    <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs">
                      <span className="font-bold text-blue-950 block mb-1">Observações do Fisioterapeuta:</span>
                      <p className="text-slate-700 whitespace-pre-wrap">{record.notes}</p>
                    </div>
                  )}

                  {recordScales.length > 0 ? (
                    recordScales.map((scale, scIdx) => (
                      <div
                        key={scale.id || scIdx}
                        className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs"
                      >
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{scale.title}</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {scale.fields.map((f: any, fIdx: number) => {
                            const keyById = String(f.id || f.label || fIdx);
                            const ansVal = getAnswerForField(f, recAnswers, fIdx);
                            const hasAns = ansVal !== undefined && ansVal !== null && ansVal !== '';

                            return (
                              <div
                                key={keyById}
                                className={`p-4 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${
                                  hasAns
                                    ? 'bg-slate-50 border-slate-200'
                                    : 'bg-slate-50/30 border-dashed border-slate-200 opacity-60'
                                }`}
                              >
                                <span className="text-[11px] font-bold text-slate-600 leading-snug">{f.label}</span>
                                <div className="font-black text-slate-900 text-sm">
                                  {hasAns ? (
                                    Array.isArray(ansVal) ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {ansVal.map((vItem: string) => (
                                          <span
                                            key={vItem}
                                            className="bg-blue-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-lg"
                                          >
                                            ✓ {vItem}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-blue-950 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl inline-block">
                                        {`${ansVal} ${f.unit || ''}`}
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-slate-400 italic font-normal">Não preenchido</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
