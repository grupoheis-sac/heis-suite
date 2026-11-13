/**
 * notificaciones.jsx — Sistema Visual de Snackbars & Notificaciones Neo-SaaS para Hotel
 * Diseñado con tarjetas flotantes ergonómicas, contraste nítido y micro-interacciones.
 */
import React from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2, FileText, X, Printer, ShoppingBag
} from 'lucide-react';

/**
 * Notificación ergonómica al agregar un consumo o servicio al carrito del POS
 */
export function notificarConsumoAgregado({
  nombre,
  categoria = 'minibar',
  cantidad = 1,
  precio = null
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return toast.custom(
    (t) => (
      <div
        onClick={() => toast.dismiss(t.id)}
        className={`toast-pill-card transition-all duration-150 transform ${
          t.visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'
        } flex items-center gap-3 bg-slate-900/95 dark:bg-[#0B192C] text-white px-3.5 py-2.5 rounded-2xl shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6)] border border-blue-500/50 ring-1 ring-blue-400/20 pointer-events-auto select-none cursor-pointer border-l-4 border-l-blue-600 shrink-0 font-sora`}
        style={{
          width: isMobile ? 'calc(100vw - 32px)' : '350px',
          minWidth: isMobile ? '280px' : '320px',
          maxWidth: '380px',
          flexShrink: 0
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 font-bold">
          <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="flex-1 min-w-[180px] pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded-md border border-blue-500/40 font-sora shrink-0">
              +{cantidad} {categoria.toUpperCase()}
            </span>
            {precio !== null && (
              <span className="text-[10px] font-mono font-bold text-blue-200 shrink-0">
                S/ {parseFloat(precio).toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-white truncate mt-0.5">
            {nombre}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="text-blue-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    {
      id: 'toast-add-consumo',
      duration: 1600
    }
  );
}

/**
 * Notificación de emisión de Comprobante / Check-Out con botones de acción
 */
export function notificarComprobanteEmitido({
  numero = 'B001-000001',
  tipo = 'Boleta',
  cliente = 'Huésped General',
  habitacion = '',
  monto = 0.0,
  onVerComprobante = null,
  onImprimir = null
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return toast.custom(
    (t) => (
      <div
        className={`toast-comprobante-card transition-all duration-200 transform ${
          t.visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
        } bg-slate-900 dark:bg-[#0B192C] text-white p-3.5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] border border-blue-500/60 ring-2 ring-blue-500/20 pointer-events-auto border-l-4 border-l-blue-600 shrink-0 font-sora`}
        style={{
          width: isMobile ? 'calc(100vw - 32px)' : '390px',
          minWidth: isMobile ? '280px' : '360px',
          maxWidth: '430px',
          flexShrink: 0
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-950 px-2 py-0.5 rounded-md border border-blue-500/40">
                  {tipo} {numero}
                </span>
                {habitacion && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-600/40">
                    Hab. {habitacion}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-300 truncate mt-1">
                {cliente}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
            <span className="text-sm font-black text-blue-400 font-mono">
              S/ {parseFloat(monto).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Acciones del Snackbar */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-800 dark:border-emerald-950/80">
          {onImprimir && (
            <button
              type="button"
              onClick={() => {
                onImprimir();
                toast.dismiss(t.id);
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Printer className="w-3 h-3 text-blue-400" />
              <span>Imprimir</span>
            </button>
          )}

          {onVerComprobante && (
            <button
              type="button"
              onClick={() => {
                onVerComprobante();
                toast.dismiss(t.id);
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>Ver Comprobante</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ),
    {
      id: `toast-cpe-${numero}`,
      duration: 4500
    }
  );
}

/**
 * Notificación genérica con badge y estilo Neo-SaaS
 */
export function notificarExito(mensaje, subtitulo = '') {
  return toast.success(
    subtitulo ? `${mensaje}\n${subtitulo}` : mensaje,
    {
      duration: 2500,
      style: {
        background: '#09261E',
        color: '#F0FDF8',
        border: '1px solid rgba(0, 184, 132, 0.4)',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '700',
        fontFamily: 'Sora, sans-serif',
        boxShadow: '0 16px 36px -8px rgba(0, 32, 22, 0.7)'
      }
    }
  );
}

export function notificarError(mensaje) {
  return toast.error(mensaje, {
    duration: 3500,
    style: {
      background: '#2A080C',
      color: '#FFE4E6',
      border: '1px solid rgba(244, 63, 94, 0.4)',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '700',
      fontFamily: 'Sora, sans-serif',
      boxShadow: '0 16px 36px -8px rgba(32, 0, 5, 0.7)'
    }
  });
}
