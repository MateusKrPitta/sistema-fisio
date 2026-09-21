'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  LogOut,
  X,
  Layers,
  Gift,
  DollarSign,
  Building2,
  ShieldCheck,
  UserCheck,
  BarChart3,
  Smartphone,
  Download
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useLayout } from './layout-shell';
import { APP_VERSION } from '@/lib/version';

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { isMobileMenuOpen, closeMobileMenu } = useLayout();

  const userRole = user?.role || 'clinic_admin';

  // Build navigation groups based on role
  const getNavGroups = (): NavGroup[] => {
    if (userRole === 'superadmin') {
      return [
        {
          groupName: 'Super Administração',
          items: [
            { label: 'Empresas & Clínicas', href: '/admin', icon: Building2 },
          ],
        },
      ];
    }

    if (userRole === 'clinic_admin') {
      return [
        {
          groupName: 'Principal',
          items: [
            { label: 'Dashboard', href: '/', icon: LayoutDashboard },
            { label: 'Pacientes', href: '/patients', icon: Users },
            { label: 'Atendimentos', href: '/appointments', icon: Calendar },
          ],
        },
        {
          groupName: 'Clínica & Avaliação',
          items: [
            { label: 'Avaliações', href: '/custom-forms/modules', icon: Layers },
            { label: 'Evoluções', href: '/evolutions', icon: Activity },
            { label: 'Relatórios', href: '/reports', icon: BarChart3 },
          ],
        },
        {
          groupName: 'Gestão da Clínica',
          items: [
            { label: 'Minha Equipe', href: '/team', icon: ShieldCheck },
            { label: 'Financeiro', href: '/financial', icon: DollarSign },
            { label: 'Aniversariantes', href: '/birthdays', icon: Gift },
          ],
        },
      ];
    }

    if (userRole === 'secretary') {
      return [
        {
          groupName: 'Principal',
          items: [
            { label: 'Dashboard', href: '/', icon: LayoutDashboard },
            { label: 'Pacientes', href: '/patients', icon: Users },
            { label: 'Atendimentos / Agenda', href: '/appointments', icon: Calendar },
          ],
        },
        {
          groupName: 'Gestão',
          items: [
            { label: 'Aniversariantes', href: '/birthdays', icon: Gift },
          ],
        },
      ];
    }

    // Default: physiotherapist
    return [
      {
        groupName: 'Principal',
        items: [
          { label: 'Dashboard', href: '/', icon: LayoutDashboard },
          { label: 'Meus Pacientes', href: '/patients', icon: Users },
          { label: 'Meus Atendimentos', href: '/appointments', icon: Calendar },
        ],
      },
      {
        groupName: 'Clínica & Avaliação',
        items: [
          { label: 'Avaliações', href: '/custom-forms/modules', icon: Layers },
          { label: 'Evoluções', href: '/evolutions', icon: Activity },
          { label: 'Relatórios', href: '/reports', icon: BarChart3 },
        ],
      },
      {
        groupName: 'Prática',
        items: [
          { label: 'Aniversariantes', href: '/birthdays', icon: Gift },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  const getRoleBadgeLabel = () => {
    switch (userRole) {
      case 'superadmin':
        return 'Super Administrador';
      case 'clinic_admin':
        return user?.company?.name || 'Administrador da Clínica';
      case 'secretary':
        return 'Secretária / Recepção';
      case 'physiotherapist':
      default:
        return 'Fisioterapeuta';
    }
  };

  const renderSidebarInner = (isMobile = false) => (
    <aside
      className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 shrink-0 select-none z-30 overflow-hidden"
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0 overflow-hidden"
          >
            {user?.company?.logoUrl ? (
              <img
                src={user.company.logoUrl}
                alt="Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Activity className="w-5 h-5 text-white" />
            )}
          </motion.div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight text-white truncate">
              {user?.company?.name || 'FisMovie'}
            </h1>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider truncate">
              {userRole === 'superadmin' ? 'Painel Master' : 'Gestão Clínica'}
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={closeMobileMenu}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400/90 mb-1">
              {group.groupName}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isEvolutionRoute = pathname.startsWith('/evolutions') || pathname.includes('/evolution');
              const isActive = item.href === '/'
                ? pathname === '/'
                : item.href === '/evolutions'
                ? isEvolutionRoute
                : item.href === '/custom-forms/modules'
                ? pathname.startsWith('/custom-forms')
                : item.href === '/patients'
                ? (pathname === '/patients' || (pathname.startsWith('/patients/') && !isEvolutionRoute))
                : pathname === item.href || pathname.startsWith(item.href);

              return (
                <motion.div key={item.href} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Botão de Instalação PWA */}
      <div className="px-3 pb-2 pt-1">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-pwa-install'));
            }
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/20 text-blue-400 hover:text-blue-300 transition group cursor-pointer"
          title="Instalar FisMovie no celular ou computador"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Instalar Aplicativo</span>
          </div>
          <Download className="w-3.5 h-3.5 text-blue-400/70 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/50 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 overflow-hidden min-w-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-lg object-cover shrink-0 shadow-xs border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {(user?.name || user?.fullName || user?.email || 'P').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.fullName || user?.name || user?.email?.split('@')[0] || 'Profissional'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate leading-tight">
                {getRoleBadgeLabel()}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sair da Conta"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic App Version */}
        <div className="pt-2 px-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>FisMovie Cloud</span>
          <span className="bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60 font-semibold">{APP_VERSION}</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar Sticky Container */}
      <div className="hidden lg:block w-64 shrink-0">
        {renderSidebarInner(false)}
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={closeMobileMenu}
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative z-10 w-64 h-full flex-1"
            >
              {renderSidebarInner(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
