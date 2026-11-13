import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from './api';
import CheckInModal from './CheckInModal';
import CheckOutModal from './CheckOutModal';
import DropdownPill from './components/DropdownPill';
import ModalPersonalizarPisos from './components/ModalPersonalizarPisos';
import ModalFichaMincetur from './components/ModalFichaMincetur';
import ModalExtenderEstadia from './components/ModalExtenderEstadia';
import TapeChartCalendar from './components/TapeChartCalendar';
import { useHotelCartStore } from './store/hotelCartStore';

const OPCIONES_CATEGORIA_CARGO_RACK = [
  { value: 'minibar', label: 'Minibar (Bebidas, Snacks)', badge: 'Minibar' },
  { value: 'restaurante', label: 'Restaurante / Room Service', badge: 'Cocina' },
  { value: 'lavanderia', label: 'Lavandería y Planchado', badge: 'Servicio' },
  { value: 'spa', label: 'Spa / Sauna / Relax', badge: 'Bienestar' },
  { value: 'tours', label: 'Transporte / Tour', badge: 'Turismo' },
  { value: 'otros', label: 'Otros Servicios', badge: 'Varios' }
];
import {
  BedDouble,
  User,
  Sparkles,
  Wrench,
  CheckCircle,
  Plus,
  LogIn,
  LogOut,
  Wine,
  Filter,
  RefreshCw,
  Layers,
  Calendar,
  Store,
  Clock,
  ArrowRight,
  Users,
  CheckCircle2,
  X,
  Building2,
  LayoutGrid,
  Receipt,
  RotateCcw,
  ArrowRightLeft,
  AlertTriangle,
  CalendarPlus,
  FileText,
  Crown,
  ShieldAlert,
  Search,
  List,
  KeyRound
} from 'lucide-react';
import ModalRoomTransfer from './components/ModalRoomTransfer';

