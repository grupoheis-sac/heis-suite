import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 Boxes,
 AlertTriangle,
 CheckCircle2,
 XCircle,
 TrendingUp,
 DollarSign,
 Search,
 RefreshCw,
 Sliders,
 Plus,
 Minus,
 Check,
 X,
 FileSpreadsheet,
 Printer,
 Package,
 Layers,
 ArrowRight,
 Filter,
 Edit2,
 Truck,
 MapPin,
 SlidersHorizontal,
 Info,
 ChevronDown
} from 'lucide-react';

export default function ControlStock() {
 const [, setSearchParams] = useSearchParams();
 const [resumen, setResumen] = useState(null);
 const [productos, setProductos] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'agotados' | 'bajos' | 'optimos'
 const [filtroUbicacion, setFiltroUbicacion] = useState('todas');
 const [dropdownUbicacionOpen, setDropdownUbicacionOpen] = useState(false);
 const [busquedaUbicacion, setBusquedaUbicacion] = useState('');
 const dropdownUbicacionRef = useRef(null);
 const [busqueda, setBusqueda] = useState('');

 // Cerrar dropdown de ubicaciones al hacer clic fuera
 useEffect(() => {
   const handleClickOutside = (e) => {
     if (dropdownUbicacionRef.current && !dropdownUbicacionRef.current.contains(e.target)) {
       setDropdownUbicacionOpen(false);
     }
   };
   document.addEventListener('mousedown', handleClickOutside);
   return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 // Modal Ajuste Rápido de Movimiento (Kardex)
 const [modalAjuste, setModalAjuste] = useState(false);
 const [productoSeleccionado, setProductoSeleccionado] = useState(null);
 const [tipoAjuste, setTipoAjuste] = useState('Entrada');
 const [cantidadAjuste, setCantidadAjuste] = useState('10');
 const [motivoAjuste, setMotivoAjuste] = useState('Reposición de stock en mostrador');
 const [guardandoAjuste, setGuardandoAjuste] = useState(false);

 // Modal Calibrar Umbral de Stock Mínimo In-Situ
 const [modalMinimo, setModalMinimo] = useState(false);
 const [productoMinimo, setProductoMinimo] = useState(null);
 const [nuevoStockMinimo, setNuevoStockMinimo] = useState('');
 const [guardandoMinimo, setGuardandoMinimo] = useState(false);

 // Bloquear scroll de fondo cuando cualquiera de los modales esté abierto
 useEffect(() => {
 if (modalAjuste || modalMinimo) {
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 return () => {
 document.body.style.overflow = originalOverflow;
 };
 }
 }, [modalAjuste, modalMinimo]);

 const cargarDatos = async () => {
 setCargando(true);
 try {
 const [resResumen, resProd] = await Promise.all([
 api.get('/inventario/resumen'),
 api.get('/productos?limit=250')
 ]);

 if (resResumen.success) {
 setResumen(resResumen.resumen);
 }
 if (resProd.success) {
 setProductos(resProd.productos || []);
 }
 } catch (e) {
 toast.error('Error al cargar datos de control de stock');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 const abrirAjusteRapido = (prod, tipoSugerido = 'Entrada') => {
 setProductoSeleccionado(prod);
 setTipoAjuste(tipoSugerido);
 setCantidadAjuste(tipoSugerido === 'Entrada' ? String(prod.stock_minimo || 10) : '1');
 setMotivoAjuste(
 tipoSugerido === 'Entrada'
 ? 'Reposición directa de almacén a tienda'
 : 'Merma o retiro por rotura'
 );
 setModalAjuste(true);
 };

 const abrirCalibrarMinimo = (prod) => {
 setProductoMinimo(prod);
 setNuevoStockMinimo(String(prod.stock_minimo ?? 5));
 setModalMinimo(true);
 };

 const handleGuardarAjuste = async (e) => {
 e.preventDefault();
 if (!productoSeleccionado) return;
 const cantNum = parseFloat(cantidadAjuste);
 if (!cantNum || cantNum <= 0) {
 return toast.error('Ingrese una cantidad válida mayor a 0');
 }

 setGuardandoAjuste(true);
 try {
 const res = await api.post('/inventario/ajuste', {
 id_producto: productoSeleccionado.id,
 tipo: tipoAjuste,
 cantidad: cantNum,
 motivo: motivoAjuste
 });

 if (res.success) {
 toast.success(res.message || 'Stock actualizado en Kardex');
 setModalAjuste(false);
 cargarDatos();
 }
 } catch (err) {
 toast.error(err.message || 'Error al registrar ajuste');
 } finally {
 setGuardandoAjuste(false);
 }
 };

 const handleGuardarStockMinimo = async (e) => {
 e.preventDefault();
 if (!productoMinimo) return;
 const val = parseFloat(nuevoStockMinimo);
 if (isNaN(val) || val < 0) {
 return toast.error('Ingresa un valor numérico válido mayor o igual a 0');
 }

 setGuardandoMinimo(true);
 try {
 await api.put(`/productos/${productoMinimo.id}`, { stock_minimo: val });
 toast.success(`Alerta de stock mínimo actualizada a ${val} para "${productoMinimo.nombre}"`);
 setModalMinimo(false);
 cargarDatos();
 } catch (err) {
 toast.error(err.message || 'Error al calibrar stock mínimo');
 } finally {
 setGuardandoMinimo(false);
 }
 };

 // Obtener lista única de ubicaciones registradas
 const ubicacionesDisponibles = Array.from(
 new Set(productos.map(p => (p.ubicacion || '').trim()).filter(Boolean))
 ).sort((a, b) => a.localeCompare(b));

 const ubicacionCounts = React.useMemo(() => {
   const map = {};
   productos.forEach(p => {
     const ub = (p.ubicacion || '').trim();
     if (ub) {
       map[ub] = (map[ub] || 0) + 1;
     }
   });
   return map;
 }, [productos]);

 const ubicacionesFiltradas = ubicacionesDisponibles.filter(ub =>
   !busquedaUbicacion.trim() || ub.toLowerCase().includes(busquedaUbicacion.toLowerCase().trim())
 );

 const productosFiltrados = productos.filter((p) => {
 const stock = parseFloat(p.stock) || 0;
 const min = parseFloat(p.stock_minimo) || 0;

 const matchBusq =
 !busqueda ||
 p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
 (p.codigo_barras && p.codigo_barras.toLowerCase().includes(busqueda.toLowerCase())) ||
 (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase())) ||
 (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
 (p.proveedor?.razon_social && p.proveedor.razon_social.toLowerCase().includes(busqueda.toLowerCase()));

 if (!matchBusq) return false;

 if (filtroEstado === 'agotados') return stock <= 0;
 if (filtroEstado === 'bajos') return stock > 0 && stock <= min;
 if (filtroEstado === 'optimos') return stock > min;

 if (filtroUbicacion !== 'todas') {
 if ((p.ubicacion || '').trim() !== filtroUbicacion) return false;
 }

 return true;
 });

 return (
 <div className="space-y-4">
 {/* ─── TARJETAS DE INDICADORES / KPIS VALORIZADOS ─── */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Inversión en Costo */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs hover:shadow-md hover:shadow-slate-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-slate-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors truncate min-w-0">
 Valorización Costo
 </span>
 <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-800 dark:group-hover:bg-slate-700 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-slate-600/25 transition-all duration-200">
 <DollarSign className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 S/ {Number(resumen?.valorCostoTotal || 0).toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Capital total invertido
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 shrink-0 whitespace-nowrap">
 En Almacén
 </span>
 </div>
 </div>

 {/* KPI 2: Valor Venta Proyectada */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Venta Proyectada
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <TrendingUp className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight truncate">
 S/ {Number(resumen?.valorVentaTotal || 0).toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Margen potencial
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 +{resumen?.margenPorcentaje || 0}%
 </span>
 </div>
 </div>

 {/* KPI 3: Quiebres de Stock (Agotados) */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'agotados' ? 'todos' : 'agotados')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'agotados'
 ? 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/25 shadow-md shadow-rose-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate min-w-0">
 Agotados (Quiebres)
 </span>
 <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-rose-600/25 transition-all duration-200">
 <XCircle className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight truncate">
 {resumen?.quiebresStock ?? 0}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Materiales con stock en 0
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/80 dark:border-rose-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'agotados' ? 'Activo' : 'Sin Stock'}
 </span>
 </div>
 </button>

 {/* KPI 4: Stock Bajo (Alerta de Reposición) */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'bajos' ? 'todos' : 'bajos')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'bajos'
 ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Stock Crítico
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <AlertTriangle className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {resumen?.stockBajo ?? 0}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Bajo stock mínimo
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'bajos' ? 'Activo' : 'Reponer'}
 </span>
 </div>
 </button>
 </div>

 {/* ─── PÍLDORAS DE FILTRO POR NIVEL DE STOCK & UBICACIONES ─── */}
 <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
 Nivel:
 </span>
 {[
 { id: 'todos', label: 'Todos', count: productos.length },
 { id: 'agotados', label: 'Agotados', count: resumen?.quiebresStock || 0 },
 { id: 'bajos', label: 'Stock Bajo', count: resumen?.stockBajo || 0 },
 { id: 'optimos', label: 'Óptimos', count: resumen?.stockOptimo || 0 }
 ].map(f => {
 const isSelected = filtroEstado === f.id;
 return (
 <button
 key={f.id}
 type="button"
 onClick={() => setFiltroEstado(f.id)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
 isSelected
 ? 'bg-indigo-600 text-white shadow-2xs font-black'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
 }`}
 >
 <span>{f.label}</span>
 <span
 className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
 isSelected
 ? 'bg-white/25 text-white'
 : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
 }`}
 >
 {f.count}
 </span>
 </button>
 );
 })}

 {/* Separador y Píldora Desplegable de Ubicación */}
 {ubicacionesDisponibles.length > 0 && (
 <div className="relative pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-700" ref={dropdownUbicacionRef}>
   <button
     type="button"
     onClick={() => {
       setDropdownUbicacionOpen(prev => !prev);
       setBusquedaUbicacion('');
     }}
     className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
       filtroUbicacion !== 'todas'
         ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-xs font-black'
         : dropdownUbicacionOpen
         ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
         : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 border-slate-200/70 dark:border-slate-700/80'
     }`}
     title="Filtrar por ubicación"
   >
     <MapPin className={`w-3.5 h-3.5 shrink-0 ${filtroUbicacion !== 'todas' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
     <span className="max-w-[130px] sm:max-w-[180px] truncate">
       {filtroUbicacion === 'todas' ? 'Todas las ubicaciones' : filtroUbicacion}
     </span>

     {filtroUbicacion !== 'todas' ? (
       <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-mono bg-white/25 text-white">
         {ubicacionCounts[filtroUbicacion] || 0}
       </span>
     ) : (
       <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-mono bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
         {ubicacionesDisponibles.length}
       </span>
     )}

     {filtroUbicacion !== 'todas' && (
       <span
         onClick={(e) => {
           e.stopPropagation();
           setFiltroUbicacion('todas');
           setDropdownUbicacionOpen(false);
         }}
         className="p-0.5 rounded-full hover:bg-white/30 text-white transition-colors cursor-pointer ml-0.5"
         title="Quitar filtro de ubicación"
       >
         <X className="w-3 h-3" />
       </span>
     )}

     <ChevronDown
       className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
         dropdownUbicacionOpen ? 'rotate-180' : ''
       }`}
     />
   </button>

   {/* Menú Desplegable Flotante */}
   {dropdownUbicacionOpen && (
     <div
       onClick={(e) => e.stopPropagation()}
       className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 bg-white/95 dark:bg-[#0c1324]/95 backdrop-blur-2xl rounded-2xl border border-slate-200/90 dark:border-white/[0.09] shadow-2xl dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.85)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none ring-1 ring-slate-900/5 dark:ring-white/[0.06] cursor-default text-slate-800 dark:text-slate-100"
     >
       {/* Buscador interno si hay más de 4 ubicaciones */}
       {ubicacionesDisponibles.length > 4 && (
         <div className="relative mb-1.5 px-0.5">
           <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
           <input
             type="text"
             placeholder="Buscar ubicación..."
             value={busquedaUbicacion}
             onChange={(e) => setBusquedaUbicacion(e.target.value)}
             className="w-full pl-7 pr-6 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
             autoFocus
           />
           {busquedaUbicacion && (
             <button
               type="button"
               onClick={() => setBusquedaUbicacion('')}
               className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
             >
               <X className="w-3 h-3" />
             </button>
           )}
         </div>
       )}

       {/* Opción 'Todas las ubicaciones' dentro del dropdown */}
       <button
         type="button"
         onClick={() => {
           setFiltroUbicacion('todas');
           setDropdownUbicacionOpen(false);
         }}
         className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
           filtroUbicacion === 'todas'
             ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-extrabold ring-1 ring-indigo-300 dark:ring-indigo-500/50'
             : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
         }`}
       >
         <div className="flex items-center gap-2 min-w-0">
           <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
           <span className="truncate font-semibold">Todas las ubicaciones</span>
         </div>
         <div className="flex items-center gap-1.5 shrink-0">
           <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
             {productos.length}
           </span>
           {filtroUbicacion === 'todas' && (
             <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
           )}
         </div>
       </button>

       <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

       {/* Lista scrollable de ubicaciones */}
       <div className="max-h-56 overflow-y-auto custom-modal-scroll space-y-0.5 pr-0.5">
         {ubicacionesFiltradas.length === 0 ? (
           <div className="py-4 text-center text-xs text-slate-400">
             No se encontró ninguna ubicación
           </div>
         ) : (
           ubicacionesFiltradas.map((ub) => {
             const isSelected = filtroUbicacion === ub;
             const count = ubicacionCounts[ub] || 0;
             return (
               <button
                 key={ub}
                 type="button"
                 onClick={() => {
                   setFiltroUbicacion(ub);
                   setDropdownUbicacionOpen(false);
                 }}
                 className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                   isSelected
                     ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-extrabold ring-1 ring-indigo-300 dark:ring-indigo-500/50'
                     : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                 }`}
               >
                 <span className="truncate pr-2 font-medium">{ub}</span>
                 <div className="flex items-center gap-1.5 shrink-0">
                   <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                     {count}
                   </span>
                   {isSelected && (
                     <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                   )}
                 </div>
               </button>
             );
           })
         )}
       </div>
     </div>
   )}
 </div>
 )}
 </div>

 <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
 {productosFiltrados.length} {productosFiltrados.length === 1 ? 'artículo' : 'artículos'}
 </span>
 </div>

 {/* ─── BARRA DE BÚSQUEDA ─── */}
 <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3">
 <div className="relative flex-1 sm:max-w-md">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar por código, material, marca o proveedor..."
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 {busqueda && (
 <button
 type="button"
 onClick={() => setBusqueda('')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 {/* ─── TABLA COMPACTA DE CONTROL DE EXISTENCIAS ─── */}
 {cargando ? (
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
 <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
 <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Calculando valorización y niveles de stock...</p>
 </div>
 ) : productosFiltrados.length === 0 ? (
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
 <Boxes className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
 <h4 className="text-sm font-black text-slate-700 dark:text-slate-200">No se encontraron productos</h4>
 <p className="text-xs text-slate-400 mt-0.5">No hay existencias que coincidan con el filtro actual.</p>
 </div>
 ) : (
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10.5px] font-extrabold">
 <tr>
 <th className="py-2.5 px-3.5 whitespace-nowrap">CÓDIGO</th>
 <th className="py-2.5 px-3.5 min-w-[220px]">MATERIAL & PROVEEDOR</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">UNIDAD</th>
 <th className="py-2.5 px-3.5 text-right whitespace-nowrap">COSTO UNIT.</th>
 <th className="py-2.5 px-3.5 text-right whitespace-nowrap">VALORIZADO (COSTO)</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">NIVEL / UMBRAL</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ESTADO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {productosFiltrados.map((p) => {
 const stockNum = parseFloat(p.stock) || 0;
 const minNum = parseFloat(p.stock_minimo) || 0;
 const pCompra = parseFloat(p.precio_compra) || 0;
 const valorTotalCosto = stockNum * pCompra;

 const esAgotado = stockNum <= 0;
 const esCritico = !esAgotado && stockNum <= minNum;
 
 // Porcentaje visual respecto al stock mínimo (ej. 100% si está en el mínimo)
 const porcentaje = minNum > 0 ? Math.min(100, Math.round((stockNum / (minNum * 2)) * 100)) : 100;

 return (
 <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
 {/* Código */}
 <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-300">
 {p.codigo_barras ? (
 <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200/60 dark:border-slate-700">
 {p.codigo_barras}
 </span>
 ) : (
 <span className="text-slate-400 italic">S/C</span>
 )}
 </td>

 {/* Nombre, Ubicación y Proveedor */}
 <td className="py-2.5 px-3.5">
 <div className="font-extrabold text-slate-900 dark:text-white leading-tight">
 {p.nombre}
 </div>
 <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
 <span>{p.categoria?.nombre || 'General'}</span>
 {p.ubicacion && (
 <>
 <span>•</span>
 <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
 <MapPin className="w-2.5 h-2.5 inline" />
 {p.ubicacion}
 </span>
 </>
 )}
 {p.proveedor && (
 <>
 <span>•</span>
 <span className="text-slate-500 dark:text-slate-400 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200/60 dark:border-slate-700">
 <Truck className="w-2.5 h-2.5 text-emerald-600" />
 <span className="font-semibold">{p.proveedor.razon_social}</span>
 </span>
 </>
 )}
 </div>
 </td>

 {/* Unidad */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
 {p.unidad_medida || 'Unidad'}
 </td>

 {/* Costo Unitario */}
 <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
 S/ {pCompra.toFixed(2)}
 </td>

 {/* Valorizado a Costo */}
 <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
 S/ {valorTotalCosto.toFixed(2)}
 </td>

 {/* Nivel / Barra de Progreso y Calibración In-situ */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap min-w-[150px]">
 <div className="flex items-center gap-2 justify-center">
 <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/70 dark:border-slate-700">
 <div
 className={`h-full rounded-full transition-all ${
 esAgotado
 ? 'bg-rose-500 w-0'
 : esCritico
 ? 'bg-amber-500'
 : 'bg-emerald-500'
 }`}
 style={{ width: `${esAgotado ? 0 : porcentaje}%` }}
 />
 </div>
 <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-[11px] flex items-center">
 {stockNum}
 <button
 type="button"
 onClick={() => abrirCalibrarMinimo(p)}
 className="ml-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5 group"
 title="Calibrar alerta de stock mínimo"
 >
 <span>/ min {minNum}</span>
 <Edit2 className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
 </button>
 </span>
 </div>
 </td>

 {/* Estado */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span
 className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
 esAgotado
 ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800'
 : esCritico
 ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
 : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
 }`}
 >
 <span
 className={`w-1.5 h-1.5 rounded-full ${
 esAgotado ? 'bg-rose-500' : esCritico ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
 }`}
 />
 <span>{esAgotado ? 'Agotado' : esCritico ? 'Stock Bajo' : 'Óptimo'}</span>
 </span>
 </td>

 {/* Acciones Rápidas */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <div className="flex items-center justify-center gap-1">
 <button
 type="button"
 onClick={() => setSearchParams({ tab: 'kardex', busqueda: p.nombre })}
 className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
 title="Ver Historial Kardex"
 >
 <Layers className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => abrirAjusteRapido(p, 'Entrada')}
 className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 font-bold text-[10.5px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
 title="Reponer Stock Rápidamente (Kardex)"
 >
 <Plus className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
 <span>Reponer</span>
 </button>
 <button
 type="button"
 onClick={() => abrirAjusteRapido(p, 'Salida')}
 className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
 title="Ajuste de Salida / Merma"
 >
 <Minus className="w-3.5 h-3.5" />
 </button>
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

 {/* ─── MODAL AJUSTE RÁPIDO DE STOCK (KARDEX) ─── */}
 {modalAjuste && productoSeleccionado && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-y-auto">
 {/* Backdrop estático e independiente */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalAjuste(false)}
 aria-hidden="true"
 />

 {/* Contenedor de scroll y centrado */}
 <div
 className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center cursor-pointer"
 onClick={() => setModalAjuste(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden my-6 flex flex-col text-left relative z-10 cursor-default animate-in zoom-in-95 duration-200"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
 <div className="flex items-center gap-2.5">
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs ${
 tipoAjuste === 'Entrada' ? 'bg-emerald-600' : 'bg-rose-600'
 }`}>
 {tipoAjuste === 'Entrada' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
 </div>
 <div>
 <h3 className="text-sm font-black text-slate-900 dark:text-white">
 Ajuste Rápido de Stock
 </h3>
 <p className="text-[11px] text-slate-400 font-medium">
 Registro oficial en el historial de Kardex
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalAjuste(false)}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation">
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 </button>
 </div>

 <form onSubmit={handleGuardarAjuste} className="p-5 space-y-3.5">
 {/* Resumen del Producto */}
 <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
 <span className="text-[10px] font-bold uppercase text-slate-400">Material Seleccionado:</span>
 <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{productoSeleccionado.nombre}</h4>
 <div className="flex items-center justify-between mt-1 text-xs">
 <span className="text-slate-500 dark:text-slate-400">Stock actual en sistema:</span>
 <span className="font-mono font-black text-indigo-700 dark:text-indigo-400">
 {productoSeleccionado.stock} {productoSeleccionado.unidad_medida}
 </span>
 </div>
 </div>

 {/* Selector de Tipo de Operación */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Movimiento</label>
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => setTipoAjuste('Entrada')}
 className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
 tipoAjuste === 'Entrada'
 ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
 }`}
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Ingreso / Reposición</span>
 </button>
 <button
 type="button"
 onClick={() => setTipoAjuste('Salida')}
 className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
 tipoAjuste === 'Salida'
 ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
 }`}
 >
 <Minus className="w-3.5 h-3.5" />
 <span>Salida / Merma</span>
 </button>
 </div>
 </div>

 {/* Cantidad */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Cantidad ({productoSeleccionado.unidad_medida}) <span className="text-rose-500">*</span>
 </label>
 <input
 type="number"
 step="0.01"
 required
 min="0.01"
 value={cantidadAjuste}
 onChange={(e) => setCantidadAjuste(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>

 {/* Motivo */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Motivo / Observación
 </label>
 <input
 type="text"
 required
 value={motivoAjuste}
 onChange={(e) => setMotivoAjuste(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>

 <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setModalAjuste(false)}
 className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={guardandoAjuste}
 className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
 >
 <Check className="w-3.5 h-3.5" />
 <span>{guardandoAjuste ? 'Guardando...' : 'Confirmar en Kardex'}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>,
 document.body
 )}

 {/* ─── MODAL CALIBRAR STOCK MÍNIMO IN-SITU ─── */}
 {modalMinimo && productoMinimo && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-y-auto">
 {/* Backdrop estático e independiente */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalMinimo(false)}
 aria-hidden="true"
 />

 {/* Contenedor de scroll y centrado */}
 <div
 className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center cursor-pointer"
 onClick={() => setModalMinimo(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden my-6 flex flex-col text-left relative z-10 cursor-default animate-in zoom-in-95 duration-200"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
 <SlidersHorizontal className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-black text-slate-900 dark:text-white">
 Calibrar Alerta Mínima
 </h3>
 <p className="text-[11px] text-slate-400 font-medium">
 Umbral de reposición automática
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalMinimo(false)}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation">
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 </button>
 </div>

 <form onSubmit={handleGuardarStockMinimo} className="p-5 space-y-3.5">
 <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
 <span className="text-[10px] font-bold uppercase text-slate-400">Artículo:</span>
 <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{productoMinimo.nombre}</h4>
 <div className="flex items-center justify-between mt-1 text-xs">
 <span className="text-slate-500 dark:text-slate-400">Stock físico actual:</span>
 <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
 {productoMinimo.stock} {productoMinimo.unidad_medida}
 </span>
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Nuevo Umbral Mínimo ({productoMinimo.unidad_medida}) <span className="text-rose-500">*</span>
 </label>
 <input
 type="number"
 step="any"
 required
 min="0"
 placeholder="5"
 value={nuevoStockMinimo}
 onChange={(e) => setNuevoStockMinimo(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-600 text-sm font-mono font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
 autoFocus
 />
 <span className="text-[10px] text-slate-400 mt-1 block">
 Cuando las existencias sean iguales o inferiores a este número, se encenderá la alerta de Stock Bajo.
 </span>
 </div>

 <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setModalMinimo(false)}
 className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={guardandoMinimo}
 className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
 >
 <Check className="w-3.5 h-3.5" />
 <span>{guardandoMinimo ? 'Guardando...' : 'Aplicar Umbral'}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>,
 document.body
 )}
 </div>
 );
}
