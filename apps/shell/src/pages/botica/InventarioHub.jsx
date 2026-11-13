import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@heis/core';
import {
  Boxes,
  Pill,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ArrowLeftRight,
  Thermometer,
  Layers
} from 'lucide-react';

// Importamos los componentes existentes sin alterar su lógica interna
const Medicamentos = lazy(() => import('./Medicamentos'));
const Lotes = lazy(() => import('./Lotes'));
const BajasCuarentena = lazy(() => import('./BajasCuarentena'));
const Traslados = lazy(() => import('./Traslados'));
const TemperaturaHumedad = lazy(() => import('./TemperaturaHumedad'));
const KardexSunat = lazy(() => import('./KardexSunat'));

function TabLoader() {
  return (
    <div className="flex items-center justify-center p-12 min-h-[350px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Cargando pestaña de inventario...
        </span>
      </div>
    </div>
  );
}

export default function InventarioHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const esCajero = user?.rol === 'Cajero';

  const rawTab = searchParams.get('tab') || 'medicamentos';
  // Si es cajero y la pestaña es de baja/traslado/kardex/temperatura, redirigir a medicamentos
  const activeTab = esCajero && ['bajas', 'traslados', 'temperatura', 'kardex'].includes(rawTab)
    ? 'medicamentos'
    : rawTab;

  const allTabs = [
    {
      id: 'medicamentos',
      label: esCajero ? 'Consulta de Catálogo & Stock' : 'Medicamentos & Stock',
      tooltip: 'Catálogo de medicamentos, existencias y precios de venta',
      icon: Pill
    },
    {
      id: 'lotes',
      label: 'Lotes & FEFO',
      tooltip: 'Semáforo de vencimientos y rotación FEFO',
      icon: Clock
    },
    {
      id: 'bajas',
      label: 'Bajas & Cuarentena',
      tooltip: 'Medicamentos vencidos, mermas y cuarentena',
      icon: ShieldAlert
    },
    {
      id: 'traslados',
      label: 'Traslados',
      tooltip: 'Transferencia de stock entre boticas y sucursales',
      icon: ArrowLeftRight
    },
    {
      id: 'temperatura',
      label: 'Temperatura BPA',
      tooltip: 'Control diario de temperatura y humedad (BPA DIGEMID)',
      icon: Thermometer
    },
    {
      id: 'kardex',
      label: 'Kardex',
      tooltip: 'Libro oficial de Kardex valorizado para DIGEMID y SUNAT',
      icon: Layers
    }
  ];

  // Si es cajero, solo tiene acceso a Catálogo y Semáforo FEFO
  const tabs = esCajero
    ? allTabs.filter((t) => t.id === 'medicamentos' || t.id === 'lotes')
    : allTabs;

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="space-y-4 w-full max-w-[1440px] mx-auto pb-8 animate-in fade-in duration-300">
      {/* ─── PÍLDORA UNIFICADA DE INVENTARIO (ENCABEZADO + SUBCATEGORÍAS INTEGRADAS) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 space-y-3">
        {/* Fila Superior: Identidad del Módulo y Título */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
              <Boxes className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                  {esCajero ? 'Catálogo & Existencias' : 'Inventario'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                  <ShieldCheck className="w-3 h-3 text-[#00B884] dark:text-[#5EEBB8]" />
                  BPA (DIGEMID / MINSA)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
                {esCajero
                  ? 'Consulta de catálogo de medicamentos, precios al público y rotación FEFO en mostrador.'
                  : 'Gestión de existencias, semáforo FEFO de lotes, mermas, transferencias y kardex valorizado.'}
              </p>
            </div>
          </div>

          {/* Indicador de Estado / Pestaña Activa */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <div className="px-3 py-1.5 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/40 border border-[#A6F6D8] dark:border-emerald-800/50 text-xs font-bold text-[#00855E] dark:text-[#5EEBB8] flex items-center gap-1.5 font-sora">
              <span className="w-2 h-2 rounded-full bg-[#00B884] animate-pulse" />
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Activo:</span>
              <span className="text-[11px] font-black text-[#00855E] dark:text-[#5EEBB8]">
                {tabs.find((t) => t.id === activeTab)?.label || 'Medicamentos & Stock'}
              </span>
            </div>
          </div>
        </div>

        {/* Fila Inferior Integrada: Barra de Subcategorías (FUSIONADAS DENTRO DE LA PÍLDORA) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-[#F8FCFA] dark:bg-slate-950/50 p-1.5 rounded-xl border border-[#D1F4E3]/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabChange(t.id)}
                  title={t.tooltip}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150 cursor-pointer select-none shrink-0 font-sora active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#00855E] text-white font-bold shadow-xs shadow-emerald-900/20 ring-1 ring-[#00855E]'
                      : 'bg-white hover:bg-[#EBFDF6] dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00855E] dark:hover:text-[#5EEBB8] font-semibold border border-slate-200/70 hover:border-[#A6F6D8] dark:border-slate-700/80'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-[#EBFDF6] text-slate-400 group-hover:text-[#00855E]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="tracking-tight whitespace-nowrap">{t.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5EEBB8] shadow-2xs shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── PANEL DE CONTENIDO DE LA PESTAÑA ACTIVA (<TabPanel>) ─── */}
      <div className="pt-1">
        <Suspense fallback={<TabLoader />}>
          {activeTab === 'medicamentos' && <Medicamentos />}
          {activeTab === 'lotes' && <Lotes />}
          {activeTab === 'bajas' && <BajasCuarentena />}
          {activeTab === 'traslados' && <Traslados />}
          {activeTab === 'temperatura' && <TemperaturaHumedad />}
          {activeTab === 'kardex' && <KardexSunat />}
        </Suspense>
      </div>
    </div>
  );
}
