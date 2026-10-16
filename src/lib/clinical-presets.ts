export interface CustomField {
  id?: number | string;
  label: string;
  fieldType: 'text' | 'long_text' | 'number' | 'scale_0_10' | 'date' | 'single_select' | 'multi_select' | 'boolean' | 'body_map';
  options?: string[];
  unit?: string;
  helpText?: string;
  isRequired?: boolean;
  group?: string;
}

export interface ClinicalPreset {
  label: string;
  title?: string;
  description?: string;
  category: string;
  getFields: () => CustomField[];
}

export const CATEGORIES_LIST = [
  'Neurológica',
  'Cardiorrespiratória',
  'Equilíbrio',
  'Qualidade de Vida e Autonomia',
  'Dor',
  'Força Muscular',
  'Postural',
  'Composição Corporal / Bioimpedância',
  'Goniometria',
  'Geral',
];

const trunkOptionsList = [
  '0 - Incapaz de fazer sem assistência',
  '12 - Capaz de fazer usando ajuda ou em um padrão anormal de movimento. Usa os braços para manter-se quando sentado',
  '25 - Capaz de completar a tarefa normalmente.',
];

const genericBergOptions = [
  '4 - Independente e seguro na execução',
  '3 - Executa com supervisão verbal ou visual',
  '2 - Necessita de mínima assistência física',
  '1 - Necessita de moderada assistência física',
  '0 - Incapaz de realizar a tarefa',
];

export const mrcMuscleOptions = [
  '5 - Contração normal contra resistência plena',
  '4 - Contração contra resistência parcial',
  '3 - Contração contra gravidade apenas',
  '2 - Contração contra gravidade parcial',
  '1 - Contração contra gravidade mínima',
  '0 - Sem contração detectável',
];

export const MRC_MOVEMENTS_LIST = [
  'Flexão do Braço (Bíceps)',
  'Extensão do Braço (Tríceps)',
  'Elevação / Abdução de Ombro',
  'Rotação Externa de Ombro',
  'Flexão do Punho',
  'Extensão do Punho',
  'Flexão do Quadril (Iliopsoas)',
  'Extensão do Quadril (Glúteo Máximo)',
  'Flexão do Joelho (Isquiotibiais)',
  'Extensão do Joelho (Quadríceps)',
  'Dorsiflexão do Tornozelo (Tibial Anterior)',
  'Flexão Plantar (Tríceps Sural)',
  'Abdução de Quadril (Glúteo Médio)',
  'Adução de Quadril',
  'Outro Músculo / Movimento Específico',
];

export const borgScaleOptions = [
  '0 - Nenhuma',
  '0.5 - Muito, muito leve',
  '1 - Muito leve',
  '2 - Leve',
  '3 - Moderada',
  '4 - Pouco intensa',
  '5 - Intensa',
  '7 - Muito intensa',
  '9 - Muito, muito intensa',
  '10 - Máxima',
];

export interface TC6CalculationResult {
  predictedDistance: number;
  actualDistance: number;
  percentagePredicted: number;
  difference: number;
  classification: string;
  badgeBg: string;
  equationUsed: string;
  lowerLimitNormal?: number;
}

export function calculateTC6Prediction(params: {
  gender: 'M' | 'F' | 'male' | 'female' | 'Masculino' | 'Feminino' | string;
  age: number;
  heightCm: number;
  weightKg: number;
  actualDistance?: number;
  equation?: 'dourado' | 'britto' | 'enright';
}): TC6CalculationResult {
  const { gender, age, heightCm, weightKg, actualDistance = 0, equation = 'dourado' } = params;
  const isMale = String(gender).toLowerCase().startsWith('m');
  const heightM = heightCm > 0 ? heightCm / 100 : 1.7;
  const imc = heightM > 0 && weightKg > 0 ? weightKg / (heightM * heightM) : 23;

  let predicted = 0;
  let lowerLimit: number | undefined = undefined;
  let equationUsed = 'Victor Zuniga Dourado / Iwama (UNIFESP - Brasil)';

  if (equation === 'enright') {
    equationUsed = 'Enright & Sherrill (1998) - ATS';
    if (isMale) {
      predicted = 7.57 * heightCm - 5.02 * age - 1.76 * weightKg - 309;
      lowerLimit = predicted - 153;
    } else {
      predicted = 2.11 * heightCm - 5.78 * age - 2.29 * weightKg + 667;
      lowerLimit = predicted - 139;
    }
  } else if (equation === 'britto') {
    equationUsed = 'Britto et al. (2013) - População Brasileira';
    if (isMale) {
      predicted = 890.46 - 6.11 * age + 0.034 * heightCm - 3.83 * weightKg + 5.65 * imc;
    } else {
      predicted = 621.57 - 4.72 * age + 0.83 * heightCm - 2.73 * weightKg + 3.73 * imc;
    }
  } else {
    // Victor Zuniga Dourado / Iwama et al. (UNIFESP) - Equações de Referência Brasileiras
    equationUsed = 'Victor Zuniga Dourado (UNIFESP - População Brasileira)';
    predicted = 622.461 - 1.846 * age + 61.503 * (isMale ? 1 : 0);
    lowerLimit = predicted - 130;
  }

  predicted = Math.round(Math.max(predicted, 100));
  const diff = actualDistance > 0 ? Math.round(actualDistance - predicted) : 0;
  const perc = predicted > 0 && actualDistance > 0 ? (actualDistance / predicted) * 100 : 0;

  let classification = 'Aguardando Distância Realizada';
  let badgeBg = 'bg-slate-700 text-slate-200';

  if (actualDistance > 0) {
    if (perc >= 100) {
      classification = 'Excelente Capacidade Submáxima (≥ 100% do Previsto)';
      badgeBg = 'bg-emerald-600 text-white';
    } else if (perc >= 80) {
      classification = 'Capacidade Funcional Normal / Preservada (80% a 99%)';
      badgeBg = 'bg-blue-600 text-white';
    } else if (perc >= 60) {
      classification = 'Redução Leve a Moderada da Capacidade Funcional (60% a 79%)';
      badgeBg = 'bg-amber-600 text-white';
    } else {
      classification = 'Redução Severa da Capacidade Funcional Submáxima (< 60%)';
      badgeBg = 'bg-rose-600 text-white';
    }
  }

  return {
    predictedDistance: predicted,
    actualDistance,
    percentagePredicted: parseFloat(perc.toFixed(1)),
    difference: diff,
    classification,
    badgeBg,
    equationUsed,
    lowerLimitNormal: lowerLimit ? Math.round(lowerLimit) : undefined,
  };
}

export interface FPMCalculationResult {
  predictedDominant: number;
  predictedNonDominant: number;
  measuredDominant: number;
  measuredNonDominant: number;
  bestRight: number;
  bestLeft: number;
  percDominant: number;
  percNonDominant: number;
  diffDominant: number;
  diffNonDominant: number;
  dominantHand: 'Direita' | 'Esquerda' | 'Ambidestro';
  sarcopeniaRisk: boolean;
  sarcopeniaCutoff: number;
  classification: string;
  badgeBg: string;
}

export function calculateFPMNovaes(params: {
  age: number;
  weightKg: number;
  gender: 'Masculino' | 'Feminino' | 'M' | 'F' | 'male' | 'female' | string | number;
  dominantHand?: 'Direita' | 'Esquerda' | 'Ambidestro' | string;
  rightAttempts?: (number | string)[];
  leftAttempts?: (number | string)[];
}): FPMCalculationResult {
  const { age = 60, weightKg = 70, gender = 'Feminino', dominantHand = 'Direita' } = params;

  // Sexo para equação de Novaes et al. (2009): 0 para mulher e 1 para homem
  const isMale =
    gender === 1 ||
    String(gender).toLowerCase().startsWith('m') ||
    String(gender).toLowerCase().includes('masc');
  const sexFactor = isMale ? 1 : 0;

  // Equações de Novaes et al. (2009):
  // Mão dominante: FPM-D = 39,996 − (0,382 × idade) + (0,174 × peso) + (13,628 × sexo)
  // Mão não dominante: FPM-ND = 44,968 − (0,420 × idade) + (0,110 × peso) + (9,274 × sexo)
  const fpmDominant = 39.996 - (0.382 * age) + (0.174 * weightKg) + (13.628 * sexFactor);
  const fpmNonDominant = 44.968 - (0.420 * age) + (0.110 * weightKg) + (9.274 * sexFactor);

  const predictedDominant = parseFloat(Math.max(fpmDominant, 5).toFixed(1));
  const predictedNonDominant = parseFloat(Math.max(fpmNonDominant, 5).toFixed(1));

  const parseNum = (v: any) => {
    const n = parseFloat(String(v || '').replace(',', '.'));
    return !isNaN(n) && n > 0 ? n : 0;
  };

  const rightVals = (params.rightAttempts || []).map(parseNum);
  const leftVals = (params.leftAttempts || []).map(parseNum);

  const bestRight = rightVals.length > 0 ? Math.max(...rightVals) : 0;
  const bestLeft = leftVals.length > 0 ? Math.max(...leftVals) : 0;

  const isLeftDominant = String(dominantHand).toLowerCase().startsWith('e');
  const measuredDominant = isLeftDominant ? bestLeft : bestRight;
  const measuredNonDominant = isLeftDominant ? bestRight : bestLeft;

  const percDominant =
    predictedDominant > 0 && measuredDominant > 0
      ? parseFloat(((measuredDominant / predictedDominant) * 100).toFixed(1))
      : 0;

  const percNonDominant =
    predictedNonDominant > 0 && measuredNonDominant > 0
      ? parseFloat(((measuredNonDominant / predictedNonDominant) * 100).toFixed(1))
      : 0;

  const diffDominant = measuredDominant > 0 ? parseFloat((measuredDominant - predictedDominant).toFixed(1)) : 0;
  const diffNonDominant = measuredNonDominant > 0 ? parseFloat((measuredNonDominant - predictedNonDominant).toFixed(1)) : 0;

  // Critério EWGSOP2 para risco de sarcopenia/dinapenia: < 27 kgf para homens, < 16 kgf para mulheres
  const sarcopeniaCutoff = isMale ? 27 : 16;
  const sarcopeniaRisk = measuredDominant > 0 && measuredDominant < sarcopeniaCutoff;

  let classification = 'Aguardando Medidas de Dinamometria';
  let badgeBg = 'bg-slate-700 text-slate-200';

  if (measuredDominant > 0) {
    if (sarcopeniaRisk) {
      classification = `Risco de Dinapenia / Sarcopenia (< ${sarcopeniaCutoff} kgf - Critério EWGSOP2)`;
      badgeBg = 'bg-rose-600 text-white';
    } else if (percDominant >= 100) {
      classification = 'Força de Preensão Excelente (≥ 100% do Previsto)';
      badgeBg = 'bg-emerald-600 text-white';
    } else if (percDominant >= 85) {
      classification = 'Força de Preensão Normal / Preservada (85% a 99%)';
      badgeBg = 'bg-blue-600 text-white';
    } else if (percDominant >= 70) {
      classification = 'Redução Leve a Moderada da Força de Preensão (70% a 84%)';
      badgeBg = 'bg-amber-600 text-white';
    } else {
      classification = 'Redução Acentuada da Força de Preensão (< 70% do Previsto)';
      badgeBg = 'bg-orange-600 text-white';
    }
  }

  return {
    predictedDominant,
    predictedNonDominant,
    measuredDominant,
    measuredNonDominant,
    bestRight,
    bestLeft,
    percDominant,
    percNonDominant,
    diffDominant,
    diffNonDominant,
    dominantHand: isLeftDominant ? 'Esquerda' : 'Direita',
    sarcopeniaRisk,
    sarcopeniaCutoff,
    classification,
    badgeBg,
  };
}

