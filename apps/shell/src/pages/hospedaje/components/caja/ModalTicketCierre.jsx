import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Share2,
  Copy,
  Check,
  Building2,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketCierreCaja } from '../../utils/impresionTermica';

export default function ModalTicketCierre({
  isOpen,
  onClose,
  cajaData,
  formatoInicial = '80mm'
}) {
  const settings = useSettingsStore();
  const [tamanoPapel, setTamanoPapel] = useState(formatoInicial);
  const [copiado, setCopiado] = useState(false);
  const [mostrarInputWhatsapp, setMostrarInputWhatsapp] = useState(false);
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');

  useEffect(() => {
    if (formatoInicial) setTamanoPapel(formatoInicial);
  }, [formatoInicial, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !cajaData || typeof document === 'undefined') return null;

  // Extraer datos financieros unificados
  let resumenObj = {};
  if (typeof cajaData?.resumen_metodos === 'string') {
    try {
      resumenObj = JSON.parse(cajaData.resumen_metodos);
    } catch (_) {}
  } else if (typeof cajaData?.resumen_metodos === 'object') {
    resumenObj = cajaData.resumen_metodos || {};
  }

  const isCorteX = !!cajaData?.isCorteX;
  const mInicial = parseFloat(cajaData.monto_apertura ?? cajaData.monto_inicial ?? resumenObj.monto_apertura ?? 0);
  const vEfectivo = parseFloat(resumenObj.pagos_efectivo ?? cajaData.ventas_efectivo ?? 0);
  const vDigital = parseFloat(resumenObj.total_digital ?? cajaData.ventas_digitales ?? 0);
  const ingExtra = parseFloat(resumenObj.ingresos_manuales_efectivo ?? cajaData.ingresos_extra ?? 0);
  const egresos = parseFloat(resumenObj.egresos_efectivo ?? cajaData.total_egresos ?? 0);
  const totalIngresos = vEfectivo + vDigital + ingExtra;

  const sEsperado = parseFloat(
    cajaData.monto_cierre_esperado ??
    cajaData.monto_final_esperado ??
    resumenObj.efectivo_esperado ??
    (mInicial + vEfectivo + ingExtra - egresos)
  );
  const sReal = parseFloat(
    cajaData.monto_cierre_real ??
    cajaData.monto_final_real ??
    cajaData.monto_final ??
    (isCorteX ? sEsperado : 0)
  );
  const dif = parseFloat(
    cajaData.diferencia !== undefined
      ? cajaData.diferencia
      : (sReal - sEsperado)
  );

  const esCuadrado = Math.abs(dif) < 0.01;
  const esSobrante = dif > 0.01;
  const esFaltante = dif < -0.01;

  const fechaAperturaFmt = cajaData?.fecha_apertura
    ? new Date(cajaData.fecha_apertura).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  const fechaCierreFmt = cajaData?.fecha_cierre
    ? new Date(cajaData.fecha_cierre).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const nombreHotel = settings?.businessName || 'GRAND HOTEL & SUITES S.A.C.';
  const rucHotel = settings?.businessRuc || '20608945123';
  const direccionHotel = settings?.businessAddress || 'Av. El Sol 450 - Lima, Perú';
  const telefonoHotel = settings?.businessPhone || '(01) 678-9012';

  const handlePrint = () => {
    imprimirTicketCierreCaja(cajaData, { formato: tamanoPapel, settings, autoPrint: true });
    toast.success(`Enviando a impresora térmica (${tamanoPapel})...`, {
      icon: '🖨️',
      duration: 3500
    });
  };

  const handleCopiarResumen = () => {
    const texto = `🏨 *${isCorteX ? 'CORTE X (ARQUEO PARCIAL)' : 'REPORTE DE CIERRE DE CAJA (Z)'} — ${nombreHotel}*
Turno N°: #${cajaData.id || 'Actual'}
Responsable: ${cajaData.usuario?.nombre || cajaData.usuario?.name || 'Recepción'}
Apertura: ${fechaAperturaFmt}
${isCorteX ? 'Corte al' : 'Cierre'}: ${fechaCierreFmt}
--------------------------------
(+) Fondo Inicial: S/ ${mInicial.toFixed(2)}
(+) Cobros Efectivo: S/ ${vEfectivo.toFixed(2)}
(+) Cobros Digitales: S/ ${vDigital.toFixed(2)}
${ingExtra > 0 ? `(+) Ingresos Extra: S/ ${ingExtra.toFixed(2)}\n` : ''}${egresos > 0 ? `(-) Salidas/Gastos: S/ ${egresos.toFixed(2)}\n` : ''}--------------------------------
Saldo Esperado en Cajón: S/ ${sEsperado.toFixed(2)}
Efectivo Real Contado: S/ ${sReal.toFixed(2)}
Diferencia: ${dif > 0 ? '+' : ''}S/ ${dif.toFixed(2)} (${esCuadrado ? 'CUADRADO' : esSobrante ? 'SOBRANTE' : 'FALTANTE'})
${cajaData.observaciones_cierre || cajaData.observaciones ? `Notas: ${cajaData.observaciones_cierre || cajaData.observaciones}` : ''}`;

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
    const texto = `🏨 *${isCorteX ? 'CORTE X (ARQUEO PARCIAL)' : 'REPORTE DE CIERRE DE CAJA'} — ${nombreHotel}*
Turno N°: #${cajaData.id || 'Actual'}
Responsable: ${cajaData.usuario?.nombre || cajaData.usuario?.name || 'Recepción'}
Fecha: ${fechaCierreFmt}
--------------------------------
(+) Fondo Inicial: S/ ${mInicial.toFixed(2)}
(+) Efectivo: S/ ${vEfectivo.toFixed(2)}
(+) Digital: S/ ${vDigital.toFixed(2)}
${egresos > 0 ? `(-) Salidas: S/ ${egresos.toFixed(2)}\n` : ''}--------------------------------
Esperado en Cajón: S/ ${sEsperado.toFixed(2)}
Real Contado: S/ ${sReal.toFixed(2)}
Diferencia: ${dif > 0 ? '+' : ''}S/ ${dif.toFixed(2)} (${esCuadrado ? 'CUADRADO' : esSobrante ? 'SOBRANTE' : 'FALTANTE'})`;

    const url = `https://wa.me/${numFinal}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const es58 = tamanoPapel === '58mm';

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-[4px] animate-in fade-in select-none overflow-y-auto"
      style={{
        WebkitBackdropFilter: 'blur(4px)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Barra Superior de Control del Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white font-sora leading-tight">
                {isCorteX ? 'Vista Previa: Corte X Parcial' : 'Vista Previa: Ticket de Cierre Z'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Turno #{cajaData.id || 'Actual'} • Formato térmico directo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Tamaño de Papel */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                type="button"
                onClick={() => setTamanoPapel('80mm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tamanoPapel === '80mm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setTamanoPapel('58mm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tamanoPapel === '58mm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                58mm
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor del Ticket Térmico Simulado */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-modal-scroll bg-slate-100 dark:bg-slate-950/70 flex justify-center items-start">
          <div
            className={`w-full bg-white text-black p-4 sm:p-5 shadow-lg border border-slate-300/80 rounded-sm font-mono transition-all duration-200 select-text ${
              es58
                ? 'max-w-[260px] text-[10px] leading-snug'
                : 'max-w-[340px] text-[11px] leading-normal'
            }`}
            style={{
              boxShadow: '0 4px 15px -1px rgba(0,0,0,0.1), 0 2px 6px -2px rgba(0,0,0,0.05)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))'
            }}
          >
            {/* Cabecera del Establecimiento */}
            <div className="text-center pb-2.5 border-b border-dashed border-slate-800/80 space-y-0.5">
              <div className="w-7 h-7 rounded-lg bg-black text-white mx-auto flex items-center justify-center mb-1">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className={`font-black uppercase tracking-tight ${es58 ? 'text-[11px]' : 'text-xs'}`}>
                {nombreHotel}
              </h3>
              <p className="font-bold">R.U.C. N° {rucHotel}</p>
              <p className={es58 ? 'text-[8.5px]' : 'text-[9.5px]'}>{direccionHotel}</p>
              <p className={es58 ? 'text-[8.5px]' : 'text-[9.5px]'}>Telf: {telefonoHotel}</p>
              <p className="font-bold uppercase text-[9px] mt-1 pt-1 border-t border-dotted border-slate-400">
                RECEPCIÓN & CAJA PRINCIPAL
              </p>
            </div>

            {/* Identificación del Turno */}
            <div className="py-2 border-b border-dashed border-slate-800/80 space-y-1">
              <div className="text-center font-black uppercase text-[10px] tracking-wide">
                {isCorteX ? '*** CORTE X - ARQUEO EN VIVO ***' : '*** CORTE Y ARQUEO DE TURNO (Z) ***'}
              </div>
              <div className="text-center font-black">
                TURNO N°: #{cajaData?.id || '001'}
              </div>
              <div className="flex justify-between">
                <span>APERTURA:</span>
                <span className="font-bold">{fechaAperturaFmt}</span>
              </div>
              <div className="flex justify-between">
                <span>{isCorteX ? 'CORTE:' : 'CIERRE:'}</span>
                <span className="font-bold">{fechaCierreFmt}</span>
              </div>
              <div className="flex justify-between">
                <span>RESPONSABLE:</span>
                <span className="font-bold truncate max-w-[150px]">
                  {cajaData?.usuario?.nombre || cajaData?.usuario?.name || 'Recepción'}
                </span>
              </div>
            </div>

            {/* Cuadre Operativo y Métodos */}
            <div className="py-2 border-b border-dashed border-slate-800/80 space-y-1">
              <div className="font-black text-center uppercase tracking-wider text-[10px] mb-1">
                -- CUADRE OPERATIVO --
              </div>
              <div className="flex justify-between">
                <span>(+) FONDO INICIAL:</span>
                <span className="font-bold">S/ {mInicial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) COBROS EFECTIVO:</span>
                <span className="font-bold">S/ {vEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) COBROS DIGITALES:</span>
                <span className="font-bold">S/ {vDigital.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 pl-2">
                <span>└ (Yape/Plin/POS/Transf)</span>
                <span>(en bancos)</span>
              </div>
              {ingExtra > 0 && (
                <div className="flex justify-between">
                  <span>(+) INGRESOS MANUALES:</span>
                  <span className="font-bold">S/ {ingExtra.toFixed(2)}</span>
                </div>
              )}
              {egresos > 0 && (
                <div className="flex justify-between">
                  <span>(-) GASTOS / SALIDAS:</span>
                  <span className="font-bold">S/ {egresos.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1.5 border-t border-dotted border-slate-400">
                <span>TOTAL INGRESOS TURNO:</span>
                <span>S/ {totalIngresos.toFixed(2)}</span>
              </div>
            </div>

            {/* Balance Físico y Auditoría de Gaveta */}
            <div className="py-2.5 border-b border-dashed border-slate-800/80 space-y-1.5">
              <div className="flex justify-between">
                <span>SALDO ESPERADO CAJÓN:</span>
                <span className="font-bold">S/ {sEsperado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-[12px]">
                <span>EFECTIVO REAL CONTADO:</span>
                <span>S/ {sReal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black pt-1 border-t border-dashed border-slate-800/80">
                <span>DIFERENCIA:</span>
                <span>{dif > 0 ? '+' : ''}S/ {dif.toFixed(2)}</span>
              </div>

              {/* Sello de Auditoría */}
              <div
                className={`text-center font-black py-1 px-2 border mt-1 tracking-wide ${
                  esCuadrado
                    ? 'border-black bg-slate-50'
                    : esSobrante
                    ? 'border-black bg-slate-100'
                    : 'border-black bg-slate-100'
                }`}
              >
                {esCuadrado
                  ? '✓ ARQUEO CUADRADO EXACTO'
                  : esSobrante
                  ? `⚠️ SOBRANTE: +S/ ${dif.toFixed(2)}`
                  : `❌ FALTANTE: -S/ ${Math.abs(dif).toFixed(2)}`}
              </div>
            </div>

            {/* Notas / Observaciones */}
            {(cajaData?.observaciones_cierre || cajaData?.observaciones) && (
              <div className="py-2 border-b border-dashed border-slate-800/80 text-[9.5px]">
                <span className="font-bold">OBSERVACIONES:</span>
                <p className="mt-0.5 whitespace-pre-wrap">{cajaData.observaciones_cierre || cajaData.observaciones}</p>
              </div>
            )}

            {/* Firmas de Control */}
            <div className="pt-4 pb-2 text-[9px]">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="border-t border-black mb-1"></div>
                  <span className="block font-medium">ENTREGUÉ CONFORME</span>
                  <span className="font-bold uppercase truncate block">
                    {cajaData?.usuario?.nombre || cajaData?.usuario?.name || 'RECEPCIÓN'}
                  </span>
                </div>
                <div>
                  <div className="border-t border-black mb-1"></div>
                  <span className="block font-medium">RECIBÍ CONFORME</span>
                  <span className="font-bold uppercase block">ADMINISTRACIÓN</span>
                </div>
              </div>
            </div>

            {/* Pie de Reporte */}
            <div className="text-center pt-2 text-[8px] text-slate-600 space-y-0.5 border-t border-dotted border-slate-300">
              <div>Emisión: {new Date().toLocaleString('es-PE')}</div>
              <div>Control Interno de Gestión Hotelera</div>
              <div className="font-bold text-black mt-1">*** FIN DE REPORTE ***</div>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Acciones */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer font-sora"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket ({tamanoPapel})</span>
            </button>

            <button
              type="button"
              onClick={handleCopiarResumen}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Copiar texto del arqueo"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarInputWhatsapp(!mostrarInputWhatsapp)}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Compartir por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {mostrarInputWhatsapp && (
            <form onSubmit={handleEnviarWhatsapp} className="flex gap-2 pt-1 animate-in fade-in duration-150">
              <input
                type="tel"
                placeholder="N° WhatsApp administrador (ej. 987654321)"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Enviar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

