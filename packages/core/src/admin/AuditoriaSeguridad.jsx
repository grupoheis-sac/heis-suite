import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
 ShieldAlert,
 ShieldCheck,
 Users,
 KeyRound,
 Building2,
 Search,
 Filter,
 Calendar,
 Clock,
 ArrowRight,
 Download,
 RefreshCw,
 AlertTriangle,
 CheckCircle2,
 Info,
 X,
 Copy,
 Check,
 Layers,
 Receipt,
 Wallet,
 Eye,
 FileText,
 Terminal,
 Laptop,
 Globe,
 Activity,
 ChevronDown,
 UserCheck,
 UserX,
 FileX,
 Sparkles
} from 'lucide-react';

const MODULOS_OPCIONES = [
  { id: 'TODOS', label: 'Todos los Módulos', icon: Layers },
  { id: 'SEGURIDAD', label: 'Seguridad & Claves', icon: ShieldCheck, color: 'indigo' },
  { id: 'RESTAURANTE', label: 'Restaurante & Comandas', icon: Receipt, color: 'emerald' },
  { id: 'MESAS', label: 'Salón & Mesas', icon: Layers, color: 'amber' },
  { id: 'CAJA', label: 'Caja & Cobros', icon: Wallet, color: 'amber' },
  { id: 'USUARIOS', label: 'Personal & Roles', icon: Users, color: 'blue' },
  { id: 'SEDES', label: 'Sedes & Locales', icon: Building2, color: 'purple' }
];

const NIVELES_OPCIONES = [
 { id: 'TODOS', label: 'Todos los Niveles' },
 { id: 'CRITICAL', label: 'Críticos', color: 'rose' },
 { id: 'WARNING', label: 'Advertencias', color: 'amber' },
 { id: 'SUCCESS', label: 'Exitosos', color: 'emerald' },
 { id: 'INFO', label: 'Informativos', color: 'blue' }
];

function formatearFechaHora(fechaStr) {
 if (!fechaStr) return { fecha: '-', hora: '-', relativa: '-' };
 try {
 const d = new Date(fechaStr);
 if (isNaN(d.getTime())) return { fecha: '-', hora: '-', relativa: '-' };

 const fecha = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
 const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

 // Tiempo relativo
 const diffMs = Date.now() - d.getTime();
 const diffMin = Math.floor(diffMs / (1000 * 60));
 const diffHoras = Math.floor(diffMin / 60);
 const diffDias = Math.floor(diffHoras / 24);

 let relativa = 'Hace instantes';
 if (diffMin > 0 && diffMin < 60) relativa = `Hace ${diffMin} min`;
 else if (diffHoras >= 1 && diffHoras < 24) relativa = `Hace ${diffHoras} h`;
 else if (diffDias === 1) relativa = 'Ayer';
 else if (diffDias > 1) relativa = `Hace ${diffDias} días`;

 return { fecha, hora, relativa };
 } catch (e) {
 return { fecha: '-', hora: '-', relativa: '-' };
 }
}


