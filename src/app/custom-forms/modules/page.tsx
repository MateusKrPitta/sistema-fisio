'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Check,
  PlusCircle,
  HelpCircle,
  Hash,
  Type,
  Calendar as CalendarIcon,
  Sliders,
  ListOrdered,
  CheckSquare,
  Sparkles,
  Eye,
  Loader2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Activity,
  Clock,
  Camera,
  Upload,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/toast-context';
import { CustomSelect } from '@/components/custom-select';
import { useRouter, useSearchParams } from 'next/navigation';
import { FillFormModal } from '@/components/fill-form-modal';

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

export interface CustomModule {
  id: number | string;
  name: string;
  description?: string | null;
  category?: string;
  fields: CustomField[];
  meta?: {
    fields_count?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

const formatDate = (dateString?: string) => {
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

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao processar a imagem'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
}

export default function CustomModulesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fillPatientId = searchParams ? searchParams.get('fillPatientId') : null;
  const createEvaluationFor = searchParams ? searchParams.get('createEvaluationFor') : null;
  const viewEvolutionsFor = searchParams ? searchParams.get('viewEvolutionsFor') : null;
  const expandEvolution = searchParams ? searchParams.get('expandEvolution') : null;

  const [modules, setModules] = useState<CustomModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPresetToLoad, setSelectedPresetToLoad] = useState<string>('');
  const [loadedPresets, setLoadedPresets] = useState<string[]>([]);
  const [editingModule, setEditingModule] = useState<CustomModule | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Specialty & Search Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fill Modal State
  const [showFillModal, setShowFillModal] = useState(false);
  const [fillingPatient, setFillingPatient] = useState<any>(null);

  // Evolutions Side Modal State
  const [evolutionsModalOpen, setEvolutionsModalOpen] = useState(false);
  const [evolutionsPatient, setEvolutionsPatient] = useState<any>(null);
  const [loadingEvolutions, setLoadingEvolutions] = useState(false);
  const [expandedEvolutions, setExpandedEvolutions] = useState<number[]>([]);
  const [evolutionDetails, setEvolutionDetails] = useState<Record<number | string, { notes?: string; images?: string[]; loading?: boolean }>>({});

  const fetchEvolutionDetail = async (appId: number | string, fallbackApp?: any) => {
    if (evolutionDetails[appId]?.notes !== undefined || evolutionDetails[appId]?.images !== undefined) {
      return;
    }

    setEvolutionDetails(prev => ({
      ...prev,
      [appId]: { ...prev[appId], loading: true }
    }));

    try {
      const res = await api.get(`/appointments/${appId}`);
      const data = res?.data?.id ? res.data : res;
      const parsedImages = Array.isArray(data.images)
        ? data.images
        : (typeof data.images === 'string' ? JSON.parse(data.images) : []);

      setEvolutionDetails(prev => ({
        ...prev,
        [appId]: {
          notes: data.notes || '',
          images: parsedImages,
          loading: false
        }
      }));
    } catch {
      setEvolutionDetails(prev => ({
        ...prev,
        [appId]: {
          notes: fallbackApp?.notes || '',
          images: Array.isArray(fallbackApp?.images) ? fallbackApp.images : [],
          loading: false
        }
      }));
    }
  };

  const toggleEvolution = (app: any) => {
    const isExpanded = expandedEvolutions.includes(app.id);
    if (isExpanded) {
      setExpandedEvolutions(prev => prev.filter(id => id !== app.id));
    } else {
      setExpandedEvolutions(prev => [...prev, app.id]);
      fetchEvolutionDetail(app.id, app);
    }
  };

