'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  PlusCircle,
  Search,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  LayoutGrid,
  List,
  Activity,
  CheckCircle2,
  CalendarDays,
  AlertCircle,
  Edit3,
  Trash2,
  X,
  UserX,
  AlertTriangle,
  Phone,
  MessageSquare,
  Send,
  Copy,
  FileSpreadsheet,
  FileText,
  Bold,
  Italic,
  Strikethrough,
  Eraser,
  Sparkles,
  Image as ImageIcon,
  UploadCloud,
  Save,
  ArrowLeft,
  ZoomIn,
  Plus,
  SlidersHorizontal,
  Filter,
  RotateCcw,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/toast-context';
import { CustomSelect } from '@/components/custom-select';
import { CalendarViews, CalendarEvent } from '@/components/calendar/CalendarViews';

const QUICK_CLINICAL_CHIPS = [
  'Paciente relata redução no quadro de dor.',
  'Realizado protocolo de cinesioterapia ativa e resistida.',
  'Aplicada liberação miofascial e mobilização articular.',
  'Melhora progressiva do ganho de amplitude de movimento (ADM).',
  'Realizado treino de equilíbrio e propriocepção.',
  'Paciente tolerou bem a carga de exercícios propostos.',
  'Reforçadas orientações posturais e exercícios domiciliares.',
];

/**
 * Compresses and resizes an image file to a base64 Data URL
 */
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

interface Appointment {
  id: number | string;
  patientId?: number | string;
  templateId?: number | string;
  patientName?: string;
  patientPhone?: string;
  physioName?: string;
  date?: string;
  time?: string;
  type?: string;
  status?: string;
  notes?: string;
  images?: string[];
  hasEvolution?: boolean;
  financialRecord?: any;
  template?: {
    id: number;
    title: string;
  };
  [key: string]: any;
}

interface PatientOption {
  id: number | string;
  fullName?: string;
  name?: string;
  phone?: string;
}