export const getFPMFields = (): CustomField[] => [
  { id: 'fpm_model', label: 'Dinamômetro / Modelo', fieldType: 'text', isRequired: false, helpText: 'Ex: Jamar Hidráulico, Saehan, Camry Digital' },
  { id: 'fpm_unit', label: 'Unidade de Medida', fieldType: 'single_select', options: ['kgf (Quilograma-força)', 'N (Newtons)', 'Outra'], isRequired: false },
  { id: 'fpm_dominant_hand', label: 'Mão Dominante', fieldType: 'single_select', options: ['Direita', 'Esquerda', 'Ambidestro'], isRequired: false },
  { id: 'fpm_r1', label: 'Mão Direita - Tentativa 1', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_r2', label: 'Mão Direita - Tentativa 2', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_r3', label: 'Mão Direita - Tentativa 3', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_r_best', label: 'Mão Direita - Maior Valor', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_l1', label: 'Mão Esquerda - Tentativa 1', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_l2', label: 'Mão Esquerda - Tentativa 2', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_l3', label: 'Mão Esquerda - Tentativa 3', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_l_best', label: 'Mão Esquerda - Maior Valor', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_dom_measured', label: 'Resultado Medido - Mão Dominante', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_nondom_measured', label: 'Resultado Medido - Mão Não Dominante', fieldType: 'number', unit: 'kgf', isRequired: false },
  { id: 'fpm_dom_pred', label: 'Resultado Previsto - Mão Dominante', fieldType: 'number', unit: 'kgf', isRequired: false, helpText: 'Equação de Novaes et al. (2009)' },
  { id: 'fpm_nondom_pred', label: 'Resultado Previsto - Mão Não Dominante', fieldType: 'number', unit: 'kgf', isRequired: false, helpText: 'Equação de Novaes et al. (2009)' },
  { id: 'fpm_dom_perc', label: '% do Previsto - Mão Dominante', fieldType: 'text', isRequired: false },
  { id: 'fpm_nondom_perc', label: '% do Previsto - Mão Não Dominante', fieldType: 'text', isRequired: false },
  { id: 'fpm_obs', label: 'Observações / Dor / Limitações / Compensações', fieldType: 'long_text', isRequired: false },
  { id: 'fpm_conduct', label: 'Conduta / Metas / Reavaliação', fieldType: 'long_text', isRequired: false },
];

export interface STS1MinNormEntry {
  minAge: number;
  maxAge: number;
  label: string;
  p2_5: number;
  p25: number;
  p50: number;
  p75: number;
  p97_5: number;
}

export const STRASSMANN_STS_MEN: STS1MinNormEntry[] = [
  { minAge: 20, maxAge: 24, label: '20-24 anos', p2_5: 27, p25: 41, p50: 50, p75: 57, p97_5: 72 },
  { minAge: 25, maxAge: 29, label: '25-29 anos', p2_5: 29, p25: 40, p50: 48, p75: 56, p97_5: 74 },
  { minAge: 30, maxAge: 34, label: '30-34 anos', p2_5: 28, p25: 40, p50: 47, p75: 56, p97_5: 72 },
  { minAge: 35, maxAge: 39, label: '35-39 anos', p2_5: 27, p25: 38, p50: 47, p75: 58, p97_5: 72 },
  { minAge: 40, maxAge: 44, label: '40-44 anos', p2_5: 25, p25: 37, p50: 45, p75: 53, p97_5: 69 },
  { minAge: 45, maxAge: 49, label: '45-49 anos', p2_5: 25, p25: 35, p50: 44, p75: 52, p97_5: 70 },
  { minAge: 50, maxAge: 54, label: '50-54 anos', p2_5: 24, p25: 35, p50: 42, p75: 53, p97_5: 67 },
  { minAge: 55, maxAge: 59, label: '55-59 anos', p2_5: 22, p25: 33, p50: 41, p75: 48, p97_5: 63 },
  { minAge: 60, maxAge: 64, label: '60-64 anos', p2_5: 20, p25: 31, p50: 37, p75: 46, p97_5: 63 },
  { minAge: 65, maxAge: 69, label: '65-69 anos', p2_5: 20, p25: 29, p50: 35, p75: 44, p97_5: 60 },
  { minAge: 70, maxAge: 74, label: '70-74 anos', p2_5: 19, p25: 27, p50: 32, p75: 40, p97_5: 59 },
  { minAge: 75, maxAge: 120, label: '75-79 anos', p2_5: 16, p25: 25, p50: 30, p75: 37, p97_5: 56 },
];

export const STRASSMANN_STS_WOMEN: STS1MinNormEntry[] = [
  { minAge: 20, maxAge: 24, label: '20-24 anos', p2_5: 31, p25: 39, p50: 47, p75: 55, p97_5: 70 },
  { minAge: 25, maxAge: 29, label: '25-29 anos', p2_5: 30, p25: 40, p50: 47, p75: 54, p97_5: 68 },
  { minAge: 30, maxAge: 34, label: '30-34 anos', p2_5: 27, p25: 37, p50: 45, p75: 51, p97_5: 68 },
  { minAge: 35, maxAge: 39, label: '35-39 anos', p2_5: 25, p25: 37, p50: 42, p75: 50, p97_5: 63 },
  { minAge: 40, maxAge: 44, label: '40-44 anos', p2_5: 26, p25: 35, p50: 41, p75: 48, p97_5: 65 },
  { minAge: 45, maxAge: 49, label: '45-49 anos', p2_5: 25, p25: 35, p50: 41, p75: 50, p97_5: 63 },
  { minAge: 50, maxAge: 54, label: '50-54 anos', p2_5: 23, p25: 33, p50: 39, p75: 47, p97_5: 60 },
  { minAge: 55, maxAge: 59, label: '55-59 anos', p2_5: 21, p25: 30, p50: 36, p75: 43, p97_5: 61 },
  { minAge: 60, maxAge: 64, label: '60-64 anos', p2_5: 20, p25: 28, p50: 34, p75: 40, p97_5: 55 },
  { minAge: 65, maxAge: 69, label: '65-69 anos', p2_5: 19, p25: 27, p50: 33, p75: 40, p97_5: 53 },
  { minAge: 70, maxAge: 74, label: '70-74 anos', p2_5: 17, p25: 25, p50: 30, p75: 36, p97_5: 51 },
  { minAge: 75, maxAge: 120, label: '75-79 anos', p2_5: 13, p25: 22, p50: 27, p75: 30, p97_5: 43 },
];

export interface STS1MinCalculationResult {
  repetitions: number;
  ageGroup: string;
  p2_5: number;
  p25: number;
  p50: number;
  p75: number;
  p97_5: number;
  percentageOfMedian: number;
  percentileRank: string;
  classification: string;
  badgeBg: string;
  isBelowLowerLimit: boolean;
}

export function calculateSTS1MinNorms(params: {
  gender: 'Masculino' | 'Feminino' | 'M' | 'F' | 'male' | 'female' | string | number;
  age: number;
  repetitions: number;
}): STS1MinCalculationResult {
  const { gender, age = 50, repetitions = 0 } = params;
  const isMale =
    gender === 1 ||
    String(gender).toLowerCase().startsWith('m') ||
    String(gender).toLowerCase().includes('masc');

  const table = isMale ? STRASSMANN_STS_MEN : STRASSMANN_STS_WOMEN;
  const cleanAge = Math.max(age, 20);

  const matched =
    table.find((e) => cleanAge >= e.minAge && cleanAge <= e.maxAge) ||
    table[table.length - 1];

  const percMedian =
    matched.p50 > 0
      ? parseFloat(((repetitions / matched.p50) * 100).toFixed(1))
      : 0;

  let percentileRank = '---';
  let classification = 'Aguardando realização do teste';
  let badgeBg = 'bg-slate-700 text-slate-200';
  let isBelowLowerLimit = false;

  if (repetitions > 0) {
    if (repetitions >= matched.p97_5) {
      percentileRank = '≥ P97,5';
      classification = `Excelente Desempenho / Muito Acima da Média (≥ P97,5: ${matched.p97_5} reps)`;
      badgeBg = 'bg-emerald-600 text-white';
    } else if (repetitions >= matched.p75) {
      percentileRank = 'P75 a P97,5';
      classification = `Desempenho Acima da Média (P75 a P97,5 • Faixa: ${matched.p75}-${matched.p97_5} reps)`;
      badgeBg = 'bg-teal-600 text-white';
    } else if (repetitions >= matched.p25) {
      percentileRank = 'P25 a P75 (Normal)';
      classification = `Desempenho Normal / Esperado (P25 a P75 • Mediana P50: ${matched.p50} reps)`;
      badgeBg = 'bg-blue-600 text-white';
    } else if (repetitions >= matched.p2_5) {
      percentileRank = 'P2,5 a P25';
      classification = `Desempenho Abaixo da Média (P2,5 a P25 • Limite Inferior: ${matched.p2_5} reps)`;
      badgeBg = 'bg-amber-600 text-white';
    } else {
      percentileRank = '< P2,5 (Muito Reduzido)';
      classification = `Desempenho Muito Abaixo do Esperado (< P2,5 • Limite Inferior: ${matched.p2_5} reps)`;
      badgeBg = 'bg-rose-600 text-white';
      isBelowLowerLimit = true;
    }
  }

  return {
    repetitions,
    ageGroup: matched.label,
    p2_5: matched.p2_5,
    p25: matched.p25,
    p50: matched.p50,
    p75: matched.p75,
    p97_5: matched.p97_5,
    percentageOfMedian: percMedian,
    percentileRank,
    classification,
    badgeBg,
    isBelowLowerLimit,
  };
}

export const getSTS1MinFields = (): CustomField[] => [
  { id: 'sts_reps', label: 'Repetições Realizadas (1 min)', fieldType: 'number', unit: 'reps', isRequired: true, helpText: 'Número total de repetições completas em 60 segundos' },
  { id: 'sts_p50', label: 'Mediana Prevista (p50)', fieldType: 'number', unit: 'reps', isRequired: false, helpText: 'Valor de referência populacional (Strassmann et al., 2013)' },
  { id: 'sts_perc_p50', label: '% da Mediana (p50)', fieldType: 'text', isRequired: false },
  { id: 'sts_percentile_rank', label: 'Percentil Atingido', fieldType: 'text', isRequired: false },
  { id: 'sts_classification', label: 'Classificação Funcional', fieldType: 'text', isRequired: false },
  { id: 'sts_p2_5', label: 'Limite Inferior da Normalidade (p2,5)', fieldType: 'number', unit: 'reps', isRequired: false },
  { id: 'sts_spo2_basal', label: 'SpO2 Basal', fieldType: 'number', unit: '%', isRequired: false },
  { id: 'sts_fc_basal', label: 'FC Basal', fieldType: 'number', unit: 'bpm', isRequired: false },
  { id: 'sts_pa_basal', label: 'PA Basal', fieldType: 'text', isRequired: false },
  { id: 'sts_borg_dispneia_basal', label: 'Dispneia Basal (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: false },
  { id: 'sts_borg_fadiga_basal', label: 'Fadiga Basal (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: false },
  { id: 'sts_spo2_final', label: 'SpO2 Final', fieldType: 'number', unit: '%', isRequired: false },
  { id: 'sts_fc_final', label: 'FC Final', fieldType: 'number', unit: 'bpm', isRequired: false },
  { id: 'sts_pa_final', label: 'PA Final', fieldType: 'text', isRequired: false },
  { id: 'sts_borg_dispneia_final', label: 'Dispneia Final (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: false },
  { id: 'sts_borg_fadiga_final', label: 'Fadiga Final (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: false },
  { id: 'sts_pauses', label: 'Pausas Realizadas', fieldType: 'text', helpText: 'Ex: Nenhuma pausa ou 1 pausa de 5 segundos', isRequired: false },
  { id: 'sts_obs', label: 'Observações / Sintomas / Intercorrências', fieldType: 'long_text', isRequired: false },
  { id: 'sts_reference', label: 'Referência Bibliográfica', fieldType: 'text', helpText: 'Strassmann et al. (2013) • Int J Public Health', isRequired: false },
];

export interface MoCADomainScores {
  visuospatialExecutive: number; // 0 a 5
  naming: number; // 0 a 3
  attention: number; // 0 a 6
  language: number; // 0 a 3
  abstraction: number; // 0 a 2
  delayedRecall: number; // 0 a 5
  orientation: number; // 0 a 6
}

export interface MoCACalculationResult {
  rawScore: number;
  educationBonus: number;
  totalScore: number;
  educationYears?: number;
  domains: MoCADomainScores;
  classification: string;
  badgeBg: string;
  clinicalNote: string;
}

export function calculateMoCAScore(
  answers: Record<string, any>,
  educationYears?: number
): MoCACalculationResult {
  const isChecked = (key: string) => {
    const val = answers[key];
    return val === true || val === 1 || val === '1' || val === 'Sim' || val === 'Acertou' || val === 'Correto';
  };

  // 1. Visuoespacial / Executiva (0 a 5)
  let visuo = 0;
  if (isChecked('moca_trail') || isChecked('Trilha Alternada (1-A-2-B-3-C-4-D-5-E)')) visuo += 1;
  if (isChecked('moca_cube') || isChecked('Cópia do Cubo')) visuo += 1;
  if (isChecked('moca_clock_contour') || isChecked('Relógio - Contorno')) visuo += 1;
  if (isChecked('moca_clock_numbers') || isChecked('Relógio - Números')) visuo += 1;
  if (isChecked('moca_clock_hands') || isChecked('Relógio - Ponteiros (11:10)')) visuo += 1;

  // 2. Nomeação (0 a 3)
  let naming = 0;
  if (isChecked('moca_lion') || isChecked('Nomeação - Leão')) naming += 1;
  if (isChecked('moca_rhino') || isChecked('Nomeação - Rinoceronte')) naming += 1;
  if (isChecked('moca_camel') || isChecked('Nomeação - Camelo/Dromedário')) naming += 1;

  // 3. Atenção (0 a 6)
  let attention = 0;
  if (isChecked('moca_digits_forward') || isChecked('Dígitos Ordem Direta (2-1-8-5-4)')) attention += 1;
  if (isChecked('moca_digits_backward') || isChecked('Dígitos Ordem Inversa (7-4-2)')) attention += 1;
  if (isChecked('moca_vigilance_a') || isChecked('Vigilância - Bater na Letra A (≤ 1 erro)')) attention += 1;

  // Subtração seriada de 7 (100 -> 93, 86, 79, 72, 65)
  let serialSubs = 0;
  if (isChecked('moca_sub_93') || isChecked('Subtração 100-7=93')) serialSubs += 1;
  if (isChecked('moca_sub_86') || isChecked('Subtração 93-7=86')) serialSubs += 1;
  if (isChecked('moca_sub_79') || isChecked('Subtração 86-7=79')) serialSubs += 1;
  if (isChecked('moca_sub_72') || isChecked('Subtração 79-7=72')) serialSubs += 1;
  if (isChecked('moca_sub_65') || isChecked('Subtração 72-7=65')) serialSubs += 1;

  if (answers['moca_serial_subtractions'] !== undefined) {
    serialSubs = Number(answers['moca_serial_subtractions']) || 0;
  }
  let subScore = 0;
  if (serialSubs >= 4) subScore = 3;
  else if (serialSubs >= 2) subScore = 2;
  else if (serialSubs === 1) subScore = 1;
  attention += subScore;

  // 4. Linguagem (0 a 3)
  let language = 0;
  if (isChecked('moca_sentence_1') || isChecked('Repetição Frase 1 (João)')) language += 1;
  if (isChecked('moca_sentence_2') || isChecked('Repetição Frase 2 (Gato/Cachorro)')) language += 1;
  if (isChecked('moca_fluency_f') || isChecked('Fluência Verbal Letra F (≥ 11 palavras/min)')) language += 1;

  // 5. Abstração (0 a 2)
  let abstraction = 0;
  if (isChecked('moca_abs_transport') || isChecked('Abstração - Trem/Bicicleta (Transporte)')) abstraction += 1;
  if (isChecked('moca_abs_measure') || isChecked('Abstração - Relógio/Régua (Medida)')) abstraction += 1;

  // 6. Evocação Tardia (0 a 5) - Recordação SEM PISTAS
  let delayedRecall = 0;
  if (isChecked('moca_recall_face') || isChecked('Evocação - Rosto')) delayedRecall += 1;
  if (isChecked('moca_recall_velvet') || isChecked('Evocação - Veludo')) delayedRecall += 1;
  if (isChecked('moca_recall_church') || isChecked('Evocação - Igreja')) delayedRecall += 1;
  if (isChecked('moca_recall_daisy') || isChecked('Evocação - Margarida')) delayedRecall += 1;
  if (isChecked('moca_recall_red') || isChecked('Evocação - Vermelho')) delayedRecall += 1;

  // 7. Orientação (0 a 6)
  let orientation = 0;
  if (isChecked('moca_orient_day') || isChecked('Orientação - Dia do Mês')) orientation += 1;
  if (isChecked('moca_orient_month') || isChecked('Orientação - Mês')) orientation += 1;
  if (isChecked('moca_orient_year') || isChecked('Orientação - Ano')) orientation += 1;
  if (isChecked('moca_orient_weekday') || isChecked('Orientação - Dia da Semana')) orientation += 1;
  if (isChecked('moca_orient_place') || isChecked('Orientação - Lugar')) orientation += 1;
  if (isChecked('moca_orient_city') || isChecked('Orientação - Cidade')) orientation += 1;

  const rawScore = visuo + naming + attention + language + abstraction + delayedRecall + orientation;

  // Ajuste por Escolaridade (se escolaridade <= 12 anos, adiciona +1 ponto até teto 30)
  const edYears =
    educationYears !== undefined
      ? educationYears
      : answers['moca_education_years'] !== undefined
      ? Number(answers['moca_education_years'])
      : answers['Anos de Escolaridade'] !== undefined
      ? Number(answers['Anos de Escolaridade'])
      : 12;

  const educationBonus = edYears <= 12 && rawScore < 30 && rawScore > 0 ? 1 : 0;
  const totalScore = Math.min(30, rawScore + educationBonus);

  let classification = 'Aguardando avaliação';
  let badgeBg = 'bg-slate-700 text-slate-200';
  let clinicalNote = '';

  if (rawScore > 0 || totalScore > 0) {
    if (totalScore >= 26) {
      classification = 'Função Cognitiva Normal / Preservada (≥ 26/30)';
      badgeBg = 'bg-emerald-600 text-white';
      clinicalNote = 'Desempenho cognitivo global preservado dentro dos limites da normalidade.';
    } else if (totalScore >= 18) {
      classification = 'Sugestivo de Comprometimento Cognitivo Leve - CCL (18 a 25/30)';
      badgeBg = 'bg-amber-600 text-white';
      clinicalNote = 'Pontuação abaixo do ponto de corte (26/30). Indica risco de Comprometimento Cognitivo Leve (CCL / MCI).';
    } else if (totalScore >= 10) {
      classification = 'Comprometimento Cognitivo Moderado (10 a 17/30)';
      badgeBg = 'bg-orange-600 text-white';
      clinicalNote = 'Declínio multidomínio moderado sugestivo de quadro demencial em fase leve a moderada.';
    } else {
      classification = 'Comprometimento Cognitivo Severo (< 10/30)';
      badgeBg = 'bg-rose-600 text-white';
      clinicalNote = 'Comprometimento cognitivo difuso severo com importante perda de autonomia.';
    }
  }

  return {
    rawScore,
    educationBonus,
    totalScore,
    educationYears: edYears,
    domains: {
      visuospatialExecutive: visuo,
      naming,
      attention,
      language,
      abstraction,
      delayedRecall,
      orientation,
    },
    classification,
    badgeBg,
    clinicalNote,
  };
}

export const getMoCAFields = (): CustomField[] => [
  { id: 'moca_total_score', label: 'Escore Total MoCA', fieldType: 'number', unit: '/30', isRequired: false },
  { id: 'moca_classification', label: 'Classificação Cognitiva', fieldType: 'text', isRequired: false },
  { id: 'moca_education_years', label: 'Anos de Escolaridade', fieldType: 'number', helpText: 'Se ≤ 12 anos, adiciona +1 ponto automático', isRequired: false },
  { id: 'moca_visuo_subscore', label: 'Visuoespacial / Executiva', fieldType: 'text', helpText: 'Pontuação: 0 a 5', isRequired: false },
  { id: 'moca_naming_subscore', label: 'Nomeação', fieldType: 'text', helpText: 'Pontuação: 0 a 3', isRequired: false },
  { id: 'moca_attention_subscore', label: 'Atenção', fieldType: 'text', helpText: 'Pontuação: 0 a 6', isRequired: false },
  { id: 'moca_language_subscore', label: 'Linguagem', fieldType: 'text', helpText: 'Pontuação: 0 a 3', isRequired: false },
  { id: 'moca_abstraction_subscore', label: 'Abstração', fieldType: 'text', helpText: 'Pontuação: 0 a 2', isRequired: false },
  { id: 'moca_delayed_recall_subscore', label: 'Evocação Tardia', fieldType: 'text', helpText: 'Pontuação: 0 a 5', isRequired: false },
  { id: 'moca_orientation_subscore', label: 'Orientação', fieldType: 'text', helpText: 'Pontuação: 0 a 6', isRequired: false },
  { id: 'moca_observations', label: 'Observações Cognitivas / Comportamentais', fieldType: 'long_text', isRequired: false },
  { id: 'moca_reference', label: 'Referência', fieldType: 'text', helpText: 'MoCA - Versão Experimental Brasileira (UNIFESP-SP 2007) • Nasreddine et al. (2005)', isRequired: false },
];

const freqPSQIOptions = [
  '0 - Nenhuma no último mês',
  '1 - Menos de uma vez por semana',
  '2 - Uma ou duas vezes por semana',
  '3 - Três ou mais vezes na semana',
];

const makeGoniometriaFields = (joint: string): CustomField[] => {
  const fields: CustomField[] = [];
  const addMovement = (name: string, helpText: string) => {
    fields.push({ id: `g_${Date.now()}_${Math.random()}`, label: `${name} - Direito`, fieldType: 'number', unit: '°', isRequired: false, helpText });
    fields.push({ id: `g_${Date.now()}_${Math.random()}`, label: `${name} - Esquerdo`, fieldType: 'number', unit: '°', isRequired: false, helpText });
  };

  if (joint === 'Ombro') {
    addMovement('Flexão', 'Ref: 0° a 180°');
    addMovement('Extensão', 'Ref: 0° a 60°');
    addMovement('Abdução', 'Ref: 0° a 180°');
    addMovement('Adução', 'Ref: 0° a 50°');
    addMovement('Rotação Interna', 'Ref: 0° a 70°');
    addMovement('Rotação Externa', 'Ref: 0° a 90°');
  } else if (joint === 'Cervical') {
    fields.push({ id: `g_${Date.now()}_1`, label: 'Flexão (Cervical)', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 45°' });
    fields.push({ id: `g_${Date.now()}_2`, label: 'Extensão (Cervical)', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 45°' });
    fields.push({ id: `g_${Date.now()}_3`, label: 'Inclinação Lateral Dir.', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 45°' });
    fields.push({ id: `g_${Date.now()}_4`, label: 'Inclinação Lateral Esq.', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 45°' });
    fields.push({ id: `g_${Date.now()}_5`, label: 'Rotação Dir.', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 60°' });
    fields.push({ id: `g_${Date.now()}_6`, label: 'Rotação Esq.', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 60°' });
  } else if (joint === 'Cotovelo e Antebraço') {
    addMovement('Flexão (Cotovelo)', 'Ref: 0° a 150°');
    addMovement('Extensão (Cotovelo)', 'Ref: 0° (ou hiper)');
    addMovement('Pronação', 'Ref: 0° a 90°');
    addMovement('Supinação', 'Ref: 0° a 90°');
  } else if (joint === 'Punho') {
    addMovement('Flexão (Punho)', 'Ref: 0° a 80°');
    addMovement('Extensão (Punho)', 'Ref: 0° a 70°');
    addMovement('Desvio Ulnar', 'Ref: 0° a 30°');
    addMovement('Desvio Radial', 'Ref: 0° a 20°');
  } else if (joint === 'Quadril') {
    addMovement('Flexão (Quadril)', 'Ref: 0° a 120°');
    addMovement('Extensão (Quadril)', 'Ref: 0° a 30°');
    addMovement('Abdução (Quadril)', 'Ref: 0° a 45°');
    addMovement('Adução (Quadril)', 'Ref: 0° a 30°');
    addMovement('Rotação Interna (Quadril)', 'Ref: 0° a 45°');
    addMovement('Rotação Externa (Quadril)', 'Ref: 0° a 45°');
  } else if (joint === 'Joelho') {
    addMovement('Flexão (Joelho)', 'Ref: 0° a 135°');
    addMovement('Extensão (Joelho)', 'Ref: 0° (ou hiper)');
  } else if (joint === 'Tornozelo') {
    addMovement('Flexão Plantar', 'Ref: 0° a 50°');
    addMovement('Dorsiflexão', 'Ref: 0° a 20°');
    addMovement('Inversão', 'Ref: 0° a 35°');
    addMovement('Eversão', 'Ref: 0° a 15°');
  }

  fields.push({ id: `g_${Date.now()}_obs`, label: 'Observações / Sintomas', fieldType: 'long_text', isRequired: false, helpText: 'Anotar dor, fim de curso (end-feel) anormal, etc.' });
  return fields;
};

export const getNIHSSFields = (): CustomField[] => [
  {
    id: 1,
    label: '1a. Nível de Consciência (LOC)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Alerta (responde prontamente)',
      '1 - Sonolento (desperta com mínima estimulação verbal/tátil)',
      '2 - Torporoso (requer estimulação vigorosa ou dolorosa)',
      '3 - Coma / Irresponsivo (apenas resposta reflexa ou flácido/arreflexo)',
    ],
    helpText: 'Estado de alerta e vigília geral. Pontue 3 apenas se não houver resposta voluntária.',
  },
  {
    id: 2,
    label: '1b. Perguntas de Nível de Consciência (Mês e Idade)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Responde ambas corretamente (mês e idade)',
      '1 - Responde uma corretamente (ou intubado, disartria grave, barreira linguística)',
      '2 - Erra ambas as perguntas (ou afasia grave/estupor)',
    ],
    helpText: 'Perguntar o mês atual e a idade. Avalia orientação verbal (apenas a resposta inicial).',
  },
  {
    id: 3,
    label: '1c. Comandos de Nível de Consciência (Olhos e Mão)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Realiza ambas as tarefas corretamente',
      '1 - Realiza uma tarefa corretamente',
      '2 - Não realiza nenhuma tarefa corretamente',
    ],
    helpText: 'Solicitar abrir/fechar os olhos e depois abrir/fechar a mão não parética.',
  },
  {
    id: 4,
    label: '2. Melhor Olhar Conjugado',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Normal (movimentos oculares horizontais preservados)',
      '1 - Paralisia parcial do olhar (olhar anormal em 1 ou ambos os olhos)',
      '2 - Desvio forçado do olhar ou paralisia total (não vencida por manobra óculo-cefálica)',
    ],
    helpText: 'Avalia apenas movimentos oculares horizontais voluntários ou reflexos.',
  },
  {
    id: 5,
    label: '3. Campo Visual (Campimetria)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Sem perda visual (normal)',
      '1 - Hemianopsia parcial (ou assimetria/quadrantanopsia evidente)',
      '2 - Hemianopsia completa',
      '3 - Hemianopsia bilateral (cegueira bilateral ou cortical)',
    ],
    helpText: 'Testar por confrontação nos 4 quadrantes (contagem de dedos ou ameaça visual).',
  },
  {
    id: 6,
    label: '4. Paralisia Facial',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Movimentos normais e simétricos',
      '1 - Paralisia leve (apagamento do sulco nasolabial, assimetria ao sorrir)',
      '2 - Paralisia facial central evidente (paresia acentuada da região inferior da face)',
      '3 - Paralisia facial completa (ausência total de movimentos faciais superior e inferior)',
    ],
    helpText: 'Pedir para sorrir/mostrar dentes, elevar sobrancelhas e fechar os olhos com força.',
  },
  {
    id: 7,
    label: '5a. Motor - Braço Esquerdo',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Sem queda (mantém o braço a 90° sentado ou 45° deitado por 10s)',
      '1 - Queda antes de 10s (mantém inicialmente, mas cai sem tocar a cama)',
      '2 - Algum esforço contra gravidade (não atinge/sustenta 90°/45°, cai na cama)',
      '3 - Nenhum esforço contra gravidade (braço despenca imediatamente)',
      '4 - Nenhum movimento (paralisia completa)',
      'NT - Não-testável (amputação ou fusão articular)',
    ],
    helpText: 'Extensão do braço esquerdo a 90° (sentado) ou 45° (deitado) por 10 segundos.',
  },
  {
    id: 8,
    label: '5b. Motor - Braço Direito',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Sem queda (mantém o braço a 90° sentado ou 45° deitado por 10s)',
      '1 - Queda antes de 10s (mantém inicialmente, mas cai sem tocar a cama)',
      '2 - Algum esforço contra gravidade (não atinge/sustenta 90°/45°, cai na cama)',
      '3 - Nenhum esforço contra gravidade (braço despenca imediatamente)',
      '4 - Nenhum movimento (paralisia completa)',
      'NT - Não-testável (amputação ou fusão articular)',
    ],
    helpText: 'Extensão do braço direito a 90° (sentado) ou 45° (deitado) por 10 segundos.',
  },
  {
    id: 9,
    label: '6a. Motor - Perna Esquerda',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Sem queda (mantém a perna a 30° em decúbito dorsal por 5s)',
      '1 - Queda antes de 5s (mantém inicialmente, mas cai sem tocar o leito)',
      '2 - Algum esforço contra gravidade (não atinge/sustenta 30°, cai na cama)',
      '3 - Nenhum esforço contra gravidade (perna despenca imediatamente)',
      '4 - Nenhum movimento (paralisia completa)',
      'NT - Não-testável (amputação ou fusão articular)',
    ],
    helpText: 'Elevação da perna esquerda a 30° em decúbito dorsal por 5 segundos.',
  },
  {
    id: 10,
    label: '6b. Motor - Perna Direita',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Sem queda (mantém a perna a 30° em decúbito dorsal por 5s)',
      '1 - Queda antes de 5s (mantém inicialmente, mas cai sem tocar o leito)',
      '2 - Algum esforço contra gravidade (não atinge/sustenta 30°, cai na cama)',
      '3 - Nenhum esforço contra gravidade (perna despenca imediatamente)',
      '4 - Nenhum movimento (paralisia completa)',
      'NT - Não-testável (amputação ou fusão articular)',
    ],
    helpText: 'Elevação da perna direita a 30° em decúbito dorsal por 5 segundos.',
  },
  {
    id: 11,
    label: '7. Ataxia Apendicular (Coordenação)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Ausente (coordenação normal ou sem ataxia desproporcional à fraqueza)',
      '1 - Presente em 1 membro (ataxia em braço ou perna)',
      '2 - Presente em 2 membros (ataxia em braço e perna ou bilateral)',
      'NT - Não-testável (amputação ou rigidez articular)',
    ],
    helpText: 'Provas índex-nariz e calcanhar-joelho bilaterais (lesão cerebelar).',
  },
  {
    id: 12,
    label: '8. Sensibilidade (Dor / Tato Superficial)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Normal (sensibilidade preservada)',
      '1 - Perda sensitiva leve a moderada (sensibilidade diminuída no lado afetado)',
      '2 - Perda sensitiva grave ou total (não sente o toque / torporoso / coma)',
    ],
    helpText: 'Estímulo doloroso com toque/beliscamento comparando ambos os lados do corpo.',
  },
  {
    id: 13,
    label: '9. Melhor Linguagem (Afasia)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Normal (sem afasia, boa fluência e compreensão)',
      '1 - Afasia leve a moderada (alguma perda de fluência/compreensão, conversa viável)',
      '2 - Afasia grave (comunicação muito fragmentada, examinador infere respostas)',
      '3 - Mudo / Afasia global (nenhuma fala útil ou compreensão / coma)',
    ],
    helpText: 'Sentenças: "Você sabe como fazer." | "De volta pra casa." | "Eu cheguei em casa do trabalho." Nomear figuras: Carro, Cavalo, Bananas, Cadeira, Tesoura, Árvore.',
  },
  {
    id: 14,
    label: '10. Disartria (Articulação da Fala)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Normal (articulação nítida)',
      '1 - Disartria leve a moderada (arrasta palavras, porém compreensível)',
      '2 - Disartria grave (fala ininteligível / anartria / mudo de causa motora)',
      'NT - Não-testável (intubado ou barreira física mecânica)',
    ],
    helpText: 'Palavras de teste: "Mamãe", "Tic-Tac", "Paralelo", "Obrigado", "Estrada de ferro", "Jogador de futebol".',
  },
  {
    id: 15,
    label: '11. Extinção ou Desatenção (Hemi-negligência)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      '0 - Nenhuma desatenção (normal)',
      '1 - Desatenção em 1 modalidade (visual, tátil, auditiva ou espacial)',
      '2 - Hemi-desatenção profunda (mais de uma modalidade, não reconhece a própria mão)',
    ],
    helpText: 'Estimulação sensorial simultânea dupla e percepção do hemicorpo.',
  },
  {
    id: 16,
    label: 'Observações Clínicas / Intercorrências (NIHSS)',
    fieldType: 'long_text',
    isRequired: false,
    helpText: 'Anotações sobre itens não-testáveis (NT), evolução do déficit ou observações clínicas adicionais.',
  },
];

export function calculateNIHSSScore(answers: Record<string, any>): { score: number; answeredCount: number } {
  let score = 0;
  let answeredCount = 0;

  const nihssPrefixes = [
    '1a.', '1b.', '1c.', '2.', '3.', '4.', '5a.', '5b.', '6a.', '6b.', '7.', '8.', '9.', '10.', '11.'
  ];

  Object.entries(answers || {}).forEach(([key, val]) => {
    if (!val || typeof val !== 'string') return;
    const isNIHSSField = nihssPrefixes.some((prefix) => key.trim().startsWith(prefix));
    if (isNIHSSField) {
      answeredCount++;
      if (!val.trim().toUpperCase().startsWith('NT')) {
        const digit = parseInt(val.trim().split(' ')[0], 10);
        if (!isNaN(digit)) {
          score += digit;
        }
      }
    }
  });

  return { score, answeredCount };
}

export function getNIHSSBadge(score: number): { label: string; bg: string; description: string } {
  if (score === 0) {
    return { label: '0 pts - Sem AVC / Normal', bg: 'bg-emerald-600 text-white', description: 'Sem déficit neurológico mensurável' };
  }
  if (score <= 4) {
    return { label: `${score} pts - AVC Leve`, bg: 'bg-blue-600 text-white', description: 'Déficit neurológico leve (Minor Stroke)' };
  }
  if (score <= 15) {
    return { label: `${score} pts - AVC Moderado`, bg: 'bg-amber-500 text-white', description: 'Déficit neurológico moderado' };
  }
  if (score <= 20) {
    return { label: `${score} pts - AVC Moderado a Grave`, bg: 'bg-orange-600 text-white', description: 'Déficit neurológico moderado a severo' };
  }
  return { label: `${score} pts - AVC Grave`, bg: 'bg-red-600 text-white', description: 'Déficit neurológico grave / extenso (Severe Stroke)' };
}

export const prep2ShoulderMRC = [
  '5 - Normal (vence gravidade e resistência máxima plena)',
  '4 - Vence gravidade e resistência moderada',
  '3 - Vence a gravidade (abdução ativa a 90°), sem resistência',
  '2 - Movimento ativo com gravidade eliminada (em plano horizontal)',
  '1 - Contração muscular visível ou palpável, sem movimento articular',
  '0 - Sem contração muscular detectável (plegia completa)',
];

export const prep2FingerMRC = [
  '5 - Normal (extensão completa de todos os dedos contra resistência plena)',
  '4 - Extensão ativa completa contra resistência moderada',
  '3 - Extensão ativa completa dos dedos contra gravidade',
  '2 - Movimento ativo com gravidade eliminada (plano neutro)',
  '1 - Contração visível ou palpável dos extensores dos dedos, sem movimento útil',
  '0 - Sem contração detectável nos extensores dos dedos (plegia completa)',
];

export const getPREP2Fields = (): CustomField[] => [
  {
    id: 'prep2_side',
    label: 'Hemicorpo / Dimídio Acometido',
    fieldType: 'single_select',
    isRequired: false,
    options: ['Membro Superior Direito', 'Membro Superior Esquerdo', 'Bilateral'],
    helpText: 'Identificação do dimídio parético avaliado no algoritmo PREP2.',
  },
  {
    id: 'prep2_timing',
    label: 'Janela Temporal pós-AVC',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      'Primeiros 3 dias (≤ 72 horas) - Janela Padrão do Algoritmo PREP2',
      '4 a 7 dias pós-AVC',
      'Subagudo (> 7 dias)',
    ],
    helpText: 'A predição PREP2 é clinicamente validada nas primeiras 72h após o ictus do AVC.',
  },
  {
    id: 'prep2_safe_shoulder',
    label: '1. Abdução do Ombro (Escala MRC 0 a 5)',
    fieldType: 'single_select',
    isRequired: false,
    options: prep2ShoulderMRC,
    helpText: 'Componente "S" do SAFE: Força de abdução do ombro parético pela escala MRC (0 a 5 pts).',
  },
  {
    id: 'prep2_safe_finger',
    label: '2. Extensão dos Dedos (Escala MRC 0 a 5)',
    fieldType: 'single_select',
    isRequired: false,
    options: prep2FingerMRC,
    helpText: 'Componente "AFE" do SAFE: Força de extensão dos dedos paréticos pela escala MRC (0 a 5 pts).',
  },
  {
    id: 'prep2_age_group',
    label: '3. Faixa Etária do Paciente',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      'Idade < 80 anos (Menor de 80 anos)',
      'Idade ≥ 80 anos (80 anos ou mais)',
    ],
    helpText: 'Critério de estratificação do algoritmo PREP2 quando SAFE ≥ 5.',
  },
  {
    id: 'prep2_age_num',
    label: '4. Idade Cronológica (Anos)',
    fieldType: 'number',
    unit: 'anos',
    isRequired: false,
    helpText: 'Idade cronológica em anos completos do paciente.',
  },
  {
    id: 'prep2_mep',
    label: '5. Potencial Evocado Motor - TMS / MEP (Biomarcador)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      'Não aplicável / Não realizado (SAFE ≥ 5 - Excelente Prognóstico)',
      'MEP Presente (MEP+) - Resposta motora evocada positiva via EMT',
      'MEP Ausente (MEP-) - Sem resposta motora evocada via EMT',
    ],
    helpText: 'Biomarcador via Estimulação Magnética Transcraniana (EMT/TMS) indicado se SAFE < 5.',
  },
  {
    id: 'prep2_nihss_group',
    label: '6. Gravidade Global pelo NIHSS (Se MEP Ausente)',
    fieldType: 'single_select',
    isRequired: false,
    options: [
      'Não aplicável (SAFE ≥ 5 ou MEP+)',
      'NIHSS < 7 pontos (AVC Leve / Comprometimento moderado)',
      'NIHSS ≥ 7 pontos (AVC Moderado a Grave)',
    ],
    helpText: 'Estratificação do NIHSS necessária quando SAFE < 5 e o MEP for ausente (MEP-).',
  },
  {
    id: 'prep2_nihss_num',
    label: '7. Escore Total do NIHSS (Valor Numérico)',
    fieldType: 'number',
    unit: 'pts',
    isRequired: false,
    helpText: 'Insira o escore total do NIHSS (0 a 42 pts), se a escala tiver sido realizada.',
  },
  {
    id: 'prep2_notes',
    label: '8. Planejamento Fisioterapêutico e Metas a 3 Meses',
    fieldType: 'long_text',
    isRequired: false,
    helpText: 'Diretrizes do plano terapêutico, metas motoras para 3 meses e orientações à família/cuidador.',
  },
];