  const openEvolutionsModal = (id: number | string, expandId?: number) => {
    setEvolutionsModalOpen(true);
    setLoadingEvolutions(true);
    setExpandedEvolutions(expandId ? [expandId] : []);
    if (expandId) {
      fetchEvolutionDetail(expandId);
    }
    api
      .get(`/patients/${id}`)
      .then((res) => {
        setEvolutionsPatient(res);
      })
      .catch((err) => {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as evoluções do paciente.',
          type: 'error',
        });
        setEvolutionsModalOpen(false);
      })
      .finally(() => setLoadingEvolutions(false));
  };

  // Edit Evolution Modal State
  const [editingEvolutionModalOpen, setEditingEvolutionModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [savingEvolution, setSavingEvolution] = useState(false);
  const [uploadingEditImages, setUploadingEditImages] = useState(false);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleStartEditEvolution = async (app: any) => {
    setEditingApp(app);
    let d = '';
    if (app.date) {
      if (typeof app.date === 'string') {
        d = app.date.split('T')[0];
      } else {
        d = new Date(app.date).toISOString().split('T')[0];
      }
    }
    setEditDate(d);
    setEditStartTime(app.startTime || '08:00');
    setEditEndTime(app.endTime || '09:00');
    setEditSpecialty(app.specialty || 'Atendimento Fisioterapêutico');

    let currentNotes = evolutionDetails[app.id]?.notes ?? app.notes ?? '';
    let currentImages = evolutionDetails[app.id]?.images ?? (Array.isArray(app.images) ? app.images : []);

    if (evolutionDetails[app.id]?.notes === undefined) {
      try {
        const res = await api.get(`/appointments/${app.id}`);
        const data = res?.data?.id ? res.data : res;
        currentNotes = data.notes || '';
        currentImages = Array.isArray(data.images) ? data.images : (typeof data.images === 'string' ? JSON.parse(data.images) : []);
        setEvolutionDetails(prev => ({
          ...prev,
          [app.id]: { notes: currentNotes, images: currentImages, loading: false }
        }));
      } catch {}
    }

    let cleanNotes = currentNotes;
    if (cleanNotes.includes('<p>') || cleanNotes.includes('<br>')) {
      cleanNotes = cleanNotes
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p>/gi, '\n\n')
        .replace(/<\/?p>/gi, '')
        .replace(/<strong>(.*?)<\/strong>/gi, '$1')
        .replace(/<em>(.*?)<\/em>/gi, '$1')
        .trim();
    }
    setEditNotes(cleanNotes);
    setEditImages([...currentImages]);
    setEditingEvolutionModalOpen(true);
  };

  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setSavingEvolution(true);
    try {
      const formattedNotes = editNotes.trim()
        ? editNotes
            .split('\n\n')
            .map(para => `<p>${para.replace(/\n/g, '<br />')}</p>`)
            .join('')
        : null;

      await api.put(`/appointments/${editingApp.id}`, {
        date: editDate || undefined,
        startTime: editStartTime || undefined,
        endTime: editEndTime || undefined,
        specialty: editSpecialty || undefined,
        notes: formattedNotes,
        images: editImages,
      });

      // Update patient appointments in local state
      setEvolutionsPatient((prev: any) => {
        if (!prev || !prev.appointments) return prev;
        const updatedApps = prev.appointments.map((a: any) => {
          if (a.id === editingApp.id) {
            return {
              ...a,
              date: editDate,
              startTime: editStartTime,
              endTime: editEndTime,
              specialty: editSpecialty,
              notes: formattedNotes,
              images: editImages,
            };
          }
          return a;
        });
        return { ...prev, appointments: updatedApps };
      });

      setEvolutionDetails((prev) => ({
        ...prev,
        [editingApp.id]: {
          notes: formattedNotes || '',
          images: editImages,
          loading: false,
        },
      }));

      toast({
        title: 'Evolução Atualizada!',
        description: 'As anotações e fotos da evolução foram atualizadas com sucesso.',
        type: 'success',
      });

      setEditingEvolutionModalOpen(false);
    } catch {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível atualizar a evolução clínica.',
        type: 'error',
      });
    } finally {
      setSavingEvolution(false);
    }
  };

  const handleEditFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingEditImages(true);
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast({
        title: 'Formato Inválido',
        description: 'Selecione arquivos de imagem válidos (JPG, PNG, WEBP).',
        type: 'warning',
      });
      setUploadingEditImages(false);
      return;
    }

    try {
      const compressedUrls = await Promise.all(
        validFiles.map(file => compressImageFile(file))
      );
      setEditImages(prev => [...prev, ...compressedUrls]);
      toast({
        title: 'Imagens Adicionadas',
        description: `${compressedUrls.length} ${compressedUrls.length === 1 ? 'imagem anexada' : 'imagens anexadas'}.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível processar algumas imagens.',
        type: 'error',
      });
    } finally {
      setUploadingEditImages(false);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveEditImage = (indexToRemove: number) => {
    setEditImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Form State
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleCategory, setModuleCategory] = useState('Controle de Tronco');
  const [fields, setFields] = useState<CustomField[]>([]);

  // New field temporary input state
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<CustomField['fieldType']>('text');
  const [fieldUnit, setFieldUnit] = useState('');
  const [fieldHelpText, setFieldHelpText] = useState('');
  const [fieldOptionsText, setFieldOptionsText] = useState('');
  const [fieldIsRequired, setFieldIsRequired] = useState(false);

  const loadAnamnesePreset = () => {
    return [
      { id: Date.now() + 1, label: 'Queixa Principal (QP) / Motivo da Consulta', fieldType: 'long_text', isRequired: true, helpText: 'Motivo principal da procura pelo atendimento fisioterapêutico' },
      { id: Date.now() + 2, label: 'História da Doença Atual (HDA)', fieldType: 'long_text', isRequired: true, helpText: 'Início dos sintomas, evolução, mecanismo de lesão, fatores de piora e melhora' },
      { id: Date.now() + 3, label: 'História Médica Pregressa (HMP)', fieldType: 'long_text', isRequired: false, helpText: 'Cirurgias, comorbidades (HAS, DM), medicamentos em uso e internações' },
      { id: Date.now() + 4, label: 'Histórico Familiar (HF)', fieldType: 'long_text', isRequired: false, helpText: 'Histórico de doenças crônicas ou hereditárias na família' },
      { id: Date.now() + 5, label: 'Observações Gerais & Diagnóstico Funcional', fieldType: 'long_text', isRequired: false, helpText: 'Parecer clínico inicial e objetivos terapêuticos' }
    ];
  };

  const loadPainMapPreset = () => {
    return [
      { id: Date.now() + 1, label: 'Intensidade da Dor (Escala EVA)', fieldType: 'scale_0_10', isRequired: true, helpText: '0 = sem dor, 5 = moderada, 10 = insuportável' },
      { id: Date.now() + 2, label: 'Localização Anatômica da Dor', fieldType: 'text', isRequired: true, helpText: 'Ex: Coluna lombar L4-L5, ombro direito' },
      { id: Date.now() + 3, label: 'Tipo / Característica da Dor', fieldType: 'single_select', options: ['Queimação', 'Pontada / Agulhada', 'Latejante / Pulsátil', 'Em Peso / Cansaço', 'Choque / Irradiada', 'Contínua / Profunda'], isRequired: true, helpText: 'Selecione o padrão predominante da dor' },
      { id: Date.now() + 4, label: 'Fatores de Piora e Melhora', fieldType: 'long_text', isRequired: false, helpText: 'Movimentos ou posições que agravam ou aliviam o sintoma' }
    ];
  };

  const loadPosturePreset = () => {
    return [
      { id: Date.now() + 1, label: 'Desvios Posturais - Visão Anterior (De Frente)', fieldType: 'multi_select', options: ['Inclinação cervical', 'Rotação cervical', 'Elevação/Desalinhamento de ombros', 'Triângulo de Tales assimétrico', 'Desalinhamento de quadril', 'Geno Valgo', 'Genu Varo', 'Pé Pronado', 'Pé Supinado'], isRequired: false, helpText: 'Alterações posturais observadas de frente' },
      { id: Date.now() + 2, label: 'Desvios Posturais - Visão Posterior (De Costas)', fieldType: 'multi_select', options: ['Escoliose / Desvio lateral de coluna', 'Escápula alada / protusa', 'Assimetria de pregas glúteas', 'Tendão calcâneo valgo/varo'], isRequired: false, helpText: 'Alterações posturais observadas de costas' },
      { id: Date.now() + 3, label: 'Desvios Posturais - Visão Lateral (Perfil)', fieldType: 'multi_select', options: ['Projeção anterior da cabeça', 'Hipercifose Torácica', 'Hiperlordose Lombar', 'Retificação Lombar', 'Anteversão Pélvica', 'Retroversão Pélvica', 'Genu Recurvatum', 'Genu Flexo'], isRequired: false, helpText: 'Alterações posturais observadas de perfil' },
      { id: Date.now() + 4, label: 'Conclusão e Conduta Postural', fieldType: 'long_text', isRequired: false, helpText: 'Orientações ergonômicas e alinhamento biomecânico' }
    ];
  };

  const trunkOptionsList = [
    '0 - Incapaz de fazer sem assistência',
    '12 - Capaz de fazer usando ajuda ou em um padrão anormal de movimento. Usa os braços para manter-se quando sentado',
    '25 - Capaz de completar a tarefa normalmente.',
  ];

  const loadTrunkControlPreset = () => {

    return [{
        id: Date.now() + 1,
        label: 'Rolar para o lado afetado',
        fieldType: 'single_select',
        options: trunkOptionsList,
        helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)',
        isRequired: true,
      },
      {
        id: Date.now() + 2,
        label: 'Rolar para o lado sadio',
        fieldType: 'single_select',
        options: trunkOptionsList,
        helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)',
        isRequired: true,
      },
      {
        id: Date.now() + 3,
        label: 'Equilíbrio na posição sentada na beira da cama por pelo menos 30 segundos',
        fieldType: 'single_select',
        options: trunkOptionsList,
        helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)',
        isRequired: true,
      },
      {
        id: Date.now() + 4,
        label: 'Sentar-se a partir de deitado',
        fieldType: 'single_select',
        options: trunkOptionsList,
        helpText: 'Pontuação: 0 (Incapaz), 12 (Ajuda/Anormal), 25 (Normal)',
        isRequired: true,
      },]
  };

  const loadGlasgowScalePreset = () => {

    return [{
        id: Date.now() + 1,
        label: 'Abertura Ocular',
        fieldType: 'single_select',
        options: ['4 - Espontânea', '3 - Ao chamado', '2 - À dor', '1 - Ausente'],
        helpText: 'Pontuação de 1 a 4',
        isRequired: true,
      },
      {
        id: Date.now() + 2,
        label: 'Resposta Verbal',
        fieldType: 'single_select',
        options: ['5 - Orientado', '4 - Confuso', '3 - Palavras', '2 - Sons', '1 - Ausente'],
        helpText: 'Pontuação de 1 a 5',
        isRequired: true,
      },
      {
        id: Date.now() + 3,
        label: 'Resposta Motora',
        fieldType: 'single_select',
        options: ['6 - Obedece', '5 - Localiza', '4 - Flete', '3 - Flexão Anormal', '2 - Extensão', '1 - Ausente'],
        helpText: 'Pontuação de 1 a 6',
        isRequired: true,
      },]
  };

  const loadAshworthScalePreset = () => {

    return [{
        id: Date.now() + 1,
        label: 'Grau de Espasticidade (Membro Avaliado)',
        fieldType: 'single_select',
        options: [
          '0 - Nenhum aumento no tônus',
          '1 - Leve aumento no final da ADM',
          '1+ - Leve aumento em menos da metade da ADM',
          '2 - Aumento marcante na maior parte da ADM',
          '3 - Aumento considerável, movimento difícil',
          '4 - Parte afetada rígida'
        ],
        helpText: 'Selecione o grau de tônus muscular (0 a 4)',
        isRequired: true,
      },
      {
        id: Date.now() + 2,
        label: 'Grupo Muscular / Segmento Avaliado',
        fieldType: 'text',
        helpText: 'Ex: Bíceps braquial direito, Isquiotibiais',
        isRequired: true,
      }]
  };

  const loadMRCScalePreset = () => {

    const mrcOptions = [
      '5 - Contração normal contra resistência plena',
      '4 - Contração contra resistência parcial',
      '3 - Contração contra gravidade apenas',
      '2 - Contração contra gravidade parcial',
      '1 - Contração contra gravidade mínima',
      '0 - Sem contração detectável'
    ];

    return [{ id: Date.now() + 1, label: 'Flexão do Braço (Bíceps)', fieldType: 'single_select', isRequired: true, helpText: 'Teste de flexão do braço contra gravidade', options: mrcOptions },
      { id: Date.now() + 2, label: 'Extensão do Braço (Tríceps)', fieldType: 'single_select', isRequired: true, helpText: 'Teste de extensão do braço contra gravidade', options: mrcOptions },
      { id: Date.now() + 3, label: 'Elevação de Ombro', fieldType: 'single_select', isRequired: true, helpText: 'Teste de elevação do ombro contra gravidade', options: mrcOptions },
      { id: Date.now() + 4, label: 'Rotação Externa do Ombro', fieldType: 'single_select', isRequired: true, helpText: 'Teste de rotação externa do ombro contra gravidade', options: mrcOptions },
      { id: Date.now() + 5, label: 'Flexão do Punho', fieldType: 'single_select', isRequired: true, helpText: 'Teste de flexão do punho contra gravidade', options: mrcOptions },
      { id: Date.now() + 6, label: 'Extensão do Punho', fieldType: 'single_select', isRequired: true, helpText: 'Teste de extensão do punho contra gravidade', options: mrcOptions },
      { id: Date.now() + 7, label: 'Flexão do Quadril', fieldType: 'single_select', isRequired: true, helpText: 'Teste de flexão do quadril contra gravidade', options: mrcOptions },
      { id: Date.now() + 8, label: 'Extensão do Quadril', fieldType: 'single_select', isRequired: true, helpText: 'Teste de extensão do quadril contra gravidade', options: mrcOptions },
      { id: Date.now() + 9, label: 'Flexão do Joelho', fieldType: 'single_select', isRequired: true, helpText: 'Teste de flexão do joelho contra gravidade', options: mrcOptions },
      { id: Date.now() + 10, label: 'Extensão do Joelho', fieldType: 'single_select', isRequired: true, helpText: 'Teste de extensão do joelho contra gravidade', options: mrcOptions },
      { id: Date.now() + 11, label: 'Flexão do Tornozelo', fieldType: 'single_select', isRequired: true, helpText: 'Teste de flexão do tornozelo contra gravidade', options: mrcOptions },
      { id: Date.now() + 12, label: 'Extensão do Tornozelo', fieldType: 'single_select', isRequired: true, helpText: 'Teste de extensão do tornozelo contra gravidade', options: mrcOptions }]
  };

  const loadTUGScalePreset = () => {

    return [{
        id: Date.now() + 1,
        label: 'Tempo de Execução (TUG)',
        fieldType: 'number',
        unit: 'segundos',
        helpText: 'Tempo para levantar, andar 3 metros, virar, voltar e sentar. Referências: 60-69 anos (até 8.1s), 70-79 anos (até 9.2s), 80-99 anos (até 11.3s)',
        isRequired: true,
      },
      {
        id: Date.now() + 2,
        label: 'Risco de Quedas / Dependência',
        fieldType: 'single_select',
        options: [
          '< 10 s - Baixo risco de quedas',
          '11 a 20 s - Risco moderado de quedas',
          '> 20 s - Alto risco de quedas',
          '> 30 s - Dependência funcional significativa'
        ],
        helpText: 'Classifique o risco com base no tempo de execução medido',
        isRequired: true,
      }]
  };

  const loadTC6Preset = () => {

    const borgOptions = [
      '0 - Nenhuma',
      '0.5 - Muito, muito leve',
      '1 - Muito leve',
      '2 - Leve',
      '3 - Moderada',
      '4 - Pouco intensa',
      '5 - Intensa',
      '7 - Muito intensa',
      '9 - Muito, muito intensa',
      '10 - Máxima'
    ];

    return [{ id: Date.now() + 1, label: 'SpO2 Basal', fieldType: 'number', unit: '%', isRequired: true, helpText: 'Saturação de oxigênio antes de iniciar o teste' },
      { id: Date.now() + 2, label: 'FC Basal', fieldType: 'number', unit: 'bpm', isRequired: true, helpText: 'Frequência cardíaca em repouso' },
      { id: Date.now() + 3, label: 'Dispneia Basal (Borg)', fieldType: 'single_select', options: borgOptions, isRequired: true, helpText: 'Escala de percepção de falta de ar' },
      { id: Date.now() + 4, label: 'Fadiga Basal (Borg)', fieldType: 'single_select', options: borgOptions, isRequired: true, helpText: 'Escala de percepção de fadiga (pernas)' },
      
      { id: Date.now() + 5, label: 'Distância Total Percorrida', fieldType: 'number', unit: 'metros', isRequired: true, helpText: 'Metragem total após os 6 minutos' },
      { id: Date.now() + 6, label: 'Número de Paradas', fieldType: 'number', isRequired: false, helpText: 'Quantas vezes o paciente precisou parar' },
      { id: Date.now() + 7, label: 'Duração das Paradas', fieldType: 'text', isRequired: false, helpText: 'Ex: 1 minuto' },

      { id: Date.now() + 8, label: 'SpO2 Final', fieldType: 'number', unit: '%', isRequired: true, helpText: 'Saturação de oxigênio imediatamente após o término' },
      { id: Date.now() + 9, label: 'FC Final', fieldType: 'number', unit: 'bpm', isRequired: true, helpText: 'Frequência cardíaca imediatamente após o término' },
      { id: Date.now() + 10, label: 'Dispneia Final (Borg)', fieldType: 'single_select', options: borgOptions, isRequired: true },
      { id: Date.now() + 11, label: 'Fadiga Final (Borg)', fieldType: 'single_select', options: borgOptions, isRequired: true },
      
      { id: Date.now() + 12, label: 'Observações / Intercorrências', fieldType: 'long_text', isRequired: false, helpText: 'Anotar queixas de dor, desequilíbrio, etc.' }]
  };

  const loadManovacuometriaPreset = () => {

    return [{ id: Date.now() + 1, label: 'PImáx Medida', fieldType: 'number', unit: 'cmH2O', isRequired: true, helpText: 'Pressão Inspiratória Máxima alcançada' },
      { id: Date.now() + 2, label: 'PImáx Prevista', fieldType: 'number', unit: 'cmH2O', isRequired: false, helpText: 'Valor previsto (referência baseada em sexo e idade)' },
      { id: Date.now() + 3, label: '% do Previsto (PImáx)', fieldType: 'number', unit: '%', isRequired: false, helpText: '(PImáx Medida / PImáx Prevista) x 100' },
      
      { id: Date.now() + 4, label: 'PEmáx Medida', fieldType: 'number', unit: 'cmH2O', isRequired: true, helpText: 'Pressão Expiratória Máxima alcançada' },
      { id: Date.now() + 5, label: 'PEmáx Prevista', fieldType: 'number', unit: 'cmH2O', isRequired: false, helpText: 'Valor previsto (referência baseada em sexo e idade)' },
      { id: Date.now() + 6, label: '% do Previsto (PEmáx)', fieldType: 'number', unit: '%', isRequired: false, helpText: '(PEmáx Medida / PEmáx Prevista) x 100' },
      
      { id: Date.now() + 7, label: 'Observações', fieldType: 'long_text', isRequired: false, helpText: 'Condições do teste, uso de clipe nasal, vazamentos, etc.' }]
  };

  const loadPeakFlowPreset = () => {

    return [{ id: Date.now() + 1, label: 'PEF - Pico de Fluxo Expiratório', fieldType: 'number', unit: 'L/min', isRequired: false, helpText: 'Velocidade máxima em expiração forçada (Peak Flow Meter)' },
      { id: Date.now() + 2, label: 'Interpretação do PEF', fieldType: 'single_select', isRequired: false, options: [
        'Zona Verde (> 80% do melhor) - Controle adequado',
        'Zona Amarela (50-79%) - Sinal de alerta',
        'Zona Vermelha (< 50%) - Obstrução grave'
      ] },
      { id: Date.now() + 3, label: 'PCF - Pico de Fluxo de Tosse (Bocal/Sem Máscara)', fieldType: 'number', unit: 'L/min', isRequired: true, helpText: 'Pico de fluxo durante manobra de tosse voluntária' },
      { id: Date.now() + 4, label: 'PCF - Pico de Fluxo de Tosse (Com Máscara)', fieldType: 'number', unit: 'L/min', isRequired: false, helpText: 'Em caso de fraqueza orofacial ou vazamento no bocal' },
      { id: Date.now() + 5, label: 'Interpretação do PCF (Tosse)', fieldType: 'single_select', isRequired: true, helpText: 'Com base no maior valor alcançado de PCF', options: [
        '> 270 L/min - Tosse eficaz',
        '160 a 270 L/min - Tosse potencialmente insuficiente',
        '< 160 L/min - Tosse ineficaz (considerar assistência)'
      ] },
      { id: Date.now() + 6, label: 'Observações', fieldType: 'long_text', isRequired: false, helpText: 'Condições do teste, compreensão do paciente, etc.' }]
  };

  const loadMRCDyspneaPreset = () => {

    return [{
        id: Date.now() + 1,
        label: 'Grau de Dispnéia (MRC)',
        fieldType: 'single_select',
        isRequired: true,
        helpText: 'Selecione o grau que melhor descreve a falta de ar do paciente',
        options: [
          '0 - Sem dispnéia, a não ser com exercício extenuante',
          '1 - Falta de ar quando caminha depressa no plano ou sobe ladeira suave',
          '2 - Anda mais devagar que pessoa da mesma idade no plano devido à falta de ar ou tem de parar para respirar',
          '3 - Pára de respirar após caminhar uma quadra (90 a 120m) ou após poucos minutos no plano',
          '4 - Muito dispnéico para sair de casa ou dispnéico ao vestir-se'
        ]
      }]
  };

  const loadNYHAScalePreset = () => {

    return [{
        id: Date.now() + 1,
        label: 'Classe Funcional (NYHA)',
        fieldType: 'single_select',
        isRequired: true,
        helpText: 'Selecione a classe de sintomas de insuficiência cardíaca',
        options: [
          'CLASSE I - Ausência de sintomas durante atividades cotidianas.',
          'CLASSE II - Sintomas leves durante atividades cotidianas.',
          'CLASSE III - Sintomas em atividades menos intensas que as cotidianas ou aos pequenos esforços.',
          'CLASSE IV - Sintomas aos mínimos esforços ou em repouso.'
        ]
      }]
  };

  const loadBioimpedanciaPreset = () => {

    return [{ id: Date.now() + 1, label: 'Peso', fieldType: 'number', unit: 'kg', isRequired: true },
      { id: Date.now() + 2, label: 'IMC (Índice de Massa Corporal)', fieldType: 'number', unit: 'kg/m²', isRequired: false },
      { id: Date.now() + 3, label: 'Gordura Corporal', fieldType: 'number', unit: '%', isRequired: false },
      { id: Date.now() + 4, label: 'Massa Gorda', fieldType: 'number', unit: 'kg', isRequired: false },
      { id: Date.now() + 5, label: 'Massa Livre de Gordura', fieldType: 'number', unit: 'kg', isRequired: false },
      { id: Date.now() + 6, label: 'Massa Muscular', fieldType: 'number', unit: 'kg', isRequired: false },
      { id: Date.now() + 7, label: 'Taxa Muscular', fieldType: 'number', unit: '%', isRequired: false },
      { id: Date.now() + 8, label: 'Massa Musc. Esquelética', fieldType: 'number', unit: 'kg', isRequired: false },
      { id: Date.now() + 9, label: 'Massa Óssea', fieldType: 'number', unit: 'kg', isRequired: false },
      { id: Date.now() + 10, label: 'Massa Proteica', fieldType: 'number', unit: 'kg', isRequired: false },
      { id: Date.now() + 11, label: 'Proteína', fieldType: 'number', unit: '%', isRequired: false },
      { id: Date.now() + 12, label: 'Teor de Umidade', fieldType: 'number', unit: '%', isRequired: false },
      { id: Date.now() + 13, label: 'Água Corporal', fieldType: 'number', unit: '%', isRequired: false },
      { id: Date.now() + 14, label: 'Gordura Subcutânea', fieldType: 'number', unit: '%', isRequired: false },
      { id: Date.now() + 15, label: 'Gordura Visceral', fieldType: 'number', isRequired: false, helpText: 'Geralmente um nível ou índice (ex: Nível 5)' },
      { id: Date.now() + 16, label: 'TMB (Taxa Metabólica Basal)', fieldType: 'number', unit: 'kcal', isRequired: false },
      { id: Date.now() + 17, label: 'Idade Metabólica', fieldType: 'number', unit: 'anos', isRequired: false },
      { id: Date.now() + 18, label: 'WHR (Relação Cintura-Quadril)', fieldType: 'number', isRequired: false },
      { id: Date.now() + 19, label: 'Peso Corporal Ideal', fieldType: 'number', unit: 'kg', isRequired: false },
      { id: Date.now() + 20, label: 'Nível de Obesidade', fieldType: 'number', unit: '%', isRequired: false },
      { id: Date.now() + 21, label: 'Observações do Teste', fieldType: 'long_text', isRequired: false, helpText: 'Paciente em jejum? Esvaziou a bexiga?' }]
  };

  const loadGoniometria = (joint: string) => {
    let newFields: CustomField[] = [];

    const addMovement = (name: string, helpText: string) => {
      newFields.push({ id: Date.now() + Math.random(), label: `${name} - Direito`, fieldType: 'number', unit: '°', isRequired: false, helpText });
      newFields.push({ id: Date.now() + Math.random(), label: `${name} - Esquerdo`, fieldType: 'number', unit: '°', isRequired: false, helpText });
    };

    if (joint === 'Ombro') {
      addMovement('Flexão', 'Ref: 0° a 180°');
      addMovement('Extensão', 'Ref: 0° a 60°');
      addMovement('Abdução', 'Ref: 0° a 180°');
      addMovement('Adução', 'Ref: 0° a 50°');
      addMovement('Rotação Interna', 'Ref: 0° a 70°');
      addMovement('Rotação Externa', 'Ref: 0° a 90°');
    } else if (joint === 'Cervical') {
      newFields.push({ id: Date.now() + Math.random(), label: 'Flexão (Cervical)', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 45°' });
      newFields.push({ id: Date.now() + Math.random(), label: 'Extensão (Cervical)', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 45°' });
      newFields.push({ id: Date.now() + Math.random(), label: 'Inclinação Lateral Dir.', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 45°' });
      newFields.push({ id: Date.now() + Math.random(), label: 'Inclinação Lateral Esq.', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 45°' });
      newFields.push({ id: Date.now() + Math.random(), label: 'Rotação Dir.', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 60°' });
      newFields.push({ id: Date.now() + Math.random(), label: 'Rotação Esq.', fieldType: 'number', unit: '°', isRequired: false, helpText: 'Ref: 0° a 60°' });
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

    const existingFields = fields.filter(f => !f.label.includes('Observações / Sintomas'));
    newFields.push({ id: Date.now() + Math.random(), label: 'Observações / Sintomas', fieldType: 'long_text', isRequired: false, helpText: 'Anotar dor, fim de curso (end-feel) anormal, etc.' });
    return [...existingFields, ...newFields]
  };

  const loadBergScalePreset = () => {

    const genericOptions = [
      '4 - Independente e seguro na execução',
      '3 - Executa com supervisão verbal ou visual',
      '2 - Necessita de mínima assistência física',
      '1 - Necessita de moderada assistência física',
      '0 - Incapaz de realizar a tarefa'
    ];

    return [{ id: Date.now() + 1, label: '1. Posição sentada para posição em pé', fieldType: 'single_select', isRequired: true,
        helpText: 'Instruções: Por favor, levante-se. Tente não usar suas mãos para se apoiar.',
        options: ['4 - Capaz de levantar-se sem utilizar as mãos e estabilizar-se independentemente', '3 - Capaz de levantar-se independentemente e estabilizar-se independentemente', '2 - Capaz de levantar-se utilizando as mãos após diversas tentativas', '1 - Necessita de ajuda mínima para levantar-se ou estabilizar-se', '0 - Necessita de ajuda moderada ou máxima para levantar-se'] },
      { id: Date.now() + 2, label: '2. Permanecer em pé sem apoio', fieldType: 'single_select', isRequired: true,
        helpText: 'Instruções: Por favor, fique em pé por 2 minutos sem se apoiar.',
        options: ['4 - Capaz de permanecer em pé com segurança por 2 minutos', '3 - Capaz de permanecer em pé por 2 minutos com supervisão', '2 - Capaz de permanecer em pé por 30 segundos sem apoio', '1 - Necessita de várias tentativas para permanecer em pé por 30 segundos', '0 - Incapaz de permanecer em pé por 30 segundos sem apoio'] },
      { id: Date.now() + 3, label: '3. Permanecer sentado sem apoio nas costas', fieldType: 'single_select', isRequired: true,
        helpText: 'Instruções: Por favor, fique sentado sem apoiar as costas, com os braços cruzados, por 2 minutos.',
        options: ['4 - Capaz de permanecer sentado com segurança e com firmeza por 2 minutos', '3 - Capaz de permanecer sentado por 2 minutos com supervisão', '2 - Capaz de permanecer sentado por 30 segundos', '1 - Capaz de permanecer sentado por 10 segundos', '0 - Incapaz de permanecer sentado sem apoio por 10 segundos'] },
      { id: Date.now() + 4, label: '4. Posição em pé para posição sentada', fieldType: 'single_select', isRequired: true,
        helpText: 'Instruções: Por favor, sente-se.',
        options: ['4 - Senta-se com segurança, com uso mínimo das mãos', '3 - Controla a descida utilizando as mãos', '2 - Utiliza a parte posterior das pernas contra a cadeira para controlar a descida', '1 - Senta-se independentemente, mas tem descida sem controle', '0 - Necessita de ajuda para sentar-se'] },
      { id: Date.now() + 5, label: '5. Transferências', fieldType: 'single_select', isRequired: true,
        helpText: 'Instruções: Arrume as cadeiras perpendicularmente ou uma de frente para a outra. Peça para transferir-se de uma cadeira com apoio para uma sem apoio e vice-versa.',
        options: ['4 - Capaz de transferir-se com segurança com uso mínimo das mãos', '3 - Capaz de transferir-se com segurança com o uso das mãos', '2 - Capaz de transferir-se seguindo orientações verbais e/ou supervisão', '1 - Necessita de uma pessoa para ajudar', '0 - Necessita de duas pessoas para ajudar ou supervisionar a tarefa com segurança'] },
      { id: Date.now() + 6, label: '6. Permanecer em pé sem apoio com os olhos fechados', fieldType: 'single_select', isRequired: true,
        helpText: 'Instruções: Por favor, fique em pé e feche os olhos por 10 segundos.',
        options: ['4 - Capaz de permanecer em pé por 10 segundos com segurança', '3 - Capaz de permanecer em pé por 10 segundos com supervisão', '2 - Capaz de permanecer em pé por 3 segundos', '1 - Incapaz de manter os olhos fechados 3 segundos, mas se mantém em pé', '0 - Necessita de ajuda para não cair'] },
      { id: Date.now() + 7, label: '7. Permanecer em pé sem apoio com os pés juntos', fieldType: 'single_select', isRequired: true, 
        helpText: 'Instruções: Junte os pés e fique em pé sem se apoiar.', options: genericOptions },
      { id: Date.now() + 8, label: '8. Alcançar a frente com o braço estendido', fieldType: 'single_select', isRequired: true, 
        helpText: 'Instruções: Levante o braço a 90 graus. Estique os dedos e alcance o mais longe possível.', options: genericOptions },
      { id: Date.now() + 9, label: '9. Pegar um objeto do chão', fieldType: 'single_select', isRequired: true, 
        helpText: 'Instruções: Pegue o objeto que está na frente dos seus pés.', options: genericOptions },
      { id: Date.now() + 10, label: '10. Virar-se para olhar para trás', fieldType: 'single_select', isRequired: true, 
        helpText: 'Instruções: Vire-se para olhar diretamente atrás de você por cima do ombro esquerdo. Repita para o direito.', options: genericOptions },
      { id: Date.now() + 11, label: '11. Girar 360 graus', fieldType: 'single_select', isRequired: true, 
        helpText: 'Instruções: Dê uma volta completa em um círculo. Em seguida, dê uma volta completa na outra direção.', options: genericOptions },
      { id: Date.now() + 12, label: '12. Posicionar os pés alternadamente no degrau', fieldType: 'single_select', isRequired: true, 
        helpText: 'Instruções: Coloque cada pé alternadamente no degrau. Continue até que cada pé tenha tocado o degrau 4 vezes.', options: genericOptions },
      { id: Date.now() + 13, label: '13. Permanecer em pé com um pé à frente', fieldType: 'single_select', isRequired: true, 
        helpText: 'Instruções: Coloque um pé diretamente à frente do outro na mesma linha.', options: genericOptions },
      { id: Date.now() + 14, label: '14. Permanecer em pé sobre um pé só', fieldType: 'single_select', isRequired: true, 
        helpText: 'Instruções: Fique em pé sobre uma perna só o máximo que conseguir sem se apoiar.', options: genericOptions },]
  };

  const loadBarthelScalePreset = () => {

    return [{ id: Date.now() + 1, label: 'Alimentação', fieldType: 'single_select', isRequired: true, options: [
        '0 - Incapacitado',
        '5 - Precisa de ajuda para cortar, passar manteiga, etc, ou dieta modificada',
        '10 - Independente'
      ]},
      { id: Date.now() + 2, label: 'Banho', fieldType: 'single_select', isRequired: true, options: [
        '0 - Dependente',
        '5 - Independente (ou no chuveiro)'
      ]},
      { id: Date.now() + 3, label: 'Atividades Rotineiras (Higiene Pessoal)', fieldType: 'single_select', isRequired: true, options: [
        '0 - Precisa de ajuda com a higiene pessoal',
        '5 - Independente rosto/cabelo/dentes/barbear'
      ]},
      { id: Date.now() + 4, label: 'Vestir-se', fieldType: 'single_select', isRequired: true, options: [
        '0 - Dependente',
        '5 - Precisa de ajuda mas consegue fazer uma parte sozinho',
        '10 - Independente (incluindo botões, zípers, laços, etc.)'
      ]},
      { id: Date.now() + 5, label: 'Intestino', fieldType: 'single_select', isRequired: true, options: [
        '0 - Incontinente (necessidade de enemas)',
        '5 - Acidente ocasional',
        '10 - Continente'
      ]},
      { id: Date.now() + 6, label: 'Sistema Urinário', fieldType: 'single_select', isRequired: true, options: [
        '0 - Incontinente, ou cateterizado e incapaz de manejo',
        '5 - Acidente ocasional',
        '10 - Continente'
      ]},
      { id: Date.now() + 7, label: 'Uso do Toilet', fieldType: 'single_select', isRequired: true, options: [
        '0 - Dependente',
        '5 - Precisa de alguma ajuda parcial',
        '10 - Independente (pentear-se, limpar-se)'
      ]},
      { id: Date.now() + 8, label: 'Transferência (Cama para Cadeira e vice-versa)', fieldType: 'single_select', isRequired: true, options: [
        '0 - Incapacitado, sem equilíbrio para ficar sentado',
        '5 - Muita ajuda (uma ou duas pessoas, física), pode sentar',
        '10 - Pouca ajuda (verbal ou física)',
        '15 - Independente'
      ]},
      { id: Date.now() + 9, label: 'Mobilidade (Em superfícies planas)', fieldType: 'single_select', isRequired: true, options: [
        '0 - Imóvel ou < 50 metros',
        '5 - Cadeira de rodas independente, incluindo esquinas, > 50 metros',
        '10 - Caminha com a ajuda de uma pessoa (verbal ou física) > 50 metros',
        '15 - Independente (mas pode precisar de alguma ajuda; como exemplo, bengala) > 50 metros'
      ]},
      { id: Date.now() + 10, label: 'Escadas', fieldType: 'single_select', isRequired: true, options: [
        '0 - Incapacitado',
        '5 - Precisa de ajuda (verbal, física, ou ser carregado)',
        '10 - Independente'
      ]},
      { id: Date.now() + 11, label: 'Interpretação do Resultado (Opcional)', fieldType: 'single_select', isRequired: false, options: [
        '100 pontos - Totalmente independente',
        '99 a 76 pontos - Dependência leve',
        '75 a 51 pontos - Dependência moderada',
        '50 a 26 pontos - Dependência severa',
        '25 e menos pontos - Dependência total'
      ]}]
  };

  const loadEVAPreset = () => {

    return [{
        id: Date.now() + 1,
        label: 'Intensidade da Dor (EVA)',
        fieldType: 'scale_0_10',
        isRequired: true,
        helpText: '0 (Sem dor), 1-2 (Dor suave), 3-4 (Dor moderada), 5-6 (Dor forte), 7-8 (Dor muito forte), 9-10 (Dor máxima)',
      },
      {
        id: Date.now() + 2,
        label: 'Local da Dor',
        fieldType: 'text',
        isRequired: false,
        helpText: 'Descreva a região onde a dor está localizada',
      },
      {
        id: Date.now() + 3,
        label: 'Frequência / Pior momento',
        fieldType: 'single_select',
        isRequired: false,
        options: ['Constante', 'Ao movimento', 'Ao repouso', 'Matinal', 'Noturna']
      },
      {
        id: Date.now() + 4,
        label: 'Observações / Uso de Analgésico',
        fieldType: 'long_text',
        isRequired: false
      }]
  };

  const loadSF36Preset = () => {

    const opts1 = ['1 - Excelente', '2 - Muito Boa', '3 - Boa', '4 - Ruim', '5 - Muito Ruim'];
    const opts2 = ['1 - Muito Melhor', '2 - Um Pouco Melhor', '3 - Quase a Mesma', '4 - Um Pouco Pior', '5 - Muito Pior'];
    const opts3 = ['1 - Sim, dificulta muito', '2 - Sim, dificulta um pouco', '3 - Não, não dificulta de modo algum'];
    const opts4 = ['1 - Sim', '2 - Não'];

    return [{ id: Date.now() + 1, label: '1 - Em geral você diria que sua saúde é:', fieldType: 'single_select', isRequired: true, options: opts1 },
      { id: Date.now() + 2, label: '2 - Comparada há um ano atrás, como você classificaria sua saúde em geral, agora?', fieldType: 'single_select', isRequired: true, options: opts2 },
      
      { id: Date.now() + 3, label: '3a - Atividades Rigorosas (correr, levantar peso)', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 4, label: '3b - Atividades Moderadas (mover mesa, aspirador)', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 5, label: '3c - Levantar ou carregar mantimentos', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 6, label: '3d - Subir vários lances de escada', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 7, label: '3e - Subir um lance de escada', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 8, label: '3f - Curvar-se, ajoelhar-se ou dobrar-se', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 9, label: '3g - Andar mais de 1 quilômetro', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 10, label: '3h - Andar vários quarteirões', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 11, label: '3i - Andar um quarteirão', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      { id: Date.now() + 12, label: '3j - Tomar banho ou vestir-se', fieldType: 'single_select', isRequired: true, options: opts3, helpText: 'Dificuldade atual devido à saúde' },
      
      { id: Date.now() + 13, label: '4a - Diminuiu o tempo no trabalho ou outras atividades?', fieldType: 'single_select', isRequired: true, options: opts4, helpText: 'Consequência de saúde física nas últimas 4 semanas' },
      { id: Date.now() + 14, label: '4b - Realizou menos tarefas do que gostaria?', fieldType: 'single_select', isRequired: true, options: opts4, helpText: 'Consequência de saúde física nas últimas 4 semanas' },
      { id: Date.now() + 15, label: '4c - Esteve limitado no seu tipo de trabalho/atividades?', fieldType: 'single_select', isRequired: true, options: opts4, helpText: 'Consequência de saúde física nas últimas 4 semanas' },
      { id: Date.now() + 16, label: '4d - Teve dificuldade de fazer seu trabalho (esforço extra)?', fieldType: 'single_select', isRequired: true, options: opts4, helpText: 'Consequência de saúde física nas últimas 4 semanas' },
      
      { id: Date.now() + 17, label: '5a - Diminuiu o tempo no trabalho/atividades (Problema emocional)?', fieldType: 'single_select', isRequired: true, options: opts4, helpText: 'Consequência de problema emocional nas últimas 4 semanas' },
      { id: Date.now() + 18, label: '5b - Realizou menos tarefas do que gostaria (Problema emocional)?', fieldType: 'single_select', isRequired: true, options: opts4, helpText: 'Consequência de problema emocional nas últimas 4 semanas' },
      { id: Date.now() + 19, label: '5c - Não realizou atividades com tanto cuidado (Problema emocional)?', fieldType: 'single_select', isRequired: true, options: opts4, helpText: 'Consequência de problema emocional nas últimas 4 semanas' }]
  };

  const loadPSQIPreset = () => {

    const freqOptions = [
      '0 - Nenhuma no último mês',
      '1 - Menos de uma vez por semana',
      '2 - Uma ou duas vezes por semana',
      '3 - Três ou mais vezes na semana'
    ];

    return [{ id: Date.now() + 1, label: '1. Hora usual de deitar', fieldType: 'text', isRequired: true, helpText: 'Ex: 22:30' },
      { id: Date.now() + 2, label: '2. Número de minutos para adormecer', fieldType: 'number', isRequired: true, unit: 'min' },
      { id: Date.now() + 3, label: '3. Hora usual de levantar', fieldType: 'text', isRequired: true, helpText: 'Ex: 06:30' },
      { id: Date.now() + 4, label: '4. Horas de sono por noite', fieldType: 'number', isRequired: true, unit: 'horas' },
      
      { id: Date.now() + 5, label: '5A. Não conseguiu adormecer em até 30 minutos', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 6, label: '5B. Acordou no meio da noite ou de manhã cedo', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 7, label: '5C. Precisou levantar para ir ao banheiro', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 8, label: '5D. Não conseguiu respirar confortavelmente', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 9, label: '5E. Tossiu ou roncou forte', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 10, label: '5F. Sentiu muito frio', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 11, label: '5G. Sentiu muito calor', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 12, label: '5H. Teve sonhos ruins', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 13, label: '5I. Teve dor', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 14, label: '5J. Outra razão (descreva e informe a frequência)', fieldType: 'text', isRequired: false },
      
      { id: Date.now() + 15, label: '6. Qualidade do sono de maneira geral', fieldType: 'single_select', isRequired: true, options: [
        '0 - Muito boa', '1 - Boa', '2 - Ruim', '3 - Muito Ruim'
      ]},
      
      { id: Date.now() + 16, label: '7. Frequência que tomou medicamento para dormir', fieldType: 'single_select', isRequired: true, options: freqOptions },
      { id: Date.now() + 17, label: '8. Dificuldade para ficar acordado (dirigindo, socialmente)', fieldType: 'single_select', isRequired: true, options: freqOptions },
      
      { id: Date.now() + 18, label: '9. Problema para manter o entusiasmo/ânimo', fieldType: 'single_select', isRequired: true, options: [
        '0 - Nenhuma dificuldade', '1 - Um problema leve', '2 - Um problema razoável', '3 - Um grande problema'
      ]},
      
      { id: Date.now() + 19, label: '10. Você tem parceiro ou colega de quarto?', fieldType: 'single_select', isRequired: true, options: [
        '0 - Não',
        '1 - Parceiro ou colega, mas em outro quarto',
        '2 - Parceiro no mesmo quarto, mas em outra cama',
        '3 - Parceiro na mesma cama'
      ]}]
  };
  useEffect(() => {
    setLoading(true);
    api.get('/patients')
      .then((resPats) => {
        const payloadPats = resPats?.data?.meta ? resPats.data : resPats;
        const pData = Array.isArray(payloadPats?.data) ? payloadPats.data : (Array.isArray(payloadPats) ? payloadPats : []);
        setPatients(pData);
      })
      .catch(() => {
        toast({ title: 'Erro de Conexão', description: 'Não foi possível carregar os pacientes.', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (fillPatientId && patients.length > 0 && !showFillModal) {
      const patient = patients.find(p => String(p.id) === String(fillPatientId));
      if (patient) {
        setFillingPatient(patient);
        setShowFillModal(true);
        // Clear the query param
        const url = new URL(window.location.href);
        url.searchParams.delete('fillPatientId');
        router.replace(url.pathname + url.search);
      }
    }
  }, [fillPatientId, patients, showFillModal, router]);

  useEffect(() => {
    if (createEvaluationFor && patients.length > 0 && !showModal) {
      const patient = patients.find(p => String(p.id) === String(createEvaluationFor));
      if (patient) {
        setEditingModule(null);
        setFields([]);
        setLoadedPresets([]);
        setSelectedPresetToLoad('');
        setSelectedPatientId(String(patient.id));
        setShowModal(true);

        const url = new URL(window.location.href);
        url.searchParams.delete('createEvaluationFor');
        router.replace(url.pathname + url.search);
      }
    }
  }, [createEvaluationFor, patients, showModal, router]);

  useEffect(() => {
    if (viewEvolutionsFor && !evolutionsModalOpen) {
      openEvolutionsModal(viewEvolutionsFor, expandEvolution ? Number(expandEvolution) : undefined);
      
      const url = new URL(window.location.href);
      url.searchParams.delete('viewEvolutionsFor');
      url.searchParams.delete('expandEvolution');
      router.replace(url.pathname + url.search);
    }
  }, [viewEvolutionsFor, expandEvolution, evolutionsModalOpen, router]);

  const openCreateModal = () => {
    setEditingModule(null);
    setModuleTitle('');
    setModuleDescription('');
    setFields([]);
    setLoadedPresets([]);
    setSelectedPresetToLoad('');
    setSelectedPatientId('');
    setShowModal(true);
  };

  const openEditModal = async (patient: any) => {
    if (!patient.templateId && !patient.template_id && !patient.template?.id) return;
    const templateId = patient.templateId || patient.template_id || patient.template?.id;
    
    try {
      const res = await api.get(`/form-templates/${templateId}`);
      const template = res.data?.id ? res.data : res;
      const mod = template?.modules?.[0];
      
      if (!mod) {
        toast({ title: 'Erro', description: 'A ficha técnica não possui testes vinculados.', type: 'warning' });
        return;
      }
      
      const formattedMod = {
        ...mod,
        fields: (mod.fields || []).map((f: any) => ({
          ...f,
          options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options || [],
        }))
      };

      setEditingModule(formattedMod);
      setSelectedPatientId(String(patient.id));
      setModuleTitle(template.title || formattedMod.name || '');
      setModuleDescription(formattedMod.description || template.description || '');
      setModuleCategory(formattedMod.category || 'Geral');
      setFields(formattedMod.fields || []);
      
      setFieldLabel('');
      setFieldUnit('');
      setFieldHelpText('');
      setFieldOptionsText('');
      setFieldIsRequired(false);
      setSelectedPresetToLoad('');
      
      setShowModal(true);
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível carregar a escala do paciente.', type: 'error' });
    }
  };

  const handleAddField = () => {
    if (!fieldLabel.trim()) {
      toast({ title: 'Atenção', description: 'Digite a pergunta ou rótulo do campo.', type: 'warning' });
      return;
    }

    const parsedOptions = fieldOptionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newField: CustomField = {
      id: Date.now(),
      label: fieldLabel.trim(),
      fieldType,
      unit: fieldUnit.trim() || undefined,
      helpText: fieldHelpText.trim() || undefined,
      options: parsedOptions.length > 0 ? parsedOptions : undefined,
      isRequired: fieldIsRequired,
    };

    setFields([...fields, newField]);
    setFieldLabel('');
    setFieldUnit('');
    setFieldHelpText('');
    setFieldOptionsText('');
    setFieldIsRequired(false);

    toast({ title: 'Teste Adicionado', description: `Teste "${newField.label}" adicionado à escala.`, type: 'info' });
  };

  const handleRemoveField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast({ title: 'Paciente não selecionado', description: 'Por favor, selecione um paciente.', type: 'warning' });
      return;
    }

    if (fields.length === 0) {
      toast({ title: 'Escala Vazia', description: 'Adicione pelo menos 1 teste à escala.', type: 'warning' });
      return;
    }

    const patient = patients.find(p => String(p.id) === String(selectedPatientId));
    const patientName = patient?.fullName || patient?.name || 'Paciente';

    const finalTitle = moduleTitle.trim() || (selectedPresetToLoad ? `${selectedPresetToLoad} - ${patientName}` : `Escala de ${patientName}`);

    const modPayload = {
      name: finalTitle,
      description: moduleDescription.trim() || null,
      category: moduleCategory,
      fields,
    };

    try {
      if (editingModule && (patient?.templateId || patient?.template_id)) {
        const tId = patient.templateId || patient.template_id;
        await api.put(`/custom-modules/${editingModule.id}`, modPayload);
        await api.put(`/form-templates/${tId}`, {
          title: finalTitle,
          description: moduleDescription.trim() || null
        });
        toast({ title: 'Escala Atualizada!', description: `Escala salva com sucesso.`, type: 'success' });
      } else {
        const resMod: any = await api.post('/custom-modules', modPayload);
        const createdMod = resMod?.id ? resMod : resMod?.data || resMod;
        const moduleId = Number(createdMod?.id || createdMod?.data?.id);
        
        const tRes: any = await api.post('/form-templates', {
          title: finalTitle,
          description: moduleDescription.trim() || null,
          moduleIds: [moduleId]
        });
        const createdTemplate = tRes?.id ? tRes : tRes?.data || tRes;
        const templateId = Number(createdTemplate?.id || createdTemplate?.data?.id);
        
        await api.put(`/patients/${selectedPatientId}`, { templateId });
        
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patient?.id
              ? { ...p, templateId, template_id: templateId, template: createdTemplate }
              : p
          )
        );
        toast({ title: 'Escala Criada!', description: `Escala atribuída ao paciente com sucesso!`, type: 'success' });
      }

      setSelectedCategory(modPayload.category);
      setShowModal(false);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Não foi possível salvar a escala.';
      toast({ title: 'Erro ao Salvar Avaliação', description: errorMsg, type: 'error' });
    }
  };

  const handleDeleteModule = async (patient: any) => {
    try {
      if (patient.templateId || patient.template_id) {
        const templateId = patient.templateId || patient.template_id;
        
        // Remove link from patient
        await api.put(`/patients/${patient.id}`, { templateId: null });
        
        // Optional: delete the template itself
        await api.delete(`/form-templates/${templateId}`).catch(() => {});
        
        // Update local state
        setPatients(patients.map(p => p.id === patient.id ? { ...p, templateId: null, template_id: null, template: null } : p));
        toast({ title: 'Escala Removida', description: 'A escala de testes foi removida do paciente.', type: 'info' });
      } else {
        toast({ title: 'Aviso', description: 'Este paciente não possui uma avaliação vinculada.', type: 'info' });
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível remover a escala.', type: 'error' });
    }
  };

  const getFieldTypeIcon = (type: CustomField['fieldType']) => {
    switch (type) {
      case 'scale_0_10': return <Sliders className="w-4 h-4 text-emerald-600" />;
      case 'number': return <Hash className="w-4 h-4 text-blue-600" />;
      case 'date': return <CalendarIcon className="w-4 h-4 text-purple-600" />;
      case 'single_select': return <ListOrdered className="w-4 h-4 text-amber-600" />;
      case 'boolean': return <CheckSquare className="w-4 h-4 text-cyan-600" />;
      default: return <Type className="w-4 h-4 text-slate-600" />;
    }
  };

  const getFieldTypeLabel = (type: CustomField['fieldType']) => {
    switch (type) {
      case 'scale_0_10': return 'Escala 0 a 10 (EVA)';
      case 'number': return 'Número / Medição';
      case 'date': return 'Data';
      case 'single_select': return 'Múltipla Escolha';
      case 'multi_select': return 'Seleção Múltipla';
      case 'boolean': return 'Sim / Não';
      case 'long_text': return 'Texto Longo';
      default: return 'Texto Curto';
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchName = (p.fullName || p.name || '').toLowerCase().includes(q);
    return matchName;
  });

  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <Header
        title="Avaliações Personalizadas"
        subtitle="Crie conjuntos de perguntas, escalas de dor e medições separadas para montar suas Avaliações"
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 space-y-6 overflow-y-auto max-w-full">
        {/* Header Bar & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <button
              onClick={openCreateModal}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Avaliação</span>
            </button>



            {/* Search Input */}
            <div className="relative w-full flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar avaliação ou teste clínico..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
        </div>

        {/* Modules Grid */}
        {loading ? (
          <div className="py-12 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700">Nenhuma avaliação encontrada</h3>
            <p className="text-sm text-slate-400">Tente selecionar outra especialidade ou alterar o termo de busca.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="p-4 pl-6">Nome do Paciente</th>
                    <th className="p-4 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">{patient.fullName || patient.name}</p>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEvolutionsModal(patient.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Ver Evoluções (Histórico)"
                          >
                            <ClipboardList className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => {
                              setFillingPatient(patient);
                              setShowFillModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Preencher Avaliação"
                          >
                            <ClipboardCheck className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleDeleteModule(patient)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Excluir Avaliação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 font-medium">
                Página {currentPage} de {totalPages} <span className="hidden sm:inline">({totalItems} registros)</span>
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-all"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-all"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Construtor de Escala & Testes */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={() => setShowModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 w-full max-w-3xl space-y-5 max-h-[92vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {editingModule ? 'Editar Avaliação' : 'Criar Nova Avaliação Clínica'}
                    </h3>
                    <p className="text-xs text-slate-500">Defina o nome da avaliação e adicione os testes e medições desejados</p>
                  </div>
                </div>

                <form onSubmit={handleSaveModule} className="space-y-6">
                  {/* Module Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Selecionar Paciente *
                      </label>
                      <CustomSelect
                        value={selectedPatientId}
                        onChange={(val) => setSelectedPatientId(String(val))}
                        options={[
                          { value: '', label: 'Selecione um paciente...' },
                          ...patients.map((p) => ({
                            value: p.id,
                            label: p.fullName || p.name,
                            sublabel: p.cpf ? `CPF: ${p.cpf}` : undefined
                          }))
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Categoria
                      </label>
                      <CustomSelect
                        value={moduleCategory}
                        onChange={(val) => {
                          setModuleCategory(String(val));
                        }}
                        options={[
                          { value: 'Geral', label: 'Geral' },
                          { value: 'Postura & Biomecânica', label: 'Postura & Biomecânica' },
                          { value: 'Controle de Tronco', label: 'Controle de Tronco' },
                          { value: 'Neurologia', label: 'Neurologia' },
                          { value: 'Geriatria & Equilíbrio', label: 'Geriatria & Equilíbrio' },
                          { value: 'Cardiorrespiratória', label: 'Cardiorrespiratória' },
                          { value: 'Composição Corporal', label: 'Composição Corporal' },
                          { value: 'Membros Superiores e Inferiores', label: 'Membros Superiores e Inferiores' },
                          { value: 'Goniometria', label: 'Goniometria' }
                        ]}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Nome / Título da Avaliação ou Escala
                      </label>
                      <input
                        type="text"
                        value={moduleTitle}
                        onChange={(e) => setModuleTitle(e.target.value)}
                        placeholder="Ex: Escala de Berg, Avaliação de Controle de Tronco, Escala EVA..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                      />
                    </div>

                    {/* Presets Dropdown */}
                    <div className="sm:col-span-3">
                      {(() => {
                        const presetsByCategory: Record<string, { label: string, action: () => any }[]> = {
                          'Geral': [
                            { label: 'Anamnese Fisioterapêutica', action: loadAnamnesePreset },
                            { label: 'Pontos e Mapeamento de Dor (Body Map)', action: loadPainMapPreset },
                            { label: 'Escala Visual Analógica (EVA)', action: loadEVAPreset },
                            { label: 'Qualidade de Vida (SF-36)', action: loadSF36Preset },
                            { label: 'Qualidade do Sono (PSQI)', action: loadPSQIPreset }
                          ],
                          'Postura & Biomecânica': [
                            { label: 'Avaliação Postural (Anterior, Posterior e Lateral)', action: loadPosturePreset }
                          ],
                          'Controle de Tronco': [
                            { label: 'Módulo do Controle de Tronco', action: loadTrunkControlPreset }
                          ],
                          'Neurologia': [
                            { label: 'Escala de Glasgow', action: loadGlasgowScalePreset },
                            { label: 'Escala de Ashworth', action: loadAshworthScalePreset }
                          ],
                          'Geriatria & Equilíbrio': [
                            { label: 'Escala de Berg', action: loadBergScalePreset },
                            { label: 'Teste TUG (Timed Up and Go)', action: loadTUGScalePreset },
                            { label: 'Índice de Barthel', action: loadBarthelScalePreset }
                          ],
                          'Cardiorrespiratória': [
                            { label: 'Teste TC6 (6 Minutos)', action: loadTC6Preset },
                            { label: 'Manovacuometria (PImáx/PEmáx)', action: loadManovacuometriaPreset },
                            { label: 'Peak Flow e PCF', action: loadPeakFlowPreset },
                            { label: 'Escala de Dispnéia - MRC', action: loadMRCDyspneaPreset },
                            { label: 'Classificação Funcional - NYHA', action: loadNYHAScalePreset }
                          ],
                          'Composição Corporal': [
                            { label: 'Avaliação por Bioimpedância', action: loadBioimpedanciaPreset }
                          ],
                          'Membros Superiores e Inferiores': [
                            { label: 'Escala de Força Muscular (MRC)', action: loadMRCScalePreset }
                          ],
                          'Goniometria': [
                            'Cervical', 'Ombro', 'Cotovelo e Antebraço', 'Punho', 'Quadril', 'Joelho', 'Tornozelo'
                          ].map(joint => ({ label: `Goniometria - ${joint}`, action: () => loadGoniometria(joint) }))
                        };

                        const availablePresets = presetsByCategory[moduleCategory] || [];

                        if (availablePresets.length === 0) return null;

                        return (
                          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex flex-col gap-2">
                            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-indigo-600" />
                              Carregar Escala Pronta (Opcional)
                            </label>
                            <p className="text-[11px] text-indigo-700/80 mb-1">
                              Selecione uma escala pronta abaixo para carregar as perguntas automaticamente.
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 w-full">
                              <div className="flex-1">
                                <CustomSelect
                                  value={selectedPresetToLoad}
                                  onChange={(val) => setSelectedPresetToLoad(String(val))}
                                  options={availablePresets.map(p => ({ value: p.label, label: p.label }))}
                                  placeholder="Selecione uma escala pronta para gerar..."
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedPresetToLoad) return;
                                  if (loadedPresets.includes(selectedPresetToLoad)) {
                                    toast({ title: 'Atenção', description: 'Esta escala já foi adicionada.', type: 'warning' });
                                    return;
                                  }
                                  const preset = availablePresets.find(p => p.label === selectedPresetToLoad);
                                  if (preset) {
                                    const newFields = (preset.action() as CustomField[]) || [];
                                    const groupedFields = newFields.map(f => ({ ...f, group: preset.label }));
                                    setFields(prev => [...prev, ...groupedFields]);
                                    setLoadedPresets(prev => [...prev, selectedPresetToLoad]);
                                    setSelectedPresetToLoad('');
                                    toast({ title: 'Sucesso', description: 'Escala carregada.', type: 'success' });
                                  }
                                }}
                                disabled={!selectedPresetToLoad}
                                className="inline-flex h-[42px] items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Adicionar</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        Descrição Breve
                      </label>
                      <input
                        type="text"
                        value={moduleDescription}
                        onChange={(e) => setModuleDescription(e.target.value)}
                        placeholder="Ex: Medições de flexão, extensão e rotações articulares"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>



                  {/* Added Fields Preview */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Testes da Avaliação ({fields.length})
                    </h4>

                    {fields.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhum teste adicionado ainda. Preencha a caixa acima.</p>
                    ) : (
                      <div className="space-y-2">
                        {fields.map((f, idx) => {
                          const isNewGroup = f.group && (idx === 0 || fields[idx - 1].group !== f.group);
                          return (
                            <React.Fragment key={idx}>
                              {isNewGroup && (
                                <div className="pt-3 pb-1 flex items-center gap-2">
                                  <div className="h-px bg-indigo-100 flex-1"></div>
                                  <h5 className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
                                    {f.group}
                                  </h5>
                                  <div className="h-px bg-indigo-100 flex-1"></div>
                                </div>
                              )}
                              <div className="py-5 border-b border-slate-100 flex flex-col space-y-3 relative group">
                                <div className="flex items-start justify-between">
                                  <div className="pr-10">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-bold text-sm text-slate-800">{f.label}</h4>
                                      {f.isRequired && <span className="text-red-500 font-bold">*</span>}
                                    </div>
                                    {f.helpText && (
                                      <p className="text-[11px] text-slate-400 italic mt-0.5">{f.helpText}</p>
                                    )}
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveField(idx)}
                                    className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 absolute right-0 top-4 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                {/* Formulário Fake (Preview) */}
                                <div className="pointer-events-none">
                                  {f.fieldType === 'scale_0_10' && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {[...Array(11)].map((_, i) => (
                                        <div key={i} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                          {i}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {(f.fieldType === 'single_select' || f.fieldType === 'multi_select') && (
                                    <div className="flex flex-wrap gap-2">
                                      {f.options?.map((opt: string, optIdx: number) => (
                                        <div key={optIdx} className="px-3.5 py-1.5 rounded-xl border bg-white border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                                          {opt}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {f.fieldType === 'boolean' && (
                                    <div className="flex gap-2">
                                      <div className="px-6 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">Sim</div>
                                      <div className="px-6 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">Não</div>
                                    </div>
                                  )}

                                  {f.fieldType === 'long_text' && (
                                    <div className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-400">
                                      Caixa de texto longo...
                                    </div>
                                  )}

                                  {['text', 'number', 'date'].includes(f.fieldType) && (
                                    <div className="w-full max-w-sm h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 flex items-center text-xs text-slate-400">
                                      {f.fieldType === 'date' ? 'dd/mm/aaaa' : 'Digite a resposta...'}
                                      {f.unit && <span className="ml-2 text-slate-500 font-semibold">{f.unit}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Modal Actions */}
                  <div className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-4 sm:py-5 mt-8 bg-white/85 backdrop-blur-xl border-t border-slate-200/60 flex items-center justify-end space-x-3 rounded-b-2xl shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] z-20 transition-all">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={fields.length === 0 || !selectedPatientId}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salvar Avaliação</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <FillFormModal
        isOpen={showFillModal}
        onClose={() => setShowFillModal(false)}
        patient={fillingPatient}
        onSuccess={() => {
          api.get('/patients')
            .then((resPats) => {
              const payloadPats = resPats?.data?.meta ? resPats.data : resPats;
              const pData = Array.isArray(payloadPats?.data) ? payloadPats.data : (Array.isArray(payloadPats) ? payloadPats : []);
              setPatients(pData);
            })
            .catch(() => {});
        }}
      />

      {/* EVOLUTIONS SIDE MODAL */}
      <AnimatePresence>
        {evolutionsModalOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => setEvolutionsModalOpen(false)}
            />

            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-md md:max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Histórico de Evoluções</h3>
                    <p className="text-xs text-slate-500">
                      {evolutionsPatient?.name || evolutionsPatient?.fullName || 'Carregando...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEvolutionsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {loadingEvolutions ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-xs text-slate-500 font-medium">Buscando evoluções do paciente...</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const isRealEvolutionNotes = (notes?: string | null) => {
                        if (!notes || typeof notes !== 'string' || notes.trim() === '') return false;
                        const clean = notes.trim();
                        if (clean.startsWith('Sessão ') && (clean.includes('Recorrente') || clean.includes('Inicial') || clean.includes('Mensal') || clean.length < 40)) {
                          return false;
                        }
                        return true;
                      };

                      const validEvolutions = evolutionsPatient?.appointments?.filter((a: any) => isRealEvolutionNotes(a.notes) || (a.images && a.images.length > 0)) || [];

                      if (validEvolutions.length === 0) {
                        return (
                          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm mt-4">
                            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-700 text-sm">Nenhuma evolução registrada</h4>
                            <p className="text-xs text-slate-500 mt-1">Este paciente ainda não possui anotações clínicas em seus atendimentos.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="relative border-l-2 border-emerald-100 ml-4 space-y-8 pb-8 mt-2">
                          {validEvolutions.map((app: any, index: number) => {
                            const appImages = Array.isArray(app.images) ? app.images : [];
                            return (
                              <div key={app.id || index} className="relative pl-6 group">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm group-hover:scale-125 transition-transform" />
                                <div 
                                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-all hover:border-emerald-200 cursor-pointer"
                                  onClick={() => toggleEvolution(app)}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-600 flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{formatDate(app.date)}</span>
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        {app.specialty || 'Atendimento'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEditEvolution(app);
                                        }}
                                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg text-xs font-bold border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                                        title="Editar evolução clínica"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Editar</span>
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {expandedEvolutions.includes(app.id) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                      {evolutionDetails[app.id]?.loading ? (
                                        <div className="py-6 flex items-center justify-center space-x-2 text-emerald-600">
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          <span className="text-xs font-semibold text-slate-500">Carregando anotações e fotos...</span>
                                        </div>
                                      ) : (() => {
                                        const detailNotes = evolutionDetails[app.id]?.notes !== undefined ? evolutionDetails[app.id]?.notes : app.notes;
                                        const detailImages = evolutionDetails[app.id]?.images !== undefined ? evolutionDetails[app.id]?.images : (Array.isArray(app.images) ? app.images : []);

                                        if (!detailNotes && (!detailImages || detailImages.length === 0)) {
                                          return (
                                            <p className="text-xs text-slate-400 italic py-2">Sem anotações registradas nesta sessão.</p>
                                          );
                                        }

                                        return (
                                          <div className="space-y-4">
                                            {detailNotes && (
                                              <div 
                                                className="text-sm text-slate-700 prose prose-sm max-w-none 
                                                [&_strong]:text-slate-800 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                                dangerouslySetInnerHTML={{ __html: detailNotes }}
                                              />
                                            )}

                                            {detailImages && detailImages.length > 0 && (
                                              <div className="pt-2 border-t border-slate-100">
                                                <p className="text-[11px] font-bold text-slate-500 mb-2">Fotos anexadas ({detailImages.length}):</p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                  {detailImages.map((img: string, iIdx: number) => (
                                                    <div key={iIdx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                                      <img src={img} alt={`Foto ${iIdx + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                  
                                  <div className={`mt-4 pt-3 flex items-center justify-between ${expandedEvolutions.includes(app.id) ? 'border-t border-slate-100' : ''}`}>
                                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono font-bold bg-slate-50 px-2 py-1 rounded-md">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{app.startTime} - {app.endTime}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEditEvolution(app);
                                        }}
                                        className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3 text-emerald-600" />
                                        <span>Editar</span>
                                      </button>
                                      <span className="text-[10px] font-bold text-emerald-600">
                                        {expandedEvolutions.includes(app.id) ? 'Ocultar anotações' : 'Ver anotações'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setEvolutionsModalOpen(false)}
                  className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Fechar Histórico
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT EVOLUTION MODAL */}
      <AnimatePresence>
        {editingEvolutionModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Editar Evolução Clínica</h3>
                    <p className="text-xs text-slate-500">
                      {evolutionsPatient?.name || evolutionsPatient?.fullName || 'Paciente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingEvolutionModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEvolution} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Date & Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Data da Sessão
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      required
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Término
                    </label>
                    <input
                      type="time"
                      required
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Specialty / Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Especialidade / Tipo de Atendimento
                  </label>
                  <input
                    type="text"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    placeholder="Ex: Atendimento Fisioterapêutico, Reabilitação Ortopédica..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Anotações Clínicas & Conduta *
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditNotes('')}
                      className="text-[10px] text-slate-400 hover:text-red-600 font-medium cursor-pointer"
                    >
                      Limpar texto
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    required
                    placeholder="Descreva a evolução do paciente, queixas, testes realizados, condutas aplicadas e resposta ao tratamento..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none leading-relaxed"
                  />

                  {/* Quick Text Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 self-center mr-1">Inserir rápido:</span>
                    {[
                      'Paciente relata redução significativa no quadro de dor.',
                      'Realizada cinesioterapia motora e exercícios de fortalecimento.',
                      'Excelente tolerância aos exercícios sem queixas álgicas.',
                      'Reforçadas orientações posturais e exercícios domiciliares.',
                    ].map((snippet, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setEditNotes(prev => prev ? `${prev}\n${snippet}` : snippet)}
                        className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2 py-1 rounded-md font-medium border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {snippet.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attached Images */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Fotos Anexadas ({editImages.length})
                    </label>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleEditFilesSelected(e.target.files)}
                    />
                    <button
                      type="button"
                      disabled={uploadingEditImages}
                      onClick={() => editFileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {uploadingEditImages ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      <span>Adicionar Fotos</span>
                    </button>
                  </div>

                  {editImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {editImages.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white group">
                          <img src={img} alt={`Foto ${imgIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditImage(imgIdx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 shadow-sm transition-opacity cursor-pointer"
                            title="Remover foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                      Nenhuma foto anexada a esta evolução.
                    </div>
                  )}
                </div>

                {/* Submit / Cancel Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingEvolutionModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEvolution}
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingEvolution ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
