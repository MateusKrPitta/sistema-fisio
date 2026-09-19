'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  User,
  Phone,
  Mail,
  Calendar,
  ClipboardCheck,
  ArrowLeft,
  Activity,
  PlusCircle,
  FileText,
  Loader2,
  FileSpreadsheet,
  TrendingUp,
  Trash2,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { formatCurrency } from '@/components/currency-input';

interface Evaluation {
  id: number | string;
  type?: string;
  score?: number;
  notes?: string;
  createdAt?: string;
}

interface Patient {
  id: number | string;
  templateId?: number | string;
  template_id?: number | string;
  fullName?: string;
  name?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  medicalHistory?: string;
  sessionRate?: number | string;
  session_rate?: number | string;
  userId?: number | string | null;
  user_id?: number | string | null;
  user?: {
    id: number | string;
    fullName?: string;
    name?: string;
    email?: string;
  } | null;
  template?: {
    id: number;
    title: string;
  };
  [key: string]: any;
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteEvaluation = (evalId: number | string) => {
    api.delete(`/evaluations/${evalId}`).catch(() => {});
    setEvaluations((prev) => prev.filter((e) => e.id !== evalId));
    toast({
      title: 'Avaliação Excluída',
      description: 'A avaliação foi removida do histórico do paciente.',
      type: 'info',
    });
  };

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`).catch(() => null),
      api.get(`/patients/${id}/evaluations`).catch(() => []),
    ])
      .then(([patientRes, evalRes]) => {
        if (patientRes) {
          const data = patientRes?.data || patientRes;
          setPatient(data);
        } else {
          // Demo fallback
          setPatient(null);
        }

        const evals = Array.isArray(evalRes) ? evalRes : evalRes?.data || [];
        if (evals.length > 0) {
          setEvaluations(evals);
        } else {
          setEvaluations([]);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Header
        title={patient?.fullName || patient?.name || 'Perfil do Paciente'}
        subtitle={`Prontuário e Histórico de Avaliações (ID #${id})`}
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-5xl max-w-full">
        <Link
          href="/patients"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Pacientes</span>
        </Link>

        {/* Patient Profile Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              {(patient?.fullName || patient?.name || 'P').charAt(0)}
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
                {patient?.fullName || patient?.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 font-medium">
                <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                  CPF: {patient?.cpf || 'Não informado'}
                </span>
                <span className="flex items-center space-x-1.5 bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md border border-indigo-200 font-semibold">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Fisioterapeuta: {patient?.user?.fullName || patient?.user?.name || 'Não vinculado'}</span>
                </span>
                <span className="flex items-center space-x-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sessão: {formatCurrency(patient?.sessionRate || patient?.session_rate || 0)}</span>
                </span>
                {patient?.template?.title && (
                  <span className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 font-semibold">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                    <span>Avaliação: {patient.template.title}</span>
                  </span>
                )}
                {patient?.phone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{patient.phone}</span>
                  </span>
                )}
                {patient?.email && (
                  <span className="flex items-center space-x-1 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{patient.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto shrink-0">
            <Link
              href={`/patients/${id}/evolution/new`}
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Evolução</span>
            </Link>

            {(() => {
              const tId = patient?.templateId || patient?.template_id || patient?.template?.id;
              return (
                <Link
                  href={`/patients/${id}/forms/new${tId ? `?templateId=${tId}` : ''}`}
                  className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Preencher Avaliação</span>
                </Link>
              );
            })()}

            <Link
              href={`/patients/${id}/reports`}
              className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Relatório de Evolução</span>
            </Link>
          </div>
        </div>

        {/* Medical History Section */}
        {patient?.medicalHistory && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-2">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">
              Histórico Clínico / Observações Fisioterapêuticas
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {patient.medicalHistory}
            </p>
          </div>
        )}

        {/* Plano de Atendimento & Agenda Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">Plano de Atendimento & Agenda</h3>
                <p className="text-xs text-slate-500">Sessões programadas e histórico de horários do paciente</p>
              </div>
            </div>

            <Link
              href="/appointments"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all shrink-0"
            >
              Ver Agenda Completa
            </Link>
          </div>

          {((patient as any)?.appointments && (patient as any).appointments.length > 0) ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-xs font-semibold">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                  Total: {(patient as any).appointments.length} sessões agendadas
                </span>
                <span className="text-slate-600">
                  {(patient as any).appointments.filter((a: any) => a.status === 'finalizado').length} concluídas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(patient as any).appointments.map((app: any, idx: number) => (
                  <div
                    key={app.id || idx}
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {app.date ? app.date.split('T')[0].split('-').reverse().join('/') : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">{app.startTime} - {app.endTime}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        app.status === 'finalizado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'em_atendimento'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'pendente'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {app.status || 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-slate-500 italic text-xs">
              Nenhum plano de atendimento recorrente ativo no momento para este paciente.
            </div>
          )}
        </div>

        {/* Evaluations History List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">Histórico de Avaliações Fisioterapêuticas</h3>
              <p className="text-xs text-slate-500">Testes e formulários de qualidade de vida realizados</p>
            </div>
          </div>

          {evaluations.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Nenhuma avaliação cadastrada ainda para este paciente.
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{item.type || 'Avaliação Fisioterapêutica'}</p>
                      <p className="text-xs text-slate-500 truncate">{item.notes}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 inline-block">
                        {item.score ?? 0} pts
                      </span>
                      {item.createdAt && (
                        <p className="text-[11px] text-slate-400 mt-1">{item.createdAt}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvaluation(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 border border-slate-200/60 hover:border-red-200 transition-colors"
                      title="Excluir Avaliação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
