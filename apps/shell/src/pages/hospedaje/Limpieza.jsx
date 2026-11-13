import React, { useState, useEffect } from 'react';
import api from './api';
import { Modal } from '@heis/ui';
import { useAuthStore } from '@heis/core';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  Layers,
  Search,
  CheckCheck,
  Wrench,
  BedDouble,
  User,
  Calendar,
  FileText,
  X,
  Zap,
  Hotel,
  Check,
  Hourglass,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  ShieldAlert,
  CheckSquare,
  Hammer,
  ChevronDown,
  Plus,
  Trash2,
  CalendarCheck,
  Wind,
  KeyRound
} from 'lucide-react';
import { notificarExito, notificarError } from './utils/notificaciones';

export default function Limpieza() {
  const { user: usuarioActual } = useAuthStore();
  const [habitaciones, setHabitaciones] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sub-módulo: 'housekeeping' | 'preventivo'
  const [subModulo, setSubModulo] = useState('housekeeping');

  // Mantenimiento Preventivo Programado
  const [preventivos, setPreventivos] = useState(() => {
    try {
      const saved = localStorage.getItem('hotel_mantenimientos_preventivos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'prev-1',
        habitacion_numero: '101',
        sistema: 'Aire Acondicionado',
        tarea: 'Limpieza de filtros, verificación de gas refrigerante y drenaje de condensado',
        frecuencia_dias: 30,
        fecha_programada: '2026-11-05',
        tecnico: 'Carlos Méndez (Técnico HVAC)',
        estado: 'pendiente',
        prioridad: 'Media',
        ultimo_mantenimiento: '2026-10-05',
        notas: 'Revisar control remoto'
      },
      {
        id: 'prev-2',
        habitacion_numero: '102',
        sistema: 'Cerradura RFID',
        tarea: 'Reemplazo preventivo de baterías alcalinas AA y calibración de cerrojo',
        frecuencia_dias: 90,
        fecha_programada: '2026-11-12',
        tecnico: 'Jorge Huamán (Mantenimiento)',
        estado: 'pendiente',
        prioridad: 'Alta',
        ultimo_mantenimiento: '2026-08-12',
        notas: 'Pilas a 25% de carga'
      },
      {
        id: 'prev-3',
        habitacion_numero: '201',
        sistema: 'Plomería & Grifería',
        tarea: 'Desobstrucción y sellado de silicona en cabina de ducha y grifo lavatorio',
        frecuencia_dias: 60,
        fecha_programada: '2026-10-31',
        tecnico: 'Mario Castro (Plomería)',
        estado: 'pendiente',
        prioridad: 'Media',
        ultimo_mantenimiento: '2026-08-31',
        notas: 'Válvula de presión ajustada'
      },
      {
        id: 'prev-4',
        habitacion_numero: '204',
        sistema: 'Colchones & Lencería',
        tarea: 'Rotación 180° de colchón y sanitización térmica con vapor',
        frecuencia_dias: 90,
        fecha_programada: '2026-11-20',
        tecnico: 'Equipo Housekeeping Turno Mañana',
        estado: 'pendiente',
        prioridad: 'Baja',
        ultimo_mantenimiento: '2026-08-20',
        notas: 'Colchón King en buen estado'
      }
    ];
  });

  const guardarPreventivos = (nuevos) => {
    setPreventivos(nuevos);
    try {
      localStorage.setItem('hotel_mantenimientos_preventivos', JSON.stringify(nuevos));
    } catch (e) {}
  };

  const [filtroPreventivo, setFiltroPreventivo] = useState('todos'); // 'todos' | 'pendientes' | 'vencidos' | 'completados'
  const [busquedaPreventivo, setBusquedaPreventivo] = useState('');

  // Modales Preventivo
  const [modalNuevoPreventivoOpen, setModalNuevoPreventivoOpen] = useState(false);
  const [formPrevHab, setFormPrevHab] = useState('');
  const [formPrevSistema, setFormPrevSistema] = useState('Aire Acondicionado');
  const [formPrevFrecuencia, setFormPrevFrecuencia] = useState(30);
  const [formPrevFecha, setFormPrevFecha] = useState(new Date().toISOString().split('T')[0]);
  const [formPrevTecnico, setFormPrevTecnico] = useState('');
  const [formPrevTarea, setFormPrevTarea] = useState('');
  const [formPrevPrioridad, setFormPrevPrioridad] = useState('Media');

  const [modalCompletarPrevOpen, setModalCompletarPrevOpen] = useState(false);
  const [prevParaCompletar, setPrevParaCompletar] = useState(null);
  const [notasCompletado, setNotasCompletado] = useState('');
  const [reprogramarSiguiente, setReprogramarSiguiente] = useState(true);

  const [filtroEstado, setFiltroEstado] = useState('pendientes'); // 'todos' | 'pendientes' | 'sucia' | 'en_limpieza' | 'inspeccion' | 'limpia' | 'llegadas_hoy' | 'salidas' | 'mantenimiento'
  const [filtroCamarera, setFiltroCamarera] = useState('todas'); // 'todas' | 'mis_habitaciones' | 'sin_asignar' | userId
  const [pisoSeleccionado, setPisoSeleccionado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modal para agregar o editar nota de limpieza
  const [modalNotaOpen, setModalNotaOpen] = useState(false);
  const [habParaNota, setHabParaNota] = useState(null);
  const [notaTexto, setNotaTexto] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  // Modal para reportar avería / pase a mantenimiento (Fase 2)
  const [modalAveriaOpen, setModalAveriaOpen] = useState(false);
  const [habParaAveria, setHabParaAveria] = useState(null);
  const [tipoAveria, setTipoAveria] = useState('Plomería / Baño');
  const [prioridadAveria, setPrioridadAveria] = useState('Media');
  const [descripcionAveria, setDescripcionAveria] = useState('');
  const [bloquearCuarto, setBloquearCuarto] = useState(true);
  const [guardandoAveria, setGuardandoAveria] = useState(false);

  // Modal para resolver avería y habilitar cuarto (Fase 2)
  const [modalResolverOpen, setModalResolverOpen] = useState(false);
  const [habParaResolver, setHabParaResolver] = useState(null);
  const [nuevoEstadoLimpieza, setNuevoEstadoLimpieza] = useState('limpia');
  const [notasSolucion, setNotasSolucion] = useState('');
  const [guardandoSolucion, setGuardandoSolucion] = useState(false);

  // Modal para asignar camarera / personal de piso (Fase 2)
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [habParaAsignar, setHabParaAsignar] = useState(null);
  const [camareraSeleccionada, setCamareraSeleccionada] = useState('');
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);

  // Acción masiva
  const [modalMasivoOpen, setModalMasivoOpen] = useState(false);
  const [notaMasiva, setNotaMasiva] = useState('');
  const [marcandoMasivo, setMarcandoMasivo] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resHabitaciones, resUsuarios] = await Promise.allSettled([
        api.get('/habitaciones'),
        api.get('/usuarios')
      ]);

      if (resHabitaciones.status === 'fulfilled') {
        setHabitaciones(resHabitaciones.value.data.data || resHabitaciones.value.data || []);
      } else {
        notificarError('Error al cargar', 'No se pudo sincronizar el estado de habitaciones.');
      }

      if (resUsuarios.status === 'fulfilled') {
        const usersList = resUsuarios.value.data.usuarios || resUsuarios.value.data.data || [];
        // Filtrar usuarios activos
        setPersonal(usersList.filter(u => u.activo !== false));
      }
    } catch (err) {
      console.error(err);
      notificarError('Error de conexión', 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cargarHabitaciones = async () => {
    try {
      setLoading(true);
      const res = await api.get('/habitaciones');
      setHabitaciones(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      notificarError('Error al cargar', 'No se pudo sincronizar el estado de habitaciones.');
    } finally {
      setLoading(false);
    }
  };

  // Cambio normal de estado de limpieza
  const handleCambiarEstado = async (id, nuevoEstado, notas) => {
    try {
      await api.patch(`/habitaciones/${id}/limpieza`, {
        estado_limpieza: nuevoEstado,
        notas: notas || `Estado cambiado a ${nuevoEstado}`
      });
      cargarHabitaciones();
      notificarExito('Housekeeping Actualizado', `Habitación cambiada a estado: ${nuevoEstado}`);
    } catch (err) {
      notificarError('Error de Limpieza', err.response?.data?.message || 'Error al actualizar estado.');
    }
  };

  // Guardar Nota de Limpieza
  const handleAbrirModalNota = (hab) => {
    setHabParaNota(hab);
    setNotaTexto(hab.limpieza_notas || '');
    setModalNotaOpen(true);
  };

  const handleGuardarNota = async (e) => {
    e.preventDefault();
    if (!habParaNota) return;

    try {
      setGuardandoNota(true);
      await api.patch(`/habitaciones/${habParaNota.id}/limpieza`, {
        estado_limpieza: habParaNota.estado_limpieza,
        notas: notaTexto.trim()
      });
      cargarHabitaciones();
      setModalNotaOpen(false);
      setHabParaNota(null);
      notificarExito('Nota Registrada', `Se guardó la nota de aseo para Hab. ${habParaNota.numero}`);
    } catch (err) {
      notificarError('Error al guardar nota', err.response?.data?.message || 'No se pudo guardar la nota.');
    } finally {
      setGuardandoNota(false);
    }
  };

  // ─── FASE 2: REPORTE DE AVERÍA / INCIDENCIA ───
  const handleAbrirModalAveria = (hab) => {
    setHabParaAveria(hab);
    setTipoAveria('Plomería / Baño');
    setPrioridadAveria('Media');
    setDescripcionAveria('');
    setBloquearCuarto(true);
    setModalAveriaOpen(true);
  };

  const handleGuardarAveria = async (e) => {
    e.preventDefault();
    if (!habParaAveria) return;

    if (!descripcionAveria.trim()) {
      notificarError('Falta descripción', 'Por favor detalla el problema o avería detectada.');
      return;
    }

    try {
      setGuardandoAveria(true);
      await api.post(`/habitaciones/${habParaAveria.id}/reportar-averia`, {
        tipo_averia: tipoAveria,
        prioridad: prioridadAveria,
        descripcion: descripcionAveria.trim(),
        bloquear_cuarto: bloquearCuarto
      });
      notificarExito('Avería Registrada', `La habitación ${habParaAveria.numero} pasó a Mantenimiento.`);
      setModalAveriaOpen(false);
      setHabParaAveria(null);
      cargarHabitaciones();
    } catch (err) {
      notificarError('Error al reportar', err.response?.data?.message || 'No se pudo registrar la avería.');
    } finally {
      setGuardandoAveria(false);
    }
  };

  // ─── FASE 2: RESOLVER AVERÍA Y HABILITAR CUARTO ───
  const handleAbrirModalResolver = (hab) => {
    setHabParaResolver(hab);
    setNuevoEstadoLimpieza('limpia');
    setNotasSolucion('');
    setModalResolverOpen(true);
  };

  const handleConfirmarSolucion = async (e) => {
    e.preventDefault();
    if (!habParaResolver) return;

    try {
      setGuardandoSolucion(true);
      await api.post(`/habitaciones/${habParaResolver.id}/resolver-averia`, {
        nuevo_estado_limpieza: nuevoEstadoLimpieza,
        notas_solucion: notasSolucion.trim() || 'Avería subsanada satisfactoriamente.'
      });
      notificarExito('Habitación Habilitada', `Habitación ${habParaResolver.numero} resuelta y habilitada.`);
      setModalResolverOpen(false);
      setHabParaResolver(null);
      cargarHabitaciones();
    } catch (err) {
      notificarError('Error al resolver', err.response?.data?.message || 'No se pudo resolver la avería.');
    } finally {
      setGuardandoSolucion(false);
    }
  };

  // ─── FASE 2: ASIGNACIÓN DE CAMARERA / PERSONAL ───
  const handleAbrirModalAsignar = (hab) => {
    setHabParaAsignar(hab);
    setCamareraSeleccionada(hab.limpieza_user_id ? String(hab.limpieza_user_id) : '');
    setModalAsignarOpen(true);
  };

  const handleGuardarAsignacion = async (e) => {
    e.preventDefault();
    if (!habParaAsignar) return;

    try {
      setGuardandoAsignacion(true);
      await api.patch(`/habitaciones/${habParaAsignar.id}/asignar-camarera`, {
        user_id: camareraSeleccionada ? parseInt(camareraSeleccionada, 10) : null
      });
      notificarExito(
        'Asignación Actualizada',
        camareraSeleccionada
          ? `Personal asignado a Hab. ${habParaAsignar.numero}`
          : `Asignación retirada para Hab. ${habParaAsignar.numero}`
      );
      setModalAsignarOpen(false);
      setHabParaAsignar(null);
      cargarHabitaciones();
    } catch (err) {
      notificarError('Error de Asignación', err.response?.data?.message || 'No se pudo asignar personal.');
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  // Helper de cálculo de tiempo transcurrido
  const calcularTiempoTranscurrido = (fecha) => {
    if (!fecha) return null;
    const diffMs = Date.now() - new Date(fecha).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
    const diffDias = Math.floor(diffHoras / 24);
    return `Hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`;
  };

  // Helper para verificar demora excesiva (> 45 min en aseo)
  const esDemoraExcesiva = (hab) => {
    if (hab.estado_limpieza !== 'en_limpieza' || !hab.limpieza_actualizado) return false;
    const diffMs = Date.now() - new Date(hab.limpieza_actualizado).getTime();
    return diffMs > 45 * 60 * 1000;
  };

  // Helper para extraer avería activa de las notas
  const extraerAveriaActiva = (notas) => {
    if (!notas) return null;
    const match = notas.match(/\[AVERÍA:[^\]]+\][^\n-]+/);
    if (match) return match[0];
    if (notas.includes('[AVERÍA')) {
      const line = notas.split('\n').find(l => l.includes('[AVERÍA'));
      return line || null;
    }
    return null;
  };

  // KPIs globales
  const totalSucias = habitaciones.filter(h => h.estado_limpieza === 'sucia' && h.estado !== 'mantenimiento').length;
  const totalEnLimpieza = habitaciones.filter(h => h.estado_limpieza === 'en_limpieza').length;
  const totalInspeccion = habitaciones.filter(h => h.estado_limpieza === 'inspeccion').length;
  const totalLimpias = habitaciones.filter(h => h.estado_limpieza === 'limpia' && h.estado !== 'mantenimiento').length;
  const totalMantenimiento = habitaciones.filter(h => h.estado === 'mantenimiento').length;
  const totalLlegadasHoy = habitaciones.filter(h => Boolean(h.llegada_hoy)).length;
  const totalSalidasDesocupadas = habitaciones.filter(h => h.estado === 'disponible' && h.estado_limpieza === 'sucia').length;
  const totalMisHabitaciones = usuarioActual?.id
    ? habitaciones.filter(h => String(h.limpieza_user_id) === String(usuarioActual.id)).length
    : 0;

  // Lista de pisos únicos ordenados
  const pisosDisponibles = Array.from(new Set(habitaciones.map(h => String(h.piso || '1')))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  // Filtrado de habitaciones
  const habitacionesFiltradas = habitaciones.filter(h => {
    // Filtro por piso
    if (pisoSeleccionado !== 'todos' && String(h.piso) !== String(pisoSeleccionado)) {
      return false;
    }

    // Filtro por Camarera / Personal
    if (filtroCamarera === 'mis_habitaciones') {
      if (!usuarioActual?.id || String(h.limpieza_user_id) !== String(usuarioActual.id)) {
        return false;
      }
    } else if (filtroCamarera === 'sin_asignar') {
      if (h.limpieza_user_id) {
        return false;
      }
    } else if (filtroCamarera !== 'todas') {
      if (String(h.limpieza_user_id) !== String(filtroCamarera)) {
        return false;
      }
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const numMatch = (h.numero || '').toLowerCase().includes(q);
      const tipoMatch = (h.tipo?.nombre || '').toLowerCase().includes(q);
      const notasMatch = (h.limpieza_notas || '').toLowerCase().includes(q);
      const camareraMatch = (h.camarera?.name || '').toLowerCase().includes(q);
      const huespedMatch =
        (h.reservas?.[0]?.huesped?.nombre || '').toLowerCase().includes(q) ||
        (h.reservas?.[0]?.huesped?.apellido || '').toLowerCase().includes(q);

      if (!numMatch && !tipoMatch && !notasMatch && !huespedMatch && !camareraMatch) {
        return false;
      }
    }

    // Filtro por estado
    if (filtroEstado === 'pendientes') {
      return h.estado_limpieza !== 'limpia' || h.estado === 'mantenimiento';
    }
    if (filtroEstado === 'sucia') {
      return h.estado_limpieza === 'sucia' && h.estado !== 'mantenimiento';
    }
    if (filtroEstado === 'en_limpieza') {
      return h.estado_limpieza === 'en_limpieza';
    }
    if (filtroEstado === 'inspeccion') {
      return h.estado_limpieza === 'inspeccion';
    }
    if (filtroEstado === 'limpia') {
      return h.estado_limpieza === 'limpia' && h.estado !== 'mantenimiento';
    }
    if (filtroEstado === 'llegadas_hoy') {
      return Boolean(h.llegada_hoy);
    }
    if (filtroEstado === 'salidas') {
      return h.estado === 'disponible' && h.estado_limpieza === 'sucia';
    }
    if (filtroEstado === 'mantenimiento') {
      return h.estado === 'mantenimiento';
    }

    return true; // 'todos'
  });

  // Acción Masiva: Modal para marcar habitaciones pendientes del piso actual o de la vista como limpias
  const habitacionesPendientesMasivo = habitacionesFiltradas.filter(
    h => h.estado_limpieza !== 'limpia' && h.estado !== 'mantenimiento'
  );

  const handleAbrirModalMasivo = () => {
    if (habitacionesPendientesMasivo.length === 0) {
      notificarError('Sin pendientes', 'No hay habitaciones pendientes en la vista actual para marcar como limpias.');
      return;
    }
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotaMasiva(`Aseo general completado en lote (${hora})`);
    setModalMasivoOpen(true);
  };

  const handleConfirmarMasivo = async (e) => {
    if (e) e.preventDefault();
    if (habitacionesPendientesMasivo.length === 0) return;

    try {
      setMarcandoMasivo(true);
      const ids = habitacionesPendientesMasivo.map(h => h.id);
      await api.patch('/habitaciones/limpieza-masiva', {
        ids,
        estado_limpieza: 'limpia',
        notas:
          notaMasiva.trim() ||
          `Aseo general completado en lote (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
      });
      notificarExito('Piso Verificado', `Se marcaron ${ids.length} habitaciones como limpias.`);
      setModalMasivoOpen(false);
      cargarHabitaciones();
    } catch (err) {
      notificarError('Error masivo', err.response?.data?.message || 'No se pudo procesar la acción masiva.');
    } finally {
      setMarcandoMasivo(false);
    }
  };

  // ─── MANTENIMIENTO PREVENTIVO HANDLERS ───
  const handleCrearPreventivo = (e) => {
    e.preventDefault();
    if (!formPrevHab || !formPrevTarea.trim()) {
      notificarError('Campos incompletos', 'Selecciona una habitación e indica la tarea preventiva.');
      return;
    }
    const nuevo = {
      id: `prev-${Date.now()}`,
      habitacion_numero: formPrevHab,
      sistema: formPrevSistema,
      tarea: formPrevTarea.trim(),
      frecuencia_dias: parseInt(formPrevFrecuencia, 10),
      fecha_programada: formPrevFecha,
      tecnico: formPrevTecnico.trim() || 'Servicio Técnico Interno',
      estado: 'pendiente',
      prioridad: formPrevPrioridad,
      ultimo_mantenimiento: null,
      notas: ''
    };
    guardarPreventivos([nuevo, ...preventivos]);
    notificarExito('Mantenimiento Programado', `Tarea agendada para Hab. ${formPrevHab}`);
    setModalNuevoPreventivoOpen(false);
    setFormPrevHab('');
    setFormPrevTarea('');
  };

  const handleAbrirCompletarPreventivo = (prev) => {
    setPrevParaCompletar(prev);
    setNotasCompletado('');
    setReprogramarSiguiente(true);
    setModalCompletarPrevOpen(true);
  };

  const handleConfirmarCompletarPreventivo = (e) => {
    e.preventDefault();
    if (!prevParaCompletar) return;

    const hoy = new Date().toISOString().split('T')[0];
    let actualizados = preventivos.map(p => {
      if (p.id === prevParaCompletar.id) {
        return {
          ...p,
          estado: 'completado',
          ultimo_mantenimiento: hoy,
          notas: notasCompletado.trim() ? `${p.notas ? p.notas + ' | ' : ''}Completado (${hoy}): ${notasCompletado.trim()}` : p.notas
        };
      }
      return p;
    });

    if (reprogramarSiguiente && prevParaCompletar.frecuencia_dias > 0) {
      const proximaFechaObj = new Date();
      proximaFechaObj.setDate(proximaFechaObj.getDate() + prevParaCompletar.frecuencia_dias);
      const proximaFechaStr = proximaFechaObj.toISOString().split('T')[0];

      const siguienteCiclo = {
        ...prevParaCompletar,
        id: `prev-${Date.now()}`,
        estado: 'pendiente',
        fecha_programada: proximaFechaStr,
        ultimo_mantenimiento: hoy,
        notas: `Ciclo recurrente generado tras servicio del ${hoy}`
      };
      actualizados = [siguienteCiclo, ...actualizados];
    }

    guardarPreventivos(actualizados);
    notificarExito('Mantenimiento Completado', `Mantenimiento registrado para Hab. ${prevParaCompletar.habitacion_numero}`);
    setModalCompletarPrevOpen(false);
    setPrevParaCompletar(null);
  };

  const handleEliminarPreventivo = (id) => {
    const filtrados = preventivos.filter(p => p.id !== id);
    guardarPreventivos(filtrados);
    notificarExito('Eliminado', 'Tarea de mantenimiento removida.');
  };

  const hoyYMD = new Date().toISOString().split('T')[0];
  const preventivosFiltrados = preventivos.filter(p => {
    if (filtroPreventivo === 'pendientes' && p.estado !== 'pendiente') return false;
    if (filtroPreventivo === 'completados' && p.estado !== 'completado') return false;
    if (filtroPreventivo === 'vencidos') {
      if (p.estado === 'completado' || p.fecha_programada >= hoyYMD) return false;
    }
    if (busquedaPreventivo.trim()) {
      const q = busquedaPreventivo.toLowerCase().trim();
      const numMatch = (p.habitacion_numero || '').toLowerCase().includes(q);
      const sisMatch = (p.sistema || '').toLowerCase().includes(q);
      const tarMatch = (p.tarea || '').toLowerCase().includes(q);
      const tecMatch = (p.tecnico || '').toLowerCase().includes(q);
      return numMatch || sisMatch || tarMatch || tecMatch;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* ─── ENCABEZADO CÁPSULA FLOTANTE ULTRA-SLIM ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                Panel de Limpieza & Housekeeping
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Control de Aseo & Averías
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Control en tiempo real de aseo, camareras asignadas, inspección y gestión directa de averías
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleAbrirModalMasivo}
            disabled={marcandoMasivo || habitacionesPendientesMasivo.length === 0}
            className="p-2 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 disabled:opacity-50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold font-sora"
            title="Marcar todas las habitaciones pendientes de la vista actual como limpias"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">
              {pisoSeleccionado === 'todos' ? 'Marcar Todo Limpio' : `Marcar Piso ${pisoSeleccionado} Limpio`}
            </span>
            {habitacionesPendientesMasivo.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-800 text-[10px] text-emerald-900 dark:text-emerald-100 font-extrabold font-mono">
                {habitacionesPendientesMasivo.length}
              </span>
            )}
          </button>

          <button
            onClick={cargarDatos}
            data-tooltip="Actualizar estado de limpieza y averías [F5]"
            className="p-2 sm:px-3 sm:py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>
      </div>

      {/* ─── SELECTOR SUB-MÓDULO: HOUSEKEEPING DIARIO vs MANTENIMIENTO PREVENTIVO ─── */}
      <div className="flex bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-xs font-bold font-sora w-fit">
        <button
          type="button"
          onClick={() => setSubModulo('housekeeping')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            subModulo === 'housekeeping'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Housekeeping & Aseo Diario</span>
        </button>
        <button
          type="button"
          onClick={() => setSubModulo('preventivo')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            subModulo === 'preventivo'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Mantenimiento Preventivo Programado</span>
          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-500 text-white ml-0.5">
            PRO
          </span>
        </button>
      </div>

      {subModulo === 'preventivo' ? (
        <div className="space-y-4">
          {/* 4 KPI CARDS PREVENTIVO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora block mb-1">
                Total Tareas Programadas
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white">
                {preventivos.length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora block mb-1">
                Pendientes de Ejecución
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                {preventivos.filter(p => p.estado === 'pendiente').length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora block mb-1">
                Vencidos / Críticos
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                {preventivos.filter(p => p.estado === 'pendiente' && p.fecha_programada < hoyYMD).length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora block mb-1">
                Completados & Operativos
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {preventivos.filter(p => p.estado === 'completado').length}
              </div>
            </div>
          </div>

          {/* BARRA DE ACCIÓN PREVENTIVO */}
          <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaPreventivo}
                onChange={(e) => setBusquedaPreventivo(e.target.value)}
                placeholder="Buscar por Habitación, Sistema (AC, Plomería, Chapa) o Técnico..."
                className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {busquedaPreventivo && (
                <button
                  type="button"
                  onClick={() => setBusquedaPreventivo('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold font-sora">
                {['todos', 'pendientes', 'vencidos', 'completados'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltroPreventivo(f)}
                    className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                      filtroPreventivo === f
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormPrevHab(habitaciones[0]?.numero || '101');
                  setFormPrevSistema('Aire Acondicionado');
                  setFormPrevFrecuencia(30);
                  setFormPrevFecha(new Date().toISOString().split('T')[0]);
                  setFormPrevTecnico('');
                  setFormPrevTarea('');
                  setFormPrevPrioridad('Media');
                  setModalNuevoPreventivoOpen(true);
                }}
                className="glow-btn-hotel flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Programar Mantenimiento</span>
              </button>
            </div>
          </div>

          {/* TABLA DE MANTENIMIENTO PREVENTIVO */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sora">
                    <th className="py-3.5 px-4">Habitación</th>
                    <th className="py-3.5 px-4">Sistema & Tarea Preventiva</th>
                    <th className="py-3.5 px-4">Frecuencia</th>
                    <th className="py-3.5 px-4">Próxima Fecha</th>
                    <th className="py-3.5 px-4">Técnico / Encargado</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {preventivosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        No hay tareas preventivas en este filtro.
                      </td>
                    </tr>
                  ) : (
                    preventivosFiltrados.map((p) => {
                      const esVencido = p.estado === 'pendiente' && p.fecha_programada < hoyYMD;
                      const esHoy = p.estado === 'pendiente' && p.fecha_programada === hoyYMD;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-sm bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-xl">
                              Hab. {p.habitacion_numero}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-extrabold text-slate-800 dark:text-white font-sora text-xs">
                                {p.sistema}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono ${
                                p.prioridad === 'Crítica'
                                  ? 'bg-rose-100 text-rose-700'
                                  : p.prioridad === 'Alta'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {p.prioridad}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {p.tarea}
                            </p>
                            {p.notas && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">
                                {p.notas}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-sora">
                              <RefreshCw className="w-3 h-3 text-slate-400" />
                              Cada {p.frecuencia_dias} días
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {p.fecha_programada}
                              </div>
                              {esVencido ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9.5px] font-black font-sora animate-pulse">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Vencido
                                </span>
                              ) : esHoy ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9.5px] font-black font-sora animate-pulse">
                                  <Clock className="w-2.5 h-2.5" />
                                  Toca Hoy
                                </span>
                              ) : p.estado === 'completado' ? (
                                <span className="text-[10px] text-emerald-600 font-bold">
                                  Atendido ({p.ultimo_mantenimiento || p.fecha_programada})
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  En cronograma
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-700 dark:text-slate-300 font-sora text-xs">
                              {p.tecnico}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            {p.estado === 'completado' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 font-sora">
                                <CheckCircle2 className="w-3 h-3" />
                                Completado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 font-sora">
                                <Clock className="w-3 h-3" />
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {p.estado !== 'completado' && (
                                <button
                                  type="button"
                                  onClick={() => handleAbrirCompletarPreventivo(p)}
                                  className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[11px] font-bold font-sora transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                  title="Registrar mantenimiento completado y reprogramar siguiente ciclo"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Completar</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEliminarPreventivo(p.id)}
                                className="h-7 w-7 rounded-lg bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                                title="Eliminar del cronograma"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      ) : (
        <>
          {/* ─── TARJETAS KPI (COMPACTADAS EN ALTURA - ESTILO SISTEMA FERRETERÍA) ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Sucias / Pendientes */}
        <div
          onClick={() => setFiltroEstado(filtroEstado === 'sucia' ? 'todos' : 'sucia')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtroEstado === 'sucia'
              ? 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors font-sora truncate">
              Sucias (Pendientes)
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-sora tracking-tight leading-none">
              {totalSucias}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              {totalSalidasDesocupadas > 0 ? `${totalSalidasDesocupadas} por salida de huésped` : 'Pendientes de aseo'}
            </p>
          </div>
        </div>

        {/* KPI 2: En Limpieza (En Curso) */}
        <div
          onClick={() => setFiltroEstado(filtroEstado === 'en_limpieza' ? 'todos' : 'en_limpieza')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtroEstado === 'en_limpieza'
              ? 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-sora truncate">
              En Limpieza
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-sora tracking-tight">
                {totalEnLimpieza}
              </div>
              {totalEnLimpieza > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Personal en habitación
            </p>
          </div>
        </div>

        {/* KPI 3: En Inspección */}
        <div
          onClick={() => setFiltroEstado(filtroEstado === 'inspeccion' ? 'todos' : 'inspeccion')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtroEstado === 'inspeccion'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sora truncate">
              En Inspección
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-sora tracking-tight leading-none">
              {totalInspeccion}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Aseo concluido, por verificar
            </p>
          </div>
        </div>

        {/* KPI 4: Limpias & Listas */}
        <div
          onClick={() => setFiltroEstado(filtroEstado === 'limpia' ? 'todos' : 'limpia')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtroEstado === 'limpia'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-sora truncate">
              Limpias & Listas
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sora tracking-tight leading-none">
              {totalLimpias}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Listas para Check-in
            </p>
          </div>
        </div>

        {/* KPI 5: Mantenimiento / Averías */}
        <div
          onClick={() => setFiltroEstado(filtroEstado === 'mantenimiento' ? 'todos' : 'mantenimiento')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
            filtroEstado === 'mantenimiento'
              ? 'border-orange-500 ring-2 ring-orange-500/20 dark:border-orange-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-orange-400'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors font-sora truncate">
              Mantenimiento
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100/80 dark:border-orange-800/60 flex items-center justify-center shrink-0">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 font-sora tracking-tight">
                {totalMantenimiento}
              </div>
              {totalMantenimiento > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              {totalMantenimiento > 0 ? `${totalMantenimiento} averías activas` : 'Sin averías activas'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTRO DE PISO Y PÍLDORAS ─── */}
      <div className="space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Buscador de Habitación */}
          <div className="relative max-w-xs sm:max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° hab., camarera, huésped o nota..."
              className="w-full bg-white dark:bg-slate-900 rounded-full pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200/80 dark:border-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium soft-card-shadow"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtro por Camarera / Personal */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 font-sora">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Camarera:</span>
              </span>

              <select
                value={filtroCamarera}
                onChange={(e) => setFiltroCamarera(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20 font-sora cursor-pointer"
              >
                <option value="todas">Todas las camareras</option>
                {usuarioActual?.id && (
                  <option value="mis_habitaciones">⭐ Mis Asignadas ({totalMisHabitaciones})</option>
                )}
                <option value="sin_asignar">⚠️ Sin Asignar</option>
                {personal.map(u => (
                  <option key={u.id} value={String(u.id)}>
                    👤 {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Pisos */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 mr-1 font-sora">
                <Layers className="w-3.5 h-3.5" />
                <span>Pisos:</span>
              </span>

              <button
                type="button"
                onClick={() => setPisoSeleccionado('todos')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 ${
                  pisoSeleccionado === 'todos'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>

              {pisosDisponibles.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPisoSeleccionado(p)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 ${
                    String(pisoSeleccionado) === String(p)
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Piso {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Píldoras de Estado Operativo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 ${
              filtroEstado === 'todos'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Todas ({habitaciones.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('pendientes')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtroEstado === 'pendientes'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes ({totalSucias + totalEnLimpieza + totalInspeccion + totalMantenimiento})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('llegadas_hoy')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtroEstado === 'llegadas_hoy'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Llegadas Hoy ({totalLlegadasHoy})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('salidas')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtroEstado === 'salidas'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Salidas / Check-out ({totalSalidasDesocupadas})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('en_limpieza')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtroEstado === 'en_limpieza'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>En Aseo ({totalEnLimpieza})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('inspeccion')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtroEstado === 'inspeccion'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>Inspección ({totalInspeccion})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('limpia')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtroEstado === 'limpia'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Limpias ({totalLimpias})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('mantenimiento')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filtroEstado === 'mantenimiento'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-orange-500" />
            <span>Mantenimiento ({totalMantenimiento})</span>
          </button>
        </div>
      </div>

      {/* ─── GRID DE HABITACIONES (HOUSEKEEPING CARDS) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 font-medium">
            Sincronizando habitaciones del hotel...
          </div>
        ) : habitacionesFiltradas.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 soft-card-shadow">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-90" />
            <p className="font-bold text-slate-800 dark:text-white font-sora text-base">¡No hay habitaciones en este criterio!</p>
            <p className="text-xs text-slate-400 mt-1">Prueba seleccionando otro piso, camarera o cambiando de pestaña de filtro.</p>
          </div>
        ) : (
          habitacionesFiltradas.map((hab) => {
            const esMantenimiento = hab.estado === 'mantenimiento';
            const esSucia = hab.estado_limpieza === 'sucia';
            const esEnCurso = hab.estado_limpieza === 'en_limpieza';
            const esInspeccion = hab.estado_limpieza === 'inspeccion';
            const esLimpia = hab.estado_limpieza === 'limpia';

            const tiempoTranscurrido = calcularTiempoTranscurrido(hab.limpieza_actualizado);
            const demoraExcesiva = esDemoraExcesiva(hab);
            const esLlegadaHoy = Boolean(hab.llegada_hoy);
            const esSalidaDesocupada = hab.estado === 'disponible' && esSucia && !esMantenimiento;
            const esHuespedEnCasa = hab.estado === 'ocupada';
            const huespedActivo = hab.reservas?.[0]?.huesped;
            const averiaActiva = extraerAveriaActiva(hab.limpieza_notas);

            return (
              <div
                key={hab.id}
                className={`relative group bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[24px] border soft-card-shadow transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  esMantenimiento
                    ? 'border-orange-300 dark:border-orange-800/80 border-l-4 border-l-orange-500 bg-orange-50/20 dark:bg-orange-950/10'
                    : esSucia
                    ? 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-rose-500'
                    : esEnCurso
                    ? 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-amber-500'
                    : esInspeccion
                    ? 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-indigo-500'
                    : 'border-slate-200/80 dark:border-slate-800 border-l-4 border-l-emerald-500'
                }`}
              >
                <div>
                  {/* Fila Superior: Número, Piso y Estado */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white font-mono">
                        Hab. {hab.numero}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                        Piso {hab.piso}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        esMantenimiento
                          ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700 shadow-xs'
                          : esSucia
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                          : esEnCurso
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                          : esInspeccion
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      }`}
                    >
                      {esMantenimiento ? '🛠️ Mantenimiento' : hab.estado_limpieza.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Badges Operativos de Prioridad */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    {esLlegadaHoy && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-sora">
                        <Zap className="w-2.5 h-2.5 text-amber-600" /> LLEGADA HOY
                      </span>
                    )}

                    {esSalidaDesocupada && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 font-sora">
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> SALIDA / DESOCUPADA
                      </span>
                    )}

                    {esHuespedEnCasa && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 font-sora">
                        <User className="w-2.5 h-2.5 text-blue-600" /> EN CASA / ESTANCIA
                      </span>
                    )}

                    {esMantenimiento && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-950/80 dark:text-orange-200 font-sora">
                        <ShieldAlert className="w-2.5 h-2.5 text-orange-600" /> BLOQUEADA POR AVERÍA
                      </span>
                    )}
                  </div>

                  {/* Tipo de Habitación & Ocupante */}
                  <div className="space-y-1 mb-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-medium font-sora">
                      Tipo: <strong className="text-slate-800 dark:text-white font-bold">{hab.tipo?.nombre}</strong>
                    </p>

                    {huespedActivo && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>Huésped: <strong>{huespedActivo.nombre} {huespedActivo.apellido}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Fila Asignación de Camarera (Fase 2) */}
                  <div className="mb-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[11px] font-medium text-slate-400 font-sora">Asignada a:</span>
                      {hab.camarera ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 text-[10.5px] font-bold font-sora truncate max-w-[150px]">
                          <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">{hab.camarera.name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Sin camarera</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAbrirModalAsignar(hab)}
                      className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 px-2 py-0.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer font-sora"
                      title="Asignar o reasignar personal a esta habitación"
                    >
                      {hab.camarera ? 'Cambiar' : '+ Asignar'}
                    </button>
                  </div>

                  {/* Cronómetro / Tiempo Transcurrido */}
                  {tiempoTranscurrido && (
                    <div className="mb-2.5">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {esEnCurso ? 'Tiempo en aseo:' : 'Última actualización:'}{' '}
                          <strong className="text-slate-700 dark:text-slate-200">{tiempoTranscurrido}</strong>
                        </span>
                      </div>

                      {demoraExcesiva && (
                        <div className="mt-1 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-[10px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>¡Atención! Demora excesiva en limpieza (&gt; 45 min)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Destacado de Avería Activa (Fase 2) */}
                  {esMantenimiento && averiaActiva && (
                    <div className="p-2.5 rounded-xl bg-orange-100/90 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800 text-[11px] text-orange-950 dark:text-orange-200 mb-3 font-mono leading-relaxed shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-orange-800 dark:text-orange-300 mb-1">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Detalle de Avería:</span>
                      </div>
                      <p className="text-[10.5px] leading-relaxed">{averiaActiva}</p>
                    </div>
                  )}

                  {/* Notas Generales de Housekeeping */}
                  {hab.limpieza_notas && !esMantenimiento && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic mb-3 font-mono leading-relaxed line-clamp-3">
                      "{hab.limpieza_notas}"
                    </div>
                  )}
                </div>

                {/* Acciones de Transición de Estado & Averías */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  {/* Si está en mantenimiento, la acción principal es resolver avería */}
                  {esMantenimiento ? (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleAbrirModalResolver(hab)}
                        className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer font-sora"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Resolver Avería & Habilitar Cuarto</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {esSucia && (
                        <button
                          onClick={() => handleCambiarEstado(hab.id, 'en_limpieza', 'Iniciando aseo y cambio de ropa')}
                          className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 cursor-pointer font-sora"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Iniciar Aseo</span>
                        </button>
                      )}

                      {esEnCurso && (
                        <button
                          onClick={() => handleCambiarEstado(hab.id, 'inspeccion', 'Aseo terminado, listo para supervisión')}
                          className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer font-sora"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>A Inspección</span>
                        </button>
                      )}

                      {(esEnCurso || esInspeccion || esSucia) && (
                        <button
                          onClick={() => handleCambiarEstado(hab.id, 'limpia', 'Habitación inspeccionada y lista para check-in')}
                          className="glow-btn-emerald flex-1 py-1.5 px-3 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer font-sora"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>✓ Marcar Limpia</span>
                        </button>
                      )}

                      {esLimpia && (
                        <button
                          onClick={() => handleCambiarEstado(hab.id, 'sucia', 'Reabierta como sucia para nuevo aseo')}
                          className="w-full py-1.5 px-3 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200/80 dark:border-slate-700 hover:border-rose-200 font-sora"
                        >
                          Reabrir como Sucia
                        </button>
                      )}
                    </div>
                  )}

                  {/* Fila secundaria de herramientas: Averías y Notas */}
                  <div className="flex items-center justify-between pt-1 text-[11px] font-bold font-sora">
                    {!esMantenimiento ? (
                      <button
                        type="button"
                        onClick={() => handleAbrirModalAveria(hab)}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition cursor-pointer"
                        title="Reportar avería para bloquear cuarto a mantenimiento"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Reportar Avería</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        <span>En reparación técnica</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAbrirModalNota(hab)}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{hab.limpieza_notas ? 'Editar Nota' : '+ Nota de Aseo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  )}

      {/* ─── MODAL REPORTAR AVERÍA / BLOQUEO A MANTENIMIENTO (FASE 2) ─── */}
      <Modal
        isOpen={modalAveriaOpen}
        onClose={() => {
          setModalAveriaOpen(false);
          setHabParaAveria(null);
        }}
        title={`Reportar Avería: Habitación ${habParaAveria?.numero || ''}`}
        subtitle="Reporta fallas técnicas o daños para bloquear el cuarto y coordinar su reparación"
        icon={<Wrench className="w-5 h-5 text-orange-500" />}
      >
        <form onSubmit={handleGuardarAveria} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Tipo de Avería / Incidencia
              </label>
              <select
                value={tipoAveria}
                onChange={(e) => setTipoAveria(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
              >
                <option value="Plomería / Baño">🚿 Plomería / Baño / Grifería</option>
                <option value="Electricidad / Iluminación">⚡ Electricidad / Iluminación / Enchufes</option>
                <option value="Climatización / AC">❄️ Climatización / Aire Acondicionado</option>
                <option value="Cerrajería / Puertas">🔑 Cerrajería / Chapa / Tarjeta</option>
                <option value="TV / Conectividad">📺 TV / WiFi / Conectividad</option>
                <option value="Mobiliario / Camas">🛏️ Mobiliario / Cama / Espejos</option>
                <option value="Limpieza Profunda">🧹 Limpieza Profunda Especial</option>
                <option value="Pintura / Techos">🔨 Gotera / Pintura / Albañilería</option>
                <option value="Otro Desperfecto">❓ Otro Desperfecto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Nivel de Prioridad
              </label>
              <select
                value={prioridadAveria}
                onChange={(e) => setPrioridadAveria(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
              >
                <option value="Baja">🟢 Baja (No urgente, observación)</option>
                <option value="Media">🟡 Media (Requiere revisión hoy)</option>
                <option value="Alta">🟠 Alta (Atención prioritaria)</option>
                <option value="Urgente / Bloqueante">🔴 Urgente / Bloqueante (Impide uso del cuarto)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
              Descripción Detallada del Problema
            </label>
            <textarea
              rows={3}
              value={descripcionAveria}
              onChange={(e) => setDescripcionAveria(e.target.value)}
              placeholder="Ej: Fuga de agua constante en la válvula del inodoro, mojando piso del baño..."
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none font-medium"
              required
            />
          </div>

          {/* Plantillas rápidas de averías */}
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 font-sora block mb-1.5">
              Plantillas frecuentes (un clic):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                'Fuga de agua en el inodoro / lavamanos',
                'Aire acondicionado no enfría / gotea',
                'Foco principal quemado / parpadea',
                'Chapa electrónica no lee la tarjeta',
                'Control remoto de TV averiado / sin pilas',
                'Ducha no tiene presión o no calienta',
                'Vidrio / espejo de tocador fisurado'
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDescripcionAveria(p)}
                  className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-[10.5px] text-orange-800 dark:text-orange-300 font-medium transition cursor-pointer border border-orange-200 dark:border-orange-800"
                >
                  + {p}
                </button>
              ))}
            </div>
          </div>

          {/* Bloquear cuarto */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 cursor-pointer">
            <input
              type="checkbox"
              checked={bloquearCuarto}
              onChange={(e) => setBloquearCuarto(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
            />
            <div>
              <p className="text-xs font-bold text-orange-900 dark:text-orange-200 font-sora">
                Bloquear habitación en Mantenimiento (Recomendado)
              </p>
              <p className="text-[11px] text-orange-700 dark:text-orange-400 mt-0.5 leading-snug">
                El cuarto no podrá ser asignado ni reservado en recepción hasta que se resuelva la avería.
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModalAveriaOpen(false);
                setHabParaAveria(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer font-sora"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoAveria}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 font-sora flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{guardandoAveria ? 'Guardando...' : 'Reportar & Bloquear Cuarto'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL RESOLVER AVERÍA & HABILITAR HABITACIÓN (FASE 2) ─── */}
      <Modal
        isOpen={modalResolverOpen}
        onClose={() => {
          setModalResolverOpen(false);
          setHabParaResolver(null);
        }}
        title={`Resolver Avería: Habitación ${habParaResolver?.numero || ''}`}
        subtitle="Confirma la reparación técnica y define en qué estado de aseo queda el cuarto"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
      >
        <form onSubmit={handleConfirmarSolucion} className="space-y-4">
          {/* Historial o detalle de la avería a resolver */}
          {habParaResolver?.limpieza_notas && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[10.5px] font-bold text-slate-400 font-sora block mb-1">
                Incidencia reportada previamente:
              </span>
              <p className="text-slate-700 dark:text-slate-200 font-mono text-[11px] leading-relaxed">
                {habParaResolver.limpieza_notas}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
              ¿En qué estado de limpieza queda la habitación?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-3 rounded-xl border text-center cursor-pointer transition flex flex-col items-center gap-1 ${
                  nuevoEstadoLimpieza === 'limpia'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="estado_habilitar"
                  value="limpia"
                  checked={nuevoEstadoLimpieza === 'limpia'}
                  onChange={() => setNuevoEstadoLimpieza('limpia')}
                  className="hidden"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold font-sora">Limpia & Lista</span>
                <span className="text-[10px] text-slate-400 leading-tight">Lista para huéspedes</span>
              </label>

              <label
                className={`p-3 rounded-xl border text-center cursor-pointer transition flex flex-col items-center gap-1 ${
                  nuevoEstadoLimpieza === 'sucia'
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="estado_habilitar"
                  value="sucia"
                  checked={nuevoEstadoLimpieza === 'sucia'}
                  onChange={() => setNuevoEstadoLimpieza('sucia')}
                  className="hidden"
                />
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold font-sora">Sucia / Por Asear</span>
                <span className="text-[10px] text-slate-400 leading-tight">Requiere limpieza</span>
              </label>

              <label
                className={`p-3 rounded-xl border text-center cursor-pointer transition flex flex-col items-center gap-1 ${
                  nuevoEstadoLimpieza === 'inspeccion'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="estado_habilitar"
                  value="inspeccion"
                  checked={nuevoEstadoLimpieza === 'inspeccion'}
                  onChange={() => setNuevoEstadoLimpieza('inspeccion')}
                  className="hidden"
                />
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold font-sora">A Inspección</span>
                <span className="text-[10px] text-slate-400 leading-tight">Por supervisión</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
              Notas de la Solución Aplicada
            </label>
            <textarea
              rows={2}
              value={notasSolucion}
              onChange={(e) => setNotasSolucion(e.target.value)}
              placeholder="Ej: Se reemplazó el empaque de la llave y se verificó que no haya goteo..."
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-medium"
            />
          </div>

          {/* Plantillas de solución */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              'Reparación concluida y probada',
              'Pieza o repuesto reemplazado',
              'Revisado y operativo al 100%'
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNotasSolucion(p)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-[10.5px] text-emerald-800 dark:text-emerald-300 font-medium transition cursor-pointer border border-emerald-200 dark:border-emerald-800"
              >
                + {p}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModalResolverOpen(false);
                setHabParaResolver(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer font-sora"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoSolucion}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 font-sora flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{guardandoSolucion ? 'Habilitando...' : 'Habilitar Habitación'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL ASIGNAR PERSONAL / CAMARERA (FASE 2) ─── */}
      <Modal
        isOpen={modalAsignarOpen}
        onClose={() => {
          setModalAsignarOpen(false);
          setHabParaAsignar(null);
        }}
        title={`Asignar Camarera: Habitación ${habParaAsignar?.numero || ''}`}
        subtitle="Designa la camarera o personal responsable de la limpieza de este cuarto"
        icon={<UserCheck className="w-5 h-5 text-blue-500" />}
      >
        <form onSubmit={handleGuardarAsignacion} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
              Seleccionar Personal Encargado
            </label>
            <select
              value={camareraSeleccionada}
              onChange={(e) => setCamareraSeleccionada(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="">(Sin asignar - Dejar libre)</option>
              {personal.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  👤 {u.name} — Rol: {u.role}
                </option>
              ))}
            </select>
          </div>

          {habParaAsignar?.camarera && (
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
              <span className="font-bold">Actualmente asignada a: </span>
              {habParaAsignar.camarera.name} ({habParaAsignar.camarera.role})
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModalAsignarOpen(false);
                setHabParaAsignar(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer font-sora"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoAsignacion}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 font-sora flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{guardandoAsignacion ? 'Guardando...' : 'Guardar Asignación'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL AGREGAR / EDITAR NOTA DE LIMPIEZA ─── */}
      <Modal
        isOpen={modalNotaOpen}
        onClose={() => {
          setModalNotaOpen(false);
          setHabParaNota(null);
        }}
        title={`Nota de Housekeeping: Hab. ${habParaNota?.numero || ''}`}
        subtitle="Observaciones de camareras, estado de lencería, faltantes o solicitudes especiales"
        icon={<FileText className="w-5 h-5 text-amber-500" />}
      >
        <form onSubmit={handleGuardarNota} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
              Notas u Observaciones del Cuarto
            </label>
            <textarea
              rows={3}
              value={notaTexto}
              onChange={(e) => setNotaTexto(e.target.value)}
              placeholder="Ej: Cambio de toallas realizado, sábanas renovadas, falta reponer jabón de tocador..."
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-medium"
            />
          </div>

          {/* Chips de notas rápidas */}
          <div>
            <span className="text-[10.5px] font-bold text-slate-400 font-sora block mb-1.5">
              Plantillas rápidas:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                'Cambio de lencería completo',
                'Toallas y amenities renovados',
                'Desinfección de baño y piso completa',
                'Falta reposición de jaboncillo/shampoo',
                'Habitación ventilada y aromatizada'
              ].map((plantilla, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNotaTexto(prev => prev ? `${prev} • ${plantilla}` : plantilla)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10.5px] text-slate-600 dark:text-slate-300 font-medium transition cursor-pointer"
                >
                  + {plantilla}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModalNotaOpen(false);
                setHabParaNota(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoNota}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 font-sora"
            >
              {guardandoNota ? 'Guardando...' : 'Guardar Nota'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL CONFIRMAR ACCIÓN MASIVA: MARCAR TODO LIMPIO ─── */}
      <Modal
        isOpen={modalMasivoOpen}
        onClose={() => setModalMasivoOpen(false)}
        title="Marcar Habitaciones como Limpias"
        subtitle={`Confirmación de aseo general en lote para ${pisoSeleccionado === 'todos' ? 'todo el hotel' : `el Piso ${pisoSeleccionado}`}`}
        icon={<CheckCheck className="w-5 h-5 text-emerald-500" />}
      >
        <form onSubmit={handleConfirmarMasivo} className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 font-sora">
                  ¿Deseas marcar como LIMPIAS {habitacionesPendientesMasivo.length} habitaciones del {pisoSeleccionado === 'todos' ? 'hotel' : `Piso ${pisoSeleccionado}`}?
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-1 leading-relaxed">
                  Las habitaciones seleccionadas pasarán inmediatamente a estado <strong>Limpia</strong> y estarán listas para nuevos registros de Check-in.
                </p>
              </div>
            </div>
          </div>

          {/* Listado de habitaciones a actualizar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-sora">
                Habitaciones a actualizar ({habitacionesPendientesMasivo.length}):
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Piso: {pisoSeleccionado === 'todos' ? 'Todos los pisos' : `Piso ${pisoSeleccionado}`}
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 scrollbar-thin">
              {habitacionesPendientesMasivo.map(hab => (
                <span
                  key={hab.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  <span className="text-slate-800 dark:text-white">Hab. {hab.numero}</span>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded font-sans uppercase font-extrabold ${
                      hab.estado_limpieza === 'sucia'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : hab.estado_limpieza === 'en_limpieza'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    {hab.estado_limpieza.replace('_', ' ')}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Nota opcional para el registro */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
              Nota u Observación para el Registro (Opcional)
            </label>
            <input
              type="text"
              value={notaMasiva}
              onChange={(e) => setNotaMasiva(e.target.value)}
              placeholder="Ej: Aseo general completado en lote"
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium font-mono"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalMasivoOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer font-sora"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={marcandoMasivo}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 font-sora flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{marcandoMasivo ? 'Actualizando...' : 'Confirmar y Marcar Limpias'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL NUEVO MANTENIMIENTO PREVENTIVO ─── */}
      <Modal
        isOpen={modalNuevoPreventivoOpen}
        onClose={() => setModalNuevoPreventivoOpen(false)}
        title="Programar Mantenimiento Preventivo"
        subtitle="Agenda revisiones periódicas de equipos, climatización, cerraduras y plomería"
        icon={<Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCrearPreventivo} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Habitación *
              </label>
              <select
                value={formPrevHab}
                onChange={(e) => setFormPrevHab(e.target.value)}
                required
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              >
                <option value="">Seleccionar...</option>
                {habitaciones.map(h => (
                  <option key={h.id} value={h.numero}>
                    Hab. {h.numero} ({h.tipo?.nombre || `Piso ${h.piso}`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Sistema o Equipo *
              </label>
              <select
                value={formPrevSistema}
                onChange={(e) => setFormPrevSistema(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              >
                <option value="Aire Acondicionado">Aire Acondicionado (HVAC)</option>
                <option value="Cerradura RFID">Cerradura RFID & Puerta</option>
                <option value="Plomería & Grifería">Plomería & Grifería</option>
                <option value="Colchones & Lencería">Colchones & Lencería</option>
                <option value="Eléctrico & Iluminación">Eléctrico & Iluminación</option>
                <option value="TV, Red & Minibar">TV, Red & Minibar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
              Tarea / Especificación del Trabajo Preventivo *
            </label>
            <textarea
              rows={2}
              required
              value={formPrevTarea}
              onChange={(e) => setFormPrevTarea(e.target.value)}
              placeholder="Ej: Desmontaje y lavado de filtros, verificación de gas R410 y limpieza de bandeja de drenaje..."
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Frecuencia Recurrente *
              </label>
              <select
                value={formPrevFrecuencia}
                onChange={(e) => setFormPrevFrecuencia(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              >
                <option value={15}>Cada 15 días (Quincenal)</option>
                <option value={30}>Cada 30 días (Mensual)</option>
                <option value={60}>Cada 60 días (Bimestral)</option>
                <option value={90}>Cada 90 días (Trimestral)</option>
                <option value={180}>Cada 180 días (Semestral)</option>
                <option value={365}>Cada 365 días (Anual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Próxima Fecha Programada *
              </label>
              <input
                type="date"
                required
                value={formPrevFecha}
                onChange={(e) => setFormPrevFecha(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Técnico / Responsable
              </label>
              <input
                type="text"
                value={formPrevTecnico}
                onChange={(e) => setFormPrevTecnico(e.target.value)}
                placeholder="Ej: Carlos Méndez (HVAC)"
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Prioridad
              </label>
              <select
                value={formPrevPrioridad}
                onChange={(e) => setFormPrevPrioridad(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalNuevoPreventivoOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer font-sora"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 font-sora flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Guardar Tarea Preventiva</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL COMPLETAR MANTENIMIENTO PREVENTIVO ─── */}
      <Modal
        isOpen={modalCompletarPrevOpen}
        onClose={() => {
          setModalCompletarPrevOpen(false);
          setPrevParaCompletar(null);
        }}
        title={`Finalizar Mantenimiento: Habitación ${prevParaCompletar?.habitacion_numero || ''}`}
        subtitle="Registra el trabajo técnico realizado y agenda automáticamente la siguiente ronda"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        maxWidth="max-w-md"
      >
        {prevParaCompletar && (
          <form onSubmit={handleConfirmarCompletarPreventivo} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white font-sora">
                  {prevParaCompletar.sistema}
                </span>
                <span className="text-[10.5px] font-mono font-bold text-slate-400">
                  Frecuencia: {prevParaCompletar.frecuencia_dias}d
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                {prevParaCompletar.tarea}
              </p>
              <p className="text-[10.5px] text-slate-400 font-medium">
                Técnico: {prevParaCompletar.tecnico}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-sora">
                Observaciones del Servicio Técnico Realizado
              </label>
              <textarea
                rows={3}
                value={notasCompletado}
                onChange={(e) => setNotasCompletado(e.target.value)}
                placeholder="Ej: Se cambiaron los filtros, presiones de gas normales en 115 PSI, equipo enfriando al 100%..."
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none font-medium"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={reprogramarSiguiente}
                onChange={(e) => setReprogramarSiguiente(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 font-sora">
                  Reprogramar automáticamente siguiente ciclo (+{prevParaCompletar.frecuencia_dias} días)
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-snug">
                  Crea una nueva tarea pendiente con la fecha calculada según la frecuencia periódica del hotel.
                </p>
              </div>
            </label>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalCompletarPrevOpen(false);
                  setPrevParaCompletar(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer font-sora"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 font-sora flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar y Completar</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
