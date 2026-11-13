import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import {
 ShieldCheck,
 UserCheck,
 UserX,
 UserPlus,
 Plus,
 Edit2,
 Lock,
 Mail,
 Phone,
 KeyRound,
 X,
 CheckCircle2,
 AlertTriangle,
 Building2,
 Users,
 Sparkles,
 ShoppingBag,
 Package,
 HardHat,
 Warehouse,
 Briefcase,
 RefreshCw,
 ChevronDown,
 Check,
 Eye,
 EyeOff,
 Camera,
 User,
 CreditCard,
 Search,
 Percent,
 Truck,
 MapPin,
 Filter,
 FileSpreadsheet,
 Printer,
 ChevronsLeft,
 ChevronsRight,
 ChevronLeft,
 MoreVertical,
 LayoutGrid,
 Table as TableIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useSucursalStore } from '../store/sucursalStore';

// Opciones de tipo de documento para colaboradores
const OPCIONES_TIPO_DOC = [
 { valor: 'DNI', etiqueta: 'DNI (Documento Nacional de Identidad)', descripcion: '8 dígitos - Consulta oficial RENIEC' },
 { valor: 'CARNET_EXTRANJERIA', etiqueta: 'Carnet de Extranjería (CE)', descripcion: 'Extranjeros residentes autorizados' },
 { valor: 'PASAPORTE', etiqueta: 'Pasaporte', descripcion: 'Identificación internacional' }
];

// Opciones de roles con descripciones operativas de ferretería
const OPCIONES_ROLES = [
  { valor: 'Administrador', etiqueta: 'Administrador / Gerente', descripcion: 'Control total del sistema, reportes ejecutivos, configuración y finanzas' },
  { valor: 'Cajero', etiqueta: 'Cajero / POS', descripcion: 'Apertura y arqueo de turnos de caja, cobro de comandas y comprobantes' },
  { valor: 'Mozo', etiqueta: 'Mozo / Atención en Salón', descripcion: 'Atención en mesas, toma de pedidos, comandas y gestión de salón' },
  { valor: 'Cocina', etiqueta: 'Chef / Cocina KDS', descripcion: 'Pantalla de cocina, preparación de platos, recetas y despacho' }
];

// Opciones de estado de la cuenta
const OPCIONES_ESTADO = [
 { valor: true, etiqueta: 'Colaborador Activo', descripcion: 'Habilitado para iniciar sesión y operar activamente en el sistema' },
 { valor: false, etiqueta: 'Inactivo / Suspendido', descripcion: 'Acceso bloqueado temporalmente al sistema' }
];

