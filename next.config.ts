import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  async rewrites() {
    return [
      // Avaliações
      { source: '/avaliacoes/modulos', destination: '/custom-forms/modules' },
      { source: '/avaliacoes/modelos', destination: '/custom-forms/templates' },
      { source: '/avaliacoes/modelos/:id', destination: '/custom-forms/templates/:id' },
      { source: '/avaliacoes', destination: '/custom-forms/modules' },

      // Atendimentos / Agenda
      { source: '/atendimentos', destination: '/appointments' },

      // Pacientes
      { source: '/pacientes', destination: '/patients' },
      { source: '/pacientes/:id', destination: '/patients/:id' },
      { source: '/pacientes/:id/evolucao/nova', destination: '/patients/:id/evolution/new' },
      { source: '/pacientes/:id/formularios/novo', destination: '/patients/:id/forms/new' },

      // Evoluções
      { source: '/evolucoes', destination: '/evolutions' },

      // Relatórios
      { source: '/relatorios', destination: '/reports' },

      // Financeiro
      { source: '/financeiro', destination: '/financial' },

      // Aniversariantes
      { source: '/aniversariantes', destination: '/birthdays' },
      { source: '/aniversarios', destination: '/birthdays' },

      // Equipe
      { source: '/equipe', destination: '/team' },

      // Assinatura / Planos
      { source: '/assinatura', destination: '/subscription' },

      // Suporte
      { source: '/suporte', destination: '/support' },
    ];
  },
  async redirects() {
    return [
      { source: '/custom-forms/modules', destination: '/avaliacoes/modulos', permanent: false },
      { source: '/custom-forms/templates', destination: '/avaliacoes/modelos', permanent: false },
      { source: '/custom-forms/templates/:id', destination: '/avaliacoes/modelos/:id', permanent: false },
      { source: '/custom-forms', destination: '/avaliacoes/modulos', permanent: false },
      { source: '/appointments', destination: '/atendimentos', permanent: false },
      { source: '/patients', destination: '/pacientes', permanent: false },
      { source: '/patients/:id', destination: '/pacientes/:id', permanent: false },
      { source: '/patients/:id/evolution/new', destination: '/pacientes/:id/evolucao/nova', permanent: false },
      { source: '/patients/:id/forms/new', destination: '/pacientes/:id/formularios/novo', permanent: false },
      { source: '/evolutions', destination: '/evolucoes', permanent: false },
      { source: '/reports', destination: '/relatorios', permanent: false },
      { source: '/financial', destination: '/financeiro', permanent: false },
      { source: '/birthdays', destination: '/aniversariantes', permanent: false },
      { source: '/team', destination: '/equipe', permanent: false },
      { source: '/subscription', destination: '/assinatura', permanent: false },
      { source: '/support', destination: '/suporte', permanent: false },
    ];
  },
};

export default nextConfig;

