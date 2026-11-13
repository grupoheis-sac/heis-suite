import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 ShieldCheck,
  ChevronDown,
  Check,
 FileSpreadsheet,
 Download,
 Search,
 Filter,
 AlertCircle,
 Building2,
 CheckCircle2,
 Edit2,
 Save,
 X,
 RefreshCw,
 FlaskConical,
 Flame,
 Scale,
 ExternalLink,
 HelpCircle,
 Sparkles,
 Info
} from 'lucide-react';


const OPCIONES_FISCALIZACION = [
  {
    valor: 'SUNAT_IQBF',
    etiqueta: 'SUNAT IQBF (D.L. 1126 - Ácidos, Thinner, Solventes)',
    descripcion: 'Control oficial de Insumos Químicos y Bienes Fiscalizados por SUNAT'
  },
  {
    valor: 'SUCAMEC',
    etiqueta: 'SUCAMEC (Ley 30299 - Fulminantes Ramset/Hilti)',
    descripcion: 'Municiones, explosivos y fulminantes para fijación controlados por SUCAMEC'
  },
  {
    valor: 'NINGUNO',
    etiqueta: 'Ninguno / Sin fiscalización',
    descripcion: 'Producto general sin requerimiento de fiscalización oficial'
  }
];

// Píldora Desplegable con diseño idéntico a otros modales del sistema
function SelectorDesplegablePildora({
  label,
  required = false,
  valor,
  opciones = [],
  onChange
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

  const opcSel = opciones.find(o => String(o.valor) === String(valor)) || opciones[0];

  return (
    <div className={`relative ${abierto ? 'z-40' : 'z-20'}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
          abierto
            ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 shadow-2xs'
        }`}
      >
        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
          {opcSel ? opcSel.etiqueta : valor}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            abierto ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Ventana Desplegable Redondeada (rounded-2xl) */}
      {abierto && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
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
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    estaSel
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="block truncate font-bold">{opc.etiqueta}</span>
                    {opc.descripcion && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block truncate mt-0.5">
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
    </div>
  );
}

export default function FiscalizacionSunatIqbf() {
 const [loading, setLoading] = useState(true);
 const [resumen, setResumen] = useState(null);
 const [productos, setProductos] = useState([]);
 const [busqueda, setBusqueda] = useState('');
 const [filtro, setFiltro] = useState('todos'); // 'todos' | 'sunat_iqbf' | 'sucamec' | 'sin_codigo' | 'con_stock'
 const [mostrarGuia, setMostrarGuia] = useState(false);

 // Modal para edición rápida de código IQBF / SUCAMEC
 const [productoEditando, setProductoEditando] = useState(null);
 const [formFiscal, setFormFiscal] = useState({
 es_fiscalizado: true,
 tipo_fiscalizacion: 'SUNAT_IQBF',
 codigo_iqbf: '',
 norma_tecnica: ''
 });
 const [guardando, setGuardando] = useState(false);

 const cargarDatos = async () => {
 setLoading(true);
 try {
 const [resResumen, resProductos] = await Promise.all([
 api.get('/fiscalizacion/resumen'),
 api.get('/fiscalizacion/productos', { params: { busqueda, filtro } })
 ]);

 if (resResumen && resResumen.success) {
 setResumen(resResumen);
 }
 if (resProductos && resProductos.success) {
 setProductos(resProductos.productos || []);
 }
 } catch (err) {
 toast.error('Error al cargar datos de Fiscalización SUNAT / SUCAMEC.');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, [filtro]);

 useEffect(() => {
 const timer = setTimeout(() => {
 cargarDatos();
 }, 350);
 return () => clearTimeout(timer);
 }, [busqueda]);

 const [descargandoFormato, setDescargandoFormato] = useState(null);

 // Descargar archivo oficial TXT / CSV con autenticación JWT y descarga Blob nativa
 const descargarArchivo = async (formato = 'txt') => {
 try {
 setDescargandoFormato(formato);
 const token = localStorage.getItem('ferre_token') || '';

 const res = await fetch(`/api/fiscalizacion/exportar?formato=${formato}&token=${encodeURIComponent(token)}`, {
 method: 'GET',
 headers: {
 'Authorization': `Bearer ${token}`
 }
 });

 if (!res.ok) {
 let msg = 'Error al exportar archivo de fiscalización';
 try {
 const errData = await res.json();
 if (errData?.message) msg = errData.message;
 } catch (_) {}
 throw new Error(msg);
 }

 const disposition = res.headers.get('content-disposition');
 let filename = formato === 'csv'
 ? `LIBRO_BIENES_FISCALIZADOS_SUNAT_${new Date().toISOString().split('T')[0]}.csv`
 : `DECLARACION_IQBF_SUNAT_${new Date().toISOString().split('T')[0]}.txt`;

 if (disposition && disposition.includes('filename=')) {
 const matches = disposition.match(/filename="?([^"]+)"?/);
 if (matches && matches[1]) {
 filename = matches[1];
 }
 }

 const blob = await res.blob();
 const downloadUrl = window.URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = downloadUrl;
 link.download = filename;
 document.body.appendChild(link);
 link.click();
 window.URL.revokeObjectURL(downloadUrl);
 document.body.removeChild(link);

 toast.success(
 formato === 'txt'
 ? 'Archivo oficial SUNAT IQBF (.txt) descargado correctamente.'
 : 'Padrón de fiscalización Excel (.csv) descargado correctamente.'
 );
 } catch (err) {
 toast.error(err.message || 'Error al exportar el archivo');
 } finally {
 setDescargandoFormato(null);
 }
 };

 const abrirEditor = (producto) => {
 setProductoEditando(producto);
 setFormFiscal({
 es_fiscalizado: Boolean(producto.es_fiscalizado),
 tipo_fiscalizacion: producto.tipo_fiscalizacion || 'SUNAT_IQBF',
 codigo_iqbf: producto.codigo_iqbf || '',
 norma_tecnica: producto.norma_tecnica || ''
 });
 };

 const guardarCodigos = async (e) => {
 e.preventDefault();
 if (!productoEditando) return;

 setGuardando(true);
 try {
 const res = await api.put(`/fiscalizacion/productos/${productoEditando.id}`, formFiscal);
 if (res && res.success) {
 toast.success(res.message);
 setProductoEditando(null);
 cargarDatos();
 }
 } catch (err) {
 toast.error(err.message || 'Error al actualizar clasificación fiscal');
 } finally {
 setGuardando(false);
 }
 };

 const metricas = resumen?.metricas || {
 totalCatalogo: 0,
 totalFiscalizados: 0,
 totalSunatIqbf: 0,
 totalSucamec: 0,
 conCodigoIqbf: 0,
 sinCodigoIqbf: 0,
 conStockDisponible: 0,
 porcentajeCumplimiento: 100,
 estadoSemaforo: 'Optimo'
 };

 const estab = resumen?.establecimiento || {
 ruc: '20608549123',
 nombreComercial: 'FERRETERÍA HEIS & MATERIALES',
 registroIqbf: 'REG-IQBF-2026-LIM-04882',
 sector: 'Comercialización Minorista de Materiales e Insumos Químicos'
 };

 return (
 <div className="space-y-4">
 {/* ─── PÍLDORAS DE FILTRO POR SUBFAMILIAS (ESTILO SLIM MATERIALES & GRANEL) ─── */}
 <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-1 flex-wrap">
 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline ">
 Subfamilias:
 </span>
 <button
 type="button"
 onClick={() => setFiltro('todos')}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
 filtro === 'todos'
 ? 'bg-indigo-600 text-white shadow-2xs font-black'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
 }`}
 >
 <span>Todas</span>
 <span
 className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
 filtro === 'todos'
 ? 'bg-white/25 text-white'
 : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
 }`}
 >
 {metricas.totalFiscalizados}
 </span>
 </button>

 {[
 { id: 'sunat_iqbf', label: 'SUNAT IQBF (Químicos)', count: metricas.totalSunatIqbf },
 { id: 'sucamec', label: 'SUCAMEC (Fulminantes)', count: metricas.totalSucamec },
 { id: 'sin_codigo', label: 'Sin Código Asignado', count: metricas.sinCodigoIqbf },
 { id: 'con_stock', label: 'Con Stock Disponible', count: metricas.conStockDisponible }
 ].map((f) => {
 const isSelected = filtro === f.id;
 return (
 <button
 key={f.id}
 type="button"
 onClick={() => setFiltro(f.id)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
 isSelected
 ? 'bg-indigo-600 text-white shadow-2xs font-black'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
 }`}
 >
 <span>{f.label}</span>
 <span
 className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
 isSelected
 ? 'bg-white/25 text-white'
 : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
 }`}
 >
 {f.count}
 </span>
 </button>
 );
 })}
 </div>

 <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
 {productos.length} {productos.length === 1 ? 'producto fiscalizado' : 'productos fiscalizados'}
 </span>
 </div>

 {/* ─── 4 TARJETAS EJECUTIVAS KPI (ESTILO DASHBOARD LIMPIO & ELEGANTE) ─── */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
 {/* Total Fiscalizados */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Bienes Fiscalizados
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <ShieldCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
 {metricas.totalFiscalizados}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 De {metricas.totalCatalogo} en catálogo
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Controlados
 </span>
 </div>
 </div>

 {/* Químicos SUNAT IQBF */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 SUNAT IQBF (Químicos)
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <FlaskConical className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-300 tracking-tight truncate">
 {metricas.totalSunatIqbf}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Ácidos, thinner & solventes
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 D.L. 1126
 </span>
 </div>
 </div>

 {/* Regulados SUCAMEC */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 SUCAMEC (Fijaciones)
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <Flame className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {metricas.totalSucamec}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Fulminantes Ramset/Hilti
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 Ley 30299
 </span>
 </div>
 </div>

 {/* Cumplimiento Semáforo */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Cumplimiento Códigos
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {metricas.porcentajeCumplimiento}%
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 {metricas.sinCodigoIqbf > 0 ? `${metricas.sinCodigoIqbf} por codificar` : 'Padrón al 100%'}
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 {metricas.estadoSemaforo}
 </span>
 </div>
 </div>
 </div>

 {/* ─── FILA DE BÚSQUEDA Y ACCIONES (ESTILO MATERIALES & GRANEL) ─── */}
 <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
 <div className="relative flex-1 sm:max-w-md">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por nombre comercial, código IQBF, marca..."
 className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
 />
 {busqueda && (
 <button
 type="button"
 onClick={() => setBusqueda('')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="flex items-center gap-2 shrink-0 flex-wrap">
 <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 mr-1 hidden xl:inline">
 RUC: <strong className="text-slate-700 dark:text-slate-200 font-mono">{estab.ruc}</strong> • Registro IQBF: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{estab.registroIqbf}</strong>
 </div>

 <button
 type="button"
 onClick={() => setMostrarGuia(!mostrarGuia)}
 className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs shrink-0 ${
 mostrarGuia
 ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
 : 'border-slate-200/80 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
 }`}
 >
 <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 <span>{mostrarGuia ? 'Ocultar Guía' : 'Normativa SUNAT'}</span>
 </button>

 <button
 type="button"
 disabled={descargandoFormato !== null}
 onClick={() => descargarArchivo('txt')}
 className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
 >
 {descargandoFormato === 'txt' ? (
 <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
 ) : (
 <Download className="w-3.5 h-3.5" />
 )}
 <span>Exportar SUNAT (.txt)</span>
 </button>

 <button
 type="button"
 disabled={descargandoFormato !== null}
 onClick={() => descargarArchivo('csv')}
 className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
 >
 {descargandoFormato === 'csv' ? (
 <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
 ) : (
 <FileSpreadsheet className="w-3.5 h-3.5" />
 )}
 <span>Excel (.csv)</span>
 </button>
 </div>
 </div>

 {/* Guía Informativa Desplegable */}
 {mostrarGuia && (
 <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-150">
 <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 space-y-1">
 <span className="font-bold text-violet-700 dark:text-violet-400 text-xs block ">
 1. SUNAT IQBF (D.L. 1126):
 </span>
 <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
 Todo traslado y compra de thinner, ácido muriático o solventes debe contar con <strong>Guía de Remisión Fiscalizada</strong> y registrarse con su respectivo código IQBF en el libro diario.
 </p>
 </div>
 <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 space-y-1">
 <span className="font-bold text-amber-700 dark:text-amber-400 text-xs block ">
 2. SUCAMEC (Ley 30299):
 </span>
 <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
 Los <strong>fulminantes Ramset/Hilti</strong> propulsados por pólvora para tiro en concreto requieren control estricto de ingreso, prohibición de venta a menores y registro de salida.
 </p>
 </div>
 <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-1">
 <span className="font-bold text-sky-700 dark:text-sky-400 text-xs block ">
 3. Infracciones y Sanciones:
 </span>
 <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
 La comercialización sin registro especial o circular productos sin código oficial acarrea incautación policial/aduanera y multas de hasta <strong>10 UIT</strong>.
 </p>
 </div>
 </div>
 )}

 {/* ─── TABLA COMPACTA DEL PADRÓN DE BIENES FISCALIZADOS ─── */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700 text-[11px] uppercase tracking-wider ">
 <th className="py-2.5 px-3.5 font-bold">CÓDIGO / SKU</th>
 <th className="py-2.5 px-3.5 font-bold">PRODUCTO / DENOMINACIÓN COMERCIAL</th>
 <th className="py-2.5 px-3.5 font-bold">ENTIDAD FISCALIZADORA</th>
 <th className="py-2.5 px-3.5 font-bold">CÓDIGO OFICIAL IQBF / AUTORIZACIÓN</th>
 <th className="py-2.5 px-3.5 font-bold">UBICACIÓN / DEPÓSITO</th>
 <th className="py-2.5 px-3.5 font-bold text-center">STOCK ACTUAL</th>
 <th className="py-2.5 px-3.5 font-bold text-center">ESTADO</th>
 <th className="py-2.5 px-3.5 font-bold text-center">ACCIÓN</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {loading ? (
 <tr>
 <td colSpan="8" className="py-10 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-2">
 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span className="font-medium text-xs">Consultando padrón fiscalizado...</span>
 </div>
 </td>
 </tr>
 ) : productos.length === 0 ? (
 <tr>
 <td colSpan="8" className="py-12 text-center text-slate-400">
 <FlaskConical className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
 <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">No se encontraron productos fiscalizados con este filtro</p>
 <p className="text-xs text-slate-400 mt-0.5">
 Usa el buscador o asigna la clasificación fiscal a tus pinturas, solventes y fulminantes
 </p>
 </td>
 </tr>
 ) : (
 productos.map((prod) => {
 const tieneCodigo = prod.codigo_iqbf && prod.codigo_iqbf.trim().length > 0;
 const isSunat = prod.tipo_fiscalizacion === 'SUNAT_IQBF';
 const isSucamec = prod.tipo_fiscalizacion === 'SUCAMEC';

 return (
 <tr key={prod.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors">
 <td className="py-2 px-3.5 font-mono font-bold text-slate-500 dark:text-slate-400">
 {prod.codigo_barras || `ID-${prod.id}`}
 </td>
 <td className="py-2 px-3.5">
 <div className="font-bold text-slate-800 dark:text-white leading-tight">
 {prod.nombre}
 </div>
 <div className="text-[10px] text-slate-400 dark:text-slate-500">
 Marca: <strong className="text-slate-600 dark:text-slate-300">{prod.marca || 'Genérico'}</strong> • Unidad: <span className="font-mono">{prod.unidad_medida}</span>
 </div>
 </td>
 <td className="py-2 px-3.5">
 {isSunat ? (
 <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200/80 dark:border-violet-800/60 inline-flex items-center gap-1 ">
 <FlaskConical className="w-3 h-3 text-violet-600 dark:text-violet-400" />
 SUNAT IQBF
 </span>
 ) : isSucamec ? (
 <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 inline-flex items-center gap-1 ">
 <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
 SUCAMEC
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ">
 GENERAL
 </span>
 )}
 </td>
 <td className="py-2 px-3.5 font-mono font-bold">
 {tieneCodigo ? (
 <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60">
 {prod.codigo_iqbf}
 </span>
 ) : (
 <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200/60 dark:border-rose-800/60 flex items-center gap-1 w-fit ">
 <AlertCircle className="w-3 h-3" />
 SIN CÓDIGO
 </span>
 )}
 </td>
 <td className="py-2 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
 {prod.ubicacion || 'Depósito General'}
 </td>
 <td className="py-2 px-3.5 text-center font-black">
 <span className={parseFloat(prod.stock) > 0 ? 'text-slate-800 dark:text-white' : 'text-rose-500'}>
 {parseFloat(prod.stock).toFixed(2)} {prod.unidad_medida}
 </span>
 </td>
 <td className="py-2 px-3.5 text-center">
 {tieneCodigo ? (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 uppercase ">
 Conforme
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 uppercase ">
 Pendiente
 </span>
 )}
 </td>
 <td className="py-2 px-3.5 text-center">
 <button
 type="button"
 onClick={() => abrirEditor(prod)}
 title="Asignar o editar código fiscal IQBF / SUCAMEC"
 className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10.5px] transition-colors cursor-pointer flex items-center gap-1 mx-auto "
 >
 <Edit2 className="w-3 h-3" />
 <span>Editar</span>
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

 {/* ─── MODAL EDICIÓN RÁPIDA DE CÓDIGO IQBF / SUCAMEC CON CREATEPORTAL (COBERTURA TOPBAR 100%) ─── */}
 {productoEditando &&
 createPortal(
 <div
 onClick={(e) => {
 if (e.target === e.currentTarget) setProductoEditando(null);
 }}
 className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-lg w-full p-0 overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
 >
 {/* Cabecera */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/70 dark:bg-slate-800/60 rounded-t-3xl">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                Clasificación de Fiscalización
              </h3>
              <p className="text-[10.5px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {productoEditando.nombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProductoEditando(null)}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={guardarCodigos} className="p-5 space-y-4">
 {/* Checkbox es fiscalizado */}
 <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
 <input
 type="checkbox"
 checked={formFiscal.es_fiscalizado}
 onChange={(e) => setFormFiscal({ ...formFiscal, es_fiscalizado: e.target.checked })}
 className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
 />
 <div>
 <span className="font-bold text-xs text-slate-800 dark:text-white block ">
 Producto Sujeto a Fiscalización Oficial
 </span>
 <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
 Actívalo para químicos fiscalizados por SUNAT o fulminantes SUCAMEC
 </span>
 </div>
 </label>

 {formFiscal.es_fiscalizado && (
 <div className="space-y-3.5">
 <SelectorDesplegablePildora
                label="Entidad Fiscalizadora Competente"
                required={true}
                valor={formFiscal.tipo_fiscalizacion}
                opciones={OPCIONES_FISCALIZACION}
                onChange={(val) => setFormFiscal({ ...formFiscal, tipo_fiscalizacion: val })}
              />

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Código Oficial del Bien Fiscalizado (IQBF / Autorización) *
 </label>
 <input
 type="text"
 value={formFiscal.codigo_iqbf}
 onChange={(e) => setFormFiscal({ ...formFiscal, codigo_iqbf: e.target.value })}
 placeholder="Ej: IQBF-2806-10 (Ácido Clorhídrico) o IQBF-2902-30 (Thinner)"
 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-hidden focus:border-indigo-500"
 />
 <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
 Código asignado en el portal de SUNAT Bienes Fiscalizados.
 </span>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Norma Técnica Peruana / Base Legal (Opcional)
 </label>
 <input
 type="text"
 value={formFiscal.norma_tecnica}
 onChange={(e) => setFormFiscal({ ...formFiscal, norma_tecnica: e.target.value })}
 placeholder="Ej: D.L. 1126, NTP 341.031..."
 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden focus:border-indigo-500"
 />
 </div>
 </div>
 )}

 <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setProductoEditando(null)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer shadow-2xs text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {guardando ? (
 <>
 <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span>Guardando...</span>
 </>
 ) : (
 <>
 <Save className="w-4 h-4" />
 <span>Guardar Clasificación</span>
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>,
 document.body
 )}
 </div>
 );
}
