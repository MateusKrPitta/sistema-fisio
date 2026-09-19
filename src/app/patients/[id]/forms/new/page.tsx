'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Sliders,
  Type,
  Hash,
  ListOrdered,
  CheckSquare,
  Sparkles,
  Loader2,
  AlertTriangle,
  ClipboardList,
  Activity,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/toast-context';
import { CustomSelect } from '@/components/custom-select';
import { FormTemplate } from '../../../../custom-forms/templates/page';
import { AnamneseEvaluation } from '@/components/evaluations/anamnese-evaluation';
import { PainMapEvaluation } from '@/components/evaluations/pain-map-evaluation';
import { PostureEvaluation } from '@/components/evaluations/posture-evaluation';

export default function NewPatientFormRecordPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const patientId = params?.id as string;
  const queryTemplateId = searchParams ? searchParams.get('templateId') : null;
  const queryType = searchParams ? searchParams.get('type') : null;

  const [patient, setPatient] = useState<any>(null);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('standard_anamnese');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form responses state for dynamic templates: { [fieldIdOrLabel]: value }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);

    Promise.all([
      api.get(`/patients/${patientId}`).catch(() => null),
      api.get('/form-templates').catch(() => []),
    ])
      .then(async ([patientRes, templateRes]) => {
        if (patientRes) setPatient(patientRes);

        const rawTemplates = Array.isArray(templateRes) ? templateRes : templateRes?.data || [];
        const formattedTemplates = rawTemplates.map((t: any) => ({
          ...t,
          modules: (t.modules || []).map((m: any) => ({
            ...m,
            fields: (m.fields || []).map((f: any) => ({
              ...f,
              options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options || [],
            })),
          })),
        }));

        setTemplates(formattedTemplates);

        // Priority check query params
        if (queryType) {
          if (queryType === 'pain_map' || queryType === 'pain') {
            setSelectedEvaluationId('standard_pain_map');
          } else if (queryType === 'posture') {
            setSelectedEvaluationId('standard_posture');
          } else if (queryType === 'anamnese') {
            setSelectedEvaluationId('standard_anamnese');
          }
        } else if (queryTemplateId) {
          const found = formattedTemplates.find((t: any) => String(t.id) === String(queryTemplateId));
          if (found) {
            setSelectedTemplate(found);
            setSelectedEvaluationId(String(found.id));
          }
        } else {
          // Default to anamnese or patient linked template if available
          const linkedId = Number(patientRes?.templateId || patientRes?.template_id || patientRes?.template?.id);
          if (linkedId) {
            const foundLinked = formattedTemplates.find((t: any) => Number(t.id) === linkedId);
            if (foundLinked) {
              setSelectedTemplate(foundLinked);
              setSelectedEvaluationId(String(foundLinked.id));
              return;
            }
          }
          setSelectedEvaluationId('standard_anamnese');
        }
      })
      .finally(() => setLoading(false));
  }, [patientId, queryTemplateId, queryType]);

  const handleEvaluationSelect = (val: string | number) => {
    const strVal = String(val);
    setSelectedEvaluationId(strVal);

    if (strVal.startsWith('standard_')) {
      setSelectedTemplate(null);
    } else {
      const found = templates.find((t) => String(t.id) === strVal);
      setSelectedTemplate(found || null);
    }
  };

  const handleAnswerChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitDynamic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setSaving(true);
    const payload = {
      templateId: selectedTemplate.id,
      recordDate,
      answers,
      notes,
    };

    api.post(`/patients/${patientId}/form-records`, payload)
      .then(() => {
        toast({
          title: 'Avaliação Registrada!',
          description: `Avaliação salva com sucesso para ${patient?.fullName || patient?.name || 'o paciente'}.`,
          type: 'success',
        });
        router.push(`/patients/${patientId}/reports`);
      })
      .catch((err: any) => {
        const errorMsg = err?.response?.data?.error || err?.message || 'Ocorreu um erro ao salvar a avaliação.';
        toast({
          title: 'Erro ao Salvar',
          description: errorMsg,
          type: 'error',
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const calculateTrunkScore = (mod: any) => {
    let total = 0;
    (mod.fields || []).forEach((f: any) => {
      const key = String(f.id || f.label);
      const val = answers[key];
      if (val) {
        const valStr = String(val);
        if (valStr.startsWith('25')) total += 25;
        else if (valStr.startsWith('12')) total += 12;
        else if (valStr.startsWith('0')) total += 0;
      }
    });
    return total;
  };

  const getTrunkStatusLabel = (score: number) => {
    if (score === 100) return 'Controle de Tronco Preservado (100 pts)';
    if (score >= 75) return 'Bom Controle de Tronco (75-99 pts)';
    if (score >= 37) return 'Comprometimento Moderado (37-74 pts)';
    return 'Comprometimento Severo (0-36 pts)';
  };

  const getTrunkStatusStyle = (score: number) => {
    if (score === 100) return 'bg-emerald-600 text-white';
    if (score >= 75) return 'bg-blue-600 text-white';
    if (score >= 37) return 'bg-amber-500 text-white';
    return 'bg-red-600 text-white';
  };

  const isTrunkOptions = (opts: string[]) => {
    if (!opts || opts.length < 3) return false;
    const has0 = opts.some((o) => String(o).startsWith('0'));
    const has12 = opts.some((o) => String(o).startsWith('12'));
    const has25 = opts.some((o) => String(o).startsWith('25'));
    return has0 && has12 && has25;
  };

  const getPainScoreColor = (val: number) => {
    if (val <= 3) return 'bg-emerald-500 text-white';
    if (val <= 6) return 'bg-amber-500 text-white';
    return 'bg-red-600 text-white';
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const allCategories = [
    'Todas',
    'Postura & Biomecânica',
    'Controle de Tronco',
    'Neurologia',
    'Geriatria & Equilíbrio',
    'Cardiorrespiratória',
    'Composição Corporal',
    'Membros Superiores e Inferiores',
    'Goniometria',
    'Geral',
  ];

  // Build evaluation options list with categories
  const allEvaluationOptions = [
    {
      value: 'standard_anamnese',
      label: 'Anamnese Fisioterapêutica',
      sublabel: 'Queixa principal, HDA, histórico clínico e antecedentes',
      badge: 'Modelo Clínico',
      category: 'Geral',
    },
    {
      value: 'standard_pain_map',
      label: 'Pontos e Mapa de Dor (Body Map)',
      sublabel: 'Mapeamento visual corporal e intensidade da dor (EVA)',
      badge: 'Modelo Clínico',
      category: 'Geral',
    },
    {
      value: 'standard_posture',
      label: 'Avaliação Postural & Fotometria',
      sublabel: 'Checklist de desvios anatômicos e registro por fotos',
      badge: 'Modelo Clínico',
      category: 'Postura & Biomecânica',
    },
    ...templates.map((t) => ({
      value: String(t.id),
      label: t.title,
      sublabel: t.description || 'Ficha personalizada com escalas clínicas',
      badge: `${t.modules?.length || 0} escalas`,
      category: t.modules?.[0]?.category || (t as any).category || 'Geral',
    })),
  ];

  const evaluationOptions = selectedCategory === 'Todas'
    ? allEvaluationOptions
    : allEvaluationOptions.filter((opt) => opt.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <>
      <Header
        title={`Preencher Avaliação - ${patient?.fullName || patient?.name || (loading ? 'Carregando...' : 'Paciente')}`}
        subtitle="Selecione o tipo de avaliação clínica ou escala funcional"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-full">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Perfil do Paciente</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Evaluation Type Selector & Date Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    1. Categoria Clínica
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c === 'Todas' ? '🌟 Todas as Categorias' : c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    2. Escala / Teste Avaliativo *
                  </label>
                  <CustomSelect
                    value={selectedEvaluationId}
                    onChange={handleEvaluationSelect}
                    options={evaluationOptions}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Data da Avaliação *
                  </label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {selectedTemplate?.description && (
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  💡 {selectedTemplate.description}
                </p>
              )}
            </div>

            {/* Render Standard Model 1: Anamnese */}
            {selectedEvaluationId === 'standard_anamnese' && (
              <AnamneseEvaluation
                patientId={patientId}
                recordDate={recordDate}
              />
            )}

            {/* Render Standard Model 2: Pain Map */}
            {selectedEvaluationId === 'standard_pain_map' && (
              <PainMapEvaluation
                patientId={patientId}
                recordDate={recordDate}
              />
            )}

            {/* Render Standard Model 3: Posture */}
            {selectedEvaluationId === 'standard_posture' && (
              <PostureEvaluation
                patientId={patientId}
                recordDate={recordDate}
              />
            )}

            {/* Render Dynamic Form Template Modules */}
            {!selectedEvaluationId.startsWith('standard_') && selectedTemplate && (
              <form onSubmit={handleSubmitDynamic} className="space-y-6">
                {selectedTemplate.modules?.map((mod) => {
                  const isTrunkMod = mod.name.toLowerCase().includes('tronco') || (mod.category || '').toLowerCase().includes('tronco');
                  const trunkScore = isTrunkMod ? calculateTrunkScore(mod) : 0;

                  return (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4"
                    >
                      {/* Module Category & Title Banner */}
                      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            {mod.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm sm:text-base">{mod.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                              {mod.category || 'Escala Clínica'}
                            </span>
                          </div>
                        </div>

                        {isTrunkMod && (
                          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Pontuação TCT</p>
                              <p className="text-base font-black text-white">{trunkScore} / 100 pts</p>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${getTrunkStatusStyle(trunkScore)}`}>
                              {getTrunkStatusLabel(trunkScore)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Fields Inputs */}
                      <div className="p-5 sm:p-6 space-y-6">
                        {mod.fields.map((f) => {
                          const answerKey = String(f.id || f.label);
                          const currentVal = answers[answerKey];

                          return (
                            <div key={answerKey} className="space-y-2 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-800">
                                  {f.label}
                                  {f.isRequired && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {f.unit && (
                                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                    Unidade: {f.unit}
                                  </span>
                                )}
                              </div>

                              {f.helpText && (
                                <p className="text-[11px] text-slate-400 italic">{f.helpText}</p>
                              )}

                              {/* Scale 0 to 10 */}
                              {f.fieldType === 'scale_0_10' && (
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-600">Selecione o valor de 0 a 10:</span>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                                        getPainScoreColor(Number(currentVal || 0))
                                      }`}
                                    >
                                      {currentVal !== undefined ? `${currentVal} / 10` : 'Não informado'}
                                    </span>
                                  </div>

                                  <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={currentVal ?? 0}
                                    onChange={(e) => handleAnswerChange(answerKey, Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                  />

                                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                                    <span>0 (Sem dor)</span>
                                    <span>5 (Moderada)</span>
                                    <span>10 (Insuportável)</span>
                                  </div>
                                </div>
                              )}

                              {/* Number */}
                              {f.fieldType === 'number' && (
                                <div className="relative max-w-xs">
                                  <input
                                    type="number"
                                    value={currentVal ?? ''}
                                    onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                    placeholder={`0 ${f.unit || ''}`}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-12 py-2 text-sm font-mono font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                                  />
                                  {f.unit && (
                                    <span className="absolute right-3 top-2 text-xs text-blue-600 font-extrabold font-mono pointer-events-none bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                      {f.unit}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Short Text */}
                              {f.fieldType === 'text' && (
                                <input
                                  type="text"
                                  value={currentVal ?? ''}
                                  onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                  placeholder="Digite a resposta..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                                />
                              )}

                              {/* Long Text */}
                              {f.fieldType === 'long_text' && (
                                <textarea
                                  rows={3}
                                  value={currentVal ?? ''}
                                  onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                  placeholder="Descreva detalhadamente..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                                />
                              )}

                              {/* Date */}
                              {f.fieldType === 'date' && (
                                <input
                                  type="date"
                                  value={currentVal ?? ''}
                                  onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                                />
                              )}

                              {/* Single Select */}
                              {f.fieldType === 'single_select' && (
                                isTrunkOptions(f.options || []) ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                    {(f.options || []).map((opt) => {
                                      const isSelected = currentVal === opt;
                                      const optStr = String(opt);
                                      const is0 = optStr.startsWith('0');
                                      const is12 = optStr.startsWith('12');
                                      const is25 = optStr.startsWith('25');

                                      const ptsLabel = is0 ? '0 PONTOS' : is12 ? '12 PONTOS' : is25 ? '25 PONTOS' : optStr;
                                      const descLabel = is0
                                        ? 'Incapaz de fazer sem assistência'
                                        : is12
                                        ? 'Capaz de fazer usando ajuda, padrão anormal ou usando os braços'
                                        : is25
                                        ? 'Capaz de completar a tarefa normalmente'
                                        : optStr;

                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => handleAnswerChange(answerKey, opt)}
                                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                                            isSelected
                                              ? is0
                                                ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-950 font-semibold shadow-xs'
                                                : is12
                                                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-semibold shadow-xs'
                                                : 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold shadow-xs'
                                              : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span
                                              className={`font-black text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs ${
                                                is0
                                                  ? 'bg-red-600 text-white'
                                                  : is12
                                                  ? 'bg-amber-600 text-white'
                                                  : is25
                                                  ? 'bg-emerald-600 text-white'
                                                  : 'bg-blue-600 text-white'
                                              }`}
                                            >
                                              {ptsLabel}
                                            </span>
                                            {isSelected && (
                                              <CheckCircle2 className={`w-4 h-4 ${is0 ? 'text-red-600' : is12 ? 'text-amber-600' : 'text-emerald-600'}`} />
                                            )}
                                          </div>
                                          <p className="text-xs font-bold leading-snug">{descLabel}</p>
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {(f.options || []).map((opt) => {
                                      const isSelected = currentVal === opt;
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => handleAnswerChange(answerKey, opt)}
                                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                            isSelected
                                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )
                              )}

                              {/* Boolean */}
                              {f.fieldType === 'boolean' && (
                                <div className="flex items-center space-x-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAnswerChange(answerKey, true)}
                                    className={`px-4 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                      currentVal === true
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    Sim
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAnswerChange(answerKey, false)}
                                    className={`px-4 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                      currentVal === false
                                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    Não
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Additional Notes */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Observações Adicionais do Fisioterapeuta
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Parecer clínico, condutas realizadas na sessão ou recomendações..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span>Salvar Avaliação</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </>
  );
}
