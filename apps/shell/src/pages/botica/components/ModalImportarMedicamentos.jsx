import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Package
} from 'lucide-react';

export default function ModalImportarMedicamentos({ abierto, alCerrar, alCompletar }) {
  if (!abierto) return null;

  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const fileInputRef = useRef(null);

  const manejarArchivo = (arch) => {
    if (!arch) return;
    const ext = arch.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      toast.error('Formato no admitido. Por favor seleccione un archivo Excel (.xlsx, .xls) o .csv');
      return;
    }
    setArchivo(arch);
    setResultado(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      manejarArchivo(e.dataTransfer.files[0]);
    }
  };

  const descargarPlantilla = async () => {
    try {
      toast.loading('Generando plantilla oficial de medicamentos...', { id: 'down-med-tpl' });
      const response = await api.get('/medicamentos/plantilla-excel', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_catalogo_medicamentos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Plantilla descargada con éxito', { id: 'down-med-tpl' });
    } catch (e) {
      toast.error('Error al descargar la plantilla de medicamentos', { id: 'down-med-tpl' });
    }
  };

  const subirEImportar = async () => {
    if (!archivo) {
      toast.error('Seleccione un archivo de medicamentos primero');
      return;
    }

    try {
      setCargando(true);
      const formData = new FormData();
      formData.append('archivo', archivo);

      const res = await api.post('/medicamentos/importar-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res?.success) {
        toast.success(res.message || 'Catálogo importado exitosamente');
        setResultado(res);
        if (alCompletar) alCompletar();
      } else {
        toast.error(res?.message || 'Error al procesar el archivo');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error al importar catálogo');
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setArchivo(null);
    setResultado(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-150 flex flex-col relative my-auto animate-in zoom-in-95 duration-200 cursor-default max-h-[90vh] overflow-y-auto custom-modal-scroll"
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Importación Masiva de Medicamentos
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Carga catálogos completos de clientes o inventarios iniciales desde Excel / CSV
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
            title="Cerrar ventana (Esc)"
          >
            <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="py-6 space-y-5">
          {/* Botón de Descarga de Plantilla Oficial */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/8 via-teal-500/8 to-emerald-500/8 border border-emerald-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-black text-slate-900">¿Aún no tienes el formato?</p>
                <p className="text-[11px] text-slate-500 font-medium">Descarga la plantilla con ejemplos y columnas preconfiguradas.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={descargarPlantilla}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla Excel</span>
            </button>
          </div>

          {/* Área de Arrastre de Archivo (Drag & Drop) */}
          {!resultado && (
            <div
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                arrastrando
                  ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                  : archivo
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => manejarArchivo(e.target.files?.[0])}
                className="hidden"
              />

              {archivo ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-black text-slate-900 truncate max-w-xs">{archivo.name}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {(archivo.size / 1024).toFixed(1)} KB • Clic para cambiar archivo
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3 shadow-2xs">
                    <UploadCloud className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-sm font-black text-slate-800">
                    Arrastra tu archivo Excel aquí o haz clic para examinar
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Formatos soportados: .xlsx, .xls o .csv (hasta 25 MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Resultado de la importación */}
          {resultado && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>¡Importación completada con éxito!</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs text-center">
                  <span className="block text-2xl font-black text-emerald-600">{resultado.creados}</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Nuevos Medicamentos</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs text-center">
                  <span className="block text-2xl font-black text-teal-600">{resultado.actualizados}</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Medicamentos Actualizados</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={alCerrar}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {resultado ? 'Cerrar' : 'Cancelar'}
          </button>

          {resultado ? (
            <button
              type="button"
              onClick={reiniciar}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Importar otro archivo
            </button>
          ) : (
            <button
              type="button"
              disabled={!archivo || cargando}
              onClick={subirEImportar}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {cargando ? (
                <span>Procesando e importando...</span>
              ) : (
                <>
                  <span>Procesar Catálogo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
