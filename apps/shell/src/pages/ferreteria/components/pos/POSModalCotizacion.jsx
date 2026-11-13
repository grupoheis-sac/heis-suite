/**
 * POSModalCotizacion.jsx — Cargar Cotizaciones / Proformas en el POS
 * Permite buscar cotizaciones previas emitidas a maestros de obra, empresas o particulares
 * y volcarlas al carrito en 1 solo clic con atajo [F6].
 */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
 X,
 FileSpreadsheet,
 Search,
 Calendar,
 User,
 Package,
 ArrowRight,
 CheckCircle2,
 Clock,
 AlertTriangle,
 RotateCcw
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function POSModalCotizacion({
 visible,
 onClose,
 onCargarCotizacion
}) {
 const [cotizaciones, setCotizaciones] = useState([]);
 const [cargando, setCargando] = useState(false);
 const [busqueda, setBusqueda] = useState('');
 const [filtroEstado, setFiltroEstado] = useState('Pendiente'); // 'Todas', 'Pendiente', 'Aprobada'

 const cargarCotizaciones = async () => {
 setCargando(true);
 try {
 const res = await api.get('/cotizaciones');
 if (res.success) {
 setCotizaciones(res.cotizaciones || []);
 }
 } catch (err) {
 toast.error('Error al cargar la lista de cotizaciones');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 if (visible) {
 setBusqueda('');
 cargarCotizaciones();
 }
 }, [visible]);

 const cotizacionesFiltradas = useMemo(() => {
 return cotizaciones.filter((c) => {
 // Filtro de estado
 if (filtroEstado !== 'Todas' && c.estado !== filtroEstado) {
 return false;
 }

 // Filtro de búsqueda
 if (!busqueda.trim()) return true;
 const q = busqueda.toLowerCase().trim();
 const numMatch = (c.numero || '').toLowerCase().includes(q);
 const cliMatch = (c.cliente?.nombre || '').toLowerCase().includes(q);
 const docMatch = (c.cliente?.numero_documento || '').includes(q);

 return numMatch || cliMatch || docMatch;
 });
 }, [cotizaciones, filtroEstado, busqueda]);

 if (!visible) return null;

 const modalJSX = (
 <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
 <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col my-auto max-h-[90vh] soft-card-shadow">
 {/* Header */}
 <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
 <div className="flex items-center gap-2.5">
 <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
 <FileSpreadsheet className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 ">
 Cargar Cotización / Proforma
 </h3>
 <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black font-mono">
 [F6]
 </span>
 </div>
 <p className="text-[11px] text-slate-400 font-medium">
 Seleccione una proforma guardada para facturar o generar boleta al instante
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 touch-manipulation"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Buscador y Filtros */}
 <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
 <div className="flex gap-2">
 <div className="relative flex-1">
 <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por número (#COT-...), cliente o DNI/RUC..."
 className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
 />
 </div>
 <button
 type="button"
 onClick={cargarCotizaciones}
 disabled={cargando}
 className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
 title="Refrescar lista"
 >
 <RotateCcw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
 </button>
 </div>

 <div className="flex items-center gap-1.5">
 <span className="text-[11px] font-bold text-slate-400 mr-1">Filtrar por:</span>
 {['Pendiente', 'Aceptada', 'Todas'].map((estado) => (
 <button
 key={estado}
 type="button"
 onClick={() => setFiltroEstado(estado)}
 className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
 filtroEstado === estado
 ? 'bg-indigo-600 text-white shadow-xs'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
 }`}
 >
 {estado === 'Pendiente' ? '⏳ Pendientes' : estado === 'Aceptada' ? '✅ Aceptadas' : '📋 Todas'}
 </button>
 ))}
 </div>
 </div>

 {/* Lista de Cotizaciones */}
 <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-modal-scroll">
 {cargando ? (
 <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
 <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <p className="text-xs font-bold ">Cargando cotizaciones...</p>
 </div>
 ) : cotizacionesFiltradas.length === 0 ? (
 <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
 <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
 <FileSpreadsheet className="w-7 h-7" />
 </div>
 <p className="text-sm font-bold text-slate-700 dark:text-slate-200 ">
 No se encontraron cotizaciones
 </p>
 <p className="text-xs text-slate-400 mt-1 max-w-sm">
 {busqueda
 ? 'No hay resultados que coincidan con su búsqueda.'
 : `No hay cotizaciones con estado "${filtroEstado}". Puede crear una nueva desde el módulo de Cotizaciones.`}
 </p>
 </div>
 ) : (
 cotizacionesFiltradas.map((cot) => {
 const cantItems = cot.detalles?.length || 0;
 const esPendiente = cot.estado === 'Pendiente';
 const esAprobada = cot.estado === 'Aprobada';

 return (
 <div
 key={cot.id}
 className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition-all soft-card-shadow group"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-800">
 <div className="flex items-center gap-2">
 <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
 {cot.numero}
 </span>
 <span
 className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
 esPendiente
 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
 : esAprobada
 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
 : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
 }`}
 >
 {cot.estado}
 </span>
 </div>

 <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
 <Calendar className="w-3.5 h-3.5" />
 <span>{cot.created_at ? new Date(cot.created_at).toLocaleDateString('es-PE') : 'Reciente'}</span>
 {cot.validez_dias && (
 <span className="text-slate-500">({cot.validez_dias} días validez)</span>
 )}
 </div>
 </div>

 {/* Datos del Cliente y Previsualización de Items */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
 <div>
 <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
 <User className="w-3 h-3 text-indigo-500" /> Cliente
 </span>
 <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
 {cot.cliente?.nombre || 'Público General'}
 </p>
 {cot.cliente?.numero_documento && (
 <p className="text-[11px] text-slate-400 font-mono">
 DOC: {cot.cliente.numero_documento}
 </p>
 )}
 </div>

 <div>
 <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
 <Package className="w-3 h-3 text-indigo-500" /> Contenido ({cantItems} items)
 </span>
 <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
 {cot.detalles?.map((d) => d.producto?.nombre || 'Producto').slice(0, 2).join(', ')}
 {cantItems > 2 ? ` y +${cantItems - 2} más` : ''}
 </p>
 </div>
 </div>

 {/* Footer de Tarjeta con Total y Botón Cargar */}
 <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800">
 <div>
 <span className="text-[10px] uppercase font-bold text-slate-400 block ">
 Total Cotizado
 </span>
 <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
 S/ {parseFloat(cot.total || 0).toFixed(2)}
 </span>
 </div>

 <button
 type="button"
 onClick={() => onCargarCotizacion(cot)}
 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-indigo-600/30 cursor-pointer "
 >
 <span>Cargar al Carrito</span>
 <ArrowRight className="w-4 h-4 stroke-[2.5]" />
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>
 );

 return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
