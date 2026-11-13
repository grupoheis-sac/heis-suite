import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Share2,
  Copy,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Send,
  MessageCircle,
  Smartphone,
  Check,
  Wallet,
  Banknote,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketCierreCaja } from '../utils/impresionTermica';

export default function ModalCierreCajaExito({ isOpen, onClose, cajaData }) {
  const settings = useSettingsStore();

  const [tamanoPapel, setTamanoPapel] = useState('80mm');
  const [mostrarInputWhatsapp, setMostrarInputWhatsapp] = useState(false);
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!isOpen || !cajaData) return;

    const dif = parseFloat(cajaData?.diferencia || 0);
    if (Math.abs(dif) < 0.05) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#6366f1', '#4f46e5', '#10b981', '#3b82f6']
        });
      } catch (e) {}
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

  const mInicial = parseFloat(cajaData.monto_inicial || 0);
  const vEfectivo = parseFloat(cajaData.ventas_efectivo ?? cajaData.total_ventas_efectivo ?? 0);
  const vDigital = parseFloat(cajaData.ventas_digitales ?? 0);
  const tVentas = parseFloat(cajaData.total_ventas ?? cajaData.total_ventas_general ?? (vEfectivo + vDigital));
  const cantVentas = cajaData.cantidad_ventas ?? 0;
  const abonos = parseFloat(cajaData.abonos_efectivo ?? cajaData.total_ingresos_abonos ?? 0);
  const egresos = parseFloat(cajaData.total_egresos ?? 0);
  const sEsperado = parseFloat(cajaData.monto_final_esperado ?? (mInicial + vEfectivo + abonos - egresos));
  const sReal = parseFloat(cajaData.monto_final_real ?? cajaData.monto_final ?? 0);
  const dif = parseFloat(cajaData.diferencia !== undefined ? cajaData.diferencia : (sReal - sEsperado));

  const esCuadrado = Math.abs(dif) < 0.05;
  const esSobrante = dif >= 0.05;
  const esFaltante = dif <= -0.05;

  const handlePrint = () => {
    imprimirTicketCierreCaja(cajaData, { formato: tamanoPapel, settings, autoPrint: true });
    toast.success(`Enviando reporte de cierre a impresora térmica (${tamanoPapel})...`, { icon: '🖨️' });
  };

  const nombreFerreteria = settings.businessName || 'FERRETERÍA & MATERIALES PRO';
  const rucFerreteria = settings.businessRuc || '20609123456';

  const textoResumen = `*🛠️ REPORTE DE CIERRE DE CAJA — ${nombreFerreteria}*
*Turno:* #${cajaData.id}
*Cajero:* ${cajaData?.usuario?.nombre || 'Usuario'}
*Fecha:* ${new Date(cajaData.fecha_cierre || Date.now()).toLocaleDateString('es-PE')}

*Métricas de Turno:*
• Fondo Inicial: S/ ${mInicial.toFixed(2)}
• Ventas Efectivo: S/ ${vEfectivo.toFixed(2)} (${cantVentas} ventas)
• Ventas Digitales: S/ ${vDigital.toFixed(2)}
• Total Ventas: S/ ${tVentas.toFixed(2)}
• Egresos / Gastos: S/ ${egresos.toFixed(2)}

*Auditoría de Cuadre:*
• Saldo Esperado en Cajón: S/ ${sEsperado.toFixed(2)}
• Efectivo Real Contado: S/ ${sReal.toFixed(2)}
• Diferencia: ${dif > 0 ? '+' : ''}S/ ${dif.toFixed(2)} (${esCuadrado ? 'CUADRADO OK' : esSobrante ? 'SOBRANTE' : 'FALTANTE'})`;

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(textoResumen);
    setCopiado(true);
    toast.success('Resumen de cierre copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleEnviarWhatsapp = (e) => {
    e.preventDefault();
    const tel = telefonoWhatsapp.replace(/\D/g, '');
    const url = tel
      ? `https://api.whatsapp.com/send?phone=51${tel}&text=${encodeURIComponent(textoResumen)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(textoResumen)}`;
    window.open(url, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
      {/* Backdrop estático e independiente con blur profesional que cubre el 100% de la ventana */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor centrado */}
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
        onClick={onClose}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 my-auto text-left cursor-default"
        >
        {/* Cabecera Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
              esCuadrado ? 'bg-emerald-500 shadow-emerald-500/25' : 'bg-indigo-600 shadow-indigo-600/25'
            }`}>
              {esCuadrado ? <CheckCircle2 className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Detalle y Arqueo de Turno #{cajaData.id}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {cajaData?.usuario?.nombre ? `Atendido por ${cajaData.usuario.nombre}` : 'Resumen consolidado'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-modal-scroll">
          {/* Banner de Estado de Cuadre */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            esCuadrado
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : esSobrante
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              {esCuadrado ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <div>
                <p className="text-sm font-black">
                  {esCuadrado ? 'Cuadre Perfecto: Sin Diferencias' : esSobrante ? 'Sobrante Registrado en Cajón' : 'Faltante de Efectivo'}
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  Esperado: S/ {sEsperado.toFixed(2)} · Real Contado: S/ {sReal.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-base sm:text-lg font-black font-mono px-3 py-1 rounded-xl ${
                esCuadrado
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-800 shadow-xs'
              }`}>
                {dif > 0 ? '+' : ''}S/ {dif.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Grilla de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Fondo Inicial</span>
              <span className="text-base font-extrabold text-slate-800 dark:text-white mt-1 block">
                S/ {mInicial.toFixed(2)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Ventas Efectivo</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                S/ {vEfectivo.toFixed(2)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Ventas Digital</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
                S/ {vDigital.toFixed(2)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Egresos</span>
              <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                S/ {egresos.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Selector de Ancho Térmico */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Formato de impresión térmica:
            </span>
            <div className="flex items-center gap-1">
              {['80mm', '58mm'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setTamanoPapel(fmt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    tamanoPapel === fmt
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario de WhatsApp opcional */}
          {mostrarInputWhatsapp && (
            <form onSubmit={handleEnviarWhatsapp} className="flex gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <input
                type="text"
                placeholder="Número celular (ej. 987654321)"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer de Acciones */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarTexto}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMostrarInputWhatsapp(!mostrarInputWhatsapp)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket ({tamanoPapel})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
}
