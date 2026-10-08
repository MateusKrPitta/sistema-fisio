'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  CheckCircle2,
  Users,
  Calendar,
  ClipboardList,
  Activity,
  FileSpreadsheet,
  ShieldCheck,
  DollarSign,
  Gift,
  FileText,
  LifeBuoy,
  LayoutDashboard,
  Lightbulb,
  ArrowRight,
  Eye,
  CheckSquare,
  Square,
  HelpCircle,
  Stethoscope,
  Compass
} from 'lucide-react';

interface ModuleFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  tip?: string;
}

interface ModuleInfo {
  id: string;
  pathPrefix: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tourStepIndex: number;
  features: ModuleFeature[];
}

const MODULES_INFO: Record<string, ModuleInfo> = {
  dashboard: {
    id: 'dashboard',
    pathPrefix: '/',
    category: 'VISÃO GERAL',
    title: 'Painel Clínico Inteligente',
    subtitle: 'Acompanhe métricas em tempo real, produtividade e o fluxo diário de atendimentos da sua clínica.',
    icon: LayoutDashboard,
    tourStepIndex: 1,
    features: [
      {
        icon: Activity,
        title: 'Métricas e Indicadores em Tempo Real',
        description: 'Visualize o total de pacientes ativos, consultas agendadas para hoje e evolução do faturamento.',
        tip: 'Os cards do topo atualizam automaticamente conforme a rotina da sua clínica.'
      },
      {
        icon: Calendar,
        title: 'Agenda Rápida do Dia',
        description: 'Acompanhe os próximos horários marcados, status de chegada do paciente e inicie atendimentos com 1 clique.',
      },
      {
        icon: Sparkles,
        title: 'Progresso de Onboarding e Primeiros Passos',
        description: 'Guia com as 5 etapas essenciais para configurar sua clínica e começar a atender com máxima eficiência.',
        tip: 'Conclua as etapas para desbloquear todas as automações do sistema.'
      }
    ]
  },
  patients: {
    id: 'patients',
    pathPrefix: '/patients',
    category: 'GESTÃO CLÍNICA',
    title: 'Módulo de Prontuários e Pacientes',
    subtitle: 'Centralize fichas cadastrais, histórico clínico, contato via WhatsApp e anamneses completas.',
    icon: Users,
    tourStepIndex: 3,
    features: [
      {
        icon: Users,
        title: 'Cadastro Completo e Prontuário Digital',
        description: 'Registre dados pessoais, profissão, queixa principal, histórico patológico pregresso e convênios.',
        tip: 'Todos os dados são salvos em conformidade com as exigências do CREFITO e LGPD.'
      },
      {
        icon: LifeBuoy,
        title: 'Comunicação Rápida via WhatsApp',
        description: 'Inicie conversas com o paciente diretamente pela lista de pacientes com 1 único clique no ícone verde.',
      },
      {
        icon: ClipboardList,
        title: 'Histórico Integrado',
        description: 'Acesse em uma única tela todas as avaliações, evoluções e agendamentos vinculados ao prontuário.',
        tip: 'Use a busca inteligente no topo para encontrar pacientes instantaneamente por nome ou CPF.'
      }
    ]
  },
  appointments: {
    id: 'appointments',
    pathPrefix: '/appointments',
    category: 'AGENDA E ATENDIMENTOS',
    title: 'Grade de Horários e Agendamentos',
    subtitle: 'Controle sua grade de horários, marque retornos, gerencie faltas e organize a recepção.',
    icon: Calendar,
    tourStepIndex: 4,
    features: [
      {
        icon: Calendar,
        title: 'Visão por Dia, Semana e Mês',
        description: 'Visualize os horários disponíveis de todos os fisioterapeutas com filtros rápidos por profissional ou sala.',
      },
      {
        icon: CheckCircle2,
        title: 'Gestão de Status da Consulta',
        description: 'Marque horários como Agendado, Confirmado, Em Atendimento, Concluído ou Cancelado com facilidade.',
        tip: 'Pacientes confirmados reduzem a taxa de falta em até 45%.'
      },
      {
        icon: Stethoscope,
        title: 'Início Imediato de Evolução/Avaliação',
        description: 'Ao clicar no agendamento, você pode abrir o prontuário e registrar o atendimento instantaneamente.',
      }
    ]
  },
  evaluations: {
    id: 'evaluations',
    pathPrefix: '/evaluations',
    category: 'DIAGNÓSTICO FISIOTERAPÊUTICO',
    title: 'Avaliações Clínicas e Posturais',
    subtitle: 'Realize avaliações com mapa de dor corporal, testes ortopédicos, goniometria e fotos posturais.',
    icon: ClipboardList,
    tourStepIndex: 5,
    features: [
      {
        icon: Activity,
        title: 'Mapa Interativo de Dor Corporal',
        description: 'Clique nas regiões anatômicas do corpo humano para marcar áreas de dor, tipo de sensação e intensidade EVA (0 a 10).',
        tip: 'Permite acompanhar graficamente a regressão da dor sessão a sessão.'
      },
      {
        icon: Eye,
        title: 'Registro Fotográfico Postural',
        description: 'Anexe fotos nas vistas anterior, posterior e laterais com grid alinhador para comparar antes e depois.',
      },
      {
        icon: FileSpreadsheet,
        title: 'Testes Especiais e Goniometria',
        description: 'Preencha amplitudes de movimento (ADM), testes musculares e diagnósticos cinesiológico-funcionais.',
      }
    ]
  },
  evolutions: {
    id: 'evolutions',
    pathPrefix: '/evolutions',
    category: 'PRONTUÁRIO ELETRÔNICO',
    title: 'Evoluções Diárias de Sessão',
    subtitle: 'Documente a conduta realizada, evolução do quadro, escala de dor e colha a assinatura digital.',
    icon: Activity,
    tourStepIndex: 6,
    features: [
      {
        icon: Activity,
        title: 'Registro Estruturado SOEP',
        description: 'Campos objetivos para descrição dos exercícios terapêuticos, recursos eletrotermofototerapêuticos e resposta do paciente.',
      },
      {
        icon: ShieldCheck,
        title: 'Assinatura Digital no Prontuário',
        description: 'Colete a assinatura do paciente na tela do celular/tablet para comprovação jurídica do atendimento.',
        tip: 'Em conformidade com a Resolução COFFITO nº 414/2012 para prontuários eletrônicos.'
      },
      {
        icon: CheckCircle2,
        title: 'Histórico Cronológico',
        description: 'Veja toda a linha do tempo do tratamento do paciente para planejar os próximos passos de alta fisioterapêutica.',
      }
    ]
  },
  reports: {
    id: 'reports',
    pathPrefix: '/reports',
    category: 'GESTÃO E INTELIGÊNCIA',
    title: 'Relatórios e Métricas Clínicas',
    subtitle: 'Analise gráficos de desempenho, taxa de recuperação, frequência de pacientes e gere laudos em PDF.',
    icon: FileSpreadsheet,
    tourStepIndex: 7,
    features: [
      {
        icon: FileSpreadsheet,
        title: 'Emissão de Laudos em PDF',
        description: 'Gere relatórios de evolução física e alta fisioterapêutica formatados para convênios ou médicos solicitantes.',
      },
      {
        icon: Activity,
        title: 'Índices de Recuperação e Frequência',
        description: 'Monitore quantos atendimentos foram realizados e a melhora percentual dos pacientes da clínica.',
        tip: 'Excelente para comprovar o valor do seu tratamento em casos de reabilitação complexa.'
      }
    ]
  },
  team: {
    id: 'team',
    pathPrefix: '/team',
    category: 'ADMINISTRAÇÃO DA CLÍNICA',
    title: 'Gestão de Equipe e Profissionais',
    subtitle: 'Cadastre fisioterapeutas com CREFITO, secretárias e defina permissões de acesso ao sistema.',
    icon: ShieldCheck,
    tourStepIndex: 8,
    features: [
      {
        icon: Users,
        title: 'Controle de Acessos e Cargos',
        description: 'Defina o que cada membro pode visualizar (ex: secretárias acessam agenda e pacientes; fisioterapeutas acessam prontuários).',
      },
      {
        icon: ShieldCheck,
        title: 'CREFITO e Registro Profissional',
        description: 'Mantenha o registro do conselho atualizado para constar automaticamente nos laudos e evoluções.',
        tip: 'Cada profissional tem seu login individual para garantir sigilo e rastreabilidade.'
      }
    ]
  },
  financial: {
    id: 'financial',
    pathPrefix: '/financial',
    category: 'FINANCEIRO E CAIXA',
    title: 'Controle Financeiro da Clínica',
    subtitle: 'Gerencie entradas de sessões particulares e convênios, pacotes de tratamento e despesas.',
    icon: DollarSign,
    tourStepIndex: 1,
    features: [
      {
        icon: DollarSign,
        title: 'Fluxo de Caixa e Recebimentos',
        description: 'Acompanhe as receitas diárias, pagamentos pendentes e formas de pagamento (Pix, Cartão, Dinheiro).',
      },
      {
        icon: CheckCircle2,
        title: 'Controle de Pacotes de Sessões',
        description: 'Acompanhe o saldo de sessões contratadas por cada paciente e saiba quando oferecer renovação.',
        tip: 'Evite atendimentos sem cobrança mantendo o extrato de sessões sempre atualizado.'
      }
    ]
  },
  birthdays: {
    id: 'birthdays',
    pathPrefix: '/birthdays',
    category: 'RELACIONAMENTO E MARKETING',
    title: 'Central de Aniversariantes',
    subtitle: 'Fidelize seus pacientes enviando felicitações personalizadas com 1 clique pelo WhatsApp.',
    icon: Gift,
    tourStepIndex: 1,
    features: [
      {
        icon: Gift,
        title: 'Lista Inteligente do Mês',
        description: 'Identifique os aniversariantes do dia e da semana para criar um relacionamento acolhedor.',
      },
      {
        icon: LifeBuoy,
        title: 'Envio Rápido no WhatsApp',
        description: 'Abra a mensagem pronta no WhatsApp com o nome do paciente preenchido automaticamente.',
        tip: 'Mensagens de aniversário aumentam a fidelização e o retorno de pacientes antigos.'
      }
    ]
  },
  customForms: {
    id: 'custom-forms',
    pathPrefix: '/custom-forms',
    category: 'PERSONALIZAÇÃO',
    title: 'Formulários e Anamneses Personalizadas',
    subtitle: 'Crie fichas customizadas para sua especialidade (Ortopedia, Pilates, Neuro, Pélvica, etc.).',
    icon: FileText,
    tourStepIndex: 5,
    features: [
      {
        icon: FileText,
        title: 'Campos Sob Medida',
        description: 'Adicione perguntas de texto, múltipla escolha, escalas numéricas e checkboxes específicos.',
      },
      {
        icon: Sparkles,
        title: 'Modelos Reutilizáveis',
        description: 'Aplique questionários prontos para economizar tempo na primeira consulta com o paciente.',
      }
    ]
  },
  support: {
    id: 'support',
    pathPrefix: '/support',
    category: 'SUPORTE E ATENDIMENTO',
    title: 'Central de Suporte e Base de Ajuda',
    subtitle: 'Converse diretamente pelo WhatsApp com nossos especialistas e tire dúvidas sobre o sistema.',
    icon: LifeBuoy,
    tourStepIndex: 9,
    features: [
      {
        icon: LifeBuoy,
        title: 'Atendimento WhatsApp Oficial',
        description: 'Fale com a equipe técnica pelo (67) 99859-2808 de segunda a sexta, das 08h às 18h.',
      },
      {
        icon: HelpCircle,
        title: 'Base de Conhecimento (FAQ)',
        description: 'Respostas detalhadas com busca em tempo real para as dúvidas mais comuns de fisioterapeutas.',
      }
    ]
  }
};

