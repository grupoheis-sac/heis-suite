import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Truck,
  FileSpreadsheet,
  PackageCheck,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

// Importamos los componentes existentes sin alterar su lógica interna
const Compras = lazy(() => import('./Compras'));
const OrdenesCompra = lazy(() => import('./OrdenesCompra'));
const Proveedores = lazy(() => import('./Proveedores'));
const ObservatorioDigemid = lazy(() => import('./ObservatorioDigemid'));
const DevolucionesProveedor = lazy(() => import('./DevolucionesProveedor'));

function TabLoader() {
  return (
    <div className="flex items-center justify-center p-12 min-h-[350px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sora">
          Cargando pestaña de compras y proveedores...
        </span>
      </div>
    </div>
  );
}

export default function ComprasProveedoresHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'registro';

  const tabs = [
    {
      id: 'registro',
      label: 'Registro de Compras',
      tooltip: 'Recepción de facturas de compra y registro de nuevos lotes farmacéuticos',
      icon: FileText
    },
    {
      id: 'ordenes',
      label: 'Órdenes de Compra',
      tooltip: 'Generación y seguimiento de pedidos a laboratorios',
      icon: PackageCheck
    },
    {
      id: 'proveedores',
      label: 'Droguerías y Proveedores',
      tooltip: 'Directorio de laboratorios, distribuidores RUC y cuentas por pagar',
      icon: Truck
    },
    {
      id: 'devoluciones',
      label: 'Devoluciones y Canjes',
      tooltip: 'Guías de devolución por vencimiento, canje o rotura a droguerías',
      icon: RotateCcw
    },
    {
      id: 'digemid',
      label: 'Observatorio DIGEMID (OPM)',
      tooltip: 'Reporte mensual de precios oficiales conforme a la Ley N° 29459',
      icon: FileSpreadsheet
    }
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="space-y-4 w-full max-w-[1440px] mx-auto pb-8 animate-in fade-in duration-300 font-sora">
      {/* ─── PÍLDORA UNIFICADA DE COMPRAS Y PROVEEDORES (ENCABEZADO + SUBCATEGORÍAS INTEGRADAS) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 space-y-3 font-sora">
        {/* Fila Superior: Identidad del Módulo y Título */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
              <Truck className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                  Compras y Proveedores
                </h1>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                  <ShieldCheck className="w-3 h-3 text-[#00B884] dark:text-[#5EEBB8]" />
                  Abastecimiento & DIGEMID
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
                Gestión de compras a droguerías, recepción de lotes, registro de facturas y precios OPM DIGEMID.
              </p>
            </div>
          </div>

          {/* Indicador de Estado / Pestaña Activa */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <div className="px-3 py-1.5 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/40 border border-[#A6F6D8] dark:border-emerald-800/50 text-xs font-bold text-[#00855E] dark:text-[#5EEBB8] flex items-center gap-1.5 font-sora">
              <span className="w-2 h-2 rounded-full bg-[#00B884] animate-pulse" />
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Activo:</span>
              <span className="text-[11px] font-black text-[#00855E] dark:text-[#5EEBB8]">
                {tabs.find((t) => t.id === activeTab)?.label || 'Registro de Compras'}
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
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#00855E]'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── PANEL DE CONTENIDO DE LA PESTAÑA ACTIVA (<TabPanel>) ─── */}
      <div className="pt-1">
        <Suspense fallback={<TabLoader />}>
          {activeTab === 'registro' && <Compras />}
          {activeTab === 'ordenes' && <OrdenesCompra />}
          {activeTab === 'proveedores' && <Proveedores />}
          {activeTab === 'devoluciones' && <DevolucionesProveedor />}
          {activeTab === 'digemid' && <ObservatorioDigemid />}
        </Suspense>
      </div>
    </div>
  );
}
