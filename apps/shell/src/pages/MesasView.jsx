import React, { useState, useEffect } from 'react';
import { api } from '@heis/core';
import toast from 'react-hot-toast';
import {
  UtensilsCrossed,
  Plus,
  Users,
  Clock,
  DollarSign,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function MesasView() {
  const [mesas, setMesas] = useState([]);
  const [salones, setSalones] = useState(['Todos', 'Salón Principal', 'Terraza Vista al Parque', 'Zona VIP Acústica']);
  const [salonSeleccionado, setSalonSeleccionado] = useState('Todos');
  const [cargando, setCargando] = useState(true);

  // Modal comanda / cobro
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const cargarMesas = async () => {
    try {
      setCargando(true);
      const res = await api.get('/restaurante/mesas');
      if (res.data?.data) {
        setMesas(res.data.data);
      }
    } catch (error) {
      toast.error('Error al cargar mesas del salón');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMesas();
  }, []);

  const mesasFiltradas = mesas.filter((m) => {
    if (salonSeleccionado === 'Todos') return true;
    return m.salon === salonSeleccionado;
  });

  const handleMesaClick = (mesa) => {
    setMesaSeleccionada(mesa);
  };

  const handleOcuparMesa = async (mesa) => {
    try {
      const nuevoEstado = mesa.estado === 'ocupada' ? 'disponible' : 'ocupada';
      const res = await api.put(`/restaurante/mesas/${mesa.id}`, {
        estado: nuevoEstado,
        mozo_nombre: nuevoEstado === 'ocupada' ? 'Mozo Turno' : null,
        total_acumulado: nuevoEstado === 'ocupada' ? 45.00 : 0.00,
      });

      if (res.data?.success) {
        toast.success(
          nuevoEstado === 'ocupada'
            ? `Mesa ${mesa.numero} ocupada (comanda iniciada)`
            : `Mesa ${mesa.numero} liberada con éxito`
        );
        setMesaSeleccionada(null);
        cargarMesas();
      }
    } catch (error) {
      toast.error('Error al actualizar estado de la mesa');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Salón */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Módulo Restaurante
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black">
              F1 POS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
            Salones & Mesas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control visual en tiempo real de comensales, comandas y tiempos de ocupación
          </p>
        </div>

        {/* Selector de Salón */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-x-auto">
          {salones.map((s) => (
            <button
              key={s}
              onClick={() => setSalonSeleccionado(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                salonSeleccionado === s
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Mesas */}
      {cargando ? (
        <div className="py-20 text-center text-sm text-slate-400">
          Cargando plano de salón...
        </div>
      ) : mesasFiltradas.length === 0 ? (
        <div className="py-20 text-center text-sm text-slate-400">
          No hay mesas registradas en este salón.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mesasFiltradas.map((mesa) => {
            const isOcupada = mesa.estado === 'ocupada';

            return (
              <div
                key={mesa.id}
                onClick={() => handleMesaClick(mesa)}
                className={`group relative p-4 rounded-3xl border transition-all duration-200 cursor-pointer select-none text-center flex flex-col justify-between min-h-[160px] active:scale-95 ${
                  isOcupada
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/5'
                    : 'bg-white dark:bg-[#0d1527] border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                {/* Header Mesa */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[10px] text-slate-400 uppercase">
                    {mesa.salon}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOcupada ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Número de Mesa */}
                <div className="my-2">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {mesa.numero}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider inline-block px-2 py-0.5 rounded-full mt-1 ${
                      isOcupada
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isOcupada ? 'Ocupada' : 'Disponible'}
                  </span>
                </div>

                {/* Footer Mesa */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {mesa.capacidad}p
                  </span>
                  {isOcupada ? (
                    <span className="font-bold text-amber-500 font-mono">
                      S/ {Number(mesa.total_acumulado || 0).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-500 font-bold">Libre</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Acción Rápida de Mesa */}
      {mesaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMesaSeleccionada(null)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading">
              Mesa {mesaSeleccionada.numero}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {mesaSeleccionada.salon} &bull; Capacidad {mesaSeleccionada.capacidad} personas
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleOcuparMesa(mesaSeleccionada)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                  mesaSeleccionada.estado === 'ocupada'
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                }`}
              >
                {mesaSeleccionada.estado === 'ocupada'
                  ? 'Liberar y Cobrar Mesa'
                  : 'Abrir Comanda en Mesa'}
              </button>

              <button
                onClick={() => setMesaSeleccionada(null)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

