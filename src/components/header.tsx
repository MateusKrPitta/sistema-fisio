'use client';

import React, { useEffect, useState } from 'react';
import { PlusCircle, User, Menu, Gift } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useLayout } from './layout-shell';
import { api } from '@/lib/api';
import { ThemeToggle } from './theme-toggle';

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
  const { user } = useAuth();
  const { toggleMobileMenu } = useLayout();
  const [todayBirthdayCount, setTodayBirthdayCount] = useState<number>(0);

  const isSuperadmin = user?.role === 'superadmin';
  const shouldShowNewPatient = showNewPatientAction && !isSuperadmin;
  const shouldShowBirthday = showBirthdayNotification && !isSuperadmin;

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
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors relative flex items-center justify-center"
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
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all duration-200 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Paciente</span>
          </Link>
        )}

        {/* Divider */}
        {(shouldShowBirthday || shouldShowNewPatient) && (
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden xs:block"></div>
        )}

        {/* User Info Badge */}
        <div className="flex items-center space-x-2.5 text-sm">
          <div className="text-right hidden md:block">
            <p className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
              {user?.fullName || user?.name || user?.email?.split('@')[0] || 'Profissional'}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {user?.role === 'secretary'
                ? 'Secretária / Recepção'
                : user?.role === 'clinic_admin'
                ? 'Administrador da Clínica'
                : user?.role === 'superadmin'
                ? 'Super Administrador'
                : user?.crefito
                ? `CREFITO ${user.crefito}`
                : 'Fisioterapeuta'}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0 overflow-hidden shadow-xs">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'Foto de Perfil'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {(user?.fullName || user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
