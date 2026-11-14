import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
 Building2,
 Plus,
 Check,
 Search,
 MapPin,
 Phone,
 Mail,
 ShieldCheck,
 CheckCircle2,
 X,
 Edit,
 Trash2,
 Boxes,
 FileText,
 BadgePercent,
 ArrowRight,
 Award,
 Warehouse,
 ChevronDown,
 Clock,
 ShoppingBag,
 Truck,
 HardHat,
 Send,
 RefreshCw,
 Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useSucursalStore } from '../store/sucursalStore';
import { useAuthStore } from '../auth/authStore';

const OPCIONES_TIPO_ESTABLECIMIENTO = [
  {
    valor: 'RESTAURANTE_PRINCIPAL',
    etiqueta: 'Restaurante Completo: Salón, Cocina & Bar',
    descripcion: 'Atención presencial a mesas, comandas, KDS cocina y bar',
    etiquetaCorta: 'Restaurante + Bar',
    color: 'emerald'
  },
  {
    valor: 'SALON_ATENCION',
    etiqueta: 'Salón Comercial y Punto de Venta (Mesas / POS)',
    descripcion: 'Atención al público en mesas, cajas registradoras y despacho',
    etiquetaCorta: 'Solo Salón (POS)',
    color: 'amber'
  },
  {
    valor: 'DARK_KITCHEN',
    etiqueta: 'Dark Kitchen / Cocina Oculta (Delivery & Takeout)',
    descripcion: 'Preparación para apps de delivery, pedidos para llevar y despacho rápido',
    etiquetaCorta: 'Cocina Oculta',
    color: 'orange'
  },
  {
    valor: 'BAR_LOUNGE',
    etiqueta: 'Bar & Lounge / Zona de Coctelería',
    descripcion: 'Venta de cócteles, bebidas, piqueos y atención nocturna',
    etiquetaCorta: 'Bar & Lounge',
    color: 'purple'
  },
  {
    valor: 'TERRAZA_EXPRESS',
    etiqueta: 'Terraza Exterior / Módulo Express',
    descripcion: 'Atención al aire libre, comida rápida y pedidos al paso',
    etiquetaCorta: 'Terraza Express',
    color: 'blue'
  }
];