export interface PREP2Result {
  safeScore: number;
  shoulderScore: number | null;
  fingerScore: number | null;
  isSafeCalculated: boolean;
  classification: 'EXCELLENT' | 'GOOD' | 'LIMITED' | 'POOR' | 'PENDING';
  title: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  prognosisExpected: string;
  therapyFocus: string;
  decisionPath: string;
}

export function calculatePREP2Score(answers: Record<string, any>, patientAge?: number | string): PREP2Result {
  let shoulderScore: number | null = null;
  let fingerScore: number | null = null;
  let age: number | null = null;
  let ageGroup: '<80' | '>=80' | null = null;
  let mepStatus: 'present' | 'absent' | 'na' | null = null;
  let nihssScore: number | null = null;
  let nihssGroup: '<7' | '>=7' | null = null;

  Object.entries(answers || {}).forEach(([key, val]) => {
    if (val === undefined || val === null || val === '') return;
    const k = key.toLowerCase();
    const vStr = String(val).trim();

    // 1. Abdução de ombro
    if (k.includes('abdução') || k.includes('abducao') || k.includes('shoulder')) {
      const digit = parseInt(vStr.split(' ')[0], 10);
      if (!isNaN(digit)) shoulderScore = digit;
    }
    // 2. Extensão dos dedos
    else if (k.includes('extensão dos dedos') || k.includes('extensao dos dedos') || k.includes('finger')) {
      const digit = parseInt(vStr.split(' ')[0], 10);
      if (!isNaN(digit)) fingerScore = digit;
    }
    // 3. Faixa etária
    else if (k.includes('faixa etária') || k.includes('faixa etaria') || (k.includes('idade') && vStr.includes('80'))) {
      if (vStr.includes('< 80') || vStr.includes('<80')) ageGroup = '<80';
      else if (vStr.includes('≥ 80') || vStr.includes('>= 80') || vStr.includes('>=80')) ageGroup = '>=80';
    }
    // 4. Idade cronológica
    else if (k.includes('idade cronológica') || k.includes('idade cronologica') || k === 'idade') {
      const num = parseInt(vStr, 10);
      if (!isNaN(num)) age = num;
    }
    // 5. MEP / TMS
    else if (k.includes('potencial evocado') || k.includes('mep') || k.includes('tms')) {
      if (vStr.includes('MEP+') || vStr.toLowerCase().includes('presente')) mepStatus = 'present';
      else if (vStr.includes('MEP-') || vStr.toLowerCase().includes('ausente')) mepStatus = 'absent';
      else if (vStr.toLowerCase().includes('não aplicável') || vStr.toLowerCase().includes('nao aplicavel')) mepStatus = 'na';
    }
    // 6. NIHSS grupo ou numérico
    else if (k.includes('nihss') && (vStr.includes('< 7') || vStr.includes('≥ 7') || vStr.includes('>= 7'))) {
      if (vStr.includes('< 7')) nihssGroup = '<7';
      else if (vStr.includes('≥ 7') || vStr.includes('>= 7')) nihssGroup = '>=7';
    } else if (k.includes('nihss') && (k.includes('numérico') || k.includes('numerico') || k.includes('total'))) {
      const num = parseInt(vStr, 10);
      if (!isNaN(num)) nihssScore = num;
    }
  });

  if (age === null && patientAge) {
    const pAge = typeof patientAge === 'string' ? parseInt(patientAge, 10) : patientAge;
    if (!isNaN(pAge) && pAge > 0) age = pAge;
  }
  if (!ageGroup && age !== null) {
    ageGroup = age < 80 ? '<80' : '>=80';
  }
  if (!nihssGroup && nihssScore !== null) {
    nihssGroup = nihssScore < 7 ? '<7' : '>=7';
  }

  const isSafeCalculated = shoulderScore !== null && fingerScore !== null;
  const safeScore = (shoulderScore || 0) + (fingerScore || 0);

  if (!isSafeCalculated) {
    return {
      safeScore,
      shoulderScore,
      fingerScore,
      isSafeCalculated: false,
      classification: 'PENDING',
      title: 'Pendente (Aguardando SAFE)',
      badgeBg: 'bg-slate-700 text-slate-200',
      badgeText: 'text-slate-200',
      badgeBorder: 'border-slate-600',
      prognosisExpected: 'Avalie a força de Abdução do Ombro e Extensão dos Dedos para calcular o escore SAFE (0 a 10).',
      therapyFocus: 'Identificar prontamente o grau de força do membro superior parético nas primeiras 72h.',
      decisionPath: 'Passo 1: Avaliar Abdução do Ombro + Extensão dos Dedos (SAFE 0-10).',
    };
  }

  // CAMINHO A: SAFE >= 5
  if (safeScore >= 5) {
    if (safeScore >= 8) {
      return {
        safeScore,
        shoulderScore,
        fingerScore,
        isSafeCalculated: true,
        classification: 'EXCELLENT',
        title: 'EXCELLENT (Excelente Prognóstico)',
        badgeBg: 'bg-emerald-600 text-white',
        badgeText: 'text-white',
        badgeBorder: 'border-emerald-500',
        prognosisExpected: 'Recuperação quase completa da função motora e destreza do membro superior em até 3 meses. Paciente tenderá a usar a mão afetada rotineiramente nas AVDs.',
        therapyFocus: 'Treino funcional intensivo, tarefas específicas complexas e destreza fina da mão e dedos.',
        decisionPath: `Caminho A: SAFE ≥ 5 (${safeScore}/10) → SAFE ≥ 8 → EXCELLENT`,
      };
    }

    if (ageGroup === '<80') {
      return {
        safeScore,
        shoulderScore,
        fingerScore,
        isSafeCalculated: true,
        classification: 'EXCELLENT',
        title: 'EXCELLENT (Excelente Prognóstico)',
        badgeBg: 'bg-emerald-600 text-white',
        badgeText: 'text-white',
        badgeBorder: 'border-emerald-500',
        prognosisExpected: 'Recuperação quase completa da função motora e destreza do membro superior em até 3 meses.',
        therapyFocus: 'Treino funcional intensivo, tarefas complexas e destreza fina de membros superiores.',
        decisionPath: `Caminho A: SAFE ≥ 5 (${safeScore}/10) + Idade < 80 anos → EXCELLENT`,
      };
    } else if (ageGroup === '>=80') {
      return {
        safeScore,
        shoulderScore,
        fingerScore,
        isSafeCalculated: true,
        classification: 'GOOD',
        title: 'GOOD (Bom Prognóstico)',
        badgeBg: 'bg-blue-600 text-white',
        badgeText: 'text-white',
        badgeBorder: 'border-blue-500',
        prognosisExpected: 'Boa recuperação motora da mão e braço; poderá persistir leve fraqueza ou lentidão de movimentos. Paciente usará o membro para quase todas as AVDs.',
        therapyFocus: 'Fortalecimento muscular, coordenação motora e prática intensiva de uso do membro nas AVDs.',
        decisionPath: `Caminho A: SAFE 5-7 (${safeScore}/10) + Idade ≥ 80 anos → GOOD`,
      };
    } else {
      return {
        safeScore,
        shoulderScore,
        fingerScore,
        isSafeCalculated: true,
        classification: 'PENDING',
        title: `SAFE ${safeScore}/10 (Confirme Idade)`,
        badgeBg: 'bg-indigo-600 text-white',
        badgeText: 'text-white',
        badgeBorder: 'border-indigo-500',
        prognosisExpected: `SAFE = ${safeScore}/10: Prognóstico EXCELLENT se idade < 80 anos, ou GOOD se idade ≥ 80 anos.`,
        therapyFocus: 'Selecione a faixa etária do paciente para consolidar a predição PREP2.',
        decisionPath: `Caminho A: SAFE 5 a 7 (${safeScore}/10) → Aguardando Idade (< 80 vs ≥ 80)`,
      };
    }
  }

  // CAMINHO B: SAFE < 5
  if (mepStatus === 'present') {
    return {
      safeScore,
      shoulderScore,
      fingerScore,
      isSafeCalculated: true,
      classification: 'GOOD',
      title: 'GOOD (Bom Prognóstico)',
      badgeBg: 'bg-blue-600 text-white',
      badgeText: 'text-white',
      badgeBorder: 'border-blue-500',
      prognosisExpected: 'Boa recuperação motora esperada em 3 meses devido à integridade do trato corticoespinhal evidenciada pelo MEP presente.',
      therapyFocus: 'Fortalecimento muscular progressivo, coordenação motora e prática de uso do membro afetado nas AVDs.',
      decisionPath: `Caminho B: SAFE < 5 (${safeScore}/10) + MEP Presente (MEP+) → GOOD`,
    };
  }

  if (mepStatus === 'absent') {
    if (nihssGroup === '<7') {
      return {
        safeScore,
        shoulderScore,
        fingerScore,
        isSafeCalculated: true,
        classification: 'LIMITED',
        title: 'LIMITED (Prognóstico Limitado)',
        badgeBg: 'bg-amber-600 text-white',
        badgeText: 'text-white',
        badgeBorder: 'border-amber-500',
        prognosisExpected: 'Ganho parcial de movimento, mas com limitação funcional moderada a importante. Membro atuará principalmente como estabilizador e auxiliar.',
        therapyFocus: 'Ganho e manutenção de ADM, fortalecimento focal e incorporação compensatória assistida.',
        decisionPath: `Caminho B: SAFE < 5 (${safeScore}/10) + MEP Ausente (MEP-) + NIHSS < 7 → LIMITED`,
      };
    } else if (nihssGroup === '>=7') {
      return {
        safeScore,
        shoulderScore,
        fingerScore,
        isSafeCalculated: true,
        classification: 'POOR',
        title: 'POOR (Prognóstico Pobre)',
        badgeBg: 'bg-rose-600 text-white',
        badgeText: 'text-white',
        badgeBorder: 'border-rose-500',
        prognosisExpected: 'Pouca ou nenhuma recuperação funcional motora esperada para o membro parético em 3 meses.',
        therapyFocus: 'Prevenção rigorosa de dor e subluxação glenoumeral, posicionamento protetor, manejo da espasticidade e estratégias compensatórias/adaptativas.',
        decisionPath: `Caminho B: SAFE < 5 (${safeScore}/10) + MEP Ausente (MEP-) + NIHSS ≥ 7 → POOR`,
      };
    } else {
      return {
        safeScore,
        shoulderScore,
        fingerScore,
        isSafeCalculated: true,
        classification: 'PENDING',
        title: 'MEP Ausente (Aguardando NIHSS)',
        badgeBg: 'bg-amber-700 text-white',
        badgeText: 'text-white',
        badgeBorder: 'border-amber-600',
        prognosisExpected: 'MEP ausente: Necessário verificar a pontuação do NIHSS (< 7 para LIMITED, ≥ 7 para POOR).',
        therapyFocus: 'Informe a pontuação ou faixa do NIHSS para concluir a predição PREP2.',
        decisionPath: `Caminho B: SAFE < 5 (${safeScore}/10) + MEP- → Aguardando NIHSS (< 7 vs ≥ 7)`,
      };
    }
  }

  return {
    safeScore,
    shoulderScore,
    fingerScore,
    isSafeCalculated: true,
    classification: 'PENDING',
    title: `SAFE: ${safeScore}/10 pts (Caminho B)`,
    badgeBg: 'bg-amber-700 text-white',
    badgeText: 'text-white',
    badgeBorder: 'border-amber-600',
    prognosisExpected: `SAFE < 5 (${safeScore}/10): Algoritmo PREP2 recomenda pesquisa de Potencial Evocado Motor (MEP via EMT). Se MEP+: GOOD. Se MEP-: Verificar NIHSS (< 7: LIMITED, ≥ 7: POOR).`,
    therapyFocus: 'Realizar teste complementar de MEP/TMS ou exame clínico neurofuncional para estratificação.',
    decisionPath: `Caminho B: SAFE < 5 (${safeScore}/10) → Indicado teste complementar de MEP/EMT`,
  };
}

