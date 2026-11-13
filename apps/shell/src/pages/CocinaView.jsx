import React, { useState, useEffect } from 'react';
import { api } from '@heis/core';
import toast from 'react-hot-toast';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Check,
  UtensilsCrossed
} from 'lucide-react';

export default function CocinaView() {
  const [pedidos, setPedidos] = useState([
    {
      id: 101,
      mesa_numero: 'M-02',
      mozo_nombre: 'Carlos Mozo',
      tiempo: '8 min',
      estado: 'en_cocina',
      items: [
        { nombre: 'Lomo Saltado al Wok Gourmet', cantidad: 2, notas: 'Poco cocido, sin cebolla en uno' },
        { nombre: 'Ceviche Clásico de Corvina', cantidad: 1, notas: 'Picante medio' },
      ],
    },
    {
      id: 102,
      mesa_numero: 'VIP-1',
      mozo_nombre: 'Carlos Mozo',
      tiempo: '3 min',
      estado: 'en_cocina',
      items: [
        { nombre: 'Arroz con Mariscos al Pisco', cantidad: 3, notas: 'Extra limón' },
        { nombre: 'Tequeños de Lomo Saltado', cantidad: 2, notas: 'Guacamole extra' },
      ],
    },
  ]);

  const handleDespachar = (id) => {
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    toast.success('¡Comanda despachada a salón con éxito!');
  };

  return (
    <div className="space-y-6">
      {/* Header Cocina KDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black font-heading">
                Pantalla de Cocina (KDS)
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-xs text-slate-400">
              Despacho en tiempo real de comandas de salón
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="px-3 py-1.5 rounded-xl bg-white/10 font-bold">
            {pedidos.length} Comandas Pendientes
          </span>
        </div>
      </div>

      {/* Grid de Comandas KDS */}
      {pedidos.length === 0 ? (
        <div className="py-24 text-center text-sm text-slate-400">
          <ChefHat className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600 opacity-60" />
          ¡Cocina al día! No hay pedidos pendientes por despachar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#0d1527] border-2 border-amber-500/40 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      Mesa {pedido.mesa_numero}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                      #{pedido.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{pedido.tiempo}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {pedido.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {item.cantidad}x
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {item.nombre}
                        </p>
                        {item.notas && (
                          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 italic mt-0.5">
                            &bull; {item.notas}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Mozo: {pedido.mozo_nombre}</span>
                <button
                  onClick={() => handleDespachar(pedido.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Despachar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

