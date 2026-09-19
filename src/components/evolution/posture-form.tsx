'use client';

import React, { useState, useRef } from 'react';
import { Save, Loader2, Upload, Camera, Trash2 } from 'lucide-react';
import { useToast } from '@/components/toast-context';

const POSTURAL_DEVIATIONS = [
  'Rotação cervical',
  'Inclinação cervical',
  'Rotação de punho',
  'Desalinhamento de quadril',
  'Desalinhamento dos ombros',
  'Triângulo de Tales Assimétrico',
  'Pé abduto',
  'Pé aduto',
  'Geno Valgo',
  'Genu Varo',
];

export function PostureForm({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (item: string) => {
    setCheckedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({
        title: 'Avaliação Postural Salva!',
        description: 'Os dados foram registrados com sucesso.',
        type: 'success'
      });
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto bg-white p-8 border border-slate-200 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-normal text-slate-800">Avaliação postural</h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-4">Visão anterior (De frente)</h3>
          <div className="space-y-3">
            {POSTURAL_DEVIATIONS.map((item, idx) => (
              <label key={idx} className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checkedItems.includes(item)}
                    onChange={() => handleToggle(item)}
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                  <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-700 text-[15px] group-hover:text-slate-900 transition-colors">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={cameraInputRef} 
            onChange={handleFileChange}
          />

          {!photoPreview ? (
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-28 h-28 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group text-slate-600"
              >
                <Upload className="w-7 h-7 mb-2 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-medium">Carregar foto</span>
              </button>

              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-28 h-28 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group text-slate-600"
              >
                <Camera className="w-7 h-7 mb-2 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-medium">Tirar foto</span>
              </button>
            </div>
          ) : (
            <div className="relative inline-block border-4 border-white shadow-lg rounded-xl overflow-hidden group">
              <img src={photoPreview} alt="Preview postural" className="max-h-64 object-contain" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={removePhoto}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all"
                  title="Remover Foto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
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