const STORAGE_KEY = 'fismovie_dismissed_module_tutorials';

export function ModuleTutorialModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleInfo | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Helper to find module info by path or id
  const getModuleByPath = useCallback((path: string): ModuleInfo | null => {
    if (!path) return null;
    if (path === '/' || path === '/dashboard') return MODULES_INFO.dashboard;
    if (path.startsWith('/patients')) return MODULES_INFO.patients;
    if (path.startsWith('/appointments')) return MODULES_INFO.appointments;
    if (path.startsWith('/evaluations')) return MODULES_INFO.evaluations;
    if (path.startsWith('/evolutions')) return MODULES_INFO.evolutions;
    if (path.startsWith('/reports')) return MODULES_INFO.reports;
    if (path.startsWith('/team')) return MODULES_INFO.team;
    if (path.startsWith('/financial')) return MODULES_INFO.financial;
    if (path.startsWith('/birthdays')) return MODULES_INFO.birthdays;
    if (path.startsWith('/custom-forms')) return MODULES_INFO.customForms;
    if (path.startsWith('/support')) return MODULES_INFO.support;
    return null;
  }, []);

  // Helper to read dismissed modules from localStorage
  const getDismissedMap = (): Record<string, boolean> => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Helper to save dismissed status
  const saveDismissedStatus = (moduleId: string, isDismissed: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      const current = getDismissedMap();
      if (isDismissed) {
        current[moduleId] = true;
      } else {
        delete current[moduleId];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Error saving tutorial dismissal state:', e);
    }
  };

  // Auto-open tutorial on route change if not dismissed
  useEffect(() => {
    if (!pathname) return;

    // Ignore public pages
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/assinar') ||
      pathname.startsWith('/avaliacao') ||
      pathname.startsWith('/admin')
    ) {
      setIsOpen(false);
      return;
    }

    const mod = getModuleByPath(pathname);
    if (!mod) return;

    const dismissed = getDismissedMap();
    if (!dismissed[mod.id]) {
      // Small delay so page transition completes
      const timer = setTimeout(() => {
        setActiveModule(mod);
        setDontShowAgain(false);
        setIsOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, getModuleByPath]);

  // Listen to manual open events
  useEffect(() => {
    const handleManualOpen = (e: CustomEvent<{ moduleId?: string }>) => {
      const targetId = e.detail?.moduleId;
      let targetModule: ModuleInfo | null = null;

      if (targetId && MODULES_INFO[targetId]) {
        targetModule = MODULES_INFO[targetId];
      } else if (pathname) {
        targetModule = getModuleByPath(pathname);
      }

      if (!targetModule) {
        targetModule = MODULES_INFO.dashboard;
      }

      setActiveModule(targetModule);
      setDontShowAgain(false);
      setIsOpen(true);
    };

    window.addEventListener('open-module-tutorial', handleManualOpen as EventListener);
    return () => {
      window.removeEventListener('open-module-tutorial', handleManualOpen as EventListener);
    };
  }, [pathname, getModuleByPath]);

  const handleCloseOnly = () => {
    if (activeModule && dontShowAgain) {
      saveDismissedStatus(activeModule.id, true);
    }
    setIsOpen(false);
  };

  // When clicking "Entendi, vamos começar!", trigger the interactive spotlight tour on the system!
  const handleStartInteractiveTour = () => {
    if (activeModule && dontShowAgain) {
      saveDismissedStatus(activeModule.id, true);
    }
    setIsOpen(false);

    if (typeof window !== 'undefined' && activeModule) {
      window.dispatchEvent(
        new CustomEvent('open-system-tour', {
          detail: { stepIndex: activeModule.tourStepIndex ?? 0 }
        })
      );
    }
  };

  if (!isOpen || !activeModule) return null;

  const IconComponent = activeModule.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseOnly}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header Banner - Elegant, High-End Style aligned with system theme with generous padding */}
          <div className="relative p-6 sm:p-7 pb-6 sm:pb-7 bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-l from-blue-500/10 to-transparent blur-2xl pointer-events-none" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3.5 sm:space-x-4">
                {/* Icon Badge */}
                <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 ring-4 ring-blue-500/10">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                <div className="min-w-0 pr-2">
                  <div className="inline-flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-blue-200/60 dark:border-blue-800/50 mb-2">
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                    <span>{activeModule.category}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                    {activeModule.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 mb-1 max-w-lg leading-relaxed">
                    {activeModule.subtitle}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseOnly}
                aria-label="Fechar tutorial"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Features List (Scrollable Area) */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 custom-scrollbar flex-1 bg-slate-50/40 dark:bg-slate-950/40">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Principais Funcionalidades deste Módulo</span>
              </h4>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {activeModule.features.length} recursos disponíveis
              </span>
            </div>

            {activeModule.features.map((feature, idx) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.06 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 shadow-xs hover:border-blue-300 dark:hover:border-blue-600 transition-all space-y-2 group"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <FeatureIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {feature.title}
                        </h5>
                        {feature.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {feature.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {feature.tip && (
                    <div className="flex items-start space-x-2 bg-gradient-to-r from-blue-50/80 to-cyan-50/60 dark:from-blue-950/30 dark:to-cyan-950/20 p-2.5 rounded-xl border border-blue-100/80 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-cyan-200 mt-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{feature.tip}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer Controls with Checkbox & Action Button */}
          <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Checkbox "Não mostrar novamente neste módulo" */}
            <button
              type="button"
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer select-none self-start sm:self-center"
            >
              <div className="relative">
                {dontShowAgain ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                )}
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Não mostrar este tutorial novamente neste módulo
              </span>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStartInteractiveTour}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 hover:shadow-blue-600/35 transition-all cursor-pointer active:scale-98"
                title="Explorar na tela do sistema"
              >
                <Compass className="w-4 h-4 text-cyan-300" />
                <span>Entendi, vamos começar!</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
