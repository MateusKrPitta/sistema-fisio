'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-context';
import {
  Users,
  PlusCircle,
  Search,
  Eye,
  Edit3,
  Trash2,
  FileSpreadsheet,
  Phone,
  Mail,
  Calendar,
  Loader2,
  X,
  AlertTriangle,
  FileText,
  User,
  CheckCircle2,
  Clock,
  DollarSign,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CurrencyInput, formatCurrency } from '@/components/currency-input';
import { CustomSelect } from '@/components/custom-select';
import { maskCpf, maskPhone } from '@/lib/masks';
import { getAppointmentStatusStyle } from '@/components/calendar/CalendarViews';

const WEEKDAYS = [
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

function calculatePlanDetails(
  startDateStr: string,
  endDateStr: string,
  selectedDays: Record<number, { enabled: boolean; startTime: string; endTime: string }>
) {
  const activeDayIds = Object.entries(selectedDays)
    .filter(([_, config]) => config.enabled)
    .map(([dayId]) => Number(dayId));

  const weeklyCount = activeDayIds.length;
  const monthlyCount = weeklyCount * 4;

  if (!startDateStr || !endDateStr || weeklyCount === 0) {
    return { totalSessions: 0, weeklyCount, monthlyCount, durationWeeks: 0 };
  }

  let start = new Date(startDateStr + 'T00:00:00');
  let end = new Date(endDateStr + 'T00:00:00');

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { totalSessions: 0, weeklyCount, monthlyCount, durationWeeks: 0 };
  }

  let sessionsCount = 0;
  let current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (activeDayIds.includes(dayOfWeek)) {
      sessionsCount++;
    }
    current.setDate(current.getDate() + 1);
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const durationWeeks = Math.max(1, Math.ceil(diffDays / 7));

  return { totalSessions: sessionsCount, weeklyCount, monthlyCount, durationWeeks };
}

// Summary essential patient info returned by GET /patients
export interface EssentialPatient {
  id: number | string;
  name?: string;
  fullName?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  userId?: number | string | null;
  user_id?: number | string | null;
  user?: { id: number | string; fullName?: string; name?: string; email?: string } | null;
  templateId?: number | string | null;
  template_id?: number | string | null;
  template?: { id: number | string; title: string; description?: string } | null;
  sessionRate?: number;
  session_rate?: number;
  createdAt?: string;
}

// Complete detailed patient info returned by GET /patients/:id
export interface DetailedPatient extends EssentialPatient {
  birthdate?: string;
  birthDate?: string;
  gender?: string;
  notes?: string | null;
  maritalStatus?: string | null;
  marital_status?: string | null;
  emergencyContact?: string | null;
  emergency_contact?: string | null;
  appointments?: any[];
  updatedAt?: string;
}

export interface FormTemplate {
  id: number | string;
  title: string;
  description?: string;
}

