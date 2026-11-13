import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import CheckInModal from './CheckInModal';
import CheckOutModal from './CheckOutModal';
import {
  BarChart3,
  Percent,
  CalendarCheck,
  CalendarX,
  CreditCard,
  Users,
  Building,
  RotateCw,
  TrendingUp,
  LogIn,
  LogOut,
  Clock,
  Sparkles,
  Plus,
  BedDouble,
  Store,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Wallet,
  Coins,
  ArrowUpRight,
  Activity,
  PieChart,
  ShoppingBag,
  Utensils
} from 'lucide-react';

export default function Dashboard({ isEmbedded = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  // Estados del Gráfico Interactivo de Rendimiento Hotelero (Fase 2)
  const [periodoGrafico, setPeriodoGrafico] = useState('7d'); // '7d' | '14d' | 'mes'
  const [metricaGrafico, setMetricaGrafico] = useState('ocupacion'); // 'ocupacion' | 'ingresos'
  const [tipoGrafico, setTipoGrafico] = useState('barras'); // 'barras' | 'curva'
  const [hoverIndex, setHoverIndex] = useState(null);

  // Modales interactivos desde el Dashboard
  const [modalCheckInOpen, setModalCheckInOpen] = useState(false);
  const [habitacionParaCheckIn, setHabitacionParaCheckIn] = useState(null);
  const [reservaParaCheckIn, setReservaParaCheckIn] = useState(null);

  const [modalCheckOutOpen, setModalCheckOutOpen] = useState(false);
  const [reservaIdParaCheckOut, setReservaIdParaCheckOut] = useState(null);
  const [habitacionNumeroParaCheckOut, setHabitacionNumeroParaCheckOut] = useState('');

  const [habitacionesLista, setHabitacionesLista] = useState([]);

  useEffect(() => {
    cargarDashboard();
    cargarHabitaciones();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setData(res.data.data || res.data);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarHabitaciones = async () => {
    try {
      const res = await api.get('/habitaciones');
      setHabitacionesLista(res.data.data || res.data || []);
    } catch (_) {}
  };

  const stats = data?.stats || {};
  const estadiasActivas = data?.estadiasActivas || [];
  const llegadasHoy = data?.llegadasHoy || [];
  const salidasHoy = data?.salidasHoy || [];
  const tendencia = data?.tendencia || {};
  const fuentesIngreso = data?.fuentesIngreso || {
    hospedaje: 0,
    minibar: 0,
    restaurante: 0,
    servicios: 0,
    total: 0,
    pctHospedaje: 100,
    pctMinibar: 0,
    pctRestaurante: 0,
    pctServicios: 0
  };
  const rendimientoTipos = data?.rendimientoTipos || [];
  const configCheckout = data?.configCheckout || { horaLimite: '12:00', toleranciaMinutos: 15 };

  // Helper para verificar si un checkout está vencido
  const verificarCheckoutVencido = (salida) => {
    if (!salida || !salida.fecha_salida) return false;
    const hoyStr = new Date().toISOString().split('T')[0];
    const salidaStr = String(salida.fecha_salida).substring(0, 10);
    if (salidaStr < hoyStr) return true;
    if (salidaStr === hoyStr) {
      const [hLim, mLim] = (configCheckout.horaLimite || '12:00').split(':').map(Number);
      const fechaLimite = new Date();
      fechaLimite.setHours(hLim, mLim + Number(configCheckout.toleranciaMinutos || 15), 0, 0);
      return new Date() > fechaLimite;
    }
    return false;
  };

  // Manejar apertura de Check-in para una reserva entrante
  const handleAbrirCheckInReserva = (reserva) => {
    setHabitacionParaCheckIn(reserva.habitacion || null);
    setReservaParaCheckIn(reserva);
    setModalCheckInOpen(true);
  };

  // Manejar apertura de Check-in Express
  const handleAbrirCheckInExpress = () => {
    setHabitacionParaCheckIn(null);
    setReservaParaCheckIn(null);
    setModalCheckInOpen(true);
  };

  // Manejar apertura de Check-out
  const handleAbrirCheckOut = (reserva) => {
    setReservaIdParaCheckOut(reserva.id);
    setHabitacionNumeroParaCheckOut(reserva.habitacion?.numero || '');
    setModalCheckOutOpen(true);
  };

  // ─── LÓGICA DE DATOS DEL GRÁFICO INTERACTIVO ───
  const serieActiva = periodoGrafico === '7d'
    ? (tendencia.ultimos7Dias || [])
    : periodoGrafico === '14d'
    ? (tendencia.ultimos14Dias || [])
    : (tendencia.mesActualDias || []);

  const esOcupacion = metricaGrafico === 'ocupacion';
  const valoresSerie = serieActiva.map(d => esOcupacion ? (d.ocupacion || 0) : (d.ingresos || 0));
  const maxValRaw = Math.max(...valoresSerie, esOcupacion ? 100 : 10);
  const maxVal = esOcupacion ? 100 : maxValRaw;
  const promedioVal = valoresSerie.length > 0 ? (valoresSerie.reduce((a, b) => a + b, 0) / valoresSerie.length) : 0;
  const picoIndex = valoresSerie.length > 0 ? valoresSerie.indexOf(Math.max(...valoresSerie)) : -1;

  // Curva SVG interactiva
  const svgWidth = 600;
  const svgHeight = 180;
  const padX = 35;
  const padBottom = 26;
  const padTop = 20;
  const usableW = svgWidth - padX * 2;
  const usableH = svgHeight - padBottom - padTop;

  const puntosCurva = serieActiva.map((d, idx) => {
    const val = esOcupacion ? d.ocupacion : d.ingresos;
    const x = padX + (serieActiva.length > 1 ? (idx / (serieActiva.length - 1)) * usableW : usableW / 2);
    const y = svgHeight - padBottom - (maxVal > 0 ? (val / maxVal) * usableH : 0);
    return { x, y, val, label: d.label, fecha: d.fecha };
  });

  const generarCurvaSuave = (puntos) => {
    if (puntos.length === 0) return '';
    if (puntos.length === 1) return `M ${puntos[0].x} ${puntos[0].y}`;
    let path = `M ${puntos[0].x} ${puntos[0].y}`;
    for (let i = 0; i < puntos.length - 1; i++) {
      const p0 = puntos[i === 0 ? 0 : i - 1];
      const p1 = puntos[i];
      const p2 = puntos[i + 1];
      const p3 = puntos[i + 2 < puntos.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const lineaCurvaPath = generarCurvaSuave(puntosCurva);
  const areaCurvaPath = puntosCurva.length > 0
    ? `${lineaCurvaPath} L ${puntosCurva[puntosCurva.length - 1].x} ${svgHeight - padBottom} L ${puntosCurva[0].x} ${svgHeight - padBottom} Z`
    : '';

  return (
    <div className="space-y-5">
      {/* ─── ENCABEZADO CÁPSULA FLOTANTE ULTRA-SLIM ─── */}
      {!isEmbedded ? (
        <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-xs">
              <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                  Dashboard & Métricas Hoteleras
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Control de ocupación, Revenue Management (ADR & RevPAR) y rotación diaria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden md:inline">
              Actualizado {ultimaActualizacion.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={cargarDashboard}
              data-tooltip="Actualizar métricas y ocupación en vivo [F5]"
              className="p-2 sm:px-3 sm:py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Métricas en Vivo • Hoy
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Control de ocupación en tiempo real, ADR, RevPAR y rotación diaria
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden md:inline">
              Actualizado {ultimaActualizacion.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={cargarDashboard}
              data-tooltip="Actualizar métricas y ocupación en vivo [F5]"
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── ESTACIÓN DE ACCIONES RÁPIDAS (OPERATIONAL QUICK ACTIONS) ─── */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-none font-sora">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1 shrink-0">
          Accesos Rápidos:
        </span>

        {/* 1. Check-in Express */}
        <button
          type="button"
          onClick={handleAbrirCheckInExpress}
          className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Check-in Express</span>
        </button>

        {/* 2. Rack Interactivo */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300 border border-slate-200/70 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
        >
          <BedDouble className="w-3.5 h-3.5 text-blue-500" />
          <span>Rack de Habitaciones</span>
        </button>

        {/* 3. Tape Chart */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300 border border-slate-200/70 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Tape Chart (Gantt)</span>
        </button>

        {/* 4. Turno de Caja */}
        <button
          type="button"
          onClick={() => navigate('/caja')}
          className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-300 border border-slate-200/70 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Caja & Arqueo</span>
        </button>

        {/* 5. Punto de Venta POS */}
        <button
          type="button"
          onClick={() => navigate('/pos')}
          className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-violet-50 dark:bg-slate-800 dark:hover:bg-violet-950/40 text-slate-700 hover:text-violet-600 dark:text-slate-200 dark:hover:text-violet-300 border border-slate-200/70 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
        >
          <Store className="w-3.5 h-3.5 text-violet-500" />
          <span>POS Minibar</span>
        </button>

        {/* 6. Limpieza */}
        <button
          type="button"
          onClick={() => navigate('/limpieza')}
          className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 hover:text-amber-600 dark:text-slate-200 dark:hover:text-amber-300 border border-slate-200/70 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Housekeeping</span>
        </button>
      </div>

      {/* ─── TARJETAS KPI (COMPACTADAS EN ALTURA - ESTILO SISTEMA FERRETERÍA) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
        {/* KPI 1: Tasa de Ocupación */}
        <div
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-blue-100/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-sora truncate min-w-0">
                Ocupación
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-600/25 transition-all duration-200">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate">
              {stats.tasaOcupacion || 0}%
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats.tasaOcupacion || 0))}%` }}
              />
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Uso actual
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-1 font-sora shrink-0 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
              {stats.ocupadas || 0} de {stats.totalHabitaciones || 0}
            </span>
          </div>
        </div>

        {/* KPI 2: Tarifa Promedio Diaria (ADR) */}
        <div
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-indigo-100/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between"
          title="Tarifa promedio real facturada por habitación ocupada"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sora truncate min-w-0">
                Tarifa Prom. (ADR)
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-sora tracking-tight truncate">
              S/ {Number(stats.adr || 0).toFixed(2)}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Por hab. vendida
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 font-sora shrink-0 whitespace-nowrap">
              Estadía: {stats.alos || 1}n
            </span>
          </div>
        </div>

        {/* KPI 3: RevPAR (Rendimiento por Habitación Disponible) */}
        <div
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-violet-100/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between"
          title="Revenue Per Available Room: Ingreso promedio por cada habitación del hotel"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors font-sora truncate min-w-0">
                RevPAR
              </span>
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-violet-600 dark:text-violet-400 font-sora tracking-tight truncate">
              S/ {Number(stats.revPar || 0).toFixed(2)}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Rendimiento total
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 font-sora shrink-0 whitespace-nowrap">
              Capacidad
            </span>
          </div>
        </div>

        {/* KPI 4: Check-ins Hoy */}
        <div
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-sora truncate min-w-0">
                Check-ins Hoy
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
                <CalendarCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sora tracking-tight truncate">
              {stats.checkinsHoy || 0}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Llegadas pend: <strong className="font-bold text-slate-800 dark:text-slate-200">{llegadasHoy.length}</strong>
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 font-sora shrink-0 whitespace-nowrap">
              Ingresos
            </span>
          </div>
        </div>

        {/* KPI 5: Check-outs Hoy */}
        <div
          onClick={() => navigate('/limpieza')}
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors font-sora truncate min-w-0">
                Check-outs Hoy
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/20 transition-all duration-200">
                <CalendarX className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-sora tracking-tight truncate">
              {stats.checkoutsHoy || 0}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Por liquidar: <strong className="font-bold text-amber-700 dark:text-amber-400">{salidasHoy.length}</strong>
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60 font-sora shrink-0 whitespace-nowrap">
              Rotación
            </span>
          </div>
        </div>

        {/* KPI 6: Ingresos del Mes */}
        <div
          onClick={() => navigate('/caja')}
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-emerald-100/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-sora truncate min-w-0">
                Ingresos Mes
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate" title={`S/ ${Number(stats.ingresosMes || 0).toFixed(2)}`}>
              S/ {Number(stats.ingresosMes || 0).toFixed(2)}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Hoy: <strong className="font-bold text-slate-800 dark:text-slate-200 font-mono">S/ {Number(stats.ingresosHoy || 0).toFixed(2)}</strong>
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 font-sora shrink-0 whitespace-nowrap">
              SUNAT
            </span>
          </div>
        </div>
      </div>

      {/* ─── FASE 2: GRÁFICO INTERACTIVO DE RENDIMIENTO & DESGLOSE DE FUENTES DE INGRESO ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* GRÁFICO PRINCIPAL INTERACTIVO (OCUPACIÓN VS FACTURACIÓN) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Cabecera del gráfico con filtros de Métrica, Periodo y Tipo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    esOcupacion
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100/80 dark:border-blue-800/60'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100/80 dark:border-emerald-800/60'
                  }`}>
                    {esOcupacion ? <Percent className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-sora tracking-tight">
                      {esOcupacion ? 'Curva de Ocupación Diaria' : 'Tendencia de Facturación Hotelera'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <span>{periodoGrafico === '7d' ? 'Últimos 7 días' : periodoGrafico === '14d' ? 'Últimos 14 días' : 'Mes actual'}</span>
                      <span>•</span>
                      <span>Promedio: <b className="font-mono text-slate-700 dark:text-slate-200">{esOcupacion ? `${Math.round(promedioVal)}%` : `S/ ${Math.round(promedioVal).toLocaleString('es-PE')}`}</b></span>
                      {picoIndex >= 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            Pico: {esOcupacion ? `${valoresSerie[picoIndex]}%` : `S/ ${Math.round(valoresSerie[picoIndex]).toLocaleString('es-PE')}`} ({serieActiva[picoIndex]?.label})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Controles interactivos */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Selector de Métrica: Ocupación vs Ingresos */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-[10.5px] font-bold font-sora">
                  <button
                    type="button"
                    onClick={() => {
                      setMetricaGrafico('ocupacion');
                      setHoverIndex(null);
                    }}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      metricaGrafico === 'ocupacion'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    % Ocupación
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMetricaGrafico('ingresos');
                      setHoverIndex(null);
                    }}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      metricaGrafico === 'ingresos'
                        ? 'bg-emerald-600 text-white font-black shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    S/ Ventas
                  </button>
                </div>

                {/* Selector de Periodo: 7d, 14d, Mes */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-[10.5px] font-bold font-sora">
                  {[
                    { id: '7d', label: '7 Días' },
                    { id: '14d', label: '14 Días' },
                    { id: 'mes', label: 'Mes' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPeriodoGrafico(p.id);
                        setHoverIndex(null);
                      }}
                      className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                        periodoGrafico === p.id
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-black shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Selector de Tipo: Barras vs Curva */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTipoGrafico('barras')}
                    title="Barras Cápsula"
                    className={`p-1 rounded-lg transition-all cursor-pointer ${
                      tipoGrafico === 'barras'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoGrafico('curva')}
                    title="Curva Fluida"
                    className={`p-1 rounded-lg transition-all cursor-pointer ${
                      tipoGrafico === 'curva'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ÁREA DEL GRÁFICO (CON LÍNEAS GUÍA Y TOOLTIP) */}
            <div className="relative w-full h-48 my-1 select-none">
              {/* Líneas Guía Horizontales */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 pt-3 z-0">
                <div className="border-b border-dashed border-slate-200/70 dark:border-slate-800/80 w-full relative">
                  <span className="absolute right-1 -top-3 font-mono text-[9px] text-slate-400">
                    {esOcupacion ? `${Math.round(maxVal)}%` : `S/ ${Math.round(maxVal).toLocaleString('es-PE')}`}
                  </span>
                </div>
                <div className="border-b border-dashed border-slate-200/50 dark:border-slate-800/50 w-full relative">
                  <span className="absolute right-1 -top-3 font-mono text-[9px] text-slate-400">
                    {esOcupacion ? `${Math.round(maxVal / 2)}%` : `S/ ${Math.round(maxVal / 2).toLocaleString('es-PE')}`}
                  </span>
                </div>
                <div className="border-b border-slate-200/80 dark:border-slate-800 w-full relative">
                  <span className="absolute right-1 -top-3 font-mono text-[9px] text-slate-400">
                    {esOcupacion ? '0%' : 'S/ 0'}
                  </span>
                </div>
              </div>

              {serieActiva.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  Sin registros suficientes en este período.
                </div>
              ) : tipoGrafico === 'barras' ? (
                /* MODO BARRAS CÁPSULA */
                <div className="relative w-full h-full flex items-end justify-between gap-1 sm:gap-2 px-1 pb-6 pt-4 z-10">
                  {serieActiva.map((item, idx) => {
                    const val = esOcupacion ? item.ocupacion : item.ingresos;
                    const heightPercent = Math.max((val / (maxVal || 1)) * 100, 5);
                    const isPico = idx === picoIndex && val > 0;
                    const isHovered = hoverIndex === idx;
                    const isAnyHovered = hoverIndex !== null;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoverIndex(idx)}
                        onMouseLeave={() => setHoverIndex(null)}
                        className={`flex-1 h-full flex flex-col items-center justify-end relative cursor-pointer transition-all duration-150 ${
                          isAnyHovered && !isHovered ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                        }`}
                      >
                        {/* Tooltip flotante enriquecido */}
                        {isHovered && (
                          <div className="absolute -top-12 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-700/80 text-white px-2 py-1 rounded-xl shadow-xl pointer-events-none z-30 whitespace-nowrap animate-in fade-in zoom-in-95 flex flex-col items-center">
                            <div className="font-mono text-[10.5px] font-black text-blue-400 flex items-center gap-1">
                              <span>{esOcupacion ? `${val}% Ocupación` : `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}</span>
                              {isPico && <span className="text-[8.5px] text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded">🏆 MÁX</span>}
                            </div>
                            <div className="text-[9px] text-slate-300">
                              {item.label} • {esOcupacion ? `${item.habitacionesOcupadas || 0} habs ocupadas` : 'Facturación'}
                            </div>
                          </div>
                        )}

                        {/* Riel de fondo translúcido */}
                        <div
                          className={`w-full max-w-[32px] sm:max-w-[42px] h-full rounded-xl p-1 flex items-end transition-all ${
                            isHovered
                              ? 'bg-blue-50/90 dark:bg-blue-950/40 ring-1 ring-blue-300 dark:ring-blue-700'
                              : 'bg-slate-100/70 dark:bg-slate-800/35 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-lg transition-all duration-300 ease-out relative overflow-hidden ${
                              esOcupacion
                                ? (isPico
                                  ? 'bg-gradient-to-t from-blue-600 via-indigo-500 to-emerald-400 shadow-xs'
                                  : isHovered
                                  ? 'bg-gradient-to-t from-blue-600 to-indigo-400'
                                  : 'bg-gradient-to-t from-blue-600 to-blue-500 group-hover:from-blue-500 group-hover:to-blue-400')
                                : (isPico
                                  ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-indigo-400 shadow-xs'
                                  : isHovered
                                  ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                                  : 'bg-gradient-to-t from-emerald-600 to-emerald-500 group-hover:from-emerald-500 group-hover:to-emerald-400')
                            }`}
                          >
                            <div className="absolute top-0 inset-x-0 h-1 bg-white/30 rounded-t-lg" />
                          </div>
                        </div>

                        {/* Etiqueta del Eje X */}
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 truncate max-w-full">
                          {item.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* MODO CURVA FLUIDA SVG */
                <div className="relative w-full h-full flex items-end pb-6 z-10">
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    fill="none"
                  >
                    <defs>
                      <linearGradient id="hotelTrendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={esOcupacion ? "#3b82f6" : "#10b981"} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={esOcupacion ? "#3b82f6" : "#10b981"} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path d={areaCurvaPath} fill="url(#hotelTrendGradient)" />
                    <path
                      d={lineaCurvaPath}
                      stroke={esOcupacion ? "#3b82f6" : "#10b981"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {puntosCurva.map((pt, idx) => {
                      const isHovered = hoverIndex === idx;
                      return (
                        <g key={idx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 6 : 3.5}
                            fill={isHovered ? (esOcupacion ? '#3b82f6' : '#10b981') : '#ffffff'}
                            stroke={esOcupacion ? '#3b82f6' : '#10b981'}
                            strokeWidth="2.5"
                            className="transition-all duration-150 cursor-pointer"
                            onMouseEnter={() => setHoverIndex(idx)}
                            onMouseLeave={() => setHoverIndex(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Tooltip en modo curva */}
                  {hoverIndex !== null && puntosCurva[hoverIndex] && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${(puntosCurva[hoverIndex].x / svgWidth) * 100}%`,
                        top: '4px',
                        transform: 'translateX(-50%)'
                      }}
                      className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-700/80 text-white px-2.5 py-1 rounded-xl shadow-xl pointer-events-none z-30 whitespace-nowrap animate-in fade-in zoom-in-95 flex flex-col items-center"
                    >
                      <div className="font-mono text-[10.5px] font-black text-blue-400">
                        {esOcupacion ? `${puntosCurva[hoverIndex].val}% Ocupación` : `S/ ${puntosCurva[hoverIndex].val.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                      </div>
                      <div className="text-[9px] text-slate-300">
                        {puntosCurva[hoverIndex].label}
                      </div>
                    </div>
                  )}

                  {/* Etiquetas X en curva */}
                  <div className="absolute -bottom-1 inset-x-0 flex items-center justify-between px-3 text-[9px] font-mono text-slate-400">
                    {serieActiva.filter((_, i) => i === 0 || i === Math.floor(serieActiva.length / 2) || i === serieActiva.length - 1).map((item, i) => (
                      <span key={i}>{item.label}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESGLOSE DE FUENTES DE INGRESO (HOSPEDAJE VS MINIBAR POS) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-3.5">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-sora">
                    Fuentes de Facturación
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Alojamiento vs. Consumos POS y Servicios
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/60">
                Mes actual
              </span>
            </div>

            {/* Barra multicapa proporcional de ingresos */}
            <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/60 flex my-3">
              <div
                style={{ width: `${Math.max(fuentesIngreso.pctHospedaje, 2)}%` }}
                className="h-full bg-blue-600 rounded-l-full transition-all duration-500"
                title={`Alojamiento: ${fuentesIngreso.pctHospedaje}%`}
              />
              <div
                style={{ width: `${Math.max(fuentesIngreso.pctMinibar, 0)}%` }}
                className="h-full bg-violet-500 transition-all duration-500"
                title={`Minibar: ${fuentesIngreso.pctMinibar}%`}
              />
              <div
                style={{ width: `${Math.max(fuentesIngreso.pctRestaurante, 0)}%` }}
                className="h-full bg-amber-500 transition-all duration-500"
                title={`Restaurante: ${fuentesIngreso.pctRestaurante}%`}
              />
              <div
                style={{ width: `${Math.max(fuentesIngreso.pctServicios, 0)}%` }}
                className="h-full bg-emerald-500 rounded-r-full transition-all duration-500"
                title={`Otros servicios: ${fuentesIngreso.pctServicios}%`}
              />
            </div>

            {/* Lista detallada de categorías de ingresos */}
            <div className="space-y-2 text-xs">
              {/* 1. Alojamiento */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-750">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11.5px]">Alojamiento (Noches/Horas)</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-extrabold text-slate-900 dark:text-white">S/ {fuentesIngreso.hospedaje.toFixed(2)}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">({fuentesIngreso.pctHospedaje}%)</span>
                </div>
              </div>

              {/* 2. Minibar */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-750">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11.5px]">Minibar & Snacks POS</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-extrabold text-slate-900 dark:text-white">S/ {fuentesIngreso.minibar.toFixed(2)}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">({fuentesIngreso.pctMinibar}%)</span>
                </div>
              </div>

              {/* 3. Restaurante / Room Service */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-750">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11.5px]">Restaurante / Room Service</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-extrabold text-slate-900 dark:text-white">S/ {fuentesIngreso.restaurante.toFixed(2)}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">({fuentesIngreso.pctRestaurante}%)</span>
                </div>
              </div>

              {/* 4. Otros Servicios */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-750">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11.5px]">Lavandería y Otros</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-extrabold text-slate-900 dark:text-white">S/ {fuentesIngreso.servicios.toFixed(2)}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">({fuentesIngreso.pctServicios}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-sora">Total Facturado Mes:</span>
            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
              S/ {fuentesIngreso.total.toFixed(2)}
            </span>
          </div>
        </div>

      </div>

      {/* ─── TABLERO OPERATIVO DEL DÍA (TURNOVER DIARIO: LLEGADAS Y SALIDAS PREVISTAS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        
        {/* COLUMNA 1: LLEGADAS PROGRAMADAS PARA HOY */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-sora">
                  Llegadas Previstas Hoy
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Reservas confirmadas listas para check-in
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
              {llegadasHoy.length} pendientes
            </span>
          </div>

          <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
            {llegadasHoy.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 text-emerald-500/80" />
                <p className="text-xs font-medium">No hay más llegadas pendientes programadas para hoy.</p>
              </div>
            ) : (
              llegadasHoy.map((llegada) => (
                <div
                  key={llegada.id}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-755 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-extrabold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-800/60">
                        Hab. {llegada.habitacion?.numero}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {llegada.habitacion?.tipo?.nombre}
                      </span>
                    </div>
                    <div className="font-extrabold font-sora text-xs text-slate-800 dark:text-slate-100 truncate">
                      {llegada.huesped?.nombre} {llegada.huesped?.apellido}
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>Doc: {llegada.huesped?.num_documento || 'Sin doc'}</span>
                      <span>•</span>
                      <span>{llegada.modalidad === 'horas' ? `${llegada.num_horas}h` : `${llegada.num_noches}n`}</span>
                      {parseFloat(llegada.adelanto || 0) > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            Adelanto: S/ {parseFloat(llegada.adelanto).toFixed(0)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAbrirCheckInReserva(llegada)}
                    className="h-8 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold font-sora flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
                    title={`Realizar check-in de ${llegada.huesped?.nombre}`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Recibir</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 2: SALIDAS PROGRAMADAS PARA HOY O VENCIDAS */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-sora">
                  Salidas del Día & Check-outs
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Cuentas por liquidar y habitaciones por liberar
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
              {salidasHoy.length} pendientes
            </span>
          </div>

          <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
            {salidasHoy.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 text-emerald-500/80" />
                <p className="text-xs font-medium">No hay salidas ni check-outs pendientes por liquidar.</p>
              </div>
            ) : (
              salidasHoy.map((salida) => {
                const esVencido = verificarCheckoutVencido(salida);
                const totalCargos = (salida.cargos || []).reduce((acc, c) => acc + (parseFloat(c.subtotal || c.precio_unitario * c.cantidad || 0)), 0);
                const totalHospedaje = parseFloat(salida.total || 0);
                const adelanto = parseFloat(salida.adelanto || 0);
                const saldoTotal = Math.max(0, +(totalHospedaje + totalCargos - adelanto).toFixed(2));

                return (
                  <div
                    key={salida.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      esVencido
                        ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-300/80 dark:border-rose-900/60'
                        : 'bg-slate-50/80 dark:bg-slate-850/60 border-slate-200/70 dark:border-slate-750 hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-300/70 dark:border-slate-700">
                          Hab. {salida.habitacion?.numero}
                        </span>
                        {esVencido ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.2 rounded bg-rose-600 text-white animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" /> Salida Vencida
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            Límite: {configCheckout.horaLimite || '12:00'}
                          </span>
                        )}
                      </div>
                      <div className="font-extrabold font-sora text-xs text-slate-800 dark:text-slate-100 truncate">
                        {salida.huesped?.nombre} {salida.huesped?.apellido}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] mt-0.5">
                        <span className="text-slate-400">Saldo a liquidar:</span>
                        <span className={`font-mono font-black ${saldoTotal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          S/ {saldoTotal.toFixed(2)}
                        </span>
                        {totalCargos > 0 && (
                          <span className="text-[9.5px] text-blue-600 dark:text-blue-400 font-bold" title={`Consumos minibar cargados: S/ ${totalCargos.toFixed(2)}`}>
                            (+S/{totalCargos.toFixed(0)} POS)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAbrirCheckOut(salida)}
                      className={`h-8 px-2.5 rounded-xl text-[11px] font-extrabold font-sora flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95 ${
                        esVencido
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                      title="Procesar liquidación y check-out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check-out</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ─── RENDIMIENTO POR TIPO DE HABITACIÓN & DISTRIBUCIÓN INVENTARIO ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* RANKING DE RENDIMIENTO POR TIPO DE HABITACIÓN */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 soft-card-shadow space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 font-sora">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <span>Rendimiento por Categoría</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {rendimientoTipos.length} tipos
            </span>
          </div>

          <div className="space-y-3">
            {rendimientoTipos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No hay tipos de habitación registrados.</p>
            ) : (
              rendimientoTipos.map((tipo) => (
                <div key={tipo.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-750 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold font-sora text-slate-800 dark:text-white truncate">
                      {tipo.nombre}
                    </span>
                    <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                      {tipo.tasaOcupacion}% Ocup.
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        tipo.tasaOcupacion >= 75
                          ? 'bg-emerald-500'
                          : tipo.tasaOcupacion >= 40
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, tipo.tasaOcupacion))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>{tipo.ocupadas} ocupadas de {tipo.totalHabitaciones} habs</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Base: S/ {tipo.precioBase.toFixed(0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DISTRIBUCIÓN DEL INVENTARIO & HUÉSPEDES ACTIVOS */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 soft-card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 font-sora">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span>Huéspedes Hospedados Activos ({estadiasActivas.length})</span>
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
              En Estancia
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800 font-sora text-[10.5px]">
                <tr>
                  <th className="py-2.5 px-3">Habitación</th>
                  <th className="py-2.5 px-3">Huésped Titular</th>
                  <th className="py-2.5 px-3">Estadía</th>
                  <th className="py-2.5 px-3">Salida Prevista</th>
                  <th className="py-2.5 px-3 text-right">Saldo Cuenta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {estadiasActivas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No hay estancias activas en este momento.
                    </td>
                  </tr>
                ) : (
                  estadiasActivas.map((res) => {
                    const totalCargosHab = (res.cargos || []).reduce((acc, c) => acc + (parseFloat(c.subtotal || c.precio_unitario * c.cantidad || 0)), 0);
                    const totalHospedaje = parseFloat(res.total || 0);
                    const adelantoHab = parseFloat(res.adelanto || 0);
                    const saldoActivo = Math.max(0, +(totalHospedaje + totalCargosHab - adelantoHab).toFixed(2));

                    return (
                      <tr key={res.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          Hab. {res.habitacion?.numero}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white font-sora">
                          <div className="flex items-center gap-1.5">
                            <span>{res.huesped?.nombre} {res.huesped?.apellido}</span>
                            {res.huesped?.clasificacion === 'vip' && (
                              <Crown className="w-3 h-3 text-amber-500 shrink-0" title="VIP" />
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                          {res.modalidad === 'horas' ? `${res.num_horas}h Day-Use` : `${res.num_noches} noche(s)`}
                        </td>
                        <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-mono font-semibold whitespace-nowrap">
                          {res.fecha_salida}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold whitespace-nowrap">
                          <span className={saldoActivo > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                            S/ {saldoActivo.toFixed(2)}
                          </span>
                          {totalCargosHab > 0 && (
                            <span className="ml-1 text-[9.5px] text-blue-600 dark:text-blue-400 font-bold" title={`Cargos adicionales de minibar/servicios: S/ ${totalCargosHab.toFixed(2)}`}>
                              (+S/{totalCargosHab.toFixed(0)})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ─── MODALES INTEGRADOS (CHECK-IN Y CHECK-OUT DIRECTOS) ─── */}
      <CheckInModal
        isOpen={modalCheckInOpen}
        onClose={() => {
          setModalCheckInOpen(false);
          setReservaParaCheckIn(null);
          setHabitacionParaCheckIn(null);
        }}
        habitacionSeleccionada={habitacionParaCheckIn}
        habitaciones={habitacionesLista}
        reservaPrevia={reservaParaCheckIn}
        onSuccess={() => {
          cargarDashboard();
          setReservaParaCheckIn(null);
          setHabitacionParaCheckIn(null);
        }}
      />

      <CheckOutModal
        isOpen={modalCheckOutOpen}
        onClose={() => {
          setModalCheckOutOpen(false);
          setReservaIdParaCheckOut(null);
          setHabitacionNumeroParaCheckOut('');
        }}
        reservaId={reservaIdParaCheckOut}
        habitacionNumero={habitacionNumeroParaCheckOut}
        onSuccess={() => {
          cargarDashboard();
          setReservaIdParaCheckOut(null);
          setHabitacionNumeroParaCheckOut('');
        }}
      />
    </div>
  );
}
