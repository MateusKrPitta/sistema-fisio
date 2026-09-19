'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface CompanyInfo {
  id: number;
  name: string;
  cnpj?: string | null;
  crefito?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  plan?: 'bronze' | 'silver' | 'gold';
  maxPhysios?: number | null;
  maxSecretaries?: number | null;
}

export interface User {
  id: string | number;
  email: string;
  fullName?: string;
  name?: string;
  crefito?: string;
  role?: 'superadmin' | 'clinic_admin' | 'physiotherapist' | 'secretary' | string;
  companyId?: number | null;
  company?: CompanyInfo | null;
  cpfCnpj?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  active?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export function normalizeUser(rawUser: any): User | null {
  if (!rawUser) return null;

  // Se veio encapsulado em transformerData do Adonis
  let base = rawUser;
  if (rawUser.transformerData && Array.isArray(rawUser.transformerData) && rawUser.transformerData[0]) {
    base = {
      ...rawUser.transformerData[0],
      company: rawUser.company || rawUser.transformerData[0].company,
    };
  } else if (rawUser.user && typeof rawUser.user === 'object') {
    return normalizeUser(rawUser.user);
  }

  return {
    id: base.id,
    email: base.email,
    fullName: base.fullName || base.full_name || base.name || '',
    name: base.fullName || base.full_name || base.name || '',
    crefito: base.crefito || '',
    role: base.role || 'physiotherapist',
    companyId: base.companyId || base.company_id || base.company?.id || null,
    company: base.company || null,
    cpfCnpj: base.cpfCnpj || base.cpf_cnpj || null,
    phone: base.phone || null,
    avatarUrl: base.avatarUrl || base.avatar_url || null,
    active: base.active !== false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Consulta manual sob demanda se necessário
  const refreshProfile = async () => {
    try {
      const res = await api.get('/account/profile');
      const data = res.data?.id ? res.data : (res.id ? res : (res.data || res));
      const normalized = normalizeUser(data);
      if (normalized) {
        setUser(normalized);
        sessionStorage.setItem('auth_user', JSON.stringify(normalized));
        localStorage.setItem('auth_user', JSON.stringify(normalized));
      }
    } catch {
      // Ignora falha
    }
  };

  useEffect(() => {
    // Leitura 100% instantânea do sessionStorage / localStorage
    const storedToken =
      sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    const storedUser =
      sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const normalized = normalizeUser(parsed);
          setUser(normalized);
          if (normalized) {
            sessionStorage.setItem('auth_user', JSON.stringify(normalized));
            localStorage.setItem('auth_user', JSON.stringify(normalized));
          }
        } catch (e) {
          console.error('Erro ao ler usuário salvo no storage:', e);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: any) => {
    setToken(newToken);
    const normalized = normalizeUser(newUser);
    setUser(normalized);
    try {
      sessionStorage.setItem('auth_token', newToken);
      sessionStorage.setItem('auth_user', JSON.stringify(normalized));
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(normalized));
    } catch (e) {
      console.error('Erro ao salvar credenciais no storage:', e);
    }
  };

  const logout = () => {
    if (token) {
      api.post('/account/logout').catch(() => {});
    }
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
