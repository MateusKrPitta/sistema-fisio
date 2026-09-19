'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  Gift,
  Cake,
  Calendar,
  Phone,
  MessageCircle,
  Sparkles,
  Loader2,
  CheckCircle,
  Users,
  Search,
  Bell,
  Heart,
  ChevronRight,
  PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface BirthdayPatient {
  id: number | string;
  name?: string;
  fullName?: string;
  birthdate?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  isToday?: boolean;
  isThisMonth?: boolean;
  ageToComplete?: number;
  day?: number;
  month?: number;
  template?: { title: string } | null;
}

export default function BirthdaysPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'all'>('today');
  const [todayList, setTodayList] = useState<BirthdayPatient[]>([]);
  const [monthList, setMonthList] = useState<BirthdayPatient[]>([]);
  const [allList, setAllList] = useState<BirthdayPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch birthdays data from GET /birthdays
  useEffect(() => {
    api
      .get('/birthdays')
      .then((res) => {
        const data = res?.data || res || {};
        const today = data.today || [];
        const month = data.month || [];
        const all = data.all || [];

        if (today.length > 0 || month.length > 0 || all.length > 0) {
          setTodayList(today);
          setMonthList(month);
          setAllList(all);
          if (today.length === 0 && month.length > 0) {
            setActiveTab('month');
          }
        } else {
          // Demo fallback
          const mockData: BirthdayPatient[] = [];
          const todayMocks = mockData.filter((p) => p.isToday);
          const monthMocks = mockData.filter((p) => p.isThisMonth);
          setTodayList(todayMocks);
          setMonthList(monthMocks);
          setAllList(mockData);
        }
      })
      .catch(() => {
        // Fallback demo data with today's birthday
        const todayIso = new Date().toISOString().split('T')[0];
        const mockToday: BirthdayPatient[] = [];
        const mockMonth: BirthdayPatient[] = [];
        setTodayList(mockToday);
        setMonthList(mockMonth);
        setAllList(mockMonth);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter list by tab & search term
  const getDisplayedList = () => {
    let list = todayList;
    if (activeTab === 'month') list = monthList;
    if (activeTab === 'all') list = allList;

    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter((p) => (p.name || p.fullName || '').toLowerCase().includes(term));
  };

  const displayedList = getDisplayedList();

  // Send WhatsApp congratulatory message
  const handleSendWhatsappGreeting = (patient: BirthdayPatient) => {
    const rawPhone = (patient.phone || '').replace(/\D/g, '');
    const patientName = patient.name || patient.fullName || 'Paciente';
    const ageText = patient.ageToComplete ? ` ${patient.ageToComplete} anos` : '';

    const text = encodeURIComponent(
      `Olá, ${patientName}! 🎉🎂\n\nToda a equipe da nossa clínica te deseja um feliz aniversário${ageText}! Que seu dia seja repleto de paz, saúde, alegrias e muitas conquistas.\n\nÉ um privilégio cuidar da sua saúde! Felicidades! ✨🎈`
    );

    const fullPhone = rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone;
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informada';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Header
        title="Central de Aniversariantes"
        subtitle="Notificações automáticas de aniversariantes do dia e envio de felicitações"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-full">
        {/* Today's Birthday Banner Notification */}
        {todayList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            {/* Background Glow Accents */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute left-1/3 -top-10 w-32 h-32 rounded-full bg-yellow-300/20 blur-xl pointer-events-none" />

            <div className="space-y-2 z-10 max-w-xl">
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-yellow-100 border border-white/30">
                <Bell className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
                <span>Notificação Especial de Hoje!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight flex items-center gap-2">
                <span>🎉</span>
                <span>
                  {todayList.length === 1
                    ? `1 Paciente fazendo aniversário hoje!`
                    : `${todayList.length} Pacientes fazendo aniversário hoje!`}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
                Não se esqueça de enviar uma mensagem carinhosa de felicitações e fortalecer o relacionamento com seu paciente!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 w-full md:w-auto shrink-0">
              <button
                onClick={() => {
                  setActiveTab('today');
                  if (todayList[0]) handleSendWhatsappGreeting(todayList[0]);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm flex items-center justify-center space-x-2 border border-emerald-300/50"
              >
                <MessageCircle className="w-4 h-4 text-slate-950 fill-current" />
                <span>Enviar Parabéns pelo WhatsApp</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Tab & Search Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === 'today'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Cake className="w-4 h-4 text-rose-500" />
              <span>Hoje ({todayList.length})</span>
              {todayList.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('month')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === 'month'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Este Mês ({monthList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-purple-500" />
              <span>Todos ({allList.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nome..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Birthday List Display */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-400">Buscando aniversariantes do sistema...</p>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
            <Gift className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700">Nenhum aniversariante encontrado</h3>
            <p className="text-sm text-slate-400">
              {activeTab === 'today'
                ? 'Nenhum paciente fazendo aniversário hoje.'
                : 'Nenhum paciente cadastrado para este período.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedList.map((patient, idx) => {
              const name = patient.name || patient.fullName || 'Paciente';
              const isToday = patient.isToday;

              return (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className={`rounded-2xl p-5 sm:p-6 border shadow-sm transition-all flex flex-col justify-between space-y-4 relative ${
                    isToday
                      ? 'bg-gradient-to-b from-amber-50/90 to-white border-amber-300 shadow-amber-500/10 hover:border-amber-400'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {/* Today Badge */}
                  {isToday && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Aniversário Hoje!</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 min-w-0 pr-16">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 shadow-xs ${
                          isToday
                            ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-base truncate">{name}</h4>
                        <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{formatDate(patient.birthdate || patient.birthDate)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      {patient.ageToComplete !== undefined && (
                        <p className="flex items-center justify-between">
                          <span className="text-slate-400">Idade a completar:</span>
                          <strong className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {patient.ageToComplete} anos
                          </strong>
                        </p>
                      )}
                      <p className="flex items-center justify-between">
                        <span className="text-slate-400">Telefone:</span>
                        <span className="font-mono text-slate-700">{patient.phone || 'Não informado'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Action Button: WhatsApp Congratulations */}
                  <button
                    onClick={() => handleSendWhatsappGreeting(patient)}
                    className={`w-full font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs shadow-xs transition-all ${
                      isToday
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 fill-current" />
                    <span>Enviar Parabéns no WhatsApp</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