export const CLINICAL_PRESETS: Record<string, ClinicalPreset[]> = {
  // 1. NEUROLÓGICA
  'Neurológica': [
    {
      label: 'PREP 2 - Preditor Pós-AVC',
      title: 'PREP 2 - Preditor Pós-AVC (Algoritmo de Membro Superior)',
      description: 'Algoritmo preditor de recuperação motora do membro superior às 72h (Escore SAFE, Idade, MEP e NIHSS)',
      category: 'Neurológica',
      getFields: getPREP2Fields,
    },
    {
      label: 'Escala de AVC do NIH (NIHSS)',
      title: 'Escala de AVC do NIH (NIHSS - National Institutes of Health Stroke Scale)',
      description: 'Avaliação quantitativa padronizada do déficit neurológico pós-AVC (0 a 42 pontos)',
      category: 'Neurológica',
      getFields: getNIHSSFields,
    },
    {
      label: 'Módulo do Controle de Tronco (TCT)',
      title: 'Módulo do Controle de Tronco (TCT)',
      description: 'Teste de Controle de Tronco com pontuações 0, 12 e 25 pts (Total: 100 pts)',
      category: 'Neurológica',
      getFields: () => [
        { id: 1, label: 'Rolar para o lado afetado', fieldType: 'single_select', options: trunkOptionsList, helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)', isRequired: false },
        { id: 2, label: 'Rolar para o lado sadio', fieldType: 'single_select', options: trunkOptionsList, helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)', isRequired: false },
        { id: 3, label: 'Equilíbrio na posição sentada na beira da cama por pelo menos 30 segundos', fieldType: 'single_select', options: trunkOptionsList, helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)', isRequired: false },
        { id: 4, label: 'Sentar-se a partir de deitado', fieldType: 'single_select', options: trunkOptionsList, helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)', isRequired: false },
      ],
    },
    {
      label: 'Escala de Coma de Glasgow',
      title: 'Escala de Coma de Glasgow',
      description: 'Avaliação do nível de consciência e resposta neurológica (3 a 15 pts)',
      category: 'Neurológica',
      getFields: () => [
        { id: 1, label: 'Abertura Ocular', fieldType: 'single_select', options: ['4 - Espontânea', '3 - Ao chamado', '2 - À dor', '1 - Ausente'], helpText: 'Pontuação de 1 a 4', isRequired: false },
        { id: 2, label: 'Resposta Verbal', fieldType: 'single_select', options: ['5 - Orientado', '4 - Confuso', '3 - Palavras inapropriadas', '2 - Sons incompreensíveis', '1 - Ausente'], helpText: 'Pontuação de 1 a 5', isRequired: false },
        { id: 3, label: 'Resposta Motora', fieldType: 'single_select', options: ['6 - Obedece a comandos', '5 - Localiza estímulo doloroso', '4 - Flexão inespecífica / Flete', '3 - Flexão anormal (Decorticação)', '2 - Extensão anormal (Descerebração)', '1 - Ausente'], helpText: 'Pontuação de 1 a 6', isRequired: false },
      ],
    },
    {
      label: 'Escala de Ashworth Modificada',
      title: 'Escala de Ashworth Modificada (Espasticidade)',
      description: 'Graduação de tônus muscular e espasticidade (Graus 0 a 4)',
      category: 'Neurológica',
      getFields: () => [
        { id: 1, label: 'Grau de Espasticidade (Membro Avaliado)', fieldType: 'single_select', options: ['0 - Nenhum aumento no tônus', '1 - Leve aumento no final da ADM', '1+ - Leve aumento em menos da metade da ADM', '2 - Aumento marcante na maior parte da ADM', '3 - Aumento considerável, movimento difícil', '4 - Parte afetada rígida'], helpText: 'Selecione o grau de tônus muscular (0 a 4)', isRequired: false },
        { id: 2, label: 'Grupo Muscular / Segmento Avaliado', fieldType: 'text', helpText: 'Ex: Bíceps braquial direito, Isquiotibiais, Tríceps sural', isRequired: false },
      ],
    },
    {
      label: 'Avaliação Cognitiva Montreal (MoCA)',
      title: 'Montreal Cognitive Assessment (MoCA - Versão Brasileira)',
      description: 'Rastreio cognitivo global em 8 domínios neurofuncionais: visuoespacial, nomeação, memória, atenção, linguagem, abstração, evocação tardia e orientação (0 a 30 pts)',
      category: 'Neurológica',
      getFields: getMoCAFields,
    },
  ],

  // 2. CARDIORRESPIRATÓRIA
  'Cardiorrespiratória': [
    {
      label: 'Teste TC6 (6 Minutos)',
      title: 'Teste de Caminhada de 6 Minutos (TC6)',
      description: 'Capacidade funcional submáxima cardiorrespiratória',
      category: 'Cardiorrespiratória',
      getFields: () => [
        { id: 1, label: 'SpO2 Basal', fieldType: 'number', unit: '%', isRequired: false, helpText: 'Saturação de oxigênio em repouso' },
        { id: 2, label: 'FC Basal', fieldType: 'number', unit: 'bpm', isRequired: false, helpText: 'Frequência cardíaca em repouso' },
        { id: 3, label: 'PA Basal', fieldType: 'text', helpText: 'Ex: 120x80 mmHg', isRequired: false },
        { id: 4, label: 'Dispneia Basal (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: false },
        { id: 5, label: 'Fadiga Basal (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: false },
        { id: 6, label: 'Distância Total Percorrida', fieldType: 'number', unit: 'metros', isRequired: false },
        { id: 7, label: 'SpO2 Final', fieldType: 'number', unit: '%', isRequired: false },
        { id: 8, label: 'FC Final', fieldType: 'number', unit: 'bpm', isRequired: false },
        { id: 9, label: 'PA Final', fieldType: 'text', helpText: 'Ex: 130x85 mmHg', isRequired: false },
        { id: 10, label: 'Dispneia Final (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: false },
        { id: 11, label: 'Fadiga Final (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: false },
        { id: 12, label: 'Distância Prevista (m)', fieldType: 'number', unit: 'm', isRequired: false },
        { id: 13, label: '% do Previsto', fieldType: 'text', isRequired: false },
        { id: 14, label: 'Classificação TC6', fieldType: 'text', isRequired: false },
        { id: 15, label: 'Observações / Intercorrências', fieldType: 'long_text', isRequired: false },
        { id: 16, label: 'Referência Bibliográfica', fieldType: 'text', helpText: 'Equações de Referência para o TC6 em Indivíduos Saudáveis - Victor Zuniga Dourado (UNIFESP)', isRequired: false },
      ],
    },
    {
      label: 'Sentar e Levantar em 1 Minuto (TSL 1 min)',
      title: 'Teste de Sentar e Levantar em 1 Minuto (TSL 1 min)',
      description: 'Capacidade funcional submáxima e resistência de membros inferiores em 60s (Strassmann et al., 2013)',
      category: 'Cardiorrespiratória',
      getFields: getSTS1MinFields,
    },
    {
      label: 'Manovacuometria (PImáx/PEmáx)',
      title: 'Manovacuometria (Força Muscular Respiratória)',
      description: 'Pressões respiratórias estáticas máximas (PImáx e PEmáx)',
      category: 'Cardiorrespiratória',
      getFields: () => [
        { id: 1, label: 'PImáx Medida', fieldType: 'number', unit: 'cmH2O', isRequired: false, helpText: 'Pressão Inspiratória Máxima medida' },
        { id: 2, label: 'PImáx Prevista', fieldType: 'number', unit: 'cmH2O', isRequired: false },
        { id: 3, label: 'PEmáx Medida', fieldType: 'number', unit: 'cmH2O', isRequired: false, helpText: 'Pressão Expiratória Máxima medida' },
        { id: 4, label: 'PEmáx Prevista', fieldType: 'number', unit: 'cmH2O', isRequired: false },
        { id: 5, label: '% do Previsto (PImáx)', fieldType: 'number', unit: '%', isRequired: false },
        { id: 6, label: '% do Previsto (PEmáx)', fieldType: 'number', unit: '%', isRequired: false },
        { id: 7, label: 'Observações / Conclusão Respiratória', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Peak Flow (PFE) e Pico de Fluxo de Tosse (PFT)',
      title: 'Pico de Fluxo Expiratório (PFE) e Tosse (PFT)',
      description: 'Fluxo expiratório forçado e eficácia do mecanismo de tosse',
      category: 'Cardiorrespiratória',
      getFields: () => [
        { id: 1, label: 'PFE - Pico de Fluxo Expiratório (Peak Flow)', fieldType: 'number', unit: 'L/min', isRequired: false },
        { id: 2, label: 'PFE Previsto', fieldType: 'number', unit: 'L/min', isRequired: false },
        { id: 3, label: 'PFT - Pico de Fluxo de Tosse', fieldType: 'number', unit: 'L/min', isRequired: false, helpText: 'Pico de fluxo durante tosse voluntária máxima' },
        { id: 4, label: 'Interpretação do PFT (Tosse)', fieldType: 'single_select', isRequired: false, options: ['> 270 L/min - Tosse eficaz', '160 a 270 L/min - Tosse potencialmente insuficiente', '< 160 L/min - Tosse ineficaz'] },
        { id: 5, label: 'Observações', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Escala de Dispneia - mMRC',
      title: 'Escala de Dispneia do Medical Research Council (mMRC)',
      description: 'Grau de falta de ar no cotidiano (Graus 0 a 4)',
      category: 'Cardiorrespiratória',
      getFields: () => [
        {
          id: 1,
          label: 'Grau de Dispneia (mMRC)',
          fieldType: 'single_select',
          isRequired: false,
          options: [
            'Grau 0 - Falta de ar apenas durante exercícios intensos',
            'Grau 1 - Falta de ar ao andar rápido no plano ou subir uma ladeira leve',
            'Grau 2 - Anda mais devagar que pessoas da mesma idade no plano ou precisa parar para respirar ao andar no próprio passo',
            'Grau 3 - Para para respirar após andar cerca de 100 metros ou após alguns minutos no plano',
            'Grau 4 - Falta de ar que impede de sair de casa ou ao se vestir/despir',
          ],
        },
      ],
    },
    {
      label: 'Classificação Funcional - NYHA',
      title: 'Classificação Funcional Cardíaca (NYHA)',
      description: 'Limitação funcional por insuficiência cardíaca e sintomas',
      category: 'Cardiorrespiratória',
      getFields: () => [
        {
          id: 1,
          label: 'Classe Funcional (NYHA)',
          fieldType: 'single_select',
          isRequired: false,
          options: [
            'Classe I - Sem limitação: atividade física habitual não causa fadiga excessiva, palpitação ou dispneia',
            'Classe II - Limitação leve: confortável em repouso, mas atividade habitual resulta em fadiga, palpitação ou dispneia',
            'Classe III - Limitação acentuada: confortável em repouso, mas atividades menores que as habituais causam sintomas',
            'Classe IV - Incapacidade: sintomas de insuficiência cardíaca mesmo em repouso, piora ao menor esforço',
          ],
        },
      ],
    },
  ],

  // 3. EQUILÍBRIO
  'Equilíbrio': [
    {
      label: 'Escala de Berg (BBS)',
      title: 'Escala de Equilíbrio Funcional de Berg (BBS)',
      description: '14 testes funcionais de equilíbrio estático e dinâmico (0 a 56 pts)',
      category: 'Equilíbrio',
      getFields: () => [
        { id: 1, label: '1. Posição sentada para posição em pé', fieldType: 'single_select', isRequired: false, helpText: 'Instruções: Por favor, levante-se.', options: ['4 - Capaz de levantar-se sem utilizar as mãos', '3 - Capaz de levantar-se independentemente', '2 - Capaz de levantar-se utilizando as mãos após diversas tentativas', '1 - Necessita de ajuda mínima', '0 - Necessita de ajuda moderada ou máxima'] },
        { id: 2, label: '2. Permanecer em pé sem apoio', fieldType: 'single_select', isRequired: false, helpText: 'Fique em pé por 2 minutos sem apoio.', options: ['4 - Capaz por 2 minutos com segurança', '3 - Capaz por 2 minutos com supervisão', '2 - Capaz por 30 segundos sem apoio', '1 - Várias tentativas para 30s', '0 - Incapaz por 30s'] },
        { id: 3, label: '3. Permanecer sentado sem apoio nas costas', fieldType: 'single_select', isRequired: false, helpText: 'Sentado sem apoio por 2 minutos.', options: ['4 - Seguro por 2 minutos', '3 - Seguro por 2 min com supervisão', '2 - Capaz por 30s', '1 - Capaz por 10s', '0 - Incapaz por 10s'] },
        { id: 4, label: '4. Posição em pé para posição sentada', fieldType: 'single_select', isRequired: false, helpText: 'Por favor, sente-se.', options: ['4 - Senta com segurança, mínimo uso das mãos', '3 - Controla descida com as mãos', '2 - Apoia pernas na cadeira', '1 - Descida sem controle', '0 - Necessita de ajuda'] },
        { id: 5, label: '5. Transferências', fieldType: 'single_select', isRequired: false, helpText: 'Transferir-se entre cadeiras.', options: ['4 - Seguro com mínimo uso das mãos', '3 - Seguro com uso das mãos', '2 - Com orientação verbal/supervisão', '1 - Ajuda de 1 pessoa', '0 - Ajuda de 2 pessoas'] },
        { id: 6, label: '6. Permanecer em pé com olhos fechados', fieldType: 'single_select', isRequired: false, helpText: 'Em pé por 10 segundos de olhos fechados.', options: ['4 - Seguro por 10s', '3 - Com supervisão por 10s', '2 - Capaz por 3s', '1 - Incapaz de fechar 3s', '0 - Ajuda para não cair'] },
        { id: 7, label: '7. Permanecer em pé com os pés juntos', fieldType: 'single_select', isRequired: false, helpText: 'Pés juntos por 1 minuto.', options: genericBergOptions },
        { id: 8, label: '8. Alcançar a frente com o braço estendido', fieldType: 'single_select', isRequired: false, helpText: 'Braço a 90°, alcance máximo.', options: genericBergOptions },
        { id: 9, label: '9. Pegar um objeto do chão', fieldType: 'single_select', isRequired: false, helpText: 'Pegar objeto à frente dos pés.', options: genericBergOptions },
        { id: 10, label: '10. Virar-se para olhar para trás', fieldType: 'single_select', isRequired: false, helpText: 'Olhar por cima dos ombros.', options: genericBergOptions },
        { id: 11, label: '11. Girar 360 graus', fieldType: 'single_select', isRequired: false, helpText: 'Giro completo em ambas direções.', options: genericBergOptions },
        { id: 12, label: '12. Posicionar os pés alternadamente no degrau', fieldType: 'single_select', isRequired: false, helpText: 'Tocar degrau 4 vezes cada pé.', options: genericBergOptions },
        { id: 13, label: '13. Permanecer em pé com um pé à frente', fieldType: 'single_select', isRequired: false, helpText: 'Posição semi-tandem/tandem.', options: genericBergOptions },
        { id: 14, label: '14. Permanecer em pé sobre um pé só', fieldType: 'single_select', isRequired: false, helpText: 'Apoio unipodal sem apoio.', options: genericBergOptions },
      ],
    },
    {
      label: 'Teste TUG (Timed Up and Go)',
      title: 'Timed Up and Go (TUG)',
      description: 'Mobilidade básica, velocidade e risco de quedas',
      category: 'Equilíbrio',
      getFields: () => [
        { id: 1, label: 'Tempo de Execução (TUG)', fieldType: 'number', unit: 'segundos', helpText: 'Tempo para levantar, andar 3m, virar e sentar.', isRequired: false },
        { id: 2, label: 'Risco de Quedas / Dependência', fieldType: 'single_select', options: ['< 10 s - Baixo risco de quedas (Independente)', '11 a 20 s - Risco moderado de quedas (Idosos frágeis)', '> 20 s - Alto risco de quedas (Necessita supervisão/ajuda)', '> 30 s - Dependência funcional significativa'], isRequired: false },
        { id: 3, label: 'Utilização de dispositivo de marcha', fieldType: 'single_select', options: ['Não utiliza', 'Bengala', 'Andador', 'Muletas', 'Cadeira de rodas', 'Outro'], isRequired: false, helpText: 'Dispositivo auxiliar de locomoção utilizado durante o teste' },
        { id: 4, label: 'Utilização de O2', fieldType: 'boolean', isRequired: false, helpText: 'Paciente utilizou oxigênio suplementar durante o teste' },
        { id: 5, label: 'Qual a quantidade de O2?', fieldType: 'number', unit: 'L/min', isRequired: false, helpText: 'Fluxo de oxigênio suplementar em L/min' },
      ],
    },
  ],

  // 4. QUALIDADE DE VIDA E AUTONOMIA
  'Qualidade de Vida e Autonomia': [
    {
      label: 'Índice de Barthel',
      title: 'Índice de Barthel (AVDs)',
      description: 'Grau de independência nas Atividades de Vida Diária (0 a 100 pts)',
      category: 'Qualidade de Vida e Autonomia',
      getFields: () => [
        {
          id: 1,
          label: '1. Higiene Pessoal',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Lavar as mãos/face, escovar dentes, barbear, pentear ou maquiar-se.',
          options: [
            '0 - Incapaz de realizar higiene pessoal sendo dependente em todos os aspectos',
            '1 - Necessita de assistência em todos os passos da higiene pessoal',
            '3 - Alguma assistência é necessária em um ou mais passos da higiene pessoal',
            '4 - Capaz de conduzir a própria higiene, mas requer mínima assistência antes/depois',
            '5 - Totalmente independente (lava mãos/face, limpa dentes, penteia, barbeia/maquia-se)',
          ],
        },
        {
          id: 2,
          label: '2. Banho',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Capacidade de lavar-se, transferir-se e secar-se.',
          options: [
            '0 - Totalmente dependente para banhar-se',
            '1 - Requer assistência em todos os aspectos do banho',
            '3 - Requer assistência para transferir-se, lavar-se e/ou secar-se',
            '4 - Requer supervisão por segurança no ajuste da temperatura ou na transferência',
            '5 - Totalmente independente (realiza todas as etapas do banho com ou sem equipamentos)',
          ],
        },
        {
          id: 3,
          label: '3. Alimentação',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Manipulação de talheres, mastigação, cortar alimentos e beber.',
          options: [
            '0 - Dependente em todos os aspectos e necessita ser alimentado',
            '2 - Manipula utensílios (colher), porém necessita de assistência constante na refeição',
            '5 - Come com supervisão; requer assistência em tarefas associadas (açúcar, tempero, cortar)',
            '8 - Independência em prato pronto; assistência apenas para cortar carne, abrir potes/garrafas',
            '10 - Totalmente independente (alimenta-se de prato/bandeja, corta carne, passa manteiga)',
          ],
        },
        {
          id: 4,
          label: '4. Toalete (Uso do Vaso Sanitário)',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Despir-se/vestir-se, transferir-se, higiene íntima e lavar as mãos.',
          options: [
            '0 - Totalmente dependente no uso do vaso sanitário',
            '2 - Necessita de assistência no uso do vaso sanitário',
            '5 - Necessita de assistência para se despir/vestir, transferir-se ou lavar as mãos',
            '8 - Requer supervisão por segurança ou auxílio para esvaziar/limpar comadre/penico',
            '10 - Totalmente independente (vai ao sanitário, despe/veste-se, limpa-se sem ajuda)',
          ],
        },
        {
          id: 5,
          label: '5. Subir e Descer Escadas',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Capacidade de subir e descer lances de escada.',
          options: [
            '0 - Incapaz de subir escadas',
            '2 - Requer assistência em todos os aspectos ao subir escadas (inclusive com dispositivos)',
            '5 - Sobe e desce, porém não carrega dispositivos, necessitando supervisão e assistência',
            '8 - Geralmente não necessita de assistência; requer supervisão eventual por segurança',
            '10 - Totalmente independente (sobe e desce com segurança um lance de escadas com/sem dispositivos)',
          ],
        },
        {
          id: 6,
          label: '6. Vestuário',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Vestir-se, despir-se, abotoar, fechar zíper, calçar e amarrar sapatos.',
          options: [
            '0 - Dependente em todos os aspectos do vestir e incapaz de participar',
            '2 - Apresenta algum grau de participação, mas é dependente em todos os aspectos',
            '5 - Necessita de assistência para se vestir ou se despir',
            '8 - Necessita de assistência mínima (abotoar, fechar zíper, amarrar sapatos)',
            '10 - Totalmente independente (veste-se, despe-se, amarra sapatos, coloca colete/órtese)',
          ],
        },
        {
          id: 7,
          label: '7. Controle Esfincteriano (Bexiga)',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Controle da micção e continência urinária.',
          options: [
            '0 - Apresenta incontinência urinária total',
            '2 - Necessita de auxílio para posição apropriada e manobras de esvaziamento',
            '5 - Acidentes frequentes, necessita de assistência com fraldas e manobras',
            '8 - Acidentes ocasionais ou necessita de supervisão',
            '10 - Controle urinário total, sem acidentes',
          ],
        },
        {
          id: 8,
          label: '8. Controle Esfincteriano (Intestino)',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Controle da evacuação e continência fecal.',
          options: [
            '0 - Não tem controle de esfíncteres ou utiliza cateterismo',
            '2 - Incontinência, mas é capaz de assistir na aplicação de auxílios externos/internos',
            '5 - Geralmente seco ao dia, porém não à noite; necessita equipamentos para esvaziamento',
            '8 - Geralmente seco durante dia/noite; acidentes ocasionais ou auxílio com equipamentos',
            '10 - Controle esfincteriano total durante o dia e a noite (independente)',
          ],
        },
        {
          id: 9,
          label: '9. Deambulação / Mobilidade',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Capacidade de caminhar 50 metros com ou sem dispositivos (ou condução de cadeira de rodas).',
          options: [
            '0 - Totalmente dependente para deambular / conduzir cadeira de rodas',
            '1 - Cadeira de Rodas: Conduz em pequenas distâncias/piso liso, necessita auxílio geral',
            '3 - Deambulação: Presença constante de 1+ pessoas | Cadeira: Requer assistência contínua',
            '4 - Cadeira de Rodas: Conduz por tempo razoável em solo regular, mínima ajuda',
            '5 - Cadeira de Rodas: Totalmente independente em longos percursos e transferências',
            '8 - Deambulação: Requer assistência de 1 pessoa para manipular dispositivos auxiliares',
            '12 - Deambulação: Independente para andar 50m com auxílio/supervisão em situações de risco',
            '15 - Deambulação: Totalmente independente (anda 50m sem auxílio ou supervisão)',
          ],
        },
        {
          id: 10,
          label: '10. Transferências (Cadeira / Cama)',
          fieldType: 'single_select',
          isRequired: false,
          helpText: 'Transferir-se da cama para a cadeira de rodas/poltrona e retornar.',
          options: [
            '0 - Incapaz de participar da transferência (necessita de 2 pessoas / auxílio mecânico)',
            '3 - Participa, porém necessita de máxima assistência de outra pessoa',
            '8 - Requer assistência de outra pessoa para transferir-se',
            '12 - Requer presença de outra pessoa supervisionando como medida de segurança',
            '15 - Totalmente independente em todas as fases da transferência (cama/cadeira)',
          ],
        },
      ],
    },
    {
      label: 'Qualidade de Vida (SF-36)',
      title: 'Questionário de Qualidade de Vida (SF-36)',
      description: 'Saúde física, capacidade funcional, dor, vitalidade e aspectos emocionais',
      category: 'Qualidade de Vida e Autonomia',
      getFields: () => [
        { id: 1, label: '1 - Em geral sua saúde é:', fieldType: 'single_select', isRequired: false, options: ['1 - Excelente', '2 - Muito Boa', '3 - Boa', '4 - Ruim', '5 - Muito Ruim'] },
        { id: 2, label: '2 - Comparada há um ano atrás:', fieldType: 'single_select', isRequired: false, options: ['1 - Muito Melhor', '2 - Um Pouco Melhor', '3 - Quase a Mesma', '4 - Um Pouco Pior', '5 - Muito Pior'] },
        { id: 3, label: '3a - Atividades Rigorosas (correr, levantar peso)', fieldType: 'single_select', isRequired: false, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 4, label: '3b - Atividades Moderadas (mover mesa, aspirador)', fieldType: 'single_select', isRequired: false, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 5, label: '3c - Levantar ou carregar mantimentos', fieldType: 'single_select', isRequired: false, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 6, label: '3d - Subir vários lances de escada', fieldType: 'single_select', isRequired: false, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 7, label: '3e - Subir um lance de escada', fieldType: 'single_select', isRequired: false, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 8, label: '3f - Curvar-se ou ajoelhar-se', fieldType: 'single_select', isRequired: false, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 9, label: '3g - Andar mais de 1 km', fieldType: 'single_select', isRequired: false, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 10, label: '3h - Tomar banho ou vestir-se', fieldType: 'single_select', isRequired: false, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
      ],
    },
    {
      label: 'Qualidade do Sono (PSQI)',
      title: 'Índice de Qualidade do Sono de Pittsburgh (PSQI)',
      description: 'Padrão, latência, duração e distúrbios do sono',
      category: 'Qualidade de Vida e Autonomia',
      getFields: () => [
        { id: 1, label: '1. Hora usual de deitar', fieldType: 'text', isRequired: false },
        { id: 2, label: '2. Minutos para adormecer', fieldType: 'number', unit: 'min', isRequired: false },
        { id: 3, label: '3. Hora usual de levantar', fieldType: 'text', isRequired: false },
        { id: 4, label: '4. Horas de sono real por noite', fieldType: 'number', unit: 'horas', isRequired: false },
        { id: 5, label: '5. Não conseguiu dormir em 30 min', fieldType: 'single_select', isRequired: false, options: freqPSQIOptions },
        { id: 6, label: '6. Acordou no meio da noite / madrugada', fieldType: 'single_select', isRequired: false, options: freqPSQIOptions },
        { id: 7, label: '7. Qualidade geral do sono', fieldType: 'single_select', isRequired: false, options: ['0 - Muito boa', '1 - Boa', '2 - Ruim', '3 - Muito Ruim'] },
        { id: 8, label: '8. Medicamento para dormir', fieldType: 'single_select', isRequired: false, options: freqPSQIOptions },
        { id: 9, label: '9. Dificuldade para ficar acordado de dia', fieldType: 'single_select', isRequired: false, options: freqPSQIOptions },
      ],
    },
  ],

  // 5. DOR
  'Dor': [
    {
      label: 'Escala Visual Analógica (EVA)',
      title: 'Escala Visual Analógica (EVA 0-10)',
      description: 'Intensidade, padrão temporal e frequência da dor',
      category: 'Dor',
      getFields: () => [
        { id: 1, label: 'Intensidade da Dor (EVA)', fieldType: 'scale_0_10', isRequired: false },
        { id: 2, label: 'Local Principal da Dor', fieldType: 'text', isRequired: false },
        { id: 3, label: 'Frequência / Pior Momento', fieldType: 'single_select', options: ['Constante', 'Ao movimento', 'Ao repouso', 'Matinal', 'Noturna', 'Intermitente'], isRequired: false },
        { id: 4, label: 'Observações / Medicamentos em Uso', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Pontos e Mapeamento de Dor (Body Map)',
      title: 'Mapeamento Anatômico e Tipo de Dor (Body Map)',
      description: 'Localização anatômica corporal nas 4 visões, tipo, irradiação e fatores agravantes',
      category: 'Dor',
      getFields: () => [
        { id: 1, label: 'Intensidade da Dor (Escala EVA)', fieldType: 'scale_0_10', isRequired: false },
        {
          id: 2,
          label: 'Regiões Anatômicas Afetadas e Pontos de Dor (Body Map)',
          fieldType: 'body_map',
          isRequired: false,
          helpText: 'Clique diretamente na imagem corporal (Frente, Costas, Esquerdo, Direito) para marcar os pontos de dor do paciente.',
        },
        {
          id: 3,
          label: 'Tipo / Característica da Dor',
          fieldType: 'single_select',
          isRequired: false,
          options: [
            'Queimação',
            'Pontada / Agulhada',
            'Latejante / Pulsátil',
            'Em Peso / Cansaço',
            'Choque / Irradiada',
            'Contínua / Profunda',
            'Cólica / Aperto',
          ],
        },
        { id: 4, label: 'Irradiação da Dor', fieldType: 'text', isRequired: false, helpText: 'Ex: Irradia para membro inferior direito até o pé' },
        { id: 5, label: 'Fatores de Piora e Melhora', fieldType: 'long_text', isRequired: false },
      ],
    },
  ],

  // 6. FORÇA MUSCULAR
  'Força Muscular': [
    {
      label: 'Força de Preensão Palmar (Dinamometria FPM)',
      title: 'Força de Preensão Palmar (FPP/FPM) • Dinamometria',
      description: 'Dinamometria manual com 3 tentativas por mão e equações de predição de Novaes et al. (2009)',
      category: 'Força Muscular',
      getFields: getFPMFields,
    },
    {
      label: 'Escala de Força Muscular (MRC)',
      title: 'Escala de Força Muscular Periférica (MRC 0-5)',
      description: 'Graduação de força muscular (0 a 5) com seleção de movimento, lado (direito/esquerdo) e observação (sim/não)',
      category: 'Força Muscular',
      getFields: () => [
        {
          id: 1,
          label: 'Escala de Força Muscular (MRC)',
          fieldType: 'single_select',
          isRequired: true,
          options: mrcMuscleOptions,
          helpText: 'Selecione o Movimento, Lado (Direito ou Esquerdo) e Observação (Sim ou Não) com pontuação de 0 a 5',
        },
        {
          id: 2,
          label: 'Observações / Assimetrias de Força Muscular',
          fieldType: 'long_text',
          isRequired: false,
          helpText: 'Anotar assimetrias, fadiga ou compensações gerais',
        },
      ],
    },
  ],

  // 7. POSTURAL
  'Postural': [
    {
      label: 'Avaliação Postural Global',
      title: 'Avaliação Postural Global',
      description: 'Checklist anatômico nos planos anterior, posterior e laterais',
      category: 'Postural',
      getFields: () => [
        { id: 1, label: 'Desvios Posturais - Visão Anterior (De Frente)', fieldType: 'multi_select', options: ['Inclinação cervical', 'Rotação cervical', 'Elevação/Desalinhamento de ombros', 'Triângulo de Tales assimétrico', 'Desalinhamento de quadril', 'Geno Valgo', 'Genu Varo', 'Pé Pronado', 'Pé Supinado'], isRequired: false, helpText: 'Alterações posturais observadas de frente' },
        { id: 2, label: 'Desvios Posturais - Visão Posterior (De Costas)', fieldType: 'multi_select', options: ['Escoliose / Desvio lateral de coluna', 'Escápula alada / protusa', 'Assimetria de pregas glúteas', 'Tendão calcâneo valgo/varo'], isRequired: false, helpText: 'Alterações posturais observadas de costas' },
        { id: 3, label: 'Desvios Posturais - Visão Lateral (Perfil)', fieldType: 'multi_select', options: ['Projeção anterior da cabeça', 'Hipercifose Torácica', 'Hiperlordose Lombar', 'Retificação Lombar', 'Anteversão Pélvica', 'Retroversão Pélvica', 'Genu Recurvatum', 'Genu Flexo'], isRequired: false, helpText: 'Alterações posturais observadas de perfil' },
        { id: 4, label: 'Triângulo de Tales e Alinhamento Pélvico', fieldType: 'single_select', options: ['Simétrico', 'Assimétrico à Direita', 'Assimétrico à Esquerda'], isRequired: false },
        { id: 5, label: 'Conclusão e Conduta Postural', fieldType: 'long_text', isRequired: false, helpText: 'Orientações ergonômicas e alinhamento biomecânico' },
      ],
    },
  ],

  // 8. COMPOSIÇÃO CORPORAL / BIOIMPEDÂNCIA
  'Composição Corporal / Bioimpedância': [
    {
      label: 'Avaliação por Bioimpedância',
      title: 'Bioimpedância e Composição Corporal',
      description: 'Composição corporal completa (massa magra, gorda, água e metabolismo)',
      category: 'Composição Corporal / Bioimpedância',
      getFields: () => [
        { id: 1, label: 'Peso Atual', fieldType: 'number', unit: 'kg', isRequired: false },
        { id: 2, label: 'Altura', fieldType: 'number', unit: 'cm', isRequired: false },
        { id: 3, label: 'IMC (Índice de Massa Corporal)', fieldType: 'number', unit: 'kg/m²', isRequired: false },
        { id: 4, label: '% de Gordura Corporal', fieldType: 'number', unit: '%', isRequired: false },
        { id: 5, label: 'Massa Muscular Esquelética', fieldType: 'number', unit: 'kg', isRequired: false },
        { id: 6, label: 'Água Corporal Total', fieldType: 'number', unit: '%', isRequired: false },
        { id: 7, label: 'Nível de Gordura Visceral', fieldType: 'number', unit: 'nível', isRequired: false },
        { id: 8, label: 'Taxa Metabólica Basal (TMB)', fieldType: 'number', unit: 'kcal', isRequired: false },
        { id: 9, label: 'Idade Metabólica', fieldType: 'number', unit: 'anos', isRequired: false },
        { id: 10, label: 'Observações da Bioimpedância', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Registro Fotográfico (Fotos Anterior, Posterior e Laterais)',
      title: 'Registro Fotográfico Corporal e Postural',
      description: 'Registro visual dos planos anterior, posterior e laterais com fotos',
      category: 'Composição Corporal / Bioimpedância',
      getFields: () => [
        { id: 1, label: 'Observações da Foto Anterior (De Frente)', fieldType: 'long_text', isRequired: false },
        { id: 2, label: 'Observações da Foto Posterior (De Costas)', fieldType: 'long_text', isRequired: false },
        { id: 3, label: 'Observações da Foto Lateral Direita', fieldType: 'long_text', isRequired: false },
        { id: 4, label: 'Observações da Foto Lateral Esquerda', fieldType: 'long_text', isRequired: false },
        { id: 5, label: 'Evolução / Comparativo Visual', fieldType: 'long_text', isRequired: false },
      ],
    },
  ],

  // 9. GONIOMETRIA
  'Goniometria': [
    'Cervical', 'Ombro', 'Cotovelo e Antebraço', 'Punho', 'Quadril', 'Joelho', 'Tornozelo'
  ].map((joint) => ({
    label: `Goniometria - ${joint}`,
    title: `Goniometria Articular - ${joint}`,
    description: `Graus de Amplitude de Movimento (ADM) para ${joint}`,
    category: 'Goniometria',
    getFields: () => makeGoniometriaFields(joint),
  })),

  // 10. GERAL
  'Geral': [
    {
      label: 'Anamnese Fisioterapêutica',
      title: 'Anamnese e História Clínica',
      description: 'Queixa Principal, HMP, Histórico Familiar e Diagnóstico Funcional',
      category: 'Geral',
      getFields: () => [
        { id: 1, label: 'Queixa Principal (QP) / Motivo da Consulta', fieldType: 'long_text', isRequired: false, helpText: 'Motivo principal da procura pelo atendimento fisioterapêutico' },
        { id: 2, label: 'História Médica Pregressa (HMP)', fieldType: 'long_text', isRequired: false, helpText: 'Cirurgias, comorbidades (HAS, DM), medicamentos em uso e internações' },
        { id: 3, label: 'Histórico Familiar (HF)', fieldType: 'long_text', isRequired: false, helpText: 'Histórico de doenças crônicas ou hereditárias na família' },
        { id: 4, label: 'Observações Gerais e Diagnóstico Funcional', fieldType: 'long_text', isRequired: false, helpText: 'Parecer clínico inicial e objetivos terapêuticos' },
      ],
    },
  ],
};

// Aliases for flexible category lookups
CLINICAL_PRESETS['Neurologia'] = CLINICAL_PRESETS['Neurológica'];
CLINICAL_PRESETS['Controle de Tronco'] = CLINICAL_PRESETS['Neurológica'];
CLINICAL_PRESETS['Geriatria e Equilíbrio'] = CLINICAL_PRESETS['Equilíbrio'];
CLINICAL_PRESETS['Membros Superiores e Inferiores'] = CLINICAL_PRESETS['Força Muscular'];
CLINICAL_PRESETS['Postura e Biomecânica'] = CLINICAL_PRESETS['Postural'];
CLINICAL_PRESETS['Composição Corporal'] = CLINICAL_PRESETS['Composição Corporal / Bioimpedância'];

