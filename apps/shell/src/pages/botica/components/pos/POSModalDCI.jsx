/**
 * POSModalDCI.jsx — Modal de Bioequivalentes y Genéricos DCI (Art. 32 Ley 29459)
 * Extraído de POS.jsx (P14) — Componente independiente, ~180 líneas
 */
import React from 'react';
import { X, Sparkles, Layers, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function POSModalDCI({
  visible,
  onClose,
  medicamentoDciSeleccionado,
  genericosEquivalentes,
  addItem
}) {
  if (!visible || !medicamentoDciSeleccionado) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Bioequivalentes y Genéricos DCI
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full font-black border border-teal-200 dark:border-teal-700">
                  Art. 32 Ley 29459
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Alternativas terapéuticas con el mismo principio activo y concentración
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Medicamento de Referencia */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
              Medicamento de Referencia Solicitado:
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{medicamentoDciSeleccionado.nombre_comercial}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  DCI: <strong className="text-teal-700 dark:text-teal-400 font-bold">{medicamentoDciSeleccionado.nombre_generico}</strong>{' '}
                  • {medicamentoDciSeleccionado.concentracion} • {medicamentoDciSeleccionado.presentacion}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">Precio Referencial</span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                  S/ {parseFloat(medicamentoDciSeleccionado.precio_venta).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de Alternativas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Alternativas Genéricas Disponibles ({genericosEquivalentes.length})</span>
              </h5>
              <span className="text-[10px] text-slate-400 font-medium">Misma DCI y dosis terapéutica</span>
            </div>

            {genericosEquivalentes.length === 0 ? (
              <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  No se encontraron otras presentaciones con el DCI "{medicamentoDciSeleccionado.nombre_generico}" en stock activo.
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Consulte al Químico Farmacéutico regente para verificar reposiciones en droguería o registrar un nuevo lote.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {genericosEquivalentes.map((alt) => {
                  const loteAlt = alt.lotes?.[0];
                  const ahorroMonto = parseFloat(medicamentoDciSeleccionado.precio_venta) - parseFloat(alt.precio_venta);
                  const pctAhorro = parseFloat(medicamentoDciSeleccionado.precio_venta) > 0
                    ? ((ahorroMonto / parseFloat(medicamentoDciSeleccionado.precio_venta)) * 100).toFixed(0)
                    : 0;

                  return (
                    <div key={alt.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/70">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{alt.nombre_comercial}</span>
                          {ahorroMonto > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                              {pctAhorro}% MÁS ECONÓMICO
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {alt.nombre_generico} {alt.concentracion} • {alt.presentacion}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                          <span>Stock Cajas: <strong className="text-slate-700 dark:text-slate-200">{alt.stock_cajas}</strong></span>
                          {alt.fraccionable && <span>Stock Fracción: <strong className="text-slate-700 dark:text-slate-200">{alt.stock_fraccion || 0}</strong></span>}
                          {loteAlt && <span>Vence: <strong className="text-slate-600 dark:text-slate-300">{loteAlt.fecha_vencimiento}</strong></span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Precio Caja</span>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                            S/ {parseFloat(alt.precio_venta).toFixed(2)}
                          </span>
                          {alt.fraccionable && parseFloat(alt.precio_fraccion) > 0 && (
                            <span className="text-[9px] text-cyan-700 dark:text-cyan-400 font-bold block font-mono">
                              Fracc: S/ {parseFloat(alt.precio_fraccion).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            addItem(alt, 'Caja', 1, loteAlt);
                            toast.success(`Alternativa genérica agregada: ${alt.nombre_comercial}`);
                            onClose();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Dispensar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">
            Regulado por Dirección General de Medicamentos, Insumos y Drogas (DIGEMID)
          </span>
          <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
