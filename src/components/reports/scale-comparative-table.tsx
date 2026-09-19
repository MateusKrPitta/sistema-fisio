'use client';

import React from 'react';
import { ScaleSession } from '@/lib/clinical-report-engine';

interface ScaleComparativeTableProps {
  sessions: ScaleSession[];
}

export function ScaleComparativeTable({ sessions }: ScaleComparativeTableProps) {
  if (!sessions || sessions.length === 0) return null;

  // Collect all distinct item labels across sessions of this scale
  const distinctItemLabels = Array.from(new Set(sessions.flatMap((s) => s.items.map((it) => it.label))));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
      <div>
        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
          Evolução dos Parâmetros da Escala ({sessions.length} sessões)
        </h4>
        <p className="text-xs text-slate-400">
          Comparativo dos itens avaliados ao longo do tempo nesta escala específica
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Parâmetro / Teste</th>
              {sessions.map((sess, sIdx) => (
                <th key={sess.recordId} className="py-3 px-4 text-slate-800">
                  {sIdx === 0 ? '1ª Avaliação' : `${sIdx + 1}ª Reavaliação`}
                  <span className="block font-mono text-[10px] text-slate-500 font-normal">{sess.date}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {distinctItemLabels.map((itemLabel, itIdx) => (
              <tr key={itIdx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-800">{itemLabel}</td>
                {sessions.map((sess) => {
                  const matchedItem = sess.items.find((it) => it.label === itemLabel);
                  return (
                    <td key={sess.recordId} className="py-3.5 px-4 font-medium text-slate-700">
                      {matchedItem ? (
                        <span className="bg-blue-50/80 text-blue-950 font-bold px-2.5 py-1 rounded-lg border border-blue-200 inline-block">
                          {matchedItem.value} {matchedItem.unit || ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Não avaliado</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
