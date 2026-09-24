'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  PenTool,
  Calendar,
  User,
  ShieldCheck,
  Award,
  Loader2,
  Clock,
  Printer,
  Sparkles,
  Info,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiUrl } from '@/lib/api';
import { ImageLightbox } from '@/components/image-lightbox';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export default function SignEvaluationPublicPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  // Signer inputs
  const [signerName, setSignerName] = useState('');
  const [signerCpf, setSignerCpf] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  // Fetch evaluation data
  useEffect(() => {
    if (!token) return;

    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/public/evaluations/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Link de avaliação inválido ou expirado.');
        }
        return res.json();
      })
      .then((data) => {
        setEvaluation(data);
        if (data.patient?.name || data.patient?.fullName) {
          setSignerName(data.patient.fullName || data.patient.name);
        }
        if (data.patient?.cpf) {
          setSignerCpf(data.patient.cpf);
        }
        if (data.signatureStatus === 'assinado') {
          setSignedSuccess(true);
        }
      })
      .catch((err) => {
        setError(err.message || 'Não foi possível carregar a avaliação.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Initialize Canvas resolution
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0f172a'; // Slate 900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (!loading && !signedSuccess && evaluation) {
      // Delay slightly for DOM render
      const t = setTimeout(() => {
        setupCanvas();
      }, 100);
      window.addEventListener('resize', setupCanvas);
      return () => {
        clearTimeout(t);
        window.removeEventListener('resize', setupCanvas);
      };
    }
  }, [loading, signedSuccess, evaluation]);

  // Drawing Handlers for Mouse and Touch
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setupCanvas();
  };

  const handleConfirmSignature = async () => {
    if (!hasDrawn) {
      alert('Por favor, faça sua assinatura no quadro antes de confirmar.');
      return;
    }
    if (!signerName.trim()) {
      alert('Por favor, informe seu nome completo.');
      return;
    }
    if (!termsAccepted) {
      alert('Por favor, aceite os termos de confirmação da avaliação.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');

    setSubmitting(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/public/evaluations/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureImage: dataUrl,
          signedByName: signerName.trim(),
          signedByCpf: signerCpf.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao registrar assinatura.');
      }

      const result = await res.json();
      setEvaluation((prev: any) => ({
        ...prev,
        signatureStatus: 'assinado',
        signatureImage: dataUrl,
        signedAt: result.signedAt || new Date().toISOString(),
        signedByName: signerName.trim(),
      }));
      setSignedSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Não foi possível salvar a assinatura.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center space-y-4 max-w-sm w-full text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <div>
            <h3 className="font-bold text-slate-800 text-base">Carregando Avaliação</h3>
            <p className="text-xs text-slate-500 mt-1">Aguarde enquanto preparamos a visualização segura...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-200 flex flex-col items-center space-y-4 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Avaliação não encontrada</h3>
            <p className="text-sm text-slate-600 mt-1">{error || 'O link de assinatura pode ter expirado ou ser inválido.'}</p>
          </div>
          <p className="text-xs text-slate-400">
            Entre em contato com sua clínica ou fisioterapeuta responsável para solicitar um novo link.
          </p>
        </div>
      </div>
    );
  }

  const { patient, evaluator, clinic, template, answers, notes, recordDate, signedAt, signedByName, signatureImage } = evaluation;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Security & Header Banner */}
        <header className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            {clinic?.logoUrl ? (
              <div className="h-12 w-auto max-w-[150px] p-1 bg-white rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                <img
                  src={clinic.logoUrl}
                  alt={clinic?.name || 'Logo da Clínica'}
                  className="max-h-10 w-auto object-contain"
                />
              </div>
            ) : evaluator?.avatarUrl ? (
              <img
                src={evaluator.avatarUrl}
                alt={evaluator?.fullName || 'Fisioterapeuta'}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Assinatura Digital de Avaliação
                </h1>
                {clinic?.name && (
                  <span className="hidden md:inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    {clinic.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                Ambiente Seguro e Autenticado • Termo de Tratamento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
              signedSuccess
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              {signedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Avaliação Assinada</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Assinatura Pendente</span>
                </>
              )}
            </span>
          </div>
        </header>

        {/* Patient & Evaluator Identity Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            {/* Patient Info */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paciente</span>
              <p className="text-base font-extrabold text-slate-900">{patient?.fullName || patient?.name || 'Não informado'}</p>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                {patient?.cpf && <span>CPF: <strong>{patient.cpf}</strong></span>}
                {patient?.gender && <span>• {patient.gender}</span>}
              </div>
            </div>

            {/* Evaluator Info */}
            <div className="space-y-1 sm:text-right flex flex-col sm:items-end justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fisioterapeuta Avaliador</span>
              <div className="flex items-center space-x-2 sm:justify-end">
                {evaluator?.avatarUrl && (
                  <img
                    src={evaluator.avatarUrl}
                    alt={evaluator?.fullName || 'Fisioterapeuta'}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                )}
                <p className="text-base font-extrabold text-slate-900">{evaluator?.fullName || 'Fisioterapeuta Responsável'}</p>
              </div>
              <div className="flex flex-wrap items-center sm:justify-end gap-x-2 text-xs text-slate-500">
                {evaluator?.crefito && <span>CREFITO: <strong>{evaluator.crefito}</strong></span>}
                <span>• Data: <strong>{formatDate(recordDate)}</strong></span>
              </div>
            </div>
          </div>

          {/* Template Title */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ficha Clínica / Especialidade</span>
            <p className="text-sm sm:text-base font-bold text-blue-700 mt-0.5">
              {template?.title || 'Avaliação Fisioterapêutica Geral'}
            </p>
            {template?.description && (
              <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
            )}
          </div>
        </div>

        {/* Clinical Summary & Answers Preview */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Resumo da Avaliação Realizada</h3>
          </div>

          {/* Modules and Fields */}
          {template?.modules && template.modules.length > 0 ? (
            <div className="space-y-4">
              {template.modules.map((mod: any, mIdx: number) => {
                const fields = mod.fields || [];
                if (fields.length === 0) return null;

                return (
                  <div key={mod.id || mIdx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between">
                      <span>{mod.name || 'Módulo Clínico'}</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">{mod.category || 'Avaliação'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {fields.map((f: any) => {
                        const answerVal = answers?.[f.id] ?? answers?.[f.label];
                        if (answerVal === undefined || answerVal === null || answerVal === '') return null;

                        return (
                          <div key={f.id} className="bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">{f.label}</span>
                            <p className="font-semibold text-slate-800 mt-0.5">
                              {typeof answerVal === 'boolean' ? (answerVal ? 'Sim' : 'Não') : String(answerVal)}
                              {f.unit ? ` ${f.unit}` : ''}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
              {Object.keys(answers || {}).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(answers).map(([k, v]) => (
                    <div key={k} className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{k}</span>
                      <p className="font-semibold text-slate-800">{String(v)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-slate-400">Dados da avaliação registrados com sucesso pelo profissional.</p>
              )}
            </div>
          )}

          {/* Observations / Notes */}
          {notes && (
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-xs space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Observações do Fisioterapeuta</span>
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">{notes}</p>
            </div>
          )}

          {/* Attached Evaluation Photos & Evidence */}
          {(() => {
            const evalImages: string[] = Array.isArray(evaluation?.images) && evaluation.images.length > 0
              ? evaluation.images
              : evaluation?.answers?.photoData
              ? [evaluation.answers.photoData]
              : [];

            if (evalImages.length === 0) return null;

            return (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Fotos e Evidências da Avaliação ({evalImages.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {evalImages.map((imgUrl, imgIdx) => (
                    <div
                      key={imgIdx}
                      onClick={() => setPreviewImageIndex(imgIdx)}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                      title="Clique para visualizar em tela cheia"
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto da avaliação ${imgIdx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        #{imgIdx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Digital Signature Box */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
          {signedSuccess ? (
            /* Already signed success view */
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Avaliação Assinada com Sucesso!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Assinado digitalmente por <strong>{signedByName || patient?.fullName || 'Paciente'}</strong> em <strong>{formatDateTime(signedAt)}</strong>.
                </p>
              </div>

              {signatureImage && (
                <div className="mt-4 max-w-sm mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comprovante de Assinatura Registrada</span>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex justify-center">
                    <img
                      src={signatureImage}
                      alt="Assinatura do Paciente"
                      className="max-h-28 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar Comprovante (PDF)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Pending signature view with canvas */
            <div className="space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <PenTool className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">Quadro de Assinatura do Paciente</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome Completo do Assinante *
                  </label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Seu nome completo..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    CPF do Assinante
                  </label>
                  <input
                    type="text"
                    value={signerCpf}
                    onChange={(e) => setSignerCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Use o dedo no celular/tablet ou o mouse no computador para assinar no quadro branco abaixo.
                </p>
              </div>

              {/* Canvas Area */}
              <div className="space-y-2">
                <div className="relative bg-white border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden shadow-inner h-48 w-full touch-none select-none">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair block"
                  />

                  {/* Baseline Guide */}
                  <div className="absolute left-6 right-6 bottom-10 border-b border-slate-200 pointer-events-none flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase select-none">
                    <span>Assinatura Digital</span>
                    <span>X</span>
                  </div>

                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-slate-300 text-xs font-semibold">
                      Desenhe sua assinatura aqui
                    </div>
                  )}
                </div>

                {/* Canvas Controls */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpar Assinatura</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {hasDrawn ? 'Assinatura inserida' : 'Aguardando traço...'}
                  </span>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <label className="flex items-start space-x-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 leading-tight select-none">
                  Declaro que revisei a avaliação clínica realizada pelo fisioterapeuta e concordo com os dados registrados.
                </span>
              </label>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="button"
                  disabled={submitting || !hasDrawn}
                  onClick={handleConfirmSignature}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gravando Assinatura...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar e Assinar Avaliação</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4">
          FisMovie Clinic • Plataforma de Avaliações Fisioterapêuticas &copy; {new Date().getFullYear()}
        </footer>
      </div>

      {/* Lightbox for public evaluation photos */}
      {previewImageIndex !== null && (
        <ImageLightbox
          images={
            Array.isArray(evaluation?.images) && evaluation.images.length > 0
              ? evaluation.images
              : evaluation?.answers?.photoData
              ? [evaluation.answers.photoData]
              : []
          }
          currentIndex={previewImageIndex}
          title={`Fotos da Avaliação - ${template?.title || 'Ficha Clínica'}`}
          onClose={() => setPreviewImageIndex(null)}
          onNavigate={(newIdx) => setPreviewImageIndex(newIdx)}
        />
      )}
    </div>
  );
}
