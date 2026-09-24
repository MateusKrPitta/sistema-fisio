'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Link2,
  MessageSquare,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Camera,
  Eye,
  Save,
  Loader2,
  Check,
} from 'lucide-react';
import { CustomField, CLINICAL_PRESETS, ClinicalPreset } from '@/lib/clinical-presets';
import { ImageLightbox } from '@/components/image-lightbox';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-context';
import { FieldRenderer } from './field-renderer';

export interface ScaleGroup {
  id: string | number;
  title: string;
  category?: string;
  fields: any[];
}

interface EvaluationHistoryListProps {
  formRecords: any[];
  patient: any;
  isAdmin: boolean;
  expandedRecordIds: number[];
  onToggleExpand: (id: number) => void;
  onStartEdit: (record: any, scale?: ScaleGroup) => void;
  onRequestDelete: (record: any) => void;
  onRecordUpdated?: (recordId: number, updatedAnswers: any) => void;
}

export const formatDateSafe = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    const clean = String(dateString).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};

export const formatDateTimeSafe = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const getAnswerForField = (field: CustomField | any, answersMap: Record<string, any>, index?: number) => {
  if (!answersMap || typeof answersMap !== 'object') return undefined;

  // 1. Direct ID match
  if (field.id !== undefined && field.id !== null) {
    if (answersMap[field.id] !== undefined && answersMap[field.id] !== null && answersMap[field.id] !== '') {
      return answersMap[field.id];
    }
    const strId = String(field.id);
    if (answersMap[strId] !== undefined && answersMap[strId] !== null && answersMap[strId] !== '') {
      return answersMap[strId];
    }
  }

  // 2. Direct label match
  if (field.label) {
    if (answersMap[field.label] !== undefined && answersMap[field.label] !== null && answersMap[field.label] !== '') {
      return answersMap[field.label];
    }
    const strLabel = String(field.label);
    if (answersMap[strLabel] !== undefined && answersMap[strLabel] !== null && answersMap[strLabel] !== '') {
      return answersMap[strLabel];
    }

    // 3. Case-insensitive exact label match
    const targetLabelLower = strLabel.trim().toLowerCase();
    const foundKey = Object.keys(answersMap).find(
      (k) => k.trim().toLowerCase() === targetLabelLower
    );
    if (foundKey && answersMap[foundKey] !== undefined && answersMap[foundKey] !== null && answersMap[foundKey] !== '') {
      return answersMap[foundKey];
    }
  }

  return undefined;
};

export const parseAnswers = (rawAnswers: any): Record<string, any> => {
  if (!rawAnswers) return {};
  if (typeof rawAnswers === 'object') return rawAnswers;
  try {
    return JSON.parse(rawAnswers);
  } catch {
    return {};
  }
};

