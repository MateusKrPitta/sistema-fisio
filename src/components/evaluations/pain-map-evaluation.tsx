'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, Loader2, MousePointerClick, Activity, Trash2 } from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { PhotoAttachmentManager } from '@/components/photo-attachment-manager';

type Marker = {
  id: string;
  viewId: string;
  x: number;
  y: number;
  intensity?: number;
  notes?: string;
};

export function PainMapEvaluation({ patientId, recordDate, onSuccess }: { patientId: string; recordDate?: string; onSuccess?: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [painScale, setPainScale] = useState<number>(5);
  const [painCharacteristics, setPainCharacteristics] = useState<string>('');

  const bodyViews = [
    { id: 'frente', label: 'Visão Anterior (Frente)', src: '/body-map/frente.png' },
    { id: 'costas', label: 'Visão Posterior (Costas)', src: '/body-map/costas.png' },
    { id: 'esquerdo', label: 'Perfil Esquerdo', src: '/body-map/esquerdo.png' },
    { id: 'direito', label: 'Perfil Direito', src: '/body-map/direito.png' },
  ];

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, viewId: string) => {
    if ((e.target as HTMLElement).closest('.pain-marker')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: Marker = {
      id: Date.now().toString(),
      viewId,
      x,
      y,
      intensity: painScale,
    };

    setMarkers([...markers, newMarker]);
  };

  const handleRemoveMarker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkers(markers.filter(m => m.id !== id));
  };

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
        description: err.response?.data?.error || 'Falha ao salvar os pontos de dor.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const getPainScaleColor = (scale: number) => {
    if (scale <= 2) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (scale <= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (scale <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Mapa e Pontos de Dor (Body Map)</h3>
              <p className="text-xs text-slate-500">Mapeamento anatômico da queixa álgica e escala de intensidade</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Escala EVA Geral:</span>
            <div className={`px-3 py-1 rounded-xl border font-bold text-sm flex items-center gap-1.5 ${getPainScaleColor(painScale)}`}>
              <span>{painScale} / 10</span>
            </div>
          </div>
        </div>

        {/* EVA Scale Slider */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Escala Visual Analógica da Dor (EVA)</span>
            <span className="font-mono text-sm">{painScale}/10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={painScale}
            onChange={(e) => setPainScale(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>0 - Sem dor</span>
            <span>5 - Dor Moderada</span>
            <span>10 - Dor Insuportável</span>
          </div>
        </div>

        {/* Interactive Body Views */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <MousePointerClick className="w-4 h-4 text-blue-500" />
              Clique no corpo para marcar o ponto de dor. Clique no marcador vermelho para remover.
            </p>
            {markers.length > 0 && (
              <button
                type="button"
                onClick={() => setMarkers([])}
                className="text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar todos ({markers.length})
              </button>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 overflow-x-auto border border-slate-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[620px]">
              {bodyViews.map((view) => (
                <div key={view.id} className="flex flex-col items-center bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-xs font-bold text-slate-300 mb-2">{view.label}</span>
                  <div
                    className="relative h-[280px] sm:h-[340px] cursor-crosshair select-none flex items-center justify-center"
                    onClick={(e) => handleImageClick(e, view.id)}
                  >
                    <img
                      src={view.src}
                      alt={view.label}
                      className="h-full w-auto object-contain pointer-events-none brightness-95"
                      draggable="false"
                    />

                    {/* Markers on this view */}
                    {markers.filter(m => m.viewId === view.id).map((marker) => (
                      <button
                        key={marker.id}
                        type="button"
                        className="pain-marker absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 border-2 border-white rounded-full flex items-center justify-center transition-all hover:scale-125 shadow-lg shadow-red-500/50"
                        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                        onClick={(e) => handleRemoveMarker(marker.id, e)}
                        title="Clique para remover o ponto de dor"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Characteristics text */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Características da dor e fatores de piora/melhora:
          </label>
          <textarea
            value={painCharacteristics}
            onChange={(e) => setPainCharacteristics(e.target.value)}
            placeholder="Ex: Dor em queimação/pontada, piora no final do dia, melhora em repouso..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Photos & Visual Evidence */}
        <PhotoAttachmentManager
          images={images}
          onChange={setImages}
          title="Fotos e Evidências dos Pontos de Dor"
          subtitle="Anexe fotos de hematomas, edemas, postura antálgica ou pontos dolorosos"
        />

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
