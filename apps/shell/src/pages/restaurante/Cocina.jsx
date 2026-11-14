import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  useRealtime,
  playKdsNewOrderSound,
  playKdsDishReadySound,
} from '@heis/core';
import toast from 'react-hot-toast';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Wine,
  RefreshCw,
  Flame,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

export default function Cocina() {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDestino, setFiltroDestino] = useState('todos'); // 'todos', 'kitchen', 'bar'
  const [sonidoActivo, setSonidoActivo] = useState(
    () => localStorage.getItem('heis_sound_muted') !== 'true'
  );

  const toggleSonido = () => {
    const nuevo = !sonidoActivo;
    setSonidoActivo(nuevo);
    localStorage.setItem('heis_sound_muted', String(!nuevo));
    if (nuevo) {
      playKdsDishReadySound();
      toast.success('Alertas sonoras de Cocina KDS activadas');
    } else {
      toast('Alertas sonoras silenciadas');
    }
  };

  const cargarComandas = useCallback(async () => {
    try {
      const res = await api.get('/cocina/comandas');
      if (res.success) {
        setComandas(res.comandas || []);
      }
    } catch (err) {
      console.error('Error al cargar comandas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarComandas();
    const interval = setInterval(cargarComandas, 15000);
    return () => clearInterval(interval);
  }, [cargarComandas]);

  // Suscripción en tiempo real a eventos KDS del tenant
  const { connected: rtConnected } = useRealtime((eventName, payload) => {
    if (eventName === 'kds:new_order') {
      playKdsNewOrderSound();
      toast.success(
        `🔔 Nueva comanda en cocina${payload?.mesa ? ` (${payload.mesa})` : ''}`
      );
      cargarComandas();
    } else if (eventName === 'kds:updated') {
      if (payload?.status === 'ready') {
        playKdsDishReadySound();
      }
      cargarComandas();
    }
  });

  const cambiarEstadoItem = async (itemId, nuevoEstado) => {
    try {
      const res = await api.patch(`/cocina/item/${itemId}/estado`, { status: nuevoEstado });
      if (res.success) {
        if (nuevoEstado === 'ready') {
          playKdsDishReadySound();
        }
        cargarComandas();
      }
    } catch (err) {
      toast.error('Error al actualizar el estado del plato');
    }
  };

  const calcularMinutos = (fechaStr) => {
    const ordenTime = new Date(fechaStr || Date.now());
    const ahora = new Date();
    const diff = Math.floor((ahora - ordenTime) / (1000 * 60));
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-orange-500/20 text-orange-500 dark:text-orange-400">
                <ChefHat className="w-6 h-6" />
              </span>
              KDS • Pantalla de Cocina y Bar en Vivo
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                rtConnected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
              }`}
            >
              <Radio className={`w-3 h-3 ${rtConnected ? 'animate-pulse' : ''}`} />
              {rtConnected ? 'En Vivo' : 'Reconectando'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recepción instantánea con alerta sonora de pedidos de salón, notas y tiempos de preparación.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botón activar/silenciar timbre KDS */}
          <button
            type="button"
            onClick={toggleSonido}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              sonidoActivo
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={sonidoActivo ? 'Timbre sonoro activado' : 'Timbre silenciado'}
          >
            {sonidoActivo ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{sonidoActivo ? 'Sonido ON' : 'Mudo'}</span>
          </button>

          {/* Filter by destination */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFiltroDestino('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filtroDestino === 'todos' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroDestino('kitchen')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filtroDestino === 'kitchen' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Cocina
            </button>
            <button
              onClick={() => setFiltroDestino('bar')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filtroDestino === 'bar' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wine className="w-3.5 h-3.5" /> Bar
            </button>
          </div>

          <button
            onClick={cargarComandas}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Actualizar comandas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid de Tickets KDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-500">
            Cargando comandas en cocina...
          </div>
        ) : comandas.length === 0 ? (
          <div className="col-span-full py-24 text-center">
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <p className="font-bold text-base text-slate-700 dark:text-slate-300">¡Cocina y Bar al Día!</p>
              <p className="text-xs">No hay comandas pendientes de preparación en este momento.</p>
            </div>
          </div>
        ) : (
          comandas.map((orden) => {
            const minutos = calcularMinutos(orden.createdAt || orden.created_at);
            const esRetrasada = minutos >= 20;
            const esAdvertencia = minutos >= 10 && minutos < 20;

            const itemsMostrados = (orden.detalles || []).filter((d) => {
              if (filtroDestino === 'todos') return true;
              const area = d.producto?.preparation_area || d.producto?.destination || 'kitchen';
              return area === filtroDestino;
            });

            if (itemsMostrados.length === 0) return null;

            return (
              <div
                key={orden.id}
                className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                  esRetrasada
                    ? 'bg-rose-950/30 border-rose-500/50'
                    : esAdvertencia
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Header Ticket */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    esRetrasada
                      ? 'bg-rose-950/60 border-rose-500/30'
                      : esAdvertencia
                      ? 'bg-amber-950/40 border-amber-500/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      {orden.mesa?.name || `Orden #${orden.id}`}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Mozo: {orden.mozo?.nombre || orden.mozo?.name || 'Sala'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                        esRetrasada
                          ? 'bg-rose-500 text-white animate-pulse'
                          : esAdvertencia
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {minutos} min
                    </span>
                  </div>
                </div>

                {/* Body Dishes List */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[350px]">
                  {itemsMostrados.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="font-bold text-xs text-slate-200">
                              {item.producto?.name}
                            </p>
                            {item.note && (
                              <p className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mt-1 border border-amber-500/20">
                                ⚠️ Nota: {item.note}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            item.status === 'ready'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'cooking'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.status === 'ready' ? 'Listo' : item.status === 'cooking' ? 'Cocinando' : 'Pendiente'}
                        </span>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex gap-2 pt-1 border-t border-slate-900">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => cambiarEstadoItem(item.id, 'cooking')}
                            className="flex-1 py-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600 text-orange-200 hover:text-white text-[11px] font-bold transition-all border border-orange-500/40 cursor-pointer"
                          >
                            Empezar a Cocinar
                          </button>
                        )}
                        {item.status === 'cooking' && (
                          <button
                            onClick={() => cambiarEstadoItem(item.id, 'ready')}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Marcar Listo
                          </button>
                        )}
                        {item.status === 'ready' && (
                          <button
                            onClick={() => cambiarEstadoItem(item.id, 'served')}
                            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Servido a Mesa
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer notes */}
                {orden.notes && (
                  <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-slate-300">Comentario General:</strong> {orden.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
