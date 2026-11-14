/**
 * POSTouchNumpad.jsx — Modal de Edición de Cantidad para Ticket de Dispensación
 * Diseñado acorde al estándar oficial de modales del Sistema Boticas:
 * - Backdrop oscuro con desenfoque suave (bg-slate-950/60 backdrop-blur-xs) montado vía createPortal a document.body
 *   para garantizar aislamiento total y eliminar cualquier parpadeo o intermitencia al mover el cursor.
 * - Tarjeta modal flotante central con esquinas suaves (rounded-[28px]), sombras profundas y borde sutil.
 * - Cabecera con insignia en cápsula Teal (#00B884), título y botón de cierre estándar.
 * - Ficha resumen del medicamento con P.U., Lote, Formato y Subtotal calculado en vivo.
 * - Formulario con visor de cantidad, steppers (-) y (+), chips de selección rápida y teclado táctil 3x4.
 * - Footer oficial con botón Limpiar, Cancelar y botón Confirmar con degradado Teal y atajo de Enter.
 * - Soporte nativo para atajos de teclado físico (0-9, ., Backspace, Enter, Esc, +, -).
 */
import React, { useEffect, useCallback } from 'react';
import {
  X,
  Calculator,
  Plus,
  Minus,
  Delete,
  Check,
  RotateCcw,
  AlertCircle,
  Pill
} from 'lucide-react';

