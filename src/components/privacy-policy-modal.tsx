'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, FileText, Lock, Clock, HeartPulse, UserCheck, AlertCircle } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 w-full max-w-2xl max-h-[90vh] flex flex-col space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                  Política de Privacidade e Proteção de Dados
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Conformidade com a LGPD (Lei nº 13.709/2018) e Normas do COFFITO
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {/* 1. Apresentação */}
            <div className="bg-blue-50/60 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-1">
              <span className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                1. Tratamento Ético e Responsável de Dados de Saúde
              </span>
              <p>
                Este sistema foi desenvolvido para garantir a segurança, integridade e confidencialidade de prontuários,
                avaliações clínicas e evoluções terapêuticas, em estrita observância à Lei Geral de Proteção de Dados
                (LGPD - Lei nº 13.709/2018) e às normas do Conselho Federal de Fisioterapia e Terapia Ocupacional (COFFITO).
              </p>
            </div>

            {/* 2. Bases Legais */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                2. Bases Legais para Tratamento (Art. 7º e Art. 11 da LGPD)
              </h4>
              <p>
                O registro e processamento de informações clínicas e cadastrais são fundamentados em:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>
                  <strong>Tutela da Saúde (Art. 7º, VIII e Art. 11, II, &quot;f&quot;):</strong> realização de atos privativos de avaliação,
                  diagnóstico funcional e prescrição fisioterapêutica por profissionais legalmente habilitados.
                </li>
                <li>
                  <strong>Cumprimento de Obrigação Legal e Regulatória (Art. 7º, II e Art. 11, II, &quot;a&quot;):</strong> dever ético e legal de manutenção
                  e guarda de prontuário fisioterapêutico (Resolução COFFITO nº 414/2012).
                </li>
                <li>
                  <strong>Consentimento Livre e Informado (Art. 7º, I):</strong> manifestado pelo paciente ou seu responsável legal
                  ao iniciar o plano terapêutico ou assinar eletronicamente o laudo.
                </li>
              </ul>
            </div>

            {/* 3. Minimização do CPF e Dados Cadastrais */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                3. Minimização e Sigilo do CPF
              </h4>
              <p>
                Em cumprimento ao princípio da necessidade e minimização de dados (Art. 6º, III), o <strong>CPF do paciente</strong> é
                exclusivamente utilizado para a vinculação fidedigna do prontuário oficial e emissão de laudos impressos em PDF.
                Nas telas cotidianas de atendimento, painéis, listas e links externos, o CPF é suprimido ou mascarado para impedir
                qualquer visualização não intencional ou indevida.
              </p>
            </div>

            {/* 4. Guarda Obrigatória de 20 Anos */}
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-1 text-amber-900 dark:text-amber-200">
              <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                4. Prazo de Guarda dos Registros (20 Anos)
              </span>
              <p className="text-[11px] leading-relaxed">
                Por força da <strong>Lei Federal nº 13.787/2018 (Prontuário Eletrônico)</strong> e da <strong>Resolução COFFITO nº 414/2012</strong>,
                os prontuários, laudos e evoluções possuem prazo obrigatório de custódia e guarda de no mínimo <strong>20 (vinte) anos</strong>
                a contar do último atendimento. A LGPD acolhe expressamente este dever no Art. 16, I, como exceção legítima à eliminação imediata
                de registros de saúde.
              </p>
            </div>

            {/* 5. Direitos do Titular */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                5. Direitos do Paciente / Titular de Dados (Art. 18 da LGPD)
              </h4>
              <p>
                O paciente tem o direito de:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>Confirmar a existência do tratamento de seus dados e acessar todo o seu histórico clínico;</li>
                <li>Solicitar a correção de dados cadastrais incompletos, inexatos ou desatualizados;</li>
                <li>Obter a <strong>portabilidade de seus dados</strong> mediante exportação integral de relatórios em formato PDF;</li>
                <li>Ser informado sobre as medidas de segurança aplicadas na proteção de seus dados sensíveis.</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              Compreendi e Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
