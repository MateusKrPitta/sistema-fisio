"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home, Activity } from "lucide-react";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900/90 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5 dark:ring-amber-500/10">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase">
            <Activity className="w-4 h-4" />
            <span>FisMovie PWA</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Você está sem conexão
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Não foi possível carregar novas informações da clínica porque o dispositivo está sem acesso ao Wi-Fi ou dados móveis.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-300 text-left space-y-2">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            💡 Dica para atendimentos:
          </p>
          <p>
            As telas e cadastros previamente visualizados ficam salvos no cache do seu aplicativo. Assim que a conexão retornar, tudo será atualizado automaticamente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleReload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
