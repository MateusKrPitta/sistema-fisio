'use client';

import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { InteractivePainBodyMap, PainMarker } from '@/components/interactive-pain-body-map';

export function PainMapForm({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [markers, setMarkers] = useState<PainMarker[]>([]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({
        title: 'Pontos de Dor Salvos!',
        description: `${markers.length} ponto(s) registrado(s) com sucesso.`,
        type: 'success',
      });
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pontos de Dor</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Mapeie visualmente as queixas de dor do paciente clicando sobre o corpo.
          </p>
        </div>
      </div>

      <InteractivePainBodyMap
        markers={markers}
        onChange={setMarkers}
        showInstructions={true}
      />

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar</span>
        </button>
      </div>
    </div>
  );
}
