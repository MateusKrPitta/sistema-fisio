'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, Loader2, Activity } from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { PhotoAttachmentManager } from '@/components/photo-attachment-manager';
import { InteractivePainBodyMap, PainMarker } from '@/components/interactive-pain-body-map';

export function PainMapEvaluation({
  patientId,
  recordDate,
  onSuccess,
}: {
  patientId: string;
  recordDate?: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [markers, setMarkers] = useState<PainMarker[]>([]);
  const [painScale, setPainScale] = useState<number>(5);
  const [painCharacteristics, setPainCharacteristics] = useState<string>('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const answers = {
        evaluationType: 'pain_map',
        markers,
        painScale,
        painCharacteristics,
        totalPoints: markers.length,
      };

      const payload = {
        templateId: null,
        recordDate: recordDate || new Date().toISOString().split('T')[0],
        answers,
        notes: `Mapeamento de Dor: EVA ${painScale}/10 com ${markers.length} ponto(s) marcado(s)`,
        images,
      };

      await api.post(`/patients/${patientId}/form-records`, payload);

      toast({
        title: 'Mapa de Dor Salvo!',
        description: `${markers.length} ponto(s) de dor registrado(s) no prontuário.`,
        type: 'success',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/patients/${patientId}/reports`);
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao Salvar',
        description: err.response?.data?.error || 'Falha ao salvar os pontos de dor.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const getPainScaleColor = (scale: number) => {
    if (scale === 0) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (scale <= 3) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (scale <= 6) return 'text-amber-700 bg-amber-50 border-amber-300';
    if (scale <= 8) return 'text-orange-700 bg-orange-50 border-orange-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pontos e Mapeamento de Dor (Body Map)</h3>
              <p className="text-xs text-slate-500">Mapeamento anatômico visual da queixa álgica e escala de intensidade</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Intensidade Geral (EVA):</span>
            <div
              className={`px-3.5 py-1.5 rounded-xl border font-black text-sm flex items-center gap-1.5 shadow-2xs ${getPainScaleColor(
                painScale
              )}`}
            >
              <span>{painScale} / 10</span>
            </div>
          </div>
        </div>

        {/* EVA Scale 0-10 Selector */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Escala Visual Analógica da Dor (EVA)
            </span>
            <span className="text-xs font-extrabold text-slate-800">
              {painScale === 0
                ? 'Sem dor (0/10)'
                : painScale <= 3
                ? `Dor Leve (${painScale}/10)`
                : painScale <= 6
                ? `Dor Moderada (${painScale}/10)`
                : painScale <= 8
                ? `Dor Intensa (${painScale}/10)`
                : `Dor Máxima / Insuportável (${painScale}/10)`}
            </span>
          </div>

          <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
            {Array.from({ length: 11 }, (_, i) => i).map((num) => {
              const isSelected = painScale === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPainScale(num)}
                  className={`h-9 sm:h-10 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md scale-105 ring-2 ring-red-600/30'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-0.5">
            <span>0 - Sem dor</span>
            <span>5 - Moderada</span>
            <span>10 - Insuportável</span>
          </div>
        </div>

        {/* Interactive Body Map Component */}
        <InteractivePainBodyMap
          markers={markers}
          onChange={setMarkers}
          activeIntensity={painScale}
          showInstructions={true}
        />

        {/* Characteristics text */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Características da dor, irradiação e fatores agravantes:
          </label>
          <textarea
            value={painCharacteristics}
            onChange={(e) => setPainCharacteristics(e.target.value)}
            placeholder="Ex: Dor em queimação/pontada no ombro direito com irradiação para trapézio; piora ao elevar o braço e melhora em repouso..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none transition-all resize-none font-medium"
          />
        </div>

        {/* Photos & Visual Evidence */}
        <PhotoAttachmentManager
          images={images}
          onChange={setImages}
          title="Fotos e Evidências dos Pontos de Dor"
          subtitle="Anexe fotos de postura antálgica, edemas, hematomas ou pontos gatilho"
        />

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Avaliação de Dor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
