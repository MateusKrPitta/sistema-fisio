'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Sparkles,
  Heart,
  FileText,
  Award,
  Check,
  Copy,
  MessageCircle,
  RotateCcw,
  Loader2,
  Save,
  BookmarkCheck,
  Edit3,
} from 'lucide-react';
import { ScaleSession, formatDateTime } from '@/lib/clinical-report-engine';
import { useToast } from '@/components/toast-context';

interface SavedReportData {
  id: number;
  scaleKey: string;
  tone: string;
  reportText: string;
  updatedAt: string;
  createdAt: string;
}

interface AiCopilotCardProps {
  patientId: number;
  patientName: string;
  patientPhone?: string;
  scaleKey: string;
  scaleTitle: string;
  sessions: ScaleSession[];
}

export function AiCopilotCard({
  patientId,
  patientName,
  patientPhone,
  scaleKey,
  scaleTitle,
  sessions,
}: AiCopilotCardProps) {
  const { toast } = useToast();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTone, setAiTone] = useState<'patient_friendly' | 'clinical' | 'therapeutic_goals'>('patient_friendly');
  const [aiReportsCache, setAiReportsCache] = useState<Record<string, string>>({});
  const [savedReportsMap, setSavedReportsMap] = useState<Record<string, SavedReportData>>({});
  const [copiedAi, setCopiedAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  const currentKey = `${scaleKey}_${aiTone}`;
  const savedReport = savedReportsMap[currentKey];
  const displayedReportText = isEditing
    ? editedText
    : savedReport?.reportText || aiReportsCache[currentKey] || '';

  // Load all previously saved reports for this patient on mount or patient change
  useEffect(() => {
    if (!patientId) return;
    api.get(`/patients/${patientId}/saved-reports`)
      .then((res: any) => {
        const list: SavedReportData[] = Array.isArray(res) ? res : res?.data || [];
        const map: Record<string, SavedReportData> = {};
        list.forEach((item) => {
          map[`${item.scaleKey}_${item.tone}`] = item;
        });
        setSavedReportsMap(map);
      })
      .catch(() => {
        // ignore
      });
  }, [patientId]);

  // Reset editing mode when tone or scaleKey changes
  useEffect(() => {
    setIsEditing(false);
    const existing = savedReportsMap[currentKey]?.reportText || aiReportsCache[currentKey] || '';
    setEditedText(existing);
  }, [currentKey, savedReportsMap, aiReportsCache]);

  const handleGenerateAiReport = async () => {
    setAiLoading(true);
    try {
      const condensedSummary =
        sessions
          .map((s, idx) => {
            const prefix = idx === 0 ? '1ª Avaliação' : `${idx + 1}ª Reavaliação`;
            const res = s.scoreSummary || s.items.map((it) => `${it.label}: ${it.value}`).slice(0, 3).join(', ');
            return `${prefix} (${s.date}): ${res}`;
          })
          .join(' | ') +
        (sessions[sessions.length - 1]?.clinicalInterpretation
          ? ` • Diagnóstico: ${sessions[sessions.length - 1].clinicalInterpretation}`
          : '');

      const res: any = await api.post(`/patients/${patientId}/ai-report`, {
        scaleTitle,
        tone: aiTone,
        summaryText: condensedSummary,
        patientName,
      });

      if (res?.reportText) {
        setAiReportsCache((prev) => ({ ...prev, [currentKey]: res.reportText }));
        setEditedText(res.reportText);
        setIsEditing(false);
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar parecer',
        description: err?.message || 'Não foi possível gerar a análise com IA.',
        type: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveReport = async () => {
    const textToSave = isEditing ? editedText : displayedReportText;
    if (!textToSave.trim()) return;

    setIsSaving(true);
    try {
      const res: any = await api.post(`/patients/${patientId}/saved-reports`, {
        scaleKey,
        scaleTitle,
        tone: aiTone,
        reportText: textToSave.trim(),
      });

      if (res?.report) {
        setSavedReportsMap((prev) => ({
          ...prev,
          [currentKey]: res.report,
        }));
        setIsEditing(false);
        toast({
          title: 'Laudo Gravado com Sucesso!',
          description: 'O parecer clínico foi salvo permanentemente no prontuário do paciente.',
          type: 'success',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar laudo',
        description: err?.message || 'Não foi possível salvar o parecer no banco de dados.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAiText = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAi(true);
      setTimeout(() => setCopiedAi(false), 2500);
    }
  };

  const handleSendAiWhatsApp = (text: string) => {
    const cleanPhone = (patientPhone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(text);
    const waUrl =
      cleanPhone.length >= 10 ? `https://wa.me/55${cleanPhone}?text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const hasReport = Boolean(displayedReportText.trim() || isEditing);

  return (
    <div className="bg-gradient-to-br from-indigo-900/90 via-slate-900 to-blue-950 text-white rounded-3xl p-5 sm:p-6 border border-indigo-500/30 shadow-lg space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <span>Assistente IA • Parecer Humanizado</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
                Gemini 1.5
              </span>
            </h4>
            <p className="text-xs text-slate-300">
              Análise inteligente e acolhedora da evolução nesta escala com opção de gravação no prontuário
            </p>
          </div>
        </div>

        {/* Tone Toggle Pills */}
        <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAiTone('patient_friendly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              aiTone === 'patient_friendly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-300" />
            <span>Paciente / Família</span>
          </button>

          <button
            type="button"
            onClick={() => setAiTone('clinical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              aiTone === 'clinical' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300" />
            <span>Laudo Técnico</span>
          </button>

          <button
            type="button"
            onClick={() => setAiTone('therapeutic_goals')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              aiTone === 'therapeutic_goals' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Metas & Conduta</span>
          </button>
        </div>
      </div>

      {/* AI Content Box */}
      <div className="relative z-10">
        {hasReport ? (
          <div className="space-y-3.5 bg-white/5 border border-white/10 rounded-2xl p-4.5 backdrop-blur-xs">
            {/* Status Header Badge if Saved */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              {savedReport ? (
                <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Gravado no Prontuário • {savedReport.updatedAt ? formatDateTime(savedReport.updatedAt) : 'Salvo'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Parecer gerado (Ainda não salvo)</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!isEditing) {
                    setEditedText(displayedReportText);
                    setIsEditing(true);
                  } else {
                    setIsEditing(false);
                  }
                }}
                className="text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center space-x-1 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditing ? 'Cancelar Edição' : 'Editar Texto'}</span>
              </button>
            </div>

            {/* Report Content (Editable or Display) */}
            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950/80 border border-blue-400/50 rounded-xl p-3 text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                placeholder="Edite o parecer clínico..."
              />
            ) : (
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">
                {displayedReportText}
              </p>
            )}

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
              <span className="text-[11px] text-slate-400 italic">
                Baseado nas {sessions.length} avaliações da escala.
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {/* Save Button */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveReport}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/30"
                  title="Salvar parecer permanentemente no prontuário do paciente"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-blue-200" />
                  )}
                  <span>{isSaving ? 'Salvando...' : savedReport ? 'Atualizar Laudo' : 'Salvar Laudo'}</span>
                </button>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={() => handleCopyAiText(displayedReportText)}
                  className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
                  title="Copiar texto gerado"
                >
                  {copiedAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-300" />}
                  <span>{copiedAi ? 'Copiado!' : 'Copiar'}</span>
                </button>

                {/* WhatsApp Button */}
                <button
                  type="button"
                  onClick={() => handleSendAiWhatsApp(displayedReportText)}
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
                  title="Enviar parecer para o WhatsApp do paciente"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Enviar WhatsApp</span>
                </button>

                {/* Regenerate Button */}
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleGenerateAiReport}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                  title="Regenerar parecer com IA"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">
                Deseja gerar uma análise humanizada em texto para este paciente?
              </p>
              <p className="text-[11px] text-slate-400">
                O assistente analisa a progressão de {sessions.length} sessões e gera 3 a 4 frases sob medida.
              </p>
            </div>

            <button
              type="button"
              disabled={aiLoading}
              onClick={handleGenerateAiReport}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analisando com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✨ Gerar Parecer com IA</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

