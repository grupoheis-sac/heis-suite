import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 FileText,
 Building2,
 Calendar,
 Clock,
 Plus,
 Search,
 CheckCircle2,
 XCircle,
 AlertTriangle,
 ArrowRight,
 Printer,
 RefreshCw,
 User,
 MapPin,
 Phone,
 HardHat,
 Truck,
 DollarSign,
 CreditCard,
 Send,
 Eye,
 Share2,
 Copy,
 Check,
 X,
 ChevronRight,
 Boxes,
 Layers,
 Sparkles,
 ShoppingBag,
 Trash2,
 Maximize2,
 LayoutGrid,
 List,
 ChevronDown,
  MoveHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from './store/cartStore';
import { useSettingsStore } from '@heis/core';

// Píldora desplegable personalizada con diseño redondeado y estilo Clean Retail
function CustomPillSelect({ label, value, options, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => String(o.value) === String(value)) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer select-none ${
          open
            ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-slate-800'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />}
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            {selectedOpt ? selectedOpt.label : value}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            open ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 dark:shadow-black/60 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Cotizaciones() {
 const navigate = useNavigate();
 const settings = useSettingsStore();
 const { businessName, businessRuc, address, phone: storePhone, businessLogoUrl } = settings;
 const { clearCart, setCliente, addItem } = useCartStore();

 const [cotizaciones, setCotizaciones] = useState([]);
 const [metricas, setMetricas] = useState({
 total: 0,
 pendientes: 0,
 aceptadas: 0,
 convertidas: 0,
 vencidas: 0,
 rechazadas: 0,
 montoTotal: 0,
 montoPendiente: 0,
 montoAprobado: 0
 });
 const [cargando, setCargando] = useState(true);
 const [filtroEstado, setFiltroEstado] = useState('todos');
 const [busqueda, setBusqueda] = useState('');
 const [vistaModo, setVistaModo] = useState(() => {
 try {
 const guardado = localStorage.getItem('ferre_cotizaciones_vista_modo');
 if (guardado === 'grid' || guardado === 'table') {
 return guardado;
 }
 } catch (_) {}
 return 'table'; // Por defecto vista en tabla compacta
 });

 const cambiarModoVista = (modo) => {
 setVistaModo(modo);
 try {
 localStorage.setItem('ferre_cotizaciones_vista_modo', modo);
 } catch (_) {}
 };

 // Modales
 const [modalNuevo, setModalNuevo] = useState(false);
 const [modalDetalle, setModalDetalle] = useState(false);
 const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
 const [formatoImpresion, setFormatoImpresion] = useState('a4'); // 'a4' | 'ticket'

 // Estado del formulario Nueva Cotización
 const [clientesLista, setClientesLista] = useState([]);
 const [productosLista, setProductosLista] = useState([]);
 const [busquedaProducto, setBusquedaProducto] = useState('');
 const [productosFiltrados, setProductosFiltrados] = useState([]);
 const [mostrarDropdownProductos, setMostrarDropdownProductos] = useState(false);

 const [clienteSeleccionadoObj, setClienteSeleccionadoObj] = useState(null);
 const [busquedaCliente, setBusquedaCliente] = useState('');
 const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);

 const [formCotizacion, setFormCotizacion] = useState({
 id_cliente: null,
 obra: '',
 contacto_nombre: '',
 contacto_telefono: '',
 lugar_entrega: '',
 tiempo_entrega: 'Inmediato',
 forma_pago: 'Contado',
 incluye_flete: false,
 validez_dias: 15,
 notas: '',
 items: []
 });

 const [guardando, setGuardando] = useState(false);

 // Cargar lista de cotizaciones
 const cargarCotizaciones = async () => {
 setCargando(true);
 try {
 const res = await api.get('/cotizaciones', {
 params: {
 estado: filtroEstado,
 busqueda
 }
 });
 if (res?.success) {
 setCotizaciones(res.cotizaciones || []);
 if (res.metricas) {
 setMetricas(res.metricas);
 }
 }
 } catch (e) {
 toast.error('Error al cargar cotizaciones');
 console.error(e);
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarCotizaciones();
 }, [filtroEstado]);

 // Cerrar modales con tecla Escape
 useEffect(() => {
 if (!modalNuevo && !modalDetalle) return;
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 if (modalDetalle) setModalDetalle(false);
 if (modalNuevo) setModalNuevo(false);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [modalNuevo, modalDetalle]);

 // Cargar catálogo de productos y clientes al montar
 useEffect(() => {
 const fetchData = async () => {
 try {
 const [resProd, resCli] = await Promise.all([
 api.get('/productos', { params: { limit: 150 } }),
 api.get('/clientes', { params: { limit: 100 } })
 ]);
 if (resProd?.success) setProductosLista(resProd.productos || []);
 if (resCli?.success) setClientesLista(resCli.clientes || []);
 } catch (err) {
 console.warn('Error al precargar datos:', err);
 }
 };
 fetchData();
 }, []);

 // Filtrado de productos en vivo para el buscador
 useEffect(() => {
 if (!busquedaProducto.trim()) {
 setProductosFiltrados([]);
 return;
 }
 const q = busquedaProducto.toLowerCase();
 const filtrados = productosLista.filter(
 p =>
 p.nombre?.toLowerCase().includes(q) ||
 p.codigo_barras?.toLowerCase().includes(q)
 );
 setProductosFiltrados(filtrados.slice(0, 8));
 }, [busquedaProducto, productosLista]);

 // Manejo de búsqueda en el listado general
 const handleBuscar = (e) => {
 e.preventDefault();
 cargarCotizaciones();
 };

 // Agregar producto al borrador de cotización
 const handleAgregarProducto = (prod) => {
 const yaExiste = formCotizacion.items.find(i => i.id_producto === prod.id);
 if (yaExiste) {
 setFormCotizacion(prev => ({
 ...prev,
 items: prev.items.map(i =>
 i.id_producto === prod.id
 ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario }
 : i
 )
 }));
 } else {
 const nuevoItem = {
 id_producto: prod.id,
 nombre: prod.nombre,
 codigo_barras: prod.codigo_barras || '',
 unidad_medida: prod.unidad_medida || 'UND',
 cantidad: 1,
 stock_actual: parseFloat(prod.stock) || 0,
 precio_unitario: parseFloat(prod.precio_venta) || 0,
 subtotal: parseFloat(prod.precio_venta) || 0,
 descripcion_personalizada: ''
 };
 setFormCotizacion(prev => ({
 ...prev,
 items: [...prev.items, nuevoItem]
 }));
 }
 setBusquedaProducto('');
 setMostrarDropdownProductos(false);
 };

 // Modificar cantidad de un ítem
 const handleCambiarCantidad = (index, valor) => {
 const val = parseFloat(valor) || 0;
 setFormCotizacion(prev => {
 const newItems = [...prev.items];
 newItems[index].cantidad = Math.max(0.1, val);
 newItems[index].subtotal = parseFloat((newItems[index].cantidad * newItems[index].precio_unitario).toFixed(2));
 return { ...prev, items: newItems };
 });
 };

 // Modificar precio unitario cotizado
 const handleCambiarPrecio = (index, valor) => {
 const val = parseFloat(valor) || 0;
 setFormCotizacion(prev => {
 const newItems = [...prev.items];
 newItems[index].precio_unitario = Math.max(0, val);
 newItems[index].subtotal = parseFloat((newItems[index].cantidad * newItems[index].precio_unitario).toFixed(2));
 return { ...prev, items: newItems };
 });
 };

 // Modificar unidad de medida de ítem
 const handleCambiarUnidad = (index, unidad) => {
 setFormCotizacion(prev => {
 const newItems = [...prev.items];
 newItems[index].unidad_medida = unidad;
 return { ...prev, items: newItems };
 });
 };

 // Eliminar ítem del borrador
 const handleEliminarItem = (index) => {
 setFormCotizacion(prev => ({
 ...prev,
 items: prev.items.filter((_, i) => i !== index)
 }));
 };

 // Cálculos de totales del borrador
 const totalBorrador = formCotizacion.items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
 const subtotalSinIgvBorrador = parseFloat((totalBorrador / 1.18).toFixed(2));
 const igvBorrador = parseFloat((totalBorrador - subtotalSinIgvBorrador).toFixed(2));

 // Guardar nueva cotización
 const handleGuardarCotizacion = async (e) => {
 e.preventDefault();
 if (!formCotizacion.items || formCotizacion.items.length === 0) {
 toast.error('Agregue al menos un producto a la cotización');
 return;
 }

 setGuardando(true);
 try {
 const res = await api.post('/cotizaciones', {
 ...formCotizacion,
 id_cliente: clienteSeleccionadoObj?.id || null
 });

 if (res?.success) {
 toast.success(`Cotización ${res.cotizacion?.numero || ''} emitida con éxito`);
 setModalNuevo(false);
 // Reset form
 setFormCotizacion({
 id_cliente: null,
 obra: '',
 contacto_nombre: '',
 contacto_telefono: '',
 lugar_entrega: '',
 tiempo_entrega: 'Inmediato',
 forma_pago: 'Contado',
 incluye_flete: false,
 validez_dias: 15,
 notas: '',
 items: []
 });
 setClienteSeleccionadoObj(null);
 setBusquedaCliente('');
 cargarCotizaciones();
 } else {
 toast.error(res?.message || 'No se pudo guardar la cotización');
 }
 } catch (err) {
 toast.error(err?.response?.data?.message || err.message || 'Error al emitir cotización');
 } finally {
 setGuardando(false);
 }
 };

 // Cambiar estado de una cotización
 const handleCambiarEstado = async (cot, nuevoEstado) => {
 try {
 const res = await api.patch(`/cotizaciones/${cot.id}/estado`, { estado: nuevoEstado });
 if (res?.success) {
 toast.success(`Cotización actualizada a ${nuevoEstado}`);
 cargarCotizaciones();
 if (cotizacionSeleccionada?.id === cot.id) {
 setCotizacionSeleccionada(prev => ({ ...prev, estado: nuevoEstado, estado_calculado: nuevoEstado }));
 }
 }
 } catch (err) {
 toast.error('Error al cambiar estado');
 }
 };

 // Convertir y pasar al POS para cobro directo
 const handlePasarAlPOS = (cot) => {
 clearCart();
 if (cot.cliente) {
 setCliente(cot.cliente);
 }

 let itemsAgregados = 0;
 cot.detalles?.forEach((d) => {
 if (d.producto) {
 try {
 const prodObj = {
 id: d.producto.id,
 nombre: d.producto.nombre,
 codigo_barras: d.producto.codigo_barras,
 precio_venta: d.precio_unitario, // usa el precio cotizado negociado!
 unidad_medida: d.unidad_medida || d.producto.unidad_medida || 'UND',
 stock: d.producto.stock
 };
 addItem(prodObj, parseFloat(d.cantidad));
 itemsAgregados++;
 } catch (err) {
 console.warn('Aviso al agregar producto al POS:', err.message);
 }
 }
 });

 toast.success(`Cotización ${cot.numero} cargada en el Punto de Venta.`);
 navigate('/pos');
 };

 // Duplicar / Renovar cotización vencida
 const handleDuplicarCotizacion = (cot) => {
 setClienteSeleccionadoObj(cot.cliente || null);
 setBusquedaCliente(cot.cliente?.nombre || '');
 setFormCotizacion({
 id_cliente: cot.id_cliente,
 obra: cot.obra ? `${cot.obra} (Renovación)` : '',
 contacto_nombre: cot.contacto_nombre || '',
 contacto_telefono: cot.contacto_telefono || '',
 lugar_entrega: cot.lugar_entrega || '',
 tiempo_entrega: cot.tiempo_entrega || 'Inmediato',
 forma_pago: cot.forma_pago || 'Contado',
 incluye_flete: cot.incluye_flete || false,
 validez_dias: 15,
 notas: cot.notas || '',
 items: cot.detalles?.map(d => ({
 id_producto: d.id_producto,
 nombre: d.producto?.nombre || 'Producto',
 codigo_barras: d.producto?.codigo_barras || '',
 unidad_medida: d.unidad_medida || d.producto?.unidad_medida || 'UND',
 cantidad: parseFloat(d.cantidad),
 stock_actual: parseFloat(d.producto?.stock || 0),
 precio_unitario: parseFloat(d.precio_unitario),
 subtotal: parseFloat(d.subtotal),
 descripcion_personalizada: d.descripcion_personalizada || ''
 })) || []
 });
 setModalDetalle(false);
 setModalNuevo(true);
 toast('Borrador cargado para renovación de cotización', { icon: '📋' });
 };

 // Ver Proforma para imprimir
 const handleAbrirImpresion = (cot) => {
 setCotizacionSeleccionada(cot);
 setModalDetalle(true);
 };

 // Disparar impresión
 const handleImprimir = () => {
 window.print();
 };

 // Compartir por WhatsApp
 const handleCompartirWhatsApp = (cot) => {
 const telefono = cot.contacto_telefono || cot.cliente?.telefono;
 const itemsTexto = cot.detalles?.map(d => 
 `• ${d.cantidad} ${d.unidad_medida || 'UND'} - ${d.producto?.nombre || 'Item'} (S/ ${parseFloat(d.precio_unitario).toFixed(2)}) = S/ ${parseFloat(d.subtotal).toFixed(2)}`
 ).join('\n') || '';

 let cuentasTexto = '';
 if (settings.mostrarCuentasEnCotizaciones !== false) {
 const cuentas = [];
 if (settings.banco1Cuenta) {
 cuentas.push(`• *${settings.banco1Nombre || 'Banco 1'} (${settings.banco1Moneda || 'PEN'}):* ${settings.banco1Cuenta}${settings.banco1Cci ? ` | CCI: ${settings.banco1Cci}` : ''}`);
 }
 if (settings.banco2Cuenta) {
 cuentas.push(`• *${settings.banco2Nombre || 'Banco 2'} (${settings.banco2Moneda || 'PEN'}):* ${settings.banco2Cuenta}${settings.banco2Cci ? ` | CCI: ${settings.banco2Cci}` : ''}`);
 }
 if (settings.banco3Cuenta) {
 cuentas.push(`• *${settings.banco3Nombre || 'Banco 3'} (${settings.banco3Moneda || 'PEN'}):* ${settings.banco3Cuenta}${settings.banco3Cci ? ` | CCI: ${settings.banco3Cci}` : ''}`);
 }
 if (settings.pagoYapeNumero) {
 cuentas.push(`• *Yape:* ${settings.pagoYapeNumero}${settings.pagoYapeTitular ? ` (${settings.pagoYapeTitular})` : ''}`);
 }
 if (settings.pagoPlinNumero) {
 cuentas.push(`• *Plin:* ${settings.pagoPlinNumero}${settings.pagoPlinTitular ? ` (${settings.pagoPlinTitular})` : ''}`);
 }
 if (cuentas.length > 0) {
 cuentasTexto = `\n🏦 *CUENTAS BANCARIAS Y TRANSFERENCIAS:*\n${cuentas.join('\n')}\n`;
 }
 }

 const mensaje = `🏗️ *${businessName || 'FERRETERÍA HEIS'} - PROFORMA FORMAL*
📄 *N° Cotización:* ${cot.numero}
📅 *Fecha:* ${new Date(cot.created_at).toLocaleDateString('es-PE')}
👤 *Cliente:* ${cot.cliente?.nombre || 'Público General'}
${cot.obra ? `📍 *Obra / Proyecto:* ${cot.obra}\n` : ''}${cot.lugar_entrega ? `🚚 *Entrega:* ${cot.lugar_entrega}\n` : ''}⏳ *Validez:* ${cot.validez_dias} días (Vence: ${new Date(new Date(cot.created_at).getTime() + (cot.validez_dias * 86400000)).toLocaleDateString('es-PE')})
💳 *Forma de Pago:* ${cot.forma_pago || 'Contado'}

📦 *DETALLE DE MATERIALES:*
${itemsTexto}

💰 *TOTAL A PAGAR: S/ ${parseFloat(cot.total).toFixed(2)}* (Incluye IGV 18%)
${cot.notas ? `\n📝 *Condiciones:* ${cot.notas}\n` : ''}${cuentasTexto}
Gracias por confiar en nosotros. Para confirmar su pedido o coordinar despacho comuníquese con nosotros.`;

 const url = telefono
 ? `https://wa.me/51${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
 : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

 window.open(url, '_blank');
 };

 return (
 <div className="space-y-6">
 {/* ─── PÍLDORA CÁPSULA DINÁMICA ULTRA-DELGADA (ESTILO DYNAMIC PILL) ─── */}
 <div className="relative overflow-hidden rounded-2xl sm:rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs soft-card-shadow py-2 sm:py-2.5 px-3.5 sm:px-5">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3">
 {/* Lado izquierdo: Ícono squircle + Título destacado + Status */}
 <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pl-0.5 sm:pl-0">
 <div className="w-[34px] h-[34px] rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
 <FileText className="w-[17px] h-[17px] stroke-[2.3]" />
 </div>

 <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
 <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight ">
 Cotizaciones & Presupuestos
 </h1>
 <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Proformas & Obras
 </span>
 <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
 • Control de vigencia y pase a venta en 1 clic
 </span>
 </div>
 </div>

 {/* Lado derecho: Acciones en cápsula */}
 <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
 <button
 type="button"
 onClick={cargarCotizaciones}
 disabled={cargando}
 title="Refrescar cotizaciones"
 className="h-9 px-3.5 sm:px-4 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 "
 >
 <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${cargando ? 'animate-spin' : ''}`} />
 <span className="hidden md:inline">Actualizar</span>
 </button>

 <button
 type="button"
 onClick={() => setModalNuevo(true)}
 className="h-9 px-4 sm:px-5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shadow-indigo-600/25 active:scale-95 shrink-0 "
 >
 <Plus className="w-4 h-4" />
 <span>Nueva Cotización</span>
 </button>
 </div>
 </div>
 </div>

 {/* ─── TARJETAS DE MÉTRICAS KPI (ESTILO DASHBOARD LIMPIO & ELEGANTE) ─── */}
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
 {/* 1. Pendientes */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'Pendiente' ? 'todos' : 'Pendiente')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'Pendiente'
 ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 title="Filtrar cotizaciones Pendientes"
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Pendientes
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <Clock className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 {metricas.pendientes}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 En evaluación de obra
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'Pendiente' ? 'Activo' : 'Pendiente'}
 </span>
 </div>
 </button>

 {/* 2. Aceptadas / Aprobadas */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'Aceptada' ? 'todos' : 'Aceptada')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'Aceptada'
 ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 title="Filtrar cotizaciones Aprobadas"
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Aprobadas
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {metricas.aceptadas}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Listas para facturar
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'Aceptada' ? 'Activo' : 'Aprobadas'}
 </span>
 </div>
 </button>

 {/* 3. Convertidas a Venta */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'Convertida' ? 'todos' : 'Convertida')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'Convertida'
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/25 shadow-md shadow-indigo-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 title="Filtrar cotizaciones facturadas en POS"
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Facturadas
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <Sparkles className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight truncate">
 {metricas.convertidas}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Ventas concretadas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'Convertida' ? 'Activo' : 'En POS'}
 </span>
 </div>
 </button>

 {/* 4. Vencidas */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'Vencida' ? 'todos' : 'Vencida')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'Vencida'
 ? 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/25 shadow-md shadow-rose-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 title="Filtrar cotizaciones con plazo caducado"
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate min-w-0">
 Vencidas
 </span>
 <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-rose-600/25 transition-all duration-200">
 <AlertTriangle className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight truncate">
 {metricas.vencidas}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Requieren renovación
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/80 dark:border-rose-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'Vencida' ? 'Activo' : 'Caducadas'}
 </span>
 </div>
 </button>

 {/* 5. Total Cotizado Acumulado */}
 <button
 type="button"
 onClick={() => setFiltroEstado('todos')}
 className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs hover:shadow-md hover:shadow-slate-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer col-span-2 md:col-span-1"
 title="Ver todas las cotizaciones"
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-slate-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors truncate min-w-0">
 Total Cotizado
 </span>
 <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-800 dark:group-hover:bg-slate-700 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-slate-600/25 transition-all duration-200">
 <DollarSign className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 S/ {Number(metricas.montoTotal || 0).toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Proformas totales
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 shrink-0 whitespace-nowrap">
 {metricas.total} docs
 </span>
 </div>
 </button>
 </div>

 {/* ─── BARRA DE FILTROS, ESTADOS Y VISTAS ─── */}
 <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
 {/* Pestañas de Estado */}
 <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
 {[
 { id: 'todos', label: 'Todas', count: metricas.total },
 { id: 'Pendiente', label: 'Pendientes', count: metricas.pendientes, color: 'text-amber-700 bg-amber-50' },
 { id: 'Aceptada', label: 'Aprobadas', count: metricas.aceptadas, color: 'text-emerald-700 bg-emerald-50' },
 { id: 'Convertida', label: 'Facturadas', count: metricas.convertidas, color: 'text-indigo-700 bg-indigo-50' },
 { id: 'Vencida', label: 'Vencidas', count: metricas.vencidas, color: 'text-rose-700 bg-rose-50' },
 { id: 'Rechazada', label: 'Rechazadas', count: metricas.rechazadas, color: 'text-slate-600 bg-slate-100' }
 ].map((tab) => {
 const isSelected = filtroEstado === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setFiltroEstado(tab.id)}
 className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 ${
 isSelected
 ? 'bg-slate-900 text-white shadow-subpill-active'
 : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs hover:border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:border-slate-700/60'
 }`}
 >
 <span>{tab.label}</span>
 <span
 className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
 isSelected ? 'bg-white/20 text-white' : tab.color || 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
 }`}
 >
 {tab.count}
 </span>
 </button>
 );
 })}
 </div>

 {/* Buscador y Selector de Vista */}
 <div className="flex items-center gap-2.5 shrink-0">
 <form onSubmit={handleBuscar} className="relative flex-1 sm:w-72">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar por N°, cliente, RUC, obra..."
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 {busqueda && (
 <button
 type="button"
 onClick={() => {
 setBusqueda('');
 cargarCotizaciones();
 }}
 className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </form>

 {/* Toggle de Modo de Vista */}
 <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/90 shadow-2xs">
 <button
 type="button"
 onClick={() => cambiarModoVista('table')}
 className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
 vistaModo === 'table'
 ? 'bg-white shadow-xs text-indigo-700 font-extrabold'
 : 'text-slate-500 hover:text-slate-800'
 }`}
 title="Vista Compacta de Tabla (Por Defecto)"
 >
 <List className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Tabla</span>
 </button>
 <button
 type="button"
 onClick={() => cambiarModoVista('grid')}
 className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
 vistaModo === 'grid'
 ? 'bg-white shadow-xs text-indigo-700 font-extrabold'
 : 'text-slate-500 hover:text-slate-800'
 }`}
 title="Vista de Tarjetas Enriquecidas"
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Tarjetas</span>
 </button>
 </div>
 </div>
 </div>

 {/* ─── LISTADO DE COTIZACIONES ─── */}
 {cargando ? (
 <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
 <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
 <p className="text-xs font-bold text-slate-500">Cargando cotizaciones y presupuestos...</p>
 </div>
 ) : cotizaciones.length === 0 ? (
 <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
 <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
 <h3 className="text-base font-black text-slate-700">No hay cotizaciones registradas</h3>
 <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
 No se encontraron cotizaciones con el filtro actual. Haz clic en "Nueva Cotización" para emitir una proforma para obra.
 </p>
 <button
 type="button"
 onClick={() => setModalNuevo(true)}
 className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
 >
 <Plus className="w-4 h-4" />
 <span>Emitir Cotización Ahora</span>
 </button>
 </div>
 ) : vistaModo === 'grid' ? (
 /* ─── VISTA 1: GRID DE TARJETAS ENRIQUECIDAS (INSPIRACIÓN DELIVERY) ─── */
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
 {cotizaciones.map((c) => {
 const diasRestantes = c.dias_restantes ?? 0;
 const esVencida = c.es_vencida || c.estado_calculado === 'Vencida';

 let badgeConfig = {
 color: 'bg-slate-100 text-slate-700 border-slate-200',
 dot: 'bg-slate-400',
 label: c.estado
 };

 if (c.estado === 'Convertida') {
 badgeConfig = {
 color: 'bg-indigo-50 text-indigo-800 border-indigo-300/80 shadow-2xs',
 dot: 'bg-indigo-600',
 label: 'Facturada en POS'
 };
 } else if (c.estado === 'Aceptada') {
 badgeConfig = {
 color: 'bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-2xs',
 dot: 'bg-emerald-500 animate-pulse',
 label: 'Aprobada / Lista'
 };
 } else if (esVencida) {
 badgeConfig = {
 color: 'bg-rose-50 text-rose-800 border-rose-300/80 shadow-2xs',
 dot: 'bg-rose-500',
 label: 'Plazo Vencido'
 };
 } else if (c.estado === 'Pendiente') {
 badgeConfig = {
 color: 'bg-amber-50 text-amber-800 border-amber-300/80 shadow-2xs',
 dot: 'bg-amber-500 animate-pulse',
 label: 'Pendiente'
 };
 } else if (c.estado === 'Rechazada') {
 badgeConfig = {
 color: 'bg-slate-100 text-slate-700 border-slate-300',
 dot: 'bg-slate-400',
 label: 'Rechazada'
 };
 }

 return (
 <div
 key={c.id}
 className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_12px_32px_-6px_rgba(15,23,42,0.12)] hover:border-slate-300 transition-all duration-200 flex flex-col justify-between gap-4 relative group overflow-hidden"
 >
 <div className="space-y-4">
 {/* Encabezado: Número de Cotización y Estado */}
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-xs font-black shadow-xs tracking-tight">
 <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
 <span>{c.numero}</span>
 </div>
 {c.obra && (
 <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black bg-blue-50 text-blue-800 border border-blue-200/80 flex items-center gap-1 shadow-2xs max-w-[140px] truncate" title={c.obra}>
 <HardHat className="w-3 h-3 text-blue-600 shrink-0" />
 <span className="truncate">{c.obra}</span>
 </span>
 )}
 </div>
 <span className={`px-3 py-1 rounded-full text-[11px] font-black border flex items-center gap-1.5 ${badgeConfig.color}`}>
 <span className={`w-2 h-2 rounded-full ${badgeConfig.dot}`} />
 <span>{badgeConfig.label}</span>
 </span>
 </div>

 {/* Tarjeta Interna del Cliente & Obra (Generosa y limpia) */}
 <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/70 space-y-2.5">
 <div className="flex items-start gap-2.5">
 <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs shrink-0 mt-0.5">
 <User className="w-4 h-4 text-slate-700" />
 </div>
 <div className="min-w-0 flex-1">
 <h4 className="text-[13px] font-black text-slate-900 leading-snug truncate">
 {c.cliente?.nombre || 'Cliente General'}
 </h4>
 <div className="flex items-center gap-2 mt-0.5 flex-wrap">
 {c.cliente?.numero_documento && (
 <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
 {c.cliente.tipo_documento || 'DOC'}: {c.cliente.numero_documento}
 </span>
 )}
 {(c.contacto_telefono || c.cliente?.telefono) && (
 <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
 <Phone className="w-2.5 h-2.5" />
 {c.contacto_telefono || c.cliente?.telefono}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Dirección o Lugar de Entrega */}
 {(c.lugar_entrega || c.cliente?.direccion) && (
 <div className="flex items-start gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
 <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
 <span className="text-[11px] font-medium text-slate-700 truncate">
 {c.lugar_entrega || c.cliente?.direccion}
 </span>
 </div>
 )}

 {/* Contacto en Obra si existe */}
 {c.contacto_nombre && (
 <div className="text-[10.5px] text-slate-500 flex items-center gap-1 italic">
 <span>Contacto obra:</span>
 <span className="font-semibold text-slate-700">{c.contacto_nombre}</span>
 </div>
 )}
 </div>

 {/* Resumen de Materiales e Insumos Cotizados */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
 <Boxes className="w-3.5 h-3.5 text-slate-400" />
 Materiales ({c.detalles?.length || 0})
 </span>
 <span className="text-[11px] text-slate-400 font-semibold">
 Validez: {c.validez_dias} días
 </span>
 </div>

 <div className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-200/60 space-y-1 text-xs">
 {c.detalles?.slice(0, 3).map((det, idx) => (
 <div key={idx} className="flex items-center justify-between gap-2 text-slate-700">
 <span className="truncate text-[11px] font-medium">
 <strong className="text-slate-900 font-bold">{parseFloat(det.cantidad)} {det.unidad_medida || 'UND'}</strong> {det.producto?.nombre || 'Material'}
 </span>
 <span className="text-[11px] font-mono font-bold text-slate-600 shrink-0">
 S/ {parseFloat(det.subtotal).toFixed(2)}
 </span>
 </div>
 ))}
 {(c.detalles?.length || 0) > 3 && (
 <div className="text-[10.5px] font-bold text-indigo-600 pt-0.5">
 + {(c.detalles?.length || 0) - 3} materiales más...
 </div>
 )}
 </div>
 </div>

 {/* Alerta de Validez y Vigencia */}
 <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
 <div className="flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-slate-400" />
 <span className="text-[11px] text-slate-500">
 {new Date(c.created_at).toLocaleDateString('es-PE')}
 </span>
 </div>

 {c.estado === 'Pendiente' && (
 <span
 className={`text-[10.5px] font-black px-2 py-0.5 rounded-full ${
 diasRestantes <= 2
 ? 'bg-rose-100 text-rose-800 animate-pulse'
 : 'bg-amber-100 text-amber-800'
 }`}
 >
 {diasRestantes < 0
 ? `Venció hace ${Math.abs(diasRestantes)}d`
 : diasRestantes === 0
 ? 'Vence hoy'
 : `Vence en ${diasRestantes} días`}
 </span>
 )}
 </div>
 </div>

 {/* Footer de Tarjeta: Total y Acciones */}
 <div className="pt-3 border-t border-slate-100 space-y-3">
 <div className="flex items-center justify-between">
 <div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cotizado</span>
 <div className="text-xl font-black text-indigo-700 tracking-tight">
 S/ {parseFloat(c.total).toFixed(2)}
 </div>
 </div>

 <div className="text-right">
 <span className="text-[10px] font-semibold text-slate-400 block">Condición</span>
 <span className="text-[11px] font-bold text-slate-700">
 {c.forma_pago || 'Contado'}
 </span>
 </div>
 </div>

 {/* Botonera de Acciones */}
 <div className="grid grid-cols-3 gap-2">
 <button
 type="button"
 onClick={() => handleAbrirImpresion(c)}
 className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
 title="Ver e Imprimir Proforma formal"
 >
 <Printer className="w-3.5 h-3.5" />
 <span>Imprimir</span>
 </button>

 <button
 type="button"
 onClick={() => handleCompartirWhatsApp(c)}
 className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
 title="Enviar presupuesto por WhatsApp"
 >
 <Share2 className="w-3.5 h-3.5 text-emerald-600" />
 <span>WhatsApp</span>
 </button>

 <button
 type="button"
 onClick={() => handlePasarAlPOS(c)}
 className="px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
 title="Cargar en el carrito del POS y cobrar"
 >
 <ShoppingBag className="w-3.5 h-3.5" />
 <span>Vender</span>
 </button>
 </div>

 {/* Acciones Secundarias de Estado */}
 <div className="flex items-center justify-between pt-1 text-[11px]">
 {c.estado === 'Pendiente' && (
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => handleCambiarEstado(c, 'Aceptada')}
 className="text-emerald-700 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
 >
 <Check className="w-3 h-3" />
 <span>Aprobar</span>
 </button>
 <span className="text-slate-300">•</span>
 <button
 type="button"
 onClick={() => handleCambiarEstado(c, 'Rechazada')}
 className="text-rose-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
 >
 <X className="w-3 h-3" />
 <span>Rechazar</span>
 </button>
 </div>
 )}

 {esVencida && (
 <button
 type="button"
 onClick={() => handleDuplicarCotizacion(c)}
 className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer ml-auto"
 >
 <RefreshCw className="w-3 h-3" />
 <span>Renovar Precios</span>
 </button>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 /* ─── VISTA 2: TABLA COMPACTA PROFESIONAL ─── */
 <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10.5px] font-extrabold">
 <tr>
 <th className="py-2.5 px-3.5 whitespace-nowrap">N° COTIZACIÓN</th>
 <th className="py-2.5 px-3.5 whitespace-nowrap">EMISIÓN / VENCE</th>
 <th className="py-2.5 px-3.5 min-w-[180px]">CLIENTE & OBRA</th>
 <th className="py-2.5 px-3.5 whitespace-nowrap">CONDICIONES</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ITEMS</th>
 <th className="py-2.5 px-3.5 text-right whitespace-nowrap">TOTAL (S/)</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ESTADO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {cotizaciones.map((c) => {
 const diasRestantes = c.dias_restantes ?? 0;
 const esVencida = c.es_vencida || c.estado_calculado === 'Vencida';

 return (
 <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
 {/* N° Cotización */}
 <td className="py-2.5 px-3.5 font-mono font-black text-slate-900 whitespace-nowrap">
 <div className="flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
 <span>{c.numero}</span>
 </div>
 </td>

 {/* Fecha / Vence */}
 <td className="py-2.5 px-3.5 whitespace-nowrap">
 <div className="font-semibold text-slate-700 text-[11px]">
 {new Date(c.created_at).toLocaleDateString('es-PE')}
 </div>
 <div className="text-[10px] mt-0.5">
 {c.estado === 'Convertida' ? (
 <span className="text-indigo-600 font-bold">Venta POS</span>
 ) : c.estado === 'Aceptada' ? (
 <span className="text-emerald-600 font-bold">Aprobada</span>
 ) : esVencida ? (
 <span className="text-rose-600 font-bold">Venció</span>
 ) : (
 <span className="text-amber-600 font-bold">Vence en {diasRestantes}d</span>
 )}
 </div>
 </td>

 {/* Cliente & Obra */}
 <td className="py-2.5 px-3.5">
 <div className="font-bold text-slate-900 leading-tight">
 {c.cliente?.nombre || 'Cliente General'}
 </div>
 <div className="flex items-center gap-2 mt-0.5 flex-wrap">
 {c.cliente?.numero_documento && (
 <span className="text-[10px] text-slate-400 font-mono">
 {c.cliente.numero_documento}
 </span>
 )}
 {c.obra && (
 <span className="text-[10px] text-indigo-700 font-bold flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60 max-w-[170px] truncate" title={c.obra}>
 <HardHat className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
 <span className="truncate">{c.obra}</span>
 </span>
 )}
 </div>
 </td>

 {/* Condiciones */}
 <td className="py-2.5 px-3.5 whitespace-nowrap">
 <div className="text-[11px] font-bold text-slate-700">
 {c.forma_pago || 'Contado'}
 </div>
 {c.lugar_entrega && (
 <div className="text-[10px] text-slate-400 flex items-center gap-1 max-w-[130px] truncate mt-0.5" title={c.lugar_entrega}>
 <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
 <span className="truncate">{c.lugar_entrega}</span>
 </div>
 )}
 </td>

 {/* Items */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-black text-[10.5px]">
 {c.detalles?.length || 0} mat.
 </span>
 </td>

 {/* Total */}
 <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
 <span className="font-mono font-black text-slate-900 text-[13px]">
 S/ {parseFloat(c.total).toFixed(2)}
 </span>
 </td>

 {/* Estado */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span
 className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
 c.estado === 'Convertida'
 ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
 : c.estado === 'Aceptada'
 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
 : esVencida
 ? 'bg-rose-50 text-rose-700 border-rose-200/80'
 : c.estado === 'Pendiente'
 ? 'bg-amber-50 text-amber-700 border-amber-200/80'
 : 'bg-slate-100 text-slate-600 border-slate-200'
 }`}
 >
 <span
 className={`w-1.5 h-1.5 rounded-full ${
 c.estado === 'Convertida'
 ? 'bg-indigo-600'
 : c.estado === 'Aceptada'
 ? 'bg-emerald-500'
 : esVencida
 ? 'bg-rose-500'
 : c.estado === 'Pendiente'
 ? 'bg-amber-500'
 : 'bg-slate-400'
 }`}
 />
 <span>{esVencida ? 'Vencida' : c.estado}</span>
 </span>
 </td>

 {/* Acciones */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <div className="flex items-center justify-center gap-1">
 <button
 type="button"
 onClick={() => handleAbrirImpresion(c)}
 className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
 title="Ver e Imprimir Proforma"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => handleCompartirWhatsApp(c)}
 className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
 title="Compartir WhatsApp"
 >
 <Share2 className="w-3.5 h-3.5" />
 </button>
 {esVencida ? (
 <button
 type="button"
 onClick={() => handleDuplicarCotizacion(c)}
 className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
 title="Renovar Cotización Vencida"
 >
 <RefreshCw className="w-3 h-3" />
 <span>Renovar</span>
 </button>
 ) : c.estado === 'Convertida' ? (
 <span className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/80 rounded-lg">
 Facturado
 </span>
 ) : (
 <button
 type="button"
 onClick={() => handlePasarAlPOS(c)}
 className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
 title="Cargar Materiales al Punto de Venta"
 >
 <ShoppingBag className="w-3 h-3" />
 <span>Vender</span>
 </button>
 )}
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

 {/* ─── MODAL 1: NUEVA COTIZACIÓN PARA FERRETERÍA (COMPLETO) ─── */}
      {modalNuevo && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setModalNuevo(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl overflow-hidden my-2 sm:my-6 flex flex-col max-h-[92vh] cursor-default relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                    Nueva Cotización & Proforma de Materiales
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    Presupuesto formal para obras, proyectos de construcción o clientes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                title="Cerrar modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleGuardarCotizacion} className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 custom-modal-scroll">
              {/* Sección 1: Cliente & Obra */}
 <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3 sm:space-y-3.5">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
 <User className="w-3.5 h-3.5 text-indigo-600" />
 <span>1. Datos del Cliente & Destino / Obra</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
 {/* Selector / Buscador de Cliente */}
 <div className="relative">
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Cliente / Razón Social <span className="text-rose-500">*</span>
 </label>
 <div className="relative">
 <input
 type="text"
 placeholder="Buscar cliente por nombre o DNI/RUC..."
 value={clienteSeleccionadoObj ? clienteSeleccionadoObj.nombre : busquedaCliente}
 onChange={(e) => {
 setClienteSeleccionadoObj(null);
 setBusquedaCliente(e.target.value);
 setMostrarDropdownClientes(true);
 }}
 onFocus={() => setMostrarDropdownClientes(true)}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
 />
 {clienteSeleccionadoObj && (
 <button
 type="button"
 onClick={() => {
 setClienteSeleccionadoObj(null);
 setBusquedaCliente('');
 }}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Dropdown de Clientes */}
 {mostrarDropdownClientes && !clienteSeleccionadoObj && (
 <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
 {clientesLista
 .filter(c =>
 c.nombre?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
 c.numero_documento?.includes(busquedaCliente)
 )
 .slice(0, 6)
 .map(c => (
 <button
 key={c.id}
 type="button"
 onClick={() => {
 setClienteSeleccionadoObj(c);
 setMostrarDropdownClientes(false);
 if (c.direccion) setFormCotizacion(prev => ({ ...prev, lugar_entrega: c.direccion }));
 if (c.telefono) setFormCotizacion(prev => ({ ...prev, contacto_telefono: c.telefono }));
 }}
 className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-xs border-b border-slate-100 last:border-b-0 flex items-center justify-between"
 >
 <span className="font-bold text-slate-800 truncate">{c.nombre}</span>
 <span className="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
 {c.tipo_documento}: {c.numero_documento}
 </span>
 </button>
 ))}
 {busquedaCliente.trim() && (
 <div className="p-2 bg-slate-50 text-[11px] text-slate-500 text-center">
 Presione afuera o use el cliente actual como manual
 </div>
 )}
 </div>
 )}
 </div>

 {/* Nombre de la Obra o Proyecto */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Nombre de la Obra / Proyecto
 </label>
 <input
 type="text"
 placeholder="Ej: Residencial Los Cedros - Piso 3"
 value={formCotizacion.obra}
 onChange={(e) => setFormCotizacion({ ...formCotizacion, obra: e.target.value })}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
 />
 </div>

 {/* Contacto en Obra */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Contacto en Obra (Maestro / Residente)
 </label>
 <input
 type="text"
 placeholder="Ej: Maestro Carlos Huamán"
 value={formCotizacion.contacto_nombre}
 onChange={(e) => setFormCotizacion({ ...formCotizacion, contacto_nombre: e.target.value })}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
 />
 </div>

 {/* Teléfono / WhatsApp de Obra */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Teléfono / WhatsApp de Coordinación
 </label>
 <input
 type="text"
 placeholder="Ej: 998 123 456"
 value={formCotizacion.contacto_telefono}
 onChange={(e) => setFormCotizacion({ ...formCotizacion, contacto_telefono: e.target.value })}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
 />
 </div>

 {/* Dirección de Descarga / Lugar de Entrega */}
 <div className="md:col-span-2">
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Lugar de Descarga / Entrega de Materiales
 </label>
 <input
 type="text"
 placeholder="Ej: Av. Los Próceres 1240, Mz B Lote 4 (Frente al parque)"
 value={formCotizacion.lugar_entrega}
 onChange={(e) => setFormCotizacion({ ...formCotizacion, lugar_entrega: e.target.value })}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
 />
 </div>
 </div>
 </div>

 {/* Sección 2: Condiciones Comerciales */}
 <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3 sm:space-y-3.5">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
 <Clock className="w-3.5 h-3.5 text-indigo-600" />
 <span>2. Condiciones Comerciales & Validez</span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Validez en Días */}
                <CustomPillSelect
                  label="Validez de la Oferta"
                  icon={Calendar}
                  value={formCotizacion.validez_dias}
                  onChange={(val) => setFormCotizacion({ ...formCotizacion, validez_dias: parseInt(val) })}
                  options={[
                    { value: 3, label: '3 días (Precios volátiles)' },
                    { value: 7, label: '7 días (Estándar acero/cemento)' },
                    { value: 15, label: '15 días (Recomendado)' },
                    { value: 30, label: '30 días (Obras largas)' }
                  ]}
                />

                {/* Forma de Pago */}
                <CustomPillSelect
                  label="Forma de Pago"
                  icon={CreditCard}
                  value={formCotizacion.forma_pago}
                  onChange={(val) => setFormCotizacion({ ...formCotizacion, forma_pago: val })}
                  options={[
                    { value: 'Contado', label: 'Contado / Transferencia' },
                    { value: 'Contraentrega', label: 'Contraentrega en Obra' },
                    { value: 'Crédito 15 días', label: 'Crédito 15 días' },
                    { value: 'Crédito 30 días', label: 'Crédito 30 días' },
                    { value: '50% adelanto / 50% obra', label: '50% Adelanto / 50% Obra' }
                  ]}
                />

                {/* Tiempo de Entrega */}
                <CustomPillSelect
                  label="Tiempo de Entrega"
                  icon={Clock}
                  value={formCotizacion.tiempo_entrega}
                  onChange={(val) => setFormCotizacion({ ...formCotizacion, tiempo_entrega: val })}
                  options={[
                    { value: 'Inmediato', label: 'Inmediato / En Almacén' },
                    { value: '24 horas', label: '24 horas en Obra' },
                    { value: '48 a 72 horas', label: '48 a 72 horas' },
                    { value: 'Programado con obra', label: 'Programado con Obra' }
                  ]}
                />

                {/* Flete / Transporte */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Flete a Obra
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormCotizacion(prev => ({ ...prev, incluye_flete: !prev.incluye_flete }))}
                    className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer select-none ${
                      formCotizacion.incluye_flete
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Truck className={`w-3.5 h-3.5 shrink-0 ${formCotizacion.incluye_flete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span className="text-xs truncate">{formCotizacion.incluye_flete ? 'Incluye flete' : 'Sin flete'}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      formCotizacion.incluye_flete ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {formCotizacion.incluye_flete ? '✓' : '—'}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Sección 3: Selector de Productos y Lista de Ítems */}
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
 <Boxes className="w-3.5 h-3.5 text-indigo-600" />
 <span>3. Insumos & Materiales a Cotizar</span>
 </div>
 <span className="text-xs text-slate-500 font-semibold">
 {formCotizacion.items.length} productos agregados
 </span>
 </div>

 {/* Buscador de Productos */}
 <div className="relative">
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Escriba el nombre del material, cemento, varilla, tubo, código..."
 value={busquedaProducto}
 onChange={(e) => {
 setBusquedaProducto(e.target.value);
 setMostrarDropdownProductos(true);
 }}
 onFocus={() => setMostrarDropdownProductos(true)}
 className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white shadow-2xs"
 />

 {/* Dropdown de Resultados de Productos */}
 {mostrarDropdownProductos && productosFiltrados.length > 0 && (
 <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
 {productosFiltrados.map((p) => (
 <div
 key={p.id}
 onClick={() => handleAgregarProducto(p)}
 className="p-3 hover:bg-indigo-50/70 transition-colors flex items-center justify-between cursor-pointer group"
 >
 <div>
 <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
 {p.nombre}
 </div>
 <div className="text-[10.5px] text-slate-500 flex items-center gap-2 mt-0.5">
 <span className="font-mono text-slate-400">Cod: {p.codigo_barras || 'S/C'}</span>
 <span>•</span>
 <span className="font-semibold text-slate-600">Unidad: {p.unidad_medida || 'UND'}</span>
 <span>•</span>
 <span className={`font-bold ${parseFloat(p.stock) > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
 Stock: {parseFloat(p.stock)} {p.unidad_medida}
 </span>
 </div>
 </div>
 <div className="text-right">
 <span className="text-xs font-black text-indigo-700 font-mono">
 S/ {parseFloat(p.precio_venta).toFixed(2)}
 </span>
 <span className="block text-[10px] text-slate-400 font-bold">Agregar +</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Tabla de Ítems en el Borrador */}
 {formCotizacion.items.length === 0 ? (
 <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
 <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
 <p className="text-xs font-bold text-slate-500">Ningún material agregado a la proforma</p>
 <p className="text-[11px] text-slate-400 mt-0.5">Use el buscador superior para agregar materiales.</p>
 </div>
 ) : (
 <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
 <th className="py-2.5 px-3">PRODUCTO / MATERIAL</th>
 <th className="py-2.5 px-2 text-center w-24">CANTIDAD</th>
 <th className="py-2.5 px-2 text-center w-24">UNIDAD</th>
 <th className="py-2.5 px-2 text-center w-20">STOCK</th>
 <th className="py-2.5 px-3 text-right w-28">P. UNIT (S/)</th>
 <th className="py-2.5 px-3 text-right w-28">SUBTOTAL</th>
 <th className="py-2.5 px-2 text-center w-10"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {formCotizacion.items.map((it, idx) => {
 const stockSuficiente = it.stock_actual >= it.cantidad;
 return (
 <tr key={idx} className="hover:bg-slate-50/50">
 <td className="py-2.5 px-3">
 <div className="font-bold text-slate-900 leading-snug">{it.nombre}</div>
 {it.codigo_barras && (
 <div className="text-[10px] font-mono text-slate-400">{it.codigo_barras}</div>
 )}
 </td>
 <td className="py-2.5 px-2 text-center">
 <input
 type="number"
 min="0.01"
 step="any"
 value={it.cantidad}
 onChange={(e) => handleCambiarCantidad(idx, e.target.value)}
 className="w-20 px-2 py-1 text-center font-bold text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </td>
 <td className="py-2.5 px-2 text-center">
 <input
 type="text"
 value={it.unidad_medida}
 onChange={(e) => handleCambiarUnidad(idx, e.target.value)}
 className="w-20 px-2 py-1 text-center text-[11px] font-bold uppercase text-slate-700 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </td>
 <td className="py-2.5 px-2 text-center">
 <span
 className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
 stockSuficiente
 ? 'bg-emerald-100 text-emerald-800'
 : 'bg-amber-100 text-amber-800'
 }`}
 title={stockSuficiente ? 'Stock disponible' : 'Excede stock disponible actual'}
 >
 {it.stock_actual}
 </span>
 </td>
 <td className="py-2.5 px-3 text-right">
 <input
 type="number"
 min="0"
 step="0.01"
 value={it.precio_unitario}
 onChange={(e) => handleCambiarPrecio(idx, e.target.value)}
 className="w-24 px-2 py-1 text-right font-mono font-bold text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </td>
 <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
 S/ {it.subtotal.toFixed(2)}
 </td>
 <td className="py-2.5 px-2 text-center">
 <button
 type="button"
 onClick={() => handleEliminarItem(idx)}
 className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>

 {/* Sección 4: Observaciones & Resumen de Totales */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 mb-1">
 Notas / Términos Comerciales Adicionales
 </label>
 <textarea
 rows="3"
 placeholder="Ej: Precios sujetos a stock del fabricante. Descarga a pie de vereda. Se requiere 50% de anticipo para despacho."
 value={formCotizacion.notas}
 onChange={(e) => setFormCotizacion({ ...formCotizacion, notas: e.target.value })}
 className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>

 {/* Caja de Totales */}
 <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50/25 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-indigo-950/30 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 space-y-2.5 shadow-2xs">
 <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
 <span>Op. Gravadas (Subtotal):</span>
 <span className="font-mono font-bold text-slate-700 dark:text-slate-300">S/ {subtotalSinIgvBorrador.toFixed(2)}</span>
 </div>
 <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
 <span>I.G.V. Oficial (18%):</span>
 <span className="font-mono font-bold text-slate-700 dark:text-slate-300">S/ {igvBorrador.toFixed(2)}</span>
 </div>
 <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-700/80">
 <div className="flex items-center gap-2">
 <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800/80 shadow-2xs ">
 TOTAL COTIZADO:
 </span>
 </div>
 <span className="text-xl sm:text-2xl font-black tracking-tight text-indigo-700 dark:text-indigo-400 font-mono">
 S/ {totalBorrador.toFixed(2)}
 </span>
 </div>
 </div>
 </div>

 {/* Botonera de Guardar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || formCotizacion.items.length === 0}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-xs font-extrabold text-white transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Emitiendo...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Generar Proforma Oficial</span>
                  </>
                )}
              </button>
            </div>
          </form>
 </div>
 </div>,
 document.body
 )}

 {/* ─── MODAL 2: VER / IMPRIMIR PROFORMA FORMAL (A4 & TICKET 80MM) ─── */}
 {modalDetalle && cotizacionSeleccionada && typeof document !== 'undefined' && createPortal(
 <div
 className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
 onClick={() => setModalDetalle(false)}
 >
 <div
 className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[95vh] cursor-default relative"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header con pestañas de formato y botón de cierre */}
            <div className="p-3 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl print:hidden shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormatoImpresion('a4')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formatoImpresion === 'a4'
                        ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Proforma A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatoImpresion('ticket')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formatoImpresion === 'ticket'
                        ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Ticket 80mm
                  </button>
                </div>

                {/* Botón cerrar visible en móvil en la fila superior */}
                <div className="flex sm:hidden">
                  <button
                    type="button"
                    onClick={() => setModalDetalle(false)}
                    className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                    title="Cerrar modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCompartirWhatsApp(cotizacionSeleccionada)}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimir}
                  className="flex-1 sm:flex-initial px-4 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                {/* Botón cerrar para Desktop */}
                <div className="hidden sm:flex">
                  <button
                    type="button"
                    onClick={() => setModalDetalle(false)}
                    className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs ml-1"
                    title="Cerrar modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contenido Imprimible */}
 <div className="p-2 sm:p-8 overflow-y-auto flex-1 bg-slate-100/90 dark:bg-slate-950/60 flex justify-center items-start">
 {formatoImpresion === 'a4' ? (
 /* ─── FORMATO PROFORMA A4 FORMAL ─── */
 <div className="w-full max-w-[780px] bg-white dark:bg-slate-900 p-2.5 sm:p-10 rounded-2xl shadow-xl border border-slate-200 text-slate-800 font-sans print:p-0 print:border-none print:shadow-none space-y-4 sm:space-y-6 shrink-0 mb-8">
 {/* Encabezado Corporativo Ferretería */}
 <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 sm:pb-6 border-b-2 border-slate-900">
 <div className="space-y-1">
 {businessLogoUrl ? (
 <img src={businessLogoUrl} alt="Logo" className="h-12 object-contain mb-2" />
 ) : (
 <div className="flex items-center gap-2 text-indigo-700 font-black text-xl mb-1">
 <Building2 className="w-6 h-6" />
 <span>{businessName || 'FERRETERÍA HEIS'}</span>
 </div>
 )}
 <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
 Materiales de Construcción & Acabados Pro
 </h2>
 <p className="text-xs text-slate-500 font-medium">{address}</p>
 <p className="text-xs text-slate-500 font-medium">Telf: {storePhone}</p>
 </div>

 {/* Caja de RUC y Número de Cotización */}
 <div className="border-2 border-slate-900 rounded-2xl p-3.5 sm:p-4 text-center w-full sm:w-auto min-w-0 sm:min-w-[220px] bg-slate-50/50">
 <div className="text-xs font-black text-slate-900 uppercase tracking-widest">
 R.U.C. N° {businessRuc}
 </div>
 <div className="py-2 my-1 border-y border-slate-300 font-black text-base text-indigo-700 tracking-wider">
 COTIZACIÓN FORMAL
 </div>
 <div className="font-mono text-sm font-extrabold text-slate-900">
 {cotizacionSeleccionada.numero}
 </div>
 </div>
 </div>

 {/* Cuadrícula de Datos: Cliente & Obra */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
 <div>
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DATOS DEL CLIENTE</span>
 <div className="font-black text-slate-900 text-sm mt-0.5">
 {cotizacionSeleccionada.cliente?.nombre || 'Público General'}
 </div>
 {cotizacionSeleccionada.cliente?.numero_documento && (
 <div className="text-slate-600 mt-0.5">
 <strong>{cotizacionSeleccionada.cliente.tipo_documento || 'DOC'}:</strong> {cotizacionSeleccionada.cliente.numero_documento}
 </div>
 )}
 {cotizacionSeleccionada.cliente?.direccion && (
 <div className="text-slate-600 mt-0.5">
 <strong>Dirección:</strong> {cotizacionSeleccionada.cliente.direccion}
 </div>
 )}
 </div>

 <div>
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DATOS DE LA COTIZACIÓN</span>
 <div className="text-slate-700 mt-0.5">
 <strong>Fecha Emisión:</strong> {new Date(cotizacionSeleccionada.created_at).toLocaleDateString('es-PE')}
 </div>
 <div className="text-slate-700 mt-0.5">
 <strong>Validez Oferta:</strong> {cotizacionSeleccionada.validez_dias} días naturales
 </div>
 {cotizacionSeleccionada.obra && (
 <div className="text-indigo-700 font-bold mt-0.5">
 <strong>Obra / Ref:</strong> {cotizacionSeleccionada.obra}
 </div>
 )}
 {cotizacionSeleccionada.lugar_entrega && (
 <div className="text-slate-700 mt-0.5">
 <strong>Lugar Descarga:</strong> {cotizacionSeleccionada.lugar_entrega}
 </div>
 )}
 </div>
 </div>

 {/* Tabla Detallada de Materiales con scroll horizontal táctil */}
              <div>
                <div className="flex sm:hidden items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 font-bold px-1 mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <MoveHorizontal className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span>Deslizar para ver todas las columnas</span>
                  </span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                    {cotizacionSeleccionada.detalles?.length || 0} ítems
                  </span>
                </div>
                <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-x-auto custom-scrollbar shadow-2xs bg-white dark:bg-slate-900">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 dark:bg-slate-800 text-white font-bold text-[11px]">
                        <th className="py-2.5 px-3 text-center w-12 shrink-0">ÍTEM</th>
                        <th className="py-2.5 px-3 min-w-[200px]">DESCRIPCIÓN DEL MATERIAL</th>
                        <th className="py-2.5 px-3 text-center w-20 shrink-0">UNIDAD</th>
                        <th className="py-2.5 px-3 text-center w-20 shrink-0">CANTIDAD</th>
                        <th className="py-2.5 px-3 text-right w-24 shrink-0">P. UNIT (S/)</th>
                        <th className="py-2.5 px-3 text-right w-24 shrink-0">TOTAL (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {cotizacionSeleccionada.detalles?.map((det, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-bold">{index + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {det.producto?.nombre || 'Material'}
                            {det.descripcion_personalizada && (
                              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 italic mt-0.5">{det.descripcion_personalizada}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{det.unidad_medida || 'UND'}</td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-white font-mono">{parseFloat(det.cantidad)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{parseFloat(det.precio_unitario).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">{parseFloat(det.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen de Totales y Condiciones */}
 <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4 pt-2">
 <div className="text-xs text-slate-600 space-y-1 max-w-sm">
 <div className="font-bold text-slate-800 uppercase text-[11px]">Condiciones Comerciales:</div>
 <div>• Forma de Pago: <strong>{cotizacionSeleccionada.forma_pago || 'Contado'}</strong></div>
 <div>• Tiempo de Entrega: <strong>{cotizacionSeleccionada.tiempo_entrega || 'Inmediato'}</strong></div>
 <div>• Flete a Obra: <strong>{cotizacionSeleccionada.incluye_flete ? 'Incluido a pie de obra' : 'No incluye (Recojo en tienda)'}</strong></div>
 {cotizacionSeleccionada.notas && (
 <div className="pt-1 text-[11px] text-slate-500 italic">
 "{cotizacionSeleccionada.notas}"
 </div>
 )}
 </div>

 <div className="w-full sm:w-auto min-w-0 sm:min-w-[220px] bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
 <div className="flex justify-between text-slate-600">
 <span>Op. Gravadas:</span>
 <span className="font-mono font-bold">S/ {parseFloat(cotizacionSeleccionada.subtotal).toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-slate-600">
 <span>I.G.V. (18%):</span>
 <span className="font-mono font-bold">S/ {parseFloat(cotizacionSeleccionada.igv).toFixed(2)}</span>
 </div>
 <div className="flex justify-between pt-1.5 border-t border-slate-300 font-black text-sm text-slate-900">
 <span className="text-indigo-700">TOTAL:</span>
 <span className="font-mono text-indigo-700">S/ {parseFloat(cotizacionSeleccionada.total).toFixed(2)}</span>
 </div>
 </div>
 </div>

 {/* Cuentas de Abono y Pie */}
 {settings.mostrarCuentasEnCotizaciones !== false && (
 <div className="pt-5 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1.5">
 <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Cuentas Bancarias & Métodos de Abono:</div>
 <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
 {settings.banco1Cuenta && (
 <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
 <strong>{settings.banco1Nombre || 'Banco 1'}:</strong> {settings.banco1Cuenta} {settings.banco1Cci && <span className="text-slate-400">| CCI: {settings.banco1Cci}</span>}
 </span>
 )}
 {settings.banco2Cuenta && (
 <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
 <strong>{settings.banco2Nombre || 'Banco 2'}:</strong> {settings.banco2Cuenta} {settings.banco2Cci && <span className="text-slate-400">| CCI: {settings.banco2Cci}</span>}
 </span>
 )}
 {settings.banco3Cuenta && (
 <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
 <strong>{settings.banco3Nombre || 'Banco 3'}:</strong> {settings.banco3Cuenta} {settings.banco3Cci && <span className="text-slate-400">| CCI: {settings.banco3Cci}</span>}
 </span>
 )}
 {settings.pagoYapeNumero && (
 <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
 <strong>Yape:</strong> {settings.pagoYapeNumero} {settings.pagoYapeTitular && `(${settings.pagoYapeTitular})`}
 </span>
 )}
 {settings.pagoPlinNumero && (
 <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium">
 <strong>Plin:</strong> {settings.pagoPlinNumero} {settings.pagoPlinTitular && `(${settings.pagoPlinTitular})`}
 </span>
 )}
 {!settings.banco1Cuenta && !settings.banco2Cuenta && !settings.banco3Cuenta && !settings.pagoYapeNumero && !settings.pagoPlinNumero && (
 <span>BCP Soles: 191-99887766-0-12 • BBVA Soles: 0011-0123-0100045678</span>
 )}
 </div>
 <div className="pt-1 text-slate-400 text-[9.5px]">Gracias por su confianza. Esta cotización constituye una propuesta comercial formal.</div>
 </div>
 )}
 </div>
 ) : (
 /* ─── FORMATO TICKET TÉRMICO 80MM ─── */
 <div className="w-[300px] bg-white p-5 rounded-xl shadow-xl border border-slate-200 text-slate-900 font-mono text-xs space-y-3 shrink-0 mb-8">
 <div className="text-center space-y-1">
 <div className="font-black text-sm">{businessName || 'FERRETERÍA HEIS'}</div>
 <div className="text-[10px]">RUC: {businessRuc}</div>
 <div className="text-[10px]">{address}</div>
 <div className="text-[10px]">Telf: {storePhone}</div>
 <div className="border-t border-dashed border-slate-400 my-2" />
 <div className="font-black text-xs">PROFORMA DE VENTA</div>
 <div className="font-black text-xs">{cotizacionSeleccionada.numero}</div>
 <div className="text-[10px] text-slate-500">{new Date(cotizacionSeleccionada.created_at).toLocaleString('es-PE')}</div>
 </div>

 <div className="border-t border-dashed border-slate-400 pt-2 text-[10.5px] space-y-0.5">
 <div><strong>Cliente:</strong> {cotizacionSeleccionada.cliente?.nombre || 'General'}</div>
 {cotizacionSeleccionada.cliente?.numero_documento && (
 <div><strong>Doc:</strong> {cotizacionSeleccionada.cliente.numero_documento}</div>
 )}
 {cotizacionSeleccionada.obra && (
 <div><strong>Obra:</strong> {cotizacionSeleccionada.obra}</div>
 )}
 <div><strong>Validez:</strong> {cotizacionSeleccionada.validez_dias} días</div>
 </div>

 <div className="border-t border-dashed border-slate-400 pt-2">
 <table className="w-full text-[10px]">
 <thead>
 <tr className="border-b border-slate-300 font-bold">
 <th className="text-left pb-1">CANT</th>
 <th className="text-left pb-1">DESC</th>
 <th className="text-right pb-1">TOTAL</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {cotizacionSeleccionada.detalles?.map((d, i) => (
 <tr key={i}>
 <td className="py-1 font-bold">{parseFloat(d.cantidad)}</td>
 <td className="py-1">{d.producto?.nombre}</td>
 <td className="py-1 text-right font-bold">{parseFloat(d.subtotal).toFixed(2)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-right text-xs">
 <div>Subtotal: S/ {parseFloat(cotizacionSeleccionada.subtotal).toFixed(2)}</div>
 <div>IGV (18%): S/ {parseFloat(cotizacionSeleccionada.igv).toFixed(2)}</div>
 <div className="text-sm font-black pt-1 border-t border-slate-800">
 TOTAL: S/ {parseFloat(cotizacionSeleccionada.total).toFixed(2)}
 </div>
 </div>

 {settings.mostrarCuentasEnCotizaciones !== false && (settings.banco1Cuenta || settings.pagoYapeNumero || settings.pagoPlinNumero) && (
 <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[9.5px] text-slate-600 space-y-0.5">
 <div className="font-bold">TRANSFERENCIAS & PAGOS:</div>
 {settings.banco1Cuenta && <div>{settings.banco1Nombre || 'Banco'}: {settings.banco1Cuenta}</div>}
 {settings.pagoYapeNumero && <div>Yape: {settings.pagoYapeNumero}</div>}
 {settings.pagoPlinNumero && <div>Plin: {settings.pagoPlinNumero}</div>}
 </div>
 )}

 <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[10px] text-slate-500">
 <div>*** PROFORMA SIN VALOR FISCAL ***</div>
 <div>Precios sujetos a variación de stock</div>
 </div>
 </div>
 )}
 </div>

 {/* Modal Bottom Footer (Acciones Rápidas) */}
 <div className="p-3 sm:px-6 sm:py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0 print:hidden">
 <div className="text-xs text-slate-500 font-medium">
 Proforma Oficial <strong className="text-slate-800 font-mono">{cotizacionSeleccionada.numero}</strong> • Validez: {cotizacionSeleccionada.validez_dias} días
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setModalDetalle(false)}
 className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 <button
 type="button"
 onClick={() => handleCompartirWhatsApp(cotizacionSeleccionada)}
 className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
 >
 <Share2 className="w-3.5 h-3.5 text-emerald-600" />
 <span>WhatsApp</span>
 </button>
 <button
 type="button"
 onClick={handleImprimir}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
 >
 <Printer className="w-3.5 h-3.5" />
 <span>Imprimir Proforma</span>
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
