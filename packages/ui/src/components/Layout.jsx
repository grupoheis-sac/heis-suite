import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  X,
  Bell,
  HelpCircle,
  Send,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Copy,
  Activity,
  Server,
  LifeBuoy,
  Info,
  AlertTriangle,
  Zap,
  UtensilsCrossed,
  Hammer,
  Pill,
  BedDouble,
  FileText,
  ChevronDown,
  Check,
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Modal from './Modal';
import MobileBottomNav from './MobileBottomNav';
import GlobalTooltip from './GlobalTooltip';
import QuickSearchModal from './QuickSearchModal';
import { UnifiedToastItem } from './UnifiedToast';

// Niveles de Prioridad para Soporte Técnico
const NIVELES_PRIORIDAD = [
  {
    id: 'baja',
    etiqueta: 'Baja — Consulta General',
    etiquetaCorta: 'Baja',
    badge: 'Baja Prioridad',
    sla: 'SLA: 24 - 48h',
    descripcion: 'Dudas operativas, sugerencias o consultas sin bloqueo',
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
    etiqueta: 'Media — Operación Estándar',
    etiquetaCorta: 'Media',
    badge: 'Operación Normal',
    sla: 'SLA: 12 - 24h',
    descripcion: 'Incidencia parcial, lentitud o ajustes menores de uso',
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
    etiquetaCorta: 'Alta',
    badge: 'Bloqueo Parcial',
    sla: 'SLA: 2 - 4h',
    descripcion: 'Falla al emitir comprobantes SUNAT, bloqueo de caja o ventas',
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
    id: 'urgente',
    etiqueta: 'Urgente — Caída Total de Venta / Servicio',
    etiquetaCorta: 'Urgente',
    badge: 'Urgencia Máxima',
    sla: 'SLA: < 30 min',
    descripcion: 'Sistema inaccesible, caída de base de datos o corte masivo',
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

// Módulos y Subsistemas de la Suite
const MODULOS_SOPORTE = [
  {
    id: 'restaurante',
    etiqueta: 'Restaurante & Gastronomía',
    etiquetaCorta: 'Restaurante',
    badge: 'Food & Bar',
    descripcion: 'Mesas, KDS Cocina, Comandas, Menú y Caja Salón',
    icono: UtensilsCrossed,
    colorClasses: {
      text: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
      borderActive: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5',
      dot: 'bg-amber-500',
    },
  },
  {
    id: 'ferreteria',
    etiqueta: 'Ferretería & Comercial Retail',
    etiquetaCorta: 'Ferretería',
    badge: 'Retail',
    descripcion: 'POS Mostrador, Inventarios, Kardex y Cotizaciones',
    icono: Hammer,
    colorClasses: {
      text: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25',
      borderActive: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5',
      dot: 'bg-blue-500',
    },
  },
  {
    id: 'botica',
    etiqueta: 'Botica & Farmacia',
    etiquetaCorta: 'Botica',
    badge: 'Farmacia',
    descripcion: 'Dispensación POS, Lotes, FEFO y DIGEMID',
    icono: Pill,
    colorClasses: {
      text: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5',
      dot: 'bg-emerald-500',
    },
  },
  {
    id: 'hospedaje',
    etiqueta: 'Hospedaje & Hotel',
    etiquetaCorta: 'Hospedaje',
    badge: 'Hotel',
    descripcion: 'Rack Habitaciones, Check-in, Reservas y Limpieza',
    icono: BedDouble,
    colorClasses: {
      text: 'text-cyan-600 dark:text-cyan-400',
      bgIcon: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
      badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25',
      borderActive: 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/5',
      dot: 'bg-cyan-500',
    },
  },
  {
    id: 'superadmin',
    etiqueta: 'SuperAdmin SaaS & Plataforma',
    etiquetaCorta: 'SuperAdmin',
    badge: 'Master SaaS',
    descripcion: 'Gestión de Tenants, Planes, Licencias y Core',
    icono: ShieldAlert,
    colorClasses: {
      text: 'text-purple-600 dark:text-purple-400',
      bgIcon: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25',
      borderActive: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/5',
      dot: 'bg-purple-500',
    },
  },
  {
    id: 'sunat',
    etiqueta: 'Facturación Electrónica SUNAT',
    etiquetaCorta: 'SUNAT CPE',
    badge: 'CPE SUNAT',
    descripcion: 'Boletas, Facturas, Notas, CDR y Guías Remisión',
    icono: FileText,
    colorClasses: {
      text: 'text-rose-600 dark:text-rose-400',
      bgIcon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
      borderActive: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5',
      dot: 'bg-rose-500',
    },
  },
  {
    id: 'general',
    etiqueta: 'Consulta General / Otra Área',
    etiquetaCorta: 'General',
    badge: 'General',
    descripcion: 'Configuración del sistema, usuarios o consultas varias',
    icono: HelpCircle,
    colorClasses: {
      text: 'text-slate-600 dark:text-slate-400',
      bgIcon: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30',
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25',
      borderActive: 'border-slate-500 ring-2 ring-slate-500/20 bg-slate-500/5',
      dot: 'bg-slate-500',
    },
  },
];

// Selector Desplegable Rediseñado para Nivel de Prioridad
function DesplegablePrioridadSoporte({ valor, onChange }) {
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

  const prioridadActual = NIVELES_PRIORIDAD.find((p) => p.id === valor) || NIVELES_PRIORIDAD[1];
  const IconoActual = prioridadActual.icono;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group ${
          abierto
            ? `${prioridadActual.colorClasses.borderActive} shadow-lg shadow-black/5 dark:shadow-black/40 bg-white dark:bg-white/[0.08]`
            : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/70 dark:hover:bg-white/[0.06]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${prioridadActual.colorClasses.bgIcon} shadow-xs`}>
            <IconoActual className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors truncate block">
                Nivel de Prioridad & Severidad
              </span>
              <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full shrink-0 ${prioridadActual.colorClasses.badge}`}>
                {prioridadActual.badge}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {prioridadActual.etiquetaCorta}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                · {prioridadActual.sla}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <span className={`w-2 h-2 rounded-full ${prioridadActual.colorClasses.dot} animate-pulse`} />
          <div className="w-6 h-6 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-white/15 transition-colors">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${abierto ? 'rotate-180 text-orange-500' : ''}`} />
          </div>
        </div>
      </button>

      {/* Menú Desplegable Flotante — con w-full y contenedor overflow-hidden para scrollbar interno contenido */}
      {abierto && (
        <div className="absolute left-0 right-0 w-full top-full mt-1.5 z-50 bg-white dark:bg-[#150f33] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-900/25 dark:shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between select-none">
            <span>Impacto & Severidad</span>
            <span>4 niveles SLA</span>
          </div>

          <div className="p-1.5">
            <div className="max-h-60 overflow-y-auto pr-1 space-y-1 custom-dropdown-scroll">
              {NIVELES_PRIORIDAD.map((prio) => {
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
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all duration-150 cursor-pointer group/item ${
                      estaSel
                        ? `${prio.colorClasses.borderActive} font-bold`
                        : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${prio.colorClasses.bgIcon}`}>
                        <Icono className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${estaSel ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'} truncate`}>
                            {prio.etiqueta}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {prio.descripcion}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-bold text-slate-400">
                        {prio.sla}
                      </span>
                      {estaSel && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[2.5]" />
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

// Selector Desplegable Rediseñado para Módulo / Subsistema
function DesplegableModuloSoporte({ valor, onChange }) {
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

  const moduloActual = MODULOS_SOPORTE.find((m) => m.id === valor) || MODULOS_SOPORTE[0];
  const IconoActual = moduloActual.icono;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group ${
          abierto
            ? `${moduloActual.colorClasses.borderActive} shadow-lg shadow-black/5 dark:shadow-black/40 bg-white dark:bg-white/[0.08]`
            : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/70 dark:hover:bg-white/[0.06]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${moduloActual.colorClasses.bgIcon} shadow-xs`}>
            <IconoActual className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors truncate block">
                Módulo / Subsistema Afectado
              </span>
              <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full shrink-0 ${moduloActual.colorClasses.badge}`}>
                {moduloActual.badge}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {moduloActual.etiquetaCorta}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                · {moduloActual.descripcion}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <span className={`w-2 h-2 rounded-full ${moduloActual.colorClasses.dot} animate-pulse`} />
          <div className="w-6 h-6 rounded-lg bg-slate-200/60 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-white/15 transition-colors">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${abierto ? 'rotate-180 text-orange-500' : ''}`} />
          </div>
        </div>
      </button>

      {/* Menú Desplegable Flotante — con w-full y contenedor overflow-hidden para scrollbar interno contenido */}
      {abierto && (
        <div className="absolute left-0 right-0 w-full top-full mt-1.5 z-50 bg-white dark:bg-[#150f33] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-900/25 dark:shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between select-none">
            <span>Selecciona el subsistema</span>
            <span>7 módulos</span>
          </div>

          <div className="p-1.5">
            <div className="max-h-52 overflow-y-auto pr-1 space-y-1 custom-dropdown-scroll">
              {MODULOS_SOPORTE.map((mod) => {
                const estaSel = mod.id === valor;
                const Icono = mod.icono;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      onChange(mod.id);
                      setAbierto(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all duration-150 cursor-pointer group/item ${
                      estaSel
                        ? `${mod.colorClasses.borderActive} font-bold`
                        : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${mod.colorClasses.bgIcon}`}>
                        <Icono className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${estaSel ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'} truncate`}>
                            {mod.etiqueta}
                          </span>
                          <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full ${mod.colorClasses.badge}`}>
                            {mod.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {mod.descripcion}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {estaSel && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[2.5]" />
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

export default function Layout({
  children,
  user,
  empresa,
  modulosActivos = ['restaurante'],
  sucursalActual = null,
  isDark = false,
  onToggleTheme = () => {},
  onLogout = () => {},
  moduloActual = 'restaurante',
  quickSearchActions = [],
  comunicado = null,
  onDismissComunicado = () => {}
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [soporteModalOpen, setSoporteModalOpen] = useState(false);
  const [soporteForm, setSoporteForm] = useState({
    asunto: '',
    descripcion: '',
    prioridad: 'media',
    modulo: moduloActual || 'restaurante',
  });
  const [enviandoSoporte, setEnviandoSoporte] = useState(false);

  // Escuchar evento global para registrar soporte (desde botón de sidebar o cualquier subsistema)
  useEffect(() => {
    const handleOpenSoporte = (e) => {
      setSoporteForm((prev) => ({
        ...prev,
        modulo: e?.detail?.modulo || moduloActual || 'restaurante',
      }));
      setSoporteModalOpen(true);
    };
    window.addEventListener('heis:open-soporte', handleOpenSoporte);
    return () => window.removeEventListener('heis:open-soporte', handleOpenSoporte);
  }, [moduloActual]);

  const handleCopiarDiagnostico = () => {
    const diag = {
      plataforma: 'HEIS Suite Enterprise Cloud',
      version: 'v2.6.4-prod',
      timestamp: new Date().toISOString(),
      usuario: user ? { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol || user.role } : null,
      empresa: empresa ? { id: empresa.id, nombre: empresa.nombre, ruc: empresa.ruc } : null,
      sucursal: sucursalActual ? { id: sucursalActual.id, nombre: sucursalActual.nombre } : null,
      moduloActual: (soporteForm.modulo || moduloActual || 'general').toUpperCase(),
      ruta: window.location.pathname + window.location.search,
      sistema: {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        resolucion: `${window.innerWidth}x${window.innerHeight}`,
        idioma: navigator.language,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
    toast.success('Diagnóstico técnico copiado al portapapeles');
  };

  const handleEnviarSoporte = (e) => {
    e.preventDefault();
    if (!soporteForm.asunto.trim()) {
      return toast.error('Por favor complete el asunto de la incidencia');
    }
    setEnviandoSoporte(true);
    setTimeout(() => {
      const ticketNum = Math.floor(1000 + Math.random() * 9000);
      toast.success(`Ticket #${ticketNum} registrado exitosamente. Telemetría y diagnóstico adjuntos.`);
      setSoporteModalOpen(false);
      setSoporteForm({
        asunto: '',
        descripcion: '',
        prioridad: 'media',
        modulo: moduloActual || 'restaurante',
      });
      setEnviandoSoporte(false);
    }, 600);
  };

  // Atajo de teclado global: Ctrl + K para abrir QuickSearch
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#eef2f6] dark:bg-[#0c0824] text-slate-800 dark:text-slate-100"
      data-module={moduloActual}
    >
      {/* Barra Lateral / Sidebar Flotante tipo Píldora */}
      <Sidebar
        user={user}
        empresa={empresa}
        modulosActivos={modulosActivos}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        setMobileOpen={setMobileOpen}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Cabecera / Topbar Flotante tipo Píldora con z-index superior para dropdowns */}
        <div className="pt-3 px-3 sm:px-4 lg:px-6 shrink-0 z-40">
          <Navbar
            user={user}
            empresa={empresa}
            sucursalActual={sucursalActual}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            moduloActual={moduloActual}
            onToggleMobile={() => setMobileOpen(true)}
            onOpenQuickSearch={() => setQuickSearchOpen(true)}
          />
        </div>

        {/* Modal Emergente de Comunicado / Broadcast SaaS (si formato es modal) */}
        {comunicado && comunicado.formato === 'modal' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onDismissComunicado} />
            <div className="relative w-full max-w-lg bg-white dark:bg-[#18123B] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    comunicado.tipo === 'urgente' || comunicado.tipo === 'alerta'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : comunicado.tipo === 'mantenimiento'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : comunicado.tipo === 'exito'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {comunicado.tipo}
                  </span>
                  <span className="text-xs text-slate-400 font-medium font-mono">AVISO DEL SISTEMA</span>
                </div>
                <button
                  type="button"
                  onClick={onDismissComunicado}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading">
                  {comunicado.titulo}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {comunicado.mensaje}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                {comunicado.cta_texto && comunicado.cta_url && (
                  <a
                    href={comunicado.cta_url}
                    target={comunicado.cta_url.startsWith('http') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="h-10 px-5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>{comunicado.cta_texto}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={onDismissComunicado}
                  className="h-10 px-6 rounded-full text-xs font-black bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] text-white hover:opacity-95 shadow-md shadow-[#02CBA9]/25 transition-all active:scale-95 cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Flotante de Comunicado / Broadcast SaaS (si formato NO es modal) */}
        {comunicado && comunicado.formato !== 'modal' && (
          <div className="pt-2.5 px-3 sm:px-4 lg:px-6 shrink-0 z-10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div
              className={`min-h-10 py-1 px-4 rounded-full flex items-center justify-between shadow-xs border text-xs font-semibold ${
                comunicado.tipo === 'urgente' || comunicado.tipo === 'alerta'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : comunicado.tipo === 'mantenimiento'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                  : comunicado.tipo === 'exito'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden flex-wrap">
                <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 shrink-0">
                  {comunicado.tipo}
                </span>
                <span className="font-bold shrink-0">{comunicado.titulo}:</span>
                <span className="truncate opacity-90 font-medium">{comunicado.mensaje}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {comunicado.cta_texto && comunicado.cta_url && (
                  <a
                    href={comunicado.cta_url}
                    target={comunicado.cta_url.startsWith('http') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-black/40 hover:bg-white text-[11px] font-bold text-slate-800 dark:text-white transition-all shadow-2xs"
                  >
                    {comunicado.cta_texto}
                  </a>
                )}
                <button
                  type="button"
                  onClick={onDismissComunicado}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 shrink-0 transition-colors cursor-pointer"
                  title="Descartar anuncio"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Área de Contenido Principal (con scroll propio) */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 pt-3 pb-6 relative custom-modal-scroll">
          {children || <Outlet />}
        </main>

        {/* Navegación Inferior Móvil Flotante */}
        <MobileBottomNav
          onOpenMenu={() => setMobileOpen(true)}
          user={user}
          modulosActivos={modulosActivos}
        />
      </div>

      {/* Modal para Registrar Soporte Técnico & Telemetría en Vivo */}
      <Modal
        isOpen={soporteModalOpen}
        onClose={() => setSoporteModalOpen(false)}
        title="Centro de Soporte Técnico & Diagnóstico"
        subtitle="Telemetría en caliente y reporte directo de incidencias a HEIS SAC"
        icon={HelpCircle}
        maxWidth="max-w-2xl sm:max-w-3xl"
      >
        <form onSubmit={handleEnviarSoporte} className="space-y-4">
          {/* Telemetría en Vivo & Sesión Activa */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Telemetría del Entorno Cloud</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SISTEMA OPERATIVO
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-0.5">
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] text-slate-400 font-medium">Estado Core</div>
                <div className="text-xs font-bold text-emerald-500 font-mono">En Línea</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] text-slate-400 font-medium">Módulo</div>
                <div className="text-xs font-bold text-blue-500 font-mono truncate uppercase">
                  {moduloActual || 'General'}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] text-slate-400 font-medium">Empresa</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono truncate" title={empresa?.nombre || 'HEIS SAC'}>
                  {empresa?.nombre ? empresa.nombre.slice(0, 14) : 'HEIS SAC'}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] text-slate-400 font-medium">Operador</div>
                <div className="text-xs font-bold text-purple-500 font-mono truncate" title={user?.nombre || 'Usuario'}>
                  {user?.nombre ? user.nombre.split(' ')[0] : 'Admin'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-200/50 dark:border-white/5">
              <span className="text-slate-400 truncate max-w-[240px] sm:max-w-xs font-mono text-[10px]">
                {user?.nombre || 'Usuario'} • {empresa?.nombre || 'HEIS SAC'}
              </span>
              <button
                type="button"
                onClick={handleCopiarDiagnostico}
                className="font-bold text-[#02CBA9] hover:underline cursor-pointer flex items-center gap-1 shrink-0 text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar JSON</span>
              </button>
            </div>
          </div>

          {/* Formulario de Incidencia con Píldoras Envolventes */}
          <div className="space-y-3">
            {/* Píldora Envolvente: Asunto / Resumen de la Incidencia */}
            <div className="group rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 px-4 py-2.5 focus-within:border-orange-500 dark:focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/20 dark:focus-within:ring-orange-400/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-orange-500/10 transition-all duration-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 flex items-center gap-1 transition-colors">
                  <span>Asunto / Resumen de la Incidencia</span>
                  <span className="text-rose-500 font-black">*</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400">Requerido</span>
              </div>
              <input
                type="text"
                required
                placeholder="Ej: Falla al emitir comprobante electrónico o consulta de módulo"
                value={soporteForm.asunto}
                onChange={(e) => setSoporteForm({ ...soporteForm, asunto: e.target.value })}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50"
              />
            </div>

            {/* Prioridad y Módulo Desplegables Rediseñados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DesplegablePrioridadSoporte
                valor={soporteForm.prioridad}
                onChange={(nuevaPrio) => setSoporteForm({ ...soporteForm, prioridad: nuevaPrio })}
              />

              <DesplegableModuloSoporte
                valor={soporteForm.modulo || moduloActual || 'restaurante'}
                onChange={(nuevoMod) => setSoporteForm({ ...soporteForm, modulo: nuevoMod })}
              />
            </div>

            {/* Píldora Envolvente: Descripción Detallada */}
            <div className="group rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 px-4 py-2.5 focus-within:border-orange-500 dark:focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/20 dark:focus-within:ring-orange-400/25 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-md focus-within:shadow-orange-500/10 transition-all duration-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors">
                  <span>Descripción Detallada del Incidente</span>
                </span>
                <span className="text-[9px] font-medium text-slate-400">Opcional</span>
              </div>
              <textarea
                rows={3}
                placeholder="Describe los pasos para reproducir la incidencia o cualquier detalle relevante para el equipo de soporte..."
                value={soporteForm.descripcion}
                onChange={(e) => setSoporteForm({ ...soporteForm, descripcion: e.target.value })}
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400/50 resize-none custom-modal-scroll"
              />
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => setSoporteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={enviandoSoporte}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-black text-xs shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{enviandoSoporte ? 'Enviando Incidencia...' : 'Enviar Incidencia a Soporte'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Buscador Rápido (QuickSearch Modal) */}
      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        customActions={quickSearchActions}
      />

      {/* Tooltip Global Reactivo */}
      <GlobalTooltip />
    </div>
  );
}

