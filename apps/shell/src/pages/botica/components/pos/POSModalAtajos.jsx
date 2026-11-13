/**
 * POSModalAtajos.jsx — Modal de Guía de Atajos de Teclado del POS (F1)
 * Extraído de POS.jsx (P14)
 */
import React from 'react';
import { Keyboard, X } from 'lucide-react';

const ATAJOS = [
  { k: 'F2 / Ctrl+K', d: 'Enfocar buscador o pistolear código de barras', bg: 'bg-emerald-600 text-white font-black' },
  { k: 'F8 / Alt+C', d: 'Abrir modal ergonómico de cobro / Venta rápida', bg: 'bg-emerald-600 text-white font-black' },
  { k: 'Enter', d: 'Emitir comprobante dentro del modal de cobro', bg: 'bg-slate-800 text-white' },
  { k: 'F4 / Alt+N', d: 'Aperturar registro rápido de cliente (DNI / RUC)', bg: 'bg-slate-800 text-white' },
  { k: 'F9 / Alt+L', d: 'Limpiar o vaciar carrito de dispensación actual', bg: 'bg-rose-600 text-white' },
  { k: 'F1 / Alt+H', d: 'Abrir / Cerrar esta guía de atajos', bg: 'bg-slate-800 text-white' },
  { k: 'ESC', d: 'Cerrar cualquier ventana emergente o modal', bg: 'bg-slate-800 text-white' },
];

export default function POSModalAtajos({ visible, onClose }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Atajos de Teclado POS Farmacia</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">Agiliza la atención rápida al paciente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {ATAJOS.map((item) => (
            <div key={item.k} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.d}</span>
              <kbd className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-2xs shrink-0 ml-2 ${item.bg}`}>
                {item.k}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-3.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
          💡 <strong>¿Usas Laptop?</strong> Si las teclas F1-F12 bajan el volumen o brillo, presiona <strong>Fn + F2</strong> o usa el atajo alternativo <strong>Ctrl + K</strong>.
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Cerrar Guía (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
