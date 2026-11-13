import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@heis/core';
import { useSucursalStore } from '@heis/core';
import api from '../api';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Building2,
  ArrowRight,
  Sparkles,
  PackageX,
  X,
  Layers,
  Check,
  RefreshCw,
  Package,
  ShoppingCart,
  TrendingDown,
  Info,
  Search,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function ModalAccesoAlertas({ isOpen, onClose, isGatekeeper = false }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sucursalActiva } = useSucursalStore();

  const [loadingAlertas, setLoadingAlertas] = useState(true);
  const [alertasData, setAlertasData] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [pestañaActiva, setPestañaActiva] = useState('vencidos'); // 'vencidos' | 'por_vencer' | 'stock_bajo' | 'resumen'
  const [subFiltroVencer, setSubFiltroVencer] = useState('todos'); // 'todos' | 'criticos' | 'preventivos'
  const [busqueda, setBusqueda] = useState('');
  const [puedoCerrar, setPuedoCerrar] = useState(false);

  // Progresión de carga suave en segundo plano y protección anti-clics fantasma
  useEffect(() => {
    if (!isOpen) return;

    // Protección de 350ms para evitar que Enter del Login o clics fantasma cierren el modal
    const timerGuard = setTimeout(() => {
      setPuedoCerrar(true);
    }, 350);

    const cargarDatosSanitarios = async () => {
      setLoadingAlertas(true);
      try {
        const [resAlertas, resCaja] = await Promise.allSettled([
          api.get('/alertas'),
          api.get('/caja/actual')
        ]);

        if (resAlertas.status === 'fulfilled' && resAlertas.value) {
          const d = resAlertas.value?.data || resAlertas.value;
          setAlertasData(d);

          // Seleccionar inteligentemente la pestaña con mayor prioridad clínica
          const numVencidos = d?.alertas?.lotes_vencidos?.length || 0;
          const numCriticos = d?.alertas?.lotes_criticos_30d?.length || 0;
          const numPreventivos = d?.alertas?.lotes_preventivos?.length || 0;
          const numBajo = d?.alertas?.stock_bajo?.length || 0;

          // 1. Vencidos tienen máxima prioridad sanitaria (Inmovilización inmediata)
          if (numVencidos > 0) {
            setPestañaActiva('vencidos');
          } else if (numCriticos > 0 || numPreventivos > 0) {
            setPestañaActiva('por_vencer');
          } else if (numBajo > 0) {
            setPestañaActiva('stock_bajo');
          } else {
            setPestañaActiva('resumen');
          }
        }

        if (resCaja.status === 'fulfilled' && resCaja.value) {
          const c = resCaja.value?.data || resCaja.value;
          setCajaAbierta(Boolean(c?.cajaAbierta));
        }
      } catch (err) {
        console.warn('Error cargando diagnóstico de medicamentos críticos:', err);
      } finally {
        setLoadingAlertas(false);
      }
    };

    cargarDatosSanitarios();

    // Solo cerrar con Escape si ya pasó el tiempo de guardia
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCerrarConDestino('/dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timerGuard);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const lotesVencidos = alertasData?.alertas?.lotes_vencidos || [];
  const lotesCriticos = alertasData?.alertas?.lotes_criticos_30d || [];
  const lotesPreventivos = alertasData?.alertas?.lotes_preventivos || [];
  const stockBajo = alertasData?.alertas?.stock_bajo || [];
  const totalPorVencer = lotesCriticos.length + lotesPreventivos.length;

  const getDiasRestantes = (fechaStr) => {
    if (!fechaStr) return 0;
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const partes = fechaStr.split('-');
      const venc = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
      const diffTime = venc.getTime() - hoy.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Lista unificada y clasificada de medicamentos por vencer (FEFO)
  const todosPorVencer = useMemo(() => {
    const listCriticos = lotesCriticos.map((l) => ({ ...l, nivelAlerta: 'critico' }));
    const listPreventivos = lotesPreventivos.map((l) => ({ ...l, nivelAlerta: 'preventivo' }));
    return [...listCriticos, ...listPreventivos].sort(
      (a, b) => getDiasRestantes(a.fecha_vencimiento) - getDiasRestantes(b.fecha_vencimiento)
    );
  }, [lotesCriticos, lotesPreventivos]);

  // Filtros de búsqueda reactivos
  const q = busqueda.trim().toLowerCase();

  const vencidosFiltrados = useMemo(() => {
    if (!q) return lotesVencidos;
    return lotesVencidos.filter((item) => {
      const nom = (item.medicamento?.nombre_comercial || '').toLowerCase();
      const lab = (item.medicamento?.laboratorio || '').toLowerCase();
      const lote = (item.numero_lote || '').toLowerCase();
      return nom.includes(q) || lab.includes(q) || lote.includes(q);
    });
  }, [lotesVencidos, q]);

  const porVencerFiltrados = useMemo(() => {
    let base = todosPorVencer;
    if (subFiltroVencer === 'criticos') {
      base = todosPorVencer.filter((item) => item.nivelAlerta === 'critico');
    } else if (subFiltroVencer === 'preventivos') {
      base = todosPorVencer.filter((item) => item.nivelAlerta === 'preventivo');
    }
    if (!q) return base;
    return base.filter((item) => {
      const nom = (item.medicamento?.nombre_comercial || '').toLowerCase();
      const lab = (item.medicamento?.laboratorio || '').toLowerCase();
      const lote = (item.numero_lote || '').toLowerCase();
      return nom.includes(q) || lab.includes(q) || lote.includes(q);
    });
  }, [todosPorVencer, subFiltroVencer, q]);

  const stockBajoFiltrado = useMemo(() => {
    if (!q) return stockBajo;
    return stockBajo.filter((med) => {
      const nom = (med.nombre_comercial || '').toLowerCase();
      const conc = (med.concentracion || '').toLowerCase();
      return nom.includes(q) || conc.includes(q);
    });
  }, [stockBajo, q]);

  if (!isOpen) return null;

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const horaActual = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Manejo centralizado de salida del modal con navegación
  const handleCerrarConDestino = (destino = '/dashboard') => {
    if (typeof onClose === 'function') {
      onClose(destino);
    } else {
      navigate(destino);
    }
  };

  const irACuarentena = () => handleCerrarConDestino('/bajas');
  const irALotes = () => handleCerrarConDestino('/lotes');
  const irAMedicamentos = () => handleCerrarConDestino('/medicamentos');
  const irAlDashboard = () => handleCerrarConDestino('/dashboard');
  const irACaja = () => handleCerrarConDestino('/caja');
  const irACompras = () => handleCerrarConDestino('/compras');
  const irAPos = () => handleCerrarConDestino('/pos');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop oscuro con desenfoque de la página de fondo */}
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 cursor-pointer"
        onClick={() => {
          if (puedoCerrar) {
            handleCerrarConDestino('/dashboard');
          }
        }}
      />

      {/* Contenedor Principal del Modal con borde ultra sutil y limpio */}
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-950/20 overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in zoom-in-95 duration-200 border border-slate-200/40 dark:border-slate-800 isolate transform-gpu"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Cabecera Compacta y Luminosa con Degradado Farmacéutico */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-4 sm:px-6 py-3.5 sm:py-4 text-white overflow-hidden shrink-0 shadow-sm rounded-t-2xl sm:rounded-t-3xl">
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-28 -bottom-10 w-32 h-32 bg-emerald-300/20 rounded-full blur-xl pointer-events-none" />

          {/* Botón cerrar flotante con alta prioridad de capas (z-30) y captura táctil garantizada */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCerrarConDestino('/dashboard');
            }}
            className="absolute top-3 sm:top-3.5 right-3.5 sm:right-5 z-30 p-2 rounded-xl bg-white/20 hover:bg-white/30 active:bg-white/40 text-white transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border border-white/25 pointer-events-auto"
            title="Cerrar y abrir Dashboard (Esc)"
            aria-label="Cerrar diagnóstico y abrir Dashboard"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pr-12 sm:pr-14">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 shadow-inner shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 border border-white/30 text-white shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Acceso Verificado
                  </span>
                  <span className="text-white/85 text-[11px] flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" /> {horaActual}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                  Bienvenido, {user?.nombre || 'Usuario'}
                </h2>
              </div>
            </div>

            {/* Badges de Sucursal y Rol */}
            <div className="flex flex-wrap sm:flex-col sm:items-end gap-1 text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/25 font-semibold text-white shadow-xs text-[11px]">
                <Building2 className="w-3 h-3 text-emerald-100" />
                <span className="truncate max-w-[170px]">
                  {sucursalActiva?.nombre ? sucursalActiva.nombre.split('-')[0].trim() : 'Sede Principal'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-900/35 border border-emerald-300/30 text-emerald-100 font-medium text-[10px]">
                <span>Rol: {user?.rol || 'Personal Farmacéutico'}</span>
                {user?.colegiatura_qf && (
                  <span className="text-emerald-200 border-l border-emerald-300/30 pl-1.5 font-bold">
                    CQFP: {user.colegiatura_qf}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Barra de pestañas interactiva (shrink-0) */}
        <div className="bg-slate-50/95 dark:bg-slate-800/90 px-3.5 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 select-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Pestaña 1: Vencidos (Prioridad Sanitaria DIGEMID) */}
            <button
              type="button"
              onClick={() => {
                setPestañaActiva('vencidos');
                setBusqueda('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                pestañaActiva === 'vencidos'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/25 ring-2 ring-rose-400/30'
                  : 'bg-white dark:bg-slate-800 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-900 dark:hover:text-rose-200 border border-slate-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Vencidos</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-black ${
                  pestañaActiva === 'vencidos' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {loadingAlertas ? '...' : lotesVencidos.length}
              </span>
            </button>

            {/* Pestaña 2: Por Vencer (FEFO: Críticos & Preventivos) */}
            <button
              type="button"
              onClick={() => {
                setPestañaActiva('por_vencer');
                setBusqueda('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                pestañaActiva === 'por_vencer' || pestañaActiva === 'criticos'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25 ring-2 ring-amber-400/30'
                  : 'bg-white dark:bg-slate-800 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-200 border border-slate-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Por Vencer</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-black ${
                  pestañaActiva === 'por_vencer' || pestañaActiva === 'criticos'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {loadingAlertas ? '...' : totalPorVencer}
              </span>
            </button>

            {/* Pestaña 3: Stock Bajo */}
            <button
              type="button"
              onClick={() => {
                setPestañaActiva('stock_bajo');
                setBusqueda('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                pestañaActiva === 'stock_bajo'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/25 ring-2 ring-teal-400/30'
                  : 'bg-white dark:bg-slate-800 hover:bg-teal-50/70 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-200 border border-slate-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Stock Bajo</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-black ${
                  pestañaActiva === 'stock_bajo' ? 'bg-teal-800 text-white' : 'bg-teal-100 text-teal-800'
                }`}
              >
                {loadingAlertas ? '...' : stockBajo.length}
              </span>
            </button>

            {/* Pestaña 4: Resumen General */}
            <button
              type="button"
              onClick={() => {
                setPestañaActiva('resumen');
                setBusqueda('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                pestañaActiva === 'resumen'
                  ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Semáforo General</span>
              <span className="sm:hidden">Resumen</span>
            </button>
          </div>

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize hidden md:inline-block">
            {fechaHoy}
          </span>
        </div>

        {/* 3. ÚNICO Contenedor de Scroll Suave para Todo el Cuerpo (flex-1 min-h-0 overflow-y-auto) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 bg-white dark:bg-slate-900">
          {/* ────────────────── VISTA 1: LOTES VENCIDOS ────────────────── */}
          {pestañaActiva === 'vencidos' && (
            <div className="space-y-3">
              {/* Barra superior de encabezado y buscador rápido */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse shrink-0" />
                    Medicamentos con Fecha Vencida (Inmovilización Obligatoria)
                  </h3>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Prohibida su comercialización por normativa DIGEMID. Trasladar al área de Cuarentena.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {lotesVencidos.length > 4 && (
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar medicamento o lote..."
                        className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      {busqueda && (
                        <button
                          type="button"
                          onClick={() => setBusqueda('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {lotesVencidos.length > 0 && (
                    <button
                      type="button"
                      onClick={irACuarentena}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <PackageX className="w-3.5 h-3.5" />
                      <span>Ir a Cuarentena</span>
                    </button>
                  )}
                </div>
              </div>

              {loadingAlertas ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Verificando lotes vencidos...</span>
                </div>
              ) : vencidosFiltrados.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    {busqueda ? 'No se encontraron medicamentos vencidos con esa búsqueda' : '¡Conforme Sanitario! 0 Lotes Vencidos'}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
                    {busqueda
                      ? 'Prueba con otro término de búsqueda o limpia el filtro.'
                      : 'No existen medicamentos expirados en stock de venta. Todo el inventario se encuentra dentro de vigencia.'}
                  </p>
                </div>
              ) : (
                /* Grid responsivo sin max-height rígido para scroll fluido */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-6">
                  {vencidosFiltrados.map((item) => {
                    const dias = getDiasRestantes(item.fecha_vencimiento);
                    const diasAbs = Math.abs(dias);

                    return (
                      <div
                        key={`vencido-card-${item.id}`}
                        className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 dark:from-rose-950/30 dark:via-slate-800/80 dark:to-rose-950/20 border border-rose-200 dark:border-rose-900/50 hover:border-rose-400 dark:hover:border-rose-700 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
                      >
                        <div>
                          {/* Fila 1: Nombre comercial y badge VENCIDO */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4
                                className="font-extrabold text-[13.5px] text-slate-900 dark:text-white group-hover:text-rose-950 dark:group-hover:text-rose-300 transition-colors truncate"
                                title={item.medicamento?.nombre_comercial}
                              >
                                {item.medicamento?.nombre_comercial || 'Medicamento'}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {item.medicamento?.concentracion ? `${item.medicamento.concentracion} • ` : ''}
                                {item.medicamento?.laboratorio || 'Laboratorio'}
                              </p>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                              VENCIDO
                            </span>
                          </div>

                          {/* Fila 2: Chip compacto de Lote y Fecha de Vencimiento */}
                          <div className="mt-2 py-1 px-2 rounded-lg bg-rose-100/60 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              Lote: <strong className="text-slate-950 dark:text-white font-bold">{item.numero_lote}</strong>
                            </span>
                            <span className="text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1">
                              Exp: {item.fecha_vencimiento}
                              <span className="text-[10px] font-normal text-rose-700 dark:text-rose-400">
                                ({diasAbs === 0 ? 'hoy' : `hace ${diasAbs}d`})
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Fila 3: Stock en farmacia y Botón Mover a Cuarentena */}
                        <div className="mt-2.5 pt-2 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between gap-2">
                          <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">
                            Stock:{' '}
                            <span className="text-rose-700 dark:text-rose-400 font-extrabold">
                              {item.stock_cajas} cjs
                            </span>{' '}
                            {item.stock_fraccion > 0 ? `+ ${item.stock_fraccion} un.` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={irACuarentena}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                          >
                            <PackageX className="w-3 h-3" />
                            A Cuarentena
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ────────────────── VISTA 2: LOTES POR VENCER (FEFO CRÍTICOS & PREVENTIVOS) ────────────────── */}
          {(pestañaActiva === 'por_vencer' || pestañaActiva === 'criticos') && (
            <div className="space-y-3">
              {/* Barra superior de encabezado y buscador */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    Medicamentos Próximos a Vencer (Dispensación FEFO)
                  </h3>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Priorizar rotación de salida en mostrador o coordinar canje preventivo con proveedores.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {totalPorVencer > 4 && (
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar medicamento o lote..."
                        className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      {busqueda && (
                        <button
                          type="button"
                          onClick={() => setBusqueda('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={irALotes}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Módulo Lotes</span> <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sub-filtros compactos: Todos / Críticos (<30d) / Preventivos (30-90d) */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl w-fit border border-slate-200/60 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setSubFiltroVencer('todos')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    subFiltroVencer === 'todos'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos ({totalPorVencer})
                </button>
                <button
                  type="button"
                  onClick={() => setSubFiltroVencer('criticos')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    subFiltroVencer === 'criticos'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-amber-800 dark:hover:text-amber-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Críticos (&lt; 30d) ({lotesCriticos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubFiltroVencer('preventivos')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    subFiltroVencer === 'preventivos'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Preventivos (30-90d) ({lotesPreventivos.length})
                </button>
              </div>

              {loadingAlertas ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cargando medicamentos por vencer...</span>
                </div>
              ) : porVencerFiltrados.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    {busqueda ? 'No se encontraron medicamentos con esa búsqueda' : '¡Conforme Sanitario! Sin Lotes Próximos a Vencer'}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
                    {busqueda
                      ? 'Prueba con otro término de búsqueda o limpia el filtro.'
                      : 'Todos los productos farmacéuticos cuentan con amplio margen de vigencia reglamentaria.'}
                  </p>
                </div>
              ) : (
                /* Grid responsivo con altura automática y espacio final */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-6">
                  {porVencerFiltrados.map((item) => {
                    const dias = getDiasRestantes(item.fecha_vencimiento);
                    const esCritico = item.nivelAlerta === 'critico' || dias <= 30;

                    return (
                      <div
                        key={`por-vencer-card-${item.id}`}
                        className={`p-3 sm:p-3.5 rounded-xl bg-gradient-to-br via-white dark:via-slate-800/80 border transition-all flex flex-col justify-between group shadow-2xs hover:shadow-sm ${
                          esCritico
                            ? 'from-amber-50/70 to-amber-50/30 dark:from-amber-950/30 dark:to-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-700'
                            : 'from-blue-50/50 to-blue-50/20 dark:from-blue-950/30 dark:to-blue-950/20 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        <div>
                          {/* Fila 1: Nombre comercial y badge con días */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4
                                className="font-extrabold text-[13.5px] text-slate-900 dark:text-white group-hover:text-amber-950 dark:group-hover:text-amber-300 transition-colors truncate"
                                title={item.medicamento?.nombre_comercial}
                              >
                                {item.medicamento?.nombre_comercial || 'Medicamento'}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {item.medicamento?.concentracion ? `${item.medicamento.concentracion} • ` : ''}
                                {item.medicamento?.laboratorio || 'Laboratorio'}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                                dias <= 0
                                  ? 'bg-rose-600 text-white'
                                  : dias <= 30
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {dias <= 0 ? 'Vence hoy' : dias <= 30 ? `Vence en ${dias}d` : `${dias} días`}
                            </span>
                          </div>

                          {/* Fila 2: Chip compacto de Lote y Fecha */}
                          <div
                            className={`mt-2 py-1 px-2 rounded-lg border flex items-center justify-between text-[11px] ${
                              esCritico
                                ? 'bg-amber-50/70 dark:bg-amber-950/50 border-amber-200/70 dark:border-amber-900/50'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              Lote: <strong className="text-slate-900 dark:text-white font-bold">{item.numero_lote}</strong>
                            </span>
                            <span
                              className={
                                esCritico
                                  ? 'text-amber-800 dark:text-amber-300 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 font-bold'
                              }
                            >
                              Exp: {item.fecha_vencimiento}
                            </span>
                          </div>
                        </div>

                        {/* Fila 3: Stock y Botón Dispensar FEFO */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                          <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">
                            Stock:{' '}
                            <span
                              className={
                                esCritico
                                  ? 'text-amber-900 dark:text-amber-300 font-extrabold'
                                  : 'text-slate-900 dark:text-slate-200 font-extrabold'
                              }
                            >
                              {item.stock_cajas} cjs
                            </span>{' '}
                            {item.stock_fraccion > 0 ? `+ ${item.stock_fraccion} un.` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={irAPos}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 ${
                              esCritico
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Dispensar FEFO
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ────────────────── VISTA 3: STOCK BAJO MÍNIMO ────────────────── */}
          {pestañaActiva === 'stock_bajo' && (
            <div className="space-y-3">
              {/* Barra superior de encabezado y buscador */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    Medicamentos con Quiebre o Stock Bajo Mínimo
                  </h3>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Existencias en o por debajo del punto de reposición. Generar orden de compra.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {stockBajo.length > 4 && (
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar medicamento..."
                        className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      {busqueda && (
                        <button
                          type="button"
                          onClick={() => setBusqueda('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={irAMedicamentos}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Ver Catálogo</span> <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {loadingAlertas ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Comprobando existencias...</span>
                </div>
              ) : stockBajoFiltrado.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    {busqueda ? 'No se encontraron medicamentos con esa búsqueda' : 'Stock Óptimo en Todas las Líneas'}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
                    {busqueda
                      ? 'Prueba con otro término de búsqueda o limpia el filtro.'
                      : 'Ningún medicamento se encuentra actualmente por debajo de su nivel mínimo requerido.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-6">
                  {stockBajoFiltrado.map((med) => {
                    const stockActual = Number(med.stock_cajas) || 0;
                    const stockMin = Number(med.stock_minimo) || 1;
                    const pct = Math.min(Math.round((stockActual / stockMin) * 100), 100);

                    return (
                      <div
                        key={`bajo-${med.id}`}
                        className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-teal-50/60 via-white to-teal-50/30 dark:from-teal-950/30 dark:via-slate-800/80 dark:to-teal-950/20 border border-teal-200 dark:border-teal-900/50 hover:border-teal-400 dark:hover:border-teal-700 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4
                                className="font-extrabold text-[13.5px] text-slate-900 dark:text-white group-hover:text-teal-950 dark:group-hover:text-teal-300 transition-colors truncate"
                                title={med.nombre_comercial}
                              >
                                {med.nombre_comercial}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {med.concentracion ? `${med.concentracion} • ` : ''}
                                {med.presentacion || 'Presentación'}
                              </p>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white shadow-2xs">
                              STOCK BAJO
                            </span>
                          </div>

                          {/* Barra de progreso de stock visual compacta */}
                          <div className="mt-2.5">
                            <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 mb-1">
                              <span>Nivel de reposición:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200/80 dark:border-slate-600">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct <= 25 ? 'bg-rose-500' : pct <= 60 ? 'bg-amber-500' : 'bg-teal-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-teal-100 dark:border-teal-900/40 flex items-center justify-between text-xs">
                          <div className="text-[11.5px]">
                            <span className="text-slate-500 dark:text-slate-400">Actual: </span>
                            <strong className="text-rose-600 dark:text-rose-400 font-extrabold">{stockActual} cjs</strong>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-slate-500 dark:text-slate-400">Mín: {stockMin} cjs</span>
                          </div>
                          <button
                            type="button"
                            onClick={irACompras}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                          >
                            Reponer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ────────────────── VISTA 4: RESUMEN GENERAL & SEMÁFORO ────────────────── */}
          {pestañaActiva === 'resumen' && (
            <div className="space-y-3.5 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 🔴 PRODUCTOS VENCIDOS */}
                <div
                  className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
                    lotesVencidos.length > 0
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 shadow-2xs'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        lotesVencidos.length > 0 ? 'bg-rose-600 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm'
                      }`}
                    >
                      {lotesVencidos.length > 0 ? (
                        <AlertOctagon className="w-5 h-5 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Alerta Sanitaria DIGEMID
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        {lotesVencidos.length > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">{lotesVencidos.length} Lote(s) Vencido(s)</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-300">0 Lotes Vencidos</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lotesVencidos.length > 0
                          ? 'Requiere traslado inmediato a área de Cuarentena.'
                          : 'Todo conforme para venta al público.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 🟡 PRÓXIMOS A VENCER (FEFO) */}
                <div
                  className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
                    totalPorVencer > 0
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60 shadow-2xs'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        totalPorVencer > 0 ? 'bg-amber-500 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm'
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Dispensación FEFO (&lt; 90d)
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        {totalPorVencer > 0 ? (
                          <span className="text-amber-800 dark:text-amber-300">
                            {lotesCriticos.length} Crítico(s) / {lotesPreventivos.length} Preventivo(s)
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-300">Todo al Día (&gt; 90d)</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {totalPorVencer > 0
                          ? 'Priorizar en mostrador de ventas para rotación rápida.'
                          : 'Fechas de vencimiento con margen óptimo.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado de Turno de Caja */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      cajaAbierta ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-amber-500 ring-4 ring-amber-500/20'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Turno de Caja: </span>
                    <strong className={cajaAbierta ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'text-amber-700 dark:text-amber-400 font-black'}>
                      {cajaAbierta ? 'Abierto y Operativo para Ventas' : 'Sin Aperturar para este Turno'}
                    </strong>
                  </div>
                </div>

                {!cajaAbierta && (
                  <button
                    type="button"
                    onClick={irACaja}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Aperturar Caja Ahora
                  </button>
                )}
              </div>

              {/* Guía de Buenas Prácticas Farmacéuticas */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11.5px] text-emerald-900 dark:text-emerald-200">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Cumplimiento BPA (Buenas Prácticas de Almacenamiento):</strong> Mantener los medicamentos bajo método FEFO (primero en expirar, primero en salir) garantiza la inocuidad y eficacia terapéutica dispensada a los pacientes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Pie del Modal con Botones de Acción (shrink-0) */}
        <div className="bg-slate-50/95 dark:bg-slate-800/90 px-4 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 rounded-b-2xl sm:rounded-b-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11.5px]">
              {isGatekeeper
                ? 'Diagnóstico Sanitario DIGEMID obligatorio al iniciar sesión.'
                : 'Pulsa Esc o el botón para volver al sistema.'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={irALotes}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-2xs cursor-pointer"
            >
              Ver Lotes & FEFO
            </button>

            <button
              type="button"
              onClick={irAlDashboard}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs tracking-wide shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 group cursor-pointer active:scale-98"
            >
              <span>{isGatekeeper ? 'Entendido, Abrir Dashboard' : 'Ingresar al Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