export default function RackHabitaciones() {
  const navigate = useNavigate();
  const { setReservaSeleccionada, setModoCobro } = useHotelCartStore();
  const [rackData, setRackData] = useState({ resumen: {}, pisos: [], habitaciones: [] });
  const [pisoSeleccionado, setPisoSeleccionado] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  // Fase 3: Modo de Vista (Tarjetas vs Calendario Tape Chart)
  const [vistaModo, setVistaModo] = useState('tarjetas'); // 'tarjetas' | 'tapechart'

  // Modals state
  const [modalCheckInOpen, setModalCheckInOpen] = useState(false);
  const [habitacionParaCheckIn, setHabitacionParaCheckIn] = useState(null);
  const [reservaParaCheckIn, setReservaParaCheckIn] = useState(null);

  const [modalCheckOutOpen, setModalCheckOutOpen] = useState(false);
  const [reservaIdParaCheckOut, setReservaIdParaCheckOut] = useState(null);
  const [habitacionNumeroParaCheckOut, setHabitacionNumeroParaCheckOut] = useState('');

  // Transferencia de Habitación
  const [modalTransferOpen, setModalTransferOpen] = useState(false);
  const [habitacionParaTransferir, setHabitacionParaTransferir] = useState(null);

  // Fase 2: Ficha Oficial MINCETUR y Extender Estadía
  const [modalMinceturOpen, setModalMinceturOpen] = useState(false);
  const [reservaIdParaMincetur, setReservaIdParaMincetur] = useState(null);
  const [modalExtenderOpen, setModalExtenderOpen] = useState(false);
  const [habitacionParaExtender, setHabitacionParaExtender] = useState(null);

  // Configuración de límites de Check-out
  const [configCheckout, setConfigCheckout] = useState({
    horaLimite: '12:00',
    toleranciaMinutos: 15
  });

  // Quick consumption modal state
  const [modalCargoOpen, setModalCargoOpen] = useState(false);
  const [reservaCargo, setReservaCargo] = useState(null);
  const [conceptoCargo, setConceptoCargo] = useState('');
  const [precioCargo, setPrecioCargo] = useState('');
  const [categoriaCargo, setCategoriaCargo] = useState('minibar');

  // Estado del menú desplegable de Ocupación
  const [isOcupacionOpen, setIsOcupacionOpen] = useState(false);
  const [modalPisosOpen, setModalPisosOpen] = useState(false);
  const ocupacionRef = useRef(null);

  const hoyObj = new Date();
  const hoyYMD = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
  const hoyStr = new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date());

  useEffect(() => {
    if (!isOcupacionOpen) return;
    const handleClickOutside = (e) => {
      if (ocupacionRef.current && !ocupacionRef.current.contains(e.target)) {
        setIsOcupacionOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOcupacionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOcupacionOpen]);

  useEffect(() => {
    cargarRack();
    api.get('/configuracion').then(res => {
      const data = res.data?.data || res.data;
      if (data) {
        setConfigCheckout({
          horaLimite: data.hora_limite_checkout || '12:00',
          toleranciaMinutos: parseInt(data.tolerancia_checkout_minutos || 15)
        });
      }
    }).catch(() => {});
  }, []);

  // Función para determinar si el checkout de una habitación ocupada está vencido
  const calcularAlertaCheckout = (reserva) => {
    if (!reserva || !reserva.fecha_salida) return null;
    try {
      const fechaSalidaStr = String(reserva.fecha_salida).substring(0, 10);
      const hoy = new Date();
      const año = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      const hoyYMD = `${año}-${mes}-${dia}`;

      if (fechaSalidaStr < hoyYMD) {
        return { esVencido: true, texto: 'Salida Vencida (Fecha Pasada)' };
      }

      if (fechaSalidaStr === hoyYMD) {
        const horaLimite = configCheckout.horaLimite || '12:00';
        const [hLim, mLim] = horaLimite.split(':').map(Number);
        const tolerancia = Number(configCheckout.toleranciaMinutos) || 15;

        const fechaLimite = new Date();
        fechaLimite.setHours(hLim, mLim + tolerancia, 0, 0);

        if (hoy > fechaLimite) {
          const diffMs = hoy.getTime() - fechaLimite.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          const horas = Math.floor(diffMins / 60);
          const minutos = diffMins % 60;
          const tiempoStr = horas > 0 ? `+${horas}h ${minutos}m` : `+${minutos}m`;
          return { esVencido: true, texto: `Check-out Vencido (${tiempoStr})` };
        }
      }
    } catch (_) {}
    return null;
  };

  // Fase 2: Cálculo en tiempo real de Day-Use por Horas
  const calcularEstadoDayUse = (reserva) => {
    if (!reserva || reserva.modalidad !== 'horas' || !reserva.fecha_hora_salida) return null;
    try {
      const ahora = new Date();
      const salida = new Date(reserva.fecha_hora_salida);
      const diffMs = salida.getTime() - ahora.getTime();
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins <= 0) {
        const pasados = Math.abs(diffMins);
        const horasPasadas = Math.floor(pasados / 60);
        const minPasados = pasados % 60;
        const tiempoStr = horasPasadas > 0 ? `+${horasPasadas}h ${minPasados}m` : `+${minPasados}m`;
        return { esVencido: true, texto: `Excedido (${tiempoStr})` };
      } else {
        const horas = Math.floor(diffMins / 60);
        const minutos = diffMins % 60;
        const tiempoStr = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
        return { esVencido: false, texto: `Quedan ${tiempoStr}` };
      }
    } catch (_) {}
    return null;
  };

  const cargarRack = async () => {
    try {
      setLoading(true);
      const res = await api.get('/habitaciones/rack');
      const data = res.data.data || res.data;
      setRackData(data);
    } catch (err) {
      console.error('Error al cargar rack:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLimpia = async (habitacionId) => {
    try {
      await api.patch(`/habitaciones/${habitacionId}/limpieza`, {
        estado_limpieza: 'limpia',
        notas: 'Habitación aseada y preparada para nuevo huésped'
      });
      cargarRack();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar limpieza.');
    }
  };

  const handlePonerMantenimiento = async (habitacion) => {
    const nuevoEstado = habitacion.estado === 'mantenimiento' ? 'disponible' : 'mantenimiento';
    try {
      await api.patch(`/habitaciones/${habitacion.id}/estado`, { estado: nuevoEstado });
      cargarRack();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado.');
    }
  };

  const handleIrAlPos = (reserva, habitacion) => {
    if (!reserva) return;
    setModoCobro('habitacion');
    setReservaSeleccionada({
      ...reserva,
      habitacion
    });
    navigate('/pos');
  };

  const handleAbrirCargo = (reserva, numHab) => {
    setReservaCargo({ ...reserva, numHab });
    setConceptoCargo('');
    setPrecioCargo('');
    setModalCargoOpen(true);
  };

  const handleGuardarCargo = async (e) => {
    e.preventDefault();
    if (!reservaCargo || !conceptoCargo || !precioCargo) return;
    try {
      await api.post('/cargos', {
        reserva_id: reservaCargo.id,
        concepto: conceptoCargo,
        categoria: categoriaCargo,
        precio_unitario: parseFloat(precioCargo),
        cantidad: 1
      });
      setModalCargoOpen(false);
      cargarRack();
      alert(`Cargo "${conceptoCargo}" agregado correctamente a la habitación.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar consumo.');
    }
  };

  const { resumen, pisos, habitaciones } = rackData;
  const tasaOcupacion = resumen?.total > 0 ? Math.round(((resumen.ocupadas || 0) / resumen.total) * 100) : 0;

  // Filter rooms
  const habitacionesFiltradas = habitaciones.filter(h => {
    const matchPiso = pisoSeleccionado === 'todos' || String(h.piso) === String(pisoSeleccionado);
    const matchEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'limpieza'
        ? (h.estado_limpieza === 'en_limpieza' || h.estado_limpieza === 'sucia')
        : filtroEstado === 'reservada'
        ? (h.estado === 'reservada' || (h.reservas || []).some(r => r.estado === 'confirmada' || r.estado === 'pendiente'))
        : h.estado === filtroEstado);

    if (!matchPiso || !matchEstado) return false;

    if (!busqueda.trim()) return true;

    const q = busqueda.toLowerCase().trim();
    const res = h.reservas?.find(r => r.estado === 'checkin') || h.reservas?.[0];
    const proxima = h.reservas?.find(r => r.estado === 'confirmada' || r.estado === 'pendiente');
    const numHab = String(h.numero || '').toLowerCase();
    const tipoHab = String(h.tipo?.nombre || '').toLowerCase();
    const huespedNombre = String(res?.huesped?.nombre || '').toLowerCase();
    const huespedApellido = String(res?.huesped?.apellido || '').toLowerCase();
    const huespedDoc = String(res?.huesped?.num_documento || '').toLowerCase();
    const proximaNombre = String(proxima?.huesped?.nombre || '').toLowerCase();
    const proximaApellido = String(proxima?.huesped?.apellido || '').toLowerCase();
    const proximaDoc = String(proxima?.huesped?.num_documento || '').toLowerCase();
    const acompanantes = (res?.acompanantes || []).map(a => `${a.nombre} ${a.apellido} ${a.num_documento}`).join(' ').toLowerCase();

    return (
      numHab.includes(q) ||
      tipoHab.includes(q) ||
      huespedNombre.includes(q) ||
      huespedApellido.includes(q) ||
      `${huespedNombre} ${huespedApellido}`.includes(q) ||
      huespedDoc.includes(q) ||
      proximaNombre.includes(q) ||
      proximaApellido.includes(q) ||
      `${proximaNombre} ${proximaApellido}`.includes(q) ||
      proximaDoc.includes(q) ||
      acompanantes.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* ─── ENCABEZADO CÁPSULA FLOTANTE ULTRA-SLIM ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-xs">
            <BedDouble className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                Rack Interactivo de Habitaciones
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Tiempo Real
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Gestión en tiempo real de disponibilidad, check-ins, check-outs y consumos en hospedaje
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            onClick={cargarRack}
            data-tooltip="Actualizar estado de habitaciones [F5]"
            className="p-2 sm:px-3 sm:py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
          {/* Botón de Ocupación en Vivo con Modal Detallado */}
          <button
            type="button"
            onClick={() => setIsOcupacionOpen(true)}
            className={`h-10 sm:h-11 px-3.5 sm:px-4 rounded-2xl flex items-center gap-2 bg-blue-50/90 dark:bg-blue-950/60 hover:bg-blue-100/90 dark:hover:bg-blue-900/60 border border-blue-200/90 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-extrabold font-sora shadow-xs cursor-pointer transition-all hover:scale-102 active:scale-95 shrink-0 ${
              isOcupacionOpen ? 'ring-2 ring-blue-500/40 bg-blue-100 dark:bg-blue-900/80 shadow-md' : ''
            }`}
            title="Ver Resumen de Ocupación & Métricas en Vivo"
          >
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 dark:bg-blue-400"></span>
            </span>
            <BedDouble className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="tracking-tight whitespace-nowrap">
              Ocupación <span className="font-mono font-black text-blue-800 dark:text-blue-200">{tasaOcupacion}%</span>
            </span>
          </button>

          {/* ─── MODAL MONITOR DE OCUPACIÓN HOTELERA ─── */}
          {isOcupacionOpen && createPortal(
            <div
              onClick={() => setIsOcupacionOpen(false)}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-200 overflow-y-auto"
              style={{ WebkitBackdropFilter: 'blur(3px)', backdropFilter: 'blur(3px)' }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="my-auto w-full max-w-xl bg-white dark:bg-[#0c1427] rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-2xl p-5 sm:p-7 relative select-none animate-in zoom-in-95 duration-200"
              >
                {/* Header del Modal */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center shrink-0 shadow-xs">
                      <BedDouble className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-sora tracking-tight">
                          Monitor de Ocupación Hotelera
                        </h3>
                        <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          En Vivo
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Recepción & Control Operativo • <span className="font-mono font-bold text-slate-700 dark:text-slate-300 capitalize">{hoyStr}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOcupacionOpen(false)}
                    className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
                    title="Cerrar modal (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tarjeta de Resumen Visual de Ocupación */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50/60 dark:from-blue-950/40 dark:via-slate-900/90 dark:to-slate-900/80 border border-blue-200/80 dark:border-blue-900/60 shadow-xs mb-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 font-sora">
                        Tasa de Ocupación Global
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        tasaOcupacion >= 80
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : tasaOcupacion >= 40
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {tasaOcupacion >= 80 ? 'Alta Demanda' : tasaOcupacion >= 40 ? 'Ocupación Media' : 'Disponibilidad Amplia'}
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-blue-700 dark:text-blue-300 font-mono tracking-tight">
                        {tasaOcupacion}%
                      </span>
                    </div>
                  </div>

                  {/* Barra visual de progreso */}
                  <div className="w-full h-3.5 rounded-full bg-slate-200/90 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-300/40 dark:border-slate-700/50 shadow-inner my-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 transition-all duration-700 shadow-xs"
                      style={{ width: `${Math.min(100, Math.max(0, tasaOcupacion))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>
                      <strong className="text-slate-800 dark:text-slate-100 font-bold font-mono">{resumen?.ocupadas || 0}</strong> de <strong className="text-slate-800 dark:text-slate-100 font-bold font-mono">{resumen?.total || 0}</strong> habitaciones ocupadas
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {100 - tasaOcupacion}% libre para reserva
                    </span>
                  </div>
                </div>

                {/* Grid 2x2 de Métricas Espaciosas */}
                <div className="grid grid-cols-2 gap-3 sm:gap-3.5 mb-5">
                  {/* Ocupadas */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50 flex items-center gap-3.5 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white leading-tight">
                        {resumen?.ocupadas || 0} <span className="text-xs font-normal text-slate-400">/ {resumen?.total || 0}</span>
                      </div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-300 font-sora">
                        Hab. Ocupadas
                      </div>
                    </div>
                  </div>

                  {/* Disponibles */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center gap-3.5 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
                        {resumen?.disponibles || 0} <span className="text-xs font-normal text-slate-400">habs</span>
                      </div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-sora">
                        Disponibles
                      </div>
                    </div>
                  </div>

                  {/* En Limpieza */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 flex items-center gap-3.5 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400 leading-tight">
                        {(resumen?.en_limpieza || 0) + (resumen?.sucias || 0)} <span className="text-xs font-normal text-slate-400">habs</span>
                      </div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-300 font-sora">
                        En Limpieza
                      </div>
                    </div>
                  </div>

                  {/* Mantenimiento */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-black font-mono text-slate-700 dark:text-slate-300 leading-tight">
                        {resumen?.mantenimiento || 0} <span className="text-xs font-normal text-slate-400">habs</span>
                      </div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-400 font-sora">
                        Mantenimiento
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas y Filtros */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sora">
                    Filtrar Habitaciones en el Rack
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroEstado('disponible');
                        setIsOcupacionOpen(false);
                      }}
                      className="py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:scale-101 active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Libres ({resumen?.disponibles || 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFiltroEstado('ocupada');
                        setIsOcupacionOpen(false);
                      }}
                      className="py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:scale-101 active:scale-98"
                    >
                      <BedDouble className="w-4 h-4 shrink-0" />
                      <span>Ocupadas ({resumen?.ocupadas || 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFiltroEstado('todos');
                        setIsOcupacionOpen(false);
                      }}
                      className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:scale-101 active:scale-98"
                    >
                      <Filter className="w-4 h-4 shrink-0" />
                      <span>Todas ({resumen?.total || 0})</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOcupacionOpen(false);
                        navigate('/pos');
                      }}
                      className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/70 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Punto de Venta (POS & Minibar)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOcupacionOpen(false);
                        navigate('/caja-finanzas?tab=facturas');
                      }}
                      className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/70 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Comprobantes & Caja SUNAT</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Selector de Modo de Visualización: Tarjetas vs Lista vs Tape Chart */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setVistaModo('tarjetas')}
              className={`h-9 px-3 rounded-xl text-xs font-extrabold font-sora transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaModo === 'tarjetas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista en Tarjetas interactivas del Rack"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('lista')}
              className={`h-9 px-3 rounded-xl text-xs font-extrabold font-sora transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaModo === 'lista'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista en Lista detallada del Rack de Habitaciones"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('tapechart')}
              className={`h-9 px-3 rounded-xl text-xs font-extrabold font-sora transition-all flex items-center gap-1.5 cursor-pointer ${
                vistaModo === 'tapechart'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista de Calendario horizontal Tape Chart"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tape Chart</span>
            </button>
          </div>

          <button
            onClick={() => {
              setHabitacionParaCheckIn(null);
              setModalCheckInOpen(true);
            }}
            data-tooltip="Iniciar registro rápido de nuevo huésped"
            className="glow-btn-hotel flex items-center gap-2 px-5 py-2.5 text-white rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Check-in Rápido</span>
          </button>
        </div>
      </div>

      {/* ─── VISTA CONDICIONAL: TAPE CHART vs TARJETAS TRADICIONALES ─── */}
      {vistaModo === 'tapechart' ? (
        <TapeChartCalendar
          onAbrirCheckIn={(hab, fecha) => {
            setHabitacionParaCheckIn(hab);
            setModalCheckInOpen(true);
          }}
          onAbrirCheckOut={(resId, numHab) => {
            setReservaIdParaCheckOut(resId);
            setHabitacionNumeroParaCheckOut(numHab);
            setModalCheckOutOpen(true);
          }}
          onAbrirFichaMincetur={(resId) => {
            setReservaIdParaMincetur(resId);
            setModalMinceturOpen(true);
          }}
          onAbrirExtender={(hab) => {
            setHabitacionParaExtender(hab);
            setModalExtenderOpen(true);
          }}
          onAbrirPos={(res, hab) => {
            handleIrAlPos(res, hab);
          }}
        />
      ) : (
        <>
          {/* KPI Cards Bar - Compactadas estilo Sistema Ferretería */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {/* Total */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3.5 border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 select-none overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sora truncate">
                  Total
                </span>
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Layers className="w-3 h-3" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight truncate">
                {resumen?.total || 0}
              </div>
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span>Inventario</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">100%</span>
              </div>
            </div>

            {/* Libres / Disponibles */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3.5 border border-emerald-100/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 select-none overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-sora truncate">
                  Disponibles
                </span>
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sora tracking-tight truncate">
                {resumen?.disponibles || 0}
              </div>
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Listas check-in</span>
                <span className="font-bold text-emerald-600 font-sora">Libres</span>
              </div>
            </div>

            {/* Ocupadas */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3.5 border border-rose-100/90 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 select-none overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 font-sora truncate">
                  Ocupadas
                </span>
                <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0">
                  <User className="w-3 h-3" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 font-sora tracking-tight truncate">
                {resumen?.ocupadas || 0}
              </div>
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">En estancia</span>
                <span className="font-bold text-rose-600 font-sora">Ocupadas</span>
              </div>
            </div>

            {/* Limpieza */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3.5 border border-amber-100/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 select-none overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-sora truncate">
                  Limpieza
                </span>
                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 font-sora tracking-tight truncate">
                {(resumen?.en_limpieza || 0) + (resumen?.sucias || 0)}
              </div>
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Housekeeping</span>
                <span className="font-bold text-amber-600 font-sora">Aseo</span>
              </div>
            </div>

            {/* Reservadas / Llegan Hoy */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3.5 border border-sky-100/90 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 shadow-2xs hover:shadow-md hover:shadow-sky-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 select-none overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 font-sora truncate">
                  Reservadas
                </span>
                <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100/80 dark:border-sky-800/60 flex items-center justify-center shrink-0">
                  <Calendar className="w-3 h-3" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-sky-600 dark:text-sky-400 font-sora tracking-tight truncate">
                {(resumen?.reservadas || 0) + (resumen?.reservas_hoy || 0)}
              </div>
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Hoy: {resumen?.reservas_hoy || 0}</span>
                <span className="font-bold text-sky-600 font-sora">Reservas</span>
              </div>
            </div>

            {/* Mantenimiento */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2 px-3 sm:py-2.5 sm:px-3.5 border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 select-none overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sora truncate">
                  Mantenim.
                </span>
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Wrench className="w-3 h-3" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-700 dark:text-slate-300 font-sora tracking-tight truncate">
                {resumen?.mantenimiento || 0}
              </div>
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Fuera de serv.</span>
                <span className="font-bold text-slate-500 font-sora">Bloq.</span>
              </div>
            </div>
          </div>

          {/* ─── BARRA DE CONTROL Y FILTROS: CYBER GLASS HUD (ISLA FLOTANTE GLASSMORPHISM) ─── */}
          <div className="p-1.5 sm:p-2 rounded-3xl bg-slate-200/50 dark:bg-slate-900/40 border border-slate-300/60 dark:border-slate-800/80 backdrop-blur-xl shadow-lg">
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 dark:border-slate-750 shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                {/* Buscador en Vivo por Habitación, Huésped o Documento */}
                <div className="relative w-full sm:w-60 md:w-68 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar hab., huésped, DNI..."
                    className="w-full h-8 pl-[36px] pr-8 bg-slate-100/90 dark:bg-slate-950/60 focus:bg-white dark:focus:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sora transition-all"
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-slate-750 shrink-0" />

                {/* Módulo Pisos: HUD Label + Cápsula Segmentada */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-xs font-extrabold font-sora shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="tracking-wider uppercase text-[10px]">Pisos</span>
                  </div>

                  {/* Cápsula de Pisos */}
                  <div className="bg-slate-100/90 dark:bg-slate-950/60 p-0.5 sm:p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 inline-flex items-center gap-1 overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setPisoSeleccionado('todos')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-sora transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        pisoSeleccionado === 'todos'
                          ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30 scale-102 ring-1 ring-blue-500/50'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-850'
                      }`}
                    >
                      <Layers className="w-3 h-3 shrink-0" />
                      <span>Todos</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                          pisoSeleccionado === 'todos'
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {habitaciones.length}
                      </span>
                    </button>

                    {pisos.map((p) => {
                      const activo = String(pisoSeleccionado) === String(p.piso);
                      return (
                        <button
                          key={p.piso}
                          type="button"
                          onClick={() => setPisoSeleccionado(p.piso)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-sora transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            activo
                              ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30 scale-102 ring-1 ring-blue-500/50'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-850'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span>{p.nombre || `Piso ${p.piso}`}</span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                              activo
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {p.habitaciones.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Botón Gestionar Pisos */}
                  <button
                    type="button"
                    onClick={() => setModalPisosOpen(true)}
                    data-tooltip="Gestionar cantidad y nombres de pisos de este hotel"
                    className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 border border-slate-200/80 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-800 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 shadow-2xs font-sora"
                    title="Gestionar pisos y arquitectura del hotel"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[11px] font-sora hidden sm:inline">Gestionar Pisos</span>
                  </button>
                </div>

                {/* Separador Neón Sutil entre Pisos y Estados */}
                <div className="hidden xl:block h-6 w-px bg-slate-200 dark:bg-slate-750 shrink-0" />

                {/* Módulo Estados: HUD Label + Cápsula con Auras Luminiscentes */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-xs font-extrabold font-sora shrink-0">
                    <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="tracking-wider uppercase text-[10px]">Estado</span>
                  </div>

                  {/* Cápsula de Estados con Auras Luminiscentes */}
                  <div className="bg-slate-100/90 dark:bg-slate-950/60 p-0.5 sm:p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 inline-flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {[
                      {
                        id: 'todos',
                        label: 'Todas',
                        icon: LayoutGrid,
                        count: resumen?.total || 0,
                        dotColor: 'bg-slate-400',
                        activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-1 ring-slate-800/20 scale-102',
                        inactiveClass: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-850',
                        badgeActive: 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900',
                        badgeInactive: 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      },
                      {
                        id: 'disponible',
                        label: 'Libres',
                        icon: CheckCircle2,
                        count: resumen?.disponibles || 0,
                        dotColor: 'bg-emerald-500',
                        activeClass: 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/35 ring-1 ring-emerald-500/50 scale-102',
                        inactiveClass: 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
                        badgeActive: 'bg-white/20 text-white',
                        badgeInactive: 'bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      },
                      {
                        id: 'ocupada',
                        label: 'Ocupadas',
                        icon: BedDouble,
                        count: resumen?.ocupadas || 0,
                        dotColor: 'bg-rose-500',
                        activeClass: 'bg-rose-600 text-white shadow-xs shadow-rose-500/35 ring-1 ring-rose-500/50 scale-102',
                        inactiveClass: 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40',
                        badgeActive: 'bg-white/20 text-white',
                        badgeInactive: 'bg-rose-100/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                      },
                      {
                        id: 'limpieza',
                        label: 'Limpieza',
                        icon: Sparkles,
                        count: (resumen?.en_limpieza || 0) + (resumen?.sucias || 0),
                        dotColor: 'bg-amber-500',
                        activeClass: 'bg-amber-500 text-white shadow-xs shadow-amber-500/35 ring-1 ring-amber-400/50 scale-102',
                        inactiveClass: 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40',
                        badgeActive: 'bg-white/20 text-white',
                        badgeInactive: 'bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                      },
                      {
                        id: 'reservada',
                        label: 'Reservas',
                        icon: Calendar,
                        count: (resumen?.reservadas || 0) + (resumen?.reservas_hoy || 0),
                        dotColor: 'bg-sky-500',
                        activeClass: 'bg-sky-600 text-white shadow-xs shadow-sky-500/35 ring-1 ring-sky-500/50 scale-102',
                        inactiveClass: 'text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40',
                        badgeActive: 'bg-white/20 text-white',
                        badgeInactive: 'bg-sky-100/80 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300'
                      },
                      {
                        id: 'mantenimiento',
                        label: 'Mant.',
                        icon: Wrench,
                        count: resumen?.mantenimiento || 0,
                        dotColor: 'bg-slate-500',
                        activeClass: 'bg-slate-700 text-white dark:bg-slate-600 shadow-xs shadow-slate-600/30 ring-1 ring-slate-600/50 scale-102',
                        inactiveClass: 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800',
                        badgeActive: 'bg-white/20 text-white',
                        badgeInactive: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }
                    ].map((f) => {
                      const IconComp = f.icon;
                      const activo = filtroEstado === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFiltroEstado(f.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-sora transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            activo ? f.activeClass : f.inactiveClass
                          }`}
                        >
                          <IconComp className="w-3 h-3 shrink-0" />
                          <span>{f.label}</span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                              activo ? f.badgeActive : f.badgeInactive
                            }`}
                          >
                            {f.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botón Restablecer Inteligente (Solo visible cuando hay filtros o búsqueda activos) */}
              {(pisoSeleccionado !== 'todos' || filtroEstado !== 'todos' || busqueda.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setPisoSeleccionado('todos');
                    setFiltroEstado('todos');
                    setBusqueda('');
                  }}
                  className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200/80 hover:border-rose-200 dark:border-slate-700 dark:hover:border-rose-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
                  title="Restablecer todos los filtros y búsqueda"
                >
                  <RotateCcw className="w-3.5 h-3.5 transition-transform" />
                  <span className="text-[11px] font-sora">Restablecer</span>
                </button>
              )}
            </div>
          </div>

{/* Room Cards Grid - Auto-fill con ancho mínimo de 270px para evitar que elementos salgan del marco */}
      {habitacionesFiltradas.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col items-center justify-center my-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5 shadow-2xs">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold font-sora text-slate-800 dark:text-slate-100 mb-1">
            No se encontraron habitaciones
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
            {busqueda.trim()
              ? `No existen habitaciones o reservas que coincidan con la búsqueda "${busqueda}".`
              : 'No hay habitaciones que coincidan con los filtros de piso y estado seleccionados.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setPisoSeleccionado('todos');
              setFiltroEstado('todos');
              setBusqueda('');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sora transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros y Búsqueda</span>
          </button>
        </div>
      ) : vistaModo === 'lista' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sora">
                  <th className="py-3.5 px-4">Habitación</th>
                  <th className="py-3.5 px-4">Estado & Limpieza</th>
                  <th className="py-3.5 px-4">Huésped / Ocupante</th>
                  <th className="py-3.5 px-4">Estadía & Horarios</th>
                  <th className="py-3.5 px-4 text-right">Cuenta / Saldo</th>
                  <th className="py-3.5 px-4 text-center">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {habitacionesFiltradas.map((hab) => {
                  const resActiva = (hab.reservas && hab.reservas.length > 0) ? hab.reservas.find(r => r.estado === 'checkin') : null;
                  const proximaReserva = (hab.reservas && hab.reservas.length > 0) ? hab.reservas.find(r => r.estado === 'confirmada' || r.estado === 'pendiente') : null;
                  const esLlegadaHoy = Boolean(proximaReserva && String(proximaReserva.fecha_entrada).substring(0, 10) === hoyYMD);
                  const esOcupada = hab.estado === 'ocupada';
                  const esLimpieza = hab.estado_limpieza === 'en_limpieza' || hab.estado_limpieza === 'sucia';
                  const esMantenimiento = hab.estado === 'mantenimiento';
                  const esDisponible = !esOcupada && !esLimpieza && !esMantenimiento;
                  const precioBase = parseFloat(hab.tipo?.precio_base || 80);
                  const alertaCheckout = (esOcupada && resActiva && resActiva.modalidad !== 'horas') ? calcularAlertaCheckout(resActiva) : null;
                  const alertaDayUse = (esOcupada && resActiva && resActiva.modalidad === 'horas') ? calcularEstadoDayUse(resActiva) : null;

                  const totalCargosHab = (resActiva?.cargos || []).reduce((acc, c) => acc + (parseFloat(c.subtotal || c.precio_unitario * c.cantidad || 0)), 0);
                  const totalHospedaje = parseFloat(resActiva?.total || 0);
                  const adelantoHab = parseFloat(resActiva?.adelanto || 0);
                  const saldoActivo = Math.max(0, +(totalHospedaje + totalCargosHab - adelantoHab).toFixed(2));

                  return (
                    <tr
                      key={hab.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        esOcupada && (alertaCheckout?.esVencido || alertaDayUse?.esVencido)
                          ? 'bg-rose-50/20 dark:bg-rose-950/15'
                          : ''
                      }`}
                    >
                      {/* Habitación: N°, Piso, Tipo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-2xs border ${
                            esDisponible
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : esOcupada
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : esLimpieza
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {hab.numero}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-800 dark:text-white font-sora text-xs">
                                {hab.tipo?.nombre || 'Habitación'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200/60 dark:border-slate-700">
                                Piso {hab.piso}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span className="flex items-center gap-0.5">
                                <Users className="w-3 h-3 text-slate-400" />
                                {hab.tipo?.capacidad || 2} personas
                              </span>
                              <span>•</span>
                              <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                                S/ {precioBase.toFixed(0)}/noche
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Estado Operativo & Estado Limpieza */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            {esDisponible ? (
                              esLlegadaHoy ? (
                                <span className="h-5 px-2 text-[9.5px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 rounded-lg flex items-center gap-1 shrink-0 font-sora animate-pulse">
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>LLEGA HOY</span>
                                </span>
                              ) : (
                                <span className="h-5 px-2 text-[9.5px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center gap-1 font-sora">
                                  <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>DISPONIBLE</span>
                                </span>
                              )
                            ) : esOcupada ? (
                              <span className={`h-5 px-2 text-[9.5px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 font-sora ${
                                alertaCheckout?.esVencido || alertaDayUse?.esVencido
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : resActiva?.modalidad === 'horas'
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}>
                                <User className="w-2.5 h-2.5" />
                                <span>{resActiva?.modalidad === 'horas' ? `DAY-USE (${resActiva.num_horas}H)` : 'OCUPADA'}</span>
                              </span>
                            ) : esMantenimiento ? (
                              <span className="h-5 px-2 text-[9.5px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center gap-1 font-sora">
                                <Wrench className="w-2.5 h-2.5 text-slate-500" />
                                <span>MANTENIMIENTO</span>
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              hab.estado_limpieza === 'limpia'
                                ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                                : hab.estado_limpieza === 'en_limpieza'
                                ? 'bg-blue-50/70 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 animate-pulse'
                                : hab.estado_limpieza === 'inspeccion'
                                ? 'bg-purple-50/70 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50'
                                : 'bg-amber-50/70 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
                            }`}>
                              <Sparkles className="w-2.5 h-2.5" />
                              <span className="capitalize">{hab.estado_limpieza ? hab.estado_limpieza.replace('_', ' ') : 'Limpia'}</span>
                            </span>

                            {esLimpieza && (
                              <button
                                type="button"
                                onClick={() => handleMarcarLimpia(hab.id)}
                                className="text-[10px] font-extrabold text-amber-700 hover:text-emerald-700 dark:text-amber-400 dark:hover:text-emerald-300 underline cursor-pointer"
                                title="Marcar como limpia inmediatamente"
                              >
                                ✓ Marcar Limpia
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Huésped / Ocupante */}
                      <td className="py-3 px-4">
                        {esOcupada && resActiva ? (
                          <div className="min-w-0 max-w-[220px]">
                            <p className="font-bold text-slate-800 dark:text-white truncate font-sora text-xs">
                              {resActiva.huesped ? `${resActiva.huesped.nombre} ${resActiva.huesped.apellido}` : 'Huésped Registrado'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                              <span className="font-mono">{resActiva.huesped?.num_documento || 'Sin doc.'}</span>
                              {resActiva.huesped?.telefono && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono truncate">{resActiva.huesped.telefono}</span>
                                </>
                              )}
                            </div>
                            {resActiva.acompanantes && resActiva.acompanantes.length > 0 && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                                <Users className="w-2.5 h-2.5" />
                                +{resActiva.acompanantes.length} acompañante(s)
                              </span>
                            )}
                            {resActiva.tarjeta_llave_codigo && (
                              <span className="inline-flex items-center gap-1 mt-1 ml-1.5 text-[9.5px] font-bold font-mono text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800" title={`Tarjeta RFID: ${resActiva.tarjeta_llave_codigo}`}>
                                <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                                {resActiva.tarjeta_llave_codigo}
                              </span>
                            )}
                          </div>
                        ) : esLlegadaHoy && proximaReserva ? (
                          <div className="min-w-0 max-w-[220px]">
                            <p className="font-bold text-indigo-700 dark:text-indigo-300 truncate font-sora text-xs">
                              Llega hoy: {proximaReserva.huesped?.nombre} {proximaReserva.huesped?.apellido}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Reserva #{proximaReserva.codigo}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Sin huésped asignado
                          </span>
                        )}
                      </td>

                      {/* Estadía & Horarios */}
                      <td className="py-3 px-4">
                        {esOcupada && resActiva ? (
                          <div className="space-y-1">
                            <div className="text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="font-semibold">Salida: </span>
                              <span className="font-mono font-bold">
                                {String(resActiva.fecha_salida || '').substring(0, 10)} ({resActiva.modalidad === 'horas' ? `${resActiva.num_horas}h` : `${resActiva.num_noches}n`})
                              </span>
                            </div>
                            {alertaDayUse ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold font-sora ${
                                alertaDayUse.esVencido
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                <Clock className="w-2.5 h-2.5" />
                                {alertaDayUse.texto}
                              </span>
                            ) : alertaCheckout?.esVencido ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white text-[9.5px] font-black font-sora animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {alertaCheckout.texto}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Límite: {configCheckout.horaLimite}
                              </span>
                            )}
                          </div>
                        ) : esLlegadaHoy && proximaReserva ? (
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                            Check-in hoy • {proximaReserva.modalidad === 'horas' ? `${proximaReserva.num_horas}h` : `${proximaReserva.num_noches} noche(s)`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Cuenta / Saldo */}
                      <td className="py-3 px-4 text-right">
                        {esOcupada && resActiva ? (
                          <div>
                            <div className={`font-mono font-extrabold text-sm ${
                              saldoActivo > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              S/ {saldoActivo.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {saldoActivo > 0 ? 'Saldo pendiente' : 'Cuenta liquidada'}
                            </div>
                            {totalCargosHab > 0 && (
                              <div className="text-[9.5px] text-blue-600 dark:text-blue-400 font-bold font-mono">
                                (+S/ {totalCargosHab.toFixed(0)} POS)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-mono text-slate-500 font-bold">
                            S/ {precioBase.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Acciones Rápidas */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {esOcupada && resActiva ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setReservaIdParaCheckOut(resActiva.id);
                                  setHabitacionNumeroParaCheckOut(hab.numero);
                                  setModalCheckOutOpen(true);
                                }}
                                className="h-7 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-[11px] font-bold font-sora transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                title="Procesar Check-out y cobro"
                              >
                                <LogOut className="w-3 h-3" />
                                <span>Check-out</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleIrAlPos(resActiva, hab)}
                                className="h-7 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[11px] font-bold font-sora transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                title="Cargar consumo de minibar / restaurante"
                              >
                                <Store className="w-3 h-3" />
                                <span>+ Consumo</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setHabitacionParaExtender(hab);
                                  setModalExtenderOpen(true);
                                }}
                                className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Extender estadía"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReservaIdParaMincetur(resActiva.id);
                                  setModalMinceturOpen(true);
                                }}
                                className="h-7 w-7 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Ficha MINCETUR"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setHabitacionParaTransferir(hab);
                                  setModalTransferOpen(true);
                                }}
                                className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Cambiar a otra habitación"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : esLimpieza ? (
                            <button
                              type="button"
                              onClick={() => handleMarcarLimpia(hab.id)}
                              className="h-7 px-3 rounded-lg bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-white border border-amber-200 text-[11px] font-bold font-sora transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                              title="Confirmar limpieza completa"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Marcar Limpia</span>
                            </button>
                          ) : esMantenimiento ? (
                            <button
                              type="button"
                              onClick={() => handlePonerMantenimiento(hab)}
                              className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-700 text-slate-700 hover:text-white border border-slate-300 text-[11px] font-bold font-sora transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                              title="Habilitar habitación"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Habilitar</span>
                            </button>
                          ) : esLlegadaHoy && proximaReserva ? (
                            <button
                              type="button"
                              onClick={() => {
                                setHabitacionParaCheckIn(hab);
                                setReservaParaCheckIn(proximaReserva);
                                setModalCheckInOpen(true);
                              }}
                              className="h-7 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold font-sora transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                              title="Registrar Check-in de reserva"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Check-in Reserva</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setHabitacionParaCheckIn(hab);
                                  setModalCheckInOpen(true);
                                }}
                                className="h-7 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold font-sora transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                                title="Asignar y registrar Check-in"
                              >
                                <LogIn className="w-3 h-3" />
                                <span>Check-in</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePonerMantenimiento(hab)}
                                className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                                title="Poner en mantenimiento"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4 sm:gap-4.5">
          {habitacionesFiltradas.map((hab) => {
            const resActiva = (hab.reservas && hab.reservas.length > 0) ? hab.reservas.find(r => r.estado === 'checkin') : null;
            const proximaReserva = (hab.reservas && hab.reservas.length > 0) ? hab.reservas.find(r => r.estado === 'confirmada' || r.estado === 'pendiente') : null;
            const esLlegadaHoy = Boolean(proximaReserva && String(proximaReserva.fecha_entrada).substring(0, 10) === hoyYMD);
            const esLlegadaFutura = Boolean(proximaReserva && String(proximaReserva.fecha_entrada).substring(0, 10) > hoyYMD);

            const esOcupada = hab.estado === 'ocupada';
            const esLimpieza = hab.estado_limpieza === 'en_limpieza' || hab.estado_limpieza === 'sucia';
            const esMantenimiento = hab.estado === 'mantenimiento';
            const esDisponible = !esOcupada && !esLimpieza && !esMantenimiento;
            const precioBase = parseFloat(hab.tipo?.precio_base || 80);
            const alertaCheckout = (esOcupada && resActiva && resActiva.modalidad !== 'horas') ? calcularAlertaCheckout(resActiva) : null;
            const alertaDayUse = (esOcupada && resActiva && resActiva.modalidad === 'horas') ? calcularEstadoDayUse(resActiva) : null;

            // Fase 3: Desglose financiero en tiempo real
            const totalCargosHab = (resActiva?.cargos || []).reduce((acc, c) => acc + (parseFloat(c.subtotal || c.precio_unitario * c.cantidad || 0)), 0);
            const totalHospedaje = parseFloat(resActiva?.total || 0);
            const adelantoHab = parseFloat(resActiva?.adelanto || 0);
            const saldoActivo = Math.max(0, +(totalHospedaje + totalCargosHab - adelantoHab).toFixed(2));

            const cardBorderClass = esDisponible
              ? esLlegadaHoy
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/15 dark:bg-indigo-950/20 hover:border-indigo-500 dark:hover:border-indigo-400'
                : 'border-emerald-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500'
              : esOcupada
              ? (alertaCheckout?.esVencido || alertaDayUse?.esVencido)
                ? 'border-rose-500 dark:border-rose-500 bg-rose-50/25 dark:bg-rose-950/25'
                : resActiva?.modalidad === 'horas'
                ? 'border-blue-300 dark:border-blue-800/80 hover:border-blue-500 bg-blue-50/10'
                : 'border-rose-200/90 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500'
              : esLimpieza
              ? 'border-amber-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500'
              : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-70';

            return (
              <div
                key={hab.id}
                className={`pos-med-card group relative bg-white dark:bg-slate-900 rounded-2xl border flex flex-col justify-between p-3.5 sm:p-4 min-w-0 overflow-hidden transition-all shadow-2xs hover:shadow-md ${cardBorderClass}`}
                style={{ minHeight: '232px' }}
              >
                <div className="space-y-2.5 min-w-0">
                  {/* Cabecera: Piso / Tipo + Badge de Estado (estilo DCI / Receta de Botica) */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700 truncate font-sora min-w-0 max-w-[55%]"
                      title={`Piso ${hab.piso} • ${hab.tipo?.nombre || 'Habitación'}`}
                    >
                      PISO {hab.piso} • {hab.tipo?.nombre || 'HABITACIÓN'}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      {esDisponible && (
                        esLlegadaHoy ? (
                          <span
                            className="h-5 px-1.5 text-[9px] font-extrabold uppercase tracking-wide bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 rounded-md flex items-center gap-1 shrink-0 font-sora shadow-2xs animate-pulse"
                            title={`Reserva confirmada con llegada para hoy: ${proximaReserva?.huesped?.nombre} ${proximaReserva?.huesped?.apellido} (${proximaReserva?.codigo})`}
                          >
                            <Calendar className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                            <span>LLEGA HOY</span>
                          </span>
                        ) : (
                          <span
                            className="h-5 px-1.5 text-[9.5px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md flex items-center gap-1 transition-colors font-sora shrink-0"
                            title="Habitación disponible para check-in inmediato"
                          >
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                            <span>DISPONIBLE</span>
                          </span>
                        )
                      )}
                      {esOcupada && (
                        <span
                          className={`h-5 px-1.5 text-[9px] font-extrabold uppercase tracking-wide rounded-md flex items-center gap-1 shrink-0 font-sora ${
                            alertaCheckout?.esVencido || alertaDayUse?.esVencido
                              ? 'bg-rose-600 text-white animate-pulse'
                              : resActiva?.modalidad === 'horas'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                          }`}
                          title={
                            alertaCheckout?.esVencido
                              ? alertaCheckout.texto
                              : alertaDayUse?.esVencido
                              ? alertaDayUse.texto
                              : resActiva?.modalidad === 'horas'
                              ? `Day-Use (${resActiva.num_horas}h)`
                              : 'Habitación ocupada por huésped'
                          }
                        >
                          {alertaCheckout?.esVencido || alertaDayUse?.esVencido ? (
                            <AlertTriangle className="w-2.5 h-2.5 text-white" />
                          ) : resActiva?.modalidad === 'horas' ? (
                            <Clock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <User className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                          )}
                          <span>
                            {alertaCheckout?.esVencido
                              ? 'VENCIDO'
                              : alertaDayUse?.esVencido
                              ? 'HORAS VENC.'
                              : resActiva?.modalidad === 'horas'
                              ? `DAY-USE (${resActiva.num_horas}H)`
                              : 'OCUPADA'}
                          </span>
                        </span>
                      )}
                      {esLimpieza && (
                        <span
                          className="h-5 px-1.5 text-[9px] font-extrabold uppercase tracking-wide bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 rounded-md flex items-center gap-1 shrink-0 font-sora"
                          title="En proceso de limpieza / Housekeeping"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                          <span>LIMPIEZA</span>
                        </span>
                      )}
                      {esMantenimiento && (
                        <span
                          className="h-5 px-1.5 text-[9px] font-extrabold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-md flex items-center gap-1 shrink-0 font-sora"
                          title="En mantenimiento"
                        >
                          <Wrench className="w-2.5 h-2.5 text-slate-500" />
                          <span>MANT.</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Número de Habitación y Precio por Noche */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div
                        className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-sora flex items-baseline gap-1.5 min-w-0"
                        title={`Habitación ${hab.numero}`}
                      >
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Hab.</span>
                        <span className="font-extrabold text-xl sm:text-2xl font-mono text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {hab.numero}
                        </span>
                      </div>
                      <span
                        className="font-extrabold font-sora text-xs sm:text-[13px] text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700 tabular-nums shrink-0"
                        title={resActiva?.modalidad === 'horas' ? `Precio Day-Use (${resActiva.num_horas}h): S/ ${parseFloat(resActiva.precio_total || 0).toFixed(2)}` : `Precio por noche: S/ ${precioBase.toFixed(2)}`}
                      >
                        S/ {resActiva?.modalidad === 'horas' ? parseFloat(resActiva.precio_total || 0).toFixed(2) : precioBase.toFixed(2)}
                      </span>
                    </div>

                    {/* Subtítulo informativo */}
                    {esOcupada && resActiva ? (
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <p
                            className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium truncate flex items-center gap-1.5 min-w-0 flex-1"
                            title={`Huésped: ${resActiva.huesped?.nombre} ${resActiva.huesped?.apellido} (${resActiva.huesped?.num_documento || 'Sin doc'})`}
                          >
                            <User className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate min-w-0">
                              {resActiva.huesped?.nombre} {resActiva.huesped?.apellido}
                            </span>
                          </p>
                          {/* Clasificación VIP / Alerta de Lista Negra */}
                          {resActiva.huesped?.clasificacion === 'vip' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-sora shrink-0" title="Huésped VIP">
                              <Crown className="w-2.5 h-2.5 text-amber-600" /> VIP
                            </span>
                          )}
                          {resActiva.huesped?.clasificacion === 'lista_negra' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-black bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 font-sora shrink-0" title={`Lista Negra: ${resActiva.huesped?.motivo_lista_negra || 'Observado'}`}>
                              <ShieldAlert className="w-2.5 h-2.5 text-rose-600" /> ALERTA
                            </span>
                          )}
                        </div>

                        {/* Contador en tiempo real Day-Use o Alerta de Vencimiento de Checkout */}
                        {resActiva.modalidad === 'horas' && alertaDayUse ? (
                          <div className={`flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold font-sora ${
                            alertaDayUse.esVencido
                              ? 'bg-rose-600 text-white animate-pulse shadow-2xs'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60'
                          }`}>
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <span>Day-Use {resActiva.num_horas}h</span>
                            </span>
                            <span className="font-mono font-black">{alertaDayUse.texto}</span>
                          </div>
                        ) : alertaCheckout?.esVencido ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9.5px] font-black font-sora shadow-2xs animate-pulse">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{alertaCheckout.texto}</span>
                          </div>
                        ) : null}

                        {/* Estado Financiero en Vivo de la Habitación & Llave RFID */}
                        <div className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {resActiva.tarjeta_llave_codigo ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-amber-700 dark:text-amber-300" title={`Tarjeta RFID / Llave asignada: ${resActiva.tarjeta_llave_codigo}`}>
                                <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                                {resActiva.tarjeta_llave_codigo}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sora">Saldo:</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 font-mono font-black">
                            <span className={saldoActivo > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                              S/ {saldoActivo.toFixed(2)}
                            </span>
                            {totalCargosHab > 0 && (
                              <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold" title={`Minibar/Consumos cargados: S/ ${totalCargosHab.toFixed(2)}`}>
                                (+S/{totalCargosHab.toFixed(0)} POS)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : esLimpieza ? (
                      <p className="text-[11.5px] text-amber-700 dark:text-amber-400 font-medium truncate mt-1 flex items-center gap-1.5 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="capitalize truncate min-w-0">{hab.estado_limpieza.replace('_', ' ')} • Requiere aseo</span>
                      </p>
                    ) : esMantenimiento ? (
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium truncate mt-1 flex items-center gap-1.5 min-w-0">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate min-w-0">Revisión técnica en curso</span>
                      </p>
                    ) : esLlegadaHoy && proximaReserva ? (
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <p
                            className="text-[11.5px] text-indigo-700 dark:text-indigo-300 font-bold truncate flex items-center gap-1.5 min-w-0 flex-1"
                            title={`Llegada hoy: ${proximaReserva.huesped?.nombre} ${proximaReserva.huesped?.apellido} • Reserva #${proximaReserva.codigo}`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate min-w-0">
                              Llega hoy: {proximaReserva.huesped?.nombre} {proximaReserva.huesped?.apellido}
                            </span>
                          </p>
                          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shrink-0">
                            {proximaReserva.modalidad === 'horas' ? `${proximaReserva.num_horas}h` : `${proximaReserva.num_noches}n`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800/60">
                          <span className="text-indigo-600 dark:text-indigo-400 font-sora font-semibold">Reserva #{proximaReserva.codigo}</span>
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                            {parseFloat(proximaReserva.adelanto || 0) > 0 ? `Adelanto S/ ${parseFloat(proximaReserva.adelanto).toFixed(0)}` : 'Sin adelanto'}
                          </span>
                        </div>
                      </div>
                    ) : esLlegadaFutura && proximaReserva ? (
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-1 flex items-center gap-1.5 min-w-0" title={`Próxima reserva: ${proximaReserva.fecha_entrada} (${proximaReserva.huesped?.nombre || 'Reserva'})`}>
                        <BedDouble className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate min-w-0">Libre • Próx. {proximaReserva.fecha_entrada} ({proximaReserva.huesped?.nombre || 'Reserva'})</span>
                      </p>
                    ) : (
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-400 font-medium truncate mt-1 flex items-center gap-1.5 min-w-0">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate min-w-0">{hab.tipo?.nombre} • Lista para check-in</span>
                      </p>
                    )}
                  </div>

                  {/* Fila de métricas: Capacidad + Acompañantes + Estadía / Detalle */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 shrink">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 font-sora ${
                          esOcupada
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                            : esLimpieza
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
                            : 'bg-[#EBFDF6] dark:bg-emerald-950/40 text-[#00855E] dark:text-emerald-300 border border-[#A6F6D8] dark:border-emerald-800/60'
                        }`}
                        title="Capacidad máxima"
                      >
                        <Users className="w-2.5 h-2.5 shrink-0" />
                        <span>{hab.tipo?.capacidad || 2}p</span>
                      </span>

                      {/* Badge de Acompañantes registrados */}
                      {esOcupada && resActiva?.acompanantes && resActiva.acompanantes.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[9.5px] font-bold font-sora shrink-0"
                          title={`Acompañantes registrados (${resActiva.acompanantes.length}): ${resActiva.acompanantes.map(a => `${a.nombre} ${a.apellido}`).join(', ')}`}
                        >
                          <Users className="w-2.5 h-2.5 text-blue-600" />
                          <span>+{resActiva.acompanantes.length}</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold font-sora truncate max-w-[90px] min-w-0">
                        <BedDouble className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate min-w-0">{hab.tipo?.nombre || 'Hab.'}</span>
                      </span>
                    </div>

                    <div className="shrink-0 text-right min-w-0">
                      {esOcupada && resActiva ? (
                        resActiva.modalidad === 'horas' ? (
                          <span
                            className="inline-flex items-center gap-1 text-[9.5px] text-blue-700 dark:text-blue-400 font-sora bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60 font-semibold shrink-0"
                            title={`Modalidad: ${resActiva.num_horas} horas`}
                          >
                            <Clock className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                            <span>{resActiva.num_horas}h</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[9.5px] text-rose-700 dark:text-rose-400 font-sora bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-800/60 font-semibold shrink-0"
                            title={`Estadía: ${resActiva.num_noches} noche(s)`}
                          >
                            <Clock className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                            <span>{resActiva.num_noches}n</span>
                          </span>
                        )
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[9.5px] text-slate-400 dark:text-slate-400 font-sora bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700 shrink-0"
                        >
                          <span>Noche</span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">S/ {precioBase.toFixed(0)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── BOTONES DE ACCIÓN: COMPACTOS Y AJUSTADOS AL MARCO ── */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 min-w-0">
                  {esOcupada && resActiva ? (
                    <div className="space-y-1.5 min-w-0">
                      {/* Fila 1: Check-out y Consumos POS */}
                      <div className="grid grid-cols-2 gap-1.5 min-w-0">
                        {/* Botón 1: Check-out */}
                        <button
                          type="button"
                          onClick={() => {
                            setReservaIdParaCheckOut(resActiva.id);
                            setHabitacionNumeroParaCheckOut(hab.numero);
                            setModalCheckOutOpen(true);
                          }}
                          className="py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-center transition-all active:scale-[0.97] cursor-pointer group/btn bg-rose-50/90 dark:bg-rose-950/30 hover:bg-rose-600 dark:hover:bg-rose-600 border-rose-200 dark:border-rose-800/60 hover:border-rose-600 text-rose-700 dark:text-rose-300 hover:text-white min-w-0 shadow-2xs"
                          title="Liquidar cuenta y procesar salida"
                        >
                          <LogOut className="w-3.5 h-3.5 shrink-0 group-hover/btn:text-white" />
                          <span className="text-[11px] font-extrabold font-sora truncate group-hover/btn:text-white min-w-0">
                            Check-out
                          </span>
                        </button>

                        {/* Botón 2: POS Minibar */}
                        <button
                          type="button"
                          onClick={() => handleIrAlPos(resActiva, hab)}
                          className="py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-center transition-all active:scale-[0.97] cursor-pointer group/btn bg-blue-50/90 dark:bg-blue-950/30 hover:bg-blue-600 dark:hover:bg-blue-600 border-blue-200 dark:border-blue-800/60 hover:border-blue-600 text-blue-700 dark:text-blue-300 hover:text-white min-w-0 shadow-2xs"
                          title="Cargar consumos de minibar o servicios a la habitación"
                        >
                          <Store className="w-3.5 h-3.5 shrink-0 group-hover/btn:text-white" />
                          <span className="text-[11px] font-extrabold font-sora truncate group-hover/btn:text-white min-w-0">
                            + Consumo
                          </span>
                        </button>
                      </div>

                      {/* Fila 2: Acciones secundarias (Extender Estadía, Ficha Oficial MINCETUR, Mover Habitación) */}
                      <div className="grid grid-cols-3 gap-1 min-w-0">
                        {/* Extender Estadía */}
                        <button
                          type="button"
                          onClick={() => {
                            setHabitacionParaExtender(hab);
                            setModalExtenderOpen(true);
                          }}
                          className="py-1 px-1 rounded-lg border border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-600 hover:border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white text-[10px] font-extrabold font-sora flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs truncate"
                          title="Extender estadía (+1 noche o +X horas)"
                        >
                          <CalendarPlus className="w-3 h-3 shrink-0" />
                          <span className="truncate">Extender</span>
                        </button>

                        {/* Ficha MINCETUR */}
                        <button
                          type="button"
                          onClick={() => {
                            setReservaIdParaMincetur(resActiva.id);
                            setModalMinceturOpen(true);
                          }}
                          className="py-1 px-1 rounded-lg border border-blue-200/90 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/30 hover:bg-blue-600 hover:border-blue-600 text-blue-700 dark:text-blue-300 hover:text-white text-[10px] font-extrabold font-sora flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs truncate"
                          title="Ficha Oficial de Registro de Huéspedes (MINCETUR)"
                        >
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">Ficha</span>
                        </button>

                        {/* Mover Habitación */}
                        <button
                          type="button"
                          onClick={() => {
                            setHabitacionParaTransferir(hab);
                            setModalTransferOpen(true);
                          }}
                          className="py-1 px-1 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-indigo-600 hover:border-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white text-[10px] font-extrabold font-sora flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs truncate"
                          title="Cambiar huésped a otra habitación disponible"
                        >
                          <ArrowRightLeft className="w-3 h-3 shrink-0" />
                          <span className="truncate">Mover</span>
                        </button>
                      </div>
                    </div>
                  ) : esLimpieza ? (
                    <button
                      type="button"
                      onClick={() => handleMarcarLimpia(hab.id)}
                      className="w-full py-2.5 px-3 rounded-xl border flex items-center justify-between gap-2 transition-all active:scale-[0.98] group/btn bg-amber-50/90 dark:bg-amber-950/30 hover:bg-amber-500 dark:hover:bg-amber-500 border-amber-200 dark:border-amber-800/60 hover:border-amber-500 text-slate-800 dark:text-slate-100 hover:text-white cursor-pointer min-w-0 shadow-2xs"
                      title="Confirmar que la habitación está desinfectada y lista"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover/btn:text-white shrink-0" />
                        <span className="text-xs font-extrabold font-sora text-amber-900 dark:text-amber-200 group-hover/btn:text-white tracking-tight truncate min-w-0">
                          Marcar Limpia
                        </span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-300 group-hover/btn:text-white shrink-0" />
                    </button>
                  ) : esMantenimiento ? (
                    <button
                      type="button"
                      onClick={() => handlePonerMantenimiento(hab)}
                      className="w-full py-2.5 px-3 rounded-xl border flex items-center justify-between gap-2 transition-all active:scale-[0.98] group/btn bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-white cursor-pointer min-w-0 shadow-2xs"
                      title="Habilitar habitación para huéspedes"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <Wrench className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-white shrink-0" />
                        <span className="text-xs font-extrabold font-sora text-slate-900 dark:text-white group-hover/btn:text-white tracking-tight truncate min-w-0">
                          Habilitar Habitación
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover/btn:text-white shrink-0" />
                    </button>
                  ) : esLlegadaHoy && proximaReserva ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setHabitacionParaCheckIn(hab);
                          setReservaParaCheckIn(proximaReserva);
                          setModalCheckInOpen(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl border flex items-center justify-between gap-2 transition-all active:scale-[0.98] group/btn bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-600 dark:hover:bg-indigo-600 border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-600 text-slate-800 dark:text-slate-100 hover:text-white cursor-pointer min-w-0 shadow-2xs"
                        title={`Registrar Check-in de la reserva programada de ${proximaReserva.huesped?.nombre} ${proximaReserva.huesped?.apellido}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover/btn:text-white shrink-0" />
                          <span className="text-xs font-extrabold font-sora text-indigo-700 dark:text-indigo-300 group-hover/btn:text-white tracking-tight truncate min-w-0">
                            Check-in Reserva
                          </span>
                        </div>
                        <span className="h-6 px-2.5 rounded-lg bg-indigo-600 group-hover/btn:bg-indigo-700 text-white flex items-center justify-center gap-1 font-bold text-[10.5px] shadow-2xs font-sora shrink-0 group-hover/btn:scale-102 transition-all">
                          <LogIn className="w-3 h-3 stroke-[2.5]" />
                          <span>Recibir</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePonerMantenimiento(hab)}
                        className="h-10 w-10 rounded-xl border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Poner en mantenimiento"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setHabitacionParaCheckIn(hab);
                          setReservaParaCheckIn(null);
                          setModalCheckInOpen(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl border flex items-center justify-between gap-2 transition-all active:scale-[0.98] group/btn bg-blue-50/90 dark:bg-blue-950/30 hover:bg-blue-600 dark:hover:bg-blue-600 border-blue-200 dark:border-blue-800/60 hover:border-blue-600 text-slate-800 dark:text-slate-100 hover:text-white cursor-pointer min-w-0 shadow-2xs"
                        title={`Asignar y registrar Check-in (S/ ${precioBase.toFixed(2)})`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover/btn:text-white shrink-0" />
                          <span className="text-xs font-extrabold font-sora text-blue-700 dark:text-blue-300 group-hover/btn:text-white tracking-tight truncate min-w-0">
                            Check-in
                          </span>
                        </div>
                        <span className="h-6 px-2.5 rounded-lg bg-blue-600 group-hover/btn:bg-blue-700 text-white flex items-center justify-center gap-1 font-bold text-[10.5px] shadow-2xs font-sora shrink-0 group-hover/btn:scale-102 transition-all">
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Asignar</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePonerMantenimiento(hab)}
                        className="h-10 w-10 rounded-xl border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Poner en mantenimiento"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Check-in Modal */}
      <CheckInModal
        isOpen={modalCheckInOpen}
        onClose={() => {
          setModalCheckInOpen(false);
          setReservaParaCheckIn(null);
        }}
        habitacionSeleccionada={habitacionParaCheckIn}
        habitaciones={rackData.habitaciones}
        reservaPrevia={reservaParaCheckIn}
        onSuccess={(nuevaReserva) => {
          cargarRack();
          setReservaParaCheckIn(null);
          if (nuevaReserva?.id) {
            setTimeout(() => {
              if (window.confirm('Check-in registrado exitosamente en la habitación.\n\n¿Desea abrir e imprimir la Ficha Oficial de Registro MINCETUR ahora?')) {
                setReservaIdParaMincetur(nuevaReserva.id);
                setModalMinceturOpen(true);
              }
            }, 350);
          }
        }}
      />

      {/* Check-out Modal */}
      <CheckOutModal
        isOpen={modalCheckOutOpen}
        onClose={() => setModalCheckOutOpen(false)}
        reservaId={reservaIdParaCheckOut}
        habitacionNumero={habitacionNumeroParaCheckOut}
        onSuccess={() => {
          cargarRack();
        }}
      />

      {/* Modal Cambio de Habitación (Room Transfer) */}
      <ModalRoomTransfer
        isOpen={modalTransferOpen}
        onClose={() => setModalTransferOpen(false)}
        habitacionOrigen={habitacionParaTransferir}
        onTransferenciaExitosa={() => {
          cargarRack();
        }}
      />

      {/* Modal Ficha Oficial MINCETUR (D.S. Nº 001-2015-MINCETUR) */}
      <ModalFichaMincetur
        isOpen={modalMinceturOpen}
        onClose={() => setModalMinceturOpen(false)}
        reservaId={reservaIdParaMincetur}
      />

      {/* Modal Extender Estadía (+1 Noche / +X Horas) */}
      <ModalExtenderEstadia
        isOpen={modalExtenderOpen}
        onClose={() => setModalExtenderOpen(false)}
        habitacion={habitacionParaExtender}
        onExtensionExitosa={() => {
          cargarRack();
        }}
      />

      {/* Modal Personalizar Pisos del Hotel */}
      <ModalPersonalizarPisos
        isOpen={modalPisosOpen}
        onClose={() => setModalPisosOpen(false)}
        pisosActuales={rackData.pisos}
        habitaciones={rackData.habitaciones}
        onPisosActualizados={() => {
          cargarRack();
        }}
      />

      {/* Quick Minibar/Cargo Modal */}
      {modalCargoOpen && createPortal(
        <div
          onClick={() => setModalCargoOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-150 overflow-y-auto"
          style={{ WebkitBackdropFilter: 'blur(3px)', backdropFilter: 'blur(3px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Wine className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              Cargar a la Cuenta — Hab. {reservaCargo?.numHab}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Huésped: {reservaCargo?.huesped?.nombre} {reservaCargo?.huesped?.apellido}
            </p>

            <form onSubmit={handleGuardarCargo} className="space-y-4">
              <div>
                <DropdownPill
                  label="Categoría del Consumo"
                  value={categoriaCargo}
                  onChange={(val) => setCategoriaCargo(val)}
                  options={OPCIONES_CATEGORIA_CARGO_RACK}
                  icon={Wine}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Concepto o Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cerveza Cusqueña x2, Agua con Gas"
                  value={conceptoCargo}
                  onChange={(e) => setConceptoCargo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="25.00"
                  value={precioCargo}
                  onChange={(e) => setPrecioCargo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCargoOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/25 cursor-pointer"
                >
                  Cargar a Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
