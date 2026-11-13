import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import ModalFichaMincetur from './ModalFichaMincetur';
import {
  User,
  X,
  CreditCard,
  MapPin,
  Globe,
  Phone,
  Mail,
  Briefcase,
  Crown,
  ShieldAlert,
  Calendar,
  Moon,
  DollarSign,
  BedDouble,
  CheckCircle2,
  Clock,
  Printer,
  Users,
  Edit3,
  MessageCircle,
  FileText,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Star
} from 'lucide-react';
import { notificarError } from '../utils/notificaciones';

export default function ModalPerfilHuesped({
  isOpen,
  onClose,
  huespedId,
  onEditar
}) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState('estadias'); // 'estadias' | 'acompanantes' | 'notas'
  const [reservaParaFicha, setReservaParaFicha] = useState(null);
  const [modalFichaOpen, setModalFichaOpen] = useState(false);

  useEffect(() => {
    if (isOpen && huespedId) {
      cargarPerfil();
    } else {
      setPerfil(null);
      setTabActiva('estadias');
    }
  }, [isOpen, huespedId]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/huespedes/${huespedId}`);
      if (res.data?.success) {
        setPerfil(res.data.data);
      }
    } catch (err) {
      console.error(err);
      notificarError('Error al cargar', 'No se pudo obtener la ficha 360° del huésped.');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '---';
    try {
      const f = new Date(fechaStr + (fechaStr.includes('T') ? '' : 'T00:00:00'));
      return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return fechaStr;
    }
  };

  const formatearMonto = (monto) => {
    return `S/ ${Number(monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const estadisticas = perfil?.estadisticas || {
    total_estadias: 0,
    total_noches: 0,
    gasto_total: 0,
    habitacion_favorita: null,
    veces_habitacion_favorita: 0
  };

  const reservas = perfil?.reservas || [];
  const acompanantesFrecuentes = perfil?.acompanantes_frecuentes || [];
  const estadiaActiva = perfil?.estadia_activa;

  // Teléfono limpio para WhatsApp
  const telLimpio = (perfil?.telefono || '').replace(/\D/g, '');
  const telWa = telLimpio.length === 9 ? `51${telLimpio}` : telLimpio;
  const mensajeWa = encodeURIComponent(
    `¡Hola ${perfil?.nombre || ''}! Te saludamos cordialmente desde la recepción del Hotel. Esperamos que tengas una excelente estadía.`
  );

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[3px] animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150"
      >
        {/* ─── BARRA SUPERIOR ─── */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs border ${
              perfil?.clasificacion === 'vip'
                ? 'bg-amber-500/10 border-amber-300 text-amber-600 dark:text-amber-400'
                : perfil?.clasificacion === 'lista_negra'
                ? 'bg-rose-500/10 border-rose-300 text-rose-600 dark:text-rose-400'
                : 'bg-blue-500/10 border-blue-200 text-blue-600 dark:text-blue-400'
            }`}>
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white font-sora">
                  Ficha 360° & Historial de Pasajero
                </h3>
                {perfil?.id && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    ID #{perfil.id}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Expediente histórico de lealtad, estadías pernoctadas y preferencias de hospedaje
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Cerrar ficha"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── CONTENIDO SCROLLABLE ─── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Cargando expediente 360° del pasajero...</p>
            </div>
          ) : !perfil ? (
            <div className="py-16 text-center text-slate-400">
              No se encontró información del huésped solicitado.
            </div>
          ) : (
            <>
              {/* Tarjeta Banner de Identidad */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-lg font-black font-sora shrink-0 shadow-xs ${
                    perfil.clasificacion === 'vip'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-300'
                      : perfil.clasificacion === 'lista_negra'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-700 dark:text-rose-300'
                      : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  }`}>
                    {perfil.nombre?.charAt(0)}{perfil.apellido?.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sora">
                        {perfil.nombre} {perfil.apellido}
                      </h2>

                      {perfil.clasificacion === 'vip' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-sora">
                          <Crown className="w-3 h-3 text-amber-600" /> HUÉSPED VIP
                        </span>
                      )}
                      {perfil.clasificacion === 'lista_negra' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 font-sora">
                          <ShieldAlert className="w-3 h-3 text-rose-600" /> ALERTA DE SEGURIDAD
                        </span>
                      )}
                      {perfil.clasificacion === 'estandar' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-sora">
                          PASAJERO ESTÁNDAR
                        </span>
                      )}
                    </div>

                    {/* Fila de metadatos rápidos */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-200">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        {perfil.tipo_documento}: {perfil.num_documento}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-amber-500" />
                        {perfil.nacionalidad || 'Peruana'}
                      </span>
                      {perfil.ciudad_origen && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          {perfil.ciudad_origen}
                        </span>
                      )}
                      {perfil.ocupacion && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {perfil.ocupacion}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones directas de contacto y edición */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
                  {telLimpio && (
                    <a
                      href={`https://wa.me/${telWa}?text=${mensajeWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
                      title="Abrir chat en WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {perfil.telefono && (
                    <a
                      href={`tel:${perfil.telefono}`}
                      className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                      title={`Llamar a ${perfil.telefono}`}
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      <span className="hidden sm:inline">{perfil.telefono}</span>
                    </a>
                  )}

                  {onEditar && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditar(perfil);
                      }}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                      title="Editar ficha del pasajero"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Alerta de Lista Negra si aplica */}
              {perfil.clasificacion === 'lista_negra' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 font-sora">
                      Atención: Huésped en Lista de Alerta / Observado
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-200 font-medium mt-0.5">
                      {perfil.motivo_lista_negra || 'Sin motivo específico registrado. Se recomienda consultar con administración antes de asignar habitación.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Banner si está Alojado Actualmente (In-House) */}
              {estadiaActiva && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-sora">
                          Huésped Alojado Actualmente (In-House)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                          Reserva #{estadiaActiva.codigo}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                        Habitación <strong className="font-extrabold text-emerald-900 dark:text-emerald-100">{estadiaActiva.habitacion?.numero || '---'}</strong> (Piso {estadiaActiva.habitacion?.piso || '1'}) • Entrada: {formatearFecha(estadiaActiva.fecha_entrada)} • Salida prevista: {formatearFecha(estadiaActiva.fecha_salida)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReservaParaFicha(estadiaActiva.id);
                      setModalFichaOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95 shrink-0"
                    title="Imprimir Ficha MINCETUR de la estadía actual"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ficha MINCETUR</span>
                  </button>
                </div>
              )}

              {/* ─── 4 TARJETAS KPI DE LEALTAD ─── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Visitas */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider font-sora">Estadías</span>
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-800 dark:text-white font-sora">
                    {estadisticas.total_estadias}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">visitas registradas</span>
                </div>

                {/* 2. Noches */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider font-sora">Noches</span>
                    <Moon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-800 dark:text-white font-sora">
                    {estadisticas.total_noches}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">noches en total</span>
                </div>

                {/* 3. Gasto Total */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider font-sora">Gasto Total</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatearMonto(estadisticas.gasto_total)}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">LTV facturado</span>
                </div>

                {/* 4. Habitación Preferida */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider font-sora">Preferida</span>
                    <BedDouble className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-800 dark:text-white font-sora truncate">
                    {estadisticas.habitacion_favorita ? `Hab. ${estadisticas.habitacion_favorita}` : '---'}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {estadisticas.veces_habitacion_favorita > 0 ? `${estadisticas.veces_habitacion_favorita} veces ocupada` : 'Sin historial'}
                  </span>
                </div>
              </div>

              {/* ─── PESTAÑAS ─── */}
              <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTabActiva('estadias')}
                  className={`pb-2.5 px-3 text-xs font-bold font-sora border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                    tabActiva === 'estadias'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Historial de Estadías ({reservas.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTabActiva('acompanantes')}
                  className={`pb-2.5 px-3 text-xs font-bold font-sora border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                    tabActiva === 'acompanantes'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Acompañantes Frecuentes ({acompanantesFrecuentes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTabActiva('notas')}
                  className={`pb-2.5 px-3 text-xs font-bold font-sora border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                    tabActiva === 'notas'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Notas & Preferencias</span>
                </button>
              </div>

              {/* ─── CONTENIDO DE PESTAÑAS ─── */}
              {tabActiva === 'estadias' && (
                <div className="space-y-3">
                  {reservas.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Este pasajero aún no registra reservas o estadías en el sistema.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10.5px] uppercase tracking-wider text-slate-400 font-bold font-sora border-b border-slate-200/80 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Habitación</th>
                            <th className="px-4 py-3">Entrada / Salida</th>
                            <th className="px-4 py-3 text-center">Noches</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-center">Estado</th>
                            <th className="px-4 py-3 text-center">Ficha Oficial</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {reservas.map((res) => {
                            const enCurso = res.estado === 'checkin';
                            const completada = res.estado === 'checkout';
                            const cancelada = res.estado === 'cancelada';

                            return (
                              <tr key={res.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                                <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200">
                                  #{res.codigo}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <BedDouble className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="font-bold text-slate-800 dark:text-white font-sora">
                                      Hab. {res.habitacion?.numero || '---'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                  {formatearFecha(res.fecha_entrada)} → {formatearFecha(res.fecha_salida)}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200 font-mono">
                                  {res.num_noches} n
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatearMonto(res.total)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    {enCurso ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        En Curso
                                      </span>
                                    ) : completada ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                        Completada
                                      </span>
                                    ) : cancelada ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                        Cancelada
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                                        {res.estado}
                                      </span>
                                    )}

                                    {res.calificacion_estancia && (
                                      <span
                                        className="inline-flex items-center gap-0.5 text-[9.5px] font-black text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800"
                                        title={res.comentario_satisfaccion || `Calificación: ${res.calificacion_estancia}/5 estrellas`}
                                      >
                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                        {res.calificacion_estancia}/5
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReservaParaFicha(res.id);
                                      setModalFichaOpen(true);
                                    }}
                                    className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-[11px] font-bold flex items-center gap-1 mx-auto transition cursor-pointer"
                                    title="Imprimir Ficha Oficial MINCETUR"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>Ficha</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tabActiva === 'acompanantes' && (
                <div className="space-y-3">
                  {acompanantesFrecuentes.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No se registran acompañantes frecuentes vinculados a las estadías de este huésped.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {acompanantesFrecuentes.map((ac, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                              {ac.nombre?.charAt(0)}{ac.apellido?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white font-sora">
                                {ac.nombre} {ac.apellido}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {ac.tipo_documento}: {ac.num_documento} {ac.parentesco ? `• ${ac.parentesco}` : ''}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {ac.veces} {ac.veces === 1 ? 'viaje' : 'viajes'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tabActiva === 'notas' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-sora flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>Observaciones y Preferencias del Huésped</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {perfil.observaciones || 'No se han registrado notas internas o preferencias específicas para este huésped.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-sora flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Dirección Domiciliaria Registrada</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {perfil.direccion || 'Sin dirección domiciliaria consignada.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── FOOTER ─── */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            Control Hotelero • Registro Oficial de Huéspedes
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>

      {/* Modal Ficha MINCETUR embebido */}
      <ModalFichaMincetur
        isOpen={modalFichaOpen}
        onClose={() => {
          setModalFichaOpen(false);
          setReservaParaFicha(null);
        }}
        reservaId={reservaParaFicha}
      />
    </div>,
    document.body
  );
}