// Componente de Píldora Desplegable con diseño idéntico al modal de Clientes y Proveedores (Tipo Documento *)
function SelectorDesplegablePildora({
 id,
 label,
 required = false,
 valor,
 opciones = [],
 onChange,
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
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 min-w-[240px]">
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

export default function Usuarios() {
 const { user: currentUser, actualizarUsuarioSesion } = useAuthStore();
 const { sucursales, fetchSucursales } = useSucursalStore();
 const [usuarios, setUsuarios] = useState([]);
 const [loading, setLoading] = useState(true);
 const [filtro, setFiltro] = useState('todos'); // 'todos', 'vendedores', 'cajeros', 'almaceneros', 'activos'
 const [vistaModo, setVistaModo] = useState('tabla'); // 'tabla' (por defecto estilo Gestione) o 'tarjetas'

 // Filtros por columna estilo Gestione (Screenshot 1)
 const [colFiltros, setColFiltros] = useState({
   nombres: '',
   usuario: '',
   sucursal: '',
   celular: '',
   estado: 'todos'
 });

 // Paginación estilo Gestione
 const [paginaActual, setPaginaActual] = useState(1);
 const [itemsPorPagina, setItemsPorPagina] = useState(10);
 const [menuAccionAbierto, setMenuAccionAbierto] = useState(null);

 // Modales
 const [modalFormulario, setModalFormulario] = useState(false);
 const [usuarioEditando, setUsuarioEditando] = useState(null);
 const [guardando, setGuardando] = useState(false);

 // Control de selector desplegable activo en modal (estilo Ingreso de Compra y Clientes)
 const [desplegableActivo, setDesplegableActivo] = useState(null);
 const [mostrarPassword, setMostrarPassword] = useState(false);
 const [consultandoDoc, setConsultandoDoc] = useState(false);

 // Form State
 const [formData, setFormData] = useState({
 nombre: '',
 email: '',
 password: '',
 rol: 'Cajero',
 telefono: '',
 foto_url: '',
 id_sucursal: '',
 tipo_documento: 'DNI',
 numero_documento: '',
 cargo: '',
 limite_descuento: 5.00,
 licencia_conducir: '',
 direccion: '',
 activo: true
 });

 const cargarUsuarios = async () => {
 try {
 setLoading(true);
 const [resUsers] = await Promise.all([
 api.get('/usuarios'),
 fetchSucursales()
 ]);
 const lista = resUsers?.usuarios || resUsers?.data?.usuarios || (Array.isArray(resUsers) ? resUsers : []);
 setUsuarios(lista);
 } catch (err) {
 toast.error('Error al cargar la lista de personal');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 cargarUsuarios();
 }, []);

 // Cerrar desplegable al hacer clic fuera o con Escape
 useEffect(() => {
 const handleClickAfuera = (e) => {
 if (!e.target.closest('.dropdown-container-gastro')) {
 setDesplegableActivo(null);
 }
 };
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 setDesplegableActivo(null);
 }
 };
 document.addEventListener('mousedown', handleClickAfuera);
 document.addEventListener('keydown', handleKeyDown);
 return () => {
 document.removeEventListener('mousedown', handleClickAfuera);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, []);

 // Opciones dinámicas de sucursales con soporte para acceso global
 const listaSucursales = Array.isArray(sucursales) ? sucursales : [];
 const opcionesSucursales = [
 { valor: '', etiqueta: '(Ninguna / Acceso Global)', descripcion: 'Sin sucursal física fija o acceso corporativo global' },
 ...listaSucursales.map((s) => ({
 valor: String(s.id),
 etiqueta: s.nombre,
 descripcion: s.direccion ? `${s.direccion}${s.distrito ? ` - ${s.distrito}` : ''}` : 'Sede operativa registrada'
 }))
 ];

 // Consulta RENIEC oficial para DNI
 const consultarDocumentoReniec = async () => {
 const doc = (formData.numero_documento || '').trim();
 if (formData.tipo_documento !== 'DNI') {
 return toast.error('La consulta automática solo está disponible para DNI.');
 }
 if (doc.length !== 8) {
 return toast.error('El DNI debe tener 8 dígitos numéricos.');
 }

 try {
 setConsultandoDoc(true);
 const res = await api.get(`/consultas/dni/${doc}`);
 if (res && res.success && res.data) {
 const nombreCompleto = res.data.nombre_completo || `${res.data.nombres || ''} ${res.data.apellido_paterno || ''} ${res.data.apellido_materno || ''}`.trim();
 setFormData((prev) => ({
 ...prev,
 nombre: nombreCompleto || prev.nombre
 }));
 toast.success(`Datos obtenidos de RENIEC: ${nombreCompleto}`);
 } else {
 toast.error(res?.message || 'No se encontraron datos en RENIEC para este DNI.');
 }
 } catch (err) {
 toast.error('Error al conectar con el servicio de consulta RENIEC');
 } finally {
 setConsultandoDoc(false);
 }
 };

 const abrirNuevoUsuario = () => {
 setUsuarioEditando(null);
 setDesplegableActivo(null);
 setMostrarPassword(false);
 setFormData({
 nombre: '',
 email: '',
 password: '',
 rol: 'Cajero',
 telefono: '',
 foto_url: '',
 id_sucursal: listaSucursales[0]?.id ? String(listaSucursales[0].id) : '',
 tipo_documento: 'DNI',
 numero_documento: '',
 cargo: '',
 limite_descuento: 5.00,
 licencia_conducir: '',
 direccion: '',
 activo: true
 });
 setModalFormulario(true);
 };

 const abrirEditarUsuario = (u) => {
 setUsuarioEditando(u);
 setDesplegableActivo(null);
 setMostrarPassword(false);
 setFormData({
 nombre: u.nombre || '',
 email: u.email || '',
 password: '', // Vacío para no sobreescribir salvo que escriba una nueva
 rol: u.rol || 'Cajero',
 telefono: u.telefono || '',
 foto_url: u.foto_url || '',
 id_sucursal: u.id_sucursal ? String(u.id_sucursal) : '',
 tipo_documento: u.tipo_documento || 'DNI',
 numero_documento: u.numero_documento || '',
 cargo: u.cargo || '',
 limite_descuento: u.limite_descuento !== undefined ? u.limite_descuento : 5.00,
 licencia_conducir: u.licencia_conducir || '',
 direccion: u.direccion || '',
 activo: u.activo ?? true
 });
 setModalFormulario(true);
 };

 const guardarUsuario = async (e) => {
 e.preventDefault();
 if (!formData.nombre.trim() || !formData.email.trim()) {
 return toast.error('Nombre y correo electrónico son requeridos');
 }

 if (!usuarioEditando && (!formData.password || formData.password.length < 6)) {
 return toast.error('La contraseña inicial debe tener al menos 6 caracteres');
 }

 try {
 setGuardando(true);
 if (usuarioEditando) {
 const res = await api.put(`/usuarios/${usuarioEditando.id}`, formData);
 if (usuarioEditando.id === currentUser?.id) {
 const uActualizado = res?.data?.usuario || res?.usuario || formData;
 if (actualizarUsuarioSesion) actualizarUsuarioSesion(uActualizado);
 }
 toast.success('Usuario actualizado con éxito');
 } else {
 await api.post('/usuarios', formData);
 toast.success('Colaborador registrado exitosamente');
 }
 setModalFormulario(false);
 cargarUsuarios();
 } catch (err) {
 toast.error(err.response?.data?.message || 'Error al guardar usuario');
 } finally {
 setGuardando(false);
 }
 };

 const toggleEstado = async (id, nombre) => {
 if (currentUser?.id === id) {
 return toast.error('No puedes desactivar tu propia cuenta activa');
 }

 try {
 await api.patch(`/usuarios/${id}/toggle-estado`);
 toast.success(`Estado de ${nombre} actualizado`);
 cargarUsuarios();
 } catch (err) {
 toast.error(err.response?.data?.message || 'No se pudo cambiar el estado');
 }
 };

 // Métricas
 const totalPersonal = usuarios.length;
 const totalMozoes = usuarios.filter((u) => u.rol === 'Mozo').length;
 const totalCajeros = usuarios.filter((u) => u.rol === 'Cajero').length;
 const totalCocinas = usuarios.filter((u) => u.rol === 'Cocina').length;
 const activos = usuarios.filter((u) => u.activo).length;

 const usuariosFiltrados = usuarios.filter((u) => {
  if (filtro === 'vendedores') return u.rol === 'Mozo';
  if (filtro === 'cajeros') return u.rol === 'Cajero';
  if (filtro === 'almaceneros') return u.rol === 'Cocina';
  if (filtro === 'activos') return u.activo;

  // Filtros por columna estilo Gestione (Screenshot 1)
  if (colFiltros.nombres && !u.nombre?.toLowerCase().includes(colFiltros.nombres.toLowerCase())) {
    return false;
  }
  if (colFiltros.usuario && !(u.email || u.usuario || '')?.toLowerCase().includes(colFiltros.usuario.toLowerCase())) {
    return false;
  }
  if (colFiltros.sucursal && !(u.sucursal?.nombre || '')?.toLowerCase().includes(colFiltros.sucursal.toLowerCase())) {
    return false;
  }
  if (colFiltros.celular && !(u.telefono || '')?.toLowerCase().includes(colFiltros.celular.toLowerCase())) {
    return false;
  }
  if (colFiltros.estado !== 'todos') {
    const debeEstarActivo = colFiltros.estado === 'activo';
    if (Boolean(u.activo) !== debeEstarActivo) return false;
  }

  return true;
 });

 // Paginación estilo Gestione
 const totalItems = usuariosFiltrados.length;
 const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));
 const inicioIndex = (paginaActual - 1) * itemsPorPagina;
 const finIndex = Math.min(inicioIndex + itemsPorPagina, totalItems);
 const usuariosPaginados = usuariosFiltrados.slice(inicioIndex, finIndex);

 return (
 <div className="space-y-4 max-w-[1700px] w-full mx-auto">
 {/* ─── PÍLDORA DINÁMICA DE EQUIPO Y PERSONAL (Estilo Gestione) ─── */}
 <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2.5 flex-wrap">
 {/* Lado izquierdo: Identificador squircle + Título + Status + Info */}
 <div className="flex items-center gap-2 flex-wrap min-w-0">
 <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white border-amber-400/20 shadow-amber-500/20">
 <Users className="w-4 h-4" />
 </div>

 <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
 Gestión de Usuarios & Seguridad
 </span>

 <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Planilla Activa ({totalItems})
 </span>
 </div>

 {/* Lado derecho: Selector de Vista + Botón Nuevo */}
 <div className="flex items-center gap-2 shrink-0 flex-wrap">
 <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
 <button
 type="button"
 onClick={() => setVistaModo('tabla')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
 vistaModo === 'tabla'
 ? 'bg-blue-600 text-white shadow-xs'
 : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
 }`}
 title="Vista Tabla Empresarial (Estilo Gestione)"
 >
 <TableIcon className="w-3.5 h-3.5" />
 <span>Tabla</span>
 </button>
 <button
 type="button"
 onClick={() => setVistaModo('tarjetas')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
 vistaModo === 'tarjetas'
 ? 'bg-blue-600 text-white shadow-xs'
 : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
 }`}
 title="Vista Tarjetas"
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 <span>Tarjetas</span>
 </button>
 </div>

 <button
 type="button"
 onClick={cargarUsuarios}
 title="Refrescar colaboradores"
 className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
 >
 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
 </button>

 <button
 type="button"
 onClick={abrirNuevoUsuario}
 className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
 >
 <Plus className="w-4 h-4 stroke-[2.5]" />
 <span>Nuevo</span>
 </button>
 </div>
 </div>

 {/* ─── 2. KPI CARDS (DASHBOARD NEO-SAAS) ─── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
 {/* KPI 1: Total Colaboradores */}
 <div 
 onClick={() => setFiltro('todos')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtro === 'todos' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-500'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Total Colaboradores
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Users className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 {totalPersonal}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Plantilla de ferretería</span>
 <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
 filtro === 'todos'
 ? 'bg-amber-600 text-white'
 : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
 }`}>
 {filtro === 'todos' ? 'Activo' : 'Todos'}
 </span>
 </div>
 </div>

 {/* KPI 2: Mozoes de Mostrador */}
 <div 
 onClick={() => setFiltro(prev => prev === 'vendedores' ? 'todos' : 'vendedores')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtro === 'vendedores' ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-200/90 dark:border-slate-800 hover:border-violet-500'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Mozoes Mostrador
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <ShoppingBag className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400">
 {totalMozoes}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">
 {filtro === 'vendedores' ? 'Filtro aplicado' : 'Cotizaciones & Mostrador'}
 </span>
 <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
 filtro === 'vendedores'
 ? 'bg-violet-600 text-white'
 : 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
 }`}>
 Ventas
 </span>
 </div>
 </div>

 {/* KPI 3: Cocinas & Despacho */}
 <div 
 onClick={() => setFiltro(prev => prev === 'almaceneros' ? 'todos' : 'almaceneros')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtro === 'almaceneros' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-500'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Cocinas / Despacho
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Warehouse className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 {totalCocinas}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">
 {filtro === 'almaceneros' ? 'Filtro aplicado' : 'Carga & Despacho'}
 </span>
 <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
 filtro === 'almaceneros'
 ? 'bg-amber-600 text-white'
 : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
 }`}>
 Stock
 </span>
 </div>
 </div>

 {/* KPI 4: Cuentas Activas */}
 <div 
 onClick={() => setFiltro(prev => prev === 'activos' ? 'todos' : 'activos')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtro === 'activos' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Cuentas Activas
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10 flex items-baseline gap-1.5">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
 {activos}
 </span>
 <span className="text-xs font-semibold text-slate-400">/ {totalPersonal}</span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">
 {totalPersonal > 0 ? Math.round((activos / totalPersonal) * 100) : 100}% operativos con acceso
 </span>
 <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
 filtro === 'activos'
 ? 'bg-emerald-600 text-white'
 : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
 }`}>
 Operativos
 </span>
 </div>
 </div>
 </div>

 {/* ─── 3. VISTA PRINCIPAL: TABLA EMPRESARIAL O TARJETAS (Estilo Gestione) ─── */}
 {loading ? (
 <div className="py-16 text-center text-slate-400 font-semibold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-3">
 <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
 <span className="text-xs font-bold text-slate-500">Cargando directorio de usuarios...</span>
 </div>
 ) : usuariosFiltrados.length === 0 ? (
 <div className="py-16 text-center text-slate-400 font-semibold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
 <Users className="w-8 h-8 text-slate-300 mx-auto" />
 <h4 className="text-sm font-black text-slate-700 dark:text-white">No se encontraron usuarios</h4>
 <p className="text-xs text-slate-400">Prueba ajustando los filtros por columna o el estado.</p>
 </div>
 ) : vistaModo === 'tabla' ? (
 /* ═════════ VISTA TABLA EMPRESARIAL (Estilo Gestione Screenshot 1) ═════════ */
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
 <div className="overflow-x-auto custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead>
 {/* FILA 1: Encabezados */}
 <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
 <th className="py-2.5 px-3 w-16 text-center">Nro.</th>
 <th className="py-2.5 px-3 w-28 text-center">Acciones</th>
 <th className="py-2.5 px-4 min-w-[200px]">Nombres y Apellidos</th>
 <th className="py-2.5 px-4 min-w-[170px]">Usuario</th>
 <th className="py-2.5 px-4 min-w-[140px]">Sucursal</th>
 <th className="py-2.5 px-4 min-w-[130px]">Celular</th>
 <th className="py-2.5 px-4 w-28 text-center">Estado</th>
 </tr>

 {/* FILA 2: FILTROS DIRECTOS POR COLUMNA (Estilo Gestione con embudo Y) */}
 <tr className="bg-slate-100/60 dark:bg-slate-850/60 border-b border-slate-200/90 dark:border-slate-700/80">
 <th className="py-1 px-3"></th>
 <th className="py-1 px-3"></th>
 {/* Nombres y Apellidos */}
 <th className="py-1 px-3">
 <div className="relative">
 <input
 type="text"
 value={colFiltros.nombres}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, nombres: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2.5 pr-7 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>

 {/* Usuario */}
 <th className="py-1 px-3">
 <div className="relative">
 <input
 type="text"
 value={colFiltros.usuario}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, usuario: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2.5 pr-7 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>

 {/* Sucursal */}
 <th className="py-1 px-3">
 <div className="relative">
 <input
 type="text"
 value={colFiltros.sucursal}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, sucursal: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2.5 pr-7 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>

 {/* Celular */}
 <th className="py-1 px-3">
 <div className="relative">
 <input
 type="text"
 value={colFiltros.celular}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, celular: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2.5 pr-7 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>

 {/* Estado */}
 <th className="py-1 px-3">
 <div className="relative">
 <select
 value={colFiltros.estado}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, estado: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2 pr-6 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
 >
 <option value="todos">-Todos-</option>
 <option value="activo">Activo</option>
 <option value="inactivo">Inactivo</option>
 </select>
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>
 </tr>
 </thead>

 <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
 {usuariosPaginados.map((u, idx) => {
 const rowNumber = inicioIndex + idx + 1;
 const isMenuOpen = menuAccionAbierto === u.id;

 return (
 <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
 <td className="py-3 px-3 text-center text-slate-500 font-bold font-mono">
 {rowNumber}
 </td>

 {/* Botón de Engranaje Acciones ⚙️ ⌄ (Estilo Gestione) */}
 <td className="py-3 px-3 text-center relative">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setMenuAccionAbierto(isMenuOpen ? null : u.id);
 }}
 className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
 >
 <Settings className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
 <ChevronDown className="w-3 h-3 text-slate-400" />
 </button>

 {/* Menú Desplegable Flotante */}
 {isMenuOpen && (
 <div
 onClick={(e) => e.stopPropagation()}
 className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-1 text-left animate-in fade-in zoom-in-95"
 >
 <button
 type="button"
 onClick={() => {
 setMenuAccionAbierto(null);
 abrirEditarUsuario(u);
 }}
 className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
 >
 <Edit2 className="w-3.5 h-3.5 text-blue-500" />
 <span>Editar usuario</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setMenuAccionAbierto(null);
 toggleEstado(u.id, u.nombre);
 }}
 disabled={currentUser?.id === u.id}
 className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40"
 >
 {u.activo ? (
 <>
 <UserX className="w-3.5 h-3.5 text-rose-500" />
 <span>Desactivar</span>
 </>
 ) : (
 <>
 <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
 <span>Activar</span>
 </>
 )}
 </button>
 </div>
 )}
 </td>

 {/* Nombres y Apellidos */}
 <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
 <div className="flex items-center gap-2.5">
 <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
 {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
 </div>
 <span className="truncate">{u.nombre}</span>
 </div>
 </td>

 {/* Usuario */}
 <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
 {u.email || u.usuario || '—'}
 </td>

 {/* Sucursal (Badge Azul Estilo Gestione) */}
 <td className="py-3 px-4">
 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-600 text-white shadow-2xs">
 {u.sucursal?.nombre || 'Principal'}
 </span>
 </td>

 {/* Celular */}
 <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
 {u.telefono || '—'}
 </td>

 {/* Estado (Badge Verde Activo Estilo Gestione) */}
 <td className="py-3 px-4 text-center">
 <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-black ${
 u.activo
 ? 'bg-emerald-600 text-white shadow-2xs'
 : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
 }`}>
 {u.activo ? 'Activo' : 'Inactivo'}
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* BARRA DE PAGINACIÓN COMPLETA (Estilo Gestione) */}
 <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
 {/* Izquierda: Conteo + Selector filas + Botón Refrescar */}
 <div className="flex items-center gap-3">
 <span className="text-slate-500 dark:text-slate-400 font-semibold">
 {totalItems > 0 ? `${inicioIndex + 1} al ${finIndex} de ${totalItems}` : '0 de 0'}
 </span>
 <div className="flex items-center gap-1.5">
 <select
 value={itemsPorPagina}
 onChange={(e) => {
 setItemsPorPagina(Number(e.target.value));
 setPaginaActual(1);
 }}
 className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
 >
 <option value={5}>5</option>
 <option value={10}>10</option>
 <option value={25}>25</option>
 <option value={50}>50</option>
 </select>
 <button
 type="button"
 onClick={cargarUsuarios}
 className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
 title="Refrescar padrón"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
 </button>
 </div>
 </div>

 {/* Derecha: Botones de Salto de Página |<< << 1 >> >>| */}
 <div className="flex items-center gap-1">
 <button
 type="button"
 disabled={paginaActual <= 1}
 onClick={() => setPaginaActual(1)}
 className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
 title="Primera página"
 >
 <ChevronsLeft className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 disabled={paginaActual <= 1}
 onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
 className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
 title="Página anterior"
 >
 <ChevronLeft className="w-3.5 h-3.5" />
 </button>
 <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">
 {paginaActual}
 </span>
 <button
 type="button"
 disabled={paginaActual >= totalPaginas}
 onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
 className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
 title="Página siguiente"
 >
 <ChevronRight className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 disabled={paginaActual >= totalPaginas}
 onClick={() => setPaginaActual(totalPaginas)}
 className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
 title="Última página"
 >
 <ChevronsRight className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 ) : (
 /* ─── 3. LISTADO DE PERSONAL (CARDS MODERNAS) ─── */
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {loading ? (
 <div className="col-span-full py-12 text-center text-slate-400 font-semibold bg-white dark:bg-slate-850 rounded-3xl border border-slate-100 dark:border-slate-800">
 Cargando personal de ferretería...
 </div>
 ) : usuariosFiltrados.length === 0 ? (
 <div className="col-span-full py-12 text-center text-slate-400 font-semibold bg-white dark:bg-slate-850 rounded-3xl border border-slate-100 dark:border-slate-800">
 No se encontraron colaboradores en la vista seleccionada.
 </div>
 ) : (
 usuariosFiltrados.map((u) => {
 const esAdmin = u.rol === 'Administrador';
 const esMozo = u.rol === 'Mozo';
 const esCocina = u.rol === 'Cocina';
 const esCajero = u.rol === 'Cajero';

 return (
 <div
 key={u.id}
 className={`bg-white dark:bg-slate-850 rounded-3xl p-5 border soft-card-shadow flex flex-col justify-between transition-all relative overflow-hidden ${
 !u.activo ? 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : 'border-slate-100 dark:border-slate-800'
 }`}
 >
 {/* Badge de Rol */}
 <div className="flex items-center justify-between gap-2 mb-3">
 <span
 className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 ${
 esAdmin
 ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
 : esMozo
 ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
 : esCocina
 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
 : 'bg-indigo-100 text-indigo-800 dark:bg-amber-950/60 dark:text-amber-300 border border-indigo-200 dark:border-indigo-800'
 }`}
 >
 {esAdmin ? (
 <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Administrador</span>
 ) : esMozo ? (
 <span className="inline-flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> Mozo</span>
 ) : esCocina ? (
 <span className="inline-flex items-center gap-1"><Warehouse className="w-3.5 h-3.5" /> Cocina</span>
 ) : (
 <span className="inline-flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Cajero</span>
 )}
 </span>

 <span
 className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
 u.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
 }`}
 >
 {u.activo ? 'Activo' : 'Desactivado'}
 </span>
 </div>

 {/* Info Principal */}
 <div className="space-y-2 mb-4">
 <div className="flex items-center gap-3">
 <div
 onClick={() => abrirEditarUsuario(u)}
 className="relative group/avatar cursor-pointer shrink-0"
 title="Clic para cambiar fotografía o configurar perfil del colaborador"
 >
 {u.foto_url ? (
 <img
 src={u.foto_url}
 alt={u.nombre}
 className="w-11 h-11 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 group-hover/avatar:border-amber-500 shadow-xs group-hover/avatar:scale-105 transition-all"
 />
 ) : (
 <div
 className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-xs group-hover/avatar:scale-105 transition-all ${
 esAdmin
 ? 'bg-gradient-to-tr from-purple-700 to-indigo-700'
 : esMozo
 ? 'bg-gradient-to-tr from-violet-600 to-indigo-600'
 : esCocina
 ? 'bg-gradient-to-tr from-amber-600 to-orange-600'
 : 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600'
 }`}
 >
 {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
 </div>
 )}
 <div className="absolute inset-0 bg-black/45 rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white shadow-inner">
 <Camera className="w-4 h-4" />
 </div>
 </div>
 <div className="min-w-0 flex-1">
 <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug truncate">{u.nombre}</h3>
 <div className="flex items-center gap-2 flex-wrap text-[11px] mt-0.5">
 {u.numero_documento && (
 <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
 {u.tipo_documento || 'DNI'}: {u.numero_documento}
 </span>
 )}
 {u.cargo && (
 <span className="font-medium text-slate-500 dark:text-slate-400 truncate">
 • {u.cargo}
 </span>
 )}
 </div>
 {u.sucursal && (
 <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
 <Building2 className="w-3 h-3" />
 <span>{u.sucursal.nombre}</span>
 </div>
 )}
 </div>
 </div>

 <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
 <div className="flex items-center gap-1.5">
 <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
 <span className="truncate">{u.email}</span>
 </div>
 {u.telefono && (
 <div className="flex items-center gap-1.5">
 <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
 <span>{u.telefono}</span>
 </div>
 )}
 {(u.limite_descuento !== undefined || u.licencia_conducir) && (
 <div className="flex items-center gap-2 text-[10.5px] text-slate-400 pt-0.5">
 {u.limite_descuento !== undefined && (
 <span>Desc. Máx: <b className="text-slate-700 dark:text-slate-300">{u.limite_descuento}%</b></span>
 )}
 {u.licencia_conducir && (
 <span>• Brevete: <b className="text-slate-700 dark:text-slate-300">{u.licencia_conducir}</b></span>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Acciones */}
 <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
 <button
 type="button"
 onClick={() => abrirEditarUsuario(u)}
 className="flex-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-indigo-100 dark:bg-amber-950/60 dark:hover:bg-indigo-900/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
 title="Editar perfil, fotografía, rol, datos y contraseña"
 >
 <Edit2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
 <span>Editar / Configurar</span>
 </button>

 <button
 type="button"
 onClick={() => toggleEstado(u.id, u.nombre)}
 disabled={currentUser?.id === u.id}
 title={currentUser?.id === u.id ? 'No puedes desactivar tu cuenta actual' : ''}
 className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
 u.activo
 ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-800'
 : 'text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
 } disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
 >
 {u.activo ? 'Desactivar' : 'Activar'}
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 )}

 {/* ─── MODAL REGISTRAR / EDITAR COLABORADOR (PORTAL CON CABECERA Y PIE FIJOS) ─── */}
 {modalFormulario && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 {/* Backdrop estático e independiente con blur profesional */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
 onClick={() => setModalFormulario(false)}
 aria-hidden="true"
 />

 {/* Contenedor centrado */}
 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
 onClick={() => setModalFormulario(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl sm:max-w-3xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 {/* ─── CABECERA FIJA (SHRINK-0 Z-20) ─── */}
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
 <UserPlus className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white ">
 {usuarioEditando ? 'Editar Colaborador / Personal' : 'Registrar Nuevo Colaborador'}
 </h3>
 {usuarioEditando && (
 <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-mono">
 ID #{usuarioEditando.id}
 </span>
 )}
 </div>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
 Configuración de permisos de rol, acceso a sede física y credenciales de acceso
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalFormulario(false)}
 className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
 title="Cerrar modal"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* ─── FORMULARIO CON CUERPO SCROLLEABLE Y PIE FIJO ─── */}
 <form onSubmit={guardarUsuario} className="flex flex-col flex-1 min-h-0 overflow-hidden">
 {/* CUERPO SCROLLEABLE INDEPENDIENTE */}
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 sm:p-6 space-y-4">

 {/* ── SECCIÓN 1: IDENTIDAD, DOCUMENTO OFICIAL & FOTO ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Identidad Oficial, Documento & Contacto
 </span>
 </div>
 <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full">
 Ficha de Personal
 </span>
 </div>

 {/* Foto con Canvas Uploader & Compressor */}
 <div className="flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
 <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0 shadow-xs">
 {formData.foto_url ? (
 <img src={formData.foto_url} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-lg ">
 {formData.nombre ? formData.nombre.trim().charAt(0).toUpperCase() : 'U'}
 </div>
 )}
 </div>

 <div className="flex-1 min-w-0">
 <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
 Fotografía de Perfil (Opcional)
 </span>
 <span className="text-[10px] text-slate-400 block mb-1.5">
 Visible en comprobantes de venta, turnos de caja y menú de usuario
 </span>
 <div className="flex items-center gap-2">
 <label className="px-3 py-1.5 bg-amber-50 hover:bg-indigo-100 dark:bg-amber-950/60 dark:hover:bg-indigo-900/60 text-amber-600 dark:text-amber-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
 <Camera className="w-3.5 h-3.5" />
 <span>{formData.foto_url ? 'Cambiar Foto' : 'Cargar Foto'}</span>
 <input
 type="file"
 accept="image/png,image/jpeg,image/webp"
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = (ev) => {
 const img = new Image();
 img.onload = () => {
 const maxDim = 400;
 let w = img.width;
 let h = img.height;
 if (w > maxDim || h > maxDim) {
 if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
 else { w = Math.round((w * maxDim) / h); h = maxDim; }
 }
 const canvas = document.createElement('canvas');
 canvas.width = w; canvas.height = h;
 const ctx = canvas.getContext('2d');
 ctx.drawImage(img, 0, 0, w, h);
 setFormData({ ...formData, foto_url: canvas.toDataURL('image/jpeg', 0.88) });
 };
 img.src = ev.target.result;
 };
 reader.readAsDataURL(file);
 }}
 />
 </label>
 {formData.foto_url && (
 <button
 type="button"
 onClick={() => setFormData({ ...formData, foto_url: '' })}
 className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
 >
 Quitar
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Documento Oficial con Consulta RENIEC */}
 <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
 <div className="sm:col-span-6">
 <SelectorDesplegablePildora
 id="tipo_documento"
 label="Tipo de Documento"
 required
 valor={formData.tipo_documento}
 opciones={OPCIONES_TIPO_DOC}
 onChange={(val) => setFormData(prev => ({ ...prev, tipo_documento: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 subtituloAyuda="Documento de identidad oficial del colaborador"
 />
 </div>

 <div className="sm:col-span-6">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 N° de Documento {formData.tipo_documento === 'DNI' ? '(8 dígitos)' : ''} <span className="text-rose-500">*</span>
 </label>
 <div className="flex gap-2">
 <div className="relative flex-1">
 <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 maxLength={formData.tipo_documento === 'DNI' ? 8 : 12}
 value={formData.numero_documento}
 onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value.replace(/\D/g, '') })}
 placeholder={formData.tipo_documento === 'DNI' ? 'Ej. 74829103' : 'N° Documento'}
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
 />
 </div>
 {formData.tipo_documento === 'DNI' && (
 <button
 type="button"
 onClick={consultarDocumentoReniec}
 disabled={consultandoDoc || (formData.numero_documento || '').length !== 8}
 className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
 title="Consultar padrón RENIEC para autocompletar nombres"
 >
 {consultandoDoc ? (
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 ) : (
 <Search className="w-3.5 h-3.5" />
 )}
 <span className="hidden sm:inline">RENIEC</span>
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Nombre Completo */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Nombre Completo del Colaborador <span className="text-rose-500">*</span>
 </label>
 <div className="relative">
 <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 required
 value={formData.nombre}
 onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
 placeholder="Ej. Juan Carlos Pérez Ramos"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
 />
 </div>
 </div>

 {/* Email Login & Teléfono */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Correo Electrónico (Acceso Login) <span className="text-rose-500">*</span>
 </label>
 <div className="relative">
 <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="email"
 required
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="colaborador@ferreteria.com"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Teléfono / WhatsApp de Contacto
 </label>
 <div className="relative">
 <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={formData.telefono}
 onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
 placeholder="Ej. 987 654 321"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
 />
 </div>
 </div>
 </div>

 {/* Dirección Domiciliaria */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Dirección de Domicilio / Residencia
 </label>
 <div className="relative">
 <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={formData.direccion}
 onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
 placeholder="Ej. Av. Los Constructores 450, Ate - Lima"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
 />
 </div>
 </div>
 </div>

 {/* ── SECCIÓN 2: ROL, CARGO OPERATIVO & CONTROL COMERCIAL EN FERRETERÍA ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Rol en Sistema, Cargo Operativo & Control Comercial
 </span>
 </div>
 <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full">
 Seguridad & Políticas
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
 {/* Rol en Sistema */}
 <div>
 <SelectorDesplegablePildora
 id="rol"
 label="Rol en Sistema"
 required
 valor={formData.rol}
 opciones={OPCIONES_ROLES}
 onChange={(val) => setFormData(prev => ({ ...prev, rol: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 subtituloAyuda="Controla los accesos a caja, ventas, inventario o gerencia"
 />
 </div>

 {/* Cargo / Puesto en la Ferretería */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Cargo / Puesto Operativo
 </label>
 <div className="relative">
 <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={formData.cargo}
 onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
 placeholder="Ej. Asesor de Ventas / Conductor"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
 />
 </div>
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">
 Especialidad o función en la tienda/almacén
 </span>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
 {/* Sede / Sucursal Asignada */}
 <div>
 <SelectorDesplegablePildora
 id="id_sucursal"
 label="Sede / Sucursal Asignada"
 valor={formData.id_sucursal ? String(formData.id_sucursal) : ''}
 opciones={opcionesSucursales}
 onChange={(val) => setFormData(prev => ({ ...prev, id_sucursal: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 subtituloAyuda="Sede operativa fija o acceso global corporativo"
 />
 </div>

 {/* Límite de Descuento Autorizado en Mostrador */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Límite Descuento Máx. en Mostrador (%)
 </label>
 <div className="relative">
 <Percent className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="number"
 min="0"
 max="100"
 step="0.5"
 value={formData.limite_descuento}
 onChange={(e) => setFormData({ ...formData, limite_descuento: e.target.value })}
 placeholder="5.00"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
 />
 </div>
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">
 Tope sin requerir clave de autorización
 </span>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
 {/* Licencia de Conducir / Brevete */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Licencia de Conducir / Brevete
 </label>
 <div className="relative">
 <Truck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={formData.licencia_conducir}
 onChange={(e) => setFormData({ ...formData, licencia_conducir: e.target.value.toUpperCase() })}
 placeholder="Ej. Q-74829103"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
 />
 </div>
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">
 Requerido por SUNAT en Guías de Remisión Electrónicas (GRE)
 </span>
 </div>

 {/* Estado de Acceso al Sistema */}
 <div>
 <SelectorDesplegablePildora
 id="activo"
 label="Estado de Acceso al Sistema"
 valor={formData.activo}
 opciones={OPCIONES_ESTADO}
 onChange={(val) => setFormData(prev => ({ ...prev, activo: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 subtituloAyuda="Determina si el usuario tiene permiso activo para autenticarse"
 />
 </div>
 </div>
 </div>

 {/* ── SECCIÓN 3: CREDENCIALES DE ACCESO & SEGURIDAD ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 {usuarioEditando ? 'Actualizar Contraseña de Acceso' : 'Contraseña de Acceso Inicial'}
 </span>
 </div>
 <button
 type="button"
 onClick={() => {
 const palabras = ['Ferre', 'Caja', 'Almacen', 'Turno', 'Obra', 'Herra'];
 const p = palabras[Math.floor(Math.random() * palabras.length)];
 const num = Math.floor(100 + Math.random() * 900);
 setFormData({ ...formData, password: `${p}${num}!` });
 toast.success('Clave generada automáticamente');
 }}
 className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:text-indigo-800 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
 >
 <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
 <span>Generar Clave Segura</span>
 </button>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 {usuarioEditando ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'} {!usuarioEditando && <span className="text-rose-500">*</span>}
 </label>
 <div className="relative">
 <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type={mostrarPassword ? 'text' : 'password'}
 value={formData.password}
 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 placeholder={usuarioEditando ? '•••••••• (dejar vacío para mantener la contraseña actual)' : 'Mínimo 6 caracteres (ej. Ferre345!)'}
 className="w-full pl-8 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
 />
 <button
 type="button"
 onClick={() => setMostrarPassword(!mostrarPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
 title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
 >
 {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 <span className="text-[10px] text-slate-400 mt-1 block">
 {usuarioEditando
 ? 'Solo ingresa texto si necesitas reasignar una nueva contraseña al colaborador.'
 : 'Contraseña con la que el colaborador iniciará sesión por primera vez en el sistema.'}
 </span>
 </div>
 </div>

 </div>

 {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
 <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex items-center justify-between shrink-0 z-20">
 <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
 <span className="text-rose-500 font-bold">*</span> Campos obligatorios para el acceso al sistema
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
 <button
 type="button"
 onClick={() => setModalFormulario(false)}
 className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={guardando}
 className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
 >
 {guardando ? (
 <>
 <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span>Guardando...</span>
 </>
 ) : (
 <>
 <CheckCircle2 className="w-4 h-4" />
 <span>{usuarioEditando ? 'Guardar Cambios' : 'Registrar Colaborador'}</span>
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
