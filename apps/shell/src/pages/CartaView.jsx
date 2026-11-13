import React, { useState, useEffect } from 'react';
import { api } from '@heis/core';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Plus,
  Search,
  DollarSign,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';

export default function CartaView() {
  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const cargarPlatos = async () => {
    try {
      setCargando(true);
      const res = await api.get('/restaurante/platos');
      if (res.data?.data) {
        setPlatos(res.data.data);
      }
    } catch (error) {
      toast.error('Error al cargar la carta');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPlatos();
  }, []);

  const platosFiltrados = platos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
            Módulo Restaurante
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
            Carta & Menú Digital
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gestión de platos, categorías, precios y disponibilidad en salón
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar plato o trago..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-white/10 text-xs focus:outline-none"
          />
        </div>
      </div>

      {cargando ? (
        <div className="py-20 text-center text-sm text-slate-400">
          Cargando carta gourmet...
        </div>
      ) : platosFiltrados.length === 0 ? (
        <div className="py-20 text-center text-sm text-slate-400">
          No hay platos que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {platosFiltrados.map((plato) => (
            <div
              key={plato.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                    {plato.categoria}
                  </span>
                  <span className="text-xs font-black text-emerald-500 font-mono">
                    S/ {Number(plato.precio).toFixed(2)}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">
                  {plato.nombre}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {plato.descripcion || 'Sin descripción adicional'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Disponibilidad:</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  En Carta
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

