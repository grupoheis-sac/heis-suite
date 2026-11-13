import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import {
  Clock,
  Wallet,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Receipt,
  RotateCcw,
  User,
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  Unlock,
  ChevronRight,
  TrendingUp,
  Smartphone,
  Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketCierreCaja } from './utils/impresionTermica';
import ModalCierreCajaExito from './components/ModalCierreCajaExito';

export default function HistorialCajas() {
  const navigate = useNavigate();
  const settings = useSettingsStore();

  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos'); // 'Todos' | 'Abierta' | 'Cerrada'
  const [rangoRapido, setRangoRapido] = useState('mes'); // 'hoy' | 'ayer' | 'semana' | 'mes' | 'todos'
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal para ver arqueo completo y reimprimir
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null);
  const [cargandoAccion, setCargandoAccion] = useState({ id: null, tipo: null });

  // Calcular fechas según rango rápido
  useEffect(() => {
    const hoy = new Date();
    const formatoFecha = (d) => d.toISOString().split('T')[0];

    if (rangoRapido === 'hoy') {
      const f = formatoFecha(hoy);
      setFechaInicio(f);
      setFechaFin(f);
    } else if (rangoRapido === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      const f = formatoFecha(ayer);
      setFechaInicio(f);
      setFechaFin(f);
    } else if (rangoRapido === 'semana') {
      const semanaAtras = new Date(hoy);
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      setFechaInicio(formatoFecha(semanaAtras));
      setFechaFin(formatoFecha(hoy));
    } else if (rangoRapido === 'mes') {
      const mesAtras = new Date(hoy);
      mesAtras.setDate(mesAtras.getDate() - 30);
      setFechaInicio(formatoFecha(mesAtras));
      setFechaFin(formatoFecha(hoy));
    } else if (rangoRapido === 'todos') {
      setFechaInicio('');
      setFechaFin('');
    }
  }, [rangoRapido]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      if (filtroEstado !== 'Todos') params.estado = filtroEstado;

      const res = await api.get('/caja/historial', { params });
      if (res?.data?.success) {
        setCajas(res.data.cajas || []);
      } else if (res?.success) {
        setCajas(res.cajas || []);
      }
    } catch (err) {
      console.error('Error al cargar historial de cajas:', err);
      toast.error('No se pudo cargar el historial de cajas y turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [fechaInicio, fechaFin, filtroEstado]);

  // Filtrado en vivo por texto (cajero, id de turno o notas)
  const cajasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return cajas;
    const q = busqueda.toLowerCase().trim();
    return cajas.filter((c) => {
      const idStr = String(c.id);
      const cajeroStr = c.usuario?.nombre ? c.usuario.nombre.toLowerCase() : '';
      const obsStr = c.observaciones ? c.observaciones.toLowerCase() : '';
      return idStr.includes(q) || cajeroStr.includes(q) || obsStr.includes(q);
    });
  }, [cajas, busqueda]);

  // Métricas acumuladas del período
  const metricas = useMemo(() => {
    const totalTurnos = cajasFiltradas.length;
    const abiertas = cajasFiltradas.filter((c) => c.estado === 'Abierta').length;
    const cerradas = cajasFiltradas.filter((c) => c.estado === 'Cerrada');
    const cuadrados = cerradas.filter((c) => c.cuadre_estado === 'Cuadrado').length;
    const descuadres = cerradas.filter((c) => c.cuadre_estado !== 'Cuadrado').length;

    const totalVentasEfectivo = cajasFiltradas.reduce((acc, c) => acc + (parseFloat(c.ventas_efectivo) || 0), 0);
    const totalVentasDigital = cajasFiltradas.reduce((acc, c) => acc + (parseFloat(c.ventas_digitales) || 0), 0);
    const totalVentasGeneral = cajasFiltradas.reduce((acc, c) => acc + (parseFloat(c.total_ventas) || 0), 0);
    const totalEgresos = cajasFiltradas.reduce((acc, c) => acc + (parseFloat(c.total_egresos) || 0), 0);

    return {
      totalTurnos,
      abiertas,
      cerradas: cerradas.length,
      cuadrados,
      descuadres,
      totalVentasEfectivo,
      totalVentasDigital,
      totalVentasGeneral,
      totalEgresos
    };
  }, [cajasFiltradas]);

  // Ver arqueo detallado
  const handleVerDetalle = async (idCaja) => {
    try {
      setCargandoAccion({ id: idCaja, tipo: 'detalle' });
      const res = await api.get(`/caja/${idCaja}/cierre`);
      const cajaInfo = res?.caja || res?.data?.caja || res;
      if (cajaInfo && (cajaInfo.id || cajaInfo.monto_inicial !== undefined)) {
        setCajaSeleccionada(cajaInfo);
        setModalDetalleOpen(true);
      } else {
        toast.error('No se pudo obtener el detalle de la caja');
      }
    } catch (err) {
      console.error('Error al consultar detalle del arqueo:', err);
      toast.error('Error al consultar detalle del arqueo');
    } finally {
      setCargandoAccion({ id: null, tipo: null });
    }
  };

  // Reimprimir ticket térmico directo
  const handleReimprimirTicket = async (idCaja) => {
    try {
      setCargandoAccion({ id: idCaja, tipo: 'ticket' });
      const res = await api.get(`/caja/${idCaja}/cierre`);
      const cajaInfo = res?.caja || res?.data?.caja || res;
      if (cajaInfo && (cajaInfo.id || cajaInfo.monto_inicial !== undefined)) {
        imprimirTicketCierreCaja(cajaInfo, { formato: '80mm', settings, autoPrint: true });
        toast.success(`Enviando ticket del Turno #${idCaja} a impresora...`, { icon: '🖨️' });
      } else {
        toast.error('No se pudo obtener la información para imprimir');
      }
    } catch (err) {
      console.error('Error al reimprimir ticket:', err);
      toast.error('Error al reimprimir ticket');
    } finally {
      setCargandoAccion({ id: null, tipo: null });
    }
  };

  // Exportar a Excel
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const handleExportarExcel = async () => {
    try {
      setExportandoExcel(true);
      toast.loading('Generando reporte Excel de turnos y arqueos...', { id: 'export-cajas' });
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      if (filtroEstado !== 'Todos') params.estado = filtroEstado;

      const res = await api.get('/caja/exportar-excel', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([res], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fechaFmt = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Turnos_y_Arqueos_Botica_${fechaFmt}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Reporte Excel descargado exitosamente.', { id: 'export-cajas' });
    } catch (err) {
      console.error('Error al exportar turnos a Excel:', err);
      toast.error('No se pudo generar el archivo Excel.', { id: 'export-cajas' });
    } finally {
      setExportandoExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── ENCABEZADO PRINCIPAL (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sora">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <Clock className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Historial de Turnos y Arqueos
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                <ShieldCheck className="w-3 h-3 text-[#00B884] dark:text-[#5EEBB8]" />
                Auditoría & Arqueos
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Auditoría completa de cajas abiertas y cerradas, montos de apertura, ventas y cuadres de mostrador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={cargarHistorial}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 border border-slate-200/80 hover:border-slate-300 dark:border-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Refrescar lista"
          >
            <RotateCcw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportarExcel}
            disabled={exportandoExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#EBFDF6] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#00855E] dark:hover:text-[#5EEBB8] border border-slate-200/80 hover:border-[#A6F6D8] dark:border-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60 font-sora"
            title="Descargar reporte en Excel (.xlsx)"
          >
            {exportandoExcel ? (
              <span className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00B884] shrink-0" />
            )}
            <span className="hidden sm:inline">
              {exportandoExcel ? 'Generando...' : 'Exportar Excel'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/caja-finanzas?tab=caja')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer font-sora"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Gestionar Caja Chica</span>
          </button>
        </div>
      </div>

      {/* ─── TARJETAS DE INDICADORES / KPIS DEL HISTORIAL ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#D1F4E3] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10.5px] font-black uppercase tracking-wider font-sora">Turnos Registrados</span>
            <Receipt className="w-4 h-4 text-[#00B884]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-800 font-sora">{metricas.totalTurnos}</span>
            {metricas.abiertas > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] animate-pulse font-sora">
                {metricas.abiertas} Activo{metricas.abiertas === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">En el rango seleccionado</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D1F4E3] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#00855E] font-sora">Ventas Efectivo</span>
            <Banknote className="w-4 h-4 text-[#00B884]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#00855E] font-sora">
              S/ {metricas.totalVentasEfectivo.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Cobrado en cajón físico</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D1F4E3] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-blue-700 font-sora">Ventas Digitales</span>
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-blue-700 font-sora">
              S/ {metricas.totalVentasDigital.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Yape, Plin y Tarjetas</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#D1F4E3] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10.5px] font-black uppercase tracking-wider font-sora">Auditoría Cuadre</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-[#00855E] font-sora">
              {metricas.cuadrados} <span className="text-xs font-bold text-slate-500">Ok</span>
            </span>
            {metricas.descuadres > 0 && (
              <span className="text-sm font-extrabold text-rose-600 font-sora">
                / {metricas.descuadres} <span className="text-[10px] font-bold">dif</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            {metricas.descuadres === 0 ? 'Sin discrepancias' : 'Turnos con sobrante/faltante'}
          </span>
        </div>
      </div>

      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Botones de Rango Rápido */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'ayer', label: 'Ayer' },
              { id: 'semana', label: 'Últimos 7 Días' },
              { id: 'mes', label: 'Últimos 30 Días' },
              { id: 'todos', label: 'Todo el Historial' }
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setRangoRapido(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  rangoRapido === btn.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Filtro por Estado de Caja */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">Estado:</span>
            {['Todos', 'Abierta', 'Cerrada'].map((est) => (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filtroEstado === est
                    ? est === 'Abierta'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : est === 'Cerrada'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {est === 'Abierta' ? '🟢 Abiertas' : est === 'Cerrada' ? '⚪ Cerradas' : 'Todas'}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs de Fechas Personalizadas y Búsqueda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cajero, N° de turno o motivo..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setRangoRapido('personalizado');
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setRangoRapido('personalizado');
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ─── TABLA PRINCIPAL DEL HISTORIAL ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400">Consultando historial de cajas y arqueos...</p>
          </div>
        ) : cajasFiltradas.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-700">No se encontraron turnos de caja</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay registros de apertura o cierre que coincidan con los filtros y fechas seleccionadas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5 px-3 min-w-[90px]">Turno / Estado</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Cajero</th>
                  <th className="py-2.5 px-3 min-w-[115px]">Horario</th>
                  <th className="py-2.5 px-3 min-w-[85px] text-right">M. Inicial</th>
                  <th className="py-2.5 px-3 min-w-[115px] text-right">Ventas Totales</th>
                  <th className="py-2.5 px-3 min-w-[80px] text-right">Egresos</th>
                  <th className="py-2.5 px-3 min-w-[115px] text-right">Saldo (Esp. / Real)</th>
                  <th className="py-2.5 px-3 min-w-[120px] w-[120px] text-center">Cuadre</th>
                  <th className="py-2.5 px-3 min-w-[90px] w-[90px] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {cajasFiltradas.map((c) => {
                  const esAbierta = c.estado === 'Abierta';
                  const inicial = parseFloat(c.monto_inicial || 0);
                  const ventasEf = parseFloat(c.ventas_efectivo || 0);
                  const ventasDig = parseFloat(c.ventas_digitales || 0);
                  const ventasTot = parseFloat(c.total_ventas || 0);
                  const egresos = parseFloat(c.total_egresos || 0);
                  const esperado = parseFloat(c.monto_final_esperado || 0);
                  const real = c.monto_final_real !== null ? parseFloat(c.monto_final_real || 0) : null;
                  const dif = parseFloat(c.diferencia || 0);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        esAbierta ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* 1. Turno / Estado */}
                      <td className="py-2.5 px-3 whitespace-nowrap min-w-[90px]">
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-800 font-mono font-black text-xs">
                            #{c.id}
                          </span>
                          {esAbierta ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black leading-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
                              Abierta
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/90 text-slate-600 text-[10px] font-bold leading-none">
                              <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              Cerrada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Cajero / Farmacéutico */}
                      <td className="py-2.5 px-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200/80 text-slate-700 font-black text-[11px] flex items-center justify-center shrink-0">
                            {c.usuario?.nombre ? c.usuario.nombre.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 text-xs truncate max-w-[110px]" title={c.usuario?.nombre}>
                              {c.usuario?.nombre || 'Usuario Desconocido'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block truncate">
                              {c.usuario?.rol || 'Operador'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Horario (Apertura y Cierre) */}
                      <td className="py-2.5 px-3 whitespace-nowrap min-w-[115px]">
                        <div className="text-[11px] leading-tight space-y-1">
                          <div className="text-slate-700 flex items-center gap-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 border border-slate-200/60 px-1 py-0.2 rounded">
                              AP
                            </span>
                            <span className="font-semibold">{new Date(c.fecha_apertura).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</span>
                            <span className="font-mono text-slate-500 font-bold">{new Date(c.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 border border-slate-200/60 px-1 py-0.2 rounded">
                              CI
                            </span>
                            {c.fecha_cierre ? (
                              <span className="text-slate-600">
                                <span className="font-semibold">{new Date(c.fecha_cierre).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</span>{' '}
                                <span className="font-mono text-slate-500 font-bold">{new Date(c.fecha_cierre).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-black italic text-[10.5px]">En mostrador</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Monto Inicial */}
                      <td className="py-2.5 px-3 text-right font-sora font-bold text-slate-700 text-xs whitespace-nowrap min-w-[85px]">
                        S/ {inicial.toFixed(2)}
                      </td>

                      {/* 5. Ventas Totales con desglose */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap min-w-[115px]">
                        <div className="font-sora font-extrabold text-slate-800 text-xs">
                          S/ {ventasTot.toFixed(2)}
                        </div>
                        <div className="text-[9.5px] text-slate-400 font-sora">
                          Ef: S/{ventasEf.toFixed(2)} · Dig: S/{ventasDig.toFixed(2)}
                        </div>
                      </td>

                      {/* 6. Egresos */}
                      <td className="py-2.5 px-3 text-right font-sora font-bold text-xs whitespace-nowrap min-w-[80px]">
                        {egresos > 0 ? (
                          <span className="text-rose-600 font-sora">-S/ {egresos.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400 font-sora">S/ 0.00</span>
                        )}
                      </td>

                      {/* 7. Arqueo (Saldo Esperado vs Efectivo Real) */}
                      <td className="py-2.5 px-3 text-right font-sora whitespace-nowrap leading-tight space-y-0.5 min-w-[115px]">
                        <div className="text-xs font-extrabold text-slate-800 font-sora">
                          <span className="text-[9px] font-sans font-bold text-slate-400 mr-1 uppercase">Esp:</span>
                          S/ {esperado.toFixed(2)}
                        </div>
                        <div className="text-xs font-extrabold font-sora">
                          <span className="text-[9px] font-sans font-bold text-slate-400 mr-1 uppercase">Real:</span>
                          {real !== null ? (
                            <span className="text-[#00855E] font-sora">S/ {real.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400 italic font-sans font-medium text-[10.5px]">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 8. Cuadre / Diferencia (Con ancho mínimo garantizado para que nunca se comprima) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap min-w-[120px] w-[120px]">
                        {esAbierta ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            En curso
                          </span>
                        ) : Math.abs(dif) < 0.05 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Cuadrado
                          </span>
                        ) : dif > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs" title={`Sobrante de S/ ${dif.toFixed(2)}`}>
                            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            +S/ {dif.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs" title={`Faltante de S/ ${Math.abs(dif).toFixed(2)}`}>
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            -S/ {Math.abs(dif).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* 9. Acciones */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap min-w-[90px] w-[90px]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleVerDetalle(c.id)}
                            disabled={cargandoAccion.id === c.id}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-60"
                            title={esAbierta ? 'Ver Balance Parcial / En Curso' : 'Ver Resumen Completo y Arqueo'}
                          >
                            {cargandoAccion.id === c.id && cargandoAccion.tipo === 'detalle' ? (
                              <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin inline-block" />
                            ) : (
                              <Receipt className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReimprimirTicket(c.id)}
                            disabled={cargandoAccion.id === c.id}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-60"
                            title={esAbierta ? 'Imprimir Balance de Turno en Curso' : 'Reimprimir Ticket Térmico de Arqueo (80mm/58mm)'}
                          >
                            {cargandoAccion.id === c.id && cargandoAccion.tipo === 'ticket' ? (
                              <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin inline-block" />
                            ) : (
                              <Printer className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL DETALLE DE CIERRE CON IMPRESIÓN Y DESGLOSE COMPLETO ─── */}
      <ModalCierreCajaExito
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        cajaData={cajaSeleccionada}
      />
    </div>
  );
}
