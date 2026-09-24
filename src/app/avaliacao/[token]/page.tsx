'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Star, 
  CheckCircle2, 
  Smile, 
  Heart, 
  UserCheck, 
  TrendingUp, 
  Building2, 
  Loader2, 
  AlertCircle,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface PublicSurveyData {
  id: number;
  token: string;
  status: 'pendente' | 'respondido';
  npsScore: number | null;
  therapistRating: number | null;
  recoveryRating: number | null;
  structureRating: number | null;
  feedback: string | null;
  patient: {
    id: number;
    name: string;
    firstName: string;
  } | null;
  therapist: {
    id?: number;
    fullName: string;
    crefito?: string;
    avatarUrl?: string | null;
  } | null;
  clinic: {
    id?: number;
    name: string;
    phone?: string;
    logoUrl?: string | null;
  };
}

export default function PublicSatisfactionSurveyPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<PublicSurveyData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [therapistRating, setTherapistRating] = useState<number>(5);
  const [recoveryRating, setRecoveryRating] = useState<number>(5);
  const [structureRating, setStructureRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchPublicSurvey = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = getApiUrl();
        const res = await fetch(`${baseUrl}/public/satisfaction-surveys/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || 'Pesquisa não encontrada ou link expirado.');
        }

        setSurveyData(data);
        if (data.status === 'respondido') {
          setSubmitted(true);
          setNpsScore(data.npsScore);
        }
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar a pesquisa de avaliação.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicSurvey();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (npsScore === null) {
      setError('Por favor, selecione uma nota de recomendação de 0 a 10.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/public/satisfaction-surveys/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npsScore,
          therapistRating,
          recoveryRating,
          structureRating,
          feedback: feedback.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao enviar sua avaliação.');
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getNpsButtonColor = (score: number) => {
    if (score <= 6) {
      return npsScore === score
        ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-105'
        : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200 hover:border-rose-300';
    }
    if (score <= 8) {
      return npsScore === score
        ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-105'
        : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-300';
    }
    return npsScore === score
      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105 ring-2 ring-emerald-400/40'
      : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300';
  };

  const renderInteractiveStars = (
    value: number,
    onChange: (val: number) => void
  ) => {
    return (
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 text-2xl transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
          >
            <Star
              className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                star <= value
                  ? 'fill-amber-400 text-amber-400 filter drop-shadow-xs'
                  : 'text-slate-200'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-slate-600 ml-2 bg-slate-100 px-2.5 py-1 rounded-lg">
          {value === 5 ? 'Excelente (5)' : value === 4 ? 'Muito Bom (4)' : value === 3 ? 'Bom (3)' : value === 2 ? 'Regular (2)' : 'Insatisfeito (1)'}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center space-y-4 max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-700">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (error && !surveyData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">Ops! Não foi possível acessar</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const patientFirstName = surveyData?.patient?.firstName || 'Paciente';
  const clinicName = surveyData?.clinic?.name || 'Clínica de Fisioterapia';
  const therapistName = surveyData?.therapist?.fullName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/70 via-slate-50 to-indigo-50/40 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          {surveyData?.clinic?.logoUrl ? (
            <div className="flex flex-col items-center justify-center mb-3">
              <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-100 max-w-[240px] max-h-24 flex items-center justify-center mb-1.5">
                <img
                  src={surveyData.clinic.logoUrl}
                  alt={clinicName}
                  className="max-h-16 w-auto object-contain rounded-lg"
                />
              </div>
              <span className="text-[11px] font-black tracking-wider text-slate-600 uppercase">
                {clinicName}
              </span>
            </div>
          ) : surveyData?.therapist?.avatarUrl ? (
            <div className="inline-flex items-center space-x-3 bg-white pl-2 pr-4 py-1.5 rounded-2xl shadow-xs border border-slate-100 mb-3">
              <img
                src={surveyData.therapist.avatarUrl}
                alt={therapistName || 'Profissional'}
                className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-2xs"
              />
              <div className="text-left">
                <span className="text-xs font-black tracking-wide text-slate-800 uppercase block">
                  {clinicName}
                </span>
                {therapistName && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {therapistName} {surveyData?.therapist?.crefito ? `• CREFITO ${surveyData.therapist.crefito}` : ''}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-xs border border-slate-100 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black">
                {clinicName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-black tracking-wide text-slate-800 uppercase">
                {clinicName}
              </span>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pesquisa de Satisfação
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Olá, <strong className="text-slate-800">{patientFirstName}</strong>! Sua opinião é essencial para aprimorarmos continuamente o seu tratamento.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submitted Success Screen */}
        {submitted ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Muito obrigado pelo seu feedback! 🌟
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
              Sua resposta foi registrada com sucesso e já está disponível para a equipe de fisioterapia.
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-400">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Cuidando da sua saúde e bem-estar todos os dias.</span>
            </div>
          </div>
        ) : (
          /* Main Survey Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-8">
            
            {/* 1. NPS Score Question */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                    Em uma escala de 0 a 10, o quanto você recomendaria a nossa clínica para amigos ou familiares?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Selecione uma nota de 0 (pouco provável) a 10 (com certeza).</p>
                </div>
              </div>

              {/* Number Buttons Grid */}
              <div className="pt-2">
                <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setNpsScore(score)}
                      className={`h-11 sm:h-12 rounded-xl font-black text-sm sm:text-base border transition-all cursor-pointer flex items-center justify-center ${getNpsButtonColor(
                        score
                      )}`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-400 px-1 mt-2">
                  <span>0 - Nada provável</span>
                  <span>10 - Com certeza!</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 2. Detailed Category Ratings */}
            <div className="space-y-5">
              <div className="flex items-start space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                    Como você avalia os seguintes pontos do seu tratamento?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Toque nas estrelas para avaliar cada item.</p>
                </div>
              </div>

              {/* Therapist Rating */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-800">
                  {surveyData?.therapist?.avatarUrl ? (
                    <img
                      src={surveyData.therapist.avatarUrl}
                      alt={therapistName || 'Fisioterapeuta'}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  )}
                  <span>Atendimento do Fisioterapeuta {therapistName ? `(${therapistName})` : ''}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Atenção, clareza nas orientações, pontualidade e dedicação.
                </p>
                {renderInteractiveStars(therapistRating, setTherapistRating)}
              </div>

              {/* Recovery Rating */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Evolução e Melhora da Dor</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Percepção de resultados, alívio de sintomas e melhora nos movimentos.
                </p>
                {renderInteractiveStars(recoveryRating, setRecoveryRating)}
              </div>

              {/* Structure Rating */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>Estrutura, Limpeza e Recepção</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Conforto do ambiente, higiene, agilidade e cordialidade no atendimento.
                </p>
                {renderInteractiveStars(structureRating, setStructureRating)}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 3. Open Feedback */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                    Deixe um recado, elogio ou sugestão para nossa equipe (Opcional)
                  </h3>
                </div>
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Conte-nos o que você mais gostou ou o que podemos fazer para sua experiência ser nota 10..."
                rows={3}
                maxLength={800}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all resize-none shadow-2xs"
              />
              <div className="text-right text-[10px] text-slate-400">
                {feedback.length}/800 caracteres
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando avaliação...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Avaliação</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              🔒 Suas respostas são seguras e utilizadas exclusivamente para melhoria contínua dos atendimentos.
            </p>

          </form>
        )}

      </div>
    </div>
  );
}
