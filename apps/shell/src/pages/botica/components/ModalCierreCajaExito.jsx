import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Share2,
  Copy,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Send,
  MessageCircle,
  Smartphone,
  Check,
  RotateCcw,
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
  const ticketRef = useRef(null);

  // Formato de papel térmico (80mm estándar vs 58mm compacto)
  const [tamanoPapel, setTamanoPapel] = useState('80mm');
  // Estado para el envío de WhatsApp
  const [mostrarInputWhatsapp, setMostrarInputWhatsapp] = useState(false);
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!isOpen || !cajaData) return;

    // Disparar pequeño confetti si el arqueo fue perfecto
    const dif = parseFloat(cajaData?.diferencia || 0);
    if (Math.abs(dif) < 0.01) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b']
        });
      } catch (e) {
        // Ignorar si canvas no está disponible
      }
    }
  }, [isOpen, cajaData]);

  // Atajo de teclado: Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !cajaData) return null;

  const mInicial = parseFloat(cajaData.monto_inicial || 0);
  const vEfectivo = parseFloat(cajaData.ventas_efectivo ?? cajaData.total_ventas_efectivo ?? 0);
  const vDigital = parseFloat(cajaData.ventas_digitales ?? 0);
  const tVentas = parseFloat(cajaData.total_ventas_general ?? (vEfectivo + vDigital));
  const cantVentas = cajaData.cantidad_ventas ?? 0;
  const abonos = parseFloat(cajaData.abonos_efectivo ?? 0);
  const ingExtra = parseFloat(cajaData.ingresos_extra ?? 0);
  const egresos = parseFloat(cajaData.total_egresos ?? 0);
  const sEsperado = parseFloat(cajaData.monto_final_esperado ?? (mInicial + vEfectivo + abonos + ingExtra - egresos));
  const sReal = parseFloat(cajaData.monto_final_real ?? cajaData.monto_final ?? 0);
  const dif = parseFloat(cajaData.diferencia !== undefined ? cajaData.diferencia : (sReal - sEsperado));

  const esCuadrado = Math.abs(dif) < 0.01;
  const esSobrante = dif > 0.01;
  const esFaltante = dif < -0.01;

  const handlePrint = () => {
    imprimirTicketCierreCaja(cajaData, { formato: tamanoPapel, settings, autoPrint: true });
    toast.success(`Enviando reporte de cierre a impresora térmica (${tamanoPapel})...`, {
      icon: '🖨️',
      duration: 3500
    });
  };

  const nombreBotica = settings.businessName || 'BOTICA HEIS & SALUD';
  const rucBotica = settings.businessRuc || '20608945123';
  const direccionBotica = settings.address || 'Av. Las Palmas 450, San Isidro - Lima';
  const telefonoBotica = settings.phone || '(01) 489-3210 / 998-765-432';
  const qfResponsable = cajaData?.usuario?.colegiatura_qf
    ? `${cajaData?.usuario?.nombre || 'Director Técnico'} (${cajaData.usuario.colegiatura_qf})`
    : (settings.technicalDirector || 'Q.F. Responsable Reg. CQFP');

  const fechaAperturaFmt = cajaData.fecha_apertura
    ? new Date(cajaData.fecha_apertura).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : '---';

  const fechaCierreFmt = cajaData.fecha_cierre
    ? new Date(cajaData.fecha_cierre).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

  const fechaEmisionFmt = new Date().toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const movimientos = Array.isArray(cajaData.movimientos) ? cajaData.movimientos : [];

  // Generar texto para WhatsApp y Portapapeles
  const generarTextoResumen = () => {
    const lines = [];
    lines.push(`🏥 *${nombreBotica.toUpperCase()}*`);
    lines.push(`📊 *CORTE Y ARQUEO DE CAJA CHICA*`);
    lines.push(`🔢 Turno N°: #${cajaData.id || '001'}`);
    lines.push(`👤 Cajero: ${cajaData.usuario?.nombre || 'Usuario Responsable'}`);
    lines.push(`📅 Apertura: ${fechaAperturaFmt}`);
    lines.push(`🏁 Cierre: ${fechaCierreFmt}`);
    lines.push(`─────────────────────`);
    lines.push(`💰 *MOVIMIENTO DE CAJA:*`);
    lines.push(`• Fondo Inicial (Sencillo): S/ ${mInicial.toFixed(2)}`);
    lines.push(`• (+) Ventas Efectivo: S/ ${vEfectivo.toFixed(2)}${cantVentas > 0 ? ` (${cantVentas} ventas)` : ''}`);
    lines.push(`• (+) Ventas Digitales (Yape/POS): S/ ${vDigital.toFixed(2)}`);
    lines.push(`• Total Ventas Turno: S/ ${tVentas.toFixed(2)}`);
    if (abonos > 0) lines.push(`• (+) Abonos Cuentas: S/ ${abonos.toFixed(2)}`);
    if (ingExtra > 0) lines.push(`• (+) Ingresos Extra: S/ ${ingExtra.toFixed(2)}`);
    if (egresos > 0) lines.push(`• (-) Egresos/Gastos: S/ ${egresos.toFixed(2)}`);
    lines.push(`─────────────────────`);
    lines.push(`💵 *CUADRE FÍSICO:*`);
    lines.push(`• Saldo Esperado en Cajón: S/ ${sEsperado.toFixed(2)}`);
    lines.push(`• Efectivo Físico Contado: S/ ${sReal.toFixed(2)}`);
    lines.push(`• Diferencia: ${dif > 0 ? '+' : ''}S/ ${dif.toFixed(2)}`);
    lines.push(
      esCuadrado
        ? `✅ *ESTADO: ARQUEO EXACTO / SIN DIFERENCIAS*`
        : esSobrante
        ? `🔵 *ESTADO: SOBRANTE DE CAJA (+S/ ${dif.toFixed(2)})*`
        : `🔴 *ESTADO: FALTANTE DE CAJA (-S/ ${Math.abs(dif).toFixed(2)})*`
    );
    if (cajaData.observaciones || cajaData.observacion_usuario) {
      lines.push(`─────────────────────`);
      lines.push(`📝 *Observaciones:* ${cajaData.observaciones || cajaData.observacion_usuario}`);
    }
    lines.push(`─────────────────────`);
    lines.push(`🌿 _Documento de control y auditoría interna farmacéutica_`);
    return lines.join('\n');
  };

  const handleCopiarResumen = () => {
    const texto = generarTextoResumen();
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      toast.success('¡Resumen de arqueo copiado al portapapeles!');
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const handleEnviarWhatsapp = (e) => {
    if (e) e.preventDefault();
    let numLimpio = (telefonoWhatsapp || '').replace(/\D/g, '');
    if (!numLimpio) {
      toast.error('Ingrese un número de celular de WhatsApp válido');
      return;
    }
    if (numLimpio.length === 9) {
      numLimpio = '51' + numLimpio;
    }
    const texto = encodeURIComponent(generarTextoResumen());
    const url = `https://api.whatsapp.com/send?phone=${numLimpio}&text=${texto}`;
    window.open(url, '_blank');
    toast.success('Abriendo WhatsApp con el resumen de caja...');
    setMostrarInputWhatsapp(false);
  };

  const es58mm = tamanoPapel === '58mm';

  const modalJSX = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer font-sora"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col my-auto max-h-[92vh] cursor-default font-sora"
      >
        
        {/* ─── 1. CABECERA CON ESTADO Y SELECTOR 80MM / 58MM ─── */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                  Corte y Cierre de Caja
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Turno #{cajaData.id || '001'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Arqueo de Turno Finalizado • Listo para impresión o entrega
              </p>
            </div>
          </div>

          {/* Selector de Tamaño de Papel Térmico */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setTamanoPapel('80mm')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  tamanoPapel === '80mm'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Formato estándar de impresoras térmicas de 80mm (ESC/POS)"
              >
                80 mm
              </button>
              <button
                type="button"
                onClick={() => setTamanoPapel('58mm')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  tamanoPapel === '58mm'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Formato compacto de impresoras térmicas de 58mm"
              >
                58 mm
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4.5 h-4.5 text-slate-600 group-hover:text-rose-600 transition-transform duration-150 group-hover:rotate-90" />
            </button>
          </div>
        </div>

        {/* ─── 2. BARRA DE ACCIONES RÁPIDAS SUPERIOR ─── */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir ({tamanoPapel})</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarInputWhatsapp(!mostrarInputWhatsapp)}
              className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs shadow-md shadow-[#25D366]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Enviar resumen de arqueo por WhatsApp al supervisor o contador"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopiarResumen}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copiar texto resumen del arqueo"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Badge del estado de arqueo */}
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 ${
                esCuadrado
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : esSobrante
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {esCuadrado ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cuadre Exacto (S/ 0.00)</span>
                </>
              ) : esSobrante ? (
                <>
                  <span>Sobrante: +S/ {dif.toFixed(2)}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Faltante: -S/ {Math.abs(dif).toFixed(2)}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* ─── 3. FORMULARIO DESPLEGABLE DE WHATSAPP ─── */}
        {mostrarInputWhatsapp && (
          <form
            onSubmit={handleEnviarWhatsapp}
            className="px-5 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 shrink-0">Celular / Destinatario:</span>
            <input
              type="tel"
              value={telefonoWhatsapp}
              onChange={(e) => setTelefonoWhatsapp(e.target.value)}
              placeholder="Ej. 987654321"
              autoFocus
              className="flex-1 max-w-[200px] bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Enviar</span>
            </button>
            <button
              type="button"
              onClick={() => setMostrarInputWhatsapp(false)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-1.5 py-1 cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        )}

        {/* ─── 4. ÁREA DE VISTA PREVIA DEL TICKET (ADAPTATIVA 80mm / 58mm) ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/90 dark:bg-slate-950/80 flex justify-center items-start custom-scrollbar">
          <div
            id="ticket-impresion-cierre"
            ref={ticketRef}
            className={`w-full h-fit shrink-0 bg-white text-slate-900 shadow-xl border border-slate-200/90 leading-tight select-none transition-all my-2 ${
              es58mm
                ? 'papel-58mm max-w-[260px] p-3 text-[9.5px] font-mono rounded-xl'
                : 'papel-80mm max-w-[340px] p-4 text-[11px] font-mono rounded-xl'
            }`}
          >
            {/* Header Botica */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              {settings.businessLogoUrl ? (
                <div className="flex justify-center mb-1.5">
                  <img
                    src={settings.businessLogoUrl}
                    alt={nombreBotica}
                    className={`object-contain ${es58mm ? 'max-h-9 max-w-[120px]' : 'max-h-12 max-w-[150px]'}`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-700">
                  <HeartPulse className="w-4 h-4" />
                </div>
              )}
              <h4 className={`font-black tracking-tight text-slate-900 uppercase ${es58mm ? 'text-xs' : 'text-sm'}`}>
                {nombreBotica}
              </h4>
              <p className="font-bold text-slate-800">R.U.C. N° {rucBotica}</p>
              <p className="text-slate-600 mt-0.5 leading-snug">{direccionBotica}</p>
              <p className="text-slate-600">Telf: {telefonoBotica}</p>
              <p className="text-emerald-800 font-extrabold mt-1">
                {qfResponsable}
              </p>
            </div>

            {/* Datos del Turno y Arqueo */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5">
              <div className={`text-center font-black uppercase text-slate-900 ${es58mm ? 'text-[10px]' : 'text-xs'}`}>
                *** CORTE Y ARQUEO DE CAJA ***
              </div>
              <div className={`text-center font-extrabold tracking-wider text-slate-800 ${es58mm ? 'text-xs' : 'text-sm'}`}>
                TURNO N°: #{cajaData.id || '001'}
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">APERTURA:</span>
                <span className="font-bold">{fechaAperturaFmt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CIERRE:</span>
                <span className="font-bold">{fechaCierreFmt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CAJERO:</span>
                <span className="font-bold truncate max-w-[170px]">
                  {cajaData.usuario?.nombre || 'Usuario Responsable'}
                </span>
              </div>
            </div>

            {/* Resumen Operativo Financiero */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
              <div className="font-black text-center uppercase tracking-wider text-slate-800 text-[10px] pb-0.5">
                -- MOVIMIENTO OPERATIVO --
              </div>
              <div className="flex justify-between text-slate-700">
                <span>(+) FONDO INICIAL:</span>
                <span className="font-bold font-mono">S/ {mInicial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>(+) VENTAS EFECTIVO:</span>
                <span className="font-bold font-mono text-emerald-800">S/ {vEfectivo.toFixed(2)}</span>
              </div>
              {cantVentas > 0 && (
                <div className="flex justify-between text-[9px] text-slate-500 pl-3">
                  <span>└ Transacciones:</span>
                  <span>{cantVentas} ventas</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span>(+) VENTAS DIGITALES:</span>
                <span className="font-bold font-mono text-blue-800">S/ {vDigital.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 pl-3">
                <span>└ (Yape / Plin / POS):</span>
                <span>(en bancos)</span>
              </div>
              {abonos > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>(+) ABONOS COBRADOS:</span>
                  <span className="font-bold font-mono">S/ {abonos.toFixed(2)}</span>
                </div>
              )}
              {ingExtra > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>(+) INGRESOS EXTRA:</span>
                  <span className="font-bold font-mono">S/ {ingExtra.toFixed(2)}</span>
                </div>
              )}
              {egresos > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>(-) GASTOS / EGRESOS:</span>
                  <span className="font-bold font-mono">- S/ {egresos.toFixed(2)}</span>
                </div>
              )}
              <div className={`flex justify-between font-black text-slate-900 pt-1 border-t border-dotted border-slate-300 ${es58mm ? 'text-xs' : 'text-sm'}`}>
                <span>TOTAL VENTAS TURNO:</span>
                <span className="font-mono">S/ {tVentas.toFixed(2)}</span>
              </div>
            </div>

            {/* Balance Físico y Auditoría de Arqueo */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>SALDO ESPERADO CAJÓN:</span>
                <span className="font-bold font-mono">S/ {sEsperado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-xs">
                <span>EFECTIVO CONTADO REAL:</span>
                <span className="font-mono">S/ {sReal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black pt-1 border-t border-dashed border-slate-300">
                <span>DIFERENCIA:</span>
                <span className="font-mono">
                  {dif > 0 ? '+' : ''} S/ {dif.toFixed(2)}
                </span>
              </div>

              <div
                className={`text-center font-black p-1 rounded-sm mt-1 border text-[9.5px] uppercase ${
                  esCuadrado
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50'
                    : esSobrante
                    ? 'border-blue-600 text-blue-800 bg-blue-50'
                    : 'border-rose-600 text-rose-800 bg-rose-50'
                }`}
              >
                {esCuadrado
                  ? 'ARQUEO EXACTO / SIN DIFERENCIAS'
                  : esSobrante
                  ? `SOBRANTE DE CAJA (+S/ ${dif.toFixed(2)})`
                  : `FALTANTE DE CAJA (-S/ ${Math.abs(dif).toFixed(2)})`}
              </div>
            </div>

            {/* Detalle de Movimientos de Caja Chica */}
            {movimientos.length > 0 && (
              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="font-black uppercase text-[9px] text-slate-700 pb-1">
                  MOVIMIENTOS DE CAJA CHICA ({movimientos.length}):
                </div>
                <div className="space-y-1">
                  {movimientos.map((m, idx) => (
                    <div key={idx} className="flex justify-between text-[9px]">
                      <span className="truncate max-w-[190px]">
                        {m.tipo === 'Ingreso' ? '[+ING]' : '[-EGR]'} {m.concepto || m.motivo || 'Movimiento'}
                      </span>
                      <span className="font-bold font-mono">
                        S/ {parseFloat(m.monto || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observaciones de Cierre */}
            {(cajaData.observaciones || cajaData.observacion_usuario) && (
              <div className="py-2 border-b border-dashed border-slate-400 text-[9px]">
                <span className="font-bold text-slate-700">OBSERVACIONES:</span>
                <p className="italic text-slate-600 mt-0.5">
                  {cajaData.observaciones || cajaData.observacion_usuario}
                </p>
              </div>
            )}

            {/* Firmas de Conformidad */}
            <div className="py-3 text-[8.5px]">
              <div className="flex justify-between items-end gap-4 pt-6">
                <div className="flex-1 text-center border-t border-slate-400 pt-1">
                  <div className="font-bold">ENTREGUÉ CONFORME</div>
                  <div className="truncate max-w-[120px] mx-auto text-slate-600">
                    {cajaData.usuario?.nombre || 'Cajero'}
                  </div>
                </div>
                <div className="flex-1 text-center border-t border-slate-400 pt-1">
                  <div className="font-bold">RECIBÍ CONFORME</div>
                  <div className="text-slate-600">ADMINISTRACIÓN / Q.F.</div>
                </div>
              </div>
            </div>

            {/* Pie de Ticket */}
            <div className="pt-2 text-center text-[8px] text-slate-400 border-t border-dotted border-slate-300">
              <p>Emisión: {fechaEmisionFmt}</p>
              <p className="mt-0.5 font-bold text-slate-600">
                Documento Interno de Arqueo y Control Farmacéutico
              </p>
              <div className="flex items-center justify-center gap-1 text-[8.5px] font-extrabold text-emerald-800 mt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>¡Botica HEIS & Salud • Cuadre Seguro!</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. FOOTER CON BOTONES DE CIERRE Y ACCIONES ─── */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Formato activo: <b>{tamanoPapel} (Impresora Térmica ESC/POS)</b>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Finalizar (Esc)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
