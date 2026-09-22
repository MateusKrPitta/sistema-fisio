'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  Camera,
  UploadCloud,
  Plus,
  Trash2,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/toast-context';
import { ImageLightbox } from '@/components/image-lightbox';

/**
 * Compresses and resizes an image file to a base64 Data URL
 */
export async function compressImageFile(file: File): Promise<string> {
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

interface PhotoAttachmentManagerProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
}

export function PhotoAttachmentManager({
  images,
  onChange,
  title = 'Fotos e Evidências Visuais da Avaliação',
  subtitle = 'Anexe registros de postura, testes de amplitude, exames complementares ou fotos corporais',
  disabled = false,
}: PhotoAttachmentManagerProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    setUploading(true);
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      toast({
        title: 'Formato Inválido',
        description: 'Por favor, selecione arquivos de imagem válidos (JPG, PNG, WEBP).',
        type: 'warning',
      });
      setUploading(false);
      return;
    }

    try {
      const compressedUrls = await Promise.all(
        validFiles.map((file) => compressImageFile(file))
      );
      const updated = [...images, ...compressedUrls];
      onChange(updated);
      toast({
        title: 'Imagens Adicionadas',
        description: `${compressedUrls.length} ${
          compressedUrls.length === 1 ? 'foto adicionada' : 'fotos adicionadas'
        } à avaliação.`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível processar algumas imagens. Tente novamente.',
        type: 'error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemove = (indexToRemove: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled) return;

    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);

    if (previewIndex === indexToRemove) {
      setPreviewIndex(null);
    } else if (previewIndex !== null && previewIndex > indexToRemove) {
      setPreviewIndex(previewIndex - 1);
    }

    toast({
      title: 'Foto Removida',
      description: 'A imagem foi removida da lista.',
      type: 'info',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>{title}</span>
              {images.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {images.length} {images.length === 1 ? 'foto' : 'fotos'}
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Camera capture button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading || disabled}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Tirar foto agora com a câmera"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Câmera</span>
          </button>

          {/* Add from gallery/files button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Adicionar Fotos</span>
          </button>
        </div>
      </div>

      {/* Grid or Empty Drag & Drop */}
      {images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center shadow-2xs transition-colors">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
              Clique ou arraste imagens aqui para anexar
            </p>
            <p className="text-[11px] text-slate-400">
              Suporte a múltiplas fotos (JPG, PNG, WEBP). Ficarão salvas no prontuário e laudos desta avaliação.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-1">
          {images.map((imgUrl, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs hover:shadow-md transition-all flex items-center justify-center"
            >
              {/* Image thumbnail */}
              <img
                src={imgUrl}
                alt={`Foto da avaliação ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                onClick={() => setPreviewIndex(index)}
              />

              {/* Click overlay for preview */}
              <div
                onClick={() => setPreviewIndex(index)}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors cursor-pointer flex items-center justify-center"
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs text-slate-800 p-2 rounded-xl shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-200">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(index, e)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-xl shadow-md transition-all opacity-90 group-hover:opacity-100 cursor-pointer z-10 hover:scale-110 active:scale-95"
                  title="Remover imagem"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Photo badge number */}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
                #{index + 1}
              </div>
            </motion.div>
          ))}

          {/* Add more button tile in the grid */}
          {!disabled && (
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
          )}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      <ImageLightbox
        images={images}
        currentIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onNavigate={(newIndex) => setPreviewIndex(newIndex)}
        title={title}
      />
    </div>
  );
}
