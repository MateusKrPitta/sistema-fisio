import { CLINICAL_PRESETS } from '@/lib/clinical-presets';

export interface PatientItem {
  id: number;
  name: string;
  fullName?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  template?: { id: number; title: string };
  user?: { id: number; fullName?: string; email?: string };
  evaluators?: string[];
}

export interface EvaluationRecord {
  id: number;
  patientId: number;
  templateId?: number;
  recordDate: string;
  record_date?: string;
  createdAt?: string;
  answers: any;
  notes?: string;
  signatureStatus?: string;
  signature_status?: string;
  signatureToken?: string;
  signature_token?: string;
  signatureImage?: string;
  signature_image?: string;
  signedAt?: string;
  signed_at?: string;
  signedByName?: string;
  signed_by_name?: string;
  signedByCpf?: string;
  signed_by_cpf?: string;
  user?: { id: number; fullName?: string; crefito?: string; email?: string };
  template?: {
    id: number;
    title: string;
    category?: string;
    description?: string;
    modules?: any[];
  };
}

export interface ScaleSession {
  recordId: number;
  date: string;
  sessionIndex: number;
  evaluatorName: string;
  evaluatorCrefito?: string;
  scoreSummary?: string;
  clinicalInterpretation?: string;
  items: { label: string; value: string; unit?: string }[];
  notes?: string;
  isSigned?: boolean;
  signatureImage?: string;
  signedAt?: string;
  signedByName?: string;
}

