'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  ClipboardCheck,
  Activity,
  Users,
  PlusCircle,
  Search,
  FileText,
  Loader2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EvaluationItem {
  id: number;
  patientId: number;
  patientName: string;
  patientCpf?: string;
  templateTitle?: string;
  recordDate: string;
  evaluatorName?: string;
  signatureStatus?: string;
  scalesCount: number;
}

export default function AllEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch patients and aggregate their form-records
    api.get('/patients?limit=50')
      .then(async (res: any) => {
        const patientsList = Array.isArray(res) ? res : res?.data || [];
        const recordsList: EvaluationItem[] = [];

        // For each patient, collect their summary
        for (const p of patientsList) {
          if (p.template || p.templateId) {
            recordsList.push({
              id: Number(p.id),
              patientId: Number(p.id),
              patientName: p.fullName || p.name || 'Paciente',
              patientCpf: p.cpf || 'Não informado',
              templateTitle: p.template?.title || 'Ficha de Avaliação Clínica',
              recordDate: p.createdAt || new Date().toISOString(),
              evaluatorName: p.user?.fullName || 'Fisioterapeuta',
              signatureStatus: 'signed',
              scalesCount: p.template?.title ? p.template.title.split('+').length : 1,
            });
          }
        }
        setEvaluations(recordsList);
      })
      .catch(() => {
        setEvaluations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = evaluations.filter((ev) =>
    ev.patientName.toLowerCase().includes(search.toLowerCase()) ||
    (ev.templateTitle || '').toLowerCase().includes(search.toLowerCase()) ||
    (ev.patientCpf || '').includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEvaluations = filtered.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Header
        title="Avaliações Fisioterapêuticas"
        subtitle="Histórico de escalas, diagnósticos e avaliações aplicadas aos pacientes"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Action & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por paciente, CPF ou escala..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          <Link
            href="/patients"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Avaliação</span>
          </Link>
        </div>

        {/* Table Container */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-400">Carregando avaliações...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center space-y-3 shadow-xs">
            <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">Nenhuma avaliação encontrada</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Nenhuma avaliação cadastrada ou compatível com a busca. Acesse a lista de pacientes para iniciar uma nova avaliação.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] sm:text-xs tracking-wider">
                    <th className="py-3.5 px-4">Paciente</th>
                    <th className="py-3.5 px-4">Modelo / Escalas</th>
                    <th className="py-3.5 px-4">Data</th>
                    <th className="py-3.5 px-4">Qtd. Escalas</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedEvaluations.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.patientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{item.patientName}</span>
                            <span className="block text-[11px] font-normal text-slate-400">CPF: {item.patientCpf}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        <span className="line-clamp-1 text-xs">{item.templateTitle}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(item.recordDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200/80 dark:border-blue-800 text-xs font-bold">
                          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{item.scalesCount} escala{item.scalesCount === 1 ? '' : 's'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/patients`}
                          className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Prontuário</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Mostrando página <strong>{safeCurrentPage}</strong> de <strong>{totalPages}</strong> ({filtered.length} avaliações)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

