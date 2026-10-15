'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit3,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/toast-context';
import { LoadingOverlay } from '@/components/loading-overlay';
import { CustomSelect } from '@/components/custom-select';
import { CustomModule } from '../modules/page';

export interface FormTemplate {
  id: number | string;
  title: string;
  description?: string | null;
  moduleIds?: number[];
  modules?: CustomModule[];
  isActive?: boolean;
}

export default function FormTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [availableModules, setAvailableModules] = useState<CustomModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [selectedModuleToAdd, setSelectedModuleToAdd] = useState<string>('');

  const fetchTemplates = (currentPage: number, search: string = '') => {
    setLoading(true);
    api.get(`/form-templates?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(search)}`)
      .then((templateRes: any) => {
        if (templateRes?.data) {
          setTemplates(templateRes.data);
          setTotalPages(templateRes.meta?.lastPage || templateRes.meta?.last_page || 1);
        } else if (Array.isArray(templateRes)) {
          setTemplates(templateRes);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchModulesForModal = async () => {
    if (availableModules.length === 0) {
      try {
        const moduleRes: any = await api.get('/custom-modules?limit=100');
        const rawModules = Array.isArray(moduleRes) ? moduleRes : moduleRes?.data || [];
        setAvailableModules(rawModules);
      } catch (err) {
        // Ignorar erro silenciosamente ou exibir um toast
      }
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTemplates(page, searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [page, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const openCreateModal = async () => {
    setIsModalLoading(true);
    try {
      setEditingTemplate(null);
      setTemplateTitle('');
      setTemplateDescription('');
      setSelectedModuleIds([]);
      setSelectedModuleToAdd('');
      await fetchModulesForModal();
      setShowModal(true);
    } finally {
      setIsModalLoading(false);
    }
  };

  const openEditModal = async (t: FormTemplate) => {
    setIsModalLoading(true);
    try {
      setEditingTemplate(t);
      setTemplateTitle(t.title);
      setTemplateDescription(t.description || '');
      const ids = t.modules ? t.modules.map((m) => Number(m.id)) : t.moduleIds || [];
      setSelectedModuleIds(ids);
      setSelectedModuleToAdd('');
      await fetchModulesForModal();
      setShowModal(true);
    } finally {
      setIsModalLoading(false);
    }
  };

  const openPreviewModal = (t: FormTemplate) => {
    router.push(`/avaliacoes/modelos/${t.id}`);
  };

  const handleAddModule = () => {
    if (selectedModuleToAdd) {
      setSelectedModuleIds([...selectedModuleIds, Number(selectedModuleToAdd)]);
      setSelectedModuleToAdd('');
    }
  };

  const handleRemoveModule = (id: number) => {
    setSelectedModuleIds(selectedModuleIds.filter((mId) => mId !== id));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle.trim()) return;

    if (selectedModuleIds.length === 0) {
      toast({ title: 'Atenção', description: 'Selecione pelo menos 1 escala para a Avaliação.', type: 'warning' });
      return;
    }

    const hydratedModules = availableModules.filter((m) => selectedModuleIds.includes(Number(m.id)));

    const payload = {
      title: templateTitle.trim(),
      description: templateDescription.trim() || null,
      moduleIds: selectedModuleIds,
      modules: hydratedModules,
    };

    try {
      if (editingTemplate) {
        await api.put(`/form-templates/${editingTemplate.id}`, payload);
        setTemplates(templates.map((t) => (t.id === editingTemplate.id ? { ...t, ...payload } : t)));
        toast({ title: 'Avaliação Atualizada!', description: `Avaliação "${templateTitle}" salva com sucesso.`, type: 'success' });
      } else {
        const res: any = await api.post('/form-templates', payload);
        const createdTemplate = res?.data || res;
        const newTemp: FormTemplate = {
          ...payload,
          id: createdTemplate.id || Date.now(),
        };
        setTemplates([newTemp, ...templates]);
        toast({ title: 'Avaliação Criada!', description: `Avaliação "${templateTitle}" pronta para uso.`, type: 'success' });
      }
      setShowModal(false);
    } catch (error) {
      toast({ title: 'Erro', description: 'Ocorreu um erro ao salvar a avaliação.', type: 'error' });
    }
  };

  const handleDeleteTemplate = async (id: number | string) => {
    try {
      await api.delete(`/form-templates/${id}`);
      setTemplates(templates.filter((t) => t.id !== id));
      toast({ title: 'Avaliação Removida', description: 'A Avaliação foi excluída.', type: 'info' });
    } catch (error: any) {
      toast({
        title: 'Aviso',
        description: error.message || 'Não foi possível excluir a avaliação.',
        type: 'error'
      });
    }
  };


  return (
    <>
      <Header
        title="Modelos de Avaliação da Clínica"
        subtitle="Combine suas Escalas e defina os formulários completos que serão usados nas consultas"
      />

      <LoadingOverlay isVisible={isModalLoading} message="Carregando Escalas..." />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header Bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Avaliações Cadastradas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Selecione e organize quais formulários os fisioterapeutas preenchem para cada paciente</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto flex-1 xl:justify-end">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar avaliação..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={openCreateModal}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Avaliação</span>
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="py-16 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-bold">Título e Descrição</th>
                    <th className="px-6 py-4 font-bold text-center">Qtd. Escalas</th>
                    <th className="px-6 py-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        Nenhuma avaliação encontrada. Crie sua primeira avaliação!
                      </td>
                    </tr>
                  ) : (
                    templates.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{t.title}</span>
                            {t.description && <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{t.description}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/80 dark:border-blue-800">
                            {(t.modules?.length ?? (Array.isArray(t.moduleIds) ? t.moduleIds.length : (typeof t.moduleIds === 'string' ? JSON.parse(t.moduleIds || '[]') : []).length))} Escalas
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openPreviewModal(t)}
                            className="inline-flex items-center justify-center p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition-colors cursor-pointer"
                            title="Visualizar Formulário"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            className="inline-flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                            title="Editar Avaliação"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(t.id)}
                            className="inline-flex items-center justify-center p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title="Excluir Avaliação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Construtor de Avaliação */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={() => setShowModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 w-full max-w-2xl space-y-5 max-h-[92vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg">
                      {editingTemplate ? 'Editar Avaliação' : 'Criar Nova Avaliação'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Combine as Escalas de testes para formar o formulário da consulta</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTemplate} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Título da Avaliação *
                    </label>
                    <input
                      type="text"
                      required
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                      placeholder="Ex: Avaliação de Ombro e Cotovelo"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Descrição / Finalidade da Avaliação
                    </label>
                    <input
                      type="text"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Ex: Utilizada para pacientes em reabilitação de manguito rotador"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Module Selector List */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Selecione as Escalas que compõem esta Avaliação *
                    </label>

                    {/* Select and Add */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <CustomSelect
                          value={selectedModuleToAdd}
                          onChange={(val) => setSelectedModuleToAdd(String(val))}
                          options={availableModules
                            .filter((mod) => !selectedModuleIds.includes(Number(mod.id)))
                            .map((mod) => ({
                              value: String(mod.id),
                              label: mod.name,
                              sublabel: mod.category,
                              badge: (mod.fields?.length || (mod as any).meta?.fields_count) ? `${mod.fields?.length || (mod as any).meta?.fields_count} testes` : undefined,
                            }))}
                          placeholder="-- Selecione uma escala --"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddModule}
                        disabled={!selectedModuleToAdd}
                        className="bg-blue-100 dark:bg-blue-950/60 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all shrink-0 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>

                    {/* Selected Modules List */}
                    {selectedModuleIds.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 mt-4">Escalas Adicionadas</p>
                        {selectedModuleIds.map((id) => {
                          const mod = availableModules.find((m) => Number(m.id) === id);
                          if (!mod) return null;
                          return (
                            <div
                              key={mod.id}
                              className="p-3 rounded-2xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between text-xs transition-all"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{mod.name}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Categoria: <span className="font-semibold text-slate-700 dark:text-slate-300">{mod.category}</span>
                                    {(mod.fields?.length || mod.meta?.fields_count) && ` | ${mod.fields?.length || mod.meta?.fields_count} testes`}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveModule(id)}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-xl transition-colors shrink-0 cursor-pointer"
                                title="Remover"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={selectedModuleIds.length === 0 || !templateTitle}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center space-x-1.5 cursor-pointer transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
