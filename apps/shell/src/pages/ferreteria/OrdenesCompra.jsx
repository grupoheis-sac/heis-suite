import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 PackageCheck,
 Plus,
 Search,
 Filter,
 Eye,
 CheckCircle2,
 Clock,
 AlertCircle,
 Truck,
 Building2,
 Calendar,
 DollarSign,
 Printer,
 X,
 Trash2,
 RefreshCw,
 Send,
 FileCheck,
 ChevronDown,
 Check,
 Warehouse,
 Layers,
 Sparkles,
 Info
} from 'lucide-react';

export default function OrdenesCompra() {
 const [ordenes, setOrdenes] = useState([]);
 const [proveedores, setProveedores] = useState([]);
 const [productos, setProductos] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState('');
 const [filtroEstado, setFiltroEstado] = useState('TODOS');

 // Modales
 const [modalNuevaOrden, setModalNuevaOrden] = useState(false);
 const [modalVerOrden, setModalVerOrden] = useState(null);
 const [modalRecepcion, setModalRecepcion] = useState(null);

 // Formulario Nueva Orden
 const [formOrden, setFormOrden] = useState({
 id_proveedor: '',
 fecha_entrega_esperada: '',
 condicion_pago: 'Contado',
 metodo_envio: 'Flete Proveedor',
 almacen_destino: 'Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)',
 lugar_entrega: 'Patio de Materiales / Almacén Central',
 observaciones: ''
 });
 const [itemsOrden, setItemsOrden] = useState([]);
 const [busqProd, setBusqProd] = useState('');
 const [guardando, setGuardando] = useState(false);

 // Dropdowns con diseño redondeado
 const [desplegableProvAbierto, setDesplegableProvAbierto] = useState(false);
 const [busquedaProv, setBusquedaProv] = useState('');
 const refSelectorProv = useRef(null);

 const [desplegablePagoAbierto, setDesplegablePagoAbierto] = useState(false);
 const refSelectorPago = useRef(null);

 const [desplegableAlmacenAbierto, setDesplegableAlmacenAbierto] = useState(false);
 const refSelectorAlmacen = useRef(null);

 const CONDICIONES_PAGO_ORDEN = [
 { valor: 'Contado', etiqueta: 'Contado', descripcion: 'Pago contra entrega o contado anticipado' },
 { valor: 'Credito 15 dias', etiqueta: 'Crédito 15 días', descripcion: 'Factura a 15 días calendario' },
 { valor: 'Credito 30 dias', etiqueta: 'Crédito 30 días', descripcion: 'Factura estándar a 30 días' },
 { valor: 'Credito 60 dias', etiqueta: 'Crédito 60 días', descripcion: 'Línea de crédito mayorista a 60 días' }
 ];

 const ALMACENES_FERRETERIA = [
 {
 id: 'Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)',
 nombre: 'Almacén Central (Patio Materiales)',
 descripcion: 'Cemento, Fierro corrugado, Áridos, Ladrillos y Cargas Pesadas',
 icono: Warehouse,
 color: 'indigo'
 },
 {
 id: 'Tienda Mostrador (Salón de Ventas - Herramientas y Acabados)',
 nombre: 'Tienda Mostrador (Salón Ventas)',
 descripcion: 'Herramientas eléctricas, Manuales, Grifería, Cerrajería y Pinturas',
 icono: Building2,
 color: 'emerald'
 },
 {
 id: 'Depósito Secundario / Taller de Corte y Tuberías',
 nombre: 'Depósito Secundario (Corte/Tuberías)',
 descripcion: 'Tuberías PVC/Fierro, Perfiles de aluminio, Planchas y Mallas',
 icono: Layers,
 color: 'amber'
 },
 {
 id: 'Despacho Directo a Obra del Cliente',
 nombre: 'Despacho Directo a Obra',
 descripcion: 'Descarga in-situ en proyecto/obra del cliente por cuenta de proveedor',
 icono: Truck,
 color: 'sky'
 }
 ];

 // Cerrar ventanas desplegables al hacer clic fuera o con Escape
 useEffect(() => {
 const handleClickAfuera = (e) => {
 if (refSelectorProv.current && !refSelectorProv.current.contains(e.target)) {
 setDesplegableProvAbierto(false);
 }
 if (refSelectorPago.current && !refSelectorPago.current.contains(e.target)) {
 setDesplegablePagoAbierto(false);
 }
 if (refSelectorAlmacen.current && !refSelectorAlmacen.current.contains(e.target)) {
 setDesplegableAlmacenAbierto(false);
 }
 };
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 setDesplegableProvAbierto(false);
 setDesplegablePagoAbierto(false);
 setDesplegableAlmacenAbierto(false);
 }
 };
 document.addEventListener('mousedown', handleClickAfuera);
 document.addEventListener('keydown', handleKeyDown);
 return () => {
 document.removeEventListener('mousedown', handleClickAfuera);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, []);

 // Formulario Recepción en Almacén (con soporte de entregas parciales)
 const [formRecepcion, setFormRecepcion] = useState({
 tipo_comprobante: 'Factura',
 serie: 'F001',
 numero: '',
 guia_remision: '',
 items_recibidos: []
 });
 const [recepcionando, setRecepcionando] = useState(false);

 const cargarDatos = async () => {
 setCargando(true);
 try {
 let url = '/ordenes-compra';
 const params = [];
 if (busqueda.trim()) params.push(`busqueda=${encodeURIComponent(busqueda.trim())}`);
 if (filtroEstado !== 'TODOS') params.push(`estado=${encodeURIComponent(filtroEstado)}`);
 if (params.length) url += `?${params.join('&')}`;

 const [resOrd, resProv, resProd] = await Promise.all([
 api.get(url),
 api.get('/proveedores'),
 api.get('/productos?limit=250')
 ]);

 if (resOrd && resOrd.success) setOrdenes(resOrd.ordenes || []);
 if (resProv && resProv.success) setProveedores(resProv.proveedores || []);
 if (resProd && resProd.success) setProductos(resProd.productos || []);
 } catch (e) {
 toast.error(e?.response?.data?.message || e?.message || 'Error al cargar órdenes de compra');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, [busqueda, filtroEstado]);

 // Detección de productos ferreteros con stock crítico o bajo
 const productosCriticos = productos.filter((p) => {
 const stockActual = parseFloat(p.stock) || 0;
 const stockMin = parseFloat(p.stock_minimo) || 0;
 return stockMin > 0 && stockActual <= stockMin;
 });

 const handleCargarStockCritico = () => {
 if (productosCriticos.length === 0) {
 return toast('No hay productos con stock igual o inferior al mínimo configurado.', { icon: 'ℹ️' });
 }

 const itemsNuevos = productosCriticos.map((p) => {
 const stockActual = parseFloat(p.stock) || 0;
 const stockMin = parseFloat(p.stock_minimo) || 0;
 const deficiencia = Math.max(1, (stockMin * 2) - stockActual);
 return {
 id_producto: p.id,
 nombre: p.nombre,
 unidad_medida: p.unidad_medida,
 marca: p.marca || 'Genérico',
 cantidad: Math.ceil(deficiencia),
 precio_unitario: parseFloat(p.precio_compra) || 0
 };
 });

 setItemsOrden(itemsNuevos);
 setModalNuevaOrden(true);
 toast.success(`${itemsNuevos.length} producto(s) con stock crítico cargados a la orden.`);
 };

 const agregarItem = (prod) => {
 const existe = itemsOrden.find((i) => i.id_producto === prod.id);
 if (existe) {
 setItemsOrden(
 itemsOrden.map((i) =>
 i.id_producto === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i
 )
 );
 } else {
 setItemsOrden([
 ...itemsOrden,
 {
 id_producto: prod.id,
 nombre: prod.nombre,
 unidad_medida: prod.unidad_medida,
 marca: prod.marca || 'Genérico',
 cantidad: 1,
 precio_unitario: parseFloat(prod.precio_compra) || 0
 }
 ]);
 }
 setBusqProd('');
 };

 const handleCrearOrden = async (e) => {
 e.preventDefault();
 if (!formOrden.id_proveedor) {
 return toast.error('Seleccione un proveedor para la orden.');
 }
 if (itemsOrden.length === 0) {
 return toast.error('Agregue al menos un producto a la lista de compra.');
 }

 setGuardando(true);
 try {
 const res = await api.post('/ordenes-compra', {
 ...formOrden,
 items: itemsOrden
 });
 if (res && res.success) {
 toast.success(res.message);
 setModalNuevaOrden(false);
 setItemsOrden([]);
 setFormOrden({
 id_proveedor: '',
 fecha_entrega_esperada: '',
 condicion_pago: 'Contado',
 metodo_envio: 'Flete Proveedor',
 almacen_destino: 'Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)',
 lugar_entrega: 'Patio de Materiales / Almacén Central',
 observaciones: ''
 });
 cargarDatos();
 }
 } catch (err) {
 toast.error(err.message || 'Error al generar orden de compra');
 } finally {
 setGuardando(false);
 }
 };

 const handleCambiarEstado = async (id, nuevoEstado) => {
 try {
 const res = await api.patch(`/ordenes-compra/${id}/estado`, { estado: nuevoEstado });
 if (res && res.success) {
 toast.success(res.message);
 cargarDatos();
 }
 } catch (err) {
 toast.error(err.message || 'Error al actualizar estado');
 }
 };

 const abrirModalRecepcion = (o) => {
 const items = (o.detalles || []).map((d) => {
 const cantPedida = parseFloat(d.cantidad) || 0;
 const yaRecibida = parseFloat(d.cantidad_recibida) || 0;
 const pendiente = Math.max(0, parseFloat((cantPedida - yaRecibida).toFixed(3)));
 return {
 id_producto: d.id_producto,
 nombre: d.producto?.nombre || 'Producto',
 unidad_medida: d.producto?.unidad_medida || 'UND',
 cantidad_pedida: cantPedida,
 ya_recibida: yaRecibida,
 pendiente: pendiente,
 cantidad_recibir_hoy: pendiente, // Sugerencia inicial: completar el saldo pendiente
 precio_unitario: parseFloat(d.precio_unitario) || 0
 };
 });

 setFormRecepcion({
 tipo_comprobante: 'Factura',
 serie: 'F001',
 numero: '',
 guia_remision: '',
 items_recibidos: items
 });
 setModalRecepcion(o);
 };

 const handleConfirmarRecepcion = async (e) => {
 e.preventDefault();
 if (!modalRecepcion) return;
 if (!formRecepcion.numero.trim()) {
 return toast.error('Ingrese el número del comprobante de compra emitido por el proveedor.');
 }

 const itemsAEnviar = (formRecepcion.items_recibidos || []).map((it) => ({
 id_producto: it.id_producto,
 cantidad_recibida: parseFloat(it.cantidad_recibir_hoy) || 0
 }));

 const totalARecibir = itemsAEnviar.reduce((sum, it) => sum + it.cantidad_recibida, 0);
 if (totalARecibir <= 0) {
 return toast.error('Debe ingresar una cantidad mayor a 0 en al menos un ítem para recepcionar.');
 }

 setRecepcionando(true);
 try {
 const res = await api.post(`/ordenes-compra/${modalRecepcion.id}/recepcionar`, {
 tipo_comprobante: formRecepcion.tipo_comprobante,
 serie: formRecepcion.serie,
 numero: formRecepcion.numero,
 guia_remision: formRecepcion.guia_remision,
 items_recibidos: itemsAEnviar
 });
 if (res && res.success) {
 toast.success(res.message);
 setModalRecepcion(null);
 setFormRecepcion({
 tipo_comprobante: 'Factura',
 serie: 'F001',
 numero: '',
 guia_remision: '',
 items_recibidos: []
 });
 cargarDatos();
 }
 } catch (err) {
 toast.error(err.message || 'Error al recepcionar mercadería');
 } finally {
 setRecepcionando(false);
 }
 };

 // Métricas
 const totalOrdenes = ordenes.length;
 const ordenesBorrador = ordenes.filter(o => o.estado === 'Borrador').length;
 const ordenesEnviadas = ordenes.filter(o => o.estado === 'Enviada').length;
 const ordenesParciales = ordenes.filter(o => o.estado === 'Parcial').length;
 const ordenesRecibidas = ordenes.filter(o => o.estado === 'Recibida').length;
 const montoComprometido = ordenes
 .filter(o => o.estado !== 'Recibida' && o.estado !== 'Cancelada')
 .reduce((acc, o) => acc + parseFloat(o.total || 0), 0);

 const totalNuevaOrden = itemsOrden.reduce(
 (sum, i) => sum + i.cantidad * i.precio_unitario,
 0
 );
 const subtotalSinIgv = totalNuevaOrden / 1.18;
 const igvEstimado = totalNuevaOrden - subtotalSinIgv;

 return (
 <div className="space-y-4">
 {/* ─── TARJETAS DE MÉTRICAS KPI (ESTILO DASHBOARD LIMPIO & ELEGANTE) ─── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Total Órdenes */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Total Órdenes
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <PackageCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 {totalOrdenes}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Registradas en sistema
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Historial
 </span>
 </div>
 </div>

 {/* KPI 2: Enviadas / En Tránsito */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 En Tránsito / Parcial
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <Truck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {ordenesEnviadas + ordenesParciales + ordenesBorrador}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 {ordenesEnviadas} enviadas, {ordenesParciales} parciales
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 Pendientes
 </span>
 </div>
 </div>

 {/* KPI 3: Recepcionadas */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Recepcionadas
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {ordenesRecibidas}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Ingresadas a Kardex
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 En Almacén
 </span>
 </div>
 </div>

 {/* KPI 4: Monto en Espera */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 Monto en Espera
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <DollarSign className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
 S/ {montoComprometido.toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Pedidos pendientes
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 Comprometido
 </span>
 </div>
 </div>
 </div>

 {/* ─── BARRA DE HERRAMIENTAS, FILTROS Y BÚSQUEDA ─── */}
 <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
 {/* Fila 1: Buscador y Botón Nueva Orden */}
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
 <div className="relative flex-1 max-w-md">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por código (OC-0001), proveedor u observación..."
 className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-hidden"
 />
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 {productosCriticos.length > 0 && (
 <button
 type="button"
 onClick={handleCargarStockCritico}
 className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 animate-pulse hover:animate-none"
 title="Generar orden automática con productos en stock mínimo o crítico"
 >
 <AlertCircle className="w-4 h-4" />
 <span>Reponer Stock Crítico ({productosCriticos.length})</span>
 </button>
 )}

 <button
 type="button"
 onClick={() => {
 setItemsOrden([]);
 setBusqProd('');
 setFormOrden({
 id_proveedor: '',
 fecha_entrega_esperada: '',
 condicion_pago: 'Contado',
 metodo_envio: 'Flete Proveedor',
 almacen_destino: 'Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)',
 lugar_entrega: 'Patio de Materiales / Almacén Central',
 observaciones: ''
 });
 setDesplegableProvAbierto(false);
 setDesplegablePagoAbierto(false);
 setDesplegableAlmacenAbierto(false);
 setModalNuevaOrden(true);
 }}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
 >
 <Plus className="w-4 h-4" />
 <span>Nueva Orden de Compra</span>
 </button>
 </div>
 </div>

 {/* Fila 2: Filtros de Estado */}
 <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
 <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
 Estado:
 </span>
 {['TODOS', 'Borrador', 'Enviada', 'Parcial', 'Recibida', 'Cancelada'].map((est) => {
 const count = est === 'TODOS'
 ? ordenes.length
 : ordenes.filter((o) => o.estado === est).length;
 const isSelected = filtroEstado === est;

 return (
 <button
 key={est}
 type="button"
 onClick={() => setFiltroEstado(est)}
 className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
 isSelected
 ? 'bg-slate-900 text-white shadow-subpill-active'
 : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs hover:border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:border-slate-700/60'
 }`}
 >
 <span>{est}</span>
 <span
 className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
 isSelected
 ? 'bg-white/20 text-white'
 : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
 }`}
 >
 {count}
 </span>
 </button>
 );
 })}
 </div>
 </div>

 {/* ─── TABLA COMPACTA DE ÓRDENES DE COMPRA ─── */}
 <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider ">
 <th className="py-2.5 px-3.5 font-bold whitespace-nowrap min-w-[110px]">CÓDIGO</th>
 <th className="py-2.5 px-3.5 font-bold whitespace-nowrap min-w-[110px]">FECHA EMISIÓN</th>
 <th className="py-2.5 px-3.5 font-bold min-w-[220px]">PROVEEDOR / DISTRIBUIDOR</th>
 <th className="py-2.5 px-3.5 font-bold whitespace-nowrap text-center">CONDICIÓN PAGO</th>
 <th className="py-2.5 px-3.5 font-bold whitespace-nowrap min-w-[130px]">ENTREGA ESTIMADA</th>
 <th className="py-2.5 px-3.5 font-bold text-right whitespace-nowrap min-w-[110px]">TOTAL ESTIMADO</th>
 <th className="py-2.5 px-3.5 font-bold text-center whitespace-nowrap">ESTADO</th>
 <th className="py-2.5 px-3.5 font-bold text-center whitespace-nowrap">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {cargando ? (
 <tr>
 <td colSpan="8" className="py-10 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-2">
 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span className="font-medium text-xs">Cargando órdenes de compra...</span>
 </div>
 </td>
 </tr>
 ) : ordenes.length === 0 ? (
 <tr>
 <td colSpan="8" className="py-12 text-center text-slate-400">
 <PackageCheck className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
 <p className="font-bold text-slate-600 text-sm">No hay órdenes de compra registradas</p>
 <p className="text-xs text-slate-400 mt-0.5">
 Crea una orden para programar pedidos a tus proveedores ferreteros
 </p>
 </td>
 </tr>
 ) : (
 ordenes.map((o) => {
 const estadoBadge = {
 Borrador: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
 Enviada: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300',
 Parcial: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-black',
 Recibida: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300',
 Cancelada: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300'
 }[o.estado] || 'bg-slate-100 text-slate-700 border-slate-200';

 return (
 <tr key={o.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors">
 <td className="py-2.5 px-3.5 font-mono whitespace-nowrap">
 <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-black text-xs border border-indigo-200/80 dark:border-indigo-800 whitespace-nowrap inline-block shadow-2xs">
 {o.codigo}
 </span>
 </td>
 <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
 {o.fecha_emision}
 </td>
 <td className="py-2.5 px-3.5">
 <div className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
 {o.proveedor?.razon_social || 'Proveedor no asignado'}
 </div>
 <div className="text-[10px] text-slate-400 font-mono">
 RUC: {o.proveedor?.numero_documento || '---'}
 </div>
 {(o.almacen_destino || o.lugar_entrega) && (
 <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[240px] mt-0.5">
 Destino: {o.almacen_destino || o.lugar_entrega}
 </div>
 )}
 </td>
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
 {o.condicion_pago}
 </span>
 </td>
 <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
 {o.fecha_entrega_esperada ? (
 <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
 <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
 <span>{o.fecha_entrega_esperada}</span>
 </span>
 ) : (
 <span className="text-slate-400 italic text-[11px]">Inmediato / Sin fecha</span>
 )}
 </td>
 <td className="py-2.5 px-3.5 text-right font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">
 S/ {parseFloat(o.total || 0).toFixed(2)}
 </td>
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${estadoBadge}`}>
 {o.estado}
 </span>
 </td>
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <div className="flex items-center justify-center gap-1.5">
 {/* Botón Ver / Imprimir Orden */}
 <button
 type="button"
 onClick={() => setModalVerOrden(o)}
 title="Ver detalle e imprimir orden"
 className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>

 {/* Botón Recepcionar en Almacén si no está recibida ni cancelada */}
 {o.estado !== 'Recibida' && o.estado !== 'Cancelada' && (
 <button
 type="button"
 onClick={() => abrirModalRecepcion(o)}
 title={o.estado === 'Parcial' ? 'Recepcionar remanente de mercadería' : 'Recepcionar mercadería e ingresar a stock'}
 className={`px-2 py-1 rounded-lg text-white font-bold text-[10.5px] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors ${
 o.estado === 'Parcial'
 ? 'bg-amber-600 hover:bg-amber-500'
 : 'bg-emerald-600 hover:bg-emerald-500'
 }`}
 >
 <FileCheck className="w-3 h-3" />
 <span>{o.estado === 'Parcial' ? 'Completar' : 'Recepcionar'}</span>
 </button>
 )}

 {/* Botón Marcar como Enviada si está en Borrador */}
 {o.estado === 'Borrador' && (
 <button
 type="button"
 onClick={() => handleCambiarEstado(o.id, 'Enviada')}
 title="Marcar como Enviada al Proveedor"
 className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer"
 >
 <Send className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* ─── MODAL NUEVA ORDEN DE COMPRA ─── */}
 {modalNuevaOrden && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
 {/* Backdrop estático e independiente: cubre el 100% de la ventana incluyendo el topbar completo */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalNuevaOrden(false)}
 aria-hidden="true"
 />

 {/* Tarjeta del Modal con altura máxima y scroll interno */}
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col text-left relative z-10 cursor-default animate-in zoom-in-95 duration-200 overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Cabecera del Modal (Fija en la parte superior) */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-xs rounded-t-3xl shrink-0 z-20">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 pr-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  Generar Orden de Compra Ferretera
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Programa el pedido formal de mercadería a tu distribuidor
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalNuevaOrden(false)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
              title="Cerrar modal"
            >
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Formulario con cuerpo scrollable independiente y pie fijo */}
 <form onSubmit={handleCrearOrden} className="flex flex-col flex-1 min-h-0 overflow-hidden">
 {/* Cuerpo del Formulario con Scroll independiente */}
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
 {/* ─── FILA 1: PROVEEDOR Y CONDICIÓN DE PAGO (DROPDOWNS REDONDEADOS) ─── */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
 {/* Selector Desplegable Redondeado de Proveedor */}
 <div className={`sm:col-span-2 relative ${desplegableProvAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorProv}>
 <div className="flex items-center justify-between mb-1">
 <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
 Proveedor / Distribuidor <span className="text-rose-500">*</span>
 </label>
 <span className="text-[10px] text-slate-400 font-medium">
 {proveedores.length} disponibles
 </span>
 </div>

 {/* Botón Disparador estilo ModalProducto */}
 {(() => {
 const provSeleccionado = proveedores.find(p => String(p.id) === String(formOrden.id_proveedor));
 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableProvAbierto(!desplegableProvAbierto);
 setBusquedaProv('');
 setDesplegablePagoAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableProvAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className={`text-xs font-semibold truncate ${
 provSeleccionado
 ? 'text-slate-900 dark:text-white'
 : 'text-slate-400 dark:text-slate-500'
 }`}>
 {provSeleccionado
 ? `${provSeleccionado.razon_social} (${provSeleccionado.numero_documento})`
 : 'Seleccione Proveedor *'}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableProvAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>
 );
 })()}

 {/* Ventana Desplegable Redondeada (rounded-2xl) */}
 {desplegableProvAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {proveedores.length > 3 && (
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar proveedor o RUC..."
 value={busquedaProv}
 onChange={(e) => setBusquedaProv(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 )}

 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {(() => {
 const filtrados = proveedores.filter(p =>
 !busquedaProv.trim() ||
 (p.razon_social && p.razon_social.toLowerCase().includes(busquedaProv.toLowerCase().trim())) ||
 (p.numero_documento && p.numero_documento.includes(busquedaProv.trim()))
 );

 if (filtrados.length === 0) {
 return (
 <div className="px-3 py-3 text-center text-xs text-slate-400">
 No se encontró proveedor "{busquedaProv}"
 </div>
 );
 }

 return filtrados.map((p) => {
 const estaSel = String(formOrden.id_proveedor) === String(p.id);
 return (
 <button
 key={p.id}
 type="button"
 onClick={() => {
 let fechaEntregaCalc = formOrden.fecha_entrega_esperada;
 if (!fechaEntregaCalc && p.tiempo_entrega_dias) {
 const d = new Date();
 d.setDate(d.getDate() + parseInt(p.tiempo_entrega_dias));
 fechaEntregaCalc = d.toISOString().split('T')[0];
 }
 setFormOrden({
 ...formOrden,
 id_proveedor: p.id,
 fecha_entrega_esperada: fechaEntregaCalc,
 condicion_pago: p.dias_credito > 0 ? 'Crédito' : formOrden.condicion_pago
 });
 setDesplegableProvAbierto(false);
 setBusquedaProv('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="truncate pr-2">
 <span className="block truncate">{p.razon_social}</span>
 <span className="text-[10px] text-slate-400 font-normal">
 RUC/DNI: {p.numero_documento} {p.categoria_rubro ? `• ${p.categoria_rubro}` : ''}
 </span>
 </div>
 {estaSel && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
 </button>
 );
 });
 })()}
 </div>
 </div>
 )}
 </div>

 {/* Selector Desplegable Redondeado de Condición de Pago */}
 <div className={`relative ${desplegablePagoAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorPago}>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Condición de Pago
 </label>
 <button
 type="button"
 onClick={() => {
 setDesplegablePagoAbierto(!desplegablePagoAbierto);
 setDesplegableProvAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegablePagoAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {CONDICIONES_PAGO_ORDEN.find(c => c.valor === formOrden.condicion_pago)?.etiqueta || formOrden.condicion_pago}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegablePagoAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>

 {/* Menú Desplegable Redondeado (rounded-2xl) */}
 {desplegablePagoAbierto && (
 <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 min-w-[210px]">
 {CONDICIONES_PAGO_ORDEN.map((c) => {
 const estaSel = formOrden.condicion_pago === c.valor;
 return (
 <button
 key={c.valor}
 type="button"
 onClick={() => {
 setFormOrden({ ...formOrden, condicion_pago: c.valor });
 setDesplegablePagoAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="truncate pr-2">
 <span className="block truncate">{c.etiqueta}</span>
 <span className="text-[10px] text-slate-400 font-normal">{c.descripcion}</span>
 </div>
 {estaSel && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {/* ─── FILA 2: ALMACÉN DE DESTINO, FECHA, MÉTODO ENVÍO ─── */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
 {/* Selector Desplegable Redondeado de Almacén de Destino */}
 <div className={`relative ${desplegableAlmacenAbierto ? 'z-30' : 'z-10'}`} ref={refSelectorAlmacen}>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Almacén de Destino <span className="text-indigo-600">*</span>
 </label>
 {(() => {
 const almSel = ALMACENES_FERRETERIA.find(a => a.id === formOrden.almacen_destino);
 const IconoAlm = almSel ? almSel.icono : Warehouse;
 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableAlmacenAbierto(!desplegableAlmacenAbierto);
 setDesplegableProvAbierto(false);
 setDesplegablePagoAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableAlmacenAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <div className="flex items-center gap-1.5 min-w-0">
 <IconoAlm className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {almSel ? almSel.nombre : 'Seleccione Almacén'}
 </span>
 </div>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableAlmacenAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>
 );
 })()}

 {/* Menú Desplegable Redondeado de Almacenes */}
 {desplegableAlmacenAbierto && (
 <div className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
 {ALMACENES_FERRETERIA.map((alm) => {
 const estaSel = formOrden.almacen_destino === alm.id;
 const Icono = alm.icono;
 return (
 <button
 key={alm.id}
 type="button"
 onClick={() => {
 setFormOrden({ ...formOrden, almacen_destino: alm.id, lugar_entrega: alm.nombre });
 setDesplegableAlmacenAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="flex items-start gap-2 min-w-0 pr-2">
 <Icono className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
 <div className="truncate">
 <span className="block truncate font-bold">{alm.nombre}</span>
 <span className="text-[10px] text-slate-400 font-normal line-clamp-1">{alm.descripcion}</span>
 </div>
 </div>
 {estaSel && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 )}
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Fecha Entrega Esperada
 </label>
 <input
 type="date"
 value={formOrden.fecha_entrega_esperada}
 onChange={(e) => setFormOrden({ ...formOrden, fecha_entrega_esperada: e.target.value })}
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Método de Envío / Flete
 </label>
 <input
 type="text"
 value={formOrden.metodo_envio}
 onChange={(e) => setFormOrden({ ...formOrden, metodo_envio: e.target.value })}
 placeholder="Flete Proveedor, Camión Propio..."
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 </div>

 {/* ─── FILA 3: BÚSQUEDA DE PRODUCTOS DEL CATÁLOGO & STOCK CRÍTICO ─── */}
 <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider block ">
 Buscar e incorporar productos a la orden
 </span>
 {productosCriticos.length > 0 && (
 <button
 type="button"
 onClick={() => {
 const nuevos = productosCriticos.filter(p => !itemsOrden.some(i => i.id_producto === p.id));
 if (nuevos.length === 0) {
 return toast('Todos los productos con stock bajo ya están en la orden.');
 }
 const mapeados = nuevos.map(p => {
 const stockActual = parseFloat(p.stock) || 0;
 const stockMin = parseFloat(p.stock_minimo) || 0;
 const deficiencia = Math.max(1, (stockMin * 2) - stockActual);
 return {
 id_producto: p.id,
 nombre: p.nombre,
 unidad_medida: p.unidad_medida,
 marca: p.marca || 'Genérico',
 cantidad: Math.ceil(deficiencia),
 precio_unitario: parseFloat(p.precio_compra) || 0
 };
 });
 setItemsOrden([...itemsOrden, ...mapeados]);
 toast.success(`${mapeados.length} productos críticos agregados a la orden`);
 }}
 className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 text-[10.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
 >
 <AlertCircle className="w-3 h-3 text-amber-500" />
 <span>+ Reponer stock crítico ({productosCriticos.length})</span>
 </button>
 )}
 </div>

 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={busqProd}
 onChange={(e) => setBusqProd(e.target.value)}
 placeholder="Escriba nombre, código de barra o marca..."
 className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 {busqProd.trim() && (
 <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl custom-scrollbar">
 {productos
 .filter(p => p.nombre.toLowerCase().includes(busqProd.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(busqProd)))
 .slice(0, 8)
 .map((prod) => {
 const stockActual = parseFloat(prod.stock) || 0;
 const stockMin = parseFloat(prod.stock_minimo) || 0;
 const esBajo = stockMin > 0 && stockActual <= stockMin;

 return (
 <div
 key={prod.id}
 onClick={() => agregarItem(prod)}
 className="p-2.5 hover:bg-indigo-50/70 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
 >
 <div>
 <span className="font-bold text-slate-800 dark:text-white">{prod.nombre}</span>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[10px] text-slate-500 dark:text-slate-400">Stock: {stockActual} {prod.unidad_medida}</span>
 {stockMin > 0 && (
 <span className="text-[10px] text-slate-400 font-mono">| Mín: {stockMin}</span>
 )}
 {esBajo && (
 <span className="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/80 text-[9.5px] font-bold flex items-center gap-0.5">
 <AlertCircle className="w-2.5 h-2.5" />
 Stock Bajo
 </span>
 )}
 </div>
 </div>
 <div className="text-right">
 <span className="font-black text-indigo-600 dark:text-indigo-400 block">S/ {parseFloat(prod.precio_compra).toFixed(2)}</span>
 <span className="text-[9.5px] text-slate-400 font-medium">+ Agregar</span>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* ─── FILA 4: TABLA DE ÍTEMS EN LA ORDEN ─── */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              {itemsOrden.length > 0 && (
                <div className="sm:hidden px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                  <span>{itemsOrden.length} {itemsOrden.length === 1 ? 'producto' : 'productos'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Desliza para ver columnas</span>
                </div>
              )}
              <div className="max-h-56 overflow-x-auto overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[540px]">
 <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-[10.5px] uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="py-2.5 px-3">PRODUCTO / MATERIAL</th>
 <th className="py-2.5 px-3 w-28 text-center">CANTIDAD</th>
 <th className="py-2.5 px-3 w-28 text-right">COSTO PACTADO</th>
 <th className="py-2.5 px-3 w-28 text-right">SUBTOTAL</th>
 <th className="py-2.5 px-2 w-10 text-center"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {itemsOrden.length === 0 ? (
 <tr>
 <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
 No hay productos agregados a la orden
 </td>
 </tr>
 ) : (
 itemsOrden.map((it, idx) => (
 <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
 <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-white">
 <div>{it.nombre}</div>
 <div className="text-[10px] text-slate-400 font-mono">
 Unidad: {it.unidad_medida} • Marca: {it.marca}
 </div>
 </td>
 <td className="py-2.5 px-3 text-center">
 <input
 type="number"
 min="0.1"
 step="any"
 value={it.cantidad}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setItemsOrden(
 itemsOrden.map((item, i) =>
 i === idx ? { ...item, cantidad: val } : item
 )
 );
 }}
 className="w-20 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-1 text-xs font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:outline-none"
 />
 </td>
 <td className="py-2.5 px-3 text-right">
 <input
 type="number"
 min="0"
 step="0.01"
 value={it.precio_unitario}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setItemsOrden(
 itemsOrden.map((item, i) =>
 i === idx ? { ...item, precio_unitario: val } : item
 )
 );
 }}
 className="w-20 text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-1 px-1.5 text-xs font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:outline-none"
 />
 </td>
 <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
 S/ {(it.cantidad * it.precio_unitario).toFixed(2)}
 </td>
 <td className="py-2.5 px-2 text-center">
 <button
 type="button"
 onClick={() => setItemsOrden(itemsOrden.filter((_, i) => i !== idx))}
 className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
 title="Quitar ítem"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* ─── FILA 5: OBSERVACIONES ─── */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Observaciones e Instrucciones para el Proveedor
 </label>
 <textarea
 rows="2"
 value={formOrden.observaciones}
 onChange={(e) => setFormOrden({ ...formOrden, observaciones: e.target.value })}
 placeholder="Instrucciones de descarga, horario de recepción en patio, etc..."
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 </div>

 {/* ─── PIE CON TOTALES Y ACCIONES (FIJO EN LA PARTE INFERIOR) ─── */}
            <div className="p-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md rounded-b-3xl shrink-0 z-20">
              {/* Desglose de Totales Optimizado */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                {/* Subtotal */}
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Subtotal:
                  </span>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 font-mono">
                    S/ {subtotalSinIgv.toFixed(2)}
                  </span>
                </div>

                {/* IGV (18%) */}
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    IGV (18%):
                  </span>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 font-mono">
                    S/ {igvEstimado.toFixed(2)}
                  </span>
                </div>

                {/* Total Estimado Orden Destacado */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Total Orden:
                  </span>
                  <span className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300 tracking-tight">
                    S/ {totalNuevaOrden.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setModalNuevaOrden(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Generar Orden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>,
 document.body
 )}

 {/* ─── MODAL RECEPCIÓN DE MERCADERÍA EN ALMACÉN (PORTAL) ─── */}
 {modalRecepcion && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalRecepcion(null)}
 aria-hidden="true"
 />

 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col text-left relative z-10 cursor-default animate-in zoom-in-95 duration-200 overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Cabecera Fija */}
 <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/80 dark:bg-emerald-950/40 rounded-t-3xl shrink-0 z-20">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
 <FileCheck className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight ">
 Recepcionar Mercadería: {modalRecepcion.codigo}
 </h3>
 <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
 Control físico de ingreso a almacén con soporte para entregas parciales
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalRecepcion(null)}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation">
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 </button>
 </div>

 {/* Formulario con cuerpo scrollable independiente */}
 <form onSubmit={handleConfirmarRecepcion} className="flex flex-col flex-1 min-h-0 overflow-hidden">
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 space-y-4">
 {/* Resumen de la Orden */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
 <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
 <span className="text-[10px] uppercase font-bold text-slate-400 block">PROVEEDOR</span>
 <span className="font-bold text-slate-800 dark:text-white truncate block">
 {modalRecepcion.proveedor?.razon_social}
 </span>
 <span className="text-[10px] text-slate-400 font-mono">
 RUC: {modalRecepcion.proveedor?.numero_documento}
 </span>
 </div>

 <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
 <span className="text-[10px] uppercase font-bold text-slate-400 block">ALMACÉN DE INGRESO</span>
 <span className="font-bold text-indigo-700 dark:text-indigo-400 truncate block">
 {modalRecepcion.almacen_destino || modalRecepcion.lugar_entrega || 'Almacén Central'}
 </span>
 <span className="text-[10px] text-slate-400">
 Condición: {modalRecepcion.condicion_pago}
 </span>
 </div>

 <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80">
 <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">TOTAL DE LA ORDEN</span>
 <span className="font-black text-emerald-700 dark:text-emerald-300 text-base block">
 S/ {parseFloat(modalRecepcion.total || 0).toFixed(2)}
 </span>
 <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
 Estado actual: {modalRecepcion.estado}
 </span>
 </div>
 </div>

 {/* Comprobante de Compra */}
 <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
 Comprobante de Pago Emitido por Proveedor
 </span>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo Doc.</label>
 <select
 value={formRecepcion.tipo_comprobante}
 onChange={(e) => setFormRecepcion({ ...formRecepcion, tipo_comprobante: e.target.value })}
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-hidden focus:border-emerald-500"
 >
 <option value="Factura">Factura</option>
 <option value="Boleta">Boleta</option>
 <option value="Guia">Guía de Remisión</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Serie</label>
 <input
 type="text"
 value={formRecepcion.serie}
 onChange={(e) => setFormRecepcion({ ...formRecepcion, serie: e.target.value })}
 placeholder="F001"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-emerald-500"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Número *</label>
 <input
 type="text"
 required
 value={formRecepcion.numero}
 onChange={(e) => setFormRecepcion({ ...formRecepcion, numero: e.target.value })}
 placeholder="004821"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-emerald-500"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 N° Guía de Remisión del Proveedor / Transportista (Opcional)
 </label>
 <input
 type="text"
 value={formRecepcion.guia_remision}
 onChange={(e) => setFormRecepcion({ ...formRecepcion, guia_remision: e.target.value })}
 placeholder="T001-001293 (Obligatorio para fierro y cemento en tránsito)"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-white outline-hidden focus:border-emerald-500"
 />
 </div>
 </div>

 {/* Tabla de Ítems a Recepcionar (Control de Entregas Parciales) */}
 <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
 <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
 <div>
 <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
 Cantidades Físicas a Recepcionar Hoy
 </span>
 <span className="text-[10.5px] text-slate-400">
 Ajusta si el flete o camión trajo entrega parcial
 </span>
 </div>
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() => {
 setFormRecepcion({
 ...formRecepcion,
 items_recibidos: formRecepcion.items_recibidos.map(it => ({
 ...it,
 cantidad_recibir_hoy: it.pendiente
 }))
 });
 }}
 className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10.5px] font-bold transition-colors cursor-pointer"
 >
 Recibir todo el saldo
 </button>
 <button
 type="button"
 onClick={() => {
 setFormRecepcion({
 ...formRecepcion,
 items_recibidos: formRecepcion.items_recibidos.map(it => ({
 ...it,
 cantidad_recibir_hoy: 0
 }))
 });
 }}
 className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10.5px] font-bold transition-colors cursor-pointer"
 >
 Poner a 0
 </button>
 </div>
 </div>

 <div className="max-h-60 overflow-y-auto custom-scrollbar">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="py-2.5 px-3">PRODUCTO / MATERIAL</th>
 <th className="py-2.5 px-2.5 text-center w-20">PEDIDO</th>
 <th className="py-2.5 px-2.5 text-center w-20">RECIBIDO</th>
 <th className="py-2.5 px-2.5 text-center w-20">PENDIENTE</th>
 <th className="py-2.5 px-3 text-center w-32">INGRESAR HOY</th>
 <th className="py-2.5 px-3 text-right w-24">SUBTOTAL</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {formRecepcion.items_recibidos?.map((it, idx) => {
 const cantHoy = parseFloat(it.cantidad_recibir_hoy) || 0;
 const subVal = cantHoy * (it.precio_unitario || 0);
 const esSaldoCero = it.pendiente <= 0;

 return (
 <tr key={it.id_producto} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
 <td className="py-2.5 px-3">
 <div className="font-semibold text-slate-800 dark:text-white leading-tight">
 {it.nombre}
 </div>
 <div className="text-[10px] text-slate-400 font-mono">
 {it.unidad_medida} • Costo pactado: S/ {it.precio_unitario.toFixed(2)}
 </div>
 </td>
 <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
 {it.cantidad_pedida}
 </td>
 <td className="py-2.5 px-2.5 text-center font-medium text-emerald-600 dark:text-emerald-400">
 {it.ya_recibida}
 </td>
 <td className="py-2.5 px-2.5 text-center font-bold text-amber-600 dark:text-amber-400">
 {it.pendiente}
 </td>
 <td className="py-2.5 px-3 text-center">
 <input
 type="number"
 min="0"
 max={it.pendiente}
 step="any"
 disabled={esSaldoCero}
 value={it.cantidad_recibir_hoy}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setFormRecepcion({
 ...formRecepcion,
 items_recibidos: formRecepcion.items_recibidos.map((item, i) =>
 i === idx ? { ...item, cantidad_recibir_hoy: val } : item
 )
 });
 }}
 className={`w-24 text-center border rounded-lg py-1 text-xs font-black focus:outline-none ${
 esSaldoCero
 ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
 : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 ring-2 ring-transparent focus:ring-emerald-500/20'
 }`}
 />
 </td>
 <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
 S/ {subVal.toFixed(2)}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* Alerta Dinámica de Estado Resultante */}
 {(() => {
 const items = formRecepcion.items_recibidos || [];
 const todosCompletos = items.length > 0 && items.every(
 it => (it.ya_recibida + (parseFloat(it.cantidad_recibir_hoy) || 0)) >= (it.cantidad_pedida - 0.001)
 );
 const algoARecibir = items.some(
 it => (parseFloat(it.cantidad_recibir_hoy) || 0) > 0
 );

 if (!algoARecibir) {
 return (
 <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2">
 <Info className="w-4 h-4 text-slate-400 shrink-0" />
 <span>Ingrese al menos una cantidad mayor a 0 para confirmar la recepción física.</span>
 </div>
 );
 }

 if (todosCompletos) {
 return (
 <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 <span><strong>Recepción Total:</strong> Se completará el 100% de los materiales. La orden pasará a estado <strong>Recibida</strong> y se sumará el stock a Kardex.</span>
 </div>
 );
 }

 return (
 <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
 <Clock className="w-4 h-4 text-amber-600 shrink-0" />
 <span><strong>Entrega Parcial:</strong> Quedarán materiales pendientes. La orden quedará en estado <strong>Parcial</strong> y podrás recepcionar el saldo restante en próximas entregas.</span>
 </div>
 );
 })()}
 </div>

 {/* Pie Fijo con Total a Ingresar y Botones */}
 <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md rounded-b-3xl shrink-0 z-20">
 <div className="flex items-center gap-2">
 <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
 Importe a Ingresar Hoy:
 </span>
 <span className="text-base font-black text-emerald-700 dark:text-emerald-300 ">
 S/ {(formRecepcion.items_recibidos || []).reduce((sum, it) => sum + ((parseFloat(it.cantidad_recibir_hoy) || 0) * (it.precio_unitario || 0)), 0).toFixed(2)}
 </span>
 </div>

 <div className="flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setModalRecepcion(null)}
 className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={recepcionando}
 className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
 >
 {recepcionando ? (
 <>
 <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span>Ingresando a stock...</span>
 </>
 ) : (
 <>
 <CheckCircle2 className="w-4 h-4" />
 <span>Confirmar Recepción</span>
 </>
 )}
 </button>
 </div>
 </div>
 </form>
 </div>
 </div>,
 document.body
 )}

 {/* ─── MODAL VER E IMPRIMIR ORDEN DE COMPRA (PORTAL) ─── */}
 {modalVerOrden && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalVerOrden(null)}
 aria-hidden="true"
 />

 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col text-left relative z-10 cursor-default animate-in zoom-in-95 duration-200 overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Membrete Oficial Fijo */}
 <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 pr-1">
                <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  ORDEN DE COMPRA OFICIAL
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 truncate">
                  {modalVerOrden.codigo}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Fecha Emisión: {modalVerOrden.fecha_emision}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-400 block ">ESTADO</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                  modalVerOrden.estado === 'Recibida'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : modalVerOrden.estado === 'Parcial'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : modalVerOrden.estado === 'Enviada'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {modalVerOrden.estado}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalVerOrden(null)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                title="Cerrar orden"
              >
                <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

 {/* Cuerpo Scrollable */}
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 space-y-4">
 {/* Datos del Proveedor y Despacho */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
 <div>
 <span className="text-slate-400 font-bold block text-[10px] uppercase">PROVEEDOR:</span>
 <span className="font-extrabold text-slate-800 dark:text-white text-sm">{modalVerOrden.proveedor?.razon_social}</span>
 <span className="text-slate-500 dark:text-slate-400 block">RUC: {modalVerOrden.proveedor?.numero_documento}</span>
 <span className="text-slate-500 dark:text-slate-400 block">Tel: {modalVerOrden.proveedor?.telefono || 'No registrado'}</span>
 </div>
 <div>
 <span className="text-slate-400 font-bold block text-[10px] uppercase">CONDICIONES & DESTINO:</span>
 <span className="font-bold text-slate-700 dark:text-slate-300 block">Pago: {modalVerOrden.condicion_pago}</span>
 <span className="text-slate-600 dark:text-slate-400 block">Flete: {modalVerOrden.metodo_envio}</span>
 <span className="text-indigo-600 dark:text-indigo-400 font-semibold block">
 Almacén: {modalVerOrden.almacen_destino || modalVerOrden.lugar_entrega || 'Almacén Central'}
 </span>
 </div>
 </div>

 {/* Ítems de la Orden con seguimiento de entrega */}
 <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10.5px]">
 <tr>
 <th className="py-2.5 px-3">ÍTEM / MATERIAL</th>
 <th className="py-2.5 px-2.5 text-center">PEDIDO</th>
 <th className="py-2.5 px-2.5 text-center">RECIBIDO</th>
 <th className="py-2.5 px-2.5 text-center">PENDIENTE</th>
 <th className="py-2.5 px-3 text-right">COSTO</th>
 <th className="py-2.5 px-3 text-right">TOTAL</th>
 <th className="py-2.5 px-2.5 text-center">ESTADO</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {modalVerOrden.detalles?.map((d, i) => {
 const cantPed = parseFloat(d.cantidad) || 0;
 const cantRec = parseFloat(d.cantidad_recibida) || 0;
 const pendiente = Math.max(0, parseFloat((cantPed - cantRec).toFixed(3)));
 const esCompleto = cantRec >= cantPed - 0.001;

 return (
 <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
 <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-white">
 <div>{d.producto?.nombre}</div>
 <div className="text-[10px] text-slate-400 font-mono">
 Unidad: {d.producto?.unidad_medida}
 </div>
 </td>
 <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
 {cantPed}
 </td>
 <td className="py-2.5 px-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
 {cantRec}
 </td>
 <td className="py-2.5 px-2.5 text-center font-bold text-amber-600 dark:text-amber-400">
 {pendiente}
 </td>
 <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-mono">
 S/ {parseFloat(d.precio_unitario).toFixed(2)}
 </td>
 <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white font-mono">
 S/ {parseFloat(d.subtotal).toFixed(2)}
 </td>
 <td className="py-2.5 px-2.5 text-center">
 {esCompleto ? (
 <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
 Completo
 </span>
 ) : cantRec > 0 ? (
 <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
 Parcial
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">
 Pendiente
 </span>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* Total */}
 <div className="flex justify-between items-center bg-indigo-50/70 dark:bg-indigo-950/50 p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80">
 <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">IMPORTE TOTAL DE LA ORDEN:</span>
 <span className="text-xl font-black text-indigo-950 dark:text-indigo-200 ">
 S/ {parseFloat(modalVerOrden.total).toFixed(2)}
 </span>
 </div>
 </div>

 {/* Botones de acción Fijos */}
 <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-b-3xl shrink-0 z-20">
 <button
 type="button"
 onClick={() => window.print()}
 className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
 >
 <Printer className="w-4 h-4" />
 <span>Imprimir / Exportar PDF</span>
 </button>
 <button
 type="button"
 onClick={() => setModalVerOrden(null)}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>,
 document.body
 )}
 </div>
 );
}
