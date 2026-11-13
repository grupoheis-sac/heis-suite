import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Save,
  RefreshCw,
  Sliders,
  DollarSign,
  Check,
  ExternalLink,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { calcularTarifaDinamica, TEMPORADAS_PREDETERMINADAS } from './utils/tarifasDinamicas';

export default function TarifasTemporadas() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const { updateSettings, fetchServerSettings } = settings;

  // Estados locales editables
  const [finSemanaActivo, setFinSemanaActivo] = useState(true);
  const [finSemanaRecargo, setFinSemanaRecargo] = useState('15');
  const [desc3Noches, setDesc3Noches] = useState('10');
  const [desc7Noches, setDesc7Noches] = useState('15');
  const [temporadas, setTemporadas] = useState(TEMPORADAS_PREDETERMINADAS);

  const [guardando, setGuardando] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Simulador State
  const [simBase, setSimBase] = useState(100);
  const [simFecha, setSimFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [simNoches, setSimNoches] = useState(3);

  // Formulario de nueva temporada
  const [mostrarAgregarTemp, setMostrarAgregarTemp] = useState(false);
  const [nuevaTemp, setNuevaTemp] = useState({
    nombre: '',
    inicioMesDia: '07-15',
    finMesDia: '08-10',
    recargo_pct: 25,
    activo: true
  });

  // Cargar valores iniciales desde settingsStore
  useEffect(() => {
    if (settings) {
      if (settings.tarifas_fin_de_semana_activo !== undefined) {
        setFinSemanaActivo(
          settings.tarifas_fin_de_semana_activo !== 'false' &&
          settings.tarifas_fin_de_semana_activo !== false
        );
      }
      if (settings.tarifas_fin_de_semana_recargo !== undefined) {
        setFinSemanaRecargo(String(settings.tarifas_fin_de_semana_recargo));
      }
      if (settings.tarifas_descuento_larga_estancia_3_noches !== undefined) {
        setDesc3Noches(String(settings.tarifas_descuento_larga_estancia_3_noches));
      }
      if (settings.tarifas_descuento_larga_estancia_7_noches !== undefined) {
        setDesc7Noches(String(settings.tarifas_descuento_larga_estancia_7_noches));
      }
      if (settings.tarifas_temporadas) {
        try {
          const parsed = typeof settings.tarifas_temporadas === 'string'
            ? JSON.parse(settings.tarifas_temporadas)
            : settings.tarifas_temporadas;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTemporadas(parsed);
          }
        } catch (_) {}
      }
    }
  }, [settings]);

  // Manejadores de cambios
  const handleToggleFinSemana = () => {
    setFinSemanaActivo(prev => !prev);
    setHasChanges(true);
  };

  const handleRecargoChange = (val) => {
    setFinSemanaRecargo(String(val));
    setHasChanges(true);
  };

  const handleDesc3Change = (val) => {
    setDesc3Noches(String(val));
    setHasChanges(true);
  };

  const handleDesc7Change = (val) => {
    setDesc7Noches(String(val));
    setHasChanges(true);
  };

  const handleToggleTemporada = (id) => {
    setTemporadas(prev =>
      prev.map(t => (t.id === id ? { ...t, activo: !t.activo } : t))
    );
    setHasChanges(true);
  };

  const handleEliminarTemporada = (id) => {
    setTemporadas(prev => prev.filter(t => t.id !== id));
    setHasChanges(true);
  };

  const handleCrearTemporada = (e) => {
    e.preventDefault();
    if (!nuevaTemp.nombre.trim()) {
      toast.error('Ingrese un nombre para la temporada');
      return;
    }
    const creada = {
      ...nuevaTemp,
      id: `temp_${Date.now()}`
    };
    setTemporadas(prev => [...prev, creada]);
    setNuevaTemp({
      nombre: '',
      inicioMesDia: '07-15',
      finMesDia: '08-10',
      recargo_pct: 25,
      activo: true
    });
    setMostrarAgregarTemp(false);
    setHasChanges(true);
    toast.success('Temporada agregada (recuerde Guardar Cambios)');
  };

  const handleRestablecerValores = () => {
    setFinSemanaActivo(true);
    setFinSemanaRecargo('15');
    setDesc3Noches('10');
    setDesc7Noches('15');
    setTemporadas(TEMPORADAS_PREDETERMINADAS);
    setHasChanges(true);
    toast('Valores restablecidos a los recomendados de fábrica', { icon: '🔄' });
  };

  const handleGuardarPoliticas = async () => {
    setGuardando(true);
    try {
      const payload = {
        tarifas_fin_de_semana_activo: finSemanaActivo,
        tarifas_fin_de_semana_recargo: String(finSemanaRecargo),
        tarifas_descuento_larga_estancia_3_noches: String(desc3Noches),
        tarifas_descuento_larga_estancia_7_noches: String(desc7Noches),
        tarifas_temporadas: JSON.stringify(temporadas)
      };

      await updateSettings(payload);
      setHasChanges(false);

      window.dispatchEvent(new CustomEvent('tarifas-updated'));

      toast.success('¡Estrategia de tarifas y temporadas guardada correctamente!', {
        icon: '📈',
        duration: 3500
      });
    } catch (err) {
      toast.error('Error al guardar las tarifas: ' + (err.message || 'Error en el servidor'));
    } finally {
      setGuardando(false);
    }
  };

  // Config temporal para el simulador
  const configSimulacion = useMemo(() => ({
    tarifas_fin_de_semana_activo: finSemanaActivo,
    tarifas_fin_de_semana_recargo: finSemanaRecargo,
    tarifas_descuento_larga_estancia_3_noches: desc3Noches,
    tarifas_descuento_larga_estancia_7_noches: desc7Noches,
    tarifas_temporadas: temporadas
  }), [finSemanaActivo, finSemanaRecargo, desc3Noches, desc7Noches, temporadas]);

  const simulacion = useMemo(() => {
    return calcularTarifaDinamica({
      precioBase: simBase,
      fechaEntrada: simFecha,
      noches: simNoches,
      config: configSimulacion
    });
  }, [simBase, simFecha, simNoches, configSimulacion]);

  const temporadasActivasCount = temporadas.filter(t => t.activo).length;

  return (
    <div className="space-y-6 font-sora">
      {/* ─── BANNER / CABECERA DE LA PESTAÑA TARIFAS ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sora tracking-tight">
                  Tarifas Dinámicas & Temporadas
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider font-sora">
                  Revenue & Yield Management
                </span>
                {hasChanges && (
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                    ● Cambios sin guardar
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Estrategia comercial de precios variables por alta demanda, fines de semana, temporadas y estancias prolongadas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleRestablecerValores}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1.5 active:scale-95"
              title="Restablecer reglas predeterminadas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/reservas')}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1.5 active:scale-95"
              title="Ir a Reservas (F3)"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver en Reservas</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>

            <button
              type="button"
              onClick={handleGuardarPoliticas}
              disabled={guardando}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                hasChanges
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white ring-2 ring-blue-400/40'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              <Save className={`w-4 h-4 ${guardando ? 'animate-spin' : ''}`} />
              <span>{guardando ? 'Guardando...' : 'Guardar Políticas'}</span>
            </button>
          </div>
        </div>

        {/* Resumen Métrico Rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Fin de Semana</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${finSemanaActivo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <strong className="text-slate-800 dark:text-slate-100 font-extrabold">
                {finSemanaActivo ? `+${finSemanaRecargo}% (Vie/Sáb)` : 'Desactivado'}
              </strong>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Larga Estadía</span>
            <strong className="text-slate-800 dark:text-slate-100 font-extrabold mt-0.5 block">
              3d: -{desc3Noches}% | 7d: -{desc7Noches}%
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Temporadas Activas</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <strong className="text-slate-800 dark:text-slate-100 font-extrabold">
                {temporadasActivasCount} de {temporadas.length} períodos
              </strong>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Impacto en Reservas</span>
            <div className="flex items-center gap-1 mt-0.5 text-blue-600 dark:text-blue-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cotización Dinámica Activa</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 1. MULTIPLICADOR DE FIN DE SEMANA ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Tarifa Dinámica de Fin de Semana (Viernes & Sábado)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aumenta automáticamente el precio de las noches de viernes y sábado según la alta demanda de ocio y turismo.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={finSemanaActivo}
              onChange={handleToggleFinSemana}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {finSemanaActivo && (
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div>
              <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                Porcentaje de Recargo de Fin de Semana
              </span>
              <span className="text-[11px] text-blue-700/70 dark:text-blue-300/70">
                Se aplicará automáticamente al precio base de cada noche de viernes y sábado al cotizar o registrar reservas.
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[10, 15, 20, 25, 30].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleRecargoChange(pct)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                    String(finSemanaRecargo) === String(pct)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  +{pct}%
                </button>
              ))}

              <div className="relative w-20">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={finSemanaRecargo}
                  onChange={(e) => handleRecargoChange(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-center text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. DESCUENTOS POR LARGA ESTADÍA ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Descuentos por Estancia Prolongada (Length of Stay)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Incentiva a los huéspedes y corporativos a reservar estancias más largas con descuentos automáticos sobre el total.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Estancia de 3 a 6 Noches
              </span>
              <span className="text-[11px] text-slate-400">Descuento aplicado al total de la estadía</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">-</span>
              <input
                type="number"
                min={0}
                max={50}
                value={desc3Noches}
                onChange={(e) => handleDesc3Change(e.target.value)}
                className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-center text-emerald-600 dark:text-emerald-400"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Estancia Semanal (7+ Noches)
              </span>
              <span className="text-[11px] text-slate-400">Descuento preferencial para huéspedes de larga duración</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">-</span>
              <input
                type="number"
                min={0}
                max={50}
                value={desc7Noches}
                onChange={(e) => handleDesc7Change(e.target.value)}
                className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-center text-emerald-600 dark:text-emerald-400"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. TEMPORADAS DEL AÑO & FERIADOS ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Temporadas del Año & Feriados Nacionales
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define tarifas especiales para fechas pico (Fiestas Patrias, Año Nuevo, Semana Santa) o descuentos en temporada baja.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMostrarAgregarTemp(!mostrarAgregarTemp)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Temporada</span>
          </button>
        </div>

        {mostrarAgregarTemp && (
          <form onSubmit={handleCrearTemporada} className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200">
              Configurar Nueva Temporada / Período
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fiestas de Arequipa / Aniversario"
                  value={nuevaTemp.nombre}
                  onChange={(e) => setNuevaTemp({ ...nuevaTemp, nombre: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Rango (MM-DD)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="08-01"
                    maxLength={5}
                    value={nuevaTemp.inicioMesDia}
                    onChange={(e) => setNuevaTemp({ ...nuevaTemp, inicioMesDia: e.target.value })}
                    className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-400 text-xs font-bold">a</span>
                  <input
                    type="text"
                    placeholder="08-15"
                    maxLength={5}
                    value={nuevaTemp.finMesDia}
                    onChange={(e) => setNuevaTemp({ ...nuevaTemp, finMesDia: e.target.value })}
                    className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Recargo / Descuento %</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={nuevaTemp.recargo_pct}
                    onChange={(e) => setNuevaTemp({ ...nuevaTemp, recargo_pct: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrarAgregarTemp(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-lg cursor-pointer shadow-xs active:scale-95"
              >
                Guardar Temporada
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {temporadas.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                t.activo
                  ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-800/60 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${t.activo ? 'bg-purple-600 animate-pulse' : 'bg-slate-400'}`} />
                  <strong className="text-xs text-slate-800 dark:text-white truncate block">
                    {t.nombre}
                  </strong>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Fechas: {t.inicioMesDia} al {t.finMesDia}</span>
                  <span>•</span>
                  <span className={t.recargo_pct >= 0 ? "font-bold text-purple-700 dark:text-purple-300" : "font-bold text-blue-600 dark:text-blue-400"}>
                    {t.recargo_pct >= 0 ? `+${t.recargo_pct}%` : `${t.recargo_pct}%`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleTemporada(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer border ${
                    t.activo
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t.activo ? 'Activa' : 'Pausada'}
                </button>

                <button
                  type="button"
                  onClick={() => handleEliminarTemporada(t.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Eliminar temporada"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. SIMULADOR INTERACTIVO DE REVENUE MANAGEMENT ─── */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-[28px] p-5 sm:p-7 shadow-lg border border-indigo-800/50 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                Simulador en Vivo de Tarifas Inteligentes
              </h4>
              <p className="text-[11px] text-slate-400">
                Prueba cómo el motor calcula la tarifa final para cualquier fecha, número de noches y tarifa base.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Yield Simulator Engine
          </span>
        </div>

        {/* Inputs del simulador */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-bold">Tarifa Base (S/)</label>
            <input
              type="number"
              value={simBase}
              onChange={(e) => setSimBase(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white font-mono font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-bold">Fecha Check-in</label>
            <input
              type="date"
              value={simFecha}
              onChange={(e) => setSimFecha(e.target.value)}
              className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white font-mono font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-bold">Noches de Estadía</label>
            <input
              type="number"
              min={1}
              max={30}
              value={simNoches}
              onChange={(e) => setSimNoches(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white font-mono font-bold text-sm"
            />
          </div>
        </div>

        {/* Resultado Simulador */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 items-center">
          <div>
            <span className="text-[11px] text-slate-400 block font-bold">Tarifa Promedio Noche:</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5">
              S/ {simulacion.precioPromedioNoche.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">/noche</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-bold">Total Estadía ({simNoches} noches):</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
              S/ {simulacion.totalFinal.toFixed(2)}
            </div>
          </div>

          <div className="text-[11px] space-y-1 text-slate-300">
            {simulacion.temporadasAplicadas.length > 0 && (
              <div className="text-purple-300 font-bold flex items-center gap-1">
                <span>✦ Temporada:</span>
                <span>{simulacion.temporadasAplicadas.join(', ')}</span>
              </div>
            )}
            {simulacion.nochesFinDeSemana > 0 && finSemanaActivo && (
              <div className="text-blue-300 font-bold flex items-center gap-1">
                <span>✦ {simulacion.nochesFinDeSemana} noche(s) con recargo fin de semana (+{finSemanaRecargo}%)</span>
              </div>
            )}
            {simulacion.montoDescuento > 0 && (
              <div className="text-emerald-300 font-bold flex items-center gap-1">
                <span>✦ {simulacion.motivoDescuento}:</span>
                <span>-S/ {simulacion.montoDescuento.toFixed(2)}</span>
              </div>
            )}
            {!simulacion.esTarifaDinamica && (
              <div className="text-slate-400 italic">
                (Tarifa regular sin recargos ni descuentos aplicados)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

