'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/header';
import { SubscriptionTab } from '@/components/financial/subscription-tab';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role === 'superadmin') {
      router.replace('/admin');
    }
  }, [user, isLoading, router]);

  if (user?.role === 'superadmin') {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <Header
        title="Minha Assinatura e Mensalidade"
        subtitle="Gerenciamento do plano da sua clínica, faturas e pagamentos via PIX"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <SubscriptionTab />
      </div>
    </div>
  );
}
