'use client';

import React from 'react';
import { Header } from '@/components/header';
import { useSearchParams } from 'next/navigation';
import { TeamTab } from '@/components/financial/team-tab';

export default function TeamManagementPage() {
  const searchParams = useSearchParams();
  const companyIdFilter = searchParams ? searchParams.get('companyId') : null;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <Header
        title={companyIdFilter ? 'Equipe da Clínica' : 'Gestão de Profissionais e Equipe'}
        subtitle="Gerencie fisioterapeutas, secretárias e permissões de acesso"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <TeamTab companyIdFilter={companyIdFilter} />
      </div>
    </div>
  );
}
