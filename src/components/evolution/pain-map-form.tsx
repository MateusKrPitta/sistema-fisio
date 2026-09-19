'use client';

import React, { useState } from 'react';
import { Save, Loader2, MousePointerClick } from 'lucide-react';
import { useToast } from '@/components/toast-context';

type Marker = {
  id: string;
  viewId: string;
  x: number;
  y: number;
};

export function PainMapForm({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);

  const bodyViews = [
    { id: 'frente', label: 'Frente', src: '/body-map/frente.png' },
    { id: 'costas', label: 'Costas', src: '/body-map/costas.png' },
    { id: 'esquerdo', label: 'Esquerdo', src: '/body-map/esquerdo.png' },
    { id: 'direito', label: 'Direito', src: '/body-map/direito.png' },
  ];

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({
        title: 'Pontos de Dor Salvos!',
        description: `${markers.length} ponto(s) registrado(s) com sucesso.`,
        type: 'success'
      });
    }, 1000);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, viewId: string) => {
    // Check if we clicked on an existing marker to avoid creating a new one underneath
    if ((e.target as HTMLElement).closest('.pain-marker')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: Marker = {
      id: Date.now().toString(),
      viewId,
      x,
      y,
    };

    setMarkers([...markers, newMarker]);
  };

  const handleRemoveMarker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkers(markers.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pontos de dor</h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <MousePointerClick className="w-4 h-4" />
            Clique na imagem para marcar o ponto da dor do paciente. Obs: Clique novamente no ponto caso queira remover.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 overflow-x-auto">
        <div className="flex flex-row justify-between gap-4 min-w-[700px] max-w-5xl mx-auto">
          {bodyViews.map((view) => (
            <div key={view.id} className="flex flex-col items-center">
              <div className="text-sm font-bold text-slate-600 mb-4">{view.label}</div>
              
              <div 
                className="relative h-[300px] lg:h-[400px] cursor-crosshair group select-none"
                onClick={(e) => handleImageClick(e, view.id)}
              >
                <img 
                  src={view.src} 
                  alt={view.label} 
                  className="h-full w-auto object-contain pointer-events-none"
                  draggable="false"
                />

                {/* Markers for this view */}
                {markers.filter(m => m.viewId === view.id).map((marker) => (
                  <button
                    key={marker.id}
                    type="button"
                    className="pain-marker absolute w-3 h-3 sm:w-4 sm:h-4 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 hover:bg-red-600 border border-white rounded-full flex items-center justify-center transition-all hover:scale-125"
                    style={{ left: `${marker.x}%`, top: `${marker.y}%`, boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}
                    onClick={(e) => handleRemoveMarker(marker.id, e)}
                    title="Clique para remover"
                  >
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {markers.length > 0 && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm">
          <span>{markers.length} ponto(s) de dor mapeado(s).</span>
          <button 
            onClick={() => setMarkers([])}
            className="text-red-700 hover:text-red-900 underline text-xs"
          >
            Limpar todos
          </button>
        </div>
      )}
      
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
  );
}
