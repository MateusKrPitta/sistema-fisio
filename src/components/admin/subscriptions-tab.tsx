'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-context';
import {
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  PlusCircle,
  Search,
  RefreshCw,
  Loader2,
  Trash2,
  ExternalLink,
  Copy,
  Building2,
  X,
  CreditCard,
  Zap,
  ChevronDown,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect, SelectOption } from '@/components/custom-select';

const invoiceStatusOptions: SelectOption[] = [
  { value: 'pending', label: 'Pendente', colorDot: 'bg-amber-500' },
  { value: 'paid', label: 'Pago', colorDot: 'bg-emerald-500' },
  { value: 'overdue', label: 'Atrasado', colorDot: 'bg-rose-500' },
  { value: 'canceled', label: 'Cancelado', colorDot: 'bg-slate-400' },
];

interface SubscriptionSummary {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  pastDueCompanies: number;
  mrr: number;
  totalPaidThisMonth: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  isMpConfigured: boolean;
}

interface Invoice {
  id: number;
  companyId: number;
  title: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  paymentMethod: string | null;
  mpPaymentId: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  ticketUrl: string | null;
  notes: string | null;
  company?: {
    id: number;
    name: string;
    cnpj?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  };
}

interface CompanyOption {
  id: number;
  name: string;
  monthlyPrice?: number;
  dueDay?: number;
}

