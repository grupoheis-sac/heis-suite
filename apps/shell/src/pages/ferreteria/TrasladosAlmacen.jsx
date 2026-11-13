import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 ArrowLeftRight,
 Plus,
 Search,
 Truck,
 ArrowRight,
 CheckCircle2,
 Clock,
 Printer,
 X,
 Package,
 Calendar,
 User,
 RefreshCw,
 Building2,
 Check,
 Eye,
 Trash2,
 FileText,
 MapPin,
 HardHat,
 ChevronDown
} from 'lucide-react';
import { useSettingsStore } from '@heis/core';

export default function TrasladosAlmacen() {
 const settings = useSettingsStore();
 const [traslados, setTraslados] = useState([]);
 const [productos, setProductos] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState('');
 const [filtroEstado, setFiltroEstado] = useState('TODOS');

 // Modales
 const [modalNuevo, setModalNuevo] = useState(false);
 const [modalGuia, setModalGuia] = useState(false);
 const [trasladoSeleccionado, setTrasladoSeleccionado] = useState(null);
 const [guardando, setGuardando] = useState(false);

 // Formulario Nuevo Traslado
 const [origen, setOrigen] = useState('Almacén Central (Patio Materiales)');
 const [destino, setDestino] = useState('Tienda Mostrador (Salón de Ventas)');
 const [responsable, setResponsable] = useState('');
 const [vehiculoPlaca, setVehiculoPlaca] = useState('');
 const [observaciones, setObservaciones] = useState('');
 const [actualizarUbicacion, setActualizarUbicacion] = useState(true);
 const [itemsTraslado, setItemsTraslado] = useState([]);

 // Desplegables personalizados para Almacén Origen y Destino
 const [desplegableOrigenAbierto, setDesplegableOrigenAbierto] = useState(false);
 const [busquedaOrigen, setBusquedaOrigen] = useState('');
 const refSelectorOrigen = useRef(null);

 const [desplegableDestinoAbierto, setDesplegableDestinoAbierto] = useState(false);
 const [busquedaDestino, setBusquedaDestino] = useState('');
 const refSelectorDestino = useRef(null);

 // Bloquear scroll de fondo cuando cualquiera de los modales esté abierto
 useEffect(() => {
 if (modalNuevo || modalGuia) {
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 return () => {
 document.body.style.overflow = originalOverflow;
 };
 }
 }, [modalNuevo, modalGuia]);

 // Buscador de productos para el traslado
 const [busqProd, setBusqProd] = useState('');
 const [mostrarDropdown, setMostrarDropdown] = useState(false);

 const ALMACENES_DISPONIBLES = [
 'Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)',
 'Tienda Mostrador (Salón de Ventas - Herramientas y Acabados)',
 'Depósito Secundario / Taller de Corte y Tuberías'
 ];

 // Cerrar desplegables de almacén al hacer clic fuera o presionar Escape
 useEffect(() => {
 const handleClickAfuera = (event) => {
 if (
 refSelectorOrigen.current &&
 !refSelectorOrigen.current.contains(event.target)
 ) {
 setDesplegableOrigenAbierto(false);
 }
 if (
 refSelectorDestino.current &&
 !refSelectorDestino.current.contains(event.target)
 ) {
 setDesplegableDestinoAbierto(false);
 }
 };

 const handleKeyDown = (event) => {
 if (event.key === 'Escape') {
 setDesplegableOrigenAbierto(false);
 setDesplegableDestinoAbierto(false);
 }
 };

 if (desplegableOrigenAbierto || desplegableDestinoAbierto) {
 document.addEventListener('mousedown', handleClickAfuera);
 document.addEventListener('keydown', handleKeyDown);
 }
 return () => {
 document.removeEventListener('mousedown', handleClickAfuera);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, [desplegableOrigenAbierto, desplegableDestinoAbierto]);

 useEffect(() => {
 if (!modalNuevo) {
 setDesplegableOrigenAbierto(false);
 setBusquedaOrigen('');
 setDesplegableDestinoAbierto(false);
 setBusquedaDestino('');
 }
 }, [modalNuevo]);

 const cargarDatos = async () => {
 setCargando(true);
 try {
 const [resTras, resProd] = await Promise.all([
 api.get('/inventario/traslados'),
 api.get('/productos?limit=150')
 ]);

 if (resTras.success) {
 setTraslados(resTras.traslados || []);
 }
 if (resProd.success) {
 setProductos(resProd.productos || []);
 }
 } catch (e) {
 toast.error('Error al cargar traslados');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 const abrirNuevoTraslado = () => {
 setOrigen(ALMACENES_DISPONIBLES[0]);
 setDestino(ALMACENES_DISPONIBLES[1]);
 setResponsable('');
 setVehiculoPlaca('');
 setObservaciones('');
 setItemsTraslado([]);
 setBusqProd('');
 setDesplegableOrigenAbierto(false);
 setDesplegableDestinoAbierto(false);
 setModalNuevo(true);
 };

 const agregarItem = (prod) => {
 const existe = itemsTraslado.find(i => i.id_producto === prod.id);
 if (existe) {
 toast.error('Este material ya está en la lista de despacho');
 return;
 }

 setItemsTraslado([
 ...itemsTraslado,
 {
 id_producto: prod.id,
 nombre: prod.nombre,
 unidad_medida: prod.unidad_medida || 'Unidad',
 stock_actual: parseFloat(prod.stock) || 0,
 cantidad: 1,
 observaciones: ''
 }
 ]);
 setBusqProd('');
 setMostrarDropdown(false);
 };

 const actualizarCantidad = (id_producto, cant) => {
 setItemsTraslado(
 itemsTraslado.map(i =>
 i.id_producto === id_producto ? { ...i, cantidad: Math.max(0.1, parseFloat(cant) || 0) } : i
 )
 );
 };

 const quitarItem = (id_producto) => {
 setItemsTraslado(itemsTraslado.filter(i => i.id_producto !== id_producto));
 };

 const handleGuardarTraslado = async (e) => {
 e.preventDefault();
 if (origen === destino) {
 return toast.error('El almacén de origen y destino deben ser diferentes');
 }
 if (itemsTraslado.length === 0) {
 return toast.error('Agregue al menos un material al traslado');
 }

 setGuardando(true);
 try {
 const res = await api.post('/inventario/traslados', {
 origen,
 destino,
 responsable_transporte: responsable || 'Personal Interno',
 vehiculo_placa: vehiculoPlaca,
 observaciones,
 actualizar_ubicacion: actualizarUbicacion,
 items: itemsTraslado.map(i => ({
 id_producto: i.id_producto,
 cantidad: i.cantidad,
 unidad_medida: i.unidad_medida,
 observaciones: i.observaciones
 }))
 });

 if (res.success) {
 toast.success(res.message || 'Traslado registrado exitosamente');
 setModalNuevo(false);
 cargarDatos();
 setTrasladoSeleccionado(res.traslado);
 setModalGuia(true);
 }
 } catch (err) {
 toast.error(err.message || 'Error al registrar traslado');
 } finally {
 setGuardando(false);
 }
 };

 const verGuia = (traslado) => {
 setTrasladoSeleccionado(traslado);
 setModalGuia(true);
 };

 const trasladosFiltrados = traslados.filter(t => {
 const matchBusq = !busqueda ||
 t.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
 t.origen.toLowerCase().includes(busqueda.toLowerCase()) ||
 t.destino.toLowerCase().includes(busqueda.toLowerCase()) ||
 (t.responsable_transporte && t.responsable_transporte.toLowerCase().includes(busqueda.toLowerCase()));

 if (!matchBusq) return false;
 if (filtroEstado !== 'TODOS') return t.estado === filtroEstado;
 return true;
 });

 return (
 <div className="space-y-4">
 {/* ─── ENCABEZADO Y RESUMEN DE TRASLADOS (ESTILO DASHBOARD LIMPIO & ELEGANTE) ─── */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
 {/* KPI 1: Total Traslados */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Total Traslados
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <ArrowLeftRight className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 {traslados.length}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Despachos internos
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Registrados
 </span>
 </div>
 </div>

 {/* KPI 2: Almacenes Conectados */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Almacenes Conectados
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <Building2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 3 Puntos
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Patio, Mostrador & Depósito
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 Interconectados
 </span>
 </div>
 </div>

 {/* KPI 3: Materiales Movilizados */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 Materiales Movilizados
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <Truck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
 {traslados.reduce((acc, t) => acc + (t.total_items || 0), 0)} items
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Transferencias controladas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 En Guías
 </span>
 </div>
 </div>
 </div>

 {/* ─── BARRA DE HERRAMIENTAS, FILTROS Y BÚSQUEDA ─── */}
 <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
 <div className="relative flex-1 md:max-w-md">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar por código de guía (TR-0001), almacén o chofer..."
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 {busqueda && (
 <button
 type="button"
 onClick={() => setBusqueda('')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <button
 type="button"
 onClick={abrirNuevoTraslado}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
 >
 <Plus className="w-4 h-4" />
 <span>Nuevo Traslado Interno</span>
 </button>
 </div>

 {/* ─── TABLA COMPACTA DE TRASLADOS ─── */}
 {cargando ? (
 <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
 <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
 <p className="text-xs font-bold text-slate-500">Cargando historial de traslados entre almacenes...</p>
 </div>
 ) : trasladosFiltrados.length === 0 ? (
 <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
 <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-2" />
 <h4 className="text-sm font-black text-slate-700">No hay traslados registrados</h4>
 <p className="text-xs text-slate-400 mt-0.5">
 Mueve materiales pesados desde el Patio de Cemento o Depósito Central hacia el mostrador de ventas.
 </p>
 </div>
 ) : (
 <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10.5px] font-extrabold">
 <tr>
 <th className="py-2.5 px-3.5 whitespace-nowrap">N° GUÍA</th>
 <th className="py-2.5 px-3.5 whitespace-nowrap">FECHA / HORA</th>
 <th className="py-2.5 px-3.5 min-w-[200px]">ALMACÉN ORIGEN</th>
 <th className="py-2.5 px-3.5 min-w-[200px]">ALMACÉN DESTINO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">MATERIALES</th>
 <th className="py-2.5 px-3.5 whitespace-nowrap">RESPONSABLE</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ESTADO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {trasladosFiltrados.map((t) => (
 <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
 {/* N° Guía */}
 <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-black text-slate-900">
 <div className="flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
 <span>{t.numero}</span>
 </div>
 </td>

 {/* Fecha */}
 <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 font-semibold text-[11px]">
 {new Date(t.fecha_envio || t.created_at).toLocaleDateString('es-PE')}
 </td>

 {/* Origen */}
 <td className="py-2.5 px-3.5">
 <div className="flex items-center gap-1 text-slate-800 font-bold">
 <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
 <span className="truncate max-w-[220px]" title={t.origen}>{t.origen}</span>
 </div>
 </td>

 {/* Destino */}
 <td className="py-2.5 px-3.5">
 <div className="flex items-center gap-1 text-slate-800 font-bold">
 <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
 <span className="truncate max-w-[220px]" title={t.destino}>{t.destino}</span>
 </div>
 </td>

 {/* Materiales */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-black text-[10.5px] border border-indigo-200/60">
 {t.total_items || t.detalles?.length || 0} mat.
 </span>
 </td>

 {/* Responsable */}
 <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
 <span className="flex items-center gap-1 text-[11px]">
 <User className="w-3 h-3 text-slate-400" />
 <span>{t.responsable_transporte || 'Personal'}</span>
 </span>
 </td>

 {/* Estado */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 <span>{t.estado}</span>
 </span>
 </td>

 {/* Acciones */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <button
 type="button"
 onClick={() => verGuia(t)}
 className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
 title="Ver Guía de Traslado Interno"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* ─── MODAL NUEVO TRASLADO INTERNO ─── */}
 {modalNuevo && typeof document !== 'undefined' && createPortal(
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
 onClick={() => setModalNuevo(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-6 flex flex-col max-h-[92vh] cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
 <ArrowLeftRight className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 ">
 Nuevo Traslado Interno de Materiales
 </h3>
 <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
 Despacho entre almacén patio, mostrador y depósitos
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalNuevo(false)}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation">
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 </button>
 </div>

 <form onSubmit={handleGuardarTraslado} className="p-5 overflow-y-auto space-y-4 flex-1">
 {/* Origen & Destino con diseño de píldoras desplegables rounded-xl y rounded-2xl */}
 {(() => {
 const setAlm = new Set(ALMACENES_DISPONIBLES);
 if (origen) setAlm.add(origen);
 if (destino) setAlm.add(destino);
 traslados.forEach((t) => {
 if (t.almacen_origen) setAlm.add(t.almacen_origen);
 if (t.almacen_destino) setAlm.add(t.almacen_destino);
 });
 const listaAlmacenes = Array.from(setAlm);

 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
 {/* Selector Píldora Desplegable de Origen */}
 <div
 className={`relative ${desplegableOrigenAbierto ? 'z-40' : 'z-20'}`}
 ref={refSelectorOrigen}
 >
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Almacén de Origen (Despacho) <span className="text-rose-500">*</span>
 </label>

 <button
 type="button"
 onClick={() => {
 setDesplegableOrigenAbierto(!desplegableOrigenAbierto);
 setDesplegableDestinoAbierto(false);
 setBusquedaOrigen('');
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableOrigenAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
 {origen || '-- Seleccionar Almacén --'}
 </span>
 <ChevronDown
 className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableOrigenAbierto ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
 }`}
 />
 </button>

 {/* Ventana Desplegable con bordes redondeados (rounded-2xl) */}
 {desplegableOrigenAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {listaAlmacenes.length > 3 && (
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar almacén..."
 value={busquedaOrigen}
 onChange={(e) => setBusquedaOrigen(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 )}

 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {(() => {
 const filtrados = listaAlmacenes.filter((alm) => {
 if (!busquedaOrigen.trim()) return true;
 return alm.toLowerCase().includes(busquedaOrigen.toLowerCase().trim());
 });

 if (filtrados.length === 0) {
 return (
 <div className="px-3 py-3 text-center text-xs text-slate-400">
 No se encontraron almacenes
 </div>
 );
 }

 return filtrados.map((alm) => {
 const esSeleccionado = origen === alm;
 return (
 <button
 key={alm}
 type="button"
 onClick={() => {
 setOrigen(alm);
 setDesplegableOrigenAbierto(false);
 setBusquedaOrigen('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 esSeleccionado
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span className="truncate pr-2">{alm}</span>
 {esSeleccionado && (
 <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
 )}
 </button>
 );
 });
 })()}
 </div>
 </div>
 )}
 </div>

 {/* Selector Píldora Desplegable de Destino */}
 <div
 className={`relative ${desplegableDestinoAbierto ? 'z-40' : 'z-10'}`}
 ref={refSelectorDestino}
 >
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Almacén de Destino (Recepción) <span className="text-rose-500">*</span>
 </label>

 <button
 type="button"
 onClick={() => {
 setDesplegableDestinoAbierto(!desplegableDestinoAbierto);
 setDesplegableOrigenAbierto(false);
 setBusquedaDestino('');
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableDestinoAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
 {destino || '-- Seleccionar Almacén --'}
 </span>
 <ChevronDown
 className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableDestinoAbierto ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
 }`}
 />
 </button>

 {/* Ventana Desplegable con bordes redondeados (rounded-2xl) */}
 {desplegableDestinoAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {listaAlmacenes.length > 3 && (
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar almacén..."
 value={busquedaDestino}
 onChange={(e) => setBusquedaDestino(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 )}

 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {(() => {
 const filtrados = listaAlmacenes.filter((alm) => {
 if (!busquedaDestino.trim()) return true;
 return alm.toLowerCase().includes(busquedaDestino.toLowerCase().trim());
 });

 if (filtrados.length === 0) {
 return (
 <div className="px-3 py-3 text-center text-xs text-slate-400">
 No se encontraron almacenes
 </div>
 );
 }

 return filtrados.map((alm) => {
 const esSeleccionado = destino === alm;
 return (
 <button
 key={alm}
 type="button"
 onClick={() => {
 setDestino(alm);
 setDesplegableDestinoAbierto(false);
 setBusquedaDestino('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 esSeleccionado
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span className="truncate pr-2">{alm}</span>
 {esSeleccionado && (
 <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
 )}
 </button>
 );
 });
 })()}
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })()}

 {/* Sincronización de Ubicación */}
 <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 cursor-pointer select-none">
 <input
 type="checkbox"
 checked={actualizarUbicacion}
 onChange={(e) => setActualizarUbicacion(e.target.checked)}
 className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
 />
 <div>
 <span className="text-[11.5px] font-bold text-indigo-900 dark:text-indigo-200 block">
 Actualizar automáticamente la ubicación física en almacén de estos productos
 </span>
 <span className="text-[10.5px] text-indigo-700/80 dark:text-indigo-400 font-medium block">
 Sincroniza el inventario asignando como nueva ubicación: <span className="font-bold underline">{destino}</span>
 </span>
 </div>
 </label>

 {/* Responsable & Vehículo */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Responsable del Despacho / Chofer
 </label>
 <input
 type="text"
 placeholder="Ej: Juan Quispe (Almacenero)"
 value={responsable}
 onChange={(e) => setResponsable(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Vehículo / Placa (Opcional)
 </label>
 <input
 type="text"
 placeholder="Ej: Furgón FUSO / ABC-123"
 value={vehiculoPlaca}
 onChange={(e) => setVehiculoPlaca(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
 />
 </div>
 </div>

 {/* Agregar Materiales */}
 <div className="space-y-2">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
 Materiales a Trasladar <span className="text-rose-500">*</span>
 </label>

 {/* Buscador de Producto */}
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar producto por nombre o código para añadir al traslado..."
 value={busqProd}
 onChange={(e) => {
 setBusqProd(e.target.value);
 setMostrarDropdown(true);
 }}
 onFocus={() => setMostrarDropdown(true)}
 className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
 />

 {/* Dropdown de Resultados */}
 {mostrarDropdown && busqProd && (
 <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100 dark:divide-slate-700/60">
 {productos
 .filter(p => p.nombre.toLowerCase().includes(busqProd.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(busqProd)))
 .slice(0, 8)
 .map(p => (
 <div
 key={p.id}
 onClick={() => agregarItem(p)}
 className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
 >
 <div>
 <div className="font-bold text-slate-900 dark:text-slate-100">{p.nombre}</div>
 <div className="text-[10px] text-slate-400 font-mono">
 Stock actual: {p.stock} {p.unidad_medida}
 </div>
 </div>
 <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">
 Agregar
 </span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Lista de Items Agregados */}
 <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-850">
 {itemsTraslado.length === 0 ? (
 <div className="p-6 text-center text-slate-400 text-xs italic">
 No hay materiales en la lista. Busca arriba y agrégalos.
 </div>
 ) : (
 itemsTraslado.map(i => (
 <div key={i.id_producto} className="p-2.5 flex items-center justify-between gap-3 text-xs bg-white dark:bg-slate-900">
 <div className="min-w-0 flex-1">
 <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{i.nombre}</div>
 <div className="text-[10px] text-slate-400 font-mono">
 Stock disponible: {i.stock_actual} {i.unidad_medida}
 </div>
 </div>

 <div className="flex items-center gap-2">
 <input
 type="number"
 min="0.1"
 step="0.1"
 value={i.cantidad}
 onChange={(e) => actualizarCantidad(i.id_producto, e.target.value)}
 className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-black text-center text-xs"
 />
 <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 w-12">{i.unidad_medida}</span>
 <button
 type="button"
 onClick={() => quitarItem(i.id_producto)}
 className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Observaciones */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Observaciones adicionales
 </label>
 <textarea
 rows="2"
 placeholder="Ej: Material solicitado para abastecer ventas de mostrador de fin de semana..."
 value={observaciones}
 onChange={(e) => setObservaciones(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
 />
 </div>

 <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setModalNuevo(false)}
 className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={guardando || itemsTraslado.length === 0}
 className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
 >
 <Check className="w-3.5 h-3.5" />
 <span>{guardando ? 'Emitiendo Guía...' : 'Confirmar & Emitir Guía de Traslado'}</span>
 </button>
 </div>
 </form>
 </div>
 </div>,
 document.body
 )}

 {/* ─── MODAL GUÍA DE TRASLADO INTERNO (VISTA IMPRESIÓN) ─── */}
 {modalGuia && trasladoSeleccionado && typeof document !== 'undefined' && createPortal(
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
 onClick={() => setModalGuia(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden my-6 flex flex-col cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
 <Printer className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 ">
 Guía de Traslado Interno
 </h3>
 <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
 N° {trasladoSeleccionado.numero}
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalGuia(false)}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation">
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 </button>
 </div>

 {/* Documento Imprimible */}
 <div className="p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200">
 <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3 space-y-0.5">
 <h2 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight ">
 {settings.businessName || 'FERRETERÍA HEIS'}
 </h2>
 <div className="text-[10px] text-slate-500 dark:text-slate-400">RUC: {settings.businessRuc || '20600000000'}</div>
 <div className="text-[10px] text-slate-400 dark:text-slate-500">{settings.address || 'Almacén Central'}</div>
 <div className="pt-2 font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
 GUÍA DE TRASLADO INTERNO: {trasladoSeleccionado.numero}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
 <div>
 <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">FECHA DE EMISIÓN</span>
 <span className="font-semibold text-slate-800 dark:text-slate-200">
 {new Date(trasladoSeleccionado.fecha_envio || trasladoSeleccionado.created_at).toLocaleDateString('es-PE')}
 </span>
 </div>
 <div>
 <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">ESTADO</span>
 <span className="font-black text-emerald-600 dark:text-emerald-400">{trasladoSeleccionado.estado}</span>
 </div>
 <div>
 <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">ORIGEN</span>
 <span className="font-bold text-slate-800 dark:text-slate-200">{trasladoSeleccionado.origen}</span>
 </div>
 <div>
 <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">DESTINO</span>
 <span className="font-bold text-slate-800 dark:text-slate-200">{trasladoSeleccionado.destino}</span>
 </div>
 <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
 <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">RESPONSABLE / VEHÍCULO</span>
 <span className="font-semibold text-slate-800 dark:text-slate-200">
 {trasladoSeleccionado.responsable_transporte || 'Personal Interno'} {trasladoSeleccionado.vehiculo_placa ? `(Placa: ${trasladoSeleccionado.vehiculo_placa})` : ''}
 </span>
 </div>
 </div>

 {/* Detalle de Materiales */}
 <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] uppercase">
 <tr>
 <th className="p-2">Material</th>
 <th className="p-2 text-center">Cant.</th>
 <th className="p-2 text-center">Unidad</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {(trasladoSeleccionado.detalles || []).map((d, idx) => (
 <tr key={idx}>
 <td className="p-2 font-bold text-slate-900 dark:text-slate-100">{d.producto?.nombre || 'Material'}</td>
 <td className="p-2 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{d.cantidad}</td>
 <td className="p-2 text-center font-semibold text-slate-600 dark:text-slate-400">{d.unidad_medida || 'Unidad'}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {trasladoSeleccionado.observaciones && (
 <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
 Nota: {trasladoSeleccionado.observaciones}
 </div>
 )}

 {/* Firmas */}
 <div className="grid grid-cols-2 gap-6 pt-6 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
 <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
 Despachado por (Firma)
 </div>
 <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
 Recibido conforme en destino
 </div>
 </div>

 <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => window.print()}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
 >
 <Printer className="w-3.5 h-3.5" />
 <span>Imprimir Guía</span>
 </button>
 </div>
 </div>
 </div>
 </div>,
 document.body
 )}
 </div>
 );
}
