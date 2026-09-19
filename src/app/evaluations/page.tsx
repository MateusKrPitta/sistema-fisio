'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { ClipboardCheck, Activity, Users, PlusCircle, Search, FileText } from 'lucide-react';

export default function AllEvaluationsPage() {
  const [search, setSearch] = useState('');

  const mockEvaluations: any[] = [];

  const filtered = mockEvaluations.filter((ev) =>
    ev.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header
        title="Avaliações Fisioterapêuticas"
        subtitle="Histórico de questionários e diagnósticos aplicados aos pacientes"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto max-w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome do paciente..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <Link
            href="/patients"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Avaliação</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs">
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Tipo de Avaliação</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Escore Qualidade de Vida</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.patientName}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">Questionário Fisioterapêutico</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{item.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 bg-cyan-50 text-cyan-700 font-extrabold px-3 py-1 rounded-lg border border-cyan-200 text-xs">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{item.score} / 100 pts</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/patients/${item.id}`}
                        className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg inline-flex items-center space-x-1 transition-colors"
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
        </div>
      </main>
    </>
  );
}
