import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Calendar,
  CalendarDays,
  Plus,
  Search,
  Filter,
  RefreshCw,
  User,
  Users,
  BedDouble,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Phone,
  MessageCircle,
  FileText,
  Printer,
  ChevronDown,
  X,
  Sparkles,
  ArrowRight,
  Wallet,
  LogIn,
  Crown,
  Share2,
  ExternalLink,
  ShieldCheck,
  Eye,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from './api';
import { Modal } from '@heis/ui';
import CheckInModal from './CheckInModal';
import { notificarExito, notificarError } from './utils/notificaciones';
import { useSettingsStore } from '@heis/core';
import { calcularTarifaDinamica } from './utils/tarifasDinamicas';

const ORIGENES_CANAL = [
  { id: 'todos', label: 'Todos los Canales', badge: 'Todos' },
  { id: 'presencial', label: 'Mostrador / Walk-in', badge: 'Presencial' },
  { id: 'whatsapp', label: 'WhatsApp / Chat', badge: 'WhatsApp' },
  { id: 'telefono', label: 'Llamada Telefónica', badge: 'Teléfono' },
  { id: 'web', label: 'Página Web / OTAs', badge: 'Online' },
  { id: 'agencia', label: 'Convenio / Corporativo', badge: 'Empresa' }
];