export const detectScaleForField = (field: any): { scaleTitle: string; category: string } => {
  if (field.group && typeof field.group === 'string' && field.group.trim().length > 0) {
    const g = field.group.trim();
    for (const [cat, presets] of Object.entries(CLINICAL_PRESETS)) {
      if ((presets as ClinicalPreset[]).some((p) => p.label === g || p.title === g)) {
        return { scaleTitle: g, category: cat };
      }
    }
    return { scaleTitle: g, category: 'Avaliação Clínica' };
  }

  const label = (field.label || '').toLowerCase();

  // 1. NEUROLÓGICA
  if (
    label.includes('abertura ocular') ||
    label.includes('resposta verbal') ||
    label.includes('resposta motora') ||
    label.includes('glasgow') ||
    label.includes('ocular') ||
    label.includes('verbal')
  ) {
    return { scaleTitle: 'Escala de Coma de Glasgow', category: 'Neurológica' };
  }

  if (
    label.includes('espasticidade') ||
    label.includes('ashworth') ||
    label.includes('segmento avaliado') ||
    label.includes('membro avaliado')
  ) {
    return { scaleTitle: 'Escala de Ashworth Modificada', category: 'Neurológica' };
  }

  if (
    label.includes('rolar para o lado') ||
    label.includes('sentar-se a partir de deitado') ||
    label.includes('equilíbrio na posição sentada') ||
    label.includes('equilibrio na posicao sentada') ||
    label.includes('tct')
  ) {
    return { scaleTitle: 'Módulo do Controle de Tronco (TCT)', category: 'Neurológica' };
  }

  // 2. CARDIORRESPIRATÓRIA
  if (
    label.includes('mmrc') ||
    (label.includes('dispneia') && (label.includes('grau 0') || label.includes('grau 1') || label.includes('mrc')))
  ) {
    return { scaleTitle: 'Escala de Dispneia - mMRC', category: 'Cardiorrespiratória' };
  }

  if (label.includes('nyha') || label.includes('classe funcional') || label.includes('insuficiência cardíaca')) {
    return { scaleTitle: 'Classificação Funcional - NYHA', category: 'Cardiorrespiratória' };
  }

  if (
    label.includes('pimáx') ||
    label.includes('pimax') ||
    label.includes('pemáx') ||
    label.includes('pemax') ||
    label.includes('manovacuometria')
  ) {
    return { scaleTitle: 'Manovacuometria (PImáx/PEmáx)', category: 'Cardiorrespiratória' };
  }

  if (
    label.includes('peak flow') ||
    label.includes('pfe') ||
    label.includes('pft') ||
    label.includes('fluxo de tosse') ||
    label.includes('pico de fluxo')
  ) {
    return { scaleTitle: 'Peak Flow (PFE) e Pico de Fluxo de Tosse (PFT)', category: 'Cardiorrespiratória' };
  }

  if (
    label.includes('spo2') ||
    label.includes('fc basal') ||
    label.includes('tc6') ||
    label.includes('caminhada de 6') ||
    label.includes('distância total percorrida') ||
    label.includes('distancia total percorrida')
  ) {
    return { scaleTitle: 'Teste TC6 (6 Minutos)', category: 'Cardiorrespiratória' };
  }

  // 3. EQUILÍBRIO
  if (
    label.includes('tempo de execução (tug)') ||
    label.includes('tempo de execucao') ||
    label.includes('risco de quedas') ||
    label.includes('dispositivo de marcha') ||
    label.includes('utilização de o2') ||
    label.includes('utilizacao de o2') ||
    label.includes('quantidade de o2') ||
    label.includes('tug')
  ) {
    return { scaleTitle: 'Teste TUG (Timed Up and Go)', category: 'Equilíbrio' };
  }

  if (
    label.includes('berg') ||
    label.includes('apoio unipodal') ||
    label.includes('olhos fechados') ||
    label.includes('degrau') ||
    label.includes('tandem') ||
    /^\d+\.\s*(posição|permanecer|transfer|alcançar|pegar|virar|girar|posicionar)/i.test(label)
  ) {
    return { scaleTitle: 'Escala de Berg (BBS)', category: 'Equilíbrio' };
  }

  // 4. QUALIDADE DE VIDA E AUTONOMIA
  if (
    label.includes('higiene') ||
    label.includes('banho') ||
    label.includes('alimentação') ||
    label.includes('alimentacao') ||
    label.includes('toalete') ||
    label.includes('vaso sanitário') ||
    label.includes('vaso sanitario') ||
    label.includes('escadas') ||
    label.includes('vestuário') ||
    label.includes('vestuario') ||
    label.includes('esfincteriano') ||
    label.includes('bexiga') ||
    label.includes('intestino') ||
    label.includes('deambulação') ||
    label.includes('deambulacao') ||
    label.includes('transferências') ||
    label.includes('transferencias') ||
    label.includes('barthel')
  ) {
    return { scaleTitle: 'Índice de Barthel', category: 'Qualidade de Vida e Autonomia' };
  }

  if (
    label.includes('sf-36') ||
    label.includes('sf36') ||
    label.includes('saúde é') ||
    label.includes('há um ano atrás') ||
    label.includes('atividades rigorosas')
  ) {
    return { scaleTitle: 'Qualidade de Vida (SF-36)', category: 'Qualidade de Vida e Autonomia' };
  }

  if (
    label.includes('psqi') ||
    label.includes('sono') ||
    label.includes('deitar') ||
    label.includes('adormecer') ||
    label.includes('acordou no meio')
  ) {
    return { scaleTitle: 'Qualidade do Sono (PSQI)', category: 'Qualidade de Vida e Autonomia' };
  }

  // 5. DOR
  if (
    label.includes('body map') ||
    label.includes('regiões anatômicas') ||
    label.includes('característica da dor') ||
    label.includes('irradiação da dor') ||
    label.includes('fatores de piora')
  ) {
    return { scaleTitle: 'Pontos e Mapeamento de Dor (Body Map)', category: 'Dor' };
  }

  if (
    label.includes('eva') ||
    label.includes('intensidade da dor') ||
    label.includes('local principal da dor') ||
    label.includes('frequência / pior')
  ) {
    return { scaleTitle: 'Escala Visual Analógica (EVA)', category: 'Dor' };
  }

  // 6. FORÇA MUSCULAR
  if (
    label.includes('flexão do braço') ||
    label.includes('extensão do braço') ||
    label.includes('abdução de ombro') ||
    label.includes('iliopsoas') ||
    label.includes('isquiotibiais') ||
    label.includes('quadríceps') ||
    label.includes('músculo específico') ||
    label.includes('musculo especifico') ||
    label.includes('força muscular') ||
    label.includes('mrc')
  ) {
    return { scaleTitle: 'Escala de Força Muscular (MRC)', category: 'Força Muscular' };
  }

  // 7. POSTURAL
  if (
    label.includes('desvios posturais') ||
    label.includes('conduta postural') ||
    label.includes('triângulo de tales') ||
    label.includes('triangulo de tales') ||
    label.includes('postural')
  ) {
    return { scaleTitle: 'Avaliação Postural Global', category: 'Postural' };
  }

  // 8. COMPOSIÇÃO CORPORAL / BIOIMPEDÂNCIA
  if (
    label.includes('bioimpedância') ||
    label.includes('bioimpedancia') ||
    label.includes('gordura corporal') ||
    label.includes('massa muscular') ||
    label.includes('água corporal') ||
    label.includes('gordura visceral') ||
    label.includes('taxa metabólica') ||
    label.includes('idade metabólica') ||
    label.includes('imc')
  ) {
    return { scaleTitle: 'Avaliação por Bioimpedância', category: 'Composição Corporal / Bioimpedância' };
  }

  if (
    label.includes('foto anterior') ||
    label.includes('foto posterior') ||
    label.includes('foto lateral') ||
    label.includes('registro fotográfico') ||
    label.includes('fotografico')
  ) {
    return {
      scaleTitle: 'Registro Fotográfico (Fotos Anterior, Posterior e Laterais)',
      category: 'Composição Corporal / Bioimpedância',
    };
  }

  // 9. GONIOMETRIA
  if (
    label.includes('flexão') ||
    label.includes('extensão') ||
    label.includes('abdução') ||
    label.includes('adução') ||
    label.includes('pronação') ||
    label.includes('supinação') ||
    label.includes('goniometria')
  ) {
    return { scaleTitle: 'Goniometria Articular', category: 'Goniometria' };
  }

  return { scaleTitle: 'Avaliação Geral', category: 'Geral' };
};

