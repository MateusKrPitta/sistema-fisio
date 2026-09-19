'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Users,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Trash2,
  Edit2,
  SlidersHorizontal,
  RotateCcw,
  X,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { CurrencyInput, formatCurrency } from '@/components/currency-input';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface FinancialRecord {
  id: number;
  userId: number;
  patientId: number | null;
  appointmentId: number | null;
  title: string;
  amount: number;
  type: 'receita' | 'despesa';
  status: 'baixado' | 'pendente' | 'cancelado';
  paymentMethod: string;
  date: string;
  paidAt: string | null;
  patient?: {
    id: number;
    name: string;
    fullName?: string;
    cpf?: string;
    sessionRate?: number;
  };
}

export default function FinancialPage() {
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<'month' | 'today' | 'week' | 'all'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'baixado' | 'pendente' | 'cancelado'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [meta, setMeta] = useState({
    total: 0,
    perPage: 10,
    currentPage: 1,
    lastPage: 1,
  });

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState({
    totalBaixado: 0,
    totalPendente: 0,
    totalCancelado: 0,
    totalDespesas: 0,
    saldoLiquido: 0,
    sessoesBaixadasCount: 0,
    totalRecordsCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Active Applied Filters
  const [filterPatientId, setFilterPatientId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Temporary Filter Modal State (buffered until user clicks 'Aplicar')
  const [tempPatientId, setTempPatientId] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [tempStatus, setTempStatus] = useState<'all' | 'baixado' | 'pendente' | 'cancelado'>('all');

  // Custom Patient Dropdown Search in Modal
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  // Form State for new transaction
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState<number>(150);
  const [newType, setNewType] = useState<'receita' | 'despesa'>('receita');
  const [newStatus, setNewStatus] = useState<'baixado' | 'pendente'>('baixado');
  const [newPaymentMethod, setNewPaymentMethod] = useState('pix');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPatientId, setNewPatientId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPatientsList = async () => {
    if (patientsList.length > 0 || loadingPatients) return;
    setLoadingPatients(true);
    try {
      const res: any = await api.get('/patients').catch(() => null);
      const raw = Array.isArray(res) ? res : res?.data || [];
      setPatientsList(raw);
    } catch {
      // ignore
    } finally {
      setLoadingPatients(false);
    }
  };

  const openFilterModal = () => {
    fetchPatientsList();
    setTempPatientId(filterPatientId);
    setTempStartDate(filterStartDate);
    setTempEndDate(filterEndDate);
    setTempStatus(statusFilter);
    setPatientDropdownOpen(false);
    setPatientSearchTerm('');
    setShowFilterModal(true);
  };

  const openNewModal = () => {
    fetchPatientsList();
    setShowNewModal(true);
  };

  const handleApplyFilters = () => {
    setFilterPatientId(tempPatientId);
    setFilterStartDate(tempStartDate);
    setFilterEndDate(tempEndDate);
    setStatusFilter(tempStatus);
    setPage(1);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setFilterPatientId('');
    setFilterStartDate('');
    setFilterEndDate('');
    setStatusFilter('all');
    setTempPatientId('');
    setTempStartDate('');
    setTempEndDate('');
    setTempStatus('all');
    setPatientDropdownOpen(false);
    setPatientSearchTerm('');
    setPage(1);
    setShowFilterModal(false);
  };

  const activeFiltersCount =
    (filterPatientId ? 1 : 0) +
    (filterStartDate || filterEndDate ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(perPage));

      if (filterStartDate && filterEndDate) {
        params.append('startDate', filterStartDate);
        params.append('endDate', filterEndDate);
      } else if (filterStartDate) {
        params.append('startDate', filterStartDate);
      } else if (filterEndDate) {
        params.append('endDate', filterEndDate);
      } else if (period === 'month') {
        params.append('year', String(currentDate.getFullYear()));
        params.append('month', String(currentDate.getMonth() + 1));
      } else if (period) {
        params.append('period', period);
      }

      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (filterPatientId) params.append('patientId', filterPatientId);
      if (searchQuery) params.append('search', searchQuery);

      const res: any = await api.get(`/financial-records?${params.toString()}`);

      if (res && res.records) {
        setRecords(res.records);
        setSummary(res.summary || {
          totalBaixado: 0,
          totalPendente: 0,
          totalCancelado: 0,
          totalDespesas: 0,
          saldoLiquido: 0,
          sessoesBaixadasCount: 0,
          totalRecordsCount: 0,
        });
        if (res.meta) {
          setMeta(res.meta);
        }
      } else {
        setRecords([]);
        setSummary({
          totalBaixado: 0,
          totalPendente: 0,
          totalCancelado: 0,
          totalDespesas: 0,
          saldoLiquido: 0,
          sessoesBaixadasCount: 0,
          totalRecordsCount: 0,
        });
        setMeta({ total: 0, perPage, currentPage: 1, lastPage: 1 });
      }
    } catch (err: any) {
      console.error('Error fetching financial records:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [page, perPage, period, currentDate, statusFilter, filterPatientId, filterStartDate, filterEndDate]);

  const handleDarBaixa = async (recordId: number) => {
    try {
      await api.put(`/financial-records/${recordId}`, {
        status: 'baixado',
      });

      toast({
        title: 'Baixa Efetuada com Sucesso!',
        description: 'O atendimento foi marcado como Baixado/Pago no financeiro.',
        type: 'success',
      });

      fetchFinancialData();
    } catch (err: any) {
      toast({
        title: 'Erro ao dar baixa',
        description: err?.message || 'Não foi possível atualizar o status financeiro.',
        type: 'error',
      });
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || newAmount <= 0) {
      toast({
        title: 'Dados Incompletos',
        description: 'Preencha o título, valor e data do lançamento.',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/financial-records', {
        title: newTitle,
        amount: newAmount,
        type: newType,
        status: newStatus,
        paymentMethod: newPaymentMethod,
        date: newDate,
        patientId: newPatientId ? Number(newPatientId) : null,
      });

      toast({
        title: 'Lançamento Registrado!',
        description: 'O lançamento financeiro foi criado com sucesso.',
        type: 'success',
      });

      setShowNewModal(false);
      setNewTitle('');
      setNewAmount(150);
      setNewPatientId('');
      fetchFinancialData();
    } catch (err: any) {
      toast({
        title: 'Erro ao Criar Lançamento',
        description: err?.message || 'Ocorreu um erro ao salvar o registro financeiro.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este registro financeiro?')) return;

    try {
      await api.delete(`/financial-records/${id}`);
      toast({
        title: 'Registro Excluído',
        description: 'O lançamento foi removido do financeiro.',
        type: 'success',
      });
      fetchFinancialData();
    } catch (err: any) {
      toast({
        title: 'Erro ao Excluir',
        description: err?.message || 'Não foi possível excluir o lançamento.',
        type: 'error',
      });
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'pix':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">PIX</span>;
      case 'cartao_credito':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">Cartão de Crédito</span>;
      case 'cartao_debito':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">Cartão de Débito</span>;
      case 'dinheiro':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">Dinheiro</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">Outro</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'baixado':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Baixado (Pago)</span>
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pendente</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Sem Baixa (Cancelado / Falta)</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatMonthLabel = (date: Date) => {
    const raw = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };
  const formattedMonthName = formatMonthLabel(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();

  return (
    <>
      <Header
        title="Módulo Financeiro & Controle de Sessões"
        subtitle="Acompanhe o faturamento, controle as baixas dos atendimentos e gerencie suas receitas mês a mês"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-full">
        {/* Top Control Bar: Streamlined Single-Row Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          {/* Left: Unified Month Navigator & Period Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Integrated Month Switcher */}
            <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setPeriod('month');
                  setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                  setPage(1);
                }}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2 px-3 py-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                  {formattedMonthName}
                </span>
                {isCurrentMonth && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Atual
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setPeriod('month');
                  setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                  setPage(1);
                }}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Period Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 select-none overflow-x-auto">
              {[
                { id: 'month', label: 'Este Mês', action: () => { setPeriod('month'); setCurrentDate(new Date()); setPage(1); } },
                { id: 'today', label: 'Hoje', action: () => { setPeriod('today'); setPage(1); } },
                { id: 'week', label: 'Esta Semana', action: () => { setPeriod('week'); setPage(1); } },
                { id: 'all', label: 'Todos', action: () => { setPeriod('all'); setPage(1); } },
              ].map((tab) => {
                const isActive = period === tab.id && (tab.id !== 'month' || isCurrentMonth);
                return (
                  <button
                    key={tab.id}
                    onClick={tab.action}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Primary Action Button */}
          <button
            onClick={openNewModal}
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Lançamento Financeiro</span>
          </button>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Baixado (Recebido) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Baixado (Pago)</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {formatCurrency(summary.totalBaixado)}
                </h3>
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{summary.sessoesBaixadasCount} atendimentos baixados</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Receita Pendente (Prevista) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-800/80 shadow-xs p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Receita Pendente</p>
                <h3 className="text-2xl font-extrabold text-amber-900 dark:text-amber-500 mt-1">
                  {formatCurrency(summary.totalPendente)}
                </h3>
                <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Aguardando confirmação de baixa</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Sem Baixa (Cancelados / Faltas) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200/80 dark:border-red-800/80 shadow-xs p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cancelados / Faltas</p>
                <h3 className="text-2xl font-extrabold text-red-900 dark:text-red-500 mt-1">
                  {formatCurrency(summary.totalCancelado)}
                </h3>
                <p className="text-xs text-red-500 font-semibold mt-1 flex items-center space-x-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Sem baixa no atendimento</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/30">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 4: Saldo Líquido / Faturamento Total */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/80 dark:border-blue-800/80 shadow-xs p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saldo Líquido Efetivado</p>
                <h3 className="text-2xl font-extrabold text-blue-900 dark:text-blue-500 mt-1">
                  {formatCurrency(summary.saldoLiquido)}
                </h3>
                <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{summary.totalRecordsCount} lançamentos no período</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por paciente ou título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchFinancialData()}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* Advanced Filter Modal Trigger */}
            <button
              onClick={openFilterModal}
              className={`inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                activeFiltersCount > 0
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Abrir filtros avançados por paciente, datas e status"
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Filtros Avançados</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Chips Banner */}
          {activeFiltersCount > 0 && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtros ativos:</span>

              {/* Patient Chip */}
              {filterPatientId && (
                <span className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-medium">
                  <User className="w-3 h-3 text-blue-600" />
                  <span>
                    Paciente:{' '}
                    <strong className="font-semibold">
                      {patientsList.find((p) => String(p.id) === String(filterPatientId))?.name ||
                        patientsList.find((p) => String(p.id) === String(filterPatientId))?.fullName ||
                        'Selecionado'}
                    </strong>
                  </span>
                  <button
                    onClick={() => setFilterPatientId('')}
                    className="text-blue-500 hover:text-blue-800 hover:bg-blue-100 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Date Range Chip */}
              {(filterStartDate || filterEndDate) && (
                <span className="inline-flex items-center space-x-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-medium">
                  <Calendar className="w-3 h-3 text-purple-600" />
                  <span>
                    Período:{' '}
                    <strong className="font-semibold">
                      {filterStartDate ? new Date(filterStartDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Início'} até{' '}
                      {filterEndDate ? new Date(filterEndDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Hoje'}
                    </strong>
                  </span>
                  <button
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="text-purple-500 hover:text-purple-800 hover:bg-purple-100 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Status Chip */}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium">
                  <Filter className="w-3.5 h-3.5 text-slate-600" />
                  <span>
                    Status:{' '}
                    <strong className="font-semibold">
                      {statusFilter === 'baixado' ? 'Baixado (Pago)' : statusFilter === 'pendente' ? 'Pendente' : 'Cancelado / Falta'}
                    </strong>
                  </span>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Clear All Button */}
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-medium ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar todos</span>
              </button>
            </div>
          )}
        </div>

        {/* Transactions Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span>Histórico de Lançamentos & Baixas Financeiras</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Total: {meta.total} registro(s)
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Nenhum lançamento financeiro encontrado.</p>
              <p className="text-xs text-slate-400">
                Altere os filtros de período ou confirme um atendimento agendado para gerar a baixa no financeiro.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Paciente</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Status da Baixa</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {records.map((r) => {
                      const isReceita = r.type === 'receita';
                      const patientName = r.patient?.fullName || r.patient?.name || 'Lançamento Avulso';

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Data */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                            {r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                          </td>

                          {/* Paciente */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              {r.patientId ? (
                                <Link
                                  href={`/patients/${r.patientId}`}
                                  className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  {patientName}
                                </Link>
                              ) : (
                                <span className="font-bold text-slate-900 dark:text-slate-100">{patientName}</span>
                              )}
                              {r.title && !r.title.toLowerCase().startsWith('atendimento -') && (
                                <span className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                                  {r.title}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Valor */}
                          <td className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                            <span className={isReceita ? 'text-emerald-700' : 'text-red-600'}>
                              {isReceita ? '+' : '-'} {formatCurrency(r.amount)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getStatusBadge(r.status)}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                            {r.status !== 'baixado' && r.status !== 'cancelado' && (
                              <button
                                onClick={() => handleDarBaixa(r.id)}
                                className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                                title="Dar Baixa Manualmente neste valor"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Dar Baixa</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteRecord(r.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Lançamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden space-y-3 p-3 bg-slate-50">
                {records.map((r) => {
                  const isReceita = r.type === 'receita';
                  const patientName = r.patient?.fullName || r.patient?.name || 'Lançamento Avulso';

                  return (
                    <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {r.patientId ? (
                            <Link
                              href={`/patients/${r.patientId}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm truncate block"
                            >
                              {patientName}
                            </Link>
                          ) : (
                            <span className="font-bold text-slate-900 text-sm truncate block">{patientName}</span>
                          )}
                          {r.title && !r.title.toLowerCase().startsWith('atendimento -') && (
                            <span className="text-[11px] text-slate-400 font-normal truncate block max-w-full">
                              {r.title}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-extrabold ${isReceita ? 'text-emerald-700' : 'text-red-600'}`}>
                            {isReceita ? '+' : '-'} {formatCurrency(r.amount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[10px] font-semibold text-slate-500">
                            {r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                          </span>
                          {getStatusBadge(r.status)}
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          {r.status !== 'baixado' && r.status !== 'cancelado' && (
                            <button
                              onClick={() => handleDarBaixa(r.id)}
                              className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Dar Baixa"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Baixa</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination Bar */}
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <span>
                    Exibindo{' '}
                    <strong className="text-slate-800 font-bold">
                      {meta.total === 0 ? 0 : (meta.currentPage - 1) * meta.perPage + 1}
                    </strong>{' '}
                    a{' '}
                    <strong className="text-slate-800 font-bold">
                      {Math.min(meta.currentPage * meta.perPage, meta.total)}
                    </strong>{' '}
                    de{' '}
                    <strong className="text-slate-800 font-bold">{meta.total}</strong> lançamentos
                  </span>

                  <span className="text-slate-300">|</span>

                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="10">10 por página</option>
                    <option value="20">20 por página</option>
                    <option value="50">50 por página</option>
                  </select>
                </div>

                {/* Page Navigation Buttons */}
                {meta.lastPage > 1 && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page <= 1}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    {Array.from({ length: meta.lastPage }, (_, idx) => idx + 1)
                      .filter((pNum) => {
                        return (
                          pNum === 1 ||
                          pNum === meta.lastPage ||
                          Math.abs(pNum - page) <= 1
                        );
                      })
                      .map((pNum, index, arr) => {
                        const showEllipsis = index > 0 && pNum - arr[index - 1] > 1;
                        return (
                          <React.Fragment key={pNum}>
                            {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setPage(pNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                page === pNum
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {pNum}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      onClick={() => setPage((prev) => Math.min(meta.lastPage, prev + 1))}
                      disabled={page >= meta.lastPage}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal: Filtros Avançados */}
      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterModal(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden z-10 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Filtros Avançados de Faturamento</h3>
                    <p className="text-xs text-slate-500">Filtre por paciente, datas e status de pagamento</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 1. Selecionar Paciente com Custom Searchable Combobox */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nome do Paciente</span>
                  </label>

                  {/* Trigger Card */}
                  <div className="relative">
                    {(() => {
                      const selectedPatient = patientsList.find(
                        (p) => String(p.id) === String(tempPatientId)
                      );
                      const patientName = selectedPatient?.fullName || selectedPatient?.name;
                      const initials = patientName
                        ? patientName
                            .split(' ')
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : '';

                      return (
                        <div
                          onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                            patientDropdownOpen
                              ? 'border-blue-500 bg-white ring-2 ring-blue-100 shadow-xs'
                              : tempPatientId
                              ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            {tempPatientId ? (
                              <>
                                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {initials}
                                </div>
                                <div className="truncate text-left">
                                  <span className="text-xs font-bold text-slate-900 block truncate">
                                    {patientName}
                                  </span>
                                  {selectedPatient?.cpf && (
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      CPF: {selectedPatient.cpf}
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center shrink-0">
                                  <Users className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-slate-700">
                                  Todos os Pacientes (Geral)
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 shrink-0 ml-2">
                            {tempPatientId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTempPatientId('');
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Remover seleção de paciente"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                patientDropdownOpen ? 'rotate-180 text-blue-600' : ''
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {patientDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1.5"
                        >
                          {/* Search Filter Input inside dropdown */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Filtrar por nome ou CPF..."
                              value={patientSearchTerm}
                              onChange={(e) => setPatientSearchTerm(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          {/* Patients List */}
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                            {loadingPatients ? (
                              <div className="py-6 text-center text-xs text-slate-500 font-medium flex items-center justify-center space-x-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span>Carregando lista de pacientes...</span>
                              </div>
                            ) : (
                              <>
                                {/* Option 0: Todos os Pacientes */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempPatientId('');
                                    setPatientDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                    !tempPatientId
                                      ? 'bg-blue-50 text-blue-700 font-bold'
                                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span>Todos os Pacientes</span>
                                  </div>
                                  {!tempPatientId && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                                </button>

                                {/* Patient Options */}
                                {patientsList
                                  .filter((p) => {
                                    if (!patientSearchTerm.trim()) return true;
                                    const search = patientSearchTerm.toLowerCase();
                                    const name = (p.fullName || p.name || '').toLowerCase();
                                    const cpf = (p.cpf || '').toLowerCase();
                                    return name.includes(search) || cpf.includes(search);
                                  })
                                  .map((p) => {
                                    const isSelected = String(tempPatientId) === String(p.id);
                                    const pName = p.fullName || p.name;
                                    const initials = pName
                                      ? pName
                                          .split(' ')
                                          .map((n: string) => n[0])
                                          .slice(0, 2)
                                          .join('')
                                          .toUpperCase()
                                      : '';

                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          setTempPatientId(String(p.id));
                                          setPatientDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                          isSelected
                                            ? 'bg-blue-50 text-blue-800 font-bold'
                                            : 'hover:bg-slate-50 text-slate-700 font-medium'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2.5 overflow-hidden">
                                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200">
                                            {initials}
                                          </div>
                                          <div className="truncate">
                                            <span className="block truncate">{pName}</span>
                                            {p.cpf && (
                                              <span className="text-[10px] text-slate-400 font-normal">
                                                CPF: {p.cpf}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                                      </button>
                                    );
                                  })}

                                {patientsList.length === 0 && (
                                  <div className="py-4 text-center text-xs text-slate-400 font-medium">
                                    Nenhum paciente cadastrado
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 2. Intervalo de Datas (Início e Fim) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>Intervalo de Datas</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 mb-1 block">Data de Início:</span>
                      <input
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 mb-1 block">Data de Fim:</span>
                      <input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Atalhos Rápidos de Data */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setTempStartDate(today);
                        setTempEndDate(today);
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-medium transition-colors"
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                        setTempStartDate(start);
                        setTempEndDate(end);
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-medium transition-colors"
                    >
                      Este Mês
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                        const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                        setTempStartDate(start);
                        setTempEndDate(end);
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-medium transition-colors"
                    >
                      Mês Passado
                    </button>
                    {(tempStartDate || tempEndDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempStartDate('');
                          setTempEndDate('');
                        }}
                        className="text-[10px] text-red-600 hover:bg-red-50 px-2 py-1 rounded-md font-medium transition-colors ml-auto"
                      >
                        Limpar datas
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Status da Baixa / Pagamento */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Status da Baixa / Pagamento</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: 'all',
                        label: 'Todos os Status',
                        desc: 'Baixados, pendentes e cancelados',
                        icon: Filter,
                        activeClass: 'border-slate-800 bg-slate-900 text-white',
                      },
                      {
                        id: 'baixado',
                        label: 'Baixado (Pago)',
                        desc: 'Atendimentos confirmados e pagos',
                        icon: CheckCircle2,
                        activeClass: 'border-emerald-600 bg-emerald-50 text-emerald-800',
                      },
                      {
                        id: 'pendente',
                        label: 'Pendente',
                        desc: 'Aguardando confirmação de baixa',
                        icon: Clock,
                        activeClass: 'border-amber-500 bg-amber-50 text-amber-800',
                      },
                      {
                        id: 'cancelado',
                        label: 'Sem Baixa (Cancelado)',
                        desc: 'Atendimentos desmarcados/faltas',
                        icon: XCircle,
                        activeClass: 'border-red-500 bg-red-50 text-red-800',
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = tempStatus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setTempStatus(opt.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? opt.activeClass + ' shadow-xs font-bold'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className={`w-4 h-4 ${isSelected ? '' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold">{opt.label}</span>
                          </div>
                          <span className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Filtros</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aplicar Filtros</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Novo Lançamento Financeiro Manual */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewModal(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden z-10 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Novo Lançamento Financeiro</h3>
                    <p className="text-xs text-slate-500">Registre uma receita ou despesa manual</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowNewModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRecord} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Descrição / Título *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sessão de Fisioterapia, Avaliação, Material..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Valor (R$) *
                    </label>
                    <CurrencyInput
                      value={newAmount}
                      onChange={(val) => setNewAmount(val)}
                      placeholder="R$ 150,00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Tipo
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="receita">Receita (+ Entradas)</option>
                      <option value="despesa">Despesa (- Saídas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="transferencia">Transferência</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Status da Baixa
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="baixado">Baixado (Pago)</option>
                      <option value="pendente">Pendente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Paciente (Opcional)
                    </label>
                    <select
                      value={newPatientId}
                      onChange={(e) => {
                        setNewPatientId(e.target.value);
                        const p = patientsList.find((item) => String(item.id) === String(e.target.value));
                        if (p && (p.sessionRate || p.session_rate)) {
                          setNewAmount(Number(p.sessionRate || p.session_rate));
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Nenhum Paciente</option>
                      {patientsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.fullName} ({formatCurrency(p.sessionRate || p.session_rate || 0)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Salvar Lançamento</span>
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
