'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

export interface PainMarker {
  id: string;
  viewId: 'frente' | 'costas' | 'esquerdo' | 'direito' | string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  intensity?: number;
  label?: string;
  notes?: string;
}

interface InteractivePainBodyMapProps {
  markers: PainMarker[];
  onChange?: (markers: PainMarker[]) => void;
  readOnly?: boolean;
  showInstructions?: boolean;
  activeIntensity?: number;
  className?: string;
}

export const BODY_VIEWS = [
  { id: 'frente', label: 'Frente', src: '/body-map/frente.png' },
  { id: 'costas', label: 'Costas', src: '/body-map/costas.png' },
  { id: 'esquerdo', label: 'Esquerdo', src: '/body-map/esquerdo.png' },
  { id: 'direito', label: 'Direito', src: '/body-map/direito.png' },
];

export function InteractivePainBodyMap({
  markers = [],
  onChange,
  readOnly = false,
  showInstructions = true,
  activeIntensity,
  className = '',
}: InteractivePainBodyMapProps) {
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, viewId: string) => {
    if (readOnly || !onChange) return;

    // Ignore if clicked directly on an existing marker
    if ((e.target as HTMLElement).closest('.pain-marker-dot')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));

    const newMarker: PainMarker = {
      id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      viewId,
      x,
      y,
      intensity: activeIntensity !== undefined ? activeIntensity : undefined,
    };

    onChange([...markers, newMarker]);
  };

  const handleRemoveMarker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly || !onChange) return;
    onChange(markers.filter((m) => m.id !== id));
  };

  const handleClearAll = () => {
    if (readOnly || !onChange) return;
    onChange([]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Instructions matching the requested layout */}
      {showInstructions && (
        <div className="space-y-1 select-none">
          <p className="text-sm sm:text-base font-semibold text-slate-800">
            Clique na imagem para marcar o ponto da dor do paciente.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Obs: Clique novamente no ponto caso queira remover.
          </p>
        </div>
      )}

      {/* 4 Body Views Layout - Standardized Equal Anatomical Height & Proportion */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs overflow-x-auto">
        <div className="flex flex-nowrap items-end justify-center gap-6 sm:gap-10 min-w-[700px] max-w-5xl mx-auto py-2">
          {BODY_VIEWS.map((view) => {
            const viewMarkers = markers.filter((m) => m.viewId === view.id);

            return (
              <div key={view.id} className="flex flex-col items-center select-none shrink-0">
                {/* View Label */}
                <h4 className="text-base sm:text-lg font-bold text-slate-700 mb-3 tracking-wide text-center">
                  {view.label}
                </h4>

                {/* Standardized Figure Container with identical height and matching natural aspect ratio */}
                <div
                  onClick={(e) => handleImageClick(e, view.id)}
                  className={`relative h-[340px] sm:h-[400px] md:h-[460px] w-auto flex items-center justify-center ${
                    readOnly ? 'cursor-default' : 'cursor-crosshair'
                  } group`}
                  title={readOnly ? view.label : `Clique para marcar ponto de dor na visão: ${view.label}`}
                >
                  <img
                    src={view.src}
                    alt={`Visão ${view.label}`}
                    className="h-full w-auto block pointer-events-none select-none transition-transform duration-200"
                    draggable="false"
                  />

                  {/* Render Target/Bullseye styled Markers for this anatomical view */}
                  {viewMarkers.map((marker, mIdx) => (
                    <button
                      key={marker.id || mIdx}
                      type="button"
                      disabled={readOnly}
                      onClick={(e) => handleRemoveMarker(marker.id, e)}
                      title={
                        readOnly
                          ? `Ponto de dor ${marker.intensity !== undefined ? `(EVA ${marker.intensity})` : ''}`
                          : 'Clique para remover este ponto de dor'
                      }
                      style={{
                        left: `${marker.x}%`,
                        top: `${marker.y}%`,
                      }}
                      className={`pain-marker-dot absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center z-10 transition-transform ${
                        readOnly
                          ? 'cursor-default'
                          : 'hover:scale-125 cursor-pointer active:scale-95'
                      }`}
                    >
                      {/* Outer red halo / aura */}
                      <span className="absolute inset-0 rounded-full bg-red-500/35 animate-pulse"></span>
                      
                      {/* Outer red ring with white border */}
                      <span className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-600 border-2 border-white shadow-lg shadow-red-600/50 flex items-center justify-center">
                        {/* Inner white ring */}
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white flex items-center justify-center">
                          {/* Central red core */}
                          <span className="w-1.5 h-1.5 sm:w-1.5 sm:h-1.5 rounded-full bg-red-600"></span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary / Counter bar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm">
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-bold text-slate-800">
              {markers.length === 0
                ? 'Nenhum ponto marcado'
                : `${markers.length} ponto${markers.length > 1 ? 's' : ''} de dor marcado${
                    markers.length > 1 ? 's' : ''
                  }`}
            </span>
          </div>

          {markers.length > 0 && onChange && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1.5 text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar todos os pontos</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
