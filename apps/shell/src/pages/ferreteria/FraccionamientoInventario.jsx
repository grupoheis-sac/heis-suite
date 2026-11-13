import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 Scissors,
 Package,
 Layers,
 ArrowRight,
 Check,
 Search,
 RefreshCw,
 Plus,
 Boxes,
 Sparkles,
 TrendingUp,
 AlertCircle,
 Clock,
 User,
 CheckCircle2,
 Sliders,
 DollarSign,
 Scale,
 Zap,
 Info
} from 'lucide-react';

export default function FraccionamientoInventario() {
 const [, setSearchParams] = useSearchParams();
 const [productos, setProductos] = useState([]);
 const [historial, setHistorial] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [guardando, setGuardando] = useState(false);

 // Formulario de Despiece / Fraccionamiento
 const [prodOrigenId, setProdOrigenId] = useState('');
 const [prodDestinoId, setProdDestinoId] = useState('');
 const [cantidadOrigen, setCantidadOrigen] = useState('1');
 const [factorConversion, setFactorConversion] = useState('100');
 const [motivoPersonalizado, setMotivoPersonalizado] = useState('');

 // Buscadores interactivos
 const [busqOrigen, setBusqOrigen] = useState('');
 const [mostrarDropOrigen, setMostrarDropOrigen] = useState(false);
 const [busqDestino, setBusqDestino] = useState('');
 const [mostrarDropDestino, setMostrarDropDestino] = useState(false);

 // Vista activa: 'operacion' | 'historial'
 const [vistaActiva, setVistaActiva] = useState('operacion');

 // Plantillas de conversión rápida típicas de mostrador ferretero
 const PLANTILLAS_FERRETERIA = [
 {
 id: 'cable',
 titulo: 'Rollo de Cable ➔ Metros',
 descripcion: 'Desempaque de bobina de 100m para venta lineal en mostrador',
 factor: 100,
 unidadOrigen: 'Rollo',
 unidadDestino: 'Metro',
 icon: Zap,
 color: 'amber'
 },
 {
 id: 'clavos',
 titulo: 'Caja de Clavos ➔ Kilos',
 descripcion: 'Apertura de caja matriz (25 o 30 kg) a granel por kilo',
 factor: 25,
 unidadOrigen: 'Caja',
 unidadDestino: 'Kilo',
 icon: Scale,
 color: 'indigo'
 },
 {
 id: 'thinner',
 titulo: 'Cilindro Solvente ➔ Galones',
 descripcion: 'Dispensación de tambor de 55 galones a envases de mostrador',
 factor: 55,
 unidadOrigen: 'Cilindro',
 unidadDestino: 'Galón',
 icon: Scissors,
 color: 'emerald'
 },
 {
 id: 'tornillos',
 titulo: 'Caja Tornillos ➔ Cientos / Unid.',
 descripcion: 'Fraccionar cajas de 1000 unidades a paquetes sueltos',
 factor: 1000,
 unidadOrigen: 'Caja',
 unidadDestino: 'Unidad',
 icon: Boxes,
 color: 'purple'
 }
 ];

 const cargarDatos = async () => {
 setCargando(true);
 try {
 const [resProd, resHist] = await Promise.all([
 api.get('/productos?limit=250'),
 api.get('/inventario/fraccionamientos').catch(() => ({ success: false, fraccionamientos: [] }))
 ]);

 if (resProd.success) {
 setProductos(resProd.productos || []);
 }
 if (resHist.success) {
 setHistorial(resHist.fraccionamientos || []);
 }
 } catch (e) {
 toast.error('Error al cargar datos de inventario');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 const prodOrigenSel = productos.find(p => String(p.id) === String(prodOrigenId));
 const prodDestinoSel = productos.find(p => String(p.id) === String(prodDestinoId));

 const cantOrigenNum = parseFloat(cantidadOrigen) || 0;
 const factorNum = parseFloat(factorConversion) || 1;
 const cantidadResultante = (cantOrigenNum * factorNum);

 // Costo derivado por unidad fraccionada
 const costoOrigen = prodOrigenSel ? parseFloat(prodOrigenSel.precio_compra) : 0;
 const costoFraccionadoDerivado = factorNum > 0 ? (costoOrigen / factorNum) : 0;

 // Sugerencia de ganancia o margen
 const precioVentaDestino = prodDestinoSel ? parseFloat(prodDestinoSel.precio_venta) : 0;
 const ingresoProyectado = precioVentaDestino * cantidadResultante;
 const precioVentaOrigen = prodOrigenSel ? parseFloat(prodOrigenSel.precio_venta) : 0;
 const ingresoOrigenOriginal = precioVentaOrigen * cantOrigenNum;
 const margenExtra = (ingresoProyectado > ingresoOrigenOriginal && ingresoOrigenOriginal > 0)
 ? (((ingresoProyectado - ingresoOrigenOriginal) / ingresoOrigenOriginal) * 100).toFixed(0)
 : null;

 const aplicarPlantilla = (p) => {
 setFactorConversion(String(p.factor));
 // Intentar buscar productos sugeridos
 const candidatoOrigen = productos.find(prod =>
 (prod.unidad_medida || '').toLowerCase().includes(p.unidadOrigen.toLowerCase()) ||
 (prod.nombre || '').toLowerCase().includes(p.id)
 );
 if (candidatoOrigen) {
 setProdOrigenId(candidatoOrigen.id);
 setBusqOrigen(candidatoOrigen.nombre);
 }

 const candidatoDestino = productos.find(prod =>
 (prod.unidad_medida || '').toLowerCase().includes(p.unidadDestino.toLowerCase()) &&
 (candidatoOrigen ? prod.nombre.toLowerCase().includes(candidatoOrigen.nombre.split(' ')[0].toLowerCase()) : true)
 );
 if (candidatoDestino) {
 setProdDestinoId(candidatoDestino.id);
 setBusqDestino(candidatoDestino.nombre);
 }

 toast.success(`Plantilla "${p.titulo}" aplicada (Factor 1 = ${p.factor})`);
 };

 const handleEjecutarFraccionamiento = async (e) => {
 e.preventDefault();

 if (!prodOrigenId) {
 return toast.error('Selecciona el producto matriz / origen');
 }
 if (!prodDestinoId) {
 return toast.error('Selecciona el producto fraccionado / destino');
 }
 if (prodOrigenId === prodDestinoId) {
 return toast.error('El producto de origen y destino no pueden ser el mismo');
 }
 if (cantOrigenNum <= 0) {
 return toast.error('Ingresa una cantidad de origen válida');
 }
 if (factorNum <= 0) {
 return toast.error('El factor de conversión debe ser mayor a cero');
 }

 if (prodOrigenSel && (parseFloat(prodOrigenSel.stock) || 0) < cantOrigenNum) {
 return toast.error(`Stock insuficiente en ${prodOrigenSel.nombre}. Disponible: ${prodOrigenSel.stock}`);
 }

 setGuardando(true);
 try {
 const res = await api.post('/inventario/fraccionar', {
 id_producto_origen: prodOrigenId,
 id_producto_destino: prodDestinoId,
 cantidad_origen: cantOrigenNum,
 factor_conversion: factorNum,
 cantidad_destino: cantidadResultante,
 motivo: motivoPersonalizado.trim() || undefined
 });

 if (res.success) {
 toast.success(res.message || 'Fraccionamiento asentado con éxito en Kardex');
 setProdOrigenId('');
 setProdDestinoId('');
 setBusqOrigen('');
 setBusqDestino('');
 setCantidadOrigen('1');
 setMotivoPersonalizado('');
 cargarDatos();
 }
 } catch (err) {
 toast.error(err.message || 'Error al procesar el fraccionamiento');
 } finally {
 setGuardando(false);
 }
 };

 return (
 <div className="space-y-4">
 {/* ─── TARJETAS DE INDICADORES / KPIS DE FRACCIONAMIENTO & MENUDEO ─── */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Operaciones Realizadas / Historial */}
 <button
 type="button"
 onClick={() => setVistaActiva('historial')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 vistaActiva === 'historial'
 ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Despieces Totales
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <Scissors className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {historial.length}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Aperturas registradas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 {vistaActiva === 'historial' ? 'Activo' : 'En Kardex'}
 </span>
 </div>
 </button>

 {/* KPI 2: Rollos / Empaques Matrices */}
 <button
 type="button"
 onClick={() => setVistaActiva('operacion')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 vistaActiva === 'operacion'
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/25 shadow-md shadow-indigo-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Empaques Matrices
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <Package className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight truncate">
 {productos.filter(p => {
 const u = (p.unidad_medida || '').toLowerCase();
 return u.includes('rollo') || u.includes('caja') || u.includes('cilindro') || u.includes('saco') || u.includes('paquete');
 }).length}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Rollos, cajas y sacos
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Matrices
 </span>
 </div>
 </button>

 {/* KPI 3: Artículos de Venta a Granel */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Venta Suelta / Granel
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <Scale className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {productos.filter(p => {
 const u = (p.unidad_medida || '').toLowerCase();
 return u.includes('metro') || u.includes('kilo') || u.includes('galon') || u.includes('litro');
 }).length}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Metros, kilos y galones
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 Fraccionados
 </span>
 </div>
 </div>

 {/* KPI 4: Rentabilidad en Menudeo */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 shadow-2xs hover:shadow-md hover:shadow-purple-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate min-w-0">
 Margen Adicional Prom.
 </span>
 <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100/80 dark:border-purple-800/60 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-purple-600/25 transition-all duration-200">
 <TrendingUp className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight truncate">
 +28.5%
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Ganancia extra menudeo
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200/80 dark:border-purple-800/60 shrink-0 whitespace-nowrap">
 Rentabilidad
 </span>
 </div>
 </div>
 </div>

 {/* ─── SELECTOR DE PESTAÑAS INTERNAS: OPERACIÓN VS HISTORIAL ─── */}
 <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
 <button
 type="button"
 onClick={() => setVistaActiva('operacion')}
 className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
 vistaActiva === 'operacion'
 ? 'bg-indigo-600 text-white shadow-2xs'
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <Scissors className="w-3.5 h-3.5" />
 <span>Nueva Operación de Fraccionamiento</span>
 </button>

 <button
 type="button"
 onClick={() => setVistaActiva('historial')}
 className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
 vistaActiva === 'historial'
 ? 'bg-indigo-600 text-white shadow-2xs'
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <Clock className="w-3.5 h-3.5" />
 <span>Historial de Despieces ({historial.length})</span>
 </button>
 </div>

 {vistaActiva === 'operacion' ? (
 <div className="space-y-4">
 {/* ─── PLANTILLAS RÁPIDAS DE MOSTRADOR ─── */}
 <div className="space-y-1.5">
 <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-amber-500" />
 <span>Plantillas Rápidas para Mostrador Ferretero</span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
 {PLANTILLAS_FERRETERIA.map((p) => {
 const Icon = p.icon;
 return (
 <div
 key={p.id}
 onClick={() => aplicarPlantilla(p)}
 className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none flex flex-col justify-between"
 >
 <div className="space-y-1">
 <div className="flex items-center justify-between">
 <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
 <Icon className="w-3 h-3" />
 </div>
 <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
 Factor x{p.factor}
 </span>
 </div>
 <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
 {p.titulo}
 </div>
 <div className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-tight">
 {p.descripcion}
 </div>
 </div>
 <div className="pt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
 <span>Cargar plantilla</span>
 <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* ─── FORMULARIO ASISTENTE DE DESPIECE / FRACCIONAMIENTO ─── */}
 <form onSubmit={handleEjecutarFraccionamiento} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-card-soft p-4 sm:p-6 space-y-5">
 <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
 <div>
 <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
 <Scissors className="w-4 h-4 text-indigo-600" />
 <span>Conversión en Vivo de Empaque Matriz a Unidades Sueltas</span>
 </h3>
 <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
 El sistema descontará automáticamente del stock matriz e ingresará las unidades sueltas con asiento oficial en Kardex.
 </p>
 </div>
 </div>

 {/* Split Interactivo: Origen ➔ Factor ➔ Destino */}
 <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
 {/* LADO IZQUIERDO: PRODUCTO ORIGEN (EMPAQUE MATRIZ) */}
 <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 ">
 <span className="w-2 h-2 rounded-full bg-rose-500" />
 Producto Origen (A Descontar)
 </span>
 <span className="text-[10px] font-bold text-slate-400">Salida de Almacén</span>
 </div>

 {/* Buscador de Origen */}
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar rollo, caja, cilindro o saco..."
 value={busqOrigen}
 onChange={(e) => {
 setBusqOrigen(e.target.value);
 setMostrarDropOrigen(true);
 }}
 onFocus={() => setMostrarDropOrigen(true)}
 className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
 />

 {mostrarDropOrigen && busqOrigen && (
 <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100 dark:divide-slate-700/60">
 {productos
 .filter(p => p.nombre.toLowerCase().includes(busqOrigen.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(busqOrigen)))
 .slice(0, 6)
 .map(p => (
 <div
 key={p.id}
 onClick={() => {
 setProdOrigenId(p.id);
 setBusqOrigen(p.nombre);
 setMostrarDropOrigen(false);
 }}
 className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
 >
 <div>
 <div className="font-bold text-slate-900 dark:text-slate-100">{p.nombre}</div>
 <div className="text-[10px] text-slate-400 font-mono">
 Stock actual: {p.stock} {p.unidad_medida} • Compra: S/ {parseFloat(p.precio_compra).toFixed(2)}
 </div>
 </div>
 <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-bold">
 Seleccionar
 </span>
 </div>
 ))}
 </div>
 )}
 </div>

 {prodOrigenSel ? (
 <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
 <div className="font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
 {prodOrigenSel.nombre}
 </div>
 <div className="flex items-center justify-between text-[11px] pt-1">
 <span className="text-slate-500">Stock disponible:</span>
 <span className="font-mono font-black text-rose-600 dark:text-rose-400">
 {prodOrigenSel.stock} {prodOrigenSel.unidad_medida}
 </span>
 </div>
 <div className="flex items-center justify-between text-[11px]">
 <span className="text-slate-500">Costo unitario:</span>
 <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
 S/ {parseFloat(prodOrigenSel.precio_compra).toFixed(2)}
 </span>
 </div>
 </div>
 ) : (
 <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs italic">
 Selecciona arriba el producto empaque mayor
 </div>
 )}

 {/* Cantidad a abrir */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Cantidad de empaques a abrir / desempacar
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 min="0.01"
 step="0.01"
 value={cantidadOrigen}
 onChange={(e) => setCantidadOrigen(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-black text-center font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
 />
 <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 min-w-[60px]">
 {prodOrigenSel ? prodOrigenSel.unidad_medida : 'Empaque'}
 </span>
 </div>
 </div>
 </div>

 {/* CENTRO: FACTOR DE CONVERSIÓN */}
 <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 text-center">
 <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
 <ArrowRight className="w-5 h-5" />
 </div>
 <div className="mt-2 text-[10.5px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
 Rinde x{factorNum}
 </div>
 </div>

 {/* LADO DERECHO: PRODUCTO DESTINO (GRANEL / SUELTO) */}
 <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 ">
 <span className="w-2 h-2 rounded-full bg-emerald-500" />
 Producto Destino (A Ingresar)
 </span>
 <span className="text-[10px] font-bold text-slate-400">Entrada a Mostrador</span>
 </div>

 {/* Buscador de Destino */}
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar producto suelto (ej: metro, kilo, unidad)..."
 value={busqDestino}
 onChange={(e) => {
 setBusqDestino(e.target.value);
 setMostrarDropDestino(true);
 }}
 onFocus={() => setMostrarDropDestino(true)}
 className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
 />

 {mostrarDropDestino && busqDestino && (
 <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100 dark:divide-slate-700/60">
 {productos
 .filter(p => p.nombre.toLowerCase().includes(busqDestino.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(busqDestino)))
 .slice(0, 6)
 .map(p => (
 <div
 key={p.id}
 onClick={() => {
 setProdDestinoId(p.id);
 setBusqDestino(p.nombre);
 setMostrarDropDestino(false);
 }}
 className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
 >
 <div>
 <div className="font-bold text-slate-900 dark:text-slate-100">{p.nombre}</div>
 <div className="text-[10px] text-slate-400 font-mono">
 Stock actual: {p.stock} {p.unidad_medida} • Venta: S/ {parseFloat(p.precio_venta).toFixed(2)}
 </div>
 </div>
 <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold">
 Seleccionar
 </span>
 </div>
 ))}
 </div>
 )}
 </div>

 {prodDestinoSel ? (
 <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
 <div className="font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
 {prodDestinoSel.nombre}
 </div>
 <div className="flex items-center justify-between text-[11px] pt-1">
 <span className="text-slate-500">Stock actual en mostrador:</span>
 <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
 {prodDestinoSel.stock} {prodDestinoSel.unidad_medida}
 </span>
 </div>
 <div className="flex items-center justify-between text-[11px]">
 <span className="text-slate-500">Stock proyectado luego del despiece:</span>
 <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
 {(parseFloat(prodDestinoSel.stock) || 0) + cantidadResultante} {prodDestinoSel.unidad_medida}
 </span>
 </div>
 </div>
 ) : (
 <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs italic">
 Selecciona arriba el producto derivado/suelto
 </div>
 )}

 {/* Factor de Conversión */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Rendimiento / Factor (¿Cuántas unidades rinde 1 empaque?)
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 min="0.01"
 step="0.01"
 value={factorConversion}
 onChange={(e) => setFactorConversion(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-black text-center font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
 />
 <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 min-w-[60px]">
 {prodDestinoSel ? prodDestinoSel.unidad_medida : 'Suelto'}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Resumen Financiero y Rentabilidad del Fraccionamiento */}
 <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
 <div>
 <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
 Costo Derivado por {prodDestinoSel ? prodDestinoSel.unidad_medida : 'Unidad'}
 </span>
 <span className="text-sm font-mono font-black text-indigo-700 dark:text-indigo-300">
 S/ {costoFraccionadoDerivado.toFixed(3)}
 </span>
 </div>

 <div>
 <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
 Ingreso Total a Kardex
 </span>
 <span className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400">
 +{cantidadResultante} {prodDestinoSel ? prodDestinoSel.unidad_medida : 'unidades'}
 </span>
 </div>

 <div>
 <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
 Ganancia Extra por Menudeo
 </span>
 <span className="text-sm font-mono font-black text-purple-700 dark:text-purple-400">
 {margenExtra ? `+${margenExtra}% margen vs caja entera` : 'Cálculo al seleccionar'}
 </span>
 </div>
 </div>

 {/* Motivo Opcional */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Motivo / Nota de Auditoría (Opcional)
 </label>
 <input
 type="text"
 placeholder="Ej: Apertura de bobina para mostrador de electricidad fin de semana..."
 value={motivoPersonalizado}
 onChange={(e) => setMotivoPersonalizado(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
 />
 </div>

 {/* Botón de Ejecución */}
 <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
 <button
 type="submit"
 disabled={guardando || !prodOrigenId || !prodDestinoId}
 className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
 >
 <Check className="w-4 h-4" />
 <span>{guardando ? 'Asentando en Kardex...' : 'Confirmar & Asentar Fraccionamiento en Kardex'}</span>
 </button>
 </div>
 </form>
 </div>
 ) : (
 /* ─── HISTORIAL DE DESPIECES Y APERTURAS ─── */
 <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-card-soft overflow-hidden">
 <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-indigo-600" />
 <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 ">
 Registro Histórico de Fraccionamientos Realizados
 </h3>
 </div>
 <button
 type="button"
 onClick={cargarDatos}
 className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
 title="Refrescar"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
 </button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10.5px] font-extrabold ">
 <tr>
 <th className="py-2.5 px-3.5 whitespace-nowrap">FECHA / HORA</th>
 <th className="py-2.5 px-3.5 whitespace-nowrap">RESPONSABLE</th>
 <th className="py-2.5 px-3.5 min-w-[200px]">PRODUCTO AFECTADO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">MOVIMIENTO</th>
 <th className="py-2.5 px-3.5 min-w-[250px]">DETALLE / MOTIVO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">KARDEX</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {historial.length === 0 ? (
 <tr>
 <td colSpan="6" className="p-8 text-center text-slate-400 text-xs italic">
 No se han registrado operaciones de fraccionamiento todavía.
 </td>
 </tr>
 ) : (
 historial.map((h) => {
 const esSalida = h.tipo === 'Salida';
 return (
 <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
 <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
 {new Date(h.fecha).toLocaleString('es-PE')}
 </td>
 <td className="py-2.5 px-3.5 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
 {h.usuario?.nombre || 'Usuario'}
 </td>
 <td className="py-2.5 px-3.5">
 <div className="font-extrabold text-slate-900 dark:text-slate-100">
 {h.producto?.nombre || 'Producto'}
 </div>
 <div className="text-[10px] text-slate-400 font-mono">
 Código: {h.producto?.codigo_barras || 'S/C'}
 </div>
 </td>
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span
 className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
 esSalida
 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800'
 : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
 }`}
 >
 <span>{esSalida ? '-' : '+'}{h.cantidad} {h.producto?.unidad_medida}</span>
 </span>
 </td>
 <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
 {h.motivo}
 </td>
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <button
 type="button"
 onClick={() => setSearchParams({ tab: 'kardex', busqueda: h.producto?.nombre || '' })}
 className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
 title="Ver en Kardex"
 >
 <Layers className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 );
}
