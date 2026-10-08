'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/toast-context';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ExternalLink,
  Layers,
  Users,
} from 'lucide-react';

export interface Invoice {
  id: string;
  companyId: string;
  title: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixCopyPaste?: string;
  notes?: string;
}

export function SubscriptionTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const company = user?.company;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscription-invoices?limit=20');
      const list = res.data || (Array.isArray(res) ? res : []);
      setInvoices(list);
    } catch (err) {
      console.error('Erro ao buscar faturas da clínica:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPixPayment = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPixModalOpen(true);
    setCopiedPix(false);

    if (!inv.pixCopyPaste && !inv.pixQrCode) {
      try {
        setGeneratingPix(true);
        const res = await api.post(`/subscription-invoices/${inv.id}/pix`, {});
        const updatedInvoice = res.invoice || res.data?.invoice || res;
        const pixData = res.pixData || res.data?.pixData || {};
        const merged: Invoice = {
          ...inv,
          ...updatedInvoice,
          pixCopyPaste: pixData.pixQrCode || updatedInvoice.pixQrCode || updatedInvoice.pixCopyPaste,
          pixQrCodeBase64: pixData.pixQrCodeBase64 || updatedInvoice.pixQrCodeBase64,
        };
        setSelectedInvoice(merged);
        setInvoices((prev) => prev.map((item) => (item.id === inv.id ? merged : item)));
      } catch (err: any) {
        console.error('Erro ao gerar PIX:', err);
        toast.error(err.message || 'Não foi possível gerar a chave PIX desta fatura.');
      } finally {
        setGeneratingPix(false);
      }
    }
  };

  const handleCopyPix = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCheckPaymentStatus = async (invId: string) => {
    try {
      setCheckingPayment(true);
      await fetchInvoices();
    } finally {
      setCheckingPayment(false);
    }
  };

  const pendingInvoices = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue');
  const paidInvoices = invoices.filter((i) => i.status === 'paid');

  const subscriptionStatus = company?.subscriptionStatus || 'trial';
  const plan = company?.plan || 'bronze';
  const planName =
    plan === 'gold'
      ? 'Plano Ouro (Profissional Ilimitado)'
      : plan === 'silver'
      ? 'Plano Prata (Clínica em Crescimento)'
      : 'Plano Bronze (Solo)';

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-blue-300 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Assinatura do Sistema Fisio</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center space-x-3">
                <span>{company?.name || 'Sua Clínica'}</span>
              </h2>
              <p className="text-sm text-slate-300 mt-1 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{planName}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-[10px] ${
                    subscriptionStatus === 'exempt'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : subscriptionStatus === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : subscriptionStatus === 'trial'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {subscriptionStatus === 'exempt'
                    ? '👑 Isenta de Cobrança (Cortesia)'
                    : subscriptionStatus === 'active'
                    ? '✓ Ativa'
                    : subscriptionStatus === 'trial'
                    ? '⏳ Período de Teste'
                    : '⚠ Pendente / Regularizar'}
                </span>
              </div>

              {subscriptionStatus !== 'exempt' && (
                <>
                  <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Dia de Vencimento:</span>
                    <span className="font-bold text-white">Dia {company?.dueDay || 10}</span>
                  </div>

                  <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
                    <span className="text-slate-400">Mensalidade:</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        company?.monthlyPrice || (plan === 'gold' ? 249 : plan === 'silver' ? 149 : 99)
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Action / Next Invoice Summary */}
          {subscriptionStatus === 'exempt' ? (
            <div className="bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-purple-950/40 border border-purple-500/40 p-5 rounded-2xl w-full md:w-auto md:min-w-[280px] text-center space-y-2 backdrop-blur-md">
              <Sparkles className="w-7 h-7 text-purple-400 mx-auto animate-pulse" />
              <h4 className="text-sm font-extrabold text-white">Acesso Vitalício & Isento</h4>
              <p className="text-xs text-purple-200/90 leading-relaxed">
                Esta clínica possui isenção total de cobranças e faturas de mensalidade.
              </p>
            </div>
          ) : pendingInvoices.length > 0 ? (
            <div className="bg-blue-600/20 border border-blue-500/40 p-5 rounded-2xl w-full md:w-auto md:min-w-[280px] space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Fatura Atual</span>
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  Aguardando Pagamento
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    pendingInvoices[0].amount
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  Vencimento:{' '}
                  <b>
                    {pendingInvoices[0].dueDate
                      ? new Date(pendingInvoices[0].dueDate).toLocaleDateString('pt-BR')
                      : 'No vencimento'}
                  </b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPixPayment(pendingInvoices[0])}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Pagar Agora com PIX</span>
              </button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl w-full md:w-auto md:min-w-[260px] text-center space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Mensalidade em Dia!</h4>
              <p className="text-xs text-slate-300">
                Nenhuma pendência financeira para sua clínica.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invoices List Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Faturas e Cobranças</h3>
              <p className="text-xs text-slate-400">Histórico de mensalidades geradas para sua clínica</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchInvoices}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Atualizar faturas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Carregando faturas da sua clínica...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
              Nenhuma fatura emitida no momento
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Assim que a administração do sistema gerar a sua fatura mensal ou o ciclo de vencimento chegar, ela aparecerá aqui para pagamento via PIX.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Descrição / Referência</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{inv.title || 'Mensalidade do Sistema'}</div>
                      {inv.paidAt && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          Pago em {new Date(inv.paidAt).toLocaleDateString('pt-BR')} via {inv.paymentMethod?.toUpperCase() || 'PIX'}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-slate-100">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.amount)}
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('pt-BR') : '--'}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : inv.status === 'overdue'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {inv.status === 'paid' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pago</span>
                          </>
                        ) : inv.status === 'overdue' ? (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vencida</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Pendente</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {inv.status !== 'paid' ? (
                        <button
                          type="button"
                          onClick={() => openPixPayment(inv)}
                          className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Pagar PIX</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ Confirmado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PIX Modal for Client */}
      <AnimatePresence>
        {pixModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden my-6 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Pagamento via PIX</h3>
                    <p className="text-xs text-slate-400">{selectedInvoice.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPixModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {generatingPix ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Gerando QR Code PIX com Mercado Pago...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Amount Display */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-center border border-slate-200/80 dark:border-slate-700">
                    <span className="text-xs text-slate-400">Valor da Mensalidade:</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        selectedInvoice.amount
                      )}
                    </div>
                  </div>

                  {/* QR Code Display */}
                  {selectedInvoice.pixQrCodeBase64 ? (
                    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <img
                        src={`data:image/png;base64,${selectedInvoice.pixQrCodeBase64}`}
                        alt="QR Code PIX Mercado Pago"
                        className="w-48 h-48 rounded-lg object-contain"
                      />
                      <p className="text-[11px] text-slate-500 mt-2 font-medium">
                        Abra o app do seu banco e escaneie o código
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <QrCode className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Código PIX pronto para cópia abaixo</p>
                    </div>
                  )}

                  {/* Copy Paste Code */}
                  {selectedInvoice.pixCopyPaste && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Código PIX Copia e Cola:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={selectedInvoice.pixCopyPaste}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-400 truncate select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyPix(selectedInvoice.pixCopyPaste!)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                          title="Copiar código PIX"
                        >
                          {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      {copiedPix && (
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Código PIX copiado com sucesso!</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCheckPaymentStatus(selectedInvoice.id)}
                      disabled={checkingPayment}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      {checkingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                      <span>Já realizei o pagamento</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPixModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
