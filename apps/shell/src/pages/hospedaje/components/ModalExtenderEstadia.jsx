import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarPlus,
  Clock,
  Moon,
  X,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function ModalExtenderEstadia({
  isOpen,
  onClose,
  habitacion = null,
  onExtensionExitosa
}) {
  const reserva = habitacion?.reservas?.[0];
  const esPorHoras = reserva?.modalidad === 'horas';

  const [tipo, setTipo] = useState('noches');
  const [cantidad, setCantidad] = useState(1);
  const [precioCustom, setPrecioCustom] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (isOpen && reserva) {
      if (esPorHoras) {
        setTipo('horas');
        setCantidad(1);
        setPrecioCustom(String(reserva.precio_hora || 25));
      } else {
        setTipo('noches');
        setCantidad(1);
        setPrecioCustom(String(reserva.precio_noche || 80));
      }
    }
  }, [isOpen, reserva, esPorHoras]);

  if (!isOpen || !habitacion || !reserva) return null;

  const precioUnitario = parseFloat(precioCustom) || (esPorHoras ? parseFloat(reserva.precio_hora || 25) : parseFloat(reserva.precio_noche || 80));
  const costoTotalAdicional = +(cantidad * precioUnitario).toFixed(2);

  // Cálculo de nueva salida
  const calcularNuevaSalida = () => {
    if (tipo === 'horas') {
      const base = reserva.fecha_hora_salida ? new Date(reserva.fecha_hora_salida) : new Date();
      const nueva = new Date(base.getTime() + cantidad * 3600 * 1000);
      return nueva.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' de Hoy';
    } else {
      const [y, m, d] = (reserva.fecha_salida || new Date().toISOString().split('T')[0]).split('-').map(Number);
      const salidaDate = new Date(y, m - 1, d);
      salidaDate.setDate(salidaDate.getDate() + cantidad);
      return salidaDate.toISOString().split('T')[0];
    }
  };

  const handleConfirmarExtension = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const res = await api.post(`/reservas/${reserva.id}/extender`, {
        tipo,
        cantidad: parseInt(cantidad) || 1,
        precio_adicional: precioUnitario
      });

      toast.success(res.data?.message || '¡Estadía extendida exitosamente!');
      window.dispatchEvent(new CustomEvent('hotel-stats-changed'));
      if (onExtensionExitosa) {
        onExtensionExitosa(res.data?.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al extender la estadía.');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-150 overflow-y-auto"
      style={{
        WebkitBackdropFilter: 'blur(3px)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
      >
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-sora">
                Extender Estadía — Hab. {habitacion.numero}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Huésped: {reserva.huesped?.nombre} {reserva.huesped?.apellido}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmarExtension} className="p-5 sm:p-6 space-y-4">
          
          {/* Selector de modo si no es fijamente por horas */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setTipo('noches');
                setCantidad(1);
                setPrecioCustom(String(reserva.precio_noche || 80));
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold font-sora flex items-center justify-center gap-1.5 transition cursor-pointer ${
                tipo === 'noches'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Por Noches</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTipo('horas');
                setCantidad(1);
                setPrecioCustom(String(reserva.precio_hora || 25));
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold font-sora flex items-center justify-center gap-1.5 transition cursor-pointer ${
                tipo === 'horas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Por Horas (Day-Use)</span>
            </button>
          </div>

          {/* Opciones rápidas de incremento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-sora">
              Cantidad a Añadir
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {(tipo === 'horas' ? [1, 2, 3, 6] : [1, 2, 3, 5]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCantidad(val)}
                  className={`py-2 rounded-xl text-xs font-black font-sora border transition cursor-pointer ${
                    cantidad === val
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  +{val} {tipo === 'horas' ? 'Hora(s)' : 'Noche(s)'}
                </button>
              ))}
            </div>
          </div>

          {/* Tarifa adicional unitaria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Tarifa x {tipo === 'horas' ? 'Hora' : 'Noche'} (S/)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={precioCustom}
                onChange={(e) => setPrecioCustom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-extrabold font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Monto a Sumar a Cuenta
              </label>
              <div className="px-3 py-2 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-blue-700 dark:text-blue-300 text-xs font-black font-mono flex items-center justify-between">
                <span>Total:</span>
                <span>S/ {costoTotalAdicional.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Comparativa de salida */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span>Salida Actual:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {tipo === 'horas'
                  ? (reserva.fecha_hora_salida ? new Date(reserva.fecha_hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora')
                  : reserva.fecha_salida}
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-extrabold border-t border-slate-200 dark:border-slate-700 pt-1.5">
              <span className="flex items-center gap-1">
                <span>Nueva Salida:</span>
                <ArrowRight className="w-3 h-3" />
              </span>
              <span className="font-mono text-sm">{calcularNuevaSalida()}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="glow-btn-hotel px-5 py-2.5 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{guardando ? 'Guardando...' : 'Confirmar Extensión'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}
