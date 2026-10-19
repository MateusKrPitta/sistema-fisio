'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  Info,
  ChevronDown,
  Volume2,
  HelpCircle,
  Eye,
  GraduationCap,
  Check,
  X,
  Maximize2,
} from 'lucide-react';
import {
  calculateMoCAScore,
  MoCACalculationResult,
} from '@/lib/clinical-presets';
import { CustomSelect } from '@/components/custom-select';

interface MocaCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  extra?: React.ReactNode;
  compact?: boolean;
}

function MocaCheckbox({
  checked,
  onChange,
  label,
  sublabel,
  extra,
  compact = false,
}: MocaCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`group w-full flex items-start text-left rounded-2xl border transition-all cursor-pointer ${
        compact ? 'p-3 space-x-2.5 items-center' : 'p-3.5 space-x-3'
      } ${
        checked
          ? 'bg-purple-500/10 border-purple-500/60 dark:border-purple-500/70 shadow-2xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
          compact ? '' : 'mt-0.5'
        } ${
          checked
            ? 'bg-purple-600 border-purple-600 text-white shadow-xs ring-2 ring-purple-600/20'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 group-hover:border-purple-400'
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <span
            className={`text-xs font-bold leading-tight ${
              checked
                ? 'text-purple-950 dark:text-purple-200'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {label}
          </span>
          {extra}
        </div>
        {sublabel && (
          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

function MocaTileCheckbox({
  checked,
  onChange,
  label,
  sublabel,
  category,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sublabel?: string;
  category?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`group w-full p-3.5 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
        checked
          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
          : 'bg-slate-50 dark:bg-slate-950/70 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="font-mono text-xs font-black uppercase tracking-wider truncate">{label}</span>
        <div
          className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
            checked
              ? 'bg-white text-purple-600 border-white'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-purple-400'
          }`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>
      {category && (
        <span className={`text-[10px] block truncate ${checked ? 'text-purple-200' : 'text-slate-400'}`}>
          {category}
        </span>
      )}
      <span className={`text-[10px] font-bold mt-2 block ${checked ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
        {checked ? '✓ Evocado (1 pt)' : sublabel || 'Não evocou'}
      </span>
    </button>
  );
}

function MocaOrientationTile({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`group w-full p-3 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
        checked
          ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
          : 'bg-slate-50 dark:bg-slate-950/70 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-xs font-bold truncate">{label}</span>
        <div
          className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
            checked
              ? 'bg-white text-sky-600 border-white'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-sky-400'
          }`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>
      <span className={`text-[10px] font-bold mt-1.5 block ${checked ? 'text-sky-100' : 'text-slate-400'}`}>
        {checked ? '✓ Correto (1 pt)' : 'Incorreto (0 pt)'}
      </span>
    </button>
  );
}

/* ========================================================
   ILUSTRAÇÕES VETORIAIS OFICIAIS DO MOCA (ADAPTAÇÃO BRASIL)
   ======================================================== */

// 1. Trilha Alternada (Trail Making Test: 1-A-2-B-3-C-4-D-5-E)
export function MocaTrailIllustration({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="trailArrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" className="text-slate-400 dark:text-slate-500" />
        </marker>
      </defs>

      {/* Trajetória tracejada oficial guiando a ordem crescente alternada */}
      <g stroke="currentColor" className="text-slate-300 dark:text-slate-650" strokeWidth="1.6" strokeDasharray="4 3">
        <line x1="75" y1="135" x2="135" y2="40" markerEnd="url(#trailArrow)" />
        <line x1="148" y1="40" x2="210" y2="60" markerEnd="url(#trailArrow)" />
        <line x1="215" y1="68" x2="175" y2="100" markerEnd="url(#trailArrow)" />
        <line x1="178" y1="108" x2="248" y2="148" markerEnd="url(#trailArrow)" />
        <line x1="245" y1="158" x2="152" y2="185" markerEnd="url(#trailArrow)" />
        <line x1="148" y1="178" x2="190" y2="145" markerEnd="url(#trailArrow)" />
        <line x1="185" y1="140" x2="72" y2="182" markerEnd="url(#trailArrow)" />
        <line x1="65" y1="175" x2="42" y2="92" markerEnd="url(#trailArrow)" />
        <line x1="48" y1="80" x2="90" y2="48" markerEnd="url(#trailArrow)" />
      </g>

      {/* Círculos e Rótulos */}
      {/* 1 - Início */}
      <g>
        <circle cx="70" cy="140" r="16" className="fill-white dark:fill-slate-900 stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="2.5" />
        <text x="70" y="145" textAnchor="middle" className="font-extrabold text-sm fill-indigo-600 dark:fill-indigo-400 font-sans">1</text>
        <text x="70" y="170" textAnchor="middle" className="font-black text-[10px] fill-emerald-600 dark:fill-emerald-400 uppercase tracking-wider">Início</text>
      </g>

      {/* A */}
      <g>
        <circle cx="140" cy="35" r="15" className="fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
        <text x="140" y="40" textAnchor="middle" className="font-bold text-sm fill-slate-800 dark:fill-slate-100 font-sans">A</text>
      </g>

      {/* 2 */}
      <g>
        <circle cx="218" cy="65" r="15" className="fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
        <text x="218" y="70" textAnchor="middle" className="font-bold text-sm fill-slate-800 dark:fill-slate-100 font-sans">2</text>
      </g>

      {/* B */}
      <g>
        <circle cx="170" cy="105" r="15" className="fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
        <text x="170" y="110" textAnchor="middle" className="font-bold text-sm fill-slate-800 dark:fill-slate-100 font-sans">B</text>
      </g>

      {/* 3 */}
      <g>
        <circle cx="255" cy="155" r="15" className="fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
        <text x="255" y="160" textAnchor="middle" className="font-bold text-sm fill-slate-800 dark:fill-slate-100 font-sans">3</text>
      </g>

      {/* C */}
      <g>
        <circle cx="145" cy="190" r="15" className="fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
        <text x="145" y="195" textAnchor="middle" className="font-bold text-sm fill-slate-800 dark:fill-slate-100 font-sans">C</text>
      </g>

      {/* 4 */}
      <g>
        <circle cx="195" cy="140" r="15" className="fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
        <text x="195" y="145" textAnchor="middle" className="font-bold text-sm fill-slate-800 dark:fill-slate-100 font-sans">4</text>
      </g>

      {/* D */}
      <g>
        <circle cx="65" cy="190" r="15" className="fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
        <text x="65" y="195" textAnchor="middle" className="font-bold text-sm fill-slate-800 dark:fill-slate-100 font-sans">D</text>
      </g>

      {/* 5 */}
      <g>
        <circle cx="40" cy="85" r="15" className="fill-white dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200" strokeWidth="2" />
        <text x="40" y="90" textAnchor="middle" className="font-bold text-sm fill-slate-800 dark:fill-slate-100 font-sans">5</text>
      </g>

      {/* E - Fim */}
      <g>
        <circle cx="95" cy="45" r="16" className="fill-white dark:fill-slate-900 stroke-rose-600 dark:stroke-rose-400" strokeWidth="2.5" />
        <text x="95" y="50" textAnchor="middle" className="font-extrabold text-sm fill-rose-600 dark:fill-rose-400 font-sans">E</text>
        <text x="95" y="22" textAnchor="middle" className="font-black text-[10px] fill-rose-600 dark:fill-rose-400 uppercase tracking-wider">Fim</text>
      </g>
    </svg>
  );
}

// 2. Cópia do Cubo (Cubo Tridimensional Isométrico)
export function MocaCubeIllustration({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sombra / Faces sutis */}
      <polygon points="25,48 95,48 95,118 25,118" className="fill-slate-50/60 dark:fill-slate-800/40" />
      <polygon points="25,48 60,18 130,18 95,48" className="fill-slate-100/80 dark:fill-slate-700/50" />
      <polygon points="95,48 130,18 130,88 95,118" className="fill-slate-150/60 dark:fill-slate-750/40" />

      {/* Arestas internas / ocultas */}
      <g stroke="currentColor" className="text-slate-300 dark:text-slate-650" strokeWidth="1.5" strokeDasharray="3 3">
        <line x1="25" y1="118" x2="60" y2="88" />
        <line x1="60" y1="88" x2="130" y2="88" />
        <line x1="60" y1="18" x2="60" y2="88" />
      </g>

      {/* Arestas externas visíveis */}
      <g stroke="currentColor" className="text-slate-900 dark:text-slate-100" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Face Frontal */}
        <polygon points="25,48 95,48 95,118 25,118" />
        {/* Face Superior */}
        <line x1="25" y1="48" x2="60" y2="18" />
        <line x1="60" y1="18" x2="130" y2="18" />
        <line x1="130" y1="18" x2="95" y2="48" />
        {/* Face Lateral Direita */}
        <line x1="130" y1="18" x2="130" y2="88" />
        <line x1="130" y1="88" x2="95" y2="118" />
      </g>
    </svg>
  );
}

// 3. Desenho do Relógio (Gabarito Oficial: 11:10)
export function MocaClockIllustration({ className = 'w-full h-auto' }: { className?: string }) {
  const numbers = [
    { num: '12', x: 70, y: 26 },
    { num: '1', x: 94, y: 32 },
    { num: '2', x: 111, y: 49 },
    { num: '3', x: 117, y: 74 },
    { num: '4', x: 111, y: 98 },
    { num: '5', x: 94, y: 115 },
    { num: '6', x: 70, y: 121 },
    { num: '7', x: 46, y: 115 },
    { num: '8', x: 29, y: 98 },
    { num: '9', x: 23, y: 74 },
    { num: '10', x: 29, y: 49 },
    { num: '11', x: 46, y: 32 },
  ];

  return (
    <svg viewBox="0 0 140 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Contorno do mostrador */}
      <circle cx="70" cy="70" r="58" className="fill-white dark:fill-slate-900 stroke-slate-900 dark:stroke-slate-100" strokeWidth="2.5" />
      
      {/* Números de 1 a 12 */}
      {numbers.map((n) => (
        <text key={n.num} x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" className="font-black text-[10.5px] fill-slate-800 dark:fill-slate-200 font-mono">
          {n.num}
        </text>
      ))}

      {/* Ponteiro curto das horas apontando para o 11 */}
      <line x1="70" y1="70" x2="49" y2="35" stroke="currentColor" className="text-purple-600 dark:text-purple-400" strokeWidth="3.5" strokeLinecap="round" />

      {/* Ponteiro longo dos minutos apontando para o 2 (10 minutos) */}
      <line x1="70" y1="70" x2="104" y2="44" stroke="currentColor" className="text-slate-900 dark:text-slate-100" strokeWidth="2.5" strokeLinecap="round" />

      {/* Pino central */}
      <circle cx="70" cy="70" r="4" className="fill-purple-600 dark:fill-purple-400" />
    </svg>
  );
}

// 4. Animal 1: Leão (MoCA Official Lion Drawing)
export function MocaLionIllustration({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800 dark:text-slate-200">
        {/* Juba do Leão */}
        <path d="M165 42 C168 30 158 20 146 22 C140 16 128 17 122 24 C115 22 108 26 106 33 C98 34 94 42 96 50 C92 56 94 65 99 71 C95 78 98 87 106 90 C112 95 122 96 128 92 C134 97 145 96 150 90 C156 92 165 88 167 80 C173 75 174 65 170 58 C174 52 172 45 165 42 Z" className="fill-amber-50/50 dark:fill-amber-950/20" />
        {/* Perfil da Cabeça e Focinho */}
        <path d="M152 35 C156 32 162 34 163 38 C166 40 172 42 176 45 C182 49 192 50 196 54 C198 56 198 60 194 62 C188 64 182 63 178 66 C174 68 170 74 165 72" />
        {/* Olho e Nariz */}
        <ellipse cx="172" cy="48" rx="2" ry="1.5" className="fill-slate-800 dark:fill-slate-200" />
        <path d="M194 53 L191 57 L188 54 Z" className="fill-slate-800 dark:fill-slate-200" />
        <path d="M191 57 C191 60 186 61 183 61" />
        {/* Orelha */}
        <path d="M148 27 C152 23 158 25 156 31" />
        {/* Bigodes / Focinho */}
        <circle cx="186" cy="58" r="0.8" className="fill-slate-800 dark:fill-slate-200" />
        <circle cx="184" cy="60" r="0.8" className="fill-slate-800 dark:fill-slate-200" />
        <circle cx="188" cy="60" r="0.8" className="fill-slate-800 dark:fill-slate-200" />
        {/* Dorso do Leão */}
        <path d="M115 38 C95 44 75 48 55 45 C45 44 38 48 35 55" />
        {/* Perna Traseira Esquerda */}
        <path d="M35 55 C30 65 28 80 32 95 C33 103 36 118 36 125 L48 125 C48 118 45 106 48 98 C54 98 60 106 60 114 L60 125 L70 125 C70 115 68 96 66 88" />
        {/* Perna Traseira Direita */}
        <path d="M22 62 C20 72 20 85 24 98 L24 122 L32 122 L32 105" strokeWidth="1.8" className="text-slate-500 dark:text-slate-400" />
        {/* Linha Ventral */}
        <path d="M66 88 C85 89 105 84 118 78" />
        {/* Pata Dianteira Esquerda */}
        <path d="M125 78 C124 90 125 106 124 116 C124 121 120 125 128 125 L138 125 C138 118 137 104 139 92 C142 84 145 80 148 76" />
        {/* Pata Dianteira Direita */}
        <path d="M144 85 L146 122 L154 122 L155 90" strokeWidth="1.8" className="text-slate-500 dark:text-slate-400" />
        {/* Cauda com tufo */}
        <path d="M35 55 C25 58 15 68 12 80 C9 92 12 105 18 112" />
        <path d="M18 112 C16 116 18 123 23 125 C25 121 24 115 20 111 Z" className="fill-slate-800 dark:fill-slate-200" />
        {/* Linha de Chão */}
        <ellipse cx="95" cy="128" rx="80" ry="3" className="fill-slate-200/50 dark:fill-slate-800/40 stroke-none" />
      </g>
    </svg>
  );
}

// 5. Animal 2: Rinoceronte (MoCA Official Rhino Drawing)
export function MocaRhinoIllustration({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800 dark:text-slate-200">
        {/* Chifre anterior proeminente */}
        <path d="M205 60 C212 50 215 36 210 28 C204 36 198 46 195 55" className="fill-slate-100 dark:fill-slate-800" />
        {/* Chifre posterior menor */}
        <path d="M190 52 C194 46 195 40 192 37 C188 41 185 47 183 52" className="fill-slate-100 dark:fill-slate-800" />
        {/* Cabeça e boca */}
        <path d="M195 55 C202 62 204 70 198 75 C190 80 182 78 175 75 C168 85 158 88 145 86" />
        {/* Olho e orelha */}
        <circle cx="178" cy="52" r="2" className="fill-slate-800 dark:fill-slate-200" />
        <path d="M165 40 C166 32 172 32 170 42 Z" className="fill-slate-100 dark:fill-slate-800" />
        {/* Dobra escapular e ombro com placas */}
        <path d="M170 42 C158 40 145 35 130 36 C115 37 105 45 95 46" />
        <path d="M142 42 C146 54 148 68 142 82" strokeWidth="1.8" />
        <path d="M128 38 C132 52 134 68 126 84" strokeWidth="1.8" />
        {/* Dorso e anca pesada */}
        <path d="M95 46 C75 48 55 45 42 55 C32 65 30 78 35 90" />
        {/* Dobra traseira */}
        <path d="M52 48 C48 62 46 76 52 88" strokeWidth="1.8" />
        {/* Pata dianteira esquerda */}
        <path d="M145 86 L143 115 C143 121 140 124 148 124 L160 124 C162 124 163 118 162 112 L165 84" />
        {/* Pata dianteira direita */}
        <path d="M168 84 L170 121 L178 121 L180 88" strokeWidth="1.8" className="text-slate-500 dark:text-slate-400" />
        {/* Abdômen pesado */}
        <path d="M143 100 C120 102 95 101 75 96" />
        {/* Pata traseira esquerda */}
        <path d="M75 96 L73 115 C73 121 70 124 77 124 L88 124 C90 124 92 118 90 110 L94 92" />
        {/* Pata traseira direita */}
        <path d="M54 90 L52 121 L60 121 L64 94" strokeWidth="1.8" className="text-slate-500 dark:text-slate-400" />
        {/* Cauda */}
        <path d="M35 68 C28 75 27 88 29 95" />
        <path d="M29 95 C27 98 28 102 31 103 C32 100 31 97 29 95 Z" className="fill-slate-800 dark:fill-slate-200" />
        {/* Linha de chão */}
        <ellipse cx="115" cy="128" rx="85" ry="3.5" className="fill-slate-200/50 dark:fill-slate-800/40 stroke-none" />
      </g>
    </svg>
  );
}

// 6. Animal 3: Camelo / Dromedário (MoCA Official Camel Drawing)
export function MocaCamelIllustration({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800 dark:text-slate-200">
        {/* Cabeça e focinho com lábio superior característico */}
        <path d="M195 28 C202 26 208 28 206 34 C203 38 196 40 190 39 L176 45 C170 55 168 70 162 82" />
        {/* Olho e orelha pequena */}
        <ellipse cx="192" cy="33" rx="2" ry="1.5" className="fill-slate-800 dark:fill-slate-200" />
        <path d="M180 26 C182 20 186 21 185 27 Z" className="fill-slate-100 dark:fill-slate-800" />
        <path d="M205 32 C204 35 200 36 197 35" />
        {/* Longo pescoço em curva S */}
        <path d="M182 28 C176 34 165 48 155 58 C145 68 135 72 125 74" />
        {/* Peito */}
        <path d="M162 82 C158 87 150 90 145 88" />
        {/* Perna Dianteira Esquerda */}
        <path d="M145 88 L143 112 C143 118 141 125 147 125 L155 125 C156 125 155 116 156 110 L160 86" />
        {/* Perna Dianteira Direita */}
        <path d="M158 88 L160 122 L167 122 L168 90" strokeWidth="1.8" className="text-slate-500 dark:text-slate-400" />
        {/* Dorso com Corcova Única e Arredondada */}
        <path d="M125 74 C120 65 115 54 110 44 C102 30 88 18 78 22 C68 26 62 42 58 56 C52 66 42 70 36 76" />
        {/* Ventre */}
        <path d="M138 88 C120 95 100 95 85 90" />
        {/* Perna Traseira Esquerda */}
        <path d="M85 90 L82 110 C82 118 80 125 86 125 L94 125 C95 125 96 118 96 108 L100 88" />
        {/* Perna Traseira Direita */}
        <path d="M68 90 L68 122 L75 122 L78 94" strokeWidth="1.8" className="text-slate-500 dark:text-slate-400" />
        {/* Anca e cauda delgada com tufo */}
        <path d="M36 76 C32 82 32 94 34 100" />
        <path d="M34 100 C32 104 33 108 36 109 C37 106 36 102 34 100 Z" className="fill-slate-800 dark:fill-slate-200" />
        {/* Linha de chão */}
        <ellipse cx="115" cy="128" rx="80" ry="3.5" className="fill-slate-200/50 dark:fill-slate-800/40 stroke-none" />
      </g>
    </svg>
  );
}

interface MoCACognitiveScaleSectionProps {
  answers: Record<string, any>;
  onChange: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  scaleTitle?: string;
  scaleIndex?: number;
  patient?: any;
  onRemoveScale?: () => void;
  readOnly?: boolean;
}

export function MoCACognitiveScaleSection({
  answers,
  onChange,
  scaleTitle = 'Montreal Cognitive Assessment (MoCA)',
  scaleIndex,
  patient,
  onRemoveScale,
  readOnly = false,
}: MoCACognitiveScaleSectionProps) {
  // Fluency Timer (60s countdown for Letter "F")
  const [fluencyTimer, setFluencyTimer] = useState<number>(60);
  const [isFluencyRunning, setIsFluencyRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal para apresentação visual limpa ao paciente
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    subtitle?: string;
    illustration: React.ReactNode;
  } | null>(null);

  useEffect(() => {
    if (isFluencyRunning) {
      timerRef.current = setInterval(() => {
        setFluencyTimer((prev) => {
          if (prev <= 1) {
            setIsFluencyRunning(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFluencyRunning]);

  const handleStartFluencyTimer = () => {
    if (fluencyTimer === 0) setFluencyTimer(60);
    setIsFluencyRunning(!isFluencyRunning);
  };

  const handleResetFluencyTimer = () => {
    setIsFluencyRunning(false);
    setFluencyTimer(60);
  };

  const updateAnswerField = (fieldName: string, value: any) => {
    onChange((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const toggleCheckbox = (fieldName: string) => {
    const current = !!answers[fieldName];
    updateAnswerField(fieldName, !current);
  };

  // Escolaridade
  const educationYears =
    answers['moca_education_years'] !== undefined
      ? Number(answers['moca_education_years'])
      : answers['Anos de Escolaridade'] !== undefined
      ? Number(answers['Anos de Escolaridade'])
      : 12;

  // Real-time MoCA Calculation
  const mocaResult: MoCACalculationResult = useMemo(() => {
    return calculateMoCAScore(answers, educationYears);
  }, [answers, educationYears]);

  // Sync results to answers state for backend storage
  useEffect(() => {
    onChange((prev) => {
      const next = { ...prev };
      next['Escore Total MoCA'] = `${mocaResult.totalScore}/30 pontos`;
      next['moca_total_score'] = mocaResult.totalScore;
      next['Classificação Cognitiva MoCA'] = mocaResult.classification;
      next['moca_classification'] = mocaResult.classification;
      next['moca_raw_score'] = mocaResult.rawScore;
      next['moca_education_bonus'] = mocaResult.educationBonus;
      next['MoCA - Visuoespacial / Executiva'] = `${mocaResult.domains.visuospatialExecutive}/5 pts`;
      next['MoCA - Nomeação de Animais'] = `${mocaResult.domains.naming}/3 pts`;
      next['MoCA - Atenção e Concentração'] = `${mocaResult.domains.attention}/6 pts`;
      next['MoCA - Linguagem e Fluência'] = `${mocaResult.domains.language}/3 pts`;
      next['MoCA - Abstração (Semelhanças)'] = `${mocaResult.domains.abstraction}/2 pts`;
      next['MoCA - Evocação Tardia (Memória)'] = `${mocaResult.domains.delayedRecall}/5 pts`;
      next['MoCA - Orientação Têmporo-Espacial'] = `${mocaResult.domains.orientation}/6 pts`;
      next['MoCA - Escolaridade'] = `${educationYears} anos (${mocaResult.educationBonus > 0 ? '+1 pt bônus (≤ 12 anos)' : 'Sem bônus'})`;
      next['MoCA - Referência Científica'] =
        'Montreal Cognitive Assessment (MoCA) • Nasreddine ZS et al. (2005) • Adaptação Brasileira UNIFESP (Bertolucci et al.)';
      return next;
    });
  }, [mocaResult.totalScore, mocaResult.rawScore, mocaResult.educationBonus, educationYears]);

  const scoreProgress = (mocaResult.totalScore / 30) * 100;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xs space-y-4 sm:space-y-6">
      {/* HEADER DA ESCALA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Neurológica • Rastreio Cognitivo Global
            </span>
            <span className="text-xs text-slate-400 font-bold">Total: 30 Pontos</span>
          </div>
          <h4 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {scaleTitle}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Versão Brasileira (UNIFESP-SP) • Rastreio sensível para Comprometimento Cognitivo Leve (CCL) e Demências.
          </p>
        </div>

        {onRemoveScale && !readOnly && (
          <button
            type="button"
            onClick={onRemoveScale}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer self-end sm:self-auto"
          >
            Remover do laudo
          </button>
        )}
      </div>

      {/* ========================================================
          PAINEL DE PONTUAÇÃO AO VIVO E CORREÇÃO POR ESCOLARIDADE
         ======================================================== */}
      <div className="rounded-2xl sm:rounded-3xl bg-slate-950 text-white p-4 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative z-10">
          {/* Escore MoCA */}
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-600/30 shrink-0">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
                Pontuação Total Ajustada
              </span>
              <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-5xl font-black text-white font-mono">
                  {mocaResult.totalScore}
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-400">/ 30</span>
                {mocaResult.educationBonus > 0 && (
                  <span className="text-[11px] sm:text-xs font-bold text-amber-400 bg-amber-950/70 border border-amber-700/60 px-2 py-0.5 rounded-lg">
                    +1 pt escolaridade (≤ 12 anos)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seletor de Escolaridade */}
          <div className="bg-slate-900/90 p-2.5 sm:p-3 rounded-2xl border border-slate-800 flex items-center gap-2.5 sm:gap-3 w-full md:w-auto min-w-0 md:min-w-[260px]">
            <GraduationCap className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Escolaridade do Paciente
              </span>
              <CustomSelect
                value={educationYears}
                onChange={(val) => {
                  const num = parseInt(String(val), 10);
                  updateAnswerField('moca_education_years', num);
                  updateAnswerField('Anos de Escolaridade', num);
                }}
                options={[
                  { value: 8, label: '≤ 8 anos (Ensino Fundamental)' },
                  { value: 11, label: '11 anos (Ensino Médio)' },
                  { value: 12, label: '12 anos (Colegial completo) [+1 pt]' },
                  { value: 15, label: '13 a 15 anos (Superior incompleto)' },
                  { value: 16, label: '≥ 16 anos (Superior completo / Pós)' },
                ]}
                size="sm"
                triggerClassName="bg-slate-800 border-slate-700 text-white hover:bg-slate-750"
              />
            </div>
          </div>

          {/* Classificação Diagnóstica */}
          <div className="text-left md:text-right w-full md:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Estratificação Clínica
            </span>
            <span className={`inline-block text-xs font-black px-3 py-1.5 rounded-xl mt-1 ${mocaResult.badgeBg}`}>
              {mocaResult.classification}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Nota de corte de normalidade: ≥ 26 pontos
            </span>
          </div>
        </div>

        {/* Barra de Progresso Total */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
            <span>Escore Bruto: {mocaResult.rawScore} pts</span>
            <span>Ajustado: {mocaResult.totalScore} / 30 pts ({Math.round(scoreProgress)}%)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                mocaResult.totalScore >= 26
                  ? 'bg-emerald-500'
                  : mocaResult.totalScore >= 18
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${scoreProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          DOMÍNIOS DO MOCA (1 A 8)
         ======================================================== */}
      <div className="space-y-5">
        {/* DOMÍNIO 1: VISUOESPACIAL / EXECUTIVA (5 PTS) COM DESENHOS OFICIAIS */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                1
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Visuoespacial / Executiva
              </h5>
            </div>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.visuospatialExecutive} / 5 pts
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Trilha Alternada com Ilustração */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Trilha Alternada (1-A-2-B-3-C-4-D-5-E)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      title: 'Trilha Alternada (Trail Making Test)',
                      subtitle: 'Instrução ao paciente: "Ligue os círculos alternando números e letras em ordem ascendente (1 para A, A para 2, 2 para B, até o E) sem cruzar nenhuma linha."',
                      illustration: <MocaTrailIllustration className="w-full max-w-lg h-auto" />,
                    })
                  }
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 transition-all hover:shadow-xs"
                  title="Mostrar ao Paciente em tela cheia"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Mostrar ao Paciente</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center min-h-[145px]">
                <MocaTrailIllustration className="w-full max-w-[280px] h-auto" />
              </div>

              <MocaCheckbox
                checked={!!answers['moca_trail']}
                onChange={() => toggleCheckbox('moca_trail')}
                label="Trilha Alternada (1 ponto)"
                sublabel="Ligou alternando números e letras em ordem ascendente (1-A-2-B-3-C-4-D-5-E) sem cruzar linhas."
              />
            </div>

            {/* Cópia do Cubo com Ilustração */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Cópia do Cubo Tridimensional
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      title: 'Cópia do Cubo Tridimensional',
                      subtitle: 'Instrução ao paciente: "Copie este desenho o mais exatamente possível na folha". Pontue 1 se o desenho for tridimensional, todas as 12 linhas estiverem presentes e as faces opostas forem paralelas.',
                      illustration: <MocaCubeIllustration className="w-full max-w-xs h-auto" />,
                    })
                  }
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 transition-all hover:shadow-xs"
                  title="Mostrar ao Paciente em tela cheia"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Mostrar ao Paciente</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center min-h-[145px]">
                <MocaCubeIllustration className="w-full max-w-[150px] h-auto" />
              </div>

              <MocaCheckbox
                checked={!!answers['moca_cube']}
                onChange={() => toggleCheckbox('moca_cube')}
                label="Cópia do Cubo (1 ponto)"
                sublabel="Desenho tridimensional correto com todas as 12 linhas presentes e faces paralelas."
              />
            </div>
          </div>

          {/* Desenho do Relógio (3 pontos: Contorno, Números, Ponteiros em 11:10) */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Desenho do Relógio (Onze horas e dez minutos • 11:10)
                </span>
                <span className="text-[11px] text-slate-400">Instrução: Desenhe um relógio com todos os números e ponteiros marcando 11:10.</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-400">Total: 3 pontos</span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      title: 'Gabarito Clínico do Relógio (11:10)',
                      subtitle: 'Critérios de pontuação: 1. Contorno circular íntegro; 2. Todos os 12 números presentes e na ordem correta; 3. Dois ponteiros marcando 11:10 (ponteiro curto no 11 e longo no 2).',
                      illustration: <MocaClockIllustration className="w-full max-w-xs h-auto" />,
                    })
                  }
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 cursor-pointer bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-200/60 dark:border-purple-800/60"
                  title="Ver gabarito anatômico do relógio"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Gabarito</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center pt-1">
              <div className="hidden md:flex bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800 items-center justify-center h-full">
                <MocaClockIllustration className="w-24 h-24" />
              </div>

              <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MocaCheckbox
                  checked={!!answers['moca_clock_contour']}
                  onChange={() => toggleCheckbox('moca_clock_contour')}
                  label="Contorno circular"
                  sublabel="Forma circular com mínima deformação"
                  extra={<span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">1 pt</span>}
                  compact
                />
                <MocaCheckbox
                  checked={!!answers['moca_clock_numbers']}
                  onChange={() => toggleCheckbox('moca_clock_numbers')}
                  label="Números 1 a 12"
                  sublabel="Todos os 12 números na ordem correta"
                  extra={<span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">1 pt</span>}
                  compact
                />
                <MocaCheckbox
                  checked={!!answers['moca_clock_hands']}
                  onChange={() => toggleCheckbox('moca_clock_hands')}
                  label="Ponteiros em 11:10"
                  sublabel="Horas no 11 (curto) e minutos no 2 (longo)"
                  extra={<span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">1 pt</span>}
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        {/* DOMÍNIO 2: NOMEAÇÃO (3 PTS) COM DESENHOS DOS 3 ANIMAIS */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                2
              </span>
              <div>
                <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Nomeação de Animais
                </h5>
                <span className="text-[11px] text-slate-400">Instrução: Aponte cada animal da esquerda para a direita e pergunte: "Diga-me o nome deste animal".</span>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.naming} / 3 pts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Leão */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">1º Animal</span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      title: 'Identificação de Animal 1',
                      subtitle: 'Instrução: "Diga-me o nome deste animal". Resposta esperada e pontuada: Leão.',
                      illustration: <MocaLionIllustration className="w-full max-w-md h-auto" />,
                    })
                  }
                  className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-emerald-200/70 transition-colors"
                  title="Mostrar ao Paciente"
                >
                  <Eye className="w-3 h-3" />
                  <span>Mostrar</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center min-h-[110px]">
                <MocaLionIllustration className="w-full h-24 object-contain" />
              </div>

              <MocaCheckbox
                checked={!!answers['moca_lion']}
                onChange={() => toggleCheckbox('moca_lion')}
                label="1. Leão"
                sublabel="Nomeou corretamente (1 pt)"
              />
            </div>

            {/* 2. Rinoceronte */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">2º Animal</span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      title: 'Identificação de Animal 2',
                      subtitle: 'Instrução: "Diga-me o nome deste animal". Resposta esperada e pontuada: Rinoceronte.',
                      illustration: <MocaRhinoIllustration className="w-full max-w-md h-auto" />,
                    })
                  }
                  className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-emerald-200/70 transition-colors"
                  title="Mostrar ao Paciente"
                >
                  <Eye className="w-3 h-3" />
                  <span>Mostrar</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center min-h-[110px]">
                <MocaRhinoIllustration className="w-full h-24 object-contain" />
              </div>

              <MocaCheckbox
                checked={!!answers['moca_rhino']}
                onChange={() => toggleCheckbox('moca_rhino')}
                label="2. Rinoceronte"
                sublabel="Nomeou corretamente (1 pt)"
              />
            </div>

            {/* 3. Camelo / Dromedário */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">3º Animal</span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModal({
                      title: 'Identificação de Animal 3',
                      subtitle: 'Instrução: "Diga-me o nome deste animal". Respostas aceitas e pontuadas: Camelo ou Dromedário.',
                      illustration: <MocaCamelIllustration className="w-full max-w-md h-auto" />,
                    })
                  }
                  className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-emerald-200/70 transition-colors"
                  title="Mostrar ao Paciente"
                >
                  <Eye className="w-3 h-3" />
                  <span>Mostrar</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center min-h-[110px]">
                <MocaCamelIllustration className="w-full h-24 object-contain" />
              </div>

              <MocaCheckbox
                checked={!!answers['moca_camel']}
                onChange={() => toggleCheckbox('moca_camel')}
                label="3. Camelo / Dromedário"
                sublabel="Aceita Camelo ou Dromedário (1 pt)"
              />
            </div>
          </div>
        </div>

        {/* DOMÍNIO 3: MEMÓRIA (REGISTRO / APRENDIZAGEM - SEM PONTOS IMEDIATOS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                3
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Memória (Registro e Aprendizagem)
              </h5>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Sem pontuação imediata</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800 text-xs space-y-2">
            <p className="font-semibold text-amber-900 dark:text-amber-300">
              Leia a lista de palavras (1 por segundo). O paciente deve repeti-las. Faça 2 tentativas para fixação.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs font-black">
              {['Rosto', 'Veludo', 'Igreja', 'Margarida', 'Vermelho'].map((w) => (
                <span key={w} className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white shadow-xs">
                  {w}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1">
              * A evocação com pontuação (5 pontos) será realizada após aproximadamente 5 minutos na Seção 7.
            </p>
          </div>
        </div>

        {/* DOMÍNIO 4: ATENÇÃO (6 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                4
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Atenção e Concentração
              </h5>
            </div>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.attention} / 6 pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Dígitos Direta */}
            <MocaCheckbox
              checked={!!answers['moca_digits_forward']}
              onChange={() => toggleCheckbox('moca_digits_forward')}
              label="Ordem Direta (1 pt)"
              sublabel={
                <>
                  <span className="font-mono text-purple-600 dark:text-purple-400 block mt-0.5 font-extrabold">
                    2 - 1 - 8 - 5 - 4
                  </span>
                  <span className="text-[10px] text-slate-400">Repetiu corretamente</span>
                </>
              }
            />

            {/* Dígitos Inversa */}
            <MocaCheckbox
              checked={!!answers['moca_digits_backward']}
              onChange={() => toggleCheckbox('moca_digits_backward')}
              label="Ordem Inversa (1 pt)"
              sublabel={
                <>
                  <span className="font-mono text-purple-600 dark:text-purple-400 block mt-0.5 font-extrabold">
                    7 - 4 - 2 → (2 - 4 - 7)
                  </span>
                  <span className="text-[10px] text-slate-400">Repetiu invertido</span>
                </>
              }
            />

            {/* Vigilância Letra A */}
            <MocaCheckbox
              checked={!!answers['moca_vigilance_a']}
              onChange={() => toggleCheckbox('moca_vigilance_a')}
              label="Vigilância - Letra A (1 pt)"
              sublabel={
                <>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 font-mono">
                    F B <strong>A</strong> C M N <strong>A</strong> <strong>A</strong> J K L B <strong>A</strong> F <strong>A</strong> K D E <strong>A</strong> <strong>A</strong> <strong>A</strong> J <strong>A</strong> M O F <strong>A</strong> <strong>A</strong> B
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">Acertou (≤ 1 erro)</span>
                </>
              }
            />
          </div>

          {/* Subtração Seriada de 7 (3 pontos) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Subtração Seriada de 7 (Partindo de 100)
              </span>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                4-5 acertos: 3 pts • 2-3 acertos: 2 pts • 1 acerto: 1 pt
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'moca_sub_93', label: '93 (100 - 7)' },
                { key: 'moca_sub_86', label: '86 (93 - 7)' },
                { key: 'moca_sub_79', label: '79 (86 - 7)' },
                { key: 'moca_sub_72', label: '72 (79 - 7)' },
                { key: 'moca_sub_65', label: '65 (72 - 7)' },
              ].map((sub) => {
                const isChecked = !!answers[sub.key];
                return (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() => toggleCheckbox(sub.key)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                        isChecked ? 'bg-white text-purple-600 border-white' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* DOMÍNIO 5: LINGUAGEM (3 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center font-black text-xs">
                5
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Linguagem e Fluência Verbal
              </h5>
            </div>
            <span className="text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.language} / 3 pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MocaCheckbox
              checked={!!answers['moca_sentence_1']}
              onChange={() => toggleCheckbox('moca_sentence_1')}
              label="Repetição de Frase 1 (1 ponto)"
              sublabel={
                <>
                  <p className="text-slate-600 dark:text-slate-300 italic mt-0.5">
                    &ldquo;Eu somente sei que é João quem será ajudado hoje.&rdquo;
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">Repetição exata sem erros</span>
                </>
              }
            />

            <MocaCheckbox
              checked={!!answers['moca_sentence_2']}
              onChange={() => toggleCheckbox('moca_sentence_2')}
              label="Repetição de Frase 2 (1 ponto)"
              sublabel={
                <>
                  <p className="text-slate-600 dark:text-slate-300 italic mt-0.5">
                    &ldquo;O gato sempre se esconde embaixo do sofá quando o cachorro está na sala.&rdquo;
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-1">Repetição exata sem erros</span>
                </>
              }
            />
          </div>

          {/* Fluência Verbal Fonêmica (Letra F em 1 min) */}
          <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-300 block">
                  Fluência Verbal Fonêmica: Letra &ldquo;F&rdquo; (1 Minuto)
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Dizer o maior número possível de palavras que comecem com a letra <strong>F</strong> em 60s (critério de pontuação: <strong>≥ 11 palavras</strong>).
                </p>
              </div>

              {/* Cronômetro Rápido da Fluência */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 text-white font-mono font-black text-sm px-3 py-1.5 rounded-xl border border-slate-700">
                  00:{String(fluencyTimer).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={handleStartFluencyTimer}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  {isFluencyRunning ? 'Pausar' : fluencyTimer === 0 ? 'Reiniciar' : 'Disparar 60s'}
                </button>
                <button
                  type="button"
                  onClick={handleResetFluencyTimer}
                  className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                  title="Zerar para 60s"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => toggleCheckbox('moca_fluency_f')}
                className={`group flex items-center space-x-2.5 p-2.5 px-3 rounded-xl border transition-all cursor-pointer text-left ${
                  answers['moca_fluency_f']
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-teal-200/80 dark:border-teal-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                    answers['moca_fluency_f']
                      ? 'bg-white text-teal-700 border-white'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 group-hover:border-teal-500'
                  }`}
                >
                  {answers['moca_fluency_f'] && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs font-bold">
                  Atingiu ≥ 11 palavras válidas com a letra &ldquo;F&rdquo; (1 ponto)
                </span>
              </button>

              <div className="flex items-center gap-1.5 sm:ml-auto">
                <span className="text-[11px] font-bold text-slate-500">Palavras ditas:</span>
                <input
                  type="number"
                  placeholder="Ex: 14"
                  value={answers['moca_fluency_count'] || ''}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 0;
                    updateAnswerField('moca_fluency_count', count);
                    if (count >= 11) updateAnswerField('moca_fluency_f', true);
                  }}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DOMÍNIO 6: ABSTRAÇÃO (2 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center font-black text-xs">
                6
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Abstração (Semelhanças)
              </h5>
            </div>
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.abstraction} / 2 pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MocaCheckbox
              checked={!!answers['moca_abs_transport']}
              onChange={() => toggleCheckbox('moca_abs_transport')}
              label="Trem — Bicicleta (1 ponto)"
              sublabel="Resposta aceita: Meios de transporte / veículos / servem para viajar."
            />

            <MocaCheckbox
              checked={!!answers['moca_abs_measure']}
              onChange={() => toggleCheckbox('moca_abs_measure')}
              label="Relógio — Régua (1 ponto)"
              sublabel="Resposta aceita: Instrumentos de medição / medem grandezas (tempo e comprimento)."
            />
          </div>
        </div>

        {/* DOMÍNIO 7: EVOCAÇÃO TARDIA (5 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 flex items-center justify-center font-black text-xs">
                7
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Evocação Tardia (Memória Retentiva - 5 Pontos)
              </h5>
            </div>
            <span className="text-xs font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.delayedRecall} / 5 pts
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pontue <strong>1 ponto apenas para palavras lembradas espontaneamente SEM PISTAS</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'moca_recall_face', label: 'Rosto', category: 'Parte do corpo' },
              { key: 'moca_recall_velvet', label: 'Veludo', category: 'Tipo de tecido' },
              { key: 'moca_recall_church', label: 'Igreja', category: 'Edifício / Construção' },
              { key: 'moca_recall_daisy', label: 'Margarida', category: 'Tipo de flor' },
              { key: 'moca_recall_red', label: 'Vermelho', category: 'Uma cor' },
            ].map((w) => (
              <MocaTileCheckbox
                key={w.key}
                checked={!!answers[w.key]}
                onChange={() => toggleCheckbox(w.key)}
                label={w.label}
                category={w.category}
              />
            ))}
          </div>
        </div>

        {/* DOMÍNIO 8: ORIENTAÇÃO (6 PTS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 flex items-center justify-center font-black text-xs">
                8
              </span>
              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Orientação Têmporo-Espacial
              </h5>
            </div>
            <span className="text-xs font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2.5 py-1 rounded-xl">
              {mocaResult.domains.orientation} / 6 pts
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { key: 'moca_orient_day', label: 'Dia do Mês' },
              { key: 'moca_orient_month', label: 'Mês' },
              { key: 'moca_orient_year', label: 'Ano' },
              { key: 'moca_orient_weekday', label: 'Dia da Semana' },
              { key: 'moca_orient_place', label: 'Lugar' },
              { key: 'moca_orient_city', label: 'Cidade' },
            ].map((item) => (
              <MocaOrientationTile
                key={item.key}
                checked={!!answers[item.key]}
                onChange={() => toggleCheckbox(item.key)}
                label={item.label}
              />
            ))}
          </div>
        </div>

        {/* OBSERVAÇÕES E NOTAS COGNITIVAS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
            Observações Clínicas e Comportamentais Durante a Aplicação
          </label>
          <textarea
            rows={2}
            value={answers['moca_observations'] || answers['Observações Cognitivas / Comportamentais'] || ''}
            onChange={(e) => {
              updateAnswerField('moca_observations', e.target.value);
              updateAnswerField('Observações Cognitivas / Comportamentais', e.target.value);
            }}
            placeholder="Anote nível de cooperação, queixas de esquecimento relatadas por familiares, ansiedade frente aos testes ou flutuações atencionais..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* ========================================================
          REFERÊNCIA OFICIAL DO MOCA
         ======================================================== */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
          <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="font-black uppercase tracking-wider text-[11px] text-purple-900 dark:text-purple-300">
            Referência Científica e Validação Brasileira:
          </span>
        </div>
        <div className="pl-6 border-l-2 border-purple-500/70 space-y-1">
          <p className="font-black text-xs text-slate-900 dark:text-slate-100">
            Montreal Cognitive Assessment (MoCA) • Versão Experimental Brasileira
          </p>
          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
            Nasreddine ZS, Phillips NA, Bédirian V, et al. <em>The Montreal Cognitive Assessment, MoCA: a brief screening tool for mild cognitive impairment</em>. J Am Geriatr Soc. 2005.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Adaptação e normatização brasileira: <strong>Ana Luisa Rosas Sarmento, Paulo Henrique Ferreira Bertolucci, José Roberto Wajman (UNIFESP-SP, 2007)</strong>. Website oficial: <em>www.mocatest.org</em>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
            Critério normativo: Pontuação máxima de 30 pontos. Nota de corte recomendada: ≥ 26 pontos para cognição normal. Pontuações de 18 a 25 sugerem Comprometimento Cognitivo Leve (CCL). Adiciona-se 1 ponto para indivíduos com 12 anos ou menos de escolaridade formal.
          </p>
        </div>
      </div>

      {/* ========================================================
          MODAL DE ESTÍMULO VISUAL PARA O PACIENTE (TELA CHEIA)
         ======================================================== */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                  Estímulo Visual Oficial • MoCA
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {previewModal.title}
                </h4>
                {previewModal.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {previewModal.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 sm:p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
              {previewModal.illustration}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 italic">
                Apresente esta imagem diretamente para o paciente responder ou copiar.
              </span>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Fechar Estímulo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