export const extractScaleGroups = (template: any): ScaleGroup[] => {
  if (!template) return [];
  const scaleGroups: ScaleGroup[] = [];
  const rawModules =
    template.modules && Array.isArray(template.modules) && template.modules.length > 0 ? template.modules : [template];

  if (rawModules.length > 1) {
    rawModules.forEach((mod: any, mIdx: number) => {
      const rawFields = mod.fields || [];
      if (!Array.isArray(rawFields) || rawFields.length === 0) return;
      const parsedFields = rawFields.map((f: any) => {
        let parsedOpts = f.options;
        if (typeof parsedOpts === 'string') {
          try {
            parsedOpts = JSON.parse(parsedOpts);
          } catch {
            parsedOpts = [];
          }
        }
        return { ...f, options: parsedOpts || [] };
      });

      scaleGroups.push({
        id: mod.id || mIdx,
        title: mod.name || template.title || 'Escala Clínica',
        category: mod.category || template.category || 'Avaliação Clínica',
        fields: parsedFields,
      });
    });
    return scaleGroups;
  }

  const singleMod = rawModules[0] || template;
  const rawFields = singleMod.fields || template.fields || [];
  if (!Array.isArray(rawFields) || rawFields.length === 0) return [];

  const parsedFields = rawFields.map((f: any) => {
    let parsedOpts = f.options;
    if (typeof parsedOpts === 'string') {
      try {
        parsedOpts = JSON.parse(parsedOpts);
      } catch {
        parsedOpts = [];
      }
    }
    return { ...f, options: parsedOpts || [] };
  });

  const groupedMap: Map<string, { category: string; fields: any[] }> = new Map();

  parsedFields.forEach((field: any) => {
    const { scaleTitle, category } = detectScaleForField(field);
    if (!groupedMap.has(scaleTitle)) {
      groupedMap.set(scaleTitle, { category, fields: [] });
    }
    groupedMap.get(scaleTitle)!.fields.push(field);
  });

  if (groupedMap.size === 1 && groupedMap.has('Avaliação Geral')) {
    scaleGroups.push({
      id: singleMod.id || 0,
      title: singleMod.name || template.title || 'Escala Clínica',
      category: singleMod.category || template.category || 'Avaliação Clínica',
      fields: parsedFields,
    });
  } else {
    let gIdx = 0;
    groupedMap.forEach((info, scaleTitle) => {
      scaleGroups.push({
        id: `${singleMod.id || 0}_${gIdx++}`,
        title: scaleTitle,
        category: info.category,
        fields: info.fields,
      });
    });
  }

  return scaleGroups;
};

export interface ScaleBadge {
  label: string;
  score: string;
  badgeClass: string;
}

