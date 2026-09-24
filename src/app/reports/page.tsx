'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  Users,
  Search,
  Loader2,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
} from 'lucide-react';
import {
  PatientItem,
  EvaluationRecord,
  parseScaleGroupsFromRecords,
} from '@/lib/clinical-report-engine';
import { ClinicalReportModal } from '@/components/reports/clinical-report-modal';
import { SatisfactionModal } from '@/components/reports/satisfaction-modal';

export default function ReportsPage() {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 5;

  // Selected Patient for Report Modal
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [patientRecords, setPatientRecords] = useState<EvaluationRecord[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Selected Patient for Satisfaction (NPS) Modal
  const [satisfactionPatient, setSatisfactionPatient] = useState<PatientItem | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Patients List with Server-Side Pagination
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      ...(debouncedSearch ? { q: debouncedSearch } : {})
    });

    api.get(`/patients?${params.toString()}`)
      .then((res: any) => {
        const resData = res?.data || res;
        const rawPatients: any[] = resData?.data || (Array.isArray(resData) ? resData : []);
        const meta = resData?.meta;

        const formatted: PatientItem[] = rawPatients.map((p) => {
          const evaluatorsList: string[] = [];
          if (p.user?.fullName) {
            evaluatorsList.push(p.user.fullName);
          }
          return {
            id: p.id,
            name: p.fullName || p.name || `Paciente #${p.id}`,
            fullName: p.fullName || p.name || `Paciente #${p.id}`,
            cpf: p.cpf || 'Não informado',
            phone: p.phone,
            email: p.email,
            template: p.template,
            user: p.user,
            evaluators: evaluatorsList,
          };
        });

        setPatients(formatted);
        if (meta) {
          setTotalPages(meta.lastPage || 1);
          setTotalRecords(meta.total || 0);
        } else {
          setTotalPages(1);
          setTotalRecords(rawPatients.length);
        }
      })
      .catch(() => {
        setPatients([]);
      })
      .finally(() => setLoading(false));
  }, [currentPage, debouncedSearch]);

  const paginatedPatients = patients;

  const handleOpenReport = (patient: PatientItem) => {
    setSelectedPatient(patient);
    setLoadingReport(true);

    api.get(`/patients/${patient.id}/form-records`)
      .then((res: any) => {
        const records: EvaluationRecord[] = Array.isArray(res) ? res : res?.data || [];
        const sorted = records.sort((a, b) => {
          const dateA = new Date(a.recordDate || a.record_date || a.createdAt || '').getTime();
          const dateB = new Date(b.recordDate || b.record_date || b.createdAt || '').getTime();
          return dateA - dateB;
        });
        setPatientRecords(sorted);
      })
      .catch(() => {
        setPatientRecords([]);
      })
      .finally(() => setLoadingReport(false));
  };

  // Compute parsed scales via pure clinical report engine
  const parsedScaleGroups = useMemo(
    () => parseScaleGroupsFromRecords(patientRecords),
    [patientRecords]
  );

  return (
    <>
      <Header
        title="Relatórios Clínicos & Evolução"
        subtitle="Consulte e gere laudos detalhados com base nas escalas específicas aplicadas a cada paciente"
      />

      <main className="flex-1 p-4 sm:p-6 pb-20 space-y-6 overflow-y-auto max-w-full">
        {/* Top Control Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span>Painel de Relatórios dos Pacientes</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Selecione o paciente para visualizar o relatório inteligente por escala clínica.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar paciente por nome ou CPF..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Patients Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Carregando lista de pacientes...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Nenhum paciente encontrado</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchQuery
                  ? 'Nenhum paciente corresponde aos termos buscados.'
                  : 'Cadastre pacientes no sistema para visualizar os relatórios.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-6">Paciente</th>
                      <th className="py-3.5 px-4">CPF</th>
                      <th className="py-3.5 px-4">Fisioterapeuta Responsável</th>
                      <th className="py-3.5 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedPatients.map((patient) => {
                      const evaluators = patient.evaluators || [];
                      return (
                        <tr key={patient.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/30 transition-colors group">
                          {/* Patient Name & Avatar */}
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {patient.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate group-hover:text-blue-600 transition-colors">
                                  {patient.name}
                                </p>
                                <span className="text-[11px] text-slate-400 font-mono">ID: #{patient.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* CPF */}
                          <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300 font-medium">{patient.cpf}</td>

                          {/* Evaluators */}
                          <td className="py-4 px-4">
                            {evaluators.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {evaluators.map((evName, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700"
                                  >
                                    <span>{evName}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Dra. Milene Salmazo</span>
                            )}
                          </td>

                          {/* Action: Open Report & Open Satisfaction */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => setSatisfactionPatient(patient)}
                                className="p-2 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                                title="Pesquisas de Satisfação & NPS"
                              >
                                <Star className="w-5 h-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReport(patient)}
                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                                title="Ver Relatório Clínico"
                              >
                                <TrendingUp className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedPatients.map((patient) => {
                  const evaluators = patient.evaluators || [];
                  return (
                    <div key={patient.id} className="p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{patient.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">CPF: {patient.cpf}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          <span className="font-semibold">Resp: </span>
                          <span className="italic">
                            {evaluators.length > 0 ? evaluators[0] : 'Dra. Milene Salmazo'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setSatisfactionPatient(patient)}
                            className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Satisfação / NPS"
                          >
                            <Star className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReport(patient)}
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Relatório"
                          >
                            <TrendingUp className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalRecords} pacientes)
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      currentPage === pg
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* INTELLIGENT CLINICAL REPORT MODAL */}
      <ClinicalReportModal
        patient={selectedPatient}
        patientRecords={patientRecords}
        parsedScaleGroups={parsedScaleGroups}
        loading={loadingReport}
        onClose={() => setSelectedPatient(null)}
      />

      {/* PATIENT SATISFACTION (NPS) MODAL */}
      <SatisfactionModal
        isOpen={!!satisfactionPatient}
        onClose={() => setSatisfactionPatient(null)}
        patient={satisfactionPatient}
      />
    </>
  );
}
