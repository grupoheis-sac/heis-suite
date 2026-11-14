import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  BookOpen,
  CalendarCheck,
  TrendingDown,
  Building2,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
  Sparkles,
  ShoppingBag,
  Pill,
  Hotel,
  ShieldAlert,
  Sliders,
  Layers,
  Boxes,
  Wallet,
  FileText,
  Users,
  Activity,
  Server,
  TrendingUp,
  Bell,
  ArrowLeft,
  Palette,
  Lock,
  HelpCircle
} from 'lucide-react';
import {
  isSuperAdminUser,
  isGeneralAdminUser,
  getUserVertical,
  getUserAllowedModules,
  canUserAccessModule,
  getUserPermissions,
} from '@heis/core';

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile = () => { },
  setMobileOpen = () => { },
  asideRef = null,
  user = null,
  empresa = null,
  modulosActivos = ['restaurante']
}) {
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      return localStorage.getItem('heis_sidebar_collapsed') === 'true';
    } catch (_) {
      return false;
    }
  });

  const setCollapsed = useCallback((val) => {
    setCollapsedState(val);
    try {
      localStorage.setItem('heis_sidebar_collapsed', String(val));
      window.dispatchEvent(new CustomEvent('heis:sidebar-toggle', { detail: { collapsed: val } }));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('heis:sidebar-toggle', { detail: { collapsed } }));
    } catch (_) {}
  }, [collapsed]);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = useCallback(() => {
    if (typeof setMobileOpen === 'function') setMobileOpen(false);
    if (typeof onCloseMobile === 'function') onCloseMobile();
  }, [setMobileOpen, onCloseMobile]);

  const isSuperAdmin = isSuperAdminUser(user);
  const isGeneralAdmin = isGeneralAdminUser(user);
  const isSuperAdminPlataforma = isSuperAdmin && !empresa;
  const userPerms = getUserPermissions(user);
  const userVertical = getUserVertical(user);
  const allowedModules = getUserAllowedModules(user, modulosActivos);

  const hasRestaurante = allowedModules.includes('restaurante');
  const hasFerreteria = allowedModules.includes('ferreteria');
  const hasBotica = allowedModules.includes('botica');
  const hasHospedaje = allowedModules.includes('hospedaje');
  const hasCoreSuite =
    userPerms.canViewCaja ||
    userPerms.canViewFacturacionSunat ||
    userPerms.canViewAdministracion ||
    userPerms.canViewConfiguracion;
  const esAdmin = isGeneralAdmin;

  // Rutas activas
  const isDashboardActive = location.pathname === '/dashboard' || location.pathname === '/';

  // Módulo Restaurante
  const isOperacionesActive =
    location.pathname === '/mesas' ||
    location.pathname === '/cocina' ||
    location.pathname === '/ordenes';
  const isMenuActive = location.pathname.startsWith('/menu');
  const isReservasActive = location.pathname.startsWith('/reservas');
  const isGastosActive = location.pathname.startsWith('/gastos');

  // Módulo Ferretería
  const isPosActive = location.pathname === '/pos';
  const isInventarioActive =
    location.pathname.startsWith('/inventario') ||
    location.pathname.startsWith('/productos-ferreteria') ||
    location.pathname.startsWith('/kardex');
  const isVentasActive = location.pathname.startsWith('/ventas');
  const isCajaFerreteriaActive = location.pathname.startsWith('/caja');
  const isClientesActive = location.pathname.startsWith('/clientes');
  const isCotizacionesActive = location.pathname.startsWith('/cotizaciones');
  const isComprasActive =
    location.pathname.startsWith('/compras') || location.pathname.startsWith('/proveedores');
  const isFerreteriaActive =
    isPosActive ||
    isInventarioActive ||
    isVentasActive ||
    isCajaFerreteriaActive ||
    isClientesActive ||
    isCotizacionesActive ||
    isComprasActive;

  // Módulo Botica
  const isDispensacionActive = location.pathname.startsWith('/dispensacion');
  const isMedicamentosActive = location.pathname.startsWith('/medicamentos');
  const isLotesActive = location.pathname.startsWith('/lotes');
  const isInventarioBoticaActive =
    location.pathname.startsWith('/inventario-botica') || location.pathname.startsWith('/kardex-botica');
  const isTemperaturaActive = location.pathname.startsWith('/temperatura');
  const isDigemidActive = location.pathname.startsWith('/digemid');
  const isBajasActive = location.pathname.startsWith('/bajas-sanitarias');
  const isBoticaActive =
    isDispensacionActive ||
    isMedicamentosActive ||
    isLotesActive ||
    isInventarioBoticaActive ||
    isTemperaturaActive ||
    isDigemidActive ||
    isBajasActive;

  // Módulo Hospedaje
  const isHabitacionesActive = location.pathname.startsWith('/habitaciones') || location.pathname === '/rack';
  const isReservasHotelActive = location.pathname.startsWith('/reservas-hotel');
  const isHuespedesActive = location.pathname.startsWith('/huespedes');
  const isLimpiezaHotelActive = location.pathname.startsWith('/limpieza-hotel');
  const isTarifasHotelActive = location.pathname.startsWith('/tarifas-hotel');
  const isPisosHotelActive = location.pathname.startsWith('/pisos-hotel');
  const isCajaHotelActive = location.pathname.startsWith('/caja-hotel');
  const isPosHotelActive = location.pathname.startsWith('/pos-hotel');
  const isHospedajeActive =
    isHabitacionesActive ||
    isReservasHotelActive ||
    isHuespedesActive ||
    isLimpiezaHotelActive ||
    isTarifasHotelActive ||
    isPisosHotelActive ||
    isCajaHotelActive ||
    isPosHotelActive;

  // Core
  const isAdministracionActive =
    location.pathname.startsWith('/administracion') ||
    location.pathname === '/sucursales' ||
    location.pathname === '/usuarios' ||
    location.pathname === '/roles' ||
    location.pathname === '/roles-usuarios' ||
    location.pathname === '/auditoria';
  const isConfiguracionActive = location.pathname.startsWith('/configuracion');
  const isSuperAdminActive = location.pathname.startsWith('/superadmin');

  // Acordeón de Operaciones
  const [openOperaciones, setOpenOperaciones] = useState(isOperacionesActive);

  useEffect(() => {
    if (isOperacionesActive) setOpenOperaciones(true);
  }, [isOperacionesActive]);

  const submodulosMap = typeof empresa?.submodulos_activos === 'string'
    ? (() => { try { return JSON.parse(empresa.submodulos_activos || '{}'); } catch { return {}; } })()
    : (empresa?.submodulos_activos || {});

  const canShowSub = (subId) => submodulosMap[subId] !== false;

  // Estilos y badges
  const getMainItemClass = (isActive) =>
    `group sidebar-nav-item flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs transition-all duration-200 ease-out cursor-pointer whitespace-nowrap select-none active:scale-[0.98] relative z-10 ${isActive
      ? 'bg-slate-100/90 dark:bg-white/[0.08] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white font-bold shadow-xs before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#02CBA9] before:via-[#1CC0F9] before:to-[#7D71EB]'
      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.04] font-medium'
    }`;

  const getCollapsedItemClass = (isActive) =>
    `w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center cursor-pointer relative z-10 transition-all duration-200 ease-out active:scale-95 ${isActive
      ? 'bg-white dark:bg-slate-800 border-2 border-[#02CBA9] dark:border-[#1CC0F9] shadow-md shadow-[#02CBA9]/20'
      : 'text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
    }`;

  // Badge contenedor para iconos/emojis con aislamiento visual y fidelidad cromática
  const renderIconBadge = (IconComponent, activeColor, inactiveColor = 'text-slate-400 dark:text-slate-500', isActive = false) => (
    <div
      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${isActive
          ? 'bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/80 dark:border-white/10'
          : 'bg-slate-100/60 dark:bg-white/[0.04] group-hover:bg-white dark:group-hover:bg-slate-800'
        }`}
    >
      <IconComponent
        className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? activeColor : inactiveColor
          }`}
      />
    </div>
  );

  // Renderizado del contenido de navegación
  const renderNavContent = (onItemClick, isDesktopNav = true) => {
    if (isSuperAdminPlataforma) {
      return (
        <div
          className="flex-1 flex flex-col pt-2 pb-3 px-3 gap-1 overflow-y-auto custom-modal-scroll min-h-0 w-full relative"
        >
          {/* GRUPO 1: OPERACIÓN SAAS */}
          <div className="px-2 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 tracking-widest font-black text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-3 h-3" />
              <span>Operación SaaS</span>
            </span>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin"
              onClick={onItemClick}
              className={getMainItemClass(location.pathname === '/superadmin' && (!location.search || location.search.includes('tab=consola')))}
            >
              {renderIconBadge(ShieldAlert, 'text-amber-500 dark:text-amber-400', 'text-amber-500/70 dark:text-amber-400/70', location.pathname === '/superadmin' && (!location.search || location.search.includes('tab=consola')))}
              <span className="flex-1 font-semibold">Consola Central</span>
            </NavLink>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin?tab=empresas"
              onClick={onItemClick}
              className={getMainItemClass(location.search.includes('tab=empresas'))}
            >
              {renderIconBadge(Building2, 'text-blue-500 dark:text-blue-400', 'text-blue-500/70 dark:text-blue-400/70', location.search.includes('tab=empresas'))}
              <span className="flex-1 font-semibold">Empresas Clientes</span>
            </NavLink>
          </div>

          {/* GRUPO 2: MONITOREO & NEGOCIO */}
          <div className="px-2 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 tracking-widest font-black text-indigo-600 dark:text-indigo-400">
              <Activity className="w-3 h-3" />
              <span>Monitoreo & Negocio</span>
            </span>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin?tab=metricas"
              onClick={onItemClick}
              className={getMainItemClass(location.search.includes('tab=metricas'))}
            >
              {renderIconBadge(TrendingUp, 'text-emerald-500 dark:text-emerald-400', 'text-emerald-500/70 dark:text-emerald-400/70', location.search.includes('tab=metricas'))}
              <span className="flex-1 font-semibold">Métricas & MRR</span>
            </NavLink>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin?tab=auditoria"
              onClick={onItemClick}
              className={getMainItemClass(location.search.includes('tab=auditoria'))}
            >
              {renderIconBadge(Activity, 'text-indigo-500 dark:text-indigo-400', 'text-indigo-500/70 dark:text-indigo-400/70', location.search.includes('tab=auditoria'))}
              <span className="flex-1 font-semibold">Auditoría Global</span>
            </NavLink>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin?tab=sistema"
              onClick={onItemClick}
              className={getMainItemClass(location.search.includes('tab=sistema'))}
            >
              {renderIconBadge(Server, 'text-purple-500 dark:text-purple-400', 'text-purple-500/70 dark:text-purple-400/70', location.search.includes('tab=sistema'))}
              <span className="flex-1 font-semibold">Salud del Sistema</span>
            </NavLink>
          </div>

          {/* GRUPO 3: PLATAFORMA & GOBERNANZA */}
          <div className="px-2 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 tracking-widest font-black text-slate-500 dark:text-slate-400">
              <Layers className="w-3 h-3" />
              <span>Gobernanza Suite</span>
            </span>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin?tab=modulos"
              onClick={onItemClick}
              className={getMainItemClass(location.search.includes('tab=modulos'))}
            >
              {renderIconBadge(Layers, 'text-rose-500 dark:text-rose-400', 'text-rose-500/70 dark:text-rose-400/70', location.search.includes('tab=modulos'))}
              <span className="flex-1 font-semibold">Gestor de Módulos</span>
            </NavLink>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin?tab=permisos"
              onClick={onItemClick}
              className={getMainItemClass(location.search.includes('tab=permisos'))}
            >
              {renderIconBadge(Lock, 'text-cyan-500 dark:text-cyan-400', 'text-cyan-500/70 dark:text-cyan-400/70', location.search.includes('tab=permisos'))}
              <span className="flex-1 font-semibold">Permisos & Botones</span>
            </NavLink>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin?tab=comunicados"
              onClick={onItemClick}
              className={getMainItemClass(location.search.includes('tab=comunicados'))}
            >
              {renderIconBadge(Bell, 'text-amber-500 dark:text-amber-400', 'text-amber-500/70 dark:text-amber-400/70', location.search.includes('tab=comunicados'))}
              <span className="flex-1 font-semibold">Comunicados SaaS</span>
            </NavLink>
          </div>

          <div className="relative">
            <NavLink
              to="/superadmin?tab=whitelabel"
              onClick={onItemClick}
              className={getMainItemClass(location.search.includes('tab=whitelabel'))}
            >
              {renderIconBadge(Palette, 'text-pink-500 dark:text-pink-400', 'text-pink-500/70 dark:text-pink-400/70', location.search.includes('tab=whitelabel'))}
              <span className="flex-1 font-semibold">White-Label Login</span>
            </NavLink>
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex-1 flex flex-col pt-3 pb-3 px-3 gap-1 overflow-y-auto custom-modal-scroll min-h-0 w-full relative"
      >
        {/* Banner Modo Inspector si SuperAdmin está inspeccionando una empresa */}
        {isSuperAdmin && empresa && (
          <div className="mb-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs shadow-xs">
            <div className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Modo Inspector</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
              {empresa.nombre}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('heis_empresa');
                localStorage.removeItem('heis_empresa_id');
                window.location.href = '/superadmin';
              }}
              className="mt-2 w-full py-2 px-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Salir a SuperAdmin</span>
            </button>
          </div>
        )}

        {/* DASHBOARD PRINCIPAL (Solo roles autorizados) */}
        {userPerms.canViewDashboard && (
          <div data-expanded-nav="dashboard" className="relative">
            <NavLink
              to="/dashboard"
              onClick={onItemClick}
              className={getMainItemClass(isDashboardActive)}
            >
              {renderIconBadge(LayoutDashboard, 'text-sky-500 dark:text-sky-400', 'text-slate-400 dark:text-slate-500', isDashboardActive)}
              <span className="flex-1 font-semibold">Dashboard</span>
            </NavLink>
          </div>
        )}

        {/* SECCIÓN RESTAURANTE */}
        {hasRestaurante && (
          <>
            <div className="px-3 pt-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 tracking-widest font-black text-amber-600 dark:text-amber-400">
                <span className="text-sm leading-none select-none">🍽️</span>
                <span>Restaurante</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black border border-amber-500/20">POS</span>
            </div>

            {/* Cocinero / Chef exclusivo */}
            {userPerms.canViewCocina && !userPerms.canViewMesas && (
              <div data-expanded-nav="cocina" className="relative">
                <NavLink
                  to="/cocina"
                  onClick={onItemClick}
                  className={getMainItemClass(location.pathname === '/cocina')}
                >
                  {renderIconBadge(ChefHat, 'text-rose-500 dark:text-rose-400', 'text-slate-400 dark:text-slate-500', location.pathname === '/cocina')}
                  <span className="flex-1 font-semibold">Cocina KDS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </NavLink>
              </div>
            )}

            {/* Mozo exclusivo */}
            {userPerms.canViewMesas && !userPerms.canViewCocina && (
              <>
                <div data-expanded-nav="mesas" className="relative">
                  <NavLink
                    to="/mesas"
                    onClick={onItemClick}
                    className={getMainItemClass(location.pathname === '/mesas')}
                  >
                    {renderIconBadge(UtensilsCrossed, 'text-amber-500 dark:text-amber-400', 'text-slate-400 dark:text-slate-500', location.pathname === '/mesas')}
                    <span className="flex-1 font-semibold">Salón y Mesas (F1)</span>
                  </NavLink>
                </div>
                {userPerms.canViewOrdenes && (
                  <div data-expanded-nav="ordenes" className="relative">
                    <NavLink
                      to="/ordenes"
                      onClick={onItemClick}
                      className={getMainItemClass(location.pathname === '/ordenes')}
                    >
                      {renderIconBadge(Receipt, 'text-amber-500 dark:text-amber-400', 'text-slate-400 dark:text-slate-500', location.pathname === '/ordenes')}
                      <span className="flex-1 font-semibold">Historial Comandas</span>
                    </NavLink>
                  </div>
                )}
              </>
            )}

            {/* Admin Restaurante o General: Acordeón completo */}
            {userPerms.canViewMesas && userPerms.canViewCocina && (
              <div data-expanded-nav="operaciones" className="relative flex flex-col">
                <button
                  onClick={() => setOpenOperaciones(!openOperaciones)}
                  className={getMainItemClass(isOperacionesActive)}
                >
                  {renderIconBadge(UtensilsCrossed, 'text-amber-500 dark:text-amber-400', 'text-slate-400 dark:text-slate-500', isOperacionesActive)}
                  <span className="flex-1 text-left font-semibold">Salón & Pedidos</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${openOperaciones ? 'rotate-180 text-amber-500' : 'text-slate-400'
                      }`}
                  />
                </button>

                {openOperaciones && (
                  <div className="pl-4 pr-1 py-1 flex flex-col gap-1 border-l-2 border-amber-500/20 ml-6 my-1">
                    <NavLink
                      to="/mesas"
                      onClick={onItemClick}
                      className={({ isActive }) =>
                        `px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${isActive
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/[0.03]'
                        }`
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>Mesas y Salón (F1)</span>
                    </NavLink>
                    {canShowSub('cocina') && (
                      <NavLink
                        to="/cocina"
                        onClick={onItemClick}
                        className={({ isActive }) =>
                          `px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${isActive
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 shadow-2xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/[0.03]'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Cocina (KDS)</span>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </NavLink>
                    )}
                    <NavLink
                      to="/ordenes"
                      onClick={onItemClick}
                      className={({ isActive }) =>
                        `px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${isActive
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/[0.03]'
                        }`
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>Historial Comandas</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {userPerms.canViewMenu && canShowSub('menu') && (
              <div data-expanded-nav="menu" className="relative">
                <NavLink to="/menu" onClick={onItemClick} className={getMainItemClass(isMenuActive)}>
                  {renderIconBadge(BookOpen, 'text-amber-500 dark:text-amber-400', 'text-slate-400 dark:text-slate-500', isMenuActive)}
                  <span className="flex-1 font-semibold">Carta & Menú</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewReservas && canShowSub('reservas') && (
              <div data-expanded-nav="reservas" className="relative">
                <NavLink to="/reservas" onClick={onItemClick} className={getMainItemClass(isReservasActive)}>
                  {renderIconBadge(CalendarCheck, 'text-amber-500 dark:text-amber-400', 'text-slate-400 dark:text-slate-500', isReservasActive)}
                  <span className="flex-1 font-semibold">Reservas</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewGastos && canShowSub('gastos') && (
              <div data-expanded-nav="gastos" className="relative">
                <NavLink to="/gastos" onClick={onItemClick} className={getMainItemClass(isGastosActive)}>
                  {renderIconBadge(TrendingDown, 'text-amber-500 dark:text-amber-400', 'text-slate-400 dark:text-slate-500', isGastosActive)}
                  <span className="flex-1 font-semibold">Gastos de Caja</span>
                </NavLink>
              </div>
            )}
          </>
        )}

        {/* SECCIÓN FERRETERÍA (SI APLICA) */}
        {hasFerreteria && (
          <>
            <div className="px-3 pt-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 tracking-widest font-black text-indigo-600 dark:text-indigo-400">
                <span className="text-sm leading-none select-none">🔨</span>
                <span>Ferretería & Retail</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-black border border-indigo-500/20">RETAIL</span>
            </div>

            {userPerms.canViewPOS && (
              <div data-expanded-nav="ferreteria-pos" className="relative">
                <NavLink to="/pos" onClick={onItemClick} className={getMainItemClass(isPosActive)}>
                  {renderIconBadge(ShoppingBag, 'text-indigo-500 dark:text-indigo-400', 'text-slate-400 dark:text-slate-500', isPosActive)}
                  <span className="flex-1 font-semibold">Punto de Venta POS</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewInventario && canShowSub('inventario_ferreteria') && (
              <div data-expanded-nav="ferreteria-inventario" className="relative">
                <NavLink to="/inventario" onClick={onItemClick} className={getMainItemClass(isInventarioActive)}>
                  {renderIconBadge(Boxes, 'text-indigo-500 dark:text-indigo-400', 'text-slate-400 dark:text-slate-500', isInventarioActive)}
                  <span className="flex-1 font-semibold">Inventario & Kardex</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewVentas && canShowSub('ventas_ferreteria') && (
              <div data-expanded-nav="ferreteria-ventas" className="relative">
                <NavLink to="/ventas" onClick={onItemClick} className={getMainItemClass(isVentasActive)}>
                  {renderIconBadge(Receipt, 'text-indigo-500 dark:text-indigo-400', 'text-slate-400 dark:text-slate-500', isVentasActive)}
                  <span className="flex-1 font-semibold">Ventas & Facturación</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewCaja && (
              <div data-expanded-nav="ferreteria-caja" className="relative">
                <NavLink to="/caja" onClick={onItemClick} className={getMainItemClass(isCajaFerreteriaActive)}>
                  {renderIconBadge(Wallet, 'text-indigo-500 dark:text-indigo-400', 'text-slate-400 dark:text-slate-500', isCajaFerreteriaActive)}
                  <span className="flex-1 font-semibold">Caja & Finanzas</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewClientes && canShowSub('clientes_obras') && (
              <div data-expanded-nav="ferreteria-clientes" className="relative">
                <NavLink to="/clientes" onClick={onItemClick} className={getMainItemClass(isClientesActive)}>
                  {renderIconBadge(Users, 'text-indigo-500 dark:text-indigo-400', 'text-slate-400 dark:text-slate-500', isClientesActive)}
                  <span className="flex-1 font-semibold">Clientes & Obras</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewCotizaciones && canShowSub('cotizaciones') && (
              <div data-expanded-nav="ferreteria-cotizaciones" className="relative">
                <NavLink to="/cotizaciones" onClick={onItemClick} className={getMainItemClass(isCotizacionesActive)}>
                  {renderIconBadge(FileText, 'text-indigo-500 dark:text-indigo-400', 'text-slate-400 dark:text-slate-500', isCotizacionesActive)}
                  <span className="flex-1 font-semibold">Cotizaciones</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewCompras && canShowSub('compras_proveedores') && (
              <div data-expanded-nav="ferreteria-compras" className="relative">
                <NavLink to="/compras" onClick={onItemClick} className={getMainItemClass(isComprasActive)}>
                  {renderIconBadge(Building2, 'text-indigo-500 dark:text-indigo-400', 'text-slate-400 dark:text-slate-500', isComprasActive)}
                  <span className="flex-1 font-semibold">Compras & Proveedores</span>
                </NavLink>
              </div>
            )}
          </>
        )}

        {/* SECCIÓN BOTICA */}
        {hasBotica && (
          <>
            <div className="px-3 pt-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 tracking-widest font-black text-emerald-600 dark:text-emerald-400">
                <span className="text-sm leading-none select-none">💊</span>
                <span>Botica Farmacia</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black border border-emerald-500/20">DIGEMID</span>
            </div>

            {userPerms.canViewDispensacion && (
              <div data-expanded-nav="botica-pos" className="relative">
                <NavLink to="/dispensacion" onClick={onItemClick} className={getMainItemClass(isDispensacionActive)}>
                  {renderIconBadge(Pill, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', isDispensacionActive)}
                  <span className="flex-1 font-semibold">Dispensación POS (F2)</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewMedicamentos && canShowSub('medicamentos') && (
              <div data-expanded-nav="botica-meds" className="relative">
                <NavLink to="/medicamentos" onClick={onItemClick} className={getMainItemClass(isMedicamentosActive)}>
                  {renderIconBadge(Boxes, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', isMedicamentosActive)}
                  <span className="flex-1 font-semibold">Medicamentos & DCI</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewLotes && canShowSub('lotes_fefo') && (
              <div data-expanded-nav="botica-lotes" className="relative">
                <NavLink to="/lotes" onClick={onItemClick} className={getMainItemClass(isLotesActive)}>
                  {renderIconBadge(CalendarCheck, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', isLotesActive)}
                  <span className="flex-1 font-semibold">Lotes & FEFO</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewInventario && canShowSub('inventario_botica') && (
              <div data-expanded-nav="botica-inv" className="relative">
                <NavLink to="/inventario-botica" onClick={onItemClick} className={getMainItemClass(isInventarioBoticaActive)}>
                  {renderIconBadge(Layers, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', isInventarioBoticaActive)}
                  <span className="flex-1 font-semibold">Inventario & Kardex</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewTemperatura && canShowSub('temperatura') && (
              <div data-expanded-nav="botica-temp" className="relative">
                <NavLink to="/temperatura" onClick={onItemClick} className={getMainItemClass(isTemperaturaActive)}>
                  {renderIconBadge(Flame, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', isTemperaturaActive)}
                  <span className="flex-1 font-semibold">Temperatura & Humedad BPA</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewDigemid && canShowSub('digemid_opm') && (
              <div data-expanded-nav="botica-digemid" className="relative">
                <NavLink to="/digemid" onClick={onItemClick} className={getMainItemClass(isDigemidActive)}>
                  {renderIconBadge(FileText, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', isDigemidActive)}
                  <span className="flex-1 font-semibold">Catálogo DIGEMID OPM</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewBajas && canShowSub('bajas_cuarentena') && (
              <div data-expanded-nav="botica-bajas" className="relative">
                <NavLink to="/bajas-sanitarias" onClick={onItemClick} className={getMainItemClass(isBajasActive)}>
                  {renderIconBadge(TrendingDown, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', isBajasActive)}
                  <span className="flex-1 font-semibold">Bajas & Cuarentena</span>
                </NavLink>
              </div>
            )}
          </>
        )}

        {/* SECCIÓN HOSPEDAJE */}
        {hasHospedaje && (
          <>
            <div className="px-3 pt-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 tracking-widest font-black text-violet-600 dark:text-violet-400">
                <span className="text-sm leading-none select-none">🏨</span>
                <span>Hospedaje Hotel</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 text-[9px] font-black border border-violet-500/20">PMS</span>
            </div>

            {userPerms.canViewRack && (
              <div data-expanded-nav="hospedaje-rack" className="relative">
                <NavLink to="/habitaciones" onClick={onItemClick} className={getMainItemClass(isHabitacionesActive)}>
                  {renderIconBadge(Hotel, 'text-violet-500 dark:text-violet-400', 'text-slate-400 dark:text-slate-500', isHabitacionesActive)}
                  <span className="flex-1 font-semibold">Rack Habitaciones (F3)</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewReservasHotel && canShowSub('reservas_hotel') && (
              <div data-expanded-nav="hospedaje-reservas" className="relative">
                <NavLink to="/reservas-hotel" onClick={onItemClick} className={getMainItemClass(isReservasHotelActive)}>
                  {renderIconBadge(CalendarCheck, 'text-violet-500 dark:text-violet-400', 'text-slate-400 dark:text-slate-500', isReservasHotelActive)}
                  <span className="flex-1 font-semibold">Reservas & Calendario</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewHuespedes && canShowSub('huespedes') && (
              <div data-expanded-nav="hospedaje-huespedes" className="relative">
                <NavLink to="/huespedes" onClick={onItemClick} className={getMainItemClass(isHuespedesActive)}>
                  {renderIconBadge(Users, 'text-violet-500 dark:text-violet-400', 'text-slate-400 dark:text-slate-500', isHuespedesActive)}
                  <span className="flex-1 font-semibold">Huéspedes & MINCETUR</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewLimpieza && canShowSub('limpieza') && (
              <div data-expanded-nav="hospedaje-limpieza" className="relative">
                <NavLink to="/limpieza-hotel" onClick={onItemClick} className={getMainItemClass(isLimpiezaHotelActive)}>
                  {renderIconBadge(Sparkles, 'text-violet-500 dark:text-violet-400', 'text-slate-400 dark:text-slate-500', isLimpiezaHotelActive)}
                  <span className="flex-1 font-semibold">Limpieza & Housekeeping</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewTarifas && canShowSub('tarifas') && (
              <div data-expanded-nav="hospedaje-tarifas" className="relative">
                <NavLink to="/tarifas-hotel" onClick={onItemClick} className={getMainItemClass(isTarifasHotelActive)}>
                  {renderIconBadge(Sliders, 'text-violet-500 dark:text-violet-400', 'text-slate-400 dark:text-slate-500', isTarifasHotelActive)}
                  <span className="flex-1 font-semibold">Tarifas & Temporadas</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewPisos && canShowSub('pisos') && (
              <div data-expanded-nav="hospedaje-pisos" className="relative">
                <NavLink to="/pisos-hotel" onClick={onItemClick} className={getMainItemClass(isPisosHotelActive)}>
                  {renderIconBadge(Layers, 'text-violet-500 dark:text-violet-400', 'text-slate-400 dark:text-slate-500', isPisosHotelActive)}
                  <span className="flex-1 font-semibold">Pisos & Estructura</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewCaja && canShowSub('caja_hotel') && (
              <div data-expanded-nav="hospedaje-caja" className="relative">
                <NavLink to="/caja-hotel" onClick={onItemClick} className={getMainItemClass(isCajaHotelActive)}>
                  {renderIconBadge(Wallet, 'text-violet-500 dark:text-violet-400', 'text-slate-400 dark:text-slate-500', isCajaHotelActive)}
                  <span className="flex-1 font-semibold">Caja Recepción</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewPosHotel && canShowSub('pos_hotel') && (
              <div data-expanded-nav="hospedaje-pos" className="relative">
                <NavLink to="/pos-hotel" onClick={onItemClick} className={getMainItemClass(isPosHotelActive)}>
                  {renderIconBadge(ShoppingBag, 'text-violet-500 dark:text-violet-400', 'text-slate-400 dark:text-slate-500', isPosHotelActive)}
                  <span className="flex-1 font-semibold">Frigobar & Room Service</span>
                </NavLink>
              </div>
            )}
          </>
        )}

        {/* SECCIÓN CORE / ADMINISTRACIÓN COMPARTIDA (Solo roles autorizados) */}
        {hasCoreSuite && (
          <>
            <div className="px-3 pt-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 tracking-widest font-black text-slate-500 dark:text-slate-400">
                <span className="text-sm leading-none select-none">⚙️</span>
                <span>Gestión Suite</span>
              </span>
            </div>

            {userPerms.canViewCaja && (
              <div data-expanded-nav="core-caja" className="relative">
                <NavLink
                  to="/caja"
                  onClick={onItemClick}
                  className={getMainItemClass(location.pathname.startsWith('/caja'))}
                >
                  {renderIconBadge(Wallet, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', location.pathname.startsWith('/caja'))}
                  <span className="flex-1 font-semibold">Caja & Historial Turnos</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewFacturacionSunat && (
              <div data-expanded-nav="core-facturacion-sunat" className="relative">
                <NavLink
                  to="/facturacion-sunat"
                  onClick={onItemClick}
                  className={getMainItemClass(location.pathname.startsWith('/facturacion-sunat'))}
                >
                  {renderIconBadge(Receipt, 'text-emerald-500 dark:text-emerald-400', 'text-slate-400 dark:text-slate-500', location.pathname.startsWith('/facturacion-sunat'))}
                  <span className="flex-1 font-semibold">Facturación SUNAT UBL</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewAdministracion && (
              <div data-expanded-nav="administracion" className="relative">
                <NavLink
                  to="/administracion"
                  onClick={onItemClick}
                  className={getMainItemClass(isAdministracionActive)}
                >
                  {renderIconBadge(Building2, 'text-blue-500 dark:text-blue-400', 'text-slate-400 dark:text-slate-500', isAdministracionActive)}
                  <span className="flex-1 font-semibold">Administración & Sedes</span>
                </NavLink>
              </div>
            )}

            {userPerms.canViewConfiguracion && (
              <div data-expanded-nav="configuracion" className="relative">
                <NavLink
                  to="/configuracion"
                  onClick={onItemClick}
                  className={getMainItemClass(isConfiguracionActive)}
                >
                  {renderIconBadge(Settings, 'text-slate-700 dark:text-slate-200', 'text-slate-400 dark:text-slate-500', isConfiguracionActive)}
                  <span className="flex-1 font-semibold">Configuración</span>
                </NavLink>
              </div>
            )}
          </>
        )}

        {/* ACCESO SUPERADMIN */}
        {isSuperAdmin && (
          <div data-expanded-nav="superadmin" className="relative mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
            <NavLink
              to="/superadmin"
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold text-amber-500 hover:bg-amber-500/10 border border-amber-500/20 shadow-2xs transition-all"
            >
              {renderIconBadge(ShieldAlert, 'text-amber-500 dark:text-amber-400', 'text-amber-500/70 dark:text-amber-400/70', true)}
              <span className="font-semibold">SuperAdmin SaaS</span>
            </NavLink>
          </div>
        )}

        {/* BOTÓN REGISTRAR SOPORTE (Estilo Gestione) */}
        <div className="pt-3 mt-auto border-t border-slate-200/60 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              if (onItemClick) onItemClick();
              window.dispatchEvent(new CustomEvent('heis:open-soporte'));
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar soporte</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* SIDEBAR ESCRITORIO TIPO PÍLDORA FLOTANTE */}
      <aside
        ref={asideRef}
        className={`hidden lg:flex flex-col my-3 ml-3 h-[calc(100vh-1.5rem)] rounded-3xl bg-white/85 dark:bg-[#110C2B]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-[0_10px_35px_rgba(0,0,0,0.45)] transition-all duration-300 relative select-none z-30 shrink-0 overflow-hidden ${collapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* CABECERA / BRAND TIPO PÍLDORA */}
        <div className="h-16 px-3 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 shrink-0 bg-white/40 dark:bg-white/[0.02]">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 shrink-0 rounded-2xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-center p-1 shadow-2xs">
                  <img
                    src="/logo-dia.png"
                    alt="HEIS SAC"
                    className="h-7 w-auto object-contain dark:hidden"
                  />
                  <img
                    src="/logo-noche.png"
                    alt="HEIS SAC"
                    className="h-7 w-auto object-contain hidden dark:block"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs font-black tracking-tight text-slate-900 dark:text-white truncate font-heading leading-tight">
                    {isSuperAdminPlataforma ? 'HEIS SAC' : (empresa?.nombre || 'HEIS SAC')}
                  </h1>
                  <span className="inline-block px-1.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-[#02CBA9]/10 text-[#02CBA9] dark:text-[#1CC0F9] border border-[#02CBA9]/20 truncate">
                    {isSuperAdminPlataforma ? 'Operador Maestro' : (isSuperAdmin ? 'Modo Inspector' : (user?.rol || 'Enterprise Cloud'))}
                  </span>
                </div>
              </div>

              {/* BOTÓN COLAPSAR */}
              <button
                onClick={() => setCollapsed(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100/70 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 transition-all shadow-2xs cursor-pointer shrink-0"
                aria-label="Contraer barra lateral"
                data-no-tooltip="true"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center relative">
              <button
                onClick={() => setCollapsed(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100/70 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 flex items-center justify-center transition-all shadow-2xs cursor-pointer group"
                aria-label="Expandir barra lateral"
                data-no-tooltip="true"
              >
                <img
                  src="/logo-dia.png"
                  alt="HEIS SAC"
                  className="h-6 w-auto object-contain dark:hidden group-hover:scale-110 transition-transform"
                />
                <img
                  src="/logo-noche.png"
                  alt="HEIS SAC"
                  className="h-6 w-auto object-contain hidden dark:block group-hover:scale-110 transition-transform"
                />
              </button>
            </div>
          )}
        </div>

        {/* NAVEGACIÓN */}
        {!collapsed ? (
          renderNavContent(null, true)
        ) : (
          <div className="flex-1 flex flex-col items-center pt-3 pb-3 gap-2 overflow-y-auto custom-modal-scroll w-full relative">
            {isSuperAdminPlataforma ? (
              <>
                <button
                  data-collapsed-category="superadmin"
                  onClick={() => navigate('/superadmin')}
                  className={getCollapsedItemClass(location.pathname === '/superadmin' && (!location.search || location.search.includes('tab=consola')))}
                  data-tooltip="Consola Central"
                >
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                </button>

                <button
                  onClick={() => navigate('/superadmin?tab=empresas')}
                  className={getCollapsedItemClass(location.search.includes('tab=empresas'))}
                  data-tooltip="Empresas Clientes"
                >
                  <Building2 className="w-5 h-5 text-blue-500" />
                </button>

                <div className="w-6 h-px bg-slate-200/80 dark:bg-white/10 my-1 shrink-0" />

                <button
                  onClick={() => navigate('/superadmin?tab=metricas')}
                  className={getCollapsedItemClass(location.search.includes('tab=metricas'))}
                  data-tooltip="Métricas & MRR"
                >
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </button>

                <button
                  onClick={() => navigate('/superadmin?tab=auditoria')}
                  className={getCollapsedItemClass(location.search.includes('tab=auditoria'))}
                  data-tooltip="Auditoría Global"
                >
                  <Activity className="w-5 h-5 text-indigo-500" />
                </button>

                <button
                  onClick={() => navigate('/superadmin?tab=sistema')}
                  className={getCollapsedItemClass(location.search.includes('tab=sistema'))}
                  data-tooltip="Salud del Sistema"
                >
                  <Server className="w-5 h-5 text-purple-500" />
                </button>

                <div className="w-6 h-px bg-slate-200/80 dark:bg-white/10 my-1 shrink-0" />

                <button
                  onClick={() => navigate('/superadmin?tab=modulos')}
                  className={getCollapsedItemClass(location.search.includes('tab=modulos'))}
                  data-tooltip="Gestor de Módulos"
                >
                  <Layers className="w-5 h-5 text-rose-500" />
                </button>

                <button
                  onClick={() => navigate('/superadmin?tab=permisos')}
                  className={getCollapsedItemClass(location.search.includes('tab=permisos'))}
                  data-tooltip="Permisos & Botones"
                >
                  <Lock className="w-5 h-5 text-cyan-500" />
                </button>

                <button
                  onClick={() => navigate('/superadmin?tab=comunicados')}
                  className={getCollapsedItemClass(location.search.includes('tab=comunicados'))}
                  data-tooltip="Comunicados SaaS"
                >
                  <Bell className="w-5 h-5 text-amber-500" />
                </button>

                <button
                  onClick={() => navigate('/superadmin?tab=whitelabel')}
                  className={getCollapsedItemClass(location.search.includes('tab=whitelabel'))}
                  data-tooltip="White-Label Login"
                >
                  <Palette className="w-5 h-5 text-pink-500" />
                </button>
              </>
            ) : (
              <>
                {userPerms.canViewDashboard && (
                  <button
                    data-collapsed-category="dashboard"
                    onClick={() => navigate('/dashboard')}
                    className={getCollapsedItemClass(isDashboardActive)}
                    data-tooltip="Dashboard Principal"
                  >
                    <LayoutDashboard className={`w-5 h-5 ${isDashboardActive ? 'text-sky-500 dark:text-sky-400' : 'text-slate-400'}`} />
                  </button>
                )}

                {hasRestaurante && (
                  userPerms.canViewCocina && !userPerms.canViewMesas ? (
                    <button
                      data-collapsed-category="cocina"
                      onClick={() => navigate('/cocina')}
                      className={getCollapsedItemClass(location.pathname === '/cocina')}
                      data-tooltip="Cocina KDS"
                    >
                      <ChefHat className={`w-5 h-5 ${location.pathname === '/cocina' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'}`} />
                    </button>
                  ) : (
                    <button
                      data-collapsed-category="operaciones"
                      onClick={() => navigate('/mesas')}
                      className={getCollapsedItemClass(isOperacionesActive)}
                      data-tooltip="Salón & Mesas (F1)"
                    >
                      <UtensilsCrossed className={`w-5 h-5 ${isOperacionesActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'}`} />
                    </button>
                  )
                )}

                {hasRestaurante && userPerms.canViewMenu && (
                  <button
                    data-collapsed-category="menu"
                    onClick={() => navigate('/menu')}
                    className={getCollapsedItemClass(isMenuActive)}
                    data-tooltip="Carta y Menú"
                  >
                    <BookOpen className={`w-5 h-5 ${isMenuActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'}`} />
                  </button>
                )}

                {hasFerreteria && (
                  <button
                    data-collapsed-category="ferreteria-pos"
                    onClick={() => navigate(userPerms.canViewPOS ? '/pos' : (userPerms.canViewCotizaciones ? '/cotizaciones' : '/inventario'))}
                    className={getCollapsedItemClass(isFerreteriaActive)}
                    data-tooltip="Ferretería & Retail"
                  >
                    <ShoppingBag className={`w-5 h-5 ${isFerreteriaActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`} />
                  </button>
                )}

                {hasBotica && (
                  <button
                    data-collapsed-category="botica-pos"
                    onClick={() => navigate('/dispensacion')}
                    className={getCollapsedItemClass(isBoticaActive)}
                    data-tooltip="Dispensación Farmacia (F2)"
                  >
                    <Pill className={`w-5 h-5 ${isBoticaActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`} />
                  </button>
                )}

                {hasHospedaje && (
                  <button
                    data-collapsed-category="hospedaje-rack"
                    onClick={() => navigate(userPerms.canViewLimpieza && !userPerms.canViewRack ? '/limpieza-hotel' : '/habitaciones')}
                    className={getCollapsedItemClass(isHospedajeActive)}
                    data-tooltip="Hospedaje & Hotel"
                  >
                    <Hotel className={`w-5 h-5 ${isHospedajeActive ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400'}`} />
                  </button>
                )}

                {userPerms.canViewCaja && (
                  <button
                    data-collapsed-category="caja"
                    onClick={() => navigate('/caja')}
                    className={getCollapsedItemClass(location.pathname.startsWith('/caja'))}
                    data-tooltip="Caja & Historial Turnos"
                  >
                    <Wallet className={`w-5 h-5 ${location.pathname.startsWith('/caja') ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`} />
                  </button>
                )}

                {userPerms.canViewAdministracion && (
                  <button
                    data-collapsed-category="administracion"
                    onClick={() => navigate('/administracion')}
                    className={getCollapsedItemClass(isAdministracionActive)}
                    data-tooltip="Administración & Sedes"
                  >
                    <Building2 className={`w-5 h-5 ${isAdministracionActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'}`} />
                  </button>
                )}

                {userPerms.canViewConfiguracion && (
                  <button
                    data-collapsed-category="configuracion"
                    onClick={() => navigate('/configuracion')}
                    className={getCollapsedItemClass(isConfiguracionActive)}
                    data-tooltip="Configuración"
                  >
                    <Settings className={`w-5 h-5 ${isConfiguracionActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`} />
                  </button>
                )}
              </>
            )}

            {/* BOTÓN REGISTRAR SOPORTE COLAPSADO */}
            <div className="pt-2 mt-auto border-t border-slate-200/60 dark:border-white/5 w-full flex justify-center">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('heis:open-soporte'))}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                data-tooltip="Registrar soporte"
              >
                <HelpCircle className="w-5 h-5 stroke-[2.3]" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* DRAWER MÓVIL EN PÍLDORA FLOTANTE */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden p-3">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={handleClose}
          />
          <div className="relative w-72 max-w-xs bg-white/95 dark:bg-[#110C2B]/95 backdrop-blur-2xl h-full flex flex-col z-10 shadow-2xl rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden animate-in slide-in-from-left duration-200">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 shrink-0 rounded-2xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-center p-1 shadow-2xs">
                  <img
                    src="/logo-dia.png"
                    alt="HEIS SAC"
                    className="h-7 w-auto object-contain dark:hidden"
                  />
                  <img
                    src="/logo-noche.png"
                    alt="HEIS SAC"
                    className="h-7 w-auto object-contain hidden dark:block"
                  />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white font-heading text-sm">
                  {empresa?.nombre || 'HEIS SAC'}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100/70 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderNavContent(handleClose, false)}
          </div>
        </div>
      )}
    </>
  );
}

