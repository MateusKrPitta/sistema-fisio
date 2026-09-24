'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
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
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Trash2,
  Edit2,
  SlidersHorizontal,
  RotateCcw,
  X,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Sparkles,
  Lock,
  Copy,
  Check,
  Briefcase,
  Layers,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  Laptop,
  Landmark,
  Package,
  Zap,
  Banknote,
  FileText,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  LayoutGrid,
} from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { useAuth } from '@/context/auth-context';
import { CurrencyInput, formatCurrency } from '@/components/currency-input';
import { CustomSelect, SelectOption } from '@/components/custom-select';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface FinancialRecord {
  id: number;
  userId: number;
  patientId: number | null;
  appointmentId: number | null;
  recipientUserId?: number | null;
  category?: string | null;
  referenceMonth?: string | null;
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
  recipientUser?: {
    id: number;
    fullName?: string;
    full_name?: string;
    email: string;
    role: string;
    pixKey?: string;
    pix_key?: string;
  };
}

interface PayrollItem {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  crefito?: string;
  pixKey?: string;
  bankInfo?: string;
  paymentDay?: number;
  compensationType: 'fixed' | 'per_session' | 'percentage' | 'hybrid' | 'pro_labore';
  baseSalary: number;
  sessionRate: number;
  commissionPercentage: number;
  sessionCount: number;
  grossRevenue: number;
  calculatedAmount: number;
  calculationDetails: string;
  isLaunched: boolean;
  launchStatus: 'nao_lancado' | 'pendente' | 'baixado';
  financialRecordId?: number | null;
}

