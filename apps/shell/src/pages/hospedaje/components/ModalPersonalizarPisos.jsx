import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Trash2,
  Check,
  X,
  ArrowRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function ModalPersonalizarPisos({
  isOpen,
  onClose,
  pisosActuales = [],
  habitaciones = [],
  onPisosActualizados
}) {
  const [pisos, setPisos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [pisoParaReasignar, setPisoParaReasignar] = useState(null);
  const [pisoDestinoReasignar, setPisoDestinoReasignar] = useState('');
  const [reasignando, setReasignando] = useState(false);

  // Inicializar lista de pisos al abrir
  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(pisosActuales) && pisosActuales.length > 0) {
        setPisos(
          pisosActuales.map((p, idx) => ({
            id: String(p.piso || p.id || idx + 1),
            nombre: p.nombre || `Piso ${p.piso || p.id || idx + 1}`
          }))
        );
      } else {
        // Por defecto sugerir 3 pisos estándar
        setPisos([
          { id: '1', nombre: 'Piso 1' },
          { id: '2', nombre: 'Piso 2' },
          { id: '3', nombre: 'Piso 3' }
        ]);
      }
      setPisoParaReasignar(null);
    }
  }, [isOpen, pisosActuales]);

  if (!isOpen) return null;

  // Conteo de habitaciones actuales por piso
  const getConteoHabitaciones = (pisoId) => {
    return habitaciones.filter((h) => String(h.piso) === String(pisoId)).length;
  };

  // Selector rápido de cantidad de pisos
  const handleSetCantidadRapida = (cantidad) => {
    const nuevosPisos = [];
    for (let i = 1; i <= cantidad; i++) {
      const id = String(i);
      const existente = pisos.find((p) => String(p.id) === id);
      nuevosPisos.push({
        id,
        nombre: existente ? existente.nombre : `Piso ${i}`
      });
    }
    setPisos(nuevosPisos);
  };

  // Actualizar nombre de un piso
  const handleCambiarNombre = (index, nuevoNombre) => {
    const actualizados = [...pisos];
    actualizados[index].nombre = nuevoNombre;
    setPisos(actualizados);
  };

  // Agregar piso adicional
  const handleAgregarPiso = () => {
    const siguienteNumero = pisos.length + 1;
    let nuevoId = String(siguienteNumero);
    // Asegurar que no colisione con un id existente
    while (pisos.some((p) => String(p.id) === nuevoId)) {
      nuevoId = String(parseInt(nuevoId, 10) + 1);
    }

    setPisos([
      ...pisos,
      {
        id: nuevoId,
        nombre: `Piso ${siguienteNumero}`
      }
    ]);
  };

  // Intentar eliminar un piso
  const handleEliminarPiso = (index) => {
    const piso = pisos[index];
    const conteo = getConteoHabitaciones(piso.id);

    if (conteo > 0) {
      // Si tiene habitaciones, solicitar reasignación
      setPisoParaReasignar(piso);
      const otrosPisos = pisos.filter((p) => String(p.id) !== String(piso.id));
      if (otrosPisos.length > 0) {
        setPisoDestinoReasignar(otrosPisos[0].id);
      }
      return;
    }

    if (pisos.length <= 1) {
      toast.error('El hotel debe contar con al menos 1 piso o sector.');
      return;
    }

    setPisos(pisos.filter((_, i) => i !== index));
  };

  // Reasignar habitaciones y luego eliminar el piso
  const handleConfirmarReasignacion = async () => {
    if (!pisoParaReasignar || !pisoDestinoReasignar) return;
    try {
      setReasignando(true);
      await api.post('/habitaciones/pisos/reasignar', {
        pisoOrigen: pisoParaReasignar.id,
        pisoDestino: pisoDestinoReasignar
      });

      toast.success(
        `Habitaciones de ${pisoParaReasignar.nombre} reasignadas al piso destino.`
      );

      // Eliminar el piso una vez vaciado
      setPisos(pisos.filter((p) => String(p.id) !== String(pisoParaReasignar.id)));
      setPisoParaReasignar(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reasignar habitaciones.');
    } finally {
      setReasignando(false);
    }
  };

  // Guardar estructura de pisos
  const handleGuardar = async () => {
    if (pisos.length === 0) {
      toast.error('Debe configurar al menos un piso.');
      return;
    }

    // Validar nombres no vacíos
    const sinNombre = pisos.some((p) => !p.nombre.trim());
    if (sinNombre) {
      toast.error('Todos los pisos deben tener un nombre asignado.');
      return;
    }

    try {
      setGuardando(true);
      await api.post('/habitaciones/pisos', { pisos });
      toast.success('¡Estructura de pisos del hotel guardada con éxito!');
      if (onPisosActualizados) {
        onPisosActualizados(pisos);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar los pisos.');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

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
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 my-auto"
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                Personalizar Pisos del Hotel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajuste la cantidad y nombres de pisos según su hospedaje
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

        {/* Contenido desplazable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {/* Selector Rápido de Cantidad de Pisos */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 font-sora">
              Cantidad de Pisos del Hotel (Selección Rápida):
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => {
                const esActual = pisos.length === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSetCantidadRapida(num)}
                    className={`py-2 px-1 rounded-xl text-xs font-black font-sora transition-all cursor-pointer text-center ${
                      esActual
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-500/40 scale-102'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600'
                    }`}
                  >
                    {num} {num === 1 ? 'Piso' : 'Pisos'}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Haga clic para fijar la cantidad total de pisos o personalice los nombres individualmente abajo.
            </p>
          </div>

          {/* Lista de Pisos con Nombres Editables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora">
                Lista de Pisos ({pisos.length} {pisos.length === 1 ? 'nivel' : 'niveles'}):
              </span>
              <button
                type="button"
                onClick={handleAgregarPiso}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-sora"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Piso</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {pisos.map((p, idx) => {
                const conteo = getConteoHabitaciones(p.id);
                return (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 flex items-center gap-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Badge Identificador */}
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-black text-xs text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
                      #{idx + 1}
                    </div>

                    {/* Input de Nombre Visible */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={p.nombre}
                        onChange={(e) => handleCambiarNombre(idx, e.target.value)}
                        placeholder={`Nombre visible (Ej: Piso ${idx + 1}, Planta Baja)`}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-sora"
                      />
                    </div>

                    {/* Badge de Habitaciones en este piso */}
                    <span
                      className={`text-[10.5px] font-mono px-2 py-1 rounded-lg font-bold shrink-0 ${
                        conteo > 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                      title={`${conteo} habitaciones registradas en este piso`}
                    >
                      {conteo} habs
                    </span>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => handleEliminarPiso(idx)}
                      disabled={pisos.length <= 1}
                      className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                        pisos.length <= 1
                          ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                      }`}
                      title="Eliminar este piso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-panel de Reasignación si un piso a borrar tiene habitaciones */}
          {pisoParaReasignar && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold">
                    El piso "{pisoParaReasignar.nombre}" tiene{' '}
                    {getConteoHabitaciones(pisoParaReasignar.id)} habitaciones asignadas.
                  </span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    Para eliminarlo sin perder datos, seleccione a qué piso desea mover sus habitaciones:
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <select
                  value={pisoDestinoReasignar}
                  onChange={(e) => setPisoDestinoReasignar(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 font-sora focus:outline-none shadow-2xs cursor-pointer"
                >
                  {pisos
                    .filter((p) => String(p.id) !== String(pisoParaReasignar.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        Mover al {p.nombre}
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={handleConfirmarReasignacion}
                  disabled={reasignando}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {reasignando ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>Reasignar & Borrar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPisoParaReasignar(null)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between gap-2.5">
          <Link
            to="/administracion?tab=pisos"
            onClick={onClose}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            title="Ir al módulo completo de arquitectura en Administración"
          >
            <span>Gestión completa en Administración</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="glow-btn-hotel px-5 py-2.5 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/25 active:scale-98"
            >
              {guardando ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Guardar Pisos del Hotel</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
