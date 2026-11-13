import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 Truck,
 Plus,
 Search,
 Building2,
 Phone,
 Mail,
 MapPin,
 Edit2,
 Trash2,
 X,
 Check,
 User,
 RefreshCw,
 FileText,
 CreditCard,
 Calendar,
 ChevronDown,
 MessageCircle,
 ShieldCheck,
 Clock,
 DollarSign,
 AlertCircle,
 ArrowUpRight,
 Landmark,
 BadgePercent,
  Sparkles
} from 'lucide-react';

export default function Proveedores() {
 const [proveedores, setProveedores] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState('');
 const [filtroRubro, setFiltroRubro] = useState('TODOS');
 
 // Modales
 const [modalAbierto, setModalAbierto] = useState(false);
 const [proveedorEditar, setProveedorEditar] = useState(null);
 const [guardando, setGuardando] = useState(false);
 const [consultandoSunat, setConsultandoSunat] = useState(false);

 // Dropdown con diseño redondeado para Rubro / Línea Ferretera
 const [desplegableRubroAbierto, setDesplegableRubroAbierto] = useState(false);
 const refSelectorRubro = useRef(null);

 const RUBROS_PROVEEDOR = [
 { valor: 'Ferretería General', etiqueta: 'Ferretería General', descripcion: 'Suministros variados, tornillería y abarrotes' },
 { valor: 'Acero & Metalmecánica', etiqueta: 'Acero & Metalmecánica', descripcion: 'Fierro de construcción, perfiles y alambres' },
 { valor: 'Cementos & Áridos', etiqueta: 'Cementos & Áridos', descripcion: 'Cemento, cal, yeso y agregados a granel' },
 { valor: 'Tuberías & Sanitarios', etiqueta: 'Tuberías & Sanitarios', descripcion: 'PVC, CPVC, conexiones y grifería' },
 { valor: 'Pinturas & Químicos', etiqueta: 'Pinturas & Químicos', descripcion: 'Látex, esmaltes, solventes e impermeabilizantes' },
 { valor: 'Herramientas & Maquinaria', etiqueta: 'Herramientas & Maquinaria', descripcion: 'Herramientas manuales, eléctricas y discos' },
 { valor: 'Eléctricos & Iluminación', etiqueta: 'Eléctricos & Iluminación', descripcion: 'Cables, llaves térmicas y luminarias' }
 ];

 // Cerrar desplegable al hacer clic fuera o con tecla Escape
 useEffect(() => {
 const handleClickAfuera = (e) => {
 if (refSelectorRubro.current && !refSelectorRubro.current.contains(e.target)) {
 setDesplegableRubroAbierto(false);
 }
 };
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 setDesplegableRubroAbierto(false);
 }
 };
 document.addEventListener('mousedown', handleClickAfuera);
 document.addEventListener('keydown', handleKeyDown);
 return () => {
 document.removeEventListener('mousedown', handleClickAfuera);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, []);

 const [formData, setFormData] = useState({
 tipo_documento: 'RUC',
 numero_documento: '',
 razon_social: '',
 categoria_rubro: 'Ferretería General',
 contacto: '',
 telefono: '',
 email: '',
 direccion: '',
 dias_credito: 0,
 limite_credito: 0,
 tiempo_entrega_dias: 1,
 agente_percepcion: false,
 porcentaje_percepcion: 2.00,
 banco: '',
 cuenta_bancaria: '',
 cci: '',
 estado_sunat: 'ACTIVO',
 condicion_sunat: 'HABIDO',
 ubigeo: ''
 });

 const rubrosDisponibles = [
 'TODOS',
 'Acero & Metalmecánica',
 'Cementos & Áridos',
 'Tuberías & Sanitarios',
 'Pinturas & Químicos',
 'Herramientas & Maquinaria',
 'Eléctricos & Iluminación'
 ];

 const cargarProveedores = async () => {
 setCargando(true);
 try {
 let url = '/proveedores';
 if (busqueda.trim()) {
 url += `?busqueda=${encodeURIComponent(busqueda.trim())}`;
 }
 const res = await api.get(url);
 if (res && res.success) {
 setProveedores(res.proveedores || []);
 }
 } catch (e) {
 toast.error('Error al cargar proveedores');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarProveedores();
 }, [busqueda]);

 const abrirNuevo = () => {
 setProveedorEditar(null);
 setFormData({
 tipo_documento: 'RUC',
 numero_documento: '',
 razon_social: '',
 categoria_rubro: 'Ferretería General',
 contacto: '',
 telefono: '',
 email: '',
 direccion: '',
 dias_credito: 0,
 limite_credito: 0,
 tiempo_entrega_dias: 1,
 agente_percepcion: false,
 porcentaje_percepcion: 2.00,
 banco: '',
 cuenta_bancaria: '',
 cci: '',
 estado_sunat: 'ACTIVO',
 condicion_sunat: 'HABIDO',
 ubigeo: ''
 });
 setDesplegableRubroAbierto(false);
 setModalAbierto(true);
 };

 const abrirEditar = (prov) => {
 setProveedorEditar(prov);
 setFormData({
 tipo_documento: prov.tipo_documento || 'RUC',
 numero_documento: prov.numero_documento || '',
 razon_social: prov.razon_social || '',
 categoria_rubro: prov.categoria_rubro || 'Ferretería General',
 contacto: prov.contacto || '',
 telefono: prov.telefono || '',
 email: prov.email || '',
 direccion: prov.direccion || '',
 dias_credito: prov.dias_credito || 0,
 limite_credito: parseFloat(prov.limite_credito || 0),
 tiempo_entrega_dias: prov.tiempo_entrega_dias || 1,
 agente_percepcion: Boolean(prov.agente_percepcion),
 porcentaje_percepcion: parseFloat(prov.porcentaje_percepcion || 2.00),
 banco: prov.banco || '',
 cuenta_bancaria: prov.cuenta_bancaria || '',
 cci: prov.cci || '',
 estado_sunat: prov.estado_sunat || 'ACTIVO',
 condicion_sunat: prov.condicion_sunat || 'HABIDO',
 ubigeo: prov.ubigeo || ''
 });
 setDesplegableRubroAbierto(false);
 setModalAbierto(true);
 };

 // ⚡ Consulta en Vivo a SUNAT (Módulo 11 + APIs Oficiales)
 const consultarSunat = async () => {
 const ruc = (formData.numero_documento || '').trim();
 if (!ruc) {
 return toast.error('Ingrese el número de RUC para consultar a SUNAT');
 }
 if (ruc.length !== 11 || !/^\d+$/.test(ruc)) {
 return toast.error('El RUC debe tener exactamente 11 dígitos numéricos');
 }

 setConsultandoSunat(true);
 try {
 const res = await api.get(`/consultas/ruc/${ruc}`);
 if (res && res.success && res.data) {
 const d = res.data;
 setFormData(prev => ({
 ...prev,
 razon_social: d.razon_social || prev.razon_social,
 direccion: d.direccion || prev.direccion,
 estado_sunat: d.estado || 'ACTIVO',
 condicion_sunat: d.condicion || 'HABIDO',
 ubigeo: d.ubigeo || prev.ubigeo
 }));
 toast.success(`Datos obtenidos de SUNAT: ${d.razon_social}`, { icon: '🇵🇪' });
 } else {
 toast.error(res?.message || 'No se obtuvieron datos de SUNAT');
 }
 } catch (err) {
 toast.error(err.message || 'Error al conectar con el padrón de SUNAT');
 } finally {
 setConsultandoSunat(false);
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!formData.razon_social.trim()) {
 return toast.error('Ingrese la Razón Social o Nombre del Proveedor');
 }
 if (!formData.numero_documento.trim()) {
 return toast.error('Ingrese el RUC o documento del Proveedor');
 }

 setGuardando(true);
 try {
 if (proveedorEditar) {
 await api.put(`/proveedores/${proveedorEditar.id}`, formData);
 toast.success('Proveedor actualizado exitosamente');
 } else {
 await api.post('/proveedores', formData);
 toast.success('Proveedor registrado exitosamente');
 }
 setModalAbierto(false);
 cargarProveedores();
 } catch (err) {
 toast.error(err.message || 'Error al guardar proveedor');
 } finally {
 setGuardando(false);
 }
 };

 const proveedoresFiltrados = proveedores.filter((p) => {
 if (filtroRubro !== 'TODOS' && p.categoria_rubro !== filtroRubro) return false;
 return true;
 });

 // KPIs
 const totalProveedores = proveedores.length;
 const conCredito = proveedores.filter(p => (parseInt(p.dias_credito) || 0) > 0).length;
 const agentesPercepcionCount = proveedores.filter(p => Boolean(p.agente_percepcion)).length;
 const conRuc11 = proveedores.filter(p => p.numero_documento && p.numero_documento.trim().length === 11).length;

 return (
 <div className="space-y-4">
 {/* ─── TARJETAS DE MÉTRICAS KPI (ESTILO DASHBOARD LIMPIO & ELEGANTE) ─── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Distribuidores Activos */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Distribuidores
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <Building2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 {totalProveedores}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Marcas y mayoristas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 En Cartera
 </span>
 </div>
 </div>

 {/* KPI 2: Con Línea de Crédito */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Línea de Crédito
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <CreditCard className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {conCredito}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 15 a 60 días pactados
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 Financiados
 </span>
 </div>
 </div>

 {/* KPI 3: Agentes Percepción SUNAT */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Agentes Percepción
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <BadgePercent className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {agentesPercepcionCount}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 2% Fierro y Cemento
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 Régimen SUNAT
 </span>
 </div>
 </div>

 {/* KPI 4: Proveedores con RUC Verificado */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 RUC Verificados
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <ShieldCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
 {conRuc11}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Con RUC 11 dígitos
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 Fiscales
 </span>
 </div>
 </div>
 </div>

 {/* ─── BARRA DE HERRAMIENTAS, FILTROS Y BÚSQUEDA ─── */}
 <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
 {/* Fila 1: Buscador y Acciones */}
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
 <div className="relative flex-1 max-w-md">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por RUC, razón social, contacto o teléfono..."
 className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-hidden"
 />
 {busqueda && (
 <button
 type="button"
 onClick={() => setBusqueda('')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={cargarProveedores}
 title="Actualizar lista de proveedores"
 className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
 >
 <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-indigo-600' : ''}`} />
 </button>

 <button
 type="button"
 onClick={abrirNuevo}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
 >
 <Plus className="w-4 h-4" />
 <span>Nuevo Proveedor</span>
 </button>
 </div>
 </div>

 {/* Fila 2: Píldoras de Filtro por Rubro Ferretero */}
 <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
 <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
 Rubro:
 </span>
 {rubrosDisponibles.map((r) => {
 const count = r === 'TODOS'
 ? proveedores.length
 : proveedores.filter((p) => p.categoria_rubro === r).length;
 const isSelected = filtroRubro === r;

 return (
 <button
 key={r}
 type="button"
 onClick={() => setFiltroRubro(r)}
 className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
 isSelected
 ? 'bg-slate-900 text-white shadow-subpill-active dark:bg-indigo-600 dark:text-white'
 : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs hover:border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:border-slate-700/60'
 }`}
 >
 <span>{r}</span>
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

 {/* ─── TABLA COMPACTA DE PROVEEDORES ─── */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider ">
 <th className="py-2.5 px-3.5 font-bold">RUC / DOCUMENTO</th>
 <th className="py-2.5 px-3.5 font-bold">RAZÓN SOCIAL / PROVEEDOR</th>
 <th className="py-2.5 px-3.5 font-bold">RUBRO & RÉGIMEN</th>
 <th className="py-2.5 px-3.5 font-bold">CONTACTO & WHATSAPP</th>
 <th className="py-2.5 px-3.5 font-bold">CONDICIONES CRÉDITO</th>
 <th className="py-2.5 px-3.5 font-bold">BANCO & CCI</th>
 <th className="py-2.5 px-3.5 font-bold text-center">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {cargando ? (
 <tr>
 <td colSpan="7" className="py-10 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-2">
 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span className="font-medium text-xs">Cargando directorio de proveedores...</span>
 </div>
 </td>
 </tr>
 ) : proveedoresFiltrados.length === 0 ? (
 <tr>
 <td colSpan="7" className="py-12 text-center text-slate-400">
 <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
 <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">No se encontraron proveedores</p>
 <p className="text-xs text-slate-400 mt-0.5">
 Registra a tus proveedores habituales de cemento, fierro, herramientas y sanitarios
 </p>
 </td>
 </tr>
 ) : (
 proveedoresFiltrados.map((prov) => {
 const tieneWhatsApp = prov.telefono && prov.telefono.replace(/\D/g, '').length >= 9;
 const numeroWhatsApp = tieneWhatsApp ? prov.telefono.replace(/\D/g, '') : null;
 const enlaceWa = numeroWhatsApp 
 ? `https://wa.me/51${numeroWhatsApp.length === 9 ? numeroWhatsApp : numeroWhatsApp.slice(-9)}?text=Hola%20${encodeURIComponent(prov.contacto || prov.razon_social)},%20te%20escribimos%20de%20Ferretería%20para%20coordinar%20un%20pedido.`
 : null;

 return (
 <tr key={prov.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors">
 {/* RUC y Estado SUNAT */}
 <td className="py-2 px-3.5 font-mono">
 <div className="font-bold text-indigo-700 dark:text-indigo-400 text-xs">
 {prov.numero_documento || '---'}
 </div>
 {prov.estado_sunat && (
 <div className="flex items-center gap-1 mt-0.5">
 <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase ${
 prov.estado_sunat === 'ACTIVO'
 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
 : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200'
 }`}>
 {prov.estado_sunat}
 </span>
 {prov.condicion_sunat && (
 <span className="text-[9px] text-slate-400 font-bold">
 • {prov.condicion_sunat}
 </span>
 )}
 </div>
 )}
 </td>

 {/* Razón Social y Dirección */}
 <td className="py-2 px-3.5">
 <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
 {prov.razon_social}
 </div>
 {prov.direccion ? (
 <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[220px] flex items-center gap-1 mt-0.5">
 <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
 <span className="truncate">{prov.direccion}</span>
 </div>
 ) : prov.email ? (
 <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
 {prov.email}
 </div>
 ) : null}
 </td>

 {/* Rubro y Percepción SUNAT */}
 <td className="py-2 px-3.5">
 <div className="flex flex-col gap-1 items-start">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
 {prov.categoria_rubro || 'General'}
 </span>
 {prov.agente_percepcion ? (
 <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 flex items-center gap-1">
 <BadgePercent className="w-3 h-3 text-amber-600 dark:text-amber-400" />
 <span>Percep. {parseFloat(prov.porcentaje_percepcion || 2)}%</span>
 </span>
 ) : null}
 </div>
 </td>

 {/* Contacto & WhatsApp */}
 <td className="py-2 px-3.5 text-slate-600 dark:text-slate-300">
 <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
 {prov.contacto || 'Asesor Comercial'}
 </div>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[10.5px] text-slate-500 font-mono">
 {prov.telefono || 'Sin teléfono'}
 </span>
 {enlaceWa && (
 <a
 href={enlaceWa}
 target="_blank"
 rel="noopener noreferrer"
 className="px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
 title="Chatear por WhatsApp con el asesor"
 >
 <MessageCircle className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600/20" />
 <span>WhatsApp</span>
 </a>
 )}
 </div>
 </td>

 {/* Condiciones Crédito y Despacho */}
 <td className="py-2 px-3.5">
 <div className="flex flex-col gap-0.5">
 {prov.dias_credito > 0 ? (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 inline-block w-fit">
 Crédito: {prov.dias_credito} días
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-block w-fit">
 Contado
 </span>
 )}
 {parseFloat(prov.limite_credito || 0) > 0 && (
 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
 Límite: S/ {parseFloat(prov.limite_credito).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
 </div>
 )}
 {prov.tiempo_entrega_dias > 0 && (
 <div className="text-[9.5px] text-slate-400 flex items-center gap-1 font-medium">
 <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
 <span>Entrega: {prov.tiempo_entrega_dias} {prov.tiempo_entrega_dias === 1 ? 'día' : 'días'}</span>
 </div>
 )}
 </div>
 </td>

 {/* Banco & CCI */}
 <td className="py-2 px-3.5 font-mono text-[11px]">
 {prov.banco ? (
 <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
 <Landmark className="w-3 h-3 text-slate-400 shrink-0" />
 <span>{prov.banco}</span>
 </div>
 ) : (
 <span className="text-slate-400 italic text-[10.5px]">Sin banco reg.</span>
 )}
 {prov.cuenta_bancaria && (
 <div className="text-[10px] text-slate-500">
 Cta: {prov.cuenta_bancaria}
 </div>
 )}
 {prov.cci && (
 <div className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold">
 CCI: {prov.cci}
 </div>
 )}
 </td>

 {/* Acciones */}
 <td className="py-2 px-3.5 text-center">
 <button
 type="button"
 onClick={() => abrirEditar(prov)}
 title="Editar proveedor"
 className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer mx-auto flex items-center justify-center border border-slate-200/80 dark:border-slate-700"
 >
 <Edit2 className="w-3.5 h-3.5" />
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

 {/* ─── MODAL NUEVO / EDITAR PROVEEDOR (ARQUITECTURA DE ENCABEZADO Y PIE FIJOS) ─── */}
 {modalAbierto && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 {/* Backdrop estático e independiente */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
 onClick={() => setModalAbierto(false)}
 aria-hidden="true"
 />

 {/* Contenedor centrado */}
 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
 onClick={() => setModalAbierto(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 {/* ─── CABECERA FIJA (SHRINK-0 Z-20) ─── */}
 <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-white flex items-center justify-center shadow-xs bg-indigo-600 shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {proveedorEditar ? 'Editar Proveedor Ferretero' : 'Registrar Nuevo Proveedor'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Identidad fiscal SUNAT, contacto comercial y cuentas
              </p>
            </div>
          </div>
          <button
 type="button"
 onClick={() => setModalAbierto(false)}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation"
 title="Cerrar modal"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* ─── FORMULARIO CON CUERPO SCROLLEABLE Y PIE FIJO ─── */}
 <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
 {/* CUERPO SCROLLEABLE */}
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
 {/* ── SECCIÓN 1: IDENTIDAD FISCAL Y CONSULTA SUNAT ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Identidad Fiscal & Consulta SUNAT
 </span>
 </div>
 <span className="text-[10px] font-bold text-slate-400">
 Padrón Oficial Perú
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
 {/* RUC con Botón de Consulta SUNAT integrado */}
 <div className="sm:col-span-6">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 RUC / N° Documento <span className="text-rose-500">*</span>
 </label>
 <div className="flex items-center gap-1.5">
 <input
 type="text"
 required
 maxLength={11}
 value={formData.numero_documento}
 onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value.replace(/\D/g, '') })}
 placeholder="Ej: 20608549123"
 className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 <button
 type="button"
 onClick={consultarSunat}
 disabled={consultandoSunat || !formData.numero_documento || formData.numero_documento.length !== 11}
 className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
 title="Consultar Razón Social y Dirección oficial en SUNAT"
 >
 {consultandoSunat ? (
 <>
 <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span className="hidden sm:inline">Buscando...</span>
 </>
 ) : (
 <>
 <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 <span>SUNAT</span>
 </>
 )}
 </button>
 </div>
 </div>

 {/* Estado y Condición SUNAT (Badges informativos) */}
 <div className="sm:col-span-6 flex items-center gap-2 pb-1">
 <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-1 flex items-center justify-between text-xs">
 <span className="text-[10px] text-slate-400 font-bold uppercase">Estado:</span>
 <span className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
 formData.estado_sunat === 'ACTIVO'
 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
 : 'bg-rose-50 text-rose-700'
 }`}>
 {formData.estado_sunat || 'ACTIVO'}
 </span>
 </div>
 <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-1 flex items-center justify-between text-xs">
 <span className="text-[10px] text-slate-400 font-bold uppercase">Condición:</span>
 <span className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
 formData.condicion_sunat === 'HABIDO'
 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
 : 'bg-amber-50 text-amber-700'
 }`}>
 {formData.condicion_sunat || 'HABIDO'}
 </span>
 </div>
 </div>
 </div>

 {/* Razón Social */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Razón Social / Nombre Comercial <span className="text-rose-500">*</span>
 </label>
 <input
 type="text"
 required
 value={formData.razon_social}
 onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
 placeholder="Ej: Corporación Aceros Arequipa S.A., Yura S.A..."
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 {/* Dirección Fiscal */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Dirección Fiscal / Almacén de Despacho
 </label>
 <div className="relative">
 <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={formData.direccion}
 onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
 placeholder="Av. Enrique Meiggs 297, Parque Industrial, Callao"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 </div>
 </div>

 {/* ── SECCIÓN 2: RUBRO FERRETERO & RÉGIMEN DE PERCEPCIÓN SUNAT ── */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
 {/* Selector Desplegable Redondeado de Rubro */}
 <div className={`relative ${desplegableRubroAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorRubro}>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Rubro / Línea Ferretera
 </label>
 <button
 type="button"
 onClick={() => setDesplegableRubroAbierto(!desplegableRubroAbierto)}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableRubroAbierto
 ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {formData.categoria_rubro || 'Ferretería General'}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableRubroAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>

 {desplegableRubroAbierto && (
 <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 left-0 right-0 sm:right-auto sm:min-w-[260px]">
 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {RUBROS_PROVEEDOR.map((r) => {
 const estaSel = formData.categoria_rubro === r.valor;
 return (
 <button
 key={r.valor}
 type="button"
 onClick={() => {
 setFormData({ ...formData, categoria_rubro: r.valor });
 setDesplegableRubroAbierto(false);
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="truncate pr-2">
 <span className="block truncate">{r.etiqueta}</span>
 <span className="text-[10px] text-slate-400 font-normal">{r.descripcion}</span>
 </div>
 {estaSel && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>

 {/* Check / Configuración de Agente de Percepción SUNAT */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.agente_percepcion}
                    onChange={(e) => setFormData({ ...formData, agente_percepcion: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer"
                  />
                  <span>Agente Percepción SUNAT</span>
                </label>
                {formData.agente_percepcion && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 shrink-0">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-snug">
                Habitual en cementeras y distribuidoras de fierro (SUNAT D.L. 1126 / Ley 29173).
              </p>
              {formData.agente_percepcion && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1 shrink-0">
                    <BadgePercent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                      Tasa de Percepción:
                    </span>
                  </div>
                  <div className="relative w-full sm:w-auto min-w-0">
                    <select
                      value={formData.porcentaje_percepcion}
                      onChange={(e) => setFormData({ ...formData, porcentaje_percepcion: parseFloat(e.target.value) || 2.00 })}
                      className="w-full sm:w-auto appearance-none bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl pl-2.5 pr-7 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 outline-hidden cursor-pointer hover:border-amber-400 focus:ring-2 focus:ring-amber-500/20 shadow-xs"
                    >
                      <option value={2.00}>2.0% (Fierro y Cemento)</option>
                      <option value={1.00}>1.0% (Mayoristas Registrados)</option>
                      <option value={0.50}>0.5% (Combustibles / Derivados)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── SECCIÓN 3: CONDICIONES COMERCIALES, CRÉDITO Y LEAD TIME ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center gap-2">
 <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Condiciones Comerciales & Plazos de Entrega
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Días de Crédito
 </label>
 <input
 type="number"
 min="0"
 max="360"
 value={formData.dias_credito}
 onChange={(e) => setFormData({ ...formData, dias_credito: parseInt(e.target.value) || 0 })}
 placeholder="0 = Contado"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">0 = Contado inmediato</span>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Línea de Crédito (S/)
 </label>
 <input
 type="number"
 min="0"
 step="100"
 value={formData.limite_credito}
 onChange={(e) => setFormData({ ...formData, limite_credito: parseFloat(e.target.value) || 0 })}
 placeholder="50000"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">Monto máximo pactado</span>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Lead Time (Días Entrega)
 </label>
 <input
 type="number"
 min="1"
 max="60"
 value={formData.tiempo_entrega_dias}
 onChange={(e) => setFormData({ ...formData, tiempo_entrega_dias: parseInt(e.target.value) || 1 })}
 placeholder="1"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">Días hábiles de despacho</span>
 </div>
 </div>
 </div>

 {/* ── SECCIÓN 4: CONTACTO COMERCIAL & VENTAS ── */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Asesor Comercial / Contacto
 </label>
 <input
 type="text"
 value={formData.contacto}
 onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
 placeholder="Ej: Ing. Carlos Ramos"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Teléfono / Celular WhatsApp
 </label>
 <div className="relative">
 <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={formData.telefono}
 onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
 placeholder="999 123 456"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Correo para Órdenes (PDF)
 </label>
 <div className="relative">
 <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="email"
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="ventas@distribuidor.pe"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 </div>
 </div>

 {/* ── SECCIÓN 5: DATOS BANCARIOS & CCI (TESORERÍA) ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center gap-2">
 <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Datos Bancarios para Transferencias de Tesorería
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Banco
 </label>
 <input
 type="text"
 value={formData.banco}
 onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
 placeholder="BCP, BBVA, Interbank..."
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 N° Cuenta Corriente
 </label>
 <input
 type="text"
 value={formData.cuenta_bancaria}
 onChange={(e) => setFormData({ ...formData, cuenta_bancaria: e.target.value })}
 placeholder="193-1234567-0-99"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Código Interbancario (CCI)
 </label>
 <input
 type="text"
 maxLength={24}
 value={formData.cci}
 onChange={(e) => setFormData({ ...formData, cci: e.target.value })}
 placeholder="002-193-001234567099-12"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 </div>
 </div>
 </div>

 {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
          <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 z-20">
            <div className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium order-2 sm:order-1 text-center sm:text-left">
              <span className="text-rose-500 font-bold">*</span> Campos requeridos para emitir comprobantes
            </div>

            <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
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
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                {guardando ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{proveedorEditar ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
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
 </div>
 );
}
