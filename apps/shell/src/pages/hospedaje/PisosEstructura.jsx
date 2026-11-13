import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  ExternalLink,
  BedDouble,
  Info,
  Sparkles
} from 'lucide-react';
import api from './api';
import toast from 'react-hot-toast';

export default function PisosEstructura() {
  const navigate = useNavigate();
  const [pisosConfig, setPisosConfig] = useState([]);
  const [habitacionesList, setHabitacionesList] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resPisos, resHabs] = await Promise.all([
        api.get('/habitaciones/pisos'),
        api.get('/habitaciones')
      ]);

      const dataPisos = resPisos.data?.pisos || resPisos.data;
      if (Array.isArray(dataPisos) && dataPisos.length > 0) {
        setPisosConfig(dataPisos.map((p, idx) => ({
          id: String(p.piso || p.id || idx + 1),
          nombre: p.nombre || `Piso ${p.piso || p.id || idx + 1}`
        })));
      } else {
        // Valores estándar por defecto si la base de datos está vacía
        setPisosConfig([
          { id: '1', nombre: 'Piso 1' },
          { id: '2', nombre: 'Piso 2' },
          { id: '3', nombre: 'Piso 3' }
        ]);
      }

      const dataHabs = resHabs.data?.data || resHabs.data;
      if (Array.isArray(dataHabs)) {
        setHabitacionesList(dataHabs);
      }
    } catch (e) {
      console.warn('Error al cargar datos de pisos:', e);
      toast.error('No se pudo cargar la estructura de pisos');
    } finally {
      setCargando(false);
    }
  };

  const handleSetCantidadRapida = (num) => {
    const nuevosPisos = [];
    for (let i = 1; i <= num; i++) {
      const id = String(i);
      const existe = pisosConfig.find((p) => String(p.id) === id);
      nuevosPisos.push(existe || { id, nombre: `Piso ${i}` });
    }
    setPisosConfig(nuevosPisos);
    toast.success(`Estructura ajustada a ${num} pisos. Recuerde presionar Guardar.`);
  };

  const handleAgregarPiso = () => {
    const siguienteNum = pisosConfig.length + 1;
    let nuevoId = String(siguienteNum);
    while (pisosConfig.some((p) => String(p.id) === nuevoId)) {
      nuevoId = String(parseInt(nuevoId, 10) + 1);
    }
    setPisosConfig([...pisosConfig, { id: nuevoId, nombre: `Piso ${nuevoId}` }]);
  };

  const handleEliminarPiso = (idx) => {
    if (pisosConfig.length <= 1) {
      toast.error('El hotel debe contar con al menos 1 piso registrado.');
      return;
    }
    const piso = pisosConfig[idx];
    const habsCount = habitacionesList.filter((h) => String(h.piso) === String(piso.id)).length;
    if (habsCount > 0) {
      const confirmar = window.confirm(
        `Este piso (${piso.nombre}) tiene ${habsCount} habitación(es) asignadas. ¿Seguro que deseas eliminarlo? Deberás reasignar las habitaciones después.`
      );
      if (!confirmar) return;
    }
    setPisosConfig(pisosConfig.filter((_, i) => i !== idx));
  };

  const handleGuardarPisosConfig = async () => {
    try {
      setGuardando(true);
      const res = await api.put('/habitaciones/pisos', { pisos: pisosConfig });
      if (res.data?.success || res.status === 200) {
        toast.success('¡Estructura de pisos guardada exitosamente!');
        window.dispatchEvent(new CustomEvent('habitaciones-updated'));
        cargarDatos();
      } else {
        toast.success('Pisos actualizados correctamente');
      }
    } catch (e) {
      console.error('Error al guardar pisos:', e);
      toast.error('Error al guardar la estructura de pisos');
    } finally {
      setGuardando(false);
    }
  };

  const totalHabitaciones = habitacionesList.length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* ─── ENCABEZADO Y CONTROLES SUPERIORES ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sora tracking-tight">
                  Estructura y Niveles de Pisos
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider font-sora">
                  Arquitectura Hotelera
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Personalice los pisos según la distribución física del establecimiento (Piso 1, Piso 2, Terraza, Suites, Bungalows, etc.)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={cargarDatos}
              disabled={cargando}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Recargar pisos y habitaciones"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl transition cursor-pointer text-xs font-extrabold flex items-center gap-1.5 active:scale-95 font-sora"
              title="Ir al Rack de Habitaciones (F2)"
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>Ver en Rack (F2)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── TARJETA PRINCIPAL DE CONFIGURACIÓN ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-6">
        
        {/* Atajo Rápido de Cantidad de Pisos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider font-sora flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Cantidad de Pisos del Hotel (Atajo Rápido):</span>
            </label>
            <span className="text-xs font-bold text-slate-400">
              Total Actual: <strong className="text-blue-600 dark:text-blue-400 font-mono">{pisosConfig.length}</strong> pisos
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => {
              const activo = pisosConfig.length === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSetCantidadRapida(num)}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold font-sora transition cursor-pointer text-center select-none active:scale-95 ${
                    activo
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600'
                  }`}
                >
                  {num} {num === 1 ? 'Piso' : 'Pisos'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista y Edición de Nombres de Pisos */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider font-sora">
                Pisos & Niveles Configurados:
              </span>
              <p className="text-[11px] text-slate-400">
                Puedes personalizar el nombre visible (ej. "Piso 1", "Planta Baja", "Piso Ejecutivo", "Terraza", "Bungalows")
              </p>
            </div>

            <button
              type="button"
              onClick={handleAgregarPiso}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 font-sora shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Agregar Piso</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {pisosConfig.map((p, idx) => {
              const habsCount = habitacionesList.filter((h) => String(h.piso) === String(p.id)).length;
              return (
                <div
                  key={p.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 transition-colors hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-black text-xs text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
                    #{idx + 1}
                  </div>

                  <input
                    type="text"
                    value={p.nombre || ''}
                    onChange={(e) => {
                      const copy = [...pisosConfig];
                      copy[idx].nombre = e.target.value;
                      setPisosConfig(copy);
                    }}
                    placeholder={`Nombre del piso ${idx + 1}`}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sora"
                  />

                  <span
                    className={`text-[10.5px] font-mono px-2.5 py-1 rounded-lg font-bold shrink-0 border ${
                      habsCount > 0
                        ? 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-300/60 dark:border-slate-600'
                    }`}
                    title={`${habsCount} habitaciones asignadas a este nivel`}
                  >
                    {habsCount} {habsCount === 1 ? 'hab' : 'habs'}
                  </span>

                  <button
                    type="button"
                    disabled={pisosConfig.length <= 1}
                    onClick={() => handleEliminarPiso(idx)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={pisosConfig.length <= 1 ? 'Mínimo 1 piso' : 'Eliminar piso'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nota informativa de valor para el usuario */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-slate-600 dark:text-slate-300">
            <span className="font-extrabold text-blue-900 dark:text-blue-200 font-sora block">
              Sincronización Inmediata con la Operación Hotelera
            </span>
            <p className="text-[11px] leading-relaxed">
              Los nombres y pisos configurados se reflejan automáticamente en el <strong>Rack de Habitaciones (F2)</strong>, en la asignación de habitaciones de <strong>Recepción</strong> y en el módulo de <strong>Control de Limpieza (Housekeeping)</strong>.
            </p>
          </div>
        </div>

        {/* Botón de Guardado */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium">
            {totalHabitaciones} habitaciones registradas en el hotel
          </span>

          <button
            type="button"
            onClick={handleGuardarPisosConfig}
            disabled={guardando}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition cursor-pointer active:scale-95 disabled:opacity-50 font-sora"
          >
            {guardando ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{guardando ? 'Guardando...' : 'Guardar Estructura de Pisos'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}

