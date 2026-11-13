import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 Users,
 Search,
 Plus,
 Building2,
 HardHat,
 Phone,
 Mail,
 MapPin,
 CreditCard,
 Calendar,
 AlertCircle,
 Eye,
 Edit2,
 Trash2,
 X,
 CheckCircle2,
 Clock,
 DollarSign,
 Briefcase,
 FileText,
 Truck,
 Sparkles,
 RefreshCw,
 Sliders,
 Scale,
 ShieldCheck,
 Check,
 ChevronDown,
 UserCheck,
 BadgePercent,
 MessageCircle,
 AlertTriangle,
 Package,
 Copy,
 ExternalLink
} from 'lucide-react';

// ─── HELPER PARA ELIMINAR CUALQUIER EMOJI Y MANTENER ESTÉTICA PROFESIONAL ───
const limpiarEmojis = (texto) => {
 if (!texto || typeof texto !== 'string') return '';
 return texto
 .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu, '')
 .replace(/\s+/g, ' ')
 .trim();
};

// ─── CONSTANTES DE OPCIONES PARA PÍLDORAS DESPLEGABLES REDONDEADAS (ESTILO COMPRAS) ───
const OPCIONES_TIPO_DOC = [
 { valor: 'RUC', etiqueta: 'RUC (Empresas / Factura)', descripcion: '11 dígitos - Personas Jurídicas y Negocios' },
 { valor: 'DNI', etiqueta: 'DNI (Maestro de Obra / Boleta)', descripcion: '8 dígitos - Personas Naturales' },
 { valor: 'CE', etiqueta: 'Carnet de Extranjería', descripcion: 'Extranjeros residentes' },
 { valor: 'PASAPORTE', etiqueta: 'Pasaporte', descripcion: 'Documento internacional' },
 { valor: 'OTRO', etiqueta: 'Otro Documento', descripcion: 'Sin documento tributario estándar' }
];

const OPCIONES_PERFIL_CLIENTE = [
 { valor: 'Contratista / Maestro de Obra', etiqueta: 'Contratista / Maestro de Obra', descripcion: 'Compras recurrentes en obra y acabados' },
 { valor: 'Empresa Constructora', etiqueta: 'Empresa Constructora / Inmobiliaria', descripcion: 'Proyectos a gran escala y facturación' },
 { valor: 'Taller / Metalmecánica', etiqueta: 'Taller / Metalmecánica / Cerrajería', descripcion: 'Perfiles, planchas, soldadura y tubos' },
 { valor: 'Mayorista / Ferretería', etiqueta: 'Mayorista / Sub-distribuidor', descripcion: 'Reventa y ferreterías de barrio' },
 { valor: 'Cliente Frecuente', etiqueta: 'Cliente Frecuente / Autoconstrucción', descripcion: 'Particulares y remodelaciones' }
];

const OPCIONES_TIPO_PRECIO = [
 { valor: 'Mayorista', etiqueta: 'Precio Mayorista', descripcion: 'Descuento por volumen en fierro y cemento' },
 { valor: 'Especial Obra', etiqueta: 'Precio Especial Obra', descripcion: 'Costo pactado por partidas de construcción' },
 { valor: 'Distribuidor', etiqueta: 'Precio Distribuidor', descripcion: 'Margen mínimo para sub-distribución' },
 { valor: 'Mostrador', etiqueta: 'Precio Mostrador', descripcion: 'Público general en mostrador' }
];

const OPCIONES_ACCESO_VEHICULAR = [
 { valor: 'Camión Mediano (8-10 Tn)', etiqueta: 'Camión Mediano (8-10 Tn)', descripcion: 'Estándar urbano para reparto' },
 { valor: 'Tráiler / Plataforma (20-30 Tn)', etiqueta: 'Tráiler / Plataforma (20-30 Tn)', descripcion: 'Avenidas amplias y patios de maniobra' },
 { valor: 'Furgoneta / Camioneta (2-4 Tn)', etiqueta: 'Furgoneta / Camioneta (2-4 Tn)', descripcion: 'Calles intermedias y urbanizaciones' },
 { valor: 'Motofurgón / Peatonal', etiqueta: 'Motofurgón / Peatonal', descripcion: 'Pasajes estrechos, cerros o carretillaje' }
];

const OPCIONES_ESTADO_CREDITO = [
 { valor: 'Activo', etiqueta: 'Activo (Autorizado)', descripcion: 'Permite compras a crédito en caja' },
 { valor: 'Alerta', etiqueta: 'Alerta (Revisión de deuda)', descripcion: 'Advertencia por saldos pendientes' },
 { valor: 'Bloqueado', etiqueta: 'Bloqueado (Solo contado)', descripcion: 'Bloquea ventas a crédito' }
];

const OPCIONES_DIA_PAGO = [
 { valor: 'Sábados Quincenales', etiqueta: 'Sábados Quincenales', descripcion: 'Valorización de obra quincenal' },
 { valor: 'Sábados Semanales', etiqueta: 'Sábados Semanales', descripcion: 'Cierre semanal de planilla maestro' },
 { valor: 'Fin de Mes', etiqueta: 'Fin de Mes', descripcion: 'Facturación a 30 días calendario' },
 { valor: 'A convenir', etiqueta: 'A convenir según flete', descripcion: 'Coordinación por cada despacho' }
];

const OPCIONES_METODO_PAGO = [
 { valor: 'Transferencia BCP / BBVA', etiqueta: 'Transferencia BCP / BBVA', descripcion: 'Abono bancario con voucher' },
 { valor: 'Efectivo en Tienda', etiqueta: 'Efectivo en Tienda / Caja', descripcion: 'Pago en mostrador' },
 { valor: 'Yape / Plin Empresarial', etiqueta: 'Yape / Plin Empresarial', descripcion: 'Billeteras digitales inmediatas' },
 { valor: 'Cheque Comercial', etiqueta: 'Cheque Comercial al Día', descripcion: 'Cheque diferido o al día' }
];

