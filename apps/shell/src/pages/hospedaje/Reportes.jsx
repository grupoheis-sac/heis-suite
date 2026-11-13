import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  Printer,
  BedDouble,
  DollarSign,
  Percent,
  Clock,
  Users,
  Store,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  Crown,
  ChevronDown,
  PieChart,
  CheckCircle2,
  CalendarDays,
  Star,
  Heart,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from './api';
import { useSucursalStore } from '@heis/core';
import Dashboard from './Dashboard';

export default function Reportes() {
  const { sedeActiva } = useSucursalStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMainTab = searchParams.get('tab') || 'dashboard'; // 'dashboard' | 'reportes'

  // Rango de fechas
  const hoyObj = new Date();
  const hoyStr = hoyObj.toISOString().split('T')[0];
  const hace30Obj = new Date(hoyObj);
  hace30Obj.setDate(hace30Obj.getDate() - 29);
  const hace30Str = hace30Obj.toISOString().split('T')[0];

  const [fechaDesde, setFechaDesde] = useState(hace30Str);
  const [fechaHasta, setFechaHasta] = useState(hoyStr);
  const [rangoRapido, setRangoRapido] = useState('30d'); // 'hoy', '7d', '30d', 'mes_actual', 'mes_anterior', 'personalizado'

  // Estados de datos
  const [dataReporte, setDataReporte] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pestaña de análisis activo
  const [tabActiva, setTabActiva] = useState('tendencia'); // 'tendencia', 'habitaciones', 'canales', 'pos'

  // Métrica del gráfico de tendencia
  const [metricaGrafico, setMetricaGrafico] = useState('ocupacion'); // 'ocupacion' | 'ingresos' | 'adr'
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    if (activeMainTab === 'reportes') {
      cargarReporte();
    }
  }, [fechaDesde, fechaHasta, activeMainTab]);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reportes/rendimiento', {
        params: {
          desde: fechaDesde,
          hasta: fechaHasta
        }
      });
      if (res.data?.success) {
        setDataReporte(res.data);
      }
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      toast.error('No se pudo generar el reporte de rendimiento.');
    } finally {
      setLoading(false);
    }
  };

  const aplicarRangoRapido = (tipo) => {
    setRangoRapido(tipo);
    const hoy = new Date();
    const hoyYMD = hoy.toISOString().split('T')[0];

    if (tipo === 'hoy') {
      setFechaDesde(hoyYMD);
      setFechaHasta(hoyYMD);
    } else if (tipo === '7d') {
      const hace7 = new Date(hoy);
      hace7.setDate(hace7.getDate() - 6);
      setFechaDesde(hace7.toISOString().split('T')[0]);
      setFechaHasta(hoyYMD);
    } else if (tipo === '30d') {
      const hace30 = new Date(hoy);
      hace30.setDate(hace30.getDate() - 29);
      setFechaDesde(hace30.toISOString().split('T')[0]);
      setFechaHasta(hoyYMD);
    } else if (tipo === 'mes_actual') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      setFechaDesde(primerDia);
      setFechaHasta(hoyYMD);
    } else if (tipo === 'mes_anterior') {
      const primerDiaAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0];
      const ultimoDiaAnt = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().split('T')[0];
      setFechaDesde(primerDiaAnt);
      setFechaHasta(ultimoDiaAnt);
    }
  };

  const kpis = dataReporte?.kpis || {
    ingresos_totales: 0,
    ingresos_habitaciones: 0,
    ingresos_pos: 0,
    ingresos_servicios: 0,
    total_pagos_recaudados: 0,
    total_noches_vendidas: 0,
    tasa_ocupacion_promedio: 0,
    adr: 0,
    revpar: 0,
    alos: 1.0,
    total_reservas: 0,
    total_huespedes: 0
  };

  const serieTemporal = dataReporte?.serieTemporal || [];
  const rendimientoTipos = dataReporte?.rendimientoTipos || [];
  const topHabitaciones = dataReporte?.topHabitaciones || [];
  const canales = dataReporte?.canales || [];
  const topConsumos = dataReporte?.topConsumos || [];
  const metodosPago = dataReporte?.metodosPago || { desglose: {}, total: 0 };
  const satisfaccion = dataReporte?.satisfaccion || {
    total_evaluaciones: 0,
    promedio_general: 5.0,
    promedio_limpieza: 5.0,
    promedio_atencion: 5.0,
    promedio_confort: 5.0,
    nps_score: 100,
    promotores: 0,
    pasivos: 0,
    detractores: 0,
    ultimas_resenas: []
  };

  // Exportar a CSV
  const exportarCSV = () => {
    if (!serieTemporal || serieTemporal.length === 0) {
      toast.error('No hay datos para exportar.');
      return;
    }

    const headers = [
      'Fecha',
      'Habitaciones Ocupadas',
      'Tasa Ocupación (%)',
      'Ingresos Habitaciones (S/)',
      'Ingresos POS (S/)',
      'Ingresos Totales (S/)',
      'ADR (S/)',
      'RevPAR (S/)'
    ];

    const rows = serieTemporal.map((d) => [
      d.fecha,
      d.ocupadas,
      `${d.tasa_ocupacion}%`,
      d.ingresos_habitaciones.toFixed(2),
      d.ingresos_pos.toFixed(2),
      d.ingresos_total.toFixed(2),
      d.adr.toFixed(2),
      d.revpar.toFixed(2)
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_hotel_${fechaDesde}_al_${fechaHasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Reporte exportado en formato CSV');
  };

  const handleImprimir = () => {
    window.print();
  };

  // Escala para gráfico de barras
  const maxVal = useMemo(() => {
    if (serieTemporal.length === 0) return 100;
    if (metricaGrafico === 'ocupacion') return 100;
    return Math.max(...serieTemporal.map((d) => d[metricaGrafico === 'ingresos' ? 'ingresos_total' : 'adr'] || 0), 50);
  }, [serieTemporal, metricaGrafico]);

  return (
    <div className="space-y-5">
      {/* ─── NAVEGADOR PRINCIPAL DE MODO: DASHBOARD EN VIVO VS REPORTES HISTÓRICOS ─── */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="grid grid-cols-2 gap-1.5 font-sora">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'dashboard' })}
            className={`group relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
              activeMainTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-xs shadow-blue-700/25 ring-1 ring-blue-500/30'
                : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200/70 dark:border-slate-700/70'
            }`}
          >
            <BarChart3 className={`w-4 h-4 shrink-0 ${activeMainTab === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
            <span className="truncate">Dashboard Ejecutivo</span>
            <span
              className={`text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                activeMainTab === 'dashboard'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              En Vivo
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'reportes' })}
            className={`group relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
              activeMainTab === 'reportes'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-xs shadow-blue-700/25 ring-1 ring-blue-500/30'
                : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200/70 dark:border-slate-700/70'
            }`}
          >
            <TrendingUp className={`w-4 h-4 shrink-0 ${activeMainTab === 'reportes' ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
            <span className="truncate">Reportes & Analítica</span>
            <span
              className={`text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                activeMainTab === 'reportes'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}
            >
              Histórico
            </span>
          </button>
        </div>
      </div>

      {activeMainTab === 'dashboard' ? (
        <div className="animate-in fade-in duration-200">
          <Dashboard isEmbedded={true} />
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* ─── ENCABEZADO CÁPSULA FLOTANTE ULTRA-SLIM ─── */}
          <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                Reportes & Analítica Hotelera
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Inteligencia Hotelera
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Ocupación histórica, RevPAR, ADR, producción por habitaciones y rentabilidad de canales
            </p>
          </div>
        </div>

        {/* Acciones principales: Exportar & Imprimir */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={exportarCSV}
            disabled={loading}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="Descargar archivo CSV compatible con Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          <button
            type="button"
            onClick={handleImprimir}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            title="Imprimir informe oficial"
          >
            <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            type="button"
            onClick={cargarReporte}
            disabled={loading}
            className="p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="Actualizar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── SELECTOR INTELIGENTE DE RANGO DE FECHAS ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Botones de Rango Rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 custom-modal-scroll">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora mr-1 shrink-0">
            Período:
          </span>
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: '7d', label: '7 Días' },
            { id: '30d', label: '30 Días' },
            { id: 'mes_actual', label: 'Este Mes' },
            { id: 'mes_anterior', label: 'Mes Pasado' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => aplicarRangoRapido(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                rangoRapido === t.id
                  ? 'bg-blue-600 text-white shadow-2xs font-black'
                  : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Inputs de fecha desde / hasta */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2 font-sora">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setRangoRapido('personalizado');
                setFechaDesde(e.target.value);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
            />
            <span className="text-[10px] font-black uppercase text-slate-400 px-1 font-sora">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              min={fechaDesde}
              onChange={(e) => {
                setRangoRapido('personalizado');
                setFechaHasta(e.target.value);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ─── 6 TARJETAS MAESTRAS DE RENDIMIENTO HOTELERO (KPIs) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Ingresos Totales */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">Ingresos Totales</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            S/ {Number(kpis.ingresos_totales || 0).toFixed(2)}
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium block mt-0.5">
            Hab: S/ {Number(kpis.ingresos_habitaciones || 0).toFixed(0)} • POS: S/ {Number(kpis.ingresos_pos || 0).toFixed(0)}
          </span>
        </div>

        {/* 2. Tasa de Ocupación */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">Ocupación Media</span>
            <Percent className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
            {Number(kpis.tasa_ocupacion_promedio || 0)}%
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium block mt-0.5">
            {kpis.total_noches_vendidas} noches vendidas
          </span>
        </div>

        {/* 3. ADR (Average Daily Rate) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1" title="Tarifa Promedio Diaria = Ingreso habs / Noches vendidas">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">ADR (Tarifa Med.)</span>
            <BedDouble className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            S/ {Number(kpis.adr || 0).toFixed(2)}
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium block mt-0.5">
            por noche ocupada
          </span>
        </div>

        {/* 4. RevPAR (Revenue Per Available Room) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1" title="Ingreso por Habitación Disponible = Ingresos habs / Capacidad total">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">RevPAR (Eficiencia)</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            S/ {Number(kpis.revpar || 0).toFixed(2)}
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium block mt-0.5">
            por hab. disponible
          </span>
        </div>

        {/* 5. ALOS (Average Length of Stay) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1" title="Estadía Promedio en Noches">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">ALOS (Estadía)</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
            {kpis.alos}
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium block mt-0.5">
            noches por reserva
          </span>
        </div>

        {/* 6. Huéspedes Recibidos */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">Huéspedes</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white">
            {kpis.total_huespedes}
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium block mt-0.5">
            en {kpis.total_reservas} estancias
          </span>
        </div>
      </div>

      {/* ─── PESTAÑAS DE VISTA ANALÍTICA ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto custom-modal-scroll">
        {[
          { id: 'tendencia', label: 'Evolución Diaria & Gráficos', icon: BarChart3 },
          { id: 'habitaciones', label: 'Producción por Habitaciones', icon: BedDouble },
          { id: 'canales', label: 'Canales de Reserva & Pagos', icon: PieChart },
          { id: 'pos', label: 'Consumos POS & Minibar', icon: Store },
          { id: 'satisfaccion', label: 'Calidad & Encuestas NPS', icon: Star }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tabActiva === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTabActiva(t.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-pill-active font-black'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── CONTENIDO DE LA PESTAÑA ACTIVA ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 font-sora uppercase tracking-wider">
            Consolidando analítica hotelera del período...
          </span>
        </div>
      ) : tabActiva === 'tendencia' ? (
        /* ═════ TAB 1: TENDENCIA TEMPORAL Y GRÁFICO DIARIO ═════ */
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white font-sora">
                  Evolución Temporal del Período
                </h3>
                <p className="text-xs text-slate-400">
                  Desglose día a día de ocupación y facturación
                </p>
              </div>

              {/* Selector de métrica */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMetricaGrafico('ocupacion')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    metricaGrafico === 'ocupacion'
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  % Ocupación
                </button>
                <button
                  type="button"
                  onClick={() => setMetricaGrafico('ingresos')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    metricaGrafico === 'ingresos'
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Ingresos (S/)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricaGrafico('adr')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    metricaGrafico === 'adr'
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ADR Diario
                </button>
              </div>
            </div>

            {/* Gráfico de Barras Interactivo */}
            <div className="h-56 sm:h-64 flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 px-2 overflow-x-auto custom-modal-scroll">
              {serieTemporal.map((d, idx) => {
                const val = metricaGrafico === 'ocupacion'
                  ? d.tasa_ocupacion
                  : (metricaGrafico === 'ingresos' ? d.ingresos_total : d.adr);

                const heightPct = Math.min(100, Math.max(8, (val / maxVal) * 100));
                const isHovered = hoverIndex === idx;

                return (
                  <div
                    key={d.fecha}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                    className="flex-1 min-w-[28px] max-w-[42px] h-full flex flex-col items-center justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip flotante */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] rounded-xl px-2.5 py-1.5 shadow-xl whitespace-nowrap z-30 pointer-events-none">
                        <div className="font-bold">{d.label} ({d.fecha})</div>
                        <div>Ocupación: <span className="text-blue-400 font-bold">{d.tasa_ocupacion}%</span> ({d.ocupadas} hab.)</div>
                        <div>Ingresos: <span className="text-emerald-400 font-bold">S/ {d.ingresos_total.toFixed(2)}</span></div>
                        <div>ADR: <span className="text-indigo-400 font-bold">S/ {d.adr.toFixed(2)}</span></div>
                      </div>
                    )}

                    {/* Barra */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        metricaGrafico === 'ocupacion'
                          ? (d.tasa_ocupacion >= 80 ? 'bg-gradient-to-t from-emerald-600 to-teal-400' : 'bg-gradient-to-t from-blue-600 to-indigo-500')
                          : (metricaGrafico === 'ingresos' ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-indigo-600 to-purple-400')
                      } ${isHovered ? 'brightness-125 scale-x-105' : 'opacity-90 hover:opacity-100'}`}
                    />

                    {/* Etiqueta del día */}
                    <span className="text-[9.5px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                      {d.label.split(' ')[1] || d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla Desglose Día por Día */}
          <div className="rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sora">
                Detalle Diario Consolidado
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10.5px] uppercase font-sora border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-center">Hab. Ocupadas</th>
                    <th className="py-3 px-4 text-center">% Ocupación</th>
                    <th className="py-3 px-4 text-right">Habitaciones (S/)</th>
                    <th className="py-3 px-4 text-right">POS Minibar (S/)</th>
                    <th className="py-3 px-4 text-right">Total Generado (S/)</th>
                    <th className="py-3 px-4 text-right">ADR</th>
                    <th className="py-3 px-4 text-right">RevPAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {serieTemporal.map((d) => (
                    <tr key={d.fecha} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-white">
                        {d.fecha} <span className="text-slate-400 font-normal">({d.label})</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold">
                        {d.ocupadas}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          d.tasa_ocupacion >= 75
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {d.tasa_ocupacion}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-200">
                        S/ {d.ingresos_habitaciones.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                        S/ {d.ingresos_pos.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        S/ {d.ingresos_total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        S/ {d.adr.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        S/ {d.revpar.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tabActiva === 'habitaciones' ? (
        /* ═════ TAB 2: PRODUCCIÓN POR TIPO Y HABITACIONES ═════ */
        <div className="space-y-4">
          {/* Tipos de Habitación */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft space-y-3">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white font-sora">
              Rendimiento por Categoría / Tipo de Habitación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rendimientoTipos.map((t) => (
                <div
                  key={t.tipo_id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 dark:text-white text-xs font-sora">
                      {t.nombre}
                    </span>
                    <span className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400">
                      {t.total_habitaciones} habs.
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      S/ {t.ingresos_totales.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {t.noches_vendidas} noches
                    </span>
                  </div>

                  {/* Barra de Ocupación */}
                  <div>
                    <div className="flex justify-between text-[10.5px] font-semibold text-slate-400 mb-1">
                      <span>Ocupación: {t.tasa_ocupacion}%</span>
                      <span>ADR: S/ {t.adr.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, t.tasa_ocupacion)}%` }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Habitaciones Más Rentables */}
          <div className="rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white font-sora">
                  Top 10 Habitaciones Más Rentables del Período
                </h4>
                <p className="text-[11px] text-slate-400">Ranking por ingresos totales generados</p>
              </div>
              <Crown className="w-5 h-5 text-amber-500" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10.5px] uppercase font-sora border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ranking</th>
                    <th className="py-3 px-4">Habitación</th>
                    <th className="py-3 px-4">Tipo & Piso</th>
                    <th className="py-3 px-4 text-center">Noches Ocupadas</th>
                    <th className="py-3 px-4 text-center">% Ocupación</th>
                    <th className="py-3 px-4 text-right">Ingresos Generados (S/)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topHabitaciones.map((h, i) => (
                    <tr key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                      <td className="py-3 px-4 font-bold font-mono">
                        <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs font-black ${
                          i === 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : (i === 1 ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' : 'text-slate-500')
                        }`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-blue-600 dark:text-blue-400 text-sm">
                        Hab. {h.numero}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {h.tipo} • Piso {h.piso}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {h.noches_ocupadas}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {h.tasa_ocupacion}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        S/ {h.ingresos_totales.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tabActiva === 'canales' ? (
        /* ═════ TAB 3: CANALES DE VENTA & MÉTODOS DE PAGO ═════ */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Canales de Procedencia */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white font-sora">
                Procedencia de Reservas (Canales)
              </h3>
              <p className="text-xs text-slate-400">Distribución de clientes por canal de origen</p>
            </div>

            <div className="space-y-3">
              {canales.map((c) => (
                <div key={c.canal} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800 dark:text-white font-sora">
                      {c.label}
                    </span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      S/ {c.ingresos.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>{c.reservas} reservas registradas</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{c.porcentaje}% del total</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, c.porcentaje)}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white font-sora">
                Métodos de Pago Recaudados
              </h3>
              <p className="text-xs text-slate-400">Total cobrado en caja y bancos durante el período</p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block font-sora">
                Total Pagos Registrados
              </span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-300">
                S/ {metodosPago.total.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { key: 'efectivo', label: 'Efectivo', color: 'emerald' },
                { key: 'yape', label: 'Yape', color: 'purple' },
                { key: 'plin', label: 'Plin', color: 'sky' },
                { key: 'tarjeta_debito', label: 'Tarjeta Débito', color: 'blue' },
                { key: 'tarjeta_credito', label: 'Tarjeta Crédito', color: 'indigo' },
                { key: 'transferencia', label: 'Transferencia', color: 'amber' }
              ].map((m) => (
                <div key={m.key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">{m.label}</span>
                  <span className="font-black text-slate-800 dark:text-white text-sm">
                    S/ {(metodosPago.desglose[m.key] || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ═════ TAB 4: CONSUMOS POS & MINIBAR ═════ */
        <div className="rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white font-sora">
                Top 10 Productos Más Consumidos en Habitaciones
              </h4>
              <p className="text-[11px] text-slate-400">Minibar, room service y servicios adicionales cargados</p>
            </div>
            <Store className="w-5 h-5 text-blue-500" />
          </div>

          {topConsumos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No se registraron consumos adicionales en las habitaciones durante este período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10.5px] uppercase font-sora border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Producto / Servicio</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center">Unidades Consumidas</th>
                    <th className="py-3 px-4 text-right">Total Facturado (S/)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topConsumos.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">#{i + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{c.concepto}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {c.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">{c.cantidad}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        S/ {c.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── PESTAÑA: CALIDAD & ENCUESTAS NPS ─── */}
      {tabActiva === 'satisfaccion' && (
        <div className="space-y-6">
          {/* Métricas Principales de Calidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Promoter Score (NPS) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Net Promoter Score (NPS)
                </span>
                <span className={`text-2xl font-black mt-1 block font-mono ${
                  satisfaccion.nps_score >= 50
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : satisfaccion.nps_score >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {satisfaccion.nps_score > 0 ? `+${satisfaccion.nps_score}` : satisfaccion.nps_score}
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {satisfaccion.nps_score >= 70 ? '🌟 Nivel de Excelencia' : satisfaccion.nps_score >= 50 ? '✓ Excelente Fidelización' : 'Control Operativo'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Heart className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            {/* Calificación General Promedio */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Calificación Promedio
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-2xl font-black text-amber-500 font-mono">
                    {Number(satisfaccion.promedio_general || 5).toFixed(1)}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(Number(satisfaccion.promedio_general || 5))
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  basado en {satisfaccion.total_evaluaciones} evaluaciones
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Star className="w-6 h-6 stroke-[2.2] fill-amber-400" />
              </div>
            </div>

            {/* Desglose de Pasajeros Promotores */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Huéspedes Promotores
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
                  {satisfaccion.promotores}
                </span>
                <span className="text-[10px] text-slate-400">
                  {satisfaccion.total_evaluaciones > 0 ? `${Math.round((satisfaccion.promotores / satisfaccion.total_evaluaciones) * 100)}% calificado con 5 estrellas` : 'Sin datos'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            {/* Pasivos y Detractores */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Pasivos / Detractores
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-black text-amber-600 font-mono" title="Pasivos (3-4 estrellas)">
                    {satisfaccion.pasivos} <span className="text-[10px] font-normal text-slate-400">pasivos</span>
                  </span>
                  <span>•</span>
                  <span className="text-base font-black text-rose-600 font-mono" title="Detractores (1-2 estrellas)">
                    {satisfaccion.detractores} <span className="text-[10px] font-normal text-slate-400">detractores</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">análisis de satisfacción</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Sparkles className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>
          </div>

          {/* Pilares de Calidad del Hotel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Pilares Operativos de Experiencia del Huésped</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>🧹 Limpieza & Housekeeping</span>
                  <strong className="font-mono text-amber-500">{Number(satisfaccion.promedio_limpieza || 5).toFixed(1)} / 5</strong>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(Number(satisfaccion.promedio_limpieza || 5) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>🛎️ Atención & Servicio Front-Desk</span>
                  <strong className="font-mono text-amber-500">{Number(satisfaccion.promedio_atencion || 5).toFixed(1)} / 5</strong>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(Number(satisfaccion.promedio_atencion || 5) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>🛏️ Confort & Silencio en Habitación</span>
                  <strong className="font-mono text-amber-500">{Number(satisfaccion.promedio_confort || 5).toFixed(1)} / 5</strong>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(Number(satisfaccion.promedio_confort || 5) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Últimos Comentarios y Reseñas de Huéspedes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Feedback y Comentarios Recientes en Check-out</span>
            </h3>

            {(satisfaccion.ultimas_resenas || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Aún no se registran comentarios en el período seleccionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {satisfaccion.ultimas_resenas.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900 dark:text-white font-sora">
                          {r.huesped}
                        </strong>
                        <span className="text-[10px] text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded font-mono">
                          Hab. {r.habitacion}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            className={`w-3 h-3 ${
                              st <= r.calificacion
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{r.comentario}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}

