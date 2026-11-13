import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  X,
  CheckCircle2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function ModalCerrarCaja({
  isOpen,
  onClose,
  turno,
  resumen,
  onSuccess
}) {
  const [montoCierre, setMontoCierre] = useState('');
  const [notaCierre, setNotaCierre] = useState('');
  const [enviando, setEnviando] = useState(false);

  const saldoEsperado = parseFloat(resumen?.efectivo_esperado ?? resumen?.saldo_esperado_efectivo ?? 0);
  const montoInicial = parseFloat(resumen?.monto_apertura ?? turno?.monto_apertura ?? 0);
  const pagosEfectivo = parseFloat(resumen?.pagos_efectivo ?? resumen?.ventas_efectivo ?? 0);
  const totalDigital = parseFloat(resumen?.total_digital ?? resumen?.ventas_digitales ?? 0);
  const ingresosExtra = parseFloat(resumen?.ingresos_manuales_efectivo ?? resumen?.ingresos_extra ?? 0);
  const egresos = parseFloat(resumen?.egresos_efectivo ?? resumen?.total_egresos ?? 0);

  useEffect(() => {
    if (isOpen) {
      setMontoCierre('');
      setNotaCierre('');
      setEnviando(false);
    }
  }, [isOpen]);

  if (!isOpen || !turno) return null;

  const montoContadoNum = parseFloat(montoCierre);
  const tieneMontoValido = !isNaN(montoContadoNum) && montoContadoNum >= 0 && montoCierre.trim() !== '';
  const diferencia = tieneMontoValido ? parseFloat((montoContadoNum - saldoEsperado).toFixed(2)) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tieneMontoValido) {
      toast.error('Ingrese el monto físico contado en el cajón de recepción.');
      return;
    }

    setEnviando(true);
    try {
      const res = await api.post('/caja/cerrar-turno', {
        turno_id: turno.id,
        monto_cierre_real: montoContadoNum,
        observaciones_cierre: notaCierre.trim()
      });

      const data = res?.data || res;
      if (data?.success) {
        const info = data?.turno || {};
        // Incorporar resumen si existe
        info.resumen_metodos = data?.resumen || info.resumen_metodos;
        toast.success('¡Turno de recepción cerrado y arqueado exitosamente!');
        window.dispatchEvent(
          new CustomEvent('caja-status-changed', { detail: { open: false } })
        );
        onClose();
        if (onSuccess) {
          onSuccess(info);
        }
      } else {
        toast.error(data?.message || 'Error al cerrar el turno de caja.');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err?.message ||
        'Error al procesar el cierre de caja'
      );
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      style={{
        WebkitBackdropFilter: 'blur(3px)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight font-sora">
                Cerrar Turno y Arqueo
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Turno #{turno.id} • Cuadre de efectivo de recepción
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen Financiero del Turno */}
        <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Efectivo esperado en cajón:
            </span>
            <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
              S/ {saldoEsperado.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[9.5px] uppercase font-bold">
                Monto Inicial
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                S/ {montoInicial.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[9.5px] uppercase font-bold">
                Cobros Efectivo
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                S/ {pagosEfectivo.toFixed(2)}
              </span>
            </div>
            {totalDigital > 0 && (
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[9.5px] uppercase font-bold">
                  Cobros Digitales
                </span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                  S/ {totalDigital.toFixed(2)}
                </span>
              </div>
            )}
            {(ingresosExtra > 0 || egresos > 0) && (
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[9.5px] uppercase font-bold">
                  Movimientos Extra
                </span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  +S/ {ingresosExtra.toFixed(2)} / -S/ {egresos.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Botón rápido para rellenar con cuadre exacto */}
          <button
            type="button"
            onClick={() => setMontoCierre(saldoEsperado.toFixed(2))}
            className="w-full mt-1 py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Usar Cuadre Exacto (S/ {saldoEsperado.toFixed(2)})</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Efectivo Real Contado en Cajón (S/) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 dark:text-slate-500">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                autoFocus
                value={montoCierre}
                onChange={(e) => setMontoCierre(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl text-base font-black font-mono text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-rose-500/10 transition-all shadow-inner"
              />
            </div>

            {/* Cálculo de diferencia en vivo */}
            {diferencia !== null && (
              <div
                className={`mt-2 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-in fade-in duration-100 ${diferencia === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : diferencia > 0
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  {diferencia === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : diferencia > 0 ? (
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>
                    {diferencia === 0
                      ? 'Cuadre Perfecto'
                      : diferencia > 0
                        ? 'Sobrante en Caja'
                        : 'Faltante en Caja'}
                  </span>
                </div>
                <span className="font-mono font-black">
                  {diferencia === 0
                    ? 'S/ 0.00'
                    : `${diferencia > 0 ? '+' : ''}S/ ${diferencia.toFixed(2)}`}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Observaciones o Notas de Cierre (Opcional)
            </label>
            <textarea
              rows="2"
              value={notaCierre}
              onChange={(e) => setNotaCierre(e.target.value)}
              placeholder="Detalle si hubo sencillo retenido, billetes de alta denominación, etc..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !tieneMontoValido}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{enviando ? 'Cerrando...' : 'Confirmar Cierre'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