export default function FinancialPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Active Main Tab: 'overview' | 'receitas' | 'despesas' | 'payroll'
  const [activeTab, setActiveTab] = useState<'overview' | 'receitas' | 'despesas' | 'payroll'>('overview');

  // Plan info
  const [userPlan, setUserPlan] = useState<string>(
    (user?.company?.plan || 'bronze').toLowerCase()
  );
  const [isPlanAllowed, setIsPlanAllowed] = useState<boolean>(
    user?.role === 'superadmin' ||
      (user?.company?.plan || '').toLowerCase() === 'silver' ||
      (user?.company?.plan || '').toLowerCase() === 'gold'
  );

  useEffect(() => {
    if (user) {
      const plan = (user.company?.plan || 'bronze').toLowerCase();
      setUserPlan(plan);
      setIsPlanAllowed(user.role === 'superadmin' || plan === 'silver' || plan === 'gold');
    }
  }, [user]);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<'month' | 'today' | 'week' | 'all'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'baixado' | 'pendente' | 'cancelado'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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
    totalDespesasPendentes: 0,
    saldoLiquido: 0,
    sessoesBaixadasCount: 0,
    totalRecordsCount: 0,
    expensesByCategory: {} as Record<string, number>,
  });

  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Active Applied Filters
  const [filterPatientId, setFilterPatientId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterTypeAdvanced, setFilterTypeAdvanced] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filterPhysios, setFilterPhysios] = useState<string[]>([]);

  // Temporary Filter Modal State
  const [tempPatientId, setTempPatientId] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [tempStatus, setTempStatus] = useState<'all' | 'baixado' | 'pendente' | 'cancelado'>('all');
  const [tempCategory, setTempCategory] = useState<string>('all');
  const [tempType, setTempType] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [tempPhysios, setTempPhysios] = useState<string[]>([]);

  // Patient & Team lists for modal
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [teamList, setTeamList] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Form State for new transaction
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState<number>(150);
  const [newType, setNewType] = useState<'receita' | 'despesa'>('receita');
  const [newCategory, setNewCategory] = useState<string>('outros');
  const [newRecipientUserId, setNewRecipientUserId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'baixado' | 'pendente'>('baixado');
  const [newPaymentMethod, setNewPaymentMethod] = useState('pix');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPatientId, setNewPatientId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Payroll State
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollData, setPayrollData] = useState<{
    summary: {
      totalPayrollAmount: number;
      totalPaidAmount: number;
      totalPendingAmount: number;
      totalMembers: number;
      totalSessionsAttended: number;
    };
    items: PayrollItem[];
  } | null>(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [copiedPixId, setCopiedPixId] = useState<number | null>(null);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const fetchDropdowns = async () => {
    if (loadingDropdowns) return;
    setLoadingDropdowns(true);
    try {
      const [patRes, teamRes] = await Promise.all([
        api.get('/patients').catch(() => []),
        api.get('/team').catch(() => []),
      ]);
      setPatientsList(Array.isArray(patRes) ? patRes : (patRes as any)?.data || []);
      setTeamList(Array.isArray(teamRes) ? teamRes : (teamRes as any)?.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(perPage));

      if (filterTypeAdvanced !== 'todos') {
        params.append('type', filterTypeAdvanced);
      } else if (activeTab === 'receitas') {
        params.append('type', 'receita');
      } else if (activeTab === 'despesas') {
        params.append('type', 'despesa');
      }

      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (filterPatientId) {
        params.append('patientId', filterPatientId);
      }

      if (filterStartDate) {
        params.append('startDate', filterStartDate);
      }
      if (filterEndDate) {
        params.append('endDate', filterEndDate);
      }

      if (!filterStartDate && !filterEndDate) {
        params.append('period', period);
        if (period === 'month') {
          params.append('year', String(currentDate.getFullYear()));
          params.append('month', String(currentDate.getMonth() + 1));
        }
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Advanced: employee / physio filter
      if (filterPhysios.length > 0) {
        filterPhysios.forEach((uid) => params.append('userId', uid));
      }

      const res: any = await api.get(`/financial-records?${params.toString()}`);
      if (res?.records) {
        setRecords(res.records);
        setSummary(res.summary);
        if (res.meta) {
          setMeta(res.meta);
        }
        if (res.plan) {
          setUserPlan(res.plan.toLowerCase());
        }
        if (res.planAllowsExpenses !== undefined) {
          setIsPlanAllowed(user?.role === 'superadmin' || !!res.planAllowsExpenses);
        }
      } else if (Array.isArray(res)) {
        setRecords(res);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao carregar registros financeiros.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollPreview = async () => {
    if (!isPlanAllowed) return;
    setLoadingPayroll(true);
    try {
      const res: any = await api.get(
        `/financial-records/payroll/preview?year=${payrollYear}&month=${payrollMonth}`
      );
      setPayrollData(res);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao calcular folha de pagamento.');
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payroll') {
      fetchPayrollPreview();
    } else {
      fetchRecords();
    }
  }, [
    activeTab,
    page,
    perPage,
    period,
    statusFilter,
    categoryFilter,
    currentDate,
    filterPatientId,
    filterStartDate,
    filterEndDate,
    filterTypeAdvanced,
    filterPhysios,
    payrollYear,
    payrollMonth,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handlePrevMonth = () => {
    if (activeTab === 'payroll') {
      if (payrollMonth === 1) {
        setPayrollMonth(12);
        setPayrollYear((prev) => prev - 1);
      } else {
        setPayrollMonth((prev) => prev - 1);
      }
    } else {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
      setPage(1);
    }
  };

  const handleNextMonth = () => {
    if (activeTab === 'payroll') {
      if (payrollMonth === 12) {
        setPayrollMonth(1);
        setPayrollYear((prev) => prev + 1);
      } else {
        setPayrollMonth((prev) => prev + 1);
      }
    } else {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
      setPage(1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    if (activeTab === 'payroll') {
      setPayrollYear(now.getFullYear());
      setPayrollMonth(now.getMonth() + 1);
    } else {
      setCurrentDate(now);
      setPeriod('month');
      setPage(1);
    }
  };

  const handleDarBaixa = async (recordId: number) => {
    try {
      await api.put(`/financial-records/${recordId}`, { status: 'baixado' });
      toast.success('Baixa registrada com sucesso!');
      fetchRecords();
      if (activeTab === 'payroll') fetchPayrollPreview();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao dar baixa no lançamento.');
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento financeiro?')) return;
    try {
      await api.delete(`/financial-records/${recordId}`);
      toast.success('Lançamento excluído com sucesso.');
      fetchRecords();
      if (activeTab === 'payroll') fetchPayrollPreview();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir lançamento.');
    }
  };

  const handleOpenNewModal = (type: 'receita' | 'despesa' = 'receita') => {
    if (type === 'despesa' && !isPlanAllowed) {
      toast.warning('O gerenciamento de Saídas e Despesas é exclusivo para os Planos Prata e Ouro.');
      return;
    }
    setNewType(type);
    setNewTitle('');
    setNewAmount(type === 'despesa' ? 200 : 150);
    setNewCategory(type === 'despesa' ? 'insumos' : 'outros');
    setNewRecipientUserId('');
    setNewPatientId('');
    setNewStatus('baixado');
    setNewPaymentMethod('pix');
    setNewDate(new Date().toISOString().split('T')[0]);
    fetchDropdowns();
    setShowNewModal(true);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newAmount <= 0) {
      toast.error('Informe o título e um valor válido.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: newTitle.trim(),
        amount: newAmount,
        type: newType,
        status: newStatus,
        paymentMethod: newPaymentMethod,
        date: newDate,
      };

      if (newType === 'receita' && newPatientId) {
        payload.patientId = Number(newPatientId);
      }

      if (newType === 'despesa') {
        payload.category = newCategory;
        if (newRecipientUserId) {
          payload.recipientUserId = Number(newRecipientUserId);
        }
      }

      await api.post('/financial-records', payload);
      toast.success(newType === 'receita' ? 'Receita lançada com sucesso!' : 'Despesa registrada com sucesso!');
      setShowNewModal(false);
      fetchRecords();
      if (activeTab === 'payroll') fetchPayrollPreview();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar lançamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAllPayroll = async () => {
    if (!payrollData || payrollData.items.length === 0) return;

    const itemsToLaunch = payrollData.items
      .filter((item) => item.calculatedAmount > 0 && !item.isLaunched)
      .map((item) => ({
        userId: item.userId,
        amount: item.calculatedAmount,
        title: `Salário / Repasse - ${item.fullName} (${monthNames[payrollMonth - 1]}/${payrollYear})`,
        paymentMethod: 'pix',
        status: 'pendente',
      }));

    if (itemsToLaunch.length === 0) {
      toast.info('Todos os profissionais com saldo a repassar já possuem lançamentos gerados no financeiro.');
      return;
    }

    if (
      !confirm(
        `Deseja gerar os lançamentos de saída no financeiro para ${itemsToLaunch.length} profissional(is) no total de ${formatCurrency(
          itemsToLaunch.reduce((acc, curr) => acc + curr.amount, 0)
        )}?`
      )
    ) {
      return;
    }

    setGeneratingPayroll(true);
    try {
      const res: any = await api.post('/financial-records/payroll/generate', {
        year: payrollYear,
        month: payrollMonth,
        items: itemsToLaunch,
      });
      toast.success(res?.message || 'Lançamentos de folha gerados com sucesso!');
      fetchPayrollPreview();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao gerar fechamento de folha.');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const handleCopyPix = (pix: string, id: number) => {
    if (!pix) return;
    navigator.clipboard.writeText(pix);
    setCopiedPixId(id);
    toast.success('Chave PIX copiada para a área de transferência!');
    setTimeout(() => setCopiedPixId(null), 2500);
  };

  const getCategoryBadge = (cat?: string | null) => {
    switch (cat) {
      case 'salario':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold">💼 Salário/Repasse</span>;
      case 'aluguel':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">🏢 Aluguel & Contas</span>;
      case 'insumos':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">🩺 Insumos/Materiais</span>;
      case 'marketing':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-bold">💻 Marketing/Software</span>;
      case 'impostos':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold">🏛️ Impostos</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold">📦 Despesa Geral</span>;
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'baixado':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Baixado (Pago)</span>
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pendente</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelado</span>
          </span>
        );
      default:
        return null;
    }
  };

  const filterStatusOptions: SelectOption[] = [
    { value: 'all', label: 'Status: Todos' },
    { value: 'baixado', label: 'Baixados (Pagos)', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> },
    { value: 'pendente', label: 'Pendentes', icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'cancelado', label: 'Cancelados', icon: <XCircle className="w-3.5 h-3.5 text-rose-500" /> },
  ];

  const filterCategoryOptions: SelectOption[] = [
    { value: 'all', label: 'Categoria: Todas' },
    { value: 'salario', label: 'Salários & Repasses', icon: <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> },
    { value: 'aluguel', label: 'Aluguel & Contas', icon: <Building2 className="w-3.5 h-3.5 text-sky-500" /> },
    { value: 'insumos', label: 'Insumos & Materiais', icon: <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> },
    { value: 'marketing', label: 'Marketing & Software', icon: <Laptop className="w-3.5 h-3.5 text-purple-500" /> },
    { value: 'impostos', label: 'Impostos & Taxas', icon: <Landmark className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'outros', label: 'Outras Despesas', icon: <Package className="w-3.5 h-3.5 text-slate-500" /> },
  ];

  const modalCategoryOptions: SelectOption[] = [
    { value: 'salario', label: 'Salários & Repasses', sublabel: 'Equipe clínica e pró-labore', icon: <Briefcase className="w-4 h-4 text-indigo-600" /> },
    { value: 'aluguel', label: 'Aluguel & Contas Básicas', sublabel: 'Condomínio, energia, internet e água', icon: <Building2 className="w-4 h-4 text-sky-600" /> },
    { value: 'insumos', label: 'Insumos & Materiais Clínicos', sublabel: 'Descartáveis, luvas, agulhas e cremes', icon: <Stethoscope className="w-4 h-4 text-emerald-600" /> },
    { value: 'marketing', label: 'Marketing & Softwares', sublabel: 'Anúncios, licenças e plataformas', icon: <Laptop className="w-4 h-4 text-purple-600" /> },
    { value: 'impostos', label: 'Impostos, Taxas & DAS', sublabel: 'Tributos municipais/federais e taxas', icon: <Landmark className="w-4 h-4 text-amber-600" /> },
    { value: 'outros', label: 'Outras Despesas Operacionais', sublabel: 'Gastos operacionais diversos', icon: <Package className="w-4 h-4 text-slate-500" /> },
  ];

  const modalRecipientOptions: SelectOption[] = [
    { value: '', label: 'Nenhum / Fornecedor Externo', sublabel: 'Despesa geral da clínica', icon: <Building2 className="w-4 h-4 text-slate-400" /> },
    ...teamList.map((m) => ({
      value: String(m.id),
      label: m.fullName || m.name,
      sublabel: m.role === 'clinic_admin' ? 'Administrador da Clínica' : m.role === 'secretary' ? 'Secretária' : 'Fisioterapeuta',
      icon: <UserIcon className="w-4 h-4 text-blue-600" />,
    })),
  ];

  const modalPatientOptions: SelectOption[] = [
    { value: '', label: 'Nenhum Paciente / Entrada Avulsa', sublabel: 'Sem vínculo com cadastro de paciente', icon: <UserIcon className="w-4 h-4 text-slate-400" /> },
    ...patientsList.map((p) => ({
      value: String(p.id),
      label: p.name || p.fullName,
      sublabel: `Sessão padrão: ${formatCurrency(p.sessionRate || p.session_rate || 0)}`,
      icon: <UserIcon className="w-4 h-4 text-emerald-600" />,
    })),
  ];

  const modalPaymentMethodOptions: SelectOption[] = [
    { value: 'pix', label: 'PIX', sublabel: 'Transferência instantânea via chave', icon: <Zap className="w-4 h-4 text-teal-600" /> },
    { value: 'cartao_credito', label: 'Cartão de Crédito', sublabel: 'À vista ou parcelado na maquininha', icon: <CreditCard className="w-4 h-4 text-blue-600" /> },
    { value: 'cartao_debito', label: 'Cartão de Débito', sublabel: 'Débito em conta corrente', icon: <CreditCard className="w-4 h-4 text-sky-600" /> },
    { value: 'dinheiro', label: 'Dinheiro (Espécie)', sublabel: 'Pagamento físico no caixa', icon: <Banknote className="w-4 h-4 text-emerald-600" /> },
    { value: 'transferencia', label: 'Transferência Bancária / TED', sublabel: 'Depósito em conta corrente', icon: <Building2 className="w-4 h-4 text-slate-600" /> },
    { value: 'boleto', label: 'Boleto Bancário', sublabel: 'Cobrança bancária emitida', icon: <FileText className="w-4 h-4 text-amber-600" /> },
  ];

  const modalStatusOptions: SelectOption[] = [
    { value: 'baixado', label: 'Baixado (Pago / Confirmado)', sublabel: 'Valor já liquidado no caixa', badge: 'Confirmado', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
    { value: 'pendente', label: 'Pendente (Aguardando)', sublabel: 'Aguardando pagamento ou compensação', badge: 'Pendente', icon: <Clock className="w-4 h-4 text-amber-500" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <Header
        title="Financeiro & Fluxo de Caixa"
        subtitle="Controle de receitas, saídas e fechamento de folha de pagamento"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 w-full">
        {/* Top Header & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Gestão Financeira & Caixa
              </h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  userPlan === 'gold'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : userPlan === 'silver'
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-orange-50 text-orange-800 border-orange-200'
                }`}
              >
                Plano {userPlan.toUpperCase()}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Controle de entradas, saídas, repasses de equipe e fluxo de caixa da clínica
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => handleOpenNewModal('receita')}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Receita</span>
            </button>

            {isPlanAllowed && (
              <button
                onClick={() => handleOpenNewModal('despesa')}
                className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Nova Despesa</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 border-b border-slate-200/90 pb-px overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão Geral & Fluxo', icon: Layers, show: true },
            { id: 'receitas', label: 'Entradas (Receitas)', icon: TrendingUp, show: true },
            { id: 'despesas', label: 'Saídas (Despesas)', icon: TrendingDown, show: isPlanAllowed },
            { id: 'payroll', label: 'Folha & Repasses de Equipe', icon: Wallet, show: isPlanAllowed },
          ]
            .filter((tab) => tab.show)
            .map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setPage(1);
                  }}
                  className={`inline-flex items-center space-x-2 px-4 py-3 border-b-2 font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>

        {/* Plan Upgrade Banner (if Bronze tries to view Despesas or Payroll) */}
        {!isPlanAllowed && (activeTab === 'despesas' || activeTab === 'payroll') ? (
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Exclusivo para Planos Prata & Ouro</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Controle Completo de Saídas, Despesas & Folha de Pagamento
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Faça o upgrade da sua clínica para os planos **Prata** ou **Ouro** e desbloqueie o gerenciamento de contas a pagar, comissões automáticas por sessão de atendimento, fechamento de folha de secretárias e fisioterapeutas em 1 clique e gráficos de lucratividade.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Lançamento e categorização de despesas</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cálculo automático de repasses e comissões</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fechamento de folha mensal com 1 clique</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cálculo de Saldo Líquido Real</span>
                </div>
              </div>

              <div className="pt-4 flex items-center space-x-3">
                <button
                  onClick={() => alert('Entre em contato com o suporte para realizar o upgrade do seu plano.')}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <span>Fazer Upgrade para o Plano Prata / Ouro</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'payroll' ? (
          /* ========================================================================= */
          /* FOLHA DE PAGAMENTO & REPASSES (PAYROLL) VIEW                              */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Month Selector & Controls */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Apuração da Folha: {monthNames[payrollMonth - 1]} / {payrollYear}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cálculo automático de salários e comissões baseado nos atendimentos realizados
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 text-slate-600 hover:bg-white hover:shadow-xs rounded-lg transition-all cursor-pointer"
                    title="Mês Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCurrentMonth}
                    className="px-3 py-1 text-xs font-bold text-slate-800 hover:bg-white hover:shadow-xs rounded-lg transition-all cursor-pointer"
                  >
                    {monthNames[payrollMonth - 1]} {payrollYear}
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 text-slate-600 hover:bg-white hover:shadow-xs rounded-lg transition-all cursor-pointer"
                    title="Próximo Mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleGenerateAllPayroll}
                  disabled={generatingPayroll || !payrollData || payrollData.items.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  {generatingPayroll ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                  <span>Fechar Folha & Lançar no Financeiro</span>
                </button>
              </div>
            </div>

            {/* Payroll Summary Cards */}
            {payrollData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Folha Prevista
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatCurrency(payrollData.summary.totalPayrollAmount)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {payrollData.summary.totalMembers} profissional(is) cadastrados
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                    Repasses Já Baixados (Pagos)
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600">
                    {formatCurrency(payrollData.summary.totalPaidAmount)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Lançamentos confirmados no caixa
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                    Repasses Pendentes
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-amber-600">
                    {formatCurrency(payrollData.summary.totalPendingAmount)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Aguardando liquidação/fechamento
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                    Atendimentos Realizados
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-blue-600">
                    {payrollData.summary.totalSessionsAttended} sessões
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Concluídas no mês de apuração
                  </span>
                </div>
              </div>
            )}

            {/* Payroll Team Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              {loadingPayroll ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Calculando folha e apurando atendimentos...</p>
                </div>
              ) : !payrollData || payrollData.items.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <p className="text-sm font-semibold">Nenhum profissional encontrado na equipe.</p>
                  <Link href="/team" className="text-xs font-bold text-blue-600 hover:underline">
                    Ir para Gestão de Equipe
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-4 px-6">Profissional</th>
                        <th className="py-4 px-4">Regra Salarial</th>
                        <th className="py-4 px-4">Sessões / Faturamento</th>
                        <th className="py-4 px-4">Valor Calculado</th>
                        <th className="py-4 px-4">Chave PIX</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-6 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {payrollData.items.map((item) => {
                        const initial = (item.fullName || 'P').charAt(0).toUpperCase();

                        return (
                          <tr key={item.userId} className="hover:bg-slate-50/60 transition-colors">
                            {/* Member */}
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                  {initial}
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                    {item.fullName}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {item.role === 'clinic_admin'
                                      ? 'Administrador(a)'
                                      : item.role === 'secretary'
                                      ? 'Secretária(o)'
                                      : 'Fisioterapeuta'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Compensation Rule */}
                            <td className="py-4 px-4">
                              <span className="font-semibold text-slate-700 block">
                                {item.compensationType === 'fixed'
                                  ? 'Salário Fixo Mensal'
                                  : item.compensationType === 'pro_labore'
                                  ? 'Pró-labore Mensal'
                                  : item.compensationType === 'per_session'
                                  ? `R$ ${item.sessionRate.toFixed(2)} por sessão`
                                  : item.compensationType === 'percentage'
                                  ? `${item.commissionPercentage}% por sessão`
                                  : 'Misto (Fixo + Sessões)'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {item.calculationDetails}
                              </span>
                            </td>

                            {/* Sessions & Revenue */}
                            <td className="py-4 px-4">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 block">
                                  {item.sessionCount} sessão(ões)
                                </span>
                                {item.grossRevenue > 0 && (
                                  <span className="text-[10px] text-slate-400 block font-medium">
                                    Bruto: {formatCurrency(item.grossRevenue)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Calculated Net Amount */}
                            <td className="py-4 px-4">
                              <span className="text-sm font-black text-slate-900 block">
                                {formatCurrency(item.calculatedAmount)}
                              </span>
                            </td>

                            {/* PIX Key */}
                            <td className="py-4 px-4">
                              {item.pixKey ? (
                                <button
                                  type="button"
                                  onClick={() => handleCopyPix(item.pixKey!, item.userId)}
                                  className="inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 text-[11px] font-mono transition-colors cursor-pointer"
                                  title="Clique para copiar a chave PIX"
                                >
                                  {copiedPixId === item.userId ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-700 font-bold">Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-400" />
                                      <span className="truncate max-w-[120px]">{item.pixKey}</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Sem chave PIX</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              {item.launchStatus === 'baixado' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Pago / Baixado</span>
                                </span>
                              ) : item.launchStatus === 'pendente' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Lançado (Pendente)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <span>Não Lançado</span>
                                </span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="py-4 px-6 text-right">
                              {item.launchStatus === 'pendente' && item.financialRecordId ? (
                                <button
                                  type="button"
                                  onClick={() => handleDarBaixa(item.financialRecordId!)}
                                  className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Dar Baixa</span>
                                </button>
                              ) : item.launchStatus === 'nao_lancado' && item.calculatedAmount > 0 ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await api.post('/financial-records/payroll/generate', {
                                        year: payrollYear,
                                        month: payrollMonth,
                                        items: [
                                          {
                                            userId: item.userId,
                                            amount: item.calculatedAmount,
                                            title: `Salário / Repasse - ${item.fullName} (${monthNames[payrollMonth - 1]}/${payrollYear})`,
                                            paymentMethod: 'pix',
                                            status: 'pendente',
                                          },
                                        ],
                                      });
                                      toast.success(`Lançamento de ${item.fullName} gerado!`);
                                      fetchPayrollPreview();
                                    } catch (err: any) {
                                      toast.error(err.response?.data?.error || 'Erro ao gerar lançamento.');
                                    }
                                  }}
                                  className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>Lançar Saída</span>
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* OVERVIEW / RECEITAS / DESPESAS LIST VIEW                                  */
          /* ========================================================================= */
          <>
            {/* Metric Summary Cards */}
            {isPlanAllowed ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Saldo Líquido */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Saldo Líquido
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${summary.saldoLiquido >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-xl sm:text-2xl font-black ${summary.saldoLiquido >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                    {formatCurrency(summary.saldoLiquido)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Receitas Baixadas (-) Despesas
                  </span>
                </div>

                {/* Total Receitas Baixadas */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                      Receitas Recebidas
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600">
                    {formatCurrency(summary.totalBaixado)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {summary.sessoesBaixadasCount} atendimento(s) pagos
                  </span>
                </div>

                {/* Total Despesas Baixadas */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                      Total Despesas Pagas
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-red-600">
                    {formatCurrency(summary.totalDespesas)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Custos operacionais e salários
                  </span>
                </div>

                {/* Receitas Pendentes */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                      Receitas a Receber
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-amber-600">
                    {formatCurrency(summary.totalPendente)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Aguardando confirmação de baixa
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Receitas Baixadas */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                      Receitas Recebidas
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600">
                    {formatCurrency(summary.totalBaixado)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {summary.sessoesBaixadasCount} atendimento(s) pagos
                  </span>
                </div>

                {/* Receitas Pendentes */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                      Receitas a Receber
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-amber-600">
                    {formatCurrency(summary.totalPendente)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Aguardando confirmação de baixa
                  </span>
                </div>

                {/* Faturamento Previsto Total */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      Total Previsto
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-blue-600">
                    {formatCurrency(summary.totalBaixado + summary.totalPendente)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Recebidas + a receber no período
                  </span>
                </div>
              </div>
            )}

            {/* Filter & Period Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center flex-wrap gap-2">
                {/* Period Selector Buttons */}
                <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => {
                      setPeriod('month');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      period === 'month' && !filterStartDate
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => {
                      setPeriod('today');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      period === 'today'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      setPeriod('week');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      period === 'week'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => {
                      setPeriod('all');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      period === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos
                  </button>
                </div>

                {period === 'month' && !filterStartDate && (
                  <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCurrentMonth}
                      className="px-2.5 py-0.5 text-xs font-bold text-slate-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Status Filter Dropdown */}
                <div className="w-44">
                  <CustomSelect
                    size="sm"
                    value={statusFilter}
                    onChange={(val) => {
                      setStatusFilter(String(val) as any);
                      setPage(1);
                    }}
                    options={filterStatusOptions}
                  />
                </div>

                {/* Category Filter Dropdown (if viewing despesas or all) */}
                {activeTab === 'despesas' && (
                  <div className="w-48">
                    <CustomSelect
                      size="sm"
                      value={categoryFilter}
                      onChange={(val) => {
                        setCategoryFilter(String(val));
                        setPage(1);
                      }}
                      options={filterCategoryOptions}
                    />
                  </div>
                )}

                {/* Advanced Filter Button */}
                <button
                  type="button"
                  onClick={() => {
                    setTempStartDate(filterStartDate);
                    setTempEndDate(filterEndDate);
                    setTempStatus(statusFilter);
                    setTempCategory(categoryFilter);
                    setTempType(filterTypeAdvanced);
                    setTempPhysios([...filterPhysios]);
                    fetchDropdowns();
                    setShowFilterModal(true);
                  }}
                  className={`relative inline-flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shrink-0 border cursor-pointer ${
                    (filterStartDate || filterEndDate || filterTypeAdvanced !== 'todos' || filterPhysios.length > 0)
                      ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filtros</span>
                  {(() => {
                    const cnt = [
                      filterStartDate || filterEndDate,
                      filterTypeAdvanced !== 'todos',
                      filterPhysios.length > 0,
                    ].filter(Boolean).length;
                    return cnt > 0 ? (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                        {cnt}
                      </span>
                    ) : null;
                  })()}
                </button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative min-w-[220px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente, título..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </form>
            </div>

            {/* Active Advanced Filters Pills Bar */}
            {(filterStartDate || filterEndDate || filterTypeAdvanced !== 'todos' || filterPhysios.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap px-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filtros:</span>
                {(filterStartDate || filterEndDate) && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    <CalendarDays className="w-3 h-3" />
                    {filterStartDate ? filterStartDate.split('-').reverse().join('/') : '...'}
                    {' → '}
                    {filterEndDate ? filterEndDate.split('-').reverse().join('/') : '...'}
                    <button type="button" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setPage(1); }} className="ml-0.5 hover:text-blue-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterTypeAdvanced !== 'todos' && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                    {filterTypeAdvanced === 'receita' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                    {filterTypeAdvanced === 'receita' ? 'Entrada (Receita)' : 'Saída (Despesa)'}
                    <button type="button" onClick={() => { setFilterTypeAdvanced('todos'); setPage(1); }} className="ml-0.5 hover:text-amber-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterPhysios.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    <UserIcon className="w-3 h-3" />
                    {filterPhysios.length} funcionário(s)
                    <button type="button" onClick={() => { setFilterPhysios([]); setPage(1); }} className="ml-0.5 hover:text-emerald-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterTypeAdvanced('todos');
                    setFilterPhysios([]);
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-full transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpar todos
                </button>
              </div>
            )}

            {/* Transactions Table / List */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Carregando lançamentos...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <p className="text-sm font-semibold">Nenhum lançamento financeiro encontrado.</p>
                  <p className="text-xs">
                    Altere os filtros ou adicione uma nova {isPlanAllowed ? 'receita/despesa' : 'receita'}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-4 px-6">Data</th>
                        <th className="py-4 px-4">Descrição / Origem</th>
                        <th className="py-4 px-4">Tipo & Categoria</th>
                        <th className="py-4 px-4">Forma de Pagamento</th>
                        <th className="py-4 px-4">Valor</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {records.map((r) => {
                        const isReceita = r.type === 'receita';
                        const patientName = r.patient?.fullName || r.patient?.name;
                        const recipientName = r.recipientUser?.fullName || (r.recipientUser as any)?.full_name;

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Date */}
                            <td className="py-4 px-6 font-mono font-semibold text-slate-600 text-xs">
                              {r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                            </td>

                            {/* Description */}
                            <td className="py-4 px-4">
                              <div className="space-y-0.5">
                                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {r.title}
                                </h4>
                                {patientName && (
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <UserIcon className="w-3 h-3" />
                                    Paciente: {patientName}
                                  </span>
                                )}
                                {recipientName && (
                                  <span className="text-[11px] text-indigo-600 flex items-center gap-1 font-semibold">
                                    <Wallet className="w-3 h-3" />
                                    Destinatário: {recipientName}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Type & Category */}
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    isReceita
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}
                                >
                                  {isReceita ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {isReceita ? 'Entrada (Receita)' : 'Saída (Despesa)'}
                                </span>
                                {r.category && !isReceita && <div>{getCategoryBadge(r.category)}</div>}
                              </div>
                            </td>

                            {/* Payment Method */}
                            <td className="py-4 px-4 uppercase font-mono text-[11px] text-slate-500 font-bold">
                              {r.paymentMethod || 'PIX'}
                            </td>

                            {/* Amount */}
                            <td className="py-4 px-4">
                              <span
                                className={`text-sm font-black ${
                                  isReceita ? 'text-emerald-700' : 'text-red-600'
                                }`}
                              >
                                {isReceita ? '+' : '-'} {formatCurrency(r.amount)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              {getStatusBadge(r.status)}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {r.status !== 'baixado' && r.status !== 'cancelado' && (
                                  <button
                                    onClick={() => handleDarBaixa(r.id)}
                                    className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                    title="Dar Baixa"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Baixar</span>
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Bar */}
              {records.length > 0 && meta.lastPage > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Página <strong>{meta.currentPage}</strong> de <strong>{meta.lastPage}</strong> ({meta.total} registros)
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page <= 1}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPage((prev) => Math.min(meta.lastPage, prev + 1))}
                      disabled={page >= meta.lastPage}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal: Novo Lançamento Financeiro */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${newType === 'receita' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {newType === 'receita' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {newType === 'receita' ? 'Novo Lançamento de Receita' : 'Novo Lançamento de Despesa'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {newType === 'receita' ? 'Registre uma entrada no caixa' : 'Registre uma saída ou custo operacional'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRecord} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Type Selector Toggle (Prata / Ouro) */}
                {isPlanAllowed && (
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setNewType('receita')}
                      className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        newType === 'receita'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Receita (+ Entrada)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewType('despesa')}
                      className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        newType === 'despesa'
                          ? 'bg-white text-red-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                      <span>Despesa (- Saída)</span>
                    </button>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição / Título *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newType === 'receita'
                        ? 'Ex: Sessão de Fisioterapia, Avaliação Inicial...'
                        : 'Ex: Aluguel da Clínica, Materiais Descartáveis, Salário...'
                    }
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
                    <CurrencyInput
                      value={newAmount}
                      onChange={(val) => setNewAmount(val)}
                      placeholder="R$ 150,00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Data do Lançamento *</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* If Despesa, Category & Recipient */}
                {newType === 'despesa' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Categoria da Despesa
                      </label>
                      <CustomSelect
                        size="md"
                        value={newCategory}
                        onChange={(val) => setNewCategory(String(val))}
                        options={modalCategoryOptions}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Profissional / Destinatário (Opcional)
                      </label>
                      <CustomSelect
                        size="md"
                        value={newRecipientUserId}
                        onChange={(val) => setNewRecipientUserId(String(val))}
                        options={modalRecipientOptions}
                        placeholder="Nenhum / Fornecedor Externo"
                      />
                    </div>
                  </div>
                )}

                {/* If Receita, Patient Link */}
                {newType === 'receita' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Paciente Associado (Opcional)
                    </label>
                    <CustomSelect
                      size="md"
                      value={newPatientId}
                      onChange={(val) => {
                        setNewPatientId(String(val));
                        const p = patientsList.find((item) => String(item.id) === String(val));
                        if (p && (p.sessionRate || p.session_rate)) {
                          setNewAmount(Number(p.sessionRate || p.session_rate));
                        }
                      }}
                      options={modalPatientOptions}
                      placeholder="Nenhum Paciente / Entrada Avulsa"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                    <CustomSelect
                      size="md"
                      value={newPaymentMethod}
                      onChange={(val) => setNewPaymentMethod(String(val))}
                      options={modalPaymentMethodOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status da Baixa</label>
                    <CustomSelect
                      size="md"
                      value={newStatus}
                      onChange={(val) => setNewStatus(String(val) as any)}
                      options={modalStatusOptions}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer ${
                      newType === 'receita'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Salvar Lançamento</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========== MODAL DE FILTRO AVANÇADO FINANCEIRO ========== */}
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
                      <p className="text-[11px] text-slate-500 mt-0.5">Refine seus lançamentos financeiros</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilterModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 font-medium mb-1">Data Fim</label>
                      <input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
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
                    {[
                      { value: 'all' as const, label: 'Todos', color: 'bg-slate-400' },
                      { value: 'baixado' as const, label: 'Baixado (Pago)', color: 'bg-emerald-500' },
                      { value: 'pendente' as const, label: 'Pendente', color: 'bg-amber-500' },
                      { value: 'cancelado' as const, label: 'Cancelado', color: 'bg-red-500' },
                    ].map((opt) => {
                      const isActive = tempStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTempStatus(opt.value)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
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

                {/* 3. Category Filter */}
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Categoria
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Todas', icon: LayoutGrid },
                      { value: 'salario', label: 'Salários', icon: Briefcase },
                      { value: 'aluguel', label: 'Aluguel', icon: Building2 },
                      { value: 'insumos', label: 'Insumos', icon: Stethoscope },
                      { value: 'marketing', label: 'Marketing', icon: Laptop },
                      { value: 'impostos', label: 'Impostos', icon: Landmark },
                      { value: 'outros', label: 'Outros', icon: Package },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isActive = tempCategory === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTempCategory(opt.value)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-[1.02]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          {opt.label}
                          {isActive && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-slate-200" />

                {/* 4. Employees / Physios */}
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                    Funcionários
                  </label>
                  {teamList.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {teamList.map((member) => {
                        const name = member.fullName || member.name || `#${member.id}`;
                        const isActive = tempPhysios.includes(String(member.id));
                        const initials = name.split(' ').slice(0, 2).map((n: string) => n.charAt(0).toUpperCase()).join('');
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setTempPhysios((prev) =>
                                prev.includes(String(member.id))
                                  ? prev.filter((p) => p !== String(member.id))
                                  : [...prev, String(member.id)]
                              );
                            }}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
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
                    <p className="text-xs text-slate-400 italic">Carregando equipe...</p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-slate-200" />

                {/* 5. Type (Entrada / Saída) */}
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Filter className="w-4 h-4 text-amber-500" />
                    Tipo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'todos' as const, label: 'Todos', icon: LayoutGrid, desc: 'Sem filtro' },
                      { value: 'receita' as const, label: 'Entrada', icon: ArrowDownCircle, desc: 'Receitas' },
                      { value: 'despesa' as const, label: 'Saída', icon: ArrowUpCircle, desc: 'Despesas' },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isActive = tempType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTempType(opt.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-50 text-amber-800 border-amber-400 shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span>{opt.label}</span>
                          <span className={`text-[9px] font-medium ${isActive ? 'text-amber-600' : 'text-slate-400'}`}>{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-5 py-4 rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setTempStartDate('');
                      setTempEndDate('');
                      setTempStatus('all');
                      setTempCategory('all');
                      setTempType('todos');
                      setTempPhysios([]);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpar Filtros
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStartDate(tempStartDate);
                      setFilterEndDate(tempEndDate);
                      setStatusFilter(tempStatus);
                      setCategoryFilter(tempCategory);
                      setFilterTypeAdvanced(tempType);
                      setFilterPhysios(tempPhysios);
                      setPage(1);
                      setShowFilterModal(false);
                    }}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
