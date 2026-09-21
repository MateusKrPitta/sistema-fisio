'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  PlusCircle,
  User,
  Menu,
  Gift,
  LogOut,
  ChevronDown,
  Building2,
  Mail,
  Award,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useLayout } from './layout-shell';
import { ThemeToggle } from './theme-toggle';
import { APP_VERSION } from '@/lib/version';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNewPatientAction?: boolean;
  showBirthdayNotification?: boolean;
}

export function Header({
  title,
  subtitle,
  showNewPatientAction = true,
  showBirthdayNotification = true,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const { toggleMobileMenu } = useLayout();
  const [todayBirthdayCount, setTodayBirthdayCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperadmin = user?.role === 'superadmin';
  const shouldShowNewPatient = showNewPatientAction && !isSuperadmin;
  const shouldShowBirthday = showBirthdayNotification && !isSuperadmin;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'secretary':
        return 'Secretária / Recepção';
      case 'clinic_admin':
        return 'Administrador da Clínica';
      case 'superadmin':
        return 'Super Administrador';
      case 'physiotherapist':
        return user?.crefito ? `Fisioterapeuta • CREFITO ${user.crefito}` : 'Fisioterapeuta';
      default:
        return 'Profissional';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'superadmin':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'clinic_admin':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'secretary':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs gap-3 transition-colors duration-300">
      <div className="flex items-center space-x-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden xs:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        <ThemeToggle />

        {/* Birthday Notification Button */}
        {shouldShowBirthday && (
          <Link
            href="/birthdays"
            prefetch={false}
            title={todayBirthdayCount > 0 ? `${todayBirthdayCount} aniversariante(s) hoje!` : 'Ver Aniversariantes'}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors relative flex items-center justify-center cursor-pointer"
          >
            <Gift className="w-5 h-5 text-rose-500" />
            {todayBirthdayCount > 0 && (
              <>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              </>
            )}
          </Link>
        )}

        {/* Quick Action Button */}
        {shouldShowNewPatient && (
          <Link
            href="/patients/new"
            prefetch={false}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all duration-200 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Paciente</span>
          </Link>
        )}

        {/* Divider */}
        {(shouldShowBirthday || shouldShowNewPatient) && (
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden xs:block"></div>
        )}

        {/* Customized User Profile Button with Interactive Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center space-x-2.5 text-sm p-1.5 -mr-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 select-none group"
            title="Minha Conta & Opções"
          >
            <div className="text-right hidden md:block">
              <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[160px] text-xs sm:text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {user?.fullName || user?.name || user?.email?.split('@')[0] || 'Profissional'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[160px]">
                {getRoleLabel()}
              </p>
            </div>

            {/* Avatar Photo with Indicator */}
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || 'Foto de Perfil'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-extrabold text-white">
                    {(user?.fullName || user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {/* Floating User Profile Card Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50 p-4 space-y-4"
              >
                {/* Profile Card Header */}
                <div className="flex items-center space-x-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-md border-2 border-white dark:border-slate-800 overflow-hidden">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(user?.fullName || user?.name || user?.email || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate leading-tight">
                      {user?.fullName || user?.name || 'Profissional'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user?.email}
                    </p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1.5 ${getRoleBadgeColor()}`}>
                      {getRoleLabel()}
                    </span>
                  </div>
                </div>

                {/* Account Metadata Details */}
                <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {user?.company?.name && (
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate font-semibold">{user.company.name}</span>
                    </div>
                  )}
                  {user?.crefito && (
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                      <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono">CREFITO: <strong>{user.crefito}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1">
                    <span>Sistema FisMovie</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      {APP_VERSION}
                    </span>
                  </div>
                </div>

                {/* Logout Button Action */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-all border border-rose-200/80 dark:border-rose-900/50 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
