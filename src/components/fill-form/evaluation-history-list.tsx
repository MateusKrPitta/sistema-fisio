'use client';

import React, { useState } from 'react';
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
  Camera,
  Eye,
} from 'lucide-react';
import { CustomField } from '@/lib/clinical-presets';
import { ImageLightbox } from '@/components/image-lightbox';

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
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

        let recordImages: string[] = [];
        if (Array.isArray(record.images)) {
          recordImages = record.images;
        } else if (typeof record.images === 'string') {
          try {
            const parsed = JSON.parse(record.images);
            if (Array.isArray(parsed)) recordImages = parsed;
          } catch {
            if (record.images.startsWith('data:') || record.images.startsWith('http')) {
              recordImages = [record.images];
            }
          }
        }
        if (recordImages.length === 0 && recAnswers?.images && Array.isArray(recAnswers.images)) {
          recordImages = recAnswers.images;
        }
        if (recordImages.length === 0 && recAnswers?.photoData && typeof recAnswers.photoData === 'string') {
          recordImages = [recAnswers.photoData];
        }

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
                    {recordImages.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                          <Camera className="w-3 h-3" />
                          {recordImages.length} foto(s)
                        </span>
                      </>
                    )}
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
                  title="Editar Avaliação"
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
                    title="Excluir Avaliação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="p-2 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Accordion Body */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-6 sm:px-6 space-y-5 border-t border-slate-100 pt-5 bg-slate-50/40"
                >
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      isSigned
                        ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                        : 'bg-amber-50/60 border-amber-200/80 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {isSigned ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h5 className="font-extrabold text-xs sm:text-sm">
                          {isSigned ? 'Avaliação Assinada pelo Paciente' : 'Aguardando Assinatura do Paciente'}
                        </h5>
                        <p className="text-[11px] opacity-80">
                          {isSigned
                            ? `Documento validado com assinatura em ${formatDateTimeSafe(
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

                  {/* Attached Photos / Evidences */}
                  {recordImages.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-blue-600" />
                            Fotos e Evidências ({recordImages.length})
                          </h5>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Clique na foto para ampliar
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {recordImages.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => {
                              setLightboxImages(recordImages);
                              setLightboxIndex(imgIdx);
                            }}
                            className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-950/5 border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all"
                          >
                            <img
                              src={imgUrl}
                              alt={`Evidência ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 flex items-center justify-center transition-colors">
                              <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-opacity">
                                <Eye className="w-3 h-3 text-blue-600" />
                                Ampliar
                              </span>
                            </div>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                              #{imgIdx + 1}
                            </span>
                          </div>
                        ))}
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

      {/* Lightbox for History Photos */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onNavigate={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