export const calculateScaleBadge = (
  scale: ScaleGroup,
  recAnswers: Record<string, any>
): ScaleBadge | null => {
  const scaleTitle = (scale.title || '').toLowerCase();
  const fields = scale.fields || [];

  const getAnswerPoints = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = String(val).trim();
    const match = str.match(/^(\d+(\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  };

  // 1. Glasgow (3 a 15 pts)
  if (
    scaleTitle.includes('glasgow') ||
    fields.some((f) => {
      const l = (f.label || '').toLowerCase();
      return l.includes('ocular') || l.includes('verbal') || l.includes('motora');
    })
  ) {
    let total = 0;
    let answered = 0;
    fields.forEach((f, idx) => {
      const ans = getAnswerForField(f, recAnswers, idx);
      if (ans !== undefined && ans !== null && ans !== '') {
        const pts = getAnswerPoints(ans);
        if (pts > 0) {
          total += pts;
          answered++;
        }
      }
    });
    if (answered > 0) {
      return {
        label: 'GLASGOW',
        score: `${total} / 15 pts`,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    }
  }

  // 2. Barthel (0 a 100 pts)
  if (
    scaleTitle.includes('barthel') ||
    fields.some((f) => {
      const l = (f.label || '').toLowerCase();
      return l.includes('higiene') || l.includes('banho') || l.includes('deambulação') || l.includes('transferências');
    })
  ) {
    let total = 0;
    let answered = 0;
    fields.forEach((f, idx) => {
      const ans = getAnswerForField(f, recAnswers, idx);
      if (ans !== undefined && ans !== null && ans !== '') {
        total += getAnswerPoints(ans);
        answered++;
      }
    });
    if (answered > 0) {
      return {
        label: 'BARTHEL',
        score: `${total} / 100 pts`,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    }
  }

  // 3. Tronco TCT (0 a 100 pts)
  if (
    scaleTitle.includes('tronco') ||
    scaleTitle.includes('tct') ||
    fields.some((f) => (f.label || '').toLowerCase().includes('rolar para o lado'))
  ) {
    let total = 0;
    let answered = 0;
    fields.forEach((f, idx) => {
      const ans = getAnswerForField(f, recAnswers, idx);
      if (ans !== undefined && ans !== null && ans !== '') {
        const str = String(ans).trim();
        if (str.startsWith('25')) total += 25;
        else if (str.startsWith('12')) total += 12;
        else if (str.startsWith('0')) total += 0;
        else total += getAnswerPoints(ans);
        answered++;
      }
    });
    if (answered > 0) {
      return {
        label: 'TRONCO TCT',
        score: `${total} / 100 pts`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
  }

  // 4. Berg (0 a 56 pts)
  if (
    scaleTitle.includes('berg') ||
    fields.some((f) => (f.label || '').toLowerCase().includes('permanecer em pé sem apoio'))
  ) {
    let total = 0;
    let answered = 0;
    fields.forEach((f, idx) => {
      const ans = getAnswerForField(f, recAnswers, idx);
      if (ans !== undefined && ans !== null && ans !== '') {
        total += getAnswerPoints(ans);
        answered++;
      }
    });
    if (answered > 0) {
      return {
        label: 'BERG',
        score: `${total} / 56 pts`,
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      };
    }
  }

  // 5. Ashworth (Espasticidade)
  if (
    scaleTitle.includes('ashworth') ||
    scaleTitle.includes('espasticidade') ||
    fields.some((f) => (f.label || '').toLowerCase().includes('espasticidade'))
  ) {
    const grauField = fields.find((f) => {
      const l = (f.label || '').toLowerCase();
      return l.includes('grau') || l.includes('espasticidade');
    });
    if (grauField) {
      const ans = getAnswerForField(grauField, recAnswers);
      if (ans !== undefined && ans !== null && ans !== '') {
        const grauStr = String(ans).split(' - ')[0].replace(/^grau\s*/i, '').trim();
        return {
          label: 'ASHWORTH',
          score: `Grau ${grauStr}`,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      }
    }
  }

  // 6. TUG (Tempo de execução)
  if (
    scaleTitle.includes('tug') ||
    scaleTitle.includes('timed up') ||
    fields.some((f) => (f.label || '').toLowerCase().includes('tempo de execução'))
  ) {
    const timeField = fields.find((f) => {
      const l = (f.label || '').toLowerCase();
      return l.includes('tempo de execução') || l.includes('tempo de execucao') || l.includes('tug');
    });
    if (timeField) {
      const ans = getAnswerForField(timeField, recAnswers);
      if (ans !== undefined && ans !== null && ans !== '') {
        const num = parseFloat(String(ans).replace(',', '.'));
        if (!isNaN(num)) {
          return {
            label: 'TUG',
            score: `${num} seg`,
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          };
        }
      }
    }
  }

  // 7. EVA (0 a 10)
  if (
    scaleTitle.includes('eva') ||
    scaleTitle.includes('escala visual') ||
    fields.some((f) => (f.label || '').toLowerCase().includes('eva') || (f.label || '').toLowerCase().includes('intensidade da dor'))
  ) {
    const evaField = fields.find((f) => {
      const l = (f.label || '').toLowerCase();
      return l.includes('intensidade da dor') || l.includes('eva') || l.includes('dor');
    });
    if (evaField) {
      const ans = getAnswerForField(evaField, recAnswers);
      if (ans !== undefined && ans !== null && ans !== '') {
        const num = parseFloat(String(ans).replace(',', '.'));
        if (!isNaN(num)) {
          return {
            label: 'EVA',
            score: `${num} / 10`,
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          };
        }
      }
    }
  }

  // 8. mMRC (0 a 4)
  if (scaleTitle.includes('mmrc') || scaleTitle.includes('dispneia')) {
    const mmrcField = fields.find((f) => (f.label || '').toLowerCase().includes('dispneia') || (f.label || '').toLowerCase().includes('mmrc'));
    if (mmrcField) {
      const ans = getAnswerForField(mmrcField, recAnswers);
      if (ans !== undefined && ans !== null && ans !== '') {
        const str = String(ans).split(' - ')[0].trim();
        return {
          label: 'mMRC',
          score: str.includes('Grau') ? str : `Grau ${str}`,
          badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      }
    }
  }

  // 9. NYHA
  if (scaleTitle.includes('nyha') || scaleTitle.includes('classe funcional')) {
    const nyhaField = fields.find((f) => (f.label || '').toLowerCase().includes('nyha') || (f.label || '').toLowerCase().includes('classe'));
    if (nyhaField) {
      const ans = getAnswerForField(nyhaField, recAnswers);
      if (ans !== undefined && ans !== null && ans !== '') {
        const str = String(ans).split(' - ')[0].trim();
        return {
          label: 'NYHA',
          score: str,
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
        };
      }
    }
  }

  // 10. Manovacuometria
  if (scaleTitle.includes('manovacuometria') || scaleTitle.includes('pimáx') || scaleTitle.includes('pimax')) {
    const piField = fields.find((f) => (f.label || '').toLowerCase().includes('pimáx medida') || (f.label || '').toLowerCase().includes('pimax'));
    const peField = fields.find((f) => (f.label || '').toLowerCase().includes('pemáx medida') || (f.label || '').toLowerCase().includes('pemax'));
    const piVal = piField ? getAnswerForField(piField, recAnswers) : null;
    const peVal = peField ? getAnswerForField(peField, recAnswers) : null;
    if (piVal || peVal) {
      return {
        label: 'MANOVACUO',
        score: `PI: ${piVal || '—'} | PE: ${peVal || '—'} cmH2O`,
        badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      };
    }
  }

  // 11. TC6
  if (scaleTitle.includes('tc6') || scaleTitle.includes('6 minutos')) {
    const distField = fields.find((f) => (f.label || '').toLowerCase().includes('distância') || (f.label || '').toLowerCase().includes('distancia'));
    if (distField) {
      const ans = getAnswerForField(distField, recAnswers);
      if (ans !== undefined && ans !== null && ans !== '') {
        return {
          label: 'TC6',
          score: `${ans} m`,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      }
    }
  }

  // 12. Força Muscular MRC
  if (scaleTitle.includes('força muscular') || (scaleTitle.includes('mrc') && !scaleTitle.includes('dispneia'))) {
    const mrcFields = fields.filter((f) => {
      const l = (f.label || '').toLowerCase();
      return !l.includes('específico') && !l.includes('especifico') && !l.includes('obs');
    });
    let total = 0;
    let count = 0;
    mrcFields.forEach((f, idx) => {
      const ans = getAnswerForField(f, recAnswers, idx);
      if (ans !== undefined && ans !== null && ans !== '') {
        total += getAnswerPoints(ans);
        count++;
      }
    });
    if (count > 0) {
      return {
        label: 'MRC FORÇA',
        score: `${total} / ${count * 5} pts`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
  }

  // 13. Bioimpedância
  if (scaleTitle.includes('bioimpedância') || scaleTitle.includes('bioimpedancia')) {
    const pesoField = fields.find((f) => (f.label || '').toLowerCase().includes('peso'));
    const fatField = fields.find((f) => (f.label || '').toLowerCase().includes('% de gordura'));
    const pesoVal = pesoField ? getAnswerForField(pesoField, recAnswers) : null;
    const fatVal = fatField ? getAnswerForField(fatField, recAnswers) : null;
    if (pesoVal || fatVal) {
      return {
        label: 'BIOIMPEDÂNCIA',
        score: `${pesoVal ? `${pesoVal}kg` : ''}${pesoVal && fatVal ? ' | ' : ''}${fatVal ? `${fatVal}% gord.` : ''}`,
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      };
    }
  }

  return null;
};

export function EvaluationHistoryList({
  formRecords,
  patient,
  isAdmin,
  expandedRecordIds,
  onToggleExpand,
  onStartEdit,
  onRequestDelete,
  onRecordUpdated,
}: EvaluationHistoryListProps) {
  const { toast } = useToast();
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [collapsedScales, setCollapsedScales] = useState<Record<string, boolean>>({});

  // Inline scale editing state
  const [editingScaleKey, setEditingScaleKey] = useState<string | null>(null);
  const [editingAnswers, setEditingAnswers] = useState<Record<string, any>>({});
  const [savingScale, setSavingScale] = useState(false);

  const toggleScaleCollapse = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedScales((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleStartEditScale = (record: any, scale: ScaleGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const scaleKey = `${record.id}_${scale.id}`;
    setEditingScaleKey(scaleKey);
    const currentAnswers = parseAnswers(record.answers);
    setEditingAnswers({ ...currentAnswers });

    // Ensure scale sub-accordion is expanded
    setCollapsedScales((prev) => ({
      ...prev,
      [scaleKey]: false,
    }));
  };

  const handleCancelEditScale = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingScaleKey(null);
    setEditingAnswers({});
  };

  const handleSaveScale = async (record: any, scale: ScaleGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavingScale(true);

    try {
      const updatedAnswers = { ...parseAnswers(record.answers), ...editingAnswers };

      // Update via API
      await api.put(`/patients/${patient.id}/form-records/${record.id}`, {
        answers: updatedAnswers,
      });

      // Update local record answers
      record.answers = updatedAnswers;

      toast({
        title: 'Escala Atualizada!',
        description: `As alterações da escala "${scale.title}" foram salvas com sucesso.`,
        type: 'success',
      });

      setEditingScaleKey(null);
      setEditingAnswers({});
      onRecordUpdated?.(record.id, updatedAnswers);
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar escala',
        description: err?.response?.data?.error || 'Não foi possível salvar as alterações da escala.',
        type: 'error',
      });
    } finally {
      setSavingScale(false);
    }
  };

  const getSignUrl = (token?: string) => {
    if (!token) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/assinar/${token}`;
    }
    return `/assinar/${token}`;
  };

  const handleCopySignLink = (e: React.MouseEvent, token?: string) => {
    e.stopPropagation();
    if (!token) return;
    const url = getSignUrl(token);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  };

  const handleSendWhatsApp = (e: React.MouseEvent, token?: string, patientName?: string, phone?: string) => {
    e.stopPropagation();
    if (!token) return;
    const url = getSignUrl(token);
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const pName = patientName || patient?.fullName || patient?.name || 'Paciente';
    const msg = encodeURIComponent(
      `Olá ${pName}! Segue o link para você visualizar e assinar digitalmente sua avaliação fisioterapêutica:\n\n${url}\n\nPor favor, acesse o link para conferir o resumo e registrar sua assinatura.`
    );
    const waUrl =
      cleanPhone.length >= 10 ? `https://wa.me/55${cleanPhone}?text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {formRecords.map((record, index) => {
        const isExpanded = expandedRecordIds.includes(record.id);
        const isSigned = (record.signatureStatus || record.signature_status) === 'assinado';
        const sigToken = record.signatureToken || record.signature_token;
        const rDate = record.recordDate || record.record_date || record.createdAt;
        const formattedDate = formatDateSafe(rDate);
        const recordScales = extractScaleGroups(record.template);
        const recAnswers = parseAnswers(record.answers);
        const answersCount = Object.keys(recAnswers).length;

        let recordImages: string[] = [];
        if (Array.isArray(record.images)) {
          recordImages = record.images;
        } else if (typeof record.images === 'string') {
          try {
            const parsed = JSON.parse(record.images);
            if (Array.isArray(parsed)) recordImages = parsed;
          } catch {
            if (record.images.startsWith('data:') || record.images.startsWith('http')) {
              recordImages = [record.images];
            }
          }
        }
        if (recordImages.length === 0 && recAnswers?.images && Array.isArray(recAnswers.images)) {
          recordImages = recAnswers.images;
        }
        if (recordImages.length === 0 && recAnswers?.photoData && typeof recAnswers.photoData === 'string') {
          recordImages = [recAnswers.photoData];
        }

        return (
          <div
            key={record.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:border-slate-300"
          >
            {/* Header Accordion */}
            <div
              onClick={() => onToggleExpand(record.id)}
              className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  #{formRecords.length - index}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {formRecords.length - index === 1
                        ? '1ª Avaliação Inicial'
                        : `${formRecords.length - index}ª Reavaliação`}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isSigned
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {isSigned ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                      <span>{isSigned ? 'Assinatura Registrada' : 'Assinatura Pendente'}</span>
                    </span>

                    <span>•</span>
                    <span>{answersCount} item(ns)</span>
                    {recordImages.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                          <Camera className="w-3 h-3" />
                          {recordImages.length} foto(s)
                        </span>
                      </>
                    )}
                    {record.template?.title && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{record.template.title}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & Chevron */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                {/* Share Link Buttons */}
                {sigToken && (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleCopySignLink(e, sigToken)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white shadow-2xs"
                      title="Copiar link para o paciente assinar"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleSendWhatsApp(e, sigToken, patient?.fullName || patient?.name, patient?.phone)
                      }
                      className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-emerald-200 bg-emerald-50/50 shadow-2xs"
                      title="Enviar link de assinatura via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(record);
                  }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  title="Editar Toda a Avaliação"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(record);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Excluir Avaliação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="p-2 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Accordion Body */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-6 sm:px-6 space-y-5 border-t border-slate-100 pt-5 bg-slate-50/40"
                >
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      isSigned
                        ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                        : 'bg-amber-50/60 border-amber-200/80 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {isSigned ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h5 className="font-extrabold text-xs sm:text-sm">
                          {isSigned ? 'Avaliação Assinada pelo Paciente' : 'Aguardando Assinatura do Paciente'}
                        </h5>
                        <p className="text-[11px] opacity-80">
                          {isSigned
                            ? `Documento validado com assinatura em ${formatDateTimeSafe(
                                record.signedAt || record.signed_at
                              )}`
                            : 'Envie o link para o paciente visualizar a prévia da avaliação e assinar digitalmente.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* If signed, signature image */}
                  {isSigned && (record.signatureImage || record.signature_image) && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Assinatura Digital Gravada:
                      </span>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-start">
                        <img
                          src={record.signatureImage || record.signature_image}
                          alt="Assinatura do Paciente"
                          className="max-h-24 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Attached Photos / Evidences */}
                  {recordImages.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-blue-600" />
                            Fotos e Evidências ({recordImages.length})
                          </h5>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Clique na foto para ampliar
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {recordImages.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => {
                              setLightboxImages(recordImages);
                              setLightboxIndex(imgIdx);
                            }}
                            className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-950/5 border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all"
                          >
                            <img
                              src={imgUrl}
                              alt={`Evidência ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 flex items-center justify-center transition-colors">
                              <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-opacity">
                                <Eye className="w-3 h-3 text-blue-600" />
                                Ampliar
                              </span>
                            </div>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                              #{imgIdx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.notes && (
                    <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs">
                      <span className="font-bold text-blue-950 block mb-1">Observações do Fisioterapeuta:</span>
                      <p className="text-slate-700 whitespace-pre-wrap">{record.notes}</p>
                    </div>
                  )}

                  {/* Individual Scale Sub-Accordions */}
                  {recordScales.length > 0 ? (
                    <div className="space-y-3.5">
                      {recordScales.map((scale, scIdx) => {
                        const scaleKey = `${record.id}_${scale.id || scIdx}`;
                        const isScaleCollapsed = !!collapsedScales[scaleKey];
                        const isEditingThisScale = editingScaleKey === scaleKey;
                        const activeAnswersForScale = isEditingThisScale ? editingAnswers : recAnswers;
                        const scaleBadge = calculateScaleBadge(scale, activeAnswersForScale);

                        return (
                          <div
                            key={scaleKey}
                            className={`bg-white rounded-2xl border transition-all ${
                              isEditingThisScale
                                ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                                : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                            } overflow-hidden`}
                          >
                            {/* Scale Sub-Accordion Header */}
                            <div
                              onClick={(e) => toggleScaleCollapse(scaleKey, e)}
                              className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors select-none ${
                                isEditingThisScale ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    isEditingThisScale ? 'bg-blue-600 animate-pulse' : 'bg-blue-600'
                                  }`}
                                ></div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                                      {scale.title}
                                    </h5>
                                    {isEditingThisScale && (
                                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                        Modo Edição
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {(() => {
                                      const ansCount = scale.fields.filter((f: any) => {
                                        const ans = getAnswerForField(f, activeAnswersForScale);
                                        return ans !== undefined && ans !== null && ans !== '';
                                      }).length;
                                      return `${ansCount} de ${scale.fields.length} item(ns) preenchido(s)`;
                                    })()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1.5 shrink-0">
                                {scaleBadge && (
                                  <div
                                    className={`px-3 py-1 rounded-xl border text-right font-black text-xs ${scaleBadge.badgeClass}`}
                                  >
                                    <span className="text-[9px] uppercase font-bold block opacity-75">
                                      {scaleBadge.label}
                                    </span>
                                    <span>{scaleBadge.score}</span>
                                  </div>
                                )}

                                {!isEditingThisScale ? (
                                  <button
                                    type="button"
                                    onClick={(e) => handleStartEditScale(record, scale, e)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                                    title={`Editar ${scale.title}`}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                ) : null}

                                <div className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                  {isScaleCollapsed ? (
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                  ) : (
                                    <ChevronUp className="w-4 h-4 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Scale Sub-Accordion Body */}
                            <AnimatePresence initial={false}>
                              {!isScaleCollapsed && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/40 space-y-4"
                                >
                                  {isEditingThisScale ? (
                                    // EDIT MODE FOR THIS SCALE
                                    <div className="space-y-4">
                                      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-950">
                                        <span className="font-bold flex items-center gap-1.5">
                                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                          Editando respostas de: {scale.title}
                                        </span>
                                        <span className="text-[11px] text-blue-700">
                                          Altere os valores e clique em Salvar Escala abaixo.
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scale.fields
                                          .filter((f: CustomField) => {
                                            const labelLower = (f.label || '').toLowerCase();
                                            if (labelLower.includes('quantidade de o2')) {
                                              const hasO2BoolField = scale.fields.some((other: CustomField) => {
                                                const otherLabel = (other.label || '').toLowerCase();
                                                return (
                                                  (otherLabel.includes('o2') ||
                                                    otherLabel.includes('oxigênio') ||
                                                    otherLabel.includes('oxigenio')) &&
                                                  !otherLabel.includes('quantidade')
                                                );
                                              });
                                              return !hasO2BoolField;
                                            }
                                            return true;
                                          })
                                          .map((f: CustomField, fIdx: number) => {
                                            const fieldKey = String(f.id || f.label || fIdx);
                                            const currentVal =
                                              editingAnswers[fieldKey] ??
                                              editingAnswers[String(f.label)] ??
                                              getAnswerForField(f, editingAnswers, fIdx) ??
                                              '';

                                            return (
                                              <FieldRenderer
                                                key={fieldKey}
                                                field={f}
                                                value={currentVal}
                                                onChange={(val) => {
                                                  setEditingAnswers((prev) => {
                                                    const updated = { ...prev };
                                                    if (f.id) updated[String(f.id)] = val;
                                                    if (f.label) updated[String(f.label)] = val;
                                                    return updated;
                                                  });
                                                }}
                                                index={fIdx}
                                                allAnswers={editingAnswers}
                                                onAnswerChange={(key, val) => {
                                                  setEditingAnswers((prev) => ({ ...prev, [key]: val }));
                                                }}
                                              />
                                            );
                                          })}
                                      </div>

                                      {/* Bottom Toolbar inside this scale */}
                                      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                                        <button
                                          type="button"
                                          onClick={handleCancelEditScale}
                                          disabled={savingScale}
                                          className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleSaveScale(record, scale, e)}
                                          disabled={savingScale}
                                          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                        >
                                          {savingScale ? (
                                            <>
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              <span>Salvando...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Save className="w-3.5 h-3.5" />
                                              <span>Salvar Escala</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    // VIEW MODE
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                      {scale.fields.map((f: any, fIdx: number) => {
                                        const keyById = String(f.id || f.label || fIdx);
                                        const ansVal = getAnswerForField(f, recAnswers, fIdx);
                                        const hasAns = ansVal !== undefined && ansVal !== null && ansVal !== '';

                                        return (
                                          <div
                                            key={keyById}
                                            className={`p-4 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${
                                              hasAns
                                                ? 'bg-white border-slate-200 shadow-2xs'
                                                : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60'
                                            }`}
                                          >
                                            <span className="text-[11px] font-bold text-slate-600 leading-snug">
                                              {f.label}
                                            </span>
                                            <div className="font-black text-slate-900 text-sm">
                                              {hasAns ? (
                                                Array.isArray(ansVal) ? (
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {ansVal.map((vItem: string) => (
                                                      <span
                                                        key={vItem}
                                                        className="bg-blue-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-lg"
                                                      >
                                                        ✓ {vItem}
                                                      </span>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <span className="text-blue-950 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl inline-block">
                                                    {`${ansVal} ${f.unit || ''}`}
                                                  </span>
                                                )
                                              ) : (
                                                <span className="text-slate-400 italic font-normal">Não preenchido</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Lightbox for History Photos */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onNavigate={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
