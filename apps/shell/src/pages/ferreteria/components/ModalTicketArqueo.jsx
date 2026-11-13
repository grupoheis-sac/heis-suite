import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Copy,
  Check,
  MessageCircle,
  Send,
  Smartphone,
  Receipt,
  Clock,
  HardHat,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  ShieldCheck,
  DollarSign,
  Wallet,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketCierreCaja } from '../utils/impresionTermica';

export default function ModalTicketArqueo({ isOpen, onClose, cajaData, usuario }) {
  const settings = useSettingsStore();
  const ticketRef = useRef(null);

  const [tamanoPapel, setTamanoPapel] = useState('80mm');
  const [mostrarInputWhatsapp, setMostrarInputWhatsapp] = useState(false);
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !cajaData) return null;

  const caja = cajaData.caja || cajaData;
  const resumen = cajaData.resumen || caja;
  const es58mm = tamanoPapel === '58mm';
  const esCerrada = caja?.estado === 'Cerrada' || !!caja?.fecha_cierre;

  const nombreFerreteria = settings?.businessName || 'FERRETERÍA & MATERIALES HEIS';
  const rucFerreteria = settings?.businessRuc || '20609123456';
  const direccionFerreteria = settings?.address || 'Av. Industrial 840, Ate Vitarte, Lima - Perú';
  const telefonoFerreteria = settings?.phone || '(01) 489-3210 / 998-765-432';

  const mInicial = parseFloat(resumen?.monto_inicial ?? caja?.monto_inicial ?? 0);
  const vEfectivo = parseFloat(resumen?.ventas_efectivo ?? caja?.total_ventas_efectivo ?? 0);
  const vDigital = parseFloat(resumen?.ventas_digitales ?? 0);
  const tVentas = parseFloat(resumen?.total_ventas_general ?? resumen?.total_ventas ?? (vEfectivo + vDigital));
  const abonos = parseFloat(resumen?.abonos_efectivo ?? resumen?.total_ingresos_abonos ?? 0);
  const ingExtra = parseFloat(resumen?.ingresos_extra ?? 0);
  const egresos = parseFloat(resumen?.total_egresos ?? resumen?.egresos ?? 0);
  const sEsperado = parseFloat(resumen?.monto_final_esperado ?? resumen?.saldo_esperado_efectivo ?? (mInicial + vEfectivo + abonos + ingExtra - egresos));
  const sReal = parseFloat(resumen?.monto_final_real ?? resumen?.monto_final ?? caja?.monto_final ?? 0);
  const dif = parseFloat(resumen?.diferencia !== undefined ? resumen.diferencia : (sReal - sEsperado));

  const esCuadrado = Math.abs(dif) < 0.05;
  const esSobrante = dif >= 0.05;
  const esFaltante = dif <= -0.05;

  const movimientos = Array.isArray(caja?.movimientos) ? caja.movimientos : [];
  const retirosBoveda = movimientos
    .filter((m) => m.tipo === 'Egreso' && m.concepto?.toUpperCase().includes('BÓVEDA'))
    .reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);

  const fechaAperturaFmt = caja?.fecha_apertura
    ? new Date(caja.fecha_apertura).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  const fechaCierreFmt = caja?.fecha_cierre
    ? new Date(caja.fecha_cierre).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  const fechaCorteActualFmt = new Date().toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const nombreOperador = caja?.usuario?.nombre || usuario?.nombre || 'Cajero de Turno';

  // Texto para copiar o enviar por WhatsApp
  const textoArqueo = esCerrada
    ? `*🛠️ TICKET DE CORTE Y ARQUEO — ${nombreFerreteria}*
*Turno N°:* #${caja?.id} (Turno Cerrado)
*Fecha Apertura:* ${fechaAperturaFmt}
*Fecha Cierre:* ${fechaCierreFmt || '-'}
*Cajero:* ${nombreOperador}

*💰 BALANCE DE EFECTIVO:*
• Fondo Inicial Apertura: S/ ${mInicial.toFixed(2)}
• (+) Ventas en Efectivo: S/ ${vEfectivo.toFixed(2)}
• (+) Abonos de Clientes: S/ ${abonos.toFixed(2)}
• (+) Ingresos Extraordinarios: S/ ${ingExtra.toFixed(2)}
• (-) Gastos y Egresos Operativos: S/ ${egresos.toFixed(2)}
${retirosBoveda > 0 ? `• (-) Retiros a Bóveda / Remesas: S/ ${retirosBoveda.toFixed(2)}\n` : ''}
*💵 EFECTIVO ESPERADO EN GAVETA:* S/ ${sEsperado.toFixed(2)}
*💵 EFECTIVO REAL CONTADO:* S/ ${sReal.toFixed(2)}
*⚖️ ESTADO CUADRE:* ${esCuadrado ? 'CUADRADO PERFECTO (OK)' : esSobrante ? `SOBRANTE (+S/ ${dif.toFixed(2)})` : `FALTANTE (-S/ ${Math.abs(dif).toFixed(2)})`}

*💳 VENTAS DIGITALES (NO EN GAVETA):*
• Yape / Plin / Tarjetas: S/ ${vDigital.toFixed(2)}
• Total Ventas del Turno: S/ ${tVentas.toFixed(2)}

*Auditado desde Sistema Ferretero Heis*`
    : `*🛠️ TICKET DE ARQUEO EN VIVO — ${nombreFerreteria}*
*Turno N°:* #${caja?.id} (Caja Abierta)
*Fecha Apertura:* ${fechaAperturaFmt}
*Hora de Corte en Vivo:* ${fechaCorteActualFmt}
*Cajero:* ${nombreOperador}

*💰 BALANCE DE EFECTIVO:*
• Fondo Inicial Apertura: S/ ${mInicial.toFixed(2)}
• (+) Ventas en Efectivo: S/ ${vEfectivo.toFixed(2)}
• (+) Abonos de Clientes: S/ ${abonos.toFixed(2)}
• (+) Ingresos Extraordinarios: S/ ${ingExtra.toFixed(2)}
• (-) Gastos y Egresos Operativos: S/ ${egresos.toFixed(2)}
${retirosBoveda > 0 ? `• (-) Retiros a Bóveda / Remesas: S/ ${retirosBoveda.toFixed(2)}\n` : ''}
*💵 EFECTIVO ESPERADO EN GAVETA:*
👉 *S/ ${sEsperado.toFixed(2)}*

*💳 VENTAS DIGITALES (NO EN GAVETA):*
• Yape / Plin / Tarjetas: S/ ${vDigital.toFixed(2)}
• Total Ventas del Turno: S/ ${tVentas.toFixed(2)}

*Auditado en Vivo desde Sistema Ferretero Heis*`;

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(textoArqueo);
    setCopiado(true);
    toast.success('Ticket de arqueo copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2200);
  };

  const handleEnviarWhatsapp = (e) => {
    e.preventDefault();
    const tel = telefonoWhatsapp.replace(/\D/g, '');
    const url = tel
      ? `https://api.whatsapp.com/send?phone=51${tel}&text=${encodeURIComponent(textoArqueo)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(textoArqueo)}`;
    window.open(url, '_blank');
  };

  const handleImprimir = () => {
    imprimirTicketCierreCaja(
      {
        ...caja,
        ...(resumen || {}),
        movimientos
      },
      { formato: tamanoPapel, settings, autoPrint: true }
    );
    toast.success(`Enviando ticket de arqueo (${tamanoPapel}) a impresora térmica...`, { icon: '🖨️' });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
      {/* Backdrop con blur */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor Centrado */}
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 my-auto text-left cursor-default"
        >
          {/* Cabecera del Modal */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {esCerrada ? 'Ticket de Corte y Arqueo' : 'Ticket de Arqueo de Caja'}
                  </h3>
                  {esCerrada ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Lock className="w-2.5 h-2.5 text-slate-500" />
                      Turno Cerrado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Turno en Vivo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  Turno #{caja?.id} • {esCerrada ? (caja?.fecha_cierre ? 'Cerrado' : 'Historial') : 'Abierto'} por {nombreOperador}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de Formato Térmico y Accesos Rápidos */}
          <div className="px-5 sm:px-6 py-2.5 bg-slate-100/80 dark:bg-slate-950/50 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-sora">
                Formato papel:
              </span>
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {['80mm', '58mm'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTamanoPapel(fmt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tamanoPapel === fmt
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopiarTexto}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Copiar resumen del arqueo al portapapeles"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMostrarInputWhatsapp(!mostrarInputWhatsapp)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Compartir arqueo por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Formulario WhatsApp Desplegable */}
          {mostrarInputWhatsapp && (
            <form
              onSubmit={handleEnviarWhatsapp}
              className="px-5 sm:px-6 py-2.5 bg-emerald-50/90 dark:bg-emerald-950/50 border-b border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0"
            >
              <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 shrink-0">Celular:</span>
              <input
                type="tel"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                placeholder="Ej. 987654321"
                autoFocus
                className="flex-1 max-w-[220px] bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Enviar</span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarInputWhatsapp(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-1.5 py-1 cursor-pointer"
              >
                Cancelar
              </button>
            </form>
          )}

          {/* Área de Visualización del Ticket Térmico Real */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/90 dark:bg-slate-950/70 flex justify-center items-start custom-modal-scroll">
            <div
              ref={ticketRef}
              className={`w-full h-fit shrink-0 bg-white text-slate-900 shadow-xl border border-slate-200/90 leading-tight font-mono select-none transition-all my-2 rounded-xl ${
                es58mm
                  ? 'max-w-[260px] p-3 text-[9.5px]'
                  : 'max-w-[340px] p-4 text-[11px]'
              }`}
            >
              {/* Header Ferretería */}
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                {settings?.businessLogoUrl ? (
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={settings.businessLogoUrl}
                      alt={nombreFerreteria}
                      className={`object-contain ${es58mm ? 'max-h-8 max-w-[120px]' : 'max-h-11 max-w-[150px]'}`}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 mb-1 text-indigo-700">
                    <HardHat className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
                <h4 className={`font-black tracking-tight text-slate-900 uppercase ${es58mm ? 'text-[11px]' : 'text-xs'}`}>
                  {nombreFerreteria}
                </h4>
                <p className="font-bold text-slate-800">R.U.C. N° {rucFerreteria}</p>
                <p className="text-slate-600 mt-0.5 leading-snug">{direccionFerreteria}</p>
                <p className="text-slate-600">Telf: {telefonoFerreteria}</p>
              </div>

              {/* Título de Arqueo y Turno */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className={`text-center font-black uppercase tracking-wider text-slate-900 ${es58mm ? 'text-[10px]' : 'text-xs'}`}>
                  *** {esCerrada ? 'CORTE Y ARQUEO DE CAJA' : 'ARQUEO DE CAJA EN VIVO'} ***
                </div>
                <div className="text-center font-bold text-slate-700">
                  TURNO N°: #{caja?.id || '001'}
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">APERTURA:</span>
                  <span className="font-bold text-right">{fechaAperturaFmt}</span>
                </div>
                {esCerrada && fechaCierreFmt ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500">CIERRE:</span>
                    <span className="font-bold text-right">{fechaCierreFmt}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-500">CORTE EN VIVO:</span>
                    <span className="font-bold text-right">{fechaCorteActualFmt}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">OPERADOR:</span>
                  <span className="font-bold truncate max-w-[170px] text-right">{nombreOperador}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ESTADO CAJA:</span>
                  <span className={`font-black uppercase ${esCerrada ? 'text-slate-800' : 'text-emerald-600'}`}>
                    {esCerrada ? 'CERRADA / LIQUIDADA' : 'EN CURSO (ABIERTA)'}
                  </span>
                </div>
              </div>

              {/* Desglose Financiero */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>FONDO INICIAL:</span>
                  <span>S/ {mInicial.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) VENTAS EFECTIVO:</span>
                  <span className="font-bold text-emerald-700">S/ {vEfectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) VENTAS DIGITALES:</span>
                  <span className="font-bold text-indigo-700">S/ {vDigital.toFixed(2)}</span>
                </div>
                {abonos > 0 && (
                  <div className="flex justify-between">
                    <span>(+) ABONOS DE CRÉDITO:</span>
                    <span className="font-bold text-blue-700">S/ {abonos.toFixed(2)}</span>
                  </div>
                )}
                {ingExtra > 0 && (
                  <div className="flex justify-between">
                    <span>(+) INGRESOS EXTRA:</span>
                    <span className="font-bold text-emerald-600">S/ {ingExtra.toFixed(2)}</span>
                  </div>
                )}
                {egresos > 0 && (
                  <div className="flex justify-between">
                    <span>(-) GASTOS / EGRESOS:</span>
                    <span className="font-bold text-rose-600">S/ {egresos.toFixed(2)}</span>
                  </div>
                )}
                {retirosBoveda > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>(-) TRASLADO A BÓVEDA:</span>
                    <span className="font-bold">S/ {retirosBoveda.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black pt-1 border-t border-dotted border-slate-300">
                  <span>TOTAL VENTAS TURNO:</span>
                  <span>S/ {tVentas.toFixed(2)}</span>
                </div>
              </div>

              {/* Saldo Esperado en Efectivo / Gaveta */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
                <div className="text-center text-[10px] uppercase font-bold text-slate-500">
                  SALDO ESPERADO EN GAVETA
                </div>
                <div className="text-center font-black text-sm sm:text-base py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tracking-tight">
                  S/ {sEsperado.toFixed(2)}
                </div>
                <p className="text-[9px] text-center text-slate-500 italic">
                  (Efectivo físico auditado que debe existir en el cajón)
                </p>
                {esCerrada && (
                  <div className="pt-2 mt-1 border-t border-dotted border-slate-300 space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>EFECTIVO CONTADO:</span>
                      <span className="font-black">S/ {sReal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-[10.5px]">
                      <span>ESTADO CUADRE:</span>
                      <span className={esCuadrado ? 'text-emerald-700' : esSobrante ? 'text-blue-700' : 'text-rose-600'}>
                        {esCuadrado
                          ? 'CUADRADO (OK)'
                          : esSobrante
                          ? `SOBRANTE (+S/ ${dif.toFixed(2)})`
                          : `FALTANTE (-S/ ${Math.abs(dif).toFixed(2)})`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Movimientos de Caja si existen */}
              {movimientos.length > 0 && (
                <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[9.5px]">
                  <div className="font-bold uppercase text-slate-600">
                    MOVIMIENTOS REGISTRADOS ({movimientos.length}):
                  </div>
                  {movimientos.slice(0, 6).map((m, idx) => (
                    <div key={idx} className="flex justify-between items-baseline gap-1">
                      <span className="truncate max-w-[170px] text-slate-600">
                        {m.tipo === 'Ingreso' ? '[+ING]' : '[-EGR]'} {m.concepto || 'Movimiento'}
                      </span>
                      <span className="font-bold shrink-0">
                        S/ {parseFloat(m.monto || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {movimientos.length > 6 && (
                    <div className="text-[8.5px] text-slate-400 italic text-center pt-0.5">
                      ... y {movimientos.length - 6} movimiento(s) más en el historial
                    </div>
                  )}
                </div>
              )}

              {/* Pie de Ticket y Firmas */}
              <div className="pt-2 text-center text-[9px] text-slate-500 space-y-3">
                <p>Control Interno de Gestión Ferretera</p>
                <div className="pt-4 border-t border-dotted border-slate-300 flex justify-between gap-4 text-[8.5px]">
                  <div className="flex-1 text-center">
                    <div className="border-b border-slate-400 pb-2 mb-0.5" />
                    <span>Firma Cajero</span>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="border-b border-slate-400 pb-2 mb-0.5" />
                    <span>Firma Auditor</span>
                  </div>
                </div>
                <div className="font-bold text-slate-600 pt-1">
                  {esCerrada ? '*** CIERRE AUDITADO ***' : '*** REPORTE EN VIVO ***'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer de Acciones del Modal */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Turno: <strong className="text-slate-800 dark:text-white">#{caja?.id}</strong>
              <span className="ml-1 text-slate-400">({esCerrada ? 'Cerrado' : 'Activo'})</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleImprimir}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
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
