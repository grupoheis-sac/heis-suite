import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from './store/cartStore';
import { useCajaStore } from './store/cajaStore';
import api from './api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { notificarProductoAgregado, notificarComprobanteEmitido } from './utils/notificaciones';
import {
 Unlock,
 Lock,
 AlertTriangle,
 Wallet,
 X,
 ArrowRight,
 ShieldCheck,
 CheckCircle2,
 DollarSign
} from 'lucide-react';

import {
 POSCatalogo,
 POSTicket,
 POSModalCobro,
 POSModalCotizacion,
 POSModalClienteRapido,
 POSModalAtajos
} from './components/pos';
import { TicketImpresion } from '@heis/ui';

export default function POS() {
 const {
 items,
 addItem,
 updateCantidad,
 removeItem,
 clearCart,
 tipoComprobante,
 setTipoComprobante,
 tipoPago,
 setTipoPago,
 numeroOperacion,
 setNumeroOperacion,
 descuento,
 setDescuento,
 montoRecibido,
 setMontoRecibido,
 creditoDias,
 setCreditoDias,
 getSubtotal,
 getTotal,
 getVuelto
 } = useCartStore();

 const [productos, setProductos] = useState([]);
 const [clientes, setClientes] = useState([]);
 const [idCliente, setIdCliente] = useState('');
 const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
 const [busquedaCliente, setBusquedaCliente] = useState('');
 const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);

 const [busqueda, setBusqueda] = useState('');
 const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
 const [tarifa, setTarifa] = useState('publico'); // 'publico' | 'maestro'
 const [cargando, setCargando] = useState(false);
 const [procesandoVenta, setProcesandoVenta] = useState(false);
 const navigate = useNavigate();
 const { cajaAbierta, cajaInfo, fetchCaja, aperturarCaja } = useCajaStore();

 // Modal de Apertura de Caja en POS
 const [modalAperturaPOS, setModalAperturaPOS] = useState(false);
 const [montoAperturaPOS, setMontoAperturaPOS] = useState('0.00');
 const [aperturandoCajaPOS, setAperturandoCajaPOS] = useState(false);
 const [cajaVerificada, setCajaVerificada] = useState(false);

 // Panel inline de cobro y emisión en el ticket (0 modales invasivos)
 const [modoCobroActivo, setModoCobroActivo] = useState(false);
 const [ticketVenta, setTicketVenta] = useState(null);

 // Estados para Pago Mixto / Combinado
 const [montoMixtoEfectivo, setMontoMixtoEfectivo] = useState('');
 const [efectivoRecibidoMixto, setEfectivoRecibidoMixto] = useState('');
 const [montoMixtoYape, setMontoMixtoYape] = useState('');
 const [montoMixtoPlin, setMontoMixtoPlin] = useState('');
 const [montoMixtoTarjeta, setMontoMixtoTarjeta] = useState('');
 const [operacionMixtoYape, setOperacionMixtoYape] = useState('');
 const [operacionMixtoPlin, setOperacionMixtoPlin] = useState('');
 const [operacionMixtoTarjeta, setOperacionMixtoTarjeta] = useState('');

 // Modales
 const [modalCobroOpen, setModalCobroOpen] = useState(false);
 const [modalCotizacionOpen, setModalCotizacionOpen] = useState(false);
 const [modalClienteRapidoOpen, setModalClienteRapidoOpen] = useState(false);
 const [modalTicketOpen, setModalTicketOpen] = useState(false);
 const [mostrarModalAtajos, setMostrarModalAtajos] = useState(false);
 const [ventaExitosa, setVentaExitosa] = useState(null);

 // Estado para registro rápido de cliente
 const [nuevoClienteTipoDoc, setNuevoClienteTipoDoc] = useState('DNI');
 const [nuevoClienteNumDoc, setNuevoClienteNumDoc] = useState('');
 const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
 const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState('');
 const [nuevoClienteDireccion, setNuevoClienteDireccion] = useState('');
 const [nuevoClienteEmail, setNuevoClienteEmail] = useState('');
 const [nuevoClienteLimiteCredito, setNuevoClienteLimiteCredito] = useState('');
 const [consultandoDoc, setConsultandoDoc] = useState(false);
 const [guardandoCliente, setGuardandoCliente] = useState(false);

 const searchInputRef = useRef(null);

 // Cargar productos iniciales, clientes y estado de caja
 const cargarDatos = async () => {
 try {
 const [resProd, resCli, resCaja] = await Promise.all([
 api.get('/productos?limit=100'),
 api.get('/clientes?limit=100'),
 fetchCaja(true)
 ]);
 if (resProd.success) setProductos(resProd.productos || []);
 if (resCli.success) setClientes(resCli.clientes || []);
 setCajaVerificada(true);
 const abierta = Boolean(resCaja && resCaja.success && resCaja.cajaAbierta);
 if (!abierta) {
 setModalAperturaPOS(true);
 }
 } catch (e) {
 console.error(e);
 setCajaVerificada(true);
 }
 };

 useEffect(() => {
 cargarDatos();

 const handleCajaChanged = (e) => {
 const estaAbierta = e.detail?.cajaAbierta !== undefined
 ? Boolean(e.detail.cajaAbierta)
 : useCajaStore.getState().cajaAbierta;

 if (!estaAbierta) {
 setModalAperturaPOS(true);
 } else {
 setModalAperturaPOS(false);
 }
 };

 window.addEventListener('caja-status-changed', handleCajaChanged);
 return () => {
 window.removeEventListener('caja-status-changed', handleCajaChanged);
 };
 }, []);

 const handleAperturaPOS = async (e) => {
 e.preventDefault();
 const monto = parseFloat(montoAperturaPOS);
 if (isNaN(monto) || monto < 0) {
 toast.error('Ingrese un monto inicial válido (0 o superior)');
 return;
 }
 setAperturandoCajaPOS(true);
 try {
 const res = await aperturarCaja(monto);
 if (res && res.success) {
 toast.success(`Turno aperturado con éxito con S/ ${monto.toFixed(2)}`);
 setModalAperturaPOS(false);
 setMontoAperturaPOS('0.00');
 setTimeout(() => {
 searchInputRef.current?.focus();
 }, 100);
 } else {
 toast.error(res?.message || 'Error al aperturar caja');
 }
 } catch (err) {
 toast.error(err.message || 'Error al aperturar caja');
 } finally {
 setAperturandoCajaPOS(false);
 }
 };

 // Sincronizar clienteSeleccionado cuando idCliente cambia
 useEffect(() => {
 if (idCliente) {
 const found = clientes.find((c) => String(c.id) === String(idCliente));
 if (found) setClienteSeleccionado(found);
 } else {
 setClienteSeleccionado(null);
 }
 }, [idCliente, clientes]);

 const handleSelectCliente = (c) => {
 setClienteSeleccionado(c);
 setIdCliente(c ? String(c.id) : '');
 if (c) {
 if (c.tipo_documento === 'RUC' || c.numero_documento?.length === 11) {
 setTipoComprobante('Factura');
 } else {
 setTipoComprobante('Boleta');
 }
 const esMaestro =
 c.categoria === 'MAESTRO' ||
 c.perfil_cliente?.toLowerCase().includes('maestro') ||
 c.perfil_cliente?.toLowerCase().includes('contratista');

 if (esMaestro) {
 setTarifa('maestro');
 }
 }
 };

 // Filtrado reactivo de clientes para el dropdown
 const qCliente = busquedaCliente.trim().toLowerCase();
 const esDniValido = /^\d{8}$/.test(busquedaCliente.trim());
 const esRucValido = /^\d{11}$/.test(busquedaCliente.trim());

 const clientesFiltrados = useMemo(() => {
 if (!qCliente) return clientes.slice(0, 10);
 return clientes.filter((c) => {
 const matchNom = c.nombre?.toLowerCase().includes(qCliente);
 const matchDoc = c.numero_documento?.toLowerCase().includes(qCliente);
 const matchTel = c.telefono?.includes(qCliente);
 return matchNom || matchDoc || matchTel;
 }).slice(0, 10);
 }, [clientes, qCliente]);

 const clienteExisteExacto = useMemo(() => {
 if (!qCliente) return null;
 return clientes.find(
 (c) => c.numero_documento && c.numero_documento.toLowerCase() === qCliente
 );
 }, [clientes, qCliente]);

 // Búsqueda reactiva con debounce de productos
 useEffect(() => {
 const delayDebounce = setTimeout(async () => {
 if (busqueda.trim().length === 0) {
 cargarDatos();
 return;
 }
 setCargando(true);
 try {
 const res = await api.get(`/productos?busqueda=${encodeURIComponent(busqueda)}&limit=50`);
 if (res.success) {
 setProductos(res.productos || []);
 }
 } catch (e) {
 // Silencioso
 } finally {
 setCargando(false);
 }
 }, 200);

 return () => clearTimeout(delayDebounce);
 }, [busqueda]);

 // Manejo de lector de código de barras
 const handleBarcodeSubmit = async (e) => {
 e.preventDefault();
 const q = busqueda.trim();
 if (!q) return;

 // 1. Por código de barras de producto
 try {
 const res = await api.get(`/productos/codigo/${encodeURIComponent(q)}`);
 if (res.success && res.producto) {
 addItem(res.producto, 1);
 notificarProductoAgregado({
 nombre: res.producto.nombre,
 formato: res.producto.unidad_medida,
 cantidad: 1,
 precio: res.producto.precio_venta,
 unidad: res.producto.unidad_medida
 });
 setBusqueda('');
 return;
 } else {
 throw new Error();
 }
 } catch (err) {
 // 2. Si coincide con un cliente existente por DNI o RUC
 const clientePorDoc = clientes.find(
 (c) => c.numero_documento && c.numero_documento.toLowerCase() === q.toLowerCase()
 );
 if (clientePorDoc) {
 handleSelectCliente(clientePorDoc);
 setBusqueda('');
 toast.success(`Cliente ${clientePorDoc.nombre} asignado`);
 return;
 }

 // 3. Si es un DNI (8 dígitos) o RUC (11 dígitos) y no está en clientes: abrir registro rápido
 const esDni = /^\d{8}$/.test(q);
 const esRuc = /^\d{11}$/.test(q);
 if (esDni || esRuc) {
 abrirRegistroRapidoConDoc(q);
 setBusqueda('');
 return;
 }

 // 4. Coincidencia por lista si solo hay 1 producto filtrado
 if (productosFiltrados.length === 1) {
 const prod = productosFiltrados[0];
 addItem(prod, 1);
 notificarProductoAgregado({
 nombre: prod.nombre,
 formato: prod.unidad_medida,
 cantidad: 1,
 precio: prod.precio_venta,
 unidad: prod.unidad_medida
 });
 setBusqueda('');
 } else {
 toast.error('Producto o documento no encontrado');
 }
 }
 };

 // Filtrado de productos en memoria según categoría y stock
 const productosFiltrados = useMemo(() => {
 return productos.filter((prod) => {
 const catObj = prod.categoria;
 const catNombre = typeof catObj === 'object' ? catObj?.nombre : prod.categoria;
 const stock = parseFloat(prod.stock || 0);
 const stockMin = parseFloat(prod.stock_minimo || 5);

 if (filtroCategoria === 'TODOS') return true;
 if (filtroCategoria === 'CON_STOCK') return stock > 0;
 if (filtroCategoria === 'BAJO_STOCK') return stock > 0 && stock <= stockMin;

 return catNombre === filtroCategoria;
 });
 }, [productos, filtroCategoria]);

 // Aplicación automática de descuento si la tarifa es 'maestro' (-5%)
 useEffect(() => {
 const sub = getSubtotal();
 if (tarifa === 'maestro') {
 const descMaestro = parseFloat((sub * 0.05).toFixed(2));
 setDescuento(descMaestro);
 } else {
 setDescuento(0);
 }
 }, [tarifa, items]);

 const handleNuevaVenta = () => {
 setTicketVenta(null);
 setModoCobroActivo(false);
 clearCart();
 setIdCliente('');
 setClienteSeleccionado(null);
 setBusquedaCliente('');
 setMontoRecibido('');
 setNumeroOperacion('');
 setMontoMixtoEfectivo('');
 setEfectivoRecibidoMixto('');
 setMontoMixtoYape('');
 setMontoMixtoPlin('');
 setMontoMixtoTarjeta('');
 setOperacionMixtoYape('');
 setOperacionMixtoPlin('');
 setOperacionMixtoTarjeta('');
 setTarifa('publico');
 setTimeout(() => {
 searchInputRef.current?.focus();
 }, 50);
 };

 // ⌨️ Manejo de Atajos de Teclado F1, F2, F4, F6, F8, F9, ESC (+ compatibilidad Fn / Alt)
 useEffect(() => {
 const handleKeyDown = (e) => {
 const isF1 = e.key === 'F1' || e.code === 'F1' || e.keyCode === 112 || (e.altKey && e.key.toLowerCase() === 'h');
 const isF2 = e.key === 'F2' || e.code === 'F2' || e.keyCode === 113 || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k');
 const isF4 = e.key === 'F4' || e.code === 'F4' || e.keyCode === 115 || (e.altKey && e.key.toLowerCase() === 'n');
 const isF6 = e.key === 'F6' || e.code === 'F6' || e.keyCode === 117;
 const isF8 = e.key === 'F8' || e.code === 'F8' || e.keyCode === 119 || (e.altKey && e.key.toLowerCase() === 'c');
 const isF9 = e.key === 'F9' || e.code === 'F9' || e.keyCode === 120 || (e.altKey && e.key.toLowerCase() === 'l');
 const isEsc = e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape' || e.keyCode === 27;

 // F1 o Alt+H: Ver / Ocultar guía de atajos de teclado
 if (isF1) {
 e.preventDefault();
 e.stopPropagation();
 setMostrarModalAtajos((prev) => !prev);
 return;
 }

 // F2 o Ctrl+K: Enfocar buscador de artículos / Escáner de barras (o Nueva Venta si el ticket ya se emitió)
 if (isF2) {
 e.preventDefault();
 e.stopPropagation();
 if (ticketVenta) {
 handleNuevaVenta();
 } else {
 const el = searchInputRef.current || document.getElementById('pos-barcode-input');
 el?.focus();
 el?.select();
 }
 return;
 }

 // Auto-enfoque inteligente para pistolas de código de barras:
 // Si el usuario pistolea cuando el foco no está en un input y no hay modales abiertos,
 // enfocar automáticamente el campo de búsqueda para que la pistola no pierda caracteres.
 const hayModalAbierto =
 mostrarModalAtajos ||
 modalClienteRapidoOpen ||
 modalCotizacionOpen ||
 modalTicketOpen ||
 mostrarDropdownClientes;

 const tagActivo = document.activeElement?.tagName?.toLowerCase();
 const estaEnInput = ['input', 'textarea', 'select'].includes(tagActivo) || document.activeElement?.isContentEditable;

 if (!hayModalAbierto && !estaEnInput && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
 const el = searchInputRef.current || document.getElementById('pos-barcode-input');
 el?.focus();
 }

 // F4 o Alt+N: Abrir registro rápido de cliente (RENIEC / SUNAT)
 if (isF4) {
 e.preventDefault();
 e.stopPropagation();
 abrirRegistroRapidoConDoc(busquedaCliente);
 return;
 }

 // F6: Cargar proforma o cotización al ticket
 if (isF6) {
 e.preventDefault();
 e.stopPropagation();
 setModalCotizacionOpen(true);
 return;
 }

 // F8 o Alt+C: Cobrar venta / Abrir panel inline de cobro (o Confirmar cobro si ya está en modo cobro)
 if (isF8) {
 e.preventDefault();
 e.stopPropagation();
 if (ticketVenta) {
 handleNuevaVenta();
 return;
 }
 if (items.length === 0) {
 toast.error('El ticket de venta está vacío.');
 return;
 }
 if (!cajaAbierta) {
 toast.error('La caja está cerrada. Debe aperturarla antes de cobrar.');
 return;
 }
 if (modoCobroActivo) {
 if (!procesandoVenta) {
 handleConfirmarCobro();
 }
 } else {
 setModoCobroActivo(true);
 }
 return;
 }

 // F9 o Alt+L: Vaciar todos los artículos del ticket actual
 if (isF9) {
 e.preventDefault();
 e.stopPropagation();
 if (items.length > 0 && window.confirm('¿Desea vaciar todos los artículos del ticket?')) {
 clearCart();
 toast.success('Ticket vaciado');
 }
 return;
 }

 // ESC: Volver al carrito / Cerrar modales / Resetear a nueva venta
 if (isEsc) {
 e.preventDefault();
 e.stopPropagation();
 if (mostrarModalAtajos) setMostrarModalAtajos(false);
 else if (modalClienteRapidoOpen) setModalClienteRapidoOpen(false);
 else if (modalCotizacionOpen) setModalCotizacionOpen(false);
 else if (modalTicketOpen) setModalTicketOpen(false);
 else if (ticketVenta) handleNuevaVenta();
 else if (modoCobroActivo) setModoCobroActivo(false);
 return;
 }
 };

 window.addEventListener('keydown', handleKeyDown, true);
 return () => window.removeEventListener('keydown', handleKeyDown, true);
 }, [
 items,
 modoCobroActivo,
 ticketVenta,
 cajaAbierta,
 busquedaCliente,
 mostrarModalAtajos,
 modalClienteRapidoOpen,
 modalCotizacionOpen,
 modalTicketOpen,
 mostrarDropdownClientes,
 procesandoVenta
 ]);

 // Cargar Cotización al Carrito [F6]
 const handleCargarCotizacion = (cotizacion) => {
 if (!cotizacion.detalles || cotizacion.detalles.length === 0) {
 toast.error('La cotización no tiene productos');
 return;
 }

 if (cotizacion.id_cliente) {
 setIdCliente(String(cotizacion.id_cliente));
 }

 let itemsCargados = 0;
 cotizacion.detalles.forEach((det) => {
 if (det.producto) {
 try {
 addItem(det.producto, parseFloat(det.cantidad));
 itemsCargados++;
 } catch (e) {
 toast.error(`Stock insuficiente para ${det.producto.nombre}`);
 }
 }
 });

 setModalCotizacionOpen(false);
 toast.success(`Cotización ${cotizacion.numero} cargada (${itemsCargados} items)`);
 };

 // Registro Rápido de Cliente [F4]
 const abrirRegistroRapidoConDoc = (docRaw = '') => {
 const cleanDoc = docRaw.toString().replace(/\D/g, '').trim();
 const esRuc = cleanDoc.length === 11;
 const tipo = esRuc ? 'RUC' : 'DNI';
 setNuevoClienteTipoDoc(tipo);
 setNuevoClienteNumDoc(cleanDoc);
 setNuevoClienteNombre('');
 setNuevoClienteDireccion('');
 setNuevoClienteTelefono('');
 setNuevoClienteEmail('');
 setNuevoClienteLimiteCredito('');
 setModalClienteRapidoOpen(true);
 };

 const handleConsultarDocumento = async () => {
 const doc = nuevoClienteNumDoc.trim();
 if (!doc) {
 toast.error('Ingrese el número de documento a consultar');
 return;
 }
 setConsultandoDoc(true);
 try {
 const endpoint = nuevoClienteTipoDoc === 'DNI' ? `/consultas/dni/${doc}` : `/consultas/ruc/${doc}`;
 const res = await api.get(endpoint);
 const dataDoc = res?.data?.data || res?.data || res?.cliente;
 if (res?.success && dataDoc) {
 const nombreCompleto = dataDoc.nombre_completo || dataDoc.nombres || dataDoc.razon_social || '';
 setNuevoClienteNombre(nombreCompleto);
 if (dataDoc.direccion) setNuevoClienteDireccion(dataDoc.direccion);
 toast.success(`Datos obtenidos: ${nombreCompleto}`);
 } else {
 toast('No se encontró información automática. Ingrese el nombre manualmente.', { icon: 'ℹ️' });
 }
 } catch (err) {
 toast('Servicio de consulta externa no disponible. Puede escribir los datos directamente.', { icon: 'ℹ️' });
 } finally {
 setConsultandoDoc(false);
 }
 };

 const handleGuardarNuevoCliente = async (e) => {
 e.preventDefault();
 if (!nuevoClienteNombre.trim()) {
 toast.error('Ingrese el nombre o razón social del cliente');
 return;
 }
 setGuardandoCliente(true);
 try {
 const payload = {
 tipo_documento: nuevoClienteTipoDoc,
 numero_documento: nuevoClienteNumDoc.trim(),
 nombre: nuevoClienteNombre.trim(),
 telefono: nuevoClienteTelefono.trim(),
 email: nuevoClienteEmail.trim(),
 direccion: nuevoClienteDireccion.trim(),
 limite_credito: parseFloat(nuevoClienteLimiteCredito) || 0
 };

 const res = await api.post('/clientes', payload);
 if (res.success && res.cliente) {
 toast.success(`Cliente ${res.cliente.nombre} registrado con éxito`);
 setClientes((prev) => [res.cliente, ...prev]);
 handleSelectCliente(res.cliente);
 setModalClienteRapidoOpen(false);
 }
 } catch (error) {
 toast.error(error.message || 'Error al registrar cliente');
 } finally {
 setGuardandoCliente(false);
 }
 };

 // Confirmar y Ejecutar Venta
 const handleConfirmarCobro = async (datosCobro = {}) => {
 const pago = datosCobro.tipoPago || tipoPago;
 if (!cajaAbierta) {
 toast.error('La caja está cerrada. Debe aperturar un turno de caja para procesar cobros y emitir comprobantes.');
 setModalAperturaPOS(true);
 return;
 }

 if (pago === 'Credito' && !idCliente) {
 toast.error('Para ventas a crédito debe seleccionar un cliente registrado.');
 return;
 }

 const totalVenta = getTotal();

 // Validar monto suficiente en efectivo
 let valorRecibido = totalVenta;
 if (pago === 'Efectivo') {
 const rawRec = datosCobro.montoRecibido !== undefined ? datosCobro.montoRecibido : montoRecibido;
 const numRec = (rawRec !== '' && rawRec !== null && rawRec !== undefined)
 ? parseFloat(rawRec)
 : totalVenta;

 if (isNaN(numRec) || numRec < totalVenta - 0.009) {
 const faltante = (totalVenta - (isNaN(numRec) ? 0 : numRec)).toFixed(2);
 toast.error(`Monto en efectivo insuficiente. Faltan S/ ${faltante} para cubrir el total de S/ ${totalVenta.toFixed(2)}.`);
 return;
 }
 valorRecibido = numRec;
 }

 // Validar concordancia en pago mixto
 const efecNum = parseFloat(montoMixtoEfectivo) || 0;
 const yapNum = parseFloat(montoMixtoYape) || 0;
 const pliNum = parseFloat(montoMixtoPlin) || 0;
 const tarNum = parseFloat(montoMixtoTarjeta) || 0;
 const sumaMixto = parseFloat((efecNum + yapNum + pliNum + tarNum).toFixed(2));

 if (pago === 'Mixto') {
 if (Math.abs(sumaMixto - totalVenta) > 0.02) {
 toast.error(`La suma mixta (S/ ${sumaMixto.toFixed(2)}) debe coincidir exactamente con el total (S/ ${totalVenta.toFixed(2)}).`);
 return;
 }
 if (efecNum > 0 && efectivoRecibidoMixto !== '' && parseFloat(efectivoRecibidoMixto) < efecNum - 0.009) {
 const faltanteEfec = (efecNum - parseFloat(efectivoRecibidoMixto)).toFixed(2);
 toast.error(`Efectivo recibido en pago mixto insuficiente. Faltan S/ ${faltanteEfec}.`);
 return;
 }
 }

 setProcesandoVenta(true);
 try {
 const payload = {
 tipo_comprobante: tipoComprobante,
 id_cliente: idCliente ? parseInt(idCliente) : null,
 tipo_pago: pago,
 numero_operacion: datosCobro.numeroOperacion || numeroOperacion || null,
 monto_efectivo: pago === 'Mixto' ? efecNum : datosCobro.monto_efectivo,
 monto_digital: pago === 'Mixto' ? (yapNum + pliNum + tarNum) : datosCobro.monto_digital,
 billetera_digital: pago === 'Mixto' ? 'Mixto' : datosCobro.billetera_digital,
 items: items.map((i) => ({
 id_producto: i.id,
 cantidad: i.cantidad,
 precio_unitario: i.precio_unitario
 })),
 monto_recibido: pago === 'Efectivo' ? valorRecibido : totalVenta,
 descuento,
 credito_dias: creditoDias
 };

 const res = await api.post('/ventas', payload);
 if (res.success) {
 confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
 notificarComprobanteEmitido({
 numero: res.venta?.numero || res.venta?.numero_comprobante || `V-${res.venta?.id || ''}`,
 tipo: res.venta?.tipo_comprobante || tipoComprobante,
 total: res.venta?.total || total,
 cliente: clienteActivoObj?.nombre || 'Público General'
 });

 // Preparar datos completos para el ticket térmico con trazabilidad oficial
 const ventaCompleta = {
 ...res.venta,
 numero: res.venta?.numero || res.venta?.numero_comprobante || `V-${res.venta?.id || ''}`,
 tipo_comprobante: res.venta?.tipo_comprobante || tipoComprobante,
 detalles: items.map((i) => ({
 cantidad: i.cantidad,
 unidad_medida: i.unidad_medida || 'UND',
 producto: { nombre: i.nombre, unidad_medida: i.unidad_medida || 'UND' },
 precio_unitario: i.precio_unitario,
 subtotal: i.subtotal
 })),
 cliente: clienteActivoObj,
 tipo_pago: pago,
 monto_efectivo: payload.monto_efectivo,
 monto_digital: payload.monto_digital,
 billetera_digital: payload.billetera_digital,
 numero_operacion: payload.numero_operacion,
 total: total,
 subtotal: subtotal,
 igv: subtotal * 0.18,
 descuento: descuento,
 monto_recibido: payload.monto_recibido,
 vuelto: res.venta?.vuelto !== undefined ? res.venta.vuelto : Math.max(0, parseFloat((payload.monto_recibido - total).toFixed(2))),
 created_at: res.venta?.created_at || new Date().toISOString()
 };

 setTicketVenta(ventaCompleta);
 setVentaExitosa(ventaCompleta);
 setModalTicketOpen(true);
 setModalCobroOpen(false);
 clearCart();
 cargarDatos();
 }
 } catch (error) {
 toast.error(error.message || 'Error al procesar la venta');
 } finally {
 setProcesandoVenta(false);
 }
 };

 const subtotal = getSubtotal();
 const total = getTotal();
 const vuelto = getVuelto();
 const clienteActivoObj = clienteSeleccionado || clientes.find((c) => String(c.id) === String(idCliente));

 return (
 <div className="w-full h-full flex flex-col relative min-h-0 flex-1">
 <div className="flex flex-col lg:flex-row gap-4 xl:gap-5 h-full max-h-full pb-4 lg:pb-0 min-w-0 flex-1">
 {/* ── LADO IZQUIERDO: CATÁLOGO DE FERRETERÍA (7/12) ── */}
 <POSCatalogo
 busqueda={busqueda}
 setBusqueda={setBusqueda}
 cargando={cargando}
 searchInputRef={searchInputRef}
 handleBarcodeSubmit={handleBarcodeSubmit}
 productos={productos}
 productosFiltrados={productosFiltrados}
 filtroCategoria={filtroCategoria}
 setFiltroCategoria={setFiltroCategoria}
 addItem={addItem}
 onAbrirModalCotizacion={() => setModalCotizacionOpen(true)}
 onAbrirRegistroRapidoConDoc={abrirRegistroRapidoConDoc}
 />

 {/* ── LADO DERECHO: TICKET DE VENTA Y COBRO INLINE (5/12) ── */}
 <POSTicket
 cajaAbierta={cajaAbierta}
 onAbrirCajaPrompt={() => setModalAperturaPOS(true)}
 items={items}
 clientes={clientes}
 clienteSeleccionado={clienteActivoObj}
 setClienteSeleccionado={handleSelectCliente}
 idCliente={idCliente}
 setIdCliente={setIdCliente}
 busquedaCliente={busquedaCliente}
 setBusquedaCliente={setBusquedaCliente}
 mostrarDropdownClientes={mostrarDropdownClientes}
 setMostrarDropdownClientes={setMostrarDropdownClientes}
 clientesFiltrados={clientesFiltrados}
 clienteExisteExacto={clienteExisteExacto}
 esDniValido={esDniValido}
 esRucValido={esRucValido}
 onAbrirRegistroRapidoConDoc={abrirRegistroRapidoConDoc}
 tipoComprobante={tipoComprobante}
 setTipoComprobante={setTipoComprobante}
 tarifa={tarifa}
 setTarifa={setTarifa}
 updateCantidad={updateCantidad}
 removeItem={removeItem}
 clearCart={clearCart}
 descuento={descuento}
 setDescuento={setDescuento}
 subtotal={subtotal}
 total={total}
 vuelto={vuelto}
 onAbrirModalCotizacion={() => setModalCotizacionOpen(true)}
 setMostrarModalAtajos={setMostrarModalAtajos}
 // Props para cobro inline
 modoCobroActivo={modoCobroActivo}
 setModoCobroActivo={setModoCobroActivo}
 tipoPago={tipoPago}
 setTipoPago={setTipoPago}
 numeroOperacion={numeroOperacion}
 setNumeroOperacion={setNumeroOperacion}
 montoRecibido={montoRecibido}
 setMontoRecibido={setMontoRecibido}
 creditoDias={creditoDias}
 setCreditoDias={setCreditoDias}
 montoMixtoEfectivo={montoMixtoEfectivo}
 setMontoMixtoEfectivo={setMontoMixtoEfectivo}
 efectivoRecibidoMixto={efectivoRecibidoMixto}
 setEfectivoRecibidoMixto={setEfectivoRecibidoMixto}
 montoMixtoYape={montoMixtoYape}
 setMontoMixtoYape={setMontoMixtoYape}
 montoMixtoPlin={montoMixtoPlin}
 setMontoMixtoPlin={setMontoMixtoPlin}
 montoMixtoTarjeta={montoMixtoTarjeta}
 setMontoMixtoTarjeta={setMontoMixtoTarjeta}
 operacionMixtoYape={operacionMixtoYape}
 setOperacionMixtoYape={setOperacionMixtoYape}
 operacionMixtoPlin={operacionMixtoPlin}
 setOperacionMixtoPlin={setOperacionMixtoPlin}
 operacionMixtoTarjeta={operacionMixtoTarjeta}
 setOperacionMixtoTarjeta={setOperacionMixtoTarjeta}
 procesandoVenta={procesandoVenta}
 onCobrar={handleConfirmarCobro}
 ticketVenta={ticketVenta}
 onVerTicket={() => setModalTicketOpen(true)}
 onNuevaVenta={handleNuevaVenta}
 />
 </div>

 {/* ── MODAL ALTERNATIVO DE COBRO MULTIMÉTODO [F8] ── */}
 <POSModalCobro
 visible={modalCobroOpen}
 onClose={() => setModalCobroOpen(false)}
 onCobrar={handleConfirmarCobro}
 total={total}
 tipoComprobante={tipoComprobante}
 setTipoComprobante={setTipoComprobante}
 tipoPago={tipoPago}
 setTipoPago={setTipoPago}
 numeroOperacion={numeroOperacion}
 setNumeroOperacion={setNumeroOperacion}
 montoRecibido={montoRecibido}
 setMontoRecibido={setMontoRecibido}
 vuelto={vuelto}
 creditoDias={creditoDias}
 setCreditoDias={setCreditoDias}
 procesandoVenta={procesandoVenta}
 clienteNombre={clienteActivoObj?.nombre || 'Público General'}
 />

 {/* ── MODAL DE CARGAR COTIZACIONES [F6] ── */}
 <POSModalCotizacion
 visible={modalCotizacionOpen}
 onClose={() => setModalCotizacionOpen(false)}
 onCargarCotizacion={handleCargarCotizacion}
 />

 {/* ── MODAL REGISTRO RÁPIDO DE CLIENTE [F4] ── */}
 <POSModalClienteRapido
 visible={modalClienteRapidoOpen}
 onClose={() => setModalClienteRapidoOpen(false)}
 tipoDoc={nuevoClienteTipoDoc}
 setTipoDoc={setNuevoClienteTipoDoc}
 numDoc={nuevoClienteNumDoc}
 setNumDoc={setNuevoClienteNumDoc}
 nombre={nuevoClienteNombre}
 setNombre={setNuevoClienteNombre}
 direccion={nuevoClienteDireccion}
 setDireccion={setNuevoClienteDireccion}
 telefono={nuevoClienteTelefono}
 setTelefono={setNuevoClienteTelefono}
 email={nuevoClienteEmail}
 setEmail={setNuevoClienteEmail}
 limiteCredito={nuevoClienteLimiteCredito}
 setLimiteCredito={setNuevoClienteLimiteCredito}
 consultando={consultandoDoc}
 guardando={guardandoCliente}
 onConsultar={handleConsultarDocumento}
 onSubmit={handleGuardarNuevoCliente}
 />

 {/* ── MODAL DE GUÍA DE ATAJOS DE TECLADO [F1] ── */}
 <POSModalAtajos
 visible={mostrarModalAtajos}
 onClose={() => setMostrarModalAtajos(false)}
 />

 {/* ── MODAL IMPRESIÓN DEL COMPROBANTE ── */}
 <TicketImpresion
 isOpen={modalTicketOpen}
 onClose={() => setModalTicketOpen(false)}
 venta={ventaExitosa || ticketVenta}
 onNuevaVenta={handleNuevaVenta}
 />

      {/* ── MODAL APERTURA DE CAJA EN POS (CREATEPORTAL CON COBERTURA 100% TOPBAR Y SIDEBAR) ── */}
      {modalAperturaPOS && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop con blur que cubre el 100% de la ventana completa */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
            onClick={() => setModalAperturaPOS(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
            onClick={() => setModalAperturaPOS(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-sm sm:max-w-md w-full p-0 overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col relative z-10"
            >
              {/* Cabecera */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-slate-50/40 to-transparent dark:from-emerald-950/20 dark:via-slate-800/40 dark:to-transparent">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                    <Unlock className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                      Apertura de Turno de Caja
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Punto de Venta Mostrador (POS)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAperturaPOS(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 touch-manipulation"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleAperturaPOS} className="p-5 space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Para comenzar a emitir comprobantes y registrar cobros en el mostrador, aperture el turno ingresando el fondo fijo o saldo inicial en efectivo.
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Fondo Inicial en Efectivo (S/) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-slate-400 text-lg">
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      value={montoAperturaPOS}
                      onChange={(e) => setMontoAperturaPOS(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner"
                      autoFocus
                    />
                  </div>

                  {/* Presets rápidos */}
                  <div className="grid grid-cols-5 gap-1.5 mt-2.5">
                    {[0, 50, 100, 150, 200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMontoAperturaPOS(val.toFixed(2))}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer text-center ${
                          parseFloat(montoAperturaPOS) === val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setModalAperturaPOS(false);
                      navigate('/caja');
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ir a Caja</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalAperturaPOS(false)}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={aperturandoCajaPOS}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>{aperturandoCajaPOS ? 'Aperturando...' : 'Aperturar Turno'}</span>
                    </button>
                  </div>
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
