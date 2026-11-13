import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Upload, Link, Trash2, X, Check, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

// Función auxiliar para comprimir imagen en el cliente usando Canvas
const comprimirImagen = (file, maxDim = 500, calidad = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Formato jpeg comprimido
        const dataUrl = canvas.toDataURL('image/jpeg', calidad);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function ModalImagenProducto({
  isOpen,
  onClose,
  producto,
  onProductoActualizado
}) {
  const [tab, setTab] = useState('archivo'); // 'archivo' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (producto) {
      const current = producto.imagen_url || '';
      setPreviewUrl(current);
      setUrlInput(current.startsWith('http') ? current : '');
    }
  }, [producto]);

  if (!isOpen || !producto || typeof document === 'undefined') return null;

  // Manejo de archivo seleccionado
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccione un archivo de imagen válido (PNG, JPG, WEBP).');
      return;
    }

    try {
      const compressedDataUrl = await comprimirImagen(file);
      setPreviewUrl(compressedDataUrl);
      toast.success('Imagen cargada y optimizada', { duration: 1200 });
    } catch (err) {
      console.error('Error al procesar imagen:', err);
      toast.error('No se pudo procesar la imagen seleccionada.');
    }
  };

  // Guardar cambios en el backend
  const handleGuardar = async () => {
    try {
      setGuardando(true);
      const imagenFinal = previewUrl.trim() || null;

      const res = await api.put(`/catalogo/${producto.id}`, {
        imagen_url: imagenFinal
      });

      if (res.data?.success) {
        toast.success(
          imagenFinal
            ? `Imagen asignada a ${producto.nombre}`
            : `Imagen eliminada de ${producto.nombre}`
        );

        if (onProductoActualizado) {
          onProductoActualizado(producto.id, { imagen_url: imagenFinal });
        }
        onClose();
      }
    } catch (err) {
      console.error('Error al guardar imagen:', err);
      toast.error(err.response?.data?.message || 'Error al actualizar imagen.');
    } finally {
      setGuardando(false);
    }
  };

  // Quitar imagen
  const handleQuitar = () => {
    setPreviewUrl('');
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden font-sora animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shadow-xs shrink-0">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                Foto de Producto
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {producto.nombre}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Previsualización en Vivo */}
          <div className="flex flex-col items-center">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 self-start">
              Vista Previa en Tarjeta:
            </span>

            <div className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden flex flex-col items-center justify-center group">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuitar}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-md hover:bg-rose-700 cursor-pointer active:scale-95 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-slate-400 space-y-1">
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Sin imagen asignada
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-[200px]">
                    Sube una foto desde tu dispositivo o pega un enlace de internet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Selector de Pestaña: Archivo vs URL */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setTab('archivo')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'archivo'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Archivo</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('url')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'url'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>Enlace Web (URL)</span>
              </button>
            </div>

            {/* Contenido según pestaña */}
            {tab === 'archivo' ? (
              <div className="space-y-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="modal-product-file-input"
                />

                <label
                  htmlFor="modal-product-file-input"
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 text-xs font-bold"
                >
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Seleccionar imagen desde tu computadora</span>
                </label>
                <p className="text-[10px] text-slate-400 text-center">
                  Formatos recomendados: JPG, PNG, WEBP (se optimiza automáticamente).
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setPreviewUrl(e.target.value);
                    }}
                    placeholder="https://ejemplo.com/foto-producto.jpg"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-sora text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {urlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInput('');
                        setPreviewUrl('');
                      }}
                      className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Pega una URL directa a una imagen disponible en internet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between gap-2 shrink-0">
          {previewUrl ? (
            <button
              type="button"
              onClick={handleQuitar}
              className="py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quitar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={guardando}
              onClick={handleGuardar}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Guardar Imagen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

