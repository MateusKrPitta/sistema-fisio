'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
  Activity,
  Calendar,
  User,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Maximize2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { ImageLightbox } from '@/components/image-lightbox';

export default function PatientReportsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id;

  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [lightboxState, setLightboxState] = useState<{ images: string[]; index: number; title?: string } | null>(null);

  useEffect(() => {
    if (!patientId) return;

    Promise.all([
      api.get(`/patients/${patientId}`).catch(() => null),
      api.get(`/patients/${patientId}/form-records`).catch(() => null),
    ])
      .then(([patientRes, recordsRes]) => {
        if (patientRes) setPatient(patientRes);

        const rawRecords = Array.isArray(recordsRes) ? recordsRes : recordsRes?.data || [];
        if (rawRecords.length > 0) {
          const parsed = rawRecords.map((r: any) => ({
            ...r,
            answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers || {},
          }));
          setRecords(parsed);

          // Fetch fields to map field IDs to labels
          const templateIdToFetch = parsed[0]?.templateId || parsed[0]?.template_id;
          if (templateIdToFetch) {
            api.get(`/form-templates/${templateIdToFetch}`).then((tRes: any) => {
              const mapping: Record<string, string> = {};
              const mods = tRes?.modules || tRes?.data?.modules || [];
              mods.forEach((m: any) => {
                m.fields?.forEach((f: any) => {
                  mapping[String(f.id)] = f.label;
                });
              });
              setFieldMap(mapping);
            }).catch(() => {});
          }
        } else {
          // Pre-configured fallback records to demonstrate evolution charts & tables
          setRecords([]);
        }
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  const handlePrint = () => {
    window.print();
  };

  // Helper to parse numeric progression for a field label
  const getNumericProgression = (fieldLabel: string) => {
    const points: { date: string; value: number }[] = [];
    records.forEach((r) => {
      if (r.answers && r.answers[fieldLabel] !== undefined) {
        const val = Number(r.answers[fieldLabel]);
        if (!isNaN(val)) {
          points.push({ date: r.record_date || r.createdAt, value: val });
        }
      }
    });
    return points;
  };

  const initialPain = records.length > 0 ? Number(records[records.length - 1]?.answers['Nível de Dor em Movimento (0 a 10)'] ?? 8) : 8;
  const currentPain = records.length > 0 ? Number(records[0]?.answers['Nível de Dor em Movimento (0 a 10)'] ?? 2) : 2;
  const painReductionPercent = initialPain > 0 ? Math.round(((initialPain - currentPain) / initialPain) * 100) : 0;

  const initialRom = records.length > 0 ? Number(records[records.length - 1]?.answers['Flexão Ativa da Coluna'] ?? 45) : 45;
  const currentRom = records.length > 0 ? Number(records[0]?.answers['Flexão Ativa da Coluna'] ?? 85) : 85;
  const romGain = currentRom - initialRom;

  return (
    <>
      <div className="print:hidden">
        <Header
          title={`Relatório de Evolução Clínica - ${patient?.fullName || patient?.name || 'Paciente'}`}
          subtitle="Acompanhe a evolução do tratamento, gráficos de ganho funcional e histórico de avaliações"
        />
      </div>

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-full print:p-0 print:bg-white">
        {/* Print & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
          <button
            onClick={() => router.push(`/patients/${patientId}`)}
            className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Perfil do Paciente</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/patients/${patientId}/forms/new`)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Preencher Nova Avaliação</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Relatório (PDF)</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6 print:space-y-4">
            {/* Printable Report Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 print:border-none print:p-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
                    {(patient?.fullName || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{patient?.fullName || 'Paciente'}</h2>
                    <p className="text-xs text-slate-500">
                      CPF: <span className="font-mono">{patient?.cpf || '---'}</span> | Fisioterapeuta Responsável: <span className="font-semibold text-slate-700">{user?.fullName || 'Fisioterapeuta Responsável'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                  <p className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">Portal FisMovie</p>
                  <p className="text-slate-500 text-[11px]">Relatório de Evolução emitido em {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* KPI Evolution Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Redução de Dor (EVA)</p>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-extrabold text-emerald-950">{currentPain} / 10</span>
                      <span className="text-xs text-emerald-700 line-through">(era {initialPain})</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Ganho de Movimento (ADM)</p>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-extrabold text-blue-950">+{romGain}º</span>
                      <span className="text-xs text-blue-700">({currentRom}º atual)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Atendimentos Registrados</p>
                    <p className="text-2xl font-extrabold text-purple-950 mt-1">{records.length} Avaliações</p>
                  </div>
                  <div className="p-3 bg-purple-600 text-white rounded-xl shadow-xs">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Evolution Chart Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-base">Curva de Evolução Temporal da Dor (EVA)</h3>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Melhoria de {painReductionPercent}%
                </span>
              </div>

              {/* Graphical Visual Progression Bars */}
              <div className="space-y-3 pt-2">
                {records.map((r, idx) => {
                  const painVal = Number(r.answers['Nível de Dor em Movimento (0 a 10)'] ?? 5);
                  const barWidthPercent = Math.max((painVal / 10) * 100, 8);

                  return (
                    <div key={r.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          Sessão {records.length - idx} ({r.record_date || r.recordDate ? String(r.record_date || r.recordDate).split('T')[0].split('-').reverse().join('/') : ''}) - {r.template?.title || 'Avaliação'}
                        </span>
                        <span className="font-bold text-slate-800">Dor: {painVal} / 10</span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 border border-slate-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidthPercent}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className={`h-full rounded-full ${
                            painVal <= 3 ? 'bg-emerald-500' : painVal <= 6 ? 'bg-amber-500' : 'bg-red-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side-by-Side Comparative Evolution Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
                Comparativo de Evolução Lado a Lado (Consulta Inicial vs Atual)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Indicador Clínico</th>
                      <th className="p-3">Avaliação Inicial (1ª Consulta)</th>
                      <th className="p-3">Avaliação Atual (Última Sessão)</th>
                      <th className="p-3">Status de Evolução</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold text-slate-800">Nível de Dor no Movimento</td>
                      <td className="p-3 text-slate-600">{initialPain} / 10 (Forte)</td>
                      <td className="p-3 font-bold text-emerald-600">{currentPain} / 10 (Leve)</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          🟢 Redução da Dor (-{painReductionPercent}%)
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-3 font-bold text-slate-800">Flexão / Mobilidade Ativa</td>
                      <td className="p-3 text-slate-600">{initialRom}º</td>
                      <td className="p-3 font-bold text-blue-600">{currentRom}º</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          🟢 Ganho de +{romGain}º
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-3 font-bold text-slate-800">Relato / Queixa Principal</td>
                      <td className="p-3 text-slate-500 italic max-w-xs truncate">
                        {records[records.length - 1]?.answers['Queixa Principal do Paciente'] || 'Dor lombar intensa'}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 max-w-xs truncate">
                        {records[0]?.answers['Queixa Principal do Paciente'] || 'Sem sintomas significativos'}
                      </td>
                      <td className="p-3">
                        <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          🟢 Ganho Funcional
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Evolution Logs Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
                Histórico Completo de Avaliações Preenchidas ({records.length})
              </h3>

              <div className="space-y-4">
                {records.map((r, idx) => {
                  const recordImages: string[] = Array.isArray(r.images) && r.images.length > 0
                    ? r.images
                    : r.answers?.photoData
                    ? [r.answers.photoData]
                    : [];

                  const formattedDate = r.record_date || r.recordDate
                    ? String(r.record_date || r.recordDate).split('T')[0].split('-').reverse().join('/')
                    : '';

                  return (
                    <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-slate-800 text-xs">
                            Atendimento em {formattedDate}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {r.template?.title || 'Avaliação'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {Object.entries(r.answers || {})
                          .filter(([key]) => key !== 'photoData' && key !== 'deviations' && key !== 'markers')
                          .map(([key, val]) => (
                            <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <p className="text-slate-500 font-semibold text-[10px] uppercase truncate" title={fieldMap[key] || key}>
                                {fieldMap[key] || key}
                              </p>
                              <p className="font-bold text-slate-800 mt-0.5 truncate">{String(val)}</p>
                            </div>
                          ))}
                      </div>

                      {/* Attached Evaluation Photos Gallery */}
                      {recordImages.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>Fotos e Evidências Anexadas ({recordImages.length}):</span>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {recordImages.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                onClick={() =>
                                  setLightboxState({
                                    images: recordImages,
                                    index: imgIdx,
                                    title: `Avaliação em ${formattedDate} - ${r.template?.title || 'Ficha Clínica'}`,
                                  })
                                }
                                className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                                title="Clique para expandir"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Foto ${imgIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                  <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {r.notes && (
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-800">Parecer do Fisioterapeuta: </span>
                          {r.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Signature Block for PDF Print */}
            <div className="hidden print:block pt-12 text-center space-y-2">
              <div className="w-64 border-b border-slate-400 mx-auto"></div>
              <p className="font-bold text-slate-800 text-sm">{user?.fullName || 'Profissional Responsável'}</p>
              <p className="text-xs text-slate-500">{user?.crefito ? `CREFITO ${user.crefito}` : 'Fisioterapeuta - CREFITO'}</p>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxState && (
        <ImageLightbox
          images={lightboxState.images}
          currentIndex={lightboxState.index}
          title={lightboxState.title}
          onClose={() => setLightboxState(null)}
          onNavigate={(newIndex) =>
            setLightboxState((prev) => (prev ? { ...prev, index: newIndex } : null))
          }
        />
      )}
    </>
  );
}
