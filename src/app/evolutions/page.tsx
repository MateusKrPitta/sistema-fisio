'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  Search,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  Edit2,
  Edit3,
  Check,
  PlusCircle,
  Camera,
  X,
  AlertTriangle,
  ClipboardList,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/toast-context';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';

interface Patient {
  id: number | string;
  fullName?: string;
  name?: string;
  cpf?: string;
  phone?: string;
  [key: string]: any;
}

interface Appointment {
  id: number | string;
  date?: string;
  startTime?: string;
  endTime?: string;
  specialty?: string;
  type?: string;
  notes?: string;
  images?: string[];
  status?: string;
  hasEvolution?: boolean;
  has_evolution?: boolean;
  [key: string]: any;
}

interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage?: number;
}

const formatDate = (dateString?: string) => {
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

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao processar a imagem'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
}

function EvolutionsContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetPatientId = searchParams ? searchParams.get('patientId') || searchParams.get('viewEvolutionsFor') : null;
  const targetExpandEvolution = searchParams ? searchParams.get('expandEvolution') : null;

  // Main Patient Table State (Lightweight)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PATIENTS_PER_PAGE = 5;

  // Evolutions History Modal State (Server-side paginated & filtered)
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessions, setSessions] = useState<Appointment[]>([]);
  const [sessionCounts, setSessionCounts] = useState({ total: 0, pending: 0, completed: 0 });
  const [sessionMeta, setSessionMeta] = useState<PaginationMeta>({ total: 0, perPage: 5, currentPage: 1, lastPage: 1 });
  const [modalFilter, setModalFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [modalPage, setModalPage] = useState(1);
  const [expandedEvolutions, setExpandedEvolutions] = useState<number[]>([]);
  const [evolutionDetails, setEvolutionDetails] = useState<Record<number | string, { notes?: string; images?: string[]; loading?: boolean }>>({});

  // Edit / Insert Evolution Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [savingEvolution, setSavingEvolution] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load lightweight list of patients
  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients?limit=100');
      const data = Array.isArray(res) ? res : res.data || [];
      setPatients(data);
    } catch {
      toast({
        title: 'Erro ao carregar pacientes',
        description: 'Não foi possível buscar a lista de pacientes.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Handle deep-linking from appointments or other screens
  useEffect(() => {
    if (targetPatientId && !historyModalOpen) {
      openPatientHistory(targetPatientId, targetExpandEvolution ? Number(targetExpandEvolution) : undefined);
      const url = new URL(window.location.href);
      url.searchParams.delete('patientId');
      url.searchParams.delete('viewEvolutionsFor');
      url.searchParams.delete('expandEvolution');
      router.replace(url.pathname + url.search);
    }
  }, [targetPatientId, targetExpandEvolution, historyModalOpen, router]);

  // Server-side fetch for patient's paginated & filtered evolutions
  const fetchPatientEvolutions = async (
    patientId: number | string,
    page = 1,
    status: 'all' | 'pending' | 'completed' = 'all',
    expandId?: number
  ) => {
    setLoadingSessions(true);
    setModalPage(page);
    setModalFilter(status);
    if (expandId) {
      setExpandedEvolutions([expandId]);
    }

    try {
      const res: any = await api.get(`/patients/${patientId}/evolutions?page=${page}&limit=5&status=${status}`);
      if (res?.patient) {
        setSelectedPatient(res.patient);
      }
      setSessions(res?.data || []);
      setSessionCounts(res?.counts || { total: 0, pending: 0, completed: 0 });
      setSessionMeta(res?.meta || { total: 0, perPage: 5, currentPage: page, lastPage: 1 });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as evoluções do paciente.',
        type: 'error',
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const openPatientHistory = async (patientId: number | string, expandId?: number) => {
    setHistoryModalOpen(true);
    setExpandedEvolutions(expandId ? [expandId] : []);
    await fetchPatientEvolutions(patientId, 1, 'all', expandId);
  };

  const handleFilterChange = (newFilter: 'all' | 'pending' | 'completed') => {
    if (!selectedPatient) return;
    fetchPatientEvolutions(selectedPatient.id, 1, newFilter);
  };

  const handlePageChange = (newPage: number) => {
    if (!selectedPatient || newPage === modalPage) return;
    fetchPatientEvolutions(selectedPatient.id, newPage, modalFilter);
  };

  // Fetch full evolution text & images on demand when expanded
  const fetchEvolutionDetail = async (appId: number | string, fallbackApp?: any) => {
    if (evolutionDetails[appId]?.notes !== undefined || evolutionDetails[appId]?.images !== undefined) {
      return;
    }

    setEvolutionDetails((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], loading: true },
    }));

    try {
      const res = await api.get(`/appointments/${appId}`);
      const data = res?.data?.id ? res.data : res;
      const parsedImages = Array.isArray(data.images)
        ? data.images
        : typeof data.images === 'string'
        ? JSON.parse(data.images)
        : [];

      setEvolutionDetails((prev) => ({
        ...prev,
        [appId]: {
          notes: data.notes || '',
          images: parsedImages,
          loading: false,
        },
      }));
    } catch {
      setEvolutionDetails((prev) => ({
        ...prev,
        [appId]: {
          notes: fallbackApp?.notes || '',
          images: Array.isArray(fallbackApp?.images) ? fallbackApp.images : [],
          loading: false,
        },
      }));
    }
  };

  const toggleEvolutionAccordion = (app: Appointment) => {
    const isExpanded = expandedEvolutions.includes(Number(app.id));
    if (isExpanded) {
      setExpandedEvolutions((prev) => prev.filter((id) => id !== Number(app.id)));
    } else {
      setExpandedEvolutions((prev) => [...prev, Number(app.id)]);
      fetchEvolutionDetail(app.id, app);
    }
  };

  const handleStartEditOrInsert = async (app: Appointment) => {
    setEditingApp(app);
    let d = '';
    if (app.date) {
      if (typeof app.date === 'string') {
        d = app.date.split('T')[0];
      } else {
        d = new Date(app.date).toISOString().split('T')[0];
      }
    }
    setEditDate(d);
    setEditStartTime(app.startTime || app.time || '08:00');
    setEditEndTime(app.endTime || '09:00');
    setEditSpecialty(app.specialty || app.type || 'Atendimento Fisioterapêutico');

    let currentNotes = evolutionDetails[app.id]?.notes ?? app.notes ?? '';
    let currentImages = evolutionDetails[app.id]?.images ?? (Array.isArray(app.images) ? app.images : []);

    if (evolutionDetails[app.id]?.notes === undefined) {
      try {
        const res = await api.get(`/appointments/${app.id}`);
        const data = res?.data?.id ? res.data : res;
        currentNotes = data.notes || '';
        currentImages = Array.isArray(data.images)
          ? data.images
          : typeof data.images === 'string'
          ? JSON.parse(data.images)
          : [];
        setEvolutionDetails((prev) => ({
          ...prev,
          [app.id]: { notes: currentNotes, images: currentImages, loading: false },
        }));
      } catch {}
    }

    let cleanNotes = currentNotes;
    if (cleanNotes.includes('<p>') || cleanNotes.includes('<br>')) {
      cleanNotes = cleanNotes
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p>/gi, '\n\n')
        .replace(/<\/?p>/gi, '')
        .replace(/<strong>(.*?)<\/strong>/gi, '$1')
        .replace(/<em>(.*?)<\/em>/gi, '$1')
        .trim();
    }
    setEditNotes(cleanNotes);
    setEditImages([...currentImages]);
    setEditModalOpen(true);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const newImgs: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImageFile(file);
        newImgs.push(compressed);
      }
      setEditImages((prev) => [...prev, ...newImgs]);
      toast({
        title: 'Fotos adicionadas',
        description: `${newImgs.length} foto(s) anexada(s) à evolução.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Erro ao carregar fotos',
        description: 'Não foi possível processar algumas imagens.',
        type: 'error',
      });
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setSavingEvolution(true);
    try {
      const formattedNotes = editNotes.trim()
        ? editNotes
            .split('\n\n')
            .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
            .join('')
        : null;

      await api.put(`/appointments/${editingApp.id}`, {
        date: editDate || undefined,
        startTime: editStartTime || undefined,
        endTime: editEndTime || undefined,
        specialty: editSpecialty || undefined,
        notes: formattedNotes,
        images: editImages,
      });

      // Update evolution cache
      setEvolutionDetails((prev) => ({
        ...prev,
        [editingApp.id]: {
          notes: formattedNotes || '',
          images: editImages,
          loading: false,
        },
      }));

      // Refresh current page of evolutions from the server
      if (selectedPatient) {
        await fetchPatientEvolutions(selectedPatient.id, modalPage, modalFilter);
      }

      // Auto-expand this evolution
      setExpandedEvolutions((prev) =>
        prev.includes(Number(editingApp.id)) ? prev : [...prev, Number(editingApp.id)]
      );

      toast({
        title: 'Evolução Registrada! 🎉',
        description: 'A anotação clínica e as fotos foram salvas com sucesso.',
        type: 'success',
      });

      setEditModalOpen(false);
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.response?.data?.error || err?.message || 'Não foi possível salvar a evolução.',
        type: 'error',
      });
    } finally {
      setSavingEvolution(false);
    }
  };

  // Filter patients by search query
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchName = (p.fullName || p.name || '').toLowerCase().includes(q);
    const matchCpf = (p.cpf || '').includes(q);
    return matchName || matchCpf;
  });

  const totalPatients = filteredPatients.length;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * PATIENTS_PER_PAGE,
    currentPage * PATIENTS_PER_PAGE
  );

  if (user?.role === 'secretary') {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          O módulo de evoluções clínicas é reservado exclusivamente para fisioterapeutas e administradores da clínica.
        </p>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Evoluções Clínicas"
        subtitle="Acompanhe o histórico de sessões, identifique pendências e registre a evolução clínica dos seus pacientes"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-full">
        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar paciente por nome ou CPF..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Patients Table */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Carregando lista de pacientes...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Nenhum paciente encontrado</h3>
            <p className="text-sm text-slate-400">Verifique o termo digitado na busca.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="p-4 pl-6">Nome do Paciente</th>
                    <th className="p-4">Contato / CPF</th>
                    <th className="p-4 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedPatients.map((patient) => {
                    const patientName = patient.fullName || patient.name || `Paciente #${patient.id}`;
                    return (
                      <tr
                        key={patient.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="p-4 pl-6">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate max-w-[240px] sm:max-w-xs">
                            {patientName}
                          </p>
                        </td>

                        <td className="p-4">
                          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                            {patient.phone && (
                              <p className="flex items-center space-x-1.5 font-mono text-[11px]">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{patient.phone}</span>
                              </p>
                            )}
                            {patient.cpf && (
                              <p className="text-[11px] text-slate-400 font-mono">CPF: {patient.cpf}</p>
                            )}
                          </div>
                        </td>

                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => openPatientHistory(patient.id)}
                              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                              title="Consultar Histórico de Evoluções"
                            >
                              <ClipboardList className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 font-medium">
                Página {currentPage} de {totalPatientPages} <span className="hidden sm:inline">({totalPatients} pacientes)</span>
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-all"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPatientPages, p + 1))}
                  disabled={currentPage === totalPatientPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-all"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* HISTÓRICO DE EVOLUÇÕES SIDE MODAL (PAGINADO & FILTRADO NO BACKEND) */}
      <AnimatePresence>
        {historyModalOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => setHistoryModalOpen(false)}
            />

            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-lg md:max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">
                      Histórico de Evoluções
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      {selectedPatient?.fullName || selectedPatient?.name || 'Carregando...'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sessions Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Summary Bar & Server Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Total: <strong className="text-slate-900 dark:text-slate-100 font-bold">{sessionCounts.total} sessões</strong>
                  </span>

                  {/* Server Filter Chips */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFilterChange('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        modalFilter === 'all'
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Todas ({sessionCounts.total})
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFilterChange('pending')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        modalFilter === 'pending'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                      }`}
                    >
                      {sessionCounts.pending} Pendente{sessionCounts.pending !== 1 ? 's' : ''}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFilterChange('completed')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        modalFilter === 'completed'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                      }`}
                    >
                      {sessionCounts.completed} Concluída{sessionCounts.completed !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>

                {loadingSessions ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-xs text-slate-500 font-medium">Buscando atendimentos...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-14 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">Nenhum atendimento encontrado</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Não há sessões registradas com o filtro selecionado.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {sessions.map((app, index) => {
                      const hasEvolution = app.hasEvolution ?? app.has_evolution;
                      const isExpanded = expandedEvolutions.includes(Number(app.id));

                      if (!hasEvolution) {
                        // PENDING EVOLUTION (AMARELO / DESTAQUE)
                        return (
                          <div
                            key={app.id || index}
                            className="bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-300 dark:border-amber-600/40 p-4 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500/60 transition-all"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
                                  <CalendarIcon className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                                  <span>{formatDate(app.date)}</span>
                                </span>
                                <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                                  {app.startTime || '08:00'} - {app.endTime || '09:00'}
                                </span>
                              </div>

                              <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                                <span>Evolução Pendente</span>
                              </span>
                            </div>

                            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {app.specialty || 'Atendimento Fisioterapêutico'}
                                </p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                  Nenhuma anotação clínica registrada.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleStartEditOrInsert(app)}
                                className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
                              >
                                <PlusCircle className="w-4 h-4" />
                                <span>Inserir Evolução</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // COMPLETED EVOLUTION (VERDE / NEUTRO)
                      return (
                        <div
                          key={app.id || index}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600/50 shadow-2xs p-4 transition-all"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatDate(app.date)}</span>
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
                                {app.startTime || '08:00'} - {app.endTime || '09:00'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {app.specialty || 'Atendimento'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartEditOrInsert(app)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                                title="Editar evolução clínica"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Editar</span>
                              </button>
                            </div>
                          </div>

                          {/* Evolution content accordion */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                              {evolutionDetails[app.id]?.loading ? (
                                <div className="py-5 flex items-center justify-center space-x-2 text-emerald-600">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-xs font-semibold text-slate-500">
                                    Carregando anotações e fotos...
                                  </span>
                                </div>
                              ) : (() => {
                                const detailNotes =
                                  evolutionDetails[app.id]?.notes !== undefined
                                    ? evolutionDetails[app.id]?.notes
                                    : app.notes;
                                const detailImages =
                                  evolutionDetails[app.id]?.images !== undefined
                                    ? evolutionDetails[app.id]?.images
                                    : Array.isArray(app.images)
                                    ? app.images
                                    : [];

                                return (
                                  <div className="space-y-3.5">
                                    {detailNotes && (
                                      <div
                                        className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 prose prose-sm max-w-none 
                                        [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: detailNotes }}
                                      />
                                    )}

                                    {detailImages && detailImages.length > 0 && (
                                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[11px] font-bold text-slate-500 mb-2">
                                          Fotos anexadas ({detailImages.length}):
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                          {detailImages.map((img: string, iIdx: number) => (
                                            <div
                                              key={iIdx}
                                              className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100"
                                            >
                                              <img
                                                src={img}
                                                alt={`Foto ${iIdx + 1}`}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Accordion Toggle Bar */}
                          <div
                            onClick={() => toggleEvolutionAccordion(app)}
                            className="mt-3 pt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 cursor-pointer group select-none"
                          >
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center space-x-1">
                              <span>{isExpanded ? 'Ocultar anotações' : 'Ver anotações'}</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Server-Side Pagination Footer */}
                {sessionMeta.lastPage > 1 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Página {sessionMeta.currentPage} de {sessionMeta.lastPage} ({sessionMeta.total} sessões)
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handlePageChange(modalPage - 1)}
                        disabled={modalPage <= 1 || loadingSessions}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageChange(modalPage + 1)}
                        disabled={modalPage >= sessionMeta.lastPage || loadingSessions}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Próxima página"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  Fechar Histórico
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT / INSERT EVOLUTION MODAL */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shadow-2xs">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                      Registrar Evolução Clínica
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedPatient?.fullName || selectedPatient?.name || 'Paciente'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEvolution} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Date & Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Data da Sessão
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      required
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Término
                    </label>
                    <input
                      type="time"
                      required
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Specialty / Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Especialidade / Tipo de Atendimento
                  </label>
                  <input
                    type="text"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    placeholder="Ex: Atendimento Fisioterapêutico, Reabilitação Ortopédica..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Anotações Clínicas & Conduta *
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditNotes('')}
                      className="text-[10px] text-slate-400 hover:text-red-600 font-medium cursor-pointer"
                    >
                      Limpar texto
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    required
                    placeholder="Descreva a evolução do paciente, queixas, testes realizados, condutas aplicadas e resposta ao tratamento..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white focus:border-emerald-500 focus:outline-none leading-relaxed"
                  />

                  {/* Quick Text Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 self-center mr-1">Inserir rápido:</span>
                    {[
                      'Paciente relata redução significativa no quadro de dor.',
                      'Realizada cinesioterapia motora e exercícios de fortalecimento.',
                      'Excelente tolerância aos exercícios sem queixas álgicas.',
                      'Reforçadas orientações posturais e exercícios domiciliares.',
                    ].map((snippet, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setEditNotes((prev) => (prev ? `${prev}\n${snippet}` : snippet))}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        + {snippet.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attached Images */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Fotos Anexadas ({editImages.length})
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFilesSelected(e.target.files)}
                    />
                    <button
                      type="button"
                      disabled={uploadingImages}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {uploadingImages ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      <span>Adicionar Fotos</span>
                    </button>
                  </div>

                  {editImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      {editImages.map((img, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white group"
                        >
                          <img src={img} alt={`Foto ${imgIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(imgIdx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 shadow-sm transition-opacity cursor-pointer"
                            title="Remover foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-xs text-slate-400">
                      Nenhuma foto anexada a esta evolução.
                    </div>
                  )}
                </div>

                {/* Submit / Cancel Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEvolution}
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingEvolution ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Salvar Evolução</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function EvolutionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando evoluções...</div>}>
      <EvolutionsContent />
    </Suspense>
  );
}
