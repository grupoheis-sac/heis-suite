import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Layers,
  Store,
  CalendarPlus,
  LogOut,
  X,
  Crown,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TapeChartCalendar({
  onAbrirCheckIn,
  onAbrirCheckOut,
  onAbrirFichaMincetur,
  onAbrirExtender,
  onAbrirPos
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ rango: {}, dias: [], habitaciones: [] });
  const [fechaInicio, setFechaInicio] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [diasVista, setDiasVista] = useState(14); // 7, 14, 30
  const [pisoFiltro, setPisoFiltro] = useState('todos');

  // Popover de Reserva seleccionada
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [habitacionDeReserva, setHabitacionDeReserva] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    cargarTapeChart();
  }, [fechaInicio, diasVista, pisoFiltro]);

  const cargarTapeChart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/habitaciones/tape-chart', {
        params: {
          fecha_inicio: fechaInicio,
          dias: diasVista,
          piso: pisoFiltro !== 'todos' ? pisoFiltro : undefined
        }
      });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar Tape Chart:', err);
      toast.error('No se pudo cargar el calendario de reservas.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavegar = (direccion) => {
    const d = new Date(fechaInicio + 'T00:00:00');
    d.setDate(d.getDate() + (direccion * (diasVista === 7 ? 7 : diasVista === 30 ? 15 : 7)));
    setFechaInicio(d.toISOString().split('T')[0]);
  };

  const handleIrHoy = () => {
    setFechaInicio(new Date().toISOString().split('T')[0]);
  };

  const { dias = [], habitaciones = [] } = data;

  // Pisos únicos para el filtro
  const pisosUnicos = useMemo(() => {
    const set = new Set();
    habitaciones.forEach(h => {
      if (h.piso) set.add(String(h.piso));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [habitaciones]);

  // Mapa de índices de fecha para cálculo rápido de columnas
  const fechaIndices = useMemo(() => {
    const map = {};
    dias.forEach((d, idx) => {
      map[d.fecha] = idx;
    });
    return map;
  }, [dias]);

  // Métricas rápidas del período visible
  const metricas = useMemo(() => {
    let ocupadasHoy = 0;
    let totalReservas = 0;
    const hoyYMD = new Date().toISOString().split('T')[0];

    habitaciones.forEach(h => {
      (h.reservas || []).forEach(r => {
        totalReservas++;
        if (r.fecha_entrada <= hoyYMD && r.fecha_salida >= hoyYMD && r.estado === 'checkin') {
          ocupadasHoy++;
        }
      });
    });

    const totalHabs = habitaciones.length || 1;
    const tasaOcupacionHoy = Math.round((ocupadasHoy / totalHabs) * 100);

    return { ocupadasHoy, totalHabs, totalReservas, tasaOcupacionHoy };
  }, [habitaciones]);

  // Manejo de clic en reserva
  const handleClickReserva = (e, reserva, habitacion) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPos({
      x: Math.min(window.innerWidth - 320, Math.max(10, rect.left)),
      y: rect.bottom + 8
    });
    setReservaSeleccionada(reserva);
    setHabitacionDeReserva(habitacion);
  };

  // Manejo de clic en celda vacía para nuevo check-in
  const handleClickCeldaVacia = (habitacion, fecha) => {
    setReservaSeleccionada(null);
    if (onAbrirCheckIn) {
      onAbrirCheckIn(habitacion, fecha);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── BARRA DE CONTROL DEL CALENDARIO TAPE CHART ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Navegación de Fechas */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleNavegar(-1)}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleIrHoy}
              className="px-3 py-1 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold font-sora shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handleNavegar(1)}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Período siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Fecha Base */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-transparent text-xs font-bold font-sora text-slate-800 dark:text-slate-100 border-none outline-none cursor-pointer"
            />
          </div>

          {/* Rango de Días (7, 14, 30) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {[
              { dias: 7, label: '7 Días' },
              { dias: 14, label: '14 Días' },
              { dias: 30, label: '30 Días' }
            ].map(r => (
              <button
                key={r.dias}
                type="button"
                onClick={() => setDiasVista(r.dias)}
                className={`px-2.5 py-1 rounded-xl text-xs font-extrabold font-sora transition cursor-pointer ${
                  diasVista === r.dias
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros de Piso y Leyendas */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Piso */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={pisoFiltro}
              onChange={(e) => setPisoFiltro(e.target.value)}
              className="bg-transparent text-xs font-bold font-sora text-slate-800 dark:text-slate-100 border-none outline-none cursor-pointer"
            >
              <option value="todos">Todos los Pisos</option>
              {pisosUnicos.map(p => (
                <option key={p} value={p}>Piso {p}</option>
              ))}
            </select>
          </div>

          {/* Leyenda interactiva */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold font-sora text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/30"></span>
              <span>Check-in Activo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-400/30"></span>
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-400/30"></span>
              <span>Day-Use (Horas)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={cargarTapeChart}
            className="p-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
            title="Refrescar cronograma"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── CONTENEDOR DEL CALENDARIO GANTT / TAPE CHART ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-xs font-bold text-slate-700 dark:text-slate-200">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Sincronizando cronograma hotelero...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <div className="min-w-fit">
            
            {/* Cabecera del Tape Chart: Fechas y Días */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 sticky top-0 z-20">
              {/* Columna fija: Habitación */}
              <div className="w-36 sm:w-44 shrink-0 px-3 sm:px-4 py-3 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-sora">
                  Habitación
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {habitaciones.length} habs
                </span>
              </div>

              {/* Columnas de Días */}
              <div className="flex flex-1">
                {dias.map((dia) => (
                  <div
                    key={dia.fecha}
                    className={`w-14 sm:w-16 shrink-0 py-2.5 px-1 text-center border-r border-slate-200/70 dark:border-slate-800/80 transition-colors ${
                      dia.isToday
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-inset ring-blue-500/40'
                        : dia.isWeekend
                        ? 'bg-slate-100/60 dark:bg-slate-800/30'
                        : ''
                    }`}
                  >
                    <span className={`block text-[9.5px] font-black uppercase tracking-wider font-sora ${
                      dia.isToday
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {dia.diaSemana}
                    </span>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-black mt-0.5 ${
                      dia.isToday
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {dia.diaMes}
                    </span>
                    <span className="block text-[8px] font-semibold text-slate-400 uppercase mt-0.5">
                      {dia.mes}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filas del Tape Chart: Una por cada Habitación */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {habitaciones.map((hab) => {
                const esOcupada = hab.estado === 'ocupada';
                const esLimpieza = hab.estado_limpieza === 'en_limpieza' || hab.estado_limpieza === 'sucia';
                const esMantenimiento = hab.estado === 'mantenimiento';

                return (
                  <div key={hab.id} className="flex hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    {/* Tarjeta de la Habitación a la izquierda */}
                    <div className="w-36 sm:w-44 shrink-0 px-3 sm:px-4 py-2.5 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            esOcupada
                              ? 'bg-rose-500 ring-2 ring-rose-400/30'
                              : esLimpieza
                              ? 'bg-amber-500 ring-2 ring-amber-400/30'
                              : esMantenimiento
                              ? 'bg-slate-400'
                              : 'bg-emerald-500 ring-2 ring-emerald-400/30'
                          }`} />
                          <span className="font-extrabold text-sm sm:text-base font-mono text-slate-900 dark:text-white">
                            {hab.numero}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 block truncate font-sora">
                          Piso {hab.piso} • {hab.tipo?.nombre || 'Hab.'}
                        </span>
                      </div>

                      <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 font-mono shrink-0">
                        S/{parseFloat(hab.tipo?.precio_base || 80).toFixed(0)}
                      </span>
                    </div>

                    {/* Matriz de Días con Bloques Gantt de Reservas */}
                    <div className="flex flex-1 relative h-12">
                      {/* Celdas de fondo por cada día */}
                      {dias.map((dia) => (
                        <div
                          key={dia.fecha}
                          onClick={() => handleClickCeldaVacia(hab, dia.fecha)}
                          className={`w-14 sm:w-16 shrink-0 h-full border-r border-slate-100 dark:border-slate-800/40 cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${
                            dia.isToday
                              ? 'bg-blue-50/20 dark:bg-blue-950/10'
                              : dia.isWeekend
                              ? 'bg-slate-50/40 dark:bg-slate-800/10'
                              : ''
                          }`}
                          title={`Hab. ${hab.numero} libre el ${dia.fecha} — Clic para reservar`}
                        />
                      ))}

                      {/* Bloques de Reservas Flotantes (Gantt Bars) */}
                      {(hab.reservas || []).map((res) => {
                        const idxEntrada = fechaIndices[res.fecha_entrada];
                        const idxSalida = fechaIndices[res.fecha_salida];

                        // Si la reserva está fuera del rango visible completo
                        if (idxEntrada === undefined && idxSalida === undefined) {
                          // Verificar si cruza el rango visible completo
                          if (res.fecha_entrada < dias[0]?.fecha && res.fecha_salida > dias[dias.length - 1]?.fecha) {
                            // Cubre todo el ancho
                          } else {
                            return null;
                          }
                        }

                        const startIdx = idxEntrada !== undefined ? idxEntrada : 0;
                        const endIdx = idxSalida !== undefined ? idxSalida : dias.length - 1;
                        const duracionCols = Math.max(1, endIdx - startIdx + 1);

                        // Ancho de columna: 56px en móvil, 64px en sm
                        const colWidth = window.innerWidth >= 640 ? 64 : 56;
                        const leftPos = startIdx * colWidth + 4;
                        const barWidth = duracionCols * colWidth - 8;

                        const esHoras = res.modalidad === 'horas';
                        const esCheckIn = res.estado === 'checkin';
                        const esConfirmada = res.estado === 'confirmada';

                        const colorClasses = esHoras
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/20 border-purple-400'
                          : esCheckIn
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20 border-emerald-400'
                          : esConfirmada
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20 border-blue-400'
                          : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white border-slate-500';

                        return (
                          <div
                            key={res.id}
                            onClick={(e) => handleClickReserva(e, res, hab)}
                            style={{
                              position: 'absolute',
                              left: `${leftPos}px`,
                              width: `${barWidth}px`,
                              top: '6px',
                              bottom: '6px'
                            }}
                            className={`rounded-xl border shadow-sm px-2.5 flex items-center justify-between gap-1.5 cursor-pointer transition-all hover:scale-[1.02] hover:z-30 select-none overflow-hidden ${colorClasses}`}
                            title={`Reserva #${res.codigo} • ${res.huesped?.nombre} ${res.huesped?.apellido} (${res.fecha_entrada} al ${res.fecha_salida})`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              {res.huesped?.clasificacion === 'vip' ? (
                                <Crown className="w-3 h-3 text-amber-300 shrink-0" />
                              ) : (
                                <User className="w-3 h-3 opacity-80 shrink-0" />
                              )}
                              <span className="text-[11px] font-extrabold font-sora truncate tracking-tight">
                                {res.huesped?.nombre} {res.huesped?.apellido}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono font-bold opacity-90">
                              {esHoras ? (
                                <span>{res.num_horas}h</span>
                              ) : (
                                <span>{res.num_noches}n</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── POPOVER FLOTANTE CON ACCIONES RÁPIDAS DE RESERVA ─── */}
      {reservaSeleccionada && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${popoverPos.x}px`,
            top: `${popoverPos.y}px`,
            zIndex: 60
          }}
          className="w-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4.5 animate-in fade-in zoom-in-95 duration-150 select-none ring-1 ring-slate-900/10 text-slate-800 dark:text-slate-100"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-black text-xs">
                {habitacionDeReserva?.numero}
              </div>
              <div>
                <h4 className="text-xs font-black font-sora text-slate-900 dark:text-white leading-tight">
                  Hab. {habitacionDeReserva?.numero}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {reservaSeleccionada.codigo}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReservaSeleccionada(null)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Información del Huésped */}
          <div className="py-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Huésped Titular:</span>
              <span className="font-extrabold font-sora text-slate-900 dark:text-white">
                {reservaSeleccionada.huesped?.nombre} {reservaSeleccionada.huesped?.apellido}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Doc / DNI:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {reservaSeleccionada.huesped?.num_documento || 'Sin doc'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Estadía:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {reservaSeleccionada.modalidad === 'horas'
                  ? `${reservaSeleccionada.num_horas} Horas (Day-Use)`
                  : `${reservaSeleccionada.num_noches} Noche(s)`}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-400 text-[11px]">Total Cuenta:</span>
              <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                S/ {parseFloat(reservaSeleccionada.total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Ficha MINCETUR */}
            <button
              type="button"
              onClick={() => {
                const id = reservaSeleccionada.id;
                setReservaSeleccionada(null);
                onAbrirFichaMincetur(id);
              }}
              className="py-1.5 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 text-[10.5px] font-extrabold font-sora flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ficha MINCETUR</span>
            </button>

            {/* Extender Estadía */}
            <button
              type="button"
              onClick={() => {
                const hab = habitacionDeReserva;
                setReservaSeleccionada(null);
                onAbrirExtender(hab);
              }}
              className="py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-[10.5px] font-extrabold font-sora flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Extender</span>
            </button>

            {/* Consumos POS */}
            <button
              type="button"
              onClick={() => {
                const res = reservaSeleccionada;
                const hab = habitacionDeReserva;
                setReservaSeleccionada(null);
                onAbrirPos(res, hab);
              }}
              className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-[10.5px] font-extrabold font-sora flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>+ Consumos</span>
            </button>

            {/* Check-Out */}
            <button
              type="button"
              onClick={() => {
                const id = reservaSeleccionada.id;
                const num = habitacionDeReserva?.numero;
                setReservaSeleccionada(null);
                onAbrirCheckOut(id, num);
              }}
              className="py-1.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 text-[10.5px] font-extrabold font-sora flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check-out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