// Custom Styled Patient Selector Component
function PatientSelect({
  patients,
  selected,
  onSelect,
}: {
  patients: PatientOption[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = patients.filter((p) => {
    const pName = p.fullName || p.name || '';
    return pName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none flex items-center justify-between transition-all shadow-xs"
      >
        {selected ? (
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
              {selected.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-slate-800 truncate">{selected}</span>
          </div>
        ) : (
          <span className="text-slate-400">Selecione o paciente cadastrado...</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-2 max-h-64 flex flex-col">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente por nome..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-center text-slate-400">Nenhum paciente encontrado</div>
            ) : (
              filtered.map((p) => {
                const pName = p.fullName || p.name || `Paciente #${p.id}`;
                const isSelected = selected === pName;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelect(pName);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div
                        className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}
                      >
                        {pName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{pName}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to format date string to Portuguese Weekday Label
const getWeekdayLabel = (dateStr: string) => {
  if (!dateStr) return { fullLabel: 'Data não definida', weekdayName: 'Sem Data', shortDate: '' };
  const parts = dateStr.split('-');
  if (parts.length !== 3) return { fullLabel: dateStr, weekdayName: dateStr, shortDate: '' };

  const [year, month, day] = parts.map(Number);
  const dateObj = new Date(year, month - 1, day);

  const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  const formattedWeekday = (weekday.charAt(0).toUpperCase() + weekday.slice(1)).replace(/-feira/i, '');
  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

  return {
    fullLabel: `${formattedWeekday} (${formattedDate})`,
    weekdayName: formattedWeekday,
    shortDate: formattedDate,
  };
};

const normalizeDate = (d?: string) => {
  if (!d) return '';
  return d.split('T')[0];
};

const normalizeTime = (t?: string) => {
  if (!t) return '';
  const parts = t.trim().split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return t;
};

const generateWhatsappConfirmationMessage = (app: Appointment) => {
  const pName = app.patientName || 'Paciente';
  const dateInfo = getWeekdayLabel(app.date || '');
  const timeStr = app.time || '--:--';
  const serviceType = app.type || 'atendimento de fisioterapia';

  return `Olá ${pName}! 👋

Aqui é da equipe FisMovie Fisioterapia. Gostaria de confirmar seu atendimento agendado para *${dateInfo.weekdayName} (${dateInfo.shortDate}) às ${timeStr} hrs* (${serviceType}).

Por favor, responda com *SIM* para confirmar ou nos avise caso precise remarcar. Obrigado! 😊`;
};

const getWhatsappUrl = (app: Appointment) => {
  if (!app.patientPhone) return '#';
  const cleanPhone = app.patientPhone.replace(/\D/g, '');
  const message = generateWhatsappConfirmationMessage(app);
  return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
};

const getStatusBadgeStyle = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmado':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'em atendimento':
    case 'em_atendimento':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'finalizado':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'paciente ausente':
    case 'ausente':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'paciente desmarcou':
    case 'desmarcado':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'cancelado':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const isRealClinicalEvolution = (notes?: string | null, has_evolution?: boolean) => {
  if (has_evolution !== undefined && has_evolution !== null) {
    if (!has_evolution) return false;
  }
  if (!notes || typeof notes !== 'string' || notes.trim() === '') return false;
  const clean = notes.trim();
  if (clean.startsWith('Sessão ') && (clean.includes('Recorrente') || clean.includes('Inicial') || clean.includes('Mensal') || clean.length < 40)) {
    return false;
  }
  return true;
};

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientsList, setPatientsList] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadedMonth, setLoadedMonth] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('fisio_appointments_view_mode') as 'month' | 'week' | 'day' | null;
      if (savedMode && ['month', 'week', 'day'].includes(savedMode)) {
        setViewMode(savedMode);
      }
    }
  }, []);

  const handleSetViewMode = (mode: 'month' | 'week' | 'day') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fisio_appointments_view_mode', mode);
    }
  };

  // Selected appointment details modal state
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMsgPreview, setShowMsgPreview] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editType, setEditType] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editError, setEditError] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  // Form templates state for linking Avaliação
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string>('');

  // Inline Evolution State
  const [inlineEvolutionOpen, setInlineEvolutionOpen] = useState(false);
  const [evolutionNotes, setEvolutionNotes] = useState('');
  const [evolutionImages, setEvolutionImages] = useState<string[]>([]);
  const [isSavingEvolution, setIsSavingEvolution] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [evolutionPreviewImageIndex, setEvolutionPreviewImageIndex] = useState<number | null>(null);
  const evolutionFileInputRef = useRef<HTMLInputElement>(null);
  const evolutionEditorRef = useRef<HTMLDivElement>(null);

  // New appointment form state
  const [patientName, setPatientName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('Avaliação Fisioterapêutica');
  const [modalError, setModalError] = useState('');

  const formatLocalYMD = (d: Date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const todayStr = formatLocalYMD(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatLocalYMD(yesterdayDate);

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = formatLocalYMD(tomorrowDate);

  useEffect(() => {
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    if (loadedMonth === monthKey && appointments.length > 0) return;
    
    setLoadedMonth(monthKey);
    setLoading(true);

    const formatYMD = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    // Fetch a generous window: from 15th of prev month to 15th of next month
    const startWindow = new Date(y, m - 1, 15);
    const endWindow = new Date(y, m + 1, 15);

    api.get(`/appointments?start_date=${formatYMD(startWindow)}&end_date=${formatYMD(endWindow)}`)
      .then((appRes) => {
        const rawApps = Array.isArray(appRes) ? appRes : (appRes as any)?.data || [];
        if (rawApps.length > 0) {
          const formattedApps: Appointment[] = rawApps.map((a: any) => ({
            id: a.id,
            patientId: a.patientId || a.patient_id,
            templateId: a.templateId || a.template_id,
            patientName: a.patientName || a.patient?.fullName || a.patient?.name || 'Paciente',
            patientPhone: a.patientPhone || a.patient?.phone || a.phone || 'Não informado',
            physioName: a.physioName || a.physio_name || a.user?.fullName || a.user?.full_name || '',
            date: normalizeDate(a.date),
            time: normalizeTime(a.time || a.startTime || a.start_time),
            type: a.type || a.specialty || 'Avaliação Fisioterapêutica',
            status: a.status || 'Pendente',
            notes: a.notes,
            hasEvolution: isRealClinicalEvolution(a.notes, a.has_evolution ?? a.hasEvolution),
            template: a.template,
            patient: a.patient,
          }));
          setAppointments(formattedApps);
        } else {
          setAppointments([]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchAuxiliaryData();
  }, [currentDate]);



  const checkConflict = (selectedDate: string, selectedTime: string) => {
    if (!selectedDate || !selectedTime) {
      setModalError('');
      return;
    }
    const dNorm = normalizeDate(selectedDate);
    const tNorm = normalizeTime(selectedTime);

    const existing = appointments.find((app) => {
      const appDateNorm = normalizeDate(app.date);
      const appTimeNorm = normalizeTime(app.time);
      const isCancelled = (app.status || '').toLowerCase() === 'cancelado';
      return appDateNorm === dNorm && appTimeNorm === tNorm && !isCancelled;
    });

    if (existing) {
      setModalError(
        `⚠️ Conflito de Horário: Já existe um atendimento agendado para o dia ${dNorm} às ${tNorm} (Paciente: ${existing.patientName}). Escolha outro horário.`
      );
    } else {
      setModalError('');
    }
  };

  const checkRescheduleConflict = (selectedDate: string, selectedTime: string) => {
    if (!selectedDate || !selectedTime) {
      setEditError('');
      return false;
    }
    const dNorm = normalizeDate(selectedDate);
    const tNorm = normalizeTime(selectedTime);

    const existing = appointments.find((app) => {
      if (app.id === selectedApp?.id) return false;
      const appDateNorm = normalizeDate(app.date);
      const appTimeNorm = normalizeTime(app.time);
      const isCancelled = (app.status || '').toLowerCase() === 'cancelado';
      return appDateNorm === dNorm && appTimeNorm === tNorm && !isCancelled;
    });

    if (existing) {
      setEditError(
        `⚠️ Conflito de Horário: Já existe um atendimento agendado para o dia ${dNorm} às ${tNorm} (Paciente: ${existing.patientName}). Escolha outro horário.`
      );
      return true;
    } else {
      setEditError('');
      return false;
    }
  };

  const handleConfirmReschedule = () => {
    if (checkRescheduleConflict(editDate, editTime)) return;
    if (!selectedApp) return;

    const updated = { ...selectedApp, date: editDate, time: editTime, status: 'Agendado' };
    setAppointments((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
    setSelectedApp(updated);
    setEditStatus('Agendado');

    api.put(`/appointments/${selectedApp.id}`, { date: editDate, time: editTime, status: 'agendado' }).catch(() => {});

    toast({
      title: 'Reagendamento Confirmado',
      description: `O atendimento de ${selectedApp.patientName} foi remarcado para ${normalizeDate(editDate)} às ${editTime}.`,
      type: 'success',
    });
  };

  const handleEventReschedule = async (eventId: number | string, newDate: string, newTime: string) => {
    const targetApp = appointments.find((a) => String(a.id) === String(eventId));
    if (!targetApp) return;

    const normNewDate = normalizeDate(newDate);
    const normNewTime = normalizeTime(newTime);

    // Se a data e o horário não mudaram, ignora
    if (normalizeDate(targetApp.date) === normNewDate && normalizeTime(targetApp.time) === normNewTime) {
      return;
    }

    // Calcula horário de término (1h de duração padrão)
    const [hStr, mStr] = normNewTime.split(':');
    const hNum = parseInt(hStr || '14', 10);
    const endTime = `${String(Math.min(23, hNum + 1)).padStart(2, '0')}:${mStr || '00'}`;

    // Validação preventiva de conflito na agenda do profissional
    const conflict = appointments.find((app) => {
      if (String(app.id) === String(eventId)) return false;
      const appDateNorm = normalizeDate(app.date);
      const appTimeNorm = normalizeTime(app.time);
      const isCancelled = (app.status || '').toLowerCase() === 'cancelado';
      return appDateNorm === normNewDate && appTimeNorm === normNewTime && !isCancelled;
    });

    if (conflict) {
      toast({
        title: 'Horário Indisponível',
        description: `Já existe um atendimento para ${normNewDate} às ${normNewTime} (${conflict.patientName}). Escolha outro horário vago.`,
        type: 'warning',
      });
      return;
    }

    // 1. Atualização Otimista imediata
    const prevAppointments = [...appointments];
    setAppointments((prev) =>
      prev.map((a) =>
        String(a.id) === String(eventId)
          ? { ...a, date: normNewDate, time: normNewTime, startTime: normNewTime, endTime }
          : a
      )
    );

    // 2. Persistência na API
    try {
      await api.put(`/appointments/${eventId}`, {
        date: normNewDate,
        time: normNewTime,
        startTime: normNewTime,
        endTime,
      });

      const dateInfo = getWeekdayLabel(normNewDate);
      toast({
        title: 'Atendimento Reagendado! 📅',
        description: `${targetApp.patientName} movido para ${dateInfo.weekdayName} (${dateInfo.shortDate}) às ${normNewTime}.`,
        type: 'success',
      });
    } catch (err: any) {
      // Reverte em caso de falha do servidor
      setAppointments(prevAppointments);
      toast({
        title: 'Conflito de Horário / Erro',
        description: err?.response?.data?.error || err?.message || 'Não foi possível salvar o reagendamento.',
        type: 'error',
      });
    }
  };

  const fetchAuxiliaryData = () => {
    if (patientsList.length === 0) {
      api.get('/patients').then((res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        setPatientsList(data);
      }).catch(() => {});
    }
    if (templatesList.length === 0) {
      api.get('/form-templates?limit=100').then((res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        setTemplatesList(data.length > 0 ? data : [
          { id: 1, title: 'Avaliação da Coluna Vertebral' },
          { id: 2, title: 'Avaliação de Reabilitação Ortopédica de Joelho' },
        ]);
      }).catch(() => {});
    }
  };

  const openDetails = (app: Appointment) => {
    fetchAuxiliaryData();
    setLoadingDetails(true);
    setSelectedApp(app); // Show basic info immediately while loading

    api.get(`/appointments/${app.id}`)
      .then((res: any) => {
        const fullApp = res.data || res;
        const hasEvol = isRealClinicalEvolution(fullApp.notes, fullApp.has_evolution ?? fullApp.hasEvolution ?? app.hasEvolution);
        // Merge the loaded details into the selectedApp
        const merged: Appointment = {
          ...app,
          ...fullApp,
          hasEvolution: hasEvol,
          patientName: fullApp.patient?.name || fullApp.patient?.fullName || app.patientName,
          patientPhone: fullApp.patient?.phone || app.patientPhone,
          physioName: fullApp.physioName || fullApp.physio_name || fullApp.user?.fullName || fullApp.user?.full_name || app.physioName || '',
          patient: fullApp.patient,
          template: fullApp.template,
          notes: fullApp.notes,
        };
        setSelectedApp(merged);

        const apiToUiStatus = (apiStatus: string) => {
          switch(apiStatus?.toLowerCase()) {
              case 'pendente': return 'Agendado';
              case 'confirmado': return 'Presença confirmada';
              case 'finalizado': return 'Atendido';
              case 'em_atendimento': return 'Atendido';
              case 'ausente': return 'Faltou';
              case 'desmarcado': return 'Faltou (com aviso prévio)';
              case 'cancelado': return 'Não atendido (Sem cobrança)';
              default: return 'Agendado';
          }
        };

        setEditStatus(apiToUiStatus(fullApp.status || app.status));
        setEditDate(normalizeDate(fullApp.date || app.date || ''));
        setEditTime(fullApp.startTime || fullApp.start_time || app.time || '');
        setEditType(fullApp.specialty || fullApp.type || app.type || 'Avaliação Fisioterapêutica');
      })
      .catch(() => {
        toast({ title: 'Erro', description: 'Não foi possível carregar os detalhes.', type: 'error' });
      })
      .finally(() => setLoadingDetails(false));

    setIsEditing(false);
    setShowMsgPreview(false);
    setEditError('');
    setInlineEvolutionOpen(false);
  };

  const handleOpenInlineEvolution = () => {
    if (!selectedApp) return;
    const isAtendido = (selectedApp.status || '').toLowerCase().includes('atendido') || (selectedApp.status || '').toLowerCase().includes('finalizado');
    if (!isAtendido && !selectedApp.hasEvolution) {
      handleUpdateStatus('Atendido');
    }
    const initialNotes = selectedApp.notes && !selectedApp.notes.startsWith('Sessão ') ? selectedApp.notes : '';
    setEvolutionNotes(initialNotes);
    setEvolutionImages(selectedApp.images && Array.isArray(selectedApp.images) ? selectedApp.images : []);
    setInlineEvolutionOpen(true);
    setTimeout(() => {
      if (evolutionEditorRef.current) {
        evolutionEditorRef.current.innerHTML = initialNotes;
        evolutionEditorRef.current.focus();
      }
    }, 120);
  };

  const handleCloseInlineEvolution = () => {
    setInlineEvolutionOpen(false);
  };

  const formatEditorText = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (evolutionEditorRef.current) {
      evolutionEditorRef.current.focus();
      setEvolutionNotes(evolutionEditorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (evolutionEditorRef.current) {
      setEvolutionNotes(evolutionEditorRef.current.innerHTML);
    }
  };

  const insertEvolutionChip = (text: string) => {
    if (evolutionEditorRef.current) {
      const currentHtml = evolutionEditorRef.current.innerHTML;
      const newHtml = currentHtml.trim() === '' || currentHtml === '<br>' 
        ? `<p>${text}</p>` 
        : `${currentHtml}<p>${text}</p>`;
      evolutionEditorRef.current.innerHTML = newHtml;
      setEvolutionNotes(newHtml);
      evolutionEditorRef.current.focus();
    }
  };

  const handleEvolutionFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast({
        title: 'Formato Inválido',
        description: 'Selecione arquivos de imagem válidos (JPG, PNG, WEBP).',
        type: 'warning',
      });
      setIsUploadingImages(false);
      return;
    }
    try {
      const compressedUrls = await Promise.all(validFiles.map((file) => compressImageFile(file)));
      setEvolutionImages((prev) => [...prev, ...compressedUrls]);
      toast({
        title: 'Imagens Adicionadas',
        description: `${compressedUrls.length} ${compressedUrls.length === 1 ? 'imagem anexada' : 'imagens anexadas'}.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível processar as imagens.',
        type: 'error',
      });
    } finally {
      setIsUploadingImages(false);
      if (evolutionFileInputRef.current) evolutionFileInputRef.current.value = '';
    }
  };

  const handleRemoveEvolutionImage = (indexToRemove: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEvolutionImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (evolutionPreviewImageIndex === indexToRemove) {
      setEvolutionPreviewImageIndex(null);
    } else if (evolutionPreviewImageIndex !== null && evolutionPreviewImageIndex > indexToRemove) {
      setEvolutionPreviewImageIndex(evolutionPreviewImageIndex - 1);
    }
    toast({
      title: 'Imagem Removida',
      description: 'A foto foi removida da evolução.',
      type: 'info',
    });
  };

  const handleSaveInlineEvolution = async () => {
    if (!selectedApp) return;
    const plainText = evolutionEditorRef.current?.innerText?.trim() || '';
    if (!plainText && (!evolutionNotes || evolutionNotes.trim() === '') && evolutionImages.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Por favor, digite a anotação da evolução do paciente ou anexe fotos da sessão.',
        type: 'warning',
      });
      return;
    }

    setIsSavingEvolution(true);
    const contentToSave = evolutionEditorRef.current?.innerHTML || evolutionNotes;

    try {
      await api.put(`/appointments/${selectedApp.id}`, {
        notes: contentToSave,
        images: evolutionImages,
        status: 'finalizado',
      });

      const updatedApp: Appointment = {
        ...selectedApp,
        notes: contentToSave,
        images: evolutionImages,
        hasEvolution: true,
        status: 'Atendido',
      };

      setSelectedApp(updatedApp);
      setAppointments((prev) => prev.map((a) => (a.id === selectedApp.id ? updatedApp : a)));

      toast({
        title: 'Evolução Salva com Sucesso! 🩺✨',
        description: `Evolução clínica de ${selectedApp.patientName} registrada no prontuário.`,
        type: 'success',
      });

      setInlineEvolutionOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Falha ao salvar a evolução.';
      toast({
        title: 'Erro ao Salvar',
        description: msg,
        type: 'error',
      });
    } finally {
      setIsSavingEvolution(false);
    }
  };

  const openNewAppointmentModal = () => {
    fetchAuxiliaryData();
    setShowModal(true);
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedApp) return;
    const updated = { ...selectedApp, status: newStatus };
    if (newStatus === 'Atendido' || newStatus === 'Presença confirmada') {
      updated.financialRecord = { ...(updated.financialRecord || {}), status: 'baixado' };
    }
    
    setAppointments((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
    setSelectedApp(updated);

    let statusApiValue = 'pendente';
    if (newStatus === 'Agendado') statusApiValue = 'pendente';
    else if (newStatus === 'Presença confirmada') statusApiValue = 'confirmado';
    else if (newStatus === 'Atendido') statusApiValue = 'finalizado';
    else if (newStatus === 'Faltou') statusApiValue = 'ausente';
    else if (newStatus === 'Faltou (com aviso prévio)') statusApiValue = 'desmarcado';
    else if (newStatus === 'Faltou (sem aviso prévio)') statusApiValue = 'ausente';
    else if (newStatus === 'Não atendido (Sem cobrança)') statusApiValue = 'cancelado';

    api.put(`/appointments/${selectedApp.id}`, { status: statusApiValue }).catch(() => {});

    toast({
      title: 'Status & Financeiro Atualizados!',
      description: `Atendimento de ${selectedApp.patientName} alterado para "${newStatus}".`,
      type: 'info',
    });
  };

  const handleGiveBaixa = (app: Appointment) => {
    api.post(`/appointments/${app.id}/baixa`, { paymentMethod: 'pix' })
      .then(() => {
        handleUpdateStatus('Atendido');
        toast({
          title: 'Baixa Financeira Efetuada!',
          description: `Atendimento de ${app.patientName} foi baixado e concluído no Financeiro.`,
          type: 'success',
        });
      })
      .catch(() => {
        handleUpdateStatus('Finalizado');
      });
  };

  const handleDeleteAppointment = (id: number | string) => {
    const target = appointments.find((a) => a.id === id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    setSelectedApp(null);

    api.delete(`/appointments/${id}`).catch(() => {});

    toast({
      title: 'Atendimento Excluído',
      description: target ? `O atendimento de ${target.patientName} foi removido.` : 'Agendamento removido com sucesso.',
      type: 'info',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setEditError('');

    const targetDateNorm = normalizeDate(editDate);
    const targetTimeNorm = normalizeTime(editTime);

    // Collision check for other appointments
    const conflict = appointments.find((app) => {
      if (app.id === selectedApp.id) return false;
      const appDateNorm = normalizeDate(app.date);
      const appTimeNorm = normalizeTime(app.time);
      const isCancelled = (app.status || '').toLowerCase() === 'cancelado';
      return appDateNorm === targetDateNorm && appTimeNorm === targetTimeNorm && !isCancelled;
    });

    if (conflict) {
      setEditError(
        `⚠️ Horário Indisponível: Já existe outro atendimento para ${targetDateNorm} às ${targetTimeNorm} (Paciente: ${conflict.patientName}).`
      );
      return;
    }

    const updatedApp: Appointment = {
      ...selectedApp,
      date: targetDateNorm,
      time: targetTimeNorm,
      type: editType,
      status: editStatus,
    };

    setAppointments((prev) => prev.map((a) => (a.id === selectedApp.id ? updatedApp : a)));
    setSelectedApp(updatedApp);
    setIsEditing(false);

    api
      .put(`/appointments/${selectedApp.id}`, {
        date: targetDateNorm,
        startTime: targetTimeNorm,
        specialty: editType,
        status: editStatus,
      })
      .catch(() => {});

    toast({
      title: 'Atendimento Atualizado!',
      description: `Alterações salvas para ${selectedApp.patientName}.`,
      type: 'success',
    });
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!patientName) return;

    const targetDate = date || formatLocalYMD(new Date());
    const targetTime = time || '00:00';

    const targetDateNorm = normalizeDate(targetDate);
    const targetTimeNorm = normalizeTime(targetTime);

    // Strict validation: Block any appointment on the same date and same time regardless of patient
    const existing = appointments.find((app) => {
      const appDateNorm = normalizeDate(app.date);
      const appTimeNorm = normalizeTime(app.time);
      const isCancelled = (app.status || '').toLowerCase() === 'cancelado';
      return appDateNorm === targetDateNorm && appTimeNorm === targetTimeNorm && !isCancelled;
    });

    if (existing) {
      const errorMsg = `Horário indisponível! Já existe um atendimento agendado para o dia ${targetDateNorm} às ${targetTimeNorm} (Paciente: ${existing.patientName}). Escolha outro horário.`;
      setModalError(`⚠️ Conflito de Horário: ${errorMsg}`);
      toast({
        title: 'Horário Indisponível!',
        description: errorMsg,
        type: 'warning',
      });
      return;
    }

    const matchedPatient = patientsList.find(
      (p) => (p.fullName || p.name || '').trim().toLowerCase() === patientName.trim().toLowerCase()
    );

    if (!matchedPatient?.id) {
      const errorMsg = 'Por favor, selecione um paciente cadastrado da lista.';
      setModalError(`⚠️ Paciente Inválido: ${errorMsg}`);
      toast({
        title: 'Paciente não encontrado',
        description: errorMsg,
        type: 'warning',
      });
      return;
    }

    const pPhone = matchedPatient?.phone || 'Não informado';

    const newApp: Appointment = {
      id: Date.now(),
      patientId: matchedPatient.id,
      patientName: matchedPatient.fullName || matchedPatient.name || patientName,
      patientPhone: pPhone,
      date: targetDateNorm,
      time: targetTimeNorm,
      startTime: targetTimeNorm,
      type: 'Atendimento Fisioterapêutico',
      specialty: 'Atendimento Fisioterapêutico',
      status: 'Pendente',
    };

    api.post('/appointments', {
      patientId: matchedPatient.id,
      date: targetDateNorm,
      startTime: targetTimeNorm,
      specialty: 'Atendimento Fisioterapêutico',
    }).then((res: any) => {
      const created = res?.data || res;
      if (created?.id) {
        setAppointments((prev) => prev.map((a) => (a.id === newApp.id ? { ...a, id: created.id } : a)));
      }
    }).catch((err: any) => {
      const serverErr = err?.response?.data?.error || err?.message || 'Erro ao salvar agendamento.';
      toast({
        title: 'Conflito de Horário / Erro',
        description: serverErr,
        type: 'error',
      });
    });

    setAppointments([newApp, ...appointments]);
    setShowModal(false);
    setPatientName('');
    setDate('');
    setTime('');
    setModalError('');

    toast({
      title: 'Atendimento Agendado!',
      description: `Horário de ${patientName} agendado para ${targetDateNorm} às ${targetTimeNorm}.`,
      type: 'success',
    });
  };

  const [selectedPhysioFilter, setSelectedPhysioFilter] = useState<string>('todos');

  // Advanced Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterPhysios, setFilterPhysios] = useState<string[]>([]);

  const FILTER_STATUS_OPTIONS = [
    { value: 'pendente', label: 'Agendado', color: 'bg-blue-500' },
    { value: 'confirmado', label: 'Confirmado', color: 'bg-emerald-500' },
    { value: 'finalizado', label: 'Atendido', color: 'bg-purple-500' },
    { value: 'ausente', label: 'Faltou', color: 'bg-red-500' },
    { value: 'desmarcado', label: 'Desmarcou', color: 'bg-orange-400' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-slate-500' },
  ];

  const toggleFilterStatus = (statusValue: string) => {
    setFilterStatuses((prev) =>
      prev.includes(statusValue)
        ? prev.filter((s) => s !== statusValue)
        : [...prev, statusValue]
    );
  };

  const toggleFilterPhysio = (physioName: string) => {
    setFilterPhysios((prev) =>
      prev.includes(physioName)
        ? prev.filter((p) => p !== physioName)
        : [...prev, physioName]
    );
  };

  const clearAllFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterStatuses([]);
    setFilterPhysios([]);
    setSelectedPhysioFilter('todos');
  };

  const activeFilterCount = [
    filterStartDate || filterEndDate,
    filterStatuses.length > 0,
    filterPhysios.length > 0,
  ].filter(Boolean).length;

  const uniquePhysios = React.useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach((a) => {
      if (a.physioName && a.physioName.trim() !== '') {
        map.set(a.physioName.trim(), a.physioName.trim());
      }
    });
    return Array.from(map.values()).sort();
  }, [appointments]);

  const statusApiToInternal = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'agendado' || s === 'pendente') return 'pendente';
    if (s === 'presença confirmada' || s === 'confirmado') return 'confirmado';
    if (s === 'atendido' || s === 'finalizado' || s === 'em atendimento' || s === 'em_atendimento') return 'finalizado';
    if (s === 'faltou' || s === 'ausente' || s === 'faltou (sem aviso prévio)' || s === 'paciente ausente') return 'ausente';
    if (s === 'faltou (com aviso prévio)' || s === 'desmarcado' || s === 'paciente desmarcou') return 'desmarcado';
    if (s === 'cancelado' || s === 'não atendido (sem cobrança)') return 'cancelado';
    return 'pendente';
  };

  // Filter appointments by search query, physio, and advanced filters
  const filteredAppointments = appointments.filter((app) => {
    // Quick physio filter (from the header dropdown)
    if (selectedPhysioFilter !== 'todos') {
      if ((app.physioName || '').trim() !== selectedPhysioFilter) {
        return false;
      }
    }

    // Advanced: Date range
    if (filterStartDate || filterEndDate) {
      const appDate = normalizeDate(app.date);
      if (filterStartDate && appDate < filterStartDate) return false;
      if (filterEndDate && appDate > filterEndDate) return false;
    }

    // Advanced: Status filter
    if (filterStatuses.length > 0) {
      const appStatusInternal = statusApiToInternal(app.status);
      if (!filterStatuses.includes(appStatusInternal)) return false;
    }

    // Advanced: Physio filter (multi-select)
    if (filterPhysios.length > 0) {
      if (!filterPhysios.includes((app.physioName || '').trim())) return false;
    }


    // Text search
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = (app.patientName || '').toLowerCase().includes(q);
    const matchType = (app.type || '').toLowerCase().includes(q);
    const matchDate = (app.date || '').includes(q);
    const matchPhysio = (app.physioName || '').toLowerCase().includes(q);
    return matchName || matchType || matchDate || matchPhysio;
  });

  return (
    <>
      <Header
        title="Agenda de Atendimentos"
        subtitle="Gerencie horários, avaliações e sessões fisioterapêuticas da clínica"
      />

      <main className="flex-1 p-3 sm:p-4 pb-20 space-y-4 overflow-y-auto max-w-full">
        {/* Header Action & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3">
          {/* View Mode Toggle Switch */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 shrink-0 border border-slate-200">
            {[
              { id: 'month', label: 'Mês', icon: LayoutGrid },
              { id: 'week', label: 'Semana', icon: CalendarDays },
              { id: 'day', label: 'Dia', icon: List },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleSetViewMode(mode.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === mode.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fisioterapeuta Filter */}
          {uniquePhysios.length > 0 && (
            <div className="shrink-0 min-w-[210px]">
              <CustomSelect
                size="sm"
                value={selectedPhysioFilter}
                onChange={(val) => setSelectedPhysioFilter(String(val))}
                options={[
                  { value: 'todos', label: 'Todos os Profissionais' },
                  ...uniquePhysios.map((name) => ({
                    value: name,
                    label: name,
                  })),
                ]}
              />
            </div>
          )}

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente ou data..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Advanced Filter Button */}
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className={`relative inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all shrink-0 border ${
              activeFilterCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 shadow-sm'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80 hover:text-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openNewAppointmentModal}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agendar Novo Atendimento</span>
          </button>
        </div>

        {/* Active Filters Pills Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filtros ativos:</span>
            {(filterStartDate || filterEndDate) && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                <CalendarDays className="w-3 h-3" />
                {filterStartDate ? filterStartDate.split('-').reverse().join('/') : '...'}
                {' → '}
                {filterEndDate ? filterEndDate.split('-').reverse().join('/') : '...'}
                <button type="button" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} className="ml-0.5 hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterStatuses.length > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-purple-200">
                <Activity className="w-3 h-3" />
                {filterStatuses.length} status
                <button type="button" onClick={() => setFilterStatuses([])} className="ml-0.5 hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterPhysios.length > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                <User className="w-3 h-3" />
                {filterPhysios.length} fisio(s)
                <button type="button" onClick={() => setFilterPhysios([])} className="ml-0.5 hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-full transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar todos
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <CalendarViews
            events={filteredAppointments as CalendarEvent[]}
            viewMode={viewMode}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onEventClick={(ev: any) => openDetails(ev)}
            onEventReschedule={handleEventReschedule}
          />
        )}

        {/* Modal Agendamento */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={() => setShowModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <h3 className="font-bold text-slate-800 text-base sm:text-lg border-b border-slate-100 pb-3">
                  Agendar Atendimento
                </h3>

                <form onSubmit={handleAddAppointment} className="space-y-4">
                  {modalError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-600 font-medium flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{modalError}</span>
                    </div>
                  )}

                  {/* Custom Pretty Patient Select */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Nome do Paciente *
                    </label>
                    <PatientSelect
                      patients={patientsList}
                      selected={patientName}
                      onSelect={(name) => setPatientName(name)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Data *
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => {
                          const newD = e.target.value;
                          setDate(newD);
                          checkConflict(newD, time);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Horário *
                      </label>
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={(e) => {
                          const newT = e.target.value;
                          setTime(newT);
                          checkConflict(date, newT);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!patientName || !!modalError}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm text-center transition-all flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Agendamento</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Detalhes / Edição / Status / Evolução do Atendimento */}
        <AnimatePresence>
          {selectedApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={() => setSelectedApp(null)}
              />

              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className={`relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 w-full max-h-[92vh] overflow-y-auto transition-all duration-300 ${
                  inlineEvolutionOpen ? 'max-w-4xl sm:max-w-5xl' : 'max-w-lg'
                }`}
              >
                {/* Modal Top Bar */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                      {(selectedApp.patientName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">
                          {selectedApp.patientName}
                        </h3>
                        {selectedApp.hasEvolution && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Evoluído
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 font-medium truncate">{selectedApp.type}</p>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          <span>{getWeekdayLabel(selectedApp.date || '').shortDate}</span>
                          <span className="text-slate-300 mx-0.5">-</span>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{normalizeTime(selectedApp.time)}</span>
                        </div>
                        {selectedApp.physioName && (
                          <>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <div className="flex items-center space-x-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <User className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[150px] sm:max-w-none">{selectedApp.physioName}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Content: Single Column OR Side-by-Side with Inline Evolution */}
                {!inlineEvolutionOpen ? (
                  /* Standard Details Mode */
                  <div className="space-y-4">
                    {/* Quick Status Selection Bar */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Alterar Status do Atendimento
                      </label>
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl px-3 py-2.5 text-sm text-slate-800 flex items-center justify-between transition-all cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${[
                              { value: 'Agendado', color: 'bg-blue-500' },
                              { value: 'Atendido', color: 'bg-emerald-500' },
                              { value: 'Faltou', color: 'bg-red-500' },
                              { value: 'Faltou (com aviso prévio)', color: 'bg-yellow-400' },
                              { value: 'Faltou (sem aviso prévio)', color: 'bg-orange-500' },
                              { value: 'Não atendido (Sem cobrança)', color: 'bg-slate-800' },
                              { value: 'Presença confirmada', color: 'bg-blue-800' },
                              { value: 'Remarcar', color: 'bg-sky-300' },
                            ].find(o => o.value === editStatus)?.color || 'bg-slate-300'}`} />
                            <span className="font-semibold">{editStatus || 'Selecione'}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>

                        {isStatusDropdownOpen && (
                          <div className="absolute top-full mt-1 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                            {[
                              { label: 'Agendado', value: 'Agendado', color: 'bg-blue-500' },
                              { label: 'Atendido', value: 'Atendido', color: 'bg-emerald-500' },
                              { label: 'Faltou', value: 'Faltou', color: 'bg-red-500' },
                              { label: 'Faltou (com aviso prévio)', value: 'Faltou (com aviso prévio)', color: 'bg-yellow-400' },
                              { label: 'Faltou (sem aviso prévio)', value: 'Faltou (sem aviso prévio)', color: 'bg-orange-500' },
                              { label: 'Não atendido (Sem cobrança)', value: 'Não atendido (Sem cobrança)', color: 'bg-slate-800' },
                              { label: 'Presença confirmada', value: 'Presença confirmada', color: 'bg-blue-800' },
                              { label: 'Remarcar', value: 'Remarcar', color: 'bg-sky-300' },
                            ].map(option => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setEditStatus(option.value);
                                  setIsStatusDropdownOpen(false);
                                  if (option.value !== 'Remarcar') {
                                    handleUpdateStatus(option.value);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 text-sm text-slate-700 transition-colors cursor-pointer"
                              >
                                <div className={`w-2.5 h-2.5 rounded-full ${option.color}`} />
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {editStatus === 'Remarcar' && (
                        <div className="mt-4 p-4 border border-blue-200 bg-blue-50/50 rounded-xl space-y-3">
                          <p className="text-xs font-bold text-blue-800">Escolha o novo horário:</p>
                          
                          {editError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-600 font-medium flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              <span>{editError}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Nova Data</label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => {
                                  setEditDate(e.target.value);
                                  checkRescheduleConflict(e.target.value, editTime);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Novo Horário</label>
                              <input
                                type="time"
                                value={editTime}
                                onChange={(e) => {
                                  setEditTime(e.target.value);
                                  checkRescheduleConflict(editDate, e.target.value);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleConfirmReschedule}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            Confirmar Reagendamento
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Financial Baixa Action Banner */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-950">Baixa no Financeiro</p>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            Atendimentos confirmados dão baixa automática.
                          </p>
                        </div>
                      </div>

                      {(selectedApp as any)?.financialRecord?.status === 'baixado' ? (
                        <div className="bg-emerald-100/50 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Baixa Confirmada</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleGiveBaixa(selectedApp)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 shadow-sm transition-all cursor-pointer"
                        >
                          Confirmar Baixa
                        </button>
                      )}
                    </div>

                    {/* Patient Contact & WhatsApp Action Card */}
                    {selectedApp.patientPhone && (
                      <div className="flex items-center justify-between bg-blue-50/70 p-3.5 rounded-xl border border-blue-100/90 shadow-2xs">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase font-semibold text-slate-400">Contato do Paciente</p>
                            <p className="text-xs font-bold text-slate-800 font-mono truncate">{selectedApp.patientPhone}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <a
                            href={`tel:${selectedApp.patientPhone.replace(/\D/g, '')}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                            title="Ligar para o paciente"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Ligar</span>
                          </a>
                          <a
                            href={getWhatsappUrl(selectedApp)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                            title="Disparar mensagem no WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Evolução Clínica da Sessão Card (with Inline Expand Trigger) */}
                    {(() => {
                      const hasEvolution = isRealClinicalEvolution(selectedApp.notes, selectedApp.hasEvolution);
                      const isAtendido = (selectedApp.status || '').toLowerCase().includes('atendido') || (selectedApp.status || '').toLowerCase().includes('finalizado');

                      return (
                        <div className={`${hasEvolution ? 'bg-emerald-50/90 border-emerald-300' : isAtendido ? 'bg-amber-50/90 border-amber-300' : 'bg-blue-50/90 border-blue-300'} border rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs`}>
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shrink-0 shadow-2xs ${hasEvolution ? 'bg-emerald-600' : isAtendido ? 'bg-amber-600' : 'bg-blue-600'}`}>
                              {hasEvolution ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs sm:text-sm font-bold ${hasEvolution ? 'text-emerald-950' : isAtendido ? 'text-amber-950' : 'text-blue-950'}`}>
                                {hasEvolution ? 'Evolução Registrada' : isAtendido ? 'Evolução Pendente' : 'Evolução do Paciente'}
                              </p>
                              <p className={`text-[11px] font-medium truncate ${hasEvolution ? 'text-emerald-700' : isAtendido ? 'text-amber-700' : 'text-blue-700'}`}>
                                {hasEvolution ? 'Anotações clínicas e anexos salvos' : isAtendido ? 'Atendimento realizado: registre a evolução clínica' : 'Registre a evolução clínica da sessão'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleOpenInlineEvolution}
                            className={`${hasEvolution ? 'bg-emerald-600 hover:bg-emerald-700' : isAtendido ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 hover:scale-[1.02] active:scale-95`}
                          >
                            {hasEvolution ? <Search className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                            <span>{hasEvolution ? 'Ver / Editar Evolução' : isAtendido ? 'Inserir Evolução' : 'Atender e Evoluir'}</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Edit Form */}
                    {isEditing && (
                      <form onSubmit={handleSaveEdit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {editError && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-600 font-medium">
                            {editError}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Data</label>
                            <input
                              type="date"
                              required
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Horário</label>
                            <input
                              type="time"
                              required
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1.5 text-xs text-slate-500 font-semibold hover:text-slate-800 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-xs cursor-pointer"
                          >
                            Salvar Alterações
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Footer Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Fechar Edição' : 'Editar Horário'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAppointment(selectedApp.id)}
                        className="inline-flex items-center space-x-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Atendimento</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Expanded Side-by-Side Evolution Form with Framer Motion */
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                  >
                    {/* Left Column: Summary & Patient Overview */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Resumo do Paciente
                          </span>
                          <span className="text-[11px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            {selectedApp.time}
                          </span>
                        </div>

                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{selectedApp.patientName}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedApp.type}</p>
                          {selectedApp.patientPhone && (
                            <p className="text-xs font-mono font-bold text-slate-700 mt-1">{selectedApp.patientPhone}</p>
                          )}
                        </div>

                        {selectedApp.physioName && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-blue-800">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                            <span>{selectedApp.physioName}</span>
                          </div>
                        )}
                      </div>

                      {/* WhatsApp Quick Action */}
                      {selectedApp.patientPhone && (
                        <a
                          href={getWhatsappUrl(selectedApp)}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Falar no WhatsApp</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={handleCloseInlineEvolution}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar aos Detalhes</span>
                      </button>
                    </div>

                    {/* Right Column: Interactive Clinical Evolution Form */}
                    <div className="lg:col-span-8 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">Evolução Clínica da Sessão</h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Registre condutas, relato do paciente e procedimentos realizados
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Clinical Chips */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Frases Rápidas e Condutas Clínicas</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {QUICK_CLINICAL_CHIPS.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => insertEvolutionChip(chip)}
                              className="text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all flex items-center gap-1 cursor-pointer text-left"
                            >
                              <Plus className="w-3 h-3 shrink-0 text-blue-500" />
                              <span>{chip}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rich Text Toolbar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Anotações da Evolução
                          </label>
                          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => formatEditorText('bold')}
                              className="p-1 hover:bg-white rounded text-slate-700 transition-colors"
                              title="Negrito"
                            >
                              <Bold className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => formatEditorText('italic')}
                              className="p-1 hover:bg-white rounded text-slate-700 transition-colors"
                              title="Itálico"
                            >
                              <Italic className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => formatEditorText('strikeThrough')}
                              className="p-1 hover:bg-white rounded text-slate-700 transition-colors"
                              title="Tachado"
                            >
                              <Strikethrough className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => formatEditorText('insertUnorderedList')}
                              className="p-1 hover:bg-white rounded text-slate-700 transition-colors"
                              title="Lista com Marcadores"
                            >
                              <List className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => formatEditorText('removeFormat')}
                              className="p-1 hover:bg-white rounded text-slate-700 transition-colors"
                              title="Limpar Formatação"
                            >
                              <Eraser className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Rich ContentEditable Box */}
                        <div
                          ref={evolutionEditorRef}
                          contentEditable
                          onInput={handleEditorInput}
                          className="w-full min-h-[140px] max-h-[220px] overflow-y-auto p-3.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans leading-relaxed"
                          data-placeholder="Descreva aqui o estado do paciente, queixas, testes realizados, condutas e resposta ao tratamento..."
                        />
                      </div>

                      {/* Photo / Image Attachments */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>Fotos e Anexos da Sessão ({evolutionImages.length})</span>
                          </label>
                          <input
                            ref={evolutionFileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleEvolutionFilesSelected(e.target.files)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => evolutionFileInputRef.current?.click()}
                            disabled={isUploadingImages}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {isUploadingImages ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5" />
                            )}
                            <span>Anexar Fotos</span>
                          </button>
                        </div>

                        {evolutionImages.length > 0 && (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                            {evolutionImages.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setEvolutionPreviewImageIndex(idx)}
                                className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs"
                              >
                                <img
                                  src={img}
                                  alt={`Anexo ${idx + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveEvolutionImage(idx, e)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-700"
                                  title="Remover Imagem"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Modal Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleCloseInlineEvolution}
                          disabled={isSavingEvolution}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveInlineEvolution}
                          disabled={isSavingEvolution}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                          {isSavingEvolution ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Salvar e Concluir Evolução</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========== MODAL DE FILTRO AVANÇADO ========== */}
        <AnimatePresence>
          {showFilterModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={() => setShowFilterModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 15 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-5 pt-5 pb-3 border-b border-slate-100 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Filtros Avançados</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Refine sua busca na agenda</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFilterModal(false)}
                      className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* 1. Date Range Filter */}
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      Período
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1">Data Início</label>
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1">Data Fim</label>
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-slate-200" />

                  {/* 2. Status Multi-Select */}
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <Activity className="w-4 h-4 text-purple-500" />
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FILTER_STATUS_OPTIONS.map((opt) => {
                        const isActive = filterStatuses.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleFilterStatus(opt.value)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                              isActive
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.02]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : opt.color}`} />
                            {opt.label}
                            {isActive && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-slate-200" />

                  {/* 3. Physio Multi-Select */}
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <User className="w-4 h-4 text-emerald-500" />
                      Funcionários
                    </label>
                    {uniquePhysios.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {uniquePhysios.map((name) => {
                          const isActive = filterPhysios.includes(name);
                          const initials = name.split(' ').slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join('');
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => toggleFilterPhysio(name)}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                isActive
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.02]'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
                                isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}>
                                {initials}
                              </span>
                              <span className="truncate max-w-[120px]">{name.split(' ').slice(0, 2).join(' ')}</span>
                              {isActive && <Check className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhum profissional encontrado nos agendamentos.</p>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-5 py-4 rounded-b-3xl">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Limpar Filtros
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilterModal(false)}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      Aplicar Filtros
                      {activeFilterCount > 0 && (
                        <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Lightbox for Evolution Image Preview */}
        <AnimatePresence>
          {evolutionPreviewImageIndex !== null && evolutionImages[evolutionPreviewImageIndex] && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
              <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setEvolutionPreviewImageIndex(null)}
                  className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={evolutionImages[evolutionPreviewImageIndex]}
                  alt="Visualização da Imagem"
                  className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
