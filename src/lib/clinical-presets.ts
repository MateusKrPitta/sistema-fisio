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
  // 1. NEUROLÓGICA
  'Neurológica': [
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
        { id: 12, label: 'Observações / Intercorrências', fieldType: 'long_text', isRequired: false },
      ],
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
      description: 'Localização anatômica corporal, tipo, irradiação e fatores agravantes',
      category: 'Dor',
      getFields: () => [
        { id: 1, label: 'Intensidade da Dor (Escala EVA)', fieldType: 'scale_0_10', isRequired: false },
        {
          id: 2,
          label: 'Regiões Anatômicas Afetadas (Body Map)',
          fieldType: 'multi_select',
          isRequired: false,
          options: [
            'Cabeça / Face',
            'Coluna Cervical',
            'Coluna Torácica',
            'Coluna Lombar',
            'Ombro Direito',
            'Ombro Esquerdo',
            'Cotovelo/Antebraço Direito',
            'Cotovelo/Antebraço Esquerdo',
            'Punho/Mão Direita',
            'Punho/Mão Esquerda',
            'Quadril/Pelve Direita',
            'Quadril/Pelve Esquerda',
            'Joelho Direito',
            'Joelho Esquerdo',
            'Tornozelo/Pé Direito',
            'Tornozelo/Pé Esquerdo',
          ],
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
      label: 'Escala de Força Muscular (MRC)',
      title: 'Escala de Força Muscular Periférica (MRC 0-5)',
      description: 'Graduação de força muscular (0 a 5) nos principais grupos e músculos específicos',
      category: 'Força Muscular',
      getFields: () => [
        { id: 1, label: 'Flexão do Braço (Bíceps)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 2, label: 'Extensão do Braço (Tríceps)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 3, label: 'Elevação / Abdução de Ombro', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 4, label: 'Rotação Externa de Ombro', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 5, label: 'Flexão do Punho', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 6, label: 'Extensão do Punho', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 7, label: 'Flexão do Quadril (Iliopsoas)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 8, label: 'Extensão do Quadril (Glúteo Máximo)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 9, label: 'Flexão do Joelho (Isquiotibiais)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 10, label: 'Extensão do Joelho (Quadríceps)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 11, label: 'Dorsiflexão do Tornozelo (Tibial Anterior)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 12, label: 'Flexão Plantar (Tríceps Sural)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 13, label: 'Músculo Específico Avaliado (Caso Necessário)', fieldType: 'text', isRequired: false, helpText: 'Ex: Serrátil Anterior, Trapézio, Glúteo Médio, etc.' },
        { id: 14, label: 'Grau de Força do Músculo Específico (MRC)', fieldType: 'single_select', isRequired: false, options: mrcMuscleOptions },
        { id: 15, label: 'Observações / Assimetrias de Força Muscular', fieldType: 'long_text', isRequired: false, helpText: 'Anotar assimetrias, fadiga ou compensações' },
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
      description: 'Queixa Principal, HDA, HMP, Histórico Familiar e Diagnóstico Funcional',
      category: 'Geral',
      getFields: () => [
        { id: 1, label: 'Queixa Principal (QP) / Motivo da Consulta', fieldType: 'long_text', isRequired: false, helpText: 'Motivo principal da procura pelo atendimento' },
        { id: 2, label: 'História da Doença Atual (HDA)', fieldType: 'long_text', isRequired: false, helpText: 'Início, evolução, mecanismo de lesão e sintomas' },
        { id: 3, label: 'História Médica Pregressa (HMP)', fieldType: 'long_text', isRequired: false, helpText: 'Cirurgias, comorbidades (HAS, DM), medicamentos' },
        { id: 4, label: 'Histórico Familiar (HF)', fieldType: 'long_text', isRequired: false },
        { id: 5, label: 'Observações Gerais & Diagnóstico Funcional', fieldType: 'long_text', isRequired: false },
      ],
    },
  ],
};
