/**
 * POSModalAtajos.jsx — Modal de Guía de Atajos de Teclado del POS Ferretería (F1)
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { Keyboard, X } from 'lucide-react';

const ATAJOS = [
 { k: 'F8 / Alt+C', d: 'Pasar al cobro / Confirmar y emitir comprobante', bg: 'bg-indigo-600 text-white font-black' },
 { k: 'F2 / Ctrl+K', d: 'Enfocar buscador de artículos / Escáner de barras', bg: 'bg-slate-800 text-white font-bold' },
 { k: 'F4 / Alt+N', d: 'Registrar nuevo cliente rápido (RENIEC / SUNAT)', bg: 'bg-indigo-600 text-white font-black' },
 { k: 'F6', d: 'Cargar proforma o cotización al ticket', bg: 'bg-slate-800 text-white font-bold' },
 { k: 'F9', d: 'Vaciar todos los artículos del ticket actual', bg: 'bg-rose-600 text-white font-bold' },
 { k: 'F1', d: 'Abrir / Cerrar esta guía de atajos de mostrador', bg: 'bg-slate-800 text-white font-bold' },
 { k: 'ESC', d: 'Volver al carrito / Cerrar modal / Nueva venta', bg: 'bg-slate-800 text-white font-bold' }
];

export default function POSModalAtajos({ visible, onClose }) {
 if (!visible) return null;

 return createPortal(
 <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
 <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150 soft-card-shadow">
 <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-indigo-400 flex items-center justify-center shadow-xs">
 <Keyboard className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Atajos de Teclado Mostrador</h3>
 <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">Agiliza la atención rápida al cliente</p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0 touch-manipulation"
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
 💡 <strong>¿Usas Laptop?</strong> Si las teclas F1-F12 controlan el volumen o brillo, presiona la tecla <strong>Fn + F8</strong> o <strong>Alt + C</strong> para cobrar rápidamente.
 </div>

 <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
 <button
 type="button"
 onClick={onClose}
 className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 transition-all shadow-xs cursor-pointer active:scale-95"
 >
 Entendido (ESC)
 </button>
 </div>
 </div>
 </div>,
 document.body
 );
}
