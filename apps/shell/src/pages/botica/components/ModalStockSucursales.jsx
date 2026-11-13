import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  Boxes,
  MapPin,
  Phone,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function ModalStockSucursales({ medicamentoId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!isOpen || !medicamentoId) return;

    let isMounted = true;
    setCargando(true);

    api.get(`/medicamentos/${medicamentoId}/stock-sucursales`)
      .then((res) => {
        if (isMounted) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          toast.error('No se pudo consultar el stock en otras sedes.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setCargando(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, medicamentoId]);

  if (!isOpen) return null;

  const med = data?.medicamento;
  const sucursales = data?.sucursales || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 dark:border-slate-800 my-auto flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                Disponibilidad en Sedes
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[280px] sm:max-w-md">
                {med?.nombre_comercial || 'Consultando medicamento...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {cargando ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-400">
                Consultando inventario en red de boticas...
              </span>
            </div>
          ) : sucursales.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No hay otras sedes registradas en el sistema.
            </div>
          ) : (
            <div className="space-y-3">
              {sucursales.map((suc) => {
                const tieneStock = suc.total_cajas > 0 || suc.total_fracciones > 0;

                return (
                  <div
                    key={suc.id_sucursal}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      tieneStock
                        ? 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/90 shadow-2xs hover:border-teal-300 dark:hover:border-teal-700'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {suc.nombre}
                          </span>
                          {suc.es_principal && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              Matriz
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[240px]">
                            {suc.direccion || 'Sin dirección'}
                          </span>
                        </div>
                        {suc.telefono && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{suc.telefono}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {tieneStock ? (
                          <>
                            <div className="text-base font-black text-emerald-700 dark:text-emerald-400 leading-tight">
                              {suc.total_cajas} <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">cajas</span>
                            </div>
                            {suc.total_fracciones > 0 && (
                              <div className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400">
                                + {suc.total_fracciones} fracc.
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/50">
                            Sin Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desglose de Lotes en esta sucursal si hay stock */}
                    {tieneStock && suc.lotes?.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-dotted border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-[10px] font-mono">
                        {suc.lotes.map((l, lIdx) => (
                          <span
                            key={lIdx}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold"
                          >
                            Lt: {l.numero_lote} ({l.stock_cajas} cjs{l.stock_fraccion > 0 ? ` +${l.stock_fraccion} fr` : ''})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Red de Farmacias Heis
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