export default function PatientsListPage() {
  const { toast } = useToast();

  // Primary summary table state
  const [patients, setPatients] = useState<EssentialPatient[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      if (page !== 1) setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // View Details Modal State (calls GET /patients/:id)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailedPatient, setDetailedPatient] = useState<DetailedPatient | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'personal' | 'financial' | 'appointments'>('personal');

  // Schedule Plan Form inside Details Modal
  const [modalEnablePlan, setModalEnablePlan] = useState(false);
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [modalSelectedDays, setModalSelectedDays] = useState<{ [key: number]: { enabled: boolean; startTime: string; endTime: string } }>({
    1: { enabled: true, startTime: '14:00', endTime: '15:00' },
    3: { enabled: true, startTime: '14:00', endTime: '15:00' },
    5: { enabled: false, startTime: '14:00', endTime: '15:00' },
  });
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  useEffect(() => {
    if (modalStartDate && !modalEndDate) {
      const start = new Date(modalStartDate + 'T00:00:00');
      start.setMonth(start.getMonth() + 1);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      setModalEndDate(`${y}-${m}-${d}`);
    }
  }, [modalStartDate, modalEndDate]);

  const toggleModalDaySelection = (dayId: number) => {
    setModalSelectedDays((prev) => ({
      ...prev,
      [dayId]: {
        enabled: !prev[dayId]?.enabled,
        startTime: prev[dayId]?.startTime || '14:00',
        endTime: prev[dayId]?.endTime || '15:00',
      },
    }));
  };

  const handleModalWeeklyCountChange = (newWeeklyCount: number) => {
    const defaultOrder = [1, 2, 3, 4, 5, 6, 0];
    const newSelectedDays: { [key: number]: { enabled: boolean; startTime: string; endTime: string } } = { ...modalSelectedDays };

    let enabledSoFar = 0;
    for (const dayId of defaultOrder) {
      if (enabledSoFar < newWeeklyCount) {
        newSelectedDays[dayId] = {
          enabled: true,
          startTime: modalSelectedDays[dayId]?.startTime || '14:00',
          endTime: modalSelectedDays[dayId]?.endTime || '15:00',
        };
        enabledSoFar++;
      } else {
        newSelectedDays[dayId] = {
          enabled: false,
          startTime: modalSelectedDays[dayId]?.startTime || '14:00',
          endTime: modalSelectedDays[dayId]?.endTime || '15:00',
        };
      }
    }
    setModalSelectedDays(newSelectedDays);
  };

  const updateModalDayTime = (dayId: number, field: 'startTime' | 'endTime', value: string) => {
    setModalSelectedDays((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value,
      },
    }));
  };

  const handleGenerateModalSchedule = async () => {
    if (!detailedPatient?.id) return;

    const plan = calculatePlanDetails(modalStartDate, modalEndDate, modalSelectedDays);
    if (plan.weeklyCount === 0) {
      toast({
        title: 'Selecione Horários',
        description: 'Selecione pelo menos 1 dia da semana para o Plano de Atendimento.',
        type: 'warning',
      });
      return;
    }

    if (plan.totalSessions <= 0) {
      toast({
        title: 'Datas Inválidas',
        description: 'A Data Final deve ser posterior à Data de Início.',
        type: 'warning',
      });
      return;
    }

    const activeSlots = Object.entries(modalSelectedDays)
      .filter(([_, data]) => data?.enabled)
      .map(([dayStr, data]) => {
        const dayNum = Number(dayStr);
        const luxonDay = dayNum === 0 ? 7 : dayNum;
        return {
          dayOfWeek: luxonDay,
          weekday: luxonDay,
          enabled: true,
          startTime: data.startTime,
          endTime: data.endTime,
        };
      });

    setGeneratingSchedule(true);
    try {
      const response = await api.put(`/patients/${detailedPatient.id}`, {
        schedulePlan: {
          totalSessions: plan.totalSessions,
          startDate: modalStartDate,
          endDate: modalEndDate,
          slots: activeSlots,
        },
      });

      const updatedData = response?.data || response;
      if (updatedData && Array.isArray(updatedData.appointments)) {
        setDetailedPatient(updatedData);
      } else {
        const res = await api.get(`/patients/${detailedPatient.id}`).catch(() => null);
        if (res) {
          setDetailedPatient(res.data || res);
        }
      }

      toast({
        title: 'Agendamentos Lançados na Agenda!',
        description: `Foram gerados ${plan.totalSessions} novos atendimentos para ${detailedPatient.name || detailedPatient.fullName}.`,
        type: 'success',
      });
      setModalEnablePlan(false);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Não foi possível lançar os agendamentos.';
      toast({
        title: 'Conflito de Horário / Erro',
        description: errorMsg,
        type: 'error',
      });
    } finally {
      setGeneratingSchedule(false);
    }
  };

  // Individual appointment editing & deletion modal state
  const [editingAppId, setEditingAppId] = useState<number | string | null>(null);
  const [editingAppForm, setEditingAppForm] = useState({ date: '', startTime: '', endTime: '', status: 'pendente' });
  const [savingAppEdit, setSavingAppEdit] = useState(false);

  const [deleteAppModalOpen, setDeleteAppModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<any | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState(false);

  const openDeleteAppointmentModal = (app: any) => {
    setAppointmentToDelete(app);
    setDeleteAppModalOpen(true);
  };

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete?.id) return;
    setDeletingAppointment(true);

    try {
      await api.delete(`/appointments/${appointmentToDelete.id}`);
      toast({
        title: 'Agendamento Excluído',
        description: 'O lançamento foi removido da agenda com sucesso.',
        type: 'info',
      });
      setDetailedPatient((prev: any) => ({
        ...prev,
        appointments: prev?.appointments?.filter((a: any) => String(a.id) !== String(appointmentToDelete.id)),
      }));
      setDeleteAppModalOpen(false);
      setAppointmentToDelete(null);
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Não foi possível remover o agendamento.',
        type: 'error',
      });
    } finally {
      setDeletingAppointment(false);
    }
  };

  const apiToUiStatus = (apiStatus?: string) => {
    switch (apiStatus?.toLowerCase()) {
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

  const uiToApiStatus = (uiStatus: string) => {
    switch (uiStatus) {
      case 'Agendado': return 'pendente';
      case 'Atendido': return 'finalizado';
      case 'Faltou': return 'ausente';
      case 'Faltou (com aviso prévio)': return 'desmarcado';
      case 'Faltou (sem aviso prévio)': return 'ausente';
      case 'Não atendido (Sem cobrança)': return 'cancelado';
      case 'Presença confirmada': return 'confirmado';
      default: return 'pendente';
    }
  };

  const handleUpdateAppointmentStatus = async (appId: number | string, newStatusUi: string) => {
    const targetApp = detailedPatient?.appointments?.find((a: any) => String(a.id) === String(appId));

    if (newStatusUi === 'Remarcar') {
      if (targetApp) {
        const formattedDate = targetApp.date ? String(targetApp.date).split('T')[0] : '';
        setEditingAppId(targetApp.id);
        setEditingAppForm({
          date: formattedDate,
          startTime: targetApp.startTime || '14:00',
          endTime: targetApp.endTime || '15:00',
          status: targetApp.status || 'pendente',
        });
      }
      return;
    }

    const apiStatus = uiToApiStatus(newStatusUi);

    try {
      await api.put(`/appointments/${appId}`, { status: apiStatus });
      toast({
        title: 'Status Atualizado',
        description: `Agendamento alterado para "${newStatusUi}".`,
        type: 'success',
      });
      setDetailedPatient((prev: any) => ({
        ...prev,
        appointments: prev?.appointments?.map((a: any) =>
          String(a.id) === String(appId) ? { ...a, status: apiStatus } : a
        ),
      }));
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err?.response?.data?.error || err?.message || 'Falha ao alterar o status do agendamento.',
        type: 'error',
      });
    }
  };

  const handleSaveAppointmentEdit = async (appId: number | string) => {
    setSavingAppEdit(true);
    try {
      await api.put(`/appointments/${appId}`, {
        date: editingAppForm.date,
        startTime: editingAppForm.startTime,
        endTime: editingAppForm.endTime,
        status: editingAppForm.status,
      });

      toast({
        title: 'Agendamento Atualizado',
        description: 'A data e horário do atendimento foram salvos com sucesso.',
        type: 'success',
      });

      setDetailedPatient((prev: any) => ({
        ...prev,
        appointments: prev?.appointments?.map((a: any) =>
          String(a.id) === String(appId)
            ? {
                ...a,
                date: editingAppForm.date,
                startTime: editingAppForm.startTime,
                endTime: editingAppForm.endTime,
                status: editingAppForm.status,
              }
            : a
        ),
      }));
      setEditingAppId(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Não foi possível salvar as alterações.';
      toast({
        title: 'Conflito de Horário / Erro',
        description: errorMsg,
        type: 'error',
      });
    } finally {
      setSavingAppEdit(false);
    }
  };

  // Edit Modal State (calls GET /patients/:id then PUT /patients/:id)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    birthdate: '',
    gender: 'Outro',
    userId: '' as string | number,
    templateId: '' as string | number,
    notes: '',
  });

  // Delete Modal State (calls DELETE /patients/:id)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<EssentialPatient | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch summary patients list & team therapists
  const loadInitialData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(debouncedSearch ? { q: debouncedSearch } : {})
    });

    Promise.all([
      api.get(`/patients?${params.toString()}`).catch(() => null),
      api.get('/team').catch(() => null),
    ])
      .then(([patientRes, teamRes]) => {
        const resData = patientRes?.data || patientRes;
        const patientData = resData?.data || (Array.isArray(resData) ? resData : []);
        const meta = resData?.meta;
        
        setPatients(patientData);
        if (meta) {
          setTotalPages(meta.lastPage || 1);
          setTotalRecords(meta.total || 0);
        } else {
          setTotalPages(1);
          setTotalRecords(patientData.length);
        }

        const teamData = Array.isArray(teamRes) ? teamRes : teamRes?.data || [];
        const activeTherapists = teamData.filter((t: any) =>
          (t.role === 'physiotherapist' || t.role === 'clinic_admin') && t.active !== false
        );
        setTherapists(activeTherapists);
      })
      .catch(() => {
        setPatients([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInitialData();
  }, [page, debouncedSearch]);



  // Calculate age from birthdate ISO string
  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Format date helper (safe against UTC timezone shift)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informada';
    try {
      const clean = String(dateStr).split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const openDetailsModal = (id: number | string) => {
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    setDetailedPatient(null);
    setDetailsTab('personal');
    setModalEnablePlan(false);

    const todayStr = new Date().toISOString().split('T')[0];
    setModalStartDate(todayStr);

    Promise.all([
      api.get(`/patients/${id}`).catch(() => null),
      api.get('/form-templates').catch(() => null),
      api.get('/team').catch(() => null)
    ])
      .then(([res, templateRes, teamRes]) => {
        const templateData = Array.isArray(templateRes) ? templateRes : templateRes?.data || [];
        setTemplates(templateData);

        if (teamRes) {
          const teamData = Array.isArray(teamRes) ? teamRes : teamRes?.data || [];
          const activeTherapists = teamData.filter((t: any) =>
            (t.role === 'physiotherapist' || t.role === 'clinic_admin') && t.active !== false
          );
          setTherapists(activeTherapists);
        }

        const data = res?.data || res;
        setDetailedPatient(data);
      })
      .catch(() => {
        setDetailedPatient(null);
      })
      .finally(() => setLoadingDetails(false));
  };

  // Save changes made inside live details modal
  const handleSaveModalPatient = async () => {
    if (!detailedPatient) return;
    setSavingDetails(true);

    const patientName = detailedPatient.name || detailedPatient.fullName || '';
    const rawTemplateId = detailedPatient.templateId ?? detailedPatient.template_id ?? detailedPatient.template?.id;
    const parsedTemplateId = rawTemplateId ? Number(rawTemplateId) : null;
    const rawUserId = detailedPatient.userId ?? detailedPatient.user_id ?? detailedPatient.user?.id;
    const parsedUserId = rawUserId ? Number(rawUserId) : null;
    const selectedTherapist = therapists.find((t) => String(t.id) === String(parsedUserId));

    const payload = {
      name: patientName.trim(),
      fullName: patientName.trim(),
      cpf: (detailedPatient.cpf || '').trim(),
      phone: (detailedPatient.phone || '').trim(),
      email: (detailedPatient.email || '').trim() || null,
      birthdate: detailedPatient.birthdate || detailedPatient.birthDate || null,
      birthDate: detailedPatient.birthdate || detailedPatient.birthDate || null,
      gender: detailedPatient.gender || 'Outro',
      sessionRate: Number(detailedPatient.sessionRate || detailedPatient.session_rate || 0),
      session_rate: Number(detailedPatient.sessionRate || detailedPatient.session_rate || 0),
      maritalStatus: detailedPatient.maritalStatus || detailedPatient.marital_status || 'Solteiro(a)',
      marital_status: detailedPatient.maritalStatus || detailedPatient.marital_status || 'Solteiro(a)',
      emergencyContact: (detailedPatient.emergencyContact || detailedPatient.emergency_contact || '').trim() || null,
      emergency_contact: (detailedPatient.emergencyContact || detailedPatient.emergency_contact || '').trim() || null,
      userId: parsedUserId,
      user_id: parsedUserId,
      templateId: parsedTemplateId,
      template_id: parsedTemplateId,
      notes: (detailedPatient.notes || '').trim() || null,
    };

    try {
      await api.put(`/patients/${detailedPatient.id}`, payload);

      const selectedTemp = templates.find((t) => String(t.id) === String(payload.templateId));

      setPatients((prev) =>
        prev.map((p) =>
          String(p.id) === String(detailedPatient.id)
            ? {
                ...p,
                name: payload.name,
                fullName: payload.name,
                cpf: payload.cpf,
                phone: payload.phone,
                email: payload.email || undefined,
                sessionRate: payload.sessionRate,
                session_rate: payload.session_rate,
                userId: payload.userId,
                user_id: payload.userId,
                user: selectedTherapist
                  ? { id: selectedTherapist.id, fullName: selectedTherapist.fullName || selectedTherapist.name, email: selectedTherapist.email }
                  : (payload.userId ? p.user : null),
                templateId: payload.templateId,
                template_id: payload.templateId,
                template: selectedTemp ? { id: selectedTemp.id, title: selectedTemp.title } : null,
              }
            : p
        )
      );

      toast({
        title: 'Dados Atualizados com Sucesso!',
        description: `As informações de ${payload.name} foram salvas.`,
        type: 'success',
      });
    } catch (err: any) {
      const serverErr = err?.response?.data?.error || err?.message || 'Não foi possível atualizar o cadastro.';
      toast({
        title: 'Erro ao Salvar',
        description: serverErr,
        type: 'error',
      });
    } finally {
      setSavingDetails(false);
    }
  };

  // 2. OPEN EDIT MODAL -> Calls GET /patients/:id, GET /form-templates, and GET /team to fetch full info for editing
  const openEditModal = (id: number | string) => {
    setEditingPatientId(id);
    setEditModalOpen(true);
    setLoadingEdit(true);

    Promise.all([
      api.get(`/patients/${id}`).catch(() => null),
      api.get('/form-templates').catch(() => null),
      api.get('/team').catch(() => null)
    ])
      .then(([res, templateRes, teamRes]) => {
        const templateData = Array.isArray(templateRes) ? templateRes : templateRes?.data || [];
        setTemplates(templateData);

        if (teamRes) {
          const teamData = Array.isArray(teamRes) ? teamRes : teamRes?.data || [];
          const activeTherapists = teamData.filter((t: any) =>
            (t.role === 'physiotherapist' || t.role === 'clinic_admin') && t.active !== false
          );
          setTherapists(activeTherapists);
        }

        const data = res?.data || res || {};
        const found = patients.find((p) => String(p.id) === String(id));
        setEditForm({
          name: data.name || data.fullName || found?.name || found?.fullName || '',
          cpf: data.cpf || found?.cpf || '',
          phone: data.phone || found?.phone || '',
          email: data.email || found?.email || '',
          birthdate: data.birthdate || data.birthDate || '',
          gender: data.gender || 'Outro',
          userId: data.userId ?? data.user_id ?? data.user?.id ?? found?.userId ?? found?.user_id ?? found?.user?.id ?? '',
          templateId: data.templateId || data.template?.id || found?.templateId || found?.template?.id || '',
          notes: data.notes || '',
        });
      })
      .finally(() => setLoadingEdit(false));
  };

  // Save patient edits via PUT /patients/:id
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatientId) return;

    setSavingEdit(true);
    const parsedEditTempId = editForm.templateId ? Number(editForm.templateId) : null;
    const parsedEditUserId = editForm.userId ? Number(editForm.userId) : null;
    const selectedTherapist = therapists.find((t) => String(t.id) === String(parsedEditUserId));

    const payload = {
      name: editForm.name.trim(),
      cpf: editForm.cpf.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim() || null,
      birthdate: editForm.birthdate || null,
      gender: editForm.gender,
      userId: parsedEditUserId,
      user_id: parsedEditUserId,
      templateId: parsedEditTempId,
      template_id: parsedEditTempId,
      notes: editForm.notes.trim() || null,
    };

    const selectedTemp = templates.find((t) => String(t.id) === String(editForm.templateId));

    api
      .put(`/patients/${editingPatientId}`, payload)
      .then(() => {
        // Update local list
        setPatients(
          patients.map((p) =>
            String(p.id) === String(editingPatientId)
              ? {
                  ...p,
                  name: payload.name,
                  fullName: payload.name,
                  cpf: payload.cpf,
                  phone: payload.phone,
                  email: payload.email || undefined,
                  userId: payload.userId,
                  user_id: payload.userId,
                  user: selectedTherapist
                    ? { id: selectedTherapist.id, fullName: selectedTherapist.fullName || selectedTherapist.name, email: selectedTherapist.email }
                    : (payload.userId ? p.user : null),
                  templateId: payload.templateId,
                  template_id: payload.templateId,
                  template: selectedTemp ? { id: selectedTemp.id, title: selectedTemp.title } : null,
                }
              : p
          )
        );

        toast({
          title: 'Paciente Atualizado!',
          description: `Os dados de ${payload.name} foram salvos com sucesso.`,
          type: 'success',
        });
        setEditModalOpen(false);
      })
      .catch((err: any) => {
        const serverErr = err?.response?.data?.error || err?.message || 'Erro ao atualizar dados do paciente.';
        toast({
          title: 'Erro ao Salvar',
          description: serverErr,
          type: 'error',
        });
      })
      .finally(() => {
        setSavingEdit(false);
      });
  };

  // 3. OPEN DELETE MODAL
  const openDeleteModal = (patient: EssentialPatient) => {
    setDeletingPatient(patient);
    setDeleteModalOpen(true);
  };

  // Confirm Delete via DELETE /patients/:id
  const handleConfirmDelete = () => {
    if (!deletingPatient) return;
    setDeleting(true);

    api
      .delete(`/patients/${deletingPatient.id}`)
      .catch(() => {})
      .finally(() => {
        setDeleting(false);
        setPatients(patients.filter((p) => String(p.id) !== String(deletingPatient.id)));
        toast({
          title: 'Paciente Removido',
          description: `O paciente "${deletingPatient.name || deletingPatient.fullName}" foi excluído.`,
          type: 'info',
        });
        setDeleteModalOpen(false);
      });
  };

  return (
    <>
      <Header
        title="Gestão de Pacientes"
        subtitle="Consulte, filtre e gerencie a lista de pacientes da clínica"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-full">
        {/* Control Bar: Search & New Patient Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden md:inline-block">
              Total: <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> pacientes
            </span>
            <Link
              href="/patients/new"
              prefetch={false}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Paciente</span>
            </Link>
          </div>
        </div>

        {/* Patients Interactive Table */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-400">Carregando lista essencial de pacientes...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700">Nenhum paciente encontrado</h3>
            <p className="text-sm text-slate-400">Tente buscar por outro termo ou cadastre um novo paciente.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Paciente</th>
                      <th className="py-3.5 px-4">Fisioterapeuta</th>
                      <th className="py-3.5 px-4">Contato</th>
                      <th className="py-3.5 px-4 hidden lg:table-cell">Cadastro</th>
                      <th className="py-3.5 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {patients.map((patient, idx) => {
                      const patientName = patient.name || patient.fullName || 'Paciente sem Nome';
                      const initial = patientName.charAt(0).toUpperCase();

                      return (
                        <motion.tr
                          key={patient.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: idx * 0.03 }}
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          {/* Paciente Column */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate group-hover:text-blue-600 transition-colors">
                                  {patientName}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Fisioterapeuta Column */}
                          <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="font-medium text-xs">
                                {patient.user?.fullName || patient.user?.name || 'Não vinculado'}
                              </span>
                            </div>
                          </td>

                          {/* Contato Column */}
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{patient.phone || '—'}</span>
                            </div>
                          </td>

                          {/* Cadastro Date Column */}
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap hidden lg:table-cell">
                            {formatDate(patient.createdAt)}
                          </td>

                          {/* Action Buttons Column */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center space-x-1.5">
                              {/* 1. Visualizar / Detalhes (Opens Modal GET /patients/:id) */}
                              <button
                                onClick={() => openDetailsModal(patient.id)}
                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-blue-200 dark:hover:border-slate-700 cursor-pointer"
                                title="Visualizar Informações Detalhadas"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* 2. Excluir Paciente Button */}
                              <button
                                onClick={() => openDeleteModal(patient)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800/40 cursor-pointer"
                                title="Excluir Paciente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden space-y-3 p-3 bg-slate-50">
                {patients.map((patient, idx) => {
                  const patientName = patient.name || patient.fullName || 'Paciente sem Nome';
                  const initial = patientName.charAt(0).toUpperCase();

                  return (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.03 }}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-sm truncate">{patientName}</p>
                          <div className="flex flex-col space-y-0.5 mt-0.5">
                            <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{patient.phone || 'S/ telefone'}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                          <User className="w-3 h-3 text-blue-500" />
                          <span className="truncate max-w-[120px]">{patient.user?.fullName || patient.user?.name || 'Clínica'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openDetailsModal(patient.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(patient)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 font-medium text-xs hover:bg-slate-50"
                >
                  Anterior
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 font-medium text-xs hover:bg-slate-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 1. MODAL DE DETALHES COMPLETOS DO PACIENTE (Bate na rota GET /patients/:id) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {detailsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setDetailsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-4xl space-y-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">
                      Prontuário & Edição do Paciente
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Visualize e edite informações pessoais, financeiro e agenda diretamente aqui
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              {loadingDetails ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold text-slate-400">Buscando dados completos na API...</p>
                </div>
              ) : detailedPatient ? (
                <div className="space-y-5 text-xs">
                  {/* Patient Primary Header Banner */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg border border-blue-400/30 shrink-0">
                        {(detailedPatient.name || detailedPatient.fullName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          {detailedPatient.name || detailedPatient.fullName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-slate-300 text-xs">
                          <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                            CPF: {detailedPatient.cpf || 'Não informado'}
                          </span>
                          <span className="bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-800 font-bold flex items-center space-x-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sessão: {formatCurrency(detailedPatient.sessionRate || detailedPatient.session_rate || 0)}</span>
                          </span>
                          {detailedPatient.gender && (
                            <span className="bg-slate-800 text-blue-300 px-2 py-0.5 rounded-md border border-slate-700">
                              {detailedPatient.gender}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveModalPatient}
                      disabled={savingDetails}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all shrink-0 flex items-center space-x-2 cursor-pointer"
                    >
                      {savingDetails ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Salvar Alterações</span>
                    </button>
                  </div>

                  {/* Concise Navigation Tabs Bar */}
                  <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl grid grid-cols-3 gap-1 border border-slate-200 dark:border-slate-700">
                    {[
                      { id: 'personal', label: 'Dados Pessoais', icon: User },
                      { id: 'financial', label: 'Financeiro', icon: DollarSign },
                      { id: 'appointments', label: 'Agenda', icon: Calendar },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = detailsTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDetailsTab(tab.id as any)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab 1: Dados Pessoais (Live Editable) */}
                  {detailsTab === 'personal' && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            value={detailedPatient.name || detailedPatient.fullName || ''}
                            onChange={(e) =>
                              setDetailedPatient({
                                ...detailedPatient,
                                name: e.target.value,
                                fullName: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            CPF *
                          </label>
                          <input
                            type="text"
                            value={detailedPatient.cpf || ''}
                            onChange={(e) =>
                              setDetailedPatient({
                                ...detailedPatient,
                                cpf: maskCpf(e.target.value),
                              })
                            }
                            placeholder="000.000.000-00"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Data de Nascimento
                          </label>
                          <input
                            type="date"
                            value={detailedPatient.birthdate || detailedPatient.birthDate || ''}
                            onChange={(e) =>
                              setDetailedPatient({
                                ...detailedPatient,
                                birthdate: e.target.value,
                                birthDate: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Gênero
                          </label>
                          <CustomSelect
                            value={detailedPatient.gender || 'Outro'}
                            onChange={(val) =>
                              setDetailedPatient({
                                ...detailedPatient,
                                gender: String(val),
                              })
                            }
                            size="sm"
                            options={[
                              { value: 'Feminino', label: 'Feminino' },
                              { value: 'Masculino', label: 'Masculino' },
                              { value: 'Outro', label: 'Outro' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Telefone / WhatsApp *
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={detailedPatient.phone || ''}
                              onChange={(e) =>
                                setDetailedPatient({
                                  ...detailedPatient,
                                  phone: formatPhone(e.target.value),
                                })
                              }
                              maxLength={15}
                              placeholder="(11) 99999-9999"
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                            {detailedPatient.phone && (
                              <a
                                href={`https://wa.me/55${detailedPatient.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl font-bold text-xs shrink-0 flex items-center space-x-1"
                                title="Abrir WhatsApp"
                              >
                                <span>WA</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Estado Civil
                          </label>
                          <CustomSelect
                            value={detailedPatient.maritalStatus || detailedPatient.marital_status || 'Solteiro(a)'}
                            onChange={(val) =>
                              setDetailedPatient({
                                ...detailedPatient,
                                maritalStatus: String(val),
                                marital_status: String(val),
                              })
                            }
                            size="sm"
                            options={[
                              { value: 'Solteiro(a)', label: 'Solteiro(a)' },
                              { value: 'Casado(a)', label: 'Casado(a)' },
                              { value: 'Divorciado(a)', label: 'Divorciado(a)' },
                              { value: 'Viúvo(a)', label: 'Viúvo(a)' },
                              { value: 'União Estável', label: 'União Estável' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Telefone de Emergência
                          </label>
                          <input
                            type="text"
                            value={detailedPatient.emergencyContact || detailedPatient.emergency_contact || ''}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              setDetailedPatient({
                                ...detailedPatient,
                                emergencyContact: formatted,
                                emergency_contact: formatted,
                              });
                            }}
                            maxLength={15}
                            placeholder="(11) 98888-8888"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            E-mail
                          </label>
                          <input
                            type="email"
                            value={detailedPatient.email || ''}
                            onChange={(e) =>
                              setDetailedPatient({
                                ...detailedPatient,
                                email: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Fisioterapeuta Responsável
                          </label>
                          <CustomSelect
                            value={detailedPatient.userId ?? detailedPatient.user_id ?? detailedPatient.user?.id ?? ''}
                            onChange={(val) => {
                              const selected = therapists.find((t) => String(t.id) === String(val));
                              setDetailedPatient({
                                ...detailedPatient,
                                userId: val ? Number(val) : null,
                                user_id: val ? Number(val) : null,
                                user: selected ? { id: selected.id, fullName: selected.fullName || selected.name, email: selected.email } : null,
                              });
                            }}
                            size="sm"
                            options={[
                              { value: '', label: 'Sem fisioterapeuta vinculado' },
                              ...therapists.map((t) => ({
                                value: t.id,
                                label: `${t.fullName || t.name || t.email}${t.crefito ? ` (CREFITO: ${t.crefito})` : ''}`,
                              })),
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Valor por Sessão (R$)
                          </label>
                          <CurrencyInput
                            value={Number(detailedPatient.sessionRate || detailedPatient.session_rate || 0)}
                            onChange={(val) =>
                              setDetailedPatient({
                                ...detailedPatient,
                                sessionRate: val,
                                session_rate: val,
                              })
                            }
                            placeholder="R$ 150,00"
                          />
                        </div>
                      </div>


                    </div>
                  )}


                  {/* Tab 3: Financeiro & Valor por Sessão (Live Editable) */}
                  {detailsTab === 'financial' && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/80 p-5 rounded-xl border border-emerald-200 space-y-3">
                          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                            Valor Acordado por Sessão (R$)
                          </label>
                          <CurrencyInput
                            value={detailedPatient.sessionRate || detailedPatient.session_rate || 0}
                            onChange={(val) =>
                              setDetailedPatient({
                                ...detailedPatient,
                                sessionRate: val,
                                session_rate: val,
                              })
                            }
                            placeholder="R$ 150,00"
                          />
                          <p className="text-[11px] text-emerald-700">
                            Altere o valor acima para atualizar a base de baixa no financeiro.
                          </p>
                        </div>

                        <div className="bg-blue-50/80 p-5 rounded-xl border border-blue-200 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Resumo de Sessões & Faturamento</p>
                          <div className="space-y-1.5 text-slate-800 text-xs">
                            <p><strong className="text-slate-900">Total de Agendamentos:</strong> {detailedPatient.appointments?.length || 0} sessões</p>
                            <p><strong className="text-slate-900">Concluídas / Baixadas:</strong> {detailedPatient.appointments?.filter((a: any) => a.status === 'finalizado').length || 0} sessões</p>
                            <p>
                              <strong className="text-slate-900">Estimativa Total Tratamento:</strong>{' '}
                              <span className="font-extrabold text-blue-900 text-sm">
                                {formatCurrency((Number(detailedPatient.sessionRate || detailedPatient.session_rate || 0)) * (detailedPatient.appointments?.length || 0))}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Agenda de Atendimentos */}
                  {detailsTab === 'appointments' && (() => {
                    const apps = detailedPatient.appointments || [];
                    const firstApp = apps.length > 0 ? apps[0] : null;
                    const lastApp = apps.length > 0 ? apps[apps.length - 1] : null;
                    const plan = calculatePlanDetails(modalStartDate, modalEndDate, modalSelectedDays);

                    return (
                      <div className="space-y-4 pt-1 text-xs">
                        {/* Emergency Contact Highlight Banner */}
                        <div className="bg-gradient-to-r from-red-50 to-amber-50/80 border-2 border-red-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center space-x-3 text-red-900">
                            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm animate-pulse">
                              <Phone className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-red-900 text-xs uppercase tracking-wider">Contato de Emergência</span>
                                <span className="bg-red-200 text-red-900 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Emergência</span>
                              </div>
                              <p className="font-mono font-black text-red-950 text-sm tracking-wide">
                                {detailedPatient.emergencyContact || detailedPatient.emergency_contact || 'Não cadastrado'}
                              </p>
                            </div>
                          </div>

                          {(detailedPatient.emergencyContact || detailedPatient.emergency_contact) && (
                            <a
                              href={`tel:${(detailedPatient.emergencyContact || detailedPatient.emergency_contact || '').replace(/\D/g, '')}`}
                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all shrink-0 cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Ligar Emergência</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>Plano de Atendimento & Datas do Tratamento</span>
                          </h5>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setModalEnablePlan(!modalEnablePlan)}
                              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                                modalEnablePlan
                                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                              }`}
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>{modalEnablePlan ? 'Fechar Gerador' : 'Gerar / Atualizar Plano'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive Schedule Plan Generator Card */}
                        {modalEnablePlan && (
                          <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                              <span className="font-bold text-blue-900 text-xs uppercase tracking-wider">
                                Gerar Agendamentos Recorrentes na Agenda
                              </span>
                              <span className="text-[11px] text-blue-700 font-medium">Defina o período e os horários</span>
                            </div>

                            {/* 3 Columns Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                                  Qtd. por Semana *
                                </label>
                                <CustomSelect
                                  value={plan.weeklyCount || 1}
                                  onChange={(val) => handleModalWeeklyCountChange(Number(val))}
                                  size="sm"
                                  options={[1, 2, 3, 4, 5, 6, 7].map((val) => ({
                                    value: val,
                                    label: `${val}x / semana (~${val * 4} / mês)`,
                                  }))}
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                                  Data de Início *
                                </label>
                                <input
                                  type="date"
                                  value={modalStartDate}
                                  onChange={(e) => setModalStartDate(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                                  Data Final do Tratamento *
                                </label>
                                <input
                                  type="date"
                                  value={modalEndDate}
                                  onChange={(e) => setModalEndDate(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Indicators */}
                            <div className="bg-white p-3 rounded-lg border border-blue-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <span>Frequência: <strong className="text-blue-900">{plan.weeklyCount}x/semana</strong></span>
                              <span>Projeção Mensal: <strong className="text-emerald-900">~{plan.monthlyCount} atendimentos/mês</strong></span>
                              <span>Total de Atendimentos: <strong className="text-slate-900">{plan.totalSessions} sessões geradas</strong></span>
                            </div>

                            {/* Rule Banner */}
                            <div className="bg-indigo-50/80 border border-indigo-200/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900">
                              <span className="font-medium flex items-center space-x-1">
                                <span>📌</span>
                                <span><strong>1ª Sessão:</strong> Avaliação Inicial | <strong>1º Atendimento do Mês:</strong> Reavaliação Mensal</span>
                              </span>
                              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase">Regra do Sistema</span>
                            </div>

                            {/* Weekdays Checkboxes */}
                            <div className="space-y-2">
                              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                                Dias da Semana & Horários Disponíveis *
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {WEEKDAYS.map((day) => {
                                  const dayConfig = modalSelectedDays[day.id] || { enabled: false, startTime: '14:00', endTime: '15:00' };
                                  const isSelected = dayConfig.enabled;

                                  return (
                                    <div
                                      key={day.id}
                                      className={`p-2 rounded-lg border text-xs transition-all space-y-1 ${
                                        isSelected ? 'bg-white border-blue-400' : 'bg-slate-100/70 border-slate-200 text-slate-400'
                                      }`}
                                    >
                                      <div
                                        onClick={() => toggleModalDaySelection(day.id)}
                                        className="flex items-center justify-between cursor-pointer select-none"
                                      >
                                        <span className={`font-bold text-[11px] ${isSelected ? 'text-blue-900' : 'text-slate-500'}`}>
                                          {day.label}
                                        </span>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 cursor-pointer"
                                        />
                                      </div>

                                      {isSelected && (
                                        <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-100">
                                          <input
                                            type="time"
                                            value={dayConfig.startTime}
                                            onChange={(e) => updateModalDayTime(day.id, 'startTime', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] font-mono font-bold text-slate-800"
                                          />
                                          <input
                                            type="time"
                                            value={dayConfig.endTime}
                                            onChange={(e) => updateModalDayTime(day.id, 'endTime', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] font-mono font-bold text-slate-800"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                disabled={generatingSchedule}
                                onClick={handleGenerateModalSchedule}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all disabled:opacity-50 shadow-xs"
                              >
                                {generatingSchedule ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Lançar {plan.totalSessions} Agendamentos na Agenda</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Date Summary Badges */}
                        {apps.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs">
                            <div>
                              <p className="text-[10px] font-bold text-blue-800 uppercase">Início do Tratamento</p>
                              <p className="font-extrabold text-slate-900 text-sm">{formatDate(firstApp?.date)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-800 uppercase flex items-center space-x-1">
                                <span>Término Previsto</span>
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-mono">calculado</span>
                              </p>
                              <p className="font-extrabold text-emerald-950 text-sm">{formatDate(lastApp?.date)}</p>
                            </div>
                          </div>
                        )}

                        {/* Appointments List */}
                        {apps.length > 0 ? (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {apps.map((app: any, idx: number) => {
                              const isEditingThis = String(editingAppId) === String(app.id);
                              const statusStyle = getAppointmentStatusStyle(app.status);

                              return (
                                <div
                                  key={app.id || idx}
                                  className={`p-3 rounded-xl border transition-all space-y-2 ${statusStyle.cardClass} ${statusStyle.barClass}`}
                                >
                                  {isEditingThis ? (
                                    <div className="space-y-2.5 bg-white p-3 rounded-lg border border-blue-300">
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Data</label>
                                          <input
                                            type="date"
                                            value={editingAppForm.date}
                                            onChange={(e) => setEditingAppForm({ ...editingAppForm, date: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Início</label>
                                          <input
                                            type="time"
                                            value={editingAppForm.startTime}
                                            onChange={(e) => setEditingAppForm({ ...editingAppForm, startTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Término</label>
                                          <input
                                            type="time"
                                            value={editingAppForm.endTime}
                                            onChange={(e) => setEditingAppForm({ ...editingAppForm, endTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-xs"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
                                        <button
                                          type="button"
                                          onClick={() => setEditingAppId(null)}
                                          className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          disabled={savingAppEdit}
                                          onClick={() => handleSaveAppointmentEdit(app.id)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] flex items-center space-x-1 disabled:opacity-50"
                                        >
                                          {savingAppEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                          <span>Salvar Atendimento</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between text-xs gap-2">
                                      <div className="flex items-center space-x-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg ${statusStyle.iconBg} flex items-center justify-center font-bold shrink-0 shadow-xs`}>
                                          <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <p className="font-bold text-slate-900 truncate">{formatDate(app.date)}</p>
                                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${statusStyle.badgeClass}`}>
                                              {statusStyle.label}
                                            </span>
                                          </div>
                                          <p className="text-[11px] opacity-75 font-mono">
                                            {app.startTime} - {app.endTime} ({app.specialty || 'Atendimento'})
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2 shrink-0">
                                        {/* Status Dropdown */}
                                        <select
                                          value={apiToUiStatus(app.status)}
                                          onChange={(e) => handleUpdateAppointmentStatus(app.id, e.target.value)}
                                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                                            app.status === 'finalizado'
                                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-extrabold shadow-xs'
                                              : app.status === 'confirmado'
                                              ? 'bg-blue-100 text-blue-900 border-blue-400 font-extrabold shadow-xs'
                                              : app.status === 'ausente' || app.status === 'cancelado' || app.status === 'desmarcado'
                                              ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold shadow-xs'
                                              : 'bg-white text-slate-800 border-slate-300 font-semibold shadow-xs'
                                          }`}
                                        >
                                          <option value="Agendado">🔵 Agendado</option>
                                          <option value="Atendido">🟢 Atendido</option>
                                          <option value="Faltou">🔴 Faltou</option>
                                          <option value="Faltou (com aviso prévio)">🟡 Faltou (com aviso prévio)</option>
                                          <option value="Faltou (sem aviso prévio)">🟠 Faltou (sem aviso prévio)</option>
                                          <option value="Não atendido (Sem cobrança)">⚫ Não atendido (Sem cobrança)</option>
                                          <option value="Presença confirmada">🔵 Presença confirmada</option>
                                          <option value="Remarcar">🩵 Remarcar</option>
                                        </select>

                                        {/* Edit Button */}
                                        <button
                                          type="button"
                                          title="Alterar Data / Horário"
                                          onClick={() => {
                                            const formattedDate = app.date ? String(app.date).split('T')[0] : '';
                                            setEditingAppForm({
                                              date: formattedDate,
                                              startTime: app.startTime || '14:00',
                                              endTime: app.endTime || '15:00',
                                              status: app.status || 'pendente',
                                            });
                                            setEditingAppId(app.id);
                                          }}
                                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer bg-white/80"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                          type="button"
                                          title="Excluir este agendamento"
                                          onClick={() => openDeleteAppointmentModal(app)}
                                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-white/80"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-500 italic text-center text-xs">
                            Nenhum atendimento agendado para este paciente.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Cadastrado em {formatDate(detailedPatient.createdAt)}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSaveModalPatient}
                        disabled={savingDetails}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {savingDetails ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Salvar Alterações</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailsModalOpen(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. MODAL DE EDIÇÃO DO PACIENTE (Carrega GET /patients/:id e faz PUT)      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setEditModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-xl space-y-5 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <Edit3 className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-800 text-lg">Editar Dados do Paciente</h3>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingEdit ? (
                <div className="py-12 flex justify-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        CPF *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.cpf}
                        placeholder="000.000.000-00"
                        onChange={(e) => setEditForm({ ...editForm, cpf: maskCpf(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Telefone *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.phone}
                        placeholder="(11) 99999-9999"
                        onChange={(e) => setEditForm({ ...editForm, phone: maskPhone(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={editForm.birthdate ? editForm.birthdate.split('T')[0] : ''}
                        onChange={(e) => setEditForm({ ...editForm, birthdate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Gênero
                      </label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro / Prefiro não informar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Fisioterapeuta Responsável
                      </label>
                      <select
                        value={editForm.userId}
                        onChange={(e) => setEditForm({ ...editForm, userId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Sem fisioterapeuta vinculado</option>
                        {therapists.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName || t.name || t.email}{t.crefito ? ` (CREFITO: ${t.crefito})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Avaliação Associada
                      </label>
                      <select
                        value={editForm.templateId}
                        onChange={(e) => setEditForm({ ...editForm, templateId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Nenhuma Avaliação Vinculada</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Observações Clínicas
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(false)}
                      className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5"
                    >
                      {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. MODAL DE EXCLUSÃO DE PACIENTE (Bate em DELETE /patients/:id)            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteModalOpen && deletingPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setDeleteModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center space-x-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Excluir Paciente</h3>
                  <p className="text-xs text-slate-500">Confirmação de exclusão definitiva</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza que deseja excluir o cadastro do paciente{' '}
                <strong className="text-slate-800 font-bold">{deletingPatient.name || deletingPatient.fullName}</strong>?
                Esta ação removerá os dados do sistema e não poderá ser desfeita.
              </p>

              <div className="pt-2 flex items-center justify-end space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Delete Appointment Confirmation Modal */}
      <AnimatePresence>
        {deleteAppModalOpen && appointmentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => {
                setDeleteAppModalOpen(false);
                setAppointmentToDelete(null);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center space-x-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Excluir Agendamento</h3>
                  <p className="text-xs text-slate-500">Confirmação de exclusão do atendimento</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-700">
                <p><strong className="text-slate-900">Data do Atendimento:</strong> {formatDate(appointmentToDelete.date)}</p>
                <p><strong className="text-slate-900">Horário:</strong> {appointmentToDelete.startTime} - {appointmentToDelete.endTime}</p>
                <p><strong className="text-slate-900">Especialidade:</strong> {appointmentToDelete.specialty || 'Atendimento Fisioterapêutico'}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza que deseja cancelar e excluir este agendamento? Caso já tenha sido baixado, o registro no financeiro também será ajustado.
              </p>

              <div className="pt-2 flex items-center justify-end space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteAppModalOpen(false);
                    setAppointmentToDelete(null);
                  }}
                  className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAppointment}
                  disabled={deletingAppointment}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  {deletingAppointment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Sim, Excluir Agendamento</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </>
  );
}
