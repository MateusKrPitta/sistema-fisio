'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
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
  AlignRight,
  ClipboardList
} from 'lucide-react';
import { useToast } from '@/components/toast-context';

// Rich Text Editor component
const RichTextEditor = ({ value, onChange, label, placeholder }: { value: string, onChange: (val: string) => void, label: string, placeholder?: string }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value || '';
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
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{label}</label>
      <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all bg-white shadow-xs">
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
          data-placeholder={placeholder}
          className="p-4 min-h-[110px] text-sm text-slate-800 focus:outline-none outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
          onInput={handleInput}
        />
      </div>
    </div>
  );
};

export function AnamneseEvaluation({ patientId, recordDate, onSuccess }: { patientId: string; recordDate?: string; onSuccess?: () => void }) {
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    
    try {
      const answers = {
        evaluationType: 'anamnese',
        qp: formData.qp,
        hda: formData.hda,
        hmp: formData.hmp,
        hf: formData.hf,
        obs: formData.obs,
      };

      const payload = {
        templateId: null,
        recordDate: recordDate || new Date().toISOString().split('T')[0],
        answers,
        notes: `Anamnese Fisioterapêutica realizada`,
      };

      await api.post(`/patients/${patientId}/form-records`, payload);

      toast({
        title: 'Avaliação de Anamnese Salva!',
        description: 'Os dados da anamnese foram registrados com sucesso no prontuário do paciente.',
        type: 'success'
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/patients/${patientId}/reports`);
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao Salvar',
        description: err.response?.data?.error || 'Falha ao salvar a avaliação de anamnese.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Anamnese Fisioterapêutica</h3>
            <p className="text-xs text-slate-500">História clínica completa e queixa principal do paciente</p>
          </div>
        </div>

        <div className="space-y-5">
          <RichTextEditor 
            label="Queixa principal (QP) / Motivo da avaliação:" 
            value={formData.qp} 
            placeholder="Ex: Dor lombar há 2 semanas que irradia para o membro inferior direito..."
            onChange={(val) => handleChange('qp', val)} 
          />
          
          <RichTextEditor 
            label="História da doença atual (HDA):" 
            value={formData.hda} 
            placeholder="Ex: Início súbito após esforço físico, piora ao sentar-se por longos períodos..."
            onChange={(val) => handleChange('hda', val)} 
          />
          
          <RichTextEditor 
            label="História médica pregressa (HMP):" 
            value={formData.hmp} 
            placeholder="Ex: Hipertensão controlada, cirurgia de joelho prévia em 2020..."
            onChange={(val) => handleChange('hmp', val)} 
          />
          
          <RichTextEditor 
            label="Histórico familiar (HF):" 
            value={formData.hf} 
            placeholder="Ex: Pai com histórico de hérnia de disco..."
            onChange={(val) => handleChange('hf', val)} 
          />
          
          <RichTextEditor 
            label="Observações Gerais & Diagnóstico Funcional:" 
            value={formData.obs} 
            placeholder="Ex: Paciente orientado quanto à ergonomia e alívio de sobrecarga..."
            onChange={(val) => handleChange('obs', val)} 
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Avaliação</span>
          </button>
        </div>
      </div>
    </div>
  );
}
