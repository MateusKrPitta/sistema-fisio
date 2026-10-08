'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sparkles,
  Users,
  Calendar,
  Layers,
  Activity,
  BarChart3,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Lightbulb,
  Building2,
  LifeBuoy,
  ExternalLink,
  Search,
  PlusCircle,
  FileSpreadsheet,
  Clock,
  ClipboardList,
  ClipboardCheck,
  MessageCircle,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { APP_NAME } from '@/lib/version';

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  icon: any;
  placement: 'right' | 'bottom' | 'left' | 'top' | 'center';
  targetRoute?: string;
  actionLabel?: string;
}

// Passos dedicados ao conteúdo interno de cada tela/módulo
const MODULE_SPECIFIC_STEPS: Record<string, TourStep[]> = {
  evaluations: [
    {
      id: 'eval_search',
      selector: 'evaluations-search',
      title: 'Busca de Avaliações e Escalas',
      subtitle: 'Encontre avaliações anteriores',
      description: 'Pesquise por nome do paciente, CPF ou modelo de avaliação clínica aplicada.',
      tip: 'Permite comparar avaliações antigas para ver a evolução da postura e dor do paciente.',
      icon: Search,
      placement: 'bottom',
    },
    {
      id: 'eval_new_btn',
      selector: 'evaluations-new-btn',
      title: 'Iniciar Nova Avaliação',
      subtitle: 'Prontuário com mapa de dor e fotos',
      description: 'Clique para selecionar um paciente e aplicar mapa de dor corporal, goniometria, fotos posturais e testes funcionais.',
      tip: 'O paciente pode assinar digitalmente o laudo na tela do seu celular ou tablet.',
      icon: PlusCircle,
      placement: 'bottom',
      targetRoute: '/patients',
      actionLabel: 'Ver Pacientes',
    },
    {
      id: 'eval_table',
      selector: 'evaluations-table',
      title: 'Histórico de Avaliações Aplicadas',
      subtitle: 'Prontuários e laudos registrados',
      description: 'Consulte a lista completa de avaliações, datas de preenchimento, escalas utilizadas e laudos prontos.',
      tip: 'Você pode exportar o laudo completo em PDF com layout profissional para convênios e médicos.',
      icon: ClipboardCheck,
      placement: 'top',
    },
  ],
  evolutions: [
    {
      id: 'evol_search',
      selector: 'evolutions-search',
      title: 'Busca de Prontuários para Evolução',
      subtitle: 'Localize o paciente rapidamente',
      description: 'Digite o nome ou CPF do paciente para acessar o histórico completo de sessões e registrar condutas.',
      tip: 'A lista exibe o fisioterapeuta responsável por cada tratamento.',
      icon: Search,
      placement: 'bottom',
    },
    {
      id: 'evol_table',
      selector: 'evolutions-table',
      title: 'Histórico e Linha do Tempo',
      subtitle: 'Acompanhamento sessão a sessão',
      description: 'Clique no ícone de prancheta à direita de qualquer paciente para abrir a linha do tempo e registrar a evolução pós-atendimento.',
      tip: 'O registro SOEP com escala EVA de dor garante respaldo ético e comprovação de melhora.',
      icon: Activity,
      placement: 'top',
    },
  ],
  patients: [
    {
      id: 'patients_search',
      selector: 'patients-search',
      title: 'Busca Inteligente de Pacientes',
      subtitle: 'Localize prontuários num instante',
      description: 'Pesquise por nome completo ou telefone para encontrar prontuários de pacientes instantaneamente.',
      tip: 'A busca é em tempo real e filtra os dados conforme você digita.',
      icon: Search,
      placement: 'bottom',
    },
    {
      id: 'patients_new_btn',
      selector: 'patients-new-btn',
      title: 'Cadastrar Novo Paciente',
      subtitle: 'Ficha cadastral completa',
      description: 'Abra o formulário para registrar novos pacientes, preencher anamnese, definir fisioterapeuta e valores de sessão.',
      tip: 'Após o cadastro, o prontuário eletrônico e a aba de avaliações já ficam disponíveis.',
      icon: PlusCircle,
      placement: 'bottom',
      targetRoute: '/patients/new',
      actionLabel: 'Abrir Cadastro',
    },
    {
      id: 'patients_table',
      selector: 'patients-table',
      title: 'Listagem de Prontuários e Ações',
      subtitle: 'Gestão clínica centralizada',
      description: 'Acesse o prontuário completo, inicie conversas no WhatsApp com 1 clique, visualize avaliações e lance planos de atendimento.',
      tip: 'Clique nos ícones de ação na coluna da direita para abrir a ficha completa do paciente.',
      icon: Users,
      placement: 'top',
    },
  ],
  dashboard: [
    {
      id: 'dash_onboarding',
      selector: 'dashboard-onboarding',
      title: 'Progresso da Sua Clínica',
      subtitle: 'Checklist de primeiros passos',
      description: 'Acompanhe as 5 etapas essenciais para configurar sua clínica e começar a atender com máxima eficiência.',
      tip: 'Conclua as etapas para desbloquear todas as automações do FisMovie.',
      icon: Sparkles,
      placement: 'bottom',
    },
    {
      id: 'dash_metrics',
      selector: 'dashboard-metrics',
      title: 'Indicadores em Tempo Real',
      subtitle: 'Panorama da rotina da clínica',
      description: 'Acompanhe a contagem de pacientes ativos, atendimentos previstos para hoje e sessões finalizadas no mês.',
      tip: 'Estes cards atualizam instantaneamente conforme atendimentos são concluídos.',
      icon: Activity,
      placement: 'bottom',
    },
    {
      id: 'dash_chart',
      selector: 'dashboard-chart',
      title: 'Frequência de Atendimentos',
      subtitle: 'Distribuição semanal dos agendamentos',
      description: 'Veja os dias com maior fluxo de pacientes na clínica para otimizar sua grade de horários e escala de profissionais.',
      tip: 'Gráfico gerado dinamicamente com base nas consultas registradas no mês.',
      icon: BarChart3,
      placement: 'top',
    },
    {
      id: 'dash_pending',
      selector: 'dashboard-pending-evolutions',
      title: 'Evoluções Pendentes',
      subtitle: 'Atendimentos aguardando registro',
      description: 'Identifique rapidamente consultas finalizadas que ainda precisam do preenchimento da conduta pós-sessão e assinatura.',
      tip: 'Manter as evoluções em dia garante respaldo jurídico e prontuário seguro.',
      icon: Clock,
      placement: 'top',
      targetRoute: '/appointments',
      actionLabel: 'Ver Agenda',
    },
  ],
  appointments: [
    {
      id: 'app_search',
      selector: 'appointments-search',
      title: 'Busca e Filtros da Agenda',
      subtitle: 'Filtre por profissional, data e status',
      description: 'Pesquise por nome do paciente ou utilize o botão de filtros avançados para filtrar por fisioterapeuta da equipe.',
      tip: 'Você pode alternar entre visão Diária, Semanal e Mensal no topo.',
      icon: Search,
      placement: 'bottom',
    },
    {
      id: 'app_new_btn',
      selector: 'appointments-new-btn',
      title: 'Agendar Novo Atendimento',
      subtitle: 'Marcação rápida de consulta',
      description: 'Clique aqui para abrir a modal de agendamento, selecionar o paciente, data, horário e fisioterapeuta responsável.',
      tip: 'Você também pode clicar diretamente em qualquer horário livre na grade do calendário!',
      icon: PlusCircle,
      placement: 'bottom',
    },
    {
      id: 'app_calendar',
      selector: 'appointments-calendar-grid',
      title: 'Grade de Horários Interativa',
      subtitle: 'Visualização completa da clínica',
      description: 'Visualize os horários e clique diretamente em qualquer atendimento para registrar a evolução, alterar status ou remarcar.',
      tip: 'Atendimentos confirmados mudam de cor para facilitar o controle da recepção.',
      icon: Calendar,
      placement: 'top',
    },
  ],
  team: [
    {
      id: 'team_stats',
      selector: 'team-stats',
      title: 'Indicadores da Equipe',
      subtitle: 'Profissionais e cargos cadastrados',
      description: 'Acompanhe a contagem de fisioterapeutas ativos, secretárias e administradores da clínica.',
      tip: 'Cada membro possui login individual para garantir sigilo ético de prontuários.',
      icon: ShieldCheck,
      placement: 'bottom',
    },
    {
      id: 'team_search',
      selector: 'team-search',
      title: 'Busca e Filtro por Cargo',
      subtitle: 'Encontre membros da clínica',
      description: 'Filtre profissionais rapidamente por nome, CREFITO ou use as abas para separar fisioterapeutas de recepcionistas.',
      tip: 'Você pode alterar comissões e valores por sessão na ficha do profissional.',
      icon: Search,
      placement: 'bottom',
    },
    {
      id: 'team_new_btn',
      selector: 'team-new-btn',
      title: 'Cadastrar Novo Profissional',
      subtitle: 'Adicionar fisioterapeuta ou secretária',
      description: 'Cadastre novos membros da equipe, informe o registro do CREFITO, defina permissões e modelo de remuneração.',
      tip: 'O profissional recebe acesso seguro imediato ao portal.',
      icon: PlusCircle,
      placement: 'bottom',
    },
    {
      id: 'team_table',
      selector: 'team-table',
      title: 'Gestão da Equipe e Permissões',
      subtitle: 'Controle de acessos e contatos',
      description: 'Consulte e edite dados de contato, dados bancários/Pix, CREFITO e regras de acesso de cada membro da clínica.',
      tip: 'Você pode desativar o acesso de um membro a qualquer momento sem perder o histórico clínico.',
      icon: UserCheck,
      placement: 'top',
    },
  ],
  support: [
    {
      id: 'supp_whatsapp',
      selector: 'support-whatsapp-card',
      title: 'Atendimento Direto no WhatsApp',
      subtitle: 'Fale com nossa equipe técnica oficial',
      description: 'Escolha o motivo da sua dúvida e inicie uma conversa com os especialistas técnicos pelo WhatsApp (67) 99859-2808.',
      tip: 'A mensagem já é montada automaticamente com os dados da sua conta para agilizar seu atendimento.',
      icon: MessageCircle,
      placement: 'bottom',
    },
    {
      id: 'supp_faq',
      selector: 'support-faq-section',
      title: 'Central de Conhecimento (FAQ)',
      subtitle: 'Respostas para mais de 25 dúvidas frequentes',
      description: 'Utilize o campo de busca ou clique nas categorias para encontrar guias passo a passo sobre todas as áreas do sistema.',
      tip: 'Perguntas organizadas por Pacientes, Agenda, Avaliações, Relatórios, LGPD e Financeiro.',
      icon: HelpCircle,
      placement: 'top',
    },
  ],
};

