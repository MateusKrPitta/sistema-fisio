'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Gift,
  PenLine
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';

interface Patient {
  id: number | string;
  fullName?: string;
  name?: string;
  cpf?: string;
  phone?: string;
  createdAt?: string;
  birthDate?: string;
}

interface Appointment {
  id: number | string;
  patientId?: number | string;
  date?: string;
  time?: string;
  status?: string;
  hasEvolution?: boolean;
  notes?: string;
  [key: string]: any;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => {
        setMetrics(res.data || res);
      })
      .catch((err) => {
        console.log('Backend connection info:', err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPatients = metrics?.totalPatients || 0;
  const pendingEvolutions = metrics?.pendingEvolutions || [];
  const pendingAppointmentsThisMonth = metrics?.pendingAppointmentsThisMonth || 0;
  const completedAppointmentsMonth = metrics?.completedAppointmentsMonth || 0;
  const todayAppointments = metrics?.todayAppointments || 0;
  const monthlyAppointmentsTotal = metrics?.monthlyAppointmentsTotal || 0;
  const weeklyChartData = metrics?.weeklyChartData || [];
  const recentPatients = metrics?.recentPatients || [];
  const birthdaysOfMonth = metrics?.birthdaysOfMonth || [];
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  return (
    <>
      <Header
        title="Painel Clínico"
        subtitle={`Bem-vindo(a) ao FisMovie${user?.fullName ? `, ${user.fullName}` : ''}`}
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 md:space-y-8 overflow-y-auto max-w-full">
        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Card 1: Total Pacientes */}
          <Link href="/patients">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pacientes</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">{totalPatients}</p>
                <p className="text-xs text-emerald-600 font-medium flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Prontuários ativos
                </p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </motion.div>
          </Link>

          {/* Card 2: Evoluções Pendentes */}
          <Link href="/appointments">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Evoluções Pendentes</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                  {pendingEvolutions.length}
                </p>
                <p className="text-xs text-amber-600/90 font-medium">
                  {pendingEvolutions.length === 1 ? '1 atendimento pendente' : `${pendingEvolutions.length} aguardando registro`}
                </p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </motion.div>
          </Link>

          {/* Card 3: A Realizar no Mês */}
          <Link href="/appointments">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">A Realizar no Mês</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-600">
                  {pendingAppointmentsThisMonth}
                </p>
                <p className="text-xs text-purple-600/90 font-medium">
                  {todayAppointments} agendado(s) para hoje
                </p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </motion.div>
          </Link>

          {/* Card 4: Concluídos no Mês */}
          <Link href="/appointments">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Atendimentos Concluídos</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {completedAppointmentsMonth}
                </p>
                <p className="text-xs text-emerald-600 font-medium">
                  Sessões finalizadas no mês
                </p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Chart Row */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg">Frequência de Atendimentos por Dia da Semana</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribuição real dos agendamentos ao longo deste mês</p>
            </div>
            <span className="self-start sm:self-auto bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-3 py-1 rounded-full font-semibold border border-blue-100 dark:border-blue-800 shrink-0">
              Mês Atual ({monthlyAppointmentsTotal} no total)
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
                <Bar dataKey="atendimentos" name="Atendimentos" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row: Patients Table & Birthdays */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Pending Evolutions Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200/80 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                    Evoluções Pendentes
                    {pendingEvolutions.length > 0 && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        {pendingEvolutions.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">Atendimentos aguardando registro de evolução clínica</p>
                </div>
              </div>
              <Link
                href="/appointments"
                className="text-blue-600 hover:text-blue-700 font-semibold text-xs sm:text-sm flex items-center space-x-1 self-start sm:self-auto"
              >
                <span>Ver Agenda Completa</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {pendingEvolutions.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 text-sm">Todas as evoluções estão em dia!</p>
                  <p className="text-xs text-slate-500 max-w-sm">Nenhum atendimento pendente de evolução clínica no momento.</p>
                </div>
                <Link
                  href="/appointments"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-1"
                >
                  Ver agenda de atendimentos
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto min-w-full">
                  <table className="w-full text-left text-sm border-collapse min-w-[540px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs">
                        <th className="py-3 px-4">Paciente</th>
                        <th className="py-3 px-4">Data & Horário</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingEvolutions.slice(0, 6).map((app: any) => {
                        const patientName = app.patientName || 'Paciente';
                        const patientId = app.patientId;
                        const rawDate = app.date ? String(app.date).split('T')[0] : '';
                        const dateParts = rawDate ? rawDate.split('-') : [];
                        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : rawDate || '--';
                        const appTime = app.startTime || app.time || '';

                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const isTodayApp = rawDate === todayStr;

                        const statusLower = (app.status || 'pendente').toLowerCase();
                        const isConcluded = ['finalizado', 'concluido', 'concluído', 'atendido'].includes(statusLower);

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                                  {patientName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 truncate">{patientName}</p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {app.specialty || 'Atendimento Clínico'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-medium">
                                <span>{formattedDate}</span>
                                {appTime && <span className="text-slate-400 font-normal">às {appTime}</span>}
                                {isTodayApp && (
                                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-pink-100 text-pink-600 rounded">
                                    Hoje
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {isConcluded ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Sem Evolução
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  {app.status === 'em_atendimento' ? 'Em Atendimento' : 'Agendado'}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center space-x-1.5">
                                {patientId ? (
                                  <Link
                                    href={`/patients/${patientId}/evolution/new?appointmentId=${app.id}`}
                                    className="inline-flex items-center space-x-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                                  >
                                    <PenLine className="w-3.5 h-3.5" />
                                    <span>Evoluir</span>
                                  </Link>
                                ) : (
                                  <Link
                                    href="/appointments"
                                    className="inline-flex items-center space-x-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    <span>Ver</span>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {pendingEvolutions.slice(0, 6).map((app: any) => {
                    const patientName = app.patientName || 'Paciente';
                    const patientId = app.patientId;
                    const rawDate = app.date ? String(app.date).split('T')[0] : '';
                    const dateParts = rawDate ? rawDate.split('-') : [];
                    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : rawDate || '--';
                    const appTime = app.startTime || app.time || '';

                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const isTodayApp = rawDate === todayStr;

                    const statusLower = (app.status || 'pendente').toLowerCase();
                    const isConcluded = ['finalizado', 'concluido', 'concluído', 'atendido'].includes(statusLower);

                    return (
                      <div key={app.id} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col space-y-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                              {patientName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{patientName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {app.specialty || 'Atendimento Clínico'}
                              </p>
                            </div>
                          </div>
                          {isConcluded ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                              S/ Evolução
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                              {app.status === 'em_atendimento' ? 'Em Atend.' : 'Agendado'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <span className="bg-white px-2 py-1 rounded shadow-xs border border-slate-200">{formattedDate}</span>
                            {appTime && <span className="text-slate-400 font-normal">às {appTime}</span>}
                            {isTodayApp && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pink-100 text-pink-600 rounded">
                                Hoje
                              </span>
                            )}
                          </div>
                          {patientId ? (
                            <Link
                              href={`/patients/${patientId}/evolution/new?appointmentId=${app.id}`}
                              className="inline-flex items-center space-x-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition-colors shrink-0"
                            >
                              <PenLine className="w-3.5 h-3.5" />
                              <span>Evoluir</span>
                            </Link>
                          ) : (
                            <Link
                              href="/appointments"
                              className="inline-flex items-center space-x-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                            >
                              <span>Ver</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Birthdays Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-500" /> Aniversariantes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pacientes do mês atual</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] lg:max-h-[none]">
              {birthdaysOfMonth.length > 0 ? (
                birthdaysOfMonth.map((patient: any) => {
                  const day = patient.day;
                  const isToday = patient.isToday;

                  return (
                    <div key={patient.id} className={`flex items-center justify-between p-3 rounded-xl border ${isToday ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isToday ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {day}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{patient.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isToday ? <span className="text-pink-600 dark:text-pink-400 font-medium">Aniversário Hoje! 🎉</span> : 'Neste mês'}
                          </p>
                        </div>
                      </div>
                      <Link href={`/patients/${patient.id}`} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                  <Gift className="w-8 h-8 opacity-20" />
                  <p className="text-sm">Nenhum aniversariante este mês.</p>
                </div>
              )}
            </div>
            
            <Link href="/birthdays" className="mt-4 text-center text-sm font-semibold text-blue-600 hover:text-blue-700">
              Ver todos os aniversariantes
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
