'use client';

import React, { useState } from 'react';
import { Header } from '@/components/header';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/toast-context';
import { APP_VERSION, APP_NAME } from '@/lib/version';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  MessageCircle,
  Clock,
  Copy,
  ExternalLink,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Compass
} from 'lucide-react';

// Configurações de contato de suporte
const SUPPORT_PHONE = '5567998592808'; // Número oficial de suporte WhatsApp

type FaqCategory =
  | 'Geral'
  | 'Pacientes'
  | 'Agenda'
  | 'Avaliações'
  | 'Evoluções'
  | 'Relatórios'
  | 'Assinatura Digital'
  | 'Equipe'
  | 'Financeiro'
  | 'Segurança e LGPD';

interface FaqItem {
  question: string;
  answer: string;
  category: FaqCategory;
}

const FAQ_ITEMS: FaqItem[] = [
  // 1. Geral
  {
    category: 'Geral',
    question: 'Como instalar o FisMovie no celular ou tablet (PWA)?',
    answer: 'Você pode instalar o FisMovie diretamente pelo navegador: no celular, abra o menu do navegador (três pontinhos ou botão de compartilhamento no Safari) e selecione "Adicionar à tela de início" ou "Instalar Aplicativo". No computador, clique no botão "Instalar Aplicativo" no rodapé da barra lateral esquerda.',
  },
  {
    category: 'Geral',
    question: 'O sistema funciona em múltiplos computadores e celulares simultaneamente?',
    answer: 'Sim! O FisMovie é 100% em nuvem e permite múltiplos acessos simultâneos em tempo real por toda a equipe (recepção, secretária, administradores e fisioterapeutas) em qualquer lugar.',
  },
  {
    category: 'Geral',
    question: 'Como alternar entre o Modo Escuro (Dark Mode) e Modo Claro?',
    answer: 'No cabeçalho superior direito, ao lado das notificações e do seu perfil, clique no botão de sol/lua para alternar entre o tema claro, tema escuro ou automático do sistema.',
  },
  {
    category: 'Geral',
    question: 'Como funciona a notificação de aniversariantes do dia?',
    answer: 'No menu "Aniversariantes" e no ícone de presente no cabeçalho superior, o sistema avisa automaticamente todos os pacientes que fazem aniversário na data de hoje, com botão direto de parabenização.',
  },

  // 2. Pacientes
  {
    category: 'Pacientes',
    question: 'Como cadastrar um novo paciente no sistema?',
    answer: 'Clique no botão azul "+ Novo Paciente" no cabeçalho superior ou acesse o menu "Pacientes" e selecione "Cadastrar Paciente". Preencha dados pessoais, telefone, CPF, data de nascimento e queixa principal.',
  },
  {
    category: 'Pacientes',
    question: 'Como editar dados cadastrais, endereço ou telefone de um paciente?',
    answer: 'Acesse o menu "Pacientes", localize o paciente desejado na busca e clique no botão de edição (ícone de lápis) para atualizar qualquer dado de contato ou endereço.',
  },
  {
    category: 'Pacientes',
    question: 'Como anexar exames e documentos no prontuário do paciente?',
    answer: 'Na ficha do paciente, acesse a seção de prontuário ou avaliações e faça o upload de laudos, fotos de raio-x, ressonâncias ou relatórios médicos nos formatos JPG, PNG ou PDF.',
  },
  {
    category: 'Pacientes',
    question: 'Como visualizar o histórico clínico completo de um paciente?',
    answer: 'Na listagem de pacientes, clique sobre o nome do paciente para abrir seu prontuário detalhado com abas organizadas: Dados Pessoais, Avaliações Realizadas, Linha do Tempo de Evoluções e Histórico de Consultas.',
  },

  // 3. Agenda & Atendimentos
  {
    category: 'Agenda',
    question: 'Como agendar uma nova consulta ou sessão?',
    answer: 'Acesse o menu "Atendimentos". Clique no horário desejado no calendário ou no botão "+ Novo Atendimento". Selecione o paciente, fisioterapeuta responsável, tipo de procedimento, data, horário e valor.',
  },
  {
    category: 'Agenda',
    question: 'Como reagendar ou mudar o horário de um atendimento?',
    answer: 'Na grade de atendimentos, clique sobre o agendamento desejado, selecione a opção "Editar" e modifique a data ou horário para o novo período acordado com o paciente.',
  },
  {
    category: 'Agenda',
    question: 'Como cancelar um agendamento e registrar o motivo?',
    answer: 'Abra os detalhes do agendamento e altere o status para "Cancelado" ou clique na opção de cancelamento informando se houve aviso prévio do paciente.',
  },
  {
    category: 'Agenda',
    question: 'Como filtrar a agenda por fisioterapeuta da equipe?',
    answer: 'No topo da página de Atendimentos, utilize o filtro de profissionais para exibir a agenda completa da clínica ou apenas os horários de um fisioterapeuta específico.',
  },
  {
    category: 'Agenda',
    question: 'O que significa cada status do agendamento?',
    answer: 'Agendado (marcado inicialmente), Confirmado (presença confirmada pelo paciente), Realizado (sessão concluída), Faltou (paciente ausente sem aviso) e Cancelado (desmarcado).',
  },

  // 4. Avaliações
  {
    category: 'Avaliações',
    question: 'Como iniciar uma nova avaliação fisioterapêutica?',
    answer: 'No prontuário do paciente ou no menu "Avaliações", clique em "Nova Avaliação". Escolha o modelo desejado (Avaliação Postural, Funcional, Ortopédica, etc.) e preencha as etapas clínicas.',
  },
  {
    category: 'Avaliações',
    question: 'Como utilizar o mapa corporal interativo de dor?',
    answer: 'Durante a avaliação, clique nas regiões do corpo humano na ilustração interativa para marcar pontos de dor, nível na Escala Visual Analógica (EVA de 0 a 10) e tipo de sintoma (queimação, pontada, peso, etc.).',
  },
  {
    category: 'Avaliações',
    question: 'Como anexar fotos da postura (planos anterior, posterior e perfil)?',
    answer: 'No formulário de avaliação postural, utilize os campos de upload para anexar fotos ou fotografar diretamente pela câmera do celular/tablet. As imagens ficam salvas no laudo com alta nitidez.',
  },
  {
    category: 'Avaliações',
    question: 'Como exportar o laudo da avaliação em PDF para impressão?',
    answer: 'Na tela de visualização da avaliação salva, clique no botão "Gerar Relatório PDF" para emitir o laudo formatado com a logo da clínica, parecer clínico, dados do CREFITO e mapa de dor.',
  },
  {
    category: 'Avaliações',
    question: 'Como criar ou personalizar novos modelos de avaliação?',
    answer: 'No menu "Avaliações > Módulos", administradores podem criar formulários customizados adicionando campos de texto, múltipla escolha, upload de imagens e escalas de medição.',
  },

  // 5. Evoluções
  {
    category: 'Evoluções',
    question: 'O que é o registro de evolução diária e como preencher?',
    answer: 'A evolução diária é o registro da sessão de tratamento realizada. Acesse "Evoluções" ou a ficha do paciente, clique em "+ Nova Evolução" e descreva os exercícios aplicados, condutas, resposta do paciente e orientações dadas.',
  },
  {
    category: 'Evoluções',
    question: 'Como acompanhar os gráficos de melhora do paciente?',
    answer: 'Ao registrar a escala de dor e amplitude de movimento a cada evolução, o sistema gera automaticamente gráficos de evolução clínica para demonstrar os ganhos de tratamento ao paciente.',
  },
  {
    category: 'Evoluções',
    question: 'Posso anexar fotos de antes e depois nas evoluções?',
    answer: 'Sim! Em cada evolução você pode anexar fotos para documentar a melhora postural, cicatrização, amplitude articular ou testes funcionais do paciente.',
  },

  // 6. Relatórios
  {
    category: 'Relatórios',
    question: 'Onde vejo o volume de atendimentos e relatórios clínicos?',
    answer: 'No menu "Relatórios", você tem acesso a relatórios estatísticos de atendimentos realizados, pacientes ativos, evolução dos quadros clínicos e distribuição de sessões por especialidade.',
  },
  {
    category: 'Relatórios',
    question: 'Como funciona o assistente de laudos com Inteligência Artificial?',
    answer: 'Na aba de relatórios clínicos, o assistente inteligente analisa as queixas e testes registrados na avaliação para sugerir resumos clínicos objetivos e recomendações terapêuticas profissionais.',
  },

  // 7. Assinatura Digital
  {
    category: 'Assinatura Digital',
    question: 'Como funciona a assinatura digital de avaliações pelo paciente?',
    answer: 'Ao finalizar a avaliação, clique no botão "Enviar Assinatura" ou "Assinar". Um link seguro com token exclusivo é gerado e pode ser aberto no celular ou tablet para o paciente assinar com o dedo ou caneta touch.',
  },
  {
    category: 'Assinatura Digital',
    question: 'O paciente precisa ter o aplicativo instalado para assinar?',
    answer: 'Não! O link de assinatura abre diretamente em qualquer navegador web de celular ou computador, sem necessidade de download de nenhum aplicativo pelo paciente.',
  },
  {
    category: 'Assinatura Digital',
    question: 'Onde fica armazenada a assinatura digital do paciente?',
    answer: 'A assinatura é gravada com carimbo de data, hora e IP no documento digital, ficando integrada permanentemente ao laudo em PDF e no prontuário do paciente.',
  },

  // 8. Equipe
  {
    category: 'Equipe',
    question: 'Como cadastrar fisioterapeutas e secretárias na minha clínica?',
    answer: 'No menu "Minha Equipe" (acessível por administradores), clique em "Novo Membro", preencha nome, e-mail, CREFITO (se fisioterapeuta), perfil de acesso e regras de remuneração.',
  },
  {
    category: 'Equipe',
    question: 'Quais são as diferenças de acesso entre os perfis de usuário?',
    answer: 'Administrador da Clínica (acesso irrestrito a financeiro, equipe e relatórios), Fisioterapeuta (acesso a pacientes, avaliações, evoluções e agenda própria) e Secretária (gestão de agenda, recepção e aniversariantes).',
  },
  {
    category: 'Equipe',
    question: 'Como redefinir a senha de um colaborador?',
    answer: 'No menu "Minha Equipe", localize o membro desejado, clique no ícone de edição e utilize o campo "Nova Senha" para redefinir as credenciais de acesso.',
  },

  // 9. Financeiro
  {
    category: 'Financeiro',
    question: 'Onde visualizo o faturamento mensal e fluxo de caixa da clínica?',
    answer: 'No menu "Financeiro" (disponível para Administradores), você tem gráficos de receitas, despesas, saldo líquido do mês e histórico de transações.',
  },
  {
    category: 'Financeiro',
    question: 'Como funciona o cálculo automático de comissões da equipe?',
    answer: 'O sistema calcula automaticamente os repasses aos profissionais com base no modelo cadastrado (valor fixo por sessão realizada, porcentagem sobre o atendimento ou valor híbrido).',
  },
  {
    category: 'Financeiro',
    question: 'Como registrar entradas de planos, pacotes e despesas avulsas?',
    answer: 'Na tela Financeira, utilize os botões de lançamento rápido para registrar entradas de planos/pacotes vendidos ou despesas operacionais da clínica (aluguel, insumos, manutenção).',
  },

  // 10. Segurança e LGPD
  {
    category: 'Segurança e LGPD',
    question: 'Como os dados dos pacientes são protegidos no FisMovie?',
    answer: 'Todas as comunicações utilizam criptografia SSL/TLS em trânsito e armazenamento seguro em servidores em nuvem de alta disponibilidade, cumprindo rigorosamente as normas da LGPD.',
  },
  {
    category: 'Segurança e LGPD',
    question: 'Quem tem acesso aos prontuários e dados médicos da clínica?',
    answer: 'Apenas os profissionais autorizados da sua própria clínica têm acesso aos dados dos seus pacientes. Cada clínica opera em ambiente isolado e seguro.',
  },
  {
    category: 'Segurança e LGPD',
    question: 'O sistema realiza backup automático das informações?',
    answer: 'Sim! Os backups do banco de dados e arquivos de prontuário são executados automaticamente e replicados diariamente para máxima segurança contra perdas.',
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados do formulário de contato (simples e enxuto)
  const [subjectType, setSubjectType] = useState<string>('duvida');
  const [customMessage, setCustomMessage] = useState<string>('');

  // Estados do FAQ
  const [faqSearch, setFaqSearch] = useState<string>('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('Todas');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Assuntos do WhatsApp (enxuto)
  const subjectList = [
    { id: 'duvida', label: 'Dúvida Geral' },
    { id: 'problema', label: 'Relatar Erro' },
    { id: 'sugestao', label: 'Sugestão' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'outro', label: 'Outro Assunto' },
  ];

  const subjectLabels: Record<string, string> = subjectList.reduce(
    (acc, curr) => ({ ...acc, [curr.id]: curr.label }),
    {}
  );

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'superadmin':
        return 'Super Administrador';
      case 'clinic_admin':
        return 'Administrador da Clínica';
      case 'secretary':
        return 'Secretária / Recepção';
      case 'physiotherapist':
        return 'Fisioterapeuta';
      default:
        return 'Usuário';
    }
  };

  // Gerar mensagem formatada para WhatsApp
  const generateWhatsAppMessage = () => {
    const lines = [
      `*Olá, equipe de Suporte ${APP_NAME}!* 👋`,
      ``,
      `*Solicitante:* ${user?.fullName || user?.name || 'Não informado'}`,
      `*E-mail:* ${user?.email || 'Não informado'}`,
      `*Perfil:* ${getRoleLabel()}`,
      `*Clínica / Empresa:* ${user?.company?.name || 'Não informada'}`,
      `*Versão do Sistema:* ${APP_VERSION}`,
      `*Motivo:* ${subjectLabels[subjectType] || subjectType}`,
      ``,
      `*Descrição / Dúvida:*`,
      customMessage.trim() ? customMessage.trim() : 'Gostaria de auxílio referente ao sistema.',
    ];

    return lines.join('\n');
  };

  // Abertura do WhatsApp
  const handleOpenWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${SUPPORT_PHONE}?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Abrindo WhatsApp do suporte...');
  };

  // Copiar dados de diagnóstico técnico
  const handleCopyDiagnostics = () => {
    const diagnosticInfo = [
      `=== DIAGNÓSTICO TÉCNICO ${APP_NAME.toUpperCase()} ===`,
      `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
      `Versão: ${APP_VERSION}`,
      `Usuário: ${user?.fullName || user?.name} (ID: ${user?.id})`,
      `E-mail: ${user?.email}`,
      `Perfil: ${user?.role}`,
      `Clínica: ${user?.company?.name} (ID: ${user?.companyId || user?.company?.id})`,
      `Navegador: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
      `Resolução de Tela: ${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}`,
      `Plataforma: ${typeof navigator !== 'undefined' ? navigator.platform : 'N/A'}`,
      `URL Atual: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
    ].join('\n');

    navigator.clipboard.writeText(diagnosticInfo);
    toast.success('Dados copiados!', 'Cole na conversa com o suporte se solicitado.');
  };

  // Lista de categorias do FAQ
  const categories: string[] = [
    'Todas',
    'Geral',
    'Pacientes',
    'Agenda',
    'Avaliações',
    'Evoluções',
    'Relatórios',
    'Assinatura Digital',
    'Equipe',
    'Financeiro',
    'Segurança e LGPD',
  ];

  // Filtragem do FAQ
  const filteredFaq = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedFaqCategory === 'Todas' || item.category === selectedFaqCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto no-scrollbar">
      <Header
        title="Central de Suporte e Atendimento"
        subtitle="Canais diretos de ajuda, assistência técnica e dúvidas sobre o sistema"
        showNewPatientAction={false}
        showBirthdayNotification={false}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner de Boas-Vindas & Status */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Sistema Operacional • 100% Online
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Sparkles className="w-3 h-3" />
                  {APP_NAME} {APP_VERSION}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Como podemos te ajudar hoje?
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Nossa equipe de suporte está pronta para te atender. Inicie um atendimento direto pelo WhatsApp ou tire suas dúvidas nas categorias do FAQ abaixo.
              </p>
            </div>

            {/* Card de Dados Rápidos do Usuário Logado */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border border-slate-700/60 text-xs space-y-2 shrink-0 w-full md:w-auto min-w-[260px]">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-700/50">
                <span className="text-slate-400 font-medium">Sua Conta:</span>
                <span className="font-semibold text-white truncate max-w-[150px]">
                  {user?.fullName || user?.name || 'Profissional'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Clínica:</span>
                <span className="text-slate-200 font-medium truncate max-w-[150px]">
                  {user?.company?.name || 'Minha Clínica'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Perfil:</span>
                <span className="text-cyan-400 font-medium">{getRoleLabel()}</span>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer border border-slate-600/50"
                  title="Copiar dados técnicos para o suporte"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Dados da Conta</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Principal de Atendimento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card WhatsApp: Atendimento Ágil (8 colunas) */}
          <div data-tour="support-whatsapp-card" className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Atendimento via WhatsApp
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Canal Direto
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Converse em tempo real com nossa equipe de suporte
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulário de Montagem da Mensagem */}
              <div className="space-y-4 mt-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Qual o motivo do seu contato?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {subjectList.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSubjectType(item.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          subjectType === item.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mensagem ou Detalhes (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Descreva brevemente sua dúvida ou situação para adiantar o atendimento..."
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Preview Box */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Prévia dos dados enviados:
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-2">
                    {user?.fullName || user?.name} • {user?.company?.name || 'Clínica'} • {subjectLabels[subjectType]}
                  </p>
                </div>
              </div>
            </div>

            {/* Ação Botão WhatsApp */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Conversar no WhatsApp Agora</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </button>
            </div>
          </div>

          {/* Card Lateral: Horários de Atendimento (4 colunas) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Horários de Suporte</h3>
                    <p className="text-[11px] text-slate-400 font-normal">Atendimento humanizado</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Nossa equipe técnica atende em horário comercial para suporte e dúvidas clínicas.
                </p>

                <div className="space-y-3 text-xs pt-1">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <span>Segunda a Sexta:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">08:00 às 18:00</span>
                  </div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <span>Sábados:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">08:00 às 12:00</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Servidores e Cloud:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">24h Ativo</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Canal Prioritário:</span>
                <p>Suporte direto via WhatsApp com histórico e agilidade.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção FAQ (Perguntas Frequentes Ampliadas) */}
        <div data-tour="support-faq-section" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Central de Conhecimento</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                Dúvidas Frequentes (FAQ)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione uma categoria abaixo ou busque por qualquer palavra-chave
              </p>
            </div>

            {/* Campo de Busca no FAQ */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Buscar dúvida, paciente, laudo..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Categorias FAQ com scroll horizontal suave */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const count =
                cat === 'Todas'
                  ? FAQ_ITEMS.length
                  : FAQ_ITEMS.filter((i) => i.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFaqCategory(cat)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedFaqCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedFaqCategory === cat
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lista de Itens do FAQ */}
          <div className="space-y-3">
            {filteredFaq.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma dúvida encontrada para &quot;{faqSearch}&quot;</p>
                <p>Experimente buscar por outros termos ou chame nossa equipe no botão do WhatsApp acima.</p>
              </div>
            ) : (
              filteredFaq.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left bg-slate-50/50 dark:bg-slate-850/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 pr-2 min-w-0">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-lg font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 shrink-0">
                          {item.category}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.question}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