export default function Reservas() {
  const navigate = useNavigate();

  // Estados de datos
  const [reservas, setReservas] = useState([]);
  const [kpis, setKpis] = useState({
    total: 0,
    confirmadas: 0,
    pendientes: 0,
    enCasa: 0,
    checkouts: 0,
    canceladas: 0,
    llegadasHoy: 0,
    salidasHoy: 0
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todas'); // 'todas', 'confirmada', 'pendiente', 'checkin', 'checkout', 'cancelada'
  const [filtroCanal, setFiltroCanal] = useState('todos');
  const [filtroTiempo, setFiltroTiempo] = useState('todos'); // 'todos', 'hoy', 'semana', 'mes'
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalNuevaReservaOpen, setModalNuevaReservaOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  // Modal Cancelación
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [reservaParaCancelar, setReservaParaCancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelando, setCancelando] = useState(false);

  // Check-In Modal integration
  const [modalCheckInOpen, setModalCheckInOpen] = useState(false);
  const [reservaParaCheckIn, setReservaParaCheckIn] = useState(null);

  useEffect(() => {
    cargarReservas();
  }, [filtroEstado, filtroCanal, filtroTiempo]);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filtroEstado !== 'todas') {
        params.estado = filtroEstado;
      }
      if (filtroCanal !== 'todos') {
        params.origen = filtroCanal;
      }

      const hoyDate = new Date();
      const hoyStr = hoyDate.toISOString().split('T')[0];

      if (filtroTiempo === 'hoy') {
        params.fecha = hoyStr;
      } else if (filtroTiempo === 'semana') {
        const en7Dias = new Date();
        en7Dias.setDate(hoyDate.getDate() + 7);
        params.desde = hoyStr;
        params.hasta = en7Dias.toISOString().split('T')[0];
      } else if (filtroTiempo === 'mes') {
        const primerDia = new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1).toISOString().split('T')[0];
        const ultimoDia = new Date(hoyDate.getFullYear(), hoyDate.getMonth() + 1, 0).toISOString().split('T')[0];
        params.desde = primerDia;
        params.hasta = ultimoDia;
      }

      if (busqueda.trim()) {
        params.busqueda = busqueda.trim();
      }

      const res = await api.get('/reservas', { params });
      if (res.data?.success) {
        setReservas(res.data.data || []);
        if (res.data.kpis) {
          setKpis(res.data.kpis);
        }
      }
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      toast.error('No se pudieron obtener las reservas.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado reactivo en memoria para búsqueda inmediata
  const reservasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return reservas;
    const q = busqueda.toLowerCase().trim();
    return reservas.filter((r) => {
      const cod = (r.codigo || '').toLowerCase();
      const nom = `${r.huesped?.nombre || ''} ${r.huesped?.apellido || ''}`.toLowerCase();
      const doc = (r.huesped?.num_documento || '').toLowerCase();
      const hab = String(r.habitacion?.numero || '').toLowerCase();
      const origen = (r.origen || '').toLowerCase();
      return cod.includes(q) || nom.includes(q) || doc.includes(q) || hab.includes(q) || origen.includes(q);
    });
  }, [reservas, busqueda]);

  const handleBuscarSubmit = (e) => {
    e.preventDefault();
    cargarReservas();
  };

  const handleConfirmarReserva = async (reserva) => {
    try {
      const res = await api.patch(`/reservas/${reserva.id}/confirmar`);
      if (res.data?.success) {
        notificarExito('Reserva Confirmada', `La reserva ${reserva.codigo} ha sido confirmada.`);
        cargarReservas();
        window.dispatchEvent(new CustomEvent('hotel-stats-changed'));
      }
    } catch (err) {
      notificarError('Error al confirmar', err.response?.data?.message || err.message);
    }
  };

  const handleAbrirCancelar = (reserva) => {
    setReservaParaCancelar(reserva);
    setMotivoCancelacion('');
    setModalCancelarOpen(true);
  };

  const handleEjecutarCancelacion = async () => {
    if (!reservaParaCancelar) return;
    try {
      setCancelando(true);
      const res = await api.patch(`/reservas/${reservaParaCancelar.id}/cancelar`, {
        motivo: motivoCancelacion
      });
      if (res.data?.success) {
        notificarExito('Reserva Cancelada', `La reserva ${reservaParaCancelar.codigo} fue cancelada correctamente.`);
        setModalCancelarOpen(false);
        setReservaParaCancelar(null);
        cargarReservas();
        window.dispatchEvent(new CustomEvent('hotel-stats-changed'));
      }
    } catch (err) {
      notificarError('Error al cancelar', err.response?.data?.message || err.message);
    } finally {
      setCancelando(false);
    }
  };

  const handleAbrirCheckIn = (reserva) => {
    setReservaParaCheckIn(reserva);
    setModalCheckInOpen(true);
  };

  const generarMensajeWhatsApp = (reserva) => {
    const huesped = reserva.huesped;
    const habitacion = reserva.habitacion;
    const nombre = huesped?.nombre || 'Estimado Huésped';
    const numHab = habitacion?.numero || 'por asignar';
    const checkin = reserva.fecha_entrada || '';
    const checkout = reserva.fecha_salida || '';
    const total = parseFloat(reserva.total || 0).toFixed(2);
    const adelanto = parseFloat(reserva.adelanto || 0).toFixed(2);
    const saldo = parseFloat(reserva.saldo || 0).toFixed(2);

    const texto = `Hola *${nombre}*, ¡te saludamos del Hotel! 🏨✨\n\nConfirmamos tu reserva *${reserva.codigo}*:\n🛏️ *Habitación:* ${numHab} (${habitacion?.tipo?.nombre || 'Estándar'})\n📅 *Llegada:* ${checkin}\n📆 *Salida:* ${checkout} (Noches: ${reserva.num_noches || 1})\n💰 *Total:* S/ ${total}\n💵 *Adelanto:* S/ ${adelanto}\n💳 *Saldo pendiente:* S/ ${saldo}\n\n¡Te esperamos! Por favor avísanos tu hora estimada de llegada.`;
    return encodeURIComponent(texto);
  };

  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'confirmada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Confirmada
          </span>
        );
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Por Confirmar
          </span>
        );
      case 'checkin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            En Casa (Check-In)
          </span>
        );
      case 'checkout':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Completada
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
            <XCircle className="w-3 h-3 text-rose-500" />
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {estado}
          </span>
        );
    }
  };

  const renderBadgeOrigen = (origen) => {
    switch (origen) {
      case 'web':
        return (
          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Web / OTA
          </span>
        );
      case 'telefono':
        return (
          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            WhatsApp / Tel
          </span>
        );
      case 'agencia':
        return (
          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Corporativo
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Mostrador
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── ENCABEZADO CÁPSULA FLOTANTE ULTRA-SLIM ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-xs">
            <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                Control & Gestión de Reservas
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Motor de Reservas Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Reservas anticipadas, calendario de estancias, confirmaciones & control de llegadas
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/?vista=tapechart')}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
            title="Ver calendario visual Tape Chart en el Rack"
          >
            <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Calendario Tape Chart</span>
          </button>

          <button
            type="button"
            onClick={cargarReservas}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setModalNuevaReservaOpen(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* ─── 5 TARJETAS KPI DE RENDIMIENTO HOTELERO ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Total */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">Total Registros</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white">
              {kpis.total}
            </span>
            <span className="text-[10px] font-bold text-slate-400">reservas</span>
          </div>
        </div>

        {/* 2. Llegadas de Hoy */}
        <div className={`p-3.5 rounded-2xl border transition-all ${
          kpis.llegadasHoy > 0
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
            : 'bg-white dark:bg-[#0d1527]/90 border-slate-200/90 dark:border-white/[0.08]'
        } shadow-card-soft`}>
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">Llegadas Hoy</span>
            <LogIn className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
              {kpis.llegadasHoy}
            </span>
            <span className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80">check-ins</span>
          </div>
        </div>

        {/* 3. Salidas de Hoy */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">Salidas Hoy</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white">
              {kpis.salidasHoy}
            </span>
            <span className="text-[10px] font-bold text-slate-400">check-outs</span>
          </div>
        </div>

        {/* 4. En Casa */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">En Casa</span>
            <BedDouble className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {kpis.enCasa}
            </span>
            <span className="text-[10px] font-bold text-emerald-600/80">alojados</span>
          </div>
        </div>

        {/* 5. Por Confirmar */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider font-sora">Por Confirmar</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {kpis.pendientes}
            </span>
            <span className="text-[10px] font-bold text-amber-600/80">pendientes</span>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE BÚSQUEDA Y SEGMENTOS ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Buscador de reservas */}
          <form onSubmit={handleBuscarSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código RES-..., huésped, DNI o hab..."
              className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Filtros rápidos de tiempo */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 font-sora">
              Período:
            </span>
            {[
              { id: 'todos', label: 'Todas las Fechas' },
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: '7 Días' },
              { id: 'mes', label: 'Este Mes' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFiltroTiempo(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filtroTiempo === t.id
                    ? 'bg-blue-600 text-white shadow-2xs font-black'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pestañas de estado de reserva */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 custom-modal-scroll border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'todas', label: 'Todas', count: kpis.total },
            { id: 'confirmada', label: 'Confirmadas', count: kpis.confirmadas },
            { id: 'pendiente', label: 'Por Confirmar', count: kpis.pendientes },
            { id: 'checkin', label: 'En Casa (Check-in)', count: kpis.enCasa },
            { id: 'checkout', label: 'Finalizadas (Check-out)', count: kpis.checkouts },
            { id: 'cancelada', label: 'Canceladas', count: kpis.canceladas }
          ].map((tab) => {
            const isActive = filtroEstado === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroEstado(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
                    : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TABLA INTELIGENTE DE RESERVAS ─── */}
      <div className="rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 font-sora uppercase tracking-wider">
              Cargando reservas del hotel...
            </span>
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <CalendarCheck className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 font-sora">
              No se encontraron reservas con los filtros aplicados
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Prueba cambiando el rango de fechas, el estado de reserva o registra una nueva reserva anticipada.
            </p>
            <button
              type="button"
              onClick={() => setModalNuevaReservaOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm inline-flex items-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear Nueva Reserva
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-sora text-[10.5px] uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Código / Origen</th>
                  <th className="py-3 px-4">Huésped Principal</th>
                  <th className="py-3 px-4">Habitación</th>
                  <th className="py-3 px-4">Fechas & Estancia</th>
                  <th className="py-3 px-4 text-right">Importes (S/)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reservasFiltradas.map((r) => {
                  const huesped = r.huesped || {};
                  const habitacion = r.habitacion || {};
                  const esLlegadaHoy = r.fecha_entrada === new Date().toISOString().split('T')[0];
                  const saldoNum = parseFloat(r.saldo || 0);

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Código y Origen */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-black text-slate-800 dark:text-white tracking-tight">
                            {r.codigo}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {renderBadgeOrigen(r.origen)}
                            {esLlegadaHoy && (r.estado === 'confirmada' || r.estado === 'pendiente') && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white animate-pulse">
                                ¡Llega Hoy!
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Huésped */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-white text-xs">
                              {huesped.nombre} {huesped.apellido}
                            </span>
                            {huesped.clasificacion === 'vip' && (
                              <span className="p-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" title="Cliente VIP">
                                <Crown className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {huesped.tipo_documento || 'DOC'}: {huesped.num_documento || 'No registrado'}
                          </span>
                          {huesped.telefono && (
                            <a
                              href={`https://wa.me/${huesped.telefono.replace(/[^0-9]/g, '')}?text=${generarMensajeWhatsApp(r)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5"
                              title="Enviar confirmación por WhatsApp"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              {huesped.telefono}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Habitación */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-blue-600 dark:text-blue-400 text-xs">
                            Hab. {habitacion.numero || 'S/N'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {habitacion.tipo?.nombre || 'Estándar'} • Piso {habitacion.piso || 1}
                          </span>
                        </div>
                      </td>

                      {/* Fechas */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            In: <span className="font-mono font-bold">{r.fecha_entrada}</span>
                          </span>
                          <span className="text-slate-400">
                            Out: <span className="font-mono">{r.fecha_salida}</span>
                          </span>
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight mt-0.5">
                            {r.num_noches || 1} {r.num_noches === 1 ? 'Noche' : 'Noches'} • {r.num_personas || 1} pers.
                          </span>
                        </div>
                      </td>

                      {/* Importes */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-800 dark:text-white text-xs">
                            S/ {parseFloat(r.total || 0).toFixed(2)}
                          </span>
                          {parseFloat(r.adelanto || 0) > 0 && (
                            <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400">
                              Adel: S/ {parseFloat(r.adelanto).toFixed(2)}
                            </span>
                          )}
                          <span className={`text-[10.5px] font-bold ${
                            saldoNum > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                          }`}>
                            Saldo: S/ {saldoNum.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        {renderBadgeEstado(r.estado)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Botón Check-In Directo */}
                          {(r.estado === 'confirmada' || r.estado === 'pendiente') && (
                            <button
                              type="button"
                              onClick={() => handleAbrirCheckIn(r)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                              title="Hacer Check-In en esta habitación"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Check-In</span>
                            </button>
                          )}

                          {/* Botón Confirmar */}
                          {r.estado === 'pendiente' && (
                            <button
                              type="button"
                              onClick={() => handleConfirmarReserva(r)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                              title="Confirmar reserva"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Confirmar</span>
                            </button>
                          )}

                          {/* Botón Voucher / Detalle */}
                          <button
                            type="button"
                            onClick={() => {
                              setReservaSeleccionada(r);
                              setModalDetalleOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                            title="Ver voucher y detalles"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón WhatsApp */}
                          {huesped.telefono && (
                            <a
                              href={`https://wa.me/${huesped.telefono.replace(/[^0-9]/g, '')}?text=${generarMensajeWhatsApp(r)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 transition-all"
                              title="Compartir por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Botón Cancelar */}
                          {(r.estado === 'confirmada' || r.estado === 'pendiente') && (
                            <button
                              type="button"
                              onClick={() => handleAbrirCancelar(r)}
                              className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                              title="Cancelar reserva"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* ─── MODAL NUEVA RESERVA ANTICIPADA ─── */}
      {modalNuevaReservaOpen && (
        <ModalNuevaReserva
          isOpen={modalNuevaReservaOpen}
          onClose={() => setModalNuevaReservaOpen(false)}
          onSuccess={() => {
            setModalNuevaReservaOpen(false);
            cargarReservas();
            window.dispatchEvent(new CustomEvent('hotel-stats-changed'));
          }}
        />
      )}

      {/* ─── MODAL DETALLE / VOUCHER DE RESERVA ─── */}
      {modalDetalleOpen && reservaSeleccionada && (
        <ModalDetalleReserva
          isOpen={modalDetalleOpen}
          reserva={reservaSeleccionada}
          onClose={() => {
            setModalDetalleOpen(false);
            setReservaSeleccionada(null);
          }}
        />
      )}

      {/* ─── MODAL DE CONFIRMACIÓN DE CANCELACIÓN (SIN WINDOW.CONFIRM) ─── */}
      {modalCancelarOpen && reservaParaCancelar && (
        <Modal
          isOpen={modalCancelarOpen}
          onClose={() => setModalCancelarOpen(false)}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.2]" />}
          title="¿Cancelar esta Reserva?"
          subtitle={`Código: ${reservaParaCancelar.codigo}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Huésped:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {reservaParaCancelar.huesped?.nombre} {reservaParaCancelar.huesped?.apellido}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Habitación:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Hab. {reservaParaCancelar.habitacion?.numero}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fechas:</span>
                <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                  {reservaParaCancelar.fecha_entrada} → {reservaParaCancelar.fecha_salida}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Motivo de cancelación (opcional):
              </label>
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ej: Cliente canceló por reprogramación de vuelo, No-show..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalCancelarOpen(false)}
                disabled={cancelando}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleEjecutarCancelacion}
                disabled={cancelando}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-500/20 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {cancelando ? 'Cancelando...' : 'Sí, Cancelar Reserva'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL CHECK-IN INTEGRADO ─── */}
      {modalCheckInOpen && (
        <CheckInModal
          isOpen={modalCheckInOpen}
          onClose={() => {
            setModalCheckInOpen(false);
            setReservaParaCheckIn(null);
          }}
          reservaPrevia={reservaParaCheckIn}
          habitacionSeleccionada={reservaParaCheckIn?.habitacion}
          onSuccess={() => {
            setModalCheckInOpen(false);
            setReservaParaCheckIn(null);
            cargarReservas();
            window.dispatchEvent(new CustomEvent('hotel-stats-changed'));
          }}
        />
      )}
    </div>
  );
}

/**
 * Subcomponente: Modal para Registrar Nueva Reserva Anticipada
 */
function ModalNuevaReserva({ isOpen, onClose, onSuccess }) {
  const [habitaciones, setHabitaciones] = useState([]);
  const [habitacionId, setHabitacionId] = useState('');
  const [modoHuesped, setModoHuesped] = useState('buscar'); // 'buscar' | 'nuevo'
  const [busquedaHuesped, setBusquedaHuesped] = useState('');
  const [huespedesEncontrados, setHuespedesEncontrados] = useState([]);
  const [huespedSeleccionado, setHuespedSeleccionado] = useState(null);

  // Nuevo Huésped
  const [nuevoHuesped, setNuevoHuesped] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'DNI',
    num_documento: '',
    telefono: '',
    email: '',
    nacionalidad: 'Peruana',
    ciudad_origen: ''
  });
  const [consultandoDoc, setConsultandoDoc] = useState(false);

  // Fechas y Estancia
  const hoyStr = new Date().toISOString().split('T')[0];
  const mananaDate = new Date();
  mananaDate.setDate(mananaDate.getDate() + 1);
  const mananaStr = mananaDate.toISOString().split('T')[0];

  const [fechaEntrada, setFechaEntrada] = useState(hoyStr);
  const [fechaSalida, setFechaSalida] = useState(mananaStr);
  const [numPersonas, setNumPersonas] = useState(1);
  const [precioNoche, setPrecioNoche] = useState(80);
  const [adelanto, setAdelanto] = useState('');
  const [metodoPagoAdelanto, setMetodoPagoAdelanto] = useState('efectivo');
  const [origen, setOrigen] = useState('presencial');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarHabitaciones();
  }, []);

  const cargarHabitaciones = async () => {
    try {
      const res = await api.get('/habitaciones');
      const list = res.data?.data || res.data || [];
      setHabitaciones(list);
      if (list.length > 0) {
        setHabitacionId(list[0].id);
        setPrecioNoche(parseFloat(list[0].tipo?.precio_base || 80));
      }
    } catch (_) {}
  };

  const handleHabitacionSelect = (id) => {
    setHabitacionId(id);
    const hab = habitaciones.find((h) => String(h.id) === String(id));
    if (hab && hab.tipo?.precio_base) {
      setPrecioNoche(parseFloat(hab.tipo.precio_base));
    }
  };

  // Cálculo de noches
  const numNoches = useMemo(() => {
    try {
      const fIn = new Date(fechaEntrada);
      const fOut = new Date(fechaSalida);
      const diff = Math.ceil((fOut - fIn) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    } catch {
      return 1;
    }
  }, [fechaEntrada, fechaSalida]);

  const settings = useSettingsStore();

  const tarifaDinamica = useMemo(() => {
    return calcularTarifaDinamica({
      precioBase: parseFloat(precioNoche) || 80,
      fechaEntrada: fechaEntrada || new Date(),
      noches: numNoches,
      config: settings
    });
  }, [precioNoche, fechaEntrada, numNoches, settings]);

  const totalCalculado = tarifaDinamica
    ? tarifaDinamica.totalFinal
    : +(numNoches * (parseFloat(precioNoche) || 0)).toFixed(2);
  const saldoCalculado = Math.max(0, +(totalCalculado - (parseFloat(adelanto) || 0)).toFixed(2));

  // Búsqueda de huésped
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (busquedaHuesped.trim().length >= 2) {
        try {
          const res = await api.get('/huespedes', {
            params: { busqueda: busquedaHuesped.trim() }
          });
          setHuespedesEncontrados(res.data?.data || []);
        } catch (_) {}
      } else {
        setHuespedesEncontrados([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaHuesped]);

  const handleConsultarDni = async () => {
    const doc = (nuevoHuesped.num_documento || '').trim();
    if (doc.length !== 8) {
      notificarError('Formato inválido', 'El DNI debe tener 8 dígitos.');
      return;
    }
    try {
      setConsultandoDoc(true);
      const res = await api.get(`/consultas/dni/${doc}`);
      const d = res.data?.data || res.data;
      if (d && (d.nombres || d.nombre_completo)) {
        setNuevoHuesped((prev) => ({
          ...prev,
          nombre: d.nombres || '',
          apellido: d.apellidos || `${d.apellido_paterno || ''} ${d.apellido_materno || ''}`.trim()
        }));
        notificarExito('RENIEC Conforme', `Encontrado: ${d.nombre_completo || d.nombres}`);
      }
    } catch (_) {
      notificarError('No encontrado', 'No se pudo consultar el DNI en RENIEC.');
    } finally {
      setConsultandoDoc(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!habitacionId) {
      toast.error('Seleccione una habitación.');
      return;
    }

    if (modoHuesped === 'buscar' && !huespedSeleccionado) {
      toast.error('Seleccione un huésped o registre uno nuevo.');
      return;
    }

    if (modoHuesped === 'nuevo' && (!nuevoHuesped.nombre || !nuevoHuesped.num_documento)) {
      toast.error('Complete el nombre y documento del huésped.');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        habitacion_id: habitacionId,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        num_personas: parseInt(numPersonas) || 1,
        precio_noche: tarifaDinamica ? tarifaDinamica.precioPromedioNoche : parseFloat(precioNoche) || 80,
        subtotal: totalCalculado,
        total: totalCalculado,
        adelanto: parseFloat(adelanto) || 0,
        metodo_pago_adelanto: metodoPagoAdelanto,
        origen,
        observaciones,
        estado: 'confirmada'
      };

      if (modoHuesped === 'buscar') {
        payload.huesped_id = huespedSeleccionado.id;
      } else {
        payload.nuevo_huesped = nuevoHuesped;
      }

      const res = await api.post('/reservas', payload);
      if (res.data?.success) {
        notificarExito('Reserva Exitosa', `Reserva ${res.data.data?.codigo || ''} guardada correctamente.`);
        onSuccess();
      }
    } catch (err) {
      notificarError('Error al guardar', err.response?.data?.message || err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.2]" />}
      title="Registrar Nueva Reserva Anticipada"
      subtitle="Reserva fechas, asigna habitación y registra adelantos"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* SELECCIÓN DE HABITACIÓN Y CANAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Habitación Asignada <span className="text-rose-500">*</span>
              </label>
              <select
                value={habitacionId}
                onChange={(e) => handleHabitacionSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500/20"
              >
                {habitaciones.map((h) => (
                  <option key={h.id} value={h.id}>
                    Hab. {h.numero} (Piso {h.piso}) — {h.tipo?.nombre} [S/ {parseFloat(h.tipo?.precio_base || 80).toFixed(2)}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Canal / Procedencia
              </label>
              <select
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="presencial">Mostrador / Presencial (Walk-in)</option>
                <option value="whatsapp">WhatsApp / Mensajería Directa</option>
                <option value="telefono">Llamada Telefónica</option>
                <option value="web">Página Web / Booking.com / Airbnb</option>
                <option value="agencia">Empresa / Convenio Corporativo</option>
              </select>
            </div>
          </div>

          {/* FECHAS DE ENTRADA Y SALIDA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Fecha Check-In
              </label>
              <input
                type="date"
                value={fechaEntrada}
                onChange={(e) => setFechaEntrada(e.target.value)}
                required
                className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Fecha Check-Out
              </label>
              <input
                type="date"
                value={fechaSalida}
                min={fechaEntrada}
                onChange={(e) => setFechaSalida(e.target.value)}
                required
                className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Tarifa x Noche (S/)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={precioNoche}
                onChange={(e) => setPrecioNoche(e.target.value)}
                required
                className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono font-bold"
              />
            </div>
          </div>

          {/* SECCIÓN HUÉSPED: BUSCAR VS NUEVO */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Datos del Huésped <span className="text-rose-500">*</span>
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModoHuesped('buscar')}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    modoHuesped === 'buscar'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Buscar Registrado
                </button>
                <button
                  type="button"
                  onClick={() => setModoHuesped('nuevo')}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    modoHuesped === 'nuevo'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  + Registrar Nuevo
                </button>
              </div>
            </div>

            {modoHuesped === 'buscar' ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaHuesped}
                    onChange={(e) => setBusquedaHuesped(e.target.value)}
                    placeholder="Escribe DNI, nombre o apellido para autocompletar..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {huespedSeleccionado && (
                  <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-blue-950 dark:text-blue-200">
                          {huespedSeleccionado.nombre} {huespedSeleccionado.apellido}
                        </span>
                        {huespedSeleccionado.clasificacion === 'vip' && (
                          <span className="p-0.5 rounded bg-amber-200 text-amber-800">
                            <Crown className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-blue-700/80 dark:text-blue-400">
                        {huespedSeleccionado.tipo_documento}: {huespedSeleccionado.num_documento} • {huespedSeleccionado.telefono || 'Sin tel'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHuespedSeleccionado(null)}
                      className="p-1 rounded-lg hover:bg-blue-200/50 text-blue-700 dark:text-blue-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {huespedesEncontrados.length > 0 && !huespedSeleccionado && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {huespedesEncontrados.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          setHuespedSeleccionado(h);
                          setBusquedaHuesped('');
                          setHuespedesEncontrados([]);
                        }}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {h.nombre} {h.apellido}
                          </span>
                          <span className="text-[10.5px] text-slate-400">
                            {h.tipo_documento}: {h.num_documento}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600">Seleccionar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="sm:col-span-2 flex gap-2">
                  <div className="w-28 shrink-0">
                    <select
                      value={nuevoHuesped.tipo_documento}
                      onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, tipo_documento: e.target.value })}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="DNI">DNI</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="Carnet Extranjería">CE</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>
                  <div className="flex-1 relative flex gap-2">
                    <input
                      type="text"
                      value={nuevoHuesped.num_documento}
                      onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, num_documento: e.target.value })}
                      placeholder="Número de documento..."
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                    {nuevoHuesped.tipo_documento === 'DNI' && (
                      <button
                        type="button"
                        onClick={handleConsultarDni}
                        disabled={consultandoDoc}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 disabled:opacity-50"
                      >
                        {consultandoDoc ? '...' : 'RENIEC'}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={nuevoHuesped.nombre}
                    onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, nombre: e.target.value })}
                    placeholder="Nombres..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={nuevoHuesped.apellido}
                    onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, apellido: e.target.value })}
                    placeholder="Apellidos..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={nuevoHuesped.telefono}
                    onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, telefono: e.target.value })}
                    placeholder="WhatsApp / Teléfono..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={nuevoHuesped.email}
                    onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, email: e.target.value })}
                    placeholder="Correo electrónico..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ADELANTO Y RESUMEN FINANCIERO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/50 via-slate-50 to-slate-100/50 dark:from-slate-850 dark:to-slate-900 border border-blue-200/70 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Adelanto / Seña Inicial (Opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max={totalCalculado}
                  value={adelanto}
                  onChange={(e) => setAdelanto(e.target.value)}
                  placeholder="S/ 0.00"
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
                <select
                  value={metodoPagoAdelanto}
                  onChange={(e) => setMetodoPagoAdelanto(e.target.value)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="yape">Yape / Plin</option>
                  <option value="tarjeta_debito">Débito</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col justify-center text-right font-mono">
              <span className="text-[11px] text-slate-400">
                {numNoches} {numNoches === 1 ? 'Noche' : 'Noches'} x S/ {parseFloat(precioNoche || 0).toFixed(2)}
              </span>
              <div className="text-base font-black text-slate-800 dark:text-white">
                Total: S/ {totalCalculado.toFixed(2)}
              </div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Saldo pendiente: S/ {saldoCalculado.toFixed(2)}
              </div>
            </div>
          </div>

          {tarifaDinamica?.esTarifaDinamica && (
            <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Tarifa Inteligente:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {tarifaDinamica.temporadasAplicadas.length > 0 && `Temp. ${tarifaDinamica.temporadasAplicadas.join(', ')}`}
                  {tarifaDinamica.nochesFinDeSemana > 0 && ` • ${tarifaDinamica.nochesFinDeSemana}n Fin de Semana`}
                  {tarifaDinamica.montoDescuento > 0 && ` • Descuento estadía (-S/ ${tarifaDinamica.montoDescuento})`}
                </span>
              </div>
              <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                S/ {tarifaDinamica.precioPromedioNoche.toFixed(2)}/noche prom.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones / Peticiones Especiales
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Cama adicional, llegada tardía a las 11 PM, requiere cochera..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* BOTONES */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Guardar Reserva</span>
                </>
              )}
            </button>
          </div>
      </form>
    </Modal>
  );
}

/**
 * Subcomponente: Modal Voucher y Ficha Oficial de Reserva
 */
function ModalDetalleReserva({ isOpen, reserva, onClose }) {
  if (!isOpen || !reserva) return null;

  const huesped = reserva.huesped || {};
  const habitacion = reserva.habitacion || {};

  const handleImprimir = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.2]" />}
      title="Voucher de Reserva Hotelera"
      subtitle={`Código: ${reserva.codigo}`}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-400 font-medium">
            Estado: <span className="font-bold uppercase text-slate-700 dark:text-slate-300">{reserva.estado}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImprimir}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      }
    >
      {/* Ficha Imprimible */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs font-sans">
        <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-sora">Huésped Principal</span>
            <span className="font-black text-slate-800 dark:text-white text-sm">
              {huesped.nombre} {huesped.apellido}
            </span>
            <span className="text-slate-500 block text-[11px]">
              {huesped.tipo_documento}: {huesped.num_documento} • {huesped.nacionalidad || 'Peruana'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-sora">Habitación</span>
            <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
              Hab. {habitacion.numero}
            </span>
            <span className="text-slate-500 block text-[11px]">
              {habitacion.tipo?.nombre} (Piso {habitacion.piso})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-sora">Fecha Entrada</span>
            <span className="font-mono font-bold text-slate-800 dark:text-white">{reserva.fecha_entrada}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-sora">Fecha Salida</span>
            <span className="font-mono font-bold text-slate-800 dark:text-white">{reserva.fecha_salida}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-sora">Estancia</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {reserva.num_noches} {reserva.num_noches === 1 ? 'Noche' : 'Noches'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 font-sans">Tarifa por noche:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              S/ {parseFloat(reserva.precio_noche || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-sans">Total estadía:</span>
            <span className="font-black text-slate-800 dark:text-white">
              S/ {parseFloat(reserva.total || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span className="font-sans">Adelanto registrado:</span>
            <span className="font-bold">
              S/ {parseFloat(reserva.adelanto || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold">
            <span className="font-sans">Saldo a pagar en Check-in:</span>
            <span>S/ {parseFloat(reserva.saldo || 0).toFixed(2)}</span>
          </div>
        </div>

        {reserva.observaciones && (
          <div className="pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-sora">Observaciones</span>
            <p className="text-slate-600 dark:text-slate-300 italic text-[11px]">
              "{reserva.observaciones}"
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

