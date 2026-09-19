'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  Sparkles,
  Loader2,
  Eye,
  X,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { CustomModule } from '../../modules/page';

export interface FormTemplate {
  id: number | string;
  title: string;
  description?: string | null;
  moduleIds?: number[];
  modules?: CustomModule[];
  isActive?: boolean;
}

export default function FormTemplateViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (params.id) {
      fetchTemplate(String(params.id));
    }
  }, [params.id]);

  const fetchTemplate = async (id: string) => {
    try {
      const fullTemp = await api.get(`/form-templates/${id}`);
      if (fullTemp) {
        const hydrated = {
          ...fullTemp,
          modules: (fullTemp.modules || []).map((m: any) => ({
            ...m,
            fields: (m.fields || []).map((f: any) => ({
              ...f,
              options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options || [],
            })),
          })),
        };
        setPreviewTemplate(hydrated);
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const calculateTrunkScore = (mod: CustomModule) => {
    let total = 0;
    (mod.fields || []).forEach((f) => {
      const key = String(f.id || f.label);
      const val = previewAnswers[key];
      if (val) {
        const valStr = String(val);
        if (valStr.startsWith('25')) total += 25;
        else if (valStr.startsWith('12')) total += 12;
        else if (valStr.startsWith('0')) total += 0;
      }
    });
    return total;
  };

  const getTrunkStatusLabel = (score: number) => {
    if (score === 100) return 'Controle de Tronco Preservado (100 pts)';
    if (score >= 75) return 'Bom Controle de Tronco (75-99 pts)';
    if (score >= 37) return 'Comprometimento Moderado (37-74 pts)';
    return 'Comprometimento Severo (0-36 pts)';
  };

  const getTrunkStatusStyle = (score: number) => {
    if (score === 100) return 'bg-emerald-600 text-white';
    if (score >= 75) return 'bg-blue-600 text-white';
    if (score >= 37) return 'bg-amber-500 text-white';
    return 'bg-red-600 text-white';
  };

  const isTrunkOptions = (opts?: string[]) => {
    if (!opts || opts.length < 3) return false;
    const has0 = opts.some((o) => String(o).startsWith('0'));
    const has12 = opts.some((o) => String(o).startsWith('12'));
    const has25 = opts.some((o) => String(o).startsWith('25'));
    return has0 && has12 && has25;
  };

  const isPEFOptions = (opts?: string[]) => {
    if (!opts || opts.length === 0) return false;
    return opts.some((o) => String(o).includes('Zona Verde') || String(o).includes('Zona Amarela') || String(o).includes('Zona Vermelha'));
  };

  const isPCFOptions = (opts?: string[]) => {
    if (!opts || opts.length === 0) return false;
    return opts.some((o) => String(o).includes('270 L/min') || String(o).includes('160 L/min') || String(o).includes('Tosse ineficaz'));
  };

  const calculateGlasgowScore = (mod: CustomModule) => {
    let total = 0;
    (mod.fields || []).forEach((f) => {
      const key = String(f.id || f.label);
      const val = previewAnswers[key];
      if (val) {
        const valStr = String(val);
        const match = valStr.match(/^(\d+)/);
        if (match) {
          total += parseInt(match[1], 10);
        }
      }
    });
    return total;
  };

  const getGlasgowStatusLabel = (score: number) => {
    if (score === 0) return 'Aguardando preenchimento...';
    if (score >= 13) return 'Trauma Leve (13-15 pts)';
    if (score >= 9) return 'Trauma Moderado (9-12 pts)';
    if (score >= 3) return 'Trauma Grave (3-8 pts)';
    return 'Coma (3 pts)';
  };

  const getGlasgowStatusStyle = (score: number) => {
    if (score === 0) return 'bg-slate-500 text-white';
    if (score >= 13) return 'bg-emerald-600 text-white';
    if (score >= 9) return 'bg-amber-500 text-white';
    return 'bg-red-600 text-white';
  };

  const isGlasgowOptions = (opts?: string[]) => {
    if (!opts || opts.length < 4) return false;
    const has1 = opts.some((o) => String(o).startsWith('1'));
    const has2 = opts.some((o) => String(o).startsWith('2'));
    const has3 = opts.some((o) => String(o).startsWith('3'));
    const has4 = opts.some((o) => String(o).startsWith('4'));
    return has1 && has2 && has3 && has4;
  };

  const isAshworthOptions = (opts?: string[]) => {
    if (!opts || opts.length < 6) return false;
    const has0 = opts.some((o) => String(o).startsWith('0'));
    const has1 = opts.some((o) => String(o).startsWith('1'));
    const has1plus = opts.some((o) => String(o).startsWith('1+'));
    const has4 = opts.some((o) => String(o).startsWith('4'));
    return has0 && has1 && has1plus && has4;
  };

    return (
    <>
      <Header
        title={previewTemplate?.title || 'Carregando...'}
        subtitle={previewTemplate?.description || 'Visualização da avaliação selecionada'}
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-full">
        <button
          onClick={() => router.push('/custom-forms/templates')}
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-blue-600 text-sm font-semibold transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Avaliações</span>
        </button>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !previewTemplate ? (
          <div className="p-8 text-center text-slate-500">Avaliação não encontrada.</div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 w-full max-w-4xl mx-auto space-y-6">
            {/* Form Viewer */}
                {/* Banner alert */}
                <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-900">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="font-semibold">
                      Esta é a prévia interativa exata de como a Avaliação será preenchida para o paciente durante as consultas.
                    </p>
                  </div>
                </div>

                {/* Modules Preview List */}
                <div className="space-y-6">
                  {(previewTemplate.modules || []).map((mod) => {
                    const isTrunkMod = mod.name.toLowerCase().includes('tronco') || (mod.category || '').toLowerCase().includes('tronco');
                    const trunkScore = isTrunkMod ? calculateTrunkScore(mod) : 0;
                    const isGlasgowMod = mod.name.toLowerCase().includes('glasgow');
                    const glasgowScore = isGlasgowMod ? calculateGlasgowScore(mod) : 0;

                    return (
                      <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
                        {/* Module Header Banner */}
                        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                              {mod.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm sm:text-base">{mod.name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                {mod.category || 'Escala Clínica'}
                              </span>
                            </div>
                          </div>

                          {isTrunkMod && (
                            <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Pontuação TCT</p>
                                <p className="text-base font-black text-white">{trunkScore} / 100 pts</p>
                              </div>
                              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${getTrunkStatusStyle(trunkScore)}`}>
                                {getTrunkStatusLabel(trunkScore)}
                              </span>
                            </div>
                          )}

                          {isGlasgowMod && (
                            <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Pontuação Glasgow</p>
                                <p className="text-base font-black text-white">{glasgowScore} / 15 pts</p>
                              </div>
                              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${getGlasgowStatusStyle(glasgowScore)}`}>
                                {getGlasgowStatusLabel(glasgowScore)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Fields rendering */}
                        <div className="p-5 sm:p-6 space-y-6">
                          {(mod.fields || []).map((f) => {
                            const answerKey = String(f.id || f.label);
                            const currentVal = previewAnswers[answerKey];

                            return (
                              <div key={answerKey} className="space-y-2 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-bold text-slate-800">
                                    {f.label}
                                    {f.isRequired && <span className="text-red-500 ml-1">*</span>}
                                  </label>

                                  {f.unit && (
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                      Unidade: {f.unit}
                                    </span>
                                  )}
                                </div>

                                {f.helpText && (
                                  <p className="text-[11px] text-slate-400 italic">{f.helpText}</p>
                                )}

                                {/* EVA Pain Slider */}
                                {f.fieldType === 'scale_0_10' && (
                                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-slate-600">Selecione de 0 a 10:</span>
                                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold shadow-xs">
                                        {currentVal !== undefined ? `${currentVal} / 10` : '0 / 10'}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="10"
                                      step="1"
                                      value={currentVal ?? 0}
                                      onChange={(e) => setPreviewAnswers({ ...previewAnswers, [answerKey]: Number(e.target.value) })}
                                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                  </div>
                                )}

                                {/* Single Select Cards */}
                                {f.fieldType === 'single_select' && (
                                  isPEFOptions(f.options) ? (
                                    <div className="grid grid-cols-1 gap-3 pt-2">
                                      {(f.options || []).map((opt) => {
                                        const isSelected = currentVal === opt;
                                        const optStr = String(opt);
                                        const isGreen = optStr.includes('Zona Verde');
                                        const isYellow = optStr.includes('Zona Amarela');
                                        const isRed = optStr.includes('Zona Vermelha');
                                        
                                        const splitIndex = optStr.indexOf(' - ');
                                        const pts = splitIndex !== -1 ? optStr.substring(0, splitIndex) : optStr;
                                        const desc = splitIndex !== -1 ? optStr.substring(splitIndex + 3) : '';

                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setPreviewAnswers({ ...previewAnswers, [answerKey]: opt })}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                                              isSelected
                                                ? isGreen
                                                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold shadow-xs'
                                                  : isYellow
                                                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-semibold shadow-xs'
                                                  : 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-950 font-semibold shadow-xs'
                                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span
                                                className={`font-black text-xs px-2.5 py-0.5 rounded-md shadow-2xs ${
                                                  isSelected
                                                    ? isGreen
                                                      ? 'bg-emerald-600 text-white'
                                                      : isYellow
                                                      ? 'bg-amber-600 text-white'
                                                      : 'bg-red-600 text-white'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}
                                              >
                                                {pts}
                                              </span>
                                              {isSelected && (
                                                <CheckCircle2 className={`w-4 h-4 ${isGreen ? 'text-emerald-600' : isYellow ? 'text-amber-600' : 'text-red-600'}`} />
                                              )}
                                            </div>
                                            <p className="text-xs font-bold leading-snug">{desc}</p>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : isPCFOptions(f.options) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                      {(f.options || []).map((opt) => {
                                        const isSelected = currentVal === opt;
                                        const optStr = String(opt);
                                        const isGreen = optStr.includes('Tosse eficaz');
                                        const isYellow = optStr.includes('insuficiente');
                                        const isRed = optStr.includes('ineficaz') || optStr.includes('Ineficaz');
                                        
                                        const splitIndex = optStr.indexOf(' - ');
                                        const pts = splitIndex !== -1 ? optStr.substring(0, splitIndex) : optStr;
                                        const desc = splitIndex !== -1 ? optStr.substring(splitIndex + 3) : '';

                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setPreviewAnswers({ ...previewAnswers, [answerKey]: opt })}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                                              isSelected
                                                ? isGreen
                                                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold shadow-xs'
                                                  : isYellow
                                                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-semibold shadow-xs'
                                                  : 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-950 font-semibold shadow-xs'
                                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span
                                                className={`font-black text-[10px] px-2 py-0.5 rounded-md shadow-2xs ${
                                                  isSelected
                                                    ? isGreen
                                                      ? 'bg-emerald-600 text-white'
                                                      : isYellow
                                                      ? 'bg-amber-600 text-white'
                                                      : 'bg-red-600 text-white'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}
                                              >
                                                {pts}
                                              </span>
                                              {isSelected && (
                                                <CheckCircle2 className={`w-4 h-4 ${isGreen ? 'text-emerald-600' : isYellow ? 'text-amber-600' : 'text-red-600'}`} />
                                              )}
                                            </div>
                                            <p className="text-xs font-bold leading-snug">{desc}</p>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : isTrunkOptions(f.options) || (f.options?.[0]?.length ?? 0) > 30 ? (
                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                      {(f.options || []).map((opt) => {
                                        const isSelected = currentVal === opt;
                                        const optStr = String(opt);
                                        const isTrunk = isTrunkOptions(f.options);
                                        const is0 = isTrunk && optStr.startsWith('0');
                                        const is12 = isTrunk && optStr.startsWith('12');
                                        const is25 = isTrunk && optStr.startsWith('25');
                                        const ptsLabel = isTrunk ? (is0 ? '0 PONTOS' : is12 ? '12 PONTOS' : is25 ? '25 PONTOS' : optStr) : optStr;

                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setPreviewAnswers({ ...previewAnswers, [answerKey]: opt })}
                                            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between space-x-3 cursor-pointer ${
                                              isSelected
                                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-950 font-semibold'
                                                : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            <span className="text-xs font-bold leading-snug">{optStr}</span>
                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : isTrunkOptions(f.options) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                      {(f.options || []).map((opt) => {
                                        const isSelected = currentVal === opt;
                                        const optStr = String(opt);
                                        const is0 = optStr.startsWith('0');
                                        const is12 = optStr.startsWith('12');
                                        const is25 = optStr.startsWith('25');

                                        const ptsLabel = is0 ? '0 PONTOS' : is12 ? '12 PONTOS' : is25 ? '25 PONTOS' : optStr;
                                        const descLabel = is0
                                          ? 'Incapaz de fazer sem assistência'
                                          : is12
                                          ? 'Capaz de fazer usando ajuda, padrão anormal ou usando os braços'
                                          : is25
                                          ? 'Capaz de completar a tarefa normalmente'
                                          : optStr;

                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setPreviewAnswers({ ...previewAnswers, [answerKey]: opt })}
                                            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                                              isSelected
                                                ? is0
                                                  ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-950 font-semibold shadow-xs'
                                                  : is12
                                                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-semibold shadow-xs'
                                                  : 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold shadow-xs'
                                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span
                                                className={`font-black text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs ${
                                                  is0
                                                    ? 'bg-red-600 text-white'
                                                    : is12
                                                    ? 'bg-amber-600 text-white'
                                                    : is25
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-blue-600 text-white'
                                                }`}
                                              >
                                                {ptsLabel}
                                              </span>
                                              {isSelected && (
                                                <CheckCircle2 className={`w-4 h-4 ${is0 ? 'text-red-600' : is12 ? 'text-amber-600' : 'text-emerald-600'}`} />
                                              )}
                                            </div>
                                            <p className="text-xs font-bold leading-snug">{descLabel}</p>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : isGlasgowOptions(f.options) ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
                                      {(f.options || []).map((opt) => {
                                        const isSelected = currentVal === opt;
                                        const optStr = String(opt);
                                        const match = optStr.match(/^(\d+)\s*-\s*(.*)/);
                                        
                                        const pts = match ? match[1] : '';
                                        const desc = match ? match[2] : optStr;
                                        const ptsLabel = pts ? `${pts} PONTOS` : optStr;

                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setPreviewAnswers({ ...previewAnswers, [answerKey]: opt })}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                                              isSelected
                                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-semibold shadow-xs'
                                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span
                                                className={`font-black text-[10px] px-2 py-0.5 rounded-md shadow-2xs ${
                                                  isSelected
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}
                                              >
                                                {ptsLabel}
                                              </span>
                                              {isSelected && (
                                                <CheckCircle2 className={`w-4 h-4 text-blue-600`} />
                                              )}
                                            </div>
                                            <p className="text-xs font-bold leading-snug">{desc}</p>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : isAshworthOptions(f.options) ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                      {(f.options || []).map((opt) => {
                                        const isSelected = currentVal === opt;
                                        const optStr = String(opt);
                                        const match = optStr.match(/^([0-9\+]+)\s*-\s*(.*)/);
                                        
                                        const pts = match ? match[1] : '';
                                        const desc = match ? match[2] : optStr;
                                        
                                        const isZero = pts === '0';
                                        const isHigh = pts === '3' || pts === '4';

                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setPreviewAnswers({ ...previewAnswers, [answerKey]: opt })}
                                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                                              isSelected
                                                ? isZero
                                                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold shadow-xs'
                                                  : isHigh
                                                  ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-950 font-semibold shadow-xs'
                                                  : 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-semibold shadow-xs'
                                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span
                                                className={`font-black text-xs px-2.5 py-0.5 rounded-md shadow-2xs ${
                                                  isSelected
                                                    ? isZero
                                                      ? 'bg-emerald-600 text-white'
                                                      : isHigh
                                                      ? 'bg-red-600 text-white'
                                                      : 'bg-amber-600 text-white'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}
                                              >
                                                Grau {pts}
                                              </span>
                                              {isSelected && (
                                                <CheckCircle2 className={`w-4 h-4 ${isZero ? 'text-emerald-600' : isHigh ? 'text-red-600' : 'text-amber-600'}`} />
                                              )}
                                            </div>
                                            <p className="text-xs font-bold leading-snug">{desc}</p>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {(f.options || []).map((opt) => {
                                        const isSelected = currentVal === opt;
                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setPreviewAnswers({ ...previewAnswers, [answerKey]: opt })}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                              isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                          >
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )
                                )}

                                {/* Number input */}
                                {f.fieldType === 'number' && (
                                  <div className="relative max-w-xs">
                                    <input
                                      type="number"
                                      placeholder={`0 ${f.unit || ''}`}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-12 py-2 text-sm font-mono text-slate-800"
                                    />
                                    {f.unit && (
                                      <span className="absolute right-3 top-2 text-xs text-blue-600 font-extrabold font-mono pointer-events-none bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                        {f.unit}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Text input */}
                                {f.fieldType === 'text' && (
                                  <input
                                    type="text"
                                    placeholder="Digite a resposta..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
                                  />
                                )}

                                {/* Long text input */}
                                {f.fieldType === 'long_text' && (
                                  <textarea
                                    rows={3}
                                    placeholder="Descreva detalhadamente..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                
          </div>
        )}
      </main>
    </>
  );
}
