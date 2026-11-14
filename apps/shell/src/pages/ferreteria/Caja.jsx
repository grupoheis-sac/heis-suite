import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from './cajaApi';
import toast from 'react-hot-toast';
import { useCajaStore } from './store/cajaStore';
import { useAuthStore } from '@heis/core';
import ModalTicketArqueo from './components/ModalTicketArqueo';
import {
  Wallet,
  PlusCircle,
  MinusCircle,
  Lock,
  Unlock,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  X,
  ShieldCheck,
  Receipt,
  RotateCcw,
  Sparkles,
  Calculator,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Landmark,
  Printer
} from 'lucide-react';
import { imprimirTicketCierreCaja } from './utils/impresionTermica';

const DENOMINACIONES = [
  { valor: 200, tipo: 'billete', label: 'Billetes de S/ 200' },
  { valor: 100, tipo: 'billete', label: 'Billetes de S/ 100' },
  { valor: 50, tipo: 'billete', label: 'Billetes de S/ 50' },
  { valor: 20, tipo: 'billete', label: 'Billetes de S/ 20' },
  { valor: 10, tipo: 'billete', label: 'Billetes de S/ 10' },
  { valor: 5, tipo: 'moneda', label: 'Monedas de S/ 5' },
  { valor: 2, tipo: 'moneda', label: 'Monedas de S/ 2' },
  { valor: 1, tipo: 'moneda', label: 'Monedas de S/ 1' },
  { valor: 0.5, tipo: 'moneda', label: 'Monedas de S/ 0.50' }
];

