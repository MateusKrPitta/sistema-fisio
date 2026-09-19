export interface CustomField {
  id?: number | string;
  label: string;
  fieldType: 'text' | 'long_text' | 'number' | 'scale_0_10' | 'date' | 'single_select' | 'multi_select' | 'boolean';
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
  'Controle de Tronco',
  'Neurologia',
  'Postura & Biomecânica',
  'Geriatria & Equilíbrio',
  'Cardiorrespiratória',
  'Composição Corporal',
  'Membros Superiores e Inferiores',
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

const mrcMuscleOptions = [
  '5 - Contração normal contra resistência plena',
  '4 - Contração contra resistência parcial',
  '3 - Contração contra gravidade apenas',
  '2 - Contração contra gravidade parcial',
  '1 - Contração contra gravidade mínima',
  '0 - Sem contração detectável',
];

const borgScaleOptions = [
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

export const CLINICAL_PRESETS: Record<string, ClinicalPreset[]> = {
  'Controle de Tronco': [
    {
      label: 'Módulo do Controle de Tronco',
      title: 'Módulo do Controle de Tronco (TCT)',
      description: 'Teste de Controle de Tronco com pontuações 0, 12 e 25 pts (Total: 100 pts)',
      category: 'Controle de Tronco',
      getFields: () => [
        { id: 1, label: 'Rolar para o lado afetado', fieldType: 'single_select', options: trunkOptionsList, helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)', isRequired: true },
        { id: 2, label: 'Rolar para o lado sadio', fieldType: 'single_select', options: trunkOptionsList, helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)', isRequired: true },
        { id: 3, label: 'Equilíbrio na posição sentada na beira da cama por pelo menos 30 segundos', fieldType: 'single_select', options: trunkOptionsList, helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)', isRequired: true },
        { id: 4, label: 'Sentar-se a partir de deitado', fieldType: 'single_select', options: trunkOptionsList, helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)', isRequired: true },
      ],
    },
  ],

  'Neurologia': [
    {
      label: 'Escala de Glasgow',
      title: 'Escala de Coma de Glasgow',
      description: 'Avaliação do nível de consciência e resposta neurológica',
      category: 'Neurologia',
      getFields: () => [
        { id: 1, label: 'Abertura Ocular', fieldType: 'single_select', options: ['4 - Espontânea', '3 - Ao chamado', '2 - À dor', '1 - Ausente'], helpText: 'Pontuação de 1 a 4', isRequired: true },
        { id: 2, label: 'Resposta Verbal', fieldType: 'single_select', options: ['5 - Orientado', '4 - Confuso', '3 - Palavras', '2 - Sons', '1 - Ausente'], helpText: 'Pontuação de 1 a 5', isRequired: true },
        { id: 3, label: 'Resposta Motora', fieldType: 'single_select', options: ['6 - Obedece', '5 - Localiza', '4 - Flete', '3 - Flexão Anormal', '2 - Extensão', '1 - Ausente'], helpText: 'Pontuação de 1 a 6', isRequired: true },
      ],
    },
    {
      label: 'Escala de Ashworth',
      title: 'Escala de Ashworth Modificada (Espasticidade)',
      description: 'Graduação de tônus muscular e espasticidade',
      category: 'Neurologia',
      getFields: () => [
        { id: 1, label: 'Grau de Espasticidade (Membro Avaliado)', fieldType: 'single_select', options: ['0 - Nenhum aumento no tônus', '1 - Leve aumento no final da ADM', '1+ - Leve aumento em menos da metade da ADM', '2 - Aumento marcante na maior parte da ADM', '3 - Aumento considerável, movimento difícil', '4 - Parte afetada rígida'], helpText: 'Selecione o grau de tônus muscular (0 a 4)', isRequired: true },
        { id: 2, label: 'Grupo Muscular / Segmento Avaliado', fieldType: 'text', helpText: 'Ex: Bíceps braquial direito, Isquiotibiais', isRequired: true },
      ],
    },
  ],

  'Postura & Biomecânica': [
    {
      label: 'Avaliação Postural (Anterior, Posterior e Lateral)',
      title: 'Avaliação Postural Global',
      description: 'Checklist anatômico nos planos anterior, posterior e lateral',
      category: 'Postura & Biomecânica',
      getFields: () => [
        { id: 1, label: 'Desvios Posturais - Visão Anterior (De Frente)', fieldType: 'multi_select', options: ['Inclinação cervical', 'Rotação cervical', 'Elevação/Desalinhamento de ombros', 'Triângulo de Tales assimétrico', 'Desalinhamento de quadril', 'Geno Valgo', 'Genu Varo', 'Pé Pronado', 'Pé Supinado'], isRequired: false, helpText: 'Alterações posturais observadas de frente' },
        { id: 2, label: 'Desvios Posturais - Visão Posterior (De Costas)', fieldType: 'multi_select', options: ['Escoliose / Desvio lateral de coluna', 'Escápula alada / protusa', 'Assimetria de pregas glúteas', 'Tendão calcâneo valgo/varo'], isRequired: false, helpText: 'Alterações posturais observadas de costas' },
        { id: 3, label: 'Desvios Posturais - Visão Lateral (Perfil)', fieldType: 'multi_select', options: ['Projeção anterior da cabeça', 'Hipercifose Torácica', 'Hiperlordose Lombar', 'Retificação Lombar', 'Anteversão Pélvica', 'Retroversão Pélvica', 'Genu Recurvatum', 'Genu Flexo'], isRequired: false, helpText: 'Alterações posturais observadas de perfil' },
        { id: 4, label: 'Conclusão e Conduta Postural', fieldType: 'long_text', isRequired: false, helpText: 'Orientações ergonômicas e alinhamento biomecânico' },
      ],
    },
  ],

  'Geriatria & Equilíbrio': [
    {
      label: 'Escala de Berg',
      title: 'Escala de Equilíbrio Funcional de Berg (BBS)',
      description: '14 testes funcionais de equilíbrio estático e dinâmico (0 a 56 pts)',
      category: 'Geriatria & Equilíbrio',
      getFields: () => [
        { id: 1, label: '1. Posição sentada para posição em pé', fieldType: 'single_select', isRequired: true, helpText: 'Instruções: Por favor, levante-se.', options: ['4 - Capaz de levantar-se sem utilizar as mãos', '3 - Capaz de levantar-se independentemente', '2 - Capaz de levantar-se utilizando as mãos após diversas tentativas', '1 - Necessita de ajuda mínima', '0 - Necessita de ajuda moderada ou máxima'] },
        { id: 2, label: '2. Permanecer em pé sem apoio', fieldType: 'single_select', isRequired: true, helpText: 'Fique em pé por 2 minutos sem apoio.', options: ['4 - Capaz por 2 minutos com segurança', '3 - Capaz por 2 minutos com supervisão', '2 - Capaz por 30 segundos sem apoio', '1 - Várias tentativas para 30s', '0 - Incapaz por 30s'] },
        { id: 3, label: '3. Permanecer sentado sem apoio nas costas', fieldType: 'single_select', isRequired: true, helpText: 'Sentado sem apoio por 2 minutos.', options: ['4 - Seguro por 2 minutos', '3 - Seguro por 2 min com supervisão', '2 - Capaz por 30s', '1 - Capaz por 10s', '0 - Incapaz por 10s'] },
        { id: 4, label: '4. Posição em pé para posição sentada', fieldType: 'single_select', isRequired: true, helpText: 'Por favor, sente-se.', options: ['4 - Senta com segurança, mínimo uso das mãos', '3 - Controla descida com as mãos', '2 - Apoia pernas na cadeira', '1 - Descida sem controle', '0 - Necessita de ajuda'] },
        { id: 5, label: '5. Transferências', fieldType: 'single_select', isRequired: true, helpText: 'Transferir-se entre cadeiras.', options: ['4 - Seguro com mínimo uso das mãos', '3 - Seguro com uso das mãos', '2 - Com orientação verbal/supervisão', '1 - Ajuda de 1 pessoa', '0 - Ajuda de 2 pessoas'] },
        { id: 6, label: '6. Permanecer em pé com olhos fechados', fieldType: 'single_select', isRequired: true, helpText: 'Em pé por 10 segundos de olhos fechados.', options: ['4 - Seguro por 10s', '3 - Com supervisão por 10s', '2 - Capaz por 3s', '1 - Incapaz de fechar 3s', '0 - Ajuda para não cair'] },
        { id: 7, label: '7. Permanecer em pé com os pés juntos', fieldType: 'single_select', isRequired: true, helpText: 'Pés juntos por 1 minuto.', options: genericBergOptions },
        { id: 8, label: '8. Alcançar a frente com o braço estendido', fieldType: 'single_select', isRequired: true, helpText: 'Braço a 90°, alcance máximo.', options: genericBergOptions },
        { id: 9, label: '9. Pegar um objeto do chão', fieldType: 'single_select', isRequired: true, helpText: 'Pegar objeto à frente dos pés.', options: genericBergOptions },
        { id: 10, label: '10. Virar-se para olhar para trás', fieldType: 'single_select', isRequired: true, helpText: 'Olhar por cima dos ombros.', options: genericBergOptions },
        { id: 11, label: '11. Girar 360 graus', fieldType: 'single_select', isRequired: true, helpText: 'Giro completo em ambas direções.', options: genericBergOptions },
        { id: 12, label: '12. Posicionar os pés alternadamente no degrau', fieldType: 'single_select', isRequired: true, helpText: 'Tocar degrau 4 vezes cada pé.', options: genericBergOptions },
        { id: 13, label: '13. Permanecer em pé com um pé à frente', fieldType: 'single_select', isRequired: true, helpText: 'Posição semi-tandem/tandem.', options: genericBergOptions },
        { id: 14, label: '14. Permanecer em pé sobre um pé só', fieldType: 'single_select', isRequired: true, helpText: 'Apoio unipodal sem apoio.', options: genericBergOptions },
      ],
    },
    {
      label: 'Teste TUG (Timed Up and Go)',
      title: 'Timed Up and Go (TUG)',
      description: 'Mobilidade básica, velocidade e risco de quedas',
      category: 'Geriatria & Equilíbrio',
      getFields: () => [
        { id: 1, label: 'Tempo de Execução (TUG)', fieldType: 'number', unit: 'segundos', helpText: 'Tempo para levantar, andar 3m, virar e sentar.', isRequired: true },
        { id: 2, label: 'Risco de Quedas / Dependência', fieldType: 'single_select', options: ['< 10 s - Baixo risco de quedas', '11 a 20 s - Risco moderado de quedas', '> 20 s - Alto risco de quedas', '> 30 s - Dependência funcional significativa'], isRequired: true },
      ],
    },
    {
      label: 'Índice de Barthel',
      title: 'Índice de Barthel (AVDs)',
      description: 'Grau de independência nas Atividades de Vida Diária (0 a 100 pts)',
      category: 'Geriatria & Equilíbrio',
      getFields: () => [
        { id: 1, label: 'Alimentação', fieldType: 'single_select', isRequired: true, options: ['0 - Incapacitado', '5 - Precisa de ajuda', '10 - Independente'] },
        { id: 2, label: 'Banho', fieldType: 'single_select', isRequired: true, options: ['0 - Dependente', '5 - Independente'] },
        { id: 3, label: 'Higiene Pessoal', fieldType: 'single_select', isRequired: true, options: ['0 - Precisa de ajuda', '5 - Independente'] },
        { id: 4, label: 'Vestir-se', fieldType: 'single_select', isRequired: true, options: ['0 - Dependente', '5 - Ajuda parcial', '10 - Independente'] },
        { id: 5, label: 'Intestino', fieldType: 'single_select', isRequired: true, options: ['0 - Incontinente', '5 - Acidente ocasional', '10 - Continente'] },
        { id: 6, label: 'Sistema Urinário', fieldType: 'single_select', isRequired: true, options: ['0 - Incontinente', '5 - Acidente ocasional', '10 - Continente'] },
        { id: 7, label: 'Uso do Vaso Sanitário', fieldType: 'single_select', isRequired: true, options: ['0 - Dependente', '5 - Ajuda parcial', '10 - Independente'] },
        { id: 8, label: 'Transferências (Cama/Cadeira)', fieldType: 'single_select', isRequired: true, options: ['0 - Incapacitado', '5 - Muita ajuda', '10 - Pouca ajuda', '15 - Independente'] },
        { id: 9, label: 'Mobilidade (Superfícies Planas)', fieldType: 'single_select', isRequired: true, options: ['0 - Imóvel', '5 - Cadeira de rodas independente', '10 - Caminha com ajuda', '15 - Independente'] },
        { id: 10, label: 'Escadas', fieldType: 'single_select', isRequired: true, options: ['0 - Incapacitado', '5 - Precisa de ajuda', '10 - Independente'] },
      ],
    },
  ],

  'Cardiorrespiratória': [
    {
      label: 'Teste TC6 (6 Minutos)',
      title: 'Teste de Caminhada de 6 Minutos (TC6)',
      description: 'Capacidade funcional submáxima cardiorrespiratória',
      category: 'Cardiorrespiratória',
      getFields: () => [
        { id: 1, label: 'SpO2 Basal', fieldType: 'number', unit: '%', isRequired: true, helpText: 'Saturação de oxigênio em repouso' },
        { id: 2, label: 'FC Basal', fieldType: 'number', unit: 'bpm', isRequired: true, helpText: 'Frequência cardíaca em repouso' },
        { id: 3, label: 'Dispneia Basal (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: true },
        { id: 4, label: 'Fadiga Basal (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: true },
        { id: 5, label: 'Distância Total Percorrida', fieldType: 'number', unit: 'metros', isRequired: true },
        { id: 6, label: 'SpO2 Final', fieldType: 'number', unit: '%', isRequired: true },
        { id: 7, label: 'FC Final', fieldType: 'number', unit: 'bpm', isRequired: true },
        { id: 8, label: 'Dispneia Final (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: true },
        { id: 9, label: 'Fadiga Final (Borg)', fieldType: 'single_select', options: borgScaleOptions, isRequired: true },
        { id: 10, label: 'Observações / Intercorrências', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Manovacuometria (PImáx/PEmáx)',
      title: 'Manovacuometria (Força Muscular Respiratória)',
      description: 'Pressões respiratórias estáticas máximas',
      category: 'Cardiorrespiratória',
      getFields: () => [
        { id: 1, label: 'PImáx Medida', fieldType: 'number', unit: 'cmH2O', isRequired: true },
        { id: 2, label: 'PImáx Prevista', fieldType: 'number', unit: 'cmH2O', isRequired: false },
        { id: 3, label: 'PEmáx Medida', fieldType: 'number', unit: 'cmH2O', isRequired: true },
        { id: 4, label: 'PEmáx Prevista', fieldType: 'number', unit: 'cmH2O', isRequired: false },
        { id: 5, label: 'Observações', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Peak Flow e PCF',
      title: 'Pico de Fluxo Expiratório (PEF) e Tosse (PCF)',
      description: 'Eficácia da tosse e fluxo expiratório',
      category: 'Cardiorrespiratória',
      getFields: () => [
        { id: 1, label: 'PEF - Pico de Fluxo Expiratório', fieldType: 'number', unit: 'L/min', isRequired: false },
        { id: 2, label: 'PCF - Pico de Fluxo de Tosse', fieldType: 'number', unit: 'L/min', isRequired: true, helpText: 'Pico de fluxo durante tosse voluntária' },
        { id: 3, label: 'Interpretação do PCF (Tosse)', fieldType: 'single_select', isRequired: true, options: ['> 270 L/min - Tosse eficaz', '160 a 270 L/min - Tosse potencialmente insuficiente', '< 160 L/min - Tosse ineficaz'] },
        { id: 4, label: 'Observações', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Escala de Dispneia - MRC',
      title: 'Escala de Dispneia do Medical Research Council (MRC)',
      description: 'Grau de falta de ar no cotidiano',
      category: 'Cardiorrespiratória',
      getFields: () => [
        { id: 1, label: 'Grau de Dispneia (MRC)', fieldType: 'single_select', isRequired: true, options: ['0 - Apenas com exercício extenuante', '1 - Ao caminhar rápido no plano ou subir ladeira suave', '2 - Mais devagar que pessoas da mesma idade', '3 - Para para respirar após 1 quadra ou poucos minutos', '4 - Muito dispneico para sair de casa ou ao se vestir'] },
      ],
    },
    {
      label: 'Classificação Funcional - NYHA',
      title: 'Classificação Funcional Cardíaca (NYHA)',
      description: 'Limitação funcional por sintomas cardíacos',
      category: 'Cardiorrespiratória',
      getFields: () => [
        { id: 1, label: 'Classe Funcional (NYHA)', fieldType: 'single_select', isRequired: true, options: ['CLASSE I - Ausência de sintomas em atividades cotidianas', 'CLASSE II - Sintomas leves em atividades cotidianas', 'CLASSE III - Sintomas em atividades leves/pequenos esforços', 'CLASSE IV - Sintomas em repouso'] },
      ],
    },
  ],

  'Composição Corporal': [
    {
      label: 'Avaliação por Bioimpedância',
      title: 'Bioimpedância Corporal',
      description: 'Composição corporal completa (massa magra, gorda, água e metabolismo)',
      category: 'Composição Corporal',
      getFields: () => [
        { id: 1, label: 'Peso', fieldType: 'number', unit: 'kg', isRequired: true },
        { id: 2, label: 'IMC (Índice de Massa Corporal)', fieldType: 'number', unit: 'kg/m²', isRequired: false },
        { id: 3, label: 'Gordura Corporal', fieldType: 'number', unit: '%', isRequired: false },
        { id: 4, label: 'Massa Muscular', fieldType: 'number', unit: 'kg', isRequired: false },
        { id: 5, label: 'Água Corporal', fieldType: 'number', unit: '%', isRequired: false },
        { id: 6, label: 'Gordura Visceral', fieldType: 'number', isRequired: false },
        { id: 7, label: 'TMB (Taxa Metabólica Basal)', fieldType: 'number', unit: 'kcal', isRequired: false },
        { id: 8, label: 'Idade Metabólica', fieldType: 'number', unit: 'anos', isRequired: false },
        { id: 9, label: 'Observações do Teste', fieldType: 'long_text', isRequired: false },
      ],
    },
  ],

  'Membros Superiores e Inferiores': [
    {
      label: 'Escala de Força Muscular (MRC)',
      title: 'Escala de Força Muscular Periférica (MRC 0-5)',
      description: 'Graduação de força muscular em 12 grupos musculares',
      category: 'Membros Superiores e Inferiores',
      getFields: () => [
        { id: 1, label: 'Flexão do Braço (Bíceps)', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 2, label: 'Extensão do Braço (Tríceps)', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 3, label: 'Elevação de Ombro', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 4, label: 'Rotação Externa do Ombro', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 5, label: 'Flexão do Punho', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 6, label: 'Extensão do Punho', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 7, label: 'Flexão do Quadril', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 8, label: 'Extensão do Quadril', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 9, label: 'Flexão do Joelho', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 10, label: 'Extensão do Joelho', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 11, label: 'Flexão do Tornozelo', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
        { id: 12, label: 'Extensão do Tornozelo', fieldType: 'single_select', isRequired: true, options: mrcMuscleOptions },
      ],
    },
  ],

  'Goniometria': [
    'Cervical', 'Ombro', 'Cotovelo e Antebraço', 'Punho', 'Quadril', 'Joelho', 'Tornozelo'
  ].map((joint) => ({
    label: `Goniometria - ${joint}`,
    title: `Goniometria Articular - ${joint}`,
    description: `Graus de Amplitude de Movimento (ADM) para ${joint}`,
    category: 'Goniometria',
    getFields: () => makeGoniometriaFields(joint),
  })),

  'Geral': [
    {
      label: 'Anamnese Fisioterapêutica',
      title: 'Anamnese e História Clínica',
      description: 'Queixa Principal, HDA, HMP, Histórico Familiar e Diagnóstico Funcional',
      category: 'Geral',
      getFields: () => [
        { id: 1, label: 'Queixa Principal (QP) / Motivo da Consulta', fieldType: 'long_text', isRequired: true, helpText: 'Motivo principal da procura pelo atendimento' },
        { id: 2, label: 'História da Doença Atual (HDA)', fieldType: 'long_text', isRequired: true, helpText: 'Início, evolução, mecanismo de lesão e sintomas' },
        { id: 3, label: 'História Médica Pregressa (HMP)', fieldType: 'long_text', isRequired: false, helpText: 'Cirurgias, comorbidades (HAS, DM), medicamentos' },
        { id: 4, label: 'Histórico Familiar (HF)', fieldType: 'long_text', isRequired: false },
        { id: 5, label: 'Observações Gerais & Diagnóstico Funcional', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Pontos e Mapeamento de Dor (Body Map)',
      title: 'Mapeamento Anatômico e Tipo de Dor',
      description: 'Localização anatômica, padrão e fatores agravantes',
      category: 'Geral',
      getFields: () => [
        { id: 1, label: 'Intensidade da Dor (Escala EVA)', fieldType: 'scale_0_10', isRequired: true },
        { id: 2, label: 'Localização Anatômica da Dor', fieldType: 'text', isRequired: true },
        { id: 3, label: 'Tipo / Característica da Dor', fieldType: 'single_select', options: ['Queimação', 'Pontada / Agulhada', 'Latejante / Pulsátil', 'Em Peso / Cansaço', 'Choque / Irradiada', 'Contínua / Profunda'], isRequired: true },
        { id: 4, label: 'Fatores de Piora e Melhora', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Escala Visual Analógica (EVA)',
      title: 'Escala Visual Analógica (EVA 0-10)',
      description: 'Intensidade e frequência da dor',
      category: 'Geral',
      getFields: () => [
        { id: 1, label: 'Intensidade da Dor (EVA)', fieldType: 'scale_0_10', isRequired: true },
        { id: 2, label: 'Local da Dor', fieldType: 'text', isRequired: false },
        { id: 3, label: 'Frequência / Pior Momento', fieldType: 'single_select', options: ['Constante', 'Ao movimento', 'Ao repouso', 'Matinal', 'Noturna'], isRequired: false },
        { id: 4, label: 'Observações / Medicamentos', fieldType: 'long_text', isRequired: false },
      ],
    },
    {
      label: 'Qualidade de Vida (SF-36)',
      title: 'Questionário de Qualidade de Vida (SF-36)',
      description: 'Saúde física, capacidade funcional, dor e aspectos emocionais',
      category: 'Geral',
      getFields: () => [
        { id: 1, label: '1 - Em geral sua saúde é:', fieldType: 'single_select', isRequired: true, options: ['1 - Excelente', '2 - Muito Boa', '3 - Boa', '4 - Ruim', '5 - Muito Ruim'] },
        { id: 2, label: '2 - Comparada há um ano atrás:', fieldType: 'single_select', isRequired: true, options: ['1 - Muito Melhor', '2 - Um Pouco Melhor', '3 - Quase a Mesma', '4 - Um Pouco Pior', '5 - Muito Pior'] },
        { id: 3, label: '3a - Atividades Rigorosas (correr, levantar peso)', fieldType: 'single_select', isRequired: true, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 4, label: '3b - Atividades Moderadas', fieldType: 'single_select', isRequired: true, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 5, label: '3c - Levantar ou carregar mantimentos', fieldType: 'single_select', isRequired: true, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 6, label: '3d - Subir vários lances de escada', fieldType: 'single_select', isRequired: true, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 7, label: '3e - Subir um lance de escada', fieldType: 'single_select', isRequired: true, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 8, label: '3f - Curvar-se ou ajoelhar-se', fieldType: 'single_select', isRequired: true, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 9, label: '3g - Andar mais de 1 km', fieldType: 'single_select', isRequired: true, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
        { id: 10, label: '3h - Tomar banho ou vestir-se', fieldType: 'single_select', isRequired: true, options: ['1 - Dificulta muito', '2 - Dificulta um pouco', '3 - Não dificulta'] },
      ],
    },
    {
      label: 'Qualidade do Sono (PSQI)',
      title: 'Índice de Qualidade do Sono de Pittsburgh (PSQI)',
      description: 'Padrão, latência, duração e distúrbios do sono',
      category: 'Geral',
      getFields: () => [
        { id: 1, label: '1. Hora usual de deitar', fieldType: 'text', isRequired: true },
        { id: 2, label: '2. Minutos para adormecer', fieldType: 'number', unit: 'min', isRequired: true },
        { id: 3, label: '3. Hora usual de levantar', fieldType: 'text', isRequired: true },
        { id: 4, label: '4. Horas de sono real por noite', fieldType: 'number', unit: 'horas', isRequired: true },
        { id: 5, label: '5. Não conseguiu dormir em 30 min', fieldType: 'single_select', isRequired: true, options: freqPSQIOptions },
        { id: 6, label: '6. Acordou no meio da noite / madrugada', fieldType: 'single_select', isRequired: true, options: freqPSQIOptions },
        { id: 7, label: '7. Qualidade geral do sono', fieldType: 'single_select', isRequired: true, options: ['0 - Muito boa', '1 - Boa', '2 - Ruim', '3 - Muito Ruim'] },
        { id: 8, label: '8. Medicamento para dormir', fieldType: 'single_select', isRequired: true, options: freqPSQIOptions },
        { id: 9, label: '9. Dificuldade para ficar acordado de dia', fieldType: 'single_select', isRequired: true, options: freqPSQIOptions },
      ],
    },
  ],
};
