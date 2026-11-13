import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@heis/core';
import ModalProducto from './components/ModalProducto';
import {
 HardHat,
 Search,
 Plus,
 RefreshCw,
 Edit2,
 Package,
 Layers,
 Truck,
 Calculator,
 AlertTriangle,
 X,
 Check,
 ChevronDown,
 Building2,
 Boxes,
 MapPin,
 Scale,
 Filter
} from 'lucide-react';

export default function MaterialesConstruccion() {
 const { user } = useAuthStore();
 const esCajero = user?.rol === 'Cajero';
 const [, setSearchParams] = useSearchParams();
 const [materiales, setMateriales] = useState([]);
 const [categorias, setCategorias] = useState([]);
 const [proveedores, setProveedores] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState('');
 const [filtroTipo, setFiltroTipo] = useState('todos');
 const [soloStockBajo, setSoloStockBajo] = useState(false);

 // Modales
 const [modalAbierto, setModalAbierto] = useState(false);
 const [modalCalculadora, setModalCalculadora] = useState(false);
 const [materialEditar, setMaterialEditar] = useState(null);

 // Calculadora de Mortero y Concreto
 const [calcTipo, setCalcTipo] = useState('concreto');
 const [calcMetrosCubicos, setCalcMetrosCubicos] = useState('1');
 const [calcResultado, setCalcResultado] = useState(null);

 // Bloquear scroll de fondo cuando la calculadora esté abierta
 useEffect(() => {
 if (modalCalculadora) {
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 return () => {
 document.body.style.overflow = originalOverflow;
 };
 }
 }, [modalCalculadora]);

 const cargarDatos = async () => {
 setCargando(true);
 try {
 const [resProd, resCat, resProv] = await Promise.all([
 api.get('/productos?limit=250'),
 api.get('/categorias'),
 api.get('/proveedores').catch(() => ({ success: false, proveedores: [] }))
 ]);

 if (resProd.success) {
 // Identificar materiales de construcción típicos de ferretería
 const mats = (resProd.productos || []).filter(p => {
 const u = (p.unidad_medida || '').toLowerCase();
 const n = (p.nombre || '').toLowerCase();
 const cat = (p.categoria?.nombre || '').toLowerCase();
 return (
 p.es_material_construccion ||
 u.includes('bolsa') ||
 u.includes('varilla') ||
 u.includes('kilo') ||
 u.includes('metro') ||
 u.includes('m2') ||
 u.includes('m²') ||
 u.includes('m3') ||
 u.includes('m³') ||
 u.includes('tubo') ||
 u.includes('plancha') ||
 u.includes('galon') ||
 u.includes('balde') ||
 u.includes('litro') ||
 u.includes('tonelada') ||
 n.includes('cemento') ||
 n.includes('fierro') ||
 n.includes('arena') ||
 n.includes('yeso') ||
 n.includes('pvc') ||
 n.includes('cable') ||
 n.includes('alambre') ||
 n.includes('ladrillo') ||
 n.includes('tubo') ||
 n.includes('pintura') ||
 cat.includes('construc') ||
 cat.includes('tuber') ||
 cat.includes('electric')
 );
 });
 setMateriales(mats);
 }
 if (resCat.success) setCategorias(resCat.categorias || []);
 if (resProv.success) setProveedores(resProv.proveedores || []);
 } catch (e) {
 toast.error('Error al cargar materiales de construcción');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 // Calcular materiales para obra
 useEffect(() => {
 const m3 = parseFloat(calcMetrosCubicos) || 0;
 if (m3 <= 0) {
 setCalcResultado(null);
 return;
 }

 if (calcTipo === 'concreto') {
 // Concreto estándar 210 kg/cm2 por cada m3 aprox: 9.73 bolsas cemento, 0.52 m3 arena, 0.53 m3 piedra
 setCalcResultado({
 cemento: (m3 * 9.7).toFixed(1) + ' Bolsas (42.5kg)',
 arena: (m3 * 0.52).toFixed(2) + ' m³ (Arena gruesa)',
 piedra: (m3 * 0.53).toFixed(2) + ' m³ (Piedra chancada 1/2")',
 agua: (m3 * 185).toFixed(0) + ' Litros aprox.'
 });
 } else if (calcTipo === 'tarrajeo') {
 // Tarrajeo 1:4 espesor 1.5cm por cada 10m2: 1.4 bolsas cemento, 0.2 m3 arena fina
 setCalcResultado({
 cemento: (m3 * 1.5).toFixed(1) + ' Bolsas de Cemento',
 arena: (m3 * 0.25).toFixed(2) + ' m³ Arena Fina',
 agua: (m3 * 40).toFixed(0) + ' Litros aprox.',
 rendimiento: `Rendimiento estimado para ${m3} m² de muro`
 });
 } else if (calcTipo === 'fierro') {
 // Estimación de fierro por peso teórico varilla 9 metros
 setCalcResultado({
 fierro12: (m3 * 0.888 * 9).toFixed(2) + ' kg (Varilla 1/2" x 9m = 8.0 kg/varilla)',
 fierro38: (m3 * 0.560 * 9).toFixed(2) + ' kg (Varilla 3/8" x 9m = 5.0 kg/varilla)',
 alambre: (m3 * 0.35).toFixed(2) + ' kg Alambre #16 para amarre'
 });
 }
 }, [calcTipo, calcMetrosCubicos]);

 // Métricas rápidas de subfamilias
 const totalMateriales = materiales.length;
 const countCemento = materiales.filter(m => {
 const n = (m.nombre || '').toLowerCase();
 return n.includes('cemento') || n.includes('yeso');
 }).length;
 const countFierro = materiales.filter(m => {
 const n = (m.nombre || '').toLowerCase();
 return n.includes('fierro') || n.includes('alambre') || n.includes('varilla');
 }).length;
 const countTuberias = materiales.filter(m => {
 const n = (m.nombre || '').toLowerCase();
 return n.includes('pvc') || n.includes('tubo');
 }).length;
 const countElectricidad = materiales.filter(m => {
 const n = (m.nombre || '').toLowerCase();
 const cat = (m.categoria?.nombre || '').toLowerCase();
 return n.includes('cable') || cat.includes('electr');
 }).length;
 const totalBajos = materiales.filter(m => parseFloat(m.stock || 0) <= parseFloat(m.stock_minimo || 5)).length;

 const materialesFiltrados = materiales.filter(m => {
 const matchBusq = !busqueda || 
 m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
 (m.codigo_barras && m.codigo_barras.toLowerCase().includes(busqueda.toLowerCase())) ||
 (m.marca && m.marca.toLowerCase().includes(busqueda.toLowerCase()));

 if (!matchBusq) return false;

 if (soloStockBajo) {
 return parseFloat(m.stock || 0) <= parseFloat(m.stock_minimo || 5);
 }

 if (filtroTipo === 'cemento') {
 return m.nombre.toLowerCase().includes('cemento') || m.nombre.toLowerCase().includes('yeso');
 }
 if (filtroTipo === 'fierro') {
 return m.nombre.toLowerCase().includes('fierro') || m.nombre.toLowerCase().includes('alambre') || m.nombre.toLowerCase().includes('varilla');
 }
 if (filtroTipo === 'tuberias') {
 return m.nombre.toLowerCase().includes('pvc') || m.nombre.toLowerCase().includes('tubo');
 }
 if (filtroTipo === 'electricidad') {
 return m.nombre.toLowerCase().includes('cable') || (m.categoria?.nombre || '').toLowerCase().includes('electr');
 }
 return true;
 });

 const abrirNuevo = () => {
  if (esCajero) {
   toast.error('No tienes permisos para registrar materiales (Rol Cajero)');
   return;
  }
 setMaterialEditar(null);
 setModalAbierto(true);
 };

 const abrirEditar = (m) => {
  if (esCajero) {
   toast.error('No tienes permisos para editar materiales o precios (Rol Cajero)');
   return;
  }
 setMaterialEditar(m);
 setModalAbierto(true);
 };

 return (
 <div className="space-y-4">
 {/* ─── PÍLDORAS DE FILTRO POR SUBFAMILIAS (ESTILO SLIM PRODUCTOS) ─── */}
 <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-1 flex-wrap">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
 Subfamilias:
 </span>
 <button
 type="button"
 onClick={() => {
 setFiltroTipo('todos');
 setSoloStockBajo(false);
 }}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
 filtroTipo === 'todos' && !soloStockBajo
 ? 'bg-indigo-600 text-white shadow-2xs font-black'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
 }`}
 >
 <span>Todas</span>
 <span
 className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
 filtroTipo === 'todos' && !soloStockBajo
 ? 'bg-white/25 text-white'
 : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
 }`}
 >
 {totalMateriales}
 </span>
 </button>

 {[
 { id: 'cemento', label: 'Cemento & Yeso', count: countCemento },
 { id: 'fierro', label: 'Fierro & Alambre', count: countFierro },
 { id: 'tuberias', label: 'Tuberías PVC', count: countTuberias },
 { id: 'electricidad', label: 'Cables & Redes', count: countElectricidad }
 ].map(f => {
 const isSelected = filtroTipo === f.id && !soloStockBajo;
 return (
 <button
 key={f.id}
 type="button"
 onClick={() => {
 setFiltroTipo(f.id);
 setSoloStockBajo(false);
 }}
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

 <button
 type="button"
 onClick={() => setSoloStockBajo(!soloStockBajo)}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
 soloStockBajo
 ? 'bg-amber-600 text-white shadow-2xs font-black'
 : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
 }`}
 >
 <AlertTriangle className="w-3 h-3 text-amber-500" />
 <span>Stock Bajo</span>
 <span
 className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
 soloStockBajo ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'
 }`}
 >
 {totalBajos}
 </span>
 </button>
 </div>

 <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
 {materialesFiltrados.length} {materialesFiltrados.length === 1 ? 'material' : 'materiales'}
 </span>
 </div>

 {/* ─── FILA DE BÚSQUEDA Y ACCIONES ─── */}
 <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
 <div className="relative flex-1 sm:max-w-md">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar cemento, fierro, PVC..."
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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

 <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setModalCalculadora(true)}
              className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs shrink-0 truncate"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Calculadora <span className="hidden sm:inline">de Obra</span></span>
            </button>

            {esCajero ? (
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 select-none shadow-2xs">
                <HardHat className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Modo Consulta</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={abrirNuevo}
                className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Nuevo Material</span>
              </button>
            )}
          </div>
        </div>

      {/* ─── TABLA COMPACTA DE MATERIALES DE CONSTRUCCIÓN ─── */}
 {cargando ? (
 <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
 <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
 <p className="text-xs font-bold text-slate-500">Cargando catálogo de materiales pesados...</p>
 </div>
 ) : materialesFiltrados.length === 0 ? (
 <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
 <HardHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
 <h4 className="text-sm font-black text-slate-700">No se encontraron materiales</h4>
 <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los filtros de búsqueda o registra un nuevo material.</p>
 </div>
 ) : (
 <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10.5px] font-extrabold">
 <tr>
 <th className="py-2.5 px-3.5 whitespace-nowrap">CÓDIGO</th>
 <th className="py-2.5 px-3.5 min-w-[200px]">MATERIAL / ESPECIFICACIÓN</th>
 <th className="py-2.5 px-3.5 whitespace-nowrap">MARCA</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">PRESENTACIÓN</th>
 <th className="py-2.5 px-3.5 min-w-[130px]">UBICACIÓN ALMACÉN</th>
 {!esCajero && (
  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">P. COMPRA</th>
 )}
 <th className="py-2.5 px-3.5 text-right whitespace-nowrap">P. VENTA</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">STOCK DISPONIBLE</th>
 {!esCajero && (
  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ACCIONES</th>
 )}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {materialesFiltrados.map((m) => {
 const stockNum = parseFloat(m.stock) || 0;
 const minNum = parseFloat(m.stock_minimo) || 0;
 const esAgotado = stockNum <= 0;
 const esCritico = !esAgotado && stockNum <= minNum;

 return (
 <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
 {/* Código */}
 <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-bold text-slate-700">
 {m.codigo_barras ? (
 <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200/60">
 {m.codigo_barras}
 </span>
 ) : (
 <span className="text-slate-400 italic">S/C</span>
 )}
 </td>

 {/* Nombre & Categoría */}
 <td className="py-2.5 px-3.5">
 <div className="font-extrabold text-slate-900 leading-tight">
 {m.nombre}
 </div>
 {m.categoria && (
 <div className="text-[10px] text-slate-400 font-medium mt-0.5">
 {m.categoria.nombre}
 </div>
 )}
 </td>

 {/* Marca */}
 <td className="py-2.5 px-3.5 whitespace-nowrap">
 <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10.5px]">
 {m.marca || 'Genérica'}
 </span>
 </td>

 {/* Presentación / Unidad */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10.5px] border border-indigo-200/60">
 {m.unidad_medida || 'Unidad'}
 </span>
 </td>

 {/* Ubicación */}
 <td className="py-2.5 px-3.5 text-slate-600 text-[11px]">
 <span className="flex items-center gap-1 truncate max-w-[170px]" title={m.ubicacion}>
 <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
 <span className="truncate">{m.ubicacion || 'Almacén Central'}</span>
 </span>
 </td>

 {/* Precio Compra */}
 {!esCajero && (
  <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono text-slate-500 text-xs">
  S/ {parseFloat(m.precio_compra || 0).toFixed(2)}
  </td>
 )}

 {/* Precio Venta */}
 <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono font-black text-slate-900 text-xs">
 S/ {parseFloat(m.precio_venta || 0).toFixed(2)}
 </td>

 {/* Stock */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span
 className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
 esAgotado
 ? 'bg-rose-50 text-rose-700 border-rose-200/80'
 : esCritico
 ? 'bg-amber-50 text-amber-700 border-amber-200/80'
 : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
 }`}
 >
 <span
 className={`w-1.5 h-1.5 rounded-full ${
 esAgotado ? 'bg-rose-500' : esCritico ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
 }`}
 />
 <span className="font-mono font-black">{stockNum}</span>
 <span className="text-[9.5px] font-semibold">{m.unidad_medida}</span>
 </span>
 </td>

 {/* Acciones */}
 {!esCajero && (
  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
  <div className="flex items-center justify-center gap-1">
  <button
  type="button"
  onClick={() => setSearchParams({ tab: 'kardex', busqueda: m.nombre })}
  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
  title="Ver Historial Kardex"
  >
  <Layers className="w-3.5 h-3.5" />
  </button>
  <button
  type="button"
  onClick={() => abrirEditar(m)}
  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
  title="Editar Material"
  >
  <Edit2 className="w-3.5 h-3.5" />
  </button>
  </div>
  </td>
 )}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* ─── MODAL CALCULADORA DE MATERIALES DE CONSTRUCCIÓN ─── */}
      {modalCalculadora && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop estático e independiente */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setModalCalculadora(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
            onClick={() => setModalCalculadora(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      Calculadora de Rendimiento de Obra
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Cálculo técnico estimado para cotización y despacho
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalCalculadora(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                  title="Cerrar calculadora"
                >
                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Cuerpo Scrolleable */}
              <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Partida / Mezcla
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'concreto', label: 'Concreto 210' },
                      { id: 'tarrajeo', label: 'Tarrajeo Muro' },
                      { id: 'fierro', label: 'Peso Fierro' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCalcTipo(t.id)}
                        className={`py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center border cursor-pointer truncate ${
                          calcTipo === t.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {calcTipo === 'concreto'
                      ? 'Metros Cúbicos (m³) de vaciado'
                      : calcTipo === 'tarrajeo'
                      ? 'Metros Cuadrados (m²) de muro'
                      : 'Cantidad de varillas requeridas'}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={calcMetrosCubicos}
                    onChange={(e) => setCalcMetrosCubicos(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {calcResultado && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5">
                    <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Materiales sugeridos para despacho:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                      {Object.entries(calcResultado).map(([k, v]) => (
                        <div key={k} className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 flex flex-col shadow-2xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 truncate">{k}</span>
                          <span className="font-black text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm mt-0.5">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
              <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 z-20">
                <button
                  type="button"
                  onClick={() => setModalCalculadora(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Cerrar Calculadora
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL UNIFICADO NUEVO / EDITAR MATERIAL (Solo Admin) ─── */}
      {!esCajero && (
        <ModalProducto
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onSuccess={cargarDatos}
          productoEditar={materialEditar}
          categorias={categorias}
          proveedores={proveedores}
          modoConstruccion={true}
        />
      )}
 </div>
 );
}
