'use client';

import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Página não encontrada</h2>
        <p className="text-xs text-slate-500">
          O recurso ou endereço acessado não está disponível ou foi movido.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </Link>
      </div>
    </div>
  );
}
