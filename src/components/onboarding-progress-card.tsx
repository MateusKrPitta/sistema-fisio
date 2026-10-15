'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  Layers,
  Activity,
  ShieldCheck,
  Trophy,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface OnboardingTask {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  href: string;
  actionText: string;
  icon: any;
  isCompleted: boolean;
  points: number;
}

interface OnboardingProgressCardProps {
  totalPatients?: number;
  totalAppointments?: number;
  completedAppointments?: number;
  hasEvolutions?: boolean;
}

export function OnboardingProgressCard({
  totalPatients = 0,
  totalAppointments = 0,
  completedAppointments = 0,
  hasEvolutions = false,
}: OnboardingProgressCardProps) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Carrega preferências do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('fismovie_onboarding_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, []);

  const tasks: OnboardingTask[] = useMemo(() => {
    const hasPatients = Number(totalPatients) > 0;
    const hasAppointments = Number(totalAppointments) > 0 || Number(completedAppointments) > 0;
    const hasClinicConfig = Boolean(user?.company?.name || user?.company?.logoUrl);

    return [
      {
        id: 'patient',
        stepNumber: 1,
        title: 'Cadastrar primeiro paciente',
        description: 'Crie o prontuário digital com dados pessoais e queixa clínica.',
        href: '/pacientes/new',
        actionText: 'Cadastrar Paciente',
        icon: Users,
        isCompleted: hasPatients,
        points: 20,
      },
      {
        id: 'appointment',
        stepNumber: 2,
        title: 'Agendar primeiro atendimento',
        description: 'Marque uma consulta na grade de horários da clínica.',
        href: '/atendimentos',
        actionText: 'Abrir Agenda',
        icon: Calendar,
        isCompleted: hasAppointments,
        points: 20,
      },
      {
        id: 'evaluation',
        stepNumber: 3,
        title: 'Realizar avaliação clínica',
        description: 'Preencha o mapa de dor corporal e anexe fotos posturais.',
        href: '/avaliacoes/modulos',
        actionText: 'Iniciar Avaliação',
        icon: Layers,
        isCompleted: hasPatients && (hasAppointments || hasEvolutions),
        points: 20,
      },
      {
        id: 'evolution',
        stepNumber: 4,
        title: 'Registrar evolução pós-sessão',
        description: 'Documente a conduta e acompanhe a melhora do paciente.',
        href: '/evolucoes',
        actionText: 'Lançar Evolução',
        icon: Activity,
        isCompleted: hasEvolutions || Number(completedAppointments) > 0,
        points: 20,
      },
      {
        id: 'team',
        stepNumber: 5,
        title: 'Configurar equipe ou clínica',
        description: 'Cadastre fisioterapeutas com CREFITO ou personalize sua marca.',
        href: user?.role === 'superadmin' ? '/admin' : '/equipe',
        actionText: 'Gerenciar Equipe',
        icon: ShieldCheck,
        isCompleted: hasClinicConfig,
        points: 20,
      },
    ];
  }, [totalPatients, totalAppointments, completedAppointments, hasEvolutions, user]);

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);
  const isAllCompleted = progressPercent === 100;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fismovie_onboarding_dismissed', 'true');
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden text-slate-900 dark:text-slate-100"
    >
      {/* Barra de Progresso com Paleta Oficial Azul/Ciano */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Header do Card */}
      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0 shadow-2xs">
            {isAllCompleted ? (
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            ) : (
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                isAllCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-cyan-400'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                {isAllCompleted ? 'Configuração Completa' : 'Primeiros Passos da Clínica'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isAllCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800'
              }`}>
                {progressPercent}% Concluído ({completedCount} de {tasks.length} etapas)
              </span>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {isAllCompleted
                ? 'Parabéns! Sua clínica está 100% pronta para atender com excelência.'
                : 'Complete as etapas abaixo para aproveitar todos os recursos do sistema:'}
            </h2>
          </div>
        </div>

        {/* Controles de Ação (Recolher / Fechar) */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <span>{isCollapsed ? 'Ver Todas as Etapas' : 'Recolher'}</span>
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {isAllCompleted && (
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Dispensar este aviso"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grade de Tarefas / Etapas */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {tasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <div
                      key={task.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                        task.isCompleted
                          ? 'bg-slate-50/90 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs hover:border-blue-400 dark:hover:border-blue-700'
                      }`}
                    >
                      {/* Topo do Card da Etapa */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-400 border border-blue-200/60 dark:border-blue-800/80 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Etapa 0{task.stepNumber}
                            </span>
                          </div>

                          {task.isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Concluído</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              +{task.points}%
                            </span>
                          )}
                        </div>

                        {/* Título sem cortes e com alto contraste */}
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug break-words pt-1">
                          {task.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          {task.description}
                        </p>
                      </div>

                      {/* Botão de Ação / Confirmação */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {task.isCompleted ? (
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 py-0.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span>Tarefa realizada na clínica</span>
                          </div>
                        ) : (
                          <Link
                            href={task.href}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all duration-200 group cursor-pointer"
                          >
                            <span>{task.actionText}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>


        )}
      </AnimatePresence>
    </motion.div>
  );
}