// Componente de Píldora Desplegable con diseño estandarizado
function PildoraDesplegableFiltro({
  label,
  icon: Icon,
  valor,
  opciones = [],
  onChange,
  className = ''
}) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const opcionSeleccionada = opciones.find((o) => String(o.valor) === String(valor)) || opciones[0];
  const esFiltroActivo = valor !== 'TODAS' && valor !== 'TODOS';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none touch-manipulation active:scale-[0.98] ${
          abierto
            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-indigo-400 dark:border-indigo-600 ring-2 ring-amber-500/20 shadow-xs'
            : esFiltroActivo
            ? 'bg-amber-50/80 dark:bg-indigo-950/40 text-amber-700 dark:text-amber-300 border border-indigo-300 dark:border-indigo-700 shadow-2xs font-black'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && (
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${
                esFiltroActivo || abierto
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            {label}:
          </span>
          <span className="truncate max-w-[140px] sm:max-w-[200px] font-extrabold text-slate-800 dark:text-slate-100">
            {opcionSeleccionada ? opcionSeleccionada.etiqueta : valor}
          </span>
          {esFiltroActivo && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-indigo-400 shrink-0 animate-pulse" />
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            abierto ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante Redondeado */}
      {abierto && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 min-w-[240px] sm:min-w-[280px]">
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Filtrar por {label}</span>
            {esFiltroActivo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('TODAS');
                  setAbierto(false);
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer lowercase font-medium"
              >
                restablecer
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
            {opciones.map((opc) => {
              const estaSel = String(valor) === String(opc.valor);
              return (
                <button
                  key={String(opc.valor)}
                  type="button"
                  onClick={() => {
                    onChange(opc.valor);
                    setAbierto(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2.5 transition-colors cursor-pointer select-none touch-manipulation ${
                    estaSel
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate pr-1">
                    <span className="block truncate font-bold text-xs">{opc.etiqueta}</span>
                    {opc.descripcion && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block truncate mt-0.5">
                        {opc.descripcion}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {opc.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          opc.color === 'indigo'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : opc.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {opc.badge}
                      </span>
                    )}
                    {estaSel && (
                      <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
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

export default function AuditoriaSeguridad() {
 const [logs, setLogs] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [resumen, setResumen] = useState({
 totalHoy: 0,
 alertasCriticas: 0,
 totalUsuariosActivos: 0,
 totalRegistros: 0
 });

 // Filtros
 const [busqueda, setBusqueda] = useState('');
 const [moduloFiltro, setModuloFiltro] = useState('TODOS');
 const [nivelFiltro, setNivelFiltro] = useState('TODOS');
 const [sedeFiltro, setSedeFiltro] = useState('TODAS');
 const [sucursales, setSucursales] = useState([]);

  // Opciones de sedes formateadas para la píldora desplegable
  const opcionesSedes = useMemo(() => {
    const list = [
      {
        valor: 'TODAS',
        etiqueta: 'Todas las Sedes / Global',
        descripcion: 'Eventos de todas las sucursales y accesos corporativos',
        badge: 'Global',
        color: 'indigo'
      }
    ];

    sucursales.forEach((s) => {
      list.push({
        valor: String(s.id),
        etiqueta: s.nombre,
        descripcion: s.direccion || (s.es_principal ? 'Sede Matriz Principal' : 'Sucursal Operativa'),
        badge: s.es_principal ? 'Principal' : (s.tipo_establecimiento || 'Sede'),
        color: s.es_principal ? 'indigo' : 'slate'
      });
    });

    return list;
  }, [sucursales]);

 const [vistaModo, setVistaModo] = useState('timeline'); // 'timeline' | 'tabla'

 // Modal de Detalle
 const [logSeleccionado, setLogSeleccionado] = useState(null);
 const [modalDetalle, setModalDetalle] = useState(false);
 const [copiado, setCopiado] = useState(false);

 // Cargar sedes para selector
 useEffect(() => {
 const fetchSedes = async () => {
 try {
 const res = await api.get('/sucursales');
 if (res.data && res.data.sucursales) {
 setSucursales(res.data.sucursales);
 }
 } catch (err) {
 console.warn('Error cargando sedes para auditoría:', err.message);
 }
 };
 fetchSedes();
 }, []);

 // Cargar logs
 const cargarAuditoria = async () => {
 setCargando(true);
 try {
 const params = {
 limite: 150
 };
 if (moduloFiltro !== 'TODOS') params.modulo = moduloFiltro;
 if (nivelFiltro !== 'TODOS') params.nivel = nivelFiltro;
 if (sedeFiltro !== 'TODAS') params.id_sucursal = sedeFiltro;
 if (busqueda.trim()) params.busqueda = busqueda.trim();

 const res = await api.get('/auditoria', { params });
 if (res.data && res.data.success) {
 setLogs(res.data.logs || []);
 if (res.data.resumen) {
 setResumen(res.data.resumen);
 }
 }
 } catch (err) {
 console.error('Error cargando registros de auditoría:', err);
 toast.error('No se pudieron cargar los registros de auditoría');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarAuditoria();
 }, [moduloFiltro, nivelFiltro, sedeFiltro]);

 // Filtrado local en vivo por texto rápido
 const logsFiltrados = useMemo(() => {
 if (!busqueda.trim()) return logs;
 const q = busqueda.toLowerCase().trim();
 return logs.filter((item) => {
 const desc = item.descripcion ? item.descripcion.toLowerCase() : '';
 const acc = item.accion ? item.accion.toLowerCase() : '';
 const mod = item.modulo ? item.modulo.toLowerCase() : '';
 const user = item.usuario?.nombre ? item.usuario.nombre.toLowerCase() : '';
 const sede = item.sucursal?.nombre ? item.sucursal.nombre.toLowerCase() : '';
 const ip = item.ip ? item.ip.toLowerCase() : '';
 return desc.includes(q) || acc.includes(q) || mod.includes(q) || user.includes(q) || sede.includes(q) || ip.includes(q);
 });
 }, [logs, busqueda]);

 const handleAbrirDetalle = (log) => {
 setLogSeleccionado(log);
 setModalDetalle(true);
 setCopiado(false);
 };

 const handleCopiarDetalle = () => {
 if (!logSeleccionado) return;
 const dataStr = JSON.stringify(logSeleccionado, null, 2);
 navigator.clipboard.writeText(dataStr);
 setCopiado(true);
 toast.success('Registro de auditoría copiado al portapapeles');
 setTimeout(() => setCopiado(false), 2000);
 };

 const exportarCSV = () => {
 if (!logsFiltrados.length) {
 toast.error('No hay registros para exportar');
 return;
 }

 const headers = ['ID', 'Fecha', 'Hora', 'Modulo', 'Nivel', 'Accion', 'Descripcion', 'Colaborador', 'Rol', 'Sede', 'IP'];
 const rows = logsFiltrados.map((l) => {
 const { fecha, hora } = formatearFechaHora(l.createdAt);
 return [
 l.id,
 `"${fecha}"`,
 `"${hora}"`,
 `"${l.modulo || ''}"`,
 `"${l.nivel || ''}"`,
 `"${l.accion || ''}"`,
 `"${(l.descripcion || '').replace(/"/g, '""')}"`,
 `"${l.usuario?.nombre || 'Sistema'}"`,
 `"${l.usuario?.rol || '-'}"`,
 `"${l.sucursal?.nombre || 'Acceso Global'}"`,
 `"${l.ip || '-'}"`
 ];
 });

 const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.setAttribute('href', url);
 link.setAttribute('download', `auditoria_ferreteria_${new Date().toISOString().slice(0, 10)}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 toast.success('Reporte de auditoría exportado en CSV');
 };

 // Helper para renderizar icono de acción
 const getIconoAccion = (accion, modulo, nivel) => {
 if (nivel === 'CRITICAL' || accion.includes('ANULAR')) {
 return <FileX className="w-4 h-4 text-rose-500" />;
 }
 if (accion.includes('PASSWORD') || accion.includes('CLAVE')) {
 return <KeyRound className="w-4 h-4 text-amber-500" />;
 }
 if (accion.includes('ROL') || accion.includes('PERMISOS')) {
 return <ShieldCheck className="w-4 h-4 text-purple-500" />;
 }
 if (accion.includes('LOGIN') || accion.includes('ACCESO')) {
 return <UserCheck className="w-4 h-4 text-emerald-500" />;
 }
 if (accion.includes('VENTA') || accion.includes('COMPROBANTE')) {
 return <Receipt className="w-4 h-4 text-emerald-500" />;
 }
 if (accion.includes('CAJA') || accion.includes('ARQUEO')) {
 return <Wallet className="w-4 h-4 text-amber-500" />;
 }
 if (modulo === 'SEDES') {
 return <Building2 className="w-4 h-4 text-purple-500" />;
 }
 return <Activity className="w-4 h-4 text-indigo-500" />;
 };

 return (
 <div className="space-y-5 animate-in fade-in duration-200">
 {/* ─── 1. TARJETAS DE CONTROL & KPIS DE AUDITORÍA (DASHBOARD NEO-SAAS) ─── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
 {/* KPI 1: Eventos Registrados Hoy */}
 <div
 onClick={() => {
 setNivelFiltro('TODOS');
 setModuloFiltro('TODOS');
 }}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 nivelFiltro === 'TODOS' && moduloFiltro === 'TODOS'
 ? 'border-amber-500 ring-2 ring-amber-500/20'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-500'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Eventos Registrados Hoy
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Activity className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 {resumen.totalHoy}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">
 {nivelFiltro === 'TODOS' && moduloFiltro === 'TODOS' ? 'Mostrando todos los eventos' : 'Actividades del día'}
 </span>
 <span
 className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
 nivelFiltro === 'TODOS' && moduloFiltro === 'TODOS'
 ? 'bg-amber-600 text-white'
 : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
 }`}
 >
 {nivelFiltro === 'TODOS' && moduloFiltro === 'TODOS' ? 'Activo' : 'Hoy'}
 </span>
 </div>
 </div>

 {/* KPI 2: Alertas Críticas & Riesgo */}
 <div
 onClick={() => setNivelFiltro((prev) => (prev === 'CRITICAL' ? 'TODOS' : 'CRITICAL'))}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 nivelFiltro === 'CRITICAL'
 ? 'border-rose-500 ring-2 ring-rose-500/20'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-rose-500'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Alertas & Críticos
 </span>
 <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <AlertTriangle className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
 {resumen.alertasCriticas}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">
 {nivelFiltro === 'CRITICAL' ? 'Filtro crítico activo' : 'Anulaciones & modificaciones'}
 </span>
 <span
 className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
 nivelFiltro === 'CRITICAL'
 ? 'bg-rose-600 text-white'
 : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
 }`}
 >
 Riesgo
 </span>
 </div>
 </div>

 {/* KPI 3: Personal Operando */}
 <div
 onClick={() => setModuloFiltro((prev) => (prev === 'USUARIOS' ? 'TODOS' : 'USUARIOS'))}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 moduloFiltro === 'USUARIOS'
 ? 'border-blue-500 ring-2 ring-blue-500/20'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-500'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Personal Operando
 </span>
 <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Users className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 {resumen.totalUsuariosActivos}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">
 {moduloFiltro === 'USUARIOS' ? 'Filtro por equipo activo' : 'Usuarios con actividad hoy'}
 </span>
 <span
 className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
 moduloFiltro === 'USUARIOS'
 ? 'bg-blue-600 text-white'
 : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
 }`}
 >
 Equipo
 </span>
 </div>
 </div>

 {/* KPI 4: Trazabilidad Segura */}
 <div
 onClick={() => setNivelFiltro((prev) => (prev === 'SUCCESS' ? 'TODOS' : 'SUCCESS'))}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 nivelFiltro === 'SUCCESS'
 ? 'border-emerald-500 ring-2 ring-emerald-500/20'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Trazabilidad Segura
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <ShieldCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
 {resumen.totalRegistros}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">
 {nivelFiltro === 'SUCCESS' ? 'Filtro exitosos activo' : 'Operaciones auditadas'}
 </span>
 <span
 className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
 nivelFiltro === 'SUCCESS'
 ? 'bg-emerald-600 text-white'
 : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
 }`}
 >
 Cifrado
 </span>
 </div>
 </div>
 </div>

 {/* ─── 2. BARRA DE HERRAMIENTAS, FILTROS & VISTAS ─── */}
 <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
 {/* Fila 1: Búsqueda, Sede y Acciones Rápidas */}
 <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
 {/* Campo de búsqueda */}
 <div className="relative flex-1">
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por colaborador, acción, descripción o IP..."
 className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
 />
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 {/* Selector de Sede Estilo Píldora Desplegable */}
            <PildoraDesplegableFiltro
              label="Sede"
              icon={Building2}
              valor={sedeFiltro}
              opciones={opcionesSedes}
              onChange={(val) => setSedeFiltro(val)}
            />

 {/* Alternador de Modo: Timeline vs Tabla */}
 <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-700">
 <button
 type="button"
 onClick={() => setVistaModo('timeline')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
 vistaModo === 'timeline'
 ? 'bg-white dark:bg-slate-700 text-indigo-900 dark:text-white shadow-2xs'
 : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
 }`}
 >
 Línea de Tiempo
 </button>
 <button
 type="button"
 onClick={() => setVistaModo('tabla')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
 vistaModo === 'tabla'
 ? 'bg-white dark:bg-slate-700 text-indigo-900 dark:text-white shadow-2xs'
 : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
 }`}
 >
 Tabla
 </button>
 </div>

 {/* Refrescar */}
 <button
 type="button"
 onClick={cargarAuditoria}
 disabled={cargando}
 title="Refrescar auditoría"
 className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer active:scale-95 shrink-0"
 >
 <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-amber-600' : ''}`} />
 </button>

 {/* Exportar CSV */}
 <button
 type="button"
 onClick={exportarCSV}
 className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 shrink-0"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Exportar CSV</span>
 </button>
 </div>
 </div>

 {/* Fila 2: Píldoras de Filtrado por Módulo */}
 <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1 pb-0.5">
 {MODULOS_OPCIONES.map((mod) => {
 const Icon = mod.icon;
 const activo = moduloFiltro === mod.id;
 return (
 <button
 key={mod.id}
 type="button"
 onClick={() => setModuloFiltro(mod.id)}
 className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 activo
 ? 'bg-slate-900 text-white shadow-subpill-active dark:bg-amber-600 dark:text-white'
 : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700/60'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${activo ? 'text-white' : 'text-slate-400'}`} />
 <span>{mod.label}</span>
 </button>
 );
 })}
 </div>

 {/* Fila 3: Filtro por Nivel de Severidad */}
 <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs text-slate-500 font-bold">
 <span className="text-[10.5px] uppercase tracking-wider text-slate-400 mr-1">Severidad:</span>
 {NIVELES_OPCIONES.map((niv) => {
 const activo = nivelFiltro === niv.id;
 return (
 <button
 key={niv.id}
 type="button"
 onClick={() => setNivelFiltro(niv.id)}
 className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
 activo
 ? 'bg-amber-600 text-white shadow-2xs'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
 }`}
 >
 {niv.label}
 </button>
 );
 })}
 </div>
 </div>

 {/* ─── 3. CONTENIDO: TIMELINE VISUAL O TABLA CORPORATIVA ─── */}
 {cargando ? (
 <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
 <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2.5" />
 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider ">
 Cargando registros de auditoría en vivo...
 </p>
 </div>
 ) : logsFiltrados.length === 0 ? (
 <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
 <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
 <h4 className="text-sm font-bold text-slate-800 dark:text-white">Sin registros coincidentes</h4>
 <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
 No se encontraron eventos de auditoría con los filtros seleccionados. Intenta ampliar el rango o buscar otro término.
 </p>
 </div>
 ) : vistaModo === 'timeline' ? (
 /* ─── VISTA FEED / TIMELINE ─── */
 <div className="space-y-3">
 {logsFiltrados.map((item) => {
 const { fecha, hora, relativa } = formatearFechaHora(item.createdAt);
 const esCritico = item.nivel === 'CRITICAL';
 const esAdvertencia = item.nivel === 'WARNING';
 const esExito = item.nivel === 'SUCCESS';

 return (
 <div
 key={item.id}
 onClick={() => handleAbrirDetalle(item)}
 className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer hover:shadow-md group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
 esCritico
 ? 'border-rose-200/90 dark:border-rose-900/40 hover:border-rose-400 bg-rose-50/15'
 : esAdvertencia
 ? 'border-amber-200/90 dark:border-amber-900/40 hover:border-amber-400 bg-amber-50/15'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-400'
 }`}
 >
 {/* Lado izquierdo: Ícono temático + Descripción y autor */}
 <div className="flex items-start gap-3 min-w-0">
 <div
 className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
 esCritico
 ? 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:border-rose-800'
 : esAdvertencia
 ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800'
 : esExito
 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800'
 : 'bg-amber-50 text-amber-600 border-indigo-200 dark:bg-amber-950/60 dark:border-indigo-800'
 }`}
 >
 {getIconoAccion(item.accion, item.modulo, item.nivel)}
 </div>

 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap mb-1">
 <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
 #{item.id}
 </span>
 <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
 {item.modulo}
 </span>
 <span
 className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full ${
 esCritico
 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
 : esAdvertencia
 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
 : esExito
 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
 : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
 }`}
 >
 {item.nivel}
 </span>
 <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
 {item.accion}
 </span>
 </div>

 <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
 {item.descripcion}
 </p>

 <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1.5 flex-wrap">
 <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
 <Users className="w-3 h-3 text-indigo-500" />
 {item.usuario?.nombre || 'Sistema Automatizado'}
 {item.usuario?.rol && (
 <span className="text-[10px] text-slate-400 font-normal">({item.usuario.rol})</span>
 )}
 </span>
 <span>•</span>
 <span className="flex items-center gap-1">
 <Building2 className="w-3 h-3 text-slate-400" />
 {item.sucursal?.nombre || 'Acceso Global / Multi-sede'}
 </span>
 {item.ip && (
 <>
 <span>•</span>
 <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
 IP: {item.ip}
 </span>
 </>
 )}
 </div>
 </div>
 </div>

 {/* Lado derecho: Timestamp & Ver Detalle */}
 <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 gap-1.5">
 <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 ">
 {relativa}
 </span>
 <span className="text-[10px] text-slate-400 font-mono">
 {fecha} • {hora}
 </span>
 <span className="text-[10.5px] text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-bold flex items-center gap-1 mt-1">
 <span>Ver trazabilidad</span>
 <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
 </span>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 /* ─── VISTA TABLA CORPORATIVA ─── */
 <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider ">
 <th className="py-3 px-3.5 min-w-[70px]">ID</th>
 <th className="py-3 px-3 min-w-[130px]">Fecha / Hora</th>
 <th className="py-3 px-3 min-w-[100px]">Módulo</th>
 <th className="py-3 px-3 min-w-[90px]">Nivel</th>
 <th className="py-3 px-3.5 min-w-[260px]">Descripción del Evento</th>
 <th className="py-3 px-3 min-w-[140px]">Colaborador</th>
 <th className="py-3 px-3 min-w-[120px]">Sede</th>
 <th className="py-3 px-3 text-center min-w-[80px]">Acción</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
 {logsFiltrados.map((item) => {
 const { fecha, hora } = formatearFechaHora(item.createdAt);
 const esCritico = item.nivel === 'CRITICAL';
 const esAdvertencia = item.nivel === 'WARNING';

 return (
 <tr
 key={item.id}
 className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
 >
 <td className="py-2.5 px-3.5 font-mono text-slate-400 font-bold">
 #{item.id}
 </td>
 <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
 <div>{fecha}</div>
 <div className="text-[10px] text-slate-400">{hora}</div>
 </td>
 <td className="py-2.5 px-3 font-bold">
 <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
 {item.modulo}
 </span>
 </td>
 <td className="py-2.5 px-3">
 <span
 className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
 esCritico
 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
 : esAdvertencia
 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
 : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
 }`}
 >
 {item.nivel}
 </span>
 </td>
 <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white max-w-sm truncate">
 {item.descripcion}
 </td>
 <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200">
 <div className="font-bold truncate max-w-[130px]">
 {item.usuario?.nombre || 'Sistema'}
 </div>
 <div className="text-[10px] text-slate-400">{item.usuario?.rol || '-'}</div>
 </td>
 <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
 {item.sucursal?.nombre || 'Global'}
 </td>
 <td className="py-2.5 px-3 text-center">
 <button
 type="button"
 onClick={() => handleAbrirDetalle(item)}
 className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-indigo-100 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
 >
 <Eye className="w-3.5 h-3.5" />
 <span>Ver</span>
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {/* ─── 4. MODAL DE DETALLE Y TRAZABILIDAD TÉCNICA ─── */}
 {modalDetalle && logSeleccionado && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalDetalle(false)}
 aria-hidden="true"
 />

 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
 onClick={() => setModalDetalle(false)}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 my-auto text-left"
 >
 {/* Header */}
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/90 rounded-t-2xl sm:rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                Trazabilidad del Evento #{logSeleccionado.id}
              </h3>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate sm:whitespace-normal">
                Módulo {logSeleccionado.modulo} • Acción {logSeleccionado.accion}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalDetalle(false)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation ml-2"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

 {/* Contenido scrolleable */}
 <div className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto custom-modal-scroll text-xs">
 {/* Resumen en tarjeta */}
 <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-2">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
 Descripción Registrada:
 </span>
 <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
 {logSeleccionado.descripcion}
 </p>
 </div>

 {/* Metadatos en dos columnas */}
 <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
 <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
 <span className="text-[10px] font-bold text-slate-400 block uppercase">Colaborador:</span>
 <span className="font-bold text-slate-800 dark:text-white">
 {logSeleccionado.usuario?.nombre || 'Sistema'}
 </span>
 <span className="text-[10px] text-slate-400 block mt-0.5">
 Rol: {logSeleccionado.usuario?.rol || '-'}
 </span>
 </div>

 <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
 <span className="text-[10px] font-bold text-slate-400 block uppercase">Sede de Ejecución:</span>
 <span className="font-bold text-slate-800 dark:text-white">
 {logSeleccionado.sucursal?.nombre || 'Acceso Global Multisede'}
 </span>
 <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
 IP: {logSeleccionado.ip || 'Local / Interna'}
 </span>
 </div>
 </div>

 {/* Datos técnicos JSON */}
 <div>
 <div className="flex items-center justify-between mb-1.5 px-0.5">
 <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider ">
 Carga Útil / Metadatos Técnicos (JSON)
 </span>
 <button
 type="button"
 onClick={handleCopiarDetalle}
 className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
 >
 {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
 <span>{copiado ? 'Copiado' : 'Copiar JSON'}</span>
 </button>
 </div>
 <pre className="p-3 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
 {logSeleccionado.detalles
 ? (() => {
 try {
 return JSON.stringify(JSON.parse(logSeleccionado.detalles), null, 2);
 } catch {
 return logSeleccionado.detalles;
 }
 })()
 : '// Sin metadatos adicionales adjuntos para este evento'}
 </pre>
 </div>
 </div>

 {/* Footer */}
 <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex justify-end shrink-0 backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setModalDetalle(false)}
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
