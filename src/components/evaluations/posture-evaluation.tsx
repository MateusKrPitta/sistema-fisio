'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, Loader2, UserCheck, Check } from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { PhotoAttachmentManager } from '@/components/photo-attachment-manager';

const POSTURAL_SECTIONS = [
  {
    title: 'Visão Anterior (De Frente)',
    items: [
      'Inclinação cervical (D/E)',
      'Rotação cervical (D/E)',
      'Desalinhamento / Elevação dos Ombros',
      'Triângulo de Tales Assimétrico',
      'Desalinhamento de Cristas Ilíacas (Quadril)',
      'Geno Valgo',
      'Genu Varo',
      'Pé Pronado',
      'Pé Supinado',
      'Pé Abduto / Aduto',
    ]
  },
  {
    title: 'Visão Posterior (De Costas)',
    items: [
      'Escoliose / Desvio lateral da coluna',
      'Escápula Alada / Protusa',
      'Assimetria de pregas glúteas',
      'Tendão calcâneo valgo/varo',
    ]
  },
  {
    title: 'Visão Lateral (Perfil)',
    items: [
      'Projeção anterior da cabeça',
      'Hipercifose Torácica',
      'Hiperlordose Lombar',
      'Retificação Lombar',
      'Retroversão Pélvica',
      'Anteversão Pélvica',
      'Genu Recurvatum',
      'Genu Flexo',
    ]
  }
];

export function PostureEvaluation({ patientId, recordDate, onSuccess }: { patientId: string; recordDate?: string; onSuccess?: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [postureNotes, setPostureNotes] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);

  const handleToggle = (item: string) => {
    setCheckedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const answers = {
        evaluationType: 'posture',
        deviations: checkedItems,
        totalDeviations: checkedItems.length,
        notes: postureNotes,
        hasPhoto: images.length > 0,
        photoData: images[0] || null,
      };

      const payload = {
        templateId: null,
        recordDate: recordDate || new Date().toISOString().split('T')[0],
        answers,
        notes: `Avaliação Postural: ${checkedItems.length} alteração(ões) postural(is) identificada(s)`,
        images,
      };

      await api.post(`/patients/${patientId}/form-records`, payload);

      toast({
        title: 'Avaliação Postural Salva!',
        description: `${checkedItems.length} desvios posturais registrados no prontuário.`,
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
        description: err.response?.data?.error || 'Falha ao salvar a avaliação postural.',
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
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Avaliação Postural & Fotometria</h3>
            <p className="text-xs text-slate-500">Mapeamento biomecânico e registro de desvios e alinhamentos corporais</p>
          </div>
        </div>

        {/* Postural Deviations Checklist */}
        <div className="space-y-6">
          {POSTURAL_SECTIONS.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                {sec.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sec.items.map((item, idx) => {
                  const isChecked = checkedItems.includes(item);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggle(item)}
                      className={`flex items-center space-x-3 p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        isChecked 
                          ? 'bg-purple-50/80 border-purple-300 text-purple-900 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Photo / Camera Capture Section */}
        <PhotoAttachmentManager
          images={images}
          onChange={setImages}
          title="Registro Fotográfico / Fotometria Postural"
          subtitle="Anexe fotos dos planos anterior, posterior, perfis e simetria postural (suporte a múltiplas fotos)"
        />

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Observações e Conduta Terapêutica Postural:
          </label>
          <textarea
            value={postureNotes}
            onChange={(e) => setPostureNotes(e.target.value)}
            placeholder="Ex: Trabalho de fortalecimento de cadeia posterior e alinhamento escapular..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
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
