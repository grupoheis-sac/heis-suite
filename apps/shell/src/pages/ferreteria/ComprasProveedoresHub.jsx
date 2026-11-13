import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
 FileText,
 PackageCheck,
 Truck,
 ShieldCheck
} from 'lucide-react';

const Compras = lazy(() => import('./Compras'));
const OrdenesCompra = lazy(() => import('./OrdenesCompra'));
const Proveedores = lazy(() => import('./Proveedores'));
const FiscalizacionSunatIqbf = lazy(() => import('./FiscalizacionSunatIqbf'));

function TabLoader() {
 return (
 <div className="flex items-center justify-center p-12 min-h-[380px] bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-800 backdrop-blur-xs">
 <div className="flex flex-col items-center gap-3">
 <div className="relative">
 <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
 <div className="absolute inset-0 flex items-center justify-center">
 <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
 </div>
 </div>
 <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ">
 Cargando módulo de abastecimiento...
 </span>
 </div>
 </div>
 );
}

export default function ComprasProveedoresHub() {
 const [searchParams, setSearchParams] = useSearchParams();
 const rawTab = searchParams.get('tab') || 'registro';

 // Normalización de tabs por compatibilidad
 const activeTab = rawTab === 'compras'
 ? 'registro'
 : rawTab;

 const tabs = [
 {
 id: 'registro',
 label: 'Registro de Compras',
 sublabel: 'Facturas & ingreso a almacén',
 mobileLabel: 'Compras',
 icon: FileText,
 badge: 'Kardex Directo',
 tooltip: 'Facturas de compra, ingreso de mercadería a almacén y actualización de Kardex'
 },
 {
 id: 'ordenes',
 label: 'Órdenes de Compra',
 sublabel: 'Emisión & seguimiento a fletes',
 mobileLabel: 'Órdenes',
 icon: PackageCheck,
 badge: 'Fletes',
 tooltip: 'Emisión de órdenes de compra, seguimiento y recepción directa en almacén'
 },
 {
 id: 'proveedores',
 label: 'Distribuidores & Proveedores',
 sublabel: 'Marcas, RUC y cuentas bancarias',
 mobileLabel: 'Proveedores',
 icon: Truck,
 badge: 'Líneas Crédito',
 tooltip: 'Directorio de marcas, líneas de crédito, RUC y cuentas bancarias'
 },
 {
 id: 'fiscalizacion',
 label: 'Fiscalización SUNAT IQBF',
 sublabel: 'Thinner, ácidos y SUCAMEC',
 mobileLabel: 'IQBF SUNAT',
 icon: ShieldCheck,
 badge: 'D.L. 1126',
 tooltip: 'Insumos químicos fiscalizados D.L. 1126, thinner, ácidos y fulminantes SUCAMEC'
 }
 ];

 const handleTabChange = (tabId) => {
 setSearchParams({ tab: tabId });
 };

 return (
 <div className="space-y-5">
 {/* ─── PÍLDORA BASE FLOTANTE ULTRA-SLIM ENVOLVENTE (SIN SCROLLBAR NI GROSOR EXTRA) ─── */}
 <div className="p-3 sm:p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card-soft space-y-2.5">
 {/* Cabecera / Identificador Superior de la Cápsula */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 px-1">
 {/* Lado izquierdo: Ícono squircle + Título destacado + Status */}
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
 <Truck className="w-4 h-4 stroke-[2.3]" />
 </div>

 <div className="flex items-center gap-2 flex-wrap min-w-0">
 <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight ">
 Compras & Proveedores
 </h1>
 <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Abastecimiento Activo
 </span>
 <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
 • Órdenes, Facturas, Créditos & IQBF SUNAT
 </span>
 </div>
 </div>

 {/* Lado derecho: Insignia de estado en cápsula */}
 <div className="flex items-center gap-2 shrink-0">
 <div className="h-8 px-3.5 rounded-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 text-emerald-600 dark:text-emerald-400 shadow-2xs flex items-center gap-1.5 text-xs">
 <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
 <span className="text-[10.5px] font-black uppercase tracking-wider">Kardex & IQBF Activo</span>
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
 {t.badge && !isActive && (
 <span className="hidden xl:inline px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
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

 {/* ─── PANEL DE CONTENIDO DE LA PESTAÑA ACTIVA CON SUSPENSE ─── */}
 <div key={activeTab} className="pt-1 animate-page-entrance">
 <Suspense fallback={<TabLoader />}>
 {activeTab === 'registro' && <Compras />}
 {activeTab === 'ordenes' && <OrdenesCompra />}
 {activeTab === 'proveedores' && <Proveedores />}
 {activeTab === 'fiscalizacion' && <FiscalizacionSunatIqbf />}
 </Suspense>
 </div>
 </div>
 );
}
