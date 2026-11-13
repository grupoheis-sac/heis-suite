import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  Users,
  Globe,
  CreditCard,
  Building,
  MapPin,
  BedDouble,
  CheckCircle2,
  X,
  Loader2,
  FileText,
  Search,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { notificarError, notificarExito } from '../utils/notificaciones';

export default function ModalExportarLibroMincetur({ isOpen, onClose }) {
  const [cargando, setCargando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'extranjeros' | 'nacionales'
  const [filas, setFilas] = useState([]);
  const [hotelInfo, setHotelInfo] = useState(null);
  const [busquedaLocal, setBusquedaLocal] = useState('');

  // Fechas por defecto: mes actual
  const getPrimerDiaMes = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };
  const getHoy = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [fechaInicio, setFechaInicio] = useState(getPrimerDiaMes());
  const [fechaFin, setFechaFin] = useState(getHoy());

  useEffect(() => {
    if (isOpen) {
      consultarLibro();
    }
  }, [isOpen]);

  const aplicarPreset = (tipo) => {
    const hoy = new Date();
    if (tipo === 'este_mes') {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
      setFechaInicio(inicio);
      setFechaFin(fin);
    } else if (tipo === 'mes_anterior') {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0];
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().split('T')[0];
      setFechaInicio(inicio);
      setFechaFin(fin);
    } else if (tipo === 'ultimos_30') {
      const inicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFechaInicio(inicio);
      setFechaFin(hoy.toISOString().split('T')[0]);
    } else if (tipo === 'este_ano') {
      const inicio = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
      setFechaInicio(inicio);
      setFechaFin(hoy.toISOString().split('T')[0]);
    } else if (tipo === 'todo') {
      setFechaInicio('');
      setFechaFin('');
    }
  };

  const consultarLibro = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      if (filtroTipo && filtroTipo !== 'todos') params.append('tipo_filtro', filtroTipo);

      const res = await api.get(`/huespedes/libro-mincetur?${params.toString()}`);
      if (res.data?.success) {
        setFilas(res.data.data || []);
        setHotelInfo(res.data.hotel || {});
      }
    } catch (err) {
      console.error(err);
      notificarError('Error al consultar', 'No se pudo generar el Libro de Huéspedes MINCETUR.');
    } finally {
      setCargando(false);
    }
  };

  const descargarExcelCsv = () => {
    if (filas.length === 0) {
      notificarError('Sin datos', 'No hay registros en el rango seleccionado para exportar.');
      return;
    }

    try {
      const separador = ';';
      const salto = '\r\n';

      // Encabezado institucional oficial
      let csv = '\uFEFF'; // UTF-8 BOM para soporte total de acentos y caracteres especiales en Excel
      csv += `LIBRO OFICIAL DE REGISTRO DE HUÉSPEDES (MINCETUR D.S. Nº 001-2015)${salto}`;
      csv += `Establecimiento:;${(hotelInfo?.nombre || 'HOTEL & HOSPEDAJE').replace(/;/g, ' ')}${salto}`;
      csv += `RUC:;${hotelInfo?.ruc || '20000000001'}${salto}`;
      csv += `Dirección:;${(hotelInfo?.direccion || '').replace(/;/g, ' ')}${salto}`;
      csv += `Ubicación:;${hotelInfo?.distrito || ''} - ${hotelInfo?.provincia || ''} - ${hotelInfo?.departamento || ''}${salto}`;
      csv += `Periodo Consultado:;${fechaInicio || 'Histórico'} al ${fechaFin || 'Presente'}${salto}`;
      csv += `Fecha y Hora de Emisión:;${new Date().toLocaleString('es-PE')}${salto}`;
      csv += `Total Folios Registrados:;${filas.length}${salto}${salto}`;

      // Columnas reglamentarias
      const columnas = [
        'N° Folio',
        'Cód. Reserva',
        'Fecha Llegada',
        'Hora Llegada',
        'Fecha Salida',
        'Hora Salida',
        'Apellidos y Nombres',
        'Nacionalidad',
        'Tipo Doc.',
        'N° Documento',
        'Ciudad Procedencia',
        'Ciudad Destino',
        'Ocupación',
        'Habitación',
        'Tipo Habitación',
        'Motivo de Viaje',
        'N° Personas',
        'Noches',
        'Total Pagado (S/)',
        'Acompañantes',
        'Recepcionista',
        'Estado'
      ];
      csv += columnas.join(separador) + salto;

      // Filas de datos
      filas.forEach((r) => {
        const fila = [
          r.folio,
          r.reserva_codigo,
          r.fecha_llegada,
          r.hora_llegada,
          r.fecha_salida,
          r.hora_salida,
          `"${(r.apellidos_nombres || '').replace(/"/g, '""')}"`,
          `"${(r.nacionalidad || '').replace(/"/g, '""')}"`,
          r.tipo_documento,
          `"${r.num_documento}"`,
          `"${(r.ciudad_origen || '').replace(/"/g, '""')}"`,
          `"${(r.ciudad_destino || '').replace(/"/g, '""')}"`,
          `"${(r.ocupacion || '').replace(/"/g, '""')}"`,
          r.habitacion_numero,
          `"${(r.habitacion_tipo || '').replace(/"/g, '""')}"`,
          `"${(r.motivo_viaje || '').replace(/"/g, '""')}"`,
          r.num_personas,
          r.num_noches,
          r.total_pagado,
          `"${(r.acompanantes || '').replace(/"/g, '""')}"`,
          `"${(r.recepcionista || '').replace(/"/g, '""')}"`,
          r.estado
        ];
        csv += fila.join(separador) + salto;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nombreArchivo = `Libro_Huespedes_MINCETUR_${(fechaInicio || 'inicio').replace(/-/g, '')}_${(fechaFin || 'fin').replace(/-/g, '')}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notificarExito('Exportación Exitosa', `Se descargó "${nombreArchivo}" compatible con Excel.`);
    } catch (err) {
      console.error(err);
      notificarError('Error al exportar', 'No se pudo generar el archivo Excel/CSV.');
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  // Filtrado local en la vista previa
  const filasFiltradas = filas.filter((f) => {
    if (!busquedaLocal.trim()) return true;
    const q = busquedaLocal.toLowerCase();
    return (
      (f.apellidos_nombres || '').toLowerCase().includes(q) ||
      (f.num_documento || '').includes(q) ||
      (f.habitacion_numero || '').includes(q) ||
      (f.ciudad_origen || '').toLowerCase().includes(q) ||
      (f.nacionalidad || '').toLowerCase().includes(q)
    );
  });

  const totalNacionales = filas.filter(f => (f.nacionalidad || '').toLowerCase().includes('peru')).length;
  const totalExtranjeros = filas.length - totalNacionales;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[3px] animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150"
      >
        {/* ─── BARRA SUPERIOR (HEADER) ─── */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white font-sora">
                  Libro Oficial de Registro de Huéspedes
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-sora">
                  D.S. Nº 001-2015-MINCETUR & PNP
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Libro legal de registro foliado de pasajeros para inspección turística y policial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descargarExcelCsv}
              disabled={cargando || filas.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer font-sora"
              title="Descargar archivo en formato Excel / CSV oficial con delimitador punto y coma"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              disabled={cargando || filas.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer font-sora"
              title="Imprimir libro foliado para inspección"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── FILTROS Y CONTROLES DE RANGO ─── */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 space-y-3 shrink-0">
          {/* Fila de Presets rápidos */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-sora flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Periodos rápidos:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => aplicarPreset('este_mes')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer active:scale-95"
              >
                Este Mes
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset('mes_anterior')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer active:scale-95"
              >
                Mes Anterior
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset('ultimos_30')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer active:scale-95"
              >
                Últimos 30 días
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset('este_ano')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer active:scale-95"
              >
                Año {new Date().getFullYear()}
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset('todo')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition cursor-pointer active:scale-95"
              >
                Todo el Historial
              </button>
            </div>
          </div>

          {/* Formulario de Fecha y Segmento */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-bold font-sora">Desde:</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-white font-mono font-bold outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-bold font-sora">Hasta:</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-white font-mono font-bold outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setFiltroTipo('todos')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filtroTipo === 'todos' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('nacionales')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filtroTipo === 'nacionales' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Nacionales
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('extranjeros')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filtroTipo === 'extranjeros' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Extranjeros
                </button>
              </div>

              <button
                type="button"
                onClick={consultarLibro}
                disabled={cargando}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 font-sora"
              >
                {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Generar Libro</span>
              </button>
            </div>

            {/* Buscador local dentro de los resultados */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
                placeholder="Filtrar folio, nombre, DNI, hab..."
                className="w-full bg-white dark:bg-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* ─── RESUMEN INFORMATIVO DE FOLIOS ─── */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap font-sora">
            <span>
              Total Folios: <strong className="text-slate-900 dark:text-white font-extrabold font-mono">{filas.length}</strong>
            </span>
            <span>
              Nacionales: <strong className="text-blue-600 dark:text-blue-400 font-extrabold font-mono">{totalNacionales}</strong>
            </span>
            <span>
              Extranjeros: <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold font-mono">{totalExtranjeros}</strong>
            </span>
            {hotelInfo?.nombre && (
              <span className="hidden md:inline text-slate-400">
                • {hotelInfo.nombre} (RUC {hotelInfo.ruc})
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {fechaInicio || 'Inicio'} → {fechaFin || 'Hoy'}
          </span>
        </div>

        {/* ─── DATA GRID FOLIADO (VISTA PREVIA REGLAMENTARIA) ─── */}
        <div className="flex-1 overflow-auto p-4">
          {cargando ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Generando Libro Oficial de Huéspedes MINCETUR...</p>
            </div>
          ) : filasFiltradas.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No se encontraron registros de pasajeros en el rango de fechas seleccionado.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold font-sora border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-3.5 py-3 text-center">Folio</th>
                    <th className="px-3.5 py-3">Llegada</th>
                    <th className="px-3.5 py-3">Salida</th>
                    <th className="px-4 py-3">Apellidos y Nombres</th>
                    <th className="px-3 py-3">Nacionalidad</th>
                    <th className="px-3 py-3">Documento</th>
                    <th className="px-3 py-3">Procedencia</th>
                    <th className="px-3 py-3">Destino</th>
                    <th className="px-3 py-3">Ocupación</th>
                    <th className="px-3 py-3 text-center">Habitación</th>
                    <th className="px-3 py-3">Motivo Viaje</th>
                    <th className="px-3 py-3">Acompañantes</th>
                    <th className="px-3 py-3 text-right">Total S/</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filasFiltradas.map((r) => (
                    <tr key={r.folio} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-3.5 py-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        #{String(r.folio).padStart(4, '0')}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-200 block">
                          {r.fecha_llegada}
                        </span>
                        <span className="text-[10px] text-slate-400">{r.hora_llegada}</span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-200 block">
                          {r.fecha_salida}
                        </span>
                        <span className="text-[10px] text-slate-400">{r.hora_salida}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-800 dark:text-white font-sora block">
                          {r.apellidos_nombres}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Reserva: #{r.reserva_codigo}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                          <Globe className="w-3 h-3 text-amber-500" />
                          {r.nacionalidad}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                          {r.tipo_documento}: {r.num_documento}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                        {r.ciudad_origen}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                        {r.ciudad_destino}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                        {r.ocupacion}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-white font-sora px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                          <BedDouble className="w-3 h-3 text-blue-500" />
                          Hab. {r.habitacion_numero}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                        {r.motivo_viaje}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate" title={r.acompanantes}>
                        {r.acompanantes}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        S/ {r.total_pagado}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── PIE DE PÁGINA (FOOTER) ─── */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Documento apto para presentación oficial ante MINCETUR, DIRECETUR y Policía Nacional.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

