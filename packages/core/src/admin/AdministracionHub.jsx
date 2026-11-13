import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Users,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  UtensilsCrossed
} from 'lucide-react';

const Sucursales = lazy(() => import('./Sucursales'));
const Usuarios = lazy(() => import('./Usuarios'));
const RolesUsuarios = lazy(() => import('./RolesUsuarios'));
const AuditoriaSeguridad = lazy(() => import('./AuditoriaSeguridad'));

function TabLoader() {
  return (
    <div className="flex items-center justify-center p-12 min-h-[350px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sora">
          Cargando panel de administración...
        </span>
      </div>
    </div>
  );
}

export default function AdministracionHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'sedes';

  const tabs = [
    {
      id: 'sedes',
      label: 'Sedes & Locales',
      description: 'Salones, Dark Kitchens y series de facturación SUNAT',
      icon: Building2
    },
    {
      id: 'equipo',
      label: 'Equipo y Personal',
      description: 'Mozos, cajeros, chefs y administradores gastronómicos',
      icon: Users
    },
    {
      id: 'roles',
      label: 'Roles & Contraseñas',
      fullLabel: 'Asignación de Roles & Contraseñas',
      description: 'Permisos de atención, cocina, caja y cambio instantáneo de claves',
      badge: 'Cajeros, Mozos & Claves',
      icon: KeyRound
    },
    {
      id: 'auditoria',
      label: 'Auditoría & Logs',
      fullLabel: 'Auditoría & Trazabilidad de Seguridad',
      description: 'Historial de accesos, comandas anuladas, aperturas y operaciones críticas',
      badge: 'Logs en Vivo',
      icon: ShieldAlert
    }
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="space-y-6">
      {/* ─── PÍLDORA BASE FLOTANTE ULTRA-SLIM ENVOLVENTE GASTROTECH ─── */}
      <div className="p-3 sm:p-3.5 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] space-y-2.5">
        {/* Cabecera / Identificador Superior de la Cápsula */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 px-1">
          {/* Lado izquierdo: Ícono squircle + Título destacado + Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-xs shadow-amber-500/25 shrink-0 border border-amber-400/20">
              <Building2 className="w-4 h-4 stroke-[2.3]" />
            </div>

            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-sora">
                Administración & Sedes
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Seguridad Activa
              </span>
              <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
                • Sedes gastronómicas, salones, personal, mozos, chefs & credenciales
              </span>
            </div>
          </div>

          {/* Lado derecho: Insignia de estado en cápsula */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 px-3.5 rounded-full bg-slate-50 dark:bg-emerald-950/30 border border-slate-200/90 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-300 shadow-2xs flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[10.5px] font-black uppercase tracking-wider">Control Cifrado</span>
            </div>
          </div>
        </div>

        {/* Nivel 1: Riel Cápsula Base Perlado Ultra-Slim Envolvente (Flex-Wrap Inteligente) */}
        <div className="rounded-2xl bg-slate-100/90 dark:bg-[#070b14]/85 border border-slate-200/80 dark:border-slate-800/80 p-1.5 sm:p-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabChange(t.id)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer select-none active:scale-[0.98] font-sora ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-pill-active ring-2 ring-amber-400/30 dark:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : 'bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
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
                    <span className="hidden xl:inline px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
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
      <div key={activeTab} className="pt-2 animate-page-entrance">
        <Suspense fallback={<TabLoader />}>
          {activeTab === 'sedes' && <Sucursales />}
          {activeTab === 'equipo' && <Usuarios />}
          {activeTab === 'roles' && <RolesUsuarios />}
          {activeTab === 'auditoria' && <AuditoriaSeguridad />}
        </Suspense>
      </div>
    </div>
  );
}

