'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-context';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  Edit3,
  Trash2,
  Loader2,
  Upload,
  CheckCircle2,
  X,
  Building2,
  Lock,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  DollarSign,
  Wallet,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { maskCpfCnpj, maskPhone, maskCrefito } from '@/lib/masks';
import { CurrencyInput, formatCurrency } from '@/components/currency-input';
import { CustomSelect } from '@/components/custom-select';

interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  role: 'superadmin' | 'clinic_admin' | 'physiotherapist' | 'secretary' | string;
  crefito?: string | null;
  cpfCnpj?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  active?: boolean;
  companyId?: number | null;
  compensationType?: 'fixed' | 'per_session' | 'percentage' | 'hybrid' | 'pro_labore' | null;
  baseSalary?: number | null;
  sessionRate?: number | null;
  commissionPercentage?: number | null;
  paymentDay?: number | null;
  pixKey?: string | null;
  bankInfo?: string | null;
  company?: {
    id: number;
    name: string;
  } | null;
}

interface QuotaInfo {
  companyId?: number;
  companyName?: string;
  plan: 'bronze' | 'silver' | 'gold';
  maxPhysios: number | null;
  maxSecretaries: number | null;
  physiosUsed: number;
  secretariesUsed: number;
  canAddPhysio: boolean;
  canAddSecretary: boolean;
}

