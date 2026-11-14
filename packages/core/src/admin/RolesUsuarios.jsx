import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import {
 KeyRound,
 ShieldCheck,
 UserCheck,
 UserPlus,
 Plus,
 Lock,
 Eye,
 EyeOff,
 Copy,
 Check,
 RotateCcw,
 Search,
 Building2,
 CreditCard,
 HardHat,
 ShoppingBag,
 Warehouse,
 X,
 Sparkles,
 Users,
 CheckCircle2,
 AlertTriangle,
 LayoutGrid,
 Table as TableIcon,
 Mail,
 Phone,
 ArrowRight,
 ShieldAlert,
 ChevronDown,
 ChevronUp,
 Power,
 User,
 RefreshCw,
 Percent,
 Send,
 Wand2,
 Camera,
 Filter,
 FileSpreadsheet,
 Printer,
 ChevronsLeft,
 ChevronsRight,
 ChevronLeft,
 Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../auth/authStore';

// Opciones de roles con descripciones operativas por vertical de negocio
const OPCIONES_ROLES = [
  // Corporativo
  { valor: 'Administrador', etiqueta: '👑 Administrador / Gerente General', descripcion: 'Control total del sistema, reportes ejecutivos, configuración y finanzas' },

  // Restaurante
  { valor: 'Admin Restaurante', etiqueta: '🍽️ Admin Restaurante', descripcion: 'Gestión de mesas, cartas, reservas, KDS y comandas de restaurante' },
  { valor: 'Mozo', etiqueta: '🍽️ Mozo / Mesero', descripcion: 'Atención en mesas, toma de pedidos, comandas y gestión de salón' },
  { valor: 'Cocinero / Chef', etiqueta: '🍽️ Cocinero / Chef (Cocina KDS)', descripcion: 'Pantalla de cocina KDS, preparación de platos y despacho' },
  { valor: 'Bartender', etiqueta: '🍽️ Bartender / Bar KDS', descripcion: 'Despacho de bebidas y coctelería en KDS' },

  // Ferretería & Retail
  { valor: 'Admin Ferretería', etiqueta: '🔨 Admin Ferretería Retail', descripcion: 'Gestión comercial retail, cotizaciones, compras y almacén' },
  { valor: 'Cajero', etiqueta: '🔨 Cajero / Cobros POS', descripcion: 'Apertura y arqueo de turnos de caja, cobro en POS y comprobantes' },
  { valor: 'Vendedor', etiqueta: '🔨 Vendedor / Asesor Comercial', descripcion: 'Cotizaciones, atención a clientes y ventas de mostrador' },
  { valor: 'Almacenero', etiqueta: '🔨 Almacenero / Kardex', descripcion: 'Entradas, salidas de almacén, inventario físico y compras' },

  // Botica & Farmacia
  { valor: 'Admin Botica', etiqueta: '💊 Admin Botica / Regente', descripcion: 'Dirección técnica farmacéutica, DIGEMID y stock' },
  { valor: 'Farmacéutico', etiqueta: '💊 Farmacéutico Dispensador', descripcion: 'Dispensación mostrador, recetas, lotes y vencimientos FEFO' },

  // Hospedaje & Hotel
  { valor: 'Admin Hospedaje', etiqueta: '🏨 Admin Hotel / PMS', descripcion: 'Administración de habitaciones, tarifas, huéspedes y reservas' },
  { valor: 'Recepcionista Hotel', etiqueta: '🏨 Recepcionista Hotel', descripcion: 'Rack de habitaciones, Check-In, Check-Out y Room Service' },
  { valor: 'Limpieza Hotel', etiqueta: '🏨 Limpieza / Housekeeping', descripcion: 'Estado de habitaciones (limpia, sucia, mantenimiento)' },
];

// Componente de Píldora Desplegable con diseño idéntico al modal de Clientes, Proveedores y Usuarios (Tipo Documento *)
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

export default function RolesUsuarios() {
 const { user: currentUser } = useAuthStore();
 const [usuarios, setUsuarios] = useState([]);
 const [sucursales, setSucursales] = useState([]);
 const [loading, setLoading] = useState(true);

 // Modo de visualización: 'tabla' o 'tarjetas'
 const [vistaModo, setVistaModo] = useState('tabla');
 const [mostrarResumenRoles, setMostrarResumenRoles] = useState(false);

 // Filtros
 const [busqueda, setBusqueda] = useState('');
 const [filtroRol, setFiltroRol] = useState('todos');

 // Filtros por columna estilo Gestione (Screenshot 2)
 const [colFiltros, setColFiltros] = useState({
  nombre: '',
  rol: '',
  sede: '',
  estado: 'todos'
 });
 const [paginaActual, setPaginaActual] = useState(1);
 const [itemsPorPagina, setItemsPorPagina] = useState(10);
 const [menuAccionAbierto, setMenuAccionAbierto] = useState(null);

 const handleExportarExcel = () => {
  const csvHeader = "Nro,Nombres,Rol,Sede,Estado\n";
  const csvRows = usuariosFiltrados.map((u, i) =>
   `"${i + 1}","${u.nombre}","${u.rol}","${u.sucursal?.nombre || 'Todas las Sedes'}","${u.activo ? 1 : 0}"`
  ).join("\n");
  const blob = new Blob(["\uFEFF" + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `roles_cargos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('Padrón exportado a Excel/CSV exitosamente');
 };

 // Modales
 const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
 const [modalRolOpen, setModalRolOpen] = useState(false);
 const [modalCrearOpen, setModalCrearOpen] = useState(false);
 const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

 // Estado para cambio de contraseña
 const [nuevaPassword, setNuevaPassword] = useState('');
 const [mostrarPassword, setMostrarPassword] = useState(false);
 const [copiado, setCopiado] = useState(false);
 const [guardandoPassword, setGuardandoPassword] = useState(false);

 // Estado para cambio de rol
 const [rolForm, setRolForm] = useState({
 rol: 'Cajero',
 id_sucursal: ''
 });
 const [guardandoRol, setGuardandoRol] = useState(false);

 // Estado para creación rápida
 const [nuevoUsuario, setNuevoUsuario] = useState({
 nombre: '',
 email: '',
 password: '',
 rol: 'Cajero',
 telefono: '',
 foto_url: '',
 id_sucursal: '',
 numero_documento: '',
 tipo_documento: 'DNI',
 limite_descuento: 5.00
 });
 const [consultandoDni, setConsultandoDni] = useState(false);
 const [creandoUsuario, setCreandoUsuario] = useState(false);
 const [desplegableActivo, setDesplegableActivo] = useState(null);
 const [mostrarPasswordCrear, setMostrarPasswordCrear] = useState(false);
 const [copiadoCrear, setCopiadoCrear] = useState(false);

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
 { valor: '', etiqueta: 'Todas las Sedes / Acceso Global', descripcion: 'Sin sucursal física fija o acceso corporativo multisede' },
 ...listaSucursales.map((s) => ({
 valor: String(s.id),
 etiqueta: `${s.nombre} ${s.es_principal ? '(Principal)' : ''}`.trim(),
 descripcion: s.direccion ? `${s.direccion}${s.distrito ? ` - ${s.distrito}` : ''}` : 'Sede operativa registrada'
 }))
 ];

 const cargarDatos = async () => {
 try {
 setLoading(true);
 const [resUsers, resSuc] = await Promise.all([
 api.get('/usuarios').catch((err) => ({
 error: true,
 message: err?.message || 'Error al consultar usuarios'
 })),
 api.get('/sucursales').catch(() => ({ data: [] }))
 ]);

 if (resUsers?.error) {
 toast.error(resUsers.message || 'Error al sincronizar lista de usuarios y roles');
 } else {
 const listaUsers = resUsers?.usuarios || resUsers?.data?.usuarios || (Array.isArray(resUsers) ? resUsers : []);
 setUsuarios(listaUsers);
 }

 const listaSuc = resSuc?.data || resSuc?.sucursales || resSuc?.data?.data || (Array.isArray(resSuc) ? resSuc : []);
 if (Array.isArray(listaSuc)) {
 setSucursales(listaSuc);
 }
 } catch (err) {
 console.error('Error general en cargarDatos:', err);
 toast.error('Error al sincronizar lista de usuarios y roles');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 const generarPasswordSegura = () => {
 const palabras = ['Ferre', 'Caja', 'Almacen', 'Turno', 'POS', 'Obra'];
 const palabra = palabras[Math.floor(Math.random() * palabras.length)];
 const num = Math.floor(100 + Math.random() * 900);
 const simbolos = ['#', '$', '!', '@'];
 const simbolo = simbolos[Math.floor(Math.random() * simbolos.length)];
 return `${palabra}${num}${simbolo}`;
 };

 const handleAbrirModalPassword = (u) => {
 setUsuarioSeleccionado(u);
 setNuevaPassword('');
 setMostrarPassword(true);
 setCopiado(false);
 setModalPasswordOpen(true);
 };

 const handleCopiarPassword = () => {
 if (!nuevaPassword) return;
 navigator.clipboard.writeText(nuevaPassword);
 setCopiado(true);
 toast.success('Contraseña copiada al portapapeles');
 setTimeout(() => setCopiado(false), 2500);
 };

 const compartirPasswordPorWhatsApp = () => {
 if (!usuarioSeleccionado) return;
 const nombreColab = usuarioSeleccionado.nombre || 'Colaborador';
 const emailLogin = usuarioSeleccionado.email || '(Sin correo)';
 const clave = nuevaPassword || '(Pendiente)';
 const rolNombre = usuarioSeleccionado.rol || 'Colaborador';
 const sucursalSel =
 usuarioSeleccionado.sucursal?.nombre ||
 opcionesSucursales.find((s) => String(s.valor) === String(usuarioSeleccionado.id_sucursal))?.etiqueta ||
 'Todas las Sedes / Acceso Global';

 const mensaje = `Hola *${nombreColab}* 👋\nSe ha actualizado tu contraseña de acceso en el *Sistema Ferretero*:\n\n👤 *Usuario/Login:* ${emailLogin}\n🔑 *Nueva Contraseña:* ${clave}\n🛡️ *Rol:* ${rolNombre}\n🏬 *Sede Operativa:* ${sucursalSel}\n\nPor favor inicia sesión con tu nueva clave en el sistema y resérvala con discreción. ¡Muchos éxitos en tu jornada! 🛠️`;

 const numLimpio = (usuarioSeleccionado.telefono || '').replace(/\D/g, '');
 if (numLimpio.length >= 9) {
 const fullNumero = numLimpio.length === 9 ? `51${numLimpio}` : numLimpio;
 const url = `https://wa.me/${fullNumero}?text=${encodeURIComponent(mensaje)}`;
 window.open(url, '_blank', 'noopener,noreferrer');
 toast.success('Abriendo chat de WhatsApp con el colaborador...');
 } else {
 navigator.clipboard.writeText(mensaje);
 toast.success('Ficha de credenciales copiada al portapapeles para WhatsApp');
 }
 };

 const handleGuardarPassword = async (e) => {
 e.preventDefault();
 if (!nuevaPassword || nuevaPassword.trim().length < 6) {
 return toast.error('La contraseña debe tener al menos 6 caracteres');
 }

 try {
 setGuardandoPassword(true);
 await api.put(`/usuarios/${usuarioSeleccionado.id}`, {
 password: nuevaPassword.trim()
 });
 toast.success(`Contraseña de ${usuarioSeleccionado.nombre} actualizada correctamente`);
 setModalPasswordOpen(false);
 cargarDatos();
 } catch (err) {
 toast.error(err.response?.data?.message || 'Error al actualizar contraseña');
 } finally {
 setGuardandoPassword(false);
 }
 };

 const handleAbrirModalRol = (u) => {
 setUsuarioSeleccionado(u);
 setRolForm({
 rol: u.rol || 'Cajero',
 id_sucursal: u.id_sucursal || ''
 });
 setModalRolOpen(true);
 };

 const handleGuardarRol = async (e) => {
 e.preventDefault();
 try {
 setGuardandoRol(true);
 await api.put(`/usuarios/${usuarioSeleccionado.id}`, {
 rol: rolForm.rol,
 id_sucursal: rolForm.id_sucursal || null
 });
 toast.success(`Rol de ${usuarioSeleccionado.nombre} actualizado a ${rolForm.rol}`);
 setModalRolOpen(false);
 cargarDatos();
 } catch (err) {
 toast.error(err.response?.data?.message || 'Error al actualizar rol');
 } finally {
 setGuardandoRol(false);
 }
 };

 const handleToggleEstado = async (u) => {
 if (currentUser?.id === u.id) {
 return toast.error('No puedes desactivar tu propia cuenta activa');
 }

 try {
 await api.patch(`/usuarios/${u.id}/toggle-estado`);
 toast.success(`Estado de ${u.nombre} actualizado`);
 cargarDatos();
 } catch (err) {
 toast.error(err.response?.data?.message || 'No se pudo cambiar el estado');
 }
 };

 const consultarDniReniec = async () => {
 const doc = (nuevoUsuario.numero_documento || '').trim();
 if (doc.length !== 8) {
 return toast.error('El DNI debe tener 8 dígitos numéricos.');
 }

 try {
 setConsultandoDni(true);
 const res = await api.get(`/consultas/dni/${doc}`);
 if (res && res.success && res.data) {
 const nombreCompleto = res.data.nombre_completo || `${res.data.nombres || ''} ${res.data.apellido_paterno || ''} ${res.data.apellido_materno || ''}`.trim();
 setNuevoUsuario((prev) => {
 const nuevo = {
 ...prev,
 nombre: nombreCompleto || prev.nombre
 };
 if (!prev.email) {
 const partes = (nombreCompleto || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
 if (partes.length >= 2) {
 nuevo.email = `${partes[0]}.${partes[1]}@ferreteria.com`;
 } else {
 nuevo.email = `${doc}@ferreteria.com`;
 }
 }
 return nuevo;
 });
 toast.success(`Datos obtenidos de RENIEC: ${nombreCompleto}`);
 } else {
 toast.error(res?.message || 'No se encontraron datos en RENIEC para este DNI.');
 }
 } catch (err) {
 toast.error('Error al conectar con el servicio de consulta RENIEC');
 } finally {
 setConsultandoDni(false);
 }
 };

 const sugerirCorreoLogin = () => {
 if (nuevoUsuario.numero_documento && nuevoUsuario.numero_documento.trim().length === 8) {
 const emailDni = `${nuevoUsuario.numero_documento.trim()}@ferreteria.local`;
 setNuevoUsuario(prev => ({ ...prev, email: emailDni }));
 toast.success(`Correo generado con DNI: ${emailDni}`);
 return;
 }
 if (nuevoUsuario.nombre && nuevoUsuario.nombre.trim()) {
 const partes = nuevoUsuario.nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
 if (partes.length >= 2) {
 const sugerido = `${partes[0]}.${partes[1]}@ferreteria.com`;
 setNuevoUsuario(prev => ({ ...prev, email: sugerido }));
 toast.success(`Correo sugerido: ${sugerido}`);
 } else if (partes.length === 1) {
 const sugerido = `${partes[0]}@ferreteria.com`;
 setNuevoUsuario(prev => ({ ...prev, email: sugerido }));
 toast.success(`Correo sugerido: ${sugerido}`);
 }
 } else {
 toast.error('Ingresa o consulta primero el DNI o Nombre del colaborador.');
 }
 };

 const compartirPorWhatsApp = () => {
 const nombreColab = nuevoUsuario.nombre || 'Colaborador';
 const emailLogin = nuevoUsuario.email || '(Pendiente)';
 const clave = nuevoUsuario.password || '(Pendiente)';
 const rolNombre = nuevoUsuario.rol || 'Colaborador';
 const sucursalSel = opcionesSucursales.find(s => String(s.valor) === String(nuevoUsuario.id_sucursal))?.etiqueta || 'Todas las Sedes / Acceso Global';

 const mensaje = `Hola *${nombreColab}* 👋\nBienvenido al equipo. Se ha configurado tu acceso al *Sistema Ferretero*:\n\n👤 *Usuario/Login:* ${emailLogin}\n🔑 *Contraseña Inicial:* ${clave}\n🛡️ *Rol Asignado:* ${rolNombre}\n🏬 *Sede Operativa:* ${sucursalSel}\n\nPor favor inicia sesión en el sistema y cambia tu contraseña. ¡Muchos éxitos en la jornada! 🛠️`;

 const numLimpio = (nuevoUsuario.telefono || '').replace(/\D/g, '');
 if (numLimpio.length >= 9) {
 const fullNumero = numLimpio.length === 9 ? `51${numLimpio}` : numLimpio;
 const url = `https://wa.me/${fullNumero}?text=${encodeURIComponent(mensaje)}`;
 window.open(url, '_blank', 'noopener,noreferrer');
 toast.success('Abriendo chat de WhatsApp...');
 } else {
 navigator.clipboard.writeText(mensaje);
 toast.success('Ficha copiada al portapapeles para enviar por WhatsApp');
 }
 };

 const handleCrearUsuario = async (e) => {
 e.preventDefault();
 if (!nuevoUsuario.nombre.trim() || !nuevoUsuario.email.trim()) {
 return toast.error('Nombre y correo electrónico son requeridos');
 }
 if (!nuevoUsuario.password || nuevoUsuario.password.length < 6) {
 return toast.error('La contraseña inicial debe tener al menos 6 caracteres');
 }

 try {
 setCreandoUsuario(true);
 await api.post('/usuarios', {
 ...nuevoUsuario,
 numero_documento: nuevoUsuario.numero_documento ? nuevoUsuario.numero_documento.trim() : null,
 tipo_documento: nuevoUsuario.tipo_documento || 'DNI',
 limite_descuento: nuevoUsuario.limite_descuento !== undefined && nuevoUsuario.limite_descuento !== '' ? parseFloat(nuevoUsuario.limite_descuento) : 5.00
 });
 toast.success(`Colaborador ${nuevoUsuario.nombre} creado con rol ${nuevoUsuario.rol}`);
 setModalCrearOpen(false);
 setNuevoUsuario({
 nombre: '',
 email: '',
 password: '',
 rol: 'Cajero',
 telefono: '',
 foto_url: '',
 id_sucursal: '',
 numero_documento: '',
 tipo_documento: 'DNI',
 limite_descuento: 5.00
 });
 cargarDatos();
 } catch (err) {
 toast.error(err.response?.data?.message || 'Error al registrar colaborador');
 } finally {
 setCreandoUsuario(false);
 }
 };

 // Contadores por Rol
 const cajerosAsignados = usuarios.filter((u) => u.rol === 'Cajero');
 const vendedoresAsignados = usuarios.filter((u) => u.rol === 'Mozo');
 const almacenerosAsignados = usuarios.filter((u) => u.rol === 'Cocina');
 const adminAsignados = usuarios.filter((u) => u.rol === 'Administrador');

 // Filtrado de usuarios
 const usuariosFiltrados = usuarios.filter((u) => {
 const coincideRol =
 filtroRol === 'todos' ||
 (filtroRol === 'cajeros' && u.rol === 'Cajero') ||
 (filtroRol === 'vendedores' && u.rol === 'Mozo') ||
 (filtroRol === 'almaceneros' && u.rol === 'Cocina') ||
 (filtroRol === 'admin' && u.rol === 'Administrador');

 const coincideBusqueda =
 !busqueda.trim() ||
 u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
 u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
 u.rol?.toLowerCase().includes(busqueda.toLowerCase());

 if (!coincideRol || !coincideBusqueda) return false;

 // Filtros por columna estilo Gestione (Screenshot 2)
 if (colFiltros.nombre && !u.nombre?.toLowerCase().includes(colFiltros.nombre.toLowerCase())) {
   return false;
 }
 if (colFiltros.rol && !u.rol?.toLowerCase().includes(colFiltros.rol.toLowerCase())) {
   return false;
 }
 if (colFiltros.sede && !(u.sucursal?.nombre || '')?.toLowerCase().includes(colFiltros.sede.toLowerCase())) {
   return false;
 }
 if (colFiltros.estado !== 'todos') {
   const debeActivo = colFiltros.estado === 'activo' || colFiltros.estado === '1';
   if (Boolean(u.activo) !== debeActivo) return false;
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
 <div className="space-y-4">
 {/* ─── PÍLDORA DINÁMICA DE ROLES Y CONTRASEÑAS ─── */}
 <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2.5 flex-wrap">
 {/* Lado izquierdo: Identificador squircle + Título + Status + Info */}
 <div className="flex items-center gap-2 flex-wrap min-w-0">
 <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs border bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white border-amber-400/20 shadow-amber-500/20">
 <KeyRound className="w-3.5 h-3.5" />
 </div>

 <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight ">
 Asignación de Roles y Contraseñas
 </span>

 <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Control de Accesos
 </span>

 <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
 • Credenciales cifradas, permisos por perfil y cambio seguro de claves
 </span>
 </div>

 {/* Lado derecho: Acciones Rápidas (Estilo Gestione: + Nuevo y Excel) */}
 <div className="flex items-center gap-2 shrink-0 flex-wrap">
 <button
 type="button"
 onClick={cargarDatos}
 title="Refrescar lista"
 className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
 >
 <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
 </button>

 <button
 type="button"
 onClick={handleExportarExcel}
 className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
 title="Exportar roles a Excel"
 >
 <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
 <span>Excel</span>
 </button>

 <button
 type="button"
 onClick={() => {
 setDesplegableActivo(null);
 setMostrarPasswordCrear(false);
 setCopiadoCrear(false);
 setNuevoUsuario({
 nombre: '',
 email: '',
 password: generarPasswordSegura(),
 rol: 'Cajero',
 telefono: '',
 foto_url: '',
 id_sucursal: listaSucursales[0]?.id ? String(listaSucursales[0].id) : '',
 numero_documento: '',
 tipo_documento: 'DNI',
 limite_descuento: 5.00
 });
 setModalCrearOpen(true);
 }}
 className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
 >
 <Plus className="w-4 h-4 stroke-[2.5]" />
 <span>Nuevo</span>
 </button>
 </div>
 </div>

 {/* ─── TARJETA MAESTRA DE CREDENCIALES DEMO DE ROLES Y CONTRASEÑAS ─── */}
 <div className="bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-indigo-950/40 p-4 rounded-2xl border-2 border-indigo-200/90 dark:border-amber-800/80 shadow-xs">
   <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
     <div className="flex items-center gap-2">
       <span className="p-1.5 rounded-lg bg-amber-600 text-white shadow-xs">
         <KeyRound className="w-4 h-4" />
       </span>
       <div>
         <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
           Credenciales Demo del Sistema (Roles & Contraseñas Oficiales)
         </h3>
         <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
           Credenciales activas para pruebas y acceso por rol en terminales POS y administración.
         </p>
       </div>
     </div>
     <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-amber-700 dark:bg-indigo-950 dark:text-amber-300 border border-indigo-200">
       DEMO ACTIVO
     </span>
   </div>

   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
     {/* Card Admin */}
     <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
       <div className="flex items-center justify-between mb-1.5">
         <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">👑 Administrador</span>
         <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded font-bold">Activo</span>
       </div>
       <div className="space-y-1 text-[11px] font-mono">
         <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
           <span>Usuario:</span>
           <strong className="text-amber-600 dark:text-amber-400 font-black">xirio</strong>
         </div>
         <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
           <span>Contraseña:</span>
           <strong className="text-amber-600 dark:text-amber-400 font-black">10xirio10</strong>
         </div>
       </div>
       <button
         type="button"
         onClick={() => { navigator.clipboard.writeText('10xirio10'); toast.success('Clave 10xirio10 copiada'); }}
         className="w-full mt-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors cursor-pointer"
       >
         Copiar Clave (10xirio10)
       </button>
     </div>

     {/* Card Cajero */}
     <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
       <div className="flex items-center justify-between mb-1.5">
         <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">💵 Cajero / POS</span>
         <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded font-bold">Activo</span>
       </div>
       <div className="space-y-1 text-[11px] font-mono">
         <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
           <span>Usuario:</span>
           <strong className="text-amber-600 dark:text-amber-400 font-black">cajero</strong>
         </div>
         <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
           <span>Contraseña:</span>
           <strong className="text-amber-600 dark:text-amber-400 font-black">cajero10</strong>
         </div>
       </div>
       <button
         type="button"
         onClick={() => { navigator.clipboard.writeText('cajero10'); toast.success('Clave cajero10 copiada'); }}
         className="w-full mt-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors cursor-pointer"
       >
         Copiar Clave (cajero10)
       </button>
     </div>

     {/* Card Almacén */}
     <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
       <div className="flex items-center justify-between mb-1.5">
         <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">📦 Cocina</span>
         <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded font-bold">Activo</span>
       </div>
       <div className="space-y-1 text-[11px] font-mono">
         <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
           <span>Usuario:</span>
           <strong className="text-amber-600 dark:text-amber-400 font-black">almacen</strong>
         </div>
         <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
           <span>Contraseña:</span>
           <strong className="text-amber-600 dark:text-amber-400 font-black">almacen10</strong>
         </div>
       </div>
       <button
         type="button"
         onClick={() => { navigator.clipboard.writeText('almacen10'); toast.success('Clave almacen10 copiada'); }}
         className="w-full mt-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors cursor-pointer"
       >
         Copiar Clave (almacen10)
       </button>
     </div>
   </div>
 </div>

 {/* ─── 2. TARJETAS DE ROLES HABILITADOS (PLEGABLES) ─── */}
 <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
 <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <span className="p-1 rounded-lg bg-indigo-100 dark:bg-amber-950/60 text-indigo-800 dark:text-amber-300">
 <ShieldCheck className="w-3.5 h-3.5" />
 </span>
 <span className="text-xs font-black text-slate-800 dark:text-white tracking-tight">
 Perfiles y Roles Habilitados en Ferretería
 </span>
 <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
 ({cajerosAsignados.length} Cajeros · {vendedoresAsignados.length} Mozoes · {almacenerosAsignados.length} Cocinas · {adminAsignados.length} Admins)
 </span>
 </div>

 <button
 type="button"
 onClick={() => setMostrarResumenRoles(!mostrarResumenRoles)}
 className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-indigo-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-amber-200/80 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs"
 >
 {mostrarResumenRoles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
 <span>{mostrarResumenRoles ? 'Ocultar Tarjetas' : 'Ver Tarjetas de Roles'}</span>
 </button>
 </div>

 {mostrarResumenRoles && (
 <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-4 gap-3.5 sm:gap-4 bg-slate-50/30 dark:bg-slate-900/30">
 {/* TARJETA 1: ROL CAJERO */}
 <div className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/20 to-indigo-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-indigo-950/30 rounded-2xl p-4 border border-indigo-200/90 dark:border-indigo-800 shadow-2xs flex flex-col justify-between group hover:border-indigo-400 transition-all">
 <div>
 <div className="flex items-center justify-between gap-2 mb-3">
 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
 Rol Activo
 </span>
 <span className="font-mono text-[11px] font-black text-amber-700 dark:text-amber-300 bg-indigo-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
 {cajerosAsignados.length} en caja
 </span>
 </div>

 <div className="flex items-center gap-2.5 mb-3">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-sm shrink-0">
 <CreditCard className="w-4.5 h-4.5" />
 </div>
 <div className="min-w-0">
 <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
 Cajero / Cobros
 </h3>
 <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
 POS & Caja Chica
 </p>
 </div>
 </div>

 <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-3">
 <div className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
 <span>Cobros de ventas y turnos</span>
 </div>
 <div className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
 <span>Arqueos y emisión de tickets</span>
 </div>
 </div>
 </div>
 </div>

 {/* TARJETA 2: ROL VENDEDOR */}
 <div className="relative overflow-hidden bg-gradient-to-br from-white via-violet-50/20 to-violet-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-violet-950/30 rounded-2xl p-4 border border-violet-200/90 dark:border-violet-800 shadow-2xs flex flex-col justify-between group hover:border-violet-400 transition-all">
 <div>
 <div className="flex items-center justify-between gap-2 mb-3">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-300 text-[10px] font-black">
 <ShoppingBag className="w-3 h-3" />
 Mostrador
 </span>
 <span className="font-mono text-[11px] font-black text-violet-800 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-950/60 px-2 py-0.5 rounded-lg border border-violet-200 dark:border-violet-800">
 {vendedoresAsignados.length} en ventas
 </span>
 </div>

 <div className="flex items-center gap-2.5 mb-3">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
 <ShoppingBag className="w-4.5 h-4.5" />
 </div>
 <div className="min-w-0">
 <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
 Mozo de Salón
 </h3>
 <p className="text-[10px] text-violet-700 dark:text-violet-400 font-bold uppercase tracking-wider">
 Cotizaciones & Ventas
 </p>
 </div>
 </div>

 <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-3">
 <div className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
 <span>Cotizaciones para obras y clientes</span>
 </div>
 <div className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
 <span>Catálogo y precios de materiales</span>
 </div>
 </div>
 </div>
 </div>

 {/* TARJETA 3: ROL ALMACENERO */}
 <div className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-amber-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-amber-950/30 rounded-2xl p-4 border border-amber-200/90 dark:border-amber-800 shadow-2xs flex flex-col justify-between group hover:border-amber-400 transition-all">
 <div>
 <div className="flex items-center justify-between gap-2 mb-3">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-black">
 <Warehouse className="w-3 h-3" />
 Almacén
 </span>
 <span className="font-mono text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
 {almacenerosAsignados.length} en despacho
 </span>
 </div>

 <div className="flex items-center gap-2.5 mb-3">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-sm shrink-0">
 <Warehouse className="w-4.5 h-4.5" />
 </div>
 <div className="min-w-0">
 <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
 Chef de Cocina
 </h3>
 <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
 Stock & Traslados
 </p>
 </div>
 </div>

 <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-3">
 <div className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
 <span>Control de existencias y kardex</span>
 </div>
 <div className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
 <span>Carga y despacho de camiones</span>
 </div>
 </div>
 </div>
 </div>

 {/* TARJETA 4: ROL ADMINISTRADOR */}
 <div className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-purple-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-purple-950/30 rounded-2xl p-4 border border-purple-200/90 dark:border-purple-800 shadow-2xs flex flex-col justify-between group hover:border-purple-400 transition-all">
 <div>
 <div className="flex items-center justify-between gap-2 mb-3">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-black">
 <ShieldCheck className="w-3 h-3" />
 Acceso Total
 </span>
 <span className="font-mono text-[11px] font-black text-purple-800 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
 {adminAsignados.length} admin(s)
 </span>
 </div>

 <div className="flex items-center gap-2.5 mb-3">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shrink-0">
 <ShieldCheck className="w-4.5 h-4.5" />
 </div>
 <div className="min-w-0">
 <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
 Administrador General
 </h3>
 <p className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
 Control Total del Sistema
 </p>
 </div>
 </div>

 <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-3">
 <div className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
 <span>Auditoría de compras y ventas</span>
 </div>
 <div className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
 <span>Gestión de sedes y contraseñas</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* ─── 3. BARRA DE CONTROL Y SELECTOR DE VISTA (TARJETAS / TABLA) ─── */}
 <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
 {/* Buscador */}
 <div className="relative w-full md:w-80">
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por colaborador, correo o rol..."
 className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
 />
 </div>

 {/* Filtros por Rol y Conmutador de Vista (Variante 1A: Sub-píldoras Blancas Flotantes Ultra-Slim) */}
 <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto flex-wrap">
 {/* Píldoras de Rol Profesionales (Lucide Vector Icons + Conteo) */}
 <div className="flex items-center gap-1.5 flex-wrap">
 {[
 { id: 'todos', label: 'Todos', icon: Users, count: usuarios.length },
 { id: 'cajeros', label: 'Cajeros', icon: CreditCard, count: cajerosAsignados.length },
 { id: 'vendedores', label: 'Mozoes', icon: ShoppingBag, count: vendedoresAsignados.length },
 { id: 'almaceneros', label: 'Almacén', icon: Warehouse, count: almacenerosAsignados.length },
 { id: 'admin', label: 'Admins', icon: ShieldCheck, count: adminAsignados.length }
 ].map((btn) => {
 const Icon = btn.icon;
 const activo = filtroRol === btn.id;
 return (
 <button
 key={btn.id}
 type="button"
 onClick={() => setFiltroRol(btn.id)}
 className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 activo
 ? 'bg-slate-900 text-white shadow-subpill-active dark:bg-amber-600 dark:text-white'
 : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs hover:border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:border-slate-700/60'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${activo ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
 <span>{btn.label}</span>
 <span
 className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
 activo
 ? 'bg-white/20 text-white'
 : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
 }`}
 >
 {btn.count}
 </span>
 </button>
 );
 })}
 </div>

 <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

 {/* Selector de Vista: Tarjetas vs Tabla */}
 <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
 <button
 type="button"
 onClick={() => setVistaModo('tarjetas')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
 vistaModo === 'tarjetas'
 ? 'bg-white dark:bg-slate-700 text-indigo-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-600'
 : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
 }`}
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 <span>Tarjetas</span>
 </button>
 <button
 type="button"
 onClick={() => setVistaModo('tabla')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
 vistaModo === 'tabla'
 ? 'bg-white dark:bg-slate-700 text-indigo-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-600'
 : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
 }`}
 >
 <TableIcon className="w-3.5 h-3.5" />
 <span>Tabla</span>
 </button>
 </div>
 </div>
 </div>

 {/* ─── 4. CONTENIDO PRINCIPAL: TARJETAS O TABLA ─── */}
 {loading ? (
 <div className="bg-white dark:bg-slate-850 rounded-3xl p-12 text-center space-y-3 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
 <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
 <p className="text-xs font-bold text-slate-400">Consultando asignaciones de roles y contraseñas...</p>
 </div>
 ) : usuariosFiltrados.length === 0 ? (
 <div className="bg-white dark:bg-slate-850 rounded-3xl p-12 text-center space-y-2 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
 <Users className="w-8 h-8 text-slate-300 mx-auto" />
 <h4 className="text-sm font-black text-slate-700 dark:text-white">No se encontraron colaboradores</h4>
 <p className="text-xs text-slate-400">No hay usuarios que coincidan con la búsqueda o filtro seleccionado.</p>
 </div>
 ) : vistaModo === 'tarjetas' ? (
 /* ═════════ VISTA A: TARJETAS EJECUTIVAS DE CREDENCIALES ═════════ */
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
 {usuariosFiltrados.map((u) => {
 const esAdmin = u.rol === 'Administrador';
 const esMozo = u.rol === 'Mozo';
 const esCocina = u.rol === 'Cocina';
 const esCajero = u.rol === 'Cajero';

 return (
 <div
 key={u.id}
 className={`bg-white dark:bg-slate-850 rounded-3xl p-6 border-2 soft-card-shadow flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 relative overflow-hidden ${
 !u.activo
 ? 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/50'
 : esAdmin
 ? 'border-purple-200/80 dark:border-purple-800 hover:border-purple-400'
 : esMozo
 ? 'border-violet-200/80 dark:border-violet-800 hover:border-violet-400'
 : esCocina
 ? 'border-amber-200/80 dark:border-amber-800 hover:border-amber-400'
 : 'border-amber-200/80 dark:border-indigo-800 hover:border-indigo-400'
 }`}
 >
 <div>
 <div className="flex items-center justify-between gap-2 mb-4">
 <span
 className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black shadow-2xs ${
 esAdmin
 ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
 : esMozo
 ? 'bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
 : esCocina
 ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
 : 'bg-indigo-100 text-indigo-900 dark:bg-amber-950/60 dark:text-amber-300 border border-indigo-200 dark:border-indigo-800'
 }`}
 >
 {esAdmin ? (
 <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
 ) : esMozo ? (
 <ShoppingBag className="w-3.5 h-3.5 text-violet-700" />
 ) : esCocina ? (
 <Warehouse className="w-3.5 h-3.5 text-amber-700" />
 ) : (
 <CreditCard className="w-3.5 h-3.5 text-amber-700" />
 )}
 <span>{u.rol}</span>
 </span>

 <span
 className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black ${
 u.activo
 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
 : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200'
 }`}
 >
 <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-600' : 'bg-slate-400'}`} />
 {u.activo ? 'Operativo' : 'Inactivo'}
 </span>
 </div>

 {/* Datos del Colaborador */}
 <div className="flex items-start gap-3.5 mb-4">
 {u.foto_url ? (
 <img
 src={u.foto_url}
 alt={u.nombre}
 className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-md shrink-0"
 />
 ) : (
 <div
 className={`w-12 h-12 rounded-2xl text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md ${
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

 <div className="min-w-0 flex-1">
 <h3 className="font-black text-slate-900 dark:text-white text-sm leading-snug truncate">
 {u.nombre}
 </h3>
 <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
 <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
 <span className="truncate">{u.email}</span>
 </div>
 {u.telefono && (
 <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
 <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
 <span>{u.telefono}</span>
 </div>
 )}
 </div>
 </div>

 {/* Sede Asignada */}
 <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
 <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
 <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
 <span>Sede asignada:</span>
 </div>
 <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
 {u.sucursal?.nombre || 'Todas las Sedes'}
 </span>
 </div>

 {/* Franja de Estado de Contraseña */}
 <div className="mb-4.5 px-3.5 py-2.5 rounded-xl bg-amber-50/60 dark:bg-indigo-950/40 border border-amber-200/80 dark:border-indigo-800 flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
 <span className="text-xs font-extrabold text-indigo-900 dark:text-amber-300">Contraseña de Acceso:</span>
 </div>
 <span className="text-[10.5px] font-mono font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-700 shadow-2xs">
 Configurada
 </span>
 </div>
 </div>

 {/* Acciones */}
 <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
 <div className="grid grid-cols-2 gap-2.5">
 <button
 type="button"
 onClick={() => handleAbrirModalRol(u)}
 className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
 >
 <span>Cambiar Rol</span>
 </button>

 <button
 type="button"
 onClick={() => handleAbrirModalPassword(u)}
 className="px-2.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-1.5"
 >
 <KeyRound className="w-3.5 h-3.5" />
 <span>Asignar Clave</span>
 </button>
 </div>

 <button
 type="button"
 onClick={() => handleToggleEstado(u)}
 disabled={currentUser?.id === u.id}
 title={currentUser?.id === u.id ? 'No puedes desactivar tu propia cuenta' : ''}
 className={`w-full py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer border ${
 u.activo
 ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200/80 dark:border-rose-800'
 : 'text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800'
 } disabled:opacity-40 disabled:cursor-not-allowed`}
 >
 {u.activo ? 'Desactivar Acceso' : 'Habilitar Acceso'}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 /* ═════════ VISTA B: TABLA DETALLADA DE ASIGNACIÓN ═════════ */
 <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
 <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <span className="p-1.5 rounded-lg bg-amber-600 text-white shadow-2xs">
 <TableIcon className="w-3.5 h-3.5" />
 </span>
 <span className="text-xs font-black text-slate-800 dark:text-white tracking-tight">
 Colaboradores Registrados ({usuariosFiltrados.length})
 </span>
 </div>
 <div className="flex items-center gap-1.5 shrink-0">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10.5px] font-black border border-indigo-200 dark:border-indigo-800">
 <CreditCard className="w-3 h-3 text-amber-600 dark:text-amber-400" />
 {cajerosAsignados.length} Cajeros
 </span>
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 text-[10.5px] font-black border border-violet-200 dark:border-violet-800">
 <ShoppingBag className="w-3 h-3 text-violet-600 dark:text-violet-400" />
 {vendedoresAsignados.length} Mozoes
 </span>
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10.5px] font-black border border-amber-200 dark:border-amber-800">
 <Warehouse className="w-3 h-3 text-amber-600 dark:text-amber-400" />
 {almacenerosAsignados.length} Almacén
 </span>
 </div>
 </div>

 <div className="overflow-x-auto custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead>
 {/* FILA 1: Encabezados de Columna (Estilo Gestione Screenshot 2) */}
 <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
 <th className="py-2.5 px-3 w-14 text-center">Nro.</th>
 <th className="py-2.5 px-3 w-28 text-center">Acciones</th>
 <th className="py-2.5 px-3.5 min-w-[200px]">Nombres</th>
 <th className="py-2.5 px-3 min-w-[130px]">Rol Asignado</th>
 <th className="py-2.5 px-3 min-w-[130px]">Sede Asignada</th>
 <th className="py-2.5 px-2.5 text-center min-w-[90px]">Estado</th>
 </tr>

 {/* FILA 2: Filtros directos por columna con embudo Y (Estilo Gestione) */}
 <tr className="bg-slate-100/60 dark:bg-slate-850/60 border-b border-slate-200/90 dark:border-slate-700/80">
 <th className="py-1 px-2"></th>
 <th className="py-1 px-2"></th>
 <th className="py-1 px-2">
 <div className="relative">
 <input
 type="text"
 value={colFiltros.nombre}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, nombre: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2.5 pr-7 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>

 <th className="py-1 px-2">
 <div className="relative">
 <input
 type="text"
 value={colFiltros.rol}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, rol: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2.5 pr-7 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>

 <th className="py-1 px-2">
 <div className="relative">
 <input
 type="text"
 value={colFiltros.sede}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, sede: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2.5 pr-7 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>

 <th className="py-1 px-2">
 <div className="relative">
 <select
 value={colFiltros.estado}
 onChange={(e) => {
 setColFiltros({ ...colFiltros, estado: e.target.value });
 setPaginaActual(1);
 }}
 className="w-full pl-2 pr-6 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
 >
 <option value="todos">-Todos-</option>
 <option value="activo">1</option>
 <option value="inactivo">0</option>
 </select>
 <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
 </div>
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
 {usuariosPaginados.map((u, idx) => {
 const esAdmin = u.rol === 'Administrador';
 const esMozo = u.rol === 'Mozo';
 const esCocina = u.rol === 'Cocina';
 const esCajero = u.rol === 'Cajero';
 const rowNumber = inicioIndex + idx + 1;
 const isMenuOpen = menuAccionAbierto === u.id;

 return (
 <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
 <td className="py-2.5 px-3 text-center text-slate-500 font-bold font-mono">
 {rowNumber}
 </td>

 {/* Botón de Engranaje Acciones ⚙️ ⌄ (Estilo Gestione) */}
 <td className="py-2.5 px-3 text-center relative">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setMenuAccionAbierto(isMenuOpen ? null : u.id);
 }}
 className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
 >
 <SettingsIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
 <ChevronDown className="w-3 h-3 text-slate-400" />
 </button>

 {isMenuOpen && (
 <div
 onClick={(e) => e.stopPropagation()}
 className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-1 text-left animate-in fade-in zoom-in-95"
 >
 <button
 type="button"
 onClick={() => {
 setMenuAccionAbierto(null);
 handleAbrirModalRol(u);
 }}
 className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
 >
 <KeyRound className="w-3.5 h-3.5 text-blue-500" />
 <span>Asignar Rol & Sede</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setMenuAccionAbierto(null);
 handleAbrirModalPassword(u);
 }}
 className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
 >
 <Lock className="w-3.5 h-3.5 text-amber-500" />
 <span>Cambiar Clave</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setMenuAccionAbierto(null);
 handleToggleEstado(u);
 }}
 disabled={currentUser?.id === u.id}
 className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40"
 >
 {u.activo ? (
 <>
 <Power className="w-3.5 h-3.5 text-rose-500" />
 <span>Suspender Acceso</span>
 </>
 ) : (
 <>
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
 <span>Habilitar Acceso</span>
 </>
 )}
 </button>
 </div>
 )}
 </td>

 <td className="py-2.5 px-3.5">
 <div className="flex items-center gap-2.5">
 {u.foto_url ? (
 <img
 src={u.foto_url}
 alt={u.nombre}
 className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
 />
 ) : (
 <div
 className={`w-7 h-7 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 text-white ${
 esAdmin
 ? 'bg-purple-700'
 : esMozo
 ? 'bg-violet-600'
 : esCocina
 ? 'bg-amber-600'
 : 'bg-amber-600'
 }`}
 >
 {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
 </div>
 )}
 <div className="min-w-0">
 <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate max-w-[200px] leading-tight">
 {u.nombre}
 </p>
 <span className="text-[10.5px] text-slate-500 font-mono truncate block font-medium leading-tight">
 {u.email}
 </span>
 </div>
 </div>
 </td>

 <td className="py-2.5 px-3">
 <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-black ${
 esAdmin
 ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
 : esMozo
 ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
 : esCocina
 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
 : 'bg-blue-600 text-white'
 }`}>
 <span>{u.rol}</span>
 </span>
 </td>

 <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
 <div className="flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
 <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
 {u.sucursal?.nombre || 'Todas las Sedes'}
 </span>
 </div>
 </td>

 <td className="py-2.5 px-2.5 text-center font-mono font-bold">
 {u.activo ? '1' : '0'}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* BARRA DE PAGINACIÓN COMPLETA (Estilo Gestione) */}
 <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
 onClick={cargarDatos}
 className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
 title="Refrescar padrón"
 >
 <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
 </button>
 </div>
 </div>

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
 )}

 {/* ─── MODAL 1: ASIGNAR / CAMBIAR CONTRASEÑA (PORTAL CON CABECERA Y PIE FIJOS) ─── */}
 {modalPasswordOpen && usuarioSeleccionado && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 {/* Backdrop estático e independiente con blur profesional */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
 onClick={() => setModalPasswordOpen(false)}
 aria-hidden="true"
 />

 {/* Contenedor centrado */}
 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
 onClick={() => setModalPasswordOpen(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 {/* ─── CABECERA FIJA (SHRINK-0 Z-20) ─── */}
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-2xl sm:rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                Asignar o Cambiar Contraseña
              </h3>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate sm:whitespace-normal">
                Gestión de credenciales de seguridad y acceso operativo al sistema
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalPasswordOpen(false)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation ml-2"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

 {/* ─── FORMULARIO CON CUERPO SCROLLEABLE Y PIE FIJO ─── */}
 <form onSubmit={handleGuardarPassword} className="flex flex-col flex-1 min-h-0 overflow-hidden">
 {/* CUERPO SCROLLEABLE */}
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 sm:p-6 space-y-4">
 {/* ── SECCIÓN 1: DATOS DEL COLABORADOR & ACCESO ACTUAL ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Colaborador Seleccionado
 </span>
 </div>
 <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full">
 ID #{usuarioSeleccionado.id}
 </span>
 </div>

 {/* Ficha Resumen */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/70 flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
 {usuarioSeleccionado.nombre ? usuarioSeleccionado.nombre.charAt(0).toUpperCase() : 'U'}
 </div>
 <div className="min-w-0">
 <p className="text-xs font-black text-slate-800 dark:text-white truncate">
 {usuarioSeleccionado.nombre}
 </p>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
 <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
 <span className="truncate">
 {usuarioSeleccionado.numero_documento
 ? `${usuarioSeleccionado.tipo_documento || 'DNI'}: ${usuarioSeleccionado.numero_documento}`
 : 'Sin documento'}
 </span>
 </p>
 </div>
 </div>

 <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/70 flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
 <ShieldCheck className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-black text-slate-800 dark:text-white">
 {usuarioSeleccionado.rol}
 </span>
 <span
 className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
 usuarioSeleccionado.activo !== false
 ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
 : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
 }`}
 >
 {usuarioSeleccionado.activo !== false ? 'Activo' : 'Inactivo'}
 </span>
 </div>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
 <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
 <span className="truncate">
 {usuarioSeleccionado.sucursal?.nombre ||
 opcionesSucursales.find((s) => String(s.valor) === String(usuarioSeleccionado.id_sucursal))?.etiqueta ||
 'Acceso Global / Multisede'}
 </span>
 </p>
 </div>
 </div>
 </div>

 {/* Email Login y Teléfono */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 px-1 border-t border-slate-200/60 dark:border-slate-700/60">
 <div className="flex items-center gap-1.5 min-w-0">
 <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
 <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono truncate">
 {usuarioSeleccionado.email || 'Sin correo de login'}
 </span>
 </div>
 {usuarioSeleccionado.telefono && (
 <div className="flex items-center gap-1.5 shrink-0">
 <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
 <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
 {usuarioSeleccionado.telefono}
 </span>
 </div>
 )}
 </div>
 </div>

 {/* ── SECCIÓN 2: ASIGNACIÓN DE NUEVA CONTRASEÑA ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Nueva Contraseña de Acceso
 </span>
 </div>
 <button
 type="button"
 onClick={() => {
 const pwd = generarPasswordSegura();
 setNuevaPassword(pwd);
 toast.success('Clave segura generada');
 }}
 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-indigo-800 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
 title="Generar automáticamente una clave segura aleatoria"
 >
 <Sparkles className="w-3 h-3" />
 <span>Generar Clave Aleatoria</span>
 </button>
 </div>

 {/* Input de Contraseña con botones integrados */}
 <div>
 <div className="relative">
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
 <Lock className="w-4 h-4" />
 </div>
 <input
 type={mostrarPassword ? 'text' : 'password'}
 required
 value={nuevaPassword}
 onChange={(e) => setNuevaPassword(e.target.value)}
 placeholder="Mínimo 6 caracteres (ej. 10xirio10 o cajero10)"
 className="w-full pl-9 pr-24 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
 />
 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
 <button
 type="button"
 onClick={() => setMostrarPassword((prev) => !prev)}
 className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
 title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
 >
 {mostrarPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
 </button>
 {nuevaPassword && (
 <button
 type="button"
 onClick={handleCopiarPassword}
 className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
 title="Copiar contraseña al portapapeles"
 >
 {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
 </button>
 )}
 </div>
 </div>

 {/* Fortaleza de contraseña dinámica */}
 {nuevaPassword && (
 <div className="mt-2 flex items-center gap-2">
 <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex gap-1">
 <div className={`h-full rounded-full transition-all ${nuevaPassword.length >= 6 ? 'w-1/3 bg-amber-500' : 'w-1/3 bg-rose-500'}`} />
 <div className={`h-full rounded-full transition-all ${nuevaPassword.length >= 8 && /[A-Z]/.test(nuevaPassword) ? 'w-1/3 bg-emerald-500' : 'w-1/3 bg-transparent'}`} />
 <div className={`h-full rounded-full transition-all ${nuevaPassword.length >= 8 && /[0-9#$!@]/.test(nuevaPassword) ? 'w-1/3 bg-amber-500' : 'w-1/3 bg-transparent'}`} />
 </div>
 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
 {nuevaPassword.length < 6 ? 'Débil (mín. 6 caracteres)' : nuevaPassword.length < 8 ? 'Aceptable' : 'Segura y recomendada'}
 </span>
 </div>
 )}
 </div>

 {/* Plantillas de clave rápida */}
 <div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
 Plantillas de Clave Rápida:
 </span>
 <div className="flex flex-wrap gap-1.5">
 {['10xirio10', 'cajero10', 'almacen10'].map((preset) => (
 <button
 key={preset}
 type="button"
 onClick={() => {
 setNuevaPassword(preset);
 toast.success(`Plantilla asignada: ${preset}`);
 }}
 className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-[10.5px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer shadow-2xs"
 >
 {preset}
 </button>
 ))}
 </div>
 </div>

 {/* Nota informativa */}
 <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2 text-[11px] text-indigo-900 dark:text-amber-300">
 <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
 <span>
 Esta contraseña permitirá al colaborador iniciar sesión en terminales POS, cobrar tickets o gestionar compras e inventario según su rol asignado.
 </span>
 </div>
 </div>
 </div>

 {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
 <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 z-20 backdrop-blur-xs">
              <button
                type="button"
                onClick={compartirPasswordPorWhatsApp}
                disabled={!nuevaPassword || nuevaPassword.trim().length < 6}
                className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs touch-manipulation shrink-0"
                title="Enviar la nueva clave al WhatsApp del colaborador"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Compartir por WhatsApp</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                <button
                  type="button"
                  onClick={() => setModalPasswordOpen(false)}
                  className="flex-1 sm:flex-initial sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPassword || !nuevaPassword || nuevaPassword.trim().length < 6}
                  className="flex-1 sm:flex-initial sm:w-auto px-3.5 sm:px-5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation whitespace-nowrap"
                >
                  {guardandoPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Guardar Contraseña</span>
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

 {/* ─── MODAL 2: ASIGNAR ROL (PORTAL CON CABECERA Y PIE FIJOS) ─── */}
 {modalRolOpen && usuarioSeleccionado && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 {/* Backdrop estático e independiente con blur profesional */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
 onClick={() => setModalRolOpen(false)}
 aria-hidden="true"
 />

 {/* Contenedor centrado */}
 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
 onClick={() => setModalRolOpen(false)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 {/* ─── CABECERA FIJA (SHRINK-0 Z-20) ─── */}
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-2xl sm:rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shadow-violet-600/25 shrink-0 border border-violet-400/20">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                Asignar Rol & Sede en Ferretería
              </h3>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate sm:whitespace-normal">
                Definición de nivel de privilegios y sucursal física operativa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalRolOpen(false)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation ml-2"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

 {/* ─── FORMULARIO CON CUERPO SCROLLEABLE Y PIE FIJO ─── */}
 <form onSubmit={handleGuardarRol} className="flex flex-col flex-1 min-h-0 overflow-hidden">
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 sm:p-6 space-y-4">
 {/* Resumen del Colaborador */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Colaborador a Configurar
 </span>
 </div>
 <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200/70 dark:border-violet-800/60 px-2.5 py-0.5 rounded-full">
 {usuarioSeleccionado.rol}
 </span>
 </div>
 <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/70 flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 flex items-center justify-center font-black text-xs shrink-0">
 {usuarioSeleccionado.nombre ? usuarioSeleccionado.nombre.charAt(0).toUpperCase() : 'U'}
 </div>
 <div className="min-w-0">
 <p className="text-xs font-black text-slate-800 dark:text-white truncate">
 {usuarioSeleccionado.nombre}
 </p>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
 <Mail className="w-3 h-3 text-slate-400 shrink-0" />
 <span className="truncate">{usuarioSeleccionado.email || 'Sin correo'}</span>
 </p>
 </div>
 </div>
 </div>

 {/* Selección de Rol */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Seleccionar Nivel de Acceso / Perfil
 </span>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {[
 { id: 'Cajero', label: 'Cajero / POS', desc: 'Cobros y turnos de caja', icon: CreditCard, color: 'border-indigo-300 bg-amber-50/60 text-indigo-900 dark:text-indigo-200' },
 { id: 'Mozo', label: 'Mozo de Salón', desc: 'Cotizaciones y ventas', icon: ShoppingBag, color: 'border-violet-300 bg-violet-50/60 text-violet-900 dark:text-violet-200' },
 { id: 'Cocina', label: 'Almacén / Despacho', desc: 'Kardex y despachos', icon: Warehouse, color: 'border-amber-300 bg-amber-50/60 text-amber-900 dark:text-amber-200' },
 { id: 'Administrador', label: 'Administrador', desc: 'Control total de tienda', icon: ShieldCheck, color: 'border-purple-300 bg-purple-50/60 text-purple-900 dark:text-purple-200' }
 ].map((r) => {
 const Icon = r.icon;
 const isSelected = rolForm.rol === r.id;
 return (
 <button
 key={r.id}
 type="button"
 onClick={() => setRolForm({ ...rolForm, rol: r.id })}
 className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
 isSelected
 ? `${r.color} ring-2 ring-indigo-500 font-black shadow-2xs`
 : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-300 font-bold bg-white dark:bg-slate-850'
 }`}
 >
 <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
 <Icon className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <span className="text-xs font-black block leading-tight">{r.label}</span>
 <span className="text-[10px] text-slate-400 font-normal leading-tight block mt-0.5">{r.desc}</span>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Sede Operativa */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
 <div className="flex items-center gap-2">
 <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Sede / Almacén Físico Asignado
 </span>
 </div>

 <select
 value={rolForm.id_sucursal}
 onChange={(e) => setRolForm({ ...rolForm, id_sucursal: e.target.value })}
 className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 cursor-pointer transition-all"
 >
 <option value="">Todas las Sedes / Acceso Global Multisede</option>
 {sucursales.map((s) => (
 <option key={s.id} value={s.id}>
 {s.nombre} {s.es_principal ? '(Principal)' : ''}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
 <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex items-center gap-2 shrink-0 z-20 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setModalRolOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center touch-manipulation sm:ml-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoRol}
                className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 touch-manipulation"
              >
                {guardandoRol ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Guardar Perfil</span>
                  </>
                )}
              </button>
            </div>
 </form>
 </div>
 </div>
 </div>,
 document.body
 )}

 {/* ─── MODAL 3: CREAR ACCESO RÁPIDO (PORTAL CON CABECERA Y PIE FIJOS) ─── */}
      {modalCrearOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop estático e independiente con blur profesional */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setModalCrearOpen(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
            onClick={() => setModalCrearOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl sm:max-w-3xl max-h-[94vh] sm:max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ─── CABECERA FIJA (SHRINK-0 Z-20) ─── */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-2xl sm:rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                      Crear Acceso Rápido al Sistema
                    </h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate sm:whitespace-normal">
                      Configuración inmediata de credenciales, perfil de rol y sede operativa
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalCrearOpen(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation ml-2"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ─── FORMULARIO CON CUERPO SCROLLEABLE Y PIE FIJO ─── */}
              <form onSubmit={handleCrearUsuario} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* CUERPO SCROLLEABLE INDEPENDIENTE */}
                <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">

                  {/* ── SECCIÓN 1: IDENTIDAD Y DOCUMENTO RENIEC ── */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                          Identidad del Colaborador & Validación
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full shrink-0">
                        Acceso Rápido Express
                      </span>
                    </div>

                    {/* Foto con Canvas Uploader & Compressor */}
                    <div className="flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0 shadow-xs">
                        {nuevoUsuario.foto_url ? (
                          <img src={nuevoUsuario.foto_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-lg">
                            {nuevoUsuario.nombre ? nuevoUsuario.nombre.trim().charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Fotografía de Perfil (Opcional)
                        </span>
                        <span className="text-[10px] text-slate-400 block mb-1.5">
                          Aparecerá en el Topbar, turnos de caja POS y comprobantes
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 bg-amber-50 hover:bg-indigo-100 dark:bg-amber-950/60 dark:hover:bg-indigo-900/60 text-amber-600 dark:text-amber-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{nuevoUsuario.foto_url ? 'Cambiar Foto' : 'Cargar Foto'}</span>
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
                                    setNuevoUsuario({ ...nuevoUsuario, foto_url: canvas.toDataURL('image/jpeg', 0.88) });
                                  };
                                  img.src = ev.target.result;
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          {nuevoUsuario.foto_url && (
                            <button
                              type="button"
                              onClick={() => setNuevoUsuario({ ...nuevoUsuario, foto_url: '' })}
                              className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DNI con RENIEC y Nombre Completo */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end">
                      {/* DNI (5 columnas) */}
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          DNI Colaborador (8 dígitos)
                        </label>
                        <div className="flex gap-1.5">
                          <div className="relative flex-1">
                            <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              maxLength={8}
                              value={nuevoUsuario.numero_documento}
                              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, numero_documento: e.target.value.replace(/\D/g, '') })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  consultarDniReniec();
                                }
                              }}
                              placeholder="Ej. 74829103"
                              className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={consultarDniReniec}
                            disabled={consultandoDni || (nuevoUsuario.numero_documento || '').length !== 8}
                            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs touch-manipulation"
                            title="Consultar padrón oficial RENIEC para autocompletar nombres"
                          >
                            {consultandoDni ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Search className="w-3.5 h-3.5" />
                            )}
                            <span className="inline text-[11px]">RENIEC</span>
                          </button>
                        </div>
                      </div>

                      {/* Nombre Completo (7 columnas) */}
                      <div className="sm:col-span-7">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nombre Completo del Colaborador <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={nuevoUsuario.nombre}
                            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                            placeholder="Ej. Roberto Quispe Díaz"
                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Login con Sugerir Correo y Teléfono */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Correo Electrónico (Login) <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={sugerirCorreoLogin}
                            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer touch-manipulation"
                            title="Generar sugerencia de correo login a partir del DNI o nombre"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>Sugerir correo</span>
                          </button>
                        </div>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={nuevoUsuario.email}
                            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                            placeholder="cajero1@ferreteria.com"
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
                            value={nuevoUsuario.telefono}
                            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })}
                            placeholder="Ej. 987 654 321"
                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── SECCIÓN 2: PERMISOS DE ROL, SEDE & LÍMITE DE DESCUENTO ── */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                          Rol en Ferretería, Sede & Control Comercial
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full shrink-0">
                        Seguridad RBAC
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 items-start">
                      {/* Rol en Ferretería */}
                      <div>
                        <SelectorDesplegablePildora
                          id="crear_rol"
                          label="Rol en Ferretería"
                          required
                          valor={nuevoUsuario.rol}
                          opciones={OPCIONES_ROLES}
                          onChange={(val) => setNuevoUsuario(prev => ({ ...prev, rol: val }))}
                          desplegableActivo={desplegableActivo}
                          setDesplegableActivo={setDesplegableActivo}
                          subtituloAyuda="Nivel de permisos operativos asignados al colaborar"
                        />
                      </div>

                      {/* Sede Asignada */}
                      <div>
                        <SelectorDesplegablePildora
                          id="crear_sucursal"
                          label="Sede / Almacén Asignado"
                          valor={nuevoUsuario.id_sucursal ? String(nuevoUsuario.id_sucursal) : ''}
                          opciones={opcionesSucursales}
                          onChange={(val) => setNuevoUsuario(prev => ({ ...prev, id_sucursal: val }))}
                          desplegableActivo={desplegableActivo}
                          setDesplegableActivo={setDesplegableActivo}
                          subtituloAyuda="Sede operativa fija o acceso global corporativo"
                        />
                      </div>
                    </div>

                    {/* Límite de Descuento (%) para Mostrador / POS */}
                    <div className="pt-1">
                      <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
                            <Percent className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                              Límite Máximo de Descuento en Ventas (%)
                            </label>
                            <p className="text-[10px] text-slate-400 leading-tight truncate sm:whitespace-normal">
                              {nuevoUsuario.rol === 'Cajero' || nuevoUsuario.rol === 'Mozo'
                                ? 'Porcentaje máximo que el colaborador puede rebajar en mostrador/caja'
                                : 'Tope de descuento comercial permitido para este perfil operativo'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={nuevoUsuario.limite_descuento}
                            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, limite_descuento: e.target.value })}
                            className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-center text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                          />
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── SECCIÓN 3: CREDENCIALES DE ACCESO & COMPARTIR ── */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                          Contraseña Inicial de Acceso
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {nuevoUsuario.password && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(nuevoUsuario.password);
                              setCopiadoCrear(true);
                              toast.success('Clave copiada al portapapeles');
                              setTimeout(() => setCopiadoCrear(false), 2000);
                            }}
                            className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-2xs touch-manipulation active:scale-95"
                            title="Copiar contraseña generada"
                          >
                            {copiadoCrear ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                            <span>{copiadoCrear ? 'Copiada' : 'Copiar'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const pwd = generarPasswordSegura();
                            setNuevoUsuario(prev => ({ ...prev, password: pwd }));
                            toast.success('Clave segura generada');
                          }}
                          className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:text-indigo-800 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs touch-manipulation active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Generar Clave</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contraseña de Acceso <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={mostrarPasswordCrear ? 'text' : 'password'}
                          required
                          value={nuevoUsuario.password}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                          placeholder="Mínimo 6 caracteres (ej. Ferre345!)"
                          className="w-full pl-8 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarPasswordCrear(!mostrarPasswordCrear)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer touch-manipulation"
                          title={mostrarPasswordCrear ? 'Ocultar contraseña' : 'Ver contraseña'}
                        >
                          {mostrarPasswordCrear ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Contraseña con la que el colaborador iniciará sesión en su primera jornada de trabajo.
                      </span>
                    </div>
                  </div>

                </div>

                {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0 z-20 backdrop-blur-xs">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                    <button
                      type="button"
                      onClick={compartirPorWhatsApp}
                      className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 cursor-pointer shadow-2xs touch-manipulation"
                      title="Enviar credenciales generadas vía WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Compartir vía WhatsApp</span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-medium hidden lg:inline">
                      <span className="text-rose-500 font-bold">*</span> Campos requeridos
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setModalCrearOpen(false)}
                      className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center touch-manipulation"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={creandoUsuario}
                      className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 touch-manipulation"
                    >
                      {creandoUsuario ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Registrando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Registrar Acceso</span>
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
