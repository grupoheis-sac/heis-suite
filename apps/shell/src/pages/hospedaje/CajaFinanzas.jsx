import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Clock,
  CircleDollarSign,
  PlusCircle,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Building2,
  RefreshCw,
  ChevronRight,
  Receipt
} from 'lucide-react';
import api from './api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@heis/core';
import { useSettingsStore } from '@heis/core';
import ModalCajaTurno from './components/caja/ModalCajaTurno';
import Facturacion from './Facturacion';

export default function CajaFinanzas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const settings = useSettingsStore();

  const activeTab = searchParams.get('tab') || 'caja'; // 'caja' | 'turnos' | 'cobrar'

  const [loading, setLoading] = useState(true);
  const [turnoData, setTurnoData] = useState({
    turnoActivo: false,
    turno: null,
    resumen: null
  });

  const [historialTurnos, setHistorialTurnos] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);

  // Control del Modal de Acciones (Apertura / Movimientos / Cierre)
  const [modalCajaOpen, setModalCajaOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('resumen');

  const cargarTurnoActual = async () => {
    try {
      setLoading(true);
      const res = await api.get('/caja/turno-actual');
      if (res.data?.success) {
        setTurnoData(res.data);
      }
    } catch (err) {
      console.warn('Error al consultar turno actual:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const res = await api.get('/caja/historial');
      if (res.data?.success) {
        setHistorialTurnos(res.data.historial || []);
      }
    } catch (err) {
      console.warn('Error al cargar historial de turnos:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cargarCuentasPorCobrar = async () => {
    try {
      setLoadingCuentas(true);
      const res = await api.get('/reservas');
      const reservas = res.data?.reservas || res.data || [];
      // Filtrar reservas que tengan saldo pendiente
      const pendientes = reservas.filter((r) => {
        const saldo = Number(r.saldo_pendiente ?? (Number(r.precio_total || 0) - Number(r.monto_adelanto || 0)));
        return saldo > 0 && r.estado !== 'Cancelada' && r.estado !== 'Check-Out';
      });
      setCuentasPorCobrar(pendientes);
    } catch (err) {
      console.warn('Error al cargar cuentas por cobrar:', err);
    } finally {
      setLoadingCuentas(false);
    }
  };

  useEffect(() => {
    cargarTurnoActual();
    if (activeTab === 'turnos') cargarHistorial();
    if (activeTab === 'cobrar') cargarCuentasPorCobrar();

    const handleCajaChanged = () => {
      cargarTurnoActual();
      if (activeTab === 'turnos') cargarHistorial();
    };

    window.addEventListener('caja-status-changed', handleCajaChanged);
    return () => window.removeEventListener('caja-status-changed', handleCajaChanged);
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const abrirModalConTab = (tab) => {
    setModalInitialTab(tab);
    setModalCajaOpen(true);
  };

  const tabs = [
    {
      id: 'caja',
      label: 'Control de Caja Chica',
      mobileLabel: 'Mi Caja',
      icon: Wallet
    },
    {
      id: 'turnos',
      label: 'Turnos y Arqueos Anteriores',
      mobileLabel: 'Historial',
      icon: Clock
    },
    {
      id: 'cobrar',
      label: 'Cuentas por Cobrar a Huéspedes',
      mobileLabel: 'Por Cobrar',
      icon: CircleDollarSign
    },
    {
      id: 'facturas',
      label: 'Comprobantes SUNAT (B001 / F001)',
      mobileLabel: 'SUNAT',
      icon: Receipt
    }
  ];

  const totalPorCobrar = cuentasPorCobrar.reduce((acc, r) => {
    const saldo = Number(r.saldo_pendiente ?? (Number(r.precio_total || 0) - Number(r.monto_adelanto || 0)));
    return acc + (saldo > 0 ? saldo : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* ─── ENCABEZADO CÁPSULA FLOTANTE ULTRA-SLIM ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-xs">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                Caja & Facturación SUNAT
              </h2>
              {turnoData.turnoActivo ? (
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Turno Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Caja Cerrada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Control de caja chica, turnos de recepción, cuentas por cobrar y emisión de comprobantes electrónicos UBL 2.1
            </p>
          </div>
        </div>

        {/* Acciones principales de cabecera */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              cargarTurnoActual();
              if (activeTab === 'turnos') cargarHistorial();
              if (activeTab === 'cobrar') cargarCuentasPorCobrar();
            }}
            disabled={loading}
            title="Refrescar estado de caja"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          {turnoData.turnoActivo ? (
            <>
              <button
                type="button"
                onClick={() => abrirModalConTab('movimiento')}
                className="h-9 px-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-102"
              >
                <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Nuevo Movimiento</span>
              </button>
              <button
                type="button"
                onClick={() => abrirModalConTab('cierre')}
                className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => abrirModalConTab('apertura')}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
            >
              <Wallet className="w-4 h-4" />
              <span>Aperturar Turno</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── BARRA DE PESTAÑAS (TABS RESPONSIVAS NEO-BLUE SAAS) ─── */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabChange(t.id)}
                className={`group relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer select-none active:scale-[0.98] min-w-0 font-sora ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-xs shadow-blue-700/25 ring-1 ring-blue-500/30'
                    : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200/70 dark:border-slate-700/70'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                <span className="hidden sm:inline tracking-tight truncate">
                  {t.label}
                </span>
                <span className="inline sm:hidden tracking-tight truncate text-[11px] font-black">
                  {t.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CONTENIDO DE LA PESTAÑA SELECCIONADA ─── */}
      {activeTab === 'caja' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {loading ? (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : turnoData.turnoActivo ? (
            <>
              {/* Resumen Superior del Turno Activo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Saldo Esperado en Efectivo */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50/60 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 p-5 rounded-3xl border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 tracking-wider font-sora">
                      Efectivo en Cajón
                    </span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-blue-700 dark:text-blue-300 tracking-tight">
                    S/ {Number(turnoData.resumen?.efectivo_esperado ?? 0).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Monto Inicial: <b className="font-mono text-slate-700 dark:text-slate-300">S/ {Number(turnoData.turno?.monto_apertura ?? 0).toFixed(2)}</b>
                  </div>
                </div>

                {/* 2. Cobros de Habitaciones */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider font-sora">
                      Cobros Habitaciones
                    </span>
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                    S/ {Number(turnoData.resumen?.ventas_habitaciones ?? 0).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Ingresos por check-in y estadías
                  </div>
                </div>

                {/* 3. Consumos POS & Minibar */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider font-sora">
                      Consumos & Minibar
                    </span>
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                    S/ {Number(turnoData.resumen?.ventas_pos ?? 0).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Ventas de cafetería y productos
                  </div>
                </div>

                {/* 4. Egresos y Salidas */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider font-sora">
                      Egresos de Caja
                    </span>
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 tracking-tight">
                    S/ {Number(turnoData.resumen?.total_egresos ?? 0).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Compras y gastos menores
                  </div>
                </div>
              </div>

              {/* Ficha de Detalles del Turno y Movimientos */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-slate-100 font-sora">
                      Turno Activo #{turnoData.turno?.id}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Aperturado el {turnoData.turno?.fecha_apertura ? new Date(turnoData.turno.fecha_apertura).toLocaleString('es-PE') : 'Hoy'} por{' '}
                      <b className="text-slate-800 dark:text-slate-200">{turnoData.turno?.usuario?.nombre || user?.nombre || 'Recepción'}</b>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirModalConTab('resumen')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Ver Detalle Completo
                    </button>
                  </div>
                </div>

                {/* Tabla de Movimientos del Turno */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-sora">
                      Movimientos Registrados en este Turno
                    </span>
                    <button
                      type="button"
                      onClick={() => abrirModalConTab('movimiento')}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Registrar movimiento
                    </button>
                  </div>

                  {turnoData.resumen?.movimientos?.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                      {turnoData.resumen.movimientos.map((m, idx) => (
                        <div key={m.id || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              m.tipo === 'ingreso'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}>
                              {m.tipo === 'ingreso' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {m.concepto || (m.tipo === 'ingreso' ? 'Ingreso a caja' : 'Egreso de caja')}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : 'Hoy'} • Método: {m.metodo_pago || 'Efectivo'}
                              </p>
                            </div>
                          </div>
                          <span className={`font-mono font-black text-xs shrink-0 ${
                            m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {m.tipo === 'ingreso' ? '+' : '-'} S/ {Number(m.monto || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 font-medium">
                        No hay movimientos manuales de ingresos o egresos registrados en este turno.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Estado Caja Cerrada */
            <div className="p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 font-sora">
                  La Caja se encuentra actualmente Cerrada
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Apertura el turno de caja con el monto inicial en efectivo para comenzar a registrar cobros de habitaciones, consumos y movimientos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => abrirModalConTab('apertura')}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-600/30 hover:scale-102 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Aperturar Turno de Recepción</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── PESTAÑA: HISTORIAL DE TURNOS ─── */}
      {activeTab === 'turnos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 font-sora">
                Historial de Turnos y Arqueos de Caja
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Registro histórico de cierres de caja, saldos esperados y diferencias de arqueo
              </p>
            </div>
            <button
              type="button"
              onClick={cargarHistorial}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Actualizar historial"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistorial ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-5">
            {loadingHistorial ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : historialTurnos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-sora text-[10px]">
                      <th className="pb-3 font-black">ID</th>
                      <th className="pb-3 font-black">Apertura</th>
                      <th className="pb-3 font-black">Cierre</th>
                      <th className="pb-3 font-black">Responsable</th>
                      <th className="pb-3 font-black text-right">Inicial</th>
                      <th className="pb-3 font-black text-right">Esperado</th>
                      <th className="pb-3 font-black text-right">Real Cierre</th>
                      <th className="pb-3 font-black text-center">Diferencia</th>
                      <th className="pb-3 font-black text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historialTurnos.map((t) => {
                      const dif = Number(t.diferencia || 0);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 font-mono font-black text-slate-800 dark:text-slate-200">
                            #{t.id}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                            {t.fecha_apertura ? new Date(t.fecha_apertura).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                            {t.fecha_cierre ? new Date(t.fecha_cierre).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : 'Abierto'}
                          </td>
                          <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                            {t.usuario?.nombre || 'Recepcionista'}
                          </td>
                          <td className="py-3 font-mono text-right text-slate-700 dark:text-slate-300">
                            S/ {Number(t.monto_apertura || 0).toFixed(2)}
                          </td>
                          <td className="py-3 font-mono text-right text-slate-700 dark:text-slate-300">
                            S/ {Number(t.monto_cierre_sistema || 0).toFixed(2)}
                          </td>
                          <td className="py-3 font-mono font-bold text-right text-slate-900 dark:text-slate-100">
                            {t.monto_cierre_real !== null ? `S/ ${Number(t.monto_cierre_real).toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 text-center">
                            {t.estado === 'Cerrado' ? (
                              dif === 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  Cuadrado
                                </span>
                              ) : dif > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-black text-[10px]">
                                  +S/ {dif.toFixed(2)}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono font-black text-[10px]">
                                  -S/ {Math.abs(dif).toFixed(2)}
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                              t.estado === 'Abierto'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {t.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No hay historial de turnos cerrados todavía.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PESTAÑA: CUENTAS POR COBRAR A HUÉSPEDES ─── */}
      {activeTab === 'cobrar' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900 p-5 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider font-sora">
                Total Pendiente de Cobro
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-900 dark:text-indigo-200 tracking-tight mt-0.5">
                S/ {totalPorCobrar.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {cuentasPorCobrar.length} estadía(s) activas o reservas con saldo pendiente de pago
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              Ir al Rack de Habitaciones
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 font-sora">
                Lista de Saldos Pendientes
              </h3>
            </div>
            <div className="p-5">
              {loadingCuentas ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : cuentasPorCobrar.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {cuentasPorCobrar.map((r) => {
                    const saldo = Number(r.saldo_pendiente ?? (Number(r.precio_total || 0) - Number(r.monto_adelanto || 0)));
                    return (
                      <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-xs">
                              Hab. {r.habitacion?.numero || r.habitacion_id}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                              {r.huesped?.nombre || r.cliente_nombre || 'Huésped'}
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              {r.estado}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Total estadía: S/ {Number(r.precio_total || 0).toFixed(2)} | Adelanto: S/ {Number(r.monto_adelanto || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Saldo Pendiente</span>
                            <span className="font-mono font-black text-rose-600 text-sm">
                              S/ {saldo.toFixed(2)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                            title="Ver en Rack"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ¡Excelente! No hay saldos pendientes de cobro a huéspedes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PESTAÑA 4: COMPROBANTES ELECTRÓNICOS SUNAT ─── */}
      {activeTab === 'facturas' && (
        <div className="animate-in fade-in duration-200">
          <Facturacion isEmbedded={true} />
        </div>
      )}

      {/* ─── MODAL INTEGRADO DE ARQUEO / APERTURA / MOVIMIENTOS ─── */}
      <ModalCajaTurno
        isOpen={modalCajaOpen}
        onClose={() => setModalCajaOpen(false)}
        onTurnoActualizado={() => {
          cargarTurnoActual();
          if (activeTab === 'turnos') cargarHistorial();
        }}
      />
    </div>
  );
}