export interface ParsedScaleGroup {
  scaleKey: string;
  scaleTitle: string;
  category: string;
  sessions: ScaleSession[];
}

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const formatDateTime = (dateStr?: string) => {
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

export const parseAnswersMap = (rawAnswers: any): Record<string, any> => {
  if (!rawAnswers) return {};
  if (typeof rawAnswers === 'object') return rawAnswers;
  try {
    return JSON.parse(rawAnswers);
  } catch {
    return {};
  }
};

// Build a global dictionary of all preset fields for clean label resolution
export const buildPresetFieldDictionary = () => {
  const map: Record<string, { label: string; unit?: string; scaleTitle: string; category: string }> = {};
  Object.entries(CLINICAL_PRESETS).forEach(([category, presets]) => {
    presets.forEach((preset) => {
      const fields = preset.getFields();
      fields.forEach((f, fIdx) => {
        const title = preset.title || preset.label;
        const entry = { label: f.label, unit: f.unit, scaleTitle: title, category };
        map[f.label.toLowerCase().trim()] = entry;
        if (f.id) {
          map[String(f.id)] = entry;
        }
        map[`${title}_${fIdx}`] = entry;
      });
    });
  });
  return map;
};

export const GLOBAL_FIELD_DICT = buildPresetFieldDictionary();

// Helper to normalize scale keys
export const normalizeScaleKey = (rawKey: string, title?: string): string => {
  const s = `${rawKey} ${title || ''}`.toLowerCase();
  if (s.includes('tc6') || s.includes('caminhada de 6') || s.includes('6 minutos')) return 'tc6';
  if (s.includes('manovacuometria') || s.includes('pimáx') || s.includes('pimax') || s.includes('pemáx') || s.includes('pemax')) return 'manovacuometria';
  if (s.includes('glasgow') || s.includes('abertura ocular') || s.includes('resposta verbal') || s.includes('resposta motora')) return 'glasgow';
  if (s.includes('ashworth') || s.includes('espasticidade')) return 'ashworth';
  if (s.includes('berg') || s.includes('bbs') || s.includes('equilíbrio funcional')) return 'berg';
  if (s.includes('barthel') || s.includes('avd')) return 'barthel';
  if (s.includes('tug') || s.includes('timed up and go')) return 'tug';
  if (
    s.includes('eva') ||
    s.includes('intensidade da dor') ||
    s.includes('body map') ||
    s.includes('mapeamento de dor') ||
    s.includes('pain_map') ||
    s.includes('painmap') ||
    s.includes('pontos de dor') ||
    s.includes('pontos e mapeamento de dor') ||
    (s.includes('dor') && !s.includes('postural') && !s.includes('mrc') && !s.includes('goniometria'))
  ) {
    return 'eva_dor';
  }
  if (s.includes('força muscular') || (s.includes('mrc') && !s.includes('dispneia') && !s.includes('mmrc'))) return 'forca_muscular_mrc';
  if (s.includes('mmrc') || (s.includes('dispneia') && !s.includes('tc6'))) return 'mmrc';
  if (s.includes('bioimpedância') || s.includes('bioimpedancia')) return 'bioimpedancia';
  if (s.includes('peak flow') || s.includes('pcf') || s.includes('pico de fluxo')) return 'peak_flow';
  if (s.includes('goniometria') || s.includes('amplitude articular')) return 'goniometria';
  if (s.includes('postural') || s.includes('desvios posturais')) return 'postural';
  if (s.includes('tronco') || s.includes('tct')) return 'tct';
  return rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
};

// Helper to resolve an answer key or value into clean label and Scale metadata
export const resolveFieldInfo = (
  rawKey: string,
  rawVal: any
): { scaleKey: string; scaleTitle: string; category: string; label: string; unit?: string } => {
  const cleanKey = rawKey.toLowerCase().trim();
  const valStr = String(rawVal).toLowerCase();

  // 0. Check exact dictionary match FIRST from presets if available
  const dictEntry = GLOBAL_FIELD_DICT[cleanKey];
  if (dictEntry) {
    const normKey = normalizeScaleKey(dictEntry.scaleTitle.toLowerCase().trim(), dictEntry.scaleTitle);
    return {
      scaleKey: normKey,
      scaleTitle: dictEntry.scaleTitle,
      category: dictEntry.category,
      label: dictEntry.label,
      unit: dictEntry.unit,
    };
  }

  // Extract trailing field index if key has format 'timestamp_1' or 'timestamp 1' or 'mod_1'
  const matchTrailingIndex = rawKey.match(/(?:_|\s+)(\d+)$/);
  const fieldIndex = matchTrailingIndex ? parseInt(matchTrailingIndex[1], 10) : null;

  // 1. Ashworth Modificada
  if (
    cleanKey.includes('ashworth') ||
    cleanKey.includes('espasticidade') ||
    valStr.includes('aumento no tônus') ||
    valStr.includes('adm') ||
    cleanKey.includes('segmento') ||
    cleanKey.includes('membro avaliado')
  ) {
    let label = 'Grau de Espasticidade (Membro Avaliado)';
    if (
      cleanKey.includes('segmento') ||
      cleanKey.includes('muscular') ||
      fieldIndex === 2 ||
      (valStr.length > 0 && !valStr.match(/^\d/))
    ) {
      label = 'Grupo Muscular / Segmento Avaliado';
    }
    return {
      scaleKey: 'ashworth',
      scaleTitle: 'Escala de Ashworth Modificada (Espasticidade)',
      category: 'Neurologia',
      label,
    };
  }

  // 2. Glasgow
  if (
    cleanKey.includes('glasgow') ||
    cleanKey.includes('abertura ocular') ||
    cleanKey.includes('resposta verbal') ||
    cleanKey.includes('resposta motora') ||
    valStr.includes('espontânea') ||
    valStr.includes('ao chamado') ||
    valStr.includes('confuso') ||
    valStr.includes('inapropriadas') ||
    valStr.includes('obedece') ||
    valStr.includes('localiza') ||
    valStr.includes('flexão anormal')
  ) {
    let label = 'Abertura Ocular';
    if (cleanKey.includes('verbal') || valStr.includes('orientado') || valStr.includes('confuso') || valStr.includes('sons') || fieldIndex === 2) {
      label = 'Resposta Verbal';
    } else if (cleanKey.includes('motora') || valStr.includes('obedece') || valStr.includes('localiza') || valStr.includes('extensão') || fieldIndex === 3) {
      label = 'Resposta Motora';
    }
    return {
      scaleKey: 'glasgow',
      scaleTitle: 'Escala de Coma de Glasgow',
      category: 'Neurologia',
      label,
    };
  }

  // 3. Manovacuometria
  if (
    cleanKey.includes('manovacuometria') ||
    cleanKey.includes('pimáx') ||
    cleanKey.includes('pimax') ||
    cleanKey.includes('pemáx') ||
    cleanKey.includes('pemax')
  ) {
    return {
      scaleKey: 'manovacuometria',
      scaleTitle: 'Manovacuometria (Força Muscular Respiratória)',
      category: 'Cardiorrespiratória',
      label: rawKey,
      unit: 'cmH2O',
    };
  }

  // 4. TC6 (Caminhada)
  if (cleanKey.includes('tc6') || cleanKey.includes('distância total') || cleanKey.includes('dispneia basal') || cleanKey.includes('fadiga basal')) {
    return {
      scaleKey: 'tc6',
      scaleTitle: 'Teste de Caminhada de 6 Minutos (TC6)',
      category: 'Cardiorrespiratória',
      label: rawKey,
    };
  }

  // 5. Bioimpedância
  if (cleanKey.includes('bioimpedância') || cleanKey.includes('bioimpedancia') || cleanKey.includes('gordura corporal') || cleanKey.includes('massa magra') || cleanKey.includes('tmb')) {
    return {
      scaleKey: 'bioimpedancia',
      scaleTitle: 'Avaliação por Bioimpedância',
      category: 'Composição Corporal',
      label: rawKey,
    };
  }

  // 6. Peak Flow
  if (cleanKey.includes('peak flow') || cleanKey.includes('pcf') || cleanKey.includes('pico de fluxo')) {
    return {
      scaleKey: 'peak_flow',
      scaleTitle: 'Peak Flow & Pico de Fluxo Tosse',
      category: 'Cardiorrespiratória',
      label: rawKey,
      unit: 'L/min',
    };
  }

  // 7. Controle de Tronco (TCT)
  if (
    cleanKey.includes('tronco') ||
    cleanKey.includes('tct') ||
    cleanKey.includes('rolar para') ||
    cleanKey.includes('sentar-se') ||
    valStr.includes('incapaz de fazer sem assistência') ||
    valStr.includes('capaz de completar a tarefa normalmente')
  ) {
    let label = 'Controle de Tronco';
    if (cleanKey.includes('afetado') || fieldIndex === 1) label = 'Rolar para o lado afetado';
    else if (cleanKey.includes('sadio') || fieldIndex === 2) label = 'Rolar para o lado sadio';
    else if (cleanKey.includes('sentada') || cleanKey.includes('30 segundos') || fieldIndex === 3) label = 'Equilíbrio na posição sentada (30s)';
    else if (cleanKey.includes('deitado') || fieldIndex === 4) label = 'Sentar-se a partir de deitado';

    return {
      scaleKey: 'tct',
      scaleTitle: 'Módulo do Controle de Tronco (TCT)',
      category: 'Controle de Tronco',
      label,
    };
  }

  // 8. Berg BBS
  if (
    cleanKey.includes('berg') ||
    cleanKey.includes('bbs') ||
    cleanKey.includes('degrau') ||
    cleanKey.includes('tandem') ||
    cleanKey.includes('unipodal')
  ) {
    let label = rawKey;
    if (fieldIndex) {
      const bergNames = [
        '1. Posição sentada para em pé',
        '2. Permanecer em pé sem apoio',
        '3. Permanecer sentado sem apoio',
        '4. Posição em pé para sentada',
        '5. Transferências',
        '6. Em pé de olhos fechados',
        '7. Em pé com pés juntos',
        '8. Alcançar a frente com braço estendido',
        '9. Pegar objeto do chão',
        '10. Virar-se para olhar para trás',
        '11. Girar 360 graus',
        '12. Pés alternados no degrau',
        '13. Posição tandem (um pé à frente)',
        '14. Apoio unipodal (um pé só)',
      ];
      if (fieldIndex >= 1 && fieldIndex <= 14) {
        label = bergNames[fieldIndex - 1];
      }
    }
    return {
      scaleKey: 'berg',
      scaleTitle: 'Escala de Equilíbrio Funcional de Berg (BBS)',
      category: 'Geriatria & Equilíbrio',
      label,
    };
  }

  // 9. DOR / ESCALA EVA / BODY MAP
  if (
    cleanKey === 'painscale' ||
    cleanKey === 'pain_scale' ||
    cleanKey.includes('intensidade da dor') ||
    cleanKey.includes('escala eva') ||
    cleanKey === 'eva' ||
    cleanKey === 'dor (eva)' ||
    cleanKey.includes('nível de dor') ||
    cleanKey.includes('nivel de dor')
  ) {
    return {
      scaleKey: 'eva_dor',
      scaleTitle: 'Escala Visual Analógica (EVA - Dor)',
      category: 'Dor',
      label: 'Intensidade da Dor (EVA 0 a 10)',
      unit: '/10',
    };
  }

  if (
    cleanKey === 'markers' ||
    cleanKey.includes('body map') ||
    cleanKey.includes('regiões anatômicas') ||
    cleanKey.includes('regioes anatomicas') ||
    cleanKey.includes('pontos de dor')
  ) {
    return {
      scaleKey: 'eva_dor',
      scaleTitle: 'Mapeamento Anatômico e Pontos de Dor (Body Map)',
      category: 'Dor',
      label: 'Pontos Marcados no Body Map',
    };
  }

  if (
    cleanKey === 'paincharacteristics' ||
    cleanKey.includes('característica da dor') ||
    cleanKey.includes('caracteristica da dor') ||
    cleanKey.includes('tipo / característica') ||
    cleanKey.includes('tipo de dor')
  ) {
    return {
      scaleKey: 'eva_dor',
      scaleTitle: 'Mapeamento Anatômico e Pontos de Dor (Body Map)',
      category: 'Dor',
      label: 'Tipo / Característica da Dor',
    };
  }

  if (cleanKey.includes('irradiação') || cleanKey.includes('irradiacao')) {
    return {
      scaleKey: 'eva_dor',
      scaleTitle: 'Mapeamento Anatômico e Pontos de Dor (Body Map)',
      category: 'Dor',
      label: 'Irradiação da Dor',
    };
  }

  if (cleanKey.includes('fatores de piora') || cleanKey.includes('fatores de melhora')) {
    return {
      scaleKey: 'eva_dor',
      scaleTitle: 'Mapeamento Anatômico e Pontos de Dor (Body Map)',
      category: 'Dor',
      label: 'Fatores de Piora e Melhora',
    };
  }

  if (cleanKey === 'totalpoints' || cleanKey === 'total_points') {
    return {
      scaleKey: 'eva_dor',
      scaleTitle: 'Mapeamento Anatômico e Pontos de Dor (Body Map)',
      category: 'Dor',
      label: 'Total de Pontos de Dor',
    };
  }

  // 10. Timed Up and Go (TUG)
  if (
    cleanKey.includes('tug') ||
    cleanKey.includes('timed up and go') ||
    (cleanKey.includes('marcha') && !cleanKey.includes('goniometria')) ||
    (cleanKey.includes('dispositivo') && !cleanKey.includes('respiratorio') && !cleanKey.includes('cuff'))
  ) {
    let label = 'Tempo de Execução (TUG)';
    let unit: string | undefined = 'segundos';
    if (cleanKey.includes('risco') || valStr.includes('risco')) {
      label = 'Classificação de Risco de Queda';
      unit = undefined;
    } else if (cleanKey.includes('marcha') || cleanKey.includes('dispositivo')) {
      label = 'Dispositivo de Marcha';
      unit = undefined;
    } else if (cleanKey.includes('o2') || cleanKey.includes('oxigênio') || cleanKey.includes('oxigenio')) {
      label = cleanKey.includes('quantidade') || cleanKey.includes('fluxo') ? 'Quantidade de O2' : 'Utilização de O2';
      if (cleanKey.includes('quantidade') || cleanKey.includes('fluxo')) unit = 'L/min';
    }
    return {
      scaleKey: 'tug',
      scaleTitle: 'Timed Up and Go (TUG)',
      category: 'Geriatria & Equilíbrio',
      label,
      unit,
    };
  }

  // 11. Barthel
  if (cleanKey.includes('barthel') || cleanKey.includes('avd') || cleanKey.includes('alimentação') || cleanKey.includes('higiene pessoal') || cleanKey.includes('vestir-se')) {
    return {
      scaleKey: 'barthel',
      scaleTitle: 'Índice de Barthel (AVDs)',
      category: 'Geriatria & Equilíbrio',
      label: rawKey,
    };
  }

  // 12. Postural
  if (cleanKey.includes('postural') || cleanKey.includes('desvios posturais') || cleanKey.includes('visão anterior') || cleanKey.includes('visão posterior')) {
    return {
      scaleKey: 'postural',
      scaleTitle: 'Avaliação Postural Global',
      category: 'Postura & Biomecânica',
      label: rawKey,
    };
  }

  // 13. Goniometria
  if (cleanKey.includes('goniometria') || cleanKey.includes('°')) {
    return {
      scaleKey: 'goniometria',
      scaleTitle: 'Goniometria e Amplitude Articular',
      category: 'Goniometria',
      label: rawKey,
      unit: '°',
    };
  }

  // Final Generic Fallback
  const genericLabel = isNaN(Number(rawKey.split(' ')[0]))
    ? rawKey
    : rawKey.replace(/^\d+[\s_]*/, 'Parâmetro ');

  return {
    scaleKey: 'avaliacao_clinica',
    scaleTitle: 'Avaliação Clínica Fisioterapêutica',
    category: 'Avaliação Geral',
    label: genericLabel,
  };
};

/**
 * Intelligent Clinical Engine: Groups and calculates scores/diagnoses for all patient evaluations
 */
export const parseScaleGroupsFromRecords = (patientRecords: EvaluationRecord[]): ParsedScaleGroup[] => {
  if (!patientRecords || patientRecords.length === 0) return [];

  const scaleMap = new Map<string, { scaleTitle: string; category: string; sessionsMap: Map<number, ScaleSession> }>();

  const getOrCreateScale = (key: string, title: string, category: string) => {
    const normKey = normalizeScaleKey(key, title);
    if (!scaleMap.has(normKey)) {
      scaleMap.set(normKey, { scaleTitle: title, category, sessionsMap: new Map() });
    }
    return scaleMap.get(normKey)!;
  };

  patientRecords.forEach((record, rIdx) => {
    const rawAnswers = parseAnswersMap(record.answers);
    const evalDate = formatDate(record.recordDate || record.record_date || record.createdAt);
    const evaluator = record.user?.fullName || 'Dra. Milene Salmazo';
    const crefito = record.user?.crefito;
    const isSigned = (record.signatureStatus || record.signature_status) === 'assinado';
    const sigImg = record.signatureImage || record.signature_image;
    const sAt = record.signedAt || record.signed_at;
    const sBy = record.signedByName || record.signed_by_name;

    const allKeys = Object.keys(rawAnswers);
    const namedKeys = allKeys.filter((k) => isNaN(Number(k.split(/[\s_]/)[0])));
    const keysToProcess = namedKeys.length > 0 ? namedKeys : allKeys;

    const recordScalesMap = new Map<
      string,
      { scaleTitle: string; category: string; itemsMap: Map<string, { label: string; value: string; unit?: string }> }
    >();

    const defaultScaleTitle = record.template?.title || '';
    const defaultCategory = record.template?.category || 'Neurologia';

    keysToProcess.forEach((rawKey) => {
      const rawVal = rawAnswers[rawKey];
      if (rawVal === undefined || rawVal === null || rawVal === '') return;

      // Cleanly format array / object / primitive values
      let valStr = '';
      if (typeof rawVal === 'boolean') {
        valStr = rawVal ? 'Sim' : 'Não';
      } else if (Array.isArray(rawVal)) {
        if (rawVal.length === 0) {
          valStr = '0 pontos marcados';
        } else if (typeof rawVal[0] === 'object' && rawVal[0] !== null) {
          const regionNames = rawVal
            .map((m: any) => m.region || (m.viewId ? `Vista ${m.viewId}` : null))
            .filter(Boolean);
          if (regionNames.length > 0) {
            valStr = `${rawVal.length} ponto(s) marcado(s) (${Array.from(new Set(regionNames)).join(', ')})`;
          } else {
            valStr = `${rawVal.length} ponto(s) marcado(s)`;
          }
        } else {
          valStr = rawVal.join(', ');
        }
      } else if (typeof rawVal === 'string' && rawVal.startsWith('[') && rawVal.endsWith(']')) {
        try {
          const parsed = JSON.parse(rawVal);
          if (Array.isArray(parsed)) {
            if (parsed.length === 0) {
              valStr = '0 pontos marcados';
            } else if (typeof parsed[0] === 'object' && parsed[0] !== null) {
              valStr = `${parsed.length} ponto(s) marcado(s)`;
            } else {
              valStr = parsed.join(', ');
            }
          } else {
            valStr = rawVal;
          }
        } catch {
          valStr = rawVal;
        }
      } else {
        valStr = String(rawVal);
      }

      let resolved = resolveFieldInfo(rawKey, rawVal);
      const normKey = normalizeScaleKey(resolved.scaleKey, resolved.scaleTitle);
      resolved.scaleKey = normKey;

      if (resolved.scaleKey === 'avaliacao_clinica' && defaultScaleTitle && !defaultScaleTitle.toLowerCase().includes('avaliação')) {
        resolved.scaleKey = normalizeScaleKey(defaultScaleTitle.toLowerCase().trim(), defaultScaleTitle);
        resolved.scaleTitle = defaultScaleTitle;
        resolved.category = defaultCategory;
      }

      if (!recordScalesMap.has(resolved.scaleKey)) {
        recordScalesMap.set(resolved.scaleKey, {
          scaleTitle: resolved.scaleTitle,
          category: resolved.category,
          itemsMap: new Map(),
        });
      }

      const scaleData = recordScalesMap.get(resolved.scaleKey)!;
      const itemKey = resolved.label.toLowerCase().trim();
      if (!scaleData.itemsMap.has(itemKey)) {
        scaleData.itemsMap.set(itemKey, {
          label: resolved.label,
          value: valStr,
          unit: resolved.unit,
        });
      }
    });

    // Merge orphan generic items into the dominant scale if exists
    const specificScales = Array.from(recordScalesMap.keys()).filter((k) => k !== 'avaliacao_clinica');
    if (specificScales.length === 1 && recordScalesMap.has('avaliacao_clinica')) {
      const mainScaleKey = specificScales[0];
      const mainScale = recordScalesMap.get(mainScaleKey)!;
      const genericScale = recordScalesMap.get('avaliacao_clinica')!;
      genericScale.itemsMap.forEach((it, key) => {
        if (!mainScale.itemsMap.has(key)) {
          mainScale.itemsMap.set(key, it);
        }
      });
      recordScalesMap.delete('avaliacao_clinica');
    }

    recordScalesMap.forEach((scaleData, scaleKey) => {
      const items = Array.from(scaleData.itemsMap.values());
      if (items.length === 0) return;

      const normKey = normalizeScaleKey(scaleKey, scaleData.scaleTitle);
      const scaleEntry = getOrCreateScale(normKey, scaleData.scaleTitle, scaleData.category);

      let calculatedScore: string | undefined;
      let clinicalInterp: string | undefined;

      // 1. Ashworth Calculations
      if (scaleKey === 'ashworth') {
        const grauItem = items.find((i) => i.label.toLowerCase().includes('grau') || i.label.toLowerCase().includes('espasticidade'));
        const segItem = items.find((i) => i.label.toLowerCase().includes('segmento') || i.label.toLowerCase().includes('grupo') || i.label.toLowerCase().includes('muscular'));
        if (grauItem) {
          calculatedScore = `Grau ${grauItem.value.split(' - ')[0] || grauItem.value}`;
          if (grauItem.value.startsWith('0')) clinicalInterp = 'Tônus Normal (Sem aumento no tônus / Sem espasticidade)';
          else if (grauItem.value.startsWith('1+')) clinicalInterp = 'Espasticidade Leve+ (Aumento de tônus em menos da metade da ADM)';
          else if (grauItem.value.startsWith('1')) clinicalInterp = 'Espasticidade Leve (Mínima resistência ao final do movimento)';
          else if (grauItem.value.startsWith('2')) clinicalInterp = 'Espasticidade Moderada (Aumento marcante em quase toda ADM)';
          else if (grauItem.value.startsWith('3')) clinicalInterp = 'Espasticidade Severa (Movimento passivo difícil)';
          else if (grauItem.value.startsWith('4')) clinicalInterp = 'Rigidez Severa (Parte afetada rígida em flexão/extensão)';
        }
        if (segItem && clinicalInterp) {
          clinicalInterp += ` • Segmento: ${segItem.value}`;
        }
      }

      // 2. Glasgow Calculations
      else if (scaleKey === 'glasgow') {
        let sum = 0;
        items.forEach((i) => {
          const digit = parseInt(i.value.trim().charAt(0), 10);
          if (!isNaN(digit)) sum += digit;
        });
        if (sum > 0) {
          calculatedScore = `${sum} / 15 pts`;
          if (sum >= 13) clinicalInterp = 'TCE Leve / Estado de Consciência Preservado (13 a 15 pts)';
          else if (sum >= 9) clinicalInterp = 'TCE Moderado / Consciência Parcialmente Comprometida (9 a 12 pts)';
          else clinicalInterp = 'TCE Grave / Rebaixamento Importante do Nível de Consciência (3 a 8 pts)';
        }
      }

      // 3. Berg BBS Calculations
      else if (scaleKey === 'berg') {
        let sum = 0;
        items.forEach((i) => {
          const digit = parseInt(i.value.trim().charAt(0), 10);
          if (!isNaN(digit)) sum += digit;
        });
        if (sum > 0) {
          calculatedScore = `${sum} / 56 pts`;
          if (sum >= 41) clinicalInterp = 'Baixo Risco de Queda (Independência na marcha e transferências)';
          else if (sum >= 21) clinicalInterp = 'Médio Risco de Queda (Necessita de assistência / marcha assistida)';
          else clinicalInterp = 'Alto Risco de Queda (Equilíbrio e mobilidade severamente comprometidos)';
        }
      }

      // 4. Tronco TCT Calculations
      else if (scaleKey === 'tct') {
        let sum = 0;
        items.forEach((i) => {
          if (i.value.startsWith('25')) sum += 25;
          else if (i.value.startsWith('12')) sum += 12;
        });
        calculatedScore = `${sum} / 100 pts`;
        clinicalInterp =
          sum === 100
            ? 'Controle de Tronco Plenamente Preservado (100%)'
            : sum >= 50
            ? 'Controle de Tronco Parcial (Estabilidade moderada)'
            : 'Comprometimento Severo da Estabilidade de Tronco';
      }

      // 5. EVA Dor Calculations
      else if (scaleKey === 'eva_dor') {
        // Priority 1: Specifically find the item with the numeric EVA score (0-10)
        const dorItem =
          items.find((i) => {
            const l = i.label.toLowerCase();
            return (
              l.includes('intensidade') ||
              l.includes('escala eva') ||
              l === 'eva' ||
              l.includes('(eva') ||
              l === 'painscale' ||
              l === 'pain_scale'
            );
          }) ||
          items.find((i) => {
            const valNum = Number(String(i.value).trim().replace(',', '.'));
            return !isNaN(valNum) && valNum >= 0 && valNum <= 10 && !Array.isArray(i.value);
          });

        if (dorItem) {
          const cleanVal = String(dorItem.value).replace(/[^\d.]/g, '');
          const num = cleanVal !== '' ? parseFloat(cleanVal) : NaN;
          if (!isNaN(num) && num >= 0 && num <= 10) {
            calculatedScore = `${num} / 10`;
            clinicalInterp =
              num === 0
                ? 'Sem Dor (0/10)'
                : num <= 3
                ? `Dor Leve (${num}/10) - Impacto mínimo nas AVDs`
                : num <= 6
                ? `Dor Moderada (${num}/10) - Limitação funcional moderada`
                : num <= 8
                ? `Dor Intensa / Severa (${num}/10) - Limitação importante de movimentos`
                : `Dor Máxima / Insuportável (${num}/10) - Incapacidade funcional aguda`;
          }
        }
      }

      // 6. TUG
      else if (scaleKey === 'tug') {
        const timeItem = items.find((i) => i.unit === 'segundos' || i.label.includes('Tempo'));
        const gaitDeviceItem = items.find((i) => i.label.includes('Marcha') || i.label.includes('Dispositivo'));
        const o2Item = items.find((i) => i.label.includes('O2') || i.label.includes('Oxigênio') || i.label.includes('Oxigenio'));
        const o2AmountItem = items.find((i) => i.label.includes('Quantidade') || i.label.includes('Fluxo'));

        if (timeItem) {
          const num = parseFloat(timeItem.value);
          calculatedScore = `${timeItem.value} seg`;
          let interp =
            num < 10
              ? 'Baixo Risco de Quedas (Mobilidade normal para idosos)'
              : num <= 20
              ? 'Risco Moderado de Quedas (Mobilidade razoável)'
              : 'Alto Risco de Quedas / Dependência Funcional';

          const extras: string[] = [];
          if (gaitDeviceItem && gaitDeviceItem.value && gaitDeviceItem.value !== 'Não utiliza') {
            extras.push(`Dispositivo: ${gaitDeviceItem.value}`);
          }
          if (
            o2Item &&
            (String(o2Item.value).toLowerCase() === 'sim' ||
              String(o2Item.value).toLowerCase() === 'true' ||
              String(o2Item.value).toLowerCase() === 'presente')
          ) {
            const flow = o2AmountItem?.value ? ` (${o2AmountItem.value} L/min)` : '';
            extras.push(`Em uso de O2 suplementar${flow}`);
          }
          if (extras.length > 0) {
            interp += ` • [${extras.join(' | ')}]`;
          }

          clinicalInterp = interp;
        }
      }

      // 7. Barthel
      else if (scaleKey === 'barthel') {
        let sum = 0;
        let answeredCount = 0;
        items.forEach((i) => {
          const digit = parseInt(i.value.trim().split(' ')[0], 10);
          if (!isNaN(digit)) {
            sum += digit;
            answeredCount++;
          }
        });
        if (answeredCount > 0) {
          calculatedScore = `${sum} / 100 pts`;
          clinicalInterp =
            sum === 100
              ? 'Totalmente Independente (100 pts)'
              : sum >= 76
              ? 'Dependência Leve (76 a 99 pts)'
              : sum >= 51
              ? 'Dependência Moderada (51 a 75 pts)'
              : sum >= 26
              ? 'Dependência Severa (26 a 50 pts)'
              : 'Dependência Total (25 pts ou menos)';
        }
      }

      scaleEntry.sessionsMap.set(record.id, {
        recordId: record.id,
        date: evalDate,
        sessionIndex: rIdx + 1,
        evaluatorName: evaluator,
        evaluatorCrefito: crefito,
        scoreSummary: calculatedScore,
        clinicalInterpretation: clinicalInterp,
        items,
        notes: record.notes,
        isSigned,
        signatureImage: sigImg,
        signedAt: sAt,
        signedByName: sBy,
      });
    });
  });

  return Array.from(scaleMap.entries()).map(([scaleKey, data]) => ({
    scaleKey,
    scaleTitle: data.scaleTitle,
    category: data.category,
    sessions: Array.from(data.sessionsMap.values()),
  }));
};

export interface EvaluationSessionScale {
  scaleKey: string;
  scaleTitle: string;
  category: string;
  scoreSummary?: string;
  clinicalInterpretation?: string;
  items: { label: string; value: string; unit?: string }[];
  previousSessionScore?: string;
}

export interface EvaluationSessionDetail {
  recordId: number;
  recordIndex: number;
  sessionTitle: string;
  recordDate: string;
  formattedDate: string;
  evaluatorName: string;
  evaluatorCrefito?: string;
  notes?: string;
  isSigned: boolean;
  signatureImage?: string;
  signedAt?: string;
  signedByName?: string;
  scales: EvaluationSessionScale[];
  modulesCount?: number;
}

export const aggregateRecordsByEvaluationSession = (
  patientRecords: EvaluationRecord[],
  parsedScaleGroups: ParsedScaleGroup[]
): EvaluationSessionDetail[] => {
  const sortedRecords = [...patientRecords].sort((a, b) => {
    const da = new Date(a.recordDate || a.record_date || a.createdAt || 0).getTime();
    const db = new Date(b.recordDate || b.record_date || b.createdAt || 0).getTime();
    return da - db;
  });

  return sortedRecords.map((record, rIdx) => {
    const rawDate = record.recordDate || record.record_date || record.createdAt;
    const formattedDate = formatDate(rawDate);
    const evaluator = record.user?.fullName || 'Fisioterapeuta';
    const crefito = record.user?.crefito;
    const isSigned =
      record.signatureStatus === 'signed' ||
      record.signature_status === 'signed' ||
      Boolean(record.signatureImage || record.signature_image);
    const sigImg = record.signatureImage || record.signature_image;
    const sAt = record.signedAt || record.signed_at;
    const sBy = record.signedByName || record.signed_by_name;

    const scalesInThisSession: EvaluationSessionScale[] = [];

    parsedScaleGroups.forEach((group) => {
      const sessionInScale = group.sessions.find((s) => s.recordId === record.id);
      if (sessionInScale && sessionInScale.items.length > 0) {
        const currentIdxInGroup = group.sessions.findIndex((s) => s.recordId === record.id);
        const previousSession = currentIdxInGroup > 0 ? group.sessions[currentIdxInGroup - 1] : undefined;

        scalesInThisSession.push({
          scaleKey: group.scaleKey,
          scaleTitle: group.scaleTitle,
          category: group.category,
          scoreSummary: sessionInScale.scoreSummary,
          clinicalInterpretation: sessionInScale.clinicalInterpretation,
          items: sessionInScale.items,
          previousSessionScore: previousSession?.scoreSummary,
        });
      }
    });

    const fallbackCount = (record.template as any)?.modulesCount || 
      (record.template?.title ? record.template.title.split('+').length : 1);
    const calculatedModulesCount = scalesInThisSession.length > 0 ? scalesInThisSession.length : fallbackCount;

    return {
      recordId: record.id,
      recordIndex: rIdx,
      sessionTitle: rIdx === 0 ? '1ª Avaliação Inicial' : `${rIdx + 1}ª Reavaliação`,
      recordDate: rawDate || '',
      formattedDate,
      evaluatorName: evaluator,
      evaluatorCrefito: crefito,
      notes: record.notes,
      isSigned,
      signatureImage: sigImg,
      signedAt: sAt,
      signedByName: sBy,
      scales: scalesInThisSession,
      modulesCount: calculatedModulesCount,
    };
  });
};

