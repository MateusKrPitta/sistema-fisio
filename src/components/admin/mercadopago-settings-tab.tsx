'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-context';
import {
  CreditCard,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Zap,
  Info,
  Lock,
  Copy,
  ExternalLink,
  Clock,
  DollarSign
} from 'lucide-react';

export function MercadoPagoSettingsTab() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form Fields
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [mpSandbox, setMpSandbox] = useState(false);
  const [maskedAccessToken, setMaskedAccessToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // SaaS Default Limits
  const [gracePeriodDays, setGracePeriodDays] = useState('3');
  const [defaultTrialDays, setDefaultTrialDays] = useState('14');
  const [defaultMonthlyPrice, setDefaultMonthlyPrice] = useState('99.00');

  // Test Connection Result
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/system-settings');
      const data = res.data || res;
      if (data?.mercadopago) {
        setIsConfigured(data.mercadopago.isConfigured);
        setMaskedAccessToken(data.mercadopago.maskedAccessToken || '');
        setMpPublicKey(data.mercadopago.publicKey || '');
        setMpSandbox(Boolean(data.mercadopago.isSandbox));
      }
      if (data?.billing) {
        setGracePeriodDays(String(data.billing.gracePeriodDays ?? 3));
        setDefaultTrialDays(String(data.billing.defaultTrialDays ?? 14));
        setDefaultMonthlyPrice(String(data.billing.defaultMonthlyPrice ?? 99.0));
      }
    } catch (err: any) {
      toast.error('Erro ao carregar configurações do sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);

    try {
      await api.post('/system-settings', {
        mpAccessToken: mpAccessToken.trim() || undefined,
        mpPublicKey: mpPublicKey.trim(),
        mpSandbox,
        gracePeriodDays: Number(gracePeriodDays),
        defaultTrialDays: Number(defaultTrialDays),
        defaultMonthlyPrice: Number(defaultMonthlyPrice.replace(',', '.')),
      });

      toast.success('Configurações salvas com sucesso!');
      setMpAccessToken('');
      fetchSettings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.post('/system-settings/test-mercadopago', {
        accessToken: mpAccessToken.trim() || undefined,
      });
      setTestResult({
        success: true,
        message: res.data?.message || 'Conexão bem-sucedida! Suas credenciais do Mercado Pago estão ativas.',
      });
      toast.success('Mercado Pago conectado com sucesso!');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Falha ao autenticar com o Mercado Pago.';
      setTestResult({
        success: false,
        message: msg,
      });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin.replace('3000', '3333')}/api/v1/webhooks/mercadopago`
    : 'https://seu-dominio.com.br/api/v1/webhooks/mercadopago';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL do Webhook copiada para a área de transferência!');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Carregando configurações de pagamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Status Banner */}
      <div
        className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isConfigured
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isConfigured
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border-emerald-300'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 border-amber-300'
            }`}
          >
            {isConfigured ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isConfigured ? 'Integração Mercado Pago Ativa' : 'Mercado Pago Não Configurado'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {isConfigured
                ? `Credenciais configuradas (${maskedAccessToken}). Cobranças PIX e Cartão ativas.`
                : 'Informe seu Access Token para habilitar cobranças automáticas por PIX e Cartão de Crédito.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="inline-flex items-center space-x-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-xs"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Zap className="w-4 h-4 text-amber-500" />}
          <span>Testar Conexão</span>
        </button>
      </div>

      {/* Test Result Message */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center space-x-3 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />}
          <p className="text-xs font-semibold">{testResult.message}</p>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Box 1: Credenciais Mercado Pago */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Key className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Credenciais da API do Mercado Pago
              </h4>
              <p className="text-xs text-slate-500">
                Obtidas no painel de desenvolvedores do Mercado Pago (Suas Aplicações)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Access Token {isConfigured ? '(Deixe em branco para manter o atual)' : '*'}</span>
                {maskedAccessToken && <span className="text-[11px] font-mono text-slate-400">Atual: {maskedAccessToken}</span>}
              </label>
              <input
                type="password"
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder={isConfigured ? '••••••••••••••••••••••••••••••••••••••••' : 'APP_USR-...'}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Public Key (Chave Pública)
              </label>
              <input
                type="text"
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center space-x-2.5 pt-1">
              <input
                type="checkbox"
                id="mpSandbox"
                checked={mpSandbox}
                onChange={(e) => setMpSandbox(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="mpSandbox" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                Modo Sandbox / Testes (Ambiente de homologação do Mercado Pago)
              </label>
            </div>
          </div>
        </div>

        {/* Box 2: Regras de Cobrança & Carência SaaS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Regras de Assinatura & Carência de Bloqueio
              </h4>
              <p className="text-xs text-slate-500">
                Configure os prazos padrão para testes gratuitos e tolerância de atraso
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Dias de Teste (Trial) Padrão
              </label>
              <input
                type="number"
                min="0"
                value={defaultTrialDays}
                onChange={(e) => setDefaultTrialDays(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400 mt-1">Ex: 14 dias grátis ao cadastrar.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Carência de Bloqueio (Dias)
              </label>
              <input
                type="number"
                min="0"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400 mt-1">Dias após o vencimento antes do bloqueio.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor Base da Mensalidade (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={defaultMonthlyPrice}
                onChange={(e) => setDefaultMonthlyPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400 mt-1">Preço padrão sugerido por clínica.</p>
            </div>
          </div>
        </div>

        {/* Box 3: Webhook URL Notification */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Zap className="w-5 h-5 text-emerald-500" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                URL de Webhook (Baixa Automática Instantânea)
              </h4>
              <p className="text-xs text-slate-500">
                Cole esta URL na sua conta do Mercado Pago em Notificações Webhook
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-300"
            />
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Eventos a marcar no Mercado Pago: <b>Pagamentos (payment)</b>.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
