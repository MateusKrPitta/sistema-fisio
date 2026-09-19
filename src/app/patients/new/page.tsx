'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  User,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/toast-context';
import { useAuth } from '@/context/auth-context';
import { CustomSelect } from '@/components/custom-select';
import { CurrencyInput } from '@/components/currency-input';

const WEEKDAYS = [
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

function calculatePlanDetails(
  startDateStr: string,
  endDateStr: string,
  selectedDays: Record<number, { enabled: boolean; startTime: string; endTime: string }>
) {
  const activeDayIds = Object.entries(selectedDays)
    .filter(([_, config]) => config.enabled)
    .map(([dayId]) => Number(dayId));

  const weeklyCount = activeDayIds.length;
  const monthlyCount = weeklyCount * 4; // Analogia: Ex: 3x por semana = ~12 por mês

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

export default function NewPatientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Feminino');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sessionRate, setSessionRate] = useState<number>(150);
  const [maritalStatus, setMaritalStatus] = useState('Solteiro(a)');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Responsible Physiotherapist State
  const [therapists, setTherapists] = useState<any[]>([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState<number | string>('');
  const [loadingTherapists, setLoadingTherapists] = useState(false);

  // Recurring Treatment Plan & Schedule State
  const [enableSchedulePlan, setEnableSchedulePlan] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<{ [key: number]: { enabled: boolean; startTime: string; endTime: string } }>({
    1: { enabled: true, startTime: '14:00', endTime: '15:00' }, // Segunda
    3: { enabled: true, startTime: '14:00', endTime: '15:00' }, // Quarta
    5: { enabled: false, startTime: '14:00', endTime: '15:00' }, // Sexta
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch clinic team members to populate physiotherapists select
  useEffect(() => {
    setLoadingTherapists(true);
    api.get('/team')
      .then((res) => {
        const teamData = Array.isArray(res) ? res : res?.data || [];
        const activeTherapists = teamData.filter((t: any) =>
          (t.role === 'physiotherapist' || t.role === 'clinic_admin') && t.active !== false
        );
        setTherapists(activeTherapists);

        if (user?.id && activeTherapists.some((t: any) => String(t.id) === String(user.id))) {
          setSelectedTherapistId(user.id);
        } else if (activeTherapists.length > 0) {
          setSelectedTherapistId(activeTherapists[0].id);
        }
      })
      .catch(() => {
        setTherapists([]);
      })
      .finally(() => setLoadingTherapists(false));
  }, [user]);

  // Auto set default endDate to 1 month after startDate if empty
  useEffect(() => {
    if (startDate && !endDate) {
      const start = new Date(startDate + 'T00:00:00');
      start.setMonth(start.getMonth() + 1);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const d = String(start.getDate()).padStart(2, '0');
      setEndDate(`${y}-${m}-${d}`);
    }
  }, [startDate]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

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

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const toggleDaySelection = (dayId: number) => {
    setSelectedDays((prev) => ({
      ...prev,
      [dayId]: {
        enabled: !prev[dayId]?.enabled,
        startTime: prev[dayId]?.startTime || '14:00',
        endTime: prev[dayId]?.endTime || '15:00',
      },
    }));
  };

  const handleWeeklyCountChange = (newWeeklyCount: number) => {
    const defaultOrder = [1, 2, 3, 4, 5, 6, 0];
    const newSelectedDays: { [key: number]: { enabled: boolean; startTime: string; endTime: string } } = { ...selectedDays };

    let enabledSoFar = 0;
    for (const dayId of defaultOrder) {
      if (enabledSoFar < newWeeklyCount) {
        newSelectedDays[dayId] = {
          enabled: true,
          startTime: selectedDays[dayId]?.startTime || '14:00',
          endTime: selectedDays[dayId]?.endTime || '15:00',
        };
        enabledSoFar++;
      } else {
        newSelectedDays[dayId] = {
          enabled: false,
          startTime: selectedDays[dayId]?.startTime || '14:00',
          endTime: selectedDays[dayId]?.endTime || '15:00',
        };
      }
    }

    setSelectedDays(newSelectedDays);
  };

  const updateDayTime = (dayId: number, field: 'startTime' | 'endTime', value: string) => {
    setSelectedDays((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build schedule plan payload if enabled
      let schedulePlanPayload = undefined;
      let generatedSessionsCount = 0;
      if (enableSchedulePlan) {
        const planDetails = calculatePlanDetails(startDate, endDate, selectedDays);
        generatedSessionsCount = planDetails.totalSessions;

        const activeSlots = Object.entries(selectedDays)
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

        if (activeSlots.length === 0) {
          setError('Selecione pelo menos 1 dia da semana para o Plano de Atendimento.');
          setLoading(false);
          return;
        }

        if (generatedSessionsCount <= 0) {
          setError('A Data Final deve ser posterior à Data de Início.');
          setLoading(false);
          return;
        }

        schedulePlanPayload = {
          totalSessions: generatedSessionsCount,
          startDate,
          endDate,
          slots: activeSlots,
        };
      }

      await api.post('/patients', {
        name: fullName,
        fullName,
        cpf,
        birthdate: birthDate,
        birthDate,
        gender,
        phone,
        email: email || null,
        sessionRate: Number(sessionRate) || 0,
        session_rate: Number(sessionRate) || 0,
        maritalStatus,
        marital_status: maritalStatus,
        emergencyContact: emergencyContact || null,
        emergency_contact: emergencyContact || null,
        userId: selectedTherapistId ? Number(selectedTherapistId) : user?.id,
        user_id: selectedTherapistId ? Number(selectedTherapistId) : user?.id,
        schedulePlan: schedulePlanPayload,
      });

      const successMsg = enableSchedulePlan
        ? `O paciente ${fullName} foi cadastrado e ${generatedSessionsCount} agendamentos foram lançados na sua Agenda!`
        : `O paciente ${fullName} foi cadastrado com sucesso.`;

      toast({
        title: 'Paciente Cadastrado com Sucesso!',
        description: successMsg,
        type: 'success',
      });

      router.push('/patients');
    } catch (err: any) {
      let errMsg = 'Erro ao cadastrar paciente.';
      if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      } else if (Array.isArray(err.response?.data?.errors)) {
        errMsg = err.response.data.errors.map((e: any) => e.message).join(' | ');
      } else if (err.message) {
        errMsg = err.message;
      }

      setError(errMsg);
      toast({
        title: 'Conflito de Horário / Erro',
        description: errMsg,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Cadastrar Novo Paciente" subtitle="Preencha os dados do paciente e programe os horários de atendimento na agenda" />

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto max-w-4xl max-w-full">
        <Link
          href="/patients"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Pacientes</span>
        </Link>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 md:p-8 space-y-8">
          {/* Section 1: Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-base sm:text-lg border-b border-slate-100 pb-3 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Dados Pessoais & Contato</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Nome Completo do Paciente *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Maria das Dores Silva"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              {/* Fisioterapeuta Responsável */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Fisioterapeuta Responsável *
                </label>
                {therapists.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    {loadingTherapists ? 'Carregando profissionais da clínica...' : 'Nenhum profissional disponível.'}
                  </div>
                ) : (
                  <CustomSelect
                    value={selectedTherapistId}
                    onChange={(val) => setSelectedTherapistId(Number(val))}
                    options={therapists.map((t) => ({
                      value: t.id,
                      label: `${t.fullName || t.name || t.email}${t.crefito ? ` (CREFITO: ${t.crefito})` : ''} - ${t.role === 'clinic_admin' ? 'Administrador(a)' : 'Fisioterapeuta'}`,
                    }))}
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  O paciente será vinculado ao profissional selecionado e também ficará visível para a administração da clínica.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  CPF (com formatação) *
                </label>
                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Gênero *
                </label>
                <CustomSelect
                  value={gender}
                  onChange={(val) => setGender(String(val))}
                  options={[
                    { value: 'Feminino', label: 'Feminino' },
                    { value: 'Masculino', label: 'Masculino' },
                    { value: 'Outro', label: 'Outro' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Estado Civil
                </label>
                <CustomSelect
                  value={maritalStatus}
                  onChange={(val) => setMaritalStatus(String(val))}
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
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={15}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Telefone de Emergência
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(formatPhone(e.target.value))}
                  maxLength={15}
                  placeholder="(11) 98888-8888"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Valor por Sessão (R$) *
                </label>
                <CurrencyInput
                  value={sessionRate}
                  onChange={(val) => setSessionRate(val)}
                  placeholder="R$ 150,00"
                />
              </div>
            </div>
          </div>

          {/* Section 3: NEW! Plano de Atendimento & Lançamento Recorrente na Agenda */}
          <div className="bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                    Plano de Atendimento & Lançamento na Agenda
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina a quantidade de sessões e horários semanais para criar os agendamentos automaticamente
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableSchedulePlan}
                  onChange={(e) => setEnableSchedulePlan(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {enableSchedulePlan && (() => {
              const plan = calculatePlanDetails(startDate, endDate, selectedDays);
              const formattedStartDate = startDate ? startDate.split('-').reverse().join('/') : '--/--/----';
              const formattedEndDate = endDate ? endDate.split('-').reverse().join('/') : '--/--/----';

              return (
                <div className="space-y-5 pt-3 border-t border-blue-200/60 text-xs">
                  {/* 3-Column Plan Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Quantidade por Semana (Select 1x a 7x) */}
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2 text-blue-900 flex items-center justify-between">
                        <span>Qtd. por Semana *</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold lowercase">até 7x/sem</span>
                      </label>
                      <CustomSelect
                        value={plan.weeklyCount || 1}
                        onChange={(val) => handleWeeklyCountChange(Number(val))}
                        size="sm"
                        options={[1, 2, 3, 4, 5, 6, 7].map((val) => ({
                          value: val,
                          label: `${val}x / semana (~${val * 4} atendimentos/mês)`,
                        }))}
                      />
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">~{plan.monthlyCount} atendimentos / mês</p>
                    </div>

                    {/* 2. Data de Início do Tratamento */}
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Data de Início *
                      </label>
                      <input
                        type="date"
                        required={enableSchedulePlan}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Primeiro atendimento</p>
                    </div>

                    {/* 3. Data Final do Tratamento */}
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Data Final do Tratamento *
                      </label>
                      <input
                        type="date"
                        required={enableSchedulePlan}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Período de agendamento</p>
                    </div>
                  </div>

                  {/* Summary Indicators Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-blue-200 shadow-sm text-xs">
                    <div className="flex flex-col space-y-1.5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span>Frequência Semanal</span>
                      </span>
                      <span className="font-extrabold text-blue-900 text-sm">
                        {plan.weeklyCount} <span className="text-xs font-semibold text-blue-700/80">sessões/sem</span>
                      </span>
                    </div>

                    <div className="flex flex-col space-y-1.5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>Total no Período</span>
                      </span>
                      <span className="font-extrabold text-emerald-900 text-sm">
                        {plan.totalSessions} <span className="text-xs font-semibold text-emerald-700/80">atendimentos</span>
                      </span>
                    </div>

                    <div className="flex flex-col space-y-1.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span>Duração Estimada</span>
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm">
                        ~{plan.durationWeeks} <span className="text-xs font-semibold text-slate-500">semana(s)</span>
                      </span>
                    </div>
                  </div>
                  {/* Rule Banner */}
                  <div className="bg-indigo-50/80 border border-indigo-200/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900">
                    <span className="font-medium flex items-center space-x-1">
                      <span>📌</span>
                      <span><strong>1ª Sessão:</strong> Avaliação Inicial | <strong>1º Atendimento do Mês:</strong> Reavaliação Mensal</span>
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase">Regra do Sistema</span>
                  </div>

                  {/* Days of the Week & Time Selection */}
                  <div className="space-y-3">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Dias da Semana & Horários Disponíveis *
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {WEEKDAYS.map((day) => {
                        const dayConfig = selectedDays[day.id] || { enabled: false, startTime: '14:00', endTime: '15:00' };
                        const isSelected = dayConfig.enabled;

                        return (
                          <div
                            key={day.id}
                            className={`p-3 rounded-xl border transition-all space-y-2 ${
                              isSelected
                                ? 'bg-white border-blue-400 shadow-xs'
                                : 'bg-white/60 border-slate-200 text-slate-500'
                            }`}
                          >
                            <div
                              onClick={() => toggleDaySelection(day.id)}
                              className="flex items-center justify-between cursor-pointer select-none"
                            >
                              <span className={`font-bold text-xs ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>
                                {day.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>

                            {isSelected && (
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Início</span>
                                  <input
                                    type="time"
                                    value={dayConfig.startTime}
                                    onChange={(e) => updateDayTime(day.id, 'startTime', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Término</span>
                                  <input
                                    type="time"
                                    value={dayConfig.endTime}
                                    onChange={(e) => updateDayTime(day.id, 'endTime', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Banner Preview */}
                  <div className="bg-blue-600 text-white p-4 rounded-xl flex items-center space-x-3 shadow-sm">
                    <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
                    <p className="text-xs leading-relaxed font-medium">
                      Serão gerados <strong>{plan.totalSessions} atendimentos</strong> automaticamente na Agenda com frequência de{' '}
                      <strong>{plan.weeklyCount}x/semana</strong> (~<strong>{plan.monthlyCount} atendimentos/mês</strong>) no período de{' '}
                      <strong>{formattedStartDate}</strong> a <strong>{formattedEndDate}</strong>.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-4">
            <Link
              href="/patients"
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors text-center"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Paciente & Lançar na Agenda</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
