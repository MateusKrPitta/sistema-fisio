'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-xs text-slate-400">Redirecionando para a tela de login...</p>
    </div>
  );
}
