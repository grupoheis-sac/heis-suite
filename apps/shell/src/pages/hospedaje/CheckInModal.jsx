import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@heis/ui';
import DropdownPill from './components/DropdownPill';
import api from './api';
import { useSettingsStore } from '@heis/core';
import { calcularTarifaDinamica } from './utils/tarifasDinamicas';
import {
  Search,
  BedDouble,
  CheckCircle,
  LogIn,
  Clock,
  Moon,
  Users,
  ShieldAlert,
  Star,
  Plus,
  Trash2,
  ChevronDown,
  MapPin,
  Wallet,
  FileText,
  Loader2,
  Globe,
  Calendar,
  KeyRound,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { notificarExito, notificarError } from './utils/notificaciones';

const OPCIONES_DOCUMENTO = [
  { value: 'DNI', label: 'DNI (Documento Nacional de Identidad)', subtitle: '8 dígitos oficiales RENIEC', badge: 'Perú' },
  { value: 'Pasaporte', label: 'Pasaporte Extranjero', subtitle: 'Exigido para control migratorio', badge: 'Internacional' },
  { value: 'Carnet Extranjería', label: 'Carnet de Extranjería (CE)', subtitle: 'Residencia en territorio peruano', badge: 'Migraciones' },
  { value: 'RUC', label: 'RUC (Persona Jurídica / Empresa)', subtitle: '11 dígitos para facturación SUNAT', badge: 'Empresas' }
];

const OPCIONES_METODO_PAGO = [
  { value: 'efectivo', label: 'Efectivo en Caja', subtitle: 'Cobro físico en recepción', badge: 'Caja' },
  { value: 'yape', label: 'Yape / Plin', subtitle: 'Billetera digital instantánea QR', badge: 'Digital' },
  { value: 'tarjeta_debito', label: 'Tarjeta de Débito', subtitle: 'Terminal POS Visa / Mastercard', badge: 'POS' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito', subtitle: 'Terminal POS con voucher', badge: 'POS' },
  { value: 'transferencia', label: 'Transferencia Bancaria', subtitle: 'BCP, BBVA, Interbank, Scotiabank', badge: 'Banco' }
];

const OPCIONES_MOTIVO_VIAJE = [
  { value: 'Turismo / Descanso', label: 'Turismo / Descanso', badge: 'MINCETUR' },
  { value: 'Trabajo / Negocios', label: 'Trabajo / Negocios', badge: 'MINCETUR' },
  { value: 'Tránsito', label: 'Tránsito / Escala', badge: 'MINCETUR' },
  { value: 'Salud / Tratamiento', label: 'Salud / Tratamiento Médico', badge: 'MINCETUR' },
  { value: 'Estudios', label: 'Estudios / Capacitación', badge: 'MINCETUR' },
  { value: 'Otro', label: 'Otro motivo no clasificado', badge: 'General' }
];

const OPCIONES_ORIGEN = [
  { value: 'presencial', label: 'Mostrador / Presencial (Walk-in)', subtitle: 'Cliente directo en recepción', badge: 'Presencial' },
  { value: 'whatsapp', label: 'WhatsApp / Redes Sociales', subtitle: 'Contacto directo por mensajería', badge: 'Digital' },
  { value: 'telefono', label: 'Llamada Telefónica', subtitle: 'Reserva vía llamada', badge: 'Llamada' },
  { value: 'booking', label: 'Booking.com', subtitle: 'Plataforma internacional de reservas', badge: 'OTA' },
  { value: 'airbnb', label: 'Airbnb', subtitle: 'Alquiler vacacional y estancias', badge: 'OTA' },
  { value: 'corporativo', label: 'Convenio Empresa / Corporativo', subtitle: 'Facturación a persona jurídica', badge: 'Empresa' }
];

export default function CheckInModal({
  isOpen,
  onClose,
  habitacionSeleccionada,
  habitaciones = [],
  onSuccess,
  reservaPrevia = null
}) {
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [habitacionId, setHabitacionId] = useState('');
  const [modoHuesped, setModoHuesped] = useState('buscar'); // 'buscar' | 'nuevo'
  const [busqueda, setBusqueda] = useState('');
  const [huespedesEncontrados, setHuespedesEncontrados] = useState([]);
  const [huespedSeleccionado, setHuespedSeleccionado] = useState(null);

  // New guest fields
  const [nuevoHuesped, setNuevoHuesped] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'DNI',
    num_documento: '',
    telefono: '',
    email: '',
    nacionalidad: 'Peruana',
    ciudad_origen: '',
    ocupacion: ''
  });
  const [consultandoDoc, setConsultandoDoc] = useState(false);

  // Modalidad de estadía
  const [modalidad, setModalidad] = useState('noches'); // 'noches' | 'horas'
  const [numHoras, setNumHoras] = useState(3);
  const [precioHora, setPrecioHora] = useState(25);

  // Stay details (Noches)
  const [numNoches, setNumNoches] = useState(1);
  const [precioNoche, setPrecioNoche] = useState(80);
  const [numPersonas, setNumPersonas] = useState(1);

  // Acompañantes adicionales
  const [acompanantes, setAcompanantes] = useState([]);
  const [mostrarAcompanantes, setMostrarAcompanantes] = useState(false);
  const [formAcomp, setFormAcomp] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'DNI',
    num_documento: '',
    nacionalidad: 'Peruana',
    parentesco: 'Acompañante',
    edad: ''
  });

  // Datos de Viaje MINCETUR & Origen
  const [ciudadDestino, setCiudadDestino] = useState('');
  const [motivoViaje, setMotivoViaje] = useState('Turismo / Descanso');
  const [origen, setOrigen] = useState('presencial');
  const [mostrarMinceturExtra, setMostrarMinceturExtra] = useState(false);
  const [consultandoDocAcomp, setConsultandoDocAcomp] = useState(false);

  // Control de Llaves / Tarjetas RFID (Fase C)
  const [tarjetaLlave, setTarjetaLlave] = useState('');
  const [tarjetasEntregadas, setTarjetasEntregadas] = useState(1);

  // Payment
  const [adelanto, setAdelanto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setAcompanantes([]);
      setMostrarAcompanantes(false);
      setMostrarMinceturExtra(false);
      setOrigen('presencial');
      setConsultandoDocAcomp(false);

      if (habitaciones && habitaciones.length > 0) {
        const disponiblesMemoria = habitaciones.filter(
          h => h.estado === 'disponible' && h.estado_limpieza !== 'en_limpieza' && h.estado_limpieza !== 'sucia' && h.estado !== 'mantenimiento'
        );
        setHabitacionesDisponibles(disponiblesMemoria);

        if (habitacionSeleccionada) {
          setHabitacionId(habitacionSeleccionada.id);
          setPrecioNoche(parseFloat(habitacionSeleccionada.tipo?.precio_base || 80));
          setPrecioHora(parseFloat(habitacionSeleccionada.tipo?.precio_por_hora || 25));
        } else if (disponiblesMemoria.length > 0) {
          setHabitacionId(disponiblesMemoria[0].id);
          setPrecioNoche(parseFloat(disponiblesMemoria[0].tipo?.precio_base || 80));
          setPrecioHora(parseFloat(disponiblesMemoria[0].tipo?.precio_por_hora || 25));
        }
      } else if (habitacionSeleccionada) {
        setHabitacionId(habitacionSeleccionada.id);
        setPrecioNoche(parseFloat(habitacionSeleccionada.tipo?.precio_base || 80));
        setPrecioHora(parseFloat(habitacionSeleccionada.tipo?.precio_por_hora || 25));
      }

      // Pre-cargar datos si viene de una reserva programada / confirmada
      if (reservaPrevia) {
        if (reservaPrevia.huesped) {
          setModoHuesped('buscar');
          setHuespedSeleccionado(reservaPrevia.huesped);
          setBusqueda(`${reservaPrevia.huesped.nombre} ${reservaPrevia.huesped.apellido} (${reservaPrevia.huesped.num_documento || 'Sin doc'})`);
        }
        if (reservaPrevia.modalidad) setModalidad(reservaPrevia.modalidad);
        if (reservaPrevia.num_horas) setNumHoras(reservaPrevia.num_horas);
        if (reservaPrevia.num_noches) setNumNoches(reservaPrevia.num_noches);
        if (reservaPrevia.precio_noche) setPrecioNoche(parseFloat(reservaPrevia.precio_noche));
        if (reservaPrevia.precio_hora) setPrecioHora(parseFloat(reservaPrevia.precio_hora));
        if (reservaPrevia.num_personas) setNumPersonas(reservaPrevia.num_personas);
        if (reservaPrevia.adelanto) setAdelanto(parseFloat(reservaPrevia.adelanto));
        if (reservaPrevia.observaciones) setObservaciones(reservaPrevia.observaciones);
        if (reservaPrevia.ciudad_destino) setCiudadDestino(reservaPrevia.ciudad_destino);
        if (reservaPrevia.motivo_viaje) setMotivoViaje(reservaPrevia.motivo_viaje);
        if (reservaPrevia.origen) setOrigen(reservaPrevia.origen);
        if (reservaPrevia.acompanantes && Array.isArray(reservaPrevia.acompanantes) && reservaPrevia.acompanantes.length > 0) {
          setAcompanantes(reservaPrevia.acompanantes);
          setMostrarAcompanantes(true);
        }
        if (reservaPrevia.tarjeta_llave_codigo) {
          setTarjetaLlave(reservaPrevia.tarjeta_llave_codigo);
          setTarjetasEntregadas(reservaPrevia.tarjetas_entregadas || 1);
        } else if (habitacionSeleccionada?.numero) {
          setTarjetaLlave(`T-${habitacionSeleccionada.numero}`);
          setTarjetasEntregadas(1);
        }
      } else if (habitacionSeleccionada?.numero) {
        setTarjetaLlave(`T-${habitacionSeleccionada.numero}`);
        setTarjetasEntregadas(1);
      } else {
        setTarjetaLlave('');
        setTarjetasEntregadas(1);
      }

      cargarHabitaciones();
    }
  }, [isOpen, habitacionSeleccionada, habitaciones, reservaPrevia]);

  const cargarHabitaciones = async () => {
    try {
      const res = await api.get('/habitaciones?estado=disponible');
      const list = res.data.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setHabitacionesDisponibles(list);
        if (!habitacionSeleccionada && (!habitacionId || habitacionId === '')) {
          setHabitacionId(list[0].id);
          setPrecioNoche(parseFloat(list[0].tipo?.precio_base || 80));
          setPrecioHora(parseFloat(list[0].tipo?.precio_por_hora || 25));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuscarHuesped = async (e) => {
    const val = e.target.value;
    setBusqueda(val);
    if (val.trim().length >= 2) {
      try {
        const res = await api.get(`/huespedes?busqueda=${encodeURIComponent(val)}`);
        setHuespedesEncontrados(res.data.data || res.data || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setHuespedesEncontrados([]);
    }
  };

  const seleccionarHuesped = (h) => {
    setHuespedSeleccionado(h);
    setBusqueda(`${h.nombre} ${h.apellido} (${h.num_documento})`);
    setHuespedesEncontrados([]);
  };

  const handleNumeroDocumentoChangeNuevo = (val) => {
    let limpio = val;
    if (nuevoHuesped.tipo_documento === 'DNI') {
      limpio = val.replace(/\D/g, '').slice(0, 8);
    } else if (nuevoHuesped.tipo_documento === 'RUC') {
      limpio = val.replace(/\D/g, '').slice(0, 11);
    } else {
      limpio = val.slice(0, 20);
    }
    setNuevoHuesped((prev) => ({ ...prev, num_documento: limpio }));
  };

  const handleConsultarDocumentoNuevo = async () => {
    const doc = (nuevoHuesped.num_documento || '').trim();
    if (nuevoHuesped.tipo_documento === 'DNI') {
      if (doc.length !== 8) {
        notificarError('Formato inválido', 'El DNI debe tener exactamente 8 dígitos.');
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
          notificarExito('RENIEC Conforme', `Datos obtenidos: ${d.nombre_completo}`);
        }
      } catch (err) {
        notificarError('Consulta RENIEC', err.response?.data?.message || 'No se pudo consultar el DNI.');
      } finally {
        setConsultandoDoc(false);
      }
    } else if (nuevoHuesped.tipo_documento === 'RUC') {
      if (doc.length !== 11) {
        notificarError('Formato inválido', 'El RUC debe tener exactamente 11 dígitos.');
        return;
      }
      try {
        setConsultandoDoc(true);
        const res = await api.get(`/consultas/ruc/${doc}`);
        const d = res.data?.data || res.data;
        if (d && (d.razon_social || d.nombre)) {
          setNuevoHuesped((prev) => ({
            ...prev,
            nombre: d.razon_social || d.nombre,
            apellido: '(Empresa / RUC)',
            ciudad_origen: d.ciudad || d.departamento || prev.ciudad_origen
          }));
          notificarExito('SUNAT Conforme', `Datos obtenidos: ${d.razon_social}`);
        }
      } catch (err) {
        notificarError('Consulta SUNAT', err.response?.data?.message || 'No se pudo consultar el RUC.');
      } finally {
        setConsultandoDoc(false);
      }
    }
  };

  const handleHabitacionChange = (val) => {
    const id = (val && typeof val === 'object' && val.target) ? val.target.value : val;
    setHabitacionId(id);
    const hab = habitacionesDisponibles.find(h => String(h.id) === String(id)) ||
      (habitacionSeleccionada && String(habitacionSeleccionada.id) === String(id) ? habitacionSeleccionada : null);
    if (hab && hab.tipo) {
      setPrecioNoche(parseFloat(hab.tipo.precio_base || 80));
      setPrecioHora(parseFloat(hab.tipo.precio_por_hora || 25));
    }
  };

  const opcionesHabitaciones = [
    ...(habitacionSeleccionada ? [{
      value: habitacionSeleccionada.id,
      label: `Hab. ${habitacionSeleccionada.numero} — ${habitacionSeleccionada.tipo?.nombre}`,
      subtitle: `Piso ${habitacionSeleccionada.piso} • S/ ${parseFloat(habitacionSeleccionada.tipo?.precio_base || 80).toFixed(2)}/noche • S/ ${parseFloat(habitacionSeleccionada.tipo?.precio_por_hora || 25).toFixed(2)}/h`,
      badge: `Hab. ${habitacionSeleccionada.numero}`
    }] : []),
    ...habitacionesDisponibles
      .filter(h => !habitacionSeleccionada || String(h.id) !== String(habitacionSeleccionada.id))
      .map(h => ({
        value: h.id,
        label: `Hab. ${h.numero} (Piso ${h.piso}) — ${h.tipo?.nombre}`,
        subtitle: `S/ ${parseFloat(h.tipo?.precio_base || 80).toFixed(2)}/noche • S/ ${parseFloat(h.tipo?.precio_por_hora || 25).toFixed(2)}/h`,
        badge: `Piso ${h.piso}`
      }))
  ];

  const handleAgregarAcompanante = (e) => {
    e.preventDefault();
    if (!formAcomp.nombre.trim() || !formAcomp.num_documento.trim()) {
      notificarError('Ingrese al menos nombre y número de documento del acompañante.');
      return;
    }
    setAcompanantes([...acompanantes, { ...formAcomp }]);
    setFormAcomp({
      nombre: '',
      apellido: '',
      tipo_documento: 'DNI',
      num_documento: '',
      nacionalidad: 'Peruana',
      parentesco: 'Acompañante',
      edad: ''
    });
  };

  const handleEliminarAcompanante = (index) => {
    setAcompanantes(acompanantes.filter((_, i) => i !== index));
  };

  const handleConsultarAcompDni = async () => {
    const doc = (formAcomp.num_documento || '').trim();
    if (doc.length !== 8) {
      notificarError('Formato inválido', 'El DNI del acompañante debe tener exactamente 8 dígitos numéricos.');
      return;
    }
    try {
      setConsultandoDocAcomp(true);
      const res = await api.get(`/consultas/dni/${doc}`);
      const d = res.data?.data || res.data;
      if (d && (d.nombres || d.nombre_completo)) {
        setFormAcomp((prev) => ({
          ...prev,
          nombre: d.nombres || '',
          apellido: d.apellidos || `${d.apellido_paterno || ''} ${d.apellido_materno || ''}`.trim()
        }));
        notificarExito('RENIEC Conforme', `Acompañante: ${d.nombre_completo}`);
      }
    } catch (err) {
      notificarError('Consulta RENIEC', err.response?.data?.message || 'No se pudo consultar el DNI del acompañante en RENIEC.');
    } finally {
      setConsultandoDocAcomp(false);
    }
  };

  const calcularHoraSalidaDayUse = () => {
    const ahora = new Date();
    const salida = new Date(ahora.getTime() + (parseInt(numHoras) || 3) * 3600 * 1000);
    return salida.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calcularFechaSalidaNoches = () => {
    const noches = parseInt(numNoches) || 1;
    const salida = new Date(Date.now() + noches * 86400000);
    const opciones = { weekday: 'short', day: 'numeric', month: 'short' };
    const fechaStr = salida.toLocaleDateString('es-PE', opciones);
    return `${fechaStr} • 12:00 PM (Límite)`;
  };

  const settings = useSettingsStore();

  const tarifaDinamica = useMemo(() => {
    if (modalidad !== 'noches') return null;
    return calcularTarifaDinamica({
      precioBase: parseFloat(precioNoche) || 80,
      fechaEntrada: new Date(),
      noches: parseInt(numNoches, 10) || 1,
      config: settings
    });
  }, [modalidad, precioNoche, numNoches, settings]);

  const totalCalculado = modalidad === 'horas'
    ? (parseInt(numHoras) || 1) * (parseFloat(precioHora) || 25)
    : (tarifaDinamica ? tarifaDinamica.totalFinal : (parseInt(numNoches) || 1) * (parseFloat(precioNoche) || 0));

  const saldoCalculado = Math.max(0, totalCalculado - (parseFloat(adelanto) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        habitacion_id: habitacionId,
        modalidad,
        num_horas: modalidad === 'horas' ? parseInt(numHoras) || 3 : 0,
        precio_hora: modalidad === 'horas' ? parseFloat(precioHora) || 25 : 0,
        num_noches: parseInt(numNoches) || 1,
        precio_noche: modalidad === 'horas' ? 0 : (tarifaDinamica ? tarifaDinamica.precioPromedioNoche : parseFloat(precioNoche) || 80),
        num_personas: (parseInt(numPersonas) || 1) + acompanantes.length,
        ciudad_destino: ciudadDestino || null,
        motivo_viaje: motivoViaje || 'Turismo / Descanso',
        origen: origen || 'presencial',
        acompanantes,
        adelanto: parseFloat(adelanto) || 0,
        metodo_pago_adelanto: metodoPago,
        observaciones,
        tarjeta_llave_codigo: tarjetaLlave.trim() || null,
        tarjetas_entregadas: parseInt(tarjetasEntregadas, 10) || 1
      };

      if (reservaPrevia?.id) {
        payload.reserva_id = reservaPrevia.id;
      }

      if (modoHuesped === 'buscar') {
        if (!huespedSeleccionado) {
          throw new Error('Debe seleccionar un huésped existente o elegir Registrar Nuevo.');
        }
        payload.huesped_id = huespedSeleccionado.id;
      } else {
        if (!nuevoHuesped.nombre || !nuevoHuesped.num_documento) {
          throw new Error('Ingrese el nombre y documento del huésped.');
        }
        payload.nuevo_huesped = nuevoHuesped;
      }

      const res = await api.post('/reservas/checkin', payload);
      const reservaCreada = res.data?.data;
      window.dispatchEvent(new CustomEvent('hotel-stats-changed'));
      window.dispatchEvent(new CustomEvent('caja-turno-changed'));
      notificarExito(`Check-in registrado exitosamente en modalidad ${modalidad === 'horas' ? 'Por Horas' : 'Por Noches'}`);
      if (onSuccess) onSuccess(reservaCreada);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al procesar el check-in.';
      setError(msg);
      notificarError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={reservaPrevia ? <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      title={reservaPrevia ? `Check-in de Reserva #${reservaPrevia.codigo}` : "Registro de Check-in de Huésped"}
      subtitle={reservaPrevia ? `Confirmar recepción de ${reservaPrevia.huesped?.nombre || 'Huésped'} en Habitación ${habitacionSeleccionada?.numero || ''}` : "Modalidad por Noches o por Horas (Day-Use) y Registro de Pasajeros"}
      maxWidth="max-w-2xl"
    >
      {/* Banner de Reserva Previa Asociada */}
      {reservaPrevia && (
        <div className="mb-4 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs font-sora">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="font-extrabold text-[12px] truncate">
                Reserva Programada #{reservaPrevia.codigo}
              </div>
              <p className="text-[10.5px] text-indigo-700 dark:text-indigo-300 truncate">
                Llegada: <span className="font-mono font-bold">{reservaPrevia.fecha_entrada}</span> • Salida: <span className="font-mono font-bold">{reservaPrevia.fecha_salida}</span>
              </p>
            </div>
          </div>
          {parseFloat(reservaPrevia.adelanto || 0) > 0 ? (
            <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-[11px] px-2.5 py-1 rounded-xl bg-indigo-100/90 dark:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-700 shrink-0">
              Adelanto: S/ {parseFloat(reservaPrevia.adelanto).toFixed(2)}
            </span>
          ) : (
            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg bg-white/70 dark:bg-slate-900/70 shrink-0">
              Sin adelanto previo
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 font-sora">

        {/* Selector de Modalidad: Por Noches vs Por Horas */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setModalidad('noches')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${modalidad === 'noches'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Moon className="w-4 h-4" />
            <span>Por Noches (Hospedaje Diario)</span>
          </button>
          <button
            type="button"
            onClick={() => setModalidad('horas')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${modalidad === 'horas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Clock className="w-4 h-4" />
            <span>Por Horas (Day-Use)</span>
          </button>
        </div>

        {/* Selector de Habitación en Píldora Desplegable */}
        <div>
          <DropdownPill
            label="Habitación Asignada"
            required={true}
            value={habitacionId}
            onChange={handleHabitacionChange}
            options={opcionesHabitaciones}
            icon={BedDouble}
            searchable={true}
            searchPlaceholder="Buscar habitación por número o tipo..."
            placeholder={
              habitacionesDisponibles.length === 0
                ? "No hay habitaciones disponibles actualmente"
                : "-- Seleccionar habitación disponible --"
            }
          />
        </div>

        {/* Guest selector mode */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Datos del Huésped Titular
            </span>
            <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setModoHuesped('buscar')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${modoHuesped === 'buscar'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Buscar Registrado
              </button>
              <button
                type="button"
                onClick={() => setModoHuesped('nuevo')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${modoHuesped === 'nuevo'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                + Registrar Nuevo
              </button>
            </div>
          </div>

          {modoHuesped === 'buscar' ? (
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Buscar por DNI, Pasaporte o Apellido
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={handleBuscarHuesped}
                  placeholder="Escriba DNI o apellido..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {huespedesEncontrados.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20">
                  {huespedesEncontrados.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => seleccionarHuesped(h)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/60 border-b border-slate-100 dark:border-slate-700/50 text-xs flex justify-between items-center transition cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-white">{h.nombre} {h.apellido}</span>
                        {h.total_visitas > 1 && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[9px] font-black">
                            {h.total_visitas} visitas
                          </span>
                        )}
                        {h.clasificacion === 'lista_negra' && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black">LISTA NEGRA</span>
                        )}
                        {h.clasificacion === 'vip' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black">VIP</span>
                        )}
                      </div>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                        {h.tipo_documento}: {h.num_documento}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Huésped Asignado y Alerta de Seguridad (VIP / Lista Negra) */}
              {huespedSeleccionado && (
                <div className="mt-2.5 space-y-2">
                  <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>
                        Huésped: <strong>{huespedSeleccionado.nombre} {huespedSeleccionado.apellido}</strong> ({huespedSeleccionado.num_documento})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {huespedSeleccionado.total_visitas > 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                          🏆 Huésped Frecuente ({huespedSeleccionado.total_visitas} visitas)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold">
                          ✨ 1ª Visita
                        </span>
                      )}
                      {huespedSeleccionado.clasificacion === 'vip' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black">
                          <Star className="w-3 h-3 fill-white" />
                          VIP
                        </span>
                      )}
                    </div>
                  </div>

                  {huespedSeleccionado.clasificacion === 'lista_negra' && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border-2 border-rose-500 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-pulse">
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black uppercase text-[11px] tracking-wide text-rose-700 dark:text-rose-300">
                          ⛔ ADVERTENCIA: Huésped en Lista Negra
                        </p>
                        <p className="text-[11px] mt-0.5 text-rose-600 dark:text-rose-300/90 font-medium">
                          Motivo: {huespedSeleccionado.motivo_lista_negra || 'El huésped presenta antecedentes o incidentes registrados en el establecimiento.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <DropdownPill
                  label="Tipo Documento"
                  value={nuevoHuesped.tipo_documento}
                  onChange={(val) => setNuevoHuesped({ ...nuevoHuesped, tipo_documento: val })}
                  options={OPCIONES_DOCUMENTO}
                  icon={FileText}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Número Documento {modoHuesped === 'nuevo' && <span className="text-rose-500">*</span>}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required={modoHuesped === 'nuevo'}
                    value={nuevoHuesped.num_documento}
                    onChange={(e) => handleNumeroDocumentoChangeNuevo(e.target.value)}
                    placeholder={nuevoHuesped.tipo_documento === 'DNI' ? '8 dígitos' : nuevoHuesped.tipo_documento === 'RUC' ? '11 dígitos' : 'N° documento'}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                  {(nuevoHuesped.tipo_documento === 'DNI' || nuevoHuesped.tipo_documento === 'RUC') && (
                    <button
                      type="button"
                      onClick={handleConsultarDocumentoNuevo}
                      disabled={consultandoDoc || (nuevoHuesped.tipo_documento === 'DNI' ? nuevoHuesped.num_documento.length !== 8 : nuevoHuesped.num_documento.length !== 11)}
                      className="px-2.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0 font-sora"
                      title={nuevoHuesped.tipo_documento === 'DNI' ? 'Consultar RENIEC oficial' : 'Consultar padrón SUNAT'}
                    >
                      {consultandoDoc ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>{nuevoHuesped.tipo_documento === 'DNI' ? 'RENIEC' : 'SUNAT'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nombres {modoHuesped === 'nuevo' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  required={modoHuesped === 'nuevo'}
                  value={nuevoHuesped.nombre}
                  onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, nombre: e.target.value })}
                  placeholder="Nombres completos / Razón social"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Apellidos {modoHuesped === 'nuevo' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  required={modoHuesped === 'nuevo'}
                  value={nuevoHuesped.apellido}
                  onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, apellido: e.target.value })}
                  placeholder="Apellidos"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Celular / Teléfono</label>
                <input
                  type="text"
                  value={nuevoHuesped.telefono}
                  onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, telefono: e.target.value })}
                  placeholder="999888777"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Ciudad de Origen (MINCETUR)</label>
                <input
                  type="text"
                  value={nuevoHuesped.ciudad_origen}
                  onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, ciudad_origen: e.target.value })}
                  placeholder="Ej: Arequipa, Lima, Cusco"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Ocupación / Profesión</label>
                <input
                  type="text"
                  value={nuevoHuesped.ocupacion}
                  onChange={(e) => setNuevoHuesped({ ...nuevoHuesped, ocupacion: e.target.value })}
                  placeholder="Ej: Ingeniero, Comerciante, Docente"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sección de Estadía: Dependiendo de Modalidad */}
        {modalidad === 'horas' ? (
          /* ─── DAY-USE (POR HORAS) ─── */
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Estadía Day-Use (Por Horas)
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                Salida: {calcularHoraSalidaDayUse()} de Hoy
              </span>
            </div>

            {/* Presets de horas rápidas */}
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 6, 12].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setNumHoras(h)}
                  className={`py-2 rounded-xl text-xs font-black font-sora border transition cursor-pointer ${numHoras === h
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                >
                  {h} Horas
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cant. Horas</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numHoras}
                  onChange={(e) => setNumHoras(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tarifa x Hora (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={precioHora}
                  onChange={(e) => setPrecioHora(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cant. Pasajeros</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numPersonas}
                  onChange={(e) => setNumPersonas(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold tabular-nums"
                />
              </div>
            </div>
          </div>
        ) : (
          /* ─── POR NOCHES TRADICIONAL ─── */
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" />
                Estadía por Noches (Diario)
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                📅 Salida: {calcularFechaSalidaNoches()}
              </span>
            </div>

            {/* Presets de noches rápidas */}
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 5, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumNoches(n)}
                  className={`py-2 rounded-xl text-xs font-black font-sora border transition cursor-pointer ${parseInt(numNoches) === n
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                >
                  {n} {n === 1 ? 'Noche' : 'Noches'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Noches de Estadía</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numNoches}
                  onChange={(e) => setNumNoches(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold tabular-nums focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Precio por Noche (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={precioNoche}
                  onChange={(e) => setPrecioNoche(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold tabular-nums focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cant. Huéspedes</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numPersonas}
                  onChange={(e) => setNumPersonas(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold tabular-nums focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Píldora Desplegable: Acompañantes Adicionales */}
        <div className={`rounded-2xl transition-all border overflow-hidden ${mostrarAcompanantes
            ? 'border-blue-400/80 dark:border-blue-800/80 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-300/70 dark:hover:border-slate-700 shadow-2xs'
          }`}>
          <button
            type="button"
            onClick={() => setMostrarAcompanantes(!mostrarAcompanantes)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold font-sora text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${mostrarAcompanantes
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80'
                }`}>
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-xs">Acompañantes en la Habitación</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                {acompanantes.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px] font-semibold hidden sm:inline">
                {mostrarAcompanantes ? 'Contraer' : 'Desplegar'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mostrarAcompanantes ? 'rotate-180 text-blue-600' : ''}`} />
            </div>
          </button>

          {mostrarAcompanantes && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-white/60 dark:bg-slate-900/40">
              {/* Formulario rápido para añadir acompañante */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="DNI (8 dígitos)"
                    value={formAcomp.num_documento}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormAcomp({ ...formAcomp, num_documento: val });
                    }}
                    className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleConsultarAcompDni}
                    disabled={consultandoDocAcomp || formAcomp.num_documento.length !== 8}
                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl shadow-xs transition cursor-pointer shrink-0"
                    title="Consultar RENIEC para acompañante"
                  >
                    {consultandoDocAcomp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Nombres"
                  value={formAcomp.nombre}
                  onChange={(e) => setFormAcomp({ ...formAcomp, nombre: e.target.value })}
                  className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="text"
                  placeholder="Apellidos"
                  value={formAcomp.apellido}
                  onChange={(e) => setFormAcomp({ ...formAcomp, apellido: e.target.value })}
                  className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={handleAgregarAcompanante}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Lista de acompañantes añadidos */}
              {acompanantes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {acompanantes.map((ac, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-slate-800 dark:text-white">
                          {ac.nombre} {ac.apellido}{' '}
                          <span className="font-mono text-slate-400 font-semibold">({ac.tipo_documento || 'DNI'}: {ac.num_documento})</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarAcompanante(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Eliminar acompañante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Píldora Desplegable: Datos de Viaje MINCETUR (Opcional) */}
        <div className={`rounded-2xl transition-all border overflow-hidden ${mostrarMinceturExtra
            ? 'border-blue-400/80 dark:border-blue-800/80 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-300/70 dark:hover:border-slate-700 shadow-2xs'
          }`}>
          <button
            type="button"
            onClick={() => setMostrarMinceturExtra(!mostrarMinceturExtra)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold font-sora text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${mostrarMinceturExtra
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80'
                }`}>
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-xs">Datos Oficiales de Viaje MINCETUR</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                Opcional
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px] font-semibold hidden sm:inline">
                {mostrarMinceturExtra ? 'Contraer' : 'Desplegar'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mostrarMinceturExtra ? 'rotate-180 text-blue-600' : ''}`} />
            </div>
          </button>

          {mostrarMinceturExtra && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-white/60 dark:bg-slate-900/40">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-sora">
                    Ciudad de Destino
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Arequipa, Puno, Cusco"
                    value={ciudadDestino}
                    onChange={(e) => setCiudadDestino(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <DropdownPill
                    label="Motivo de Viaje"
                    value={motivoViaje}
                    onChange={(val) => setMotivoViaje(val)}
                    options={OPCIONES_MOTIVO_VIAJE}
                    icon={MapPin}
                  />
                </div>
                <div>
                  <DropdownPill
                    label="Canal / Origen Reserva"
                    value={origen}
                    onChange={(val) => setOrigen(val)}
                    options={OPCIONES_ORIGEN}
                    icon={Globe}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pago y Adelanto con DropdownPill */}
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 font-sora">
                  Adelanto / Depósito (S/)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAdelanto(totalCalculado.toFixed(2))}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 transition cursor-pointer"
                    title="Cobrar el 100% de la estadía ahora"
                  >
                    Pagar Todo (S/ {totalCalculado.toFixed(0)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdelanto((totalCalculado / 2).toFixed(2))}
                    className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 transition cursor-pointer"
                    title="Cobrar 50% de depósito"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdelanto('0')}
                    className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    title="Sin adelanto, liquidar al check-out"
                  >
                    S/ 0
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                value={adelanto}
                onChange={(e) => setAdelanto(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-blue-300/80 dark:border-blue-700/60 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-bold tabular-nums focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <DropdownPill
                label="Método de Pago"
                value={metodoPago}
                onChange={(val) => setMetodoPago(val)}
                options={OPCIONES_METODO_PAGO}
                icon={Wallet}
              />
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
                S/ {tarifaDinamica.precioPromedioNoche.toFixed(2)}/noche promedio
              </span>
            </div>
          )}

          <div className="pt-2.5 flex items-center justify-between text-xs font-bold border-t border-blue-200/60 dark:border-blue-800/40">
            <span className="text-slate-600 dark:text-slate-400">
              Total {modalidad === 'horas' ? `(${numHoras}h)` : `(${numNoches}n)`}:{' '}
              <strong className="text-slate-900 dark:text-white text-sm font-sora tabular-nums">
                S/ {totalCalculado.toFixed(2)}
              </strong>
            </span>
            <span className={saldoCalculado > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
              {saldoCalculado > 0 ? 'Saldo Pendiente: ' : '✅ Pagado al 100%: '}
              <strong className="text-sm font-sora tabular-nums">
                S/ {saldoCalculado.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>

        {/* Control de Llaves / Tarjeta RFID (Fase C) */}
        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 font-sora">
                  Asignación de Llave / Tarjeta RFID
                </h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                  Código de control y número de tarjetas entregadas al huésped
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
              Control Front-Desk
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Código de Llave / Tarjeta
              </label>
              <input
                type="text"
                value={tarjetaLlave}
                onChange={(e) => setTarjetaLlave(e.target.value)}
                placeholder="Ej: T-101, RFID-A12"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-700/60 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cantidad Entregada
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setTarjetasEntregadas(qty)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      tarjetasEntregadas === qty
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {qty} {qty === 1 ? 'tarjeta' : 'tarjetas'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Observaciones o Peticiones Especiales</label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Cama adicional, llegada tarde, huésped corporativo"
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-medium"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="glow-btn-hotel px-6 py-2.5 text-white rounded-xl text-xs font-extrabold transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Procesando...' : `Confirmar Check-in (${modalidad === 'horas' ? `${numHoras}h` : `${numNoches}n`})`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
