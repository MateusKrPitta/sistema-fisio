'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-context';
import { useAuth } from '@/context/auth-context';
import {
  X,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
  ArrowLeft,
  Trash2,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLINICAL_PRESETS, ClinicalPreset, CustomField } from '@/lib/clinical-presets';
import { FieldRenderer } from './fill-form/field-renderer';
import { ScaleBuilderDeck } from './fill-form/scale-builder-deck';
import { PhotoAttachmentManager } from '@/components/photo-attachment-manager';
import {
  EvaluationHistoryList,
  formatDateSafe,
  getAnswerForField,
  parseAnswers,
} from './fill-form/evaluation-history-list';

interface FillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onSuccess?: () => void;
}

export function FillFormModal({ isOpen, onClose, patient, onSuccess }: FillFormModalProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === 'superadmin' || currentUser?.role === 'clinic_admin' || currentUser?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);

  // Dual-mode state
  const [viewMode, setViewMode] = useState<'history' | 'fill'>('history');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formRecords, setFormRecords] = useState<any[]>([]);
  const [expandedRecordIds, setExpandedRecordIds] = useState<number[]>([]);

  // Multi-scale builder & evaluation state
  const [moduleCategory, setModuleCategory] = useState<string>('Controle de Tronco');
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [moduleDescription, setModuleDescription] = useState<string>('');
  const [selectedPresetToLoad, setSelectedPresetToLoad] = useState<string>('');
  const [loadedPresets, setLoadedPresets] = useState<string[]>([]);
  const [activeFields, setActiveFields] = useState<CustomField[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && patient) {
      setAnswers({});
      setNotes('');
      setImages([]);
      setEditingRecord(null);
      setRecordDate(new Date().toISOString().split('T')[0]);
      setExpandedRecordIds([]);
      setActiveFields([]);
      setLoadedPresets([]);
      setSelectedPresetToLoad('');
      setModuleTitle('');
      setModuleDescription('');
      loadData();
    }
  }, [isOpen, patient]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch form records history
      let records: any[] = [];
      try {
        const recRes = await api.get(`/patients/${patient.id}/form-records`);
        records = Array.isArray(recRes) ? recRes : recRes?.data || [];
        setFormRecords(records);
      } catch {
        setFormRecords([]);
      }

      // Start fresh with no forced pre-selected scale for new evaluation
      setModuleCategory('Controle de Tronco');
      setModuleTitle('');
      setModuleDescription('');
      setActiveFields([]);
      setLoadedPresets([]);
      setSelectedPresetToLoad('');
      setSelectedTemplate(null);
      setImages([]);

      if (records.length > 0) {
        setViewMode('history');
        setExpandedRecordIds([]);
      } else {
        setViewMode('fill');
      }
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setModuleCategory(newCategory);
    setSelectedPresetToLoad('');
  };

  const handleLoadPreset = () => {
    if (!selectedPresetToLoad) return;

    if (loadedPresets.includes(selectedPresetToLoad)) {
      toast({
        title: 'Escala Já Adicionada',
        description: `A escala "${selectedPresetToLoad}" já está presente nesta avaliação.`,
        type: 'warning',
      });
      return;
    }

    let preset: ClinicalPreset | undefined;
    const presetsInCat = CLINICAL_PRESETS[moduleCategory] || [];
    preset = presetsInCat.find((p) => p.label === selectedPresetToLoad);
    if (!preset) {
      Object.values(CLINICAL_PRESETS).forEach((catPresets) => {
        const found = catPresets.find((p) => p.label === selectedPresetToLoad);
        if (found) preset = found;
      });
    }

    if (preset) {
      const timestamp = Date.now();
      const newFields: CustomField[] = preset.getFields().map((f, idx) => ({
        ...f,
        id: f.id ? `${timestamp}_${f.id}` : `${timestamp}_${idx}`,
        group: preset!.label,
      }));

      setActiveFields((prev) => [...prev, ...newFields]);
      setLoadedPresets((prev) => [...prev, preset!.label]);
      setSelectedPresetToLoad('');

      setModuleTitle((prev) => {
        if (!prev || prev === 'Módulo do Controle de Tronco (TCT)' || prev === 'Controle de Tronco') {
          return preset!.title || preset!.label;
        }
        return `${prev} + ${preset!.label}`;
      });

      toast({
        title: 'Escala Adicionada!',
        description: `A escala "${preset.label}" (${newFields.length} testes) foi adicionada com sucesso.`,
        type: 'success',
      });
    }
  };

  const handleRemovePreset = (presetLabel: string) => {
    const remainingPresets = loadedPresets.filter((p) => p !== presetLabel);
    setLoadedPresets(remainingPresets);

    const remainingFields = activeFields.filter((f) => (f.group || moduleTitle) !== presetLabel);
    setActiveFields(remainingFields);

    toast({
      title: 'Escala Removida',
      description: `A escala "${presetLabel}" foi removida da avaliação.`,
      type: 'info',
    });
  };

  const startNewEvaluation = () => {
    setEditingRecord(null);
    setAnswers({});
    setNotes('');
    setImages([]);
    setRecordDate(new Date().toISOString().split('T')[0]);
    setActiveFields([]);
    setLoadedPresets([]);
    setSelectedPresetToLoad('');
    setModuleTitle('');
    setModuleDescription('');
    setSelectedTemplate(null);
    setViewMode('fill');
  };

  const startEditEvaluation = (record: any) => {
    setEditingRecord(record);
    const recAnswers = parseAnswers(record.answers);
    setAnswers(recAnswers);
    setNotes(record.notes || '');
    setImages(
      Array.isArray(record.images) && record.images.length > 0
        ? record.images
        : record.answers?.photoData
        ? [record.answers.photoData]
        : []
    );

    if (record.template) {
      setSelectedTemplate(record.template);
      setModuleTitle(record.template.title || '');
      setModuleDescription(record.template.description || '');
      const cat = record.template.category || (record.template.modules && record.template.modules[0]?.category) || 'Geral';
      setModuleCategory(cat);

      const rawFields =
        record.template.modules && record.template.modules[0]?.fields
          ? record.template.modules[0].fields
          : record.template.fields || [];
      const parsed: CustomField[] = (rawFields || []).map((f: any) => ({
        ...f,
        options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options || [],
        group: f.group || record.template.title || 'Escala Principal',
      }));
      setActiveFields(parsed);

      const distinctGroups: string[] = Array.from(
        new Set(parsed.map((f) => f.group || record.template.title || 'Escala Principal'))
      );
      setLoadedPresets(distinctGroups);
    } else {
      setActiveFields([]);
      setLoadedPresets([]);
    }

    const rDateStr = record.recordDate
      ? String(record.recordDate).split('T')[0]
      : record.record_date
      ? String(record.record_date).split('T')[0]
      : new Date().toISOString().split('T')[0];
    setRecordDate(rDateStr);

    setViewMode('fill');
  };

  const toggleExpandRecord = (id: number) => {
    setExpandedRecordIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const executeDeleteRecord = async () => {
    if (!recordToDelete) return;
    if (!isAdmin) {
      toast({
        title: 'Acesso Não Autorizado',
        description: 'Somente o administrador tem permissão para excluir avaliações.',
        type: 'error',
      });
      return;
    }
    const recordId = recordToDelete.id;
    setDeletingId(recordId);
    try {
      await api.delete(`/patients/${patient.id}/form-records/${recordId}`);
      toast({
        title: 'Avaliação Excluída',
        description: 'O registro de avaliação foi removido com sucesso.',
        type: 'success',
      });
      const updated = formRecords.filter((r) => r.id !== recordId);
      setFormRecords(updated);
      setRecordToDelete(null);
      if (updated.length === 0) {
        setViewMode('fill');
      }
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.response?.data?.error || 'Não foi possível excluir o registro.',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeFields.length === 0) {
      toast({ title: 'Atenção', description: 'Carregue uma escala ou adicione testes antes de salvar.', type: 'warning' });
      return;
    }

    setSaving(true);
    const finalTitle = moduleTitle.trim() || loadedPresets.join(' + ') || `${moduleCategory} - ${patient?.fullName || patient?.name}`;

    const normalizedAnswers: Record<string, any> = { ...answers };
    activeFields.forEach((f, idx) => {
      const val = getAnswerForField(f, answers, idx);
      if (val !== undefined && val !== null && val !== '') {
        if (f.label) normalizedAnswers[String(f.label)] = val;
        if (f.id) normalizedAnswers[String(f.id)] = val;
      }
    });

    try {
      // 1. Create custom module
      const moduleRes: any = await api.post('/custom-modules', {
        name: finalTitle,
        category: moduleCategory,
        description: moduleDescription || `Módulo para ${patient?.fullName || patient?.name}`,
        fields: activeFields.map((f, idx) => ({
          label: f.label,
          fieldType: f.fieldType,
          options: f.options,
          unit: f.unit,
          helpText: f.helpText,
          isRequired: f.isRequired,
          sortOrder: idx + 1,
        })),
      });

      const moduleId = moduleRes.id || moduleRes.data?.id;

      // 2. Create form template
      const templateRes: any = await api.post('/form-templates', {
        title: finalTitle,
        description: moduleDescription || `Ficha clínica gerada para ${patient?.fullName || patient?.name}`,
        category: moduleCategory,
        moduleIds: [moduleId],
        isShared: true,
      });

      const createdTemplateId = templateRes.id || templateRes.data?.id;

      // 3. Save patient form record
      if (editingRecord) {
        await api.put(`/patients/${patient.id}/form-records/${editingRecord.id}`, {
          templateId: createdTemplateId,
          recordDate,
          answers: normalizedAnswers,
          notes,
          images,
        });

        toast({
          title: 'Avaliação Atualizada!',
          description: `A avaliação de ${patient?.fullName || patient?.name} foi atualizada com sucesso.`,
          type: 'success',
        });
      } else {
        await api.post(`/patients/${patient.id}/form-records`, {
          templateId: createdTemplateId,
          recordDate,
          answers: normalizedAnswers,
          notes,
          images,
          signatureStatus: 'pendente',
        });

        toast({
          title: 'Avaliação Registrada com Sucesso!',
          description: `A evolução do paciente ${patient?.fullName || patient?.name} foi salva.`,
          type: 'success',
        });
      }

      onSuccess?.();
      await loadData();
      setViewMode('history');
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar avaliação',
        description: err?.response?.data?.error || 'Verifique se todos os campos foram preenchidos corretamente.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const availablePresets = CLINICAL_PRESETS[moduleCategory] || [];

  // Group active fields by scale
  const groupedActiveScales: { groupName: string; fields: CustomField[] }[] = [];
  activeFields.forEach((f) => {
    const grp = f.group || moduleTitle || 'Escala de Avaliação';
    let found = groupedActiveScales.find((g) => g.groupName === grp);
    if (!found) {
      found = { groupName: grp, fields: [] };
      groupedActiveScales.push(found);
    }
    found.fields.push(f);
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-all"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] h-[92vh] flex flex-col overflow-hidden border border-slate-200/90 z-10"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 shadow-xs">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
                {(patient?.fullName || patient?.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {viewMode === 'history'
                      ? 'Histórico Clínico do Paciente'
                      : editingRecord
                      ? 'Editar Avaliação do Paciente'
                      : 'Nova Avaliação Fisioterapêutica'}
                  </h2>
                  {viewMode === 'history' && formRecords.length > 0 && (
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                      {formRecords.length} registro(s)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  <strong className="text-slate-700">{patient?.fullName || patient?.name}</strong> • CPF:{' '}
                  <span className="font-mono text-slate-600">{patient?.cpf || 'Não informado'}</span>
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {viewMode === 'history' ? (
                <button
                  type="button"
                  onClick={startNewEvaluation}
                  className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nova Avaliação</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewMode('history')}
                  className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ver Histórico</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: HISTÓRICO DE AVALIAÇÕES */}
          {viewMode === 'history' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/60 space-y-5">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Carregando histórico do paciente...</p>
                </div>
              ) : formRecords.length === 0 ? (
                <div className="py-20 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Nenhuma avaliação realizada ainda</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      Clique no botão abaixo para preencher a primeira avaliação clínica deste paciente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startNewEvaluation}
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Realizar 1ª Avaliação</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-5xl mx-auto">
                  <div className="bg-slate-900 text-white p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="space-y-0.5">
                      <h4 className="font-black text-sm flex items-center gap-2">
                        <span>Linha do Tempo de Evolução Clínica</span>
                      </h4>
                      <p className="text-xs text-slate-300">
                        Total de <strong className="text-cyan-300">{formRecords.length} avaliação(ões)</strong> registradas.
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono self-start sm:self-auto bg-slate-800 px-3 py-1 rounded-xl">
                      Última: {formatDateSafe(formRecords[0]?.recordDate || formRecords[0]?.record_date || formRecords[0]?.createdAt)}
                    </span>
                  </div>

                  <EvaluationHistoryList
                    formRecords={formRecords}
                    patient={patient}
                    isAdmin={isAdmin}
                    expandedRecordIds={expandedRecordIds}
                    onToggleExpand={toggleExpandRecord}
                    onStartEdit={startEditEvaluation}
                    onRequestDelete={(rec) => setRecordToDelete(rec)}
                  />
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: PREENCHIMENTO DE NOVA AVALIAÇÃO / REAVALIAÇÃO */}
          {viewMode === 'fill' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100/60 space-y-6">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Carregando formulários de avaliação...</p>
                </div>
              ) : (
                <form id="fill-form-modal" onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
                  {/* Sequence indicator banner */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-xs ${
                      editingRecord ? 'bg-amber-500/10 border-amber-500/30' : 'bg-blue-600/10 border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 ${
                          editingRecord ? 'bg-amber-600' : 'bg-blue-600'
                        }`}
                      >
                        {editingRecord ? <Edit3 className="w-5 h-5" /> : `#${formRecords.length + 1}`}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${editingRecord ? 'text-amber-950' : 'text-blue-950'}`}>
                          {editingRecord
                            ? `Editando Avaliação de ${formatDateSafe(recordDate)}`
                            : formRecords.length === 0
                            ? 'Primeira Avaliação Inicial'
                            : `${formRecords.length + 1}ª Reavaliação Clínica do Paciente`}
                        </h4>
                        <p className={`text-xs ${editingRecord ? 'text-amber-800' : 'text-blue-700'} mt-0.5`}>
                          Adicione as escalas desejadas, preencha os testes e clique em &quot;Salvar Avaliação&quot;.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500">Data da Avaliação:</span>
                      <input
                        type="date"
                        value={recordDate}
                        onChange={(e) => setRecordDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* CLINICAL CONTROLS & SCALE PICKER DECK */}
                  <ScaleBuilderDeck
                    moduleCategory={moduleCategory}
                    onCategoryChange={handleCategoryChange}
                    selectedPresetToLoad={selectedPresetToLoad}
                    onPresetSelect={setSelectedPresetToLoad}
                    availablePresets={availablePresets}
                    loadedPresets={loadedPresets}
                    onAddPreset={handleLoadPreset}
                    onRemovePreset={handleRemovePreset}
                  />

                  {/* QUESTIONNAIRE / TESTS FORM (GROUPED BY SCALE) */}
                  {groupedActiveScales.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
                      <AlertCircle className="w-10 h-10 text-slate-300" />
                      <div>
                        <p className="text-sm font-bold text-slate-700">Nenhuma escala ou teste carregado ainda.</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Selecione uma categoria e uma escala pronta acima e clique em &quot;+ Adicionar Escala&quot;.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedActiveScales.map((scaleGroup, scaleIdx) => (
                        <div
                          key={scaleGroup.groupName || scaleIdx}
                          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                          <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                                {scaleIdx + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm sm:text-base text-white tracking-tight">
                                  {scaleGroup.groupName}
                                </h4>
                                <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                                  {scaleGroup.fields.length} teste(s)
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemovePreset(scaleGroup.groupName)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                              title={`Remover escala "${scaleGroup.groupName}"`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="p-6 sm:p-7 space-y-6">
                            {scaleGroup.fields.map((f: CustomField, fIdx: number) => {
                              const answerKey = String(f.id || f.label);
                              const currentVal =
                                answers[answerKey] !== undefined ? answers[answerKey] : answers[String(f.label)];

                              return (
                                <FieldRenderer
                                  key={answerKey}
                                  field={f}
                                  value={currentVal}
                                  onChange={(val) => setAnswers((prev) => ({ ...prev, [answerKey]: val }))}
                                  index={fIdx}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Observations / Notes */}
                      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Observações Clínicas & Condutas
                        </label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Observações complementares, queixas do paciente e planejamento para os próximos atendimentos..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all resize-none shadow-2xs"
                        />
                      </div>

                      {/* Photo Evidences / Attachments */}
                      <PhotoAttachmentManager
                        images={images}
                        onChange={setImages}
                        title="Fotos e Evidências da Avaliação"
                        subtitle="Anexe fotos de testes funcionais, postura, exames ou registros visuais desta avaliação"
                      />
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Footer Bar */}
          {viewMode === 'fill' && (
            <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('history')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="fill-form-modal"
                disabled={saving || activeFields.length === 0}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Avaliação</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {recordToDelete && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-base">Excluir Registro de Avaliação</h4>
                  <p className="text-xs text-slate-500">
                    Tem certeza que deseja excluir esta avaliação de {formatDateSafe(recordToDelete.recordDate || recordToDelete.record_date || recordToDelete.createdAt)}? Esta ação não poderá ser desfeita.
                  </p>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecordToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={executeDeleteRecord}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-colors cursor-pointer"
                  >
                    {deletingId ? 'Excluindo...' : 'Sim, Excluir'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
