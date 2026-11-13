import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Clock,
  CreditCard,
  CircleDollarSign,
  ShieldCheck
} from 'lucide-react';

// Importamos los componentes existentes sin alterar su lógica interna
const Caja = lazy(() => import('./Caja'));
const HistorialCajas = lazy(() => import('./HistorialCajas'));
const Creditos = lazy(() => import('./Creditos'));

import { useAuthStore } from '@heis/core';

function TabLoader() {
  return (
    <div className="flex items-center justify-center p-12 min-h-[350px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Cargando pestaña de caja y finanzas...
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
  // Si es cajero e intenta entrar a cuentas corrientes de proveedores, redirigir a caja
  const activeTab = esCajero && rawTab === 'creditos' ? 'caja' : rawTab;

  const allTabs = [
    {
      id: 'caja',
      label: esCajero ? 'Mi Caja Chica' : 'Caja Chica',
      mobileLabel: 'Caja Chica',
      tooltip: 'Apertura de turno, fondo inicial, gastos operativos y arqueo en mostrador',
      icon: Wallet
    },
    {
      id: 'turnos',
      label: esCajero ? 'Mis Turnos Anteriores' : 'Turnos y Arqueos',
      mobileLabel: 'Arqueos',
      tooltip: 'Historial y auditoría de turnos cerrados, balance y comprobantes térmicos',
      icon: Clock
    },
    {
      id: 'creditos',
      label: 'Cuentas Corrientes',
      mobileLabel: 'Cuentas Ctes.',
      tooltip: 'Control de deudas comerciales y pagos a droguerías y proveedores',
      icon: CreditCard
    },
    {
      id: 'cobrar',
      label: esCajero ? 'Cobranzas a Clientes' : 'Cobranzas & Abonos',
      mobileLabel: 'Cobranzas',
      tooltip: 'Cuentas por cobrar a clientes de botica y amortizaciones en caja',
      icon: CircleDollarSign
    }
  ];

  // El cajero no debe ver cuentas corrientes a pagar a droguerías/proveedores
  const tabs = esCajero
    ? allTabs.filter((t) => t.id !== 'creditos')
    : allTabs;

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="space-y-4 w-full max-w-[1440px] mx-auto pb-8 animate-in fade-in duration-300">
      {/* ─── PÍLDORA UNIFICADA DE CAJA Y FINANZAS (ENCABEZADO + SUBCATEGORÍAS INTEGRADAS) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 space-y-3">
        {/* Fila Superior: Identidad del Módulo y Título en Píldora */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
              <Wallet className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                  {esCajero ? 'Mi Caja Chica & Turnos' : 'Caja y Finanzas'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                  <ShieldCheck className="w-3 h-3 text-[#00B884] dark:text-[#5EEBB8]" />
                  Control de Efectivo & Arqueos
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
                {esCajero
                  ? 'Control de apertura, cobro de turnos, arqueo de mostrador y gastos menores.'
                  : 'Gestión de caja chica, turnos de botica, arqueos físicos y cuentas corrientes.'}
              </p>
            </div>
          </div>

          {/* Indicador de Estado / Pestaña Activa en Píldora */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <div className="px-3 py-1.5 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/40 border border-[#A6F6D8] dark:border-emerald-800/50 text-xs font-bold text-[#00855E] dark:text-[#5EEBB8] flex items-center gap-1.5 font-sora">
              <span className="w-2 h-2 rounded-full bg-[#00B884] animate-pulse" />
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Activo:</span>
              <span className="text-[11px] font-black text-[#00855E] dark:text-[#5EEBB8]">
                {tabs.find((t) => t.id === activeTab)?.label || 'Caja Chica'}
              </span>
            </div>
          </div>
        </div>

        {/* Fila Inferior Integrada: Barra de Subcategorías (FUSIONADAS DENTRO DE LA PÍLDORA) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-[#F8FCFA] dark:bg-slate-950/50 p-1.5 rounded-xl border border-[#D1F4E3]/60 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabChange(t.id)}
                  title={t.tooltip || t.label}
                  className={`group relative flex items-center justify-start sm:justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150 cursor-pointer select-none font-sora active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#00855E] text-white font-bold shadow-xs shadow-emerald-900/20 ring-1 ring-[#00855E]'
                      : 'bg-white hover:bg-[#EBFDF6] dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#00855E] dark:hover:text-[#5EEBB8] font-semibold border border-slate-200/70 hover:border-[#A6F6D8] dark:border-slate-700/80'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#00855E]'
                    }`}
                  />
                  <span className="hidden sm:inline truncate">{t.label}</span>
                  <span className="inline sm:hidden truncate text-[11px] font-black">
                    {t.mobileLabel}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs shrink-0 hidden sm:block" />
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
          {activeTab === 'caja' && <Caja />}
          {activeTab === 'turnos' && <HistorialCajas />}
          {activeTab === 'creditos' && <Creditos initialTab="pagar" />}
          {activeTab === 'cobrar' && <Creditos initialTab="cobrar" />}
        </Suspense>
      </div>
    </div>
  );
}
