import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 Truck,
 Plus,
 Eye,
 X,
 Search,
 Filter,
 Trash2,
 DollarSign,
 Calendar,
 Building2,
 FileText,
 CheckCircle2,
 Printer,
 ShieldCheck,
 RefreshCw,
 Clock,
 Layers,
 ChevronDown,
 Check,
 Percent,
 TrendingUp,
 TrendingDown,
 Receipt,
 CalendarDays,
 Warehouse,
 ClipboardList,
 PackageCheck,
 ArrowRight,
 Split,
 MapPin,
 AlertCircle
} from 'lucide-react';

export default function Compras() {
 const [compras, setCompras] = useState([]);
 const [proveedores, setProveedores] = useState([]);
 const [productos, setProductos] = useState([]);
 const [ordenesCompra, setOrdenesCompra] = useState([]);
 const [cargando, setCargando] = useState(true);

 // Filtros
 const [busqueda, setBusqueda] = useState('');
 const [filtroTipoPago, setFiltroTipoPago] = useState('TODOS');
 const [filtroTipoComp, setFiltroTipoComp] = useState('TODOS');

 // Modal Nueva Compra
 const [modalAbierto, setModalAbierto] = useState(false);
 const [modalVerCompra, setModalVerCompra] = useState(null);
 const [modalImportarOC, setModalImportarOC] = useState(false);
 const [busquedaOC, setBusquedaOC] = useState('');
 const [guardando, setGuardando] = useState(false);

 // Form State
 const [idProveedor, setIdProveedor] = useState('');
 const [tipoComprobante, setTipoComprobante] = useState('Factura');
 const [serie, setSerie] = useState('F001');
 const [numero, setNumero] = useState('');
 const [guiaRemision, setGuiaRemision] = useState('');
 const [tipoPago, setTipoPago] = useState('Contado');
 const [creditoDias, setCreditoDias] = useState(30);
 const [esFiscalizado, setEsFiscalizado] = useState(false);
 const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
 const [aplicaPercepcion, setAplicaPercepcion] = useState(false);
 const [tipoPercepcion, setTipoPercepcion] = useState('2'); // '1', '2', 'MANUAL'
 const [porcentajePercepcion, setPorcentajePercepcion] = useState(2);
 const [montoPercepcionManual, setMontoPercepcionManual] = useState('');
 const [itemsCompra, setItemsCompra] = useState([]);
 const [busqProd, setBusqProd] = useState('');

 // Fase 2: Almacén de Destino y Flete Landed
 const [almacenDestino, setAlmacenDestino] = useState('Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)');
 const [desplegableAlmacenAbierto, setDesplegableAlmacenAbierto] = useState(false);
 const refSelectorAlmacen = useRef(null);

 const [flete, setFlete] = useState('');
 const [prorratearFlete, setProrratearFlete] = useState(false);
 const [idOrdenCompra, setIdOrdenCompra] = useState(null);
 const [codigoOrdenCompra, setCodigoOrdenCompra] = useState('');

 // Dropdowns con diseño redondeado (estilo Categoría / Familia de ModalProducto)
 const [desplegableProvAbierto, setDesplegableProvAbierto] = useState(false);
 const [busquedaProv, setBusquedaProv] = useState('');
 const refSelectorProv = useRef(null);

 const [desplegablePagoAbierto, setDesplegablePagoAbierto] = useState(false);
 const refSelectorPago = useRef(null);

 const [desplegableCompAbierto, setDesplegableCompAbierto] = useState(false);
 const refSelectorComp = useRef(null);

 const ALMACENES_FERRETERIA = [
 {
 id: 'Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)',
 nombre: 'Almacén Central (Patio Materiales)',
 descripcion: 'Cemento, Fierro corrugado, Áridos, Ladrillos y Pesados',
 icono: Warehouse,
 color: 'indigo'
 },
 {
 id: 'Tienda Mostrador (Salón de Ventas - Herramientas y Acabados)',
 nombre: 'Tienda Mostrador (Salón Ventas)',
 descripcion: 'Herramientas eléctricas, Manuales, Grifería y Mostrador',
 icono: Building2,
 color: 'emerald'
 },
 {
 id: 'Depósito Secundario / Taller de Corte y Tuberías',
 nombre: 'Depósito Secundario (Corte/Tuberías)',
 descripcion: 'Tuberías PVC/Fierro, Perfiles de aluminio y Planchas',
 icono: Layers,
 color: 'amber'
 },
 {
 id: 'Depósito Especial IQBF (Químicos y Solventes)',
 nombre: 'Depósito Especial IQBF (Solventes)',
 descripcion: 'Thinner, Ácidos, Resinas y Sustancias Fiscalizadas',
 icono: ShieldCheck,
 color: 'rose'
 }
 ];

 const TIPOS_PAGO = [
 { valor: 'Contado', etiqueta: 'Contado (Efectivo/Caja)', descripcion: 'Egreso de caja chica o banco' },
 { valor: 'Credito', etiqueta: 'Crédito (Cuentas por Pagar)', descripcion: 'Genera deuda con plazo de pago' }
 ];

 const TIPOS_COMPROBANTE = [
 { valor: 'Factura', etiqueta: 'Factura', subtitulo: 'Comprobante oficial con crédito fiscal' },
 { valor: 'Boleta', etiqueta: 'Boleta', subtitulo: 'Boleta de venta de proveedor' },
 { valor: 'Guia', etiqueta: 'Guía de Remisión', subtitulo: 'Recepción y traslado de mercadería' },
 { valor: 'Nota', etiqueta: 'Nota de Venta', subtitulo: 'Control interno / Recibo de compra' }
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
 if (refSelectorComp.current && !refSelectorComp.current.contains(e.target)) {
 setDesplegableCompAbierto(false);
 }
 if (refSelectorAlmacen.current && !refSelectorAlmacen.current.contains(e.target)) {
 setDesplegableAlmacenAbierto(false);
 }
 };
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 setDesplegableProvAbierto(false);
 setDesplegablePagoAbierto(false);
 setDesplegableCompAbierto(false);
 setDesplegableAlmacenAbierto(false);
 setModalImportarOC(false);
 }
 };
 document.addEventListener('mousedown', handleClickAfuera);
 document.addEventListener('keydown', handleKeyDown);
 return () => {
 document.removeEventListener('mousedown', handleClickAfuera);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, []);

 const cargarDatos = async () => {
 setCargando(true);
 try {
 const [resComp, resProv, resProd, resOC] = await Promise.all([
 api.get('/compras'),
 api.get('/proveedores'),
 api.get('/productos?limit=250'),
 api.get('/ordenes-compra?estado=TODOS').catch(() => ({ success: false, ordenes: [] }))
 ]);
 if (resComp && resComp.success) setCompras(resComp.compras || []);
 if (resProv && resProv.success) setProveedores(resProv.proveedores || []);
 if (resProd && resProd.success) setProductos(resProd.productos || []);
 if (resOC && resOC.success) setOrdenesCompra(resOC.ordenes || []);
 } catch (e) {
 toast.error(e?.response?.data?.message || e?.message || 'Error al cargar historial de compras');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 const agregarItem = (prod) => {
 const existe = itemsCompra.find((i) => i.id_producto === prod.id);
 const precioCompraActual = parseFloat(prod.precio_compra) || 0;
 const precioVentaActual = parseFloat(prod.precio_venta) || 0;
 const margenRatio = precioCompraActual > 0
 ? ((precioVentaActual - precioCompraActual) / precioCompraActual)
 : 0.25;

 if (existe) {
 setItemsCompra(
 itemsCompra.map((i) =>
 i.id_producto === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i
 )
 );
 } else {
 setItemsCompra([
 ...itemsCompra,
 {
 id_producto: prod.id,
 nombre: prod.nombre,
 unidad_medida: prod.unidad_medida,
 marca: prod.marca || 'Genérico',
 costo_anterior: precioCompraActual,
 precio_unitario: precioCompraActual,
 precio_venta: precioVentaActual,
 nuevo_precio_venta: precioVentaActual,
 actualizar_precio_venta: false,
 margen_ratio: margenRatio,
 cantidad: 1
 }
 ]);
 }
 setBusqProd('');
 };

 const handleCambioCostoUnitario = (idx, nuevoCosto) => {
 setItemsCompra(
 itemsCompra.map((it, i) => {
 if (i !== idx) return it;
 const costoVal = parseFloat(nuevoCosto) || 0;
 const ratio = it.margen_ratio && it.margen_ratio > 0 ? it.margen_ratio : 0.25;
 const pvSugerido = parseFloat((costoVal * (1 + ratio)).toFixed(2));
 const subioCosto = it.costo_anterior > 0 && costoVal > it.costo_anterior;
 return {
 ...it,
 precio_unitario: costoVal,
 nuevo_precio_venta: pvSugerido,
 actualizar_precio_venta: subioCosto ? true : it.actualizar_precio_venta
 };
 })
 );
 };

 const handleImportarOrden = (oc) => {
 if (!oc) return;
 setIdProveedor(oc.id_proveedor);
 if (oc.condicion_pago === 'Crédito') {
 setTipoPago('Credito');
 } else {
 setTipoPago('Contado');
 }
 if (oc.almacen_destino) {
 setAlmacenDestino(oc.almacen_destino);
 } else if (oc.lugar_entrega) {
 const matchAlm = ALMACENES_FERRETERIA.find(a =>
 a.id.toLowerCase().includes(oc.lugar_entrega.toLowerCase()) ||
 oc.lugar_entrega.toLowerCase().includes(a.nombre.toLowerCase())
 );
 if (matchAlm) {
 setAlmacenDestino(matchAlm.id);
 }
 }

 const itemsMapeados = (oc.detalles || [])
 .map((d) => {
 const prod = productos.find(p => p.id === d.id_producto) || d.producto || {};
 const precioCompraActual = parseFloat(prod.precio_compra) || parseFloat(d.precio_unitario) || 0;
 const precioVentaActual = parseFloat(prod.precio_venta) || 0;
 const margenRatio = precioCompraActual > 0
 ? ((precioVentaActual - precioCompraActual) / precioCompraActual)
 : 0.25;
 const pUnit = parseFloat(d.precio_unitario) || precioCompraActual;
 const cantPedida = parseFloat(d.cantidad) || 0;
 const cantYaRecibida = parseFloat(d.cantidad_recibida) || 0;
 const pendiente = Math.max(0, parseFloat((cantPedida - cantYaRecibida).toFixed(3)));
 const cantInicial = pendiente > 0 ? pendiente : cantPedida;

 return {
 id_producto: d.id_producto,
 nombre: d.producto?.nombre || prod.nombre || 'Artículo',
 unidad_medida: d.producto?.unidad_medida || prod.unidad_medida || 'UND',
 marca: d.producto?.marca || prod.marca || 'Genérico',
 costo_anterior: precioCompraActual,
 precio_unitario: pUnit,
 precio_venta: precioVentaActual,
 nuevo_precio_venta: precioVentaActual,
 actualizar_precio_venta: false,
 margen_ratio: margenRatio,
 cantidad: cantInicial,
 cant_pedida_oc: cantPedida,
 cant_ya_recibida_oc: cantYaRecibida,
 cant_pendiente_oc: pendiente
 };
 })
 .filter(item => item.cant_pendiente_oc > 0 || oc.estado !== 'Parcial');

 setItemsCompra(itemsMapeados);
 setIdOrdenCompra(oc.id);
 setCodigoOrdenCompra(oc.codigo);
 setModalImportarOC(false);
 toast.success(`Orden ${oc.codigo} importada. Ajuste cantidades físicas recibidas.`);
 };

 const handleCrearCompra = async (e) => {
 e.preventDefault();
 if (!idProveedor) {
 return toast.error('Seleccione un proveedor.');
 }
 if (itemsCompra.length === 0) {
 return toast.error('Agregue al menos un producto a la compra.');
 }
 if (!numero.trim()) {
 return toast.error('Ingrese el número de comprobante de compra.');
 }

 setGuardando(true);
 try {
 const res = await api.post('/compras', {
 serie,
 numero,
 guia_remision: guiaRemision || null,
 tipo_comprobante: tipoComprobante,
 id_proveedor: parseInt(idProveedor),
 tipo_pago: tipoPago,
 credito_dias: parseInt(creditoDias),
 es_fiscalizado: esFiscalizado,
 fecha_emision: fechaEmision,
 aplica_percepcion: aplicaPercepcion,
 porcentaje_percepcion: tipoPercepcion === 'MANUAL' ? 0 : parseFloat(porcentajePercepcion || 0),
 monto_percepcion: montoPercepcionCalculado,
 almacen_destino: almacenDestino,
 flete: parseFloat(flete || 0),
 prorratear_flete: prorratearFlete,
 id_orden_compra: idOrdenCompra || null,
 items: itemsCompra.map((it) => ({
 id_producto: it.id_producto,
 cantidad: it.cantidad,
 precio_unitario: it.precio_unitario,
 costo_anterior: it.costo_anterior,
 nuevo_precio_venta: it.nuevo_precio_venta,
 actualizar_precio_venta: Boolean(it.actualizar_precio_venta)
 }))
 });
 if (res && res.success) {
 toast.success(res.message);
 setModalAbierto(false);
 setItemsCompra([]);
 setNumero('');
 setGuiaRemision('');
 setEsFiscalizado(false);
 setFechaEmision(new Date().toISOString().split('T')[0]);
 setAplicaPercepcion(false);
 setTipoPercepcion('2');
 setPorcentajePercepcion(2);
 setMontoPercepcionManual('');
 setAlmacenDestino('Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)');
 setFlete('');
 setProrratearFlete(false);
 setIdOrdenCompra(null);
 setCodigoOrdenCompra('');
 cargarDatos();
 }
 } catch (error) {
 toast.error(error.message || 'Error al registrar compra');
 } finally {
 setGuardando(false);
 }
 };

 // Filtrado
 const comprasFiltradas = compras.filter((c) => {
 if (filtroTipoPago !== 'TODOS' && c.tipo_pago !== filtroTipoPago) return false;
 if (filtroTipoComp !== 'TODOS' && c.tipo_comprobante !== filtroTipoComp) return false;
 if (busqueda.trim()) {
 const q = busqueda.toLowerCase();
 const numComp = `${c.serie || ''}-${c.numero || ''}`.toLowerCase();
 const prov = (c.proveedor?.razon_social || '').toLowerCase();
 const ruc = (c.proveedor?.numero_documento || '').toLowerCase();
 const guia = (c.guia_remision || '').toLowerCase();
 return numComp.includes(q) || prov.includes(q) || ruc.includes(q) || guia.includes(q);
 }
 return true;
 });

 // Métricas
 const totalMontoCompras = compras.reduce((sum, c) => sum + parseFloat(c.total_con_percepcion || c.total || 0), 0);
 const totalContado = compras
 .filter((c) => c.tipo_pago === 'Contado')
 .reduce((sum, c) => sum + parseFloat(c.total_con_percepcion || c.total || 0), 0);
 const totalCredito = compras
 .filter((c) => c.tipo_pago === 'Credito')
 .reduce((sum, c) => sum + parseFloat(c.total_con_percepcion || c.total || 0), 0);

 const totalNuevaCompra = itemsCompra.reduce(
 (sum, i) => sum + i.cantidad * i.precio_unitario,
 0
 );
 const subtotalSinIgv = totalNuevaCompra / 1.18;
 const igvEstimado = totalNuevaCompra - subtotalSinIgv;

 const montoPercepcionCalculado = aplicaPercepcion
 ? tipoPercepcion === 'MANUAL'
 ? parseFloat(montoPercepcionManual || 0)
 : parseFloat(((totalNuevaCompra * parseFloat(porcentajePercepcion || 0)) / 100).toFixed(2))
 : 0;

 const fleteMonto = parseFloat(flete || 0);
 const totalFinalPagar = totalNuevaCompra + montoPercepcionCalculado + fleteMonto;

 const calcularLandedItem = (it) => {
 if (!prorratearFlete || fleteMonto <= 0 || totalNuevaCompra <= 0) {
 return {
 fleteUnitario: 0,
 costoLanded: parseFloat(it.precio_unitario || 0)
 };
 }
 const itemSubtotal = parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0);
 const peso = itemSubtotal / totalNuevaCompra;
 const fleteItemTotal = fleteMonto * peso;
 const fleteUnit = parseFloat(it.cantidad || 0) > 0 ? (fleteItemTotal / parseFloat(it.cantidad)) : 0;
 return {
 fleteUnitario: fleteUnit,
 costoLanded: parseFloat((parseFloat(it.precio_unitario || 0) + fleteUnit).toFixed(2))
 };
 };

 return (
 <div className="space-y-4">
 {/* ─── TARJETAS DE MÉTRICAS KPI (ESTILO DASHBOARD LIMPIO & ELEGANTE) ─── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Total Invertido */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Total Invertido
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <DollarSign className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 S/ {totalMontoCompras.toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Facturas y boletas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 {compras.length} compras
 </span>
 </div>
 </div>

 {/* KPI 2: Compras al Contado */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Compras Contado
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 S/ {totalContado.toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Con fondos de caja
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 Liquidado
 </span>
 </div>
 </div>

 {/* KPI 3: Compras a Crédito */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Compras a Crédito
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <Clock className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 S/ {totalCredito.toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Cuentas por pagar
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 Por Liquidar
 </span>
 </div>
 </div>

 {/* KPI 4: Proveedores Activos */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 Proveedores Activos
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <Building2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
 {proveedores.length}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Distribuidores & marcas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 Catálogo
 </span>
 </div>
 </div>
 </div>

 {/* ─── BARRA DE HERRAMIENTAS Y BÚSQUEDA ─── */}
 <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
 <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
 {/* Input de Búsqueda */}
 <div className="relative w-full sm:w-72">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por N° comprobante, RUC o proveedor..."
 className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-hidden"
 />
 </div>

 {/* Filtro de Tipo de Pago (Variante 1A: Sub-píldoras Blancas Flotantes Ultra-Slim) */}
 <div className="flex items-center gap-1.5 flex-wrap">
 {[
 { id: 'TODOS', label: 'Todos' },
 { id: 'Contado', label: 'Al Contado' },
 { id: 'Credito', label: 'A Crédito' }
 ].map((tp) => {
 const isSelected = filtroTipoPago === tp.id;
 return (
 <button
 key={tp.id}
 type="button"
 onClick={() => setFiltroTipoPago(tp.id)}
 className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
 isSelected
 ? 'bg-slate-900 text-white shadow-subpill-active'
 : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs hover:border-slate-300'
 }`}
 >
 <span>{tp.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 <button
 type="button"
 onClick={() => {
 setItemsCompra([]);
 setBusqProd('');
 setNumero('');
 setGuiaRemision('');
 setIdProveedor('');
 setTipoPago('Contado');
 setTipoComprobante('Factura');
 setCreditoDias(30);
 setAlmacenDestino('Almacén Central (Patio Materiales - Cemento, Fierro, Áridos)');
 setFlete('');
 setProrratearFlete(false);
 setIdOrdenCompra(null);
 setCodigoOrdenCompra('');
 setDesplegableProvAbierto(false);
 setDesplegableAlmacenAbierto(false);
 setDesplegablePagoAbierto(false);
 setDesplegableCompAbierto(false);
 setModalAbierto(true);
 }}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
 >
 <Plus className="w-4 h-4" />
 <span>Registrar Compra</span>
 </button>
 </div>

 {/* ─── TABLA COMPACTA DE COMPRAS ─── */}
 <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50/80 text-slate-400 border-b border-slate-200/80 text-[11px] uppercase tracking-wider ">
 <th className="py-2.5 px-3.5 font-bold">COMPROBANTE</th>
 <th className="py-2.5 px-3.5 font-bold">FECHA REGISTRO</th>
 <th className="py-2.5 px-3.5 font-bold">PROVEEDOR / DISTRIBUIDOR</th>
 <th className="py-2.5 px-3.5 font-bold">GUÍA DE REMISIÓN</th>
 <th className="py-2.5 px-3.5 font-bold">CONDICIÓN</th>
 <th className="py-2.5 px-3.5 font-bold text-right">TOTAL</th>
 <th className="py-2.5 px-3.5 font-bold text-center">ESTADO</th>
 <th className="py-2.5 px-3.5 font-bold text-center">DETALLE</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {cargando ? (
 <tr>
 <td colSpan="8" className="py-10 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-2">
 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span className="font-medium text-xs">Cargando comprobantes de compra...</span>
 </div>
 </td>
 </tr>
 ) : comprasFiltradas.length === 0 ? (
 <tr>
 <td colSpan="8" className="py-12 text-center text-slate-400">
 <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
 <p className="font-bold text-slate-600 text-sm">No se encontraron compras</p>
 <p className="text-xs text-slate-400 mt-0.5">
 Registra una compra para sumar stock a almacén y actualizar el kardex
 </p>
 </td>
 </tr>
 ) : (
 comprasFiltradas.map((c) => (
 <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors">
 <td className="py-2 px-3.5 font-mono font-bold text-slate-900">
 <span className="text-[10px] font-normal text-slate-400 block uppercase">
 {c.tipo_comprobante}
 </span>
 <div>
 {c.serie ? `${c.serie}-` : ''}{c.numero}
 </div>
 {c.id_orden_compra && (
 <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 mt-0.5">
 <ClipboardList className="w-2.5 h-2.5" /> {c.orden_compra?.codigo || `OC #${c.id_orden_compra}`}
 </span>
 )}
 </td>
 <td className="py-2 px-3.5 text-slate-600 font-medium">
 <div>
 {c.fecha_emision
 ? new Date(`${c.fecha_emision}T00:00:00`).toLocaleDateString()
 : new Date(c.created_at).toLocaleDateString()}
 </div>
 {c.fecha_emision && (
 <div className="text-[9.5px] text-slate-400">
 Reg: {new Date(c.created_at).toLocaleDateString()}
 </div>
 )}
 </td>
 <td className="py-2 px-3.5">
 <div className="font-bold text-slate-800 leading-tight">
 {c.proveedor?.razon_social || 'Proveedor Desconocido'}
 </div>
 <div className="text-[10px] text-slate-400 font-mono">
 RUC: {c.proveedor?.numero_documento || '---'}
 </div>
 <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
 <Warehouse className="w-3 h-3 text-indigo-500 shrink-0" />
 <span className="truncate max-w-[150px]">
 {c.almacen_destino ? c.almacen_destino.split('(')[0].trim() : 'Almacén Central'}
 </span>
 </div>
 </td>
 <td className="py-2 px-3.5 font-mono text-slate-600">
 {c.guia_remision ? (
 <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
 {c.guia_remision}
 </span>
 ) : (
 <span className="text-slate-400 italic text-[10.5px]">Sin guía</span>
 )}
 </td>
 <td className="py-2 px-3.5">
 <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
 c.tipo_pago === 'Credito'
 ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
 : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
 }`}>
 {c.tipo_pago}
 </span>
 </td>
 <td className="py-2 px-3.5 text-right font-black text-slate-900">
 <div>
 S/ {parseFloat(c.total_con_percepcion || c.total || 0).toFixed(2)}
 </div>
 {c.aplica_percepcion && parseFloat(c.monto_percepcion || 0) > 0 && (
 <div className="text-[9px] font-bold text-indigo-600">
 Inc. Percep. S/ {parseFloat(c.monto_percepcion).toFixed(2)}
 </div>
 )}
 {parseFloat(c.flete || 0) > 0 && (
 <div className="text-[9px] font-bold text-amber-600">
 + Flete S/ {parseFloat(c.flete).toFixed(2)}
 </div>
 )}
 </td>
 <td className="py-2 px-3.5 text-center">
 <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 uppercase">
 {c.estado}
 </span>
 </td>
 <td className="py-2 px-3.5 text-center">
 <button
 type="button"
 onClick={() => setModalVerCompra(c)}
 title="Ver detalle del comprobante de compra"
 className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer mx-auto flex items-center justify-center"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* ─── MODAL NUEVA COMPRA A PROVEEDOR ─── */}
 {modalAbierto && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
 {/* Backdrop estático e independiente: cubre el 100% de la ventana incluyendo el topbar completo */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalAbierto(false)}
 aria-hidden="true"
 />

 {/* Tarjeta del Modal con altura máxima y scroll interno: la cabecera y el pie quedan fijos permanentemente */}
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col text-left relative z-10 cursor-default animate-in zoom-in-95 duration-200 overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Cabecera del Modal (Fija en la parte superior) */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-xs rounded-t-3xl shrink-0 z-20">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 pr-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  Ingreso de Compra a Proveedor
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Suma stock físico a almacén y actualiza el Kardex oficial
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
              title="Cerrar modal"
            >
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Formulario con cuerpo scrollable independiente y pie fijo */}
 <form onSubmit={handleCrearCompra} className="flex flex-col flex-1 min-h-0 overflow-hidden">
 {/* Cuerpo del Formulario con Scroll independiente */}
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
 {/* ─── VINCULACIÓN O IMPORTACIÓN DE ORDEN DE COMPRA (FASE 2) ─── */}
            {idOrdenCompra ? (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 truncate">
                        Vinculada a Orden: {codigoOrdenCompra}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        Ítems precargados
                      </span>
                    </div>
                    <p className="text-[10.5px] text-indigo-700 dark:text-indigo-400 font-medium">
                      Al registrar esta compra física, la orden pasará automáticamente al estado "Recibida".
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIdOrdenCompra(null);
                    setCodigoOrdenCompra('');
                  }}
                  className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer shrink-0 text-center"
                  title="Desvincular esta compra de la orden"
                >
                  ✕ Desvincular O.C.
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium pl-1">
                  <ClipboardList className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>¿Esta compra proviene de una Orden de Compra previa?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalImportarOC(true)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Importar desde Orden de Compra</span>
                </button>
              </div>
            )}

            {/* ─── FILA 1: PROVEEDOR, ALMACÉN DESTINO Y TIPO DE PAGO (DROPDOWNS REDONDEADOS) ─── */}
 <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
 {/* Selector Desplegable Redondeado de Proveedor */}
 <div className={`sm:col-span-5 relative ${desplegableProvAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorProv}>
 <div className="flex items-center justify-between mb-1">
 <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
 Proveedor <span className="text-rose-500">*</span>
 </label>
 <span className="text-[10px] text-slate-400 font-medium">
 {proveedores.length} reg.
 </span>
 </div>

 {/* Botón Disparador que simula el select con bordes redondeados rounded-xl */}
 {(() => {
 const provSeleccionado = proveedores.find(p => String(p.id) === String(idProveedor));
 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableProvAbierto(!desplegableProvAbierto);
 setBusquedaProv('');
 setDesplegableAlmacenAbierto(false);
 setDesplegablePagoAbierto(false);
 setDesplegableCompAbierto(false);
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
 const estaSel = String(idProveedor) === String(p.id);
 return (
 <button
 key={p.id}
 type="button"
 onClick={() => {
 setIdProveedor(p.id);
 setDesplegableProvAbierto(false);
 setBusquedaProv('');
 if (p.dias_credito && p.dias_credito > 0) {
 setCreditoDias(p.dias_credito);
 }
 if (p.agente_percepcion) {
 setAplicaPercepcion(true);
 const pct = parseFloat(p.porcentaje_percepcion || 2);
 setPorcentajePercepcion(pct);
 setTipoPercepcion(String(pct));
 }
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="truncate pr-2">
 <span className="block truncate">{p.razon_social}</span>
 <span className="text-[10px] text-slate-400 font-normal">RUC/DNI: {p.numero_documento}</span>
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

 {/* Selector Desplegable Redondeado de Almacén Destino (Fase 2) */}
 <div className={`sm:col-span-4 relative ${desplegableAlmacenAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorAlmacen}>
 <div className="flex items-center justify-between mb-1">
 <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
 <Warehouse className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 Almacén Destino <span className="text-rose-500">*</span>
 </label>
 <span className="text-[10px] text-slate-400 font-medium">
 Stock físico
 </span>
 </div>

 {(() => {
 const almSel = ALMACENES_FERRETERIA.find(a => a.id === almacenDestino) || ALMACENES_FERRETERIA[0];
 const IconoAlm = almSel.icono;
 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableAlmacenAbierto(!desplegableAlmacenAbierto);
 setDesplegableProvAbierto(false);
 setDesplegablePagoAbierto(false);
 setDesplegableCompAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableAlmacenAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <div className="flex items-center gap-1.5 truncate">
 <IconoAlm className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {almSel.nombre}
 </span>
 </div>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableAlmacenAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>
 );
 })()}

 {desplegableAlmacenAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {ALMACENES_FERRETERIA.map((alm) => {
 const estaSel = almacenDestino === alm.id;
 const Icono = alm.icono;
 return (
 <button
 key={alm.id}
 type="button"
 onClick={() => {
 setAlmacenDestino(alm.id);
 setDesplegableAlmacenAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="flex items-start gap-2 truncate pr-2">
 <Icono className="w-3.5 h-3.5 mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
 <div className="truncate">
 <span className="block truncate">{alm.nombre}</span>
 <span className="text-[10px] text-slate-400 font-normal block truncate">{alm.descripcion}</span>
 </div>
 </div>
 {estaSel && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Selector Desplegable Redondeado de Tipo de Pago */}
 <div className={`sm:col-span-3 relative ${desplegablePagoAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorPago}>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Tipo de Pago
 </label>
 <button
 type="button"
 onClick={() => {
 setDesplegablePagoAbierto(!desplegablePagoAbierto);
 setDesplegableProvAbierto(false);
 setDesplegableAlmacenAbierto(false);
 setDesplegableCompAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegablePagoAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {tipoPago === 'Credito' ? 'Crédito (Cuentas por Pagar)' : 'Contado (Caja/Efectivo)'}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegablePagoAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>

 {/* Ventana Desplegable Redondeada de Pago */}
 {desplegablePagoAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {TIPOS_PAGO.map((tp) => {
 const estaSel = tipoPago === tp.valor;
 return (
 <button
 key={tp.valor}
 type="button"
 onClick={() => {
 setTipoPago(tp.valor);
 setDesplegablePagoAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div>
 <span className="block truncate">{tp.etiqueta}</span>
 <span className="text-[10px] text-slate-400 font-normal">{tp.descripcion}</span>
 </div>
 {estaSel && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {/* Sub-fila cuando se elige Crédito: Plazo de pago en días */}
 {tipoPago === 'Credito' && (
 <div className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in duration-150">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
 <div>
 <span className="font-bold text-amber-900 dark:text-amber-200">Plazo de Pago a Proveedor:</span>
 <span className="text-amber-700 dark:text-amber-300 ml-1">Vence en {creditoDias} días</span>
 </div>
 </div>
 <div className="flex items-center gap-1.5">
 {[15, 30, 45, 60].map((d) => (
 <button
 key={d}
 type="button"
 onClick={() => setCreditoDias(d)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
 creditoDias === d
 ? 'bg-amber-600 text-white shadow-xs'
 : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-slate-700'
 }`}
 >
 {d}d
 </button>
 ))}
 </div>
 </div>
 )}

 {/* ─── FILA 2: COMPROBANTE: TIPO COMP, FECHA EMISIÓN, SERIE, NÚMERO, GUÍA ─── */}
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-start">
 {/* Selector Desplegable Redondeado de Tipo de Comprobante */}
 <div className={`relative ${desplegableCompAbierto ? 'z-30' : 'z-10'}`} ref={refSelectorComp}>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Tipo Comp.
 </label>
 <button
 type="button"
 onClick={() => {
 setDesplegableCompAbierto(!desplegableCompAbierto);
 setDesplegableProvAbierto(false);
 setDesplegablePagoAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-1 transition-all cursor-pointer select-none ${
 desplegableCompAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {TIPOS_COMPROBANTE.find(tc => tc.valor === tipoComprobante)?.etiqueta || tipoComprobante}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableCompAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>

 {/* Ventana Desplegable Redondeada de Comprobante */}
 {desplegableCompAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {TIPOS_COMPROBANTE.map((tc) => {
 const estaSel = tipoComprobante === tc.valor;
 return (
 <button
 key={tc.valor}
 type="button"
 onClick={() => {
 setTipoComprobante(tc.valor);
 setDesplegableCompAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div>
 <span className="block truncate">{tc.etiqueta}</span>
 <span className="text-[10px] text-slate-400 font-normal">{tc.subtitulo}</span>
 </div>
 {estaSel && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Fecha de Emisión del Comprobante (Crítico para SUNAT y Auditoría) */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
 <CalendarDays className="w-3 h-3 text-slate-400" />
 Fecha Emisión
 </label>
 <input
 type="date"
 value={fechaEmision}
 onChange={(e) => setFechaEmision(e.target.value)}
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Serie</label>
 <input
 type="text"
 value={serie}
 onChange={(e) => setSerie(e.target.value)}
 placeholder="F001"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Número <span className="text-rose-500">*</span>
 </label>
 <input
 type="text"
 required
 value={numero}
 onChange={(e) => setNumero(e.target.value)}
 placeholder="004829"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Guía Remisión
 </label>
 <input
 type="text"
 value={guiaRemision}
 onChange={(e) => setGuiaRemision(e.target.value)}
 placeholder="T001-0021"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 </div>

 {/* ─── PÍLDORA SUNAT: RÉGIMEN DE PERCEPCIÓN DE IGV (CEMENTO, PINTURAS, MATERIALES) ─── */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 transition-all space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={aplicaPercepcion}
                    onChange={(e) => setAplicaPercepcion(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Aplica Percepción de IGV
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                      Régimen SUNAT
                    </span>
                  </div>
                </label>

                {aplicaPercepcion && (
                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => { setTipoPercepcion('2'); setPorcentajePercepcion(2); }}
                        className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                          tipoPercepcion === '2'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        2% (Bienes)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTipoPercepcion('1'); setPorcentajePercepcion(1); }}
                        className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                          tipoPercepcion === '1'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        1% (Agente)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoPercepcion('MANUAL')}
                        className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                          tipoPercepcion === 'MANUAL'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        Manual
                      </button>
                    </div>

                    {tipoPercepcion === 'MANUAL' && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">S/</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={montoPercepcionManual}
                          onChange={(e) => setMontoPercepcionManual(e.target.value)}
                          placeholder="0.00"
                          className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black shrink-0">
                      + S/ {montoPercepcionCalculado.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── PÍLDORA FERRETERÍA: FLETE DE TRANSPORTE Y PRORRATEO LANDED COST (FASE 2) ─── */}
 <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 transition-all">
 <div className="flex flex-wrap items-center justify-between gap-2.5">
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-1.5">
 <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
 Flete de Transporte / Acarreo:
 </span>
 </div>
 <div className="flex items-center gap-1">
 <span className="text-xs font-bold text-slate-400">S/</span>
 <input
 type="number"
 min="0"
 step="0.01"
 value={flete}
 onChange={(e) => setFlete(e.target.value)}
 placeholder="0.00"
 className="w-24 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
 />
 </div>
 </div>

 {parseFloat(flete || 0) > 0 && (
 <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
 <label className="flex items-center gap-1.5 cursor-pointer select-none">
 <input
 type="checkbox"
 checked={prorratearFlete}
 onChange={(e) => setProrratearFlete(e.target.checked)}
 className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-300 dark:border-slate-600 cursor-pointer"
 />
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
 <Split className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 Prorratear flete al costo (Landed Cost)
 </span>
 </label>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
 prorratearFlete
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60'
 : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
 }`}>
 {prorratearFlete
 ? 'Costo real distribuido en Kardex y catálogo'
 : 'Flete como gasto independiente'}
 </span>
 </div>
 )}
 </div>
 </div>

 {/* ─── FILA 3: BÚSQUEDA DE PRODUCTOS DEL CATÁLOGO ─── */}
 <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
 <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider block ">
 Buscar productos de catálogo
 </span>
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
 <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
 {(() => {
 const prods = productos
 .filter(p => p.nombre.toLowerCase().includes(busqProd.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(busqProd)))
 .slice(0, 8);

 if (prods.length === 0) {
 return (
 <div className="p-3 text-center text-xs text-slate-400">
 No se encontraron productos coincidentes con "{busqProd}"
 </div>
 );
 }

 return prods.map((prod) => (
 <div
 key={prod.id}
 onClick={() => agregarItem(prod)}
 className="p-2.5 hover:bg-indigo-50/60 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
 >
 <div>
 <span className="font-bold text-slate-800 dark:text-slate-100">{prod.nombre}</span>
 <span className="text-[10px] text-slate-400 ml-2">
 Stock actual: {prod.stock} {prod.unidad_medida} • Marca: {prod.marca || 'Genérico'}
 </span>
 </div>
 <span className="font-black text-indigo-600 dark:text-indigo-400">
 Costo: S/ {parseFloat(prod.precio_compra || 0).toFixed(2)}
 </span>
 </div>
 ));
 })()}
 </div>
 )}
 </div>

 {/* ─── TABLA DE ÍTEMS DE COMPRA CON CONTROL DE COSTO Y MARGEN ─── */}
 <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              {itemsCompra.length > 0 && (
                <div className="sm:hidden px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                  <span>{itemsCompra.length} {itemsCompra.length === 1 ? 'producto' : 'productos'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Desliza para ver columnas</span>
                </div>
              )}
              <div className="max-h-64 overflow-x-auto overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[620px]">
 <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10.5px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="py-2.5 px-3">PRODUCTO / HISTORIAL DE COSTO</th>
 <th className="py-2.5 px-3 w-24 text-center">CANTIDAD</th>
 <th className="py-2.5 px-3 w-28 text-right">COSTO COMPRA</th>
 <th className="py-2.5 px-3 w-44 text-left">P. VENTA TIENDA</th>
 <th className="py-2.5 px-3 w-28 text-right">SUBTOTAL</th>
 <th className="py-2.5 px-2 w-10 text-center"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {itemsCompra.length === 0 ? (
 <tr>
 <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
 No hay productos agregados a la compra. Utilice el buscador para añadir artículos.
 </td>
 </tr>
 ) : (
 itemsCompra.map((it, idx) => (
 <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
 <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="font-bold">{it.nombre}</span>
 {/* Indicador de Variación de Costo */}
 {(() => {
 const costoAnt = parseFloat(it.costo_anterior || 0);
 const costoNuevo = parseFloat(it.precio_unitario || 0);
 if (costoAnt > 0 && costoNuevo > 0) {
 const diff = costoNuevo - costoAnt;
 const porc = ((diff / costoAnt) * 100).toFixed(1);
 if (diff > 0.005) {
 return (
 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
 <TrendingUp className="w-3 h-3" />
 Subió +{porc}%
 </span>
 );
 } else if (diff < -0.005) {
 return (
 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
 <TrendingDown className="w-3 h-3" />
 Bajó {porc}%
 </span>
 );
 }
 }
 return null;
 })()}
 </div>
 <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
 <span>Unidad: <strong className="text-slate-600 dark:text-slate-300">{it.unidad_medida}</strong></span>
 <span>•</span>
 <span>Costo habitual: S/ {parseFloat(it.costo_anterior || 0).toFixed(2)}</span>
 <span>•</span>
 <span>P. Venta actual: S/ {parseFloat(it.precio_venta || 0).toFixed(2)}</span>
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
 setItemsCompra(
 itemsCompra.map((item, i) =>
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
 onChange={(e) => handleCambioCostoUnitario(idx, e.target.value)}
 className="w-20 text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-1 px-1.5 text-xs font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:outline-none"
 />
 {(() => {
 const landed = calcularLandedItem(it);
 if (landed.fleteUnitario > 0) {
 return (
 <div className="mt-1 text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
 Landed: S/ {landed.costoLanded.toFixed(2)}
 <span className="text-[8.5px] text-slate-400 block font-normal">
 (+S/ {landed.fleteUnitario.toFixed(2)} flete)
 </span>
 </div>
 );
 }
 return null;
 })()}
 </td>
 <td className="py-2.5 px-3">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-1">
 <span className="text-[10px] font-bold text-slate-400">S/</span>
 <input
 type="number"
 min="0"
 step="0.01"
 value={it.nuevo_precio_venta !== undefined ? it.nuevo_precio_venta : it.precio_venta}
 onChange={(e) => {
 const val = parseFloat(e.target.value) || 0;
 setItemsCompra(
 itemsCompra.map((item, i) =>
 i === idx ? { ...item, nuevo_precio_venta: val, actualizar_precio_venta: true } : item
 )
 );
 }}
 className="w-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-1 px-1.5 text-xs font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:outline-none"
 />
 </div>
 <label className="flex items-center gap-1 cursor-pointer select-none text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
 <input
 type="checkbox"
 checked={Boolean(it.actualizar_precio_venta)}
 onChange={(e) => {
 setItemsCompra(
 itemsCompra.map((item, i) =>
 i === idx ? { ...item, actualizar_precio_venta: e.target.checked } : item
 )
 );
 }}
 className="w-3 h-3 rounded text-indigo-600 cursor-pointer"
 />
 <span>Actualizar en catálogo</span>
 </label>
 </div>
 </td>
 <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
 S/ {(it.cantidad * it.precio_unitario).toFixed(2)}
 </td>
 <td className="py-2.5 px-2 text-center">
 <button
 type="button"
 onClick={() => setItemsCompra(itemsCompra.filter((_, i) => i !== idx))}
 className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
 title="Quitar de compra"
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

                {/* Percepción si aplica */}
                {aplicaPercepcion && montoPercepcionCalculado > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800/80 shadow-2xs animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Percep. ({tipoPercepcion === 'MANUAL' ? 'Manual' : `${porcentajePercepcion}%`}):
                    </span>
                    <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
                      + S/ {montoPercepcionCalculado.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Flete si aplica (Fase 2) */}
                {fleteMonto > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/90 dark:border-amber-800/80 shadow-2xs animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Flete ({prorratearFlete ? 'Landed' : 'Directo'}):
                    </span>
                    <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 font-mono">
                      + S/ {fleteMonto.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Total a Pagar Destacado */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Total a Pagar:
                  </span>
                  <span className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300 tracking-tight">
                    S/ {totalFinalPagar.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
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
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Compra</span>
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

 {/* ─── MODAL VER COMPROBANTE DE COMPRA REGISTRADO (PORTAL) ─── */}
      {modalVerCompra && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop con desenfoque estático */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setModalVerCompra(null)}
            aria-hidden="true"
          />

          {/* Contenedor Centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
            onClick={() => setModalVerCompra(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-left relative z-10 cursor-default animate-in zoom-in-95 duration-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera Fija del Modal */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-xs rounded-t-3xl shrink-0 z-20">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        Comprobante de Compra
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {modalVerCompra.tipo_pago}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate mt-0.5">
                      {modalVerCompra.serie ? `${modalVerCompra.serie}-` : ''}{modalVerCompra.numero}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalVerCompra(null)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                  title="Cerrar comprobante"
                >
                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Cuerpo del Modal con Scroll Independiente */}
              <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
                {/* Metadatos: Proveedor, Almacén, Trazabilidad */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">PROVEEDOR:</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate block mt-0.5">
                      {modalVerCompra.proveedor?.razon_social}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                      RUC/DNI: {modalVerCompra.proveedor?.numero_documento}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">ALMACÉN DESTINO:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                      <Warehouse className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="truncate">
                        {modalVerCompra.almacen_destino ? modalVerCompra.almacen_destino.split('(')[0].trim() : 'Almacén Central'}
                      </span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10.5px]">
                      Guía: {modalVerCompra.guia_remision || 'Sin guía'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">TRAZABILIDAD:</span>
                    {modalVerCompra.id_orden_compra ? (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                        <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {modalVerCompra.orden_compra?.codigo ? `Orden ${modalVerCompra.orden_compra.codigo}` : `Orden #${modalVerCompra.id_orden_compra}`}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic block mt-0.5 text-[11px]">Compra directa</span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400 block text-[10.5px]">
                      Usuario: {modalVerCompra.usuario?.nombre || 'Administrador'}
                    </span>
                  </div>

                  <div className="sm:col-span-3 pt-2 mt-0.5 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>
                      Emisión: <strong className="text-slate-700 dark:text-slate-300">
                        {modalVerCompra.fecha_emision
                          ? new Date(`${modalVerCompra.fecha_emision}T00:00:00`).toLocaleDateString()
                          : new Date(modalVerCompra.created_at).toLocaleDateString()}
                      </strong>
                    </div>
                    {modalVerCompra.fecha_emision && (
                      <div>
                        Ingreso físico: <span className="text-slate-600 dark:text-slate-300 font-semibold">{new Date(modalVerCompra.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla de Ítems con Scroll Horizontal en móvil */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  {modalVerCompra.detalles && modalVerCompra.detalles.length > 0 && (
                    <div className="sm:hidden px-3 py-1 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                      <span>{modalVerCompra.detalles.length} {modalVerCompra.detalles.length === 1 ? 'producto' : 'productos'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Desliza para ver</span>
                    </div>
                  )}
                  <div className="max-h-60 overflow-x-auto overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs min-w-[460px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10.5px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2 px-3 min-w-[180px]">PRODUCTO</th>
                          <th className="py-2 px-3 text-center w-24">CANTIDAD</th>
                          <th className="py-2 px-3 text-right w-24">COSTO</th>
                          <th className="py-2 px-3 text-right w-24">SUBTOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {modalVerCompra.detalles?.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              <div className="break-words">{d.producto?.nombre}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {d.costo_anterior && (
                                  <span>Costo ant: S/ {parseFloat(d.costo_anterior).toFixed(2)}</span>
                                )}
                                {d.actualizo_precio_venta && d.nuevo_precio_venta && (
                                  <span className="text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-200">
                                    P.Venta: S/ {parseFloat(d.nuevo_precio_venta).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {d.cantidad} {d.producto?.unidad_medida}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              <div>S/ {parseFloat(d.precio_unitario).toFixed(2)}</div>
                              {parseFloat(d.flete_unitario || 0) > 0 && (
                                <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                                  Landed S/ {parseFloat(d.costo_con_flete || d.precio_unitario).toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                              S/ {parseFloat(d.subtotal).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Desglose de Total, Flete y Percepción */}
                <div className="bg-indigo-50/60 dark:bg-indigo-950/50 p-3 sm:p-3.5 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5">
                  {modalVerCompra.aplica_percepcion && parseFloat(modalVerCompra.monto_percepcion || 0) > 0 && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-slate-600 dark:text-slate-300 border-b border-indigo-200/60 dark:border-indigo-800/60 pb-1.5 gap-0.5">
                      <span>Importe Compra: S/ {parseFloat(modalVerCompra.total).toFixed(2)}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        (+) Percepción SUNAT ({modalVerCompra.porcentaje_percepcion || 2}%): S/ {parseFloat(modalVerCompra.monto_percepcion).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {parseFloat(modalVerCompra.flete || 0) > 0 && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-slate-600 dark:text-slate-300 border-b border-indigo-200/60 dark:border-indigo-800/60 pb-1.5 gap-0.5">
                      <span>Flete de Transporte: S/ {parseFloat(modalVerCompra.flete).toFixed(2)}</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {modalVerCompra.prorratear_flete ? '(Prorrateado en costo Landed)' : '(Gasto directo)'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">
                      TOTAL DESEMBOLSADO:
                    </span>
                    <span className="text-lg sm:text-xl font-black text-indigo-950 dark:text-indigo-200">
                      S/ {parseFloat(modalVerCompra.total_con_percepcion || modalVerCompra.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pie Fijo con Acciones Táctiles */}
              <div className="p-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 z-20">
                <button
                  type="button"
                  onClick={() => setModalVerCompra(null)}
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
                  <span>Imprimir Comprobante</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL IMPORTAR DESDE ORDEN DE COMPRA (FASE 2) ─── */}
 {modalImportarOC && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[10000] overflow-y-auto">
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalImportarOC(false)}
 aria-hidden="true"
 />

 <div
 className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center cursor-pointer"
 onClick={() => setModalImportarOC(false)}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-5 animate-in zoom-in-95 duration-150 my-6 flex flex-col space-y-4 text-left relative z-10 cursor-default"
 >
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
 <ClipboardList className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-black text-slate-900 dark:text-white ">
 Importar desde Orden de Compra
 </h3>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
 Selecciona una orden emitida para cargar automáticamente su proveedor, ítems y precios pactados
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalImportarOC(false)}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs">
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 </button>
 </div>

 {/* Buscador de O.C. */}
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 autoFocus
 value={busquedaOC}
 onChange={(e) => setBusquedaOC(e.target.value)}
 placeholder="Buscar por código de orden (ej. OC-2026-0001) o proveedor..."
 className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 {/* Lista de Órdenes */}
 <div className="max-h-80 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
 {(() => {
 const ordenesFiltradas = ordenesCompra.filter((oc) => {
 const matchQ = !busquedaOC.trim() ||
 (oc.codigo && oc.codigo.toLowerCase().includes(busquedaOC.toLowerCase().trim())) ||
 (oc.proveedor?.razon_social && oc.proveedor.razon_social.toLowerCase().includes(busquedaOC.toLowerCase().trim())) ||
 (oc.proveedor?.numero_documento && oc.proveedor.numero_documento.includes(busquedaOC.trim()));
 return matchQ;
 });

 if (ordenesFiltradas.length === 0) {
 return (
 <div className="py-10 text-center text-slate-400 space-y-1">
 <ClipboardList className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
 <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
 No se encontraron órdenes de compra
 </p>
 <p className="text-[11px] text-slate-400">
 {busquedaOC ? 'Intenta con otro término de búsqueda' : 'No hay órdenes registradas en el sistema'}
 </p>
 </div>
 );
 }

 return ordenesFiltradas.map((oc) => {
 const cantItems = (oc.detalles || []).length;
 const esRecibida = oc.estado === 'Recibida';
 return (
 <div
 key={oc.id}
 className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
 esRecibida
 ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75'
 : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md'
 }`}
 >
 <div className="space-y-1 min-w-0 flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
 {oc.codigo}
 </span>
 <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
 oc.estado === 'Recibida'
 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80'
 : oc.estado === 'Parcial'
 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300'
 : oc.estado === 'Enviada'
 ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200'
 }`}>
 {oc.estado}
 </span>
 <span className="text-[10.5px] text-slate-400 font-medium">
 {new Date(oc.created_at).toLocaleDateString()}
 </span>
 </div>

 <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
 {oc.proveedor?.razon_social || 'Proveedor Desconocido'}
 </div>

 <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
 <span>{cantItems} ítems solicitados</span>
 <span>•</span>
 <span>Pago: <strong>{oc.condicion_pago || 'Contado'}</strong></span>
 {(oc.almacen_destino || oc.lugar_entrega) && (
 <>
 <span>•</span>
 <span className="truncate max-w-[220px] font-medium text-indigo-600 dark:text-indigo-400">Destino: {oc.almacen_destino || oc.lugar_entrega}</span>
 </>
 )}
 </div>
 </div>

 <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
 <div className="text-right">
 <span className="text-[10px] text-slate-400 uppercase font-bold block">Importe O.C.</span>
 <span className="text-sm font-black text-slate-900 dark:text-white ">
 S/ {parseFloat(oc.total || 0).toFixed(2)}
 </span>
 </div>
 <button
 type="button"
 onClick={() => handleImportarOrden(oc)}
 className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
 >
 <PackageCheck className="w-3.5 h-3.5" />
 <span>Cargar Ítems</span>
 </button>
 </div>
 </div>
 );
 });
 })()}
 </div>

 {/* Footer */}
 <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
 <button
 type="button"
 onClick={() => setModalImportarOC(false)}
 className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
 >
 Cerrar
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
