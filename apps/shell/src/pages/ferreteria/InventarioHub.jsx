import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@heis/core';
import {
 Package,
 HardHat,
 Boxes,
 ArrowLeftRight,
 Layers,
 AlertTriangle,
 Building2,
 Scissors,
 Truck,
 Wrench,
 Hammer
} from 'lucide-react';

const Productos = lazy(() => import('./Productos'));
const MaterialesConstruccion = lazy(() => import('./MaterialesConstruccion'));
const FraccionamientoInventario = lazy(() => import('./FraccionamientoInventario'));
const CustodiaDespachos = lazy(() => import('./CustodiaDespachos'));
const KitsCombos = lazy(() => import('./KitsCombos'));
const AlquilerMaquinaria = lazy(() => import('./AlquilerMaquinaria'));
const ControlStock = lazy(() => import('./ControlStock'));
const TrasladosAlmacen = lazy(() => import('./TrasladosAlmacen'));
const KardexInventario = lazy(() => import('./KardexInventario'));
const AjustesMermas = lazy(() => import('./AjustesMermas'));

function TabLoader() {
 return (
 <div className="flex items-center justify-center p-12 min-h-[350px]">
 <div className="flex flex-col items-center gap-3">
 <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
 Cargando módulo de inventario...
 </span>
 </div>
 </div>
 );
}

export default function InventarioHub() {
 const [searchParams, setSearchParams] = useSearchParams();
 const { user } = useAuthStore();
 const esCajero = user?.rol === 'Cajero';
 const rawTab = searchParams.get('tab') || 'productos';

 // Si alguien entra con ?tab=compras o ?tab=stock-bajo, mapear adecuadamente
 let resolvedTab = rawTab === 'compras'
 ? 'stock'
 : rawTab === 'stock-bajo'
 ? 'stock'
 : rawTab === 'despiece' || rawTab === 'conversion'
 ? 'fraccionamiento'
 : rawTab === 'obra' || rawTab === 'despachos' || rawTab === 'acopio'
 ? 'custodia'
 : rawTab === 'kits' || rawTab === 'ensambles' || rawTab === 'paquetes'
 ? 'combos'
 : rawTab === 'alquiler' || rawTab === 'alquileres' || rawTab === 'maquinaria'
 ? 'alquiler'
 : rawTab;

 // Para cajero, dejar únicamente consulta de catálogo de productos y materiales
 const pestañasPermitidasCajero = ['productos', 'materiales'];
 if (esCajero && !pestañasPermitidasCajero.includes(resolvedTab)) {
   resolvedTab = 'productos';
 }
 const activeTab = resolvedTab;

 const todasLasPestañas = [
 {
 id: 'productos',
 label: 'Catálogo & Herramientas',
 shortLabel: 'Herramientas',
 icon: Package
 },
 {
 id: 'materiales',
 label: 'Materiales & Granel',
 shortLabel: 'Materiales',
 icon: HardHat
 },
 {
 id: 'fraccionamiento',
 label: 'Fraccionamiento & Conversión',
 shortLabel: 'Fraccionamiento',
 icon: Scissors
 },
 {
 id: 'custodia',
 label: 'Custodia & Obra',
 shortLabel: 'Custodia',
 icon: Truck
 },
 {
 id: 'combos',
 label: 'Kits & Combos',
 shortLabel: 'Combos',
 icon: Wrench
 },
 {
 id: 'alquiler',
 label: 'Alquiler & Maquinaria',
 shortLabel: 'Alquiler',
 icon: Hammer
 },
 {
 id: 'stock',
 label: 'Control de Stock',
 shortLabel: 'Stock',
 icon: Boxes
 },
 {
 id: 'traslados',
 label: 'Traslados',
 shortLabel: 'Traslados',
 icon: ArrowLeftRight
 },
 {
 id: 'kardex',
 label: 'Kardex',
 shortLabel: 'Kardex',
 icon: Layers
 },
 {
 id: 'ajustes',
 label: 'Ajustes & Mermas',
 shortLabel: 'Mermas',
 icon: AlertTriangle
 }
 ];

 const tabs = esCajero
   ? todasLasPestañas.filter(t => pestañasPermitidasCajero.includes(t.id))
   : todasLasPestañas;

 const handleTabChange = (tabId) => {
 setSearchParams({ tab: tabId });
 };

 return (
 <div className="space-y-5">
 {/* ─── PÍLDORA BASE FLOTANTE ULTRA-SLIM ENVOLVENTE (SIN SCROLLBAR NI GROSOR EXTRA) ─── */}
 <div className="p-3 sm:p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card-soft space-y-2.5 print:hidden">
 {/* Cabecera / Identificador Superior de la Cápsula */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 px-1">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
 <Boxes className="w-4 h-4 stroke-[2.3]" />
 </div>

 <div className="flex items-center gap-2 flex-wrap min-w-0">
 <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight ">
 {esCajero ? 'Catálogo & Consulta de Precios' : 'Inventario & Control de Existencias'}
 </h1>
 <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 {esCajero ? 'Consulta Activa' : 'Multialmacén Activo'}
 </span>
 <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
 {esCajero
   ? '• Consulta de herramientas, productos ferreteros y materiales a granel'
   : '• Catálogo, Materiales, Fraccionamiento, Custodia, Kits, Alquiler & Maquinaria, Kardex & Mermas'}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <div className="h-8 px-3.5 rounded-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 text-emerald-600 dark:text-emerald-400 shadow-2xs flex items-center gap-1.5 text-xs">
 <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
 <span className="text-[10.5px] font-black uppercase tracking-wider">{esCajero ? 'Precios en Línea' : 'Kardex Permanente'}</span>
 </div>
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
 {isActive && (
 <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs shrink-0 animate-pulse" />
 )}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* ─── PANEL DE CONTENIDO DE LA PESTAÑA ACTIVA ─── */}
 <div key={activeTab} className="pt-1 animate-page-entrance">
 <Suspense fallback={<TabLoader />}>
 {activeTab === 'productos' && <Productos />}
 {activeTab === 'materiales' && <MaterialesConstruccion />}
 {activeTab === 'fraccionamiento' && <FraccionamientoInventario />}
 {activeTab === 'custodia' && <CustodiaDespachos />}
 {activeTab === 'combos' && <KitsCombos />}
 {activeTab === 'alquiler' && <AlquilerMaquinaria />}
 {activeTab === 'stock' && <ControlStock />}
 {activeTab === 'traslados' && <TrasladosAlmacen />}
 {activeTab === 'kardex' && <KardexInventario />}
 {activeTab === 'ajustes' && <AjustesMermas />}
 </Suspense>
 </div>
 </div>
 );
}