export default function TeamManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const companyIdFilter = searchParams ? searchParams.get('companyId') : null;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'clinic_admin' | 'physiotherapist' | 'secretary'>('physiotherapist');
  const [crefito, setCrefito] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [active, setActive] = useState(true);

  // Compensation State
  const [compensationType, setCompensationType] = useState<'fixed' | 'per_session' | 'percentage' | 'hybrid' | 'pro_labore'>('fixed');
  const [baseSalary, setBaseSalary] = useState<number | string>('');
  const [sessionRate, setSessionRate] = useState<number | string>('');
  const [commissionPercentage, setCommissionPercentage] = useState<number | string>('');
  const [paymentDay, setPaymentDay] = useState<number | string>(5);
  const [pixKey, setPixKey] = useState('');
  const [bankInfo, setBankInfo] = useState('');

  const fetchQuota = async () => {
    try {
      const url = companyIdFilter ? `/team/quota?companyId=${companyIdFilter}` : '/team/quota';
      const res = await api.get(url);
      const data = res?.data || res;
      if (data?.plan) {
        setQuota(data);
      }
    } catch {
      // non-blocking
    }
  };

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const url = companyIdFilter ? `/team?companyId=${companyIdFilter}` : '/team';
      const res = await api.get(url);
      setMembers(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
      fetchQuota();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao carregar equipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [companyIdFilter]);

  const resetForm = () => {
    setEditingMember(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('physiotherapist');
    setCrefito('');
    setCpfCnpj('');
    setPhone('');
    setAvatarUrl('');
    setActive(true);
    setCompensationType('per_session');
    setBaseSalary('');
    setSessionRate('');
    setCommissionPercentage('');
    setPaymentDay(5);
    setPixKey('');
    setBankInfo('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEditModal = (m: TeamMember) => {
    setEditingMember(m);
    setFullName(m.fullName || '');
    setEmail(m.email || '');
    setPassword('');
    setShowPassword(false);
    setRole((m.role as any) || 'physiotherapist');
    setCrefito(maskCrefito(m.crefito || ''));
    setCpfCnpj(maskCpfCnpj(m.cpfCnpj || ''));
    setPhone(maskPhone(m.phone || ''));
    setAvatarUrl(m.avatarUrl || '');
    setActive(m.active !== undefined ? m.active : true);
    setCompensationType(
      (m.compensationType as any) ||
        (m.role === 'secretary' ? 'fixed' : m.role === 'clinic_admin' ? 'pro_labore' : 'per_session')
    );
    setBaseSalary(m.baseSalary !== null && m.baseSalary !== undefined ? m.baseSalary : '');
    setSessionRate(m.sessionRate !== null && m.sessionRate !== undefined ? m.sessionRate : '');
    setCommissionPercentage(
      m.commissionPercentage !== null && m.commissionPercentage !== undefined ? m.commissionPercentage : ''
    );
    setPaymentDay(m.paymentDay || 5);
    setPixKey(m.pixKey || '');
    setBankInfo(m.bankInfo || '');
    setModalOpen(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('A foto de perfil deve ter no máximo 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 500;
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setAvatarUrl(readerEvent.target?.result as string);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Nome e e-mail são obrigatórios.');
      return;
    }

    if (!editingMember && !password.trim()) {
      toast.error('A senha é obrigatória para o novo membro.');
      return;
    }

    setSaving(true);
    try {
      if (editingMember) {
        const payload: any = {
          fullName: fullName.trim(),
          email: email.trim(),
          role,
          crefito: crefito.trim() || null,
          cpfCnpj: cpfCnpj.trim() || null,
          phone: phone.trim() || null,
          avatarUrl: avatarUrl || null,
          active,
          compensationType,
          baseSalary: baseSalary !== '' ? Number(baseSalary) : null,
          sessionRate: sessionRate !== '' ? Number(sessionRate) : null,
          commissionPercentage: commissionPercentage !== '' ? Number(commissionPercentage) : null,
          paymentDay: paymentDay ? Number(paymentDay) : null,
          pixKey: pixKey.trim() || null,
          bankInfo: bankInfo.trim() || null,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await api.put(`/team/${editingMember.id}`, payload);
        toast.success('Profissional atualizado com sucesso!');
      } else {
        await api.post('/team', {
          fullName: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
          crefito: crefito.trim() || null,
          cpfCnpj: cpfCnpj.trim() || null,
          phone: phone.trim() || null,
          avatarUrl: avatarUrl || null,
          companyId: companyIdFilter ? Number(companyIdFilter) : undefined,
          compensationType,
          baseSalary: baseSalary !== '' ? Number(baseSalary) : null,
          sessionRate: sessionRate !== '' ? Number(sessionRate) : null,
          commissionPercentage: commissionPercentage !== '' ? Number(commissionPercentage) : null,
          paymentDay: paymentDay ? Number(paymentDay) : null,
          pixKey: pixKey.trim() || null,
          bankInfo: bankInfo.trim() || null,
        });
        toast.success('Novo membro cadastrado na equipe com sucesso!');
      }

      setModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar membro da equipe.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja remover "${name}" da equipe?`)) {
      return;
    }

    try {
      await api.delete(`/team/${id}`);
      toast.success('Membro removido com sucesso!');
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover membro.');
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.crefito || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q);

    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPhysios = members.filter(m => m.role === 'physiotherapist').length;
  const totalSecretaries = members.filter(m => m.role === 'secretary').length;
  const totalAdmins = members.filter(m => m.role === 'clinic_admin' || m.role === 'superadmin').length;

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'superadmin':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold">👑 Super Admin</span>;
      case 'clinic_admin':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">🏢 Admin da Clínica</span>;
      case 'secretary':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">📋 Secretária / Recepção</span>;
      case 'physiotherapist':
      default:
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">🩺 Fisioterapeuta</span>;
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedMembers = filteredMembers.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <Header
        title={companyIdFilter ? 'Equipe da Clínica' : 'Gestão de Profissionais & Equipe'}
        subtitle="Gerencie fisioterapeutas, secretárias e permissões de acesso"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Subscription Plan & Quota Banner */}
        {quota && (
          <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-3xl border border-slate-700/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 shadow-inner">
                {quota.plan === 'gold' ? '🥇' : quota.plan === 'silver' ? '🥈' : '🥉'}
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Plano {quota.plan === 'gold' ? 'Ouro (Gold)' : quota.plan === 'silver' ? 'Prata (Silver)' : 'Bronze'}
                  </h2>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    {quota.plan === 'gold' ? 'Acessos Ilimitados' : quota.plan === 'silver' ? 'Até 3 Fisios + 1 Sec.' : 'Individual / Solo'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {quota.companyName ? `Clínica: ${quota.companyName} • ` : ''}
                  Gerenciamento de acessos e vagas de profissionais da sua assinatura
                </p>
              </div>
            </div>

            {/* Quota Progress Pills */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 flex items-center space-x-2">
                <span className="text-xs text-slate-300 font-medium">🩺 Fisioterapeutas:</span>
                <span className="text-xs font-bold text-white">
                  {quota.physiosUsed} {quota.maxPhysios ? `/ ${quota.maxPhysios}` : '(Sem limite)'}
                </span>
                {quota.maxPhysios && quota.physiosUsed >= quota.maxPhysios && (
                  <span className="text-[9px] bg-rose-500/80 text-white font-extrabold px-1.5 py-0.2 rounded">
                    Esgotado
                  </span>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 flex items-center space-x-2">
                <span className="text-xs text-slate-300 font-medium">📋 Secretárias:</span>
                <span className="text-xs font-bold text-white">
                  {quota.maxSecretaries === 0
                    ? 'Não incluso'
                    : `${quota.secretariesUsed} ${quota.maxSecretaries ? `/ ${quota.maxSecretaries}` : '(Sem limite)'}`}
                </span>
                {quota.maxSecretaries !== null && quota.maxSecretaries > 0 && quota.secretariesUsed >= quota.maxSecretaries && (
                  <span className="text-[9px] bg-rose-500/80 text-white font-extrabold px-1.5 py-0.2 rounded">
                    Esgotado
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total da Equipe</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{members.length}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fisioterapeutas</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalPhysios}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Secretárias</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalSecretaries}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gestores / Admins</p>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalAdmins}</h3>
            </div>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, CREFITO ou e-mail..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'physiotherapist', label: 'Fisioterapeutas' },
                { id: 'secretary', label: 'Secretárias' },
                { id: 'clinic_admin', label: 'Administradores' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setRoleFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    roleFilter === tab.id
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Membro</span>
          </button>
        </div>

        {/* Team Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium text-slate-500">Carregando profissionais da equipe...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Nenhum membro encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Adicione fisioterapeutas ou secretárias para colaborar no atendimento da clínica.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Membro</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4 sm:px-6">Profissional</th>
                    <th className="py-3.5 px-4">Cargo & Perfil</th>
                    <th className="py-3.5 px-4">Remuneração / Salário</th>
                    <th className="py-3.5 px-4">CREFITO & CPF/CNPJ</th>
                    <th className="py-3.5 px-4">Contato</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {paginatedMembers.map((m) => {
                    const memberName = m.fullName || (m as any).full_name || (m as any).name || m.email || 'Profissional';
                    const initial = (memberName || 'P').charAt(0).toUpperCase();

                    const getCompensationBadge = (member: TeamMember) => {
                      const cType = member.compensationType || (member.role === 'secretary' ? 'fixed' : member.role === 'clinic_admin' ? 'pro_labore' : 'per_session');
                      const bSalary = member.baseSalary !== null && member.baseSalary !== undefined ? Number(member.baseSalary) : 0;
                      const sRate = member.sessionRate !== null && member.sessionRate !== undefined ? Number(member.sessionRate) : 0;
                      const cPct = member.commissionPercentage !== null && member.commissionPercentage !== undefined ? Number(member.commissionPercentage) : 0;

                      if (cType === 'fixed') {
                        return (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 text-xs">
                              {bSalary > 0 ? formatCurrency(bSalary) : 'Fixo a definir'}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-medium">
                              Salário Mensal {member.paymentDay ? `(Dia ${member.paymentDay})` : ''}
                            </span>
                          </div>
                        );
                      }
                      if (cType === 'pro_labore') {
                        return (
                          <div className="space-y-0.5">
                            <span className="font-bold text-indigo-700 text-xs">
                              {bSalary > 0 ? formatCurrency(bSalary) : 'Pró-labore a definir'}
                            </span>
                            <span className="block text-[10px] text-indigo-500 font-medium">
                              Pró-labore Mensal {member.paymentDay ? `(Dia ${member.paymentDay})` : ''}
                            </span>
                          </div>
                        );
                      }
                      if (cType === 'per_session') {
                        return (
                          <div className="space-y-0.5">
                            <span className="font-bold text-blue-700 text-xs">
                              {sRate > 0 ? `${formatCurrency(sRate)} / sessão` : 'Valor/sessão a definir'}
                            </span>
                            <span className="block text-[10px] text-blue-500 font-medium">
                              Por Atendimento Realizado
                            </span>
                          </div>
                        );
                      }
                      if (cType === 'percentage') {
                        return (
                          <div className="space-y-0.5">
                            <span className="font-bold text-emerald-700 text-xs">
                              {cPct > 0 ? `${cPct}% por sessão` : 'Comissão a definir'}
                            </span>
                            <span className="block text-[10px] text-emerald-500 font-medium">
                              Comissão sobre Faturamento
                            </span>
                          </div>
                        );
                      }
                      if (cType === 'hybrid') {
                        return (
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-700 text-xs">
                              {bSalary > 0 ? formatCurrency(bSalary) : 'R$ 0'} + {sRate > 0 ? formatCurrency(sRate) : `${cPct}%`}/sessão
                            </span>
                            <span className="block text-[10px] text-amber-500 font-medium">
                              Misto (Fixo + Sessões)
                            </span>
                          </div>
                        );
                      }
                      return <span className="text-slate-400 italic">Não configurado</span>;
                    };

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Name & Avatar & Status */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                              {m.avatarUrl || (m as any).avatar_url ? (
                                <img src={m.avatarUrl || (m as any).avatar_url} alt={memberName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                  {initial}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                                {memberName}
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold ${
                                  m.active !== false
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {m.active !== false ? '● Ativo' : '● Bloqueado'}
                              </span>
                            </div>
                          </div>
                        </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(m.role)}
                      </td>

                      {/* Remuneração & Salário */}
                      <td className="py-3.5 px-4">
                        {getCompensationBadge(m)}
                      </td>

                      {/* CREFITO & CPF/CNPJ */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {m.crefito && (
                            <p className="text-slate-700 font-medium">
                              <span className="text-slate-400 font-semibold">CREFITO:</span> {m.crefito}
                            </p>
                          )}
                          {m.cpfCnpj ? (
                            <p className="font-mono text-slate-500 text-[11px]">{m.cpfCnpj}</p>
                          ) : (
                            !m.crefito && <span className="text-slate-400 italic">Não informado</span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="flex items-center space-x-1.5 text-slate-700 truncate max-w-[220px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </p>
                          {m.phone && (
                            <p className="flex items-center space-x-1.5 text-slate-600 font-mono text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{m.phone}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            title="Editar Membro"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {m.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteMember(m.id, memberName)}
                              title="Remover Membro"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls & Footer Summary */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Mostrando{' '}
                <b>
                  {filteredMembers.length === 0
                    ? 0
                    : (safeCurrentPage - 1) * itemsPerPage + 1}
                </b>{' '}
                a <b>{Math.min(safeCurrentPage * itemsPerPage, filteredMembers.length)}</b> de{' '}
                <b>{filteredMembers.length}</b> membros
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        safeCurrentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <span>Próximo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Team Member */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {editingMember ? 'Editar Profissional da Equipe' : 'Cadastrar Novo Membro'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Defina os dados e o perfil de acesso na clínica
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Perfil de Acesso (Cargo) *</label>
                  <CustomSelect
                    value={role}
                    onChange={(val) => setRole(val as any)}
                    options={[
                      {
                        value: 'physiotherapist',
                        label: `Fisioterapeuta ${quota?.maxPhysios ? `(${quota.physiosUsed}/${quota.maxPhysios})` : ''}`,
                        sublabel: 'Acesso clínico aos pacientes e agenda',
                      },
                      {
                        value: 'secretary',
                        label: `Secretária / Recepção ${quota?.maxSecretaries === 0 ? '(Não incluso no plano)' : quota?.maxSecretaries ? `(${quota.secretariesUsed}/${quota.maxSecretaries})` : ''}`,
                        sublabel: 'Gestão de agendamentos e recepção',
                      },
                      {
                        value: 'clinic_admin',
                        label: 'Administrador da Clínica',
                        sublabel: 'Acesso total, equipe e relatórios financeiros',
                      },
                    ]}
                  />

                  {/* Contextual Quota Warning */}
                  {!editingMember && quota && (
                    <>
                      {role === 'secretary' && quota.maxSecretaries === 0 && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center space-x-2">
                          <span>⚠️</span>
                          <span>O plano {quota.plan.toUpperCase()} não permite secretárias. Faça upgrade para o plano Prata ou Ouro.</span>
                        </div>
                      )}
                      {role === 'secretary' && quota.maxSecretaries !== null && quota.maxSecretaries > 0 && quota.secretariesUsed >= quota.maxSecretaries && (
                        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center space-x-2">
                          <span>⚠️</span>
                          <span>Limite de secretárias atingido ({quota.secretariesUsed}/{quota.maxSecretaries}). Faça upgrade de plano.</span>
                        </div>
                      )}
                      {(role === 'physiotherapist' || role === 'clinic_admin') && quota.maxPhysios !== null && quota.physiosUsed >= quota.maxPhysios && (
                        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center space-x-2">
                          <span>⚠️</span>
                          <span>Limite de fisioterapeutas atingido ({quota.physiosUsed}/{quota.maxPhysios}). Faça upgrade de plano.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dra. Mariana Costa"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Login *</label>
                    <input
                      type="email"
                      required
                      placeholder="mariana@clinica.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {editingMember ? 'Nova Senha (opcional)' : 'Senha de Acesso *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingMember}
                        placeholder={editingMember ? 'Deixe em branco para não alterar' : '••••••••'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 transition-colors cursor-pointer"
                        tabIndex={-1}
                        title={showPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {role === 'physiotherapist' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nº CREFITO</label>
                      <input
                        type="text"
                        placeholder="Ex: 123456-F"
                        value={crefito}
                        onChange={(e) => setCrefito(maskCrefito(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {role === 'secretary' ? 'CPF' : 'CPF / CNPJ'}
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 97777-7777"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Foto de Perfil</label>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Selecionar Foto</span>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                          title="Remover foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remuneração & Configurações Financeiras */}
                  <div className="sm:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4 shadow-2xs">
                    <div className="flex items-center space-x-2.5 border-b border-slate-200/70 pb-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Remuneração & Salário (Folha de Pagamento)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Define a regra de cálculo automático para repasses no financeiro
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Modelo de Remuneração *
                        </label>
                        <CustomSelect
                          value={compensationType}
                          onChange={(val) => setCompensationType(val as any)}
                          options={[
                            { value: 'fixed', label: 'Salário Fixo Mensal', sublabel: 'Valor fixo pago por mês' },
                            ...(role !== 'secretary'
                              ? [
                                  { value: 'per_session', label: 'Valor Fixo por Sessão / Atendimento', sublabel: 'Repasse por sessão realizada' },
                                  { value: 'percentage', label: 'Porcentagem / Comissão por Sessão (%)', sublabel: 'Comissão percentual sobre valor' },
                                  { value: 'hybrid', label: 'Misto (Salário Base + Sessão / Comissão)', sublabel: 'Fixo mensal mais comissão variável' },
                                ]
                              : []),
                            ...(role === 'clinic_admin'
                              ? [{ value: 'pro_labore', label: 'Pró-labore / Retirada Fixa Mensal', sublabel: 'Retirada mensal de administrador' }]
                              : []),
                          ]}
                        />
                      </div>

                      {/* Base Salary Input */}
                      {(compensationType === 'fixed' ||
                        compensationType === 'hybrid' ||
                        compensationType === 'pro_labore') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {compensationType === 'pro_labore' ? 'Valor do Pró-labore Mensal' : 'Salário Fixo Mensal (R$)'}
                          </label>
                          <CurrencyInput
                            value={baseSalary}
                            onChange={(val) => setBaseSalary(val)}
                            placeholder="R$ 2.500,00"
                          />
                        </div>
                      )}

                      {/* Session Rate Input */}
                      {(compensationType === 'per_session' || compensationType === 'hybrid') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Valor por Sessão Realizada (R$)
                          </label>
                          <CurrencyInput
                            value={sessionRate}
                            onChange={(val) => setSessionRate(val)}
                            placeholder="Ex: R$ 50,00"
                          />
                        </div>
                      )}

                      {/* Commission Percentage Input */}
                      {(compensationType === 'percentage' ||
                        (compensationType === 'hybrid' && !sessionRate)) && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Comissão por Atendimento (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={commissionPercentage}
                              onChange={(e) => setCommissionPercentage(e.target.value)}
                              placeholder="Ex: 50"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 pr-8 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              %
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Payment Day */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Dia de Pagamento Mensal
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={paymentDay}
                          onChange={(e) => setPaymentDay(e.target.value)}
                          placeholder="Dia (ex: 5)"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        />
                      </div>

                      {/* PIX Key */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Chave PIX para Repasse
                        </label>
                        <input
                          type="text"
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          placeholder="CPF, e-mail, telefone ou chave aleatória"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        />
                      </div>

                      {/* Bank Info */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Dados Bancários (Opcional)
                        </label>
                        <input
                          type="text"
                          value={bankInfo}
                          onChange={(e) => setBankInfo(e.target.value)}
                          placeholder="Ex: Banco Santander, Agência 0123, CC 12345-6"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {editingMember && (
                    <div className="sm:col-span-2 flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="activeCheck"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="activeCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Conta ativa (permite fazer login no sistema)
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingMember ? 'Salvar Alterações' : 'Cadastrar Membro'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
