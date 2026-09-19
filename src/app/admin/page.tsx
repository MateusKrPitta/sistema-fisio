'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { useAuth, CompanyInfo } from '@/context/auth-context';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-context';
import {
  Building2,
  PlusCircle,
  Search,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  Trash2,
  Edit3,
  Loader2,
  Upload,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  UserX,
  Lock,
  Calendar,
  Layers,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { maskPhone, maskCpfCnpj, maskCnpj, maskCrefito } from '@/lib/masks';

interface InitialPhysio {
  fullName: string;
  email: string;
  password: string;
  crefito: string;
  cpfCnpj: string;
  phone: string;
  role?: string;
}

interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  role: 'clinic_admin' | 'physiotherapist' | 'secretary' | 'superadmin' | string;
  crefito?: string | null;
  cpfCnpj?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  active: boolean;
  companyId?: number | null;
  company?: CompanyInfo | null;
  createdAt?: string;
}

interface CompanyWithStats extends CompanyInfo {
  users?: TeamMember[];
  usersCount?: number;
  patientsCount?: number;
  $extras?: {
    users_count?: number;
    patients_count?: number;
    appointments_count?: number;
  };
}

export default function AdminCompaniesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithStats | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'team'>('info');

  // Form State - Company
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [crefito, setCrefito] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [plan, setPlan] = useState<'bronze' | 'silver' | 'gold'>('bronze');
  const [maxPhysios, setMaxPhysios] = useState<string>('1');
  const [maxSecretaries, setMaxSecretaries] = useState<string>('0');

  // Initial Admin Account Form (When creating new company)
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCrefito, setAdminCrefito] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminCpfCnpj, setAdminCpfCnpj] = useState('');

  // Initial Physiotherapists List (during creation)
  const [physios, setPhysios] = useState<InitialPhysio[]>([]);

  // Company Team Members State (Inside Edit Modal)
  const [companyMembers, setCompanyMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const itemsPerMemberPage = 6;

  // Member Sub-Modal State (Add / Edit inside Company)
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Member Form Fields
  const [mFullName, setMFullName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPassword, setMPassword] = useState('');
  const [mRole, setMRole] = useState<'clinic_admin' | 'physiotherapist' | 'secretary'>('physiotherapist');
  const [mCrefito, setMCrefito] = useState('');
  const [mCpfCnpj, setMCpfCnpj] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAvatarUrl, setMAvatarUrl] = useState('');
  const [mActive, setMActive] = useState(true);

  // Password Visibility States
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [showPhysioPasswords, setShowPhysioPasswords] = useState<Record<number, boolean>>({});

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies');
      setCompanies(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao carregar lista de empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanyMembers = async (companyId: number) => {
    if (!companyId) return;
    setLoadingMembers(true);
    try {
      const res = await api.get(`/team?companyId=${companyId}`);
      const rawList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const normalizedList = rawList.map((item: any) => {
        const u = item?.transformerData?.[0] || item?.data || item;
        return {
          id: Number(u.id || u.userId || u.user_id),
          fullName: u.fullName || u.full_name || u.name || '',
          email: u.email || '',
          role: u.role || 'physiotherapist',
          crefito: u.crefito || null,
          cpfCnpj: u.cpfCnpj || u.cpf_cnpj || null,
          phone: u.phone || null,
          avatarUrl: u.avatarUrl || u.avatar_url || null,
          active: u.active !== false,
          companyId: u.companyId || u.company_id || companyId,
        };
      }).filter((u: any) => Boolean(u.id));

      setCompanyMembers(normalizedList);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erro ao carregar profissionais da clínica.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const resetForm = () => {
    setEditingCompany(null);
    setActiveTab('info');
    setCompanyName('');
    setCnpj('');
    setCrefito('');
    setEmail('');
    setPhone('');
    setAddress('');
    setLogoUrl('');
    setStatus('active');
    setPlan('bronze');
    setMaxPhysios('1');
    setMaxSecretaries('0');
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminCrefito('');
    setAdminPhone('');
    setAdminCpfCnpj('');
    setShowAdminPassword(false);
    setShowPhysioPasswords({});
    setPhysios([]);
    setCompanyMembers([]);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEditModal = async (comp: CompanyWithStats, tab: 'info' | 'team' = 'info') => {
    if (!comp?.id) return;
    setEditingCompany(comp);
    setActiveTab(tab);
    setCompanyName(comp.name || '');
    setCnpj(maskCnpj(comp.cnpj || ''));
    setCrefito(maskCrefito(comp.crefito || ''));
    setEmail(comp.email || '');
    setPhone(maskPhone(comp.phone || ''));
    setAddress(comp.address || '');
    setLogoUrl(comp.logoUrl || '');
    setStatus(comp.status || 'active');
    setPlan(comp.plan || 'bronze');
    setMaxPhysios(comp.maxPhysios === null ? '' : String(comp.maxPhysios ?? 1));
    setMaxSecretaries(comp.maxSecretaries === null ? '' : String(comp.maxSecretaries ?? 0));
    setCompanyMembers([]);
    setMemberPage(1);
    setMemberSearch('');
    setModalOpen(true);

    fetchCompanyMembers(comp.id);

    // Fetch full company details
    try {
      const compRes = await api.get(`/companies/${comp.id}`);
      const data = compRes?.data?.id ? compRes.data : (compRes?.id ? compRes : null);
      if (data) {
        setCompanyName(data.name || '');
        setCnpj(maskCnpj(data.cnpj || ''));
        setCrefito(maskCrefito(data.crefito || ''));
        setEmail(data.email || '');
        setPhone(maskPhone(data.phone || ''));
        setAddress(data.address || '');
        setLogoUrl(data.logoUrl || '');
        setStatus(data.status || 'active');
        setPlan(data.plan || 'bronze');
        setMaxPhysios(data.maxPhysios === null ? '' : String(data.maxPhysios ?? 1));
        setMaxSecretaries(data.maxSecretaries === null ? '' : String(data.maxSecretaries ?? 0));
      }
    } catch {
      // Ignora erro e continua com dados locais
    }
  };

  const handleAddPhysioRow = () => {
    setPhysios(prev => [
      ...prev,
      {
        fullName: '',
        email: '',
        password: '',
        crefito: '',
        cpfCnpj: '',
        phone: '',
        role: 'physiotherapist',
      },
    ]);
  };

  const handleUpdatePhysioRow = (index: number, field: keyof InitialPhysio, value: string) => {
    let formattedValue = value;
    if (field === 'cpfCnpj') formattedValue = maskCpfCnpj(value);
    if (field === 'phone') formattedValue = maskPhone(value);
    if (field === 'crefito') formattedValue = maskCrefito(value);

    setPhysios(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: formattedValue };
      return updated;
    });
  };

  const handleRemovePhysioRow = (index: number) => {
    setPhysios(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('A imagem da logo deve ter no máximo 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
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
          setLogoUrl(canvas.toDataURL('image/png', 0.9));
        } else {
          setLogoUrl(readerEvent.target?.result as string);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMemberAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const maxDim = 400;
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
          setMAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setMAvatarUrl(readerEvent.target?.result as string);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('Informe o nome da empresa.');
      return;
    }

    if (!editingCompany && (!adminEmail.trim() || !adminPassword.trim())) {
      toast.error('Informe o e-mail e senha do administrador da empresa.');
      return;
    }

    setSaving(true);

    try {
      if (editingCompany) {
        // Update existing company
        await api.put(`/companies/${editingCompany.id}`, {
          name: companyName.trim(),
          cnpj: cnpj.trim() || null,
          crefito: crefito.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          logoUrl: logoUrl || null,
          status,
          plan,
          maxPhysios: maxPhysios === '' ? null : Number(maxPhysios),
          maxSecretaries: maxSecretaries === '' ? null : Number(maxSecretaries),
        });
        toast.success('Empresa atualizada com sucesso!');
      } else {
        // Create new company + admin + optional physios
        await api.post('/companies', {
          name: companyName.trim(),
          cnpj: cnpj.trim() || null,
          crefito: crefito.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          logoUrl: logoUrl || null,
          status,
          plan,
          maxPhysios: maxPhysios === '' ? null : Number(maxPhysios),
          maxSecretaries: maxSecretaries === '' ? null : Number(maxSecretaries),
          adminName: adminName.trim() || `Admin ${companyName.trim()}`,
          adminEmail: adminEmail.trim(),
          adminPassword,
          adminCrefito: adminCrefito.trim() || null,
          adminPhone: adminPhone.trim() || null,
          adminCpfCnpj: adminCpfCnpj.trim() || null,
          physiotherapists: physios.filter((p) => p.email && p.password && p.fullName),
        });
        toast.success('Empresa e acessos cadastrados com sucesso!');
      }

      setModalOpen(false);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar informações da empresa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a empresa "${name}"? Todos os vínculos e dados serão afetados.`)) {
      return;
    }

    try {
      await api.delete(`/companies/${id}`);
      toast.success('Empresa removida com sucesso.');
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover empresa.');
    }
  };

  // --- Team Member Submodal Actions ---
  const handleOpenAddMemberModal = () => {
    setEditingMember(null);
    setMFullName('');
    setMEmail('');
    setMPassword('');
    setShowMemberPassword(false);
    setMRole('physiotherapist');
    setMCrefito('');
    setMCpfCnpj('');
    setMPhone('');
    setMAvatarUrl('');
    setMActive(true);
    setMemberModalOpen(true);
  };

  const handleOpenEditMemberModal = (m: TeamMember) => {
    setEditingMember(m);
    setMFullName(m.fullName || (m as any).full_name || '');
    setMEmail(m.email || '');
    setMPassword(''); // Senha vazia para manter atual
    setShowMemberPassword(false);
    setMRole((m.role as any) || 'physiotherapist');
    setMCrefito(maskCrefito(m.crefito || ''));
    setMCpfCnpj(maskCpfCnpj(m.cpfCnpj || (m as any).cpf_cnpj || ''));
    setMPhone(maskPhone(m.phone || ''));
    setMAvatarUrl(m.avatarUrl || (m as any).avatar_url || '');
    setMActive(m.active !== false);
    setMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    if (!mFullName.trim()) {
      toast.error('Informe o nome completo do profissional.');
      return;
    }
    if (!mEmail.trim()) {
      toast.error('Informe o e-mail de acesso.');
      return;
    }
    if (!editingMember && !mPassword.trim()) {
      toast.error('Informe a senha de acesso inicial.');
      return;
    }

    setSavingMember(true);
    try {
      if (editingMember) {
        if (!editingMember.id) {
          toast.error('Erro: ID do profissional não encontrado.');
          return;
        }

        const payload: any = {
          fullName: mFullName.trim(),
          email: mEmail.toLowerCase().trim(),
          role: mRole,
          crefito: mRole === 'secretary' ? null : (mCrefito.trim() || null),
          cpfCnpj: mCpfCnpj.trim() || null,
          phone: mPhone.trim() || null,
          avatarUrl: mAvatarUrl || null,
          active: mActive,
        };
        if (mPassword.trim()) {
          payload.password = mPassword.trim();
        }

        await api.put(`/team/${editingMember.id}`, payload);
        toast.success('Profissional atualizado com sucesso!');
      } else {
        await api.post('/team', {
          fullName: mFullName.trim(),
          email: mEmail.toLowerCase().trim(),
          password: mPassword.trim(),
          role: mRole,
          crefito: mRole === 'secretary' ? null : (mCrefito.trim() || null),
          cpfCnpj: mCpfCnpj.trim() || null,
          phone: mPhone.trim() || null,
          avatarUrl: mAvatarUrl || null,
          companyId: editingCompany.id,
        });
        toast.success('Profissional cadastrado na clínica com sucesso!');
      }

      setMemberModalOpen(false);
      fetchCompanyMembers(editingCompany.id);
      fetchCompanies(); // Atualiza contador na tabela
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar profissional.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!editingCompany || !memberId) {
      toast.error('ID do profissional não encontrado.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja remover o profissional "${memberName}" desta clínica?`)) {
      return;
    }

    try {
      await api.delete(`/team/${memberId}`);
      toast.success('Profissional removido com sucesso.');
      fetchCompanyMembers(editingCompany.id);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover profissional.');
    }
  };

  const handleToggleMemberStatus = async (m: TeamMember) => {
    if (!editingCompany || !m?.id) {
      toast.error('ID do profissional não encontrado.');
      return;
    }
    try {
      await api.put(`/team/${m.id}`, { active: !m.active });
      toast.success(m.active ? 'Profissional bloqueado.' : 'Profissional ativado!');
      fetchCompanyMembers(editingCompany.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar status.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'clinic_admin':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            👑 Administrador da Clínica
          </span>
        );
      case 'physiotherapist':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            🩺 Fisioterapeuta
          </span>
        );
      case 'secretary':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            📋 Secretária(o)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.cnpj || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const totalActive = companies.filter(c => c.status === 'active').length;
  const totalUsers = companies.reduce((acc, c) => acc + (Number(c.usersCount) || Number(c.$extras?.users_count) || c.users?.length || 0), 0);

  // Pagination calculation - Companies
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCompanies = filteredCompanies.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const filteredMembers = companyMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    const name = m.fullName || (m as any).full_name || '';
    const email = m.email || '';
    const crefito = m.crefito || '';
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || crefito.toLowerCase().includes(q);
  });

  // Pagination calculation - Members inside Modal
  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerMemberPage));
  const safeMemberPage = Math.min(memberPage, totalMemberPages);
  const paginatedMembers = filteredMembers.slice(
    (safeMemberPage - 1) * itemsPerMemberPage,
    safeMemberPage * itemsPerMemberPage
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
      <Header
        title="Painel de Administração Multi-Empresas"
        subtitle="Gerenciamento master de clínicas, empresas e fisioterapeutas parceiros"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top KPI Metrics Cards (3 Colunas) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresas Cadastradas</p>
              <h3 className="text-2xl font-bold text-slate-800">{companies.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresas Ativas</p>
              <h3 className="text-2xl font-bold text-emerald-600">{totalActive}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profissionais / Equipe</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalUsers}</h3>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por empresa, CNPJ ou e-mail..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Nova Empresa</span>
          </button>
        </div>

        {/* Companies Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium text-slate-500">Carregando empresas e clínicas...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Nenhuma empresa encontrada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Cadastre sua primeira empresa/clínica com administrador e fisioterapeutas para gerenciar.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Empresa</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 sm:px-6">Empresa / Clínica</th>
                    <th className="py-3.5 px-4">Plano & Limites</th>
                    <th className="py-3.5 px-4">CNPJ & CREFITO</th>
                    <th className="py-3.5 px-4">Contato</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {paginatedCompanies.map((comp) => {
                    const uCount = Number(comp.usersCount) || Number(comp.$extras?.users_count) || comp.users?.length || 0;

                    return (
                      <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Company Name & Logo & Status */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                              {comp.logoUrl ? (
                                <img src={comp.logoUrl} alt={comp.name} className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                                {comp.name}
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold ${
                                  comp.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : comp.status === 'suspended'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {comp.status === 'active' ? '● Ativa' : comp.status === 'suspended' ? '● Suspensa' : '● Inativa'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Plano & Limites */}
                        <td className="py-3.5 px-4">
                          {comp.plan === 'silver' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
                                🥈 Prata
                              </span>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Até {comp.maxPhysios ?? 3} fisios + {comp.maxSecretaries ?? 1} sec.
                              </p>
                            </div>
                          ) : comp.plan === 'gold' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                                🥇 Ouro
                              </span>
                              <p className="text-[10px] text-amber-700 font-medium">
                                Acessos Ilimitados
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
                                🥉 Bronze
                              </span>
                              <p className="text-[10px] text-slate-500 font-medium">
                                1 Fisioterapeuta (Solo)
                              </p>
                            </div>
                          )}
                        </td>

                        {/* CNPJ & CREFITO */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {comp.cnpj ? (
                              <p className="font-mono text-slate-700 font-medium">{maskCnpj(comp.cnpj)}</p>
                            ) : (
                              <span className="text-slate-400 italic">Sem CNPJ</span>
                            )}
                            {comp.crefito && (
                              <p className="text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-400">CREFITO:</span> {comp.crefito}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Contato (Email & Telefone) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {comp.email && (
                              <p className="flex items-center space-x-1.5 text-slate-700 truncate max-w-[220px]">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{comp.email}</span>
                              </p>
                            )}
                            {comp.phone ? (
                              <p className="flex items-center space-x-1.5 text-slate-600 font-mono text-[11px]">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{maskPhone(comp.phone)}</span>
                              </p>
                            ) : (
                              !comp.email && <span className="text-slate-400 italic">Sem contato</span>
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenEditModal(comp, 'team')}
                              className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              title="Gerenciar Profissionais da Clínica"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Equipe ({uCount})</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(comp, 'info')}
                              title="Editar Empresa"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteCompany(comp.id, comp.name)}
                              title="Excluir Empresa"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

            {/* Pagination Controls & Footer Summary */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Mostrando{' '}
                <b>
                  {filteredCompanies.length === 0
                    ? 0
                    : (safeCurrentPage - 1) * itemsPerPage + 1}
                </b>{' '}
                a <b>{Math.min(safeCurrentPage * itemsPerPage, filteredCompanies.length)}</b> de{' '}
                <b>{filteredCompanies.length}</b> empresas
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

      {/* Main Modal: Create or Edit Company with Tabs */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden my-6 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {editingCompany ? editingCompany.name : 'Cadastrar Nova Empresa & Administrador'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {editingCompany ? 'Gerencie os dados cadastrais e a equipe desta clínica' : 'Configure os dados da clínica e as credenciais de acesso'}
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

              {/* Navigation Tabs (When editing existing company) */}
              {editingCompany && (
                <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-6 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('info')}
                    className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
                      activeTab === 'info'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Dados da Empresa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('team');
                      if (editingCompany?.id) {
                        fetchCompanyMembers(editingCompany.id);
                      }
                    }}
                    className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
                      activeTab === 'team'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Profissionais / Equipe</span>
                    <span className="ml-1.5 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                      {companyMembers.length}
                    </span>
                  </button>
                </div>
              )}

              {/* Modal Body Container */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* TAB 1: DADOS DA EMPRESA */}
                {(!editingCompany || activeTab === 'info') && (
                  <form onSubmit={handleSaveCompany} className="space-y-6">
                    {/* Informações da Empresa */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Empresa / Clínica *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Clínica Fisioterapia & Saúde"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
                          <input
                            type="text"
                            placeholder="00.000.000/0001-00"
                            value={cnpj}
                            onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Nº CREFITO (Clínica / Resp.)</label>
                          <input
                            type="text"
                            placeholder="Ex: 123456-F"
                            value={crefito}
                            onChange={(e) => setCrefito(maskCrefito(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Comercial</label>
                          <input
                            type="email"
                            placeholder="contato@clinica.com.br"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                          <input
                            type="text"
                            placeholder="(11) 99999-9999"
                            value={phone}
                            onChange={(e) => setPhone(maskPhone(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Completo</label>
                          <input
                            type="text"
                            placeholder="Av. Paulista, 1000, Sala 101 - Bela Vista, São Paulo - SP"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                          />
                        </div>

                        {/* Seleção do Plano da Clínica */}
                        <div className="sm:col-span-2 pt-2">
                          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                            <span className="flex items-center space-x-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>Plano de Assinatura & Limites de Acesso *</span>
                            </span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Bronze */}
                            <div
                              onClick={() => {
                                setPlan('bronze');
                                setMaxPhysios('1');
                                setMaxSecretaries('0');
                              }}
                              className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                                plan === 'bronze'
                                  ? 'border-orange-500 bg-orange-50/60 shadow-xs ring-2 ring-orange-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-extrabold text-orange-900 flex items-center space-x-1.5">
                                  <span>🥉</span>
                                  <span>Bronze</span>
                                </span>
                                {plan === 'bronze' && (
                                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-slate-800">1 Fisioterapeuta</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Clínica individual / Solo. Não inclui secretária.</p>
                            </div>

                            {/* Prata */}
                            <div
                              onClick={() => {
                                setPlan('silver');
                                setMaxPhysios('3');
                                setMaxSecretaries('1');
                              }}
                              className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                                plan === 'silver'
                                  ? 'border-slate-600 bg-slate-100 shadow-xs ring-2 ring-slate-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-extrabold text-slate-900 flex items-center space-x-1.5">
                                  <span>🥈</span>
                                  <span>Prata</span>
                                </span>
                                {plan === 'silver' && (
                                  <CheckCircle2 className="w-4 h-4 text-slate-700" />
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-slate-800">Até 3 Fisioterapeutas</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">+ 1 Secretária(o) inclusa.</p>
                            </div>

                            {/* Ouro */}
                            <div
                              onClick={() => {
                                setPlan('gold');
                                setMaxPhysios('');
                                setMaxSecretaries('');
                              }}
                              className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                                plan === 'gold'
                                  ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-extrabold text-amber-900 flex items-center space-x-1.5">
                                  <span>🥇</span>
                                  <span>Ouro</span>
                                </span>
                                {plan === 'gold' && (
                                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-amber-950">Acessos Ilimitados</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Fisioterapeutas e secretárias ilimitados.</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Status da Empresa</label>
                          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setStatus('active')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                                status === 'active'
                                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>Ativa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus('inactive')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                                status === 'inactive'
                                  ? 'bg-white text-slate-700 shadow-xs border border-slate-200/60'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              <span>Inativa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus('suspended')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                                status === 'suspended'
                                  ? 'bg-white text-rose-700 shadow-xs border border-slate-200/60'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              <span>Suspensa</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Logo da Empresa</label>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                              {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 transition-colors">
                              <Upload className="w-4 h-4" />
                              <span>Selecionar Imagem</span>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                            {logoUrl && (
                              <button
                                type="button"
                                onClick={() => setLogoUrl('')}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                                title="Remover logo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conta do Administrador da Empresa (Apenas na Criação) */}
                    {!editingCompany && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>2. Credenciais do Administrador Inicial</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Administrador *</label>
                            <input
                              type="text"
                              required
                              placeholder="Dr. João Silva"
                              value={adminName}
                              onChange={(e) => setAdminName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Acesso *</label>
                            <input
                              type="email"
                              required
                              placeholder="admin@clinica.com.br"
                              value={adminEmail}
                              onChange={(e) => setAdminEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Senha de Acesso *</label>
                            <div className="relative">
                              <input
                                type={showAdminPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 transition-colors cursor-pointer"
                                tabIndex={-1}
                                title={showAdminPassword ? "Ocultar senha" : "Ver senha"}
                              >
                                {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nº CREFITO Individual</label>
                            <input
                              type="text"
                              placeholder="Ex: 987654-F"
                              value={adminCrefito}
                              onChange={(e) => setAdminCrefito(maskCrefito(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">CPF / CNPJ</label>
                            <input
                              type="text"
                              placeholder="000.000.000-00"
                              value={adminCpfCnpj}
                              onChange={(e) => setAdminCpfCnpj(maskCpfCnpj(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                            <input
                              type="text"
                              placeholder="(11) 98888-8888"
                              value={adminPhone}
                              onChange={(e) => setAdminPhone(maskPhone(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fisioterapeutas Iniciais (Opcional na Criação) */}
                    {!editingCompany && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>3. Profissionais Iniciais da Clínica (Opcional)</span>
                          </h4>
                          <button
                            type="button"
                            onClick={handleAddPhysioRow}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Adicionar Profissional</span>
                          </button>
                        </div>

                        {physios.length === 0 ? (
                          <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                            Nenhum profissional adicional inserido. Você poderá adicionar administradores, fisioterapeutas e secretárias diretamente na aba de Profissionais após salvar.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {physios.map((p, idx) => (
                              <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700">Profissional #{idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhysioRow(idx)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Nome Completo *"
                                      value={p.fullName}
                                      onChange={(e) => handleUpdatePhysioRow(idx, 'fullName', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="email"
                                      placeholder="E-mail de login *"
                                      value={p.email}
                                      onChange={(e) => handleUpdatePhysioRow(idx, 'email', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                  <div className="relative">
                                    <input
                                      type={showPhysioPasswords[idx] ? 'text' : 'password'}
                                      placeholder="Senha de acesso *"
                                      value={p.password}
                                      onChange={(e) => handleUpdatePhysioRow(idx, 'password', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg pl-2.5 pr-8 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPhysioPasswords(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-0.5 transition-colors cursor-pointer"
                                      tabIndex={-1}
                                      title={showPhysioPasswords[idx] ? "Ocultar senha" : "Ver senha"}
                                    >
                                      {showPhysioPasswords[idx] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Nº CREFITO"
                                      value={p.crefito}
                                      onChange={(e) => handleUpdatePhysioRow(idx, 'crefito', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="CPF / CNPJ"
                                      value={p.cpfCnpj}
                                      onChange={(e) => handleUpdatePhysioRow(idx, 'cpfCnpj', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Telefone"
                                      value={p.phone}
                                      onChange={(e) => handleUpdatePhysioRow(idx, 'phone', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Submit Buttons */}
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
                        <span>{editingCompany ? 'Salvar Dados da Empresa' : 'Cadastrar Empresa & Acessos'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: PROFISSIONAIS / EQUIPE DA CLÍNICA */}
                {editingCompany && activeTab === 'team' && (
                  <div className="space-y-4">
                    {/* Quota & Plan Summary Card */}
                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-xl">
                          {plan === 'gold' ? '🥇' : plan === 'silver' ? '🥈' : '🥉'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-white">
                              Plano {plan === 'gold' ? 'Ouro' : plan === 'silver' ? 'Prata' : 'Bronze'}
                            </span>
                            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-md">
                              {plan === 'gold' ? 'Acessos Ilimitados' : plan === 'silver' ? 'Até 3 Fisios + 1 Sec.' : '1 Profissional Solo'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Fisioterapeutas: <b className="text-white">{companyMembers.filter(m => m.role === 'clinic_admin' || m.role === 'physiotherapist').length}</b> {maxPhysios ? `/ ${maxPhysios}` : '(Ilimitado)'} • Secretárias: <b className="text-white">{companyMembers.filter(m => m.role === 'secretary').length}</b> {maxSecretaries ? `/ ${maxSecretaries}` : maxSecretaries === '0' ? '(Não incluso)' : '(Ilimitado)'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('info')}
                        className="text-xs font-bold text-blue-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        Alterar Plano da Clínica
                      </button>
                    </div>

                    {/* Top Action & Search for Clinic Professionals */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar profissional nesta clínica..."
                          value={memberSearch}
                          onChange={(e) => {
                            setMemberSearch(e.target.value);
                            setMemberPage(1);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenAddMemberModal}
                        className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Adicionar Profissional à Clínica</span>
                      </button>
                    </div>

                    {/* Team Members List */}
                    {loadingMembers ? (
                      <div className="p-12 flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
                        <p className="text-xs text-slate-500">Carregando profissionais da clínica...</p>
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">Nenhum profissional encontrado</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          Adicione administradores, fisioterapeutas e secretárias diretamente nesta clínica.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddMemberModal}
                          className="mt-3.5 inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Adicionar Primeiro Profissional</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="py-3 px-4">Profissional</th>
                                <th className="py-3 px-3">Cargo</th>
                                <th className="py-3 px-3">CREFITO / CPF</th>
                                <th className="py-3 px-3">Contato</th>
                                <th className="py-3 px-4 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {paginatedMembers.map((m) => {
                                const memberName = m.fullName || (m as any).full_name || (m as any).name || m.email || 'Profissional';
                                const initial = (memberName || 'P').charAt(0).toUpperCase();

                                return (
                                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                                    {/* Avatar & Name */}
                                    <td className="py-3 px-4">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                          {m.avatarUrl || (m as any).avatar_url ? (
                                            <img
                                              src={m.avatarUrl || (m as any).avatar_url}
                                              alt={memberName}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                              {initial}
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-slate-800 truncate">{memberName}</p>
                                          <span
                                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                              m.active !== false
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}
                                          >
                                            {m.active !== false ? '● Ativo' : '● Bloqueado'}
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Role */}
                                    <td className="py-3 px-3">
                                      {getRoleBadge(m.role)}
                                    </td>

                                    {/* CREFITO / CPF */}
                                    <td className="py-3 px-3">
                                      <div className="space-y-0.5 font-mono text-[11px]">
                                        {m.crefito && <p className="text-slate-800 font-semibold">{m.crefito}</p>}
                                        {(m.cpfCnpj || (m as any).cpf_cnpj) && (
                                          <p className="text-slate-400 text-[10px]">{maskCpfCnpj(m.cpfCnpj || (m as any).cpf_cnpj)}</p>
                                        )}
                                        {!m.crefito && !(m.cpfCnpj || (m as any).cpf_cnpj) && (
                                          <span className="text-slate-400 italic">Não informado</span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Email & Phone */}
                                    <td className="py-3 px-3">
                                      <div className="space-y-0.5">
                                        <p className="text-slate-700 truncate max-w-[180px]">{m.email}</p>
                                        {m.phone && <p className="text-[10px] font-mono text-slate-400">{maskPhone(m.phone)}</p>}
                                      </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end space-x-1">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleMemberStatus(m)}
                                          title={m.active !== false ? 'Bloquear Acesso' : 'Ativar Acesso'}
                                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                            m.active !== false
                                              ? 'text-emerald-600 hover:bg-emerald-50'
                                              : 'text-slate-400 hover:bg-slate-100'
                                          }`}
                                        >
                                          {m.active !== false ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditMemberModal(m)}
                                          title="Editar Profissional"
                                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteMember(m.id, memberName)}
                                          title="Remover Profissional da Clínica"
                                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

                        {/* Modal Member Pagination Controls */}
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                          <div>
                            Mostrando{' '}
                            <b>
                              {filteredMembers.length === 0
                                ? 0
                                : (safeMemberPage - 1) * itemsPerMemberPage + 1}
                            </b>{' '}
                            a <b>{Math.min(safeMemberPage * itemsPerMemberPage, filteredMembers.length)}</b> de{' '}
                            <b>{filteredMembers.length}</b> profissionais
                          </div>

                          {totalMemberPages > 1 && (
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setMemberPage((prev) => Math.max(1, prev - 1))}
                                disabled={safeMemberPage === 1}
                                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center space-x-0.5"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Anterior</span>
                              </button>

                              {Array.from({ length: totalMemberPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => setMemberPage(pageNum)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    safeMemberPage === pageNum
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              ))}

                              <button
                                type="button"
                                onClick={() => setMemberPage((prev) => Math.min(totalMemberPages, prev + 1))}
                                disabled={safeMemberPage === totalMemberPages}
                                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center space-x-0.5"
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
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sub-Modal: Add / Edit Professional in Company */}
      <AnimatePresence>
        {memberModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl sm:max-w-4xl w-full overflow-hidden my-4"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {editingMember ? 'Editar Profissional da Clínica' : 'Adicionar Profissional à Clínica'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {editingCompany?.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveMember} className="p-6 space-y-5">
                {/* Role / Cargo Visual Cards */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Cargo / Função na Clínica *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Fisioterapeuta */}
                    <button
                      type="button"
                      onClick={() => setMRole('physiotherapist')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        mRole === 'physiotherapist'
                          ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`p-2 rounded-xl ${mRole === 'physiotherapist' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        {mRole === 'physiotherapist' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Fisioterapeuta</p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Atendimentos e avaliações</p>
                      </div>
                    </button>

                    {/* Secretária(o) */}
                    <button
                      type="button"
                      onClick={() => {
                        setMRole('secretary');
                        setMCrefito('');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        mRole === 'secretary'
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`p-2 rounded-xl ${mRole === 'secretary' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Users className="w-4 h-4" />
                        </div>
                        {mRole === 'secretary' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Secretária(o)</p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Agenda e pacientes</p>
                      </div>
                    </button>

                    {/* Administrador da Clínica */}
                    <button
                      type="button"
                      onClick={() => setMRole('clinic_admin')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        mRole === 'clinic_admin'
                          ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`p-2 rounded-xl ${mRole === 'clinic_admin' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        {mRole === 'clinic_admin' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Administrador</p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Gestão total da clínica</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Nome Completo */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dra. Larissa Souza"
                      value={mFullName}
                      onChange={(e) => setMFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  {/* E-mail de Acesso */}
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Acesso *</label>
                    <input
                      type="email"
                      required
                      placeholder="larissa@clinica.com.br"
                      value={mEmail}
                      onChange={(e) => setMEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Senha de Acesso */}
                  <div className={mRole === 'secretary' ? 'sm:col-span-1' : ''}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Senha {editingMember ? '(opcional)' : '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showMemberPassword ? 'text' : 'password'}
                        required={!editingMember}
                        placeholder={editingMember ? '••••••••' : 'Defina a senha'}
                        value={mPassword}
                        onChange={(e) => setMPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMemberPassword(!showMemberPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 transition-colors cursor-pointer"
                        tabIndex={-1}
                        title={showMemberPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showMemberPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nº CREFITO (Oculto para Secretária) */}
                  {mRole !== 'secretary' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nº CREFITO</label>
                      <input
                        type="text"
                        placeholder="Ex: 123456-F"
                        value={mCrefito}
                        onChange={(e) => setMCrefito(maskCrefito(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  )}

                  {/* CPF para Secretária ou CPF / CNPJ para outros */}
                  <div className={mRole === 'secretary' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {mRole === 'secretary' ? 'CPF' : 'CPF / CNPJ'}
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={mCpfCnpj}
                      onChange={(e) => setMCpfCnpj(maskCpfCnpj(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Telefone / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={mPhone}
                      onChange={(e) => setMPhone(maskPhone(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Status de Acesso */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status de Acesso</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setMActive(true)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          mActive
                            ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Ativo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMActive(false)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          !mActive
                            ? 'bg-white text-rose-700 shadow-xs border border-slate-200/60'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>Bloqueado</span>
                      </button>
                    </div>
                  </div>

                  {/* Foto / Avatar do Profissional */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Foto de Perfil</label>
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        {mAvatarUrl ? (
                          <img src={mAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Foto</span>
                        <input type="file" accept="image/*" onChange={handleMemberAvatarUpload} className="hidden" />
                      </label>
                      {mAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setMAvatarUrl('')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Remover foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setMemberModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingMember}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/30 flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    {savingMember && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingMember ? 'Atualizar Profissional' : 'Adicionar Profissional'}</span>
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
