import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRightLeft,
  X,
  Check,
  AlertCircle,
  BedDouble,
  User,
  RefreshCw
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function ModalRoomTransfer({
  isOpen,
  onClose,
  habitacionOrigen = null,
  onTransferenciaExitosa
}) {
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);
  const [habitacionDestinoId, setHabitacionDestinoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [ajustarPrecio, setAjustarPrecio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [filtroPiso, setFiltroPiso] = useState('todos');

  const reservaActiva = habitacionOrigen?.reservas?.[0];

  useEffect(() => {
    if (isOpen) {
      cargarHabitacionesDisponibles();
      setHabitacionDestinoId('');
      setMotivo('');
      setAjustarPrecio(false);
      setFiltroPiso('todos');
    }
  }, [isOpen]);

  const cargarHabitacionesDisponibles = async () => {
    try {
      setCargandoHabitaciones(true);
      const res = await api.get('/habitaciones?estado=disponible');
      const habs = (res.data?.data || res.data || []).filter(
        (h) => String(h.id) !== String(habitacionOrigen?.id)
      );
      setHabitacionesDisponibles(habs);
    } catch (e) {
      toast.error('Error al cargar habitaciones disponibles.');
    } finally {
      setCargandoHabitaciones(false);
    }
  };

  if (!isOpen || !habitacionOrigen || !reservaActiva) return null;

  const habitacionDestinoSeleccionada = habitacionesDisponibles.find(
    (h) => String(h.id) === String(habitacionDestinoId)
  );

  const precioActualNoche = parseFloat(reservaActiva.precio_noche || 0);
  const precioDestinoNoche = habitacionDestinoSeleccionada?.tipo?.precio_base
    ? parseFloat(habitacionDestinoSeleccionada.tipo.precio_base)
    : precioActualNoche;

  const diferenciaPorNoche = +(precioDestinoNoche - precioActualNoche).toFixed(2);

  const pisosDisponibles = [
    ...new Set(habitacionesDisponibles.map((h) => String(h.piso)))
  ].sort((a, b) => Number(a) - Number(b));

  const habitacionesFiltradas = habitacionesDisponibles.filter((h) => {
    if (filtroPiso === 'todos') return true;
    return String(h.piso) === String(filtroPiso);
  });

  const handleConfirmarTransferencia = async () => {
    if (!habitacionDestinoId) {
      toast.error('Seleccione la habitación de destino para el traslado.');
      return;
    }

    try {
      setGuardando(true);
      const res = await api.post(`/reservas/${reservaActiva.id}/transferir`, {
        nueva_habitacion_id: habitacionDestinoId,
        motivo: motivo.trim() || 'Solicitud de traslado en recepción',
        ajustar_precio: ajustarPrecio
      });

      toast.success(res.data?.message || '¡Habitación cambiada exitosamente!');
      window.dispatchEvent(new CustomEvent('hotel-stats-changed'));
      if (onTransferenciaExitosa) {
        onTransferenciaExitosa(res.data?.data);
      }
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Error al realizar el cambio de habitación.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-200 overflow-y-auto"
      style={{
        WebkitBackdropFilter: 'blur(3px)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 my-auto"
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 flex items-center justify-center shrink-0 shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                Cambio de Habitación (Room Transfer)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Traslada al huésped y su cuenta acumulada a otra habitación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4.5 scrollbar-thin">
          {/* Tarjeta de Comparación / Resumen de Traslado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Habitación Origen */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sora">
                Habitación Origen (Actual)
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-slate-800 dark:text-white font-mono">
                    #{habitacionOrigen.numero}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                    Piso {habitacionOrigen.piso} • {habitacionOrigen.tipo?.nombre}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono block">
                    S/ {precioActualNoche.toFixed(2)}/noche
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    Pasa a Sucia
                  </span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-bold truncate font-sora">
                  {reservaActiva.huesped?.nombre} {reservaActiva.huesped?.apellido}
                </span>
              </div>
            </div>

            {/* Habitación Destino */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                habitacionDestinoSeleccionada
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                  : 'bg-slate-50/50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700'
              }`}
            >
              <span className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1 font-sora">
                Habitación Destino (Nueva)
              </span>
              {habitacionDestinoSeleccionada ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono">
                        #{habitacionDestinoSeleccionada.numero}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                        Piso {habitacionDestinoSeleccionada.piso} •{' '}
                        {habitacionDestinoSeleccionada.tipo?.nombre}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono block">
                        S/ {precioDestinoNoche.toFixed(2)}/noche
                      </span>
                      {diferenciaPorNoche !== 0 && (
                        <span
                          className={`text-[10px] font-bold ${
                            diferenciaPorNoche > 0 ? 'text-amber-600' : 'text-blue-600'
                          }`}
                        >
                          {diferenciaPorNoche > 0 ? `+S/ ${diferenciaPorNoche.toFixed(2)}` : `-S/ ${Math.abs(diferenciaPorNoche).toFixed(2)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center gap-1.5 text-xs text-blue-800 dark:text-blue-300 font-semibold font-sora">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Disponible para ocupación inmediata</span>
                  </div>
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center text-xs text-slate-400 text-center font-medium">
                  Seleccione una habitación disponible abajo
                </div>
              )}
            </div>
          </div>

          {/* Selector de Habitación Destino */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-blue-600" />
                <span>Habitaciones Disponibles ({habitacionesFiltradas.length})</span>
              </label>

              {/* Filtro por Piso en Cápsula */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px] font-bold font-sora">Piso:</span>
                <select
                  value={filtroPiso}
                  onChange={(e) => setFiltroPiso(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 rounded-full text-xs font-extrabold text-slate-800 dark:text-slate-100 font-sora shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los pisos</option>
                  {pisosDisponibles.map((p) => (
                    <option key={p} value={p}>
                      Piso {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {cargandoHabitaciones ? (
              <div className="p-8 text-center text-xs text-slate-400 font-sora">
                Cargando habitaciones disponibles...
              </div>
            ) : habitacionesFiltradas.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 font-medium font-sora">
                No hay otras habitaciones disponibles en este piso o sector actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {habitacionesFiltradas.map((hab) => {
                  const esSeleccionada = String(hab.id) === String(habitacionDestinoId);
                  const precio = parseFloat(hab.tipo?.precio_base || 0);
                  return (
                    <button
                      key={hab.id}
                      type="button"
                      onClick={() => setHabitacionDestinoId(String(hab.id))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        esSeleccionada
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-500/40 scale-101'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm">#{hab.numero}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                            esSeleccionada
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Piso {hab.piso}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] block truncate font-medium mt-0.5 ${
                          esSeleccionada ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {hab.tipo?.nombre || 'Habitación'}
                      </span>
                      <span
                        className={`text-[10.5px] font-mono font-bold block mt-1 ${
                          esSeleccionada ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        S/ {precio.toFixed(2)}/noche
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ajuste de Precio / Tarifa */}
          {habitacionDestinoSeleccionada && diferenciaPorNoche !== 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    Diferencia de tarifa: {diferenciaPorNoche > 0 ? `+S/ ${diferenciaPorNoche.toFixed(2)}` : `-S/ ${Math.abs(diferenciaPorNoche).toFixed(2)}`} por noche
                  </span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    ¿Desea actualizar la tarifa de la reserva a la de la nueva habitación o conservar el precio acordado?
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 shrink-0 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ajustarPrecio}
                  onChange={(e) => setAjustarPrecio(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px]">Aplicar nueva tarifa</span>
              </label>
            </div>
          )}

          {/* Motivo del Traslado */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora block">
              Motivo del Traslado (Opcional):
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Falla de aire acondicionado, solicitud de piso alto, upgrade de categoría..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-sora"
            />
          </div>
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer font-sora"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmarTransferencia}
            disabled={guardando || !habitacionDestinoId}
            className={`glow-btn-hotel px-5 py-2.5 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/25 active:scale-98 font-sora ${
              !habitacionDestinoId || guardando ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {guardando ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4" />
            )}
            <span>Confirmar Traslado de Habitación</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