// Componente de Píldora Desplegable con diseño idéntico al modal Ingreso de Compra a Proveedor
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
 const opcSel = opciones.find(o => o.valor === valor) || opciones[0];

 return (
 <div className={`relative dropdown-container-ferretero ${estaAbierto ? 'z-40' : 'z-20'}`}>
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
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {opcSel ? opcSel.etiqueta : valor}
 </span>
 <ChevronDown
 className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 estaAbierto ? 'rotate-180 text-indigo-600' : ''
 }`}
 />
 </button>

 {/* Ventana Desplegable Redondeada (rounded-2xl) */}
 {estaAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 min-w-[220px]">
 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {opciones.map((opc) => {
 const estaSel = valor === opc.valor;
 return (
 <button
 key={opc.valor}
 type="button"
 onClick={() => {
 onChange(opc.valor);
 setDesplegableActivo(null);
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSel
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
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
 {estaSel && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
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

export default function Clientes() {
 const [searchParams, setSearchParams] = useSearchParams();
 const rawTab = searchParams.get('tab') || 'cartera';
 const activeTab = ['cartera', 'obras', 'autorizados'].includes(rawTab) ? rawTab : 'cartera';

 const [clientes, setClientes] = useState([]);
 const [resumen, setResumen] = useState(null);
 const [cargando, setCargando] = useState(true);

 // Pestaña 1: Cartera
 const [busqueda, setBusqueda] = useState('');
 const [filtroPerfil, setFiltroPerfil] = useState('TODOS');

 // Pestaña 2: Obras & Puntos de Entrega
 const [busquedaObra, setBusquedaObra] = useState('');
 const [filtroAccesoObra, setFiltroAccesoObra] = useState('TODOS');

 // Pestaña 3: Personal Autorizado para Retiro
 const [busquedaAutorizado, setBusquedaAutorizado] = useState('');
 const [filtroCargoAutorizado, setFiltroCargoAutorizado] = useState('TODOS');

 const tabs = [
 {
 id: 'cartera',
 label: 'Cartera de Clientes & Contratistas',
 sublabel: 'RUC/DNI, tarifas mayoristas & créditos',
 mobileLabel: 'Cartera',
 icon: Users,
 badge: 'Directorio 360°'
 },
 {
 id: 'obras',
 label: 'Obras & Puntos de Entrega',
 sublabel: 'Fletes, accesos de camión & ubigeo SUNAT',
 mobileLabel: 'Obras & Fletes',
 icon: Truck,
 badge: 'Logística'
 },
 {
 id: 'autorizados',
 label: 'Personal Autorizado para Retiro',
 sublabel: 'Padrón de choferes, maestros & estibadores',
 mobileLabel: 'Acreditados',
 icon: ShieldCheck,
 badge: 'Seguridad'
 }
 ];

 const handleTabChange = (tabId) => {
 setSearchParams({ tab: tabId });
 };

 const copiarTexto = (txt, label = 'Texto') => {
 if (!txt) return;
 navigator.clipboard.writeText(txt);
 toast.success(`${label} copiado al portapapeles`);
 };

 // Modales
 const [modalAbierto, setModalAbierto] = useState(false);
 const [clienteEditar, setClienteEditar] = useState(null);
 const [modalDetalle, setModalDetalle] = useState(null);
 const [guardando, setGuardando] = useState(false);
 const [consultandoSunat, setConsultandoSunat] = useState(false);

 // Control de selector desplegable activo en modal (estilo Ingreso de Compra)
 const [desplegableActivo, setDesplegableActivo] = useState(null);

 // Cerrar desplegable ferretero al hacer clic fuera o con Escape
 useEffect(() => {
 const handleClickAfuera = (e) => {
 if (!e.target.closest('.dropdown-container-ferretero')) {
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

 // Form State Completo con Campos Ferreteros
 const [formData, setFormData] = useState({
 tipo_documento: 'RUC',
 numero_documento: '',
 nombre: '',
 perfil_cliente: 'Contratista / Maestro de Obra',
 tipo_precio: 'Mayorista',
 telefono: '',
 email: '',
 direccion: '',
 contacto_obra: '',
 telefono_obra: '',
 direccion_obra: '',
 ubigeo_obra: '',
 acceso_vehicular: 'Camión Mediano (8-10 Tn)',
 horario_descarga: '',
 requiere_estiba: false,
 personal_autorizado: '',
 limite_credito: 3000,
 dias_credito: 15,
 estado_credito: 'Activo',
 dia_pago_preferido: 'Sábados Quincenales',
 metodo_pago_habitual: 'Transferencia BCP / BBVA',
 agente_retencion: false,
 porcentaje_retencion: 3.00,
 estado_sunat: 'ACTIVO',
 condicion_sunat: 'HABIDO',
 observaciones: ''
 });

 const perfilesFiltro = [
 { id: 'TODOS', label: 'Todos los Clientes' },
 { id: 'CONTRATISTAS', label: 'Contratistas & Maestros' },
 { id: 'CONSTRUCTORAS', label: 'Empresas Constructoras' },
 { id: 'TALLERES', label: 'Talleres & Metalmecánica' },
 { id: 'CON_CREDITO', label: 'Con Línea de Crédito' },
 { id: 'CON_DEUDA', label: 'Con Deuda Pendiente' }
 ];

 const filtrosObra = [
 { id: 'TODOS', label: 'Todas las Obras' },
 { id: 'TRAILER', label: 'Tráiler / Plataforma' },
 { id: 'CAMION', label: 'Camión Mediano' },
 { id: 'FURGONETA', label: 'Furgoneta / Camioneta' },
 { id: 'ESTIBA', label: 'Requieren Estiba' },
 { id: 'CON_UBIGEO', label: 'Con Ubigeo GRE' }
 ];

 const filtrosAutorizado = [
 { id: 'TODOS', label: 'Todo el Personal' },
 { id: 'CHOFER', label: 'Choferes & Transportistas' },
 { id: 'MAESTRO', label: 'Maestros & Residentes' },
 { id: 'AYUDANTE', label: 'Ayudantes & Estiba' },
 { id: 'CON_DNI', label: 'Con DNI Validado' }
 ];

 const cargarClientes = async () => {
 setCargando(true);
 try {
 const params = {};
 if (activeTab === 'cartera') {
 if (busqueda.trim()) params.busqueda = busqueda.trim();
 if (filtroPerfil === 'CONTRATISTAS') params.perfil = 'CONTRATISTAS';
 else if (filtroPerfil === 'CONSTRUCTORAS') params.perfil = 'CONSTRUCTORAS';
 else if (filtroPerfil === 'TALLERES') params.perfil = 'TALLERES';
 else if (filtroPerfil === 'CON_CREDITO') params.con_credito = 'true';
 else if (filtroPerfil === 'CON_DEUDA') params.con_deuda = 'true';
 }

 const [resCli, resResumen] = await Promise.all([
 api.get('/clientes', { params }),
 api.get('/clientes/resumen').catch(() => ({ success: false, metricas: null }))
 ]);

 if (resCli && resCli.success) setClientes(resCli.clientes || []);
 if (resResumen && resResumen.success) setResumen(resResumen.metricas || null);
 } catch (e) {
 toast.error(e?.response?.data?.message || e?.message || 'Error al cargar clientes');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarClientes();
 }, [activeTab, busqueda, filtroPerfil]);

 // ─── LISTA DE OBRAS & PUNTOS DE ENTREGA (TAB 2) ───
 const listaObras = useMemo(() => {
 return clientes.filter(c => 
 (c.direccion_obra && c.direccion_obra.trim() !== '') || 
 (c.contacto_obra && c.contacto_obra.trim() !== '') ||
 (c.acceso_vehicular && c.acceso_vehicular.trim() !== '') ||
 (c.perfil_cliente === 'Contratista / Maestro de Obra' || c.perfil_cliente === 'Empresa Constructora')
 );
 }, [clientes]);

 const obrasFiltradas = useMemo(() => {
 return listaObras.filter(c => {
 if (busquedaObra.trim()) {
 const q = busquedaObra.toLowerCase().trim();
 const coincide = 
 (c.nombre && c.nombre.toLowerCase().includes(q)) ||
 (c.numero_documento && c.numero_documento.includes(q)) ||
 (c.direccion_obra && c.direccion_obra.toLowerCase().includes(q)) ||
 (c.contacto_obra && c.contacto_obra.toLowerCase().includes(q)) ||
 (c.ubigeo_obra && c.ubigeo_obra.includes(q)) ||
 (c.telefono_obra && c.telefono_obra.includes(q));
 if (!coincide) return false;
 }

 if (filtroAccesoObra === 'TRAILER') {
 return (c.acceso_vehicular || '').toLowerCase().includes('tráiler') || (c.acceso_vehicular || '').toLowerCase().includes('trailer');
 }
 if (filtroAccesoObra === 'CAMION') {
 return (c.acceso_vehicular || '').toLowerCase().includes('camión') || (c.acceso_vehicular || '').toLowerCase().includes('camion');
 }
 if (filtroAccesoObra === 'FURGONETA') {
 return (c.acceso_vehicular || '').toLowerCase().includes('furgoneta') || (c.acceso_vehicular || '').toLowerCase().includes('camioneta');
 }
 if (filtroAccesoObra === 'ESTIBA') {
 return c.requiere_estiba === true || c.requiere_estiba === 1;
 }
 if (filtroAccesoObra === 'CON_UBIGEO') {
 return c.ubigeo_obra && c.ubigeo_obra.trim().length === 6;
 }
 return true;
 });
 }, [listaObras, busquedaObra, filtroAccesoObra]);

 const metricasObras = useMemo(() => {
 const total = listaObras.length;
 const conEstiba = listaObras.filter(c => c.requiere_estiba === true || c.requiere_estiba === 1).length;
 const conTrailer = listaObras.filter(c => (c.acceso_vehicular || '').toLowerCase().includes('tráiler') || (c.acceso_vehicular || '').toLowerCase().includes('trailer')).length;
 const conUbigeo = listaObras.filter(c => c.ubigeo_obra && c.ubigeo_obra.trim().length === 6).length;
 return { total, conEstiba, conTrailer, conUbigeo };
 }, [listaObras]);

 // ─── LISTA DE PERSONAL AUTORIZADO PARA RETIRO (TAB 3) ───
 const listaAutorizados = useMemo(() => {
 const resultado = [];
 clientes.forEach(cliente => {
 const texto = cliente.personal_autorizado;
 if (!texto || typeof texto !== 'string' || !texto.trim()) return;

 const raw = texto.trim();
 // Si está en formato JSON
 if (raw.startsWith('[') && raw.endsWith(']')) {
 try {
 const parsed = JSON.parse(raw);
 if (Array.isArray(parsed)) {
 parsed.forEach((item, idx) => {
 resultado.push({
 id: `${cliente.id}-${idx}`,
 nombre: item.nombre || item.name || 'Personal Autorizado',
 dni: item.dni || item.documento || '',
 cargo: item.cargo || item.rol || 'Autorizado para retiro',
 telefono: item.telefono || cliente.telefono || '',
 cliente
 });
 });
 return;
 }
 } catch (e) {}
 }

 // Separación por líneas, plecas o punto y coma
 const lineas = raw.split(/[\n|;]+/).map(l => l.trim()).filter(Boolean);
 lineas.forEach((linea, idx) => {
 const dniMatch = linea.match(/\b\d{8}\b/);
 const dni = dniMatch ? dniMatch[0] : '';

 let cargo = 'Personal Autorizado';
 if (/chofer|conductor|transporte|flete/i.test(linea)) cargo = 'Chofer / Transportista';
 else if (/maestro|albañil|capataz/i.test(linea)) cargo = 'Maestro de Obra';
 else if (/residente|ingeniero|ing/i.test(linea)) cargo = 'Ing. Residente';
 else if (/estibador|ayudante|peón|peon/i.test(linea)) cargo = 'Ayudante / Estiba';
 else if (/compras|logistica|adquisicion/i.test(linea)) cargo = 'Encargado de Compras';

 let nombreLimpio = linea
 .replace(/\(DNI\s*[:\-]?\s*\d{8}\)/i, '')
 .replace(/DNI\s*[:\-]?\s*\d{8}/i, '')
 .replace(/-\s*(chofer|conductor|maestro|ayudante|estibador|residente|capataz|ingeniero|comprador|compras).*/i, '')
 .replace(/\s+/g, ' ')
 .trim();

 resultado.push({
 id: `${cliente.id}-${idx}`,
 nombre: nombreLimpio || linea,
 dni,
 cargo,
 textoOriginal: linea,
 cliente
 });
 });
 });
 return resultado;
 }, [clientes]);

 const autorizadosFiltrados = useMemo(() => {
 return listaAutorizados.filter(item => {
 if (busquedaAutorizado.trim()) {
 const q = busquedaAutorizado.toLowerCase().trim();
 const coincide = 
 item.nombre.toLowerCase().includes(q) ||
 item.dni.includes(q) ||
 (item.cargo && item.cargo.toLowerCase().includes(q)) ||
 (item.cliente.nombre && item.cliente.nombre.toLowerCase().includes(q)) ||
 (item.cliente.numero_documento && item.cliente.numero_documento.includes(q));
 if (!coincide) return false;
 }

 if (filtroCargoAutorizado === 'CHOFER') {
 return item.cargo.includes('Chofer');
 }
 if (filtroCargoAutorizado === 'MAESTRO') {
 return item.cargo.includes('Maestro') || item.cargo.includes('Residente');
 }
 if (filtroCargoAutorizado === 'AYUDANTE') {
 return item.cargo.includes('Ayudante') || item.cargo.includes('Estiba');
 }
 if (filtroCargoAutorizado === 'CON_DNI') {
 return item.dni && item.dni.length === 8;
 }
 return true;
 });
 }, [listaAutorizados, busquedaAutorizado, filtroCargoAutorizado]);

 const metricasAutorizados = useMemo(() => {
 const total = listaAutorizados.length;
 const conDni = listaAutorizados.filter(a => a.dni && a.dni.length === 8).length;
 const clientesConAcreditados = new Set(listaAutorizados.map(a => a.cliente.id)).size;
 const clientesCreditoActivo = new Set(listaAutorizados.filter(a => a.cliente.estado_credito === 'Activo' && parseFloat(a.cliente.limite_credito || 0) > 0).map(a => a.cliente.id)).size;
 return { total, conDni, clientesConAcreditados, clientesCreditoActivo };
 }, [listaAutorizados]);

 const consultarDocumento = async () => {
 let doc = formData.numero_documento ? formData.numero_documento.replace(/\D/g, '').trim() : '';
 if (!doc) {
 return toast.error('Ingrese el número de documento a consultar');
 }

 let tipoDoc = formData.tipo_documento;
 if (doc.length === 11 && tipoDoc !== 'RUC') {
 tipoDoc = 'RUC';
 setFormData(prev => ({ ...prev, tipo_documento: 'RUC' }));
 } else if (doc.length === 8 && tipoDoc !== 'DNI') {
 tipoDoc = 'DNI';
 setFormData(prev => ({ ...prev, tipo_documento: 'DNI' }));
 }

 setConsultandoSunat(true);
 try {
 if (tipoDoc === 'RUC') {
 if (doc.length !== 11) return toast.error('El RUC debe tener 11 dígitos');
 const res = await api.get(`/consultas/ruc/${doc}`);
 if (res && res.success && res.data) {
 const razonSocial = res.data.razon_social || res.data.nombre || '';
 const direccionCompleta = res.data.direccion || [res.data.direccion, res.data.distrito, res.data.provincia, res.data.departamento].filter(Boolean).join(' - ');
 const ubigeoObtenido = res.data.ubigeo || '';

 setFormData((prev) => ({
 ...prev,
 tipo_documento: 'RUC',
 nombre: razonSocial || prev.nombre,
 direccion: direccionCompleta || prev.direccion,
 perfil_cliente: 'Empresa Constructora',
 estado_sunat: res.data.estado || 'ACTIVO',
 condicion_sunat: res.data.condicion || 'HABIDO',
 ubigeo_obra: prev.ubigeo_obra || ubigeoObtenido
 }));

 if (res.data.condicion && res.data.condicion !== 'HABIDO') {
 toast.error(`Atención: Contribuyente en condición ${res.data.condicion} en SUNAT`);
 } else {
 toast.success('Datos de SUNAT obtenidos exitosamente');
 }
 } else {
 toast.error(res?.message || 'No se encontraron datos en SUNAT');
 }
 } else if (tipoDoc === 'DNI') {
 if (doc.length !== 8) return toast.error('El DNI debe tener 8 dígitos');
 const res = await api.get(`/consultas/dni/${doc}`);
 if (res && res.success && res.data) {
 const nombreCompleto = res.data.nombre_completo || `${res.data.nombres || ''} ${res.data.apellido_paterno || ''} ${res.data.apellido_materno || ''}`.trim();
 setFormData((prev) => ({
 ...prev,
 tipo_documento: 'DNI',
 nombre: nombreCompleto || prev.nombre,
 perfil_cliente: 'Contratista / Maestro de Obra',
 estado_sunat: 'ACTIVO',
 condicion_sunat: 'HABIDO'
 }));
 toast.success('Datos de RENIEC obtenidos exitosamente');
 } else {
 toast.error(res?.message || 'No se encontraron datos en RENIEC');
 }
 } else {
 toast.error('La consulta automática solo está disponible para RUC y DNI');
 }
 } catch (err) {
 toast.error('Error al consultar padrón oficial');
 } finally {
 setConsultandoSunat(false);
 }
 };

 const abrirNuevo = () => {
 setClienteEditar(null);
 setDesplegableActivo(null);
 setFormData({
 tipo_documento: 'RUC',
 numero_documento: '',
 nombre: '',
 perfil_cliente: 'Contratista / Maestro de Obra',
 tipo_precio: 'Mayorista',
 telefono: '',
 email: '',
 direccion: '',
 contacto_obra: '',
 telefono_obra: '',
 direccion_obra: '',
 ubigeo_obra: '',
 acceso_vehicular: 'Camión Mediano (8-10 Tn)',
 horario_descarga: '',
 requiere_estiba: false,
 personal_autorizado: '',
 limite_credito: 3000,
 dias_credito: 15,
 estado_credito: 'Activo',
 dia_pago_preferido: 'Sábados Quincenales',
 metodo_pago_habitual: 'Transferencia BCP / BBVA',
 agente_retencion: false,
 porcentaje_retencion: 3.00,
 estado_sunat: 'ACTIVO',
 condicion_sunat: 'HABIDO',
 observaciones: ''
 });
 setModalAbierto(true);
 };

 const abrirEditar = (c) => {
 setClienteEditar(c);
 setDesplegableActivo(null);
 setFormData({
 tipo_documento: c.tipo_documento || 'RUC',
 numero_documento: c.numero_documento || '',
 nombre: c.nombre || '',
 perfil_cliente: c.perfil_cliente || 'Contratista / Maestro de Obra',
 tipo_precio: c.tipo_precio || 'Mayorista',
 telefono: c.telefono || '',
 email: c.email || '',
 direccion: c.direccion || '',
 contacto_obra: c.contacto_obra || '',
 telefono_obra: c.telefono_obra || '',
 direccion_obra: c.direccion_obra || '',
 ubigeo_obra: c.ubigeo_obra || '',
 acceso_vehicular: c.acceso_vehicular || 'Camión Mediano (8-10 Tn)',
 horario_descarga: c.horario_descarga || '',
 requiere_estiba: c.requiere_estiba === true || c.requiere_estiba === 1,
 personal_autorizado: c.personal_autorizado || '',
 limite_credito: c.limite_credito || 0,
 dias_credito: c.dias_credito || 15,
 estado_credito: c.estado_credito || 'Activo',
 dia_pago_preferido: c.dia_pago_preferido || 'Sábados Quincenales',
 metodo_pago_habitual: c.metodo_pago_habitual || 'Transferencia BCP / BBVA',
 agente_retencion: c.agente_retencion === true || c.agente_retencion === 1,
 porcentaje_retencion: c.porcentaje_retencion || 3.00,
 estado_sunat: c.estado_sunat || 'ACTIVO',
 condicion_sunat: c.condicion_sunat || 'HABIDO',
 observaciones: c.observaciones || ''
 });
 setModalAbierto(true);
 };

 const abrirFichaDetalle = async (c) => {
 try {
 const res = await api.get(`/clientes/${c.id}/detalle`);
 if (res && res.success) {
 setModalDetalle(res.cliente);
 } else {
 setModalDetalle(c);
 }
 } catch (e) {
 setModalDetalle(c);
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!formData.nombre.trim()) {
 return toast.error('El nombre o razón social es obligatorio');
 }

 setGuardando(true);
 try {
 if (clienteEditar) {
 await api.put(`/clientes/${clienteEditar.id}`, formData);
 toast.success('Cliente mayorista actualizado exitosamente');
 } else {
 await api.post('/clientes', formData);
 toast.success('Cliente mayorista registrado exitosamente');
 }
 setModalAbierto(false);
 cargarClientes();
 } catch (err) {
 toast.error(err.message || 'Error al guardar cliente');
 } finally {
 setGuardando(false);
 }
 };

 const metricas = resumen || {
 totalClientes: clientes.length,
 totalMayoristas: clientes.filter(c => c.perfil_cliente !== 'Público General').length,
 conCredito: clientes.filter(c => parseFloat(c.limite_credito || 0) > 0).length,
 totalDeudaGlobal: clientes.reduce((acc, c) => acc + (c.deuda_total || 0), 0)
 };

 return (
 <div className="space-y-2.5 w-full max-w-[1440px] mx-auto pb-6">
 {/* ─── PÍLDORA BASE FLOTANTE ULTRA-SLIM ENVOLVENTE (SIN SCROLLBAR NI GROSOR EXTRA) ─── */}
 <div className="p-3 sm:p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card-soft space-y-2.5">
 {/* Cabecera / Identificador Superior de la Cápsula */}
 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 px-1">
 {/* Lado izquierdo: Ícono squircle + Título destacado + Status */}
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
 <HardHat className="w-4.5 h-4.5 stroke-[2.2]" />
 </div>

 <div className="flex items-center gap-2 flex-wrap min-w-0">
 <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight ">
 Clientes & Contratistas de Obra
 </h1>
 <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Cartera Activa
 </span>
 <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
 • Cuentas comerciales, puntos de entrega & personal acreditado
 </span>
 </div>
 </div>

 {/* Lado derecho: Buscador proporcional + Botones con tamaño idéntico a Nuevo Producto */}
 <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-between lg:justify-end">
 <div className="relative flex-1 sm:w-72 md:w-80 lg:w-96">
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 type="text"
 value={activeTab === 'cartera' ? busqueda : activeTab === 'obras' ? busquedaObra : busquedaAutorizado}
 onChange={(e) => {
 if (activeTab === 'cartera') setBusqueda(e.target.value);
 else if (activeTab === 'obras') setBusquedaObra(e.target.value);
 else setBusquedaAutorizado(e.target.value);
 }}
 placeholder={
 activeTab === 'cartera'
 ? 'Buscar RUC, DNI, cliente...'
 : activeTab === 'obras'
 ? 'Buscar obra, dirección, ubigeo...'
 : 'Buscar DNI, chofer o maestro...'
 }
 className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
 />
 {(activeTab === 'cartera' ? busqueda : activeTab === 'obras' ? busquedaObra : busquedaAutorizado) && (
 <button
 type="button"
 onClick={() => {
 if (activeTab === 'cartera') setBusqueda('');
 else if (activeTab === 'obras') setBusquedaObra('');
 else setBusquedaAutorizado('');
 }}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <button
 type="button"
 onClick={cargarClientes}
 title="Actualizar listado de clientes"
 className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
 >
 <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-indigo-600' : ''}`} />
 </button>

 <button
 type="button"
 onClick={abrirNuevo}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
 >
 <Plus className="w-4 h-4" />
 <span>Nuevo Cliente</span>
 </button>
 </div>
 </div>

 {/* Nivel 1: Riel Cápsula Base Perlado Ultra-Slim Envolvente (Flex-Wrap Inteligente) */}
 <div className="rounded-2xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 p-1.5 sm:p-2">
 <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
 {tabs.map((t) => {
 const isActive = activeTab === t.id;
 const Icon = t.icon;
 return (
 <button
 key={t.id}
 type="button"
 onClick={() => handleTabChange(t.id)}
 className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer select-none active:scale-[0.98] ${
 isActive
 ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-pill-active ring-2 ring-indigo-400/30'
 : 'bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
 }`}
 >
 <div
 className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
 isActive
 ? 'bg-white/20 text-white shadow-2xs'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
 }`}
 >
 <Icon className="w-3.5 h-3.5 stroke-[2.3]" />
 </div>
 <span className="whitespace-nowrap tracking-tight">{t.label}</span>
 {t.badge && !isActive && (
 <span className="hidden xl:inline px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
 {t.badge}
 </span>
 )}
 {isActive && (
 <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs shrink-0 animate-pulse" />
 )}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* ═══════════════════════════════════════════════════════════════════════ */}
 {/* ─── PESTAÑA 1: CARTERA DE CLIENTES & CONTRATISTAS (DIRECTORIO 360°) ─── */}
 {/* ═══════════════════════════════════════════════════════════════════════ */}
 {activeTab === 'cartera' && (
 <div className="space-y-2.5 animate-in fade-in duration-200">
 {/* ─── 4 TARJETAS EJECUTIVAS KPI (ESTILO DASHBOARD LIMPIO & ELEGANTE) ─── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Total Clientes */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Total Clientes
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <Users className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 {metricas.totalClientes}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Cartera registrada
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Base Datos
 </span>
 </div>
 </div>

 {/* KPI 2: Mayoristas & Obra */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 Mayoristas & Obra
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <Building2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
 {metricas.totalMayoristas}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Compras por volumen
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 Contratistas
 </span>
 </div>
 </div>

 {/* KPI 3: Con Línea Crédito */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Con Línea Crédito
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <CreditCard className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {metricas.conCredito}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Líneas autorizadas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 A Plazos
 </span>
 </div>
 </div>

 {/* KPI 4: Saldo Pendiente */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Saldo Pendiente
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <DollarSign className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 S/ {parseFloat(metricas.totalDeudaGlobal || 0).toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Cuentas por cobrar
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 Cobranzas
 </span>
 </div>
 </div>
 </div>

 {/* ─── PÍLDORAS DE FILTRO POR PERFIL COMERCIAL (ESTILO SLIM) ─── */}
 <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-1 flex-wrap">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
 Filtrar:
 </span>
 {perfilesFiltro.map((f) => (
 <button
 key={f.id}
 type="button"
 onClick={() => setFiltroPerfil(f.id)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
 filtroPerfil === f.id
 ? 'bg-indigo-600 text-white shadow-2xs font-black'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>
 <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
 {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
 </span>
 </div>

 {/* ─── TABLA COMPACTA DE CLIENTES MAYORISTAS Y CONTRATISTAS (ESPACIO OPTIMIZADO) ─── */}
 {/* ─── TABLA COMPACTA DE CLIENTES MAYORISTAS Y CONTRATISTAS (ESPACIO 100% ADAPTATIVO AL SIDEBAR) ─── */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-all duration-300">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs table-fixed min-w-[720px] lg:min-w-0">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[10px] sm:text-[10.5px] uppercase tracking-wider select-none">
 <th className="py-2.5 px-2.5 font-bold w-[27%]">CLIENTE & DOC</th>
 <th className="py-2.5 px-2 font-bold w-[15%]">PERFIL & TARIFA</th>
 <th className="py-2.5 px-2 font-bold w-[16%]">CONTACTO & TEL.</th>
 <th className="py-2.5 px-2.5 font-bold w-[26%]">OBRA / DESTINO</th>
 <th className="py-2.5 px-2 font-bold text-right w-[16%]">LÍNEA CRÉDITO</th>
 <th className="py-2.5 px-1.5 font-bold text-center w-[66px] shrink-0">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {cargando ? (
 <tr>
 <td colSpan="6" className="py-8 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-1.5">
 <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span className="font-medium text-xs">Cargando contratistas y clientes...</span>
 </div>
 </td>
 </tr>
 ) : clientes.length === 0 ? (
 <tr>
 <td colSpan="6" className="py-10 text-center text-slate-400">
 <HardHat className="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600 mb-1.5 stroke-1" />
 <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">No se encontraron clientes con este filtro</p>
 <p className="text-[11px] text-slate-400 mt-0.5">
 Registra a tus maestros de obra, talleres y empresas constructoras
 </p>
 </td>
 </tr>
 ) : (
 clientes.map((c) => {
 const tieneCredito = parseFloat(c.limite_credito || 0) > 0;
 const deuda = parseFloat(c.deuda_total || 0);

 const badgePerfil = {
 'Contratista / Maestro de Obra': 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60',
 'Empresa Constructora': 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/60',
 'Taller / Metalmecánica': 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/80 dark:border-violet-800/60',
 'Mayorista / Ferretería': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60',
 'Cliente Frecuente': 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/60'
 }[c.perfil_cliente] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

 return (
 <tr key={c.id} className="hover:bg-indigo-50/25 dark:hover:bg-slate-800/40 transition-colors">
 {/* 1. Cliente & Documento (Agrupado y con truncate fluido) */}
 <td className="py-2.5 px-2.5 min-w-0">
 <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate text-xs" title={limpiarEmojis(c.nombre)}>
 {limpiarEmojis(c.nombre)}
 </div>
 <div className="flex items-center gap-1 mt-1 flex-wrap">
 <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
 {c.tipo_documento || 'DOC'}: {c.numero_documento || 'S/N'}
 </span>
 {c.condicion_sunat === 'NO HABIDO' && (
 <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1 py-0.2 rounded border border-rose-300 dark:border-rose-800 flex items-center gap-0.5 shrink-0">
 <AlertTriangle className="w-2.5 h-2.5" /> NO HABIDO
 </span>
 )}
 {c.agente_retencion && (
 <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-700/60 shrink-0">
 Ret. 3%
 </span>
 )}
 {Array.isArray(c.personal_autorizado) && c.personal_autorizado.length > 0 && (
 <span
 className="text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0"
 title={`Personal autorizado: ${c.personal_autorizado.map(p => `${p.nombre} (DNI ${p.dni})`).join(', ')}`}
 >
 <UserCheck className="w-2.5 h-2.5 text-indigo-500" />
 {c.personal_autorizado.length} autoriz.
 </span>
 )}
 {c.email && (
 <span className="text-[10px] text-slate-400 truncate max-w-[170px]" title={c.email}>
 {c.email}
 </span>
 )}
 </div>
 </td>

 {/* 2. Perfil Comercial & Tarifa Pactada */}
 <td className="py-2.5 px-2 min-w-0">
 <div className="flex flex-col gap-0.5 items-start">
 <span
 className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border truncate max-w-full block ${badgePerfil}`}
 title={c.perfil_cliente || 'Frecuente'}
 >
 {c.perfil_cliente || 'Frecuente'}
 </span>
 <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-full">
 Tarifa: <strong className="text-slate-700 dark:text-slate-200">{c.tipo_precio || 'Mayorista'}</strong>
 </span>
 </div>
 </td>

 {/* 3. Contacto & Teléfono */}
 <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 min-w-0">
 <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight text-xs truncate" title={c.contacto_obra || 'Sin contacto directo'}>
 {limpiarEmojis(c.contacto_obra) || 'Sin contacto directo'}
 </div>
 <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 min-w-0">
 <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
 <span className="truncate">{c.telefono || c.telefono_obra || 'Sin teléfono'}</span>
 {(c.telefono || c.telefono_obra) && (
 <a
 href={`https://wa.me/51${(c.telefono || c.telefono_obra).replace(/\D/g, '')}`}
 target="_blank"
 rel="noreferrer"
 title="Abrir chat de WhatsApp"
 className="text-emerald-500 hover:text-emerald-600 transition-colors p-0.5 inline-flex items-center shrink-0"
 >
 <MessageCircle className="w-3 h-3" />
 </a>
 )}
 </div>
 </td>

 {/* 4. Obra / Destino de Entrega (100% fluido y libre de emojis) */}
 <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300 min-w-0">
 <div
 className="font-medium text-xs flex items-center gap-1.5 text-slate-800 dark:text-slate-200 min-w-0"
 title={limpiarEmojis(c.direccion_obra || c.direccion || 'Sin obra registrada')}
 >
 <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
 <span className="truncate">{limpiarEmojis(c.direccion_obra || c.direccion || 'Sin obra registrada')}</span>
 </div>
 <div className="flex items-center gap-1 mt-1 flex-wrap">
 {c.acceso_vehicular && (
 <span
 className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/70 dark:border-slate-700/60 max-w-full"
 title={limpiarEmojis(c.acceso_vehicular)}
 >
 <Truck className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 shrink-0" />
 <span className="truncate">{limpiarEmojis(c.acceso_vehicular)}</span>
 </span>
 )}
 {c.requiere_estiba ? (
 <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/80 dark:border-amber-800/60 shrink-0">
 <Package className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
 Estiba
 </span>
 ) : null}
 {!c.acceso_vehicular && !c.requiere_estiba && (
 <span className="text-[9.5px] text-slate-400 italic">Despacho estándar</span>
 )}
 </div>
 </td>

 {/* 5. Línea de Crédito & Estado */}
 <td className="py-2.5 px-2 text-right font-mono min-w-0">
 {tieneCredito ? (
 <div className="flex flex-col items-end">
 <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
 S/ {parseFloat(c.limite_credito).toFixed(2)}
 </span>
 {deuda > 0 ? (
 <span className="text-[9.5px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-1 py-0.2 rounded mt-0.5 whitespace-nowrap">
 Debe: S/ {deuda.toFixed(2)}
 </span>
 ) : (
 <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.2 rounded mt-0.5 whitespace-nowrap">
 Al día
 </span>
 )}
 </div>
 ) : (
 <span className="text-slate-400 italic text-[10.5px]">Contado</span>
 )}
 </td>

 {/* 6. Acciones */}
 <td className="py-2.5 px-1.5 text-center w-[66px] shrink-0">
 <div className="flex items-center justify-center gap-1">
 <button
 type="button"
 onClick={() => abrirFichaDetalle(c)}
 title="Ver ficha comercial 360°"
 className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>

 <button
 type="button"
 onClick={() => abrirEditar(c)}
 title="Editar datos del cliente"
 className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>
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
 </div>
 )}

 {/* ═══════════════════════════════════════════════════════════════════════ */}
 {/* ─── PESTAÑA 2: OBRAS & PUNTOS DE ENTREGA (LOGÍSTICA DE FLETES PESADOS) ─── */}
 {/* ═══════════════════════════════════════════════════════════════════════ */}
 {activeTab === 'obras' && (
 <div className="space-y-2.5 animate-in fade-in duration-200">
 {/* 4 KPIs de Logística de Fletes */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Obras Registradas */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Obras Registradas
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <MapPin className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 {metricasObras.total}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Puntos de despacho
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Destinos
 </span>
 </div>
 </div>

 {/* KPI 2: Requieren Estiba */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Requieren Estiba
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <Package className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {metricasObras.conEstiba}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Cuadrilla de descarga
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 Descarga
 </span>
 </div>
 </div>

 {/* KPI 3: Acceso Tráiler */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 Acceso Tráiler
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <Truck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
 {metricasObras.conTrailer}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Plataformas 20-30 Tn
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 Carga Pesada
 </span>
 </div>
 </div>

 {/* KPI 4: Ubigeo GRE SUNAT */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Ubigeo GRE SUNAT
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {metricasObras.conUbigeo}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Guías electrónicas listas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 6 Dígitos
 </span>
 </div>
 </div>
 </div>

 {/* Filtros de Obras */}
 <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-1 flex-wrap">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
 Filtrar Accesos:
 </span>
 {filtrosObra.map((f) => (
 <button
 key={f.id}
 type="button"
 onClick={() => setFiltroAccesoObra(f.id)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
 filtroAccesoObra === f.id
 ? 'bg-indigo-600 text-white shadow-2xs font-black'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>
 <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
 {obrasFiltradas.length} {obrasFiltradas.length === 1 ? 'obra' : 'obras'}
 </span>
 </div>

 {/* Tabla de Obras & Logística */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-all duration-300">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs table-fixed min-w-[720px] lg:min-w-0">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[10px] sm:text-[10.5px] uppercase tracking-wider select-none">
 <th className="py-2.5 px-2.5 font-bold w-[27%]">OBRA & CLIENTE TITULAR</th>
 <th className="py-2.5 px-2.5 font-bold w-[27%]">UBICACIÓN & UBIGEO SUNAT</th>
 <th className="py-2.5 px-2 font-bold w-[18%]">ACCESO VEHICULAR</th>
 <th className="py-2.5 px-2 font-bold w-[12%]">ESTIBA</th>
 <th className="py-2.5 px-2 font-bold w-[16%]">ENCARGADO EN OBRA</th>
 <th className="py-2.5 px-1.5 font-bold text-center w-[66px] shrink-0">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {cargando ? (
 <tr>
 <td colSpan="6" className="py-8 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-1.5">
 <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span className="font-medium text-xs">Cargando obras y puntos de entrega...</span>
 </div>
 </td>
 </tr>
 ) : obrasFiltradas.length === 0 ? (
 <tr>
 <td colSpan="6" className="py-10 text-center text-slate-400">
 <Truck className="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600 mb-1.5 stroke-1" />
 <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">No se encontraron obras con este filtro</p>
 <p className="text-[11px] text-slate-400 mt-0.5">
 Edita un contratista o cliente para registrar su dirección de obra y accesos de camión
 </p>
 </td>
 </tr>
 ) : (
 obrasFiltradas.map((c) => {
 const dirObra = limpiarEmojis(c.direccion_obra || c.direccion || 'Sin dirección registrada');
 const tieneUbigeo = c.ubigeo_obra && c.ubigeo_obra.trim().length === 6;

 return (
 <tr
 key={c.id}
 className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
 >
 {/* 1. Obra & Cliente Titular */}
 <td className="py-2.5 px-2.5 min-w-0">
 <div className="flex items-center gap-2 min-w-0">
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center font-bold text-xs shrink-0">
 <Building2 className="w-3.5 h-3.5" />
 </div>
 <div className="min-w-0 truncate">
 <div className="font-bold text-slate-900 dark:text-white text-xs truncate" title={c.nombre}>
 {c.nombre}
 </div>
 <div className="flex items-center gap-1 mt-0.5 flex-wrap">
 <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
 {c.tipo_documento}: {c.numero_documento || 'S/N'}
 </span>
 <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 truncate max-w-[130px]">
 {c.perfil_cliente}
 </span>
 </div>
 </div>
 </div>
 </td>

 {/* 2. Ubicación & Ubigeo SUNAT GRE */}
 <td className="py-2.5 px-2.5 min-w-0">
 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 min-w-0" title={dirObra}>
 <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
 <span className="truncate">{dirObra}</span>
 <button
 type="button"
 onClick={() => copiarTexto(dirObra, 'Dirección de obra')}
 title="Copiar dirección exacta"
 className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 transition-opacity cursor-pointer shrink-0"
 >
 <Copy className="w-3 h-3" />
 </button>
 </div>
 <div className="flex items-center gap-1.5 mt-1 flex-wrap">
 {tieneUbigeo ? (
 <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/60">
 <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
 Ubigeo GRE: {c.ubigeo_obra}
 </span>
 ) : (
 <span className="text-[9.5px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200/80 dark:border-amber-800/60">
 Sin ubigeo GRE
 </span>
 )}
 </div>
 </td>

 {/* 3. Acceso Vehicular & Horario */}
 <td className="py-2.5 px-2 min-w-0">
 <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 max-w-full truncate" title={c.acceso_vehicular}>
 <Truck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
 <span className="truncate">{limpiarEmojis(c.acceso_vehicular || 'Camión Mediano')}</span>
 </div>
 {c.horario_descarga && (
 <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate" title={c.horario_descarga}>
 <Clock className="w-2.5 h-2.5 shrink-0 text-slate-400" />
 <span className="truncate">{limpiarEmojis(c.horario_descarga)}</span>
 </div>
 )}
 </td>

 {/* 4. Estiba */}
 <td className="py-2.5 px-2 min-w-0">
 {c.requiere_estiba ? (
 <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
 <Package className="w-2.5 h-2.5 text-amber-600 shrink-0" />
 Requiere
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/60">
 <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
 En Obra
 </span>
 )}
 </td>

 {/* 5. Contacto en Obra & WhatsApp */}
 <td className="py-2.5 px-2 min-w-0">
 <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" title={c.contacto_obra}>
 {limpiarEmojis(c.contacto_obra || 'Residente de Obra')}
 </div>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className="text-[10px] text-slate-500 font-mono truncate">
 {c.telefono_obra || c.telefono || 'Sin teléfono'}
 </span>
 {(c.telefono_obra || c.telefono) && (
 <a
 href={`https://wa.me/51${(c.telefono_obra || c.telefono).replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, nos comunicamos de Ferretería para coordinar el despacho hacia su obra: ${dirObra}`)}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-emerald-600 hover:text-emerald-700 transition-colors p-0.5"
 title="Coordinar entrega por WhatsApp"
 >
 <MessageCircle className="w-3.5 h-3.5" />
 </a>
 )}
 </div>
 </td>

 {/* 6. Acciones */}
 <td className="py-2.5 px-1.5 text-center w-[66px] shrink-0">
 <div className="flex items-center justify-center gap-1">
 <button
 type="button"
 onClick={() => abrirFichaDetalle(c)}
 title="Ver ficha 360°"
 className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => abrirEditar(c)}
 title="Editar obra y logística"
 className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>
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
 </div>
 )}

 {/* ═══════════════════════════════════════════════════════════════════════ */}
 {/* ─── PESTAÑA 3: PERSONAL AUTORIZADO (PADRÓN ANTI-FRAUDE EN MOSTRADOR) ─── */}
 {/* ═══════════════════════════════════════════════════════════════════════ */}
 {activeTab === 'autorizados' && (
 <div className="space-y-2.5 animate-in fade-in duration-200">
 {/* Banner de Seguridad Anti-Fraude */}
 <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 p-3 sm:p-3.5 rounded-2xl border border-indigo-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-600/30">
 <ShieldCheck className="w-4.5 h-4.5 stroke-[2.3]" />
 </div>
 <div className="min-w-0">
 <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight truncate">
 Padrón de Seguridad Anti-Fraude en Mostrador y Patio de Despacho
 </h4>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
 Valide el DNI de choferes, maestros de obra y estibadores antes de despachar fierro corrugado, cemento o herramientas a crédito.
 </p>
 </div>
 </div>
 <div className="hidden sm:flex items-center gap-2 shrink-0">
 <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 shadow-2xs ">
 Control de Retiro
 </span>
 </div>
 </div>

 {/* 4 KPIs de Seguridad de Despacho */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Personal Acreditado */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Personal Acreditado
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <UserCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 {metricasAutorizados.total}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Choferes & maestros
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Habilitados
 </span>
 </div>
 </div>

 {/* KPI 2: Con DNI Verificado */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Con DNI Verificado
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <ShieldCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {metricasAutorizados.conDni}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 8 dígitos validados
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 Anti-Fraude
 </span>
 </div>
 </div>

 {/* KPI 3: Contratistas con Padrón */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 Contratistas con Padrón
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <Building2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
 {metricasAutorizados.clientesConAcreditados}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Empresas con personal
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 Empresas
 </span>
 </div>
 </div>

 {/* KPI 4: Crédito Habilitado */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Crédito Habilitado
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <CreditCard className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {metricasAutorizados.clientesCreditoActivo}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Cuentas activas para fiar
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 Autorizado
 </span>
 </div>
 </div>
 </div>

 {/* Filtros de Personal Autorizado */}
 <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-1 flex-wrap">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
 Filtrar Roles:
 </span>
 {filtrosAutorizado.map((f) => (
 <button
 key={f.id}
 type="button"
 onClick={() => setFiltroCargoAutorizado(f.id)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
 filtroCargoAutorizado === f.id
 ? 'bg-indigo-600 text-white shadow-2xs font-black'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>
 <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
 {autorizadosFiltrados.length} {autorizadosFiltrados.length === 1 ? 'acreditado' : 'acreditados'}
 </span>
 </div>

 {/* Tabla de Personal Autorizado */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-all duration-300">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs table-fixed min-w-[720px] lg:min-w-0">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[10px] sm:text-[10.5px] uppercase tracking-wider select-none">
 <th className="py-2.5 px-2.5 font-bold w-[26%]">PERSONAL ACREDITADO</th>
 <th className="py-2.5 px-2 font-bold w-[14%]">DOCUMENTO DNI</th>
 <th className="py-2.5 px-2.5 font-bold w-[26%]">CONTRATISTA / EMPRESA TITULAR</th>
 <th className="py-2.5 px-2 font-bold w-[16%]">ESTADO CRÉDITO TITULAR</th>
 <th className="py-2.5 px-2 font-bold w-[18%]">CONTACTO VERIFICACIÓN</th>
 <th className="py-2.5 px-1.5 font-bold text-center w-[66px] shrink-0">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {cargando ? (
 <tr>
 <td colSpan="6" className="py-8 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-1.5">
 <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span className="font-medium text-xs">Cargando padrón de seguridad...</span>
 </div>
 </td>
 </tr>
 ) : autorizadosFiltrados.length === 0 ? (
 <tr>
 <td colSpan="6" className="py-10 text-center text-slate-400">
 <UserCheck className="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600 mb-1.5 stroke-1" />
 <p className="font-bold text-slate-600 dark:text-slate-300 text-xs">No se encontró personal acreditado con este filtro</p>
 <p className="text-[11px] text-slate-400 mt-0.5">
 Registra choferes y maestros autorizados en la sección "Seguridad en Mostrador" al crear o editar un cliente
 </p>
 </td>
 </tr>
 ) : (
 autorizadosFiltrados.map((item) => {
 const tieneDni = item.dni && item.dni.length === 8;
 const creditoActivo = item.cliente.estado_credito === 'Activo' && parseFloat(item.cliente.limite_credito || 0) > 0;
 const creditoBloqueado = item.cliente.estado_credito === 'Bloqueado';

 return (
 <tr
 key={item.id}
 className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
 >
 {/* 1. Personal Acreditado & Rol */}
 <td className="py-2.5 px-2.5 min-w-0">
 <div className="flex items-center gap-2 min-w-0">
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center font-bold text-xs shrink-0">
 <UserCheck className="w-3.5 h-3.5" />
 </div>
 <div className="min-w-0 truncate">
 <div className="font-bold text-slate-900 dark:text-white text-xs truncate" title={item.nombre}>
 {limpiarEmojis(item.nombre)}
 </div>
 <div className="mt-0.5">
 <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200/80 dark:border-indigo-800/60 truncate">
 {item.cargo}
 </span>
 </div>
 </div>
 </div>
 </td>

 {/* 2. Documento DNI */}
 <td className="py-2.5 px-2 min-w-0 font-mono">
 {tieneDni ? (
 <div className="flex items-center gap-1.5">
 <span className="font-black text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs">
 {item.dni}
 </span>
 <button
 type="button"
 onClick={() => copiarTexto(item.dni, 'DNI')}
 title="Copiar DNI"
 className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 transition-opacity cursor-pointer shrink-0"
 >
 <Copy className="w-3 h-3" />
 </button>
 </div>
 ) : (
 <span className="text-[10.5px] text-slate-400 italic">Sin DNI registrado</span>
 )}
 </td>

 {/* 3. Contratista / Titular */}
 <td className="py-2.5 px-2.5 min-w-0">
 <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" title={item.cliente.nombre}>
 {item.cliente.nombre}
 </div>
 <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-mono">
 <span>{item.cliente.tipo_documento}: {item.cliente.numero_documento || 'S/N'}</span>
 <span className="text-slate-300 dark:text-slate-600">•</span>
 <span className="truncate max-w-[120px]">{item.cliente.perfil_cliente}</span>
 </div>
 </td>

 {/* 4. Estado de Crédito del Titular */}
 <td className="py-2.5 px-2 min-w-0">
 {creditoActivo ? (
 <div>
 <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
 <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
 Habilitado
 </span>
 <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
 Línea: S/ {parseFloat(item.cliente.limite_credito).toFixed(2)}
 </div>
 </div>
 ) : creditoBloqueado ? (
 <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
 <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
 Bloqueado (Solo Contado)
 </span>
 ) : (
 <span className="text-[10.5px] text-slate-400 italic">Solo Contado</span>
 )}
 </td>

 {/* 5. Contacto para Verificación & WhatsApp */}
 <td className="py-2.5 px-2 min-w-0">
 <div className="flex items-center gap-1.5 min-w-0">
 <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 truncate">
 {item.cliente.telefono || item.cliente.telefono_obra || 'Sin teléfono'}
 </span>
 {(item.cliente.telefono || item.cliente.telefono_obra) && (
 <a
 href={`https://wa.me/51${(item.cliente.telefono || item.cliente.telefono_obra).replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, consultamos de Ferretería para verificar la autorización de retiro de mercadería para: ${item.nombre} (DNI ${item.dni || 'no especificado'}).`)}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-emerald-600 hover:text-emerald-700 transition-colors p-0.5 shrink-0"
 title="Verificar por WhatsApp con el contratista titular"
 >
 <MessageCircle className="w-3.5 h-3.5" />
 </a>
 )}
 </div>
 <div className="text-[9.5px] text-slate-400 mt-0.5 truncate">
 Titular de cuenta
 </div>
 </td>

 {/* 6. Acciones */}
 <td className="py-2.5 px-1.5 text-center w-[66px] shrink-0">
 <div className="flex items-center justify-center gap-1">
 <button
 type="button"
 onClick={() => abrirFichaDetalle(item.cliente)}
 title="Ver ficha 360° del contratista"
 className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => abrirEditar(item.cliente)}
 title="Editar acreditaciones del contratista"
 className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>
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
 </div>
 )}

 {/* ─── MODAL REGISTRAR / EDITAR CLIENTE MAYORISTA U OBRA (PORTAL CON CABECERA Y PIE FIJOS) ─── */}
 {modalAbierto && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 {/* Backdrop estático e independiente con blur profesional */}
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
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl sm:max-w-3xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 {/* ─── CABECERA FIJA (SHRINK-0 Z-20) ─── */}
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
 <HardHat className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 ">
 {clienteEditar ? 'Editar Cliente / Contratista' : 'Registrar Cliente Mayorista u Obra'}
 </h3>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
 Identidad SUNAT/RENIEC, seguridad en mostrador, logística de camiones y línea de crédito
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
 {/* CUERPO SCROLLEABLE INDEPENDIENTE */}
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 sm:p-6 space-y-4">

 {/* ── SECCIÓN 1: IDENTIDAD FISCAL & CONSULTA OFICIAL SUNAT / RENIEC ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Identidad Fiscal & Consulta Oficial
 </span>
 </div>
 <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full">
 SUNAT / RENIEC en 1 Clic
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
 {/* Tipo Documento (Píldora Desplegable estilo Compras) */}
 <div className="sm:col-span-4">
 <SelectorDesplegablePildora
 id="tipo_documento"
 label="Tipo Documento"
 required
 valor={formData.tipo_documento}
 opciones={OPCIONES_TIPO_DOC}
 onChange={(val) => setFormData(prev => ({ ...prev, tipo_documento: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 />
 </div>

 {/* N° Documento + Botón Consulta */}
 <div className="sm:col-span-8">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 N° Documento (RUC 11 dígitos / DNI 8 dígitos) <span className="text-rose-500">*</span>
 </label>
 <div className="flex items-center gap-1.5">
 <input
 type="text"
 maxLength={20}
 value={formData.numero_documento}
 onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value.replace(/\D/g, '') })}
 placeholder={formData.tipo_documento === 'RUC' ? 'Ej: 20608549123' : 'Ej: 45678912'}
 className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 <button
 type="button"
 onClick={consultarDocumento}
 disabled={consultandoSunat || !formData.numero_documento}
 className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
 title="Consultar datos oficiales en SUNAT o RENIEC"
 >
 {consultandoSunat ? (
 <>
 <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span>Consultando...</span>
 </>
 ) : (
 <>
 <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 <span>{formData.tipo_documento === 'RUC' ? 'SUNAT' : 'RENIEC'}</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>

 {/* Estado y Condición SUNAT (Badges informativos en vivo) */}
 <div className="grid grid-cols-2 gap-2 pt-0.5">
 <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
 <span className="text-[10px] text-slate-400 font-bold uppercase">Estado SUNAT:</span>
 <span className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
 formData.estado_sunat === 'ACTIVO'
 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
 : 'bg-rose-50 text-rose-700'
 }`}>
 {formData.estado_sunat || 'ACTIVO'}
 </span>
 </div>
 <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
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

 {/* Alerta si el contribuyente está NO HABIDO */}
 {formData.condicion_sunat === 'NO HABIDO' && (
 <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
 <span><strong>Atención SUNAT:</strong> El contribuyente figura como <strong>NO HABIDO</strong>. Sus facturas o guías de remisión pueden ser observadas tributariamente.</span>
 </div>
 )}

 {/* Razón Social / Nombre Completo */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Razón Social o Nombre Completo <span className="text-rose-500">*</span>
 </label>
 <input
 type="text"
 required
 value={formData.nombre}
 onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
 placeholder="Ej: Constructora San Martín S.A.C. / Mtro. Juan Carlos Pérez"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 {/* Dirección Fiscal / Domicilio Legal */}
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Dirección Fiscal / Domicilio Legal
 </label>
 <div className="relative">
 <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={formData.direccion}
 onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
 placeholder="Av. Las Magnolias 450, Urb. Los Laureles, Lima"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 </div>

 {/* Agente de Retención SUNAT (Constructoras / Grandes Empresas) */}
 <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={formData.agente_retencion}
 onChange={(e) => setFormData({ ...formData, agente_retencion: e.target.checked })}
 className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
 />
 <span>Cliente es Agente de Retención SUNAT (Grandes Constructoras)</span>
 </label>
 {formData.agente_retencion && (
 <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
 Retiene {formData.porcentaje_retencion || 3}% en facturas &gt; S/ 700
 </span>
 )}
 </div>
 <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
 Régimen oficial R.S. 037-2002/SUNAT: El cliente retendrá el 3% al cancelar facturas mayores a S/ 700 y emitirá Comprobante de Retención Electrónico (CRE).
 </p>
 </div>
 </div>

 {/* ── SECCIÓN 2: PERFIL COMERCIAL & TIPO DE TARIFA ASIGNADA ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center gap-2">
 <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Perfil Comercial & Política de Precios Asignada
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <SelectorDesplegablePildora
 id="perfil_cliente"
 label="Perfil Comercial"
 required
 valor={formData.perfil_cliente}
 opciones={OPCIONES_PERFIL_CLIENTE}
 onChange={(val) => setFormData(prev => ({ ...prev, perfil_cliente: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 />
 </div>

 <div>
 <SelectorDesplegablePildora
 id="tipo_precio"
 label="Tarifa Automática Asignada en POS"
 valor={formData.tipo_precio}
 opciones={OPCIONES_TIPO_PRECIO}
 onChange={(val) => setFormData(prev => ({ ...prev, tipo_precio: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 />
 </div>
 </div>

 <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex items-start gap-2">
 <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
 <p className="text-[10.5px] text-indigo-900 dark:text-indigo-300 leading-snug">
 Al seleccionar este cliente en el módulo de <strong>Ventas / Caja</strong>, el sistema cargará automáticamente la tarifa seleccionada para cada producto (cemento, fierro corrugado, áridos y tuberías).
 </p>
 </div>
 </div>

 {/* ── SECCIÓN 3: SEGURIDAD EN MOSTRADOR & PERSONAL AUTORIZADO (ANTI-FRAUDE) ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Personal Autorizado para Compras & Retiros a Crédito
 </span>
 </div>
 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
 Seguridad Anti-Fraude
 </span>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Nombres y DNI de Personal Autorizado (Choferes, Maestros de Obra, Compradores)
 </label>
 <textarea
 rows={2}
 value={formData.personal_autorizado}
 onChange={(e) => setFormData({ ...formData, personal_autorizado: e.target.value })}
 placeholder="Ej: Carlos Mendoza (DNI 44332211) - Chofer | Pedro Huamán (DNI 10203040) - Maestro Albañil"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
 />
 <span className="text-[10px] text-slate-400 mt-1 block">
 En caja y despacho de mostrador se validará la identidad antes de entregar materiales pesados a crédito.
 </span>
 </div>
 </div>

 {/* ── SECCIÓN 4: LOGÍSTICA DE OBRA & PUNTO DE DESCARGA (CAMIONES PESADOS) ── */}
 <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
 <span className="text-xs font-bold text-amber-900 dark:text-amber-300 ">
 Logística de Obra & Punto de Descarga de Materiales
 </span>
 </div>
 <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full">
 Despacho Pesado & Fletes
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Encargado / Residente en Obra
 </label>
 <input
 type="text"
 value={formData.contacto_obra}
 onChange={(e) => setFormData({ ...formData, contacto_obra: e.target.value })}
 placeholder="Ing. Residente / Maestro de Obra"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Teléfono de Coordinación en Obra
 </label>
 <div className="flex items-center gap-1.5">
 <input
 type="text"
 value={formData.telefono_obra}
 onChange={(e) => setFormData({ ...formData, telefono_obra: e.target.value })}
 placeholder="Celular para chofer / flete"
 className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
 />
 {formData.telefono_obra && (
 <a
 href={`https://wa.me/51${formData.telefono_obra.replace(/\D/g, '')}`}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
 title="Coordinar flete por WhatsApp"
 >
 <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
 <span className="hidden sm:inline">WhatsApp</span>
 </a>
 )}
 </div>
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Dirección Exacta de la Obra (Punto de Entrega para Volquetes / Plataforma)
 </label>
 <input
 type="text"
 value={formData.direccion_obra}
 onChange={(e) => setFormData({ ...formData, direccion_obra: e.target.value })}
 placeholder="Ej: Obra Condominio Las Palmeras, Lote 12 Mz. C, Puente Piedra (Frente a la losa deportiva)"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
 />
 </div>

 {/* Acceso Vehicular y Ubigeo SUNAT (6 dígitos GRE) */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <SelectorDesplegablePildora
 id="acceso_vehicular"
 label="Tipo de Acceso Vehicular a la Obra"
 valor={formData.acceso_vehicular}
 opciones={OPCIONES_ACCESO_VEHICULAR}
 onChange={(val) => setFormData(prev => ({ ...prev, acceso_vehicular: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Ubigeo SUNAT de la Obra (6 dígitos GRE)
 </label>
 <input
 type="text"
 maxLength={6}
 value={formData.ubigeo_obra}
 onChange={(e) => setFormData({ ...formData, ubigeo_obra: e.target.value.replace(/\D/g, '') })}
 placeholder="Ej: 150132 (San Juan de Lurigancho)"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-hidden focus:border-amber-500"
 />
 </div>
 </div>

 {/* Horario de Descarga y Check de Estiba */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Horario Permitido de Descarga
 </label>
 <input
 type="text"
 value={formData.horario_descarga}
 onChange={(e) => setFormData({ ...formData, horario_descarga: e.target.value })}
 placeholder="Ej: Lun-Vie 8:00 AM - 1:00 PM (Evitar hora punta)"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-amber-500"
 />
 </div>

 <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-between">
 <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={formData.requiere_estiba}
 onChange={(e) => setFormData({ ...formData, requiere_estiba: e.target.checked })}
 className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
 />
 <span>¿Requiere cuadrilla de estibadores para descarga?</span>
 </label>
 </div>
 </div>
 </div>

 {/* ── SECCIÓN 5: LÍNEA DE CRÉDITO & CONDICIONES FINANCIERAS ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Línea de Crédito & Finanzas Comerciales
 </span>
 </div>
 <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
 Cuentas por Cobrar
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Límite de Crédito (S/)
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">S/</span>
 <input
 type="number"
 min="0"
 step="100"
 value={formData.limite_credito}
 onChange={(e) => setFormData({ ...formData, limite_credito: parseFloat(e.target.value) || 0 })}
 placeholder="3000"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">0 = Solo ventas al contado</span>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Días de Plazo de Pago
 </label>
 <input
 type="number"
 min="1"
 max="180"
 value={formData.dias_credito}
 onChange={(e) => setFormData({ ...formData, dias_credito: parseInt(e.target.value) || 15 })}
 placeholder="15"
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 <span className="text-[9.5px] text-slate-400 mt-0.5 block">Plazo usual para liquidación</span>
 </div>

 <div>
 <SelectorDesplegablePildora
 id="estado_credito"
 label="Estado de la Línea"
 valor={formData.estado_credito}
 opciones={OPCIONES_ESTADO_CREDITO}
 onChange={(val) => setFormData(prev => ({ ...prev, estado_credito: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 subtituloAyuda="Permite o restringe ventas"
 />
 </div>
 </div>

 {/* Día Habitual de Liquidación y Método de Pago Frecuente */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
 <div>
 <SelectorDesplegablePildora
 id="dia_pago_preferido"
 label="Día Habitual de Liquidación"
 valor={formData.dia_pago_preferido}
 opciones={OPCIONES_DIA_PAGO}
 onChange={(val) => setFormData(prev => ({ ...prev, dia_pago_preferido: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 />
 </div>

 <div>
 <SelectorDesplegablePildora
 id="metodo_pago_habitual"
 label="Método de Pago Frecuente"
 valor={formData.metodo_pago_habitual}
 opciones={OPCIONES_METODO_PAGO}
 onChange={(val) => setFormData(prev => ({ ...prev, metodo_pago_habitual: val }))}
 desplegableActivo={desplegableActivo}
 setDesplegableActivo={setDesplegableActivo}
 />
 </div>
 </div>
 </div>

 {/* ── SECCIÓN 6: CONTACTO ADMINISTRATIVO & NOTAS INTERNAS ── */}
 <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center gap-2">
 <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
 <span className="text-xs font-bold text-slate-800 dark:text-white ">
 Contacto Administrativo & Notas Internas
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Teléfono / WhatsApp Principal
 </label>
 <div className="flex items-center gap-1.5">
 <div className="relative flex-1">
 <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={formData.telefono}
 onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
 placeholder="Ej: 999 888 777"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 {formData.telefono && (
 <a
 href={`https://wa.me/51${formData.telefono.replace(/\D/g, '')}`}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
 title="Chatear por WhatsApp"
 >
 <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
 <span className="hidden sm:inline">WhatsApp</span>
 </a>
 )}
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Correo para Facturas y Cotizaciones (PDF)
 </label>
 <div className="relative">
 <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="email"
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="administracion@constructora.pe"
 className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Notas u Observaciones Comerciales Internas (Confidencial en Caja / Ventas)
 </label>
 <textarea
 rows={2}
 value={formData.observaciones}
 onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
 placeholder="Ej: Exigir sello de almacén central en cada guía. Cliente VIP de fierro y cemento."
 className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
 />
 </div>
 </div>

 </div>

 {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
 <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex items-center justify-between shrink-0 z-20">
 <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
 <span className="text-rose-500 font-bold">*</span> Campos obligatorios para comprobantes, fletes y guías GRE
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
 <button
 type="button"
 onClick={() => setModalAbierto(false)}
 className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={guardando}
 className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
 >
 {guardando ? (
 <>
 <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span>Guardando...</span>
 </>
 ) : (
 <>
 <CheckCircle2 className="w-4 h-4" />
 <span>{clienteEditar ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
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

 {/* ─── MODAL FICHA COMERCIAL 360° DEL CLIENTE (PORTAL CON CABECERA Y PIE FIJOS) ─── */}
 {modalDetalle && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
 onClick={() => setModalDetalle(null)}
 aria-hidden="true"
 />
 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
 onClick={() => setModalDetalle(null)}
 >
 <div
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Cabecera Fija */}
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/80 dark:border-indigo-800/80 shrink-0">
 <Building2 className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-1.5">
 <span className="px-2 py-0.2 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
 {modalDetalle.perfil_cliente || 'CLIENTE MAYORISTA'}
 </span>
 {modalDetalle.agente_retencion && (
 <span className="px-2 py-0.2 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
 Agente Retención 3%
 </span>
 )}
 </div>
 <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
 {modalDetalle.nombre}
 </h3>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-mono">
 {modalDetalle.tipo_documento}: {modalDetalle.numero_documento || 'No registrado'} • {modalDetalle.estado_sunat || 'ACTIVO'} ({modalDetalle.condicion_sunat || 'HABIDO'})
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalDetalle(null)}
 className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation"
 title="Cerrar ficha"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Cuerpo scrolleable */}
 <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 sm:p-6 space-y-4">
 {/* Resumen Financiero y de Obra */}
 <div className="grid grid-cols-3 gap-2.5 text-center">
 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
 <span className="text-[10px] font-bold text-slate-400 block uppercase">LÍNEA CRÉDITO</span>
 <span className="text-sm sm:text-base font-black text-slate-800 dark:text-white ">
 S/ {parseFloat(modalDetalle.limite_credito || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
 </span>
 </div>
 <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200/80 dark:border-rose-900/40">
 <span className="text-[10px] font-bold text-rose-500 block uppercase">DEUDA PENDIENTE</span>
 <span className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-400 ">
 S/ {parseFloat(modalDetalle.deuda_total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
 </span>
 </div>
 <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40">
 <span className="text-[10px] font-bold text-emerald-600 block uppercase">DISPONIBLE</span>
 <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400 ">
 S/ {parseFloat(modalDetalle.credito_disponible || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
 </span>
 </div>
 </div>

 {/* Personal Autorizado para Retiro */}
 {modalDetalle.personal_autorizado && (
 <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 text-xs space-y-1">
 <div className="flex items-center gap-1.5">
 <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 <span className="font-bold text-indigo-900 dark:text-indigo-300 uppercase text-[10.5px]">PERSONAL AUTORIZADO A RETIRAR A CRÉDITO:</span>
 </div>
 <div className="text-slate-800 dark:text-slate-200 font-medium">
 {modalDetalle.personal_autorizado}
 </div>
 </div>
 )}

 {/* Datos de Despacho a Obra */}
 <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-1.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
 <span className="font-bold text-amber-900 dark:text-amber-300 uppercase text-[10.5px]">LOGÍSTICA DE OBRA & DESPACHO:</span>
 </div>
 {modalDetalle.telefono_obra && (
 <a
 href={`https://wa.me/51${modalDetalle.telefono_obra.replace(/\D/g, '')}`}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1"
 >
 <MessageCircle className="w-3 h-3 text-emerald-600" />
 <span>WhatsApp Obra</span>
 </a>
 )}
 </div>
 <div className="text-slate-800 dark:text-slate-100 font-semibold">{modalDetalle.direccion_obra || 'Sin obra específica asignada'}</div>
 <div className="text-slate-500 dark:text-slate-400 text-[11px]">
 Contacto: <strong className="text-slate-700 dark:text-slate-200">{modalDetalle.contacto_obra || '---'}</strong> • Celular: <strong className="text-slate-700 dark:text-slate-200">{modalDetalle.telefono_obra || modalDetalle.telefono || '---'}</strong>
 </div>
 <div className="flex flex-wrap items-center gap-2 pt-1">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
 Acceso: {modalDetalle.acceso_vehicular || 'Camión Mediano'}
 </span>
 {modalDetalle.ubigeo_obra && (
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
 Ubigeo GRE: {modalDetalle.ubigeo_obra}
 </span>
 )}
 {modalDetalle.requiere_estiba && (
 <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
 Requiere Estibadores
 </span>
 )}
 </div>
 </div>

 {/* Condiciones Comerciales */}
 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
 <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] block">CONDICIONES COMERCIALES & LIQUIDACIÓN:</span>
 <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
 <div>
 <span className="text-slate-400 block">Día Habitual de Pago:</span>
 <strong className="text-slate-800 dark:text-slate-200">{modalDetalle.dia_pago_preferido || 'Sábados Quincenales'}</strong>
 </div>
 <div>
 <span className="text-slate-400 block">Método de Pago:</span>
 <strong className="text-slate-800 dark:text-slate-200">{modalDetalle.metodo_pago_habitual || 'Transferencia BCP / BBVA'}</strong>
 </div>
 </div>
 {modalDetalle.observaciones && (
 <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 italic">
 "{modalDetalle.observaciones}"
 </div>
 )}
 </div>

 {/* Últimas Ventas / Comprobantes */}
 <div>
 <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2 ">
 Últimos Comprobantes Emitidos
 </span>
 <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
 <tr>
 <th className="py-2 px-3">COMPROBANTE</th>
 <th className="py-2 px-3">FECHA</th>
 <th className="py-2 px-3 text-right">TOTAL</th>
 <th className="py-2 px-3 text-center">ESTADO</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {modalDetalle.ventas?.length ? (
 modalDetalle.ventas.map((v) => (
 <tr key={v.id}>
 <td className="py-1.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
 {v.tipo_comprobante} {v.serie}-{v.numero}
 </td>
 <td className="py-1.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
 {new Date(v.created_at).toLocaleDateString()}
 </td>
 <td className="py-1.5 px-3 text-right font-black text-slate-800 dark:text-slate-100 text-xs">
 S/ {parseFloat(v.total).toFixed(2)}
 </td>
 <td className="py-1.5 px-3 text-center">
 <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
 {v.estado}
 </span>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan="4" className="py-4 text-center text-slate-400 text-[11px]">
 No registra comprobantes recientes
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Pie Fijo */}
 <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex justify-end shrink-0 z-20">
 <button
 type="button"
 onClick={() => setModalDetalle(null)}
 className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
 >
 Cerrar Ficha
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