export default function POSTouchNumpad({
  visible = true,
  item = null,
  valor = '',
  onChange,
  onConfirm,
  onClose,
  titulo = 'Editar Cantidad',
  subtitulo = 'Ajuste de unidades para dispensación',
  conDecimales = false,
  botonesRapidos = [1, 2, 5, 10, 20]
}) {
  if (!visible || typeof document === 'undefined') return null;

  const numVal = parseFloat(valor) || 0;
  const stockDisponible = item?.stock !== undefined ? parseFloat(item.stock) : (item?.stock_disponible !== undefined ? parseFloat(item.stock_disponible) : null);
  const excedeStock = stockDisponible !== null && numVal > stockDisponible;
  const cantidadInvalida = isNaN(numVal) || numVal <= 0 || excedeStock;
  const precioUnitario = item?.precio_unitario ? parseFloat(item.precio_unitario) : (item?.precio ? parseFloat(item.precio) : 0);
  const subtotalEnVivo = (numVal * precioUnitario).toFixed(2);

  const esFraccion = conDecimales || item?.formato_venta === 'Fraccion';
  const step = esFraccion ? 0.5 : 1;

  const handleDigit = useCallback((d) => {
    let str = String(valor);
    if (d === '.') {
      if (!conDecimales && !esFraccion) return;
      if (str.includes('.')) return;
      onChange(str ? `${str}.` : '0.');
      return;
    }
    if (d === '00') {
      if (!str || str === '0') return;
      onChange(`${str}00`);
      return;
    }
    if (str === '0') {
      onChange(String(d));
    } else {
      onChange(`${str}${d}`);
    }
  }, [valor, onChange, conDecimales, esFraccion]);

  const handleBackspace = useCallback(() => {
    const str = String(valor);
    if (str.length <= 1) {
      onChange('');
    } else {
      onChange(str.slice(0, -1));
    }
  }, [valor, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleQuickSet = useCallback((n) => {
    onChange(String(n));
  }, [onChange]);

  const handleStepUp = () => {
    const nuevo = Math.round((numVal + step) * 100) / 100;
    if (stockDisponible !== null && nuevo > stockDisponible) {
      onChange(String(stockDisponible));
    } else {
      onChange(String(nuevo));
    }
  };

  const handleStepDown = () => {
    const nuevo = Math.round((numVal - step) * 100) / 100;
    if (nuevo <= 0) {
      onChange(step < 1 ? '0.5' : '1');
    } else {
      onChange(String(nuevo));
    }
  };

  const handleStockMaximo = () => {
    if (stockDisponible !== null && stockDisponible > 0) {
      onChange(String(stockDisponible));
    }
  };

  // Soporte de teclado físico mientras el modal está activo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type !== 'text') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleDigit('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!cantidadInvalida && onConfirm) {
          onConfirm();
        }
      } else if (e.key === '+') {
        e.preventDefault();
        handleStepUp();
      } else if (e.key === '-') {
        e.preventDefault();
        handleStepDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, cantidadInvalida, onConfirm, onClose, numVal, step, stockDisponible]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      className="absolute inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 rounded-[28px] select-none animate-in fade-in duration-150"
    >
      {/* ── TARJETA DEL MODAL FLOTANTE (INTEGRADA DENTRO DE LA TARJETA TICKET) ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto soft-card-shadow animate-in zoom-in-95 duration-150"
      >
        {/* Cabecera Estándar del Sistema */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-2xl bg-[#EBFDF6] dark:bg-[#00B884]/20 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-[#00B884]/30 shadow-2xs shrink-0">
              <Calculator className="w-4 h-4 stroke-[2.2]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white tracking-tight truncate">
                {titulo}
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                {item?.nombre || subtitulo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 touch-manipulation"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-3.5 space-y-3 overflow-y-auto custom-modal-scroll">
          {/* Ficha Resumen del Medicamento */}
          {item && (
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded border shrink-0 ${
                      item.formato_venta === 'Caja'
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                    }`}
                  >
                    {item.formato_venta || 'Caja'}
                  </span>
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                    {item.nombre}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-2">
                  <span>P.U: <strong className="text-slate-700 dark:text-slate-200 font-mono">S/ {precioUnitario.toFixed(2)}</strong></span>
                  {item.numero_lote && (
                    <span>• Lt: <strong className="text-slate-700 dark:text-slate-200 font-mono">{item.numero_lote}</strong></span>
                  )}
                  {stockDisponible !== null && (
                    <span>• Stock: <strong className="text-slate-700 dark:text-slate-200 font-mono">{stockDisponible}</strong></span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-sora">Subtotal</span>
                <span className="text-xs sm:text-sm font-black font-mono text-[#00855E] dark:text-[#10E599]">
                  S/ {subtotalEnVivo}
                </span>
              </div>
            </div>
          )}

          {/* Campo de Cantidad con Steppers */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cantidad a Dispensar ({item?.formato_venta || 'Unidades'}) *
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleStepDown}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black active:scale-90 cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
                title={`Disminuir (-${step})`}
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={valor !== '' ? valor : '0'}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 py-2 text-xl font-mono font-black text-center outline-none transition-all ${
                    excedeStock
                      ? 'border-rose-400 dark:border-rose-600 text-rose-600 dark:text-rose-400'
                      : 'border-[#A6F6D8] dark:border-[#00B884]/40 text-[#00855E] dark:text-[#10E599]'
                  }`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase pointer-events-none">
                  {item?.formato_venta || 'UND'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleStepUp}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black active:scale-90 cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
                title={`Aumentar (+${step})`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {excedeStock && (
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Supera el stock disponible ({stockDisponible} {item?.formato_venta || 'UND'})</span>
              </p>
            )}
          </div>

          {/* Presets Rápidos en Fila */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {botonesRapidos.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleQuickSet(n)}
                disabled={stockDisponible !== null && n > stockDisponible}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                  parseFloat(valor) === n
                    ? 'bg-[#00B884] text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-[#EBFDF6] dark:hover:bg-[#00B884]/20 text-slate-600 dark:text-slate-300 hover:text-[#00855E] dark:hover:text-[#5EEBB8]'
                }`}
              >
                +{n}
              </button>
            ))}
            {stockDisponible !== null && stockDisponible > 0 && (
              <button
                type="button"
                onClick={handleStockMaximo}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-200/60 dark:border-amber-800/60 cursor-pointer"
              >
                Todo ({stockDisponible})
              </button>
            )}
          </div>

          {/* Teclado Numérico Táctil 3x4 */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-10 rounded-2xl bg-white dark:bg-slate-800 hover:bg-[#EBFDF6] dark:hover:bg-[#00B884]/20 hover:border-[#A6F6D8] dark:hover:border-[#00B884]/40 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-mono font-black text-base transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
              >
                {num}
              </button>
            ))}

            {conDecimales || esFraccion ? (
              <button
                type="button"
                onClick={() => handleDigit('.')}
                className="h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-mono font-black text-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
              >
                .
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleDigit('00')}
                className="h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-mono font-black text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
              >
                00
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDigit(0)}
              className="h-10 rounded-2xl bg-white dark:bg-slate-800 hover:bg-[#EBFDF6] dark:hover:bg-[#00B884]/20 hover:border-[#A6F6D8] dark:hover:border-[#00B884]/40 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-mono font-black text-base transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
              title="Borrar dígito (Backspace)"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Estándar del Sistema */}
        <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={cantidadInvalida}
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00B884] to-[#009E70] hover:from-[#009E70] hover:to-[#00855E] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#00B884]/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirmar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
