import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Share2,
  Copy,
  CheckCircle2,
  Check,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketCierreCaja } from '../../utils/impresionTermica';
import ModalTicketCierre from './ModalTicketCierre';

export default function ModalCierreCajaExito({ isOpen, onClose, cajaData }) {
  const settings = useSettingsStore();

  const [tamanoPapel, setTamanoPapel] = useState('80mm');
  const [mostrarInputWhatsapp, setMostrarInputWhatsapp] = useState(false);
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [mostrarPreviewModal, setMostrarPreviewModal] = useState(false);

  useEffect(() => {
    if (!isOpen || !cajaData) return;

    const dif = parseFloat(cajaData?.diferencia || 0);
    if (Math.abs(dif) < 0.01) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#3b82f6', '#6366f1', '#10b981', '#f59e0b']
        });
      } catch (e) {
        // Fallback si canvas-confetti falla
      }
    }
  }, [isOpen, cajaData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !cajaData) return null;

  // Extraer datos financieros
  let resumenObj = {};
  if (typeof cajaData?.resumen_metodos === 'string') {
    try {
      resumenObj = JSON.parse(cajaData.resumen_metodos);
    } catch (_) { }
  } else if (typeof cajaData?.resumen_metodos === 'object') {
    resumenObj = cajaData.resumen_metodos || {};
  }

  const mInicial = parseFloat(cajaData.monto_apertura ?? cajaData.monto_inicial ?? 0);
  const vEfectivo = parseFloat(resumenObj.pagos_efectivo ?? cajaData.ventas_efectivo ?? 0);
  const vDigital = parseFloat(resumenObj.total_digital ?? cajaData.ventas_digitales ?? 0);
  const ingExtra = parseFloat(resumenObj.ingresos_manuales_efectivo ?? cajaData.ingresos_extra ?? 0);
  const egresos = parseFloat(resumenObj.egresos_efectivo ?? cajaData.total_egresos ?? 0);
  const sEsperado = parseFloat(cajaData.monto_cierre_esperado ?? cajaData.monto_final_esperado ?? (mInicial + vEfectivo + ingExtra - egresos));
  const sReal = parseFloat(cajaData.monto_cierre_real ?? cajaData.monto_final_real ?? cajaData.monto_final ?? 0);
  const dif = parseFloat(cajaData.diferencia !== undefined ? cajaData.diferencia : (sReal - sEsperado));

  const esCuadrado = Math.abs(dif) < 0.01;
  const esSobrante = dif > 0.01;
  const esFaltante = dif < -0.01;

  const handlePrint = () => {
    imprimirTicketCierreCaja(cajaData, { formato: tamanoPapel, settings, autoPrint: true });
    toast.success(`Enviando ticket a impresora térmica (${tamanoPapel})...`, {
      icon: '🖨️',
      duration: 3500
    });
  };

  const handleCopiarResumen = () => {
    const texto = `🏨 *REPORTE DE CIERRE DE CAJA — ${settings.businessName || 'HOTEL'}*
Turno N°: #${cajaData.id}
Responsable: ${cajaData.usuario?.nombre || cajaData.usuario?.name || 'Recepción'}
Fecha Cierre: ${new Date(cajaData.fecha_cierre || Date.now()).toLocaleString('es-PE')}
--------------------------------
(+) Fondo Inicial: S/ ${mInicial.toFixed(2)}
(+) Cobros Efectivo: S/ ${vEfectivo.toFixed(2)}
(+) Cobros Digitales: S/ ${vDigital.toFixed(2)}
(-) Salidas/Egresos: S/ ${egresos.toFixed(2)}
--------------------------------
Esperado en Cajón: S/ ${sEsperado.toFixed(2)}
Efectivo Real Contado: S/ ${sReal.toFixed(2)}
Diferencia: ${dif > 0 ? '+' : ''}S/ ${dif.toFixed(2)} (${esCuadrado ? 'CUADRADO' : esSobrante ? 'SOBRANTE' : 'FALTANTE'})
Notas: ${cajaData.observaciones_cierre || 'Sin observaciones'}`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast.success('Resumen copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleEnviarWhatsapp = (e) => {
    e.preventDefault();
    if (!telefonoWhatsapp.trim()) {
      toast.error('Ingrese un número de WhatsApp');
      return;
    }
    const cleanNum = telefonoWhatsapp.replace(/\D/g, '');
    const numFinal = cleanNum.startsWith('51') ? cleanNum : `51${cleanNum}`;
    const texto = `🏨 *REPORTE DE CIERRE DE CAJA — ${settings.businessName || 'HOTEL'}*
Turno N°: #${cajaData.id}
Responsable: ${cajaData.usuario?.nombre || cajaData.usuario?.name || 'Recepción'}
Fecha: ${new Date(cajaData.fecha_cierre || Date.now()).toLocaleString('es-PE')}
--------------------------------
(+) Fondo Inicial: S/ ${mInicial.toFixed(2)}
(+) Cobros Efectivo: S/ ${vEfectivo.toFixed(2)}
(+) Cobros Digitales: S/ ${vDigital.toFixed(2)}
(-) Salidas/Egresos: S/ ${egresos.toFixed(2)}
--------------------------------
Esperado: S/ ${sEsperado.toFixed(2)}
Real Contado: S/ ${sReal.toFixed(2)}
Diferencia: ${dif > 0 ? '+' : ''}S/ ${dif.toFixed(2)} (${esCuadrado ? 'CUADRADO' : esSobrante ? 'SOBRANTE' : 'FALTANTE'})`;

    const url = `https://wa.me/${numFinal}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      style={{
        WebkitBackdropFilter: 'blur(3px)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200 my-auto"
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${esCuadrado
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
              : esSobrante
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800'
              }`}>
              {esCuadrado ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white font-sora">
                {esCuadrado ? '¡Arqueo Cuadrado Exitosamente!' : 'Turno Cerrado con Diferencia'}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Turno #{cajaData.id} • {new Date(cajaData.fecha_cierre || Date.now()).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge de Estado del Cuadre */}
        <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${esCuadrado
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          : esSobrante
            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}>
          <span>
            {esCuadrado ? 'Auditoría: Efectivo exacto sin descuadre' : esSobrante ? 'Auditoría: Sobrante de dinero en cajón' : 'Auditoría: Faltante de dinero en cajón'}
          </span>
          <span className="font-mono font-black text-sm">
            {dif > 0 ? '+' : ''}S/ {dif.toFixed(2)}
          </span>
        </div>

        {/* 4 Métricas Clave de Cierre */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Fondo Inicial</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              S/ {mInicial.toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Esperado Cajón</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              S/ {sEsperado.toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Efectivo Real</span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
              S/ {sReal.toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Digital</span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
              S/ {vDigital.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Opciones de Impresión Térmica */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                Ticket Térmico de Cierre
              </span>
            </div>
            {/* Selector de tamaño de papel */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTamanoPapel('80mm')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${tamanoPapel === '80mm'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setTamanoPapel('58mm')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${tamanoPapel === '58mm'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                58mm
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setMostrarPreviewModal(true)}
              className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-blue-600 dark:hover:bg-blue-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Receipt className="w-4 h-4" />
              <span>Ver Ticket</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket ({tamanoPapel})</span>
            </button>
            <button
              type="button"
              onClick={handleCopiarResumen}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMostrarInputWhatsapp(!mostrarInputWhatsapp)}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          {mostrarInputWhatsapp && (
            <form onSubmit={handleEnviarWhatsapp} className="flex gap-2 pt-1 animate-in fade-in duration-150">
              <input
                type="tel"
                placeholder="N° WhatsApp (ej. 987654321)"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Enviar
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Listo, Finalizar
          </button>
        </div>
      </div>

      {/* Modal de Vista Previa de Ticket Térmico */}
      <ModalTicketCierre
        isOpen={mostrarPreviewModal}
        onClose={() => setMostrarPreviewModal(false)}
        cajaData={cajaData}
        formatoInicial={tamanoPapel}
      />
    </div>,
    document.body
  );
}
