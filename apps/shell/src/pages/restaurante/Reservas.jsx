import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import {
  CalendarCheck,
  CalendarDays,
  Plus,
  Search,
  User,
  Phone,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  X,
  RotateCw,
  LayoutGrid,
  List,
  UtensilsCrossed,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
  Layers,
  Building2,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  const [filtroFecha, setFiltroFecha] = useState('todas'); // 'todas' | 'hoy' | 'proximas'
  const [vistaModo, setVistaModo] = useState('tarjetas'); // 'tarjetas' | 'tabla'
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    client_name: '',
    phone: '',
    reservation_time: '',
    people: 2,
    table_id: '',
    note: ''
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resReservas, resAreas] = await Promise.all([
        api.get('/reservas'),
        api.get('/mesas/areas')
      ]);

      if (resReservas.success) setReservas(resReservas.reservas || []);
      if (resAreas.success) {
        const todasMesas = resAreas.areas.flatMap((a) =>
          (a.mesas || []).map((m) => ({ ...m, areaNombre: a.name }))
        );
        setMesas(todasMesas);
      }
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Error al sincronizar las reservaciones';
      toast.error(msg);
    } finally {
      setLoading(false);
      setUltimaActualizacion(new Date());
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Abrir modal crear
  const abrirModalCrear = () => {
    setReservaEditando(null);
    // Fecha y hora por defecto: hoy en 2 horas redondeado
    const ahora = new Date();
    ahora.setHours(ahora.getHours() + 2, 0, 0, 0);
    const tzOffset = ahora.getTimezoneOffset() * 60000;
    const localISOTime = new Date(ahora.getTime() - tzOffset).toISOString().slice(0, 16);

    setForm({
      client_name: '',
      phone: '',
      reservation_time: localISOTime,
      people: 2,
      table_id: '',
      note: ''
    });
    setModalAbierto(true);
  };

  // Abrir modal editar
  const abrirModalEditar = (r) => {
    setReservaEditando(r);
    let fechaLocal = '';
    if (r.reservation_time) {
      const d = new Date(r.reservation_time);
      const tzOffset = d.getTimezoneOffset() * 60000;
      fechaLocal = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    }

    setForm({
      client_name: r.client_name || '',
      phone: r.phone || '',
      reservation_time: fechaLocal,
      people: r.people || 2,
      table_id: r.table_id ? r.table_id.toString() : '',
      note: r.note || ''
    });
    setModalAbierto(true);
  };

  // Guardar (Crear o Actualizar)
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.client_name || !form.reservation_time) {
      toast.error('Complete el nombre del cliente y fecha/hora');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        client_name: form.client_name.trim(),
        phone: form.phone ? form.phone.trim() : '',
        reservation_time: form.reservation_time,
        people: parseInt(form.people, 10) || 1,
        table_id: form.table_id ? parseInt(form.table_id, 10) : null,
        note: form.note ? form.note.trim() : ''
      };

      if (reservaEditando) {
        const res = await api.put(`/reservas/${reservaEditando.id}`, payload);
        if (res.success) {
          toast.success(`Reserva de "${payload.client_name}" actualizada`);
          setModalAbierto(false);
          cargarDatos();
        }
      } else {
        const res = await api.post('/reservas', payload);
        if (res.success) {
          toast.success(`Reserva para "${payload.client_name}" registrada`);
          setModalAbierto(false);
          cargarDatos();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar reservación');
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar estado (confirmar, completar, cancelar)
  const cambiarEstado = async (id, status, clientName) => {
    try {
      const res = await api.patch(`/reservas/${id}/estado`, { status });
      if (res.success) {
        const labels = {
          confirmed: 'confirmada',
          completed: 'marcada como completada (sentados en mesa)',
          cancelled: 'cancelada',
          pending: 'marcada como pendiente'
        };
        toast.success(`Reserva de ${clientName || 'cliente'} ${labels[status] || 'actualizada'}`);
        cargarDatos();
      }
    } catch (err) {
      toast.error('Error al actualizar estado de la reserva');
    }
  };

  // Eliminar reserva
  const handleEliminar = async (id, clientName) => {
    if (!confirm(`¿Eliminar definitivamente la reserva de "${clientName}"?`)) return;
    try {
      const res = await api.delete(`/reservas/${id}`);
      if (res.success) {
        toast.success('Reserva eliminada del sistema');
        cargarDatos();
      }
    } catch (err) {
      toast.error('Error al eliminar reserva');
    }
  };

  // Métricas KPI
  const kpis = useMemo(() => {
    const ahora = new Date();
    const hoyStr = ahora.toDateString();

    let total = reservas.length;
    let pendientes = 0;
    let confirmadas = 0;
    let completadas = 0;
    let canceladas = 0;
    let hoy = 0;

    reservas.forEach((r) => {
      if (r.status === 'pending') pendientes++;
      if (r.status === 'confirmed') confirmadas++;
      if (r.status === 'completed') completadas++;
      if (r.status === 'cancelled') canceladas++;

      if (r.reservation_time && new Date(r.reservation_time).toDateString() === hoyStr) {
        hoy++;
      }
    });

    return { total, pendientes, confirmadas, completadas, canceladas, hoy };
  }, [reservas]);

  // Filtrado de reservaciones
  const reservasFiltradas = useMemo(() => {
    const ahora = new Date();
    const hoyStr = ahora.toDateString();

    return reservas.filter((r) => {
      // Filtro de Estado
      const coincideEstado = filtroEstado === 'todos' || r.status === filtroEstado;

      // Filtro de Fecha
      let coincideFecha = true;
      if (r.reservation_time) {
        const fechaR = new Date(r.reservation_time);
        if (filtroFecha === 'hoy') {
          coincideFecha = fechaR.toDateString() === hoyStr;
        } else if (filtroFecha === 'proximas') {
          coincideFecha = fechaR >= ahora;
        }
      }

      // Filtro de Búsqueda
      const q = busqueda.toLowerCase().trim();
      const coincideBusq =
        !q ||
        r.client_name.toLowerCase().includes(q) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.note && r.note.toLowerCase().includes(q)) ||
        (r.mesa && r.mesa.name.toLowerCase().includes(q));

      return coincideEstado && coincideFecha && coincideBusq;
    });
  }, [reservas, filtroEstado, filtroFecha, busqueda]);

  const horaActualizada = ultimaActualizacion.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="space-y-5 max-w-[1700px] w-full mx-auto">
      {/* ─── 1. ENCABEZADO DE RESERVACIONES (ESTILO DASHBOARD / SAAS TECH) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 font-sora">
              #05_RESERVAS
            </span>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              GESTION_RESERVAS_V2
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </span>
            Reservaciones y Asignación de Mesas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Programación anticipada de comensales, gestión de aforos, confirmación telefónica y bloqueo de mesas en vivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Buscador de Reservas */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente, teléfono, mesa..."
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-8 pr-7 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 font-sora w-48 sm:w-60"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Modo de Vista (Tarjetas / Tabla) */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={() => setVistaModo('tarjetas')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                vistaModo === 'tarjetas'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vista en Tarjetas de Reservación"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('tabla')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                vistaModo === 'tabla'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vista en Tabla Cronológica"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón de Refrescar */}
          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-amber-300 dark:hover:border-amber-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            title="Refrescar reservaciones"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:rotate-180 transition-transform duration-500 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span className="font-sora text-[11px] font-bold hidden sm:inline">
              {loading ? 'Cargando...' : `Act. ${horaActualizada}`}
            </span>
          </button>

          {/* Botón Nueva Reserva */}
          <button
            type="button"
            onClick={abrirModalCrear}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold font-sora transition-all shadow-md shadow-amber-600/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TARJETAS KPI (ESTILO DASHBOARD) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* KPI Total Reservas */}
        <div
          onClick={() => {
            setFiltroEstado('todos');
            setFiltroFecha('todas');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            filtroEstado === 'todos' && filtroFecha === 'todas'
              ? 'border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">#01_TOTAL</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-sora">
                {kpis.total}
              </span>
              <span className="text-[10px] text-slate-400 font-bold font-sora">reservas</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Histórico general</p>
          </div>
        </div>

        {/* KPI Pendientes */}
        <div
          onClick={() => {
            setFiltroEstado(filtroEstado === 'pending' ? 'todos' : 'pending');
            setFiltroFecha('todas');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            filtroEstado === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
              : 'border-amber-100/90 dark:border-slate-800 hover:border-amber-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">#02_PENDIENTES</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-sora">
                {kpis.pendientes}
              </span>
              <span className="text-[10px] text-amber-600 font-bold font-sora">por confirmar</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Esperando llamada/validación</p>
          </div>
        </div>

        {/* KPI Confirmadas */}
        <div
          onClick={() => {
            setFiltroEstado(filtroEstado === 'confirmed' ? 'todos' : 'confirmed');
            setFiltroFecha('todas');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            filtroEstado === 'confirmed'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
              : 'border-emerald-100/90 dark:border-slate-800 hover:border-emerald-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">#03_CONFIRMADAS</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sora">
                {kpis.confirmadas}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold font-sora">aseguradas</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Mesa bloqueada en salón</p>
          </div>
        </div>

        {/* KPI Reservas de Hoy */}
        <div
          onClick={() => {
            setFiltroFecha(filtroFecha === 'hoy' ? 'todas' : 'hoy');
            setFiltroEstado('todos');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            filtroFecha === 'hoy'
              ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md shadow-sky-500/10'
              : 'border-sky-100/90 dark:border-slate-800 hover:border-sky-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">#04_TURNO_HOY</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 font-sora">
                {kpis.hoy}
              </span>
              <span className="text-[10px] text-sky-600 font-bold font-sora">para hoy</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Llegadas del día actual</p>
          </div>
        </div>
      </div>

      {/* ─── 3. TARJETAS DE ESTADOS DE RESERVA (SELECTOR RÁPIDO ESTILO SALONES) ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sora flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Segmentación por Estado Operativo
          </h2>
          <span className="text-[10.5px] text-slate-400 font-mono font-semibold">
            {kpis.total} Reservas Totales
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Todas */}
          <div
            onClick={() => setFiltroEstado('todos')}
            role="button"
            tabIndex={0}
            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
              filtroEstado === 'todos'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-amber-600 transition-colors">
                #RES_ALL
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  filtroEstado === 'todos'
                    ? 'bg-amber-500 ring-4 ring-amber-500/20'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                  filtroEstado === 'todos'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-white'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                  Todas
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">{kpis.total} registradas</p>
              </div>
            </div>
          </div>

          {/* Pendientes */}
          <div
            onClick={() => setFiltroEstado('pending')}
            role="button"
            tabIndex={0}
            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
              filtroEstado === 'pending'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-500 transition-colors">
                #RES_PEND
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  filtroEstado === 'pending'
                    ? 'bg-amber-500 ring-4 ring-amber-500/20'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                  filtroEstado === 'pending'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                  Pendientes
                </h3>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  {kpis.pendientes} por validar
                </p>
              </div>
            </div>
          </div>

          {/* Confirmadas */}
          <div
            onClick={() => setFiltroEstado('confirmed')}
            role="button"
            tabIndex={0}
            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
              filtroEstado === 'confirmed'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors">
                #RES_CONF
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  filtroEstado === 'confirmed'
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                  filtroEstado === 'confirmed'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                  Confirmadas
                </h3>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {kpis.confirmadas} aseguradas
                </p>
              </div>
            </div>
          </div>

          {/* Completadas */}
          <div
            onClick={() => setFiltroEstado('completed')}
            role="button"
            tabIndex={0}
            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
              filtroEstado === 'completed'
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500/80 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors">
                #RES_DONE
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  filtroEstado === 'completed'
                    ? 'bg-blue-500 ring-4 ring-blue-500/20'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                  filtroEstado === 'completed'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                  Completadas
                </h3>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  {kpis.completadas} sentadas
                </p>
              </div>
            </div>
          </div>

          {/* Canceladas */}
          <div
            onClick={() => setFiltroEstado('cancelled')}
            role="button"
            tabIndex={0}
            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
              filtroEstado === 'cancelled'
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500/80 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 group-hover:text-rose-500 transition-colors">
                #RES_CANC
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  filtroEstado === 'cancelled'
                    ? 'bg-rose-500 ring-4 ring-rose-500/20'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                  filtroEstado === 'cancelled'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white'
                }`}
              >
                <XCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                  Canceladas
                </h3>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                  {kpis.canceladas} liberadas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. BARRA DE FILTROS SECUNDARIOS & FECHAS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 font-sora tracking-tight">
            Listado de Comensales
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
            {reservasFiltradas.length} {reservasFiltradas.length === 1 ? 'reserva' : 'reservas'}
          </span>
        </div>

        {/* Filtros de Fecha Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFiltroFecha('todas')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer ${
              filtroFecha === 'todas'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            Todas las fechas
          </button>
          <button
            type="button"
            onClick={() => setFiltroFecha('hoy')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroFecha === 'hoy'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:border-sky-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Solo Hoy ({kpis.hoy})
          </button>
          <button
            type="button"
            onClick={() => setFiltroFecha('proximas')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroFecha === 'proximas'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:border-amber-300'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            Próximas
          </button>
        </div>
      </div>

      {/* ─── 5. CONTENIDO: TARJETAS O TABLA ─── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-sora flex flex-col items-center justify-center gap-2">
          <RotateCw className="w-6 h-6 animate-spin text-amber-500" />
          <span>Sincronizando agenda de reservaciones...</span>
        </div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-sora bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-2xs">
          No se encontraron reservaciones con los filtros seleccionados.
        </div>
      ) : vistaModo === 'tarjetas' ? (
        /* ── VISTA EN TARJETAS DE RESERVACIÓN (ESTILO DASHBOARD / MESAS) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {reservasFiltradas.map((r) => {
            const esPendiente = r.status === 'pending';
            const esConfirmada = r.status === 'confirmed';
            const esCompletada = r.status === 'completed';
            const esCancelada = r.status === 'cancelled';

            const cardBorder = esPendiente
              ? 'border-amber-200/90 dark:border-amber-800/80 hover:border-amber-500 dark:hover:border-amber-500'
              : esConfirmada
              ? 'border-emerald-200/90 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-500'
              : esCompletada
              ? 'border-blue-200/90 dark:border-blue-800/80 hover:border-blue-500 dark:hover:border-blue-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 opacity-80';

            const glowBg = esPendiente
              ? 'bg-amber-500/15'
              : esConfirmada
              ? 'bg-emerald-500/15'
              : esCompletada
              ? 'bg-blue-500/15'
              : 'bg-rose-500/10';

            const iconBoxBg = esPendiente
              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60'
              : esConfirmada
              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60'
              : esCompletada
              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60'
              : 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60';

            const tagRes = `#RES_${String(r.id).padStart(2, '0')}`;

            // Formateo de Fecha
            const fechaObj = r.reservation_time ? new Date(r.reservation_time) : null;
            const esHoy = fechaObj && fechaObj.toDateString() === new Date().toDateString();
            const fechaStr = fechaObj
              ? fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Sin fecha';
            const horaStr = fechaObj
              ? fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
              : '--:--';

            return (
              <div
                key={r.id}
                className={`group relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-xl hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] select-none touch-manipulation overflow-hidden ${cardBorder}`}
              >
                {/* Ambient Glow */}
                <div
                  className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all ${glowBg}`}
                />

                {/* Fila Superior: Tag técnico + Badge Estado */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {tagRes}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 font-sora ${
                        esPendiente
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
                          : esConfirmada
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                          : esCompletada
                          ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60'
                          : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          esPendiente
                            ? 'bg-amber-500 animate-pulse'
                            : esConfirmada
                            ? 'bg-emerald-500'
                            : esCompletada
                            ? 'bg-blue-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      {esPendiente
                        ? 'Pendiente'
                        : esConfirmada
                        ? 'Confirmada'
                        : esCompletada
                        ? 'Completada'
                        : 'Cancelada'}
                    </span>
                  </div>

                  {/* Nombre del Cliente y Cantidad de Personas */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconBoxBg} group-hover:scale-105 transition-transform mt-0.5`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                        title={r.client_name}
                      >
                        {r.client_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{r.people} {r.people === 1 ? 'persona' : 'personas'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Caja de Detalles (Fecha, Hora, Mesa y Contacto) */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
                    {/* Fecha y Hora */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 font-sora">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{fechaStr} • {horaStr}</span>
                      </div>
                      {esHoy && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-sora">
                          ¡Hoy!
                        </span>
                      )}
                    </div>

                    {/* Mesa Asignada */}
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[11px] text-slate-400 font-medium">Mesa:</span>
                      {r.mesa ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 font-sora">
                          <UtensilsCrossed className="w-3 h-3" />
                          {r.mesa.name} {r.mesa.seats ? `(${r.mesa.seats} sillas)` : ''}
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 italic">
                          Asignar al llegar
                        </span>
                      )}
                    </div>

                    {/* Teléfono */}
                    {r.phone && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                        <span className="text-[11px] text-slate-400 font-medium">Teléfono:</span>
                        <a
                          href={`tel:${r.phone}`}
                          className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          {r.phone}
                        </a>
                      </div>
                    )}

                    {/* Notas Especiales */}
                    {r.note && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 italic bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-200/50 dark:border-amber-900/30 line-clamp-2">
                          "{r.note}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de Acción Táctiles */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                  {esPendiente ? (
                    <>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(r.id, 'confirmed', r.client_name)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold font-sora transition-all active:scale-95 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(r)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-slate-700 dark:text-slate-200 transition-colors"
                        title="Editar reserva"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(r.id, 'cancelled', r.client_name)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Cancelar reserva"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : esConfirmada ? (
                    <>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(r.id, 'completed', r.client_name)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold font-sora transition-all active:scale-95 cursor-pointer shadow-xs"
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>Sentar / Completar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirModalEditar(r)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-slate-700 dark:text-slate-200 transition-colors"
                        title="Editar reserva"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(r.id, 'cancelled', r.client_name)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Cancelar reserva"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(r.id, 'confirmed', r.client_name)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white text-[11px] font-bold font-sora transition-colors"
                      >
                        Reactivar Reserva
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(r.id, r.client_name)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VISTA EN TABLA CRONOLÓGICA DUAL LIGHT/DARK ── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sora">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Código</th>
                  <th className="py-3.5 px-4 font-bold">Cliente</th>
                  <th className="py-3.5 px-4 font-bold">Fecha y Hora</th>
                  <th className="py-3.5 px-4 font-bold text-center">Personas</th>
                  <th className="py-3.5 px-4 font-bold">Mesa Asignada</th>
                  <th className="py-3.5 px-4 font-bold">Teléfono</th>
                  <th className="py-3.5 px-4 font-bold">Notas Especiales</th>
                  <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                  <th className="py-3.5 px-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {reservasFiltradas.map((r) => {
                  const tagRes = `#RES_${String(r.id).padStart(2, '0')}`;
                  const fechaObj = r.reservation_time ? new Date(r.reservation_time) : null;
                  const fechaStr = fechaObj
                    ? fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Sin fecha';
                  const horaStr = fechaObj
                    ? fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                    : '--:--';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {tagRes}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                        {r.client_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {fechaStr} • <span className="font-bold text-amber-600 dark:text-amber-400">{horaStr}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {r.people}
                      </td>
                      <td className="py-3 px-4">
                        {r.mesa ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            {r.mesa.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Asignar al llegar</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {r.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {r.note || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'confirmed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                              : r.status === 'completed'
                              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60'
                              : r.status === 'cancelled'
                              ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                              : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
                          }`}
                        >
                          {r.status === 'confirmed'
                            ? 'Confirmada'
                            : r.status === 'completed'
                            ? 'Completada'
                            : r.status === 'cancelled'
                            ? 'Cancelada'
                            : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => cambiarEstado(r.id, 'confirmed', r.client_name)}
                              className="px-2 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[10.5px] hover:bg-emerald-600 transition-colors"
                            >
                              Confirmar
                            </button>
                          )}
                          {r.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => cambiarEstado(r.id, 'completed', r.client_name)}
                              className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10.5px] hover:bg-blue-500 transition-colors"
                            >
                              Sentar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(r)}
                            className="p-1 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {r.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => cambiarEstado(r.id, 'cancelled', r.client_name)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                              title="Cancelar"
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
        </div>
      )}

      {/* ─── 6. MODAL PARA CREAR / EDITAR RESERVACIÓN ─── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleGuardar}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100 font-sora"
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {reservaEditando ? 'Editar Reservación' : 'Registrar Reservación'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {reservaEditando
                      ? 'Actualice la mesa, número de personas o fecha de visita.'
                      : 'Agende con anticipación el espacio para los comensales.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nombre del Cliente */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Nombre del Cliente o Empresa *
              </label>
              <input
                type="text"
                required
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Ej. Familia Rodríguez, Juan Pérez, Evento Corporativo..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
              />
            </div>

            {/* Teléfono y Personas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Ej. 987 654 321"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Cantidad de Personas *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={form.people}
                  onChange={(e) => setForm({ ...form, people: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-600 dark:text-amber-400 font-black focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Fecha y Hora + Mesa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Fecha y Hora de la Cita *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.reservation_time}
                  onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Mesa Bloqueada (Opcional)
                </label>
                <select
                  value={form.table_id}
                  onChange={(e) => setForm({ ...form, table_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="">Asignar al momento de llegar...</option>
                  {mesas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.seats} sillas) {m.areaNombre ? `• ${m.areaNombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notas Especiales */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Notas del Evento u Ocasión Especial
              </label>
              <textarea
                rows="2"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Cumpleaños, aniversario, silla para bebé, decoración de mesa..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Botones del Modal */}
            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold font-sora hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold font-sora hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                {guardando
                  ? 'Guardando...'
                  : reservaEditando
                  ? 'Guardar Cambios'
                  : 'Agendar Reserva'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
