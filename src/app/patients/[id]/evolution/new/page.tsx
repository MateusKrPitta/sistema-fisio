'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  Save,
  Clock,
  Calendar,
  User,
  History,
  CheckCircle2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Plus,
  Trash2,
  ZoomIn,
  X,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/toast-context';
import { formatCurrency } from '@/components/currency-input';

const QUICK_CLINICAL_CHIPS = [
  'Paciente relata redução no quadro de dor.',
  'Realizado protocolo de cinesioterapia ativa e resistida.',
  'Aplicada liberação miofascial e mobilização articular.',
  'Melhora progressiva do ganho de amplitude de movimento (ADM).',
  'Realizado treino de equilíbrio estático e dinâmico.',
  'Paciente tolerou bem a carga de exercícios propostos.',
  'Reforçadas orientações posturais e exercícios domiciliares.',
];

/**
 * Compresses and resizes an image file to a base64 Data URL
 */
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
        // Convert to quality JPEG
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

export default function NewEvolutionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const patientId = params?.id as string;
  const appointmentId = searchParams?.get('appointmentId');

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Evolution Form State
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [evolutionNotes, setEvolutionNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [previousEvolutions, setPreviousEvolutions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Lightbox / Image Preview Modal
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [historyPreviewImages, setHistoryPreviewImages] = useState<{ images: string[]; index: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);

    Promise.all([
      api.get(`/patients/${patientId}`).catch(() => null),
      appointmentId ? api.get(`/appointments/${appointmentId}`).catch(() => null) : Promise.resolve(null),
    ])
      .then(([patientRes, appointmentRes]) => {
        const p = patientRes?.data || patientRes;
        setPatient(p);

        // Preload previous evolutions from patient appointments
        if (p?.appointments && Array.isArray(p.appointments)) {
          const validHistory = p.appointments
            .filter((a: any) => (a.notes && a.notes.trim() !== '' && !a.notes.startsWith('Sessão ')) || (a.images && a.images.length > 0))
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setPreviousEvolutions(validHistory);
        }

        // If an appointment was passed, prefill its date/time/notes/images
        if (appointmentRes) {
          const app = appointmentRes?.data || appointmentRes;
          if (app.date) {
            setRecordDate(app.date.split('T')[0]);
          }
          if (app.startTime) {
            setStartTime(app.startTime);
          }
          if (app.notes && !app.notes.startsWith('Sessão ')) {
            setEvolutionNotes(app.notes);
            if (editorRef.current) {
              editorRef.current.innerHTML = app.notes;
            }
          }
          if (app.images && Array.isArray(app.images)) {
            setImages(app.images);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [patientId, appointmentId]);

  const formatText = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      setEvolutionNotes(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setEvolutionNotes(editorRef.current.innerHTML);
    }
  };

  const insertChipText = (text: string) => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const newHtml = currentHtml.trim() === '' || currentHtml === '<br>' 
        ? `<p>${text}</p>` 
        : `${currentHtml}<p>${text}</p>`;
      editorRef.current.innerHTML = newHtml;
      setEvolutionNotes(newHtml);
      editorRef.current.focus();
    }
  };

  // Image handling
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      toast({
        title: 'Formato Inválido',
        description: 'Por favor, selecione arquivos de imagem válidos (JPG, PNG, WEBP).',
        type: 'warning',
      });
      setUploadingImages(false);
      return;
    }

    try {
      const compressedUrls = await Promise.all(
        validFiles.map(file => compressImageFile(file))
      );
      setImages(prev => [...prev, ...compressedUrls]);
      toast({
        title: 'Imagens Adicionadas',
        description: `${compressedUrls.length} ${compressedUrls.length === 1 ? 'imagem adicionada' : 'imagens adicionadas'} com sucesso.`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível processar algumas imagens. Tente novamente.',
        type: 'error',
      });
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (previewImageIndex === indexToRemove) {
      setPreviewImageIndex(null);
    } else if (previewImageIndex !== null && previewImageIndex > indexToRemove) {
      setPreviewImageIndex(previewImageIndex - 1);
    }
    toast({
      title: 'Imagem Removida',
      description: 'A imagem foi removida da evolução.',
      type: 'info',
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const plainText = editorRef.current?.innerText?.trim() || '';
    if (!plainText && (!evolutionNotes || evolutionNotes.trim() === '') && images.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Por favor, digite a anotação da evolução do paciente ou adicione fotos.',
        type: 'warning',
      });
      return;
    }

    setSaving(true);
    const contentToSave = editorRef.current?.innerHTML || evolutionNotes;

    try {
      if (appointmentId) {
        // Update existing appointment
        await api.put(`/appointments/${appointmentId}`, {
          notes: contentToSave,
          images: images,
          status: 'finalizado',
        });
      } else {
        // Create new evolution appointment record
        await api.post('/appointments', {
          patientId: Number(patientId),
          date: recordDate,
          startTime: startTime || '08:00',
          endTime: '23:59',
          specialty: 'Evolução Clínica',
          status: 'finalizado',
          notes: contentToSave,
          images: images,
        });
      }

      toast({
        title: 'Evolução Salva!',
        description: 'A evolução clínica e as fotos foram salvas com sucesso no prontuário do paciente.',
        type: 'success',
      });

      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Falha ao salvar a evolução.';
      toast({
        title: 'Erro ao Salvar',
        description: msg,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header
        title={`Nova Evolução - ${patient?.fullName || patient?.name || (loading ? 'Carregando...' : 'Paciente')}`}
        subtitle="Registro de anotação clínica e acompanhamento da sessão"
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 space-y-6 max-w-5xl mx-auto w-full">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          {previousEvolutions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-fit"
            >
              <History className="w-4 h-4" />
              <span>{showHistory ? 'Ocultar Histórico' : `Ver Histórico de Evoluções (${previousEvolutions.length})`}</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/20 text-lg">
                  {(patient?.fullName || patient?.name || 'P').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {patient?.fullName || patient?.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>CPF: {patient?.cpf || 'Não informado'}</span>
                    {patient?.sessionRate ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {formatCurrency(patient.sessionRate)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Date & Time Inputs */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Data da Sessão</span>
                    <input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Horário</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Clinical Chips */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Atalhos Rápidos de Conduta (clique para inserir no texto):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_CLINICAL_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertChipText(chip)}
                    className="text-xs font-medium bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl shadow-2xs transition-all text-left cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Rich Text Area for Evolution */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Anotação da Evolução Clínica</h4>
                  <p className="text-xs text-slate-500">Descreva as queixas, testes realizados, intervenções fisioterapêuticas e resposta do paciente</p>
                </div>

                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs overflow-x-auto">
                  <button type="button" onClick={() => formatText('bold')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Negrito"><Bold className="w-4 h-4"/></button>
                  <button type="button" onClick={() => formatText('italic')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Itálico"><Italic className="w-4 h-4"/></button>
                  <button type="button" onClick={() => formatText('underline')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Sublinhado"><Underline className="w-4 h-4"/></button>
                  <button type="button" onClick={() => formatText('strikeThrough')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Tachado"><Strikethrough className="w-4 h-4"/></button>
                  <div className="w-px h-4 bg-slate-200 mx-1"></div>
                  <button type="button" onClick={() => formatText('insertOrderedList')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Lista Numerada"><ListOrdered className="w-4 h-4"/></button>
                  <button type="button" onClick={() => formatText('insertUnorderedList')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Lista de Pontos"><List className="w-4 h-4"/></button>
                  <div className="w-px h-4 bg-slate-200 mx-1"></div>
                  <button type="button" onClick={() => formatText('justifyLeft')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><AlignLeft className="w-4 h-4"/></button>
                  <button type="button" onClick={() => formatText('justifyCenter')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><AlignCenter className="w-4 h-4"/></button>
                  <button type="button" onClick={() => formatText('justifyRight')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><AlignRight className="w-4 h-4"/></button>
                  <div className="w-px h-4 bg-slate-200 mx-1"></div>
                  <button type="button" onClick={() => formatText('removeFormat')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Limpar"><Eraser className="w-4 h-4"/></button>
                </div>
              </div>

              {/* Editable Large Content Area */}
              <div
                ref={editorRef}
                contentEditable
                data-placeholder="Digite aqui a evolução completa do paciente... (Ex: Paciente compareceu à sessão relatando melhora das dores na coluna lombar. Realizada mobilização articular L4-L5, exercícios de fortalecimento de core e estabilização segmentar. Ao término, referiu ausência de dor.)"
                className="p-6 min-h-[300px] text-sm text-slate-800 leading-relaxed focus:outline-none outline-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
                onInput={handleEditorInput}
              />
            </div>

            {/* Attached Images / Photos Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Fotos e Imagens da Sessão {images.length > 0 ? `(${images.length})` : ''}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Anexe registros de postura, amplitude articular, exames ou evolução de lesões
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {uploadingImages ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Adicionar Fotos</span>
                  </button>
                </div>
              </div>

              {/* Multi-column Standardized Grid */}
              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center shadow-2xs transition-colors">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                      Clique ou arraste imagens aqui para anexar
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Suporte a múltiplas fotos (JPG, PNG, WEBP). Ficarão salvas nesta evolução.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {images.map((imgUrl, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs hover:shadow-md transition-all flex items-center justify-center"
                    >
                      {/* Standard Uniform Image Thumbnail */}
                      <img
                        src={imgUrl}
                        alt={`Foto da evolução ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                        onClick={() => setPreviewImageIndex(index)}
                      />

                      {/* Click overlay for preview */}
                      <div
                        onClick={() => setPreviewImageIndex(index)}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors cursor-pointer flex items-center justify-center"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs text-slate-800 p-2 rounded-xl shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-200">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Remove Image Button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveImage(index, e)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-xl shadow-md transition-all opacity-90 group-hover:opacity-100 cursor-pointer z-10 hover:scale-110 active:scale-95"
                        title="Remover imagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Photo Badge */}
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
                        #{index + 1}
                      </div>
                    </motion.div>
                  ))}

                  {/* Add More Photos Card in the Grid */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/40 flex flex-col items-center justify-center space-y-1.5 text-slate-500 hover:text-blue-600 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white group-hover:bg-blue-100 flex items-center justify-center shadow-2xs">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Adicionar mais</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                A anotação e as imagens serão gravadas diretamente no prontuário e na agenda do paciente.
              </p>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Evolução</span>
                </button>
              </div>
            </div>

            {/* Previous Evolutions History Drawer */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4 overflow-hidden"
                >
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <History className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-slate-800 text-base">Histórico Anterior de Evoluções</h4>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                    {previousEvolutions.map((app: any, idx: number) => {
                      const appImages = Array.isArray(app.images) ? app.images : [];
                      return (
                        <div
                          key={app.id || idx}
                          className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {app.date ? app.date.split('T')[0].split('-').reverse().join('/') : 'Data não informada'}
                            </span>
                            <span className="text-slate-400 font-mono">{app.startTime || ''}</span>
                          </div>

                          {app.notes && (
                            <div
                              className="text-slate-700 leading-relaxed text-xs [&_p]:mb-1 [&_strong]:font-bold"
                              dangerouslySetInnerHTML={{ __html: app.notes }}
                            />
                          )}

                          {/* Photos attached to this previous evolution */}
                          {appImages.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/50">
                              <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-2 text-[11px]">
                                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                                <span>Fotos anexadas ({appImages.length}):</span>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {appImages.map((histImg: string, hIdx: number) => (
                                  <div
                                    key={hIdx}
                                    onClick={() => setHistoryPreviewImages({ images: appImages, index: hIdx })}
                                    className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:shadow-sm cursor-pointer group relative"
                                  >
                                    <img
                                      src={histImg}
                                      alt={`Foto histórico ${hIdx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Lightbox / Full-Size Image Preview Modal */}
      <AnimatePresence>
        {previewImageIndex !== null && images[previewImageIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            >
              {/* Top Controls */}
              <div className="absolute -top-12 left-0 right-0 flex items-center justify-between text-white px-2">
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
                  Foto {previewImageIndex + 1} de {images.length}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(previewImageIndex)}
                    className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                    title="Remover esta foto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Excluir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewImageIndex(null)}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                    title="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Image */}
              <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center max-h-[80vh] w-full">
                <img
                  src={images[previewImageIndex]}
                  alt={`Visualização ${previewImageIndex + 1}`}
                  className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-xl"
                />

                {/* Left/Right Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewImageIndex((previewImageIndex - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-all cursor-pointer shadow-lg"
                      title="Foto anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewImageIndex((previewImageIndex + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-all cursor-pointer shadow-lg"
                      title="Próxima foto"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Lightbox Preview */}
      <AnimatePresence>
        {historyPreviewImages !== null && historyPreviewImages.images[historyPreviewImages.index] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            >
              <div className="absolute -top-12 left-0 right-0 flex items-center justify-between text-white px-2">
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
                  Foto do Histórico ({historyPreviewImages.index + 1} de {historyPreviewImages.images.length})
                </span>

                <button
                  type="button"
                  onClick={() => setHistoryPreviewImages(null)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center max-h-[80vh] w-full">
                <img
                  src={historyPreviewImages.images[historyPreviewImages.index]}
                  alt="Foto histórica"
                  className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-xl"
                />

                {historyPreviewImages.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHistoryPreviewImages({
                        ...historyPreviewImages,
                        index: (historyPreviewImages.index - 1 + historyPreviewImages.images.length) % historyPreviewImages.images.length
                      })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-all cursor-pointer shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryPreviewImages({
                        ...historyPreviewImages,
                        index: (historyPreviewImages.index + 1) % historyPreviewImages.images.length
                      })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-all cursor-pointer shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
