import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import {
  Clock,
  Wallet,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Receipt,
  RotateCcw,
  User,
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  Unlock,
  ChevronRight,
  TrendingUp,
  Smartphone,
  Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketCierreCaja } from './utils/impresionTermica';
import ModalCierreCajaExito from './components/ModalCierreCajaExito';
import ModalTicketArqueo from './components/ModalTicketArqueo';

export default function HistorialCajas() {
  const navigate = useNavigate();
  const settings = useSettingsStore();

  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos'); // 'Todos' | 'Abierta' | 'Cerrada'
  const [rangoRapido, setRangoRapido] = useState('mes'); // 'hoy' | 'ayer' | 'semana' | 'mes' | 'todos'
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal para ver arqueo completo y reimprimir
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Modal para previsualizar y reimprimir ticket térmico de arqueo (80mm / 58mm)
  const [modalTicketArqueoOpen, setModalTicketArqueoOpen] = useState(false);
  const [ticketArqueoData, setTicketArqueoData] = useState(null);
  const [cargandoTicketId, setCargandoTicketId] = useState(null);

  // Calcular fechas según rango rápido
  useEffect(() => {
    const hoy = new Date();
    const formatoFecha = (d) => d.toISOString().split('T')[0];

    if (rangoRapido === 'hoy') {
      const f = formatoFecha(hoy);
      setFechaInicio(f);
      setFechaFin(f);
    } else if (rangoRapido === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      const f = formatoFecha(ayer);
      setFechaInicio(f);
      setFechaFin(f);
    } else if (rangoRapido === 'semana') {
      const semanaAtras = new Date(hoy);
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      setFechaInicio(formatoFecha(semanaAtras));
      setFechaFin(formatoFecha(hoy));
    } else if (rangoRapido === 'mes') {
      const mesAtras = new Date(hoy);
      mesAtras.setDate(mesAtras.getDate() - 30);
      setFechaInicio(formatoFecha(mesAtras));
      setFechaFin(formatoFecha(hoy));
    } else if (rangoRapido === 'todos') {
      setFechaInicio('');
      setFechaFin('');
    }
  }, [rangoRapido]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      if (filtroEstado !== 'Todos') params.estado = filtroEstado;

      const res = await api.get('/caja/historial', { params });
      if (res?.success) {
        setCajas(res.cajas || []);
      }
    } catch (err) {
      console.error('Error al cargar historial de cajas:', err);
      toast.error('No se pudo cargar el historial de cajas y turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [fechaInicio, fechaFin, filtroEstado]);

  // Filtrado en vivo por texto
  const cajasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return cajas;
    const q = busqueda.toLowerCase().trim();
    return cajas.filter((c) => {
      const idStr = String(c.id);
      const cajeroStr = c.usuario?.nombre ? c.usuario.nombre.toLowerCase() : '';
      const obsStr = c.observaciones ? c.observaciones.toLowerCase() : '';
      return idStr.includes(q) || cajeroStr.includes(q) || obsStr.includes(q);
    });
  }, [cajas, busqueda]);

  // Métricas acumuladas del período
  const metricas = useMemo(() => {
    const totalTurnos = cajasFiltradas.length;
    const abiertas = cajasFiltradas.filter((c) => c.estado === 'Abierta').length;
    const cerradas = cajasFiltradas.filter((c) => c.estado === 'Cerrada');
    const cuadrados = cerradas.filter((c) => c.cuadre_estado === 'Cuadrado').length;
    const descuadres = cerradas.filter((c) => c.cuadre_estado !== 'Cuadrado').length;

    const totalVentasEfectivo = cajasFiltradas.reduce((acc, c) => acc + (parseFloat(c.ventas_efectivo) || 0), 0);
    const totalVentasDigital = cajasFiltradas.reduce((acc, c) => acc + (parseFloat(c.ventas_digitales) || 0), 0);
    const totalVentasGeneral = cajasFiltradas.reduce((acc, c) => acc + (parseFloat(c.total_ventas) || 0), 0);
    const totalEgresos = cajasFiltradas.reduce((acc, c) => acc + (parseFloat(c.total_egresos) || 0), 0);

    return {
      totalTurnos,
      abiertas,
      cerradas: cerradas.length,
      cuadrados,
      descuadres,
      totalVentasEfectivo,
      totalVentasDigital,
      totalVentasGeneral,
      totalEgresos
    };
  }, [cajasFiltradas]);

  // Ver arqueo detallado
  const handleVerDetalle = async (idCaja) => {
    try {
      setCargandoDetalle(true);
      const res = await api.get(`/caja/${idCaja}/cierre`);
      if (res?.caja) {
        setCajaSeleccionada(res.caja);
        setModalDetalleOpen(true);
      } else {
        toast.error('No se pudo obtener el detalle de la caja');
      }
    } catch (err) {
      toast.error('Error al consultar detalle del arqueo');
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Reimprimir ticket térmico en modal interactivo (80mm/58mm)
  const handleReimprimirTicket = async (idCaja) => {
    try {
      setCargandoTicketId(idCaja);
      const res = await api.get(`/caja/${idCaja}/cierre`);
      if (res?.caja) {
        setTicketArqueoData({ caja: res.caja, resumen: res.caja });
        setModalTicketArqueoOpen(true);
      } else {
        toast.error('No se pudo obtener el arqueo del turno');
      }
    } catch (err) {
      toast.error('Error al consultar arqueo de caja');
    } finally {
      setCargandoTicketId(null);
    }
  };

  // Exportar auditoría consolidada a Excel / CSV
  const handleExportarExcel = () => {
    if (!cajasFiltradas || cajasFiltradas.length === 0) {
      toast.error('No hay turnos para exportar con el filtro actual');
      return;
    }

    try {
      const headers = [
        'N° Turno',
        'Cajero',
        'Fecha Apertura',
        'Fecha Cierre',
        'Fondo Inicial (S/)',
        'Ventas Efectivo (S/)',
        'Egresos / Gastos (S/)',
        'Abonos Cobrados (S/)',
        'Saldo Esperado (S/)',
        'Saldo Real Contado (S/)',
        'Diferencia Cuadre (S/)',
        'Estado'
      ];

      const rows = cajasFiltradas.map((c) => {
        const mInicial = parseFloat(c.monto_inicial || 0);
        const vEfec = parseFloat(c.total_ventas_efectivo || 0);
        const egre = parseFloat(c.total_egresos || 0);
        const abon = parseFloat(c.total_ingresos_abonos || 0);
        const sEsperado = mInicial + vEfec + abon - egre;
        const sReal = parseFloat(c.monto_final || 0);
        const dif = sReal - sEsperado;

        return [
          `#${c.id}`,
          `"${(c.usuario?.nombre || 'Usuario').replace(/"/g, '""')}"`,
          c.fecha_apertura ? new Date(c.fecha_apertura).toLocaleString('es-PE') : '-',
          c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleString('es-PE') : 'En curso',
          mInicial.toFixed(2),
          vEfec.toFixed(2),
          egre.toFixed(2),
          abon.toFixed(2),
          sEsperado.toFixed(2),
          sReal.toFixed(2),
          dif.toFixed(2),
          c.estado || 'Cerrada'
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `arqueos_turnos_caja_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Reporte consolidado de turnos exportado exitosamente', { icon: '📊' });
    } catch (err) {
      toast.error('Error al exportar reporte de arqueos');
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── PÍLDORA UNIFICADA: IDENTIFICADOR DE HISTORIAL Y ACCESO A CAJA CHICA ─── */}
      <div className="bg-white dark:bg-slate-900 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        {/* Lado izquierdo: Identificador + Título + Status + Info */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs border bg-gradient-to-tr from-indigo-600 to-violet-600 text-white border-indigo-400/20 shadow-indigo-600/20">
            <Clock className="w-4 h-4" />
          </div>

          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight font-sora">
            Historial de Turnos y Arqueos
          </span>

          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Auditoría de Caja
          </span>

          <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
            • Auditoría completa de turnos, ventas mostrador, arqueos y cuadres
          </span>
        </div>

        {/* Lado derecho: Botón Exportar Excel + Botón Gestionar Caja Chica + Divisor + Botón refrescar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportarExcel}
            className="px-3.5 py-2 rounded-xl border border-emerald-300/80 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            title="Exportar auditoría de turnos filtrados a Excel (.csv)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/caja-finanzas?tab=caja')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap"
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>Gestionar Caja Chica</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

          <button
            type="button"
            onClick={cargarHistorial}
            title="Refrescar lista de turnos"
            className="h-8 w-8 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── TARJETAS DE INDICADORES / KPIS (NEO-SAAS) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Turnos Registrados */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between gap-2 relative z-10">
            <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase font-sora truncate">
              Turnos Registrados
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 relative z-10 flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-extrabold font-sora tracking-tight text-slate-900 dark:text-white">
              {metricas.totalTurnos}
            </span>
            {metricas.abiertas > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {metricas.abiertas} Activo{metricas.abiertas === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
            <span className="text-[11px] text-slate-400 truncate">En el rango seleccionado</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Auditoría
            </span>
          </div>
        </div>

        {/* Ventas Efectivo */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between gap-2 relative z-10">
            <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase font-sora truncate">
              Ventas Efectivo
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 relative z-10">
            <span className="text-xl sm:text-2xl font-extrabold font-sora tracking-tight text-emerald-600 dark:text-emerald-400">
              S/ {metricas.totalVentasEfectivo.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
            <span className="text-[11px] text-slate-400 truncate">Cobrado en mostrador POS</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              Efectivo
            </span>
          </div>
        </div>

        {/* Ventas Digitales */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between gap-2 relative z-10">
            <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase font-sora truncate">
              Ventas Digitales
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 relative z-10">
            <span className="text-xl sm:text-2xl font-extrabold font-sora tracking-tight text-indigo-600 dark:text-indigo-400">
              S/ {metricas.totalVentasDigital.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
            <span className="text-[11px] text-slate-400 truncate">Yape, Plin y Tarjetas</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              Digital
            </span>
          </div>
        </div>

        {/* Auditoría Cuadre */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
          <div className="flex items-center justify-between gap-2 relative z-10">
            <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase font-sora truncate">
              Auditoría Cuadre
            </span>
            <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 relative z-10 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold font-sora tracking-tight text-emerald-600 dark:text-emerald-400">
              {metricas.cuadrados} <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">Ok</span>
            </span>
            {metricas.descuadres > 0 && (
              <span className="text-sm font-extrabold text-rose-600 font-sora">
                / {metricas.descuadres} <span className="text-[10px] font-bold font-sans">dif</span>
              </span>
            )}
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
            <span className="text-[11px] text-slate-400 truncate">
              {metricas.descuadres === 0 ? 'Sin discrepancias' : 'Turnos con diferencia'}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              metricas.descuadres === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              {metricas.descuadres === 0 ? '100% Cuadrado' : `${metricas.descuadres} Dif`}
            </span>
          </div>
        </div>
      </div>

      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Botones de Rango Rápido (Variante 1A: Sub-píldoras Blancas Flotantes Ultra-Slim) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'ayer', label: 'Ayer' },
              { id: 'semana', label: 'Últimos 7 Días' },
              { id: 'mes', label: 'Últimos 30 Días' },
              { id: 'todos', label: 'Todo el Historial' }
            ].map((btn) => {
              const isSelected = rangoRapido === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setRangoRapido(btn.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-subpill-active'
                      : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs hover:border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:border-slate-700/60'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Filtro por Estado (Variante 1A: Sub-píldoras Blancas Flotantes Ultra-Slim) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Estado:</span>
            {['Todos', 'Abierta', 'Cerrada'].map((est) => {
              const isSelected = filtroEstado === est;
              return (
                <button
                  key={est}
                  type="button"
                  onClick={() => setFiltroEstado(est)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-subpill-active'
                      : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs hover:border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:border-slate-700/60'
                  }`}
                >
                  {est === 'Abierta' ? '🟢 Abiertas' : est === 'Cerrada' ? '⚪ Cerradas' : 'Todas'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs de Fechas Personalizadas y Búsqueda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cajero, N° de turno o motivo..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setRangoRapido('personalizado');
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setRangoRapido('personalizado');
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ─── TABLA PRINCIPAL DEL HISTORIAL ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400">Consultando historial de cajas y arqueos...</p>
          </div>
        ) : cajasFiltradas.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">No se encontraron turnos de caja</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay registros de apertura o cierre que coincidan con los filtros y fechas seleccionadas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-modal-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3 min-w-[90px]">Turno / Estado</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Cajero</th>
                  <th className="py-2.5 px-3 min-w-[115px]">Horario</th>
                  <th className="py-2.5 px-3 min-w-[85px] text-right">Fondo Inicial</th>
                  <th className="py-2.5 px-3 min-w-[115px] text-right">Ventas Totales</th>
                  <th className="py-2.5 px-3 min-w-[80px] text-right">Egresos</th>
                  <th className="py-2.5 px-3 min-w-[115px] text-right">Saldo (Esp. / Real)</th>
                  <th className="py-2.5 px-3 min-w-[120px] text-center">Cuadre</th>
                  <th className="py-2.5 px-3 min-w-[90px] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                {cajasFiltradas.map((c) => {
                  const esAbierta = c.estado === 'Abierta';
                  const inicial = parseFloat(c.monto_inicial || 0);
                  const ventasEf = parseFloat(c.ventas_efectivo || 0);
                  const ventasDig = parseFloat(c.ventas_digitales || 0);
                  const ventasTot = parseFloat(c.total_ventas || 0);
                  const egresos = parseFloat(c.total_egresos || 0);
                  const esperado = parseFloat(c.monto_final_esperado || 0);
                  const real = c.monto_final_real !== null ? parseFloat(c.monto_final_real || 0) : null;
                  const dif = parseFloat(c.diferencia || 0);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        esAbierta ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* 1. Turno / Estado */}
                      <td className="py-2.5 px-3 whitespace-nowrap min-w-[90px]">
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono font-black text-xs">
                            #{c.id}
                          </span>
                          {esAbierta ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-black leading-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
                              Abierta
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold leading-none">
                              <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              Cerrada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Cajero */}
                      <td className="py-2.5 px-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[11px] flex items-center justify-center shrink-0">
                            {c.usuario?.nombre ? c.usuario.nombre.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[110px]" title={c.usuario?.nombre}>
                              {c.usuario?.nombre || 'Usuario'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block truncate">
                              {c.usuario?.rol || 'Operador'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Horario */}
                      <td className="py-2.5 px-3 whitespace-nowrap min-w-[115px]">
                        <div className="text-[11px] leading-tight space-y-1">
                          <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-1 py-0.2 rounded">
                              AP
                            </span>
                            <span className="font-semibold">{new Date(c.fecha_apertura).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</span>
                            <span className="font-mono text-slate-500 font-bold">{new Date(c.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-1 py-0.2 rounded">
                              CI
                            </span>
                            {c.fecha_cierre ? (
                              <span className="text-slate-600 dark:text-slate-400">
                                <span className="font-semibold">{new Date(c.fecha_cierre).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</span>{' '}
                                <span className="font-mono text-slate-500 font-bold">{new Date(c.fecha_cierre).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-black italic text-[10.5px]">En mostrador</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Fondo Inicial */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap min-w-[85px]">
                        S/ {inicial.toFixed(2)}
                      </td>

                      {/* 5. Ventas Totales */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap min-w-[115px]">
                        <div className="font-extrabold text-slate-800 dark:text-white text-xs">
                          S/ {ventasTot.toFixed(2)}
                        </div>
                        <div className="text-[9.5px] text-slate-400">
                          Ef: S/{ventasEf.toFixed(2)} · Dig: S/{ventasDig.toFixed(2)}
                        </div>
                      </td>

                      {/* 6. Egresos */}
                      <td className="py-2.5 px-3 text-right font-bold text-xs whitespace-nowrap min-w-[80px]">
                        {egresos > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">-S/ {egresos.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">S/ 0.00</span>
                        )}
                      </td>

                      {/* 7. Arqueo (Saldo Esperado vs Real) */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap leading-tight space-y-0.5 min-w-[115px]">
                        <div className="text-xs font-extrabold text-slate-800 dark:text-white">
                          <span className="text-[9px] font-bold text-slate-400 mr-1 uppercase">Esp:</span>
                          S/ {esperado.toFixed(2)}
                        </div>
                        <div className="text-xs font-extrabold">
                          <span className="text-[9px] font-bold text-slate-400 mr-1 uppercase">Real:</span>
                          {real !== null ? (
                            <span className="text-emerald-600 dark:text-emerald-400">S/ {real.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[10.5px]">Pendiente</span>
                          )}
                        </div>
                      </td>

                      {/* 8. Cuadre */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap min-w-[120px]">
                        {esAbierta ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                            En curso
                          </span>
                        ) : Math.abs(dif) < 0.05 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            Cuadrado
                          </span>
                        ) : dif > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs" title={`Sobrante de S/ ${dif.toFixed(2)}`}>
                            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            +S/ {dif.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs" title={`Faltante de S/ ${Math.abs(dif).toFixed(2)}`}>
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            -S/ {Math.abs(dif).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* 9. Acciones */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap min-w-[90px]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleVerDetalle(c.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                            title="Ver Resumen Completo y Arqueo"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={cargandoTicketId === c.id}
                            onClick={() => handleReimprimirTicket(c.id)}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-50"
                            title="Reimprimir Ticket Térmico de Arqueo (80mm/58mm)"
                          >
                            {cargandoTicketId === c.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Printer className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL DETALLE DE CIERRE CON IMPRESIÓN Y DESGLOSE COMPLETO ─── */}
      <ModalCierreCajaExito
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        cajaData={cajaSeleccionada}
      />

      {/* ─── MODAL REIMPRESIÓN TICKET TÉRMICO DE ARQUEO (80MM / 58MM) ─── */}
      <ModalTicketArqueo
        isOpen={modalTicketArqueoOpen}
        onClose={() => setModalTicketArqueoOpen(false)}
        cajaData={ticketArqueoData}
      />
    </div>
  );
}
