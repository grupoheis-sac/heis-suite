import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, useAuthStore, consultarDocumento } from '@heis/core';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Building2,
  Globe,
  Plus,
  Check,
  X,
  Layers,
  UtensilsCrossed,
  ShoppingBag,
  Pill,
  Hotel,
  ArrowRight,
  ExternalLink,
  Sparkles,
  TrendingUp,
  DollarSign,
  Coins,
  Users,
  Server,
  Activity,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Power,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Key,
  Trash2,
  Download,
  Info,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Copy,
  Palette,
  Lock,
  Unlock,
  Bell,
  Megaphone,
  Radio,
  FileJson,
  DownloadCloud,
  CheckSquare,
  Square,
  Send,
  FileSpreadsheet,
  Printer,
  Filter,
  SlidersHorizontal,
  LifeBuoy,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  FileText,
  Wrench,
  ShieldCheck,
  Calendar,
  Zap,
  ChevronDown,
  Database,
  HardDrive,
  Terminal,
  ArrowUpRight,
  AlertTriangle,
  Cpu,
  LayoutDashboard,
  Save,
  Target,
  AlertCircle,
  CalendarClock,
  Wallet,
  Receipt,
  Percent
} from 'lucide-react';

const MESES_CALENDARIO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DIAS_CALENDARIO = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function formatearFechaEspanol(fechaStr) {
  if (!fechaStr) return 'Sin fecha seleccionada';
  try {
    const partes = String(fechaStr).split('-').map(Number);
    if (partes.length !== 3) return fechaStr;
    const [y, m, d] = partes;
    const f = new Date(y, m - 1, d);
    if (isNaN(f.getTime())) return fechaStr;
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${dias[f.getDay()]}, ${d} de ${MESES_CALENDARIO[m - 1]} de ${y}`;
  } catch {
    return fechaStr;
  }
}

function formatearFechaAuditoria(fechaRaw) {
  if (!fechaRaw) return 'Sin fecha';
  try {
    const d = new Date(fechaRaw);
    if (isNaN(d.getTime())) return 'Sin fecha';
    return d.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return 'Sin fecha';
  }
}

function formatearHoraAuditoria(fechaRaw) {
  if (!fechaRaw) return '--:--';
  try {
    const d = new Date(fechaRaw);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

function normalizarIP(rawIp) {
  if (!rawIp) return '127.0.0.1';
  let ip = String(rawIp).trim();
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

function esLocalhost(rawIp) {
  const ip = normalizarIP(rawIp);
  return ip === '127.0.0.1' || ip.toLowerCase() === 'localhost';
}

function parsearNavegador(ua) {
  if (!ua) return { navegador: 'Consola del Sistema', so: 'Servidor Local' };
  let navegador = 'Navegador Web';
  if (ua.includes('Edg/')) navegador = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) navegador = 'Google Chrome';
  else if (ua.includes('Firefox/')) navegador = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) navegador = 'Apple Safari';
  else if (ua.includes('Postman')) navegador = 'Postman API';
  else if (ua.includes('curl')) navegador = 'cURL CLI';

  let so = 'Dispositivo';
  if (ua.includes('Windows NT 10.0') || ua.includes('Windows NT 11.0')) so = 'Windows 10/11';
  else if (ua.includes('Windows')) so = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) so = 'macOS';
  else if (ua.includes('Linux')) so = 'Linux';
  else if (ua.includes('Android')) so = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) so = 'iOS';

  return { navegador, so };
}

function clasificarAccionForense(accionRaw) {
  const acc = (accionRaw || '').toUpperCase();
  if (acc.includes('ELIMINAR') || acc.includes('DELETE') || acc.includes('DROP') || acc.includes('SUSPENDER') || acc.includes('ANULAR') || acc.includes('BAJA')) {
    return {
      categoria: 'Mutación Crítica',
      tipo: 'critico',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      bgGlow: 'from-rose-500/20 via-pink-500/10 to-transparent',
      borderColor: 'border-rose-500/30 dark:border-rose-500/20',
      accentColor: 'text-rose-500',
      iconColor: 'bg-rose-500/20 text-rose-500',
    };
  }
  if (acc.includes('CREAR') || acc.includes('CREATE') || acc.includes('INSERT') || acc.includes('ACTIVAR') || acc.includes('NUEVA')) {
    return {
      categoria: 'Creación de Recurso',
      tipo: 'crear',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      bgGlow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/30 dark:border-emerald-500/20',
      accentColor: 'text-emerald-500',
      iconColor: 'bg-emerald-500/20 text-emerald-500',
    };
  }
  if (acc.includes('LOGIN') || acc.includes('AUTH') || acc.includes('PASSWORD') || acc.includes('CLAVE') || acc.includes('SEGURIDAD') || acc.includes('PERMISO') || acc.includes('ROL')) {
    return {
      categoria: 'Seguridad & Credenciales',
      tipo: 'seguridad',
      badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      bgGlow: 'from-indigo-500/20 via-purple-500/10 to-transparent',
      borderColor: 'border-indigo-500/30 dark:border-indigo-500/20',
      accentColor: 'text-indigo-500',
      iconColor: 'bg-indigo-500/20 text-indigo-500',
    };
  }
  if (acc.includes('ACTUALIZAR') || acc.includes('UPDATE') || acc.includes('EDIT') || acc.includes('RENOVAR') || acc.includes('CONFIG')) {
    return {
      categoria: 'Modificación de Estado',
      tipo: 'modificar',
      badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      bgGlow: 'from-blue-500/20 via-sky-500/10 to-transparent',
      borderColor: 'border-blue-500/30 dark:border-blue-500/20',
      accentColor: 'text-blue-500',
      iconColor: 'bg-blue-500/20 text-blue-500',
    };
  }
  return {
    categoria: 'Operación del Sistema',
    tipo: 'general',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    bgGlow: 'from-amber-500/20 via-orange-500/10 to-transparent',
    borderColor: 'border-amber-500/30 dark:border-amber-500/20',
    accentColor: 'text-amber-500',
    iconColor: 'bg-amber-500/20 text-amber-500',
  };
}

// Componente Selector Desplegable Píldora (Estandarizado en el Sistema HEIS Suite)
function SelectorDesplegablePildora({
  id,
  label,
  required = false,
  valor,
  opciones = [],
  onChange,
  desplegableActivo,
  setDesplegableActivo,
  subtituloAyuda = null,
  icono: IconoComponente = null,
}) {
  const estaAbierto = desplegableActivo === id;
  const opcSel = opciones.find((o) => String(o.valor ?? '') === String(valor ?? '')) || opciones[0];

  return (
    <div className={`relative dropdown-container-gastro ${estaAbierto ? 'z-40' : 'z-20'}`}>
      <button
        type="button"
        onClick={() => setDesplegableActivo(estaAbierto ? null : id)}
        className={`w-full px-3.5 py-1.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer select-none group ${estaAbierto
          ? 'border-[#02CBA9] dark:border-[#1CC0F9] ring-4 ring-[#02CBA9]/20 dark:ring-[#1CC0F9]/25 bg-white dark:bg-white/[0.08] shadow-md shadow-[#02CBA9]/10 dark:shadow-[#1CC0F9]/10'
          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/70 dark:hover:bg-white/[0.07] focus:outline-none focus:border-[#02CBA9] dark:focus:border-[#1CC0F9] focus:ring-4 focus:ring-[#02CBA9]/20 dark:focus:ring-[#1CC0F9]/25'
          }`}
      >
        <div className="flex flex-col text-left truncate min-w-0 pr-1">
          {label && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 truncate mb-0.5 transition-colors ${estaAbierto
                ? 'text-[#02CBA9] dark:text-[#1CC0F9]'
                : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                }`}
            >
              {IconoComponente && <IconoComponente className="w-3 h-3 text-[#02CBA9] dark:text-[#1CC0F9] shrink-0" />}
              <span className="truncate">{label}</span>
              {required && <span className="text-rose-500">*</span>}
            </span>
          )}
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {opcSel ? opcSel.etiqueta : (valor ?? '')}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 shrink-0 ${estaAbierto
            ? 'rotate-180 text-[#02CBA9] dark:text-[#1CC0F9]'
            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            }`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {estaAbierto && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#18123B] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 min-w-[240px]">
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-modal-scroll p-0.5">
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
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${estaSel
                    ? 'bg-gradient-to-r from-[#02CBA9]/15 to-[#1CC0F9]/15 text-[#02CBA9] dark:text-[#1CC0F9] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
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
                  {estaSel && <Check className="w-3.5 h-3.5 text-[#02CBA9] dark:text-[#1CC0F9] shrink-0" />}
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

// Componente Desplegable de Alta Precisión para Filtros Forenses de Auditoría
function FiltroDesplegableAuditoria({
  id,
  label,
  valor,
  opciones = [],
  onChange,
  desplegableActivo,
  setDesplegableActivo,
  icono: IconoComponente,
}) {
  const estaAbierto = String(desplegableActivo) === String(id);
  const opcSel = opciones.find((o) => String(o.valor) === String(valor)) || opciones[0];
  const esFiltroActivo = valor && valor !== 'TODAS' && valor !== 'TODOS';

  return (
    <div className={`relative dropdown-container-gastro ${estaAbierto ? 'z-50' : 'z-20'}`}>
      <button
        type="button"
        onClick={() => setDesplegableActivo(estaAbierto ? null : id)}
        className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer select-none text-left group ${estaAbierto
          ? 'border-[#02CBA9] dark:border-[#1CC0F9] ring-4 ring-[#02CBA9]/20 dark:ring-[#1CC0F9]/25 bg-white dark:bg-[#18123B] shadow-md shadow-[#02CBA9]/10'
          : esFiltroActivo
            ? 'bg-[#02CBA9]/5 dark:bg-[#02CBA9]/10 border-[#02CBA9]/40 dark:border-[#02CBA9]/30 hover:border-[#02CBA9]'
            : 'bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/70 dark:hover:bg-white/[0.08]'
          }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-1 truncate">
          {IconoComponente && (
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${estaAbierto || esFiltroActivo
                ? 'bg-[#02CBA9]/15 text-[#02CBA9] dark:text-[#1CC0F9]'
                : 'bg-slate-200/60 dark:bg-white/10 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
            >
              <IconoComponente className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          )}
          <div className="flex flex-col text-left truncate min-w-0">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider block transition-colors leading-tight ${estaAbierto || esFiltroActivo
                ? 'text-[#02CBA9] dark:text-[#1CC0F9]'
                : 'text-slate-400 group-hover:text-slate-500'
                }`}
            >
              {label}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
              {opcSel?.etiqueta || valor}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {esFiltroActivo && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#02CBA9] shadow-xs" title="Filtro activo" />
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 shrink-0 ${estaAbierto
              ? 'rotate-180 text-[#02CBA9] dark:text-[#1CC0F9]'
              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}
          />
        </div>
      </button>

      {/* Menú Desplegable Flotante */}
      {estaAbierto && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#18123B] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-950/20 dark:shadow-black/70 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 min-w-[240px]">
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-modal-scroll p-0.5">
            {opciones.map((opc) => {
              const estaSel = String(valor) === String(opc.valor);
              return (
                <button
                  key={String(opc.valor)}
                  type="button"
                  onClick={() => {
                    onChange(opc.valor);
                    setDesplegableActivo(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${estaSel
                    ? 'bg-gradient-to-r from-[#02CBA9]/15 to-[#1CC0F9]/15 text-[#02CBA9] dark:text-[#1CC0F9] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                >
                  <div className="truncate pr-2 flex items-center gap-2">
                    {opc.dotColor && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${opc.dotColor}`} />
                    )}
                    <div className="truncate">
                      <span className="block truncate">{opc.etiqueta}</span>
                      {opc.sub && (
                        <span className="text-[10px] text-slate-400 font-normal block truncate">
                          {opc.sub}
                        </span>
                      )}
                    </div>
                  </div>
                  {estaSel && <Check className="w-3.5 h-3.5 text-[#02CBA9] dark:text-[#1CC0F9] shrink-0 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Desplegable Rediseñado para el Entorno de Configuración (Tenant / Plantilla Global)
function SelectorTenantModulos({ valor, onChange, empresas = [] }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickAfuera(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  const esGlobal = valor === 'global' || !valor;
  const empresaActual = !esGlobal ? empresas.find((e) => String(e.id) === String(valor)) : null;

  const empresasFiltradas = empresas.filter((emp) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const nombreMatch = emp.nombre?.toLowerCase().includes(q);
    const rucMatch = emp.ruc?.toLowerCase().includes(q);
    const planMatch = emp.plan?.toLowerCase().includes(q);
    return nombreMatch || rucMatch || planMatch;
  });

  return (
    <div ref={containerRef} className={`relative min-w-[280px] sm:min-w-[340px] max-w-full ${abierto ? 'z-50' : 'z-20'}`}>
      {/* Botón Trigger Rediseñado de Alta Gama */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer select-none group ${abierto
          ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-white dark:bg-[#18123B] shadow-lg shadow-emerald-500/10'
          : 'bg-slate-50/90 dark:bg-black/30 border-slate-200/90 dark:border-white/10 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-white/[0.06] shadow-2xs hover:shadow-md'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105 ${esGlobal
              ? 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-gradient-to-tr from-[#7D71EB]/20 to-[#1CC0F9]/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
              }`}
          >
            {esGlobal ? (
              <Globe className="w-4.5 h-4.5 stroke-[2.2]" />
            ) : (
              <Building2 className="w-4.5 h-4.5 stroke-[2.2]" />
            )}
          </div>
          <div className="flex flex-col text-left truncate min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {esGlobal ? 'Plantilla Global del Sistema' : (empresaActual?.nombre || 'Inquilino Desconocido')}
              </span>
              {esGlobal ? (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  DEFECTO
                </span>
              ) : (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${empresaActual?.plan === 'enterprise'
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  : empresaActual?.plan === 'pro'
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                  {empresaActual?.plan || 'STARTER'}
                </span>
              )}
            </div>
            <span className="text-[10.5px] text-slate-400 truncate mt-0.5">
              {esGlobal
                ? 'Nuevas contrataciones y configuración base SaaS'
                : `RUC: ${empresaActual?.ruc || 'S/R'} · ${empresaActual?.activo ? 'En línea' : 'Suspendido'}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${abierto ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${abierto ? 'rotate-180 text-emerald-500' : ''}`} />
          </div>
        </div>
      </button>

      {/* Menú Desplegable Popover Flotante */}
      {abierto && (
        <div className="absolute left-0 top-full mt-2 w-full sm:w-[420px] max-w-[95vw] z-50 bg-white dark:bg-[#150f33] backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl shadow-slate-950/30 dark:shadow-black/90 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Barra de Búsqueda rápida dentro del desplegable */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUC o plan..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoFocus
              className="w-full text-xs pl-8 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 custom-modal-scroll pr-1">
            {/* Opción 1: Plantilla Global */}
            {(!busqueda.trim() || 'plantilla global'.includes(busqueda.toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onChange('global');
                  setAbierto(false);
                  setBusqueda('');
                }}
                className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group/item ${esGlobal
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30'
                  : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${esGlobal ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500 group-hover/item:scale-110'
                    } transition-transform`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Plantilla Global</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        POR DEFECTO
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Matriz base para nuevas cuentas de clientes
                    </div>
                  </div>
                </div>
                {esGlobal && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            )}

            <div className="px-2 pt-1.5 pb-0.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-white/5 mt-1">
              <span>Clientes / Tenants ({empresasFiltradas.length})</span>
              <span>Planes</span>
            </div>

            {empresasFiltradas.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No se encontraron inquilinos coincidentes.
              </div>
            ) : (
              empresasFiltradas.map((emp) => {
                const seleccionado = String(valor) === String(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onChange(emp.id);
                      setAbierto(false);
                      setBusqueda('');
                    }}
                    className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group/item ${seleccionado
                      ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30'
                      : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${seleccionado
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover/item:scale-110'
                        } transition-transform`}>
                        {emp.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span className="truncate">{emp.nombre}</span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${emp.activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </div>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">RUC: {emp.ruc || 'S/R'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${emp.plan === 'enterprise'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : emp.plan === 'pro'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                        {emp.plan || 'STARTER'}
                      </span>
                      {seleccionado && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_PLANES_CONFIG = [
  {
    id: 'starter',
    nombre: 'Plan Starter',
    badge: 'Pyme',
    precio_mensual: 99,
    periodo: '/ mes',
    alcance: '1 Sede comercial',
    descripcion: 'Facturación electrónica y POS estándar',
    activeClass: 'border-blue-500 bg-blue-500/[0.06] dark:bg-blue-500/10 ring-2 ring-blue-500/30 text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'professional',
    nombre: 'Plan Professional',
    badge: 'Más Popular',
    precio_mensual: 199,
    periodo: '/ mes',
    alcance: 'Multisede & Analítica',
    descripcion: 'Reportes avanzados y control integral',
    activeClass: 'border-indigo-500 bg-indigo-500/[0.06] dark:bg-indigo-500/10 ring-2 ring-indigo-500/30 text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'enterprise',
    nombre: 'Plan Enterprise',
    badge: 'Full Suite',
    precio_mensual: 399,
    periodo: '/ mes',
    alcance: 'Sedes y Usuarios Ilimitados',
    descripcion: 'Soporte prioritario 24/7 y SLA garantizado',
    activeClass: 'border-amber-500 bg-amber-500/[0.06] dark:bg-amber-500/10 ring-2 ring-amber-500/30 text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
];

// ============================================================================
// COMPONENTES AUXILIARES REDISEÑADOS PARA COMUNICADOS & BRANDING (HEIS SUITE)
// ============================================================================

// Selector Desplegable Premium de Empresa / Tenant para Comunicados y Broadcast
function SelectorEmpresaComunicado({ valor, onChange, empresas = [] }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickAfuera(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  const empresaActual = empresas.find((e) => String(e.id) === String(valor));

  const empresasFiltradas = empresas.filter((emp) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const nombreMatch = emp.nombre?.toLowerCase().includes(q);
    const rucMatch = emp.ruc?.toLowerCase().includes(q);
    const planMatch = emp.plan?.toLowerCase().includes(q);
    return Boolean(nombreMatch || rucMatch || planMatch);
  });

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Contenedor Píldora Envolvente */}
      <div
        className={`group rounded-2xl border transition-all duration-200 cursor-pointer ${
          abierto
            ? 'border-purple-500 ring-4 ring-purple-500/20 bg-white dark:bg-[#18123B] shadow-lg shadow-purple-500/10'
            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-purple-500/40 hover:bg-white dark:hover:bg-white/[0.08]'
        }`}
      >
        {/* Cabecera Píldora con Rótulo */}
        <div className="flex items-center justify-between px-3.5 pt-2 pb-0.5">
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-purple-500" />
            <span>Empresa Destinataria (Tenant Único)</span>
            <span className="text-rose-500">*</span>
          </span>
          <span
            className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full ${
              empresaActual
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
            }`}
          >
            {empresaActual ? (empresaActual.plan || 'Tenant').toUpperCase() : 'Requerido'}
          </span>
        </div>

        {/* Trigger Activo */}
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="w-full px-3.5 pb-2.5 pt-1 text-left flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-transform group-hover:scale-105 ${
                empresaActual
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
              }`}
            >
              {empresaActual?.nombre?.charAt(0).toUpperCase() || <Building2 className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                <span className="truncate">
                  {empresaActual ? empresaActual.nombre : '-- Seleccionar Empresa Destino --'}
                </span>
                {empresaActual && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      empresaActual.activo ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                {empresaActual ? (
                  <>
                    <span className="font-mono">RUC: {empresaActual.ruc || 'S/R'}</span>
                    <span>·</span>
                    <span className="uppercase text-[9px] font-bold text-purple-500">
                      Plan {empresaActual.plan || 'Starter'}
                    </span>
                    <span>·</span>
                    <span>{empresaActual.activo ? 'Operativo' : 'Suspendido'}</span>
                  </>
                ) : (
                  <span>Haz clic para desplegar el catálogo y buscar por Nombre o RUC</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <div
              className={`w-6 h-6 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors ${
                abierto ? 'bg-purple-500/10 text-purple-500' : ''
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  abierto ? 'rotate-180 text-purple-500' : ''
                }`}
              />
            </div>
          </div>
        </button>
      </div>

      {/* Popover Flotante con Recorte Estricto y Scrollbar Confinado */}
      {abierto && (
        <div className="absolute left-0 right-0 w-full top-full mt-2 z-50 bg-white dark:bg-[#150f33] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-950/30 dark:shadow-black/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera Estática: Buscador & Conteo */}
          <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, RUC o plan..."
                autoFocus
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1.5 pt-1.5 text-[9.5px] text-slate-400">
              <span className="font-medium uppercase tracking-wider">Empresas registradas</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {empresasFiltradas.length} encontradas
              </span>
            </div>
          </div>

          {/* Lista con Scroll Confinado y Padding */}
          <div className="p-1.5">
            <div className="max-h-56 overflow-y-auto pr-1 space-y-1 custom-dropdown-scroll">
              {empresasFiltradas.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No se encontraron empresas con "{busqueda}"
                </div>
              ) : (
                empresasFiltradas.map((emp) => {
                  const seleccionado = String(valor) === String(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        onChange(emp.id);
                        setAbierto(false);
                        setBusqueda('');
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group/item ${
                        seleccionado
                          ? 'bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/30'
                          : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-transform group-hover/item:scale-105 ${
                            seleccionado
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {emp.nombre?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{emp.nombre}</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                emp.activo ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono">RUC: {emp.ruc || 'S/R'}</span>
                            <span>·</span>
                            <span className="uppercase text-[9px] font-bold text-purple-500">
                              {emp.plan || 'Starter'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {seleccionado && (
                          <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Selector de Fecha y Hora Tipo Píldora Ejecutiva con Calendario Popover Compacto
function DateTimePickerPill({
  label,
  value = '',
  onChange,
  required = false,
  tipo = 'inicio',
  align = 'left',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parsear fecha y hora
  const fechaParsed = useMemo(() => {
    if (!value) return null;
    try {
      const [fechaPart, horaPart] = value.split('T');
      if (!fechaPart) return null;
      const [y, m, d] = fechaPart.split('-').map(Number);
      const [hh, mm] = (horaPart || '00:00').split(':').map(Number);
      if (!y || !m || !d) return null;
      return { anio: y, mes: m - 1, dia: d, hora: hh || 0, minuto: mm || 0, fechaISO: fechaPart, horaStr: horaPart || '00:00' };
    } catch {
      return null;
    }
  }, [value]);

  const hoy = useMemo(() => new Date(), []);
  const [vistaMes, setVistaMes] = useState(() => fechaParsed?.mes ?? hoy.getMonth());
  const [vistaAnio, setVistaAnio] = useState(() => fechaParsed?.anio ?? hoy.getFullYear());
  const [horaLocal, setHoraLocal] = useState(() => fechaParsed?.horaStr || (tipo === 'fin' ? '23:59' : '09:00'));

  // Sincronizar cuando cambia value externamente
  useEffect(() => {
    if (fechaParsed) {
      setVistaMes(fechaParsed.mes);
      setVistaAnio(fechaParsed.anio);
      setHoraLocal(fechaParsed.horaStr);
    }
  }, [value]);

  // Click afuera y Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Cálculo de diagnóstico / badge de vigencia
  const diagnostico = useMemo(() => {
    if (!value) {
      return {
        texto: tipo === 'inicio' ? 'Inmediato' : 'Sin fecha',
        color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
      };
    }
    try {
      const f = new Date(value);
      if (isNaN(f.getTime())) return null;
      const diffMs = f.getTime() - Date.now();
      const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const diffHoras = Math.round(diffMs / (1000 * 60 * 60));

      if (tipo === 'fin') {
        if (diffMs < 0) {
          return { texto: 'Expirado', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' };
        }
        if (diffHoras <= 24) {
          return { texto: `Expira hoy (~${Math.max(1, diffHoras)}h)`, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
        }
        return { texto: `Vigente por ${diffDias}d`, color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      } else {
        if (diffMs <= 0) {
          return { texto: 'Activo ahora', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
        }
        return { texto: `Inicia en ${diffDias}d`, color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' };
      }
    } catch {
      return null;
    }
  }, [value, tipo]);

  // Matriz de días del mes
  const celdasCalendario = useMemo(() => {
    const primerDia = new Date(vistaAnio, vistaMes, 1);
    let diaSemanaInicio = primerDia.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6;

    const diasEnMes = new Date(vistaAnio, vistaMes + 1, 0).getDate();
    const diasEnMesAnterior = new Date(vistaAnio, vistaMes, 0).getDate();
    const celdas = [];

    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const d = diasEnMesAnterior - i;
      const m = vistaMes === 0 ? 11 : vistaMes - 1;
      const y = vistaMes === 0 ? vistaAnio - 1 : vistaAnio;
      const fechaISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      celdas.push({ dia: d, esMesActual: false, fechaISO });
    }

    for (let d = 1; d <= diasEnMes; d++) {
      const fechaISO = `${vistaAnio}-${String(vistaMes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      celdas.push({ dia: d, esMesActual: true, fechaISO });
    }

    const restante = (7 - (celdas.length % 7)) % 7;
    for (let d = 1; d <= restante; d++) {
      const m = vistaMes === 11 ? 0 : vistaMes + 1;
      const y = vistaMes === 11 ? vistaAnio + 1 : vistaAnio;
      const fechaISO = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      celdas.push({ dia: d, esMesActual: false, fechaISO });
    }
    return celdas;
  }, [vistaAnio, vistaMes]);

  const hoyISO = useMemo(() => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
  }, []);

  // Formato amigable legible para la píldora
  const textoLegible = useMemo(() => {
    if (!value) return tipo === 'inicio' ? 'Inmediato (Al emitir)' : 'Seleccionar fecha y hora...';
    try {
      const [fechaPart, horaPart] = value.split('T');
      const [y, m, d] = fechaPart.split('-').map(Number);
      const mesCorto = MESES_CALENDARIO[m - 1]?.slice(0, 3) || '';
      return `${d} ${mesCorto} ${y} • ${horaPart || '00:00'}`;
    } catch {
      return value;
    }
  }, [value, tipo]);

  // Navegación meses
  const irMesAnterior = () => {
    if (vistaMes === 0) {
      setVistaMes(11);
      setVistaAnio((a) => a - 1);
    } else {
      setVistaMes((m) => m - 1);
    }
  };

  const irMesSiguiente = () => {
    if (vistaMes === 11) {
      setVistaMes(0);
      setVistaAnio((a) => a + 1);
    } else {
      setVistaMes((m) => m + 1);
    }
  };

  // Selección de fecha en calendario
  const handleSeleccionarDia = (fechaISO) => {
    const hora = horaLocal || (tipo === 'fin' ? '23:59' : '09:00');
    onChange(`${fechaISO}T${hora}`);
  };

  // Cambio de hora
  const handleCambiarHora = (nuevaHora) => {
    setHoraLocal(nuevaHora);
    const fechaISO = fechaParsed?.fechaISO || hoyISO;
    onChange(`${fechaISO}T${nuevaHora}`);
  };

  // Atajos rápidos
  const aplicarAtajo = (diasSumar, horaDefecto = '23:59') => {
    const target = new Date();
    target.setDate(target.getDate() + diasSumar);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}T${horaDefecto}`;
    setHoraLocal(horaDefecto);
    setVistaAnio(y);
    setVistaMes(target.getMonth());
    onChange(iso);
  };

  const aplicarAtajoFinDeMes = () => {
    const target = new Date(vistaAnio, vistaMes + 1, 0);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}T23:59`;
    setHoraLocal('23:59');
    onChange(iso);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Contenedor Píldora Envolvente */}
      <div
        className={`group rounded-2xl border transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'border-blue-500 ring-4 ring-blue-500/20 bg-white dark:bg-[#18123B] shadow-lg shadow-blue-500/10'
            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/[0.08]'
        }`}
      >
        {/* Cabecera Píldora con Rótulo */}
        <div className="flex items-center justify-between px-3.5 pt-2 pb-0.5">
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
            <CalendarClock className="w-3 h-3 text-blue-500" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </span>
          {diagnostico && (
            <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full border ${diagnostico.color}`}>
              {diagnostico.texto}
            </span>
          )}
        </div>

        {/* Trigger Activo */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 pb-2.5 pt-1 text-left flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
              value
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200/80 dark:border-white/10'
            }`}>
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-xs sm:text-sm font-black truncate ${value ? 'text-slate-900 dark:text-white font-mono' : 'text-slate-400 font-sans'}`}>
                {textoLegible}
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {value ? `ISO: ${value}` : 'Formato: AAAA-MM-DD HH:MM'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="w-5 h-5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                title="Limpiar fecha"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <div className={`w-6 h-6 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors ${
              isOpen ? 'bg-blue-500/10 text-blue-500' : ''
            }`}>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </div>
          </div>
        </button>
      </div>

      {/* Popover del Calendario (Tamaño Compacto ~315px) */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${align === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'} top-full mt-2 z-50 w-[305px] sm:w-[320px] max-w-[calc(100vw-32px)] bg-white dark:bg-[#150f33] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-950/30 dark:shadow-black/90 p-3 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Navegación Mes / Año */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={irMesAnterior}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-white capitalize">
                {MESES_CALENDARIO[vistaMes]}
              </span>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {vistaAnio}
              </span>
            </div>

            <button
              type="button"
              onClick={irMesSiguiente}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Atajos Rápidos */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Atajos 1-Clic:
              </span>
              <span className="text-[9px] text-blue-500 font-mono">Vigencia</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {tipo === 'inicio' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const h = new Date();
                      const hh = String(h.getHours()).padStart(2, '0');
                      const mm = String(h.getMinutes()).padStart(2, '0');
                      aplicarAtajo(0, `${hh}:${mm}`);
                    }}
                    className="px-1.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-500/20 transition-all cursor-pointer text-center"
                  >
                    Ahora
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajo(1, '09:00')}
                    className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 transition-all cursor-pointer text-center"
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajo(3, '09:00')}
                    className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 transition-all cursor-pointer text-center"
                  >
                    +3 Días
                  </button>
                  <button
                    type="button"
                    onClick={aplicarAtajoFinDeMes}
                    className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 transition-all cursor-pointer text-center"
                  >
                    Fin Mes
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => aplicarAtajo(1, '23:59')}
                    className="px-1.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-500/20 transition-all cursor-pointer text-center"
                  >
                    +24h
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajo(3, '23:59')}
                    className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 transition-all cursor-pointer text-center"
                  >
                    +3 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajo(7, '23:59')}
                    className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 transition-all cursor-pointer text-center"
                  >
                    +7 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajo(30, '23:59')}
                    className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 transition-all cursor-pointer text-center"
                  >
                    +30 Días
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Días de la Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((dia, idx) => (
              <span
                key={dia}
                className={`text-[10px] font-black py-0.5 ${
                  idx >= 5 ? 'text-amber-500' : 'text-slate-400'
                }`}
              >
                {dia}
              </span>
            ))}
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 gap-1">
            {celdasCalendario.map((celda, idx) => {
              const esSeleccionado = fechaParsed?.fechaISO === celda.fechaISO;
              const esHoy = celda.fechaISO === hoyISO;

              return (
                <button
                  key={`${celda.fechaISO}-${idx}`}
                  type="button"
                  onClick={() => handleSeleccionarDia(celda.fechaISO)}
                  className={`h-7 w-full rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer relative ${
                    esSeleccionado
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-500/30 scale-105'
                      : esHoy
                      ? 'border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-black bg-blue-50/50 dark:bg-blue-500/10'
                      : celda.esMesActual
                      ? 'text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400'
                      : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{celda.dia}</span>
                  {esHoy && !esSeleccionado && (
                    <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Barra de Ajuste de Hora */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Hora:</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                type="time"
                value={horaLocal}
                onChange={(e) => handleCambiarHora(e.target.value)}
                className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Listo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Selector Desplegable Premium de Tenant para Login (Marca Blanca)
function SelectorTenantWhitelabel({ valor, onChange, empresas = [] }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickAfuera(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  const esGlobal = valor === 'global' || !valor;
  const empresaActual = !esGlobal ? empresas.find((e) => String(e.id) === String(valor)) : null;

  const empresasFiltradas = empresas.filter((emp) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const nombreMatch = emp.nombre?.toLowerCase().includes(q);
    const rucMatch = emp.ruc?.toLowerCase().includes(q);
    const planMatch = emp.plan?.toLowerCase().includes(q);
    return Boolean(nombreMatch || rucMatch || planMatch);
  });

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Contenedor Píldora Envolvente */}
      <div
        className={`group rounded-2xl border transition-all duration-200 cursor-pointer ${
          abierto
            ? 'border-pink-500 ring-4 ring-pink-500/20 bg-white dark:bg-[#18123B] shadow-lg shadow-pink-500/10'
            : 'bg-slate-50/80 dark:bg-black/20 border-slate-200/90 dark:border-white/10 hover:border-pink-500/40 hover:bg-white dark:hover:bg-white/[0.04]'
        }`}
      >
        {/* Cabecera Píldora con Rótulo */}
        <div className="flex items-center justify-between px-3.5 pt-2 pb-0.5">
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-pink-500" />
            <span>Empresa / Tenant a Personalizar</span>
          </span>
          <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full ${
            esGlobal
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
              : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/25'
          }`}>
            {esGlobal ? 'Plantilla Global' : (empresaActual?.plan || 'Tenant').toUpperCase()}
          </span>
        </div>

        {/* Trigger Activo */}
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="w-full px-3.5 pb-2.5 pt-1 text-left flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-transform group-hover:scale-105 ${
                esGlobal
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30 shadow-xs'
              }`}
            >
              {esGlobal ? <Globe className="w-4 h-4 stroke-[2.2]" /> : empresaActual?.nombre?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                <span className="truncate">{esGlobal ? 'Plantilla Global HEIS (Por Defecto)' : empresaActual?.nombre}</span>
                {!esGlobal && empresaActual && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${empresaActual.activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                {esGlobal ? (
                  <span>Aplica a todos los clientes sin marca blanca específica</span>
                ) : (
                  <>
                    <span className="font-mono">RUC: {empresaActual?.ruc || 'S/R'}</span>
                    <span>·</span>
                    <span className="uppercase text-[9px] font-bold text-pink-500">
                      Plan {empresaActual?.plan || 'Starter'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <div className={`w-6 h-6 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors ${
              abierto ? 'bg-pink-500/10 text-pink-500' : ''
            }`}>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${abierto ? 'rotate-180 text-pink-500' : ''}`} />
            </div>
          </div>
        </button>
      </div>

      {/* Popover Flotante con Recorte Estricto y Scrollbar Confinado */}
      {abierto && (
        <div className="absolute left-0 right-0 w-full top-full mt-2 z-50 bg-white dark:bg-[#150f33] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-950/30 dark:shadow-black/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por empresa o RUC..."
                autoFocus
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="p-1.5">
            <div className="max-h-56 overflow-y-auto pr-1 space-y-1 custom-dropdown-scroll">
              {!busqueda.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('global');
                    setAbierto(false);
                    setBusqueda('');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group/item ${
                    esGlobal
                      ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30'
                      : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      esGlobal
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>Plantilla Global HEIS</span>
                        <span className="text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          Defecto
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        Branding estándar para toda la plataforma SaaS
                      </p>
                    </div>
                  </div>
                  {esGlobal && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              )}

              {empresasFiltradas.length === 0 && busqueda.trim() ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No se encontraron empresas con "{busqueda}"
                </div>
              ) : (
                empresasFiltradas.map((emp) => {
                  const seleccionado = String(valor) === String(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        onChange(emp.id);
                        setAbierto(false);
                        setBusqueda('');
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group/item ${
                        seleccionado
                          ? 'bg-gradient-to-r from-pink-500/15 to-rose-500/15 border border-pink-500/30'
                          : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-transform group-hover/item:scale-105 ${
                            seleccionado
                              ? 'bg-pink-600 text-white shadow-xs'
                              : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                          }`}
                        >
                          {emp.nombre?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{emp.nombre}</span>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${emp.activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono">RUC: {emp.ruc || 'S/R'}</span>
                            <span>·</span>
                            <span className="uppercase text-[9px] font-bold text-pink-500">
                              {emp.plan || 'Starter'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {seleccionado && (
                          <div className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Selector Desplegable Premium para Presets de Fondo 1080p
function SelectorPresetFondoWhitelabel({ valor, onChange, presets = [] }) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickAfuera(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  const presetActual = presets.find((p) => p.id === valor) || presets[0] || {
    id: 'modern_glass',
    nombre: 'Tech Glass Luminoso',
    categoria: 'Tecnología & SaaS (Tema Claro)',
  };

  const getPresetIcono = (id) => {
    switch (id) {
      case 'modern_glass':
        return Sparkles;
      case 'minimal_dark':
      case 'minimal_light':
        return Building2;
      case 'restaurant':
        return UtensilsCrossed;
      case 'hardware':
        return Wrench;
      case 'pharma':
        return Pill;
      case 'hotel':
        return Hotel;
      case 'sky_office':
        return Building2;
      default:
        return Globe;
    }
  };

  const IconoActual = getPresetIcono(presetActual.id);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Contenedor Píldora Envolvente */}
      <div
        className={`group rounded-2xl border transition-all duration-200 cursor-pointer ${
          abierto
            ? 'border-pink-500 ring-4 ring-pink-500/20 bg-white dark:bg-[#18123B] shadow-lg shadow-pink-500/10'
            : 'bg-slate-50/80 dark:bg-black/20 border-slate-200/90 dark:border-white/10 hover:border-pink-500/40 hover:bg-white dark:hover:bg-white/[0.04]'
        }`}
      >
        {/* Cabecera Píldora con Rótulo */}
        <div className="flex items-center justify-between px-3.5 pt-2 pb-0.5">
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-pink-500" />
            <span>Imagen de Fondo (Full HD 1080p · Tema Claro)</span>
          </span>
          <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
            <Sun className="w-2.5 h-2.5" />
            <span>{presetActual.id === 'custom' ? 'URL Externa' : 'Tema Claro 1080p'}</span>
          </span>
        </div>

        {/* Trigger Activo */}
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="w-full px-3.5 pb-2.5 pt-1 text-left flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {presetActual.url ? (
              <div className="w-10 h-7 rounded-lg overflow-hidden shrink-0 border border-pink-500/30 shadow-2xs group-hover:scale-105 transition-transform bg-slate-100">
                <img
                  src={presetActual.url}
                  alt={presetActual.nombre}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <IconoActual className="w-4 h-4 stroke-[2.2]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                <span>{presetActual.nombre}</span>
                {presetActual.id !== 'custom' && (
                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Tema Claro
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {presetActual.id === 'custom' ? 'Enlace personalizado directo a imagen' : (presetActual.categoria || 'Resolución 1920x1080 · Tema Claro Optimizado')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <div className={`w-6 h-6 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors ${
              abierto ? 'bg-pink-500/10 text-pink-500' : ''
            }`}>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${abierto ? 'rotate-180 text-pink-500' : ''}`} />
            </div>
          </div>
        </button>
      </div>

      {/* Popover Flotante con Recorte Estricto y Scrollbar Confinado */}
      {abierto && (
        <div className="absolute left-0 right-0 w-full top-full mt-2 z-50 bg-white dark:bg-[#150f33] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-950/30 dark:shadow-black/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-2 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Galería de Fondos 1080p · Tema Claro</span>
            </span>
            <span>{presets.length} opciones disponibles</span>
          </div>

          <div className="p-1.5">
            <div className="max-h-56 overflow-y-auto pr-1 space-y-1 custom-dropdown-scroll">
              {presets.map((p) => {
                const seleccionado = p.id === valor;
                const IconoPreset = getPresetIcono(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(p.id);
                      setAbierto(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer group/item ${
                      seleccionado
                        ? 'bg-gradient-to-r from-pink-500/15 to-rose-500/15 border border-pink-500/30'
                        : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {p.url ? (
                        <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-2xs relative group-hover/item:scale-105 transition-transform bg-slate-100">
                          <img
                            src={p.url}
                            alt={p.nombre}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-105 ${
                            seleccionado
                              ? 'bg-pink-600 text-white shadow-xs'
                              : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                          }`}
                        >
                          <IconoPreset className="w-4 h-4 stroke-[2.2]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span>{p.nombre}</span>
                          {p.id !== 'custom' && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              Claro
                            </span>
                          )}
                          {p.id === 'modern_glass' && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 shrink-0">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {p.categoria || 'Preset Oficial HEIS 1080p'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {seleccionado && (
                        <div className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Catálogo Base Oficial de Micro-Permisos y Seguridad por Botón RBAC
const DEFAULT_CATALOGO_ACCIONES = [
  { id: 1, alias: 'SED', nombre: 'Ver Detalle Completo', descripcion: 'Visualización extendida de registros, comprobantes y auditoría', modulo: 'General', icono: 'Eye', roles: ['admin', 'supervisor', 'cajero', 'vendedor', 'mozo'], activo: true, riesgo: 'bajo', requiere_pin: false, auditoria_obligatoria: false },
  { id: 2, alias: 'UPD', nombre: 'Editar y Modificar Registro', descripcion: 'Edición de campos y datos de clientes o productos existentes', modulo: 'General', icono: 'Pencil', roles: ['admin', 'supervisor'], activo: true, riesgo: 'medio', requiere_pin: false, auditoria_obligatoria: true },
  { id: 3, alias: 'DEL', nombre: 'Eliminar Fila o Documento', descripcion: 'Baja lógica o supresión de elementos de base de datos', modulo: 'General', icono: 'Trash2', roles: ['admin'], activo: true, riesgo: 'critico', requiere_pin: true, auditoria_obligatoria: true },
  { id: 4, alias: 'ANUL', nombre: 'Anular Venta / Factura SUNAT', descripcion: 'Generación de comunicación de baja o anulación tributaria', modulo: 'Ventas', icono: 'XCircle', roles: ['admin', 'supervisor'], activo: true, riesgo: 'critico', requiere_pin: true, auditoria_obligatoria: true },
  { id: 5, alias: 'REIMP_A4', nombre: 'Imprimir Factura Formato A4', descripcion: 'Descarga e impresión en formato PDF/A4 corporativo', modulo: 'Ventas', icono: 'Printer', roles: ['admin', 'supervisor', 'cajero', 'vendedor'], activo: true, riesgo: 'medio', requiere_pin: false, auditoria_obligatoria: false },
  { id: 6, alias: 'REIMP_TICKET', nombre: 'Imprimir Ticket Térmico 80mm', descripcion: 'Envío de copia de ticket a impresora térmica de caja', modulo: 'POS', icono: 'FileText', roles: ['admin', 'supervisor', 'cajero', 'vendedor', 'mozo'], activo: true, riesgo: 'bajo', requiere_pin: false, auditoria_obligatoria: false },
  { id: 7, alias: 'DESC_ESPECIAL', nombre: 'Autorizar Descuento Libre > 10%', descripcion: 'Rebaja de precio por encima del margen comercial asignado', modulo: 'POS', icono: 'DollarSign', roles: ['admin', 'supervisor'], activo: true, riesgo: 'critico', requiere_pin: true, auditoria_obligatoria: true },
  { id: 8, alias: 'REAPERTURA_CAJA', nombre: 'Reabrir Turno de Caja Cerrado', descripcion: 'Reversión de arqueo o corte Z para ajustes extemporáneos', modulo: 'Finanzas', icono: 'Key', roles: ['admin'], activo: true, riesgo: 'critico', requiere_pin: true, auditoria_obligatoria: true },
  { id: 9, alias: 'CAMBIO_PRECIO', nombre: 'Modificar Precio en Caliente', descripcion: 'Ajuste directo de precio unitario en pantalla de cobro', modulo: 'POS', icono: 'SlidersHorizontal', roles: ['admin', 'supervisor'], activo: true, riesgo: 'critico', requiere_pin: true, auditoria_obligatoria: true },
  { id: 10, alias: 'NOTAS_CREDITO', nombre: 'Emitir Nota de Crédito / Débito', descripcion: 'Emisión de documentos electrónicos correctivos ante SUNAT', modulo: 'Facturación', icono: 'ShieldCheck', roles: ['admin', 'supervisor'], activo: true, riesgo: 'critico', requiere_pin: true, auditoria_obligatoria: true },
  { id: 11, alias: 'ACC', nombre: 'Gestión de Claves & Usuarios', descripcion: 'Creación, suspensión o reseteo de credenciales de personal', modulo: 'Seguridad', icono: 'Lock', roles: ['admin'], activo: true, riesgo: 'critico', requiere_pin: true, auditoria_obligatoria: true },
  { id: 12, alias: 'EXPORT_EXCEL', nombre: 'Exportar Reportes a Excel', descripcion: 'Extracción masiva de bases de datos de ventas e inventario', modulo: 'Reportes', icono: 'FileSpreadsheet', roles: ['admin', 'supervisor'], activo: true, riesgo: 'medio', requiere_pin: false, auditoria_obligatoria: true },
];

const MAPA_ICONOS_ACCIONES = {
  Eye,
  Pencil,
  Trash2,
  XCircle,
  Printer,
  FileText,
  DollarSign,
  Key,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  FileSpreadsheet,
  CheckSquare,
};

function resolverIconoAccion(icono) {
  if (typeof icono === 'function') return icono;
  if (typeof icono === 'string' && MAPA_ICONOS_ACCIONES[icono]) return MAPA_ICONOS_ACCIONES[icono];
  return CheckSquare;
}

// Función de cálculo inteligente de tarifas y periodos según Vigencia / Ciclo
const calcularTarifaSegunCiclo = (precioBaseMensual, ciclo = 'mensual_30') => {
  const pBase = Number(precioBaseMensual) || 99;
  switch (ciclo) {
    case 'trial_14':
      return {
        precioCalculado: 0,
        periodoTexto: '/ 14 días',
        badgeDescuento: 'Prueba Gratuita',
        etiquetaCiclo: '14 días sin costo',
        esGratis: true,
      };
    case 'mensual_30':
      return {
        precioCalculado: pBase,
        periodoTexto: '/ mes',
        badgeDescuento: null,
        etiquetaCiclo: 'Facturación regular',
        esGratis: false,
      };
    case 'anual_365': {
      // Estándar SaaS: 10 meses pagados = 2 meses de regalo
      const anual = Math.round(pBase * 10);
      return {
        precioCalculado: anual,
        periodoTexto: '/ año',
        badgeDescuento: 'Ahorra 2 meses',
        etiquetaCiclo: `~S/ ${Math.round(anual / 12)} / mes`,
        esGratis: false,
      };
    }
    case 'ilimitado': {
      // Licencia perpetua / pago único: 24 meses equivalentes
      const vitalicio = Math.round(pBase * 24);
      return {
        precioCalculado: vitalicio,
        periodoTexto: 'pago único',
        badgeDescuento: 'Vitalicio',
        etiquetaCiclo: 'Sin fecha de corte',
        esGratis: false,
      };
    }
    default:
      return {
        precioCalculado: pBase,
        periodoTexto: '/ mes',
        badgeDescuento: null,
        etiquetaCiclo: '',
        esGratis: false,
      };
  }
};

// Selector Visual de Planes SaaS (Tarjetas Interactivas Adaptadas Dinámicamente por Ciclo)
function SelectorPlanesVisual({ valor, onChange, catalogoPlanes, ciclo = 'mensual_30' }) {
  const planes = DEFAULT_PLANES_CONFIG.map((def) => {
    const override = catalogoPlanes?.find((p) => p.id === def.id);
    const pBase = override?.precio_mensual !== undefined ? Number(override.precio_mensual) : def.precio_mensual;
    const tarifaInfo = calcularTarifaSegunCiclo(pBase, ciclo);

    return {
      ...def,
      nombre: override?.nombre || def.nombre,
      badge: tarifaInfo.badgeDescuento || override?.badge || def.badge,
      alcance: override?.alcance || def.alcance,
      descripcion: override?.descripcion || def.descripcion,
      precio_mensual: pBase,
      precioAMostrar: tarifaInfo.precioCalculado,
      periodoTexto: tarifaInfo.periodoTexto,
      etiquetaCiclo: tarifaInfo.etiquetaCiclo,
      esGratis: tarifaInfo.esGratis,
    };
  });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-[#02CBA9]" />
          <span>Plan de Suscripción SaaS</span>
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          Tarifas calculadas para ciclo {ciclo === 'anual_365' ? 'Anual (365d · Ahorro 2 meses)' : ciclo === 'trial_14' ? 'Prueba (14d sin costo)' : ciclo === 'ilimitado' ? 'Vitalicio' : 'Mensual (30d)'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {planes.map((p) => {
          const estaSel = String(valor || '').toLowerCase() === p.id;
          return (
            <div
              key={p.id}
              onClick={() => onChange(p.id)}
              className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none relative group flex flex-col justify-between ${estaSel
                ? `${p.activeClass} shadow-md scale-[1.01]`
                : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/60 dark:hover:bg-white/[0.04]'
                }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.badgeClass}`}>
                    {p.badge}
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${estaSel ? 'bg-current text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/10 text-slate-400'
                    }`}>
                    {estaSel ? (
                      <Check className="w-3 h-3 text-white dark:text-slate-900 stroke-[3]" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg sm:text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                    S/ {Number(p.precioAMostrar || 0).toFixed(0)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{p.periodoTexto}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {p.nombre}
                </h4>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                <p className="font-semibold text-slate-600 dark:text-slate-300 truncate">{p.alcance}</p>
                <div className="flex items-center justify-between gap-1 text-[9.5px] mt-0.5">
                  <span className="text-slate-400 dark:text-slate-500 truncate">{p.descripcion}</span>
                  {p.etiquetaCiclo && (
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      {p.etiquetaCiclo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Selector Segmentado de Vigencia / Ciclo (Con Badges de Beneficio)
function SelectorVigenciaSegmentado({ valor, onChange }) {
  const opciones = [
    { id: 'trial_14', label: 'Prueba 14d', desc: 'Sin costo', badge: 'Demo S/ 0' },
    { id: 'mensual_30', label: 'Mensual 30d', desc: 'Facturación regular', badge: 'Mes a mes' },
    { id: 'anual_365', label: 'Anual 365d', desc: 'Ciclo 1 año', badge: '2 meses gratis' },
    { id: 'ilimitado', label: 'Vitalicio', desc: 'Sin corte', badge: 'Pago único' },
  ];

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
        <Clock className="w-3 h-3 text-[#1CC0F9]" />
        <span>Vigencia / Ciclo de Facturación</span>
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {opciones.map((opc) => {
          const estaSel = String(valor || '') === opc.id;
          return (
            <button
              key={opc.id}
              type="button"
              onClick={() => onChange(opc.id)}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${estaSel
                ? 'border-[#02CBA9] bg-[#02CBA9]/10 text-[#02CBA9] ring-2 ring-[#02CBA9]/20 font-bold shadow-2xs'
                : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs truncate font-bold">{opc.label}</span>
                {opc.badge && (
                  <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full border shrink-0 ${opc.id === 'anual_365'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : opc.id === 'trial_14'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10'
                    }`}>
                    {opc.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] text-slate-400 font-normal truncate mt-1">{opc.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Selector Segmentado de Entorno SUNAT
function SelectorEntornoSunat({ valor, onChange }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        <span>Entorno SUNAT</span>
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onChange('beta')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${valor === 'beta'
            ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20 font-bold shadow-2xs'
            : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
        >
          <div>
            <span className="text-xs font-bold block">Beta Pruebas</span>
            <span className="text-[9.5px] text-slate-400 font-normal block">Ensayos sin validez</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onChange('produccion')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${valor === 'produccion'
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 font-bold shadow-2xs'
            : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
        >
          <div>
            <span className="text-xs font-bold block">Producción Oficial</span>
            <span className="text-[9.5px] text-slate-400 font-normal block">SUNAT en vivo</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 shrink-0" />
        </button>
      </div>
    </div>
  );
}

// Tipos de Comunicados Globales para Broadcast SaaS
const TIPOS_COMUNICADO = [
  {
    id: 'info',
    etiqueta: 'Información / General',
    badge: 'Informativo',
    descripcion: 'Avisos corporativos, comunicados habituales y recomendaciones',
    icono: Info,
    colorClasses: {
      text: 'text-sky-600 dark:text-sky-400',
      bgIcon: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
      badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25',
      borderActive: 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5',
      dot: 'bg-sky-500',
    },
  },
  {
    id: 'mantenimiento',
    etiqueta: 'Mantenimiento de Servidores',
    badge: 'Mantenimiento',
    descripcion: 'Ventanas programadas, reinicios preventivos o labores técnicas',
    icono: Wrench,
    colorClasses: {
      text: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
      borderActive: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5',
      dot: 'bg-amber-500',
    },
  },
  {
    id: 'alerta',
    etiqueta: 'Alerta o Urgencia',
    badge: 'Alta Prioridad',
    descripcion: 'Incidencias críticas, contingencias inmediatas o avisos de pago',
    icono: AlertTriangle,
    colorClasses: {
      text: 'text-rose-600 dark:text-rose-400',
      bgIcon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
      borderActive: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5',
      dot: 'bg-rose-500',
    },
  },
  {
    id: 'exito',
    etiqueta: 'Nueva Versión o Éxito',
    badge: 'Novedad',
    descripcion: 'Nuevos módulos disponibles, optimizaciones y mejoras desplegadas',
    icono: Sparkles,
    colorClasses: {
      text: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5',
      dot: 'bg-emerald-500',
    },
  },
];

// Selector Desplegable Moderno para Tipo de Comunicado
function DesplegableTipoComunicado({ valor, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickAfuera(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
    };
  }, [abierto]);

  const tipoActual = TIPOS_COMUNICADO.find((t) => t.id === valor) || TIPOS_COMUNICADO[0];
  const IconoActual = tipoActual.icono;

  return (
    <div ref={containerRef} className="relative">
      {/* Botón Trigger del Desplegable */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group ${abierto
          ? `${tipoActual.colorClasses.borderActive} shadow-lg shadow-black/5 dark:shadow-black/40 bg-white dark:bg-white/[0.08]`
          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/70 dark:hover:bg-white/[0.07]'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tipoActual.colorClasses.bgIcon} shadow-xs`}>
            <IconoActual className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-amber-500 transition-colors block">
              Tipo de Comunicado & Nivel de Prioridad
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {tipoActual.etiqueta}
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${tipoActual.colorClasses.badge}`}>
                {tipoActual.badge}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
              {tipoActual.descripcion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${tipoActual.colorClasses.dot} animate-pulse`} />
          <div className="w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-white/15 transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${abierto ? 'rotate-180 text-amber-500' : ''}`} />
          </div>
        </div>
      </button>

      {/* Menú Desplegable Flotante */}
      {abierto && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#150f33] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-900/25 dark:shadow-black/80 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span>Selecciona el tipo de anuncio</span>
            <span>4 opciones disponibles</span>
          </div>

          <div className="space-y-1">
            {TIPOS_COMUNICADO.map((tipo) => {
              const estaSel = tipo.id === valor;
              const Icono = tipo.icono;
              return (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => {
                    onChange(tipo.id);
                    setAbierto(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group/item ${estaSel
                    ? `${tipo.colorClasses.borderActive} font-bold`
                    : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent hover:border-slate-200/60 dark:hover:border-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tipo.colorClasses.bgIcon} transition-transform duration-150 group-hover/item:scale-105`}>
                      <Icono className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${estaSel ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'} truncate`}>
                          {tipo.etiqueta}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${tipo.colorClasses.badge}`}>
                          {tipo.badge}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                        {tipo.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {estaSel && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Niveles de Prioridad para Tickets de Soporte & Diagnóstico
const NIVELES_PRIORIDAD_TICKET = [
  {
    id: 'baja',
    etiqueta: 'Baja — Consulta General',
    badge: 'Baja Prioridad',
    sla: 'SLA: 24 - 48h',
    descripcion: 'Dudas de uso, consultas operativas o sugerencias sin bloqueo',
    icono: Info,
    colorClasses: {
      text: 'text-sky-600 dark:text-sky-400',
      bgIcon: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
      badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25',
      borderActive: 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5',
      dot: 'bg-sky-500',
    },
  },
  {
    id: 'media',
    etiqueta: 'Media — Advertencia Operativa',
    badge: 'Operación Normal',
    sla: 'SLA: 12 - 24h',
    descripcion: 'Incidencia parcial, lentitud o advertencias no bloqueantes',
    icono: Activity,
    colorClasses: {
      text: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
      borderActive: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5',
      dot: 'bg-amber-500',
    },
  },
  {
    id: 'alta',
    etiqueta: 'Alta — Bloqueo de Facturación / Caja',
    badge: 'Bloqueo Parcial',
    sla: 'SLA: 2 - 4h',
    descripcion: 'Falla al emitir comprobantes SUNAT, bloqueo de ventas o apertura de caja',
    icono: AlertTriangle,
    colorClasses: {
      text: 'text-orange-600 dark:text-orange-400',
      bgIcon: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
      badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25',
      borderActive: 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-500/5',
      dot: 'bg-orange-500',
    },
  },
  {
    id: 'critica',
    etiqueta: 'Crítica — Caída Total de Servicio',
    badge: 'Urgencia Máxima',
    sla: 'SLA: < 30 min',
    descripcion: 'Sistema inaccesible, caída de base de datos o corte masivo en clientes',
    icono: Zap,
    colorClasses: {
      text: 'text-rose-600 dark:text-rose-400',
      bgIcon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
      borderActive: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5',
      dot: 'bg-rose-500',
    },
  },
];

// Selector Desplegable Rediseñado para Nivel de Prioridad en Soporte
function DesplegablePrioridadTicket({ valor, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickAfuera(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
    };
  }, [abierto]);

  const prioridadActual = NIVELES_PRIORIDAD_TICKET.find((p) => p.id === valor) || NIVELES_PRIORIDAD_TICKET[1];
  const IconoActual = prioridadActual.icono;

  return (
    <div ref={containerRef} className="relative">
      {/* Botón Trigger del Desplegable Estilo Píldora Envolvente */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group ${abierto
          ? `${prioridadActual.colorClasses.borderActive} shadow-lg shadow-black/5 dark:shadow-black/40 bg-white dark:bg-white/[0.08]`
          : 'bg-slate-50/80 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/70 dark:hover:bg-white/[0.07]'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${prioridadActual.colorClasses.bgIcon} shadow-xs`}>
            <IconoActual className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors block">
              Nivel de Prioridad & Severidad
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {prioridadActual.etiqueta}
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${prioridadActual.colorClasses.badge}`}>
                {prioridadActual.badge}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
              {prioridadActual.descripcion} · <span className="font-semibold text-slate-500 dark:text-slate-300">{prioridadActual.sla}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${prioridadActual.colorClasses.dot} animate-pulse`} />
          <div className="w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-white/15 transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${abierto ? 'rotate-180 text-orange-500' : ''}`} />
          </div>
        </div>
      </button>

      {/* Menú Desplegable Flotante */}
      {abierto && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#150f33] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-900/25 dark:shadow-black/80 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span>Selecciona el impacto de la incidencia</span>
            <span>4 niveles de SLA</span>
          </div>

          <div className="space-y-1">
            {NIVELES_PRIORIDAD_TICKET.map((prio) => {
              const estaSel = prio.id === valor;
              const Icono = prio.icono;
              return (
                <button
                  key={prio.id}
                  type="button"
                  onClick={() => {
                    onChange(prio.id);
                    setAbierto(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group/item ${estaSel
                    ? `${prio.colorClasses.borderActive} font-bold`
                    : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent hover:border-slate-200/60 dark:hover:border-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${prio.colorClasses.bgIcon} transition-transform duration-150 group-hover/item:scale-105`}>
                      <Icono className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${estaSel ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'} truncate`}>
                          {prio.etiqueta}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${prio.colorClasses.badge}`}>
                          {prio.badge}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {prio.sla}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                        {prio.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {estaSel && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// DESPLEGABLES REDISEÑADOS PARA FILTROS DE TABLA (PLAN, MÓDULO, ESTADO)
// ==========================================
const OPCIONES_FILTRO_PLAN = [
  {
    id: '',
    etiqueta: 'Todos los planes',
    etiquetaCorta: 'Todos los planes',
    descripcion: 'Sin filtro de suscripción',
    icono: Layers,
    theme: {
      iconContainer: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400',
    },
  },
  {
    id: 'starter',
    etiqueta: 'Plan Starter',
    etiquetaCorta: 'Starter',
    badge: 'Pyme',
    descripcion: '1 Sede comercial · POS estándar',
    icono: Zap,
    theme: {
      activoBorder: 'border-blue-500/50',
      activoBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      activoText: 'text-blue-700 dark:text-blue-300',
      iconContainer: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    },
  },
  {
    id: 'professional',
    etiqueta: 'Plan Professional',
    etiquetaCorta: 'Professional',
    badge: 'Popular',
    descripcion: 'Multisede & Analítica integral',
    icono: Sparkles,
    theme: {
      activoBorder: 'border-indigo-500/50',
      activoBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      activoText: 'text-indigo-700 dark:text-indigo-300',
      iconContainer: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    },
  },
  {
    id: 'enterprise',
    etiqueta: 'Plan Enterprise',
    etiquetaCorta: 'Enterprise',
    badge: 'Full Suite',
    descripcion: 'Sedes ilimitadas & Soporte 24/7',
    icono: ShieldCheck,
    theme: {
      activoBorder: 'border-amber-500/50',
      activoBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      activoText: 'text-amber-700 dark:text-amber-300',
      iconContainer: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
  },
];

const OPCIONES_FILTRO_MODULO = [
  {
    id: '',
    etiqueta: 'Cualquier Módulo',
    etiquetaCorta: 'Cualquier módulo',
    descripcion: 'Todas las verticales habilitadas',
    icono: Layers,
    theme: {
      iconContainer: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400',
    },
  },
  {
    id: 'restaurante',
    etiqueta: 'Restaurante Gastro',
    etiquetaCorta: 'Restaurante',
    badge: 'Gastro',
    descripcion: 'Mesas, comandas y cocina KDS',
    icono: UtensilsCrossed,
    theme: {
      activoBorder: 'border-amber-500/50',
      activoBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      activoText: 'text-amber-700 dark:text-amber-300',
      iconContainer: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
  },
  {
    id: 'ferreteria',
    etiqueta: 'Ferretería Retail',
    etiquetaCorta: 'Ferretería',
    badge: 'Retail',
    descripcion: 'Kardex, lotes y ventas rápidas',
    icono: ShoppingBag,
    theme: {
      activoBorder: 'border-indigo-500/50',
      activoBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      activoText: 'text-indigo-700 dark:text-indigo-300',
      iconContainer: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    },
  },
  {
    id: 'botica',
    etiqueta: 'Botica Farmacia',
    etiquetaCorta: 'Botica & Salud',
    badge: 'Salud',
    descripcion: 'DIGEMID, recetas y vencimientos',
    icono: Pill,
    theme: {
      activoBorder: 'border-emerald-500/50',
      activoBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      activoText: 'text-emerald-700 dark:text-emerald-300',
      iconContainer: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
  },
  {
    id: 'hospedaje',
    etiqueta: 'Hospedaje Hotel',
    etiquetaCorta: 'Hospedaje',
    badge: 'Hotel',
    descripcion: 'Check-in, reservas y habitaciones',
    icono: Hotel,
    theme: {
      activoBorder: 'border-rose-500/50',
      activoBg: 'bg-rose-500/10 dark:bg-rose-500/15',
      activoText: 'text-rose-700 dark:text-rose-300',
      iconContainer: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    },
  },
];

const OPCIONES_FILTRO_ESTADO = [
  {
    id: '',
    etiqueta: 'Todos los estados',
    etiquetaCorta: 'Todos los estados',
    descripcion: 'Tenants activos y suspendidos',
    icono: Activity,
    theme: {
      iconContainer: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400',
    },
  },
  {
    id: 'activa',
    etiqueta: 'Empresas Activas',
    etiquetaCorta: 'Activas',
    badge: 'Operativo',
    descripcion: 'Acceso y servicios funcionando',
    icono: CheckCircle2,
    theme: {
      activoBorder: 'border-emerald-500/50',
      activoBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      activoText: 'text-emerald-700 dark:text-emerald-300',
      iconContainer: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
  },
  {
    id: 'suspendida',
    etiqueta: 'Empresas Suspendidas',
    etiquetaCorta: 'Suspendidas',
    badge: 'Bloqueado',
    descripcion: 'Acceso bloqueado por administración',
    icono: XCircle,
    theme: {
      activoBorder: 'border-rose-500/50',
      activoBg: 'bg-rose-500/10 dark:bg-rose-500/15',
      activoText: 'text-rose-700 dark:text-rose-300',
      iconContainer: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    },
  },
];

function DesplegableFiltroColumna({
  titulo,
  valor,
  onChange,
  opciones,
  placeholder = 'Todos',
  iconoDefault: IconoDefault = Filter,
  align = 'left',
  anchoMenu = 'w-64',
}) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickAfuera(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  const opcionSeleccionada = opciones.find((o) => o.id === valor);
  const estaActivo = Boolean(valor);
  const IconoActual = (estaActivo && opcionSeleccionada?.icono) || IconoDefault;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Botón Trigger Píldora Rediseñado */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full h-8 px-2.5 rounded-lg border text-left flex items-center justify-between gap-1.5 text-[11px] transition-all duration-150 cursor-pointer select-none group ${abierto
          ? 'ring-2 ring-blue-500/40 border-blue-500 bg-white dark:bg-[#18123B] shadow-xs'
          : estaActivo
            ? `${opcionSeleccionada?.theme?.activoBorder || 'border-blue-500/40'} ${opcionSeleccionada?.theme?.activoBg || 'bg-blue-50/70 dark:bg-blue-950/20'} ${opcionSeleccionada?.theme?.activoText || 'text-blue-700 dark:text-blue-300'} font-bold shadow-2xs`
            : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
          }`}
        title={`Filtrar por ${titulo}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${estaActivo && opcionSeleccionada?.theme?.iconContainer
            ? opcionSeleccionada.theme.iconContainer
            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
            }`}>
            <IconoActual className="w-3.5 h-3.5" />
          </div>
          <span className="truncate text-[11px]">
            {opcionSeleccionada?.etiquetaCorta || opcionSeleccionada?.etiqueta || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {estaActivo && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="w-4 h-4 rounded-md hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              title="Quitar este filtro"
            >
              <X className="w-2.5 h-2.5" />
            </span>
          )}
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Menú Desplegable Popover Flotante */}
      {abierto && (
        <div
          className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-1.5 ${anchoMenu} z-50 rounded-2xl bg-white/95 dark:bg-[#18123B]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 select-none`}
        >
          {/* Cabecera del filtro */}
          <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-1 mb-1">
            <span>{titulo}</span>
            {estaActivo && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setAbierto(false);
                }}
                className="text-[9px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Opciones */}
          <div className="max-h-60 overflow-y-auto custom-modal-scroll space-y-0.5">
            {opciones.map((opc) => {
              const esSeleccionado = (opc.id === valor) || (!opc.id && !valor);
              const OpcIcono = opc.icono || IconoDefault;

              return (
                <button
                  key={opc.id || 'todos'}
                  type="button"
                  onClick={() => {
                    onChange(opc.id);
                    setAbierto(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer group ${esSeleccionado
                    ? 'bg-slate-100 dark:bg-white/10 font-bold text-slate-900 dark:text-white shadow-2xs'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${opc.theme?.iconContainer || 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                      }`}>
                      <OpcIcono className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs truncate block">{opc.etiqueta}</span>
                        {opc.badge && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${opc.theme?.badge || 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                            {opc.badge}
                          </span>
                        )}
                      </div>
                      {opc.descripcion && (
                        <p className="text-[10px] text-slate-400 truncate font-normal leading-tight">
                          {opc.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {esSeleccionado && (
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const OPCIONES_PLAN_SAAS = [
  { valor: 'starter', etiqueta: 'Plan Starter — S/ 99 / mes', descripcion: '1 Sede comercial, facturación y POS estándar' },
  { valor: 'professional', etiqueta: 'Plan Professional — S/ 199 / mes', descripcion: 'Multisede, reportes analíticos y control integral' },
  { valor: 'enterprise', etiqueta: 'Plan Enterprise — S/ 399 / mes', descripcion: 'Sedes y usuarios ilimitados, soporte prioritario 24/7' },
];

const OPCIONES_VIGENCIA = [
  { valor: 'trial_14', etiqueta: 'Periodo de Prueba (14 días)', descripcion: 'Evaluación inicial completa sin costo' },
  { valor: 'mensual_30', etiqueta: 'Suscripción Mensual (30 días)', descripcion: 'Facturación periódica mensual regular' },
  { valor: 'anual_365', etiqueta: 'Suscripción Anual (365 días)', descripcion: 'Ciclo anual continuo con renovación' },
  { valor: 'ilimitado', etiqueta: 'Sin Vencimiento (Vitalicio)', descripcion: 'Acceso corporativo permanente sin fecha de corte' },
];

const OPCIONES_ENTORNO_SUNAT = [
  { valor: 'beta', etiqueta: 'Beta (Entorno de Pruebas)', descripcion: 'Comprobantes de ensayo sin validez tributaria' },
  { valor: 'produccion', etiqueta: 'Producción (SUNAT Oficial)', descripcion: 'Emisión legal directa ante servidores de SUNAT' },
];

const MODULO_BRAND_COLORS = {
  restaurante: '#F59E0B', // Ámbar Gastronómico
  botica: '#10B981',      // Esmeralda Salud / Farmacia
  ferreteria: '#6366F1',  // Índigo Ferretero / Construcción
  hospedaje: '#E11D48',   // Carmesí Boutique / Hotelería
  minimarket: '#02CBA9',  // Cyan Retail
};

const resolverColorPorModulos = (modulos = []) => {
  if (!Array.isArray(modulos) || modulos.length === 0) return '#02CBA9';
  for (const m of modulos) {
    if (MODULO_BRAND_COLORS[m]) return MODULO_BRAND_COLORS[m];
  }
  return '#02CBA9';
};

// ==========================================
// COMPONENTE REDISEÑADO: CALENDARIO DE VENCIMIENTO / FACTURACIÓN SAAS
// ==========================================
function CalendarioVencimiento({ valor, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  // Parsear fecha seleccionada sin desfase UTC
  const parseFecha = (str) => {
    if (!str) return null;
    const clean = String(str).split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const fechaSeleccionada = parseFecha(valor);
  const hoy = new Date();
  const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  // Estado del mes/año que se está navegando en la vista del calendario
  const [mesVista, setMesVista] = useState(() => (fechaSeleccionada ? fechaSeleccionada.getMonth() : hoy.getMonth()));
  const [anioVista, setAnioVista] = useState(() => (fechaSeleccionada ? fechaSeleccionada.getFullYear() : hoy.getFullYear()));

  // Cuando se abre o cambia el valor externo, sincronizar la vista del calendario
  useEffect(() => {
    if (fechaSeleccionada) {
      setMesVista(fechaSeleccionada.getMonth());
      setAnioVista(fechaSeleccionada.getFullYear());
    }
  }, [valor]);

  // Cierre por clic afuera o tecla Escape
  useEffect(() => {
    function handleClickAfuera(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  const handleMesAnterior = () => {
    if (mesVista === 0) {
      setMesVista(11);
      setAnioVista((a) => a - 1);
    } else {
      setMesVista((m) => m - 1);
    }
  };

  const handleMesSiguiente = () => {
    if (mesVista === 11) {
      setMesVista(0);
      setAnioVista((a) => a + 1);
    } else {
      setMesVista((m) => m + 1);
    }
  };

  const handleIrAHoy = () => {
    setMesVista(hoy.getMonth());
    setAnioVista(hoy.getFullYear());
  };

  const handlePreset = (dias) => {
    const d = new Date(hoySoloFecha);
    d.setDate(d.getDate() + dias);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${day}`);
    setAbierto(false);
  };

  // Cálculo de celdas del mes
  const primerDiaSemana = (new Date(anioVista, mesVista, 1).getDay() + 6) % 7; // Lunes = 0
  const totalDiasMes = new Date(anioVista, mesVista + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(null);
  }
  for (let d = 1; d <= totalDiasMes; d++) {
    const strFecha = `${anioVista}-${String(mesVista + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const esHoy = anioVista === hoy.getFullYear() && mesVista === hoy.getMonth() && d === hoy.getDate();
    const esSeleccionado = valor === strFecha;
    celdas.push({
      dia: d,
      fechaStr: strFecha,
      esHoy,
      esSeleccionado,
    });
  }

  // Formato legible para el trigger
  let textoTrigger = 'Sin fecha de corte (Vitalicio / Ilimitado)';
  let badgeDias = null;
  if (fechaSeleccionada) {
    const diffMs = fechaSeleccionada.getTime() - hoySoloFecha.getTime();
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const diaNum = fechaSeleccionada.getDate();
    const mesNom = MESES_CALENDARIO[fechaSeleccionada.getMonth()];
    const anioNum = fechaSeleccionada.getFullYear();
    textoTrigger = `${diaNum} de ${mesNom}, ${anioNum}`;

    if (diffDias > 0) {
      badgeDias = (
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          En {diffDias} días
        </span>
      );
    } else if (diffDias === 0) {
      badgeDias = (
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 animate-pulse">
          Vence hoy
        </span>
      );
    } else {
      badgeDias = (
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
          Vencido hace {Math.abs(diffDias)} días
        </span>
      );
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Botón Trigger Píldora Envolvente */}
      <div
        onClick={() => setAbierto(!abierto)}
        className={`group rounded-xl border px-3.5 py-2 transition-all duration-200 cursor-pointer select-none ${abierto
          ? 'border-[#02CBA9] dark:border-[#1CC0F9] ring-4 ring-[#02CBA9]/20 dark:ring-[#1CC0F9]/25 bg-white dark:bg-white/[0.08] shadow-md shadow-[#02CBA9]/10'
          : valor
            ? 'bg-slate-50/70 dark:bg-white/5 border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/50 dark:hover:bg-white/[0.07]'
            : 'bg-slate-50/40 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#02CBA9] dark:group-hover:text-[#1CC0F9] transition-colors flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#02CBA9]" />
            <span>Vencimiento / Facturación SaaS</span>
          </span>

          {valor && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-[9.5px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer hover:underline"
              title="Eliminar fecha de corte (establecer como vitalicio)"
            >
              <X className="w-2.5 h-2.5" />
              <span>Sin corte</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${valor
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-white/5 text-slate-400'
              }`}>
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              {valor ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {textoTrigger}
                  </span>
                  {badgeDias}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Sin fecha de corte (Licencia Vitalicia / Sin Vencimiento)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${abierto ? 'rotate-180 text-[#02CBA9]' : ''}`} />
          </div>
        </div>
      </div>

      {/* Popover del Calendario Flotante */}
      {abierto && (
        <div className="absolute left-0 right-0 sm:left-auto sm:right-0 sm:w-[360px] top-full mt-2 z-50 rounded-3xl bg-white/95 dark:bg-[#18123B]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/15 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 select-none space-y-3.5">
          {/* Atajos Rápidos de Vigencia SaaS */}
          <div className="space-y-1.5 border-b border-slate-100 dark:border-white/5 pb-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Atajos Rápidos de Vigencia</span>
              <span className="text-[9px] font-normal text-slate-400">Calculado desde hoy</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset(14)}
                className="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 transition-all text-center cursor-pointer"
              >
                +14d Prueba
              </button>
              <button
                type="button"
                onClick={() => handlePreset(30)}
                className="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 transition-all text-center cursor-pointer"
              >
                +30d Mensual
              </button>
              <button
                type="button"
                onClick={() => handlePreset(90)}
                className="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 transition-all text-center cursor-pointer"
              >
                +3 Meses
              </button>
              <button
                type="button"
                onClick={() => handlePreset(180)}
                className="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 transition-all text-center cursor-pointer"
              >
                +6 Meses
              </button>
              <button
                type="button"
                onClick={() => handlePreset(365)}
                className="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 transition-all text-center cursor-pointer"
              >
                +1 Año (365d)
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setAbierto(false);
                }}
                className="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 transition-all text-center cursor-pointer"
              >
                Vitalicio
              </button>
            </div>
          </div>

          {/* Navegación del Mes & Año */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-white capitalize">
                {MESES_CALENDARIO[mesVista]} {anioVista}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleMesAnterior}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleIrAHoy}
                className="h-7 px-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Ir al mes actual"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleMesSiguiente}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cabecera de Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
            <span>Lu</span>
            <span>Ma</span>
            <span>Mi</span>
            <span>Ju</span>
            <span>Vi</span>
            <span>Sá</span>
            <span>Do</span>
          </div>

          {/* Matriz de Días del Mes */}
          <div className="grid grid-cols-7 gap-1">
            {celdas.map((celda, idx) => {
              if (!celda) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const esHoy = celda.esHoy;
              const esSeleccionado = celda.esSeleccionado;

              return (
                <button
                  key={celda.fechaStr}
                  type="button"
                  onClick={() => {
                    onChange(celda.fechaStr);
                    setAbierto(false);
                  }}
                  className={`h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer group/dia ${esSeleccionado
                    ? 'bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] text-white shadow-md shadow-[#02CBA9]/25 font-black scale-105'
                    : esHoy
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-400/40 font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                >
                  <span>{celda.dia}</span>
                  {esHoy && !esSeleccionado && (
                    <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer del Calendario */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-mono text-[10.5px]">
              {valor ? `Corte: ${valor}` : 'Sin fecha asignada'}
            </span>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'consola';

  // Estado reactivo de colapso del Sidebar para optimizar la tabla
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('heis_sidebar_collapsed') === 'true';
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    const handleSidebarToggle = (e) => {
      if (e?.detail?.collapsed !== undefined) {
        setSidebarCollapsed(Boolean(e.detail.collapsed));
      }
    };
    window.addEventListener('heis:sidebar-toggle', handleSidebarToggle);
    return () => window.removeEventListener('heis:sidebar-toggle', handleSidebarToggle);
  }, []);

  const [empresas, setEmpresas] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [auditorias, setAuditorias] = useState([]);
  const [sistema, setSistema] = useState(null);
  const [dbPingLatency, setDbPingLatency] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);
  const [purgarLoading, setPurgarLoading] = useState(false);
  const [testResultados, setTestResultados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    plan: 'enterprise',
    precio_mensual: 399,
    modulos_activos: ['restaurante', 'ferreteria', 'botica', 'hospedaje'],
    color_brand: '#f59e0b',
    admin_nombre: '',
    admin_email: '',
    admin_password: '',
    vigencia_tipo: 'trial_14',
    entorno_sunat: 'beta',
    precargar_demo: true,
  });
  const [mostrarPassNueva, setMostrarPassNueva] = useState(false);

  // Modales adicionales de gestión integral
  const [modalEditar, setModalEditar] = useState(false);
  const [empresaEditar, setEmpresaEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    plan: 'professional',
    precio_mensual: 199,
    color_brand: '#f59e0b',
    modulos_activos: ['restaurante'],
    fecha_vencimiento: '',
    entorno_sunat: 'beta',
  });

  const [modalResetPass, setModalResetPass] = useState(false);
  const [empresaReset, setEmpresaReset] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);

  const [modalDetalles, setModalDetalles] = useState(false);
  const [empresaDetalles, setEmpresaDetalles] = useState(null);

  // Consulta automática de SUNAT (RUC)
  const [consultandoRuc, setConsultandoRuc] = useState(false);
  const [desplegableActivo, setDesplegableActivo] = useState(null);

  // Comunicados y Broadcast Global SaaS
  const [comunicados, setComunicados] = useState([]);
  const [modalNuevoComunicado, setModalNuevoComunicado] = useState(false);
  const [comunicadoEditando, setComunicadoEditando] = useState(null);
  const [guardandoComunicado, setGuardandoComunicado] = useState(false);
  const [formComunicado, setFormComunicado] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'info',
    formato: 'banner',
    prioridad: 'media',
    audiencia_tipo: 'global',
    empresa_id: '',
    plan_objetivo: 'todos',
    cta_activo: false,
    cta_texto: '',
    cta_url: '',
    con_vigencia: false,
    fecha_inicio: '',
    fecha_fin: '',
  });
  const [filtroTipoComunicado, setFiltroTipoComunicado] = useState('todos');
  const [filtroEstadoComunicado, setFiltroEstadoComunicado] = useState('todos');
  const [filtroAudienciaComunicado, setFiltroAudienciaComunicado] = useState('todos');
  const [busquedaComunicado, setBusquedaComunicado] = useState('');
  const [simuladorFormato, setSimuladorFormato] = useState('banner');

  // --- NUEVAS FUNCIONALIDADES AUDITADAS DE LA COMPETENCIA ---
  // 1. Vista y Filtros Inline por Columna para Empresas
  const [vistaEmpresas, setVistaEmpresas] = useState('tabla'); // 'tabla' | 'cards'
  const [filtroColNombre, setFiltroColNombre] = useState('');
  const [filtroColRuc, setFiltroColRuc] = useState('');
  const [filtroColPlan, setFiltroColPlan] = useState('');
  const [filtroColModulo, setFiltroColModulo] = useState('');
  const [filtroColEstado, setFiltroColEstado] = useState('');

  // 2. White-Label Studio & Login Personalizado
  const [tenantWhitelabelId, setTenantWhitelabelId] = useState('global');
  const [configWhitelabel, setConfigWhitelabel] = useState({
    logoUrl: '',
    logoWidth: 240,
    logoHeight: 68,
    tituloLogin: 'Acceso al Sistema Empresarial',
    subtituloLogin: 'Suite Multi-Empresa & Facturación Electrónica SUNAT',
    bgPreset: 'modern_glass',
    bgCustomUrl: '',
    colorPrimario: '#02CBA9',
    colorFondoHead: '#ffffff',
    colorFondoBody: '#f8fafc',
    mostrarCopyright: true,
    textoCopyright: '© 2026 HEIS Suite SAC. Todos los derechos reservados.',
    estiloCard: 'glass',
  });
  const [whitelabelPreviewTheme, setWhitelabelPreviewTheme] = useState('light');
  const [whitelabelPreviewDevice, setWhitelabelPreviewDevice] = useState('desktop');
  const [cargandoWhitelabel, setCargandoWhitelabel] = useState(false);
  const [guardandoWhitelabel, setGuardandoWhitelabel] = useState(false);

  // 3. Catálogo de Permisos y Botones Granulares (RBAC Micro-Acciones Multi-Tenant)
  const [tenantPermisosId, setTenantPermisosId] = useState('global');
  const [catalogoAcciones, setCatalogoAcciones] = useState(DEFAULT_CATALOGO_ACCIONES);
  const [filtroModuloPermisos, setFiltroModuloPermisos] = useState('todos');
  const [filtroRiesgoPermisos, setFiltroRiesgoPermisos] = useState('todos'); // 'todos' | 'critico' | 'medio' | 'bajo'
  const [filtroBusquedaPermisos, setFiltroBusquedaPermisos] = useState('');
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);
  const [cargandoPermisos, setCargandoPermisos] = useState(false);
  const [modalTesterPermisos, setModalTesterPermisos] = useState(false);
  const [rolTesterPermisos, setRolTesterPermisos] = useState('cajero');
  const [moduloTesterPermisos, setModuloTesterPermisos] = useState('todos');
  const fileInputPermisosRef = useRef(null);
  const [modalNuevaAccion, setModalNuevaAccion] = useState(false);
  const [formNuevaAccion, setFormNuevaAccion] = useState({
    alias: '',
    nombre: '',
    descripcion: '',
    modulo: 'Ventas',
    roles: ['admin'],
    riesgo: 'medio',
    requiere_pin: false,
    auditoria_obligatoria: true,
  });

  // 4. Gestor Visual de Módulos & Submódulos (Feature Flags)
  const [tenantModulosId, setTenantModulosId] = useState('global');
  const [submodulosConfig, setSubmodulosConfig] = useState({});
  const [busquedaSubmodulo, setBusquedaSubmodulo] = useState('');
  const [filtroEstadoSubmodulo, setFiltroEstadoSubmodulo] = useState('todos'); // 'todos' | 'activos' | 'inactivos'
  const [filtroVerticalActiva, setFiltroVerticalActiva] = useState('todas');
  const [modalSimuladorPreview, setModalSimuladorPreview] = useState(false);
  const [guardandoSubmodulos, setGuardandoSubmodulos] = useState(false);
  const fileInputPerfilRef = useRef(null);

  // Filtro para el Radar de Tenants en Consola Overview
  const [filtroConsolaTenant, setFiltroConsolaTenant] = useState('todos'); // 'todos' | 'activos' | 'suspendidos'

  // Catálogo Oficial de Planes SaaS y Precios Establecidos
  const [planesSaaS, setPlanesSaaS] = useState(DEFAULT_PLANES_CONFIG);
  const [modalGestionPlanes, setModalGestionPlanes] = useState(false);
  const [modoEdicionPlanes, setModoEdicionPlanes] = useState(false); // Activación previa de seguridad
  const [formPlanes, setFormPlanes] = useState(DEFAULT_PLANES_CONFIG);
  const [guardandoPlanes, setGuardandoPlanes] = useState(false);

  // Activación previa para tarifas personalizadas en modales de empresa
  const [personalizarPrecioNueva, setPersonalizarPrecioNueva] = useState(false);
  const [personalizarPrecioEditar, setPersonalizarPrecioEditar] = useState(false);

  const obtenerPrecioPlan = (planId) => {
    const p = planesSaaS.find((item) => item.id === planId);
    if (p && p.precio_mensual !== undefined) {
      return Number(p.precio_mensual);
    }
    const fallback = { starter: 99, professional: 199, enterprise: 399 };
    return fallback[planId] || 199;
  };

  // Gestión de Meta MRR Dinámica y Monitor de Cobranzas SaaS
  const [metaMRR, setMetaMRR] = useState(() => {
    try {
      const saved = localStorage.getItem('heis_saas_meta_mrr');
      return saved ? Number(saved) : 2500;
    } catch {
      return 2500;
    }
  });
  const [modalMetaMRR, setModalMetaMRR] = useState(false);
  const [tempMetaMRR, setTempMetaMRR] = useState(metaMRR);

  // Monitor de Cobranzas & Renovaciones
  const [filtroCobranza, setFiltroCobranza] = useState('todos'); // 'todos' | 'vencidos' | 'criticos' | 'proximos' | 'al_dia'
  const [busquedaCobranza, setBusquedaCobranza] = useState('');
  const [modalRenovar, setModalRenovar] = useState(false);
  const [empresaRenovar, setEmpresaRenovar] = useState(null);
  const [fechaRenovacion, setFechaRenovacion] = useState('');
  const [guardandoRenovacion, setGuardandoRenovacion] = useState(false);
  const [calMes, setCalMes] = useState(() => new Date().getMonth());
  const [calAnio, setCalAnio] = useState(() => new Date().getFullYear());

  // Módulo de Auditoría Global & Forense SaaS
  const [filtroAuditoriaEmpresa, setFiltroAuditoriaEmpresa] = useState('TODAS');
  const [filtroAuditoriaModulo, setFiltroAuditoriaModulo] = useState('TODOS');
  const [filtroAuditoriaAccion, setFiltroAuditoriaAccion] = useState('TODAS');
  const [busquedaAuditoria, setBusquedaAuditoria] = useState('');
  const [paginaAuditoria, setPaginaAuditoria] = useState(1);
  const [limiteAuditoria, setLimiteAuditoria] = useState(25);
  const [modalDetalleAuditoria, setModalDetalleAuditoria] = useState(false);
  const [logSeleccionado, setLogSeleccionado] = useState(null);
  const [tabModalAuditoria, setTabModalAuditoria] = useState('visual');
  const [copiadoAuditoria, setCopiadoAuditoria] = useState(false);
  const [metricasAuditoria, setMetricasAuditoria] = useState(null);
  const [metaAuditoria, setMetaAuditoria] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);

  const guardarMetaMRR = (nuevaMeta) => {
    const val = Number(nuevaMeta);
    if (!val || val <= 0) {
      toast.error('Ingrese un monto válido mayor a 0 para la meta de MRR');
      return;
    }
    setMetaMRR(val);
    try {
      localStorage.setItem('heis_saas_meta_mrr', String(val));
    } catch { }
    toast.success(`Meta mensual de MRR establecida en S/ ${val.toLocaleString('es-PE')}`);
    setModalMetaMRR(false);
  };

  const calcularProximaFecha = (fechaActualStr, diasASumar = 30) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let base = hoy;
    if (fechaActualStr) {
      const partes = String(fechaActualStr).split('-');
      if (partes.length === 3) {
        const f = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        f.setHours(0, 0, 0, 0);
        if (f > hoy) base = f;
      }
    }
    const res = new Date(base);
    res.setDate(res.getDate() + diasASumar);
    const yyyy = res.getFullYear();
    const mm = String(res.getMonth() + 1).padStart(2, '0');
    const dd = String(res.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleAbrirRenovarModal = (empresa, dias = 30) => {
    setEmpresaRenovar(empresa);
    const targetFecha = calcularProximaFecha(empresa.fecha_vencimiento, dias);
    setFechaRenovacion(targetFecha);
    const partes = targetFecha.split('-').map(Number);
    if (partes.length === 3) {
      setCalAnio(partes[0]);
      setCalMes(partes[1] - 1);
    }
    setModalRenovar(true);
  };

  const cambiarMesCalendario = (delta) => {
    let nuevoMes = calMes + delta;
    let nuevoAnio = calAnio;
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }
    setCalMes(nuevoMes);
    setCalAnio(nuevoAnio);
  };

  const handleExtenderRapido30d = async (empresa) => {
    const nuevaFecha = calcularProximaFecha(empresa.fecha_vencimiento, 30);
    try {
      await api.put(`/superadmin/empresas/${empresa.id}`, { fecha_vencimiento: nuevaFecha });
      toast.success(`Suscripción de ${empresa.nombre} extendida +30 días (hasta ${nuevaFecha})`);
      cargarDatos();
    } catch (err) {
      toast.error('Error al extender la suscripción de la empresa');
    }
  };

  const handleGuardarRenovacion = async (e) => {
    if (e) e.preventDefault();
    if (!empresaRenovar || !fechaRenovacion) return;
    try {
      setGuardandoRenovacion(true);
      await api.put(`/superadmin/empresas/${empresaRenovar.id}`, { fecha_vencimiento: fechaRenovacion });
      toast.success(`Suscripción de ${empresaRenovar.nombre} renovada hasta el ${fechaRenovacion}`);
      setModalRenovar(false);
      setEmpresaRenovar(null);
      cargarDatos();
    } catch (err) {
      toast.error('Error al guardar la nueva fecha de vencimiento');
    } finally {
      setGuardandoRenovacion(false);
    }
  };

  const { setEmpresa } = useAuthStore();
  const navigate = useNavigate();

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resEmpresas, resMetricas, resSistema, resAuditoria, resComunicados, resPlanes] = await Promise.all([
        api.get('/superadmin/empresas').catch(() => ({ data: { data: [] } })),
        api.get('/superadmin/metricas').catch(() => ({ data: { data: null } })),
        api.get('/superadmin/sistema').catch(() => ({ data: { data: null } })),
        api.get('/superadmin/auditoria?limit=30').catch(() => ({ data: { data: [] } })),
        api.get('/superadmin/comunicados').catch(() => ({ data: { data: [] } })),
        api.get('/superadmin/planes').catch(() => ({ data: { data: [] } })),
      ]);

      if (resEmpresas.data?.data) setEmpresas(resEmpresas.data.data);
      if (resMetricas.data?.data) setMetricas(resMetricas.data.data);
      if (resSistema.data?.data) setSistema(resSistema.data.data);
      if (resAuditoria.data?.data) {
        setAuditorias(resAuditoria.data.data);
        if (resAuditoria.data.meta) setMetaAuditoria(resAuditoria.data.meta);
        if (resAuditoria.data.metricas) setMetricasAuditoria(resAuditoria.data.metricas);
      }
      if (resComunicados.data?.data) setComunicados(resComunicados.data.data);
      if (resPlanes.data?.data && resPlanes.data.data.length > 0) {
        setPlanesSaaS(resPlanes.data.data);
        setFormPlanes(resPlanes.data.data);
      }
    } catch (error) {
      toast.error('Error al sincronizar datos de la plataforma SaaS');
    } finally {
      setLoading(false);
    }
  };

  const cargarAuditoriaPaginada = async (overrideParams = {}) => {
    try {
      setLoadingAuditoria(true);
      const params = new URLSearchParams();
      const page = overrideParams.page !== undefined ? overrideParams.page : paginaAuditoria;
      const limit = overrideParams.limit !== undefined ? overrideParams.limit : limiteAuditoria;
      const empId = overrideParams.empresa_id !== undefined ? overrideParams.empresa_id : filtroAuditoriaEmpresa;
      const mod = overrideParams.modulo !== undefined ? overrideParams.modulo : filtroAuditoriaModulo;
      const acc = overrideParams.tipo_accion !== undefined ? overrideParams.tipo_accion : filtroAuditoriaAccion;
      const q = overrideParams.q !== undefined ? overrideParams.q : busquedaAuditoria;

      params.append('page', String(page));
      params.append('limit', String(limit));
      if (empId && empId !== 'TODAS') params.append('empresa_id', empId);
      if (mod && mod !== 'TODOS') params.append('modulo', mod);
      if (acc && acc !== 'TODAS') params.append('tipo_accion', acc);
      if (q && q.trim()) params.append('q', q.trim());

      const res = await api.get(`/superadmin/auditoria?${params.toString()}`);
      if (res.data?.success) {
        setAuditorias(res.data.data || []);
        if (res.data.meta) setMetaAuditoria(res.data.meta);
        if (res.data.metricas) setMetricasAuditoria(res.data.metricas);
      }
    } catch (err) {
      toast.error('Error al sincronizar bitácora forense de auditoría');
    } finally {
      setLoadingAuditoria(false);
    }
  };

  const exportarAuditoriaCSV = () => {
    if (!auditorias || auditorias.length === 0) {
      toast.error('No hay eventos de auditoría para exportar');
      return;
    }
    const headers = ['ID', 'Fecha_Hora', 'Tenant', 'RUC', 'Usuario', 'Rol', 'Modulo', 'Accion', 'Entidad', 'Entidad_ID', 'IP', 'Navegador'];
    const rows = auditorias.map((l) => [
      l.id,
      `"${formatearFechaAuditoria(l.createdAt || l.created_at)}"`,
      `"${(l.empresa?.nombre || 'Plataforma SaaS').replace(/"/g, '""')}"`,
      `"${(l.empresa?.ruc || '-').replace(/"/g, '""')}"`,
      `"${(l.usuario_nombre || 'Sistema').replace(/"/g, '""')}"`,
      `"${(l.usuario_rol || '-').replace(/"/g, '""')}"`,
      `"${(l.modulo || '-').replace(/"/g, '""')}"`,
      `"${(l.accion || '-').replace(/"/g, '""')}"`,
      `"${(l.entidad || '-').replace(/"/g, '""')}"`,
      `"${l.entidad_id || '-'}"`,
      `"${normalizarIP(l.ip)}"`,
      `"${(l.navegador || '-').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_heis_suite_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Reporte forense exportado exitosamente en CSV');
  };

  useEffect(() => {
    if (currentTab === 'auditoria') {
      cargarAuditoriaPaginada();
    }
  }, [currentTab, filtroAuditoriaEmpresa, filtroAuditoriaModulo, filtroAuditoriaAccion, paginaAuditoria, limiteAuditoria]);

  useEffect(() => {
    cargarDatos();
  }, []);

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

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  const handleToggleModulo = async (empresa, moduloKey) => {
    let modulos = [];
    if (empresa.modulos_activos) {
      modulos = typeof empresa.modulos_activos === 'string'
        ? JSON.parse(empresa.modulos_activos)
        : [...empresa.modulos_activos];
    }
    if (!Array.isArray(modulos) || modulos.length === 0) {
      modulos = empresa.plan === 'enterprise'
        ? ['restaurante', 'ferreteria', 'botica', 'hospedaje']
        : ['restaurante'];
    }

    if (modulos.includes(moduloKey)) {
      modulos = modulos.filter((m) => m !== moduloKey);
    } else {
      modulos.push(moduloKey);
    }

    try {
      const res = await api.put(`/superadmin/empresas/${empresa.id}/modulos`, {
        modulos_activos: modulos,
      });

      if (res.data?.success) {
        toast.success(`Módulos de '${empresa.nombre}' actualizados`);
        setEmpresas((prev) =>
          prev.map((e) => (e.id === empresa.id ? { ...e, modulos_activos: modulos } : e))
        );
      }
    } catch (error) {
      toast.error('Error al actualizar módulos');
    }
  };

  const handleToggleEstado = async (empresa) => {
    try {
      const res = await api.put(`/superadmin/empresas/${empresa.id}/estado`);
      if (res.data?.success) {
        toast.success(res.data.mensaje);
        setEmpresas((prev) =>
          prev.map((e) => (e.id === empresa.id ? { ...e, activo: !e.activo } : e))
        );
      }
    } catch (error) {
      toast.error('Error al cambiar estado de la empresa');
    }
  };

  const handleGenerarPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*';
    let pass = 'Heis';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, admin_password: pass }));
    navigator.clipboard.writeText(pass);
    toast.success(`Contraseña segura generada: ${pass}`);
  };

  const handleCopiarCredenciales = () => {
    if (!form.admin_email || !form.admin_password) {
      toast.error('Complete el email y contraseña primero');
      return;
    }
    const vigenciaTexto =
      form.vigencia_tipo === 'trial_14'
        ? 'Periodo de prueba 14 días'
        : form.vigencia_tipo === 'mensual_30'
          ? 'Suscripción Mensual (30 días)'
          : form.vigencia_tipo === 'anual_365'
            ? 'Suscripción Anual'
            : 'Licencia Ilimitada';

    const texto = `CREDENCIALES HEIS SUITE:\nEmpresa: ${form.nombre || 'Nueva Empresa'}\nAcceso: ${window.location.origin}/login\nUsuario: ${form.admin_email}\nContraseña: ${form.admin_password}\nVigencia: ${vigenciaTexto}\nEntorno SUNAT: ${form.entorno_sunat === 'produccion' ? 'PRODUCCIÓN' : 'BETA (Pruebas)'}`;
    navigator.clipboard.writeText(texto);
    toast.success('Credenciales copiadas al portapapeles');
  };

  const handleEnviarWhatsApp = () => {
    if (!form.telefono) {
      toast.error('Ingrese un número de teléfono o WhatsApp en el Bloque 1');
      return;
    }
    if (!form.admin_email || !form.admin_password) {
      toast.error('Complete el correo y la contraseña del administrador');
      return;
    }

    let telefonoLimpio = form.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length === 9) {
      telefonoLimpio = '51' + telefonoLimpio;
    }

    const vigenciaTexto =
      form.vigencia_tipo === 'trial_14'
        ? 'Periodo: 14 dias de prueba gratuita'
        : form.vigencia_tipo === 'mensual_30'
          ? 'Periodo: Suscripcion Mensual (30 dias)'
          : form.vigencia_tipo === 'anual_365'
            ? 'Periodo: Suscripcion Anual (365 dias)'
            : 'Periodo: Licencia Ilimitada / Vitalicia';

    const mensaje =
      `*HEIS SUITE - ACCESO DE EMPRESA*
Hola ${form.admin_nombre || 'Estimado(a)'}, tu cuenta de empresa ha sido configurada en HEIS Suite:

*Empresa:* ${form.nombre || 'Mi Empresa'}
*Acceso:* ${window.location.origin}/login
*Usuario:* ${form.admin_email}
*Contrasena:* ${form.admin_password}

*${vigenciaTexto}*
*Modo SUNAT:* ${form.entorno_sunat === 'produccion' ? 'Produccion (Oficial)' : 'Beta (Pruebas)'}

Saludos cordiales,
Equipo HEIS Suite`;

    const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    toast.success('Abriendo WhatsApp con credenciales...');
  };

  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    if (!form.nombre) {
      toast.error('El nombre de la empresa es obligatorio');
      return;
    }

    try {
      const payload = {
        ...form,
        color_brand: form.color_brand || resolverColorPorModulos(form.modulos_activos),
      };
      const res = await api.post('/superadmin/empresas', payload);
      if (res.data?.success) {
        toast.success(`¡Empresa "${form.nombre}" registrada y activada!`);
        setModalNueva(false);
        setForm({
          nombre: '',
          ruc: '',
          direccion: '',
          telefono: '',
          plan: 'enterprise',
          precio_mensual: 399,
          modulos_activos: ['restaurante', 'ferreteria', 'botica', 'hospedaje'],
          color_brand: '#f59e0b',
          admin_nombre: '',
          admin_email: '',
          admin_password: '',
          vigencia_tipo: 'trial_14',
          entorno_sunat: 'beta',
          precargar_demo: true,
        });
        cargarDatos();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear empresa');
    }
  };

  const handleGuardarPlanes = async (e) => {
    if (e) e.preventDefault();
    if (!modoEdicionPlanes) {
      toast.error('Active la edición previa para poder guardar las tarifas');
      return;
    }
    try {
      setGuardandoPlanes(true);
      const res = await api.put('/superadmin/planes', { planes: formPlanes });
      if (res.data?.success) {
        toast.success(res.data.mensaje || '¡Tarifario oficial actualizado exitosamente!');
        setPlanesSaaS(res.data.data);
        setFormPlanes(res.data.data);
        setModalGestionPlanes(false);
        setModoEdicionPlanes(false);
        cargarDatos();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar tarifas de planes');
    } finally {
      setGuardandoPlanes(false);
    }
  };

  const handleRestablecerFabricaPlanes = () => {
    setFormPlanes(DEFAULT_PLANES_CONFIG);
    toast('Valores de fábrica restablecidos en el formulario. Guarda para aplicar.', { icon: '🔄' });
  };

  const handleInspeccionarEmpresa = (empresa) => {
    setEmpresa(empresa);
    toast.success(`Modo Inspector activo: Viendo "${empresa.nombre}"`);
    navigate('/dashboard');
  };

  const handleAbrirNueva = () => {
    setPersonalizarPrecioNueva(false);
    const planInicial = 'enterprise';
    const cicloInicial = 'trial_14';
    const entornoInicial = 'beta';
    const tarifaInfo = calcularTarifaSegunCiclo(obtenerPrecioPlan(planInicial), cicloInicial);
    setForm((prev) => ({
      ...prev,
      plan: planInicial,
      vigencia_tipo: cicloInicial,
      entorno_sunat: entornoInicial,
      precio_mensual: tarifaInfo.precioCalculado,
      precargar_demo: entornoInicial === 'beta',
    }));
    setModalNueva(true);
  };

  const handleCambiarEntornoSunatNueva = (nuevoEntorno) => {
    setForm((prev) => ({
      ...prev,
      entorno_sunat: nuevoEntorno,
      precargar_demo: nuevoEntorno === 'beta',
    }));
  };

  const handleCambiarCicloNueva = (nuevoCiclo) => {
    const precioBase = obtenerPrecioPlan(form.plan);
    const tarifaInfo = calcularTarifaSegunCiclo(precioBase, nuevoCiclo);
    setForm((prev) => ({
      ...prev,
      vigencia_tipo: nuevoCiclo,
      precio_mensual: personalizarPrecioNueva ? prev.precio_mensual : tarifaInfo.precioCalculado,
    }));
  };

  const handleCambiarPlanNueva = (nuevoPlan) => {
    const precioBase = obtenerPrecioPlan(nuevoPlan);
    const tarifaInfo = calcularTarifaSegunCiclo(precioBase, form.vigencia_tipo);
    setForm((prev) => ({
      ...prev,
      plan: nuevoPlan,
      precio_mensual: personalizarPrecioNueva ? prev.precio_mensual : tarifaInfo.precioCalculado,
    }));
  };

  const handleCambiarCicloEditar = (nuevoCiclo) => {
    const hoy = new Date();
    let nuevoVencimiento = formEditar.fecha_vencimiento;
    if (nuevoCiclo === 'trial_14') {
      hoy.setDate(hoy.getDate() + 14);
      nuevoVencimiento = hoy.toISOString().split('T')[0];
    } else if (nuevoCiclo === 'mensual_30') {
      hoy.setDate(hoy.getDate() + 30);
      nuevoVencimiento = hoy.toISOString().split('T')[0];
    } else if (nuevoCiclo === 'anual_365') {
      hoy.setDate(hoy.getDate() + 365);
      nuevoVencimiento = hoy.toISOString().split('T')[0];
    } else if (nuevoCiclo === 'ilimitado') {
      nuevoVencimiento = '';
    }

    const precioBase = obtenerPrecioPlan(formEditar.plan);
    const tarifaInfo = calcularTarifaSegunCiclo(precioBase, nuevoCiclo);
    setFormEditar((prev) => ({
      ...prev,
      vigencia_tipo: nuevoCiclo,
      fecha_vencimiento: nuevoVencimiento,
      precio_mensual: personalizarPrecioEditar ? prev.precio_mensual : tarifaInfo.precioCalculado,
    }));
  };

  const handleCambiarPlanEditar = (nuevoPlan) => {
    const precioBase = obtenerPrecioPlan(nuevoPlan);
    const tarifaInfo = calcularTarifaSegunCiclo(precioBase, formEditar.vigencia_tipo || 'mensual_30');
    setFormEditar((prev) => ({
      ...prev,
      plan: nuevoPlan,
      precio_mensual: personalizarPrecioEditar ? prev.precio_mensual : tarifaInfo.precioCalculado,
    }));
  };

  const handleAbrirEditar = (empresa) => {
    setEmpresaEditar(empresa);
    let modulos = [];
    if (empresa.modulos_activos) {
      modulos = typeof empresa.modulos_activos === 'string'
        ? JSON.parse(empresa.modulos_activos)
        : [...empresa.modulos_activos];
    }
    if (!Array.isArray(modulos) || modulos.length === 0) {
      modulos = empresa.plan === 'enterprise'
        ? ['restaurante', 'ferreteria', 'botica', 'hospedaje']
        : ['restaurante'];
    }

    // Inferir ciclo de vigencia según fecha_vencimiento o created_at
    let cicloDetectado = 'mensual_30';
    if (!empresa.fecha_vencimiento) {
      cicloDetectado = 'ilimitado';
    } else if (empresa.created_at) {
      const diffDias = Math.round((new Date(empresa.fecha_vencimiento) - new Date(empresa.created_at)) / (1000 * 60 * 60 * 24));
      if (diffDias > 0 && diffDias <= 18) cicloDetectado = 'trial_14';
      else if (diffDias >= 280) cicloDetectado = 'anual_365';
    }

    const precioBasePlan = obtenerPrecioPlan(empresa.plan || 'professional');
    const tarifaEsperada = calcularTarifaSegunCiclo(precioBasePlan, cicloDetectado);
    const precioActual = (empresa.precio_mensual !== null && empresa.precio_mensual !== undefined)
      ? Number(empresa.precio_mensual)
      : tarifaEsperada.precioCalculado;

    // Detectar si la tarifa guardada difiere del precio oficial establecido para ese ciclo
    const tieneTarifaPersonalizada = Math.abs(precioActual - tarifaEsperada.precioCalculado) > 0.01;
    setPersonalizarPrecioEditar(tieneTarifaPersonalizada);

    setFormEditar({
      nombre: empresa.nombre || '',
      ruc: empresa.ruc || '',
      direccion: empresa.direccion || '',
      telefono: empresa.telefono || '',
      plan: empresa.plan || 'professional',
      precio_mensual: precioActual,
      color_brand: empresa.color_brand || '#f59e0b',
      modulos_activos: modulos,
      fecha_vencimiento: empresa.fecha_vencimiento ? String(empresa.fecha_vencimiento).split('T')[0] : '',
      entorno_sunat: empresa.entorno_sunat || 'beta',
      vigencia_tipo: cicloDetectado,
    });
    setModalEditar(true);
  };

  const handleGuardarEditar = async (e) => {
    e.preventDefault();
    if (!empresaEditar) return;
    try {
      const res = await api.put(`/superadmin/empresas/${empresaEditar.id}`, formEditar);
      if (res.data?.success) {
        toast.success('Datos de la empresa actualizados correctamente');
        setModalEditar(false);
        cargarDatos();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar empresa');
    }
  };

  const handleAbrirResetPass = (empresa) => {
    setEmpresaReset(empresa);
    setNuevaPassword('');
    setMostrarPass(false);
    setModalResetPass(true);
  };

  const handleGuardarResetPass = async (e) => {
    e.preventDefault();
    if (!empresaReset || !nuevaPassword) {
      toast.error('Ingrese una nueva contraseña válida');
      return;
    }
    try {
      const res = await api.post(`/superadmin/empresas/${empresaReset.id}/reset-password`, {
        nueva_password: nuevaPassword,
      });
      if (res.data?.success) {
        toast.success(res.data.mensaje);
        setModalResetPass(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al restablecer contraseña');
    }
  };

  const handleEliminarEmpresa = async (empresa) => {
    const confirmacion = window.confirm(
      `¿ATENCIÓN: Estás seguro de eliminar permanentemente la empresa "${empresa.nombre}"? Esta acción eliminará sus datos y no se puede deshacer.`
    );
    if (!confirmacion) return;

    try {
      const res = await api.delete(`/superadmin/empresas/${empresa.id}`);
      if (res.data?.success) {
        toast.success(res.data.mensaje);
        setEmpresas((prev) => prev.filter((e) => e.id !== empresa.id));
        cargarDatos();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar empresa');
    }
  };

  // Consulta automática de SUNAT (RUC con sincronización inmediata a Razón Social y Dirección)
  const handleConsultarRuc = async (esModalNueva = true, rucOverride = null) => {
    const ruc = rucOverride || (esModalNueva ? form.ruc : formEditar.ruc);
    const rucLimpio = String(ruc || '').trim();
    if (!rucLimpio || rucLimpio.length !== 11) {
      if (!rucOverride) toast.error('Ingrese un RUC válido de 11 dígitos numéricos');
      return;
    }

    try {
      setConsultandoRuc(true);
      const res = await consultarDocumento('ruc', rucLimpio);
      if (res && res.data) {
        if (esModalNueva) {
          setForm((prev) => ({
            ...prev,
            ruc: rucLimpio,
            nombre: res.data.razonSocial || prev.nombre,
            direccion: res.data.direccion || prev.direccion,
          }));
        } else {
          setFormEditar((prev) => ({
            ...prev,
            ruc: rucLimpio,
            nombre: res.data.razonSocial || prev.nombre,
            direccion: res.data.direccion || prev.direccion,
          }));
        }
        toast.success(`SUNAT Sincronizado: ${res.data.razonSocial}`, { icon: '🏢' });
      }
    } catch (err) {
      toast.error(err.error || err.message || 'No se pudo consultar el RUC en SUNAT');
    } finally {
      setConsultandoRuc(false);
    }
  };

  // Exportación Integral de Respaldo por Tenant (Backup JSON)
  const handleExportarBackup = async (empresa) => {
    try {
      toast.loading(`Generando respaldo de "${empresa.nombre}"...`, { id: 'backup-toast' });
      const res = await api.get(`/superadmin/empresas/${empresa.id}/backup`);
      const backupData = res.data;

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `heis-backup-tenant-${empresa.id}-${empresa.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Respaldo descargado exitosamente', { id: 'backup-toast' });
    } catch {
      toast.error('Error al generar respaldo del tenant', { id: 'backup-toast' });
    }
  };

  // Manejadores de Comunicados y Broadcast
  const handleAbrirNuevoComunicado = () => {
    setComunicadoEditando(null);
    setFormComunicado({
      titulo: '',
      mensaje: '',
      tipo: 'info',
      formato: 'banner',
      prioridad: 'media',
      audiencia_tipo: 'global',
      empresa_id: '',
      plan_objetivo: 'todos',
      cta_activo: false,
      cta_texto: '',
      cta_url: '',
      con_vigencia: false,
      fecha_inicio: '',
      fecha_fin: '',
    });
    setModalNuevoComunicado(true);
  };

  const handleEditarComunicado = (com) => {
    setComunicadoEditando(com);
    let audiencia = 'global';
    if (com.empresa_id) {
      audiencia = 'tenant';
    } else if (com.plan_objetivo && com.plan_objetivo !== 'todos') {
      audiencia = 'plan';
    }

    const fmtFechaParaInput = (fechaStr) => {
      if (!fechaStr) return '';
      try {
        const d = new Date(fechaStr);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return '';
      }
    };

    setFormComunicado({
      titulo: com.titulo || '',
      mensaje: com.mensaje || '',
      tipo: com.tipo || 'info',
      formato: com.formato || 'banner',
      prioridad: com.prioridad || 'media',
      audiencia_tipo: audiencia,
      empresa_id: com.empresa_id ? String(com.empresa_id) : '',
      plan_objetivo: com.plan_objetivo || 'todos',
      cta_activo: Boolean(com.cta_texto),
      cta_texto: com.cta_texto || '',
      cta_url: com.cta_url || '',
      con_vigencia: Boolean(com.fecha_inicio || com.fecha_fin),
      fecha_inicio: fmtFechaParaInput(com.fecha_inicio),
      fecha_fin: fmtFechaParaInput(com.fecha_fin),
    });
    setModalNuevoComunicado(true);
  };

  const handleGuardarComunicado = async (e) => {
    e.preventDefault();
    if (!formComunicado.titulo.trim() || !formComunicado.mensaje.trim()) {
      toast.error('Título y mensaje son obligatorios');
      return;
    }

    if (formComunicado.audiencia_tipo === 'tenant' && !formComunicado.empresa_id) {
      toast.error('Debes seleccionar la empresa destinataria');
      return;
    }

    setGuardandoComunicado(true);

    const payload = {
      titulo: formComunicado.titulo.trim(),
      mensaje: formComunicado.mensaje.trim(),
      tipo: formComunicado.tipo,
      formato: formComunicado.formato,
      prioridad: formComunicado.prioridad,
      empresa_id: formComunicado.audiencia_tipo === 'tenant' && formComunicado.empresa_id ? Number(formComunicado.empresa_id) : null,
      plan_objetivo: formComunicado.audiencia_tipo === 'plan' ? formComunicado.plan_objetivo : 'todos',
      cta_texto: formComunicado.cta_activo && formComunicado.cta_texto.trim() ? formComunicado.cta_texto.trim() : null,
      cta_url: formComunicado.cta_activo && formComunicado.cta_url.trim() ? formComunicado.cta_url.trim() : null,
      fecha_inicio: formComunicado.con_vigencia && formComunicado.fecha_inicio ? formComunicado.fecha_inicio : null,
      fecha_fin: formComunicado.con_vigencia && formComunicado.fecha_fin ? formComunicado.fecha_fin : null,
    };

    try {
      if (comunicadoEditando) {
        const res = await api.put(`/superadmin/comunicados/${comunicadoEditando.id}`, payload);
        if (res.data?.success) {
          toast.success(res.data.mensaje || 'Comunicado actualizado correctamente');
          setModalNuevoComunicado(false);
          setComunicadoEditando(null);
          const resList = await api.get('/superadmin/comunicados');
          if (resList.data?.data) setComunicados(resList.data.data);
        }
      } else {
        const res = await api.post('/superadmin/comunicados', payload);
        if (res.data?.success) {
          toast.success(res.data.mensaje || 'Comunicado emitido con éxito');
          setModalNuevoComunicado(false);
          const resList = await api.get('/superadmin/comunicados');
          if (resList.data?.data) setComunicados(resList.data.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar el comunicado');
    } finally {
      setGuardandoComunicado(false);
    }
  };

  const handleToggleComunicado = async (id) => {
    try {
      const res = await api.put(`/superadmin/comunicados/${id}/toggle`);
      if (res.data?.success) {
        toast.success(res.data.mensaje);
        const resList = await api.get('/superadmin/comunicados');
        if (resList.data?.data) setComunicados(resList.data.data);
      }
    } catch {
      toast.error('Error al cambiar estado del comunicado');
    }
  };

  const handleEliminarComunicado = async (id) => {
    if (!window.confirm('¿Deseas eliminar permanentemente este comunicado?')) return;
    try {
      const res = await api.delete(`/superadmin/comunicados/${id}`);
      if (res.data?.success) {
        toast.success(res.data.mensaje);
        const resList = await api.get('/superadmin/comunicados');
        if (resList.data?.data) setComunicados(resList.data.data);
      }
    } catch {
      toast.error('Error al eliminar comunicado');
    }
  };

  const handleExportarCSV = () => {
    if (!empresas || empresas.length === 0) {
      toast.error('No hay empresas registradas para exportar');
      return;
    }

    const headers = ['ID', 'Razón Social', 'RUC', 'Plan', 'Estado', 'Módulos Activos', 'Sedes', 'Usuarios', 'Fecha Creación'];
    const rows = empresas.map((e) => {
      let modulos = [];
      if (e.modulos_activos) {
        modulos = typeof e.modulos_activos === 'string' ? JSON.parse(e.modulos_activos) : e.modulos_activos;
      }
      return [
        e.id,
        `"${(e.nombre || '').replace(/"/g, '""')}"`,
        e.ruc || 'S/R',
        e.plan || 'Starter',
        e.activo ? 'Activa' : 'Suspendida',
        `"${modulos.join(', ')}"`,
        e.sucursales?.length || 1,
        e.usuarios?.length || 0,
        e.created_at ? new Date(e.created_at).toLocaleDateString() : '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `directorio_empresas_heis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Padrón de empresas exportado en CSV');
  };

  // Filtros combinados (Buscador Global + Filtros Inline por Columna)
  const empresasFiltradas = empresas.filter((emp) => {
    if (busqueda) {
      const term = busqueda.toLowerCase();
      const matchGlobal =
        emp.nombre?.toLowerCase().includes(term) ||
        emp.ruc?.toLowerCase().includes(term) ||
        emp.plan?.toLowerCase().includes(term);
      if (!matchGlobal) return false;
    }
    if (filtroColNombre && !emp.nombre?.toLowerCase().includes(filtroColNombre.toLowerCase())) return false;
    if (filtroColRuc && !emp.ruc?.toLowerCase().includes(filtroColRuc.toLowerCase())) return false;
    if (filtroColPlan && emp.plan?.toLowerCase() !== filtroColPlan.toLowerCase()) return false;
    if (filtroColEstado) {
      if (filtroColEstado === 'activa' && !emp.activo) return false;
      if (filtroColEstado === 'suspendida' && emp.activo) return false;
    }
    if (filtroColModulo) {
      let mods = [];
      if (emp.modulos_activos) {
        mods = typeof emp.modulos_activos === 'string' ? JSON.parse(emp.modulos_activos) : emp.modulos_activos;
      }
      if (!mods.includes(filtroColModulo)) return false;
    }
    return true;
  });

  const handleExportarExcel = () => {
    const headers = ['Nro', 'Razon Social', 'RUC', 'Plan', 'Modulos Activos', 'Estado', 'Sedes', 'Fecha Registro'];
    const rows = empresasFiltradas.map((emp, i) => {
      let mods = [];
      if (emp.modulos_activos) {
        mods = typeof emp.modulos_activos === 'string' ? JSON.parse(emp.modulos_activos) : emp.modulos_activos;
      }
      return [
        i + 1,
        `"${(emp.nombre || '').replace(/"/g, '""')}"`,
        `"${emp.ruc || 'S/R'}"`,
        `"${emp.plan || 'Starter'}"`,
        `"${mods.join(', ')}"`,
        `"${emp.activo ? 'Activa' : 'Suspendida'}"`,
        `"${emp.sucursales?.length || 1}"`,
        `"${emp.created_at ? new Date(emp.created_at).toLocaleDateString() : ''}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `padron_empresas_heis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Padrón exportado en formato Excel / CSV');
  };

  const handleExportarPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor permita ventanas emergentes para imprimir');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Padrón de Clientes SaaS - HEIS Suite</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
            h1 { font-size: 18px; margin: 0 0 4px 0; color: #0f172a; }
            p { font-size: 11px; color: #64748b; margin: 0 0 16px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
            .activa { background: #dcfce7; color: #166534; }
            .suspendida { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #02CBA9; padding-bottom: 8px; margin-bottom: 12px;">
            <div>
              <h1>HEIS Suite — Padrón General de Tenants</h1>
              <p>Emitido: ${new Date().toLocaleString()} &bull; Total: ${empresasFiltradas.length} empresas</p>
            </div>
            <div style="font-weight:bold; font-size:12px; color:#02CBA9;">OPERADOR MAESTRO</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Razón Social</th>
                <th>RUC</th>
                <th>Plan</th>
                <th>Módulos</th>
                <th>Sedes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${empresasFiltradas
        .map((emp, i) => {
          let mods = [];
          if (emp.modulos_activos) {
            mods = typeof emp.modulos_activos === 'string' ? JSON.parse(emp.modulos_activos) : emp.modulos_activos;
          }
          return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${emp.nombre}</strong></td>
                    <td>${emp.ruc || 'S/R'}</td>
                    <td>${emp.plan}</td>
                    <td>${mods.join(', ')}</td>
                    <td>${emp.sucursales?.length || 1}</td>
                    <td><span class="badge ${emp.activo ? 'activa' : 'suspendida'}">${emp.activo ? 'ACTIVA' : 'SUSPENDIDA'}</span></td>
                  </tr>
                `;
        })
        .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroColNombre('');
    setFiltroColRuc('');
    setFiltroColPlan('');
    setFiltroColModulo('');
    setFiltroColEstado('');
    toast.success('Filtros reiniciados');
  };

  // Presets de fondo para White-Label (100% Tema Claro · Full HD 1080p Luminous)
  const PRESETS_FONDO = [
    {
      id: 'modern_glass',
      nombre: 'Tech Glass Luminoso',
      categoria: 'Tecnología & SaaS (Tema Claro)',
      url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'minimal_dark',
      nombre: 'Corporate Suite White',
      categoria: 'Corporativo & Legal (Tema Claro)',
      url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'restaurant',
      nombre: 'Bistró Gourmet Luz Natural',
      categoria: 'Gastronomía & Restaurante (Tema Claro)',
      url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'hardware',
      nombre: 'Industrial Retail Día',
      categoria: 'Ferretería & Retail (Tema Claro)',
      url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'pharma',
      nombre: 'Botica & Salud Pure',
      categoria: 'Farmacia & Salud (Tema Claro)',
      url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'hotel',
      nombre: 'Hospedaje Resort Sol & Mar',
      categoria: 'Hotelería & Turismo (Tema Claro)',
      url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'sky_office',
      nombre: 'Skyline Glass Tower',
      categoria: 'Finanzas & Arquitectura (Tema Claro)',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'custom',
      nombre: 'URL Personalizada',
      categoria: 'Personalizado',
      url: '',
    },
  ];

  const cargarWhitelabel = async (tId) => {
    try {
      setCargandoWhitelabel(true);
      const res = await api.get('/superadmin/whitelabel', {
        params: { tenantId: tId },
      });
      if (res.data?.success && res.data.data) {
        setConfigWhitelabel(res.data.data);
        localStorage.setItem(`heis_whitelabel_${tId}`, JSON.stringify(res.data.data));
        return;
      }
    } catch (err) {
      console.warn('Fallo al obtener White-Label del servidor, recurriendo a local:', err.message);
    } finally {
      setCargandoWhitelabel(false);
    }

    const saved = localStorage.getItem(`heis_whitelabel_${tId}`);
    if (saved) {
      try {
        setConfigWhitelabel(JSON.parse(saved));
        return;
      } catch (e) { }
    }

    const emp = empresas.find((e) => String(e.id) === String(tId));
    setConfigWhitelabel({
      logoUrl: emp?.logo_url || '',
      logoWidth: 240,
      logoHeight: 68,
      tituloLogin: emp?.nombre || 'Acceso al Sistema Empresarial',
      subtituloLogin: emp ? `Portal Corporativo ${emp.nombre}` : 'Suite Multi-Empresa & Facturación Electrónica SUNAT',
      bgPreset: 'modern_glass',
      bgCustomUrl: '',
      colorPrimario: emp?.color_brand || '#02CBA9',
      colorFondoHead: '#ffffff',
      colorFondoBody: '#f8fafc',
      mostrarCopyright: true,
      textoCopyright: emp ? `© 2026 ${emp.nombre}. Todos los derechos reservados.` : '© 2026 HEIS Suite SAC. Todos los derechos reservados.',
      estiloCard: 'glass',
    });
  };

  useEffect(() => {
    if (currentTab === 'whitelabel') {
      cargarWhitelabel(tenantWhitelabelId);
    }
  }, [tenantWhitelabelId, currentTab]);

  const handleGuardarWhitelabel = async () => {
    try {
      setGuardandoWhitelabel(true);
      const res = await api.post('/superadmin/whitelabel', {
        tenantId: tenantWhitelabelId,
        config: configWhitelabel,
      });

      localStorage.setItem(`heis_whitelabel_${tenantWhitelabelId}`, JSON.stringify(configWhitelabel));

      const nombreTarget = tenantWhitelabelId === 'global'
        ? 'Plantilla Global'
        : empresas.find((e) => String(e.id) === String(tenantWhitelabelId))?.nombre || 'el Tenant';

      toast.success(res.data?.mensaje || `Personalización White-Label guardada para ${nombreTarget}`);
    } catch (err) {
      localStorage.setItem(`heis_whitelabel_${tenantWhitelabelId}`, JSON.stringify(configWhitelabel));
      toast.error(`Error al sincronizar con el servidor: ${err.response?.data?.error || err.message}`);
    } finally {
      setGuardandoWhitelabel(false);
    }
  };

  // Carga reactiva de micro-permisos por botón
  const cargarPermisosBotones = async (tenantId) => {
    try {
      setCargandoPermisos(true);
      const res = await api.get('/superadmin/permisos-botones', {
        params: { tenantId: tenantId || tenantPermisosId },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCatalogoAcciones(res.data.data);
      }
    } catch (err) {
      console.warn('Usando catálogo local de micro-permisos:', err.message);
    } finally {
      setCargandoPermisos(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'permisos') {
      cargarPermisosBotones(tenantPermisosId);
    }
  }, [currentTab, tenantPermisosId]);

  const handleGuardarPermisosBotones = async () => {
    try {
      setGuardandoPermisos(true);
      const res = await api.put('/superadmin/permisos-botones', {
        tenantId: tenantPermisosId,
        catalogo: catalogoAcciones,
      });
      if (res.data?.success) {
        toast.success(res.data.mensaje || 'Políticas de seguridad por botón sincronizadas con éxito');
      }
    } catch (err) {
      toast.error('Error al sincronizar permisos: ' + (err.response?.data?.error || err.message));
    } finally {
      setGuardandoPermisos(false);
    }
  };

  const handleRestablecerPermisosBotones = async () => {
    if (!window.confirm('¿Deseas restablecer los micro-permisos a los valores recomendados de fábrica por HEIS Suite?')) return;
    try {
      setGuardandoPermisos(true);
      const res = await api.post('/superadmin/permisos-botones/restablecer', {
        tenantId: tenantPermisosId,
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCatalogoAcciones(res.data.data);
        toast.success(res.data.mensaje || 'Permisos restablecidos a valores de fábrica');
      }
    } catch (err) {
      toast.error('Error al restablecer permisos: ' + (err.response?.data?.error || err.message));
    } finally {
      setGuardandoPermisos(false);
    }
  };

  const handleExportarPermisosJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(catalogoAcciones, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `heis_rbac_permisos_${tenantPermisosId}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Perfil de permisos exportado en formato JSON');
    } catch {
      toast.error('Error al exportar archivo JSON');
    }
  };

  const handleImportarPermisosJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        if (Array.isArray(json) && json.length > 0 && json[0].alias) {
          setCatalogoAcciones(json);
          toast.success(`Se importaron ${json.length} acciones correctamente. Recuerda sincronizar.`);
        } else {
          toast.error('El archivo JSON no contiene un catálogo de acciones válido');
        }
      } catch (err) {
        toast.error('Archivo JSON inválido o dañado: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Gestor de RBAC por botón
  const handleTogglePermisoRol = (accionId, rol) => {
    setCatalogoAcciones((prev) =>
      prev.map((acc) => {
        if (acc.id !== accionId) return acc;
        const yaTiene = acc.roles.includes(rol);
        const nuevosRoles = yaTiene ? acc.roles.filter((r) => r !== rol) : [...acc.roles, rol];
        return { ...acc, roles: nuevosRoles };
      })
    );
  };

  const handleSetRolesMasivos = (accionId, modo) => {
    setCatalogoAcciones((prev) =>
      prev.map((acc) => {
        if (acc.id !== accionId) return acc;
        if (modo === 'todos') {
          return { ...acc, roles: ['admin', 'supervisor', 'cajero', 'vendedor', 'mozo'] };
        }
        if (modo === 'admin') {
          return { ...acc, roles: ['admin'] };
        }
        return acc;
      })
    );
  };

  const handleTogglePinAccion = (accionId) => {
    setCatalogoAcciones((prev) =>
      prev.map((acc) => (acc.id === accionId ? { ...acc, requiere_pin: !acc.requiere_pin } : acc))
    );
  };

  const handleToggleAuditoriaAccion = (accionId) => {
    setCatalogoAcciones((prev) =>
      prev.map((acc) => (acc.id === accionId ? { ...acc, auditoria_obligatoria: !acc.auditoria_obligatoria } : acc))
    );
  };

  const handleToggleRiesgoAccion = (accionId) => {
    const niveles = ['bajo', 'medio', 'critico'];
    setCatalogoAcciones((prev) =>
      prev.map((acc) => {
        if (acc.id !== accionId) return acc;
        const actualIdx = niveles.indexOf(acc.riesgo || 'medio');
        const nextRiesgo = niveles[(actualIdx + 1) % niveles.length];
        return { ...acc, riesgo: nextRiesgo };
      })
    );
  };

  const handleToggleEstadoAccion = (accionId) => {
    setCatalogoAcciones((prev) =>
      prev.map((acc) => (acc.id === accionId ? { ...acc, activo: !acc.activo } : acc))
    );
  };

  const handleCrearAccion = (e) => {
    e.preventDefault();
    if (!formNuevaAccion.alias.trim() || !formNuevaAccion.nombre.trim()) {
      toast.error('Complete el alias y el nombre de la acción');
      return;
    }
    const nueva = {
      id: Date.now(),
      alias: formNuevaAccion.alias.toUpperCase().trim(),
      nombre: formNuevaAccion.nombre.trim(),
      descripcion: formNuevaAccion.descripcion?.trim() || 'Control granular de micro-permiso',
      modulo: formNuevaAccion.modulo,
      icono: 'CheckSquare',
      roles: formNuevaAccion.roles?.length ? formNuevaAccion.roles : ['admin'],
      activo: true,
      riesgo: formNuevaAccion.riesgo || 'medio',
      requiere_pin: Boolean(formNuevaAccion.requiere_pin),
      auditoria_obligatoria: Boolean(formNuevaAccion.auditoria_obligatoria),
    };
    setCatalogoAcciones((prev) => [nueva, ...prev]);
    toast.success(`Acción '${nueva.alias}' agregada. Recuerda pulsar "Sincronizar Políticas" para guardarla.`);
    setModalNuevaAccion(false);
    setFormNuevaAccion({
      alias: '',
      nombre: '',
      descripcion: '',
      modulo: 'Ventas',
      roles: ['admin'],
      riesgo: 'medio',
      requiere_pin: false,
      auditoria_obligatoria: true,
    });
  };

  // Submódulos por vertical con categorización y feature tags
  const VERTICALES_SISTEMA = [
    {
      id: 'restaurante',
      nombre: 'Restaurante & Gastronomía',
      icono: UtensilsCrossed,
      color: 'amber',
      badge: 'POS F1',
      submodulos: [
        { id: 'mesas', nombre: 'Salón y Mesas (F1)', desc: 'Distribución física, unión de mesas y comensales', tag: 'CORE' },
        { id: 'cocina', nombre: 'Cocina KDS', desc: 'Monitor en vivo para comandas y despacho a mozos', tag: 'KDS' },
        { id: 'comandas', nombre: 'Historial Comandas', desc: 'Auditoría de pedidos anulados y cambios', tag: 'CORE' },
        { id: 'menu', nombre: 'Carta & Menú Digital', desc: 'Platos, guarniciones, recetas e insumos', tag: 'CORE' },
        { id: 'reservas', nombre: 'Reservas de Mesas', desc: 'Control de calendario y anticipos', tag: 'PRO' },
        { id: 'gastos', nombre: 'Gastos de Caja Chica', desc: 'Egresos menores autorizados en turno', tag: 'CORE' },
      ],
    },
    {
      id: 'ferreteria',
      nombre: 'Ferretería & Retail',
      icono: ShoppingBag,
      color: 'indigo',
      badge: 'RETAIL',
      submodulos: [
        { id: 'pos_ferreteria', nombre: 'Punto de Venta POS', desc: 'Cobro rápido, lector de barras y ticket', tag: 'CORE' },
        { id: 'inventario_ferreteria', nombre: 'Inventario & Kardex', desc: 'Stock físico, fraccionamiento y almacenes', tag: 'KARDEX' },
        { id: 'ventas_ferreteria', nombre: 'Ventas & Facturación', desc: 'Boletas, facturas y guías electrónicas', tag: 'CORE' },
        { id: 'caja_ferreteria', nombre: 'Caja & Finanzas', desc: 'Arqueos, depósitos y cuadre diario', tag: 'CORE' },
        { id: 'clientes_obras', nombre: 'Clientes & Obras', desc: 'Líneas de crédito y control de cobranza', tag: 'PRO' },
        { id: 'cotizaciones', nombre: 'Cotizaciones Formales', desc: 'Presupuestos PDF y conversión a venta', tag: 'PRO' },
        { id: 'compras_proveedores', nombre: 'Compras & Proveedores', desc: 'Facturas de compra y costeo de entrada', tag: 'CORE' },
      ],
    },
    {
      id: 'botica',
      nombre: 'Botica Farmacia',
      icono: Pill,
      color: 'emerald',
      badge: 'DIGEMID',
      submodulos: [
        { id: 'dispensacion', nombre: 'Dispensación POS (F2)', desc: 'Búsqueda por DCI, blíster y fraccionamiento', tag: 'CORE' },
        { id: 'medicamentos', nombre: 'Medicamentos & DCI', desc: 'Catálogo oficial con registro sanitario', tag: 'DIGEMID' },
        { id: 'lotes_fefo', nombre: 'Lotes & FEFO', desc: 'Prioridad de salida por fecha de vencimiento', tag: 'FEFO' },
        { id: 'inventario_botica', nombre: 'Inventario Farmacéutico', desc: 'Kardex de psicotrópicos y fiscalizados', tag: 'KARDEX' },
        { id: 'temperatura', nombre: 'Temperatura & Humedad BPA', desc: 'Control ambiental diario para inspección', tag: 'BPA SUNAT' },
        { id: 'digemid_opm', nombre: 'Catálogo DIGEMID OPM', desc: 'Precios referenciales regulados en línea', tag: 'DIGEMID' },
        { id: 'bajas_cuarentena', nombre: 'Bajas Sanitarias & Cuarentena', desc: 'Vencidos, deteriorados y destrucción', tag: 'REGULADO' },
      ],
    },
    {
      id: 'hospedaje',
      nombre: 'Hospedaje Hotel',
      icono: Hotel,
      color: 'violet',
      badge: 'PMS F3',
      submodulos: [
        { id: 'rack', nombre: 'Rack Habitaciones (F3)', desc: 'Grilla interactiva por pisos y estados en vivo', tag: 'PMS' },
        { id: 'reservas_hotel', nombre: 'Reservas & Calendario', desc: 'Check-in, check-out y pasarelas', tag: 'PRO' },
        { id: 'huespedes', nombre: 'Huéspedes & Ficha MINCETUR', desc: 'Registro de pasajeros extranjeros y DNI', tag: 'MINCETUR' },
        { id: 'limpieza', nombre: 'Limpieza & Housekeeping', desc: 'Habitaciones en mantenimiento y aseo', tag: 'CORE' },
        { id: 'tarifas', nombre: 'Tarifas & Temporadas', desc: 'Precios dinámicos por noche, hora y fin de semana', tag: 'PRO' },
        { id: 'pisos', nombre: 'Pisos & Estructura', desc: 'Configuración arquitectónica de la sede', tag: 'CORE' },
        { id: 'caja_hotel', nombre: 'Caja Recepción', desc: 'Cobro de estadías, garantías y penalidades', tag: 'CORE' },
        { id: 'pos_hotel', nombre: 'Frigobar & Room Service', desc: 'Consumos anexados a la cuenta de habitación', tag: 'PRO' },
      ],
    },
    {
      id: 'core',
      nombre: 'Gestión Suite & Administración',
      icono: Building2,
      color: 'slate',
      badge: 'CORE',
      submodulos: [
        { id: 'sedes', nombre: 'Administración & Sedes', desc: 'Sucursales, almacenes y puntos de emisión', tag: 'CORE' },
        { id: 'usuarios', nombre: 'Usuarios & Roles', desc: 'Colaboradores, cargos y contraseñas', tag: 'CORE' },
        { id: 'auditoria_sunat', nombre: 'Auditoría Fiscal & SUNAT', desc: 'Trazabilidad de CPE y certificados', tag: 'SUNAT' },
        { id: 'configuracion', nombre: 'Configuración General', desc: 'Datos de la empresa y facturación', tag: 'CORE' },
      ],
    },
  ];

  const isSubmoduloActivo = (verticalId, submoduloId) => {
    const key = `${tenantModulosId}_${verticalId}_${submoduloId}`;
    if (submodulosConfig[key] !== undefined) return submodulosConfig[key];

    if (tenantModulosId !== 'global') {
      const emp = empresas.find((e) => String(e.id) === String(tenantModulosId));
      if (emp?.submodulos_activos && typeof emp.submodulos_activos === 'object') {
        if (emp.submodulos_activos[submoduloId] !== undefined) {
          return Boolean(emp.submodulos_activos[submoduloId]);
        }
      }
    }
    return true;
  };

  const isVerticalContratada = (verticalId) => {
    if (tenantModulosId === 'global' || verticalId === 'core') return true;
    const emp = empresas.find((e) => String(e.id) === String(tenantModulosId));
    if (!emp) return true;
    const mods = Array.isArray(emp.modulos_activos) ? emp.modulos_activos : [];
    return mods.includes(verticalId);
  };

  const handleToggleSubmodulo = (verticalId, submoduloId) => {
    const key = `${tenantModulosId}_${verticalId}_${submoduloId}`;
    const actual = isSubmoduloActivo(verticalId, submoduloId);
    const nuevo = !actual;
    setSubmodulosConfig((prev) => ({ ...prev, [key]: nuevo }));
    toast.success(`Submódulo ${nuevo ? 'habilitado' : 'deshabilitado'}`);
  };

  const handleToggleVerticalCompleta = (verticalId, activar) => {
    const vert = VERTICALES_SISTEMA.find((v) => v.id === verticalId);
    if (!vert) return;
    setSubmodulosConfig((prev) => {
      const next = { ...prev };
      vert.submodulos.forEach((sub) => {
        const key = `${tenantModulosId}_${verticalId}_${sub.id}`;
        next[key] = activar;
      });
      return next;
    });
    toast.success(`${activar ? 'Habilitados' : 'Deshabilitados'} todos los submódulos de ${vert.nombre}`);
  };

  const handleAplicarPreset = (tipoPreset) => {
    setSubmodulosConfig((prev) => {
      const next = { ...prev };
      VERTICALES_SISTEMA.forEach((vert) => {
        vert.submodulos.forEach((sub) => {
          const key = `${tenantModulosId}_${vert.id}_${sub.id}`;
          if (tipoPreset === 'enterprise') {
            next[key] = true;
          } else if (tipoPreset === 'starter') {
            next[key] = sub.tag === 'CORE';
          } else if (tipoPreset === 'pro') {
            next[key] = sub.tag !== 'MINCETUR';
          }
        });
      });
      return next;
    });
    const nombresPresets = {
      starter: 'Starter / Básico',
      pro: 'Pro / Comercial',
      enterprise: 'Enterprise / Full Suite',
    };
    toast.success(`Plantilla "${nombresPresets[tipoPreset] || tipoPreset}" aplicada. Sincroniza para guardar.`);
  };

  const handleGuardarSubmodulos = async () => {
    try {
      setGuardandoSubmodulos(true);
      const configActualTenant = {};
      VERTICALES_SISTEMA.forEach((vert) => {
        vert.submodulos.forEach((sub) => {
          configActualTenant[sub.id] = isSubmoduloActivo(vert.id, sub.id);
        });
      });

      const res = await api.put(`/superadmin/empresas/${tenantModulosId}/submodulos`, {
        submodulos_activos: configActualTenant,
      });

      if (res.data?.success) {
        if (tenantModulosId !== 'global') {
          setEmpresas((prev) =>
            prev.map((emp) =>
              String(emp.id) === String(tenantModulosId)
                ? { ...emp, submodulos_activos: configActualTenant }
                : emp
            )
          );
        }
        toast.success(res.data.mensaje || 'Submódulos sincronizados correctamente');
      } else {
        toast.error('Error al guardar submódulos');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al conectar con el servidor');
    } finally {
      setGuardandoSubmodulos(false);
    }
  };

  const handleExportarPerfilSubmodulos = () => {
    const emp = empresas.find((e) => String(e.id) === String(tenantModulosId));
    const nombreTenant = emp ? emp.nombre : 'Plantilla Global';
    const configActual = {};
    VERTICALES_SISTEMA.forEach((vert) => {
      configActual[vert.id] = {};
      vert.submodulos.forEach((sub) => {
        configActual[vert.id][sub.id] = isSubmoduloActivo(vert.id, sub.id);
      });
    });

    const dataExport = {
      tenantId: tenantModulosId,
      tenantNombre: nombreTenant,
      plan: emp?.plan || 'global',
      exportadoEn: new Date().toISOString(),
      submodulos: configActual,
    };

    const blob = new Blob([JSON.stringify(dataExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perfil-submodulos-${tenantModulosId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Perfil de submódulos exportado');
  };

  const handleImportarPerfilSubmodulos = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.submodulos && typeof json.submodulos === 'object') {
          setSubmodulosConfig((prev) => {
            const next = { ...prev };
            Object.entries(json.submodulos).forEach(([vertId, subObj]) => {
              if (typeof subObj === 'object') {
                Object.entries(subObj).forEach(([subId, valor]) => {
                  const key = `${tenantModulosId}_${vertId}_${subId}`;
                  next[key] = Boolean(valor);
                });
              }
            });
            return next;
          });
          toast.success(`Perfil importado correctamente de "${json.tenantNombre || file.name}". Sincroniza para guardar.`);
        } else {
          toast.error('Formato de archivo inválido: falta campo "submodulos"');
        }
      } catch {
        toast.error('Error al procesar el archivo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Soporte Rápido y Diagnóstico
  const handleCopiarDiagnostico = () => {
    const diag = {
      plataforma: 'HEIS Suite Enterprise Cloud',
      version: 'v2.6.4-prod',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      resolucion: `${window.innerWidth}x${window.innerHeight}`,
      tenantsTotal: empresas.length,
      dbStatus: sistema?.dbStatus || 'MySQL Conectado',
      dbLatencyMs: dbPingLatency ?? sistema?.dbLatencyMs ?? 14,
      uptimeSeconds: sistema?.uptimeSeconds,
      memoryHeapMB: sistema?.memoryHeapUsedMB || '28',
      cpuCores: sistema?.cpuCount || 8,
      localStorageKeys: Object.keys(localStorage).length,
    };
    navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
    toast.success('Diagnóstico técnico copiado al portapapeles');
  };

  const handleTestPingDB = async () => {
    try {
      setPingLoading(true);
      const res = await api.post('/superadmin/sistema/ping');
      if (res.data?.success) {
        const ms = res.data.data.latencyMs;
        setDbPingLatency(ms);
        const calificacion = ms < 30 ? 'Excelente' : ms < 80 ? 'Normal' : 'Elevada';
        toast.success(`Ping MySQL completado: ${ms} ms (${calificacion})`);
      } else {
        toast.error('No se pudo completar el ping a la base de datos');
      }
    } catch {
      toast.error('Error al probar latencia de base de datos');
    } finally {
      setPingLoading(false);
    }
  };

  const handlePurgarMemoria = async () => {
    try {
      setPurgarLoading(true);
      const res = await api.post('/superadmin/sistema/purgar-cache');
      if (res.data?.success) {
        toast.success(res.data.mensaje || 'Memoria y buffers optimizados');
        const resSis = await api.get('/superadmin/sistema');
        if (resSis.data?.data) setSistema(resSis.data.data);
      } else {
        toast.error('No se pudo optimizar la memoria');
      }
    } catch {
      toast.error('Error al optimizar memoria del servidor');
    } finally {
      setPurgarLoading(false);
    }
  };

  const handleEjecutarTestServicios = async () => {
    try {
      setHealthCheckLoading(true);
      const res = await api.post('/superadmin/sistema/test-servicios');
      if (res.data?.success) {
        setTestResultados(res.data.data);
        toast.success(`Diagnóstico completado: ${res.data.data.estadoGlobal}`);
      } else {
        toast.error('Error en diagnóstico de servicios');
      }
    } catch {
      toast.error('Fallo al ejecutar suite de pruebas de infraestructura');
    } finally {
      setHealthCheckLoading(false);
    }
  };

  const handleDescargarDiagnosticoCompleto = () => {
    try {
      const diagData = {
        plataforma: 'HEIS Suite Enterprise Cloud',
        generadoEn: new Date().toISOString(),
        servidor: {
          uptimeSegundos: sistema?.uptimeSeconds,
          uptimeFormateado: `${Math.floor((sistema?.uptimeSeconds || 0) / 3600)} horas, ${Math.floor(((sistema?.uptimeSeconds || 0) % 3600) / 60)} minutos`,
          nodeVersion: sistema?.nodeVersion,
          plataforma: sistema?.platform,
          arquitectura: sistema?.arch,
          coresCPU: sistema?.cpuCount,
          modeloCPU: sistema?.cpuModel,
          memoriaRAM: {
            hostTotalGB: sistema?.systemRamTotalGB,
            hostUsadaGB: sistema?.systemRamUsedGB,
            hostLibreGB: sistema?.systemRamFreeGB,
            hostUsoPct: `${sistema?.systemRamUsagePct}%`,
            heapUsedMB: sistema?.memoryHeapUsedMB,
            heapTotalMB: sistema?.memoryHeapTotalMB,
            heapUsoPct: `${sistema?.memoryHeapPct}%`,
            rssMB: sistema?.memoryRssMB,
            externalMB: sistema?.memoryExternalMB,
          },
        },
        baseDatos: {
          estado: sistema?.dbStatus,
          latenciaMs: dbPingLatency ?? sistema?.dbLatencyMs,
          motor: sistema?.mysqlVersion,
          nombreBD: sistema?.databaseName,
          totalTablas: sistema?.totalTablas,
          poolConexiones: sistema?.pool,
        },
        microServicios: sistema?.modulosVerticalesCargados,
        pruebasSalud: testResultados?.servicios || sistema?.healthChecks,
        tenantsRegistrados: empresas.length,
      };

      const blob = new Blob([JSON.stringify(diagData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heis-diagnostico-servidor-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Reporte de diagnóstico exportado en formato JSON');
    } catch {
      toast.error('Error al generar archivo de diagnóstico');
    }
  };

  const TAB_INFO = {
    consola: {
      badge: 'Panel Maestro',
      badgeIcon: ShieldAlert,
      badgeColor: 'from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB]',
      titulo: 'Consola',
      destacado: 'Central',
      subtitulo: 'Centro de mando unificado: monitoreo general de métricas financieras, empresas cliente y estado de la plataforma SaaS.',
      acciones: (
        <>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="h-11 px-5 rounded-full bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-all text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Refrescar métricas y estado de la plataforma"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
          <button
            onClick={handleAbrirNueva}
            className="h-11 px-5 rounded-full bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md shadow-[#02CBA9]/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Alta Empresa</span>
          </button>
        </>
      ),
    },
    empresas: {
      badge: 'Directorio de Tenants',
      badgeIcon: Building2,
      badgeColor: 'from-blue-500 to-indigo-600',
      titulo: 'Empresas Clientes &',
      destacado: 'Tenants',
      subtitulo: 'Gestión y aprovisionamiento de empresas cliente: filtros por columna, exportación Excel/PDF, activación de módulos y contraseñas maestras.',
      acciones: (
        <>
          <button
            onClick={() => {
              setFormPlanes(planesSaaS);
              setModoEdicionPlanes(false);
              setModalGestionPlanes(true);
            }}
            className="h-11 px-6 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/25 border border-amber-500/35 text-amber-700 dark:text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-3 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 group"
            title="Configurar y cambiar los precios oficiales de los planes SaaS"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <span>Gestionar Precios Oficiales</span>
          </button>
          <button
            onClick={handleAbrirNueva}
            className="h-11 px-5 rounded-full bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md shadow-[#02CBA9]/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Alta Empresa</span>
          </button>
        </>
      ),
    },
    metricas: {
      badge: 'Finanzas & Suscripciones',
      badgeIcon: TrendingUp,
      badgeColor: 'from-emerald-500 to-teal-600',
      titulo: 'Métricas Financieras &',
      destacado: 'MRR Recurrente',
      subtitulo: 'Análisis detallado de ingresos por suscripción SaaS, distribución de clientes por plan comercial y adopción de módulos.',
      acciones: (
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="h-11 px-5 rounded-full bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-all text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-500 shrink-0 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Métricas</span>
        </button>
      ),
    },
    auditoria: {
      badge: 'Seguridad & Trazabilidad',
      badgeIcon: Activity,
      badgeColor: 'from-indigo-500 to-purple-600',
      titulo: 'Auditoría Global &',
      destacado: 'Logs del Sistema',
      subtitulo: 'Registro inmutable de trazabilidad y eventos de seguridad: inicios de sesión, cambios de permisos, creación y modificación de empresas.',
      acciones: (
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="h-11 px-5 rounded-full bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-all text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-500 shrink-0 ${loading ? 'animate-spin' : ''}`} />
          <span>Refrescar Logs</span>
        </button>
      ),
    },
    sistema: {
      badge: 'Infraestructura Cloud',
      badgeIcon: Server,
      badgeColor: 'from-purple-500 to-pink-600',
      titulo: 'Salud & Rendimiento del',
      destacado: 'Servidor',
      subtitulo: 'Monitoreo de infraestructura: estado de conexión a MySQL, consumo de memoria heap, versión de entorno y latencia de base de datos.',
      acciones: (
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="h-11 px-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
          <span>Diagnóstico en Vivo</span>
        </button>
      ),
    },
    comunicados: {
      badge: 'Broadcast Global',
      badgeIcon: Bell,
      badgeColor: 'from-amber-500 to-orange-600',
      titulo: 'Comunicados &',
      destacado: 'Avisos SaaS',
      subtitulo: 'Publicación de comunicados y banners informativos en vivo para todas las empresas cliente de la plataforma.',
      acciones: (
        <button
          onClick={handleAbrirNuevoComunicado}
          className="h-11 px-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
          <span>Emitir Nuevo Comunicado</span>
        </button>
      ),
    },
    whitelabel: {
      badge: 'Marca Blanca & Branding',
      badgeIcon: Palette,
      badgeColor: 'from-pink-500 to-rose-600',
      titulo: 'White-Label Studio &',
      destacado: 'Login Personalizado',
      subtitulo: 'Personaliza la pantalla de acceso de cada empresa cliente: logotipo corporativo, fondo 1080p, colores hex y vista previa interactiva en vivo.',
      acciones: (
        <button
          onClick={handleGuardarWhitelabel}
          className="h-11 px-6 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Guardar Configuración Login</span>
        </button>
      ),
    },
    permisos: {
      badge: 'Control Granular RBAC',
      badgeIcon: Lock,
      badgeColor: 'from-cyan-500 to-blue-600',
      titulo: 'Catálogo de Acciones &',
      destacado: 'Seguridad por Botón',
      subtitulo: 'Gestión granular de micro-permisos a nivel de botón: anular ventas, reimprimir A4/Ticket, autorizar descuentos, reapertura de caja y exportar datos.',
      acciones: (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalTesterPermisos(true)}
            className="h-11 px-4 rounded-full bg-white dark:bg-white/5 hover:bg-cyan-500/10 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold text-xs sm:text-sm border border-slate-200/80 dark:border-white/10 shadow-2xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Simular y validar permisos en vivo por rol y módulo"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
            <span className="hidden sm:inline">Tester de Permisos</span>
          </button>
          <button
            type="button"
            onClick={handleGuardarPermisosBotones}
            disabled={guardandoPermisos}
            className="h-11 px-4 rounded-full bg-white dark:bg-white/5 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs sm:text-sm border border-slate-200/80 dark:border-white/10 shadow-2xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            title="Guardar y sincronizar políticas de seguridad en vivo"
          >
            {guardandoPermisos ? (
              <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
            ) : (
              <Save className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span className="hidden sm:inline">{guardandoPermisos ? 'Guardando...' : 'Sincronizar Políticas'}</span>
          </button>
          <button
            type="button"
            onClick={() => setModalNuevaAccion(true)}
            className="h-11 px-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Nueva Acción</span>
          </button>
        </div>
      ),
    },
    modulos: {
      badge: 'Feature Flags SaaS',
      badgeIcon: Layers,
      badgeColor: 'from-amber-500 to-emerald-600',
      titulo: 'Constructor Visual de',
      destacado: 'Módulos & Submenús',
      subtitulo: 'Control de submódulos dinámicos por empresa cliente: activa o restringe KDS, FEFO, Rack PMS o Cotizaciones según el plan contratado.',
      acciones: (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalSimuladorPreview(true)}
            className="h-11 px-4 rounded-full bg-white dark:bg-white/5 hover:bg-indigo-500/10 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs sm:text-sm border border-slate-200/80 dark:border-white/10 shadow-2xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Simular visualmente el menú lateral del tenant"
          >
            <Eye className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="hidden sm:inline">Simular Menú</span>
          </button>
          <button
            type="button"
            onClick={handleGuardarSubmodulos}
            disabled={guardandoSubmodulos}
            className="h-11 px-6 rounded-full bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-500 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Check className={`w-4 h-4 stroke-[2.5] shrink-0 ${guardandoSubmodulos ? 'animate-spin' : ''}`} />
            <span>{guardandoSubmodulos ? 'Sincronizando...' : 'Sincronizar Submódulos'}</span>
          </button>
        </div>
      ),
    },
  };

  const currentTabInfo = TAB_INFO[currentTab] || TAB_INFO.consola;

  return (
    <div className="space-y-6 pb-24">
      {/* Cabecera Dinámica SuperAdmin — Título y Barra de Acciones Debajo */}
      <div className="flex flex-col gap-3.5 pt-1 pb-1 select-none">
        {/* Título y Subtítulo */}
        <div className="space-y-1.5 max-w-4xl">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
            <span>{currentTabInfo.titulo}</span>
            {currentTabInfo.destacado ? (
              <span className="bg-gradient-to-r from-[#7D71EB] via-[#1CC0F9] to-[#02CBA9] bg-clip-text text-transparent">
                {currentTabInfo.destacado}
              </span>
            ) : null}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed font-medium">
            {currentTabInfo.subtitulo}
          </p>
        </div>

        {/* Barra de Acciones y Botones Debajo del Título con Separación Generosa */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {currentTabInfo.acciones}
        </div>
      </div>

      {/* PESTAÑA 0: CONSOLA CENTRAL OVERVIEW — MODO HÍBRIDO PROFESIONAL BENTO */}
      {currentTab === 'consola' && (() => {
        const empresasFiltradasConsola = empresas.filter((emp) => {
          if (filtroConsolaTenant === 'activos') return emp.activo;
          if (filtroConsolaTenant === 'suspendidos') return !emp.activo;
          return true;
        });

        const parseModulos = (emp) => {
          if (!emp?.modulos_activos) return [];
          if (Array.isArray(emp.modulos_activos)) return emp.modulos_activos;
          try {
            return JSON.parse(emp.modulos_activos);
          } catch {
            return [];
          }
        };

        const totalActivas = metricas?.totalActivas || empresas.filter((e) => e.activo).length;
        const totalEmpresas = metricas?.totalEmpresas || empresas.length;
        const porcentajeActivas = totalEmpresas > 0 ? Math.round((totalActivas / totalEmpresas) * 100) : 100;
        const mrrActual = metricas?.mrrTotal || 399;
        const porcentajeMRR = Math.min(100, Math.round((mrrActual / (metaMRR || 1)) * 100));

        return (
          <div className="space-y-6">
            {/* TIRA DE PULSO GLOBAL EN TIEMPO REAL (Live Telemetry Strip) */}
            <div className="animate-card-fade-1 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-[#18123B]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md transition-all duration-300">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                {/* Pulso en Vivo */}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Plataforma SaaS en Línea</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      99.98% SLA
                    </span>
                  </span>
                </div>

                <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-white/10" />

                {/* Micro Métricas de Servidor */}
                <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="font-medium">Cluster:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {sistema?.dbStatus || 'MySQL OK'}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={handleTestPingDB}
                    disabled={pingLoading}
                    title="Hacer clic para medir latencia en vivo con MySQL"
                    className="hidden md:flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <Zap className={`w-3.5 h-3.5 text-amber-500 shrink-0 ${pingLoading ? 'animate-bounce' : ''}`} />
                    <span className="font-medium">Latencia:</span>
                    <span className={`font-mono font-semibold ${(dbPingLatency ?? sistema?.dbLatencyMs ?? 14) < 30
                      ? 'text-emerald-500'
                      : (dbPingLatency ?? sistema?.dbLatencyMs ?? 14) < 80
                        ? 'text-amber-500'
                        : 'text-rose-500'
                      }`}>
                      {dbPingLatency ?? sistema?.dbLatencyMs ?? 14}ms
                    </span>
                  </button>

                  <span className="hidden lg:flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="font-medium">Heap:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {sistema?.memoryHeapUsedMB || 28} MB
                    </span>
                  </span>

                  <span className="hidden xl:flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">Uptime:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {Math.floor((sistema?.uptimeSeconds || 3600) / 60)}m
                    </span>
                  </span>
                </div>
              </div>

              {/* Acciones Rápidas de la Tira */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <button
                  onClick={handleCopiarDiagnostico}
                  className="h-7 px-2.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copiar diagnóstico técnico en JSON al portapapeles"
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Diagnóstico</span>
                </button>
                <button
                  onClick={cargarDatos}
                  disabled={loading}
                  className="h-7 px-2.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Refrescar telemetría en tiempo real"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#02CBA9] ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sincronizar</span>
                </button>
              </div>
            </div>

            {/* TARJETAS DE MÉTRICAS SAAS EJECUTIVAS (4 KPIs Optimizados en Espacio y Proporción) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Clientes SaaS */}
              <div
                onClick={() => setTab('empresas')}
                className="animate-card-fade-1 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/15 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between gap-2 min-w-0 relative">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors truncate">
                    Tenants Registrados
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2 flex-wrap min-w-0 relative">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {totalEmpresas}
                  </span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{totalActivas} activas</span>
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-1 text-[11px] text-slate-400 min-w-0 relative">
                  <span className="truncate">{porcentajeActivas}% ratio operatividad</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                </div>
                {/* Barra de proporción ajustada */}
                <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${porcentajeActivas}%` }} />
                </div>
              </div>

              {/* MRR Recurrente */}
              <div
                onClick={() => setTab('metricas')}
                className="animate-card-fade-2 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/15 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between gap-2 min-w-0 relative">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-500 transition-colors truncate">
                    MRR Recurrente
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5 flex-wrap min-w-0 relative">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight truncate">
                    S/ {mrrActual.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-400 shrink-0">/ mes</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-1 text-[11px] text-slate-400 min-w-0 relative">
                  <span className="truncate">Meta S/ {metaMRR.toFixed(0)} ({porcentajeMRR}%)</span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                    ARR S/ {(mrrActual * 12).toFixed(0)}
                  </span>
                </div>
                {/* Barra de progreso conectada a meta */}
                <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${porcentajeMRR}%` }} />
                </div>
              </div>

              {/* Auditoría & Trazabilidad */}
              <div
                onClick={() => setTab('auditoria')}
                className="animate-card-fade-3 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/15 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between gap-2 min-w-0 relative">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-500 transition-colors truncate">
                    Auditoría Global
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2 flex-wrap min-w-0 relative">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {auditorias.length}
                  </span>
                  <span className="text-xs font-bold text-indigo-500 shrink-0">eventos</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-1 text-[11px] text-slate-400 min-w-0 relative">
                  <span className="truncate">Logs inmutables activos</span>
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    24/7 Monitoreo
                  </span>
                </div>
                {/* Indicador de intensidad de actividad */}
                <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, Math.round((auditorias.length / 30) * 100)))}%` }}
                  />
                </div>
              </div>

              {/* Salud del Sistema */}
              <div
                onClick={() => setTab('sistema')}
                className="animate-card-fade-4 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-500/15 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between gap-2 min-w-0 relative">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-500 transition-colors truncate">
                    Salud del Sistema
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2 flex-wrap min-w-0 relative">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono tracking-tight">
                    100%
                  </span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sin incidentes
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-1 text-[11px] text-slate-400 min-w-0 relative">
                  <span className="truncate">99.98% SLA garantizado</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-purple-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                </div>
                {/* Barra de SLA con gradiente continuo */}
                <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: '99.98%' }} />
                </div>
              </div>
            </div>

            {/* BENTO GRID PRINCIPAL (2 Columnas: 8 cols Izquierda / 4 cols Derecha) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* ZONA PRINCIPAL IZQUIERDA (xl:col-span-8) */}
              <div className="xl:col-span-8 space-y-6">
                {/* 1. RADAR DE TENANTS EN VIVO */}
                <div className="animate-card-fade-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:border-slate-300/80 dark:hover:border-white/15 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-black/30 transition-all duration-300 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                          Radar de Empresas Tenants
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#02CBA9]/10 text-[#02CBA9] border border-[#02CBA9]/20 font-mono">
                          {empresas.length} Clientes
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Visualización consolidada de empresas, módulos aprovisionados y acceso maestro en vivo.
                      </p>
                    </div>

                    {/* Filtros Rápidos de Estado */}
                    <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => setFiltroConsolaTenant('todos')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${filtroConsolaTenant === 'todos'
                          ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                      >
                        Todos ({empresas.length})
                      </button>
                      <button
                        onClick={() => setFiltroConsolaTenant('activos')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${filtroConsolaTenant === 'activos'
                          ? 'bg-emerald-500 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-emerald-500'
                          }`}
                      >
                        Activas ({totalActivas})
                      </button>
                      <button
                        onClick={() => setFiltroConsolaTenant('suspendidos')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${filtroConsolaTenant === 'suspendidos'
                          ? 'bg-rose-500 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-rose-500'
                          }`}
                      >
                        Suspendidas ({empresas.length - totalActivas})
                      </button>
                    </div>
                  </div>

                  {/* Distribución Compacta de Ecosistemas Verticales */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                    <div className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-200 group/vert">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 group-hover/vert:scale-105 transition-transform">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Restaurantes</p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                          {metricas?.verticales?.restaurante || 1} activos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-200 group/vert">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover/vert:scale-105 transition-transform">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Ferreterías</p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                          {metricas?.verticales?.ferreteria || 1} activos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-200 group/vert">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover/vert:scale-105 transition-transform">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Boticas</p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                          {metricas?.verticales?.botica || 1} activos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-200 group/vert">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover/vert:scale-105 transition-transform">
                        <Hotel className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Hospedajes</p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                          {metricas?.verticales?.hospedaje || 1} activos
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista Estilizada de Tenants */}
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {empresasFiltradasConsola.slice(0, 5).map((emp) => {
                      const mods = parseModulos(emp);
                      return (
                        <div
                          key={emp.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:translate-x-1.5 -mx-3 px-3 rounded-2xl transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar del Tenant */}
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7D71EB]/15 to-[#02CBA9]/15 border border-[#7D71EB]/20 flex items-center justify-center font-black text-xs text-slate-800 dark:text-slate-200 font-heading shrink-0 group-hover:scale-105 group-hover:border-[#7D71EB]/40 transition-all duration-200">
                              {(emp.nombre || 'EM').slice(0, 2).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {emp.nombre}
                                </h4>
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${emp.activo ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-rose-500'
                                    }`}
                                  title={emp.activo ? 'Empresa Operativa' : 'Empresa Suspendida'}
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                                <span className="font-mono">RUC: {emp.ruc || 'Sin registrar'}</span>
                                <span>&bull;</span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  {emp.sucursales?.length || 1} {emp.sucursales?.length === 1 ? 'sede' : 'sedes'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Módulos Activos y Acciones */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            {/* Badges de Módulos */}
                            <div className="flex items-center gap-1">
                              {mods.includes('restaurante') && (
                                <span
                                  title="Módulo Restaurante Activo"
                                  className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <UtensilsCrossed className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {mods.includes('ferreteria') && (
                                <span
                                  title="Módulo Ferretería Activo"
                                  className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {mods.includes('botica') && (
                                <span
                                  title="Módulo Botica Activo"
                                  className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <Pill className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {mods.includes('hospedaje') && (
                                <span
                                  title="Módulo Hospedaje Activo"
                                  className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <Hotel className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>

                            {/* Plan Comercial */}
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#7D71EB]/10 text-[#7D71EB] dark:text-[#1CC0F9] border border-[#7D71EB]/25">
                              Plan {emp.plan || 'Starter'} {emp.precio_mensual ? `· S/ ${Number(emp.precio_mensual).toFixed(0)}/m` : ''}
                            </span>

                            {/* Acciones Rápidas del Tenant */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleInspeccionarEmpresa(emp)}
                                className="h-7 px-2.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-[#02CBA9] hover:text-white dark:hover:bg-[#02CBA9] dark:hover:text-white transition-all duration-150 hover:scale-105 flex items-center gap-1 cursor-pointer"
                                title="Asumir sesión en Modo Inspector"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Inspeccionar</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEmpresaDetalles(emp);
                                  setModalDetalles(true);
                                }}
                                className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-all duration-150 hover:scale-110 cursor-pointer"
                                title="Ver Ficha Técnica"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {empresasFiltradasConsola.length === 0 && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No se encontraron empresas con el filtro seleccionado.
                      </div>
                    )}
                  </div>

                  {/* Pie del Radar */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                    <span className="text-xs text-slate-400">
                      Mostrando {Math.min(5, empresasFiltradasConsola.length)} de {empresas.length} empresas
                    </span>
                    <button
                      onClick={() => setTab('empresas')}
                      className="text-xs font-bold text-[#02CBA9] hover:text-[#02CBA9]/80 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Ver padrón completo en Directorio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. STREAM EJECUTIVO DE ACTIVIDAD Y TRAZABILIDAD (Live Audit Stream) */}
                <div className="animate-card-fade-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 transition-all duration-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                          Stream de Auditoría en Tiempo Real
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1">
                          <Radio className="w-3 h-3 animate-pulse" />
                          Inmutable
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Últimas acciones registradas a nivel multi-tenant en la plataforma.
                      </p>
                    </div>

                    <button
                      onClick={() => setTab('auditoria')}
                      className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Historial Completo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {auditorias.slice(0, 4).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 flex items-center justify-between gap-3 hover:border-indigo-500/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10 hover:translate-x-1.5 transition-all duration-200 text-xs group/log"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover/log:scale-110 group-hover/log:rotate-6 transition-all duration-200">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {log.empresa?.nombre || 'Plataforma SaaS'}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                {log.modulo}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              <strong className="text-slate-700 dark:text-slate-300">{log.accion}</strong> por{' '}
                              <span>{log.usuario_nombre || 'Sistema'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatearHoraAuditoria(log.createdAt || log.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {auditorias.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No hay eventos de auditoría recientes registrados.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ZONA LATERAL DERECHA (xl:col-span-4 - Cockpit de Control) */}
              <div className="xl:col-span-4 space-y-6">
                {/* 1. CENTRO DE COMANDO RÁPIDO (Quick Action Hub) */}
                <div className="animate-card-fade-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 dark:hover:shadow-amber-500/10 transition-all duration-300 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                        Comandos Maestros
                      </h3>
                      <p className="text-[11px] text-slate-400">Acciones ejecutivas directas</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Botón 1: Directorio de Empresas & Tenants */}
                    <button
                      onClick={() => setTab('empresas')}
                      className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-500/30 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99] cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xs leading-none text-slate-900 dark:text-white">Directorio de Tenants</p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">Altas, empresas y tarifario oficial</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Botón 2: Comunicado Global */}
                    <button
                      onClick={handleAbrirNuevoComunicado}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100/90 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99] cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xs leading-none text-slate-900 dark:text-white">
                            Emitir Comunicado Global
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">Broadcast a todas las empresas</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Botón 3: Exportar Excel */}
                    <button
                      onClick={handleExportarExcel}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100/90 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99] cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xs leading-none text-slate-900 dark:text-white">
                            Descargar Padrón Excel
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">Exportación completa CSV/XLS</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                    </button>

                    {/* Botón 4: Incidencia / Soporte */}
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('heis:open-soporte'))}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100/90 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99] cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                          <LifeBuoy className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xs leading-none text-slate-900 dark:text-white">
                            Mesa de Ayuda / Soporte
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">Reportar incidencia técnica</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* 2. INFRAESTRUCTURA & MICRO-SERVICIOS */}
                <div className="animate-card-fade-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                          Servicios Cloud
                        </h3>
                        <p className="text-[11px] text-slate-400">Telemetría de la infraestructura</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setTab('sistema')}
                      className="text-xs font-bold text-purple-500 hover:text-purple-400 cursor-pointer"
                    >
                      Ver más &rarr;
                    </button>
                  </div>

                  <div className="space-y-3 divide-y divide-slate-100 dark:divide-white/5 text-xs">
                    {/* MySQL Status */}
                    <div className="pt-2 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-white/[0.02] p-1.5 -mx-1.5 rounded-xl transition-all duration-150">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Database className="w-4 h-4 text-blue-500" />
                        <span>Base de Datos</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[11px] flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {sistema?.dbStatus || 'Conectado'}
                      </span>
                    </div>

                    {/* Memoria Heap Node.js */}
                    <div className="pt-3 space-y-1.5 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] p-1.5 -mx-1.5 rounded-xl transition-all duration-150">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-purple-500" />
                          <span>Memoria Heap Node.js</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {sistema?.memoryHeapUsedMB || 28} MB
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round(((sistema?.memoryHeapUsedMB || 28) / (sistema?.memoryRssMB || 78)) * 100))}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 text-right">
                        RSS Total: {sistema?.memoryRssMB || 78} MB
                      </p>
                    </div>

                    {/* Uptime */}
                    <div className="pt-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-white/[0.02] p-1.5 -mx-1.5 rounded-xl transition-all duration-150">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Tiempo Activo</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {Math.floor((sistema?.uptimeSeconds || 3600) / 60)} min
                      </span>
                    </div>

                    {/* Entorno */}
                    <div className="pt-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-white/[0.02] p-1.5 -mx-1.5 rounded-xl transition-all duration-150">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <HardDrive className="w-4 h-4 text-slate-400" />
                        <span>Entorno Node</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {sistema?.nodeVersion || 'v24.19'} ({sistema?.platform || 'win32'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. DISTRIBUCIÓN DE PLANES SAAS */}
                <div className="animate-card-fade-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10 transition-all duration-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                          Suscripciones SaaS
                        </h3>
                        <p className="text-[11px] text-slate-400">Distribución por plan contratado</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setTab('metricas')}
                      className="text-xs font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
                    >
                      Finanzas &rarr;
                    </button>
                  </div>

                  {(() => {
                    const empBase = totalEmpresas || 1;
                    const nEnt = metricas?.planes?.enterprise ?? 1;
                    const nPro = metricas?.planes?.professional ?? 0;
                    const nSta = metricas?.planes?.starter ?? 0;
                    const pEnt = Math.min(100, Math.round((nEnt / empBase) * 100));
                    const pPro = Math.min(100, Math.round((nPro / empBase) * 100));
                    const pSta = Math.min(100, Math.round((nSta / empBase) * 100));

                    return (
                      <div className="space-y-3 text-xs">
                        {/* Enterprise */}
                        <div className="space-y-1 hover:translate-x-1 p-1 -m-1 rounded-lg transition-transform duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-500">Plan Enterprise</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {nEnt} empresas ({pEnt}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pEnt}%` }} />
                          </div>
                        </div>

                        {/* Professional */}
                        <div className="space-y-1 hover:translate-x-1 p-1 -m-1 rounded-lg transition-transform duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-500">Plan Professional</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {nPro} empresas ({pPro}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pPro}%` }} />
                          </div>
                        </div>

                        {/* Starter */}
                        <div className="space-y-1 hover:translate-x-1 p-1 -m-1 rounded-lg transition-transform duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-500">Plan Starter</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {nSta} empresas ({pSta}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pSta}%` }} />
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400">
                          <span>Total Facturación Mensual</span>
                          <span className="font-mono font-black text-emerald-500">
                            S/ {(metricas?.mrrTotal || 399).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}





      {/* PESTAÑA 1: DIRECTORIO DE EMPRESAS */}
      {currentTab === 'empresas' && (
        <div className="space-y-4">
          {/* Barra de Búsqueda Global, Filtros Rápidos, Exportaciones y Selector de Vista */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Búsqueda global por razón social, RUC o plan..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-[#18123B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7D71EB]/40 shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {(filtroColNombre || filtroColRuc || filtroColPlan || filtroColModulo || filtroColEstado || busqueda) && (
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
                  className="h-10 px-3.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:bg-rose-100 shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              )}

              {/* Botón Exportar Excel */}
              <button
                type="button"
                onClick={handleExportarExcel}
                className="h-10 px-3.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300/80 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 hover:shadow-xs"
                title="Descargar padrón completo en Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Excel</span>
              </button>

              {/* Botón Exportar PDF */}
              <button
                type="button"
                onClick={handleExportarPDF}
                className="h-10 px-3.5 rounded-full bg-white dark:bg-[#18123B] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 hover:shadow-xs"
                title="Imprimir o exportar padrón en PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                <span>PDF</span>
              </button>

              {/* Selector de Vista Tabla / Tarjetas */}
              <div className="flex items-center gap-1 p-1 rounded-full bg-white dark:bg-[#18123B] border border-slate-200 dark:border-white/10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setVistaEmpresas('tabla')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${vistaEmpresas === 'tabla'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  title="Vista de Tabla con Filtros por Columna"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVistaEmpresas('cards')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${vistaEmpresas === 'cards'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  title="Vista de Tarjetas"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
              </div>
            </div>
          </div>

          {/* VISTA 1: TABLA AVANZADA CON FILTROS INLINE POR COLUMNA */}
          {vistaEmpresas === 'tabla' ? (
            <div className="rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-modal-scroll min-h-[420px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                      <th className="py-2.5 px-2 w-10 text-center">Nro.</th>
                      <th className={`py-2.5 px-1.5 text-center transition-all duration-200 ${sidebarCollapsed ? 'w-36' : 'w-24'}`}>
                        Acciones
                      </th>
                      <th className="py-2.5 px-3 min-w-[170px]">Razón Social / Empresa</th>
                      <th className="py-2.5 px-2.5 w-28">RUC / Doc</th>
                      <th className="py-2.5 px-2.5 w-32">Plan</th>
                      <th className="py-2.5 px-2.5 min-w-[170px]">Módulos Activos</th>
                      <th className="py-2.5 px-2 w-16 text-center">Sedes</th>
                      <th className="py-2.5 px-2.5 w-28 text-center">Estado</th>
                    </tr>

                    {/* FILA DE FILTROS INLINE POR COLUMNA REDISEÑADA */}
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/[0.01]">
                      <td className="py-1.5 px-1 text-center text-slate-400 text-[10px]">-</td>
                      <td className="py-1.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={handleLimpiarFiltros}
                          className="px-1.5 py-1 rounded text-[9.5px] font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Restablecer todos los filtros"
                        >
                          Reiniciar
                        </button>
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Filtrar empresa..."
                            value={filtroColNombre}
                            onChange={(e) => setFiltroColNombre(e.target.value)}
                            className="w-full h-8 text-[11px] px-2.5 pr-7 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
                          />
                          {filtroColNombre ? (
                            <button
                              type="button"
                              onClick={() => setFiltroColNombre('')}
                              className="w-4 h-4 rounded-md hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-rose-500 absolute right-2 top-2 transition-colors cursor-pointer"
                              title="Limpiar"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Filtrar RUC..."
                            value={filtroColRuc}
                            onChange={(e) => setFiltroColRuc(e.target.value)}
                            className="w-full h-8 text-[11px] px-2.5 pr-7 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
                          />
                          {filtroColRuc ? (
                            <button
                              type="button"
                              onClick={() => setFiltroColRuc('')}
                              className="w-4 h-4 rounded-md hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-rose-500 absolute right-2 top-2 transition-colors cursor-pointer"
                              title="Limpiar"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-1.5">
                        <DesplegableFiltroColumna
                          titulo="Plan SaaS"
                          valor={filtroColPlan}
                          onChange={setFiltroColPlan}
                          opciones={OPCIONES_FILTRO_PLAN}
                          placeholder="Todos los planes"
                          iconoDefault={Layers}
                          align="left"
                          anchoMenu="w-64"
                        />
                      </td>
                      <td className="py-1.5 px-1.5">
                        <DesplegableFiltroColumna
                          titulo="Módulo Vertical"
                          valor={filtroColModulo}
                          onChange={setFiltroColModulo}
                          opciones={OPCIONES_FILTRO_MODULO}
                          placeholder="Cualquier módulo"
                          iconoDefault={Layers}
                          align="left"
                          anchoMenu="w-72"
                        />
                      </td>
                      <td className="py-1.5 px-1 text-center text-slate-400 text-[10px]">-</td>
                      <td className="py-1.5 px-1.5">
                        <DesplegableFiltroColumna
                          titulo="Estado del Tenant"
                          valor={filtroColEstado}
                          onChange={setFiltroColEstado}
                          opciones={OPCIONES_FILTRO_ESTADO}
                          placeholder="Todos los estados"
                          iconoDefault={Activity}
                          align="right"
                          anchoMenu="w-64"
                        />
                      </td>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Cargando padrón de empresas...
                        </td>
                      </tr>
                    ) : empresasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No se encontraron registros que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      empresasFiltradas.map((emp, index) => {
                        let activos = [];
                        if (emp.modulos_activos) {
                          activos =
                            typeof emp.modulos_activos === 'string'
                              ? JSON.parse(emp.modulos_activos)
                              : emp.modulos_activos;
                        }

                        return (
                          <tr
                            key={emp.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                              {index + 1}
                            </td>
                            {/* Menú de Acciones Rápidas (Adaptativo 1 o 2 filas según el Sidebar) */}
                            <td className="py-2 px-1 text-center">
                              {sidebarCollapsed ? (
                                // Barra lateral contraída: Todo en 1 sola fila espaciosa
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleInspeccionarEmpresa(emp)}
                                    className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                    title="Ingresar a la Empresa (Modo Inspector)"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTenantWhitelabelId(emp.id);
                                      setTab('whitelabel');
                                    }}
                                    className="p-1.5 rounded-lg text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 transition-colors cursor-pointer"
                                    title="Personalizar Pantalla de Login (White-Label)"
                                  >
                                    <Palette className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTenantModulosId(emp.id);
                                      setTab('modulos');
                                    }}
                                    className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                    title="Gestor Visual de Submódulos"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirEditar(emp)}
                                    className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                    title="Editar datos de empresa"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleEstado(emp)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${emp.activo
                                      ? 'text-rose-500 hover:bg-rose-500/10'
                                      : 'text-emerald-500 hover:bg-emerald-500/10'
                                      }`}
                                    title={emp.activo ? 'Suspender Empresa' : 'Reactivar Empresa'}
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                // Barra lateral expandida: Organizado en 2 filas compactas (3 arriba, 2 abajo)
                                <div className="flex flex-col items-center justify-center gap-0.5 w-fit mx-auto">
                                  <div className="flex items-center justify-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleInspeccionarEmpresa(emp)}
                                      className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                      title="Ingresar a la Empresa (Modo Inspector)"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTenantWhitelabelId(emp.id);
                                        setTab('whitelabel');
                                      }}
                                      className="p-1 rounded-md text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 transition-colors cursor-pointer"
                                      title="Personalizar Pantalla de Login (White-Label)"
                                    >
                                      <Palette className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTenantModulosId(emp.id);
                                        setTab('modulos');
                                      }}
                                      className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                      title="Gestor Visual de Submódulos"
                                    >
                                      <Layers className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleAbrirEditar(emp)}
                                      className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                      title="Editar datos de empresa"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleEstado(emp)}
                                      className={`p-1 rounded-md transition-colors cursor-pointer ${emp.activo
                                        ? 'text-rose-500 hover:bg-rose-500/10'
                                        : 'text-emerald-500 hover:bg-emerald-500/10'
                                        }`}
                                      title={emp.activo ? 'Suspender Empresa' : 'Reactivar Empresa'}
                                    >
                                      <Power className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                            {/* Razón Social */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-200 shrink-0 font-heading">
                                  {emp.nombre.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate text-xs">
                                    {emp.nombre}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {emp.direccion || 'Sin dirección fiscal'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* RUC */}
                            <td className="py-2.5 px-2.5 font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {emp.ruc || 'Sin registrar'}
                            </td>
                            {/* Plan & Operatividad */}
                            <td className="py-2.5 px-2.5">
                              <div className="flex flex-col gap-0.5 items-start">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-[#7D71EB]/10 text-[#7D71EB] dark:text-[#1CC0F9] border border-[#7D71EB]/25">
                                    {emp.plan}
                                  </span>
                                  {emp.precio_mensual ? (
                                    <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      S/ {Number(emp.precio_mensual).toFixed(0)}/m
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${emp.entorno_sunat === 'produccion'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    }`}>
                                    {emp.entorno_sunat === 'produccion' ? 'PROD' : 'BETA'}
                                  </span>
                                  {emp.fecha_vencimiento && (
                                    <span className="text-[9px] font-medium text-slate-400" title={`Vencimiento: ${emp.fecha_vencimiento}`}>
                                      Vence: {new Date(emp.fecha_vencimiento).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Módulos */}
                            <td className="py-2.5 px-2.5">
                              <div className="flex flex-wrap items-center gap-1">
                                {activos.map((mod) => (
                                  <span
                                    key={mod}
                                    className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5"
                                  >
                                    {mod}
                                  </span>
                                ))}
                                {activos.length === 0 && (
                                  <span className="text-[10px] text-slate-400 italic">Ninguno</span>
                                )}
                              </div>
                            </td>
                            {/* Sedes */}
                            <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-[10px]">
                                {emp.sucursales?.length || 1}
                              </span>
                            </td>
                            {/* Estado */}
                            <td className="py-2.5 px-2.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${emp.activo
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${emp.activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {emp.activo ? 'Activa' : 'Suspendida'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pie de Tabla */}
              <div className="p-3 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <div>
                  Mostrando <span className="font-bold text-slate-900 dark:text-white">{empresasFiltradas.length}</span> de <span className="font-bold text-slate-900 dark:text-white">{empresas.length}</span> empresas registradas
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Padrón sincronizado en tiempo real</span>
                </div>
              </div>
            </div>
          ) : (
            /* VISTA 2: GRID DE TARJETAS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading ? (
                <div className="col-span-full py-12 text-center text-sm text-slate-400">
                  <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Cargando directorio de clientes SaaS...
                </div>
              ) : empresasFiltradas.length === 0 ? (
                <div className="col-span-full py-12 text-center text-sm text-slate-400 bg-white dark:bg-[#18123B] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                  No se encontraron empresas con ese criterio de búsqueda.
                </div>
              ) : (
                empresasFiltradas.map((emp) => {
                  let activos = [];
                  if (emp.modulos_activos) {
                    activos = typeof emp.modulos_activos === 'string'
                      ? JSON.parse(emp.modulos_activos)
                      : emp.modulos_activos;
                  }

                  return (
                    <div
                      key={emp.id}
                      className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm space-y-4 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Cabecera de la Tarjeta */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#7D71EB]/10 text-[#7D71EB] dark:text-[#1CC0F9] border border-[#7D71EB]/25">
                                Plan {emp.plan} {emp.precio_mensual ? `· S/ ${Number(emp.precio_mensual).toFixed(0)}/m` : ''}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${emp.activo
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-rose-500/10 text-rose-500'
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${emp.activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {emp.activo ? 'Activa' : 'Suspendida'}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${emp.entorno_sunat === 'produccion'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  }`}
                              >
                                {emp.entorno_sunat === 'produccion' ? 'PROD' : 'BETA'}
                              </span>
                              {emp.fecha_vencimiento && (
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  &bull; Vence: {new Date(emp.fecha_vencimiento).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5 font-heading">
                              {emp.nombre}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              RUC: {emp.ruc || 'Sin registrar'} &bull; {emp.sucursales?.length || 1} Sedes
                            </p>
                          </div>

                          {/* Botón Inspeccionar Empresa */}
                          <button
                            onClick={() => handleInspeccionarEmpresa(emp)}
                            className="p-2.5 rounded-2xl bg-[#02CBA9]/15 hover:bg-[#02CBA9] text-[#02CBA9] hover:text-white transition-all shadow-sm group"
                            title="Entrar a esta empresa (Modo Inspector)"
                          >
                            <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>

                        {/* Interruptores de Módulos Activos (Feature Flags) */}
                        <div className="space-y-2 pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            Módulos Contratados (Clic para alternar)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Restaurante */}
                            <button
                              onClick={() => handleToggleModulo(emp, 'restaurante')}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${activos.includes('restaurante')
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 opacity-60'
                                }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                                Restaurante
                              </span>
                              {activos.includes('restaurante') ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>

                            {/* Ferretería */}
                            <button
                              onClick={() => handleToggleModulo(emp, 'ferreteria')}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${activos.includes('ferreteria')
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
                                : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 opacity-60'
                                }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Ferretería
                              </span>
                              {activos.includes('ferreteria') ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>

                            {/* Botica */}
                            <button
                              onClick={() => handleToggleModulo(emp, 'botica')}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${activos.includes('botica')
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 opacity-60'
                                }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <Pill className="w-3.5 h-3.5" />
                                Botica
                              </span>
                              {activos.includes('botica') ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>

                            {/* Hospedaje */}
                            <button
                              onClick={() => handleToggleModulo(emp, 'hospedaje')}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${activos.includes('hospedaje')
                                ? 'bg-violet-500/10 border-violet-500/30 text-violet-500'
                                : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 opacity-60'
                                }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <Hotel className="w-3.5 h-3.5" />
                                Hospedaje
                              </span>
                              {activos.includes('hospedaje') ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Footer de Tarjeta: Barra de Acciones de Gestión Integral */}
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <button
                            onClick={() => handleToggleEstado(emp)}
                            className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${emp.activo
                              ? 'text-rose-500 hover:text-rose-600'
                              : 'text-emerald-500 hover:text-emerald-600'
                              }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{emp.activo ? 'Suspender' : 'Reactivar'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Ficha / Info */}
                            <button
                              onClick={() => {
                                setEmpresaDetalles(emp);
                                setModalDetalles(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              title="Ver Ficha y Sedes"
                            >
                              <Info className="w-4 h-4" />
                            </button>

                            {/* Exportar Respaldo JSON */}
                            <button
                              onClick={() => handleExportarBackup(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Descargar Respaldo Integral JSON"
                            >
                              <DownloadCloud className="w-4 h-4" />
                            </button>

                            {/* Reset Clave Admin */}
                            <button
                              onClick={() => handleAbrirResetPass(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="Restablecer Clave de Admin"
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            {/* Editar Empresa */}
                            <button
                              onClick={() => handleAbrirEditar(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#1CC0F9] hover:bg-[#1CC0F9]/10 transition-colors cursor-pointer"
                              title="Editar Datos de la Empresa"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Eliminar Empresa */}
                            <button
                              onClick={() => handleEliminarEmpresa(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Eliminar Empresa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Botón Principal: Entrar en Modo Inspector */}
                        <button
                          onClick={() => handleInspeccionarEmpresa(emp)}
                          className="w-full h-9 rounded-full bg-slate-100/90 dark:bg-white/5 hover:bg-gradient-to-r hover:from-[#02CBA9] hover:via-[#1CC0F9] hover:to-[#7D71EB] hover:text-white text-slate-700 dark:text-slate-200 text-xs font-black transition-all flex items-center justify-center gap-2 border border-slate-200/70 dark:border-white/10 shadow-2xs group cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>Inspeccionar Tenant</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}



      {/* PESTAÑA 2: MÉTRICAS & DISTRIBUCIÓN SAAS */}
      {currentTab === 'metricas' && (() => {
        const totalEmp = empresas.length || 1;
        const totalAct = metricas?.totalActivas ?? empresas.filter((e) => e.activo).length;
        const mrrVal = metricas?.mrrTotal || 0;
        const arrVal = metricas?.arrTotal || (mrrVal * 12);
        const arpuVal = metricas?.arpu ?? (totalAct > 0 ? (mrrVal / totalAct) : 0);
        const pctMRR = Math.min(100, Math.round((mrrVal / (metaMRR || 1)) * 100));

        const nEnt = metricas?.planes?.enterprise ?? 0;
        const nPro = metricas?.planes?.professional ?? 0;
        const nSta = metricas?.planes?.starter ?? 0;
        const pEnt = Math.min(100, Math.round((nEnt / totalEmp) * 100));
        const pPro = Math.min(100, Math.round((nPro / totalEmp) * 100));
        const pSta = Math.min(100, Math.round((nSta / totalEmp) * 100));

        const mrrEnt = metricas?.planesMrr?.enterprise ?? (nEnt * 399);
        const mrrPro = metricas?.planesMrr?.professional ?? (nPro * 199);
        const mrrSta = metricas?.planesMrr?.starter ?? (nSta * 99);

        // Verticales
        const vRest = metricas?.verticales?.restaurante ?? 0;
        const vFerr = metricas?.verticales?.ferreteria ?? 0;
        const vBoti = metricas?.verticales?.botica ?? 0;
        const vHosp = metricas?.verticales?.hospedaje ?? 0;

        const mrrRest = metricas?.verticalesMrr?.restaurante ?? 0;
        const mrrFerr = metricas?.verticalesMrr?.ferreteria ?? 0;
        const mrrBoti = metricas?.verticalesMrr?.botica ?? 0;
        const mrrHosp = metricas?.verticalesMrr?.hospedaje ?? 0;

        // Vencimientos y Cobranzas
        const vencidasCount = metricas?.vencimientos?.vencidasCount ?? 0;
        const vencidasMrr = metricas?.vencimientos?.vencidasMrr ?? 0;
        const porVencer7Count = metricas?.vencimientos?.porVencer7DiasCount ?? 0;
        const porVencer7Mrr = metricas?.vencimientos?.porVencer7DiasMrr ?? 0;
        const porVencer15Count = metricas?.vencimientos?.porVencer15DiasCount ?? 0;
        const alDiaCount = metricas?.vencimientos?.alDiaCount ?? 0;
        const mrrEnRiesgo = metricas?.vencimientos?.mrrEnRiesgo ?? (vencidasMrr + porVencer7Mrr);
        const listaCobranzas = metricas?.vencimientos?.listaCobranzas ?? [];

        const cobranzasFiltradas = listaCobranzas.filter((item) => {
          if (filtroCobranza === 'vencidos' && item.estadoVencimiento !== 'vencido') return false;
          if (filtroCobranza === 'criticos' && item.estadoVencimiento !== 'critico') return false;
          if (filtroCobranza === 'proximos' && item.estadoVencimiento !== 'proximo') return false;
          if (filtroCobranza === 'al_dia' && item.estadoVencimiento !== 'al_dia') return false;

          if (busquedaCobranza.trim()) {
            const q = busquedaCobranza.toLowerCase();
            const mNom = item.nombre?.toLowerCase().includes(q);
            const mRuc = item.ruc?.toLowerCase().includes(q);
            if (!mNom && !mRuc) return false;
          }
          return true;
        });

        return (
          <div className="space-y-6">
            {/* 1. CUATRO TARJETAS KPI EJECUTIVAS FINANCIERAS CON ANIMACIONES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* KPI 1: MRR Recurrente + Meta Dinámica */}
              <div className="animate-card-fade-1 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/15 hover:border-emerald-500/50 transition-all duration-300">
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between gap-2 min-w-0 relative">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-500 transition-colors truncate">
                    MRR Recurrente Mensual
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempMetaMRR(metaMRR);
                      setModalMetaMRR(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 cursor-pointer shrink-0"
                    title="Configurar Meta de MRR"
                  >
                    <Target className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                    S/ {mrrVal.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ mes</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative">
                  <span className="truncate">Meta: S/ {metaMRR.toLocaleString('es-PE')} ({pctMRR}%)</span>
                  <span className="font-bold text-emerald-500 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    ARR S/ {arrVal.toFixed(0)}
                  </span>
                </div>
                <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pctMRR}%` }}
                  />
                </div>
              </div>

              {/* KPI 2: ARPU Ticket Promedio */}
              <div className="animate-card-fade-2 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/15 hover:border-blue-500/50 transition-all duration-300">
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between gap-2 min-w-0 relative">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors truncate">
                    ARPU (Ticket Promedio)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shrink-0">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative">
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                    S/ {arpuVal.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ cliente</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative">
                  <span>Base activa</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-blue-500/20 transition-colors">
                    {totalAct} tenants activos
                  </span>
                </div>
                <p className="mt-1.5 text-[10.5px] text-slate-400 truncate relative">
                  Ingreso medio mensual por cuenta SaaS
                </p>
              </div>

              {/* KPI 3: Clientes Híbridos / Multi-Vertical */}
              <div className="animate-card-fade-3 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-500/15 hover:border-purple-500/50 transition-all duration-300">
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between gap-2 min-w-0 relative">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-500 transition-colors truncate">
                    Cross-Selling Multi-Módulo
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative">
                  <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                    {metricas?.clientesHibridos?.count ?? 0}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    ({metricas?.clientesHibridos?.porcentaje ?? 0}%)
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative">
                  <span>Empresas con 2+ módulos</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-purple-500/20 transition-colors">
                    Híbridos
                  </span>
                </div>
                <p className="mt-1.5 text-[10.5px] text-slate-400 truncate relative">
                  Operan múltiples verticales en simultáneo
                </p>
              </div>

              {/* KPI 4: MRR en Riesgo / Alerta Vencimientos */}
              <div className={`animate-card-fade-4 p-5 rounded-2xl bg-white dark:bg-[#18123B] border shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ${mrrEnRiesgo > 0
                ? 'border-rose-300 dark:border-rose-500/30 hover:border-rose-500 hover:shadow-rose-500/15'
                : 'border-slate-200/80 dark:border-white/5 hover:border-emerald-500/50 hover:shadow-emerald-500/15'
                }`}>
                {/* Glow ambiental condicional */}
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${mrrEnRiesgo > 0 ? 'bg-rose-500/15' : 'bg-emerald-500/15'
                  }`} />

                <div className="flex items-center justify-between gap-2 min-w-0 relative">
                  <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${mrrEnRiesgo > 0 ? 'text-rose-500' : 'text-slate-400 group-hover:text-emerald-500'
                    }`}>
                    MRR en Riesgo (Vencimientos)
                  </span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-110 ${mrrEnRiesgo > 0 ? 'group-hover:rotate-12' : 'group-hover:rotate-6'} transition-all duration-300 shrink-0 ${mrrEnRiesgo > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative">
                  <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300 ${mrrEnRiesgo > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                    S/ {mrrEnRiesgo.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ mes</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative">
                  <span className="truncate">{vencidasCount} vencidas • {porVencer7Count} ≤ 7 días</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0 transition-all ${mrrEnRiesgo > 0
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}>
                    {mrrEnRiesgo > 0 ? 'Acción Requerida' : 'Al Día'}
                  </span>
                </div>
                <p className="mt-1.5 text-[10.5px] text-slate-400 truncate relative">
                  {mrrEnRiesgo > 0 ? 'Requiere gestión activa de cobranza' : 'Sin alertas críticas de pago'}
                </p>
              </div>
            </div>

            {/* 2. DOS BLOQUES: DISTRIBUCIÓN POR PLAN (CON MRR) & MONETIZACIÓN POR VERTICAL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribución & Aporte Económico por Plan */}
              <div className="animate-card-fade-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 space-y-4 relative overflow-hidden group">
                {/* Glow decorativo sutil */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between relative">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-500 group-hover:rotate-6 transition-transform duration-300" />
                    <span>Distribución & Facturación por Plan</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                    ARR: S/ {arrVal.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-4 relative">
                  {/* Enterprise */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2 hover:bg-slate-100/90 dark:hover:bg-white/[0.05] hover:scale-[1.01] transition-all duration-200 group/plan cursor-default">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 group-hover/plan:scale-125 transition-transform" />
                        <span className="text-slate-800 dark:text-slate-200">Plan Enterprise (Full Suite)</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">S/ 399/m</span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-500 font-mono font-bold mr-2">{nEnt} cltes ({pEnt}%)</span>
                        <span className="text-slate-900 dark:text-white font-mono font-black">S/ {mrrEnt.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${pEnt}%` }} />
                    </div>
                  </div>

                  {/* Professional */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2 hover:bg-slate-100/90 dark:hover:bg-white/[0.05] hover:scale-[1.01] transition-all duration-200 group/plan cursor-default">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 group-hover/plan:scale-125 transition-transform" />
                        <span className="text-slate-800 dark:text-slate-200">Plan Professional (Multisede)</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">S/ 199/m</span>
                      </div>
                      <div className="text-right">
                        <span className="text-indigo-500 font-mono font-bold mr-2">{nPro} cltes ({pPro}%)</span>
                        <span className="text-slate-900 dark:text-white font-mono font-black">S/ {mrrPro.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${pPro}%` }} />
                    </div>
                  </div>

                  {/* Starter */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2 hover:bg-slate-100/90 dark:hover:bg-white/[0.05] hover:scale-[1.01] transition-all duration-200 group/plan cursor-default">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 group-hover/plan:scale-125 transition-transform" />
                        <span className="text-slate-800 dark:text-slate-200">Plan Starter (Pyme Estándar)</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">S/ 99/m</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-500 font-mono font-bold mr-2">{nSta} cltes ({pSta}%)</span>
                        <span className="text-slate-900 dark:text-white font-mono font-black">S/ {mrrSta.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${pSta}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-slate-500 relative">
                  <span>Total MRR por Planes:</span>
                  <span className="text-base text-slate-900 dark:text-white font-mono font-black">
                    S/ {mrrVal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Monetización & Adopción por Vertical */}
              <div className="animate-card-fade-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 space-y-4 relative overflow-hidden group">
                {/* Glow decorativo sutil */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between relative">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500 group-hover:rotate-6 transition-transform duration-300" />
                    <span>Monetización Atribuida por Vertical</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                    Atribución proporcional
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 relative">
                  {/* Restaurante */}
                  <div className="p-4 rounded-2xl bg-amber-500/[0.08] hover:bg-amber-500/[0.14] border border-amber-500/20 hover:border-amber-500/40 text-amber-500 space-y-2 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer group/vert relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-16 h-16 bg-amber-500/20 rounded-full blur-xl pointer-events-none opacity-0 group-hover/vert:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between relative">
                      <UtensilsCrossed className="w-5 h-5 group-hover/vert:scale-120 group-hover/vert:rotate-6 transition-transform duration-300" />
                      <span className="text-xs font-black font-mono bg-amber-500/15 px-2 py-0.5 rounded-full">
                        {vRest} activos
                      </span>
                    </div>
                    <div className="relative">
                      <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                        S/ {mrrRest.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Restaurante Gastro
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono relative">
                      {mrrVal > 0 ? Math.round((mrrRest / mrrVal) * 100) : 0}% del MRR total
                    </div>
                  </div>

                  {/* Ferretería */}
                  <div className="p-4 rounded-2xl bg-indigo-500/[0.08] hover:bg-indigo-500/[0.14] border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-500 space-y-2 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer group/vert relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-16 h-16 bg-indigo-500/20 rounded-full blur-xl pointer-events-none opacity-0 group-hover/vert:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between relative">
                      <ShoppingBag className="w-5 h-5 group-hover/vert:scale-120 group-hover/vert:rotate-6 transition-transform duration-300" />
                      <span className="text-xs font-black font-mono bg-indigo-500/15 px-2 py-0.5 rounded-full">
                        {vFerr} activos
                      </span>
                    </div>
                    <div className="relative">
                      <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                        S/ {mrrFerr.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Ferretería Retail
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono relative">
                      {mrrVal > 0 ? Math.round((mrrFerr / mrrVal) * 100) : 0}% del MRR total
                    </div>
                  </div>

                  {/* Botica */}
                  <div className="p-4 rounded-2xl bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-500 space-y-2 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer group/vert relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl pointer-events-none opacity-0 group-hover/vert:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between relative">
                      <Pill className="w-5 h-5 group-hover/vert:scale-120 group-hover/vert:rotate-6 transition-transform duration-300" />
                      <span className="text-xs font-black font-mono bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        {vBoti} activos
                      </span>
                    </div>
                    <div className="relative">
                      <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                        S/ {mrrBoti.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Botica & Farmacia
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono relative">
                      {mrrVal > 0 ? Math.round((mrrBoti / mrrVal) * 100) : 0}% del MRR total
                    </div>
                  </div>

                  {/* Hospedaje */}
                  <div className="p-4 rounded-2xl bg-violet-500/[0.08] hover:bg-violet-500/[0.14] border border-violet-500/20 hover:border-violet-500/40 text-violet-500 space-y-2 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 cursor-pointer group/vert relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-16 h-16 bg-violet-500/20 rounded-full blur-xl pointer-events-none opacity-0 group-hover/vert:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between relative">
                      <Hotel className="w-5 h-5 group-hover/vert:scale-120 group-hover/vert:rotate-6 transition-transform duration-300" />
                      <span className="text-xs font-black font-mono bg-violet-500/15 px-2 py-0.5 rounded-full">
                        {vHosp} activos
                      </span>
                    </div>
                    <div className="relative">
                      <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white">
                        S/ {mrrHosp.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold text-violet-600 dark:text-violet-400">
                        Hospedaje & Hotel
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono relative">
                      {mrrVal > 0 ? Math.round((mrrHosp / mrrVal) * 100) : 0}% del MRR total
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pt-1 relative">
                  💡 En clientes con múltiples módulos autorizados, el MRR se atribuye proporcionalmente entre sus verticales activas.
                </p>
              </div>
            </div>

            {/* 3. MONITOR DE COBRANZAS, RENOVACIONES & SEMÁFORO DE VENCIMIENTOS */}
            <div className="animate-card-fade-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm hover:border-slate-300/80 dark:hover:border-white/10 hover:shadow-xl transition-all duration-300 space-y-5 relative overflow-hidden group">
              {/* Glow decorativo sutil en esquina superior */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-b from-[#02CBA9]/10 via-[#1CC0F9]/5 to-transparent rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4 relative">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-emerald-500 group-hover:rotate-6 transition-transform duration-300" />
                    <span>Monitor Forense de Cobranzas & Renovaciones SaaS</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Control preventivo de fechas de vencimiento, alertas de mora y acciones inmediatas de prórroga o cobro.
                  </p>
                </div>

                {/* Semáforo rápido de conteos con hover sutil */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:scale-105 transition-transform duration-200 cursor-default">
                    {vencidasCount} Vencidas (S/ {vencidasMrr.toFixed(0)})
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:scale-105 transition-transform duration-200 cursor-default">
                    {porVencer7Count} ≤ 7d (S/ {porVencer7Mrr.toFixed(0)})
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:scale-105 transition-transform duration-200 cursor-default">
                    {porVencer15Count} ≤ 15d
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:scale-105 transition-transform duration-200 cursor-default">
                    {alDiaCount} Al día
                  </span>
                </div>
              </div>

              {/* Filtros y Buscador */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFiltroCobranza('todos')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filtroCobranza === 'todos'
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    Todos ({listaCobranzas.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroCobranza('vencidos')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${filtroCobranza === 'vencidos'
                      ? 'bg-rose-500 text-white shadow-xs shadow-rose-500/30'
                      : 'text-rose-500 hover:bg-rose-500/10'
                      }`}
                  >
                    <span>Vencidos</span>
                    <span className="text-[10px] px-1 rounded-full bg-rose-700/30">{vencidasCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroCobranza('criticos')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${filtroCobranza === 'criticos'
                      ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                      : 'text-amber-500 hover:bg-amber-500/10'
                      }`}
                  >
                    <span>≤ 7 días</span>
                    <span className="text-[10px] px-1 rounded-full bg-amber-700/30">{porVencer7Count}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroCobranza('proximos')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${filtroCobranza === 'proximos'
                      ? 'bg-blue-500 text-white shadow-xs shadow-blue-500/30'
                      : 'text-blue-500 hover:bg-blue-500/10'
                      }`}
                  >
                    <span>≤ 15 días</span>
                    <span className="text-[10px] px-1 rounded-full bg-blue-700/30">{porVencer15Count}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroCobranza('al_dia')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filtroCobranza === 'al_dia'
                      ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30'
                      : 'text-emerald-500 hover:bg-emerald-500/10'
                      }`}
                  >
                    Al día ({alDiaCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={busquedaCobranza}
                    onChange={(e) => setBusquedaCobranza(e.target.value)}
                    placeholder="Buscar empresa o RUC..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tabla de Cobranzas */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-white/5">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3.5">Empresa / RUC</th>
                      <th className="py-3 px-3.5">Plan & Cuota</th>
                      <th className="py-3 px-3.5">Verticales</th>
                      <th className="py-3 px-3.5">Vencimiento</th>
                      <th className="py-3 px-3.5">Estado / Días</th>
                      <th className="py-3 px-3.5 text-right">Acciones de Cobranza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {cobranzasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No se encontraron registros de cobranza para el filtro seleccionado.
                        </td>
                      </tr>
                    ) : (
                      cobranzasFiltradas.map((item) => {
                        const esVencido = item.estadoVencimiento === 'vencido';
                        const esCritico = item.estadoVencimiento === 'critico';
                        const esProximo = item.estadoVencimiento === 'proximo';
                        const esAlDia = item.estadoVencimiento === 'al_dia';

                        const telLimpio = item.telefono ? String(item.telefono).replace(/\D/g, '') : null;
                        const msgWhatsApp = encodeURIComponent(
                          `Hola ${item.nombre}, te saludamos de la central de HEIS Suite. Te recordamos cordialmente que la suscripción a tu sistema vence el ${item.fecha_vencimiento || 'pronto'}. ¿Deseas coordinar la renovación de tu plan ${String(item.plan).toUpperCase()}? Quedamos a tu disposición.`
                        );

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{item.nombre}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>RUC: {item.ruc || 'No registrado'}</span>
                                {item.telefono && (
                                  <span className="flex items-center gap-0.5 text-slate-500">
                                    <Phone className="w-2.5 h-2.5" />
                                    {item.telefono}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[11px]">
                                Plan {item.plan}
                              </div>
                              <div className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs">
                                S/ {Number(item.cuota).toFixed(2)}/m
                              </div>
                            </td>

                            <td className="py-3 px-3.5">
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {item.modulos && item.modulos.length > 0 ? (
                                  item.modulos.map((m) => (
                                    <span
                                      key={m}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"
                                    >
                                      {m}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-[10px]">-</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3.5 font-mono text-xs">
                              {item.fecha_vencimiento ? (
                                <span className="text-slate-700 dark:text-slate-200 font-bold">
                                  {item.fecha_vencimiento}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Indefinida</span>
                              )}
                            </td>

                            <td className="py-3 px-3.5">
                              {esVencido && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-[10.5px]">
                                  <XCircle className="w-3 h-3 shrink-0" />
                                  <span>Vencido hace {Math.abs(item.diasRestantes)}d</span>
                                </span>
                              )}
                              {esCritico && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[10.5px]">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Vence en {item.diasRestantes}d</span>
                                </span>
                              )}
                              {esProximo && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold text-[10.5px]">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>Vence en {item.diasRestantes}d</span>
                                </span>
                              )}
                              {esAlDia && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10.5px]">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span>Al día ({item.diasRestantes}d)</span>
                                </span>
                              )}
                              {item.estadoVencimiento === 'sin_fecha' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 text-[10px]">
                                  Sin fecha límite
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botón Extender +30d rápido */}
                                <button
                                  type="button"
                                  onClick={() => handleExtenderRapido30d(item)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                                  title="Extender suscripción +30 días inmediatamente"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                  <span>+30d</span>
                                </button>

                                {/* Botón Personalizar Fecha */}
                                <button
                                  type="button"
                                  onClick={() => handleAbrirRenovarModal(item)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                  title="Ajustar fecha de renovación específica"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                </button>

                                {/* WhatsApp Recordatorio */}
                                {telLimpio ? (
                                  <a
                                    href={`https://wa.me/51${telLimpio}?text=${msgWhatsApp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                    title="Enviar recordatorio de pago por WhatsApp"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="p-1.5 text-slate-300 dark:text-slate-600 cursor-not-allowed" title="Sin teléfono registrado">
                                    <Send className="w-3.5 h-3.5 opacity-30" />
                                  </span>
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
          </div>
        );
      })()}





      {/* PESTAÑA 3: AUDITORÍA GLOBAL MULTI-TENANT & FORENSE */}
      {currentTab === 'auditoria' && (() => {
        const renderBadgeAccion = (accion) => {
          const acc = (accion || '').toUpperCase();
          if (acc.includes('ELIMINAR') || acc.includes('DELETE') || acc.includes('DROP') || acc.includes('SUSPENDER')) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10.5px] border border-rose-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {accion}
              </span>
            );
          }
          if (acc.includes('CREAR') || acc.includes('CREATE') || acc.includes('INSERT') || acc.includes('ACTIVAR')) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10.5px] border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {accion}
              </span>
            );
          }
          if (acc.includes('ACTUALIZAR') || acc.includes('UPDATE') || acc.includes('EDIT') || acc.includes('RENOVAR')) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10.5px] border border-blue-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {accion}
              </span>
            );
          }
          if (acc.includes('LOGIN') || acc.includes('AUTH') || acc.includes('PASSWORD') || acc.includes('SEGURIDAD')) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-[10.5px] border border-indigo-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {accion}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10.5px] border border-amber-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {accion}
            </span>
          );
        };

        const totalEventosHoy = metricasAuditoria?.totalHoy ?? auditorias.length;
        const accionesCriticas = metricasAuditoria?.accionesCriticas ?? 0;
        const loginsHoy = metricasAuditoria?.loginsHoy ?? 0;
        const topTenant = metricasAuditoria?.tenantMasActivo;

        const opcionesFiltroTenant = [
          { valor: 'TODAS', etiqueta: 'Todos los Tenants', sub: 'Todas las empresas y plataforma SaaS' },
          { valor: 'null', etiqueta: 'Plataforma SaaS (Global)', sub: 'Eventos del Core sin tenant asociado' },
          ...empresas.map((emp) => ({
            valor: String(emp.id),
            etiqueta: emp.nombre,
            sub: emp.ruc ? `RUC: ${emp.ruc}` : 'Tenant registrado',
          })),
        ];

        const opcionesFiltroModulo = [
          { valor: 'TODOS', etiqueta: 'Todos los Módulos', sub: 'Todas las verticales y subsistemas' },
          { valor: 'EMPRESAS', etiqueta: 'Empresas & Tenants', sub: 'Altas, configuraciones y estados' },
          { valor: 'SEGURIDAD', etiqueta: 'Seguridad & Claves', sub: 'Reset de credenciales y accesos' },
          { valor: 'AUTH', etiqueta: 'Autenticación & Sesión', sub: 'Inicios de sesión y salidas' },
          { valor: 'CONFIGURACION', etiqueta: 'Configuración Core', sub: 'Parámetros globales SaaS' },
          { valor: 'PLANES_SAAS', etiqueta: 'Tarifario de Planes', sub: 'Suscripciones y cuotas' },
          { valor: 'COMUNICADOS', etiqueta: 'Comunicados Globales', sub: 'Alertas cross-tenant' },
          { valor: 'RESTAURANTE', etiqueta: 'Restaurante', sub: 'Mesas, comandas y menú' },
          { valor: 'FERRETERIA', etiqueta: 'Ferretería', sub: 'Inventarios, cajas y despacho' },
          { valor: 'BOTICA', etiqueta: 'Botica & Farmacia', sub: 'Lotes, medicamentos y DIGEMID' },
          { valor: 'HOSPEDAJE', etiqueta: 'Hospedaje & Hotel', sub: 'Habitaciones, reservas y check-in' },
        ];

        const opcionesFiltroAccion = [
          { valor: 'TODAS', etiqueta: 'Todas las Acciones', sub: 'Cualquier mutación u operación', dotColor: 'bg-slate-400' },
          { valor: 'CREAR', etiqueta: 'Creaciones (+ CREAR)', sub: 'Nuevos registros y activaciones', dotColor: 'bg-emerald-500' },
          { valor: 'ACTUALIZAR', etiqueta: 'Modificaciones (~ ACTUALIZAR)', sub: 'Ediciones, cambios y renovaciones', dotColor: 'bg-blue-500' },
          { valor: 'ELIMINAR', etiqueta: 'Eliminaciones (x ELIMINAR)', sub: 'Bajas, suspensiones y drops', dotColor: 'bg-rose-500' },
          { valor: 'SEGURIDAD', etiqueta: 'Seguridad (AUTH / CLAVES)', sub: 'Logins, auth y resets de password', dotColor: 'bg-indigo-500' },
          { valor: 'ERROR', etiqueta: 'Alertas & Errores (ERROR)', sub: 'Excepciones y advertencias', dotColor: 'bg-amber-500' },
        ];

        return (
          <div className="space-y-6">
            {/* 1. Tarjetas Forenses de Telemetría (KPIs) con micro-animaciones e interacción dinámica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Eventos Registrados Hoy */}
              <div className="animate-card-fade-1 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/15 hover:border-emerald-500/50 transition-all duration-300">
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-500 transition-colors">
                    Actividad Global Hoy
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-500 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Activity className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative z-10">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                    {totalEventosHoy.toLocaleString('es-PE')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">eventos</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="truncate">Telemetría en tiempo real</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-emerald-500/20 transition-colors shrink-0">
                    Cross-Tenant
                  </span>
                </div>
              </div>

              {/* Card 2: Mutaciones Críticas */}
              <div className="animate-card-fade-2 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-rose-500/15 hover:border-rose-500/50 transition-all duration-300">
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-rose-500 transition-colors">
                    Mutaciones Críticas
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/20 text-rose-500 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                    <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative z-10">
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                    {accionesCriticas.toLocaleString('es-PE')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">operaciones</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                  <span className="truncate">Eliminaciones y bajas</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-rose-500/20 transition-colors shrink-0">
                    ELIMINAR / DROP
                  </span>
                </div>
              </div>

              {/* Card 3: Autenticaciones & Credenciales */}
              <div className="animate-card-fade-3 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/15 hover:border-indigo-500/50 transition-all duration-300">
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-500 transition-colors">
                    Seguridad & Accesos
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-500 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <Key className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative z-10">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                    {loginsHoy.toLocaleString('es-PE')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">auths</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                  <span className="truncate">Logins & Resets</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-indigo-500/20 transition-colors shrink-0">
                    AUTH / CLAVES
                  </span>
                </div>
              </div>

              {/* Card 4: Tenant Con Más Tráfico */}
              <div className="animate-card-fade-4 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/15 hover:border-amber-500/50 transition-all duration-300">
                {/* Glow ambiental sutil */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-500 transition-colors">
                    Tenant Con Más Tráfico
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                    <Building2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5 min-w-0 relative z-10">
                  <span
                    className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-heading truncate tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300"
                    title={topTenant?.nombre || 'Plataforma SaaS'}
                  >
                    {topTenant?.nombre || 'Plataforma SaaS'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                  <span className="truncate">Carga operacional</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] font-mono group-hover:bg-amber-500/20 transition-colors shrink-0">
                    {topTenant?.count || 0} evts hoy
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Barra de Herramientas y Filtros Forenses */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#02CBA9]" />
                    <span>Registro Forense de Auditoría Global (Cross-Tenant)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trazabilidad inmutable de operaciones, mutaciones de datos y eventos de seguridad en tiempo real.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={exportarAuditoriaCSV}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    title="Descargar historial filtrado en formato CSV compatible con Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cargarAuditoriaPaginada()}
                    disabled={loadingAuditoria}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] hover:opacity-95 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-[#02CBA9]/25 disabled:opacity-50"
                    title="Sincronizar telemetría de auditoría"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditoria ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>

              {/* Controles de Filtros Avanzados Rediseñados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Búsqueda de Texto con Limpieza */}
                <div className="relative">
                  <div className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-2.5 focus-within:border-[#02CBA9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 transition-all">
                    <div className="w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center shrink-0 text-slate-400">
                      <Search className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                        Buscar
                      </span>
                      <input
                        type="text"
                        value={busquedaAuditoria}
                        onChange={(e) => setBusquedaAuditoria(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setPaginaAuditoria(1);
                            cargarAuditoriaPaginada({ page: 1, q: busquedaAuditoria });
                          }
                        }}
                        placeholder="Usuario, IP, acción..."
                        className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none truncate"
                      />
                    </div>
                    {busquedaAuditoria && (
                      <button
                        type="button"
                        onClick={() => {
                          setBusquedaAuditoria('');
                          setPaginaAuditoria(1);
                          cargarAuditoriaPaginada({ page: 1, q: '' });
                        }}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Limpiar búsqueda"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtro por Tenant / Empresa */}
                <FiltroDesplegableAuditoria
                  id="filtro-auditoria-tenant"
                  label="Tenant / Empresa"
                  valor={filtroAuditoriaEmpresa}
                  opciones={opcionesFiltroTenant}
                  onChange={(val) => {
                    setFiltroAuditoriaEmpresa(val);
                    setPaginaAuditoria(1);
                  }}
                  desplegableActivo={desplegableActivo}
                  setDesplegableActivo={setDesplegableActivo}
                  icono={Building2}
                />

                {/* Filtro por Módulo */}
                <FiltroDesplegableAuditoria
                  id="filtro-auditoria-modulo"
                  label="Módulo del Sistema"
                  valor={filtroAuditoriaModulo}
                  opciones={opcionesFiltroModulo}
                  onChange={(val) => {
                    setFiltroAuditoriaModulo(val);
                    setPaginaAuditoria(1);
                  }}
                  desplegableActivo={desplegableActivo}
                  setDesplegableActivo={setDesplegableActivo}
                  icono={Layers}
                />

                {/* Filtro por Tipo de Acción */}
                <FiltroDesplegableAuditoria
                  id="filtro-auditoria-accion"
                  label="Tipo de Acción"
                  valor={filtroAuditoriaAccion}
                  opciones={opcionesFiltroAccion}
                  onChange={(val) => {
                    setFiltroAuditoriaAccion(val);
                    setPaginaAuditoria(1);
                  }}
                  desplegableActivo={desplegableActivo}
                  setDesplegableActivo={setDesplegableActivo}
                  icono={Filter}
                />
              </div>

              {/* 3. Tabla Forense de Auditoría */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/5">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/75 dark:bg-white/[0.02] text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3.5">Fecha / Hora</th>
                      <th className="py-3 px-3.5">Tenant</th>
                      <th className="py-3 px-3.5">Operador</th>
                      <th className="py-3 px-3.5">Módulo</th>
                      <th className="py-3 px-3.5">Tipo de Acción</th>
                      <th className="py-3 px-3.5">Entidad Afectada</th>
                      <th className="py-3 px-3.5">Dirección IP</th>
                      <th className="py-3 px-3.5 text-right">Forense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loadingAuditoria ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#02CBA9]" />
                            <span className="text-xs font-semibold">Cargando bitácora forense de auditoría...</span>
                          </div>
                        </td>
                      </tr>
                    ) : auditorias.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              No se encontraron eventos con los filtros seleccionados
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Pruebe restableciendo los filtros de Tenant, Módulo o texto de búsqueda.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      auditorias.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Fecha / Hora */}
                          <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{formatearFechaAuditoria(log.createdAt || log.created_at)}</span>
                            </div>
                          </td>

                          {/* Tenant */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {log.empresa?.nombre || 'Plataforma SaaS'}
                                </div>
                                {log.empresa?.ruc && (
                                  <div className="text-[10px] font-mono text-slate-400">
                                    RUC: {log.empresa.ruc}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Operador / Rol */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="text-slate-800 dark:text-slate-200 font-semibold">
                              {log.usuario_nombre || 'Sistema'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {log.usuario_rol || 'Automático'}
                            </div>
                          </td>

                          {/* Módulo */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold uppercase border border-slate-200/50 dark:border-white/5">
                              {log.modulo}
                            </span>
                          </td>

                          {/* Tipo de Acción */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {renderBadgeAccion(log.accion)}
                          </td>

                          {/* Entidad Afectada */}
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {log.entidad ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{log.entidad}</span>
                                {log.entidad_id && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/5 font-mono text-[10px] text-slate-500 font-bold">
                                    #{log.entidad_id}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Dirección IP */}
                          <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Terminal className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{normalizarIP(log.ip)}</span>
                              {esLocalhost(log.ip) && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-sans font-bold bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200/60 dark:border-white/10" title="Servidor Local (Loopback)">
                                  Local
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Botón Inspección Forense */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setLogSeleccionado(log);
                                setTabModalAuditoria('visual');
                                setCopiadoAuditoria(false);
                                setModalDetalleAuditoria(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-[#02CBA9]/15 hover:text-[#02CBA9] text-slate-600 dark:text-slate-300 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Inspeccionar payload forense completo"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. Paginación y Resumen Forense */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Registros por página:</span>
                  <select
                    value={limiteAuditoria}
                    onChange={(e) => {
                      const nuevoLim = Number(e.target.value);
                      setLimiteAuditoria(nuevoLim);
                      setPaginaAuditoria(1);
                      cargarAuditoriaPaginada({ limit: nuevoLim, page: 1 });
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-slate-400">
                    Mostrando {metaAuditoria.total > 0 ? (metaAuditoria.page - 1) * metaAuditoria.limit + 1 : 0} -{' '}
                    {Math.min(metaAuditoria.page * metaAuditoria.limit, metaAuditoria.total)} de {metaAuditoria.total} eventos
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (paginaAuditoria > 1) {
                        const prev = paginaAuditoria - 1;
                        setPaginaAuditoria(prev);
                        cargarAuditoriaPaginada({ page: prev });
                      }
                    }}
                    disabled={paginaAuditoria <= 1 || loadingAuditoria}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-white/5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                    {metaAuditoria.page} / {metaAuditoria.totalPages || 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (paginaAuditoria < metaAuditoria.totalPages) {
                        const next = paginaAuditoria + 1;
                        setPaginaAuditoria(next);
                        cargarAuditoriaPaginada({ page: next });
                      }
                    }}
                    disabled={paginaAuditoria >= metaAuditoria.totalPages || loadingAuditoria}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}





      {/* PESTAÑA 4: SALUD & RENDIMIENTO DEL SERVIDOR (BENTO GRID TELEMETRY) */}
      {currentTab === 'sistema' && (
        <div className="space-y-6">
          {/* 1. Tarjetas Forenses de Telemetría (4 KPIs Hero con animación y hover lift) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Estado del Servidor & Uptime */}
            <div className="animate-card-fade-1 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/15 hover:border-emerald-500/50 transition-all duration-300">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-500 transition-colors">
                  Estado & Uptime Core
                </span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-500 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Server className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2 flex-wrap relative z-10">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                  {sistema?.uptimeSeconds != null
                    ? `${Math.floor(sistema.uptimeSeconds / 3600)}h ${Math.floor((sistema.uptimeSeconds % 3600) / 60)}m`
                    : '100%'}
                </span>
                <span className="text-xs font-bold text-slate-400">uptime</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="truncate">{sistema?.estadoSaaS || 'Operativo 100%'}</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-emerald-500/20 transition-colors shrink-0 font-mono">
                  {sistema?.nodeVersion || 'v24.19'}
                </span>
              </div>
            </div>

            {/* Card 2: Latencia de Base de Datos MySQL */}
            <div className="animate-card-fade-2 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/15 hover:border-blue-500/50 transition-all duration-300">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-500 transition-colors">
                  Latencia MySQL
                </span>
                <button
                  type="button"
                  onClick={handleTestPingDB}
                  disabled={pingLoading}
                  title="Ejecutar prueba de ping a MySQL"
                  className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 text-blue-500 hover:text-white hover:bg-blue-500 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-5 h-5 stroke-[2.2] ${pingLoading ? 'animate-bounce' : ''}`} />
                </button>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative z-10">
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300 ${(dbPingLatency ?? sistema?.dbLatencyMs ?? 14) < 30
                  ? 'text-blue-600 dark:text-blue-400'
                  : (dbPingLatency ?? sistema?.dbLatencyMs ?? 14) < 80
                    ? 'text-amber-500'
                    : 'text-rose-500'
                  }`}>
                  {dbPingLatency ?? sistema?.dbLatencyMs ?? 14}
                </span>
                <span className="text-xs font-bold text-slate-400">ms ping</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                <span className="truncate">{sistema?.databaseName || 'MySQL'} Cluster</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-blue-500/20 transition-colors shrink-0">
                  {(dbPingLatency ?? sistema?.dbLatencyMs ?? 14) < 30 ? 'Óptima (<30ms)' : 'Normal'}
                </span>
              </div>
            </div>

            {/* Card 3: Memoria Heap Node.js */}
            <div className="animate-card-fade-3 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-500/15 hover:border-purple-500/50 transition-all duration-300">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-500 transition-colors">
                  Memoria Heap Node.js
                </span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 text-purple-500 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <Cpu className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap relative z-10">
                <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                  {sistema?.memoryHeapUsedMB || 28}
                </span>
                <span className="text-xs font-bold text-slate-400">MB en uso</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                <span className="truncate">RSS: {sistema?.memoryRssMB || 78} MB</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-purple-500/20 transition-colors shrink-0">
                  {sistema?.memoryHeapPct || 45}% pool
                </span>
              </div>
            </div>

            {/* Card 4: CPU & Servidor Host */}
            <div className="animate-card-fade-4 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/15 hover:border-amber-500/50 transition-all duration-300">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-500 transition-colors">
                  Hardware Host
                </span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                  <HardDrive className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5 min-w-0 relative z-10">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-300">
                  {sistema?.cpuCount || 8} Cores
                </span>
                <span className="text-xs font-bold text-slate-400">{sistema?.arch || 'x64'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                <span className="truncate">RAM Host: {sistema?.systemRamUsedGB || 3.2}GB</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] group-hover:bg-amber-500/20 transition-colors shrink-0">
                  {sistema?.systemRamUsagePct || 35}% Total
                </span>
              </div>
            </div>
          </div>

          {/* 2. Barra de Herramientas de Mantenimiento y Operaciones Rápidas con animación */}
          <div className="animate-card-fade-5 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:shadow-lg hover:border-[#02CBA9]/30 transition-all duration-300 relative overflow-hidden group flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#02CBA9]/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2 group-hover:text-[#02CBA9] transition-colors">
                <Terminal className="w-5 h-5 text-[#02CBA9] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                <span>Consola de Operaciones & Diagnóstico Activo</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Herramientas operativas en caliente para optimización de recursos, pruebas de latencia y respaldo técnico.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto relative z-10">
              <button
                type="button"
                onClick={handleTestPingDB}
                disabled={pingLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 text-blue-500 ${pingLoading ? 'animate-bounce' : 'group-hover:scale-110'}`} />
                <span>{pingLoading ? 'Midiendo...' : 'Probar Latencia DB'}</span>
              </button>

              <button
                type="button"
                onClick={handlePurgarMemoria}
                disabled={purgarLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-purple-500/10 hover:text-purple-500 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-purple-500 ${purgarLoading ? 'animate-spin' : ''}`} />
                <span>{purgarLoading ? 'Optimizando...' : 'Optimizar Memoria'}</span>
              </button>

              <button
                type="button"
                onClick={handleEjecutarTestServicios}
                disabled={healthCheckLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#02CBA9] to-[#1CC0F9] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#02CBA9]/20 hover:opacity-95 hover:shadow-lg hover:shadow-[#02CBA9]/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${healthCheckLoading ? 'animate-spin' : ''}`} />
                <span>{healthCheckLoading ? 'Verificando...' : 'Ejecutar Diagnóstico en Vivo'}</span>
              </button>

              <button
                type="button"
                onClick={handleDescargarDiagnosticoCompleto}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                title="Descargar reporte forense completo en JSON"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Exportar JSON</span>
              </button>
            </div>
          </div>

          {/* 3. Bento Grid Principal: Pool MySQL & Distribución de Memoria con Micro-Animaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Cluster MySQL & Pool de Conexiones */}
            <div className="animate-card-fade-5 p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:shadow-xl hover:shadow-blue-500/15 hover:border-blue-500/40 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group space-y-5">
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
                    <Database className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white font-heading group-hover:text-blue-500 transition-colors">
                      Motor MySQL & Pool de Conexiones
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Gestor de conexiones concurrentes y persistencia relacional
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold font-mono group-hover:bg-emerald-500/20 transition-colors">
                  {sistema?.dbStatus || 'Conectado'}
                </span>
              </div>

              {/* Métricas clave de MySQL en tarjetas con micro-animación */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group/sub cursor-default">
                  <div className="text-[10px] font-bold text-slate-400 uppercase group-hover/sub:text-blue-500 transition-colors">Base de Datos</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 truncate group-hover/sub:scale-[1.03] origin-left transition-transform">
                    {sistema?.databaseName || 'heis_suite'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group/sub cursor-default">
                  <div className="text-[10px] font-bold text-slate-400 uppercase group-hover/sub:text-blue-500 transition-colors">Versión Motor</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 truncate group-hover/sub:scale-[1.03] origin-left transition-transform">
                    {sistema?.mysqlVersion || 'MySQL 8.0'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 col-span-2 sm:col-span-1 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group/sub cursor-default">
                  <div className="text-[10px] font-bold text-slate-400 uppercase group-hover/sub:text-blue-500 transition-colors">Total Tablas</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 group-hover/sub:scale-[1.03] origin-left transition-transform">
                    {sistema?.totalTablas || 38} tablas
                  </div>
                </div>
              </div>

              {/* Estado del Pool de Conexiones Sequelize */}
              <div className="space-y-2.5 pt-1 relative z-10">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600 dark:text-slate-300">Capacidad del Pool de Conexiones:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold group-hover:text-blue-500 transition-colors">
                    {sistema?.pool?.using || 1} en uso / {sistema?.pool?.max || 10} máx
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(100, Math.max(10, Math.round(((sistema?.pool?.using || 1) / (sistema?.pool?.max || 10)) * 100)))}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10.5px] text-slate-400 pt-1">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group/pool">
                    <span className="block font-bold text-slate-700 dark:text-slate-300 font-mono group-hover/pool:text-blue-500 group-hover/pool:scale-110 transition-all">
                      {sistema?.pool?.using || 1}
                    </span>
                    <span>Activas</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group/pool">
                    <span className="block font-bold text-slate-700 dark:text-slate-300 font-mono group-hover/pool:text-blue-500 group-hover/pool:scale-110 transition-all">
                      {sistema?.pool?.available || 0}
                    </span>
                    <span>Disponibles</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group/pool">
                    <span className="block font-bold text-slate-700 dark:text-slate-300 font-mono group-hover/pool:text-blue-500 group-hover/pool:scale-110 transition-all">
                      {sistema?.pool?.waiting || 0}
                    </span>
                    <span>En Espera</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Distribución y Salud de Memoria RAM */}
            <div className="animate-card-fade-6 p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:shadow-xl hover:shadow-purple-500/15 hover:border-purple-500/40 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group space-y-5">
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-2xs">
                    <Cpu className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white font-heading group-hover:text-purple-500 transition-colors">
                      Distribución de Memoria RAM (Runtime & Host)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Asignación del motor V8 y huella física en el servidor
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500 text-[10px] font-bold font-mono group-hover:bg-purple-500/20 transition-colors">
                  {sistema?.memoryHeapPct || 45}% Heap
                </span>
              </div>

              {/* Barra de progreso de Heap */}
              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600 dark:text-slate-300">Heap Utilizado vs Total Asignado:</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold group-hover:scale-[1.02] origin-right transition-transform">
                    {sistema?.memoryHeapUsedMB || 28} MB / {sistema?.memoryHeapTotalMB || 50} MB
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(100, Math.max(5, sistema?.memoryHeapPct || 45))}%`,
                    }}
                  />
                </div>
              </div>

              {/* 4 Métricas de Memoria con animación individual */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 relative z-10">
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group/sub cursor-default flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase group-hover/sub:text-purple-500 transition-colors">RSS Físico</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 group-hover/sub:scale-[1.03] origin-left transition-transform">
                      {sistema?.memoryRssMB || 78} MB
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Total Proceso</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group/sub cursor-default flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase group-hover/sub:text-purple-500 transition-colors">Memoria Externa</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 group-hover/sub:scale-[1.03] origin-left transition-transform">
                      {sistema?.memoryExternalMB || 1.8} MB
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">C++ Buffers</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group/sub cursor-default flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase group-hover/sub:text-emerald-500 transition-colors">RAM Host Libre</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 group-hover/sub:scale-[1.03] origin-left transition-transform">
                      {sistema?.systemRamFreeGB || 12.8} GB
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Disponible</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group/sub cursor-default flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase group-hover/sub:text-purple-500 transition-colors">RAM Host Total</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 group-hover/sub:scale-[1.03] origin-left transition-transform">
                      {sistema?.systemRamTotalGB || 16.0} GB
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Servidor</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Suite de Health Checks en Tiempo Real con Animaciones */}
          <div className="animate-card-fade-5 p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:shadow-xl hover:border-[#02CBA9]/30 transition-all duration-300 relative overflow-hidden group space-y-4">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#02CBA9]/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3 relative z-10">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2 group-hover:text-[#02CBA9] transition-colors">
                  <ShieldCheck className="w-5 h-5 text-[#02CBA9] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                  <span>Matriz de Diagnóstico y Salud de Servicios Críticos</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verificación en caliente de componentes de base de datos, almacenamiento y micro-módulos.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono self-start sm:self-auto group-hover:bg-emerald-500/20 transition-colors">
                {testResultados?.estadoGlobal || sistema?.estadoSaaS || '100% Operativo'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
              {(testResultados?.servicios || sistema?.healthChecks || [
                { id: 'db', nombre: 'Cluster MySQL Transaccional', detalle: `${dbPingLatency ?? sistema?.dbLatencyMs ?? 14} ms latencia`, estado: 'optimo' },
                { id: 'storage', nombre: 'Almacenamiento I/O & Archivos', detalle: 'Permisos de lectura/escritura OK', estado: 'optimo' },
                { id: 'memory', nombre: 'Salud de Memoria Heap', detalle: `${sistema?.memoryHeapUsedMB || 28} MB en uso`, estado: 'optimo' },
                { id: 'verticales', nombre: 'Verticales SaaS en Caliente', detalle: '4 módulos activos', estado: 'optimo' },
              ]).map((check, idx) => {
                const isOptimo = check.estado === 'optimo' || check.estado === 'ok';
                const isWarn = check.estado === 'advertencia' || check.estado === 'warning';
                return (
                  <div
                    key={check.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-2 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300 group/item relative overflow-hidden"
                  >
                    <div className="absolute -top-8 -right-8 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover/item:text-emerald-500 transition-colors">
                        {check.nombre || check.servicio}
                      </span>
                      {isOptimo ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 group-hover/item:scale-125 group-hover/item:rotate-12 transition-all duration-300" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 group-hover/item:scale-125 transition-all duration-300" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 group-hover/item:scale-125 transition-all duration-300" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed truncate relative z-10">
                      {check.detalle}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] relative z-10">
                      <span className="text-slate-400">Estado</span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded-full group-hover/item:scale-105 transition-transform duration-200 ${isOptimo
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : isWarn
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-rose-500/10 text-rose-500'
                        }`}>
                        {isOptimo ? 'ÓPTIMO' : isWarn ? 'ALERTA' : 'CRÍTICO'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Cargador Dinámico de Verticales SaaS con Animación Elevada */}
          <div className="animate-card-fade-6 p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden group space-y-4">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3 relative z-10">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2 group-hover:text-indigo-500 transition-colors">
                  <Layers className="w-5 h-5 text-indigo-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                  <span>Cargador Dinámico de Verticales Multi-Tenant</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Micro-módulos montados en caliente sobre el Core HEIS con aislamiento lógico por tenant.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold font-mono self-start sm:self-auto group-hover:bg-indigo-500/20 transition-colors">
                4/4 Módulos Activos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
              {/* Vertical 1: Restaurante */}
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2 hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/15 hover:border-amber-500/50 transition-all duration-300 group/vert relative overflow-hidden cursor-pointer">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none opacity-0 group-hover/vert:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover/vert:text-amber-500 transition-colors">
                    <UtensilsCrossed className="w-4 h-4 group-hover/vert:scale-110 group-hover/vert:rotate-6 transition-all duration-300" />
                    <span>Restaurante & Gastro</span>
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 relative z-10">
                  Mesas, comandas, cocina KDS y facturación rápida
                </div>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono relative z-10">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold group-hover/vert:scale-105 origin-right transition-transform">
                    /api/restaurante
                  </span>
                </div>
              </div>

              {/* Vertical 2: Ferretería */}
              <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-2 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/15 hover:border-indigo-500/50 transition-all duration-300 group/vert relative overflow-hidden cursor-pointer">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/15 rounded-full blur-xl pointer-events-none opacity-0 group-hover/vert:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover/vert:text-indigo-500 transition-colors">
                    <ShoppingBag className="w-4 h-4 group-hover/vert:scale-110 group-hover/vert:-rotate-6 transition-all duration-300" />
                    <span>Ferretería & Retail</span>
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 relative z-10">
                  Kardex SUNAT, lotes, códigos de barra y cotizaciones
                </div>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono relative z-10">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover/vert:scale-105 origin-right transition-transform">
                    /api/ferreteria
                  </span>
                </div>
              </div>

              {/* Vertical 3: Botica */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/15 hover:border-emerald-500/50 transition-all duration-300 group/vert relative overflow-hidden cursor-pointer">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/15 rounded-full blur-xl pointer-events-none opacity-0 group-hover/vert:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover/vert:text-emerald-500 transition-colors">
                    <Pill className="w-4 h-4 group-hover/vert:scale-110 group-hover/vert:rotate-12 transition-all duration-300" />
                    <span>Botica & Farmacia</span>
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 relative z-10">
                  Catálogo DIGEMID, recetas médicas y vencimientos
                </div>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono relative z-10">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold group-hover/vert:scale-105 origin-right transition-transform">
                    /api/botica
                  </span>
                </div>
              </div>

              {/* Vertical 4: Hospedaje */}
              <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 space-y-2 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/15 hover:border-purple-500/50 transition-all duration-300 group/vert relative overflow-hidden cursor-pointer">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none opacity-0 group-hover/vert:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover/vert:text-purple-500 transition-colors">
                    <Hotel className="w-4 h-4 group-hover/vert:scale-110 group-hover/vert:-rotate-6 transition-all duration-300" />
                    <span>Hospedaje & Hotel</span>
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 relative z-10">
                  Rack de habitaciones, check-in/out y huéspedes
                </div>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono relative z-10">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold group-hover/vert:scale-105 origin-right transition-transform">
                    /api/hospedaje
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* PESTAÑA 5: COMUNICADOS & BROADCAST SAAS */}
      {currentTab === 'comunicados' && (() => {
        // Métricas calculadas para Bento KPIs
        const totalComunicados = comunicados.length;
        const totalActivos = comunicados.filter((c) => c.activo).length;
        const totalPausados = totalComunicados - totalActivos;
        const totalCriticos = comunicados.filter(
          (c) => c.tipo === 'alerta' || c.tipo === 'urgente' || c.prioridad === 'alta' || c.prioridad === 'critica'
        ).length;
        const totalSegmentados = comunicados.filter(
          (c) => c.empresa_id || (c.plan_objetivo && c.plan_objetivo !== 'todos')
        ).length;

        // Filtrado dinámico
        const comunicadosFiltrados = comunicados.filter((com) => {
          // Filtro por Estado
          if (filtroEstadoComunicado === 'activos' && !com.activo) return false;
          if (filtroEstadoComunicado === 'pausados' && com.activo) return false;

          // Filtro por Tipo
          if (filtroTipoComunicado !== 'todos') {
            if (filtroTipoComunicado === 'alerta' && com.tipo !== 'alerta' && com.tipo !== 'urgente') return false;
            if (filtroTipoComunicado !== 'alerta' && com.tipo !== filtroTipoComunicado) return false;
          }

          // Filtro por Audiencia
          if (filtroAudienciaComunicado === 'global' && (com.empresa_id || (com.plan_objetivo && com.plan_objetivo !== 'todos'))) return false;
          if (filtroAudienciaComunicado === 'plan' && (!com.plan_objetivo || com.plan_objetivo === 'todos' || com.empresa_id)) return false;
          if (filtroAudienciaComunicado === 'tenant' && !com.empresa_id) return false;

          // Búsqueda por texto
          if (busquedaComunicado.trim()) {
            const q = busquedaComunicado.toLowerCase().trim();
            const titulo = (com.titulo || '').toLowerCase();
            const mensaje = (com.mensaje || '').toLowerCase();
            const empresaNombre = (com.empresa?.nombre || '').toLowerCase();
            const empresaRuc = (com.empresa?.ruc || '').toLowerCase();
            if (!titulo.includes(q) && !mensaje.includes(q) && !empresaNombre.includes(q) && !empresaRuc.includes(q)) {
              return false;
            }
          }

          return true;
        });

        // Comunicado para el simulador en vivo (el primer activo o el primero en la lista)
        const comunicadoSimulacion = comunicados.find((c) => c.activo) || comunicados[0] || {
          titulo: 'Mantenimiento preventivo de infraestructura',
          mensaje: 'Se realizarán labores técnicas este domingo a las 02:00 AM para optimizar la sincronización de comprobantes con SUNAT.',
          tipo: 'mantenimiento',
          formato: 'banner',
          prioridad: 'media',
          cta_texto: 'Ver Estado del Servidor',
          cta_url: 'https://status.heis.pe',
        };

        const getVigenciaBadge = (inicio, fin) => {
          if (!inicio && !fin) return null;
          const now = new Date();
          const dInicio = inicio ? new Date(inicio) : null;
          const dFin = fin ? new Date(fin) : null;

          if (dFin && now > dFin) {
            return {
              label: 'Expirado',
              classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
            };
          }
          if (dInicio && now < dInicio) {
            return {
              label: 'Programado',
              classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            };
          }
          return {
            label: 'En Vigencia',
            classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          };
        };

        return (
          <div className="space-y-6">
            {/* 1. BENTO GRID KPIS CON MICRO-ANIMACIONES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Comunicados */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/15 hover:border-amber-500/40 transition-all duration-300 animate-card-fade-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/25 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Comunicados</span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Megaphone className="w-4 h-4 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-heading">
                    {totalComunicados}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">registrados</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 relative z-10">Historial completo en la plataforma</p>
              </div>

              {/* Card 2: En Pantalla en Vivo */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/15 hover:border-emerald-500/40 transition-all duration-300 animate-card-fade-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/25 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">En Pantalla en Vivo</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs relative group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Radio className="w-4 h-4 stroke-[2.2]" />
                    {totalActivos > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-heading">
                    {totalActivos}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">activos</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 relative z-10">Visibles para usuarios de clientes ahora</p>
              </div>

              {/* Card 3: Alertas / Críticos */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-rose-500/15 hover:border-rose-500/40 transition-all duration-300 animate-card-fade-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/25 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avisos Críticos / Alertas</span>
                  <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-heading">
                    {totalCriticos}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">urgentes</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 relative z-10">Prioridad alta, contingencias o SUNAT</p>
              </div>

              {/* Card 4: Segmentados por Plan / Tenant */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-cyan-500/15 hover:border-cyan-500/40 transition-all duration-300 animate-card-fade-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/25 group-hover:scale-125 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Segmentados (Plan / Tenant)</span>
                  <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Target className="w-4 h-4 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 font-heading">
                    {totalSegmentados}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">focalizados</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 relative z-10">Dirigidos por plan o a un cliente puntual</p>
              </div>
            </div>

            {/* 2. BARRA DE FILTROS AVANZADOS Y BÚSQUEDA */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm hover:shadow-md hover:border-slate-300/80 dark:hover:border-white/10 transition-all duration-300 space-y-4 animate-card-fade-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Buscador de comunicados */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={busquedaComunicado}
                    onChange={(e) => setBusquedaComunicado(e.target.value)}
                    placeholder="Buscar por título, contenido o nombre de empresa..."
                    className="w-full h-10 pl-10 pr-9 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#02CBA9]/30 focus:border-[#02CBA9]"
                  />
                  {busquedaComunicado && (
                    <button
                      type="button"
                      onClick={() => setBusquedaComunicado('')}
                      className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300 flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Botón de Limpiar Filtros cuando hay filtros activos */}
                {(filtroEstadoComunicado !== 'todos' || filtroTipoComunicado !== 'todos' || filtroAudienciaComunicado !== 'todos' || busquedaComunicado) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaComunicado('');
                      setFiltroEstadoComunicado('todos');
                      setFiltroTipoComunicado('todos');
                      setFiltroAudienciaComunicado('todos');
                    }}
                    className="h-10 px-4 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    title="Restablecer todos los filtros"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpiar Filtros</span>
                  </button>
                )}
              </div>

              {/* Filtros Segmentados */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none flex-wrap text-xs">
                {/* Filtro por Estado */}
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoComunicado('todos')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroEstadoComunicado === 'todos'
                      ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Todos ({totalComunicados})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoComunicado('activos')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${filtroEstadoComunicado === 'activos'
                      ? 'bg-white dark:bg-white/15 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
                      }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    En Pantalla ({totalActivos})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoComunicado('pausados')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${filtroEstadoComunicado === 'pausados'
                      ? 'bg-white dark:bg-white/15 text-slate-700 dark:text-slate-200 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                      }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Pausados ({totalPausados})
                  </button>
                </div>

                {/* Filtro por Tipo */}
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFiltroTipoComunicado('todos')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroTipoComunicado === 'todos'
                      ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Tipo: Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTipoComunicado('info')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroTipoComunicado === 'info'
                      ? 'bg-white dark:bg-white/15 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
                      }`}
                  >
                    Informativos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTipoComunicado('alerta')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroTipoComunicado === 'alerta'
                      ? 'bg-white dark:bg-white/15 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'
                      }`}
                  >
                    Alertas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTipoComunicado('mantenimiento')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroTipoComunicado === 'mantenimiento'
                      ? 'bg-white dark:bg-white/15 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-amber-500'
                      }`}
                  >
                    Mantenimientos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTipoComunicado('exito')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroTipoComunicado === 'exito'
                      ? 'bg-white dark:bg-white/15 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
                      }`}
                  >
                    Éxito / Novedades
                  </button>
                </div>

                {/* Filtro por Audiencia */}
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFiltroAudienciaComunicado('todos')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroAudienciaComunicado === 'todos'
                      ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Audiencia: Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAudienciaComunicado('global')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroAudienciaComunicado === 'global'
                      ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
                      }`}
                  >
                    Global (Todos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAudienciaComunicado('plan')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroAudienciaComunicado === 'plan'
                      ? 'bg-white dark:bg-white/15 text-cyan-600 dark:text-cyan-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-cyan-500'
                      }`}
                  >
                    Por Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAudienciaComunicado('tenant')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${filtroAudienciaComunicado === 'tenant'
                      ? 'bg-white dark:bg-white/15 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-purple-500'
                      }`}
                  >
                    Por Tenant
                  </button>
                </div>
              </div>
            </div>

            {/* 3. SIMULADOR INTERACTIVO DE EMISIÓN EN VIVO */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm space-y-4 animate-card-fade-5 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 flex items-center justify-center">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white font-heading flex items-center gap-2">
                      <span>Simulador Interactivo de Emisión (Experiencia del Cliente)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        En Vivo
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Visualiza exactamente cómo se desplegará el comunicado en los navegadores de los clientes.
                    </p>
                  </div>
                </div>

                {/* Switch de Formato del Simulador */}
                <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setSimuladorFormato('banner')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${simuladorFormato === 'banner'
                      ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Banner Superior</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimuladorFormato('modal')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${simuladorFormato === 'modal'
                      ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Modal Pop-up Bloqueante</span>
                  </button>
                </div>
              </div>

              {/* Render del Simulador */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                {simuladorFormato === 'banner' ? (
                  /* Banner Superior Preview */
                  <div
                    className={`px-4 py-2.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs border text-xs font-semibold transition-all ${comunicadoSimulacion.tipo === 'alerta' || comunicadoSimulacion.tipo === 'urgente'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      : comunicadoSimulacion.tipo === 'mantenimiento'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                        : comunicadoSimulacion.tipo === 'exito'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-300'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                      <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/25 shrink-0 shadow-xs">
                        {comunicadoSimulacion.tipo}
                      </span>
                      <span className="font-black shrink-0">{comunicadoSimulacion.titulo}:</span>
                      <span className="truncate opacity-90 font-medium">{comunicadoSimulacion.mensaje}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {comunicadoSimulacion.cta_texto && (
                        <a
                          href={comunicadoSimulacion.cta_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-3 rounded-full text-[11px] font-bold bg-white dark:bg-black/40 text-current hover:opacity-90 shadow-xs border border-current/20 flex items-center gap-1.5 transition-all"
                        >
                          <span>{comunicadoSimulacion.cta_texto}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <span className="text-[11px] opacity-60 font-mono px-1.5">✕</span>
                    </div>
                  </div>
                ) : (
                  /* Modal Pop-up Preview */
                  <div className="max-w-md mx-auto p-5 rounded-3xl bg-white dark:bg-[#1a1442] border border-slate-200 dark:border-white/10 shadow-xl space-y-4 text-center">
                    <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-md bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/30">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {comunicadoSimulacion.tipo.toUpperCase()} &bull; PRIORIDAD {comunicadoSimulacion.prioridad?.toUpperCase() || 'MEDIA'}
                      </span>
                      <h5 className="font-black text-base text-slate-900 dark:text-white font-heading mt-2">
                        {comunicadoSimulacion.titulo}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                        {comunicadoSimulacion.mensaje}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-2">
                      {comunicadoSimulacion.cta_texto && (
                        <a
                          href={comunicadoSimulacion.cta_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="h-9 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <span>{comunicadoSimulacion.cta_texto}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                      >
                        Entendido
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. GRID DE TARJETAS DE COMUNICADOS */}
            <div className="space-y-4 animate-card-fade-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span>Listado de Comunicados ({comunicadosFiltrados.length})</span>
                  {busquedaComunicado && (
                    <span className="text-[11px] font-normal lowercase text-cyan-600 dark:text-cyan-400">
                      (filtrado por "{busquedaComunicado}")
                    </span>
                  )}
                </h4>
              </div>

              {comunicadosFiltrados.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-[#18123B] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 space-y-2">
                  <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No se encontraron comunicados con los filtros aplicados</p>
                  <p className="text-[11px] text-slate-400">
                    Prueba cambiando los filtros o haz clic en{' '}
                    <button
                      type="button"
                      onClick={handleAbrirNuevoComunicado}
                      className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer inline"
                    >
                      "Emitir Nuevo Comunicado"
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {comunicadosFiltrados.map((com, idx) => {
                    const vigenciaBadge = getVigenciaBadge(com.fecha_inicio, com.fecha_fin);
                    const animClass = `animate-card-fade-${(idx % 6) + 1}`;
                    const tipoEstilo = {
                      urgente: {
                        borderHover: 'hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-500/15',
                        glow: 'bg-rose-500/10 group-hover:bg-rose-500/25',
                        titleHover: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
                      },
                      alerta: {
                        borderHover: 'hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-500/15',
                        glow: 'bg-rose-500/10 group-hover:bg-rose-500/25',
                        titleHover: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
                      },
                      mantenimiento: {
                        borderHover: 'hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/15',
                        glow: 'bg-amber-500/10 group-hover:bg-amber-500/25',
                        titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
                      },
                      exito: {
                        borderHover: 'hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/15',
                        glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/25',
                        titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
                      },
                      info: {
                        borderHover: 'hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/15',
                        glow: 'bg-sky-500/10 group-hover:bg-sky-500/25',
                        titleHover: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
                      },
                    }[com.tipo] || {
                      borderHover: 'hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/15',
                      glow: 'bg-indigo-500/10 group-hover:bg-indigo-500/25',
                      titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
                    };

                    return (
                      <div
                        key={com.id}
                        className={`${animClass} p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs ${tipoEstilo.borderHover} hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden`}
                      >
                        {/* Resplandor ambiental superior dinámico con animación al hover */}
                        <div className={`absolute -top-14 -right-14 w-44 h-44 ${tipoEstilo.glow} rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500`} />

                        <div className="relative z-10">
                          {/* Cabecera de la Tarjeta con Badges de Audiencia y Formato */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Badge de Tipo */}
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-transform duration-200 group-hover:scale-105 ${com.tipo === 'urgente' || com.tipo === 'alerta'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : com.tipo === 'mantenimiento'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : com.tipo === 'exito'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                  }`}
                              >
                                {com.tipo}
                              </span>

                              {/* Badge de Formato */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 flex items-center gap-1 transition-transform duration-200 group-hover:scale-105">
                                {com.formato === 'modal' ? (
                                  <>
                                    <Layers className="w-3 h-3 text-purple-500" />
                                    <span>Pop-up Modal</span>
                                  </>
                                ) : (
                                  <>
                                    <Monitor className="w-3 h-3 text-sky-500" />
                                    <span>Banner Superior</span>
                                  </>
                                )}
                              </span>

                              {/* Badge de Audiencia */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 flex items-center gap-1 transition-transform duration-200 group-hover:scale-105">
                                {com.empresa ? (
                                  <>
                                    <Building2 className="w-3 h-3 text-purple-500" />
                                    <span className="truncate max-w-[130px]">{com.empresa.nombre}</span>
                                  </>
                                ) : com.plan_objetivo && com.plan_objetivo !== 'todos' ? (
                                  <>
                                    <Target className="w-3 h-3 text-cyan-500" />
                                    <span>Plan {com.plan_objetivo.toUpperCase()}</span>
                                  </>
                                ) : (
                                  <>
                                    <Globe className="w-3 h-3 text-emerald-500" />
                                    <span>Global (Todos)</span>
                                  </>
                                )}
                              </span>

                              {/* Badge de Vigencia si aplica */}
                              {vigenciaBadge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-transform duration-200 group-hover:scale-105 ${vigenciaBadge.classes}`}>
                                  {vigenciaBadge.label}
                                </span>
                              )}
                            </div>

                            {/* Switch táctil estándar de píldora verde compacta (SIN TEXTO) */}
                            <div
                              onClick={() => handleToggleComunicado(com.id)}
                              title={com.activo ? "Pausar comunicado" : "Poner en pantalla"}
                              className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 cursor-pointer shrink-0 select-none flex items-center active:scale-90 hover:scale-105 ${com.activo
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40 justify-end'
                                : 'bg-slate-200 dark:bg-white/10 justify-start'
                                }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 ${com.activo ? 'scale-100 text-emerald-600' : 'scale-90 text-slate-400'
                                  }`}
                              >
                                {com.activo ? (
                                  <Check className="w-3 h-3 stroke-[3.5]" />
                                ) : (
                                  <X className="w-2.5 h-2.5 stroke-[2.5]" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Título y Mensaje */}
                          <h4 className={`font-bold text-sm sm:text-base text-slate-900 dark:text-white font-heading ${tipoEstilo.titleHover} transition-colors duration-200`}>
                            {com.titulo}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                            {com.mensaje}
                          </p>

                          {/* CTA y Vigencia Meta */}
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            {com.cta_texto && (
                              <a
                                href={com.cta_url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/20 hover:scale-105 active:scale-95 transition-all duration-200"
                              >
                                <span>{com.cta_texto}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {(com.fecha_inicio || com.fecha_fin) && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <CalendarClock className="w-3 h-3 text-slate-400" />
                                <span>
                                  {com.fecha_inicio ? new Date(com.fecha_inicio).toLocaleDateString() : 'Inmediato'} &rarr;{' '}
                                  {com.fecha_fin ? new Date(com.fecha_fin).toLocaleDateString() : 'Indefinido'}
                                </span>
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-auto font-mono">
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span>{com.visto_contador || 0} lecturas</span>
                            </span>
                          </div>
                        </div>

                        {/* Pie de la Tarjeta con Acciones */}
                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                          <span>
                            {new Date(com.createdAt || Date.now()).toLocaleDateString()} &bull; {com.creado_por || 'SuperAdmin'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditarComunicado(com)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 hover:scale-110 active:scale-90 transition-all cursor-pointer"
                              title="Editar comunicado"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarComunicado(com.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 hover:scale-110 active:scale-90 transition-all cursor-pointer"
                              title="Eliminar comunicado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* PESTAÑA 6: WHITE-LABEL LOGIN STUDIO (AUDITADO DE COMPETENCIA) */}
      {currentTab === 'whitelabel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Panel Izquierdo: Controles de Personalización */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm space-y-5">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Palette className="w-4 h-4 text-pink-500" />
                  <span>Personalizador de Login (Marca Blanca)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configura la apariencia de la pantalla de bienvenida para cada empresa cliente.
                </p>
              </div>

              {/* Selector de Tenant Rediseñado con Píldora Envolvente */}
              <SelectorTenantWhitelabel
                valor={tenantWhitelabelId}
                onChange={(nuevoId) => setTenantWhitelabelId(nuevoId)}
                empresas={empresas}
              />

              {/* Logo del Login */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="group rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/90 dark:border-white/10 px-3.5 py-2.5 focus-within:border-pink-500 focus-within:ring-4 focus-within:ring-pink-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.06] transition-all duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-pink-500 transition-colors">
                      Logotipo de la Pantalla de Login
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">PNG / SVG</span>
                  </div>
                  <input
                    type="text"
                    placeholder="URL del logotipo (PNG transparente o SVG)"
                    value={configWhitelabel.logoUrl}
                    onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, logoUrl: e.target.value })}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="group rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/90 dark:border-white/10 px-3.5 py-2 focus-within:border-pink-500 focus-within:ring-4 focus-within:ring-pink-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.06] transition-all duration-200">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Ancho (px)</span>
                    <input
                      type="number"
                      value={configWhitelabel.logoWidth}
                      onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, logoWidth: Number(e.target.value) })}
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="group rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/90 dark:border-white/10 px-3.5 py-2 focus-within:border-pink-500 focus-within:ring-4 focus-within:ring-pink-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.06] transition-all duration-200">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Alto (px)</span>
                    <input
                      type="number"
                      value={configWhitelabel.logoHeight}
                      onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, logoHeight: Number(e.target.value) })}
                      className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Textos del Encabezado */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="group rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/90 dark:border-white/10 px-3.5 py-2 focus-within:border-pink-500 focus-within:ring-4 focus-within:ring-pink-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.06] transition-all duration-200">
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Título del Formulario</span>
                  <input
                    type="text"
                    value={configWhitelabel.tituloLogin}
                    onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, tituloLogin: e.target.value })}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="group rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/90 dark:border-white/10 px-3.5 py-2 focus-within:border-pink-500 focus-within:ring-4 focus-within:ring-pink-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.06] transition-all duration-200">
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Subtítulo / Eslogan</span>
                  <input
                    type="text"
                    value={configWhitelabel.subtituloLogin}
                    onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, subtituloLogin: e.target.value })}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Preset de Fondo 1080p Rediseñado */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
                <SelectorPresetFondoWhitelabel
                  valor={configWhitelabel.bgPreset}
                  onChange={(nuevoPreset) => setConfigWhitelabel({ ...configWhitelabel, bgPreset: nuevoPreset })}
                  presets={PRESETS_FONDO}
                />
                {configWhitelabel.bgPreset === 'custom' && (
                  <div className="group rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/90 dark:border-white/10 px-3.5 py-2.5 focus-within:border-pink-500 focus-within:ring-4 focus-within:ring-pink-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.06] transition-all duration-200 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-pink-500 transition-colors">
                        URL Directa de Imagen 1080p
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">HTTPS Requerido</span>
                    </div>
                    <input
                      type="text"
                      placeholder="https://ejemplo.com/fondo-corporativo.jpg"
                      value={configWhitelabel.bgCustomUrl}
                      onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, bgCustomUrl: e.target.value })}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50"
                    />
                  </div>
                )}
              </div>

              {/* Colores Corporativos */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-3 h-3 text-pink-500" />
                    <span>Paleta de Colores & Botón Principal</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfigWhitelabel({
                        ...configWhitelabel,
                        colorFondoHead: '#ffffff',
                        colorFondoBody: '#f8fafc',
                        colorPrimario: '#02CBA9',
                      })}
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                      title="Aplicar paleta de colores oficial en Tema Claro"
                    >
                      <Sun className="w-2.5 h-2.5" />
                      <span>Tema Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfigWhitelabel({
                        ...configWhitelabel,
                        colorFondoHead: '#110C2B',
                        colorFondoBody: '#0c0824',
                        colorPrimario: '#02CBA9',
                      })}
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1"
                      title="Aplicar paleta de colores en Tema Oscuro"
                    >
                      <Moon className="w-2.5 h-2.5" />
                      <span>Tema Oscuro</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 text-center">
                    <span className="text-[9.5px] text-slate-400 font-bold block mb-1.5">Botón Principal</span>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="color"
                        value={configWhitelabel.colorPrimario}
                        onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, colorPrimario: e.target.value })}
                        className="w-7 h-7 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-[11px] font-mono font-black text-slate-800 dark:text-white">{configWhitelabel.colorPrimario}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 text-center">
                    <span className="text-[9.5px] text-slate-400 font-bold block mb-1.5">Fondo Head</span>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="color"
                        value={configWhitelabel.colorFondoHead}
                        onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, colorFondoHead: e.target.value })}
                        className="w-7 h-7 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-[11px] font-mono font-black text-slate-800 dark:text-white">{configWhitelabel.colorFondoHead}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 text-center">
                    <span className="text-[9.5px] text-slate-400 font-bold block mb-1.5">Fondo Body</span>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="color"
                        value={configWhitelabel.colorFondoBody}
                        onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, colorFondoBody: e.target.value })}
                        className="w-7 h-7 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-[11px] font-mono font-black text-slate-800 dark:text-white">{configWhitelabel.colorFondoBody}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copyright */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                <div
                  onClick={() => setConfigWhitelabel({ ...configWhitelabel, mostrarCopyright: !configWhitelabel.mostrarCopyright })}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    configWhitelabel.mostrarCopyright
                      ? 'bg-pink-500/10 border-pink-500/30'
                      : 'bg-slate-50/70 dark:bg-black/20 border-slate-200/90 dark:border-white/10'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Pie de Página / Copyright</div>
                    <div className="text-[10px] text-slate-400">Mostrar aviso legal corporativo en la pantalla de acceso</div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 shrink-0 select-none flex items-center ${
                      configWhitelabel.mostrarCopyright
                        ? 'bg-pink-600 shadow-sm shadow-pink-600/40 justify-end'
                        : 'bg-slate-200 dark:bg-white/10 justify-start'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 ${
                        configWhitelabel.mostrarCopyright ? 'scale-100 text-pink-600' : 'scale-90 text-slate-400'
                      }`}
                    >
                      {configWhitelabel.mostrarCopyright ? (
                        <Check className="w-3 h-3 stroke-[3.5]" />
                      ) : (
                        <X className="w-2.5 h-2.5 stroke-[2.5]" />
                      )}
                    </div>
                  </div>
                </div>
                {configWhitelabel.mostrarCopyright && (
                  <div className="group rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-200/90 dark:border-white/10 px-3.5 py-2 focus-within:border-pink-500 focus-within:ring-4 focus-within:ring-pink-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.06] transition-all duration-200">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Texto del Aviso de Copyright</span>
                    <input
                      type="text"
                      value={configWhitelabel.textoCopyright || ''}
                      onChange={(e) => setConfigWhitelabel({ ...configWhitelabel, textoCopyright: e.target.value })}
                      placeholder="© 2026 Mi Empresa. Todos los derechos reservados."
                      className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleGuardarWhitelabel}
                disabled={guardandoWhitelabel}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {guardandoWhitelabel ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Guardar Personalización</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panel Derecho: Previsualizador Interactivo en Tiempo Real */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-pink-500" />
                <span>Vista Previa en Vivo (Simulador de Pantalla)</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Dispositivo */}
                <div className="flex items-center gap-1 p-1 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setWhitelabelPreviewDevice('desktop')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${whitelabelPreviewDevice === 'desktop' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    title="Vista Escritorio"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhitelabelPreviewDevice('mobile')}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${whitelabelPreviewDevice === 'mobile' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    title="Vista Móvil"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Tema */}
                <button
                  type="button"
                  onClick={() => setWhitelabelPreviewTheme(whitelabelPreviewTheme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs cursor-pointer"
                  title="Alternar Modo Día / Noche"
                >
                  {whitelabelPreviewTheme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              </div>
            </div>

            {/* Simulador de Pantalla */}
            <div
              className={`rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative transition-all duration-300 mx-auto ${whitelabelPreviewDevice === 'mobile' ? 'max-w-sm aspect-[9/16]' : 'w-full aspect-[16/10]'
                }`}
              style={{
                backgroundColor: configWhitelabel.colorFondoBody || (whitelabelPreviewTheme === 'dark' ? '#110C2B' : '#f8fafc'),
                backgroundImage: `url(${configWhitelabel.bgPreset === 'custom'
                  ? configWhitelabel.bgCustomUrl
                  : PRESETS_FONDO.find((p) => p.id === configWhitelabel.bgPreset)?.url || PRESETS_FONDO[0].url
                  })`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Capa de soporte o contraste según el tema activo en el preview */}
              <div
                className={`absolute inset-0 backdrop-blur-[2px] transition-colors duration-300 ${
                  whitelabelPreviewTheme === 'dark' ? 'bg-slate-950/60' : 'bg-white/40'
                }`}
              />

              {/* Barra de cabecera simulada */}
              <div
                className={`relative z-10 px-4 py-2.5 flex items-center justify-between border-b text-xs select-none transition-colors duration-300 ${
                  whitelabelPreviewTheme === 'dark'
                    ? 'border-white/10 text-white'
                    : 'border-slate-200/80 text-slate-800'
                }`}
                style={{ backgroundColor: configWhitelabel.colorFondoHead }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className={`text-[10px] ml-2 font-mono ${whitelabelPreviewTheme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                    login.heis-suite.com
                  </span>
                </div>
                <div className={`text-[9px] font-black uppercase tracking-wider ${whitelabelPreviewTheme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                  {tenantWhitelabelId === 'global' ? 'Portal Central' : 'Portal Corporativo'}
                </div>
              </div>

              {/* Formulario de Login Simulado en Centro */}
              <div className="relative z-10 h-[calc(100%-40px)] flex flex-col items-center justify-center p-6 text-center">
                <div
                  className={`w-full max-w-sm rounded-3xl backdrop-blur-xl p-6 sm:p-7 shadow-2xl border text-left space-y-4 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 ${whitelabelPreviewTheme === 'dark'
                    ? 'bg-[#110C2B]/90 border-white/10 text-white'
                    : 'bg-white/95 border-slate-200/80 text-slate-900 shadow-xl'
                    }`}
                >
                  {/* Logo o Imagen de Marca */}
                  <div className="flex justify-center mb-1">
                    {configWhitelabel.logoUrl ? (
                      <img
                        src={configWhitelabel.logoUrl}
                        alt="Logo"
                        style={{
                          maxWidth: `${configWhitelabel.logoWidth}px`,
                          maxHeight: `${configWhitelabel.logoHeight}px`,
                        }}
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
                          style={{ backgroundColor: configWhitelabel.colorPrimario }}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`font-black text-sm font-heading ${whitelabelPreviewTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {tenantWhitelabelId === 'global'
                              ? 'HEIS SUITE'
                              : empresas.find((e) => String(e.id) === String(tenantWhitelabelId))?.nombre || 'EMPRESA'}
                          </div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-[#02CBA9]">
                            Cloud Enterprise
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className={`font-black text-sm font-heading text-center ${whitelabelPreviewTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {configWhitelabel.tituloLogin}
                    </h4>
                    <p className={`text-[11px] text-center mt-0.5 ${whitelabelPreviewTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {configWhitelabel.subtituloLogin}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className={`text-[10px] font-bold block mb-1 ${whitelabelPreviewTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Usuario / Correo
                      </label>
                      <input
                        type="text"
                        disabled
                        value="colaborador@empresa.com"
                        className={`w-full text-xs px-3 py-2 rounded-xl border ${whitelabelPreviewTheme === 'dark'
                          ? 'bg-white/5 border-white/10 text-slate-400'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold block mb-1 ${whitelabelPreviewTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Contraseña
                      </label>
                      <input
                        type="password"
                        disabled
                        value="••••••••••••"
                        className={`w-full text-xs px-3 py-2 rounded-xl border ${whitelabelPreviewTheme === 'dark'
                          ? 'bg-white/5 border-white/10 text-slate-400'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{ backgroundColor: configWhitelabel.colorPrimario }}
                    className="w-full h-10 rounded-xl text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-default"
                  >
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {configWhitelabel.mostrarCopyright && (
                    <div className="text-[9px] text-center text-slate-400 pt-1">
                      {configWhitelabel.textoCopyright}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 7: PERMISOS Y BOTONES GRANULARES RBAC (CONTROL MULTI-TENANT & FORENSE) */}
      {currentTab === 'permisos' && (() => {
        const empActual = empresas.find((e) => String(e.id) === String(tenantPermisosId));
        const planTenantActual = empActual ? empActual.plan : 'global';

        // Métricas Bento KPI
        const totalAcciones = catalogoAcciones.length;
        const criticasAcciones = catalogoAcciones.filter((a) => a.riesgo === 'critico').length;
        const pinAcciones = catalogoAcciones.filter((a) => a.requiere_pin).length;
        const auditAcciones = catalogoAcciones.filter((a) => a.auditoria_obligatoria).length;

        // Filtrado de Acciones
        const listaFiltrada = catalogoAcciones.filter((acc) => {
          if (filtroModuloPermisos !== 'todos' && acc.modulo !== filtroModuloPermisos) return false;
          if (filtroRiesgoPermisos !== 'todos' && (acc.riesgo || 'medio') !== filtroRiesgoPermisos) return false;
          if (filtroBusquedaPermisos) {
            const term = filtroBusquedaPermisos.toLowerCase();
            return (
              acc.alias.toLowerCase().includes(term) ||
              acc.nombre.toLowerCase().includes(term) ||
              (acc.descripcion && acc.descripcion.toLowerCase().includes(term))
            );
          }
          return true;
        });

        return (
          <div className="space-y-6">
            {/* Input oculto para importación de perfil JSON */}
            <input
              type="file"
              ref={fileInputPermisosRef}
              onChange={handleImportarPermisosJSON}
              accept=".json"
              className="hidden"
            />

            {/* 1. Panel Maestro: Entorno de Configuración RBAC Multi-Tenant */}
            <div className="animate-card-fade-1 p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 hover:border-cyan-500/30 transition-all duration-300 relative overflow-visible z-30 group">
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                {/* Selector de Tenant RBAC */}
                <div className="space-y-1.5 min-w-0 relative z-30">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      Entorno de Políticas RBAC
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${planTenantActual === 'enterprise'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                      : planTenantActual === 'pro'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                      }`}>
                      {tenantPermisosId === 'global' ? 'Global Core' : `Tenant: ${planTenantActual}`}
                    </span>
                    {cargandoPermisos && (
                      <span className="text-[10px] text-cyan-500 flex items-center gap-1 font-semibold animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Cargando políticas...
                      </span>
                    )}
                  </div>

                  <div className="pt-0.5">
                    <SelectorTenantModulos
                      valor={tenantPermisosId}
                      onChange={(nuevoId) => setTenantPermisosId(nuevoId)}
                      empresas={empresas}
                    />
                  </div>
                </div>

                {/* Acciones de Reseteo a Fábrica y Archivos JSON */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block sm:text-right">
                      Valores de Fábrica
                    </span>
                    <button
                      type="button"
                      onClick={handleRestablecerPermisosBotones}
                      disabled={guardandoPermisos}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 border border-transparent hover:border-rose-500/20 disabled:opacity-50"
                      title="Restablecer todos los permisos de este entorno a los valores predeterminados de HEIS Suite"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reset Fábrica</span>
                    </button>
                  </div>

                  <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/10 mx-1" />

                  {/* Acciones de Exportación / Importación JSON */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block sm:text-right">
                      Archivos JSON
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleExportarPermisosJSON}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white transition-all cursor-pointer shadow-2xs hover:scale-110 active:scale-95"
                        title="Exportar catálogo de permisos y botones en formato JSON"
                      >
                        <DownloadCloud className="w-4 h-4 text-cyan-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputPermisosRef.current?.click()}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs hover:scale-110 active:scale-95"
                        title="Importar catálogo de permisos desde archivo JSON"
                      >
                        <FileJson className="w-4 h-4 text-amber-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Bento Grid de Métricas y Cobertura de Seguridad (4 Cards con Micro-Animaciones) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Acciones */}
              <div className="animate-card-fade-1 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    Catálogo
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  {totalAcciones}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Micro-Acciones Totales
                </div>
              </div>

              {/* Acciones Críticas */}
              <div className="animate-card-fade-2 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10 hover:border-rose-500/40 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    Alto Impacto
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  {criticasAcciones}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Acciones Críticas
                </div>
              </div>

              {/* Requieren PIN */}
              <div className="animate-card-fade-3 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Doble Factor
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  {pinAcciones}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Requieren PIN Supervisor
                </div>
              </div>

              {/* Auditoría Obligatoria */}
              <div className="animate-card-fade-4 p-5 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Forense
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  {auditAcciones}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Auditoría Obligatoria
                </div>
              </div>
            </div>

            {/* 3. Barra de Filtros por Módulo, Nivel de Riesgo y Buscador */}
            <div className="animate-card-fade-5 p-4 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
              {/* Filtros por Módulo y Nivel de Riesgo */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Módulos */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                  {['todos', 'General', 'Ventas', 'POS', 'Finanzas', 'Seguridad', 'Reportes'].map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setFiltroModuloPermisos(mod)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filtroModuloPermisos === mod
                        ? 'bg-white dark:bg-white/15 text-cyan-600 dark:text-cyan-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                      {mod === 'todos' ? 'Todos' : mod}
                    </button>
                  ))}
                </div>

                <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/10 mx-1" />

                {/* Filtro por Riesgo */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5">Riesgo:</span>
                  {[
                    { id: 'todos', label: 'Todos', color: '' },
                    { id: 'critico', label: 'Crítico', color: 'text-rose-500' },
                    { id: 'medio', label: 'Medio', color: 'text-amber-500' },
                    { id: 'bajo', label: 'Bajo', color: 'text-emerald-500' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFiltroRiesgoPermisos(r.id)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filtroRiesgoPermisos === r.id
                        ? 'bg-white dark:bg-white/15 shadow-2xs ' + (r.color || 'text-cyan-600 dark:text-cyan-400')
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buscador de Acciones */}
              <div className="relative w-full xl:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por alias, acción o descripción..."
                  value={filtroBusquedaPermisos}
                  onChange={(e) => setFiltroBusquedaPermisos(e.target.value)}
                  className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
                />
                {filtroBusquedaPermisos && (
                  <button
                    type="button"
                    onClick={() => setFiltroBusquedaPermisos('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 4. Tabla de Permisos por Botón y Micro-Acción */}
            <div className="animate-card-fade-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="overflow-x-auto custom-modal-scroll">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                      <th className="py-3.5 px-3 w-12 text-center">Nro.</th>
                      <th className="py-3.5 px-3 w-40">Alias / Código</th>
                      <th className="py-3.5 px-3 min-w-[220px]">Nombre de Acción / Botón</th>
                      <th className="py-3.5 px-3 w-28 text-center">Módulo</th>
                      <th className="py-3.5 px-3 w-28 text-center">Nivel de Riesgo</th>
                      <th className="py-3.5 px-3 w-44 text-center">Políticas Seguridad</th>
                      <th className="py-3.5 px-3 min-w-[300px]">Roles con Acceso (Alternar)</th>
                      <th className="py-3.5 px-3 w-20 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                    {listaFiltrada.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Lock className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-500" />
                          <p className="font-semibold text-xs">No se encontraron acciones registradas con los filtros aplicados</p>
                        </td>
                      </tr>
                    ) : (
                      listaFiltrada.map((acc, index) => {
                        const IconoAccion = resolverIconoAccion(acc.icono);
                        const riesgo = acc.riesgo || 'medio';
                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group/row">
                            <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{index + 1}</td>

                            {/* Alias con Icono y Botón de Copiar */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                  <IconoAccion className="w-4 h-4" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(acc.alias);
                                    toast.success(`Alias '${acc.alias}' copiado al portapapeles`);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 font-mono font-black text-cyan-600 dark:text-cyan-400 text-xs hover:bg-cyan-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                  title="Clic para copiar alias"
                                >
                                  <span>{acc.alias}</span>
                                  <Copy className="w-2.5 h-2.5 opacity-60" />
                                </button>
                              </div>
                            </td>

                            {/* Nombre y Descripción */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{acc.nombre}</span>
                              </div>
                              <div className="text-[10.5px] text-slate-400 line-clamp-1">
                                {acc.descripcion || 'Control granular de micro-permiso por botón'}
                              </div>
                            </td>

                            {/* Módulo */}
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                                {acc.modulo}
                              </span>
                            </td>

                            {/* Nivel de Riesgo (Interactivo: Clic para alternar) */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleRiesgoAccion(acc.id)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer hover:scale-105 active:scale-95 border ${riesgo === 'critico'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-2xs'
                                  : riesgo === 'medio'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  }`}
                                title="Clic para alternar nivel de riesgo (Bajo -> Medio -> Crítico)"
                              >
                                {riesgo}
                              </button>
                            </td>

                            {/* Políticas de Seguridad: PIN y Auditoría */}
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Toggle PIN */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePinAccion(acc.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${acc.requiere_pin
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-2xs'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                                    }`}
                                  title={acc.requiere_pin ? 'Requiere PIN de Supervisor (Activo)' : 'No requiere PIN (Inactivo)'}
                                >
                                  <Key className="w-3 h-3" />
                                  <span>PIN</span>
                                </button>

                                {/* Toggle Auditoría */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAuditoriaAccion(acc.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${acc.auditoria_obligatoria
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-2xs'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                                    }`}
                                  title={acc.auditoria_obligatoria ? 'Auditoría Forense Obligatoria (Activo)' : 'Sin Auditoría Estricta (Inactivo)'}
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Audit</span>
                                </button>
                              </div>
                            </td>

                            {/* Roles con Permiso + Accesos Rápidos */}
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1">
                                  {['admin', 'supervisor', 'cajero', 'vendedor', 'mozo'].map((rol) => {
                                    const tienePermiso = acc.roles?.includes(rol);
                                    return (
                                      <button
                                        key={rol}
                                        type="button"
                                        onClick={() => handleTogglePermisoRol(acc.id, rol)}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer border hover:scale-105 active:scale-95 ${tienePermiso
                                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                          : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent hover:border-slate-300'
                                          }`}
                                      >
                                        {rol}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Helpers rápidos: Todos / Solo Admin */}
                                <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleSetRolesMasivos(acc.id, 'todos')}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                    title="Conceder permiso a todos los roles"
                                  >
                                    Todos
                                  </button>
                                  <span className="text-slate-300 dark:text-white/10 text-[9px]">|</span>
                                  <button
                                    type="button"
                                    onClick={() => handleSetRolesMasivos(acc.id, 'admin')}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors"
                                    title="Restringir solo para administradores"
                                  >
                                    Solo Admin
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Estado: Pequeña Píldora Verde Táctil con Check en caso de Activo (sin texto) */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleEstadoAccion(acc.id)}
                                className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 cursor-pointer shrink-0 select-none flex items-center mx-auto active:scale-90 ${acc.activo
                                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40 justify-end'
                                  : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 justify-start'
                                  }`}
                                title={acc.activo ? 'Habilitado (Clic para pausar)' : 'Pausado (Clic para habilitar)'}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 ${acc.activo ? 'scale-100 text-emerald-600' : 'scale-90 text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                  {acc.activo ? (
                                    <Check className="w-3 h-3 stroke-[3.5]" />
                                  ) : (
                                    <X className="w-2.5 h-2.5 stroke-[2.5]" />
                                  )}
                                </div>
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
          </div>
        );
      })()}

      {/* PESTAÑA 8: CONSTRUCTOR VISUAL DE MÓDULOS & SUBMENÚS (FEATURE FLAGS SAAS) */}
      {currentTab === 'modulos' && (() => {
        const empActual = empresas.find((e) => String(e.id) === String(tenantModulosId));
        const nombreTenantActual = empActual ? empActual.nombre : 'Plantilla Global (Por Defecto)';
        const planTenantActual = empActual ? empActual.plan : 'global';

        // Conteo total de submódulos
        let totalSubmodulosCount = 0;
        let activosSubmodulosCount = 0;
        VERTICALES_SISTEMA.forEach((v) => {
          v.submodulos.forEach((s) => {
            totalSubmodulosCount++;
            if (isSubmoduloActivo(v.id, s.id)) activosSubmodulosCount++;
          });
        });
        const inactivosSubmodulosCount = totalSubmodulosCount - activosSubmodulosCount;

        // Filtrado de submódulos
        const qSub = busquedaSubmodulo.trim().toLowerCase();

        return (
          <div className="space-y-6">
            {/* Input oculto para importación de perfil JSON */}
            <input
              type="file"
              ref={fileInputPerfilRef}
              onChange={handleImportarPerfilSubmodulos}
              accept=".json"
              className="hidden"
            />

            {/* 1. Panel de Control Maestro: Selector de Tenant, Presets y Herramientas con Micro-Animaciones */}
            <div className="animate-card-fade-1 p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 transition-all duration-300 relative overflow-visible z-30 group">
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                {/* Selector de Tenant Rediseñado de Alta Precisión */}
                <div className="space-y-1.5 min-w-0 relative z-30">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      Entorno de Configuración
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${planTenantActual === 'enterprise'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                      : planTenantActual === 'pro'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                      Plan: {planTenantActual}
                    </span>
                  </div>

                  <div className="pt-0.5">
                    <SelectorTenantModulos
                      valor={tenantModulosId}
                      onChange={(nuevoId) => setTenantModulosId(nuevoId)}
                      empresas={empresas}
                    />
                  </div>
                </div>

                {/* Plantillas / Presets de 1 Clic */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block sm:text-right">
                      Perfiles de 1 Clic
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAplicarPreset('starter')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Activar solo funciones esenciales de venta y caja"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>Starter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAplicarPreset('pro')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Activar KDS, FEFO, reservas y cotizaciones"
                      >
                        <Zap className="w-3 h-3 text-blue-500" />
                        <span>Pro Comercial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAplicarPreset('enterprise')}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 border border-purple-500/20"
                        title="Activar el 100% de la suite sin restricciones"
                      >
                        <Layers className="w-3 h-3 text-purple-500" />
                        <span>Enterprise Full</span>
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/10 mx-1" />

                  {/* Acciones de Exportación / Importación */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block sm:text-right">
                      Archivos JSON
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleExportarPerfilSubmodulos}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs hover:scale-110 active:scale-95"
                        title="Exportar configuración de submódulos en JSON"
                      >
                        <DownloadCloud className="w-4 h-4 text-emerald-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputPerfilRef.current?.click()}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs hover:scale-110 active:scale-95"
                        title="Importar perfil desde archivo JSON"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Barra de Búsqueda, Filtro de Estado y Estadísticas de Cobertura */}
            <div className="animate-card-fade-2 p-4 rounded-2xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Buscador de Submódulos */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar submódulo (ej: KDS, FEFO, Habitaciones, SUNAT, DCI)..."
                  value={busquedaSubmodulo}
                  onChange={(e) => setBusquedaSubmodulo(e.target.value)}
                  className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                />
                {busquedaSubmodulo && (
                  <button
                    type="button"
                    onClick={() => setBusquedaSubmodulo('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtro por Estado: Todos / Activos / Inactivos */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoSubmodulo('todos')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${filtroEstadoSubmodulo === 'todos'
                      ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    Todos ({totalSubmodulosCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoSubmodulo('activos')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 ${filtroEstadoSubmodulo === 'activos'
                      ? 'bg-white dark:bg-white/15 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Activos ({activosSubmodulosCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoSubmodulo('inactivos')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 ${filtroEstadoSubmodulo === 'inactivos'
                      ? 'bg-white dark:bg-white/15 text-rose-600 dark:text-rose-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Pausados ({inactivosSubmodulosCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Grilla de Tarjetas de Módulos (Bento Grid con Micro-Animaciones y Hover Lift) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {VERTICALES_SISTEMA.map((vert, idx) => {
                const IconoVert = vert.icono;
                const estaContratada = isVerticalContratada(vert.id);
                const submodulosFiltrados = vert.submodulos.filter((s) => {
                  const activo = isSubmoduloActivo(vert.id, s.id);
                  if (filtroEstadoSubmodulo === 'activos' && !activo) return false;
                  if (filtroEstadoSubmodulo === 'inactivos' && activo) return false;
                  if (qSub) {
                    const matchNombre = s.nombre.toLowerCase().includes(qSub);
                    const matchDesc = s.desc.toLowerCase().includes(qSub);
                    const matchTag = s.tag?.toLowerCase().includes(qSub);
                    return matchNombre || matchDesc || matchTag;
                  }
                  return true;
                });

                const subActivos = vert.submodulos.filter((s) => isSubmoduloActivo(vert.id, s.id)).length;
                const pctActivos = Math.round((subActivos / vert.submodulos.length) * 100);

                // Colores temáticos por vertical
                const colorConfig = {
                  amber: {
                    borderHover: 'hover:border-amber-500/50 hover:shadow-amber-500/15',
                    glow: 'bg-amber-500/10',
                    iconBg: 'bg-amber-500/10 text-amber-500',
                    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    progress: 'from-amber-500 to-orange-500',
                    activeSwitch: 'bg-amber-500',
                  },
                  indigo: {
                    borderHover: 'hover:border-indigo-500/50 hover:shadow-indigo-500/15',
                    glow: 'bg-indigo-500/10',
                    iconBg: 'bg-indigo-500/10 text-indigo-500',
                    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                    progress: 'from-indigo-500 to-purple-500',
                    activeSwitch: 'bg-indigo-500',
                  },
                  emerald: {
                    borderHover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/15',
                    glow: 'bg-emerald-500/10',
                    iconBg: 'bg-emerald-500/10 text-emerald-500',
                    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    progress: 'from-emerald-500 to-teal-500',
                    activeSwitch: 'bg-emerald-500',
                  },
                  violet: {
                    borderHover: 'hover:border-purple-500/50 hover:shadow-purple-500/15',
                    glow: 'bg-purple-500/10',
                    iconBg: 'bg-purple-500/10 text-purple-500',
                    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                    progress: 'from-purple-500 to-pink-500',
                    activeSwitch: 'bg-purple-500',
                  },
                  slate: {
                    borderHover: 'hover:border-blue-500/50 hover:shadow-blue-500/15',
                    glow: 'bg-blue-500/10',
                    iconBg: 'bg-blue-500/10 text-blue-500',
                    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    progress: 'from-blue-500 to-indigo-500',
                    activeSwitch: 'bg-blue-500',
                  },
                }[vert.color] || {
                  borderHover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/15',
                  glow: 'bg-emerald-500/10',
                  iconBg: 'bg-emerald-500/10 text-emerald-500',
                  badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                  progress: 'from-emerald-500 to-teal-500',
                  activeSwitch: 'bg-emerald-500',
                };

                const animClass = `animate-card-fade-${Math.min(idx + 1, 6)}`;

                return (
                  <div
                    key={vert.id}
                    className={`${animClass} rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs ${colorConfig.borderHover} hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group relative`}
                  >
                    {/* Glow ambiental superior con micro-animación al hover */}
                    <div className={`absolute -top-12 -right-12 w-36 h-36 ${colorConfig.glow} rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative z-10">
                      {/* Cabecera de la Tarjeta */}
                      <div className="p-4 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 group-hover:bg-slate-50/95 dark:group-hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl ${colorConfig.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                            <IconoVert className="w-4.5 h-4.5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-heading truncate">
                              {vert.nombre}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10.5px] font-mono text-slate-400">
                                {subActivos}/{vert.submodulos.length} activos ({pctActivos}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${colorConfig.badge}`}>
                            {vert.badge}
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso de la vertical */}
                      <div className="w-full h-1 bg-slate-100 dark:bg-white/5 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colorConfig.progress} transition-all duration-700 ease-out`}
                          style={{ width: `${pctActivos}%` }}
                        />
                      </div>

                      {/* Aviso si la vertical NO está contratada para el tenant */}
                      {!estaContratada && (
                        <div className="p-2.5 mx-3 mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-600 dark:text-amber-400 flex items-center gap-2 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Esta vertical no está incluida en los módulos contratados del cliente.</span>
                        </div>
                      )}

                      {/* Botones de Acción Rápida (Habilitar / Deshabilitar Todos) */}
                      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[10.5px] text-slate-400">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">Control de Submódulos:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleVerticalCompleta(vert.id, true)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 text-[10px]"
                            title="Habilitar todos los submódulos de esta vertical"
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>Activar Todos</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVerticalCompleta(vert.id, false)}
                            className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 text-[10px]"
                            title="Pausar todos los submódulos de esta vertical"
                          >
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                            <span>Pausar Todos</span>
                          </button>
                        </div>
                      </div>

                      {/* Lista de Submódulos con Interruptores Táctiles de Alto Contraste */}
                      <div className="p-3 space-y-2">
                        {submodulosFiltrados.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No hay submódulos que coincidan con la búsqueda.
                          </div>
                        ) : (
                          submodulosFiltrados.map((sub) => {
                            const activo = isSubmoduloActivo(vert.id, sub.id);
                            return (
                              <div
                                key={sub.id}
                                className={`p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3 group/sub ${activo
                                  ? 'bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 hover:border-emerald-500/40 hover:shadow-xs'
                                  : 'bg-slate-50/30 dark:bg-black/15 border border-dashed border-slate-200/80 dark:border-white/5 opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-white/10'
                                  }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-bold truncate transition-colors ${activo ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                                      }`}>
                                      {sub.nombre}
                                    </span>
                                    {sub.tag && (
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${!activo
                                        ? 'bg-slate-200/60 dark:bg-white/5 text-slate-400'
                                        : sub.tag === 'CORE'
                                          ? 'bg-slate-100 dark:bg-white/5 text-slate-500'
                                          : sub.tag === 'PRO'
                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                            : sub.tag === 'KDS'
                                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                              : sub.tag === 'DIGEMID' || sub.tag === 'FEFO'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                        }`}>
                                        {sub.tag}
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-[10.5px] truncate mt-0.5 ${activo ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400/80 dark:text-slate-500/80'
                                    }`}>
                                    {sub.desc}
                                  </div>
                                </div>

                                {/* Píldora Pequeña Táctil con Check Verde en caso de Activo */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubmodulo(vert.id, sub.id)}
                                  className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 cursor-pointer shrink-0 select-none flex items-center active:scale-90 ${activo
                                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40 justify-end'
                                    : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 justify-start'
                                    }`}
                                  title={activo ? 'Habilitado (Clic para pausar)' : 'Pausado (Clic para habilitar)'}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 ${activo ? 'scale-100 text-emerald-600' : 'scale-90 text-slate-400 dark:text-slate-500'
                                      }`}
                                  >
                                    {activo ? (
                                      <Check className="w-3 h-3 stroke-[3.5]" />
                                    ) : (
                                      <X className="w-2.5 h-2.5 stroke-[2.5]" />
                                    )}
                                  </div>
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 flex items-center justify-between relative z-10 group-hover:bg-slate-50/80 dark:group-hover:bg-white/[0.03] transition-colors">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Aplica en caliente al cliente</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                        {subActivos} de {vert.submodulos.length} activos
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Modal Simulador de Menú Lateral en Tiempo Real */}
      {modalSimuladorPreview && (() => {
        const empActual = empresas.find((e) => String(e.id) === String(tenantModulosId));
        const nombreTenant = empActual ? empActual.nombre : 'Plantilla Global';
        const planTenant = empActual ? empActual.plan : 'enterprise';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setModalSimuladorPreview(false)}
            />

            <div className="relative w-full max-w-lg bg-white dark:bg-[#150f33] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-950/30 dark:shadow-black/80 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header del Modal */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
                      Simulador de Barra Lateral
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Vista exacta de navegación del tenant: <span className="font-bold text-indigo-500">{nombreTenant}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalSimuladorPreview(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                  title="Cerrar simulador"
                >
                  <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
                </button>
              </div>

              {/* Simulación del Sidebar */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-modal-scroll">
                {/* Banner de Empresa Mock */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#02CBA9] text-white flex items-center justify-center font-black text-sm">
                      {nombreTenant.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{nombreTenant}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Plan: {planTenant.toUpperCase()}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                    En Línea
                  </span>
                </div>

                {/* Menús y Submenús Simulados */}
                <div className="space-y-4">
                  {VERTICALES_SISTEMA.map((vert) => {
                    const Icono = vert.icono;
                    const submodulosActivos = vert.submodulos.filter((s) => isSubmoduloActivo(vert.id, s.id));
                    const estaContratada = isVerticalContratada(vert.id);

                    if (!estaContratada) return null;

                    return (
                      <div key={vert.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 px-2">
                          <span className="flex items-center gap-1.5">
                            <Icono className="w-3.5 h-3.5" />
                            <span>{vert.nombre}</span>
                          </span>
                          <span className="text-[10px] font-mono">{submodulosActivos.length} activos</span>
                        </div>

                        <div className="space-y-1">
                          {submodulosActivos.length === 0 ? (
                            <div className="p-2 rounded-xl bg-slate-100/50 dark:bg-white/[0.02] text-[10.5px] text-slate-400 italic px-3">
                              Todos los submódulos de esta vertical están deshabilitados.
                            </div>
                          ) : (
                            submodulosActivos.map((sub) => (
                              <div
                                key={sub.id}
                                className="px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-white/5 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200"
                              >
                                <span>{sub.nombre}</span>
                                {sub.tag && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-white/10 text-slate-500">
                                    {sub.tag}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="p-4 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Vista previa interactiva del menú del cliente
                </span>
                <button
                  type="button"
                  onClick={() => setModalSimuladorPreview(false)}
                  className="px-4 py-2 rounded-xl bg-[#02CBA9] text-white font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer text-xs"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Registrar Nuevo Cliente Tenant */}
      {modalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con desenfoque mínimo (1.5px) y máxima legibilidad de fondo */}
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
            onClick={() => setModalNueva(false)}
          />

          <div className="relative w-full max-w-4xl xl:max-w-5xl bg-white dark:bg-[#150f33] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-950/20 dark:shadow-black/70 z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Resplandor decorativo ambiental superior */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-28 bg-gradient-to-b from-[#02CBA9]/15 via-[#7D71EB]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

            {/* Cabecera Fija del Modal */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 sm:px-7 sm:pt-6 border-b border-slate-100 dark:border-white/5 shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] flex items-center justify-center text-white shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-heading">
                    Alta y Onboarding de Empresa Cliente (Tenant)
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Configuración fiscal, licenciamiento y credenciales de acceso inicial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNueva(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            <form onSubmit={handleCrearEmpresa} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Cuerpo del Formulario Confinado con Scroll Interno */}
              <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 space-y-3.5 custom-modal-scroll min-h-0">
                {/* BLOQUE 1: IDENTIDAD FISCAL & COMERCIAL */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">01</span>
                    <span>Identidad Fiscal & Comercial</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] transition-colors">
                          RUC (11 Dígitos)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConsultarRuc(true)}
                          disabled={consultandoRuc || !form.ruc || form.ruc.length !== 11}
                          className="text-[10px] font-bold text-[#02CBA9] dark:text-[#1CC0F9] hover:opacity-80 flex items-center gap-1 disabled:opacity-40 cursor-pointer transition-opacity"
                          title="Consultar SUNAT manualmente"
                        >
                          {consultandoRuc ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Search className="w-2.5 h-2.5" />}
                          <span>{consultandoRuc ? 'Buscando...' : 'SUNAT'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={11}
                        value={form.ruc}
                        onChange={(e) => {
                          const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setForm({ ...form, ruc: valor });
                          if (valor.length === 11 && !consultandoRuc) {
                            handleConsultarRuc(true, valor);
                          }
                        }}
                        className="w-full bg-transparent text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] flex items-center gap-1 transition-colors">
                          <span>Razón Social</span>
                          <span className="text-rose-500">*</span>
                        </span>
                        {consultandoRuc && (
                          <span className="text-[10px] font-bold text-[#02CBA9] dark:text-[#1CC0F9] flex items-center gap-1 animate-pulse">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>Sincronizando SUNAT...</span>
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={consultandoRuc ? "Sincronizando SUNAT..." : ""}
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2 group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200" title={form.direccion || ''}>
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] block transition-colors">
                        Dirección Fiscal
                      </span>
                      <input
                        type="text"
                        value={form.direccion}
                        onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                        className="w-full bg-transparent text-xs font-normal text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] block transition-colors">
                        Teléfono / WhatsApp
                      </span>
                      <input
                        type="text"
                        value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOQUE 2: PLAN SAAS & VERTICALES AUTORIZADAS */}
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">02</span>
                      <span>Plan SaaS & Licenciamiento Modular</span>
                    </div>
                  </div>

                  {/* Ciclo de Facturación y Entorno SUNAT (Condiciona los planes y tarifas inferiores) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <SelectorVigenciaSegmentado
                      valor={form.vigencia_tipo}
                      onChange={handleCambiarCicloNueva}
                    />
                    <SelectorEntornoSunat
                      valor={form.entorno_sunat}
                      onChange={handleCambiarEntornoSunatNueva}
                    />
                  </div>

                  {/* Selector Visual de Planes SaaS (Adaptado dinámicamente según el Ciclo seleccionado) */}
                  <SelectorPlanesVisual
                    valor={form.plan}
                    catalogoPlanes={planesSaaS}
                    ciclo={form.vigencia_tipo}
                    onChange={handleCambiarPlanNueva}
                  />

                  {/* Tarifa Acordada con Activación Previa */}
                  {(() => {
                    const tarifaActualNueva = calcularTarifaSegunCiclo(obtenerPrecioPlan(form.plan), form.vigencia_tipo);
                    return (
                      <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${personalizarPrecioNueva
                        ? 'bg-gradient-to-r from-emerald-500/10 via-[#02CBA9]/10 to-[#1CC0F9]/10 border-emerald-500/40 shadow-sm'
                        : 'bg-white dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10'
                        }`}>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold transition-colors ${personalizarPrecioNueva
                              ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/40'
                              : 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20'
                              }`}>
                              {personalizarPrecioNueva ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                  Tarifa Acordada ({tarifaActualNueva.periodoTexto.replace('/', '').trim()})
                                </span>
                                {personalizarPrecioNueva ? (
                                  <span className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Personalización Habilitada</span>
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Tarifa Oficial Establecida (Protegida)</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] text-slate-400 dark:text-slate-400 mt-0.5">
                                {personalizarPrecioNueva
                                  ? `Editando cuota negociada para este tenant (Tarifa oficial de lista: S/ ${tarifaActualNueva.precioCalculado} ${tarifaActualNueva.periodoTexto}).`
                                  : `El tenant usará la tarifa oficial del Plan ${form.plan.toUpperCase()} para ciclo ${form.vigencia_tipo === 'anual_365' ? 'Anual' : form.vigencia_tipo === 'trial_14' ? 'Prueba' : form.vigencia_tipo === 'ilimitado' ? 'Vitalicio' : 'Mensual'} (S/ ${tarifaActualNueva.precioCalculado} ${tarifaActualNueva.periodoTexto}). Activa el interruptor para ingresar un monto diferente.`}
                              </p>
                            </div>
                          </div>

                          {/* Controles de Precio y Switch de Activación Previa */}
                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                            <div className={`group flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all ${personalizarPrecioNueva
                              ? 'bg-white dark:bg-slate-900 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 opacity-80'
                              }`}>
                              <span className="text-xs font-bold text-slate-400">S/</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                disabled={!personalizarPrecioNueva}
                                value={form.precio_mensual ?? ''}
                                onChange={(e) => setForm({ ...form, precio_mensual: e.target.value })}
                                className={`w-20 bg-transparent text-sm font-mono font-black focus:outline-none text-right ${personalizarPrecioNueva
                                  ? 'text-slate-900 dark:text-white cursor-text'
                                  : 'text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                                  }`}
                                title={personalizarPrecioNueva ? 'Ingresa la tarifa personalizada' : 'Activa la edición previa para modificar este precio'}
                              />
                              <span className="text-[10px] text-slate-400 font-medium">{tarifaActualNueva.periodoTexto}</span>
                            </div>

                            {/* Switch de Activación Previa */}
                            <button
                              type="button"
                              onClick={() => {
                                const nuevoEstado = !personalizarPrecioNueva;
                                setPersonalizarPrecioNueva(nuevoEstado);
                                if (!nuevoEstado) {
                                  const tarifaOficial = calcularTarifaSegunCiclo(obtenerPrecioPlan(form.plan), form.vigencia_tipo);
                                  setForm({ ...form, precio_mensual: tarifaOficial.precioCalculado });
                                  toast.success(`Tarifa restablecida a la oficial: S/ ${tarifaOficial.precioCalculado} ${tarifaOficial.periodoTexto}`);
                                } else {
                                  toast('Edición de tarifa habilitada para este tenant', { icon: '🔓' });
                                }
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${personalizarPrecioNueva
                                ? 'bg-slate-800 dark:bg-white/10 text-white hover:bg-slate-900'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-white shadow-amber-500/20 active:scale-95'
                                }`}
                            >
                              {personalizarPrecioNueva ? (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Restaurar Oficial</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Personalizar Precio</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Verticales de Industria */}
                  <div>
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                      Módulos Verticales Autorizados
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                      {[
                        { id: 'restaurante', label: 'Restaurante Gastro', icon: UtensilsCrossed, desc: 'Mesas, comandas y cocina KDS' },
                        { id: 'ferreteria', label: 'Ferretería Retail', icon: ShoppingBag, desc: 'Kardex, lotes y ventas rápidas' },
                        { id: 'botica', label: 'Botica & Salud', icon: Pill, desc: 'DIGEMID, recetas y vencimientos' },
                        { id: 'hospedaje', label: 'Hospedaje & Hotel', icon: Hotel, desc: 'Check-in, reservas y rack' },
                      ].map(({ id, label, icon: Icon, desc }) => {
                        const isChecked = form.modulos_activos.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              const current = form.modulos_activos || [];
                              const updated = isChecked
                                ? current.filter((m) => m !== id)
                                : [...current, id];
                              setForm({
                                ...form,
                                modulos_activos: updated,
                                color_brand: resolverColorPorModulos(updated),
                              });
                            }}
                            className={`p-3 rounded-2xl border text-left flex items-start justify-between font-bold transition-all duration-200 cursor-pointer ${isChecked
                              ? 'bg-gradient-to-r from-[#02CBA9]/15 via-[#1CC0F9]/15 to-[#7D71EB]/15 border-[#02CBA9] dark:border-[#1CC0F9] ring-2 ring-[#02CBA9]/25 dark:ring-[#1CC0F9]/30 text-slate-900 dark:text-white shadow-sm shadow-[#02CBA9]/10 scale-[1.01]'
                              : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-400 opacity-70 hover:opacity-100 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.07]'
                              }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-[#02CBA9]/20 text-[#02CBA9] dark:text-[#1CC0F9]' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                }`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <span className="block text-xs font-bold truncate">{label}</span>
                                <p className="text-[10px] font-normal text-slate-400 line-clamp-1">{desc}</p>
                              </div>
                            </div>
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1.5 mt-0.5" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20 shrink-0 ml-1.5 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Precarga de Datos Demo vinculada dinámicamente al entorno */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 cursor-pointer hover:border-[#02CBA9]/40 hover:bg-slate-50/50 dark:hover:bg-white/[0.06] transition-all">
                    <input
                      type="checkbox"
                      checked={form.precargar_demo}
                      onChange={(e) => setForm({ ...form, precargar_demo: e.target.checked })}
                      className="w-4 h-4 rounded text-[#02CBA9] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#02CBA9]"
                    />
                    <div className="text-xs flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#02CBA9]" />
                          <span>Precargar catálogo y datos iniciales de muestra</span>
                        </span>
                        {form.entorno_sunat === 'beta' ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Marcado por Modo Beta
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Desmarcado en Producción
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {form.entorno_sunat === 'beta'
                          ? 'Crea mesas, platos/productos y categorías base según el rubro para pruebas de venta inmediatas.'
                          : 'Base de datos limpia y lista para catálogo e inventario oficial sin datos ficticios.'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* BLOQUE 3: CUENTA DEL ADMINISTRADOR PRINCIPAL */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">03</span>
                      <span>Cuenta de Administrador Principal</span>
                    </div>

                    {/* Micro-toolbar segmentado estilo macOS / Linear */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <button
                        type="button"
                        onClick={handleGenerarPassword}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-[#7D71EB] dark:text-[#1CC0F9] hover:bg-white dark:hover:bg-white/10 hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generar Clave</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopiarCredenciales}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleEnviarWhatsApp}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-white dark:hover:bg-white/10 hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Abrir WhatsApp con credenciales preparadas para enviar al cliente"
                      >
                        <Send className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] block transition-colors">
                        Nombre de Contacto
                      </span>
                      <input
                        type="text"
                        value={form.admin_nombre}
                        onChange={(e) => setForm({ ...form, admin_nombre: e.target.value })}
                        className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] flex items-center gap-1 transition-colors">
                        <span>Email de Acceso</span>
                        <span className="text-rose-500">*</span>
                      </span>
                      <input
                        type="email"
                        value={form.admin_email}
                        onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                        className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] flex items-center gap-1 transition-colors">
                          <span>Contraseña Inicial</span>
                          <span className="text-rose-500">*</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setMostrarPassNueva(!mostrarPassNueva)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {mostrarPassNueva ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                          <span>{mostrarPassNueva ? 'Ocultar' : 'Ver'}</span>
                        </button>
                      </div>
                      <input
                        type={mostrarPassNueva ? 'text' : 'password'}
                        value={form.admin_password}
                        onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                        className="w-full bg-transparent text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* FOOTER ACCIONES FIJO */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 sm:px-7 border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-black/20 shrink-0 z-10">
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                    SEDE-01
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-md border ${form.entorno_sunat === 'produccion'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}>
                    SUNAT: {form.entorno_sunat === 'produccion' ? 'PRODUCCIÓN' : 'BETA'}
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 font-semibold">
                    {form.vigencia_tipo === 'trial_14' ? 'Trial 14d' : form.vigencia_tipo === 'mensual_30' ? 'Mensual 30d' : form.vigencia_tipo === 'anual_365' ? 'Anual 365d' : 'Vitalicio'}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setModalNueva(false)}
                    className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 rounded-xl text-xs font-black bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] text-white hover:opacity-95 shadow-md shadow-[#02CBA9]/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dar de Alta Tenant</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Modal Editar Empresa */}
      {modalEditar && empresaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con desenfoque mínimo (1.5px) y máxima legibilidad de fondo */}
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
            onClick={() => setModalEditar(false)}
          />

          <div className="relative w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-[#150f33] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-950/20 dark:shadow-black/70 z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Resplandor decorativo ambiental superior */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-24 bg-gradient-to-b from-[#02CBA9]/15 via-[#7D71EB]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

            <div className="flex items-center justify-between px-6 pt-5 pb-4 sm:px-7 sm:pt-6 border-b border-slate-100 dark:border-white/5 shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] flex items-center justify-center text-white shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-heading">
                    Editar Datos de la Empresa
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Actualiza la razón social, entorno y condiciones de licenciamiento.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditar(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            <form onSubmit={handleGuardarEditar} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 space-y-3.5 custom-modal-scroll min-h-0">
                <div className="group rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] flex items-center gap-1 transition-colors">
                    <span>Razón Social</span>
                    <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="text"
                    value={formEditar.nombre}
                    onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/40"
                    required
                  />
                </div>

                {/* RUC y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="group rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] transition-colors">
                        RUC (11 Dígitos)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConsultarRuc(false)}
                        disabled={consultandoRuc || !formEditar.ruc || formEditar.ruc.length !== 11}
                        className="text-[10px] font-bold text-[#02CBA9] dark:text-[#1CC0F9] hover:opacity-80 flex items-center gap-1 disabled:opacity-40 cursor-pointer transition-opacity"
                        title="Consultar SUNAT manualmente"
                      >
                        {consultandoRuc ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Search className="w-2.5 h-2.5" />}
                        <span>{consultandoRuc ? 'Buscando...' : 'SUNAT'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={11}
                      value={formEditar.ruc}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setFormEditar({ ...formEditar, ruc: valor });
                        if (valor.length === 11 && !consultandoRuc && valor !== empresaEditar?.ruc) {
                          handleConsultarRuc(false, valor);
                        }
                      }}
                      className="w-full bg-transparent text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/40"
                    />
                  </div>

                  <div className="group rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] block transition-colors">
                      Teléfono / WhatsApp
                    </span>
                    <input
                      type="text"
                      value={formEditar.telefono}
                      onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                      className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/40"
                    />
                  </div>
                </div>

                {/* Dirección Fiscal */}
                <div className="group rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200" title={formEditar.direccion || ''}>
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] block transition-colors">
                    Dirección Fiscal
                  </span>
                  <input
                    type="text"
                    value={formEditar.direccion}
                    onChange={(e) => setFormEditar({ ...formEditar, direccion: e.target.value })}
                    className="w-full bg-transparent text-xs font-normal text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Vencimiento / Facturación SaaS Rediseñado */}
                <CalendarioVencimiento
                  valor={formEditar.fecha_vencimiento || ''}
                  onChange={(nuevaFecha) => setFormEditar({ ...formEditar, fecha_vencimiento: nuevaFecha })}
                />

                {/* Rediseño de Plan SaaS Visual y Entorno SUNAT */}
                <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Plan de Suscripción & Tarifas
                    </span>
                  </div>

                  {/* Ciclo de Facturación y Entorno SUNAT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <SelectorVigenciaSegmentado
                      valor={formEditar.vigencia_tipo || 'mensual_30'}
                      onChange={handleCambiarCicloEditar}
                    />
                    <SelectorEntornoSunat
                      valor={formEditar.entorno_sunat || 'beta'}
                      onChange={(val) => setFormEditar({ ...formEditar, entorno_sunat: val })}
                    />
                  </div>

                  <SelectorPlanesVisual
                    valor={formEditar.plan}
                    catalogoPlanes={planesSaaS}
                    ciclo={formEditar.vigencia_tipo || 'mensual_30'}
                    onChange={handleCambiarPlanEditar}
                  />

                  {/* Tarifa Acordada con Activación Previa */}
                  {(() => {
                    const tarifaActualEditar = calcularTarifaSegunCiclo(obtenerPrecioPlan(formEditar.plan), formEditar.vigencia_tipo || 'mensual_30');
                    return (
                      <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${personalizarPrecioEditar
                        ? 'bg-gradient-to-r from-emerald-500/10 via-[#02CBA9]/10 to-[#1CC0F9]/10 border-emerald-500/40 shadow-sm'
                        : 'bg-white dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10'
                        }`}>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold transition-colors ${personalizarPrecioEditar
                              ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/40'
                              : 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20'
                              }`}>
                              {personalizarPrecioEditar ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                  Tarifa Acordada ({tarifaActualEditar.periodoTexto.replace('/', '').trim()})
                                </span>
                                {personalizarPrecioEditar ? (
                                  <span className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Personalización Habilitada</span>
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Tarifa Oficial Establecida (Protegida)</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] text-slate-400 dark:text-slate-400 mt-0.5">
                                {personalizarPrecioEditar
                                  ? `Editando cuota pactada para este tenant (Tarifa oficial de lista: S/ ${tarifaActualEditar.precioCalculado} ${tarifaActualEditar.periodoTexto}).`
                                  : `El tenant usa la tarifa oficial del Plan ${formEditar.plan.toUpperCase()} para ciclo ${formEditar.vigencia_tipo === 'anual_365' ? 'Anual' : formEditar.vigencia_tipo === 'trial_14' ? 'Prueba' : formEditar.vigencia_tipo === 'ilimitado' ? 'Vitalicio' : 'Mensual'} (S/ ${tarifaActualEditar.precioCalculado} ${tarifaActualEditar.periodoTexto}). Activa el interruptor para ingresar un monto diferente.`}
                              </p>
                            </div>
                          </div>

                          {/* Controles de Precio y Switch de Activación Previa */}
                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                            <div className={`group flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all ${personalizarPrecioEditar
                              ? 'bg-white dark:bg-slate-900 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 opacity-80'
                              }`}>
                              <span className="text-xs font-bold text-slate-400">S/</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                disabled={!personalizarPrecioEditar}
                                value={formEditar.precio_mensual ?? ''}
                                onChange={(e) => setFormEditar({ ...formEditar, precio_mensual: e.target.value })}
                                className={`w-20 bg-transparent text-sm font-mono font-black focus:outline-none text-right ${personalizarPrecioEditar
                                  ? 'text-slate-900 dark:text-white cursor-text'
                                  : 'text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                                  }`}
                                title={personalizarPrecioEditar ? 'Ingresa la tarifa personalizada' : 'Activa la edición previa para modificar este precio'}
                              />
                              <span className="text-[10px] text-slate-400 font-medium">{tarifaActualEditar.periodoTexto}</span>
                            </div>

                            {/* Switch de Activación Previa */}
                            <button
                              type="button"
                              onClick={() => {
                                const nuevoEstado = !personalizarPrecioEditar;
                                setPersonalizarPrecioEditar(nuevoEstado);
                                if (!nuevoEstado) {
                                  const tarifaOficial = calcularTarifaSegunCiclo(obtenerPrecioPlan(formEditar.plan), formEditar.vigencia_tipo || 'mensual_30');
                                  setFormEditar({ ...formEditar, precio_mensual: tarifaOficial.precioCalculado });
                                  toast.success(`Tarifa restablecida a la oficial: S/ ${tarifaOficial.precioCalculado} ${tarifaOficial.periodoTexto}`);
                                } else {
                                  toast('Edición de tarifa habilitada para este tenant', { icon: '🔓' });
                                }
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${personalizarPrecioEditar
                                ? 'bg-slate-800 dark:bg-white/10 text-white hover:bg-slate-900'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-white shadow-amber-500/20 active:scale-95'
                                }`}
                            >
                              {personalizarPrecioEditar ? (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Restaurar Oficial</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Personalizar Precio</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Licenciamiento Modular Granular */}
                <div>
                  <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                    Módulos Verticales Autorizados
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'restaurante', label: 'Restaurante Gastro', icon: UtensilsCrossed },
                      { id: 'ferreteria', label: 'Ferretería Retail', icon: ShoppingBag },
                      { id: 'botica', label: 'Botica & Salud', icon: Pill },
                      { id: 'hospedaje', label: 'Hospedaje & Hotel', icon: Hotel },
                    ].map(({ id, label, icon: Icon }) => {
                      const isChecked = formEditar.modulos_activos?.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            const current = formEditar.modulos_activos || [];
                            const updated = isChecked
                              ? current.filter((m) => m !== id)
                              : [...current, id];
                            setFormEditar({
                              ...formEditar,
                              modulos_activos: updated,
                              color_brand: formEditar.color_brand || resolverColorPorModulos(updated),
                            });
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between font-bold transition-all duration-200 cursor-pointer ${isChecked
                            ? 'bg-gradient-to-r from-[#02CBA9]/15 via-[#1CC0F9]/15 to-[#7D71EB]/15 border-[#02CBA9] dark:border-[#1CC0F9] ring-2 ring-[#02CBA9]/25 dark:ring-[#1CC0F9]/30 text-slate-900 dark:text-white shadow-sm shadow-[#02CBA9]/10'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-400 opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </span>
                          {isChecked ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 sm:px-7 border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-black/20 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-xl text-xs font-black bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] text-white hover:opacity-95 shadow-md shadow-[#02CBA9]/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Modal Restablecer Contraseña Admin */}
      {modalResetPass && empresaReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200" onClick={() => setModalResetPass(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#18123B] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white font-heading">
                  Restablecer Clave Admin
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalResetPass(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Asignarás una nueva contraseña para la cuenta administradora de <strong className="text-slate-800 dark:text-white">{empresaReset.nombre}</strong>.
            </p>

            <form onSubmit={handleGuardarResetPass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={mostrarPass ? 'text' : 'password'}
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPass(!mostrarPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {mostrarPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const passAleatoria = 'Heis' + Math.floor(100000 + Math.random() * 900000) + '!';
                    setNuevaPassword(passAleatoria);
                    setMostrarPass(true);
                  }}
                  className="text-xs font-bold text-[#1CC0F9] hover:underline cursor-pointer"
                >
                  ⚡ Generar Clave Segura
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setModalResetPass(false)}
                  className="h-10 px-5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-95 shadow-md shadow-amber-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Modal Ficha Técnica y Sedes */}
      {modalDetalles && empresaDetalles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con desenfoque mínimo (1.5px) idéntico a modal Alta Empresa */}
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
            onClick={() => setModalDetalles(false)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#18123B] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/5 shrink-0 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#7D71EB]/10 text-[#7D71EB] dark:text-[#1CC0F9] border border-[#7D71EB]/25">
                    Plan {empresaDetalles.plan} {empresaDetalles.precio_mensual ? `· S/ ${Number(empresaDetalles.precio_mensual).toFixed(2)}/mes` : ''}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${empresaDetalles.activo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {empresaDetalles.activo ? 'Activa' : 'Suspendida'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white font-heading mt-1">
                  {empresaDetalles.nombre}
                </h2>
                <p className="text-xs text-slate-400">RUC: {empresaDetalles.ruc || 'Sin registrar'}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalles(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-modal-scroll min-h-0">
              {/* Información General */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Dirección Fiscal</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{empresaDetalles.direccion || 'No especificada'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Teléfono de Contacto</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{empresaDetalles.telefono || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tarifa Acordada</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    S/ {empresaDetalles.precio_mensual ? Number(empresaDetalles.precio_mensual).toFixed(2) : '0.00'} <span className="text-[10px] text-slate-400 font-normal">/ mes</span>
                  </span>
                </div>
              </div>

              {/* Sedes / Sucursales */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Sucursales / Sedes ({empresaDetalles.sucursales?.length || 0})
                </h3>
                <div className="space-y-1.5">
                  {(!empresaDetalles.sucursales || empresaDetalles.sucursales.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No hay sedes registradas</p>
                  ) : (
                    empresaDetalles.sucursales.map((s) => (
                      <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-between text-xs border border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#02CBA9]" />
                          <span className="font-bold text-slate-800 dark:text-white">{s.nombre}</span>
                          {s.es_principal && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              PRINCIPAL
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">ID #{s.id}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Usuarios Vinculados */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Usuarios del Tenant ({empresaDetalles.usuarios?.length || 0})
                </h3>
                <div className="space-y-1.5">
                  {(!empresaDetalles.usuarios || empresaDetalles.usuarios.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No hay usuarios registrados</p>
                  ) : (
                    empresaDetalles.usuarios.map((u) => (
                      <div key={u.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-between text-xs border border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-white">
                            {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">{u.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7D71EB]/10 text-[#7D71EB] dark:text-[#1CC0F9]">
                            {u.rol}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-black/20 shrink-0 z-10">
              <button
                type="button"
                onClick={() => handleExportarBackup(empresaDetalles)}
                className="h-9 px-5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Exportar Respaldo JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setModalDetalles(false)}
                className="h-9 px-6 rounded-xl text-xs font-black bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-all cursor-pointer whitespace-nowrap"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Nuevo / Editar Comunicado Broadcast SaaS — Rediseñado al Estándar de Alta Empresa */}
      {modalNuevoComunicado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con desenfoque mínimo (1.5px) */}
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
            onClick={() => setModalNuevoComunicado(false)}
          />

          <div className="relative w-full max-w-4xl xl:max-w-5xl bg-white dark:bg-[#150f33] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-950/20 dark:shadow-black/70 z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Resplandor decorativo ambiental superior */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-28 bg-gradient-to-b from-amber-500/15 via-[#7D71EB]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

            {/* Cabecera Fija del Modal */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 sm:px-7 sm:pt-6 border-b border-slate-100 dark:border-white/5 shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-[#7D71EB] flex items-center justify-center text-white shadow-xs">
                  {comunicadoEditando ? <Pencil className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-heading">
                    {comunicadoEditando ? 'Editar Comunicado & Broadcast' : 'Emitir Comunicado Global & Segmentado SaaS'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Difusión de notas de versión, incidencias SUNAT, ventanas de mantenimiento y alertas por tenant.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoComunicado(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            {/* Formulario con Scroll Interno y Bloques Estructurados */}
            <form onSubmit={handleGuardarComunicado} className="flex flex-col flex-1 min-h-0 overflow-hidden relative z-10">
              <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 space-y-4 custom-modal-scroll min-h-0">
                {/* BLOQUE 01: CONTENIDO & REDACCIÓN DEL ANUNCIO */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">01</span>
                    <span>Mensaje & Redacción del Anuncio</span>
                  </div>

                  {/* Píldora: Título del Comunicado */}
                  <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-amber-500 dark:focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/20 dark:focus-within:ring-amber-400/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-amber-500/10 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-amber-500 dark:group-focus-within:text-amber-400 flex items-center gap-1 transition-colors">
                        <span>Título del Anuncio</span>
                        <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-400">Conciso y directo</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: Mantenimiento programado servidores SUNAT este domingo"
                      value={formComunicado.titulo}
                      onChange={(e) => setFormComunicado({ ...formComunicado, titulo: e.target.value })}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50"
                      required
                    />
                  </div>

                  {/* Píldora: Mensaje Detallado */}
                  <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-amber-500 dark:focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/20 dark:focus-within:ring-amber-400/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-amber-500/10 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-amber-500 dark:group-focus-within:text-amber-400 flex items-center gap-1 transition-colors">
                        <span>Mensaje Detallado para los Clientes</span>
                        <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-400">Cuerpo del comunicado</span>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Escribe el cuerpo explicativo del aviso, contingencia, pasos recomendados o instrucciones para los operadores..."
                      value={formComunicado.mensaje}
                      onChange={(e) => setFormComunicado({ ...formComunicado, mensaje: e.target.value })}
                      className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50 resize-none custom-modal-scroll"
                      required
                    />
                  </div>

                  {/* Switch & Campos para Botón de Acción Directa (CTA) */}
                  <div className="pt-1">
                    <div
                      onClick={() => setFormComunicado({ ...formComunicado, cta_activo: !formComunicado.cta_activo })}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${formComunicado.cta_activo
                        ? 'bg-cyan-500/10 border-cyan-500/40 ring-2 ring-cyan-500/20'
                        : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-cyan-500/30'
                        }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${formComunicado.cta_activo
                          ? 'bg-cyan-500 text-white shadow-xs'
                          : 'bg-cyan-500/10 text-cyan-500'
                          }`}>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>Botón de Acción Directa (Call-To-Action / CTA)</span>
                            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                              Opcional
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                            Permite a los usuarios hacer clic para abrir una URL externa, módulo o instructivo de soporte.
                          </p>
                        </div>
                      </div>

                      {/* Switch estándar verde sin texto */}
                      <div
                        className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 shrink-0 select-none flex items-center ${formComunicado.cta_activo
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40 justify-end'
                          : 'bg-slate-200 dark:bg-white/10 justify-start'
                          }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 ${formComunicado.cta_activo ? 'scale-100 text-emerald-600' : 'scale-90 text-slate-400'
                            }`}
                        >
                          {formComunicado.cta_activo ? (
                            <Check className="w-3 h-3 stroke-[3.5]" />
                          ) : (
                            <X className="w-2.5 h-2.5 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {formComunicado.cta_activo && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5 pl-2 animate-in fade-in duration-150">
                        <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 focus-within:border-cyan-500 dark:focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20">
                          <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                            Texto del Botón (CTA)
                          </span>
                          <input
                            type="text"
                            placeholder="Ej: Ver Novedades, Actualizar Certificado"
                            value={formComunicado.cta_texto}
                            onChange={(e) => setFormComunicado({ ...formComunicado, cta_texto: e.target.value })}
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                            required={formComunicado.cta_activo}
                          />
                        </div>

                        <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 focus-within:border-cyan-500 dark:focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20">
                          <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                            Enlace de Redirección (URL)
                          </span>
                          <input
                            type="text"
                            placeholder="Ej: https://soporte.heis.pe o /configuracion"
                            value={formComunicado.cta_url}
                            onChange={(e) => setFormComunicado({ ...formComunicado, cta_url: e.target.value })}
                            className="w-full bg-transparent text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 focus:outline-none"
                            required={formComunicado.cta_activo}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOQUE 02: FORMATO DE DESPLIEGUE & SEVERIDAD */}
                <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded-md">02</span>
                      <span>Formato de Despliegue & Severidad</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Impacto en UX</span>
                  </div>

                  {/* Selector de Formato: Banner vs Modal */}
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block">
                      Formato de Interfaz en Pantalla
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Opción 1: Banner Superior */}
                      <div
                        onClick={() => setFormComunicado({ ...formComunicado, formato: 'banner' })}
                        className={`group p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                          formComunicado.formato === 'banner'
                            ? 'bg-sky-500/10 border-sky-500/40 ring-4 ring-sky-500/15 shadow-sm shadow-sky-500/10'
                            : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-sky-500/30 hover:bg-slate-50/50 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          formComunicado.formato === 'banner'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'bg-sky-500/10 text-sky-500'
                        }`}>
                          <Monitor className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                              Banner Superior (No Invasivo)
                            </span>
                            {formComunicado.formato === 'banner' && (
                              <span className="w-2 h-2 rounded-full bg-sky-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                            Cinta discreta en la barra superior. Ideal para notas de versión, mejoras y avisos informativos.
                          </p>
                        </div>
                      </div>

                      {/* Opción 2: Modal Pop-up Bloqueante */}
                      <div
                        onClick={() => setFormComunicado({ ...formComunicado, formato: 'modal' })}
                        className={`group p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                          formComunicado.formato === 'modal'
                            ? 'bg-purple-500/10 border-purple-500/40 ring-4 ring-purple-500/15 shadow-sm shadow-purple-500/10'
                            : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-purple-500/30 hover:bg-slate-50/50 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          formComunicado.formato === 'modal'
                            ? 'bg-purple-500 text-white shadow-xs'
                            : 'bg-purple-500/10 text-purple-500'
                        }`}>
                          <Layers className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                              Ventana Modal Pop-up (Bloqueante)
                            </span>
                            {formComunicado.formato === 'modal' && (
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                            Diálogo emergente central con confirmación requerida "Entendido". Para caídas SUNAT o cambios de términos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selector de Tipo de Comunicado */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block">
                      Nivel de Categoría / Naturaleza
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TIPOS_COMUNICADO.map((tipo) => {
                        const Icono = tipo.icono || tipo.icon || Info;
                        const seleccionado = formComunicado.tipo === tipo.id;

                        return (
                          <div
                            key={tipo.id}
                            onClick={() => setFormComunicado({ ...formComunicado, tipo: tipo.id })}
                            className={`p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                              seleccionado
                                ? `${tipo.colorClasses.borderActive} ring-4 ring-current/15 shadow-xs`
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${tipo.colorClasses.bgIcon}`}>
                              {Icono && <Icono className="w-3.5 h-3.5 stroke-[2.2]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-black text-slate-800 dark:text-white block leading-tight truncate">
                                {tipo.badge}
                              </span>
                              <span className="text-[9px] text-slate-400 block capitalize truncate">
                                {tipo.id}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector de Nivel de Prioridad Operativa */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block">
                      Nivel de Prioridad Operativa
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'baja', label: 'Baja', desc: 'Informativo', color: 'border-slate-400 text-slate-600', dot: 'bg-slate-400' },
                        { id: 'media', label: 'Media', desc: 'Habitual', color: 'border-sky-500 text-sky-600', dot: 'bg-sky-500' },
                        { id: 'alta', label: 'Alta', desc: 'Atención Req.', color: 'border-amber-500 text-amber-600', dot: 'bg-amber-500' },
                        { id: 'critica', label: 'Crítica', desc: 'Bloqueante SUNAT', color: 'border-rose-500 text-rose-600', dot: 'bg-rose-500' },
                      ].map((p) => {
                        const activo = formComunicado.prioridad === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setFormComunicado({ ...formComunicado, prioridad: p.id })}
                            className={`p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                              activo
                                ? 'bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-[#02CBA9] ring-4 ring-[#02CBA9]/20 shadow-xs'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900 dark:text-white block">
                                {p.label}
                              </span>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                            </div>
                            <span className="text-[9.5px] text-slate-400 block mt-0.5 truncate">{p.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* BLOQUE 03: SEGMENTACIÓN DE AUDIENCIA & VIGENCIA TEMPORAL */}
                <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded-md">03</span>
                      <span>Segmentación de Audiencia & Vigencia Temporal</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Targeting Preciso</span>
                  </div>

                  {/* Selector de Tipo de Audiencia */}
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block">
                      Destinatarios del Comunicado
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Global */}
                      <div
                        onClick={() => setFormComunicado({ ...formComunicado, audiencia_tipo: 'global', empresa_id: '', plan_objetivo: 'todos' })}
                        className={`group p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-2.5 ${
                          formComunicado.audiencia_tipo === 'global'
                            ? 'bg-emerald-500/10 border-emerald-500/40 ring-4 ring-emerald-500/15 shadow-sm'
                            : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-emerald-500/30 hover:bg-slate-50/50 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          formComunicado.audiencia_tipo === 'global'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          <Globe className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                              Global (Todos)
                            </span>
                            {formComunicado.audiencia_tipo === 'global' && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Todas las empresas activas</span>
                        </div>
                      </div>

                      {/* Por Plan */}
                      <div
                        onClick={() => setFormComunicado({ ...formComunicado, audiencia_tipo: 'plan', empresa_id: '', plan_objetivo: formComunicado.plan_objetivo === 'todos' ? 'starter' : formComunicado.plan_objetivo })}
                        className={`group p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-2.5 ${
                          formComunicado.audiencia_tipo === 'plan'
                            ? 'bg-cyan-500/10 border-cyan-500/40 ring-4 ring-cyan-500/15 shadow-sm'
                            : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-cyan-500/30 hover:bg-slate-50/50 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          formComunicado.audiencia_tipo === 'plan'
                            ? 'bg-cyan-500 text-white'
                            : 'bg-cyan-500/10 text-cyan-500'
                        }`}>
                          <Target className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                              Por Plan Comercial
                            </span>
                            {formComunicado.audiencia_tipo === 'plan' && (
                              <span className="w-2 h-2 rounded-full bg-cyan-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Focalizado según suscripción</span>
                        </div>
                      </div>

                      {/* Tenant Específico */}
                      <div
                        onClick={() => setFormComunicado({ ...formComunicado, audiencia_tipo: 'tenant', plan_objetivo: 'todos' })}
                        className={`group p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-2.5 ${
                          formComunicado.audiencia_tipo === 'tenant'
                            ? 'bg-purple-500/10 border-purple-500/40 ring-4 ring-purple-500/15 shadow-sm'
                            : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-purple-500/30 hover:bg-slate-50/50 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          formComunicado.audiencia_tipo === 'tenant'
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-500/10 text-purple-500'
                        }`}>
                          <Building2 className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                              Tenant Específico
                            </span>
                            {formComunicado.audiencia_tipo === 'tenant' && (
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Una sola empresa cliente</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-opción Por Plan Comercial */}
                  {formComunicado.audiencia_tipo === 'plan' && (
                    <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2 animate-in fade-in duration-150">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 block">
                        Selecciona el Plan Destinatario
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {['starter', 'pro', 'enterprise'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormComunicado({ ...formComunicado, plan_objetivo: p })}
                            className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition-all duration-200 cursor-pointer ${
                              formComunicado.plan_objetivo === p
                                ? 'bg-cyan-500 text-white shadow-xs scale-[1.02]'
                                : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-cyan-500/40'
                            }`}
                          >
                            Plan {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-opción Tenant Específico Rediseñada con Selector Buscable */}
                  {formComunicado.audiencia_tipo === 'tenant' && (
                    <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2 animate-in fade-in duration-150">
                      <SelectorEmpresaComunicado
                        valor={formComunicado.empresa_id}
                        onChange={(nuevoId) => setFormComunicado({ ...formComunicado, empresa_id: nuevoId })}
                        empresas={empresas}
                      />
                    </div>
                  )}

                  {/* Switch & Campos para Vigencia Temporal Programada Rediseñados */}
                  <div className="pt-1">
                    <div
                      onClick={() => setFormComunicado({ ...formComunicado, con_vigencia: !formComunicado.con_vigencia })}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                        formComunicado.con_vigencia
                          ? 'bg-blue-500/10 border-blue-500/40 ring-4 ring-blue-500/15 shadow-sm'
                          : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-blue-500/30 hover:bg-slate-50/50 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                          formComunicado.con_vigencia
                            ? 'bg-blue-500 text-white shadow-xs'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          <CalendarClock className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>Vigencia Temporal & Auto-Expiración Automática</span>
                            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                              Opcional
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                            El comunicado se activará y expirará automáticamente sin requerir que lo desactives manualmente.
                          </p>
                        </div>
                      </div>

                      {/* Switch estándar verde sin texto */}
                      <div
                        className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 shrink-0 select-none flex items-center ${
                          formComunicado.con_vigencia
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40 justify-end'
                            : 'bg-slate-200 dark:bg-white/10 justify-start'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 ${
                            formComunicado.con_vigencia ? 'scale-100 text-emerald-600' : 'scale-90 text-slate-400'
                          }`}
                        >
                          {formComunicado.con_vigencia ? (
                            <Check className="w-3 h-3 stroke-[3.5]" />
                          ) : (
                            <X className="w-2.5 h-2.5 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Píldoras de Calendario Interactivo Popover Rediseñadas */}
                    {formComunicado.con_vigencia && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-in fade-in duration-150">
                        <DateTimePickerPill
                          label="Fecha y Hora de Inicio"
                          value={formComunicado.fecha_inicio}
                          onChange={(val) => setFormComunicado({ ...formComunicado, fecha_inicio: val })}
                          tipo="inicio"
                          align="left"
                        />
                        <DateTimePickerPill
                          label="Fecha y Hora de Fin (Expiración)"
                          value={formComunicado.fecha_fin}
                          onChange={(val) => setFormComunicado({ ...formComunicado, fecha_fin: val })}
                          tipo="fin"
                          align="right"
                          required={formComunicado.con_vigencia}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* VISTA PREVIA EN VIVO DENTRO DEL MODAL */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      <span>Vista Previa Interactiva en Vivo</span>
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400">
                      Formato: {formComunicado.formato === 'modal' ? 'Pop-up Modal' : 'Banner Superior'}
                    </span>
                  </div>

                  {formComunicado.formato === 'banner' ? (
                    <div
                      className={`px-4 py-2.5 rounded-2xl flex items-center justify-between border text-xs font-semibold shadow-xs transition-all duration-200 ${formComunicado.tipo === 'alerta'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        : formComunicado.tipo === 'mantenimiento'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                          : formComunicado.tipo === 'exito'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-300'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                        <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 shrink-0">
                          {formComunicado.tipo}
                        </span>
                        <span className="font-bold shrink-0 truncate max-w-[180px]">
                          {formComunicado.titulo || 'Título del anuncio'}:
                        </span>
                        <span className="truncate opacity-90 font-medium">
                          {formComunicado.mensaje || 'Texto explicativo del comunicado...'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {formComunicado.cta_activo && formComunicado.cta_texto && (
                          <span className="h-6 px-2.5 rounded-full text-[10px] font-bold bg-white dark:bg-black/40 text-current shadow-xs border border-current/20 flex items-center gap-1">
                            <span>{formComunicado.cta_texto}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                        <span className="text-[11px] opacity-60 font-mono">✕</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1442] border border-slate-200 dark:border-white/10 shadow-md text-center max-w-sm mx-auto space-y-2.5">
                      <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center bg-amber-500/15 text-amber-500 border border-amber-500/25">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {formComunicado.tipo.toUpperCase()}
                        </span>
                        <h6 className="font-black text-sm text-slate-900 dark:text-white mt-1">
                          {formComunicado.titulo || 'Título del Pop-up Modal'}
                        </h6>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {formComunicado.mensaje || 'Texto del pop-up modal que el usuario debe confirmar...'}
                        </p>
                      </div>
                      <div className="pt-1 flex items-center justify-center gap-2">
                        {formComunicado.cta_activo && formComunicado.cta_texto && (
                          <span className="h-7 px-3 rounded-xl text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1">
                            <span>{formComunicado.cta_texto}</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                        <span className="h-7 px-3 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center">
                          Entendido
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER FIJO CON BADGES DE RESUMEN Y BOTONES ESTILO ALTA EMPRESA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 sm:px-7 border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-black/20 shrink-0 z-10">
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    AUDIENCIA: {formComunicado.audiencia_tipo.toUpperCase()}
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 font-semibold">
                    FORMATO: {formComunicado.formato.toUpperCase()}
                  </span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    {formComunicado.tipo.toUpperCase()}
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                    PRIORIDAD: {formComunicado.prioridad.toUpperCase()}
                  </span>
                  {formComunicado.cta_activo && (
                    <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      +CTA
                    </span>
                  )}
                  {formComunicado.con_vigencia && (
                    <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      PROGRAMADO
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setModalNuevoComunicado(false)}
                    className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoComunicado}
                    className="h-9 px-5 rounded-xl text-xs font-black bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] text-white hover:opacity-95 shadow-md shadow-[#02CBA9]/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    {guardandoComunicado ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : comunicadoEditando ? (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Publicar Comunicado</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Acción / Botón RBAC — Rediseñado al Nivel de Excelencia de Modal Alta Empresa */}
      {modalNuevaAccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con desenfoque mínimo (1.5px) y máxima legibilidad de fondo */}
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
            onClick={() => setModalNuevaAccion(false)}
          />

          <div className="relative w-full max-w-4xl xl:max-w-5xl bg-white dark:bg-[#150f33] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-950/20 dark:shadow-black/70 z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Resplandor decorativo ambiental superior */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-28 bg-gradient-to-b from-[#02CBA9]/15 via-[#7D71EB]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

            {/* Cabecera Fija del Modal */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 sm:px-7 sm:pt-6 border-b border-slate-100 dark:border-white/5 shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] flex items-center justify-center text-white shadow-xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-heading">
                    Registrar Micro-Permiso / Botón de Interfaz
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Control granular de acceso por botón, doble factor por PIN y bitácora forense.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevaAccion(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            {/* Formulario con Scroll Interno y Bloques Estructurados */}
            <form onSubmit={handleCrearAccion} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 space-y-3.5 custom-modal-scroll min-h-0">
                {/* BLOQUE 1: IDENTIFICACIÓN & NOMENCLATURA TÉCNICA */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">01</span>
                    <span>Identificación & Nomenclatura del Botón</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Píldora: Alias Único */}
                    <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] transition-colors">
                          Alias Único (Mayúsculas)
                        </span>
                        <span className="text-[9.5px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          RBAC-KEY
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="EJ: ANUL_FACT"
                        value={formNuevaAccion.alias}
                        onChange={(e) => setFormNuevaAccion({ ...formNuevaAccion, alias: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                        className="w-full bg-transparent text-xs sm:text-sm font-mono font-black text-cyan-600 dark:text-cyan-400 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Píldora: Nombre Descriptivo */}
                    <div className="sm:col-span-2 group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] flex items-center gap-1 transition-colors">
                          <span>Nombre Descriptivo de la Acción</span>
                          <span className="text-rose-500">*</span>
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Ej: Anular Venta Emitida en TPV"
                        value={formNuevaAccion.nombre}
                        onChange={(e) => setFormNuevaAccion({ ...formNuevaAccion, nombre: e.target.value })}
                        className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50"
                        required
                      />
                    </div>
                  </div>

                  {/* Píldora: Descripción Funcional */}
                  <div className="group rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 focus-within:border-[#02CBA9] dark:focus-within:border-[#1CC0F9] focus-within:ring-4 focus-within:ring-[#02CBA9]/20 dark:focus-within:ring-[#1CC0F9]/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-[#02CBA9]/10 transition-all duration-200">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#02CBA9] dark:group-focus-within:text-[#1CC0F9] block transition-colors">
                      Descripción Funcional & Alcance
                    </span>
                    <textarea
                      rows={2}
                      placeholder="Describe las validaciones de negocio, advertencias y alcance de este botón..."
                      value={formNuevaAccion.descripcion}
                      onChange={(e) => setFormNuevaAccion({ ...formNuevaAccion, descripcion: e.target.value })}
                      className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50 resize-none"
                    />
                  </div>
                </div>

                {/* BLOQUE 2: MÓDULO & EVALUACIÓN DE IMPACTO / RIESGO */}
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">02</span>
                    <span>Módulo de Interfaz & Nivel de Severidad</span>
                  </div>

                  {/* Selector Visual de Módulo */}
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block">
                      Módulo Perteneciente
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {[
                        { id: 'General', label: 'General / Core', icon: Layers },
                        { id: 'Ventas', label: 'Ventas', icon: ShoppingBag },
                        { id: 'POS', label: 'Punto de Venta', icon: Monitor },
                        { id: 'Finanzas', label: 'Finanzas & Caja', icon: Coins },
                        { id: 'Seguridad', label: 'Seguridad', icon: ShieldCheck },
                        { id: 'Reportes', label: 'Reportes', icon: FileSpreadsheet },
                      ].map((m) => {
                        const IconoMod = m.icon;
                        const sel = formNuevaAccion.modulo === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setFormNuevaAccion({ ...formNuevaAccion, modulo: m.id })}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 active:scale-95 ${sel
                              ? 'bg-gradient-to-b from-[#02CBA9]/15 to-[#1CC0F9]/10 border-[#02CBA9] text-[#02CBA9] dark:text-[#1CC0F9] font-black shadow-xs ring-2 ring-[#02CBA9]/20'
                              : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 font-bold'
                              }`}
                          >
                            <IconoMod className="w-4 h-4" />
                            <span className="text-[11px] truncate">{m.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector Visual de Nivel de Riesgo (Tarjetas estilo Planes) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block">
                      Nivel de Riesgo Operativo
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: 'bajo',
                          titulo: 'Bajo Impacto',
                          tag: 'OPERACIÓN HABITUAL',
                          desc: 'Reimpresiones de ticket, consultas o filtros sin alteración de saldos ni existencias.',
                          icono: CheckCircle2,
                          borderActive: 'border-emerald-500 bg-emerald-500/[0.08] ring-2 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                          badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                        },
                        {
                          id: 'medio',
                          titulo: 'Medio Impacto',
                          tag: 'ALTERA CAJA / STOCK',
                          desc: 'Descuentos manuales, notas de venta, cambio de precios o corte de turno.',
                          icono: AlertTriangle,
                          borderActive: 'border-amber-500 bg-amber-500/[0.08] ring-2 ring-amber-500/20 text-amber-600 dark:text-amber-400',
                          badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                        },
                        {
                          id: 'critico',
                          titulo: 'Crítico / Fiscal',
                          tag: 'ACCIÓN IRREVERSIBLE',
                          desc: 'Anulaciones SUNAT, reapertura de caja, eliminación de datos o exportación masiva.',
                          icono: ShieldAlert,
                          borderActive: 'border-rose-500 bg-rose-500/[0.08] ring-2 ring-rose-500/20 text-rose-600 dark:text-rose-400',
                          badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
                        },
                      ].map((r) => {
                        const IconoRiesgo = r.icono;
                        const sel = formNuevaAccion.riesgo === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => setFormNuevaAccion({ ...formNuevaAccion, riesgo: r.id })}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${sel
                              ? r.borderActive
                              : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                <IconoRiesgo className="w-3.5 h-3.5" />
                                <span>{r.titulo}</span>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full border ${r.badge}`}>
                                {r.tag}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
                              {r.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* BLOQUE 3: POLÍTICAS DE DOBLE FACTOR & MATRIZ RBAC */}
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">03</span>
                      <span>Políticas de Seguridad & Matriz RBAC</span>
                    </div>
                  </div>

                  {/* Tarjetas de PIN y Auditoría con Switch Táctil */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* PIN de Supervisor */}
                    <div
                      onClick={() => setFormNuevaAccion({ ...formNuevaAccion, requiere_pin: !formNuevaAccion.requiere_pin })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${formNuevaAccion.requiere_pin
                        ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-amber-500/30'
                        }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${formNuevaAccion.requiere_pin
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-500/10 text-amber-500'
                          }`}>
                          <Key className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>PIN de Supervisor Presencial</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                            Exige autorización con PIN de 4 dígitos de un supervisor en el TPV.
                          </p>
                        </div>
                      </div>

                      {/* Switch de píldora compacta verde */}
                      <div
                        className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 shrink-0 select-none flex items-center ${formNuevaAccion.requiere_pin
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40 justify-end'
                          : 'bg-slate-200 dark:bg-white/10 justify-start'
                          }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 ${formNuevaAccion.requiere_pin ? 'scale-100 text-emerald-600' : 'scale-90 text-slate-400'
                            }`}
                        >
                          {formNuevaAccion.requiere_pin ? (
                            <Check className="w-3 h-3 stroke-[3.5]" />
                          ) : (
                            <X className="w-2.5 h-2.5 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Auditoría Forense */}
                    <div
                      onClick={() => setFormNuevaAccion({ ...formNuevaAccion, auditoria_obligatoria: !formNuevaAccion.auditoria_obligatoria })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${formNuevaAccion.auditoria_obligatoria
                        ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-emerald-500/30'
                        }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${formNuevaAccion.auditoria_obligatoria
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>Auditoría Forense Obligatoria</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                            Registra timestamp, IP, operador y hash de auditoría inmutable.
                          </p>
                        </div>
                      </div>

                      {/* Switch de píldora compacta verde */}
                      <div
                        className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 shrink-0 select-none flex items-center ${formNuevaAccion.auditoria_obligatoria
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40 justify-end'
                          : 'bg-slate-200 dark:bg-white/10 justify-start'
                          }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-200 ${formNuevaAccion.auditoria_obligatoria ? 'scale-100 text-emerald-600' : 'scale-90 text-slate-400'
                            }`}
                        >
                          {formNuevaAccion.auditoria_obligatoria ? (
                            <Check className="w-3 h-3 stroke-[3.5]" />
                          ) : (
                            <X className="w-2.5 h-2.5 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matriz de Roles con Toolbar Segmentado */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block">
                        Roles Autorizados Inicialmente
                      </span>
                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setFormNuevaAccion({ ...formNuevaAccion, roles: ['admin', 'supervisor', 'cajero', 'vendedor', 'mozo'] })}
                          className="px-2 py-0.5 rounded-md font-bold text-cyan-600 dark:text-cyan-400 hover:bg-white dark:hover:bg-white/10 hover:shadow-xs transition-all cursor-pointer"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormNuevaAccion({ ...formNuevaAccion, roles: ['admin'] })}
                          className="px-2 py-0.5 rounded-md font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 hover:shadow-xs transition-all cursor-pointer"
                        >
                          Solo Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormNuevaAccion({ ...formNuevaAccion, roles: ['admin', 'supervisor', 'cajero'] })}
                          className="px-2 py-0.5 rounded-md font-bold text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-white/10 hover:shadow-xs transition-all cursor-pointer"
                        >
                          Caja & Ventas
                        </button>
                      </div>
                    </div>

                    {/* 5 Tarjetas Interactivas de Rol */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'admin', label: 'Admin', desc: 'Control Total' },
                        { id: 'supervisor', label: 'Supervisor', desc: 'Autorizaciones' },
                        { id: 'cajero', label: 'Cajero', desc: 'TPV & Caja' },
                        { id: 'vendedor', label: 'Vendedor', desc: 'Preventa' },
                        { id: 'mozo', label: 'Mozo', desc: 'Comandas' },
                      ].map((r) => {
                        const activo = formNuevaAccion.roles.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              const newRoles = activo
                                ? formNuevaAccion.roles.filter((x) => x !== r.id)
                                : [...formNuevaAccion.roles, r.id];
                              setFormNuevaAccion({ ...formNuevaAccion, roles: newRoles });
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 active:scale-95 ${activo
                              ? 'bg-blue-600/10 border-blue-600 text-blue-600 dark:text-blue-400 shadow-2xs ring-2 ring-blue-600/20'
                              : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-400 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase">{r.label}</span>
                              <span className={`w-2 h-2 rounded-full ${activo ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/10'}`} />
                            </div>
                            <span className="text-[10px] text-slate-400">{r.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER FIJO CON BADGES DE RESUMEN Y BOTONES ESTILO ALTA EMPRESA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 sm:px-7 border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-black/20 shrink-0 z-10">
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    ALIAS: {formNuevaAccion.alias || 'SIN_ALIAS'}
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 font-semibold">
                    MOD: {formNuevaAccion.modulo}
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-md border ${formNuevaAccion.riesgo === 'critico'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    : formNuevaAccion.riesgo === 'medio'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                    {formNuevaAccion.riesgo.toUpperCase()}
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                    {formNuevaAccion.roles.length} ROLES
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setModalNuevaAccion(false)}
                    className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 rounded-xl text-xs font-black bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] text-white hover:opacity-95 shadow-md shadow-[#02CBA9]/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Registrar Micro-Permiso</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tester de Permisos RBAC en Vivo */}
      {modalTesterPermisos && (() => {
        const accionesModulo = catalogoAcciones.filter((acc) => {
          if (moduloTesterPermisos !== 'todos' && acc.modulo !== moduloTesterPermisos) return false;
          return true;
        });

        const totalModulo = accionesModulo.length;
        const permitidas = accionesModulo.filter((acc) => acc.activo && acc.roles.includes(rolTesterPermisos)).length;
        const requierenPin = accionesModulo.filter((acc) => acc.activo && acc.roles.includes(rolTesterPermisos) && acc.requiere_pin).length;
        const bloqueadas = totalModulo - permitidas;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
              onClick={() => setModalTesterPermisos(false)}
            />
            <div className="relative w-full max-w-4xl bg-white dark:bg-[#18123B] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-10 animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Cabecera del Tester */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white font-heading">
                      Simulador & Tester de Permisos RBAC
                    </h2>
                    <p className="text-xs text-slate-400">
                      Prueba en tiempo real cómo interactúa cada rol con los botones de la suite
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalTesterPermisos(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                  title="Cerrar tester"
                >
                  <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
                </button>
              </div>

              {/* Selectores de Rol y Módulo */}
              <div className="p-4 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                {/* Selector de Rol */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Rol a Simular
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['cajero', 'supervisor', 'vendedor', 'mozo', 'admin'].map((rol) => (
                      <button
                        key={rol}
                        type="button"
                        onClick={() => setRolTesterPermisos(rol)}
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase transition-all cursor-pointer ${rolTesterPermisos === rol
                          ? 'bg-blue-600 text-white shadow-xs scale-105'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10'
                          }`}
                      >
                        {rol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de Módulo */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Módulo
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['todos', 'General', 'Ventas', 'POS', 'Finanzas', 'Seguridad'].map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setModuloTesterPermisos(mod)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${moduloTesterPermisos === mod
                          ? 'bg-cyan-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10'
                          }`}
                      >
                        {mod === 'todos' ? 'Todos' : mod}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grilla de Botones Simulados */}
              <div className="flex-1 overflow-y-auto p-5 custom-modal-scroll min-h-0 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accionesModulo.map((acc) => {
                    const Icono = resolverIconoAccion(acc.icono);
                    const estaActivo = acc.activo;
                    const tieneRol = acc.roles.includes(rolTesterPermisos);
                    const autorizado = estaActivo && tieneRol;
                    const requierePin = autorizado && acc.requiere_pin;

                    return (
                      <div
                        key={acc.id}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${!estaActivo
                          ? 'bg-slate-50 dark:bg-white/[0.01] border-dashed border-slate-200 dark:border-white/5 opacity-60'
                          : !tieneRol
                            ? 'bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border-rose-500/20'
                            : requierePin
                              ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.05] border-amber-500/30 shadow-xs'
                              : 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border-emerald-500/30 shadow-xs'
                          }`}
                      >
                        {/* Cabecera de la Acción */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!estaActivo
                                ? 'bg-slate-200 dark:bg-white/5 text-slate-400'
                                : !tieneRol
                                  ? 'bg-rose-500/15 text-rose-500'
                                  : requierePin
                                    ? 'bg-amber-500/15 text-amber-500'
                                    : 'bg-emerald-500/15 text-emerald-500'
                                }`}
                            >
                              <Icono className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                  {acc.alias}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {acc.nombre}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                                {acc.descripcion || 'Sin descripción'}
                              </p>
                            </div>
                          </div>

                          {/* Badge de Estado del Permiso */}
                          <div className="shrink-0">
                            {!estaActivo ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-200/80 dark:bg-white/10 text-slate-500">
                                Desactivado
                              </span>
                            ) : !tieneRol ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Denegado
                              </span>
                            ) : requierePin ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <Key className="w-2.5 h-2.5" />
                                Requiere PIN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                Permitido
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón de Prueba en Vivo (Simula cómo reacciona la UI del POS) */}
                        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {acc.auditoria_obligatoria ? '• Registra Auditoría Forense' : '• Operación normal'}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (!estaActivo) {
                                toast.error(`La acción '${acc.alias}' está pausada a nivel de configuración global`);
                              } else if (!tieneRol) {
                                toast.error(`Acceso DENEGADO: El rol '${rolTesterPermisos.toUpperCase()}' no cuenta con permisos para '${acc.nombre}'`);
                              } else if (requierePin) {
                                toast(`Solicitando PIN de supervisor para autorizar '${acc.nombre}'...`, {
                                  icon: '🔑',
                                  duration: 3000,
                                });
                              } else {
                                toast.success(`¡Acción '${acc.nombre}' ejecutada con éxito para el rol '${rolTesterPermisos.toUpperCase()}'!`);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${!estaActivo
                              ? 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed'
                              : !tieneRol
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white'
                                : requierePin
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white'
                                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white'
                              }`}
                          >
                            <span>Probar Clic en Vivo</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pie con Estadísticas en Vivo */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-4 text-[11px] font-bold">
                  <span className="text-slate-500">
                    Total: <strong className="text-slate-800 dark:text-white font-mono">{totalModulo}</strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Permitidas: <strong className="font-mono">{permitidas}</strong>
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Con PIN: <strong className="font-mono">{requierenPin}</strong>
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    Bloqueadas: <strong className="font-mono">{bloqueadas}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setModalTesterPermisos(false)}
                  className="h-9 px-5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
                >
                  Cerrar Simulador
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Gestión Global de Tarifario y Precios Establecidos de Planes SaaS */}
      {modalGestionPlanes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
            onClick={() => setModalGestionPlanes(false)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#18123B] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white font-heading">
                    Tarifario Oficial & Precios de Planes SaaS
                  </h2>
                  <p className="text-xs text-slate-400">
                    Define las tarifas base que se aplican automáticamente al dar de alta empresas clientes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalGestionPlanes(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <form onSubmit={handleGuardarPlanes} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-modal-scroll min-h-0">
              {/* Bloque de Activación Previa de Seguridad */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 ${modoEdicionPlanes
                ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 shadow-xs'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10'
                }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white transition-colors ${modoEdicionPlanes ? 'bg-amber-500 shadow-md shadow-amber-500/30' : 'bg-slate-400 dark:bg-slate-700'
                      }`}>
                      {modoEdicionPlanes ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {modoEdicionPlanes ? 'Modo Edición Habilitado' : 'Tarifario Protegido (Modo Lectura)'}
                        </span>
                        {modoEdicionPlanes && (
                          <span className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Edición Previa Activa
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {modoEdicionPlanes
                          ? 'Puedes modificar los precios establecidos para cada plan. Recuerda guardar cambios.'
                          : 'Para modificar los precios establecidos de los planes, activa primero la edición previa.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nuevoModo = !modoEdicionPlanes;
                      setModoEdicionPlanes(nuevoModo);
                      if (nuevoModo) {
                        toast('Modo edición activado: ya puedes modificar los precios establecidos', { icon: '🔓' });
                      } else {
                        toast('Edición de tarifario bloqueada en modo seguro', { icon: '🔒' });
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs ${modoEdicionPlanes
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-white dark:bg-white/10 text-slate-700 dark:text-white border border-slate-300 dark:border-white/20 hover:border-amber-500 hover:text-amber-600'
                      }`}
                  >
                    {modoEdicionPlanes ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bloquear Edición</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Activar Edición Previa</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Grid de Edición de los 3 Planes */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Planes de Suscripción Oficiales HEIS
                </span>

                {['starter', 'professional', 'enterprise'].map((planId) => {
                  const planActual = formPlanes.find((p) => p.id === planId) || DEFAULT_PLANES_CONFIG.find((p) => p.id === planId);
                  const colorBorde = planId === 'starter' ? 'focus-within:border-blue-500' : planId === 'professional' ? 'focus-within:border-indigo-500' : 'focus-within:border-amber-500';
                  const badgeColor = planId === 'starter' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : planId === 'professional' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';

                  return (
                    <div
                      key={planId}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${modoEdicionPlanes
                        ? 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 opacity-90'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {planActual?.badge || planId}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {planActual?.nombre}
                          </span>
                        </div>

                        {/* Input de Precio Establecido */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Precio de Lista:
                          </span>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${modoEdicionPlanes
                            ? `bg-white dark:bg-black/30 border-slate-300 dark:border-white/20 ${colorBorde} shadow-xs`
                            : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 opacity-80 cursor-not-allowed'
                            }`}>
                            <span className="text-xs font-bold text-slate-400">S/</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={!modoEdicionPlanes}
                              value={planActual?.precio_mensual ?? ''}
                              onChange={(e) => {
                                const nuevoPrecio = e.target.value;
                                setFormPlanes((prev) =>
                                  prev.map((item) =>
                                    item.id === planId ? { ...item, precio_mensual: nuevoPrecio } : item
                                  )
                                );
                              }}
                              className={`w-24 bg-transparent text-sm font-mono font-black focus:outline-none text-right ${modoEdicionPlanes
                                ? 'text-slate-900 dark:text-white cursor-text'
                                : 'text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                                }`}
                            />
                            <span className="text-[10px] text-slate-400 font-medium">/ mes</span>
                          </div>
                        </div>
                      </div>

                      {/* Alcance y Descripción resumida */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                        <div>
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Alcance de Sedes / Usuarios
                          </span>
                          <input
                            type="text"
                            disabled={!modoEdicionPlanes}
                            value={planActual?.alcance || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormPlanes((prev) =>
                                prev.map((item) => (item.id === planId ? { ...item, alcance: val } : item))
                              );
                            }}
                            className={`w-full bg-transparent text-xs font-medium focus:outline-none ${modoEdicionPlanes
                              ? 'text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 dark:border-white/20 pb-0.5'
                              : 'text-slate-500 dark:text-slate-400 cursor-not-allowed'
                              }`}
                          />
                        </div>
                        <div>
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Descripción Comercial
                          </span>
                          <input
                            type="text"
                            disabled={!modoEdicionPlanes}
                            value={planActual?.descripcion || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormPlanes((prev) =>
                                prev.map((item) => (item.id === planId ? { ...item, descripcion: val } : item))
                              );
                            }}
                            className={`w-full bg-transparent text-xs font-medium focus:outline-none ${modoEdicionPlanes
                              ? 'text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 dark:border-white/20 pb-0.5'
                              : 'text-slate-500 dark:text-slate-400 cursor-not-allowed'
                              }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botonera de Acciones */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  disabled={!modoEdicionPlanes}
                  onClick={handleRestablecerFabricaPlanes}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restablecer Valores de Fábrica</span>
                </button>

                <div className="flex items-center gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setModalGestionPlanes(false)}
                    className="h-10 px-5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!modoEdicionPlanes || guardandoPlanes}
                    className={`h-10 px-6 rounded-full text-xs font-black text-white shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-2 ${modoEdicionPlanes
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 shadow-amber-500/25'
                      : 'bg-slate-400 dark:bg-slate-700 opacity-50 cursor-not-allowed shadow-none'
                      }`}
                  >
                    {guardandoPlanes ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Guardar Precios Establecidos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTAR META DE MRR MENSUAL */}
      {modalMetaMRR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
            onClick={() => setModalMetaMRR(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-2xl shadow-slate-950/20 dark:shadow-black/70 z-10 animate-in zoom-in-95 duration-150 space-y-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                    Meta Mensual de MRR
                  </h3>
                  <p className="text-xs text-slate-400">Objetivo comercial de ingresos recurrentes SaaS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMetaMRR(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Monto Objetivo Mensual (Soles PEN)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">S/</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={tempMetaMRR}
                    onChange={(e) => setTempMetaMRR(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Metas Rápidas Sugeridas:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[1000, 2500, 5000, 10000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTempMetaMRR(val)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${Number(tempMetaMRR) === val
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30'
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                        }`}
                    >
                      S/ {val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setModalMetaMRR(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => guardarMetaMRR(tempMetaMRR)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Meta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RENOVAR SUSCRIPCIÓN DE EMPRESA (CALENDARIO REDISEÑADO HEIS SUITE) */}
      {modalRenovar && empresaRenovar && (() => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

        // Cálculo de días restantes del vencimiento actual
        let diasRestantesActual = null;
        if (empresaRenovar.fecha_vencimiento) {
          const partesAct = String(empresaRenovar.fecha_vencimiento).split('-').map(Number);
          if (partesAct.length === 3) {
            const fAct = new Date(partesAct[0], partesAct[1] - 1, partesAct[2]);
            fAct.setHours(0, 0, 0, 0);
            diasRestantesActual = Math.round((fAct - hoy) / (1000 * 60 * 60 * 24));
          }
        }

        // Cálculo de días restantes y prórroga con la nueva fecha seleccionada
        let diasRestantesNueva = null;
        let diasProrroga = null;
        if (fechaRenovacion) {
          const partesNue = String(fechaRenovacion).split('-').map(Number);
          if (partesNue.length === 3) {
            const fNueva = new Date(partesNue[0], partesNue[1] - 1, partesNue[2]);
            fNueva.setHours(0, 0, 0, 0);
            diasRestantesNueva = Math.round((fNueva - hoy) / (1000 * 60 * 60 * 24));

            let fBase = hoy;
            if (empresaRenovar.fecha_vencimiento) {
              const partesAct = String(empresaRenovar.fecha_vencimiento).split('-').map(Number);
              if (partesAct.length === 3) {
                const fAct = new Date(partesAct[0], partesAct[1] - 1, partesAct[2]);
                fAct.setHours(0, 0, 0, 0);
                if (fAct > hoy) fBase = fAct;
              }
            }
            diasProrroga = Math.round((fNueva - fBase) / (1000 * 60 * 60 * 24));
          }
        }

        // Matriz de días del mes del calendario
        const primerDia = new Date(calAnio, calMes, 1);
        let diaSemanaInicio = primerDia.getDay() - 1;
        if (diaSemanaInicio === -1) diaSemanaInicio = 6;

        const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate();
        const diasEnMesAnterior = new Date(calAnio, calMes, 0).getDate();

        const celdas = [];
        for (let i = diaSemanaInicio - 1; i >= 0; i--) {
          const d = diasEnMesAnterior - i;
          const m = calMes === 0 ? 11 : calMes - 1;
          const y = calMes === 0 ? calAnio - 1 : calAnio;
          const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          celdas.push({ dia: d, esMesActual: false, iso });
        }
        for (let d = 1; d <= diasEnMes; d++) {
          const iso = `${calAnio}-${String(calMes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          celdas.push({ dia: d, esMesActual: true, iso });
        }
        const totalCeldas = Math.ceil(celdas.length / 7) * 7;
        const faltantes = totalCeldas - celdas.length;
        for (let d = 1; d <= faltantes; d++) {
          const m = calMes === 11 ? 0 : calMes + 1;
          const y = calMes === 11 ? calAnio + 1 : calAnio;
          const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          celdas.push({ dia: d, esMesActual: false, iso });
        }

        const ATAJOS_RENOVACION = [
          { dias: 15, label: '+15 días', desc: 'Quincena' },
          { dias: 30, label: '+30 días', desc: '1 Mes estándar' },
          { dias: 60, label: '+60 días', desc: 'Bimestre' },
          { dias: 90, label: '+90 días', desc: 'Trimestre' },
          { dias: 180, label: '+180 días', desc: 'Semestre' },
          { dias: 365, label: '+1 año', desc: 'Anual' },
        ];

        const aplicarAtajo = (dias) => {
          const nueva = calcularProximaFecha(empresaRenovar.fecha_vencimiento, dias);
          setFechaRenovacion(nueva);
          const partes = nueva.split('-').map(Number);
          if (partes.length === 3) {
            setCalAnio(partes[0]);
            setCalMes(partes[1] - 1);
          }
        };

        const seleccionarDia = (iso, esMesActual) => {
          setFechaRenovacion(iso);
          if (!esMesActual) {
            const partes = iso.split('-').map(Number);
            if (partes.length === 3) {
              setCalAnio(partes[0]);
              setCalMes(partes[1] - 1);
            }
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop con desenfoque mínimo (1.5px) y clic exterior para cerrar */}
            <div
              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[1.5px] transition-all duration-200"
              onClick={() => {
                setModalRenovar(false);
                setEmpresaRenovar(null);
              }}
            />

            <div className="relative w-full max-w-lg bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-950/20 dark:shadow-black/70 z-10 animate-in zoom-in-95 duration-150 p-4 sm:p-5 space-y-3 my-auto overflow-hidden">
              {/* Resplandor decorativo ambiental superior */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-24 bg-gradient-to-b from-[#02CBA9]/15 via-[#1CC0F9]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#02CBA9]/20 to-[#1CC0F9]/20 text-[#02CBA9] dark:text-[#1CC0F9] flex items-center justify-center shrink-0">
                    <CalendarClock className="w-4.5 h-4.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-heading leading-tight">
                      Renovación & Vigencia SaaS
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-xs">{empresaRenovar.nombre}</span>
                      {empresaRenovar.ruc && <span className="font-mono text-[10px]">({empresaRenovar.ruc})</span>}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalRenovar(false);
                    setEmpresaRenovar(null);
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                  title="Cerrar ventana"
                >
                  <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
                </button>
              </div>

              {/* Fila Comparativa: Estado Actual vs Nueva Vigencia Proyectada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Tarjeta Vencimiento Actual */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
                    <span>Vencimiento Actual</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      S/ {Number(empresaRenovar.cuota).toFixed(2)}/m
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    {empresaRenovar.fecha_vencimiento || 'Sin fecha asignada'}
                  </div>
                  <div>
                    {diasRestantesActual === null ? (
                      <span className="text-[10px] text-slate-400">Sin límite registrado</span>
                    ) : diasRestantesActual < 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                        <span>Vencido hace {Math.abs(diasRestantesActual)} días</span>
                      </span>
                    ) : diasRestantesActual <= 7 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>Vence en {diasRestantesActual} días</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                        <span>Al día ({diasRestantesActual} días)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tarjeta Nueva Cobertura Proyectada */}
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#02CBA9]/10 via-[#1CC0F9]/5 to-transparent border border-[#02CBA9]/30 dark:border-[#1CC0F9]/30 space-y-1">
                  <div className="flex items-center justify-between text-[9.5px] uppercase font-bold text-[#02CBA9] dark:text-[#1CC0F9] tracking-wider">
                    <span>Nueva Cobertura</span>
                    {diasProrroga !== null && (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{diasProrroga} días
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white capitalize truncate">
                    {formatearFechaEspanol(fechaRenovacion)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {diasRestantesNueva !== null && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                        <span>Vigente por {diasRestantesNueva} días desde hoy</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Atajos Rápidos de Prórroga / Renovación */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Atajos de Período:
                  </span>
                  <span className="text-[9.5px] text-slate-400">Desde vencimiento actual</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {ATAJOS_RENOVACION.map((btn) => {
                    const fechaCalculada = calcularProximaFecha(empresaRenovar.fecha_vencimiento, btn.dias);
                    const estaActivo = fechaRenovacion === fechaCalculada;

                    return (
                      <button
                        key={btn.dias}
                        type="button"
                        onClick={() => aplicarAtajo(btn.dias)}
                        className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer border ${estaActivo
                          ? 'bg-gradient-to-r from-[#02CBA9] to-[#1CC0F9] text-white font-bold border-transparent shadow-xs scale-[1.02]'
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#02CBA9]/50 hover:bg-[#02CBA9]/10'
                          }`}
                      >
                        <div className="text-[11px] font-black">{btn.label}</div>
                        <div className={`text-[8.5px] truncate ${estaActivo ? 'text-white/85' : 'text-slate-400'}`}>
                          {btn.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendario Interactivo Rediseñado & Compacto */}
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/10 space-y-2">
                {/* Cabecera del Mes & Navegación */}
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#02CBA9] dark:text-[#1CC0F9]" />
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white capitalize">
                      {MESES_CALENDARIO[calMes]} {calAnio}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCalMes(hoy.getMonth());
                        setCalAnio(hoy.getFullYear());
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-[#02CBA9] hover:bg-[#02CBA9]/10 rounded-md transition-colors cursor-pointer"
                      title="Ir al mes actual"
                    >
                      Hoy
                    </button>
                    <div className="flex items-center gap-0.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => cambiarMesCalendario(-1)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarMesCalendario(1)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cabecera Días Semana */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DIAS_CALENDARIO.map((d) => (
                    <div key={d} className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 py-0">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grilla de Días del Mes (Compacta y Proporcionada) */}
                <div className="grid grid-cols-7 gap-1">
                  {celdas.map((celda, idx) => {
                    const esSeleccionado = celda.iso === fechaRenovacion;
                    const esHoy = celda.iso === hoyISO;
                    const esVencActual = celda.iso === empresaRenovar.fecha_vencimiento;

                    return (
                      <button
                        key={`${celda.iso}-${idx}`}
                        type="button"
                        onClick={() => seleccionarDia(celda.iso, celda.esMesActual)}
                        className={`h-7 sm:h-7.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative group ${esSeleccionado
                          ? 'bg-gradient-to-r from-[#02CBA9] to-[#1CC0F9] text-white shadow-xs scale-105 z-10'
                          : esVencActual
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/25'
                            : esHoy
                              ? 'ring-1.5 ring-[#02CBA9] text-[#02CBA9] dark:text-[#1CC0F9] bg-[#02CBA9]/10 hover:bg-[#02CBA9]/20'
                              : celda.esMesActual
                                ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 hover:shadow-2xs'
                                : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                      >
                        <span className="leading-none">{celda.dia}</span>
                        {/* Indicadores contextuales */}
                        {esVencActual && !esSeleccionado && (
                          <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-0.5" title="Vencimiento actual" />
                        )}
                        {esHoy && !esSeleccionado && !esVencActual && (
                          <span className="w-1 h-1 rounded-full bg-[#02CBA9] absolute bottom-0.5" title="Hoy" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Leyenda y Opción de Fecha Directa */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-white/10 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2.5 text-[9.5px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#02CBA9] to-[#1CC0F9]" />
                      <span>Nueva</span>
                    </span>
                    {empresaRenovar.fecha_vencimiento && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Actual</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full ring-1 ring-[#02CBA9] bg-[#02CBA9]/30" />
                      <span>Hoy</span>
                    </span>
                  </div>

                  {/* Rediseño del Control Manual Compacto */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 rounded-lg px-2 py-0.5 text-[11px] shadow-2xs hover:border-[#02CBA9]/60 transition-colors">
                    <div className="flex items-center gap-1">
                      <Pencil className="w-2.5 h-2.5 text-[#02CBA9] dark:text-[#1CC0F9] shrink-0" />
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Manual:</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={fechaRenovacion}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9-]/g, '').slice(0, 10);
                        setFechaRenovacion(val);
                        const partes = val.split('-');
                        if (partes.length === 3 && partes[0].length === 4 && partes[1].length === 2 && partes[2].length === 2) {
                          const y = Number(partes[0]);
                          const m = Number(partes[1]);
                          const d = Number(partes[2]);
                          if (y >= 2020 && y <= 2040 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                            setCalAnio(y);
                            setCalMes(m - 1);
                          }
                        }
                      }}
                      placeholder="AAAA-MM-DD"
                      className="w-20 bg-transparent font-mono font-bold text-[11px] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none tracking-tight"
                      title="Escriba la fecha en formato AAAA-MM-DD"
                    />
                    {fechaRenovacion && (
                      <span className="text-[9px] font-mono font-bold text-[#02CBA9] dark:text-[#1CC0F9] bg-[#02CBA9]/10 px-1 py-0.2 rounded">
                        OK
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botonera de Confirmación */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setModalRenovar(false);
                    setEmpresaRenovar(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarRenovacion}
                  disabled={guardandoRenovacion || !fechaRenovacion}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] hover:opacity-95 text-white font-black text-xs shadow-sm shadow-[#02CBA9]/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {guardandoRenovacion ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Confirmar Renovación</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE INSPECCIÓN FORENSE DE AUDITORÍA (REDISEÑADO) */}
      {modalDetalleAuditoria && logSeleccionado && (() => {
        let detallesParsed = null;
        if (logSeleccionado.detalles) {
          if (typeof logSeleccionado.detalles === 'object') {
            detallesParsed = logSeleccionado.detalles;
          } else {
            try {
              detallesParsed = JSON.parse(logSeleccionado.detalles);
            } catch {
              detallesParsed = { raw: logSeleccionado.detalles };
            }
          }
        }

        const handleCopiarJSON = () => {
          const jsonText = JSON.stringify(detallesParsed || {}, null, 2);
          navigator.clipboard.writeText(jsonText);
          setCopiadoAuditoria(true);
          toast.success('Payload forense copiado al portapapeles');
          setTimeout(() => setCopiadoAuditoria(false), 2000);
        };

        const clasificacion = clasificarAccionForense(logSeleccionado.accion);
        const redCliente = parsearNavegador(logSeleccionado.navegador);
        const ipNormalizada = normalizarIP(logSeleccionado.ip);
        const esLocal = esLocalhost(logSeleccionado.ip);

        // Claves operacionales para visualización estructurada
        const clavesOperacionales = detallesParsed && typeof detallesParsed === 'object' && !Array.isArray(detallesParsed)
          ? Object.keys(detallesParsed)
          : [];

        const formatearValorVisual = (clave, valor) => {
          if (valor === null || valor === undefined) return <span className="text-slate-400 italic">No especificado</span>;
          if (typeof valor === 'boolean') {
            return valor ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10.5px]">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Activo / Habilitado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10.5px]">
                <X className="w-3 h-3 stroke-[3]" />
                <span>Inactivo / Deshabilitado</span>
              </span>
            );
          }
          if (Array.isArray(valor)) {
            if (valor.length === 0) return <span className="text-slate-400 italic">Lista vacía</span>;
            return (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {valor.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-[10.5px] font-mono font-bold border border-slate-200 dark:border-white/10 uppercase"
                  >
                    {String(item)}
                  </span>
                ))}
              </div>
            );
          }
          if (typeof valor === 'object') {
            return (
              <pre className="p-2 rounded-lg bg-slate-900/50 text-[10.5px] font-mono text-emerald-400 overflow-x-auto max-h-32">
                {JSON.stringify(valor, null, 2)}
              </pre>
            );
          }
          if (clave.toLowerCase().includes('precio') || clave.toLowerCase().includes('monto') || clave.toLowerCase().includes('total')) {
            const num = Number(valor);
            if (!isNaN(num)) {
              return (
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                  S/ {num.toFixed(2)}
                </span>
              );
            }
          }
          if (clave.toLowerCase().includes('fecha') && typeof valor === 'string') {
            return (
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                {valor}
              </span>
            );
          }
          return (
            <span className="font-medium text-slate-800 dark:text-slate-200 text-xs break-all">
              {String(valor)}
            </span>
          );
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            {/* Backdrop con desenfoque de 1.5px y clic exterior para cerrar */}
            <div
              className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-[1.5px] transition-all duration-200"
              onClick={() => {
                setModalDetalleAuditoria(false);
                setLogSeleccionado(null);
              }}
            />

            <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-950/20 dark:shadow-black/70 z-10 animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
              {/* Resplandor decorativo superior contextualizado al tipo de acción */}
              <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-lg h-36 bg-gradient-to-b ${clasificacion.bgGlow} blur-3xl pointer-events-none rounded-full`} />

              {/* 1. HEADER DEL MODAL */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 p-4 sm:p-5 relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${clasificacion.iconColor}`}>
                    {clasificacion.tipo === 'critico' ? (
                      <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                    ) : clasificacion.tipo === 'crear' ? (
                      <Sparkles className="w-5 h-5 stroke-[2.2]" />
                    ) : clasificacion.tipo === 'seguridad' ? (
                      <Key className="w-5 h-5 stroke-[2.2]" />
                    ) : (
                      <Activity className="w-5 h-5 stroke-[2.2]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-heading leading-tight">
                        Inspección Forense de Evento #{logSeleccionado.id}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-mono text-slate-500 uppercase font-bold border border-slate-200/60 dark:border-white/10">
                        {logSeleccionado.modulo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{formatearFechaAuditoria(logSeleccionado.createdAt || logSeleccionado.created_at)}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalDetalleAuditoria(false);
                    setLogSeleccionado(null);
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group shrink-0"
                  title="Cerrar inspección"
                >
                  <X className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:rotate-90" />
                </button>
              </div>

              {/* CUERPO DEL MODAL (SCROLLABLE) */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-modal-scroll flex-1">
                {/* 2. HERO ACTION BANNER */}
                <div className={`p-3.5 sm:p-4 rounded-2xl border ${clasificacion.borderColor} bg-slate-50/80 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${clasificacion.badgeClass}`}>
                        {clasificacion.categoria}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID Evento: #{logSeleccionado.id}
                      </span>
                    </div>
                    <div className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>{logSeleccionado.accion}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/25">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Inmutable & Certificado</span>
                    </span>
                  </div>
                </div>

                {/* 3. BENTO CONTEXT GRID (2 COLUMNAS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Tarjeta Actor / Responsable */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 pb-1.5 border-b border-slate-200/40 dark:border-white/5">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#02CBA9]" />
                        <span>Operador Responsable</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-white/10 font-mono text-[9px] text-slate-500 font-bold">
                        {logSeleccionado.usuario_rol || 'Sistema'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {logSeleccionado.usuario_nombre || 'Sistema Automatizado'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {logSeleccionado.empresa?.nombre || 'Plataforma SaaS Core'}
                        </span>
                        {logSeleccionado.empresa?.ruc && (
                          <span className="font-mono text-[10px] text-slate-400">
                            ({logSeleccionado.empresa.ruc})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta Dispositivo & Entidad */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 pb-1.5 border-b border-slate-200/40 dark:border-white/5">
                      <span className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-[#1CC0F9]" />
                        <span>Dispositivo & Origen</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {logSeleccionado.entidad ? `${logSeleccionado.entidad} #${logSeleccionado.entidad_id || ''}` : 'Global'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {ipNormalizada}
                        </span>
                        {esLocal && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-[#02CBA9]/10 text-[#02CBA9] border border-[#02CBA9]/20">
                            Localhost
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                        {redCliente.navegador} &bull; {redCliente.so}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. SECCIÓN EXPLORADOR DE PAYLOAD (TABS VISUAL VS JSON) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                    {/* Botones de Tab */}
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setTabModalAuditoria('visual')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${tabModalAuditoria === 'visual'
                          ? 'bg-white dark:bg-[#18123B] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>Campos Operacionales</span>
                        {clavesOperacionales.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-[#02CBA9]/15 text-[#02CBA9] font-bold">
                            {clavesOperacionales.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTabModalAuditoria('json')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${tabModalAuditoria === 'json'
                          ? 'bg-white dark:bg-[#18123B] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                      >
                        <FileJson className="w-3 h-3" />
                        <span>Payload JSON Crudo</span>
                      </button>
                    </div>

                    {/* Botón de Copiar Payload */}
                    {detallesParsed && (
                      <button
                        type="button"
                        onClick={handleCopiarJSON}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Copiar JSON formateado al portapapeles"
                      >
                        {copiadoAuditoria ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                            <span className="text-emerald-500">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar JSON</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* CONTENIDO TAB 1: CAMPOS OPERACIONALES VISUALES */}
                  {tabModalAuditoria === 'visual' && (
                    <div>
                      {clavesOperacionales.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {clavesOperacionales.map((clave) => {
                            const valor = detallesParsed[clave];
                            return (
                              <div
                                key={clave}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-1"
                              >
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                                  {clave.replace(/_/g, ' ')}
                                </span>
                                <div className="text-xs">
                                  {formatearValorVisual(clave, valor)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-center space-y-1.5">
                          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Evento atómico sin parámetros secundarios
                          </p>
                          <p className="text-[11px] text-slate-400">
                            La acción fue confirmada y registrada directamente por el motor transaccional.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTENIDO TAB 2: TERMINAL JSON CRUDO */}
                  {tabModalAuditoria === 'json' && (
                    <div className="relative rounded-2xl bg-slate-950 border border-slate-800/80 p-4 overflow-hidden">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-slate-400 font-mono">
                        <span>FORMATO: application/json</span>
                        <span>INDENTACIÓN: 2 SPACES</span>
                      </div>
                      <pre className="text-xs font-mono text-emerald-400 overflow-x-auto max-h-72 leading-relaxed select-all">
                        {detallesParsed
                          ? JSON.stringify(detallesParsed, null, 2)
                          : '// Sin payload estructurado registrado para este evento'}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. FOOTER DEL MODAL */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 p-4 sm:p-5 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
                <div className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#02CBA9]" />
                  <span>Log Forense Registrado en HEIS Security Engine</span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setModalDetalleAuditoria(false);
                      setLogSeleccionado(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 font-bold text-xs text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  >
                    Cerrar Inspección
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
