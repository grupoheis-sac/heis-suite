import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Wallet,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  History,
  RefreshCw,
  Plus,
  Coins,
  CreditCard,
  Receipt,
  Calculator,
  Share2,
  Check,
  BedDouble,
  Luggage,
  BellRing,
  Car
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@heis/core';
import { useSettingsStore } from '@heis/core';
import DropdownPill from '../DropdownPill';
import { imprimirTicketCierreCaja } from '../../utils/impresionTermica';
import ModalTicketCierre from './ModalTicketCierre';

const OPCIONES_METODO_CAJA = [
  { value: 'efectivo', label: 'Efectivo', subtitle: 'Dinero en efectivo en caja', badge: 'Caja' },
  { value: 'yape', label: 'Yape', subtitle: 'Billetera BCP Yape', badge: 'Digital' },
  { value: 'plin', label: 'Plin', subtitle: 'Billetera BBVA / Interbank / Scotiabank', badge: 'Digital' },
  { value: 'transferencia', label: 'Transferencia Bancaria', subtitle: 'Abono en cuenta bancaria', badge: 'Banco' }
];

export default function ModalCajaTurno({ isOpen, onClose, onTurnoActualizado }) {
  const { user } = useAuthStore();
  const settings = useSettingsStore();

  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'movimiento' | 'cierre' | 'historial'
  const [subTabResumen, setSubTabResumen] = useState('metricas'); // 'metricas' | 'pagos' | 'movimientos'
  const [cargando, setCargando] = useState(false);
  const [turnoData, setTurnoData] = useState(null);

  // Formato de Impresión Térmica
  const [tamanoPapel, setTamanoPapel] = useState('80mm');

  // Formulario Apertura
  const [montoApertura, setMontoApertura] = useState('100.00');
  const [obsApertura, setObsApertura] = useState('');
  const [abriendoTurno, setAbriendoTurno] = useState(false);

  // Formulario Movimiento
  const [tipoMovimiento, setTipoMovimiento] = useState('egreso'); // 'egreso' | 'ingreso'
  const [conceptoMov, setConceptoMov] = useState('');
  const [montoMov, setMontoMov] = useState('');
  const [metodoMov, setMetodoMov] = useState('efectivo');
  const [comprobanteRef, setComprobanteRef] = useState('');
  const [obsMov, setObsMov] = useState('');
  const [guardandoMov, setGuardandoMov] = useState(false);

  // Formulario Cierre
  const [montoCierreReal, setMontoCierreReal] = useState('');
  const [obsCierre, setObsCierre] = useState('');
  const [cerrandoTurno, setCerrandoTurno] = useState(false);
  const [resumenCierreFinal, setResumenCierreFinal] = useState(null);
  const [mostrarModalTicketPreview, setMostrarModalTicketPreview] = useState(false);
  const [ticketPreviewData, setTicketPreviewData] = useState(null);

  // 1. Calculadora de Denominación de Billetes y Monedas
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const [conteoBilletes, setConteoBilletes] = useState({
    200: '',
    100: '',
    50: '',
    20: '',
    10: ''
  });
  const [conteoMonedas, setConteoMonedas] = useState({
    5: '',
    2: '',
    1: '',
    0.5: '',
    0.2: '',
    0.1: ''
  });

  // 4. Conciliación de Terminales POS (IziPay / Niubiz)
  const [mostrarConciliacionPos, setMostrarConciliacionPos] = useState(false);
  const [montoLotePos, setMontoLotePos] = useState('');
  const [montoAppDigital, setMontoAppDigital] = useState('');

  // 5. Bitácora de Relevo Hotelero (Tags rápidos de entrega)
  const [relevoTags, setRelevoTags] = useState({
    checkoutsPendientes: false,
    despertadores: false,
    taxis: false,
    equipajeCustodia: false
  });

  // Historial
  const [historialTurnos, setHistorialTurnos] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarTurnoActual();
      setResumenCierreFinal(null);
    }
  }, [isOpen]);

  const cargarTurnoActual = async () => {
    try {
      setCargando(true);
      const res = await api.get('/caja/turno-actual');
      if (res.data?.success) {
        setTurnoData(res.data);
        if (res.data.turnoActivo) {
          setActiveTab('resumen');
          setMontoCierreReal(String(res.data.resumen?.efectivo_esperado || ''));
        } else {
          setActiveTab('apertura');
        }
      }
    } catch (err) {
      toast.error('Error al consultar estado de caja.');
    } finally {
      setCargando(false);
    }
  };

  const handleAbrirTurno = async (e) => {
    e.preventDefault();
    try {
      setAbriendoTurno(true);
      const res = await api.post('/caja/abrir-turno', {
        monto_apertura: parseFloat(montoApertura) || 0,
        observaciones_apertura: obsApertura
      });
      toast.success(res.data?.message || '¡Turno de caja abierto correctamente!');
      window.dispatchEvent(new CustomEvent('caja-turno-changed'));
      if (onTurnoActualizado) onTurnoActualizado();
      cargarTurnoActual();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al abrir turno de caja.');
    } finally {
      setAbriendoTurno(false);
    }
  };

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault();
    if (!conceptoMov.trim() || !montoMov || Number(montoMov) <= 0) {
      toast.error('Ingrese un concepto y monto válido.');
      return;
    }

    try {
      setGuardandoMov(true);
      const res = await api.post('/caja/movimiento', {
        tipo: tipoMovimiento,
        concepto: conceptoMov,
        monto: parseFloat(montoMov),
        metodo_pago: metodoMov,
        comprobante_referencia: comprobanteRef,
        observaciones: obsMov
      });
      toast.success(res.data?.message || 'Movimiento registrado con éxito.');
      window.dispatchEvent(new CustomEvent('caja-turno-changed'));
      setConceptoMov('');
      setMontoMov('');
      setComprobanteRef('');
      setObsMov('');
      setActiveTab('resumen');
      cargarTurnoActual();
      if (onTurnoActualizado) onTurnoActualizado();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar movimiento.');
    } finally {
      setGuardandoMov(false);
    }
  };

  // Cálculo de la calculadora de denominaciones
  const calcularTotalDenominaciones = () => {
    let total = 0;
    Object.entries(conteoBilletes).forEach(([den, cant]) => {
      total += parseFloat(den) * (parseInt(cant) || 0);
    });
    Object.entries(conteoMonedas).forEach(([den, cant]) => {
      total += parseFloat(den) * (parseFloat(cant) || 0);
    });
    return +total.toFixed(2);
  };

  const totalDenominaciones = calcularTotalDenominaciones();

  const handleAplicarCalculadora = () => {
    if (totalDenominaciones <= 0) {
      toast.error('Ingrese cantidades en billetes o monedas.');
      return;
    }
    setMontoCierreReal(totalDenominaciones.toFixed(2));
    toast.success(`Conteo físico de S/ ${totalDenominaciones.toFixed(2)} aplicado a la gaveta`, { icon: '🪙' });
  };

  const handleLimpiarCalculadora = () => {
    setConteoBilletes({ 200: '', 100: '', 50: '', 20: '', 10: '' });
    setConteoMonedas({ 5: '', 2: '', 1: '', 0.5: '', 0.2: '', 0.1: '' });
  };

  // Construir texto de novedades estructuradas
  const construirObservacionesCompletas = () => {
    const tagsActivos = [];
    if (relevoTags.checkoutsPendientes) tagsActivos.push('⚠️ Check-outs pendientes');
    if (relevoTags.despertadores) tagsActivos.push('⏰ Llamada(s) de despertador programada(s)');
    if (relevoTags.taxis) tagsActivos.push('🚖 Taxi/Traslado agendado');
    if (relevoTags.equipajeCustodia) tagsActivos.push('🧳 Maletas en custodia en recepción');

    let textoFinal = obsCierre.trim();
    if (tagsActivos.length > 0) {
      textoFinal = `[Novedades: ${tagsActivos.join(', ')}] ${textoFinal}`.trim();
    }
    if (montoLotePos && parseFloat(montoLotePos) > 0) {
      textoFinal += ` | Lote POS Físico: S/ ${parseFloat(montoLotePos).toFixed(2)}`;
    }
    return textoFinal;
  };

  const handleCerrarTurno = async () => {
    const efectivoRealNum = parseFloat(montoCierreReal);
    if (isNaN(efectivoRealNum) || efectivoRealNum < 0) {
      toast.error('Ingrese el monto físico de efectivo contado en gaveta.');
      return;
    }

    const obsFinal = construirObservacionesCompletas();

    try {
      setCerrandoTurno(true);
      const res = await api.post('/caja/cerrar-turno', {
        monto_cierre_real: efectivoRealNum,
        observaciones_cierre: obsFinal
      });
      toast.success('¡Turno cerrado y arqueado con éxito!');
      window.dispatchEvent(new CustomEvent('caja-turno-changed'));
      setResumenCierreFinal(res.data);
      const dataTicket = res.data?.turno || {
        ...turno,
        fecha_cierre: new Date(),
        monto_cierre_real: efectivoRealNum,
        observaciones_cierre: obsFinal,
        resumen_metodos: res.data?.resumen || resumen
      };
      setTicketPreviewData(dataTicket);
      setMostrarModalTicketPreview(true);
      if (onTurnoActualizado) onTurnoActualizado();
      cargarTurnoActual();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cerrar el turno de caja.');
    } finally {
      setCerrandoTurno(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true);
      const res = await api.get('/caja/historial?limite=15');
      setHistorialTurnos(res.data?.data || []);
    } catch (err) {
      toast.error('Error al cargar historial de turnos.');
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'historial') {
      cargarHistorial();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const turno = turnoData?.turno;
  const resumen = turnoData?.resumen;
  const turnoActivo = turnoData?.turnoActivo;
  const listaPagos = turnoData?.pagos || turnoData?.ultimos_pagos || [];
  const listaMovimientos = turnoData?.movimientos || [];

  const efectivoEsperado = resumen?.efectivo_esperado || 0;
  const contadoReal = parseFloat(montoCierreReal) || 0;
  const diferenciaCalculada = +(contadoReal - efectivoEsperado).toFixed(2);

  // Conciliación POS
  const totalTarjetasSistema = +((resumen?.desglose_digital?.tarjeta_debito || 0) + (resumen?.desglose_digital?.tarjeta_credito || 0)).toFixed(2);
  const lotePosNum = parseFloat(montoLotePos) || 0;
  const diferenciaPos = +(lotePosNum - totalTarjetasSistema).toFixed(2);

  // 3. Arqueo Parcial "Corte X" en Impresora Térmica
  const obtenerDataCorteX = () => ({
    id: `${turno?.id}-CORTE-X`,
    usuario: turno?.usuario || user,
    fecha_apertura: turno?.fecha_apertura,
    fecha_cierre: new Date(),
    isCorteX: true,
    es_corte_x: true,
    monto_apertura: resumen?.monto_apertura,
    monto_cierre_esperado: resumen?.efectivo_esperado,
    monto_cierre_real: resumen?.efectivo_esperado,
    diferencia: 0,
    resumen_metodos: {
      ...resumen,
      efectivo_esperado: resumen?.efectivo_esperado,
      efectivo_real: resumen?.efectivo_esperado,
      diferencia: 0
    }
  });

  const handleVerCorteX = () => {
    const dataCorteX = obtenerDataCorteX();
    setTicketPreviewData(dataCorteX);
    setMostrarModalTicketPreview(true);
  };

  const handleImprimirCorteX = () => {
    const dataCorteX = obtenerDataCorteX();
    imprimirTicketCierreCaja(dataCorteX, { formato: tamanoPapel, settings, autoPrint: true });
    toast.success(`Corte X (Arqueo Parcial) enviado a impresora térmica (${tamanoPapel})`, {
      icon: '🖨️',
      duration: 3500
    });
  };

  const obtenerDataCierreActual = () => {
    return resumenCierreFinal?.turno || {
      id: turno?.id,
      usuario: turno?.usuario || user,
      fecha_apertura: turno?.fecha_apertura,
      fecha_cierre: new Date(),
      monto_apertura: resumen?.monto_apertura,
      monto_cierre_esperado: resumen?.efectivo_esperado,
      monto_cierre_real: contadoReal || resumen?.efectivo_esperado,
      diferencia: diferenciaCalculada,
      resumen_metodos: {
        ...resumen,
        efectivo_esperado: resumen?.efectivo_esperado,
        efectivo_real: contadoReal || resumen?.efectivo_esperado,
        diferencia: diferenciaCalculada
      },
      observaciones_cierre: obsCierre
    };
  };

  const handleVerTicketCierre = () => {
    const data = obtenerDataCierreActual();
    setTicketPreviewData(data);
    setMostrarModalTicketPreview(true);
  };

  // 6. Impresión Térmica Directa Formal (Cierre Z)
  const handleImprimirTicketCierre = () => {
    const dataAImprimir = obtenerDataCierreActual();
    imprimirTicketCierreCaja(dataAImprimir, { formato: tamanoPapel, settings, autoPrint: true });
    toast.success(`Ticket de Cierre Z enviado a impresora térmica (${tamanoPapel})`, {
      icon: '🖨️',
      duration: 3500
    });
  };

  // 6. Generador de Reporte para WhatsApp
  const generarTextoResumenWhatsApp = () => {
    const mInicial = Number(resumen?.monto_apertura || 0).toFixed(2);
    const mEfectivo = Number(resumen?.pagos_efectivo || 0).toFixed(2);
    const mDigital = Number(resumen?.total_digital || 0).toFixed(2);
    const mEgresos = Number(resumen?.egresos_efectivo || 0).toFixed(2);
    const mEsperado = Number(resumen?.efectivo_esperado || 0).toFixed(2);
    const mReal = Number(montoCierreReal || resumen?.efectivo_esperado || 0).toFixed(2);
    const mDif = diferenciaCalculada;

    const estadoCuadre = mDif === 0
      ? '✅ CUADRE EXACTO (S/ 0.00)'
      : mDif > 0
      ? `🔵 SOBRANTE EN CAJA: +S/ ${mDif.toFixed(2)}`
      : `🔴 FALTANTE EN CAJA: S/ ${mDif.toFixed(2)}`;

    return `🏨 *REPORTE DE CAJA RECEPCIÓN — ${settings?.businessName || 'SISTEMA HOSPEDAJE'}*
📋 *Turno:* #${turno?.id || 'ACTUAL'}
👤 *Recepcionista:* ${turno?.usuario?.nombre || user?.nombre || 'Recepción'}
⏰ *Apertura:* ${turno?.fecha_apertura ? new Date(turno.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '-'}
------------------------------------
💵 *Fondo Inicial:* S/ ${mInicial}
🟢 *Cobros en Efectivo:* S/ ${mEfectivo}
📱 *Cobros Digitales/Bancos:* S/ ${mDigital}
   • Yape / Plin: S/ ${((resumen?.desglose_digital?.yape || 0) + (resumen?.desglose_digital?.plin || 0)).toFixed(2)}
   • Tarjetas (POS): S/ ${((resumen?.desglose_digital?.tarjeta_debito || 0) + (resumen?.desglose_digital?.tarjeta_credito || 0)).toFixed(2)}
   • Transferencias: S/ ${(resumen?.desglose_digital?.transferencia || 0).toFixed(2)}
🔻 *Gastos/Salidas Menores:* S/ ${mEgresos}
------------------------------------
🏦 *Efectivo Esperado en Gaveta:* S/ ${mEsperado}
💰 *Efectivo Físico Contado:* S/ ${mReal}
📊 *Resultado de Cuadre:* ${estadoCuadre}
------------------------------------
${obsCierre ? `📝 *Bitácora de Entrega:*\n"${obsCierre}"\n------------------------------------\n` : ''}✨ _Generado automáticamente por Sistema Hotelero HEIS_`;
  };

  const handleCopiarWhatsApp = () => {
    const texto = generarTextoResumenWhatsApp();
    navigator.clipboard.writeText(texto);
    toast.success('¡Reporte copiado al portapapeles para WhatsApp!', { icon: '📋' });
  };

  const handleEnviarWhatsApp = () => {
    const texto = generarTextoResumenWhatsApp();
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-200 overflow-y-auto"
      style={{
        WebkitBackdropFilter: 'blur(3px)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 my-auto"
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                  Control de Turnos & Caja de Recepción
                </h3>
                {turnoActivo ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Turno Abierto
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Caja Cerrada
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arqueo en tiempo real, fondo de caja, cobros y cuadre de turnos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas de Navegación Principal */}
        <div className="px-4 sm:px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white dark:bg-slate-900">
          {turnoActivo ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('resumen')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sora transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'resumen'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Arqueo en Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('movimiento')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sora transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'movimiento'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gasto / Ingreso Menor</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cierre')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sora transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'cierre'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cierre de Turno (X/Z)</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('apertura')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-sora bg-blue-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Apertura de Turno</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sora transition-all flex items-center gap-1.5 cursor-pointer ml-auto ${
              activeTab === 'historial'
                ? 'bg-slate-800 text-white dark:bg-slate-700'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Historial</span>
          </button>
        </div>

        {/* Contenido Principal con Scroll Suave */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin flex-1 text-slate-700 dark:text-slate-200">
          {cargando ? (
            <div className="p-12 text-center text-xs text-slate-400 font-sora">
              Cargando información de caja...
            </div>
          ) : !turnoActivo && activeTab === 'apertura' ? (
            /* ═════════ FORMULARIO: APERTURA DE TURNO ═════════ */
            <form onSubmit={handleAbrirTurno} className="space-y-4 max-w-md mx-auto py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 flex items-center justify-center mx-auto shadow-xs">
                  <Wallet className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-white font-sora">
                  Iniciar Nuevo Turno de Recepción
                </h4>
                <p className="text-xs text-slate-500">
                  Ingrese el fondo de caja inicial en efectivo para comenzar la jornada
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Recepcionista:</span>
                  <span className="font-bold text-slate-800 dark:text-white font-sora">
                    {user?.nombre || user?.username || 'Recepción'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Hora de inicio:</span>
                  <span className="font-mono font-bold">
                    {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora block">
                  Fondo Inicial en Efectivo (Sencillo de Caja):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={montoApertura}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    placeholder="100.00"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Dinero en billetes y monedas disponible al abrir la gaveta.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora block">
                  Notas u Observaciones (Opcional):
                </label>
                <input
                  type="text"
                  value={obsApertura}
                  onChange={(e) => setObsApertura(e.target.value)}
                  placeholder="Ej: Turno de mañana, recepción sede central..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sora"
                />
              </div>

              <button
                type="submit"
                disabled={abriendoTurno}
                className="w-full glow-btn-hotel py-3 rounded-2xl text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md font-sora"
              >
                {abriendoTurno ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Abrir Turno de Recepción (S/ {parseFloat(montoApertura || 0).toFixed(2)})</span>
              </button>
            </form>
          ) : activeTab === 'resumen' ? (
            /* ═════════ PESTAÑA: RESUMEN Y ARQUEO EN VIVO ═════════ */
            <div className="space-y-4">
              
              {/* Toolbar Superior: Acciones Rápidas del Turno (Corte X, WhatsApp, Recargar) */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold text-slate-800 dark:text-white font-sora">
                    Turno #{turno?.id} • {turno?.usuario?.nombre || user?.nombre || 'Recepcionista'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                    (Iniciado {new Date(turno?.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Botón Corte X (Arqueo Parcial) */}
                  <button
                    type="button"
                    onClick={handleVerCorteX}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 font-sora font-extrabold text-xs transition flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-800 shadow-2xs"
                    title="Ver e imprimir ticket de Corte X parcial en modal térmico"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Corte X (Ticket)</span>
                  </button>

                  {/* Botón WhatsApp */}
                  <button
                    type="button"
                    onClick={handleCopiarWhatsApp}
                    className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 font-sora font-bold text-xs transition flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                    title="Copiar reporte completo para WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  {/* Refrescar */}
                  <button
                    type="button"
                    onClick={cargarTurnoActual}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Actualizar datos"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-navegación entre Métricas Generales y Auditoría de Cobros de Habitaciones */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold font-sora">
                <button
                  type="button"
                  onClick={() => setSubTabResumen('metricas')}
                  className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    subTabResumen === 'metricas'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Arqueo Financiero</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTabResumen('pagos')}
                  className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    subTabResumen === 'pagos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>Cobros de Habitaciones ({listaPagos.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTabResumen('movimientos')}
                  className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    subTabResumen === 'movimientos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Caja Chica ({listaMovimientos.length})</span>
                </button>
              </div>

              {subTabResumen === 'metricas' ? (
                /* ─── VISTA 1: MÉTRICAS Y TOTALES DE ARQUEO ─── */
                <div className="space-y-4">
                  {/* KPI Cards de Arqueo */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {/* Fondo Inicial */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-sora block">
                        Fondo Inicial
                      </span>
                      <span className="text-lg sm:text-xl font-mono font-black text-slate-800 dark:text-white block mt-0.5">
                        S/ {Number(resumen?.monto_apertura || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">Efectivo apertura</span>
                    </div>

                    {/* Pagos Efectivo Hospedaje */}
                    <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase font-sora block">
                        + Cobros Efectivo
                      </span>
                      <span className="text-lg sm:text-xl font-mono font-black text-emerald-700 dark:text-emerald-300 block mt-0.5">
                        S/ {Number(resumen?.pagos_efectivo || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                        Hospedaje & Minibar
                      </span>
                    </div>

                    {/* Egresos / Gastos Menores */}
                    <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60">
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase font-sora block">
                        - Gastos de Caja
                      </span>
                      <span className="text-lg sm:text-xl font-mono font-black text-rose-700 dark:text-rose-300 block mt-0.5">
                        S/ {Number(resumen?.egresos_efectivo || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70">
                        Compras / Egresos
                      </span>
                    </div>
                  </div>

                  {/* TARJETA DESTACADA: EFECTIVO TOTAL ESPERADO EN GAVETA */}
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-600/20 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200 font-sora block">
                        Efectivo Total Esperado en Gaveta (Físico)
                      </span>
                      <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-0.5">
                        S/ {Number(resumen?.efectivo_esperado || 0).toFixed(2)}
                      </div>
                      <p className="text-[11px] text-blue-100/80 mt-1">
                        Fondo inicial + ingresos en efectivo - egresos registrados
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cierre')}
                      className="px-4 py-2.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-extrabold text-xs transition cursor-pointer shadow-sm active:scale-95 font-sora shrink-0"
                    >
                      Arqueo & Cierre (X/Z)
                    </button>
                  </div>

                  {/* Recaudación Digital (Yape, Plin, Tarjetas, Bancos) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-700 dark:text-slate-200 font-sora flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span>Cobros Digitales / Bancarios ({resumen?.total_digital ? `S/ ${resumen.total_digital.toFixed(2)}` : 'S/ 0.00'})</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Total Recaudado: S/ {Number(resumen?.total_recaudado_turno || 0).toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
                          Yape / Plin
                        </span>
                        <span className="font-mono font-black text-slate-800 dark:text-white">
                          S/ {((resumen?.desglose_digital?.yape || 0) + (resumen?.desglose_digital?.plin || 0)).toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                          Tarjetas D/C (POS)
                        </span>
                        <span className="font-mono font-black text-slate-800 dark:text-white">
                          S/ {((resumen?.desglose_digital?.tarjeta_debito || 0) + (resumen?.desglose_digital?.tarjeta_credito || 0)).toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                          Transferencias
                        </span>
                        <span className="font-mono font-black text-slate-800 dark:text-white">
                          S/ {(resumen?.desglose_digital?.transferencia || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          Total General
                        </span>
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                          S/ {Number(resumen?.total_recaudado_turno || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : subTabResumen === 'pagos' ? (
                /* ─── VISTA 2: AUDITORÍA DE COBROS DE HABITACIONES (ROOM TRANSACTIONS FEED) ─── */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-sora">
                      Cobros registrados durante este turno ({listaPagos.length})
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Hospedaje, Check-in y Consumos POS
                    </span>
                  </div>

                  {listaPagos.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl font-sora">
                      No se han registrado cobros de habitaciones aún en este turno.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {listaPagos.map((p) => {
                        const habNum = p.factura?.reserva?.habitacion?.numero || p.reserva?.habitacion?.numero || 'Hab';
                        const huespedNom = p.factura?.huesped ? `${p.factura.huesped.nombre} ${p.factura.huesped.apellido}` : 'Cliente Mostrador';
                        const esEfectivo = p.metodo_pago === 'efectivo';

                        return (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-blue-400 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-black text-xs shrink-0 border border-blue-200 dark:border-blue-800/80">
                                Hab. {habNum}
                              </span>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                                  {huespedNom}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {p.created_at ? new Date(p.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '-'} • Doc: {p.factura?.numero || 'Ticket'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`font-mono font-black text-sm block ${esEfectivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                S/ {parseFloat(p.monto || 0).toFixed(2)}
                              </span>
                              <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {p.metodo_pago || 'efectivo'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* ─── VISTA 3: GASTOS Y CAJA CHICA DEL TURNO ─── */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-sora">
                      Salidas y Gastos de Caja Chica ({listaMovimientos.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('movimiento')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nuevo Gasto</span>
                    </button>
                  </div>

                  {listaMovimientos.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl font-sora">
                      No hay egresos o gastos registrados en este turno.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {listaMovimientos.map((m) => {
                        const esEgreso = m.tipo === 'egreso';
                        return (
                          <div
                            key={m.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${esEgreso ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60'}`}>
                                {esEgreso ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                                  {m.concepto}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {m.fecha ? new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '-'} • Ref: {m.comprobante_referencia || 'Recibo'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`font-mono font-black text-sm block ${esEgreso ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {esEgreso ? '-' : '+'}S/ {parseFloat(m.monto || 0).toFixed(2)}
                              </span>
                              <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {m.metodo_pago || 'efectivo'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'movimiento' ? (
            /* ═════════ FORMULARIO: REGISTRAR GASTO O INGRESO ═════════ */
            <form onSubmit={handleRegistrarMovimiento} className="space-y-4 max-w-md mx-auto py-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-750 text-xs font-bold font-sora">
                <button
                  type="button"
                  onClick={() => setTipoMovimiento('egreso')}
                  className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    tipoMovimiento === 'egreso'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Gasto / Salida de Caja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoMovimiento('ingreso')}
                  className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    tipoMovimiento === 'ingreso'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Ingreso Manual</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora block">
                  Concepto o Motivo:
                </label>
                <input
                  type="text"
                  required
                  value={conceptoMov}
                  onChange={(e) => setConceptoMov(e.target.value)}
                  placeholder={
                    tipoMovimiento === 'egreso'
                      ? 'Ej: Compra de botellones de agua, papel higiénico, taxi...'
                      : 'Ej: Ingreso por propina o ajuste de cambio...'
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sora"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora block">
                    Monto (S/):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0.10"
                    required
                    value={montoMov}
                    onChange={(e) => setMontoMov(e.target.value)}
                    placeholder="25.00"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <DropdownPill
                    label="Método de Pago:"
                    value={metodoMov}
                    onChange={(val) => setMetodoMov(val)}
                    options={OPCIONES_METODO_CAJA}
                    icon={Wallet}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora block">
                  Comprobante o Boleta de Referencia:
                </label>
                <input
                  type="text"
                  value={comprobanteRef}
                  onChange={(e) => setComprobanteRef(e.target.value)}
                  placeholder="Ej: Boleta #B01-4452 o Recibo simple"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sora"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('resumen')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-sora cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoMov}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white transition flex items-center justify-center gap-1.5 cursor-pointer font-sora ${
                    tipoMovimiento === 'egreso'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30'
                  }`}
                >
                  {guardandoMov ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Guardar {tipoMovimiento === 'egreso' ? 'Salida' : 'Ingreso'}</span>
                </button>
              </div>
            </form>
          ) : activeTab === 'cierre' ? (
            /* ═════════ PESTAÑA: CIERRE DE TURNO & ARQUEO X/Z COMPLETO ═════════ */
            <div className="space-y-4 max-w-xl mx-auto py-1">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-white font-sora">
                  Arqueo y Cierre del Turno #{turno?.id}
                </h4>
                <p className="text-xs text-slate-500">
                  Cuadre el efectivo físico en gaveta, verifique vouchers POS y redacte las novedades de entrega
                </p>
              </div>

              {/* Comparador de Cuadre en Gaveta */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Efectivo Sistema Esperado:</span>
                  <span className="font-mono font-black text-slate-800 dark:text-white text-base">
                    S/ {Number(efectivoEsperado).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora block">
                      Dinero en Efectivo Físico Contado:
                    </label>
                    {/* Botón para Abrir/Cerrar Calculadora de Billetes y Monedas */}
                    <button
                      type="button"
                      onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-sora"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>{mostrarCalculadora ? 'Ocultar Desglose' : 'Desglose Billetes y Monedas'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      required
                      value={montoCierreReal}
                      onChange={(e) => setMontoCierreReal(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>

                {/* 1. CALCULADORA DE BILLETES Y MONEDAS INTERACTIVA */}
                {mostrarCalculadora && (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-extrabold text-blue-700 dark:text-blue-300 font-sora flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Conteo de Billetes y Monedas</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleLimpiarCalculadora}
                        className="text-[11px] text-slate-400 hover:text-rose-500 transition"
                      >
                        Limpiar
                      </button>
                    </div>

                    {/* Fila de Billetes */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Billetes (S/):
                      </span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[200, 100, 50, 20, 10].map((den) => (
                          <div key={den} className="text-center">
                            <span className="text-[10px] font-mono font-bold text-slate-500 block mb-0.5">S/{den}</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={conteoBilletes[den]}
                              onChange={(e) => setConteoBilletes({ ...conteoBilletes, [den]: e.target.value })}
                              className="w-full text-center py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fila de Monedas */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Monedas (S/):
                      </span>
                      <div className="grid grid-cols-6 gap-1">
                        {[5, 2, 1, 0.5, 0.2, 0.1].map((den) => (
                          <div key={den} className="text-center">
                            <span className="text-[10px] font-mono font-bold text-slate-500 block mb-0.5">
                              {den >= 1 ? `S/${den}` : `${(den * 100).toFixed(0)}c`}
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={conteoMonedas[den]}
                              onChange={(e) => setConteoMonedas({ ...conteoMonedas, [den]: e.target.value })}
                              className="w-full text-center py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs">
                        <span className="text-slate-400">Total Contado:</span>{' '}
                        <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                          S/ {totalDenominaciones.toFixed(2)}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={handleAplicarCalculadora}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-sora font-extrabold text-xs transition cursor-pointer shadow-xs"
                      >
                        Aplicar al Cierre
                      </button>
                    </div>
                  </div>
                )}

                {/* Resultado de la diferencia */}
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-sora ${
                    diferenciaCalculada === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                      : diferenciaCalculada > 0
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 text-blue-800 dark:text-blue-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    {diferenciaCalculada === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    {diferenciaCalculada === 0
                      ? 'Cuadre Exacto'
                      : diferenciaCalculada > 0
                      ? 'Sobrante en Gaveta'
                      : 'Faltante en Gaveta'}
                  </span>
                  <span className="font-mono font-black text-sm">
                    {diferenciaCalculada > 0 ? `+S/ ${diferenciaCalculada.toFixed(2)}` : `S/ ${diferenciaCalculada.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* 4. CONCILIACIÓN DE TERMINALES POS (IZIPAY / NIUBIZ) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200 font-sora flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Conciliación de Lote Datáfono POS (IziPay / Niubiz)</span>
                  </span>
                  <span className="font-mono text-slate-500 font-bold">
                    Sistema: S/ {totalTarjetasSistema.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Total según Cierre de Lote POS Físico:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">S/</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        placeholder={totalTarjetasSistema.toFixed(2)}
                        value={montoLotePos}
                        onChange={(e) => setMontoLotePos(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <div className={`w-full p-2 rounded-xl border text-xs font-sora font-bold flex items-center justify-between ${
                      !montoLotePos
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        : diferenciaPos === 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 border-rose-200'
                    }`}>
                      <span>Estado POS:</span>
                      <span className="font-mono">
                        {!montoLotePos ? 'Sin conciliar' : diferenciaPos === 0 ? '✓ Lote Cuadrado' : `Dif: S/ ${diferenciaPos.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. BITÁCORA DE RELEVO HOTELERO (INCIDENCIAS Y NOVEDADES) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora block">
                  Bitácora de Relevo para el Siguiente Recepcionista:
                </label>
                
                {/* Tags rápidos de novedades */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-sora">
                  <button
                    type="button"
                    onClick={() => setRelevoTags({ ...relevoTags, checkoutsPendientes: !relevoTags.checkoutsPendientes })}
                    className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                      relevoTags.checkoutsPendientes
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>Check-outs pendientes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRelevoTags({ ...relevoTags, despertadores: !relevoTags.despertadores })}
                    className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                      relevoTags.despertadores
                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <BellRing className="w-3 h-3" />
                    <span>Llamada despertador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRelevoTags({ ...relevoTags, taxis: !relevoTags.taxis })}
                    className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                      relevoTags.taxis
                        ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Car className="w-3 h-3" />
                    <span>Taxi agendado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRelevoTags({ ...relevoTags, equipajeCustodia: !relevoTags.equipajeCustodia })}
                    className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                      relevoTags.equipajeCustodia
                        ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Luggage className="w-3 h-3" />
                    <span>Maletas en custodia</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={obsCierre}
                  onChange={(e) => setObsCierre(e.target.value)}
                  placeholder="Ej: Se dejan S/ 100 de sencillo en gaveta, pasajero de hab. 302 pidió taxi a las 6am..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sora"
                />
              </div>

              {/* Selector de Papel para Ticket Térmico de Cierre */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-bold font-sora flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Formato de Impresora Térmica:</span>
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTamanoPapel('80mm')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition ${
                      tamanoPapel === '80mm' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    80mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setTamanoPapel('58mm')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition ${
                      tamanoPapel === '58mm' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    58mm
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('resumen')}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-sora cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  onClick={handleCerrarTurno}
                  disabled={cerrandoTurno}
                  className="flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer font-sora"
                >
                  {cerrandoTurno ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirmar y Cerrar Turno</span>
                </button>
              </div>
            </div>
          ) : (
            /* ═════════ PESTAÑA: HISTORIAL DE TURNOS ═════════ */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 font-sora">
                  Últimos turnos cerrados
                </span>
                <button
                  type="button"
                  onClick={cargarHistorial}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cargandoHistorial ? 'animate-spin' : ''}`} />
                  <span>Refrescar</span>
                </button>
              </div>

              {cargandoHistorial ? (
                <div className="p-8 text-center text-xs text-slate-400 font-sora">
                  Cargando historial de turnos...
                </div>
              ) : historialTurnos.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl font-sora">
                  No hay turnos cerrados registrados previamente.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {historialTurnos.map((t) => {
                    const dif = Number(t.diferencia || 0);
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-sora text-slate-800 dark:text-white">
                              Turno #{t.id} • {t.usuario?.nombre || 'Recepcionista'}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                                dif === 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : dif > 0
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {dif === 0 ? 'Exacto' : dif > 0 ? `+S/ ${dif}` : `-S/ ${Math.abs(dif)}`}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {new Date(t.fecha_apertura).toLocaleDateString('es-PE')} •{' '}
                            {new Date(t.fecha_apertura).toLocaleTimeString('es-PE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}{' '}
                            a{' '}
                            {t.fecha_cierre
                              ? new Date(t.fecha_cierre).toLocaleTimeString('es-PE', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="text-right">
                            <span className="font-mono font-black text-slate-800 dark:text-white text-sm block">
                              S/ {Number(t.monto_cierre_real || t.monto_cierre_esperado || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">Total recaudado</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTicketPreviewData({
                                ...t,
                                usuario: t.usuario || { nombre: 'Recepcionista' }
                              });
                              setMostrarModalTicketPreview(true);
                            }}
                            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer flex items-center gap-1 font-bold font-sora text-xs shrink-0"
                            title="Ver e imprimir ticket de este turno en modal"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ticket</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 6. BANNER DE CIERRE EXITOSO CON IMPRESIÓN TÉRMICA Y WHATSAPP */}
          {resumenCierreFinal && (
            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-emerald-900 dark:text-emerald-200 font-sora block text-sm">
                    ¡Arqueo y Cierre de Turno Exitoso!
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                    El turno ha sido liquidado en el sistema y está listo para emitir comprobantes.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleVerTicketCierre}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer font-sora shadow-sm"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Ver Ticket en Modal</span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimirTicketCierre}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer font-sora shadow-sm"
                  title="Imprimir directamente a tiquetera"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimir ({tamanoPapel})</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnviarWhatsApp}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 transition cursor-pointer"
                  title="Enviar reporte por WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Vista Previa de Ticket Térmico de Cierre */}
      <ModalTicketCierre
        isOpen={mostrarModalTicketPreview}
        onClose={() => setMostrarModalTicketPreview(false)}
        cajaData={ticketPreviewData}
        formatoInicial={tamanoPapel}
      />
    </div>,
    document.body
  );
}