// Componente Selector Desplegable Estilo Píldora
function SelectorDesplegablePildora({
 id,
 label,
 valor,
 opciones,
 onChange,
 required = false,
 desplegableActivo,
 setDesplegableActivo,
 subtituloAyuda = null
}) {
 const estaAbierto = desplegableActivo === id;
 const opcSel = opciones.find(o => String(o.valor ?? '') === String(valor ?? '')) || opciones[0];

 return (
 <div className={`relative dropdown-container-gastro ${estaAbierto ? 'z-40' : 'z-20'}`}>
 {label && (
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 {label} {required && <span className="text-rose-500">*</span>}
 </label>
 )}
 <button
 type="button"
 onClick={() => setDesplegableActivo(estaAbierto ? null : id)}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 estaAbierto
 ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {opcSel ? opcSel.etiqueta : (valor ?? '')}
 </span>
 <ChevronDown
 className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 estaAbierto ? 'rotate-180 text-amber-600' : ''
 }`}
 />
 </button>

 {/* Ventana Desplegable Redondeada (rounded-2xl) */}
 {estaAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 min-w-[260px]">
 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {opciones.map((opc) => {
 const estaSel = String(valor ?? '') === String(opc.valor ?? '');
 return (
 <button
 key={String(opc.valor)}
 type="button"
 onClick={() => {
 onChange(opc.valor);
 setDesplegableActivo(null);
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="truncate pr-2">
 <span className="block truncate">{opc.etiqueta}</span>
 {opc.descripcion && (
 <span className="text-[10px] text-slate-400 font-normal block truncate">
 {opc.descripcion}
 </span>
 )}
 </div>
 {estaSel && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 </div>
 )}
 {subtituloAyuda && (
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">{subtituloAyuda}</span>
 )}
 </div>
 );
}

export default function Sucursales() {
 const { user } = useAuthStore();
 const { sucursales, sucursalActiva, fetchSucursales, setSucursalActiva } = useSucursalStore();

 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState('');
 const [filtroEstado, setFiltroEstado] = useState('TODOS');
 const [desplegableActivo, setDesplegableActivo] = useState(null);

 // Modal Crear / Editar
 const [modalOpen, setModalOpen] = useState(false);
 const [modoEdicion, setModoEdicion] = useState(false);
 const [guardando, setGuardando] = useState(false);
 const [form, setForm] = useState({
 id: null,
 nombre: '',
 codigo_establecimiento: '0001',
 tipo_establecimiento: 'RESTAURANTE_PRINCIPAL',
 permite_venta: true,
 horario_atencion: 'Lun - Dom: 11:30 AM - 11:30 PM',
 direccion: '',
 departamento: 'LIMA',
 provincia: 'LIMA',
 distrito: 'LIMA',
 ubigeo: '150101',
 telefono: '',
 email: '',
 es_principal: false,
 serie_boleta: 'B002',
 serie_factura: 'F002',
 serie_guia: 'T002',
 responsable_sede: '',
 telefono_responsable: ''
 });

 // Modal Ver Inventario
 const [modalStockOpen, setModalStockOpen] = useState(false);
 const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
 const [stockLista, setStockLista] = useState([]);
 const [cargandoStock, setCargandoStock] = useState(false);
 const [busquedaStock, setBusquedaStock] = useState('');

 const cargarDatos = async () => {
 setCargando(true);
 try {
 await fetchSucursales();
 } catch (e) {
 toast.error('Error al cargar lista de sucursales.');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 // Cerrar desplegable con clic fuera o Escape
 useEffect(() => {
 const handleClickOutside = (e) => {
 if (!e.target.closest('.dropdown-container-gastro')) {
 setDesplegableActivo(null);
 }
 };
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 setDesplegableActivo(null);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 document.addEventListener('keydown', handleKeyDown);
 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, []);

 const abrirModalCrear = () => {
 setModoEdicion(false);
 setDesplegableActivo(null);
 const count = sucursales.length;
 const siguienteCodigo = String(count).padStart(4, '0');
 const siguienteNumSerie = count + 1;
 const serieSugerida = `B${String(siguienteNumSerie).padStart(3, '0')}`;
 const serieFactSugerida = `F${String(siguienteNumSerie).padStart(3, '0')}`;
 const serieGuiaSugerida = `T${String(siguienteNumSerie).padStart(3, '0')}`;

 setForm({
 id: null,
 nombre: '',
 codigo_establecimiento: siguienteCodigo,
 tipo_establecimiento: 'RESTAURANTE_PRINCIPAL',
 permite_venta: true,
 horario_atencion: 'Lun - Dom: 11:30 AM - 11:30 PM',
 direccion: '',
 departamento: 'LIMA',
 provincia: 'LIMA',
 distrito: 'LIMA',
 ubigeo: '150101',
 telefono: '',
 email: '',
 es_principal: false,
 serie_boleta: serieSugerida,
 serie_factura: serieFactSugerida,
 serie_guia: serieGuiaSugerida,
 responsable_sede: '',
 telefono_responsable: ''
 });
 setModalOpen(true);
 };

 const abrirModalEditar = (suc) => {
 setModoEdicion(true);
 setDesplegableActivo(null);
 setForm({
 id: suc.id,
 nombre: suc.nombre || '',
 codigo_establecimiento: suc.codigo_establecimiento || '0000',
 tipo_establecimiento: suc.tipo_establecimiento || 'RESTAURANTE_PRINCIPAL',
 permite_venta: suc.permite_venta !== false,
 horario_atencion: suc.horario_atencion || '',
 direccion: suc.direccion || '',
 departamento: suc.departamento || 'LIMA',
 provincia: suc.provincia || 'LIMA',
 distrito: suc.distrito || 'LIMA',
 ubigeo: suc.ubigeo || '150101',
 telefono: suc.telefono || '',
 email: suc.email || '',
 es_principal: Boolean(suc.es_principal),
 serie_boleta: suc.serie_boleta || 'B001',
 serie_factura: suc.serie_factura || 'F001',
 serie_guia: suc.serie_guia || 'T001',
 responsable_sede: suc.responsable_sede || '',
 telefono_responsable: suc.telefono_responsable || ''
 });
 setModalOpen(true);
 };

 const handleGuardar = async (e) => {
 e.preventDefault();
 if (!form.nombre.trim()) {
 toast.error('Ingrese el nombre de la sucursal o almacén.');
 return;
 }

 setGuardando(true);
 try {
 if (modoEdicion) {
 const res = await api.put(`/sucursales/${form.id}`, form);
 toast.success(res.data?.message || 'Sede actualizada con éxito.');
 } else {
 const res = await api.post('/sucursales', form);
 toast.success(res.data?.message || 'Sede registrada con éxito.');
 }
 setModalOpen(false);
 await cargarDatos();
 } catch (err) {
 toast.error(err.response?.data?.message || 'Error al guardar la sucursal.');
 } finally {
 setGuardando(false);
 }
 };

 const handleCambiarEstado = async (suc) => {
 if (suc.es_principal && suc.activo) {
 toast.error('No se puede desactivar la Sede Principal.');
 return;
 }
 try {
 const res = await api.patch(`/sucursales/${suc.id}/estado`);
 toast.success(res.data?.message || 'Estado modificado.');
 await cargarDatos();
 } catch (err) {
 toast.error(err.response?.data?.message || 'Error al cambiar estado.');
 }
 };

 const abrirVerStock = async (suc) => {
 setSucursalSeleccionada(suc);
 setModalStockOpen(true);
 setCargandoStock(true);
 setBusquedaStock('');
 try {
 const res = await api.get(`/sucursales/${suc.id}/stock`);
 const items = res.data?.data?.productos || res.data?.productos || [];
 setStockLista(items);
 } catch (err) {
 toast.error('Error al cargar inventario de la sucursal.');
 } finally {
 setCargandoStock(false);
 }
 };

 const abrirWhatsAppSucursal = (suc) => {
 const telefono = (suc.telefono || suc.telefono_responsable || '').replace(/\D/g, '');
 if (!telefono) {
 toast.error('Esta sucursal no tiene número telefónico registrado.');
 return;
 }
 const numLimpio = telefono.length === 9 ? `51${telefono}` : telefono;
 const msg = `Hola *${suc.nombre}* 👋\nTe contacto desde la plataforma HEIS SAC para coordinar la gestión de la sede.`;
 window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
 };

 const sucursalesFiltradas = sucursales.filter((s) => {
 const matchBusqueda =
 s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
 s.direccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
 s.distrito?.toLowerCase().includes(busqueda.toLowerCase()) ||
 s.codigo_establecimiento?.includes(busqueda);
 const matchEstado =
 filtroEstado === 'TODOS'
 ? true
 : filtroEstado === 'ACTIVAS'
 ? s.activo
 : !s.activo;
 return matchBusqueda && matchEstado;
 });

 const totalSedes = sucursales.length;
 const sedePrincipalObj = sucursales.find((s) => s.es_principal);
 const totalPersonal = sucursales.reduce((acc, s) => acc + (s.total_personal || 0), 0);

 return (
 <div className="space-y-4">
 {/* ─── PÍLDORA DINÁMICA DE SEDES & SUCURSALES ─── */}
 <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2.5 flex-wrap">
 {/* Lado izquierdo: Identificador squircle + Título + Status + Info */}
 <div className="flex items-center gap-2 flex-wrap min-w-0">
 <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs border bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white border-amber-400/20 shadow-amber-500/20">
 <Building2 className="w-3.5 h-3.5" />
 </div>

 <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight ">
 Sedes, Salones & Locales
 </span>

 <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Multi-Sede SUNAT
 </span>

 <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
 • Locales gastronómicos, salones, Dark Kitchens y series SUNAT
 </span>
 </div>

 {/* Lado derecho: Acciones Rápidas */}
 <div className="flex items-center gap-2 shrink-0 flex-wrap">
 <button
 type="button"
 onClick={cargarDatos}
 disabled={cargando}
 title="Refrescar datos"
 className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
 >
 <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-amber-600' : ''}`} />
 </button>

 <button
 type="button"
 onClick={abrirModalCrear}
 className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
 >
 <Plus className="w-4 h-4" />
 <span>Nueva Sede / Salón</span>
 </button>
 </div>
 </div>

 {/* ─── 2. TARJETAS DE RESUMEN EJECUTIVO ─── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
 {/* Locales Registrados */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Locales Registrados
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Store className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 {totalSedes}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Puntos de venta activos</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
 Sedes
 </span>
 </div>
 </div>

 {/* Sede Principal - Almacén Central */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/15 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Restaurante Principal & Matriz
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Warehouse className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
 {sedePrincipalObj?.nombre || 'Sede Principal - Almacén Central'}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Sede Fiscal SUNAT (0000)</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
 ★ Sede Matriz Gastronómica
 </span>
 </div>
 </div>

 {/* Encargados de Sede */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Encargados de Sede
 </span>
 <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <ShieldCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 {sucursales.filter((s) => s.responsable_sede).length}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Responsables designados</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
 Líderes
 </span>
 </div>
 </div>

 {/* Tu Sede en Sesión */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Tu Sede en Sesión
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-base sm:text-lg font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 truncate block">
 {sucursalActiva ? sucursalActiva.nombre : 'Sede Principal'}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Terminal conectado</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
 En Línea
 </span>
 </div>
 </div>
 </div>

 {/* ─── 3. BARRA DE BÚSQUEDA Y FILTROS ─── */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
 <div className="relative w-full sm:w-96">
 <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por sede, dirección, distrito o código..."
 className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
 />
 </div>

 <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
 <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
 {['TODOS', 'ACTIVAS', 'INACTIVAS'].map((f) => (
 <button
 key={f}
 type="button"
 onClick={() => setFiltroEstado(f)}
 className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
 filtroEstado === f
 ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs font-extrabold'
 : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
 }`}
 >
 {f}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* ─── 4. GRILLA DE TARJETAS DE SUCURSALES ─── */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
 {sucursalesFiltradas.map((suc) => {
 const esActivaSesion = sucursalActiva?.id === suc.id;
 const esPrincipal = Boolean(suc.es_principal || suc.nombre?.toLowerCase().includes('principal') || suc.codigo_establecimiento === '0000');

 return (
 <div
 key={suc.id}
 className={`group relative rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden soft-card-shadow card-hover ${
 esPrincipal
 ? esActivaSesion
 ? 'border-amber-500 ring-2 ring-amber-500/40 bg-gradient-to-b from-amber-50/70 via-white to-orange-50/20 dark:from-amber-950/40 dark:via-slate-850 dark:to-slate-850 shadow-xl shadow-amber-500/15'
 : 'bg-gradient-to-b from-amber-50/30 via-white to-amber-50/10 dark:from-slate-850 dark:via-slate-850 dark:to-amber-950/20 border-amber-300/90 dark:border-amber-700/80 hover:border-amber-500 hover:ring-2 hover:ring-amber-500/30 hover:shadow-xl hover:shadow-amber-500/20'
 : esActivaSesion
 ? 'border-amber-500 ring-2 ring-indigo-500/30 bg-gradient-to-b from-indigo-50/60 via-white to-indigo-50/20 dark:from-indigo-950/40 dark:via-slate-850 dark:to-slate-850 shadow-lg shadow-amber-500/10'
 : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-800 hover:border-amber-500 hover:ring-2 hover:ring-indigo-500/25 hover:bg-gradient-to-b hover:from-indigo-50/40 hover:via-indigo-50/15 hover:to-white hover:shadow-xl hover:shadow-indigo-500/15'
 }`}
 >
 {/* Línea o Banner superior distintivo de Sede Principal */}
 {esPrincipal ? (
 <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-[10.5px] tracking-wide uppercase px-4 py-1.5 flex items-center justify-between shadow-xs">
 <span className="flex items-center gap-1.5 ">
 <Warehouse className="w-3.5 h-3.5" />
 ★ Sede Matriz Principal & Almacén Central
 </span>
 <span className="bg-black/25 backdrop-blur-xs px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider">
 SUNAT 0000
 </span>
 </div>
 ) : (
 <div
 className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 ${
 esActivaSesion
 ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 opacity-100 shadow-xs'
 : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 opacity-0 group-hover:opacity-100'
 }`}
 />
 )}

 {/* Luz ambiental en hover */}
 <div
 className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl pointer-events-none transition-all duration-500 ${
 esPrincipal
 ? 'bg-gradient-to-br from-amber-400/20 to-orange-400/30 group-hover:scale-125 group-hover:from-amber-400/35 group-hover:to-orange-400/45'
 : 'bg-gradient-to-br from-indigo-400/10 to-violet-400/20 group-hover:scale-125 group-hover:from-indigo-400/30 group-hover:to-violet-400/40'
 }`}
 />

 {/* Encabezado de la tarjeta */}
 <div className="p-5 border-b border-slate-100 dark:border-slate-800 relative z-10">
 <div className="flex items-start justify-between gap-2 mb-2">
 <div className="flex items-center gap-3">
 <span
 className={`p-3 rounded-2xl transition-all duration-300 border flex items-center justify-center shrink-0 ${
 esPrincipal
 ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white border-amber-300/80 shadow-md shadow-amber-500/25 group-hover:scale-110'
 : esActivaSesion
 ? 'bg-amber-600 text-white border-indigo-700 shadow-md shadow-indigo-600/30'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-md group-hover:shadow-indigo-600/30'
 }`}
 >
 {esPrincipal ? (
 <Warehouse className="w-5 h-5" />
 ) : (
 <Store className="w-5 h-5" />
 )}
 </span>
 <div>
 <div className="flex items-center gap-1.5 flex-wrap">
 <span
 className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
 esPrincipal
 ? 'bg-amber-900 text-amber-100 dark:bg-amber-950 dark:text-amber-200 border border-amber-700/60'
 : 'bg-slate-800 dark:bg-slate-700 text-white group-hover:bg-indigo-950 transition-colors'
 }`}
 >
 SUNAT: {suc.codigo_establecimiento || (esPrincipal ? '0000' : '0001')}
 </span>
 <span
 className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
 esPrincipal
 ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
 : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-indigo-200/70 dark:border-indigo-800/60'
 }`}
 >
 {OPCIONES_TIPO_ESTABLECIMIENTO.find(o => o.valor === suc.tipo_establecimiento)?.etiquetaCorta || (esPrincipal ? 'Tienda + Almacén Central' : 'Tienda + Almacén')}
 </span>
 {suc.permite_venta === false && (
 <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
 Solo Custodia (Sin POS)
 </span>
 )}
 </div>
 <h3
 className={`font-black text-base mt-1 leading-snug transition-colors duration-200 ${
 esPrincipal
 ? 'text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'
 : 'text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300'
 }`}
 >
 {suc.nombre}
 </h3>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
 {esPrincipal
 ? 'Distribución general, almacén de carga pesada y venta mostrador'
 : 'Punto de venta ferretero y despacho local'}
 </p>
 </div>
 </div>

 <span
 className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
 suc.activo
 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
 : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
 }`}
 >
 {suc.activo ? 'Operativo' : 'Inactivo'}
 </span>
 </div>

 {/* Capacidades logísticas ferreteras */}
 <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10.5px]">
 <div
 className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border ${
 esPrincipal
 ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
 : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-750 text-slate-700 dark:text-slate-300'
 }`}
 >
 <Truck className={`w-3.5 h-3.5 shrink-0 ${esPrincipal ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`} />
 <span className="truncate font-semibold">
 {esPrincipal ? 'Carga & Despacho a Obras' : 'Despacho & Reparto Local'}
 </span>
 </div>
 <div
 className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border ${
 esPrincipal
 ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-200/80 dark:border-orange-800/60 text-orange-900 dark:text-orange-200'
 : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/70 dark:border-slate-750 text-slate-700 dark:text-slate-300'
 }`}
 >
 <Boxes className={`w-3.5 h-3.5 shrink-0 ${esPrincipal ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'}`} />
 <span className="truncate font-semibold">
 {esPrincipal ? 'Kardex & Almacén Central' : 'Inventario Mostrador'}
 </span>
 </div>
 </div>

 {/* Ubicación y Contacto */}
 <div className="space-y-1.5 mt-3 text-xs text-slate-600 dark:text-slate-400">
 <div className="flex items-start gap-1.5">
 <MapPin
 className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-all ${
 esPrincipal
 ? 'text-amber-600 dark:text-amber-400 group-hover:scale-110'
 : 'text-slate-400 group-hover:text-amber-600 group-hover:scale-110'
 }`}
 />
 <span className="leading-tight group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
 {suc.direccion || 'Sin dirección registrada'}
 {suc.distrito ? ` — ${suc.distrito}` : ''}
 </span>
 </div>
 {suc.telefono && (
 <div className="flex items-center justify-between text-slate-500">
 <div className="flex items-center gap-1.5">
 <Phone
 className={`w-3.5 h-3.5 shrink-0 transition-colors ${
 esPrincipal ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-amber-600'
 }`}
 />
 <span className="group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors font-mono font-medium">
 {suc.telefono}
 </span>
 </div>
 <button
 type="button"
 onClick={() => abrirWhatsAppSucursal(suc)}
 className="text-[10.5px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
 title="Contactar o coordinar por WhatsApp con esta sede"
 >
 <Send className="w-3 h-3" />
 <span>WhatsApp</span>
 </button>
 </div>
 )}
 {suc.email && (
 <div className="flex items-center gap-1.5 text-slate-500">
 <Mail
 className={`w-3.5 h-3.5 shrink-0 transition-colors ${
 esPrincipal ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-violet-600'
 }`}
 />
 <span className="group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors truncate">
 {suc.email}
 </span>
 </div>
 )}
 {suc.horario_atencion && (
 <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
 <Clock
 className={`w-3.5 h-3.5 shrink-0 transition-colors ${
 esPrincipal ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-amber-600'
 }`}
 />
 <span className="group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors font-medium">
 {suc.horario_atencion}
 </span>
 </div>
 )}
 </div>

 {/* Responsable de Sede (Ferretero / Jefe de Almacén) */}
 <div
 className={`mt-3.5 p-3 rounded-2xl border transition-all duration-300 text-xs ${
 esPrincipal
 ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60 group-hover:bg-amber-100/60 dark:group-hover:bg-amber-900/30'
 : 'bg-slate-50/90 dark:bg-slate-800/80 group-hover:bg-amber-50/80 dark:group-hover:bg-indigo-950/40 border-slate-100 dark:border-slate-800 group-hover:border-indigo-200 dark:group-hover:border-indigo-800'
 }`}
 >
 <div
 className={`text-[10px] font-bold transition-colors uppercase tracking-wide flex items-center gap-1 ${
 esPrincipal
 ? 'text-amber-800 dark:text-amber-300'
 : 'text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-300'
 }`}
 >
 <HardHat
 className={`w-3.5 h-3.5 ${
 esPrincipal ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'
 }`}
 />
 <span>{esPrincipal ? 'Jefe de Restaurante Principal & Matriz' : 'Responsable / Encargado de Sede'}</span>
 </div>
 <div className="font-extrabold text-slate-800 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white mt-0.5 truncate">
 {suc.responsable_sede || 'No asignado'}
 </div>
 {suc.telefono_responsable && (
 <div
 className={`text-[10px] font-mono font-bold mt-0.5 ${
 esPrincipal ? 'text-amber-700 dark:text-amber-400' : 'text-amber-700 dark:text-amber-400'
 }`}
 >
 Tel. Directo: {suc.telefono_responsable}
 </div>
 )}
 </div>

 {/* Series Electrónicas SUNAT */}
 <div
 className={`mt-3 flex items-center justify-between text-[11px] font-mono font-bold border-t border-dotted pt-2.5 transition-colors ${
 esPrincipal
 ? 'border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-300'
 : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-950 dark:group-hover:text-amber-300'
 }`}
 >
 <span>
 Bol: <b className="text-slate-800 dark:text-slate-200">{suc.serie_boleta || 'B001'}</b>
 </span>
 <span>
 Fact: <b className="text-slate-800 dark:text-slate-200">{suc.serie_factura || 'F001'}</b>
 </span>
 <span className="flex items-center gap-1">
 Guía:{' '}
 <b
 className={`px-1.5 py-0.5 rounded ${
 esPrincipal
 ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-black border border-amber-300 dark:border-amber-800'
 : 'text-slate-800 dark:text-slate-200'
 }`}
 >
 {suc.serie_guia || 'T001'}
 </b>
 </span>
 </div>
 </div>

 {/* Botonera de acciones */}
 <div
 className={`p-3 border-t flex items-center justify-between gap-2 transition-colors relative z-10 ${
 esPrincipal
 ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/60'
 : 'bg-slate-50/80 dark:bg-slate-800/60 group-hover:bg-amber-50/30 dark:group-hover:bg-indigo-950/20 border-slate-100 dark:border-slate-800 group-hover:border-indigo-100'
 }`}
 >
 <button
 type="button"
 onClick={() => abrirVerStock(suc)}
 className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
 esPrincipal
 ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-slate-750 text-amber-900 dark:text-amber-200 shadow-2xs'
 : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
 }`}
 title="Consultar catálogo de materiales y existencias de esta sede"
 >
 <Boxes className={`w-3.5 h-3.5 ${esPrincipal ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`} />
 <span>{esPrincipal ? 'Stock Central' : 'Ver Stock'}</span>
 </button>

 <div className="flex items-center gap-1.5">
 {esActivaSesion ? (
 <span
 className={`px-2.5 py-1 rounded-xl font-extrabold text-[10px] ${
 esPrincipal
 ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
 : 'bg-indigo-100 dark:bg-amber-950/60 text-indigo-800 dark:text-amber-300'
 }`}
 >
 En Sesión
 </span>
 ) : (
 <button
 type="button"
 onClick={() => {
 setSucursalActiva(suc);
 toast.success(`Sucursal activa cambiada a: ${suc.nombre}`);
 }}
 className={`px-2.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-xs ${
 esPrincipal
 ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-600/20'
 : 'bg-amber-600 hover:bg-amber-700 text-white'
 }`}
 title="Operar en esta sucursal"
 >
 Activar
 </button>
 )}

 <button
 type="button"
 onClick={() => abrirModalEditar(suc)}
 className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
 title="Editar datos de la sucursal"
 >
 <Edit className="w-4 h-4" />
 </button>

 {!suc.es_principal && (
 <button
 type="button"
 onClick={() => handleCambiarEstado(suc)}
 className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
 suc.activo
 ? 'text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50'
 : 'text-amber-600 hover:bg-indigo-100 dark:hover:bg-indigo-950/50'
 }`}
 title={suc.activo ? 'Desactivar sucursal' : 'Activar sucursal'}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* ─── 5. MODAL REGISTRAR / EDITAR SUCURSAL O ALMACÉN (PORTAL CON CABECERA Y PIE FIJOS) ─── */}
  {modalOpen && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
      {/* Backdrop estático con blur profesional */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={() => setModalOpen(false)}
        aria-hidden="true"
      />

      {/* Contenedor centrado */}
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
        onClick={() => setModalOpen(false)}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl sm:max-w-3xl max-h-[94vh] sm:max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── CABECERA FIJA (SHRINK-0 Z-20) ─── */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-2xl sm:rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2 leading-tight">
                  <span className="truncate">{modoEdicion ? 'Editar Sede / Almacén' : 'Registrar Nueva Sucursal o Almacén'}</span>
                  {modoEdicion && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-indigo-950/50 text-amber-700 dark:text-amber-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                      ID: #{form.id}
                    </span>
                  )}
                </h3>
                <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate sm:whitespace-normal">
                  Establecimiento anexo, dirección de despacho y series oficiales de SUNAT
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation ml-2"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ─── FORMULARIO CON CUERPO SCROLLEABLE Y PIE FIJO ─── */}
          <form onSubmit={handleGuardar} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* CUERPO SCROLLEABLE INDEPENDIENTE */}
            <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">

              {/* ── SECCIÓN 1: IDENTIFICACIÓN DEL ESTABLECIMIENTO & ROL OPERATIVO FERRETERO ── */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                      Identificación Comercial & Rol Operativo Ferretero
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-2 py-0.5 rounded-full shrink-0">
                    Padrón RUC Oficial
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre Comercial de la Sede / Almacén <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej. Sede 2 - Almacén Metalmecánica Ate"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Código Anexo SUNAT <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={form.codigo_establecimiento}
                      onChange={(e) => setForm({ ...form, codigo_establecimiento: e.target.value.replace(/\D/g, '') })}
                      placeholder="0002"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-center tracking-wider transition-all"
                      title="Código de 4 dígitos registrado en ficha RUC SUNAT (ej. 0000 matriz, 0001, 0002...)"
                    />
                  </div>
                </div>

                {/* Píldora Desplegable: Tipo de Establecimiento Ferretero */}
                <div className="pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
                  <SelectorDesplegablePildora
                    id="tipo_establecimiento"
                    label="Tipo de Establecimiento y Rol en Ferretería"
                    required={true}
                    valor={form.tipo_establecimiento}
                    opciones={OPCIONES_TIPO_ESTABLECIMIENTO}
                    onChange={(val) => setForm({ ...form, tipo_establecimiento: val })}
                    desplegableActivo={desplegableActivo}
                    setDesplegableActivo={setDesplegableActivo}
                    subtituloAyuda="Define si este local opera como punto de venta al mostrador, custodia de materiales pesados o mixto."
                  />
                </div>

                {/* Operatividad de Ventas y Horario de Atención */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 pt-1 items-center">
                  {/* Toggle Permite Ventas en Mostrador / POS */}
                  <div
                    onClick={() => setForm({ ...form, permite_venta: !form.permite_venta })}
                    className={`sm:col-span-7 p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer select-none touch-manipulation ${
                      form.permite_venta
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                        : 'bg-slate-100/80 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        form.permite_venta
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                      }`}>
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                          Punto de Venta / Apertura de Cajas
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate sm:whitespace-normal">
                          {form.permite_venta ? 'Habilitado para cobrar y vender en mostrador' : 'Solo custodia, despachos y traslados'}
                        </div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={form.permite_venta}
                      onChange={(e) => setForm({ ...form, permite_venta: e.target.checked })}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Horario de Atención y Despacho */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Horario de Despacho / Atención
                    </label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={form.horario_atencion}
                        onChange={(e) => setForm({ ...form, horario_atencion: e.target.value })}
                        placeholder="Lun - Dom: 11:30 AM - 11:30 PM"
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 2: UBICACIÓN GEOGRÁFICA & LOCAL FÍSICO ── */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                      Ubicación Geográfica y Dirección de Despacho
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    Guías de Remisión & Traslados
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dirección del Local Físico <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={form.direccion}
                      onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                      placeholder="Av. Nicolás Ayllón 2450, Ate"
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={form.departamento}
                      onChange={(e) => setForm({ ...form, departamento: e.target.value.toUpperCase() })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={form.provincia}
                      onChange={(e) => setForm({ ...form, provincia: e.target.value.toUpperCase() })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Distrito
                    </label>
                    <input
                      type="text"
                      value={form.distrito}
                      onChange={(e) => setForm({ ...form, distrito: e.target.value.toUpperCase() })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ubigeo (INEI)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={form.ubigeo}
                      onChange={(e) => setForm({ ...form, ubigeo: e.target.value.replace(/\D/g, '') })}
                      placeholder="150103"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-center tracking-wider"
                      title="Ubigeo INEI de 6 dígitos requerido para Guías de Remisión Electrónicas (GRE SUNAT)"
                    />
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 3: ADMINISTRACIÓN & CANALES DE CONTACTO ── */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                      Administración, Encargado & Contacto
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Responsable / Administrador de Sede
                    </label>
                    <input
                      type="text"
                      value={form.responsable_sede}
                      onChange={(e) => setForm({ ...form, responsable_sede: e.target.value })}
                      placeholder="Ing. Carlos Mendoza Ramos"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Celular del Responsable
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={form.telefono_responsable}
                        onChange={(e) => setForm({ ...form, telefono_responsable: e.target.value })}
                        placeholder="999 888 777"
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono Fijo / Mostrador
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        placeholder="(01) 456-7890 / 987654321"
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico de la Sede
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="almacen.ate@ferreteriaheis.com"
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 4: SERIES DE FACTURACIÓN ELECTRÓNICA SUNAT ── */}
              <div className="bg-amber-50/50 dark:bg-indigo-950/20 p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 dark:border-indigo-800/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                      Series de Facturación SUNAT Exclusivas para esta Sede
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-indigo-100/80 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full shrink-0">
                    Comprobantes Electrónicos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Serie Boleta (B...)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={form.serie_boleta}
                      onChange={(e) => setForm({ ...form, serie_boleta: e.target.value.toUpperCase() })}
                      placeholder="B002"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-amber-700 dark:text-amber-300 uppercase text-center outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Serie Factura (F...)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={form.serie_factura}
                      onChange={(e) => setForm({ ...form, serie_factura: e.target.value.toUpperCase() })}
                      placeholder="F002"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-amber-700 dark:text-amber-300 uppercase text-center outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Serie Guía Remisión (T...)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={form.serie_guia}
                      onChange={(e) => setForm({ ...form, serie_guia: e.target.value.toUpperCase() })}
                      placeholder="T002"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-amber-700 dark:text-amber-300 uppercase text-center outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 tracking-wider"
                    />
                  </div>
                </div>

                <p className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  ℹ️ Cada local emite con series alfanuméricas de 4 caracteres para evitar duplicidad de correlativos en el PSE / OSE SUNAT.
                </p>
              </div>

              {/* ── SECCIÓN 5: CONDICIÓN DE SEDE MATRIZ PRINCIPAL ── */}
              <div
                onClick={() => setForm({ ...form, es_principal: !form.es_principal })}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none touch-manipulation ${
                  form.es_principal
                    ? 'bg-amber-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    form.es_principal
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                      Marcar como Sede Matriz Principal de la Empresa
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate sm:whitespace-normal">
                      Centraliza la razón social principal y el almacén general del negocio
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  id="es_principal"
                  checked={form.es_principal}
                  onChange={(e) => setForm({ ...form, es_principal: e.target.checked })}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </div>
            </div>

            {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0 z-20 backdrop-blur-xs">
              <div className="hidden sm:block text-[11px] text-slate-400 font-medium">
                <span className="text-rose-500 font-bold">*</span> Campos requeridos por SUNAT
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 touch-manipulation"
                >
                  {guardando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{modoEdicion ? 'Guardar Cambios' : 'Registrar Sede'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )}

  {/* ─── 6. MODAL CONSULTA DE STOCK FÍSICO EN SUCURSAL ─── */}
 {modalStockOpen && sucursalSeleccionada && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 {/* Backdrop estático con blur profesional */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
 onClick={() => setModalStockOpen(false)}
 aria-hidden="true"
 />

 {/* Contenedor centrado */}
 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
 onClick={() => setModalStockOpen(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[88vh] text-left relative z-10 animate-in zoom-in-95 duration-200 cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Cabecera Fija */}
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 shrink-0 rounded-t-2xl sm:rounded-t-3xl backdrop-blur-xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                Inventario en {sucursalSeleccionada.nombre}
              </h3>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate sm:whitespace-normal">
                Materiales, herramientas y stock disponible en esta sede
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalStockOpen(false)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation ml-2"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

 {/* Barra de búsqueda de stock */}
 <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
 <div className="relative">
 <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={busquedaStock}
 onChange={(e) => setBusquedaStock(e.target.value)}
 placeholder="Buscar producto, código o material en esta sucursal..."
 className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:bg-white dark:focus:bg-slate-850 focus:border-amber-500"
 />
 </div>
 </div>

 {/* Lista de productos */}
 <div className="p-4 overflow-y-auto flex-1 custom-modal-scroll">
 {cargandoStock ? (
 <div className="py-12 text-center text-slate-400 font-bold text-xs">
 Cargando catálogo y existencias de la sede...
 </div>
 ) : stockLista.length === 0 ? (
 <div className="py-12 text-center text-slate-400 font-bold text-xs">
 No hay productos registrados en el inventario.
 </div>
 ) : (
 <div className="divide-y divide-slate-100 dark:divide-slate-800">
 {stockLista
 .filter((p) => {
 const q = busquedaStock.toLowerCase();
 return (
 p.nombre?.toLowerCase().includes(q) ||
 p.codigo?.toLowerCase().includes(q) ||
 p.codigo_barras?.toLowerCase().includes(q)
 );
 })
 .map((item, idx) => (
 <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
 <div className="min-w-0 flex-1">
 <div className="font-extrabold text-slate-900 dark:text-white truncate">
 {item.nombre}
 </div>
 <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
 <span>Cód: <b className="font-mono">{item.codigo || 'S/C'}</b></span>
 {item.ubicacion && <span>• Ubic: {item.ubicacion}</span>}
 </div>
 </div>

 <div className="text-right shrink-0">
 <div className="text-sm font-black text-slate-900 dark:text-white">
 {parseFloat(item.stock_actual || 0).toFixed(2)}{' '}
 <span className="text-[10px] text-slate-500 font-bold">{item.unidad_medida || 'UND'}</span>
 </div>
 <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
 S/ {parseFloat(item.precio_venta || 0).toFixed(2)}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => setModalStockOpen(false)}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center touch-manipulation"
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