export default function Caja() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [cajaData, setCajaData] = useState(null);
  const [modalTicketArqueo, setModalTicketArqueo] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Filtro de movimientos
  const [filtroTipoMov, setFiltroTipoMov] = useState('TODOS');

  // Modales
  const [modalApertura, setModalApertura] = useState(false);
  const [montoApertura, setMontoApertura] = useState('100.00');

  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [tipoMov, setTipoMov] = useState('Egreso');
  const [conceptoMov, setConceptoMov] = useState('');
  const [montoMov, setMontoMov] = useState('');

  // Modal Retiro a Bóveda / Remesa de Seguridad
  const [modalBoveda, setModalBoveda] = useState(false);
  const [montoBoveda, setMontoBoveda] = useState('');
  const [motivoBoveda, setMotivoBoveda] = useState('');
  const [custodioBoveda, setCustodioBoveda] = useState('');
  const [guardandoBoveda, setGuardandoBoveda] = useState(false);

  const [modalCierre, setModalCierre] = useState(false);
  const [montoCierre, setMontoCierre] = useState('');
  const [obsCierre, setObsCierre] = useState('');
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const [desgloseEfectivo, setDesgloseEfectivo] = useState(
    DENOMINACIONES.reduce((acc, d) => ({ ...acc, [d.valor]: '' }), {})
  );

  const cargarCaja = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/caja/actual?_t=${Date.now()}`);
      if (res && res.success) {
        setCajaData(res);
      }
    } catch (e) {
      toast.error('Error al cargar estado de caja');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCaja();
    const handleCajaChanged = () => {
      cargarCaja();
    };
    window.addEventListener('caja-status-changed', handleCajaChanged);
    return () => {
      window.removeEventListener('caja-status-changed', handleCajaChanged);
    };
  }, []);

  // Actualizar conteo automático de billetes/monedas
  const totalCalculadoBilletes = useMemo(() => {
    return Object.entries(desgloseEfectivo).reduce((sum, [valorStr, cantStr]) => {
      const cant = parseInt(cantStr, 10) || 0;
      const valor = parseFloat(valorStr) || 0;
      return sum + cant * valor;
    }, 0);
  }, [desgloseEfectivo]);

  const aplicarConteoBilletes = () => {
    setMontoCierre(totalCalculadoBilletes.toFixed(2));
    setMostrarCalculadora(false);
    toast.success(`Monto contado aplicado: S/ ${totalCalculadoBilletes.toFixed(2)}`);
  };

  const handleApertura = async (e) => {
    e.preventDefault();
    try {
      const res = await useCajaStore.getState().aperturarCaja(montoApertura);
      if (res && res.success) {
        toast.success(res.message || 'Caja aperturada con éxito');
        setModalApertura(false);
        cargarCaja();
      } else {
        toast.error(res?.message || 'Error al abrir caja');
      }
    } catch (e) {
      toast.error(e.message || 'Error al abrir caja');
    }
  };

  const handleMovimiento = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/caja/movimiento', {
        id_caja: cajaData.caja.id,
        tipo: tipoMov,
        concepto: conceptoMov,
        monto: montoMov
      });
      if (res.success) {
        toast.success(res.message);
        setModalMovimiento(false);
        setConceptoMov('');
        setMontoMov('');
        cargarCaja();
        useCajaStore.getState().fetchCaja(true);
      }
    } catch (e) {
      toast.error(e.message || 'Error al registrar movimiento');
    }
  };

  const handleCierre = async (e) => {
    e.preventDefault();
    try {
      const res = await useCajaStore.getState().cerrarCaja(
        cajaData.caja.id,
        montoCierre,
        obsCierre
      );
      if (res && res.success) {
        toast.success(res.message || 'Caja cerrada exitosamente');
        setModalCierre(false);
        cargarCaja();
      } else {
        toast.error(res?.message || 'Error al cerrar caja');
      }
    } catch (e) {
      toast.error(e.message || 'Error al cerrar caja');
    }
  };

  const handleBovedaSubmit = async (e) => {
    e.preventDefault();
    if (!montoBoveda || parseFloat(montoBoveda) <= 0) {
      toast.error('Ingrese un monto válido para el retiro a bóveda');
      return;
    }
    setGuardandoBoveda(true);
    try {
      const res = await api.post('/caja/movimiento', {
        id_caja: cajaData.caja.id,
        tipo: 'Egreso',
        concepto: `[BÓVEDA / REMESA] ${motivoBoveda.trim() || 'Retiro a Caja Fuerte / Banco'}${custodioBoveda ? ` - Custodio: ${custodioBoveda.trim()}` : ''}`,
        monto: parseFloat(montoBoveda)
      });
      if (res.success) {
        toast.success('Retiro a Bóveda registrado con éxito');
        setModalBoveda(false);
        setMontoBoveda('');
        setMotivoBoveda('');
        setCustodioBoveda('');
        cargarCaja();
        useCajaStore.getState().fetchCaja(true);
      }
    } catch (err) {
      toast.error(err.message || 'Error al registrar retiro a bóveda');
    } finally {
      setGuardandoBoveda(false);
    }
  };

  const handleImprimirArqueo = () => {
    if (!cajaData?.caja) {
      toast.error('No hay información de caja para emitir el arqueo');
      return;
    }
    setModalTicketArqueo(true);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[350px] bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sora">
            Cargando estado de caja chica...
          </span>
        </div>
      </div>
    );
  }

  const { cajaAbierta, caja, resumen } = cajaData || {};

  const movimientosFiltrados = (caja?.movimientos || []).filter((m) => {
    if (filtroTipoMov === 'TODOS') return true;
    return m.tipo === filtroTipoMov;
  });

  return (
    <div className="space-y-4">
      {/* ─── PÍLDORA UNIFICADA: TURNO EN OPERACIÓN ACTIVA & ACCIONES RÁPIDAS ─── */}
      <div className="bg-white dark:bg-slate-900 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        {/* Lado izquierdo: Identificador de Turno + Estado + Info */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs border ${
              cajaAbierta
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white border-emerald-400/20 shadow-emerald-500/20'
                : 'bg-gradient-to-tr from-slate-700 to-slate-800 text-slate-300 border-slate-600/30'
            }`}
          >
            {cajaAbierta ? <Unlock className="w-4 h-4 animate-pulse" /> : <Lock className="w-4 h-4" />}
          </div>

          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight font-sora">
            {cajaAbierta ? 'Turno en Operación Activa' : 'Caja Cerrada'}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              cajaAbierta
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {cajaAbierta && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
            {cajaAbierta ? 'Turno Abierto' : 'Inactivo'}
          </span>

          <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
            {cajaAbierta
              ? `• Cajero: ${caja.usuario?.nombre || 'Administrador'} • Apertura: ${new Date(caja.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
              : '• Aperture un nuevo turno con saldo inicial para cobros en POS'}
          </span>
        </div>

        {/* Lado derecho: Acciones de Caja (Registrar Gasto, Ingreso Extra, Retiro a Bóveda, Ticket Arqueo, Cerrar Turno) + Divisor + Botón refrescar */}
        <div className="flex items-center gap-2 flex-wrap">
          {cajaAbierta ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setTipoMov('Egreso');
                  setModalMovimiento(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
              >
                <MinusCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Registrar Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoMov('Ingreso');
                  setModalMovimiento(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ingreso Extra</span>
              </button>

              <button
                type="button"
                onClick={() => setModalBoveda(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
                title="Traslado o custodia de efectivo a Caja Fuerte / Banco"
              >
                <Landmark className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>Retiro a Bóveda</span>
              </button>

              <button
                type="button"
                onClick={handleImprimirArqueo}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
                title="Imprimir ticket térmico de arqueo del turno en curso"
              >
                <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Ticket Arqueo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMontoCierre(resumen?.saldo_esperado_efectivo?.toFixed(2) || '');
                  setModalCierre(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Cerrar Turno & Arqueo</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setModalApertura(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Unlock className="w-4 h-4 shrink-0" />
              <span>Aperturar Turno de Caja</span>
            </button>
          )}

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={cargarCaja}
            title="Refrescar estado de caja"
            className="h-8 w-8 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {cajaAbierta ? (
        <div className="space-y-5">
          {/* ─── TARJETAS DE INDICADORES EN VIVO (ESTILO DASHBOARD LIMPIO & ELEGANTE) ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {/* Monto Inicial */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs hover:shadow-md hover:shadow-slate-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-slate-500/10 transition-all" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors font-sora truncate min-w-0">
                    Monto Inicial
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-800 dark:group-hover:bg-slate-700 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-slate-600/25 transition-all duration-200">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate">
                  S/ {resumen?.monto_inicial?.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
                  Apertura turno
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 font-sora shrink-0 whitespace-nowrap">
                  {new Date(caja.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Ventas en Efectivo */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-sora truncate min-w-0">
                    Ventas Efectivo
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sora tracking-tight truncate">
                  S/ {resumen?.ventas_efectivo?.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
                  Digital: S/ {resumen?.ventas_digitales?.toFixed(2)}
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 font-sora shrink-0 whitespace-nowrap">
                  En Caja
                </span>
              </div>
            </div>

            {/* Egresos / Gastos */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors font-sora truncate min-w-0">
                    Egresos / Gastos
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-rose-600/25 transition-all duration-200">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-sora tracking-tight truncate">
                  - S/ {resumen?.egresos?.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
                  Salidas autorizadas
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/80 dark:border-rose-800/60 font-sora shrink-0 whitespace-nowrap">
                  Egresos
                </span>
              </div>
            </div>

            {/* Efectivo Físico Esperado (DESTACADO) */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sora truncate min-w-0">
                    Saldo en Gaveta
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-sora tracking-tight truncate">
                  S/ {resumen?.saldo_esperado_efectivo?.toFixed(2)}
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
                  Neto a cuadrar
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 font-sora shrink-0 whitespace-nowrap">
                  Efectivo Físico
                </span>
              </div>
            </div>
          </div>

          {/* ─── MOVIMIENTOS RECIENTES EN CAJA ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
 <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight ">
                  Movimientos de Caja del Turno
                </h3>
                <p className="text-xs text-slate-400">
                  Historial de entradas y salidas manuales efectuadas durante este período
                </p>
              </div>

              {/* Filtro de movimientos (Estilo Slim Clientes) */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 ml-1.5 hidden sm:inline">
                  Filtrar:
                </span>
                {[
                  { id: 'TODOS', label: 'Todos' },
                  { id: 'Ingreso', label: 'Ingresos' },
                  { id: 'Egreso', label: 'Egresos' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroTipoMov(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filtroTipoMov === f.id
                        ? 'bg-indigo-600 text-white shadow-2xs font-black'
                        : 'bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {movimientosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold">No se registran movimientos manuales con este filtro.</p>
                <p className="text-[11px] text-slate-400">Puedes registrar salidas o ingresos adicionales usando los botones superiores.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {movimientosFiltrados.map((m) => {
                  const esIngreso = m.tipo === 'Ingreso';
                  const esBoveda = m.concepto?.includes('[BÓVEDA / REMESA]');
                  return (
                    <div
                      key={m.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            esBoveda
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                              : esIngreso
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
                          }`}
                        >
                          {esBoveda ? (
                            <Landmark className="w-4.5 h-4.5" />
                          ) : esIngreso ? (
                            <ArrowUpRight className="w-4.5 h-4.5" />
                          ) : (
                            <ArrowDownRight className="w-4.5 h-4.5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {m.concepto}
                            </p>
                            {esBoveda && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                Remesa a Bóveda
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span className="font-sans font-semibold text-slate-500">
                              {m.usuario?.nombre || 'Usuario'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-black text-sm sm:text-base ${
                            esBoveda
                              ? 'text-amber-700 dark:text-amber-400'
                              : esIngreso
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {esIngreso ? '+' : '-'} S/ {parseFloat(m.monto).toFixed(2)}
                        </span>
                        <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                          {esBoveda ? 'Custodia / Bóveda' : m.tipo}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── ESTADO VACÍO (SIN CAJA ABIERTA) ELEGANTE ─── */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-2xs max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-sm">
            <Lock className="w-9 h-9" />
          </div>
 <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight ">
            No hay ningún turno de caja abierto
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-md mx-auto leading-relaxed">
            Para habilitar cobros en efectivo y ventas en el mostrador del POS, aperture el turno ingresando el fondo fijo o saldo inicial disponible en gaveta.
          </p>
          <button
            type="button"
            onClick={() => setModalApertura(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Unlock className="w-4 h-4" />
            <span>Aperturar Turno de Caja</span>
          </button>
        </div>
      )}

      {/* ─── MODAL 1: APERTURA DE CAJA (PORTAL CON BACKDROP COMPLETO) ─── */}
      {modalApertura && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop estático e independiente con blur profesional que cubre el 100% de la ventana */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setModalApertura(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
            onClick={() => setModalApertura(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm sm:max-w-md w-full p-0 overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 my-auto flex flex-col text-left cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shadow-emerald-500/25 shrink-0 border border-emerald-400/20">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
 <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                      Apertura de Turno de Caja
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Fondo fijo o cambio inicial en la gaveta
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalApertura(false)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleApertura} className="p-5 sm:p-6 space-y-4">
                <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
                    Monto Inicial en Efectivo (S/) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={montoApertura}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                    autoFocus
                  />

                  {/* Presets rápidos */}
                  <div className="flex items-center justify-center gap-2 mt-2.5">
                    {[50, 100, 150, 200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMontoApertura(val.toFixed(2))}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 shadow-2xs font-mono"
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalApertura(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
 className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95 transition-all "
                  >
                    Confirmar Apertura
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 2: MOVIMIENTO (REGISTRAR GASTO / INGRESO EXTRA CON PORTAL) ─── */}
      {modalMovimiento && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop estático e independiente con blur profesional que cubre el 100% de la ventana */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setModalMovimiento(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
            onClick={() => setModalMovimiento(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm sm:max-w-md w-full p-0 overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 my-auto flex flex-col text-left cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0 border ${
                      tipoMov === 'Egreso'
                        ? 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/25 border-rose-400/20'
                        : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 border-emerald-400/20'
                    }`}
                  >
                    {tipoMov === 'Egreso' ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
 <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {tipoMov === 'Egreso' ? 'Registrar Egreso / Gasto' : 'Registrar Ingreso Extra'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {tipoMov === 'Egreso'
                        ? 'Salida menor de efectivo directo de gaveta'
                        : 'Inyección o ingreso adicional a la caja chica'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalMovimiento(false)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleMovimiento} className="p-5 sm:p-6 space-y-4">
                <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
                    Concepto / Motivo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      tipoMov === 'Egreso'
                        ? 'Ej. Pago flete local, materiales de limpieza, viáticos'
                        : 'Ej. Sencillo adicional para cambio, fondo extra'
                    }
                    value={conceptoMov}
                    onChange={(e) => setConceptoMov(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    autoFocus
                  />
                </div>

                <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
                    Monto en Efectivo (S/) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.00"
                    value={montoMov}
                    onChange={(e) => setMontoMov(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-2xl font-mono font-black text-center focus:outline-none focus:ring-2 shadow-2xs ${
                      tipoMov === 'Egreso'
                        ? 'text-rose-600 dark:text-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalMovimiento(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
 className={`px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md cursor-pointer active:scale-95 transition-all ${
                      tipoMov === 'Egreso'
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25'
                    }`}
                  >
                    Confirmar {tipoMov === 'Egreso' ? 'Egreso' : 'Ingreso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 3: CIERRE DE CAJA Y ARQUEO FÍSICO (PORTAL CON CABECERA Y PIE FIJOS) ─── */}
      {modalCierre && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop estático e independiente con blur profesional que cubre el 100% de la ventana */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setModalCierre(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
            onClick={() => setModalCierre(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md sm:max-w-lg w-full p-0 overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 my-auto flex flex-col text-left cursor-default max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal (Fija) */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
 <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                      Cierre de Caja y Arqueo Físico
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Cuadre final de efectivo en gaveta y cierre de turno
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalCierre(false)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Formulario Scrolleable */}
              <form onSubmit={handleCierre} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 sm:p-6 space-y-4">
                  {/* Tarjeta de Saldo Teórico */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block font-sora">
                        Saldo Teórico en Gaveta:
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Ventas Efectivo + Apertura - Egresos
                      </span>
                    </div>
                    <span className="text-xl font-black font-mono text-indigo-950 dark:text-indigo-200">
                      S/ {resumen?.saldo_esperado_efectivo?.toFixed(2)}
                    </span>
                  </div>

                  {/* Input de Monto Contado */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 ">
                        Monto Físico Contado (S/) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer "
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{mostrarCalculadora ? 'Ocultar desglose' : 'Contar billetes y monedas'}</span>
                      </button>
                    </div>

                    <input
                      type="number"
                      step="0.01"
                      required
                      value={montoCierre}
                      onChange={(e) => setMontoCierre(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-2xl font-mono font-black text-slate-900 dark:text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                      autoFocus
                    />

                    {/* Diferencia en vivo */}
                    {montoCierre && (
                      <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Diferencia de Cuadre:</span>
                        {(() => {
                          const diff = parseFloat(montoCierre) - (resumen?.saldo_esperado_efectivo || 0);
                          if (Math.abs(diff) < 0.01) {
                            return <span className="font-bold text-emerald-600 dark:text-emerald-400">Cuadre exacto (S/ 0.00)</span>;
                          }
                          if (diff > 0) {
                            return <span className="font-bold text-indigo-600 dark:text-indigo-400">Sobrante +S/ {diff.toFixed(2)}</span>;
                          }
                          return <span className="font-bold text-rose-600 dark:text-rose-400">Faltante -S/ {Math.abs(diff).toFixed(2)}</span>;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* ─── CALCULADORA DE BILLETES Y MONEDAS ─── */}
                  {mostrarCalculadora && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 font-sora">
                          Desglose Físico de Billetes y Monedas
                        </span>
                        <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                          Total: S/ {totalCalculadoBilletes.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {DENOMINACIONES.map((d) => (
                          <div key={d.valor} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 font-sora">
                              S/ {d.valor >= 1 ? d.valor : '0.50'}
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={desgloseEfectivo[d.valor] || ''}
                              onChange={(e) =>
                                setDesgloseEfectivo({ ...desgloseEfectivo, [d.valor]: e.target.value })
                              }
                              className="w-14 text-center py-1 px-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={aplicarConteoBilletes}
 className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs active:scale-95 "
                      >
                        Aplicar desglose físico al arqueo
                      </button>
                    </div>
                  )}

                  {/* Observaciones */}
                  <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
                      Observaciones de Cierre (Opcional)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Detalles sobre el arqueo, entrega de turno o justificación de diferencias..."
                      value={obsCierre}
                      onChange={(e) => setObsCierre(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none shadow-2xs"
                    />
                  </div>
                </div>

                {/* Pie Fijo del Modal */}
                <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-b-3xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalCierre(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
 className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs shadow-md shadow-indigo-600/25 cursor-pointer active:scale-95 transition-all "
                  >
                    Confirmar y Cerrar Caja
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL RETIRO A BÓVEDA / CAJA FUERTE ─── */}
      {modalBoveda && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setModalBoveda(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
            onClick={() => setModalBoveda(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm sm:max-w-md w-full p-0 overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 my-auto flex flex-col text-left cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/90 dark:bg-amber-950/50 rounded-t-3xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs shadow-amber-500/25 shrink-0 border border-amber-400/20">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
 <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                      Retiro a Bóveda / Remesa
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Traslado seguro a caja fuerte o depósito bancario
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalBoveda(false)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBovedaSubmit} className="p-5 sm:p-6 space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p>
                    Efectivo estimado en gaveta: <strong>S/ {resumen?.saldo_esperado_efectivo?.toFixed(2) || '0.00'}</strong>.
                    Este retiro disminuirá el efectivo físico de la caja chica y quedará auditado con sello de remesa.
                  </p>
                </div>

                <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
                    Monto a Trasladar a Bóveda (S/) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    min="1"
                    placeholder="Ej. 1000.00"
                    value={montoBoveda}
                    onChange={(e) => setMontoBoveda(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xl font-mono font-black text-amber-700 dark:text-amber-400 text-center focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                    autoFocus
                  />
                </div>

                <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
                    Motivo o Destino <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Exceso de efectivo - Traslado a Caja Fuerte / Banco"
                    value={motivoBoveda}
                    onChange={(e) => setMotivoBoveda(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
                    Custodio / Responsable que recibe el dinero
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Gerente / Administrador / Propietario"
                    value={custodioBoveda}
                    onChange={(e) => setCustodioBoveda(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalBoveda(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoBoveda}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Landmark className="w-4 h-4" />
                    <span>{guardandoBoveda ? 'Registrando...' : 'Confirmar Retiro a Bóveda'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL TICKET ARQUEO EN VIVO ─── */}
      <ModalTicketArqueo
        isOpen={modalTicketArqueo}
        onClose={() => setModalTicketArqueo(false)}
        cajaData={cajaData}
        usuario={user}
      />
    </div>
  );
}