// Passos gerais da visão panorâmica do sistema
const GLOBAL_TOUR_STEPS: TourStep[] = [
  {
    id: 'brand',
    selector: 'sidebar-brand',
    title: 'Clínica e Identidade',
    subtitle: 'O painel exclusivo da sua clínica',
    description: `Aqui no topo da barra lateral você visualiza a logo, o nome da sua clínica e a versão ativa do ${APP_NAME}.`,
    tip: 'Seus dados e logotipo aparecem automaticamente no topo de todos os relatórios e laudos gerados.',
    icon: Building2,
    placement: 'right',
  },
  {
    id: 'dashboard',
    selector: 'sidebar-nav-/',
    title: 'Dashboard Geral',
    subtitle: 'Sua visão panorâmica diária',
    description: 'Acompanhe métricas rápidas, atendimentos agendados para hoje, pacientes recentes e o resumo da sua rotina clínica.',
    tip: 'O dashboard atualiza em tempo real conforme sua recepção ou equipe confirma agendamentos.',
    icon: Compass,
    placement: 'right',
    targetRoute: '/',
    actionLabel: 'Ver Dashboard',
  },
  {
    id: 'new_patient',
    selector: 'header-new-patient',
    title: 'Botão "+ Novo Paciente"',
    subtitle: 'Cadastro clínico com 1 clique',
    description: 'Este botão fica sempre visível no topo para você registrar rapidamente a ficha de um novo paciente em qualquer tela.',
    tip: 'Preencha os dados básicos e queixa principal para já liberar o prontuário e avaliações.',
    icon: Users,
    placement: 'bottom',
    targetRoute: '/patients/new',
    actionLabel: 'Abrir Cadastro',
  },
  {
    id: 'patients',
    selector: 'sidebar-nav-/patients',
    title: 'Meus Pacientes e Prontuários',
    subtitle: 'Histórico clínico e documentos centralizados',
    description: 'Acesse a lista completa de pacientes, consulte prontuários digitais, diagnósticos, anexos de exames e contatos.',
    tip: 'Na ficha de cada paciente você tem as abas de Avaliações, Evoluções e Histórico Clínico.',
    icon: Users,
    placement: 'right',
    targetRoute: '/patients',
    actionLabel: 'Ver Pacientes',
  },
  {
    id: 'appointments',
    selector: 'sidebar-nav-/appointments',
    title: 'Agenda e Atendimentos',
    subtitle: 'Grade de horários inteligente',
    description: 'Gerencie atendimentos diários, filtre por fisioterapeuta da equipe e acompanhe status (Agendado, Confirmado, Realizado ou Cancelado).',
    tip: 'Clique diretamente em qualquer horário livre para marcar um atendimento em segundos.',
    icon: Calendar,
    placement: 'right',
    targetRoute: '/appointments',
    actionLabel: 'Abrir Agenda',
  },
  {
    id: 'evaluations',
    selector: 'sidebar-nav-/custom-forms/modules',
    title: 'Avaliações Clínicas e Laudos',
    subtitle: 'Mapas de dor interativos e fotos posturais',
    description: 'Crie e preencha avaliações completas com mapa 3D de dor corporal, fotos posturais (anterior, posterior e perfil) e gere PDFs com assinatura digital do paciente.',
    tip: 'O paciente pode assinar o laudo com o próprio dedo na tela do seu tablet ou celular!',
    icon: Layers,
    placement: 'right',
    targetRoute: '/custom-forms/modules',
    actionLabel: 'Ver Avaliações',
  },
  {
    id: 'evolutions',
    selector: 'sidebar-nav-/evolutions',
    title: 'Evoluções e Linha do Tempo',
    subtitle: 'Registro sessão a sessão do paciente',
    description: 'Documente cada sessão de fisioterapia realizada, acompanhe a queda da dor na escala EVA e monitore gráficos de melhora do paciente.',
    tip: 'Evoluções diárias mantêm o prontuário seguro e respaldam o tratamento para convênios e médicos.',
    icon: Activity,
    placement: 'right',
    targetRoute: '/evolutions',
    actionLabel: 'Ver Evoluções',
  },
  {
    id: 'reports',
    selector: 'sidebar-nav-/reports',
    title: 'Relatórios e Assistente de Laudos',
    subtitle: 'Estatísticas clínicas e resumos inteligentes',
    description: 'Gere relatórios gerenciais sobre atendimentos realizados e utilize o assistente de IA para sugerir pareceres e resumos clínicos.',
    tip: 'Exporte relatórios consolidados em PDF prontos para impressão ou compartilhamento.',
    icon: BarChart3,
    placement: 'right',
    targetRoute: '/reports',
    actionLabel: 'Ver Relatórios',
  },
  {
    id: 'team',
    selector: 'sidebar-nav-/team',
    title: 'Minha Equipe e Gestão',
    subtitle: 'Controle de acessos e fisioterapeutas',
    description: 'Cadastre os membros da sua equipe (fisioterapeutas com CREFITO e secretárias), com regras de permissão e cálculo automatizado de comissões.',
    tip: 'Fisioterapeutas têm visão focada em seus próprios atendimentos para total privacidade.',
    icon: ShieldCheck,
    placement: 'right',
    targetRoute: '/team',
    actionLabel: 'Ver Equipe',
  },
  {
    id: 'support',
    selector: 'sidebar-support',
    title: 'Suporte e Central de Ajuda',
    subtitle: 'Atendimento direto sempre à disposição',
    description: 'Tire dúvidas no FAQ detalhado ou inicie uma conversa em tempo real no WhatsApp oficial da nossa equipe técnica com 1 clique.',
    tip: 'O suporte envia os dados da sua conta automaticamente para agilizar seu atendimento.',
    icon: LifeBuoy,
    placement: 'right',
    targetRoute: '/support',
    actionLabel: 'Abrir Suporte',
  },
  {
    id: 'pwa',
    selector: 'sidebar-pwa',
    title: 'Instalar no Celular ou Computador',
    subtitle: 'Tenha o FisMovie como aplicativo nativo',
    description: 'Instale o FisMovie na tela inicial do seu celular, tablet ou como aplicativo na área de trabalho do computador para acesso ultrarrápido.',
    tip: 'Funciona perfeitamente em telas touch para você usar na maca ou consultório.',
    icon: Smartphone,
    placement: 'right',
  },
  {
    id: 'user_menu',
    selector: 'header-user-menu',
    title: 'Seu Perfil e Opções Rápidas',
    subtitle: 'Gerencie sua sessão e atalhos',
    description: 'No menu do seu avatar você consulta suas credenciais, CREFITO, reabre este tour guiado a qualquer momento ou encerra sua sessão com segurança.',
    tip: 'Você concluiu o tour interativo! Está tudo pronto para você aproveitar 100% do sistema.',
    icon: CheckCircle2,
    placement: 'bottom',
  },
];

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function InteractiveTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSteps, setActiveSteps] = useState<TourStep[]>(GLOBAL_TOUR_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);

  // Inicia tour por evento global (suporta moduleId ou detecção automática pela rota atual)
  useEffect(() => {
    const handleOpenTour = (e?: any) => {
      const moduleId = e?.detail?.moduleId;
      const stepIndex = e?.detail?.stepIndex ?? 0;

      if (moduleId && MODULE_SPECIFIC_STEPS[moduleId]) {
        setActiveSteps(MODULE_SPECIFIC_STEPS[moduleId]);
        setCurrentStepIndex(0);
      } else if (pathname?.startsWith('/evaluations') || pathname?.startsWith('/custom-forms/modules')) {
        setActiveSteps(MODULE_SPECIFIC_STEPS.evaluations || GLOBAL_TOUR_STEPS);
        setCurrentStepIndex(0);
      } else if (pathname?.startsWith('/evolutions')) {
        setActiveSteps(MODULE_SPECIFIC_STEPS.evolutions || GLOBAL_TOUR_STEPS);
        setCurrentStepIndex(0);
      } else if (pathname?.startsWith('/patients')) {
        setActiveSteps(MODULE_SPECIFIC_STEPS.patients || GLOBAL_TOUR_STEPS);
        setCurrentStepIndex(0);
      } else if (pathname?.startsWith('/appointments')) {
        setActiveSteps(MODULE_SPECIFIC_STEPS.appointments || GLOBAL_TOUR_STEPS);
        setCurrentStepIndex(0);
      } else if (pathname?.startsWith('/team')) {
        setActiveSteps(MODULE_SPECIFIC_STEPS.team || GLOBAL_TOUR_STEPS);
        setCurrentStepIndex(0);
      } else if (pathname?.startsWith('/support')) {
        setActiveSteps(MODULE_SPECIFIC_STEPS.support || GLOBAL_TOUR_STEPS);
        setCurrentStepIndex(0);
      } else if (pathname === '/' || pathname === '/dashboard') {
        setActiveSteps(MODULE_SPECIFIC_STEPS.dashboard || GLOBAL_TOUR_STEPS);
        setCurrentStepIndex(0);
      } else {
        setActiveSteps(GLOBAL_TOUR_STEPS);
        setCurrentStepIndex(stepIndex);
      }

      setIsOpen(true);
    };

    window.addEventListener('open-system-tour', handleOpenTour);
    return () => {
      window.removeEventListener('open-system-tour', handleOpenTour);
    };
  }, [pathname]);

  const currentStep = activeSteps[currentStepIndex];

  // Localiza o elemento alvo na tela e mede o bounding box
  const updateSpotlightPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const element = document.querySelector(`[data-tour="${currentStep.selector}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  // Atualiza coordenadas em redimensionamento, scroll ou troca de passo
  useEffect(() => {
    updateSpotlightPosition();

    const handleResize = () => updateSpotlightPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [updateSpotlightPosition, currentStepIndex]);

  // Não renderiza em páginas públicas
  if (pathname?.startsWith('/assinar') || pathname?.startsWith('/avaliacao') || pathname === '/login') {
    return null;
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeSteps.length - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / activeSteps.length) * 100);

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fismovie_tour_completed', 'true');

      // Marca o módulo atual como dispensado para que o tutorial e tour não abram mais sozinhos
      try {
        const stored = localStorage.getItem('fismovie_dismissed_module_tutorials');
        const dismissed = stored ? JSON.parse(stored) : {};
        
        let currentModuleKey = 'dashboard';
        if (pathname?.startsWith('/evaluations') || pathname?.startsWith('/custom-forms/modules')) currentModuleKey = 'evaluations';
        else if (pathname?.startsWith('/evolutions')) currentModuleKey = 'evolutions';
        else if (pathname?.startsWith('/patients')) currentModuleKey = 'patients';
        else if (pathname?.startsWith('/appointments')) currentModuleKey = 'appointments';
        else if (pathname?.startsWith('/team')) currentModuleKey = 'team';
        else if (pathname?.startsWith('/financial')) currentModuleKey = 'financial';
        else if (pathname?.startsWith('/birthdays')) currentModuleKey = 'birthdays';
        else if (pathname?.startsWith('/custom-forms')) currentModuleKey = 'custom-forms';
        else if (pathname?.startsWith('/support')) currentModuleKey = 'support';

        dismissed[currentModuleKey] = true;
        localStorage.setItem('fismovie_dismissed_module_tutorials', JSON.stringify(dismissed));
      } catch (err) {
        console.error('Error saving dismissed module tour:', err);
      }
    }
  };

  const handleActionClick = () => {
    if (currentStep?.targetRoute) {
      router.push(currentStep.targetRoute);
      handleClose();
    } else {
      handleNext();
    }
  };

  const handleSpotlightElementClick = () => {
    if (currentStep?.targetRoute) {
      router.push(currentStep.targetRoute);
      handleClose();
    } else {
      const element = document.querySelector(`[data-tour="${currentStep.selector}"]`) as HTMLElement;
      if (element) {
        element.click();
      }
      handleNext();
    }
  };

  const getPopoverStyle = (): React.CSSProperties => {
    if (!targetRect || typeof window === 'undefined') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const popoverWidth = Math.min(380, window.innerWidth - 32);
    const popoverHeight = 320;
    const padding = 16;

    if (currentStep.placement === 'right') {
      const left = Math.min(targetRect.right + 18, window.innerWidth - popoverWidth - padding);
      const top = Math.max(
        padding,
        Math.min(targetRect.top - 20, window.innerHeight - popoverHeight - padding)
      );
      return {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${popoverWidth}px`,
      };
    }

    if (currentStep.placement === 'bottom') {
      const top = targetRect.bottom + 18;
      const left = Math.max(
        padding,
        Math.min(targetRect.left - popoverWidth / 2 + targetRect.width / 2, window.innerWidth - popoverWidth - padding)
      );
      return {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${popoverWidth}px`,
      };
    }

    if (currentStep.placement === 'top') {
      const top = Math.max(padding, targetRect.top - popoverHeight - 18);
      const left = Math.max(
        padding,
        Math.min(targetRect.left - popoverWidth / 2 + targetRect.width / 2, window.innerWidth - popoverWidth - padding)
      );
      return {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${popoverWidth}px`,
      };
    }

    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${popoverWidth}px`,
    };
  };

  const IconComponent = currentStep?.icon || Sparkles;

  return (
    <AnimatePresence>
      {isOpen && currentStep && (
        <div className="fixed inset-0 z-50 select-none">
          {/* Overlay Escuro com Recorte Spotlight */}
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-10 transition-all duration-300">
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left - 6}
                    y={targetRect.top - 6}
                    width={targetRect.width + 12}
                    height={targetRect.height + 12}
                    rx="16"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(2, 6, 23, 0.75)"
              mask="url(#spotlight-mask)"
            />
          </svg>

          {/* Moldura Iluminada / Spotlight Clicável sobre o Elemento Real */}
          {targetRect && (
            <motion.div
              initial={false}
              animate={{
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
              }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={handleSpotlightElementClick}
              className="fixed z-20 rounded-2xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.7)] ring-4 ring-cyan-500/30 cursor-pointer hover:scale-[1.02] transition-transform"
              title="Clique para interagir com este recurso"
            >
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 rounded-full animate-ping" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 rounded-full" />
            </motion.div>
          )}

          {/* Balão Explicativo Flutuante (Tooltip Interativo) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            style={getPopoverStyle()}
            className="z-30 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 pointer-events-auto"
          >
            {/* Barra de Progresso Superior */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Cabeçalho do Balão */}
            <div className="p-4 pb-3 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                    Recurso {currentStepIndex + 1} de {activeSteps.length}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {currentStep.title}
                  </h4>
                </div>
              </div>

              {/* Botão Fechar Tour com Alto Contraste */}
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-slate-500 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                title="Fechar tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Descrição e Dica Prática */}
            <div className="p-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
              <p className="font-normal">{currentStep.description}</p>

              {currentStep.tip && (
                <div className="p-2.5 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200/70 dark:border-cyan-800/50 flex items-start gap-2 text-[11px] text-cyan-950 dark:text-cyan-200">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-cyan-900 dark:text-cyan-300">Dica: </strong>
                    <span>{currentStep.tip}</span>
                  </div>
                </div>
              )}

              {/* Indicadores de Passo (Bolinhas) */}
              <div className="flex items-center justify-center gap-1 pt-1">
                {activeSteps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentStepIndex
                        ? 'w-4 bg-cyan-500'
                        : 'w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                    }`}
                    title={`Ir para recurso ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Rodapé de Ações com Cores e Contraste Sólidos */}
            <div className="p-3 px-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isFirstStep
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 shadow-2xs'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>

              <div className="flex items-center gap-1.5">
                {currentStep.actionLabel && currentStep.targetRoute && (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-700 dark:text-cyan-300 transition cursor-pointer shadow-2xs"
                    title={`Abrir ${currentStep.title} agora`}
                  >
                    <span>{currentStep.actionLabel}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition transform active:scale-98 cursor-pointer"
                >
                  <span>{isLastStep ? 'Concluir' : 'Próximo'}</span>
                  {isLastStep ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
