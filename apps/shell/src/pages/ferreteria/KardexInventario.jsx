import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { useSucursalStore } from '@heis/core';
import {
 Layers,
 Search,
 Filter,
 Calendar,
 ArrowDownRight,
 ArrowUpRight,
 RefreshCw,
 Printer,
 FileSpreadsheet,
 X,
 User,
 Package,
 Sliders,
 CheckCircle2,
 AlertTriangle
} from 'lucide-react';

export default function KardexInventario() {
 const settings = useSettingsStore();
 const { sucursalActiva } = useSucursalStore();
 const [searchParams, setSearchParams] = useSearchParams();
 const [movimientos, setMovimientos] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') || '');
 const [filtroTipo, setFiltroTipo] = useState('TODOS');
 const [fechaInicio, setFechaInicio] = useState('');
 const [fechaFin, setFechaFin] = useState('');
 const [totalRegistros, setTotalRegistros] = useState(0);
  const [modalImprimir, setModalImprimir] = useState(false);

 // Escuchar si cambia el query param en la URL
 useEffect(() => {
 const q = searchParams.get('busqueda');
 if (q !== null && q !== busqueda) {
 setBusqueda(q);
 }
 }, [searchParams]);

 const cargarKardex = async () => {
 setCargando(true);
 try {
 const params = {
 limit: 100
 };
 if (busqueda.trim()) params.busqueda = busqueda.trim();
 if (filtroTipo !== 'TODOS') params.tipo = filtroTipo;
 if (fechaInicio) params.fecha_inicio = fechaInicio;
 if (fechaFin) params.fecha_fin = fechaFin;

 const res = await api.get('/inventario/kardex', { params });
 if (res.success) {
 setMovimientos(res.movimientos || []);
 setTotalRegistros(res.total || 0);
 }
 } catch (e) {
 toast.error('Error al cargar movimientos de Kardex');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarKardex();
 }, [filtroTipo, fechaInicio, fechaFin, busqueda]);

 const handleBuscar = (e) => {
 e.preventDefault();
 cargarKardex();
 };

 const limpiarFiltros = () => {
 setBusqueda('');
 setFiltroTipo('TODOS');
 setFechaInicio('');
 setFechaFin('');
 if (searchParams.get('busqueda')) {
 searchParams.delete('busqueda');
 setSearchParams(searchParams);
 }
 };

 return (
 <div className={`space-y-4 ${modalImprimir ? 'print:hidden' : ''}`}>

 {/* ─── ESTILOS EXCLUSIVOS PARA IMPRESIÓN LIMPIA DE TABLA KARDEX (HORIZONTAL / LANDSCAPE Y AJUSTE 100%) ─── */}
 <style>{`
  @media print {
    @page {
      size: landscape;
      margin: 8mm 10mm;
    }
    body {
      background: white !important;
      color: black !important;
    }
    /* Ocultar el resto del sistema si el modal de impresión está activo */
    body:has(.modal-kardex-print-portal) #root {
      display: none !important;
    }
    .modal-kardex-print-portal {
      position: static !important;
      display: block !important;
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
    }
    .modal-kardex-print-container {
      box-shadow: none !important;
      border: none !important;
      max-height: none !important;
      max-width: 100% !important;
      width: 100% !important;
      overflow: visible !important;
      background: white !important;
      border-radius: 0 !important;
    }
    .modal-kardex-print-body {
      background: white !important;
      padding: 0 !important;
      overflow: visible !important;
    }
    .modal-kardex-print-sheet {
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
    }
    .kardex-tabla-print {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
    }
    .kardex-tabla-print th,
    .kardex-tabla-print td {
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }
    tr {
      page-break-inside: avoid !important;
    }
  }
`}</style>

 {/* ─── CABECERA FORMAL EXCLUSIVA PARA IMPRESIÓN DEL KARDEX (SOLO SE VE AL IMPRIMIR) ─── */}
 <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-black">
 <div className="flex justify-between items-start gap-4">
 <div>
 <h1 className="text-base font-black uppercase tracking-tight text-black ">
 {settings.businessName || 'SISTEMA DE FERRETERÍA & MATERIALES'}
 </h1>
 <p className="text-[11px] text-slate-700 font-semibold">
 {settings.businessRuc ? `RUC: ${settings.businessRuc}` : 'Control Oficial de Existencias & Almacén'}
 {settings.businessAddress ? ` • ${settings.businessAddress}` : ''}
 {sucursalActiva?.nombre ? ` • Sede: ${sucursalActiva.nombre}` : ''}
 </p>
 <h2 className="text-sm font-black text-slate-900 mt-1 uppercase">
 REPORTE OFICIAL DE MOVIMIENTOS DE KARDEX VALORIZADO
 </h2>
 </div>
 <div className="text-right text-[10px] text-slate-700 font-medium space-y-0.5">
 <div><strong className="text-slate-900">Emisión:</strong> {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
 <div><strong className="text-slate-900">Total Registros:</strong> {movimientos.length} movimientos</div>
 </div>
 </div>

 {/* Metadatos y filtros activos del reporte impreso */}
 <div className="mt-2.5 pt-2 border-t border-slate-300 grid grid-cols-3 gap-2 text-[10px]">
 <div>
 <span className="font-bold text-slate-500 uppercase text-[9px] block">Rango de Fechas:</span>
 <span className="font-bold text-slate-900">
 {fechaInicio ? `${fechaInicio} al ${fechaFin || 'Hoy'}` : 'Todo el Historial Registrado'}
 </span>
 </div>
 <div>
 <span className="font-bold text-slate-500 uppercase text-[9px] block">Filtro de Movimiento:</span>
 <span className="font-bold text-slate-900">
 {filtroTipo === 'TODOS' ? 'Todos los Tipos (Entradas, Salidas, Ajustes)' : filtroTipo}
 </span>
 </div>
 <div>
 <span className="font-bold text-slate-500 uppercase text-[9px] block">Búsqueda / Criterio:</span>
 <span className="font-bold text-slate-900">
 {busqueda ? `"${busqueda}"` : 'Todos los Artículos y Materiales'}
 </span>
 </div>
 </div>
 </div>

 {/* ─── PÍLDORAS DE FILTRO POR TIPO DE MOVIMIENTO (OCULTO EN IMPRESIÓN) ─── */}
 <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap print:hidden">
 <div className="flex items-center gap-1 flex-wrap">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
 Movimientos:
 </span>
 {[
 { id: 'TODOS', label: 'Todos' },
 { id: 'Entrada', label: 'Entradas (Ingresos)' },
 { id: 'Salida', label: 'Salidas (Ventas/Bajas)' },
 { id: 'Ajuste', label: 'Ajustes & Traslados' }
 ].map((t) => {
 const isSelected = filtroTipo === t.id;
 return (
 <button
 key={t.id}
 type="button"
 onClick={() => setFiltroTipo(t.id)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
 isSelected
 ? 'bg-indigo-600 text-white shadow-2xs font-black'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
 }`}
 >
 {t.label}
 </button>
 );
 })}
 </div>
 <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
 {movimientos.length} {movimientos.length === 1 ? 'movimiento' : 'movimientos'}
 </span>
 </div>

 {/* ─── BARRA DE HERRAMIENTAS, BÚSQUEDA Y FECHAS (OCULTO EN IMPRESIÓN) ─── */}
 <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5 print:hidden">
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
 <form onSubmit={handleBuscar} className="relative flex-1 sm:max-w-md">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar por material o código..."
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 {busqueda && (
 <button
 type="button"
 onClick={() => {
 setBusqueda('');
 cargarKardex();
 }}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </form>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setModalImprimir(true)}
 className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
 >
 <Printer className="w-3.5 h-3.5" />
 <span>Imprimir Kardex</span>
 </button>
 <button
 type="button"
 onClick={cargarKardex}
 className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
 title="Refrescar Kardex"
 >
 <RefreshCw className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Filtro por Fechas */}
 <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] font-bold text-slate-400 uppercase">Desde:</span>
 <input
 type="date"
 value={fechaInicio}
 onChange={(e) => setFechaInicio(e.target.value)}
 className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-semibold"
 />
 </div>
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] font-bold text-slate-400 uppercase">Hasta:</span>
 <input
 type="date"
 value={fechaFin}
 onChange={(e) => setFechaFin(e.target.value)}
 className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-semibold"
 />
 </div>
 {(fechaInicio || fechaFin || busqueda) && (
 <button
 type="button"
 onClick={limpiarFiltros}
 className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
 title="Limpiar filtros"
 >
 Limpiar
 </button>
 )}
 </div>
 </div>

 {/* ─── TABLA COMPACTA DEL KARDEX VALORIZADO ─── */}
 {cargando ? (
 <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
 <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
 <p className="text-xs font-bold text-slate-500">Cargando movimientos de existencias...</p>
 </div>
 ) : movimientos.length === 0 ? (
 <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
 <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
 <h4 className="text-sm font-black text-slate-700">No hay movimientos en el Kardex</h4>
 <p className="text-xs text-slate-400 mt-0.5">
 Cada venta POS, compra, ajuste o traslado registrado generará un movimiento automático aquí.
 </p>
 </div>
 ) : (
 <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden print:border print:border-slate-400 print:shadow-none print:overflow-visible print:rounded-none">
 <div className="overflow-x-auto print:overflow-visible">
 <table className="w-full text-left text-xs kardex-tabla-print print:text-[10px] print:w-full">
 <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10.5px] font-extrabold print:bg-slate-100 print:text-black print:border-b-2 print:border-slate-800">
 <tr>
 <th className="py-2.5 px-3.5 whitespace-nowrap print:py-1.5 print:px-2 print:text-[9.5px] print:text-black" style={{ width: '13%' }}>FECHA / HORA</th>
 <th className="py-2.5 px-3.5 min-w-[200px] print:min-w-0 print:py-1.5 print:px-2 print:text-[9.5px] print:text-black print:whitespace-normal" style={{ width: '25%' }}>MATERIAL / ARTÍCULO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap print:py-1.5 print:px-2 print:text-[9.5px] print:text-black" style={{ width: '10%' }}>TIPO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap print:py-1.5 print:px-2 print:text-[9.5px] print:text-black" style={{ width: '10%' }}>CANTIDAD</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap print:py-1.5 print:px-2 print:text-[9.5px] print:text-black" style={{ width: '12%' }}>VARIACIÓN</th>
 <th className="py-2.5 px-3.5 min-w-[220px] print:min-w-0 print:py-1.5 print:px-2 print:text-[9.5px] print:text-black print:whitespace-normal" style={{ width: '18%' }}>MOTIVO / DOCUMENTO</th>
 <th className="py-2.5 px-3.5 whitespace-nowrap print:py-1.5 print:px-2 print:text-[9.5px] print:text-black print:whitespace-normal" style={{ width: '12%' }}>USUARIO</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 print:divide-slate-300">
 {movimientos.map((m) => {
 const esEntrada = m.tipo === 'Entrada';
 const esSalida = m.tipo === 'Salida';
 const sAntes = parseFloat(m.stock_antes) || 0;
 const sDespues = parseFloat(m.stock_despues) || 0;

 return (
 <tr key={m.id} className="hover:bg-slate-50/80 transition-colors print:border-b print:border-slate-300">
 {/* Fecha / Hora */}
 <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700 font-semibold text-[11px] print:py-1.5 print:px-2 print:text-[9px] print:text-black">
 <div>{new Date(m.fecha).toLocaleDateString('es-PE')}</div>
 <div className="text-[10px] text-slate-400 font-normal print:text-slate-600 print:text-[8.5px]">
 {new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
 </div>
 </td>

 {/* Producto */}
 <td className="py-2.5 px-3.5 print:py-1.5 print:px-2 print:min-w-0">
 <div className="font-extrabold text-slate-900 leading-tight print:text-black print:text-[10px] break-words">
 {m.producto?.nombre || 'Producto Desconocido'}
 </div>
 <div className="text-[10px] text-slate-400 font-mono mt-0.5 print:text-slate-600 print:text-[8.5px]">
 {m.producto?.codigo_barras || 'S/C'} • {m.producto?.unidad_medida || 'UND'}
 </div>
 </td>

 {/* Tipo */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap print:py-1.5 print:px-2">
 <span
 className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border print:text-[9px] print:py-0.5 print:px-1.5 print:rounded-md ${
 esEntrada
 ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 print:bg-white print:text-emerald-950 print:border-emerald-600'
 : esSalida
 ? 'bg-rose-50 text-rose-800 border-rose-200/80 print:bg-white print:text-rose-950 print:border-rose-600'
 : 'bg-indigo-50 text-indigo-800 border-indigo-200/80 print:bg-white print:text-indigo-950 print:border-indigo-600'
 }`}
 >
 <span
 className={`w-1.5 h-1.5 rounded-full print:hidden ${
 esEntrada ? 'bg-emerald-500' : esSalida ? 'bg-rose-500' : 'bg-indigo-500'
 }`}
 />
 <span>{m.tipo}</span>
 </span>
 </td>

 {/* Cantidad Operada */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap print:py-1.5 print:px-2">
 <span className={`font-mono font-black text-xs print:text-[10px] ${
 esEntrada ? 'text-emerald-700 print:text-black font-extrabold' : esSalida ? 'text-rose-700 print:text-black font-extrabold' : 'text-indigo-700 print:text-black font-extrabold'
 }`}>
 {esEntrada ? '+' : esSalida ? '-' : ''}{parseFloat(m.cantidad)} {m.producto?.unidad_medida || 'UND'}
 </span>
 </td>

 {/* Variación Stock */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap print:py-1.5 print:px-2">
 <div className="flex items-center justify-center gap-1.5 font-mono text-xs print:text-[9.5px]">
 <span className="text-slate-400 font-medium print:text-slate-700">{sAntes}</span>
 <span className="text-slate-300 print:text-slate-500">→</span>
 <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 print:bg-white print:text-black print:border-slate-800 print:px-1">
 {sDespues}
 </span>
 </div>
 </td>

 {/* Motivo */}
 <td className="py-2.5 px-3.5 text-slate-700 text-[11px] print:py-1.5 print:px-2 print:text-[9.5px] print:text-black print:min-w-0">
 <span className="font-medium break-words">{m.motivo || 'Movimiento de inventario'}</span>
 </td>

 {/* Usuario */}
 <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 text-[11px] print:py-1.5 print:px-2 print:text-[9px] print:text-black print:whitespace-normal">
 <div className="flex items-center gap-1">
 <User className="w-3 h-3 text-slate-400 print:hidden" />
 <span className="break-words">{m.usuario?.nombre || 'Sistema'}</span>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* ─── PIE DE PÁGINA FORMAL EXCLUSIVO PARA IMPRESIÓN DEL KARDEX ─── */}
 <div className="hidden print:flex justify-between items-end pt-8 mt-6 border-t border-slate-300 text-[10px] text-slate-600">
 <div className="text-left space-y-1">
 <div>Documento de Auditoría y Control Físico de Existencias</div>
 <div>Generado por Sistema Ferretero • Registro Oficial de Kardex</div>
 </div>
 <div className="flex gap-16 text-center">
 <div className="border-t border-slate-800 pt-1 w-44">
 <strong className="text-slate-900">Responsable de Almacén</strong>
 </div>
 <div className="border-t border-slate-800 pt-1 w-44">
 <strong className="text-slate-900">Auditoría / Gerencia</strong>
 </div>
 </div>
 </div>
      {/* ─── MODAL DE VISTA PREVIA E IMPRESIÓN DEL KARDEX ─── */}
      {modalImprimir && typeof document !== 'undefined' && createPortal(
        <div className="modal-kardex-print-portal fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop con blur */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity print:hidden"
            onClick={() => setModalImprimir(false)}
            aria-hidden="true"
          />

          {/* Contenedor Centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto print:static print:p-0 print:overflow-visible"
            onClick={() => setModalImprimir(false)}
          >
            <div
              className="modal-kardex-print-container bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal (Oculto en Impresión) */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs print:hidden">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      Vista Previa de Impresión - Kardex
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Documento oficial de control de existencias y movimientos valorizados
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalImprimir(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                  title="Cerrar vista previa"
                >
                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Cuerpo del Modal con Hoja de Documento Imprimible */}
              <div className="modal-kardex-print-body flex-1 overflow-y-auto custom-modal-scroll p-3 sm:p-6 bg-slate-100/80 dark:bg-slate-950/60 print:bg-white print:p-0 print:overflow-visible">
                <div className="modal-kardex-print-sheet bg-white text-slate-900 rounded-2xl p-4 sm:p-7 shadow-sm border border-slate-200/90 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
                  {/* Encabezado Formal de Empresa */}
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 text-black">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                      <div>
                        <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-black">
                          {settings.businessName || 'SISTEMA DE FERRETERÍA & MATERIALES'}
                        </h1>
                        <p className="text-[11px] text-slate-700 font-semibold">
                          {settings.businessRuc ? `RUC: ${settings.businessRuc}` : 'Control Oficial de Existencias & Almacén'}
                          {settings.businessAddress ? ` • ${settings.businessAddress}` : ''}
                          {sucursalActiva?.nombre ? ` • Sede: ${sucursalActiva.nombre}` : ''}
                        </p>
                        <h2 className="text-xs sm:text-sm font-black text-slate-900 mt-1 uppercase">
                          REPORTE OFICIAL DE MOVIMIENTOS DE KARDEX VALORIZADO
                        </h2>
                      </div>
                      <div className="sm:text-right text-[10px] text-slate-700 font-medium space-y-0.5">
                        <div><strong className="text-slate-900">Emisión:</strong> {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div><strong className="text-slate-900">Total Registros:</strong> {movimientos.length} movimientos</div>
                      </div>
                    </div>

                    {/* Resumen de Filtros Aplicados */}
                    <div className="mt-3 pt-2.5 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                      <div className="bg-slate-50 print:bg-transparent p-2 rounded-lg border border-slate-200 print:border-none print:p-0">
                        <span className="font-bold text-slate-500 uppercase text-[9px] block">Rango de Fechas:</span>
                        <span className="font-bold text-slate-900">
                          {fechaInicio ? `${fechaInicio} al ${fechaFin || 'Hoy'}` : 'Todo el Historial Registrado'}
                        </span>
                      </div>
                      <div className="bg-slate-50 print:bg-transparent p-2 rounded-lg border border-slate-200 print:border-none print:p-0">
                        <span className="font-bold text-slate-500 uppercase text-[9px] block">Filtro de Movimiento:</span>
                        <span className="font-bold text-slate-900">
                          {filtroTipo === 'TODOS' ? 'Todos los Tipos (Entradas, Salidas, Ajustes)' : filtroTipo}
                        </span>
                      </div>
                      <div className="bg-slate-50 print:bg-transparent p-2 rounded-lg border border-slate-200 print:border-none print:p-0">
                        <span className="font-bold text-slate-500 uppercase text-[9px] block">Búsqueda / Criterio:</span>
                        <span className="font-bold text-slate-900">
                          {busqueda ? `"${busqueda}"` : 'Todos los Artículos y Materiales'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Movimientos */}
                  {movimientos.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl my-4">
                      <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No hay movimientos para los filtros seleccionados</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Prueba cambiando el rango de fechas o el tipo de movimiento.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto print:overflow-visible my-2">
                      <table className="w-full text-left text-xs kardex-tabla-print print:text-[10px]">
                        <thead className="bg-slate-100 border-b-2 border-slate-800 text-slate-800 uppercase tracking-wider text-[10px] font-extrabold print:bg-slate-100 print:text-black">
                          <tr>
                            <th className="py-2 px-2.5 whitespace-nowrap" style={{ width: '13%' }}>FECHA / HORA</th>
                            <th className="py-2 px-2.5 min-w-[180px] print:min-w-0" style={{ width: '25%' }}>MATERIAL / ARTÍCULO</th>
                            <th className="py-2 px-2.5 text-center whitespace-nowrap" style={{ width: '10%' }}>TIPO</th>
                            <th className="py-2 px-2.5 text-center whitespace-nowrap" style={{ width: '10%' }}>CANTIDAD</th>
                            <th className="py-2 px-2.5 text-center whitespace-nowrap" style={{ width: '12%' }}>VARIACIÓN</th>
                            <th className="py-2 px-2.5 min-w-[160px] print:min-w-0" style={{ width: '18%' }}>MOTIVO / DOC</th>
                            <th className="py-2 px-2.5 whitespace-nowrap" style={{ width: '12%' }}>USUARIO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {movimientos.map((m) => {
                            const esEntrada = m.tipo === 'Entrada';
                            const esSalida = m.tipo === 'Salida';
                            const sAntes = parseFloat(m.stock_antes) || 0;
                            const sDespues = parseFloat(m.stock_despues) || 0;

                            return (
                              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-200 print:border-slate-300">
                                <td className="py-2 px-2.5 whitespace-nowrap text-slate-700 font-semibold text-[11px] print:py-1.5 print:px-2 print:text-[9px] print:text-black">
                                  <div>{new Date(m.fecha).toLocaleDateString('es-PE')}</div>
                                  <div className="text-[10px] text-slate-500 font-normal print:text-[8.5px]">
                                    {new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 print:py-1.5 print:px-2">
                                  <div className="font-extrabold text-slate-900 leading-tight print:text-[10px] break-words">
                                    {m.producto?.nombre || 'Producto Desconocido'}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 print:text-[8.5px]">
                                    {m.producto?.codigo_barras || 'S/C'} • {m.producto?.unidad_medida || 'UND'}
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 text-center whitespace-nowrap print:py-1.5 print:px-2">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border print:text-[9px] ${
                                      esEntrada
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : esSalida
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                    }`}
                                  >
                                    <span>{m.tipo}</span>
                                  </span>
                                </td>
                                <td className="py-2 px-2.5 text-center whitespace-nowrap print:py-1.5 print:px-2">
                                  <span className={`font-mono font-black text-xs print:text-[10px] ${
                                    esEntrada ? 'text-emerald-700' : esSalida ? 'text-rose-700' : 'text-indigo-700'
                                  }`}>
                                    {esEntrada ? '+' : esSalida ? '-' : ''}{parseFloat(m.cantidad)} {m.producto?.unidad_medida || 'UND'}
                                  </span>
                                </td>
                                <td className="py-2 px-2.5 text-center whitespace-nowrap print:py-1.5 print:px-2">
                                  <div className="flex items-center justify-center gap-1.5 font-mono text-xs print:text-[9.5px]">
                                    <span className="text-slate-500 font-medium">{sAntes}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                                      {sDespues}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 text-slate-700 text-[11px] print:py-1.5 print:px-2 print:text-[9.5px]">
                                  <span className="font-medium break-words">{m.motivo || 'Movimiento de inventario'}</span>
                                </td>
                                <td className="py-2 px-2.5 whitespace-nowrap text-slate-600 text-[11px] print:py-1.5 print:px-2 print:text-[9px]">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400 print:hidden" />
                                    <span className="break-words">{m.usuario?.nombre || 'Sistema'}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Firmas de Auditoría */}
                  <div className="pt-8 mt-6 border-t border-slate-300 text-[10px] text-slate-600 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 sm:gap-4">
                    <div className="text-left space-y-1">
                      <div>Documento de Auditoría y Control Físico de Existencias</div>
                      <div>Generado por Sistema Ferretero • Registro Oficial de Kardex</div>
                    </div>
                    <div className="flex gap-8 sm:gap-16 text-center">
                      <div className="border-t border-slate-800 pt-1 w-36 sm:w-44">
                        <strong className="text-slate-900 block">Responsable de Almacén</strong>
                      </div>
                      <div className="border-t border-slate-800 pt-1 w-36 sm:w-44">
                        <strong className="text-slate-900 block">Auditoría / Gerencia</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie Fijo con Acciones (Oculto en Impresión) */}
              <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 z-20 print:hidden">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  {movimientos.length} movimientos listados • Orientación recomendada: Horizontal (Landscape)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalImprimir(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Mandar a Imprimir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    
 </div>
 );
}
