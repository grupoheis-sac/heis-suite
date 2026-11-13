import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Building2,
  ChevronDown,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Sparkles,
  Key,
  Settings,
  Lock,
  Palette,
  FileText,
  Activity,
  ExternalLink,
  ChevronRight,
  Laptop,
  Maximize2,
  Minimize2,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar({
  onToggleMobile = () => {},
  onOpenQuickSearch = () => {},
  user = null,
  empresa = null,
  sucursalActual = null,
  isDark = false,
  onToggleTheme = () => {},
  onLogout = () => {},
  moduloActual = 'restaurante'
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(typeof document !== 'undefined' && document.fullscreenElement));
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Escuchar cambios de pantalla completa
  useEffect(() => {
    const handleFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Cerrar menú al hacer clic fuera o presionar Escape (sin capas que sombreen ni opaquen la pantalla)
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  const getModuleBadge = (mod) => {
    switch (mod) {
      case 'restaurante':
        return { label: 'Restaurante Gastro', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'ferreteria':
        return { label: 'Ferretería Retail', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
      case 'botica':
        return { label: 'Botica Salud', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'hospedaje':
        return { label: 'Hospedaje & Hotel', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' };
      default:
        return { label: 'HEIS Suite', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
    }
  };

  const badge = getModuleBadge(moduloActual);

  const isSuperAdmin = user?.rol === 'superadmin' || user?.role === 'superadmin';

  return (
    <header className="h-14 sm:h-16 bg-white/85 dark:bg-[#110C2B]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-full px-3.5 sm:px-5 flex items-center justify-between shadow-md shadow-slate-200/40 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-300 relative z-40 select-none">
      {/* IZQUIERDA: Botón móvil + Buscador Rápido Equilibrado + Badge SuperAdmin Estándar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 transition-colors shadow-2xs shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Buscador Rápido Proporcionado y Compacto */}
        <button
          onClick={onOpenQuickSearch}
          className="flex items-center justify-between h-9 sm:h-10 pl-2.5 pr-2 sm:pl-3 sm:pr-2.5 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10 shadow-2xs group cursor-pointer w-40 sm:w-52 md:w-60 shrink-0"
          title="Buscar menú rápido (Ctrl + K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
              <Search className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="truncate font-medium text-slate-500 dark:text-slate-400 text-xs">
              Buscar menú...
            </span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-[9px] font-bold text-slate-500 dark:text-slate-400 font-mono shrink-0 border border-slate-300/40 dark:border-white/10">
            Ctrl K
          </kbd>
        </button>

        {/* Badge del módulo activo o SuperAdmin tipo Píldora Ejecutiva (Tamaño Estándar h-9 sm:h-10) */}
        {isSuperAdmin && !empresa ? (
          <button
            type="button"
            onClick={() => navigate('/superadmin')}
            className="hidden sm:inline-flex items-center gap-2.5 h-9 sm:h-10 px-3.5 rounded-full bg-gradient-to-r from-slate-900/[0.04] via-[#7D71EB]/[0.08] to-[#1CC0F9]/[0.08] dark:from-white/[0.05] dark:via-[#7D71EB]/15 dark:to-[#1CC0F9]/15 border border-slate-200/90 dark:border-white/10 shadow-2xs hover:border-[#7D71EB]/40 hover:shadow-xs transition-all group select-none cursor-pointer active:scale-95 shrink-0"
            title="Consola Central - Centro de Mando"
          >
            {/* Micro-chip de icono con gradiente de marca */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </div>

            {/* Etiqueta SUPERADMIN */}
            <span className="text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#7D71EB] to-[#1CC0F9] dark:from-[#1CC0F9] dark:to-[#02CBA9] bg-clip-text text-transparent">
              SuperAdmin
            </span>

            {/* Separador fino */}
            <span className="h-3.5 w-[1px] bg-slate-300/80 dark:bg-white/15" />

            {/* Marca HEIS SAC */}
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight">
              HEIS SAC
            </span>

            {/* Radar de estado activo */}
            <span className="relative flex h-2 w-2 ml-0.5" title="Plataforma SaaS activa">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#02CBA9] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#02CBA9]" />
            </span>
          </button>
        ) : isSuperAdmin && empresa ? (
          <div className="hidden sm:inline-flex items-center gap-2.5 h-9 sm:h-10 pl-2 pr-2.5 rounded-full bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.05] to-[#7D71EB]/[0.08] dark:from-amber-500/15 dark:via-orange-500/10 dark:to-[#7D71EB]/15 border border-amber-500/30 dark:border-amber-400/30 shadow-2xs select-none shrink-0">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Inspector
              </span>
              <span className="h-3.5 w-[1px] bg-amber-300/80 dark:bg-white/15" />
              <span className="font-extrabold text-slate-800 dark:text-white truncate max-w-[130px]">
                {empresa.nombre}
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('heis_empresa');
                localStorage.removeItem('heis_empresa_id');
                window.location.href = '/superadmin';
              }}
              className="ml-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[10px] font-black tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              title="Salir del Modo Inspector"
            >
              Salir
            </button>
          </div>
        ) : (
          <div
            className={`hidden sm:inline-flex items-center gap-2 h-9 sm:h-10 px-3.5 rounded-full text-xs font-bold border shadow-2xs backdrop-blur-md shrink-0 ${badge.color}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            <span>{badge.label}</span>
          </div>
        )}
      </div>

      {/* DERECHA: Sede (si aplica en tenant) + Pantalla Completa + Modo Oscuro + Perfil */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Indicador de Sede / Sucursal solo si estamos dentro de una empresa y tiene sucursal definida */}
        {empresa && sucursalActual?.nombre && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 shadow-2xs font-bold">
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate max-w-[120px]">
              {sucursalActual.nombre}
            </span>
          </div>
        )}

        {/* Botón Pantalla Completa */}
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100/70 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 transition-all shadow-2xs active:scale-95 cursor-pointer"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-500" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Alternador de Tema Circular */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100/70 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 transition-all shadow-2xs active:scale-95 cursor-pointer"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-[#1CC0F9]" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Perfil de Usuario - Solo foto circular limpia sin textos redundantes */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none group focus:outline-none"
            title={`${user?.nombre || 'Usuario'} (${isSuperAdmin ? 'Super Administrador' : (user?.rol || user?.role || 'Operador')})`}
            aria-label="Abrir opciones de usuario"
          >
            {/* Foto circular con aro de gradiente y animación hover */}
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 transition-all duration-300 ${
                userMenuOpen
                  ? 'ring-2 ring-[#02CBA9] shadow-lg shadow-[#02CBA9]/30 scale-105'
                  : 'hover:ring-2 hover:ring-[#1CC0F9]/60 hover:scale-105 shadow-2xs'
              }`}
            >
              {user?.avatar || user?.foto || user?.imagen ? (
                <img
                  src={user.avatar || user.foto || user.imagen}
                  alt={user?.nombre || 'Usuario'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-inner">
                  {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'H'}
                </div>
              )}
            </div>

            {/* Micro-radar indicador de sesión activa */}
            <span className="absolute bottom-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#110C2B]" />
            </span>
          </button>

          {/* Menú Dropdown Completo de Funciones SaaS (Carcasa exterior redondeada con overflow-hidden) */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 rounded-3xl bg-white dark:bg-[#151036] border border-slate-200 dark:border-white/15 shadow-2xl shadow-slate-900/30 dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden">
              {/* Contenedor Interior con Scroll: barra contenida dentro de los márgenes */}
              <div className="max-h-[calc(100vh-6.5rem)] overflow-y-auto p-2.5 pr-2 custom-dropdown-scroll">
                {/* 1. Encabezado de Identidad del Usuario */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1c1547] border border-slate-200/80 dark:border-white/10 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] flex items-center justify-center text-white font-black text-base shadow-md shadow-[#02CBA9]/20 shrink-0">
                      {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'H'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate font-heading leading-tight">
                        {user?.nombre || 'Usuario'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-medium">
                        {user?.email || 'usuario@heissac.com'}
                      </p>
                    </div>
                  </div>

                  {/* Badges de Rol y Organización */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-white/5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isSuperAdmin
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-[#02CBA9]/10 text-[#02CBA9] border border-[#02CBA9]/20'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>{isSuperAdmin ? 'Super Administrador' : (user?.rol || user?.role || 'Operador')}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 truncate max-w-[170px]">
                      <Building2 className="w-2.5 h-2.5 text-[#1CC0F9] shrink-0" />
                      <span className="truncate">
                        {isSuperAdmin && !empresa ? 'HEIS SAC Plataforma' : (empresa?.nombre || 'HEIS SAC')}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 2. Sección: Mi Cuenta & Preferencias */}
                <div className="px-2 py-1 text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Mi Cuenta & Sistema
                </div>
                <div className="flex flex-col gap-0.5 mb-2">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/configuracion');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white leading-tight">Mi Perfil</div>
                        <div className="text-[10px] text-slate-400">Datos personales y contacto</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/configuracion');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Key className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white leading-tight">Seguridad & Clave</div>
                        <div className="text-[10px] text-slate-400">Credenciales y acceso seguro</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/configuracion');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white leading-tight">Configuración</div>
                        <div className="text-[10px] text-slate-400">Parámetros del sistema</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                  </button>
                </div>

                {/* 3. Acceso Rápido SuperAdmin (Un solo atajo general sin duplicar las opciones del sidebar) */}
                {isSuperAdmin && (
                  <div className="pt-1.5 border-t border-slate-100 dark:border-white/5 mb-1.5">
                    {empresa ? (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          localStorage.removeItem('heis_empresa');
                          localStorage.removeItem('heis_empresa_id');
                          window.location.href = '/superadmin';
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Salir de Modo Inspector</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Volver</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/superadmin');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-amber-700 dark:text-amber-300 leading-tight">Consola Central</div>
                            <div className="text-[10px] text-slate-400 font-normal">Panel central de la plataforma</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500/70" />
                      </button>
                    )}
                  </div>
                )}

                {/* 5. Alternador de Tema Integrado */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 mb-1.5">
                  <button
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {isDark ? 'Tema Claro' : 'Tema Oscuro'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {isDark ? 'Activar Día' : 'Activar Noche'}
                    </span>
                  </button>
                </div>

                {/* 6. Footer: Cerrar Sesión */}
                <div className="pt-1.5 border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span>Cerrar Sesión Segura</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

