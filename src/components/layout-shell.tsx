'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Sidebar } from './sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface LayoutContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const LayoutContext = createContext<LayoutContextType>({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
  toggleMobileMenu: () => {},
  closeMobileMenu: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { isLoading, token, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu whenever path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isSigningPage = pathname?.startsWith('/assinar');
  const isEvaluationPage = pathname?.startsWith('/avaliacao');
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPublicPage = isAuthPage || isSigningPage || isEvaluationPage;

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!token && !isPublicPage) {
        router.replace('/login');
      } else if (token && isAuthPage) {
        if (user?.role === 'superadmin') {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
      } else if (token && user?.role === 'superadmin' && pathname === '/') {
        router.replace('/admin');
      }
    }
  }, [isLoading, token, isPublicPage, isAuthPage, user, pathname, router]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Public standalone pages for patient (no sidebar, full scrollable view)
  if (isSigningPage || isEvaluationPage) {
    return <main className="min-h-screen w-full bg-slate-50 overflow-y-auto">{children}</main>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur-lg opacity-40 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">FisMovie</h3>
            <p className="text-xs text-slate-400">Verificando credenciais e inicializando...</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-semibold pt-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  // Se não estiver autenticado e não for página pública, mostra tela de carregamento enquanto redireciona
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur-lg opacity-40 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">Redirecionando</h3>
            <p className="text-xs text-slate-400">Acesso seguro ao portal...</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-semibold pt-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Aguarde um momento...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LayoutContext.Provider
      value={{
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      <div className="flex h-screen max-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden transition-colors duration-300">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 max-w-full h-full overflow-hidden">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