export function SubscriptionsTab({ companies }: { companies: CompanyOption[] }) {
  const { toast } = useToast();

  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // New Invoice Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [generatePixInstant, setGeneratePixInstant] = useState(true);

  // PIX Modal
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [activePixInvoice, setActivePixInvoice] = useState<Invoice | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<number | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/subscription-invoices/summary');
      setSummary(res.data || res);
    } catch (err: any) {
      console.error('Erro ao carregar resumo de mensalidades:', err);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscription-invoices');
      const list = res.data?.data || res.data || (Array.isArray(res) ? res : []);
      setInvoices(list);
    } catch (err: any) {
      toast.error('Erro ao carregar faturas de mensalidade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchInvoices();
  }, []);

  const handleGenerateBatch = async () => {
    if (!window.confirm('Deseja gerar automaticamente as faturas do ciclo atual para todas as clínicas ativas?')) {
      return;
    }

    setGeneratingBatch(true);
    try {
      const res = await api.post('/subscription-invoices/batch-generate', {});
      toast.success(res.data?.message || 'Faturas do mês geradas com sucesso!');
      fetchSummary();
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao gerar faturas em lote.');
    } finally {
      setGeneratingBatch(false);
    }
  };

  const handleOpenCreateModal = () => {
    const today = new Date();
    const defaultDue = new Date(today.getFullYear(), today.getMonth(), 10);
    const dateStr = defaultDue.toISOString().split('T')[0];

    setSelectedCompanyId(companies[0]?.id ? String(companies[0].id) : '');
    setInvoiceTitle(`Mensalidade FisMovie - ${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`);
    setInvoiceAmount(companies[0]?.monthlyPrice ? String(companies[0].monthlyPrice) : '99.00');
    setInvoiceDueDate(dateStr);
    setInvoiceNotes('');
    setGeneratePixInstant(true);
    setModalOpen(true);
  };

  const handleCompanySelectChange = (compId: string) => {
    setSelectedCompanyId(compId);
    const found = companies.find((c) => String(c.id) === compId);
    if (found?.monthlyPrice) {
      setInvoiceAmount(String(found.monthlyPrice));
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !invoiceAmount || !invoiceDueDate) {
      toast.error('Preencha a empresa, valor e data de vencimento.');
      return;
    }

    setSavingInvoice(true);
    try {
      await api.post('/subscription-invoices', {
        companyId: Number(selectedCompanyId),
        title: invoiceTitle.trim(),
        amount: Number(invoiceAmount.replace(',', '.')),
        dueDate: invoiceDueDate,
        notes: invoiceNotes.trim(),
        generatePix: generatePixInstant,
      });

      toast.success('Cobrança gerada com sucesso!');
      setModalOpen(false);
      fetchSummary();
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar fatura.');
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleShowPix = async (inv: Invoice) => {
    setActivePixInvoice(inv);
    setPixModalOpen(true);
    setCopiedPix(false);

    if (!inv.pixQrCode && inv.status !== 'paid') {
      setPixLoading(true);
      try {
        const res = await api.post(`/subscription-invoices/${inv.id}/pix`, {});
        const updated = res.data?.invoice || inv;
        setActivePixInvoice({
          ...updated,
          pixQrCode: res.data?.pixData?.pixQrCode || updated.pixQrCode,
          pixQrCodeBase64: res.data?.pixData?.pixQrCodeBase64 || updated.pixQrCodeBase64,
        });
        fetchInvoices();
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Erro ao gerar PIX com Mercado Pago.');
      } finally {
        setPixLoading(false);
      }
    }
  };

  const handleCopyPix = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    toast.success('Código PIX Copia e Cola copiado com sucesso!');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleMarkAsPaid = async (inv: Invoice) => {
    if (!window.confirm(`Confirmar recebimento manual de R$ ${Number(inv.amount).toFixed(2)} para ${inv.company?.name || 'esta clínica'}?`)) {
      return;
    }

    try {
      await api.post(`/subscription-invoices/${inv.id}/mark-as-paid`, { paymentMethod: 'manual' });
      toast.success('Fatura marcada como PAGA e clínica reativada com sucesso!');
      fetchSummary();
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao registrar pagamento.');
    }
  };

  const handleDeleteInvoice = async (invId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta fatura?')) {
      return;
    }

    try {
      await api.delete(`/subscription-invoices/${invId}`);
      toast.success('Fatura excluída.');
      fetchSummary();
      fetchInvoices();
    } catch (err: any) {
      toast.error('Erro ao excluir fatura.');
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: number, newStatus: string) => {
    setUpdatingInvoiceId(invoiceId);
    try {
      await api.put(`/subscription-invoices/${invoiceId}/status`, { status: newStatus });
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, status: newStatus as any, paidAt: newStatus === 'paid' ? (inv.paidAt || new Date().toISOString()) : null }
            : inv
        )
      );
      const statusLabels: Record<string, string> = {
        paid: 'Pago',
        overdue: 'Atrasado',
        pending: 'Pendente',
        canceled: 'Cancelado',
      };
      toast.success(`Status da fatura alterado para "${statusLabels[newStatus] || newStatus}" com sucesso!`);
      fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Erro ao alterar status da fatura.');
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      (inv.title || '').toLowerCase().includes(q) ||
      (inv.company?.name || '').toLowerCase().includes(q) ||
      (inv.company?.cnpj || '').toLowerCase().includes(q);

    const isOverdue = inv.status === 'overdue' || (inv.status === 'pending' && new Date(inv.dueDate) < new Date());
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'overdue'
        ? isOverdue
        : statusFilter === 'paid'
        ? inv.status === 'paid'
        : statusFilter === 'pending'
        ? inv.status === 'pending' && !isOverdue
        : inv.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const paginatedInvoices = filteredInvoices.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* SaaS Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: MRR */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MRR (Faturamento Recorrente)</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              R$ {(summary?.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {summary?.activeCompanies || 0} clínicas ativas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/60">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Faturas Recebidas no Mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recebido Este Mês</p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
              R$ {(summary?.totalPaidThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {summary?.paidCount || 0} mensalidades quitadas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/60">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Clínicas em Teste (Trial) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Período de Teste (Trial)</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {summary?.trialCompanies || 0}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clínicas experimentando o FisMovie
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/60">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Faturas Pendentes / Atrasadas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inadimplentes / Atrasadas</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {summary?.overdueCount || 0}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {summary?.pendingCount || 0} a vencer
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por clínica ou título..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'pending', label: 'Pendentes' },
              { id: 'overdue', label: 'Atrasadas' },
              { id: 'paid', label: 'Pagas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 w-full lg:w-auto justify-end">
          <button
            onClick={handleGenerateBatch}
            disabled={generatingBatch}
            className="inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="Gerar faturas do mês atual para todas as clínicas cadastradas"
          >
            {generatingBatch ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <RefreshCw className="w-4 h-4 text-slate-500" />}
            <span>Gerar Lote Mensal</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Cobrança</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carregando faturas e mensalidades...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
          <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Nenhuma fatura encontrada</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Gere uma nova cobrança manual ou clique em &quot;Gerar Lote Mensal&quot; para emitir mensalidades para todas as clínicas.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Primeira Cobrança</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Clínica / Empresa</th>
                  <th className="py-3.5 px-4">Descrição e Valor</th>
                  <th className="py-3.5 px-4">Vencimento e Status</th>
                  <th className="py-3.5 px-4">Forma</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {paginatedInvoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isOverdue = inv.status === 'overdue' || (!isPaid && new Date(inv.dueDate) < new Date());
                  const formattedDue = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('pt-BR') : '--';
                  const formattedPaid = inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('pt-BR') : null;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Clinic Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {inv.company?.name ? inv.company.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate max-w-[200px]">
                              {inv.company?.name || 'Clínica'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                              {inv.company?.cnpj || inv.company?.email || '--'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Title & Amount */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{inv.title}</p>
                        <p className="font-black text-slate-900 dark:text-slate-100 text-sm">
                          R$ {Number(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>

                      {/* Due Date & Status Badge */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            Vencimento: <span className="font-bold">{formattedDue}</span>
                          </p>
                          <div className="w-36">
                            <CustomSelect
                              size="xs"
                              value={inv.status}
                              disabled={updatingInvoiceId === inv.id}
                              onChange={(val) => handleUpdateInvoiceStatus(inv.id, val)}
                              options={invoiceStatusOptions}
                              triggerClassName={
                                inv.status === 'paid'
                                  ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                                  : inv.status === 'overdue' || isOverdue
                                  ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold'
                                  : inv.status === 'canceled'
                                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold'
                                  : 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold'
                              }
                            />
                          </div>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {inv.paymentMethod === 'pix' ? (
                            <>
                              <Zap className="w-3 h-3 text-emerald-500" />
                              <span>PIX</span>
                            </>
                          ) : inv.paymentMethod === 'credit_card' ? (
                            <>
                              <CreditCard className="w-3 h-3 text-blue-500" />
                              <span>Cartão</span>
                            </>
                          ) : (
                            <span>{inv.paymentMethod ? inv.paymentMethod.toUpperCase() : 'Mercado Pago'}</span>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* PIX Button */}
                          <button
                            onClick={() => handleShowPix(inv)}
                            className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Ver QR Code e Código PIX"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>PIX</span>
                          </button>

                          {/* Mark as Paid */}
                          {!isPaid && (
                            <button
                              onClick={() => handleMarkAsPaid(inv)}
                              className="inline-flex items-center space-x-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                              title="Dar Baixa Manual (Confirmar Pagamento)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Baixa</span>
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Cobrança"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div>
                Mostrando {(page - 1) * itemsPerPage + 1} a {Math.min(page * itemsPerPage, filteredInvoices.length)} de{' '}
                {filteredInvoices.length} faturas
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="font-bold text-slate-700 dark:text-slate-200 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Nova Cobrança Manual */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Gerar Nova Cobrança de Mensalidade
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveInvoice} className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Clínica / Empresa <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={selectedCompanyId}
                    onChange={(val) => handleCompanySelectChange(String(val))}
                    options={companies.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                      sublabel: c.monthlyPrice ? `R$ ${Number(c.monthlyPrice).toFixed(2)}/mês` : undefined,
                      avatarLetter: c.name.charAt(0).toUpperCase(),
                    }))}
                    placeholder="Selecione uma empresa..."
                    searchable={true}
                    searchPlaceholder="Buscar empresa por nome..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Título da Cobrança <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={invoiceTitle}
                    onChange={(e) => setInvoiceTitle(e.target.value)}
                    required
                    placeholder="Ex: Mensalidade FisMovie - 10/2026"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Valor (R$) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      required
                      placeholder="99.00"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Data de Vencimento <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={invoiceDueDate}
                      onChange={(e) => setInvoiceDueDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Observações Internas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    placeholder="Desconto aplicado, acordo especial, etc."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="generatePixInstant"
                    checked={generatePixInstant}
                    onChange={(e) => setGeneratePixInstant(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="generatePixInstant" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    Gerar chave PIX dinâmica imediatamente via Mercado Pago
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingInvoice}
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {savingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Gerar Cobrança</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: PIX QR Code & Copia e Cola */}
      <AnimatePresence>
        {pixModalOpen && activePixInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Pagamento via PIX</h3>
                    <p className="text-xs text-slate-500">{activePixInvoice.company?.name}</p>
                  </div>
                </div>
                <button onClick={() => setPixModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pixLoading ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <p className="text-xs text-slate-500">Gerando cobrança PIX com Mercado Pago...</p>
                </div>
              ) : activePixInvoice.status === 'paid' ? (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-base">Esta fatura já foi paga!</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Valor de R$ {Number(activePixInvoice.amount).toFixed(2)} confirmado.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-500">Valor a pagar</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                      R$ {Number(activePixInvoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* QR Code Image */}
                  <div className="flex justify-center">
                    {activePixInvoice.pixQrCodeBase64 ? (
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <img
                          src={`data:image/png;base64,${activePixInvoice.pixQrCodeBase64}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300">
                        <QrCode className="w-10 h-10 text-slate-400 mb-2" />
                        <p className="text-[11px] text-slate-500">QR Code não disponível. Use o código Copia e Cola abaixo.</p>
                      </div>
                    )}
                  </div>

                  {/* Copia e Cola Field */}
                  {activePixInvoice.pixQrCode && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Código PIX Copia e Cola
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={activePixInvoice.pixQrCode}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 truncate"
                        />
                        <button
                          onClick={() => handleCopyPix(activePixInvoice.pixQrCode!)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          {copiedPix ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Liberação instantânea após pagamento</span>
                    <button
                      onClick={() => handleMarkAsPaid(activePixInvoice)}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Dar Baixa Manual
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
