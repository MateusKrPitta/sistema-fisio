'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  Send, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  Building2, 
  UserCheck, 
  Smile, 
  Meh, 
  Frown, 
  Loader2, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-context';

export interface SatisfactionSurveyItem {
  id: number;
  token: string;
  status: 'pendente' | 'respondido';
  npsScore: number | null;
  therapistRating: number | null;
  recoveryRating: number | null;
  structureRating: number | null;
  feedback: string | null;
  answeredAt: string | null;
  createdAt: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    crefito?: string;
  };
}

interface SatisfactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: number;
    name: string;
    fullName?: string;
    cpf?: string;
    phone?: string;
    email?: string;
    user?: { id?: number; fullName?: string; email?: string };
    evaluators?: string[];
  } | null;
}

export const SatisfactionModal: React.FC<SatisfactionModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<SatisfactionSurveyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && patient?.id) {
      fetchSurveys();
    } else {
      setSurveys([]);
    }
  }, [isOpen, patient?.id]);

  const fetchSurveys = async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/patients/${patient.id}/satisfaction-surveys`);
      const data = Array.isArray(res) ? res : res?.data || [];
      setSurveys(data);
    } catch (err: any) {
      toast.error('Erro ao carregar avaliações', err?.message || 'Não foi possível buscar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const getSurveyUrl = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/avaliacao/${token}`;
    }
    return `https://fismovie.com.br/avaliacao/${token}`;
  };

  const handleCreateAndSendWhatsApp = async () => {
    if (!patient) return;
    setGenerating(true);
    try {
      const res = await api.post(`/patients/${patient.id}/satisfaction-surveys`, {});
      const newSurvey: SatisfactionSurveyItem = res?.data || res;
      
      setSurveys((prev) => [newSurvey, ...prev]);
      toast.success('Link Gerado!', 'Link da pesquisa gerado com sucesso.');

      // Build WhatsApp message
      const link = getSurveyUrl(newSurvey.token);
      const firstName = patient.name.split(' ')[0] || 'Paciente';
      const cleanPhone = (patient.phone || '').replace(/\D/g, '');
      const message = `Olá, ${firstName}! 👋\n\nPara mantermos a excelência e o cuidado no seu tratamento, preparamos uma avaliação rápida de 30 segundos.\n\nSua opinião é fundamental para nós: \n👉 ${link}\n\nMuito obrigado pela confiança!`;
      
      const whatsappUrl = cleanPhone 
        ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');
    } catch (err: any) {
      toast.error('Erro ao gerar pesquisa', err?.message || 'Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = getSurveyUrl(token);
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Link Copiado!', 'O link da pesquisa foi copiado para a área de transferência.');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleSendExistingWhatsApp = (survey: SatisfactionSurveyItem) => {
    if (!patient) return;
    const link = getSurveyUrl(survey.token);
    const firstName = patient.name.split(' ')[0] || 'Paciente';
    const cleanPhone = (patient.phone || '').replace(/\D/g, '');
    const message = `Olá, ${firstName}! 👋\n\nLembramos que sua avaliação rápida ainda está disponível para nos contar como foi sua experiência:\n👉 ${link}\n\nAgradecemos muito!`;
    
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleDeleteSurvey = async (id: number) => {
    if (!confirm('Deseja realmente excluir este registro de pesquisa?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/satisfaction-surveys/${id}`);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      toast.success('Excluído!', 'Pesquisa removida com sucesso.');
    } catch (err: any) {
      toast.error('Erro ao excluir', err?.message || 'Não foi possível remover a pesquisa.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen || !patient) return null;

  // Compute stats
  const answeredSurveys = surveys.filter((s) => s.status === 'respondido' && s.npsScore !== null);
  const avgNps = answeredSurveys.length > 0
    ? (answeredSurveys.reduce((acc, s) => acc + (s.npsScore || 0), 0) / answeredSurveys.length).toFixed(1)
    : null;

  const getNpsBadge = (score: number | null) => {
    if (score === null) return null;
    if (score >= 9) {
      return {
        label: 'Excelente',
        icon: <Smile className="w-4 h-4 text-emerald-500 inline mr-1" />,
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        scoreColor: 'text-emerald-600 dark:text-emerald-400',
      };
    }
    if (score >= 7) {
      return {
        label: 'Satisfeito',
        icon: <Meh className="w-4 h-4 text-amber-500 inline mr-1" />,
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        scoreColor: 'text-amber-600 dark:text-amber-400',
      };
    }
    return {
      label: 'Ponto de Atenção',
      icon: <Frown className="w-4 h-4 text-rose-500 inline mr-1" />,
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      scoreColor: 'text-rose-600 dark:text-rose-400',
    };
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-slate-400 text-xs italic">Não informado</span>;
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 dark:text-slate-700'
            }`}
          />
        ))}
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5">{rating}/5</span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <Star className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                      Pesquisas de Satisfação (NPS)
                    </h3>
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      {surveys.length} {surveys.length === 1 ? 'pesquisa' : 'pesquisas'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Paciente: <span className="font-bold text-slate-700 dark:text-slate-200">{patient.name}</span>
                    {patient.cpf && <span className="font-mono text-slate-400 ml-2">({patient.cpf})</span>}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Banner / NPS Overview */}
            <div className="p-6 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50 dark:from-slate-800/40 dark:via-slate-850 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Média NPS
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {avgNps ? avgNps : '--'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/ 10</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {answeredSurveys.length > 0 
                      ? `${answeredSurveys.length} ${answeredSurveys.length === 1 ? 'avaliação respondida' : 'avaliações respondidas'}` 
                      : 'Nenhuma resposta ainda'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Envie o link direto no WhatsApp para receber o feedback do paciente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateAndSendWhatsApp}
                disabled={generating}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar no WhatsApp</span>
                  </>
                )}
              </button>
            </div>

            {/* Modal Body / History List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Buscando histórico de satisfação...</p>
                </div>
              ) : surveys.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                    <Star className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Nenhuma pesquisa enviada ainda
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Clique no botão verde acima para gerar o link e enviar a primeira pesquisa de satisfação no WhatsApp do paciente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {surveys.map((survey, sIdx) => {
                    const badge = getNpsBadge(survey.npsScore);
                    const isAnswered = survey.status === 'respondido';
                    const createdDate = new Date(survey.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const answeredDate = survey.answeredAt 
                      ? new Date(survey.answeredAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : null;

                    return (
                      <motion.div
                        key={survey.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: sIdx * 0.04 }}
                        className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        {/* Top Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-700/60">
                          <div className="flex items-center space-x-2.5">
                            {isAnswered ? (
                              <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center ${badge?.bg}`}>
                                {badge?.icon}
                                <span>Nota: {survey.npsScore}/10 • {badge?.label}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                <span>Aguardando resposta do paciente</span>
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {isAnswered && answeredDate ? `Respondido em ${answeredDate}` : `Enviado em ${createdDate}`}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(survey.token)}
                              className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Copiar Link da Pesquisa"
                            >
                              {copiedToken === survey.token ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar Link</span>
                                </>
                              )}
                            </button>

                            {!isAnswered && (
                              <button
                                type="button"
                                onClick={() => handleSendExistingWhatsApp(survey)}
                                className="inline-flex items-center space-x-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                title="Reenviar no WhatsApp"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Reenviar</span>
                              </button>
                            )}

                            <a
                              href={getSurveyUrl(survey.token)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
                              title="Abrir página de avaliação"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteSurvey(survey.id)}
                              disabled={deletingId === survey.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Excluir pesquisa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Breakdown & Feedback (if answered) */}
                        {isAnswered ? (
                          <div className="mt-3.5 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center mb-1">
                                  <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-500" />
                                  Atendimento do Fisio
                                </span>
                                {renderStars(survey.therapistRating)}
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center mb-1">
                                  <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                                  Melhora do Quadro
                                </span>
                                {renderStars(survey.recoveryRating)}
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center mb-1">
                                  <Building2 className="w-3.5 h-3.5 mr-1 text-purple-500" />
                                  Estrutura & Recepção
                                </span>
                                {renderStars(survey.structureRating)}
                              </div>
                            </div>

                            {survey.feedback && (
                              <div className="bg-amber-50/40 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/50 dark:border-slate-700/60 text-xs">
                                <div className="flex items-center space-x-1 text-amber-800 dark:text-amber-400 font-bold mb-1">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Comentário do Paciente:</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                                  &ldquo;{survey.feedback}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-400">
                            O paciente ainda não acessou o link para avaliar o atendimento.
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                FisMovie • Gestão de Satisfação & Qualidade
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
