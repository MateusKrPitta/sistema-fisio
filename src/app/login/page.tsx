'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, Clock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/toast-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');

  const isExpired = searchParams.get('expired') === '1' || searchParams.get('session_expired') === 'true';
  const isRegistered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res.data || res;

      let tokenStr: string | null = null;
      if (typeof payload.token === 'string') {
        tokenStr = payload.token;
      } else if (payload.token?.token) {
        tokenStr = payload.token.token;
      } else if (payload.token?.value) {
        tokenStr = payload.token.value;
      } else if (payload.accessToken) {
        tokenStr = typeof payload.accessToken === 'string' ? payload.accessToken : payload.accessToken?.value || payload.accessToken?.token;
      }

      if (!tokenStr) {
        throw new Error('Token de acesso não retornado pela API.');
      }

      const user = payload.user || { email, id: payload.id || 1 };
      const fullName = user.fullName || user.email || 'Profissional';
      const firstName = fullName.split(' ')[0];
      const companyName = user.company?.name;

      setWelcomeName(firstName);
      setEntering(true);

      login(tokenStr, user);

      toast.success(
        payload.message || `Seja bem-vindo(a), ${firstName}!`,
        companyName ? `Conectado com sucesso à ${companyName}.` : 'Acesso autenticado com sucesso.'
      );

      setTimeout(() => {
        if (user.role === 'superadmin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 700);
    } catch (err: any) {
      const apiMessage = err.response?.data?.message || err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.';
      setError(apiMessage);
      toast.error('Falha na Autenticação', apiMessage);
      setLoading(false);
      setEntering(false);
    }
  };

  if (entering) {
    return (
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-6 text-center animate-in fade-in duration-500">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-2xl flex items-center justify-center">
            <Activity className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Autenticado com Sucesso!
          </h2>
          <p className="text-sm text-cyan-400 font-semibold">
            Olá, {welcomeName}! Preparando seu painel clínico...
          </p>
          <p className="text-xs text-slate-400">
            Carregando prontuários, avaliações e agenda...
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 p-0.5 overflow-hidden border border-slate-800">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full animate-pulse w-full transition-all duration-700" />
        </div>

        <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Acessando o sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-8 space-y-6">
      {/* Header Branding */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/20 mb-1">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Acesso ao FisMovie</h2>
        <p className="text-sm text-slate-400">
          Informe seus dados de acesso para gerenciar pacientes e avaliações.
        </p>
      </div>

      {isExpired && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center space-x-3 text-amber-400 text-xs sm:text-sm">
          <Clock className="w-5 h-5 shrink-0" />
          <span>Sua sessão expirou por inatividade. Faça login novamente para continuar.</span>
        </div>
      )}

      {isRegistered && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-3 text-emerald-400 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Cadastro realizado com sucesso! Faça seu primeiro login.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Seu E-mail
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@fisioterapia.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Sua Senha
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-11 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
              tabIndex={-1}
              title={showPassword ? "Ocultar senha" : "Ver senha"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || entering}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {loading || entering ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Entrar no Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* System Access Notice */}
      <div className="text-center pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
        Acesso restrito a profissionais e clínicas cadastradas.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-blue-500" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

