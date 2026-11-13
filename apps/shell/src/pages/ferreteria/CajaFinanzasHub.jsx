import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@heis/core';
import {
 Wallet,
 Clock,
 CreditCard,
 CircleDollarSign,
 TrendingUp,
 ShieldCheck,
 Receipt
} from 'lucide-react';

const Caja = lazy(() => import('./Caja'));
const HistorialCajas = lazy(() => import('./HistorialCajas'));
const Creditos = lazy(() => import('./Creditos'));

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
 Cargando módulo financiero...
 </span>
 </div>
 </div>
 );
}

export default function CajaFinanzasHub() {
 const [searchParams, setSearchParams] = useSearchParams();
 const { user } = useAuthStore();
 const esCajero = user?.rol === 'Cajero';
 const rawTab = searchParams.get('tab') || 'caja';
 const pestañasValidas = esCajero
  ? ['caja', 'turnos', 'creditos', 'cobrar']
  : ['caja', 'turnos', 'creditos', 'cobrar', 'pagar'];

 const activeTab = pestañasValidas.includes(rawTab) ? rawTab : 'caja';

 const todasLasPestañas = [
 {
 id: 'caja',
 label: 'Caja Chica en Vivo',
 sublabel: 'Turno actual & gaveta',
 mobileLabel: 'Caja Chica',
 icon: Wallet,
 badge: 'Turno Vivo'
 },
 {
 id: 'turnos',
 label: 'Turnos y Arqueos',
 sublabel: 'Auditoría & cuadres',
 mobileLabel: 'Arqueos',
 icon: Clock
 },
 {
 id: 'creditos',
 label: 'Créditos & Cuentas por Cobrar',
 sublabel: 'Líneas mayoristas & cobranzas',
 mobileLabel: 'Por Cobrar',
 icon: CreditCard
 },
 {
 id: 'pagar',
 label: 'Cuentas por Pagar Proveedores',
 sublabel: 'Facturas mayoristas & compras',
 mobileLabel: 'Por Pagar',
 icon: Receipt
 }
 ];

 const tabs = esCajero
  ? todasLasPestañas.filter(t => t.id !== 'pagar')
  : todasLasPestañas;

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
 <Wallet className="w-4 h-4 stroke-[2.3]" />
 </div>

 <div className="flex items-center gap-2 flex-wrap min-w-0">
 <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight ">
 Caja y Finanzas
 </h1>
 <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Tesorería Activa
 </span>
 <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
 • Arqueos de caja, créditos a obras & cobranzas
 </span>
 </div>
 </div>

 {/* Lado derecho: Insignia de estado en cápsula */}
 <div className="flex items-center gap-2 shrink-0">
 <div className="h-8 px-3.5 rounded-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 text-emerald-600 dark:text-emerald-400 shadow-2xs flex items-center gap-1.5 text-xs">
 <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
 <span className="text-[10.5px] font-black uppercase tracking-wider">Arqueo Ciego Activo</span>
 </div>
 </div>
 </div>

 {/* Nivel 1: Riel Cápsula Base Perlado Ultra-Slim Envolvente (Flex-Wrap Inteligente) */}
 <div className="rounded-2xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 p-1.5 sm:p-2">
 <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
 {tabs.map((t) => {
 const isActive = activeTab === t.id || (t.id === 'creditos' && activeTab === 'cobrar');
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

 {/* ─── PANEL DE CONTENIDO DE LA PESTAÑA ACTIVA ─── */}
 <div key={activeTab} className="pt-1 animate-page-entrance">
 <Suspense fallback={<TabLoader />}>
 {activeTab === 'caja' && <Caja />}
 {activeTab === 'turnos' && <HistorialCajas />}
 {activeTab === 'creditos' && <Creditos initialTab="creditos" />}
 {activeTab === 'cobrar' && <Creditos initialTab="cobrar" />}
 {activeTab === 'pagar' && <Creditos initialTab="pagar" />}
 </Suspense>
 </div>
 </div>
 );
}
