'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { useToast } from '@/components/toast-context';

// Custom Rich Text Editor that avoids React 19 issues and cursor jumping
const RichTextEditor = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const format = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-800">{label}</label>
      <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all bg-white shadow-xs">
        
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 overflow-x-auto">
          <button type="button" onClick={() => format('bold')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Negrito"><Bold className="w-4 h-4"/></button>
          <button type="button" onClick={() => format('italic')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Itálico"><Italic className="w-4 h-4"/></button>
          <button type="button" onClick={() => format('underline')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Sublinhado"><Underline className="w-4 h-4"/></button>
          <button type="button" onClick={() => format('strikeThrough')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Tachado"><Strikethrough className="w-4 h-4"/></button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button type="button" onClick={() => format('insertOrderedList')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Lista Numerada"><ListOrdered className="w-4 h-4"/></button>
          <button type="button" onClick={() => format('insertUnorderedList')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Lista de Pontos"><List className="w-4 h-4"/></button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button type="button" onClick={() => format('justifyLeft')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"><AlignLeft className="w-4 h-4"/></button>
          <button type="button" onClick={() => format('justifyCenter')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"><AlignCenter className="w-4 h-4"/></button>
          <button type="button" onClick={() => format('justifyRight')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"><AlignRight className="w-4 h-4"/></button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button type="button" onClick={() => format('removeFormat')} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors" title="Limpar Formatação"><Eraser className="w-4 h-4"/></button>
        </div>

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          className="p-4 min-h-[120px] text-sm text-slate-800 focus:outline-none outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          onInput={handleInput}
        />
      </div>
    </div>
  );
};

export function AnamneseForm({ patientId, appointmentId }: { patientId: string, appointmentId?: string | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    qp: '',
    hda: '',
    hmp: '',
    hf: '',
    obs: '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    let notesHtml = '';
    if (formData.qp) notesHtml += `<strong>QP (Queixa Principal):</strong><br/>${formData.qp}<br/><br/>`;
    if (formData.hda) notesHtml += `<strong>HDA (História da Doença Atual):</strong><br/>${formData.hda}<br/><br/>`;
    if (formData.hmp) notesHtml += `<strong>HMP (História Médica Pregressa):</strong><br/>${formData.hmp}<br/><br/>`;
    if (formData.hf) notesHtml += `<strong>HF (Histórico Familiar):</strong><br/>${formData.hf}<br/><br/>`;
    if (formData.obs) notesHtml += `<strong>Observações:</strong><br/>${formData.obs}`;

    try {
      if (appointmentId) {
        await api.put(`/appointments/${appointmentId}`, { notes: notesHtml });
      } else {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const timeStr = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
        
        await api.post('/appointments', {
           patientId: Number(patientId),
           date: dateStr,
           startTime: timeStr,
           endTime: "23:59",
           specialty: "Evolução (Anamnese)",
           status: "finalizado",
           notes: notesHtml
        });
      }

      toast({
        title: 'Evolução Salva!',
        description: 'Os dados foram registrados com sucesso no histórico do paciente.',
        type: 'success'
      });
      router.back();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.error || 'Falha ao salvar a evolução.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Anamnese</h2>
      </div>

      <div className="space-y-6">
        <RichTextEditor 
          label="Queixa principal (QP) / Motivo da avaliação:" 
          value={formData.qp} 
          onChange={(val) => handleChange('qp', val)} 
        />
        
        <RichTextEditor 
          label="História da doença atual (HDA):" 
          value={formData.hda} 
          onChange={(val) => handleChange('hda', val)} 
        />
        
        <RichTextEditor 
          label="História médica pregressa (HMP):" 
          value={formData.hmp} 
          onChange={(val) => handleChange('hmp', val)} 
        />
        
        <RichTextEditor 
          label="Histórico familiar (HF):" 
          value={formData.hf} 
          onChange={(val) => handleChange('hf', val)} 
        />
        
        <RichTextEditor 
          label="Observações:" 
          value={formData.obs} 
          onChange={(val) => handleChange('obs', val)} 
        />
        
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
