import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore, api, getRoleLandingRoute } from '@heis/core';
import toast from 'react-hot-toast';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  UtensilsCrossed,
  ChefHat,
  Wine,
  ShoppingBag,
  Pill,
  Hotel,
  Crown,
  KeyRound,
  Users,
  CheckCircle2,
  Wrench,
  Store
} from 'lucide-react';

const PRESETS_FONDO = {
  modern_glass: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1920&q=80',
  minimal_dark: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1920&q=80',
  minimal_light: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1920&q=80',
  restaurant: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80',
  hardware: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1920&q=80',
  pharma: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1920&q=80',
  hotel: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80',
  sky_office: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
};

const CREDENCIALES_DEMO = [
  // SuperAdmin & Corporativo
  {
    categoria: 'admin',
    modulo: 'SuperAdmin SaaS',
    nombre: 'SuperAdmin HEIS',
    rol: 'superadmin',
    email: 'superadmin@heissuite.com',
    pass: 'admin123',
    badge: 'Plataforma Global',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
    icon: Crown,
  },
  {
    categoria: 'admin',
    modulo: 'Corporativo General',
    nombre: 'Administrador Empresa',
    rol: 'Administrador General',
    email: 'admin@admin.com',
    pass: 'admin123',
    badge: 'Dueño / Gerente',
    badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    icon: ShieldCheck,
  },
  // Restaurante
  {
    categoria: 'restaurante',
    modulo: 'Restaurante & Bar',
    nombre: 'Admin Restaurante',
    rol: 'Admin Restaurante',
    email: 'admin.restaurante@heis.pe',
    pass: 'admin123',
    badge: 'Admin Módulo',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    icon: UtensilsCrossed,
  },
  {
    categoria: 'restaurante',
    modulo: 'Restaurante & Bar',
    nombre: 'Carlos Mozo (Salón 1)',
    rol: 'Mozo',
    email: 'mozo@admin.com',
    pass: 'admin123',
    badge: 'Mozo / Mesero',
    badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30',
    icon: Users,
  },
  {
    categoria: 'restaurante',
    modulo: 'Restaurante & Bar',
    nombre: 'Juan Mesero (Salón 2)',
    rol: 'Mozo',
    email: 'mesero@heis.pe',
    pass: 'admin123',
    badge: 'Mozo / Mesero',
    badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30',
    icon: Users,
  },
  {
    categoria: 'restaurante',
    modulo: 'Restaurante & Bar',
    nombre: 'Chef Mario (Cocina KDS)',
    rol: 'Cocinero / Chef',
    email: 'cocina@heis.pe',
    pass: 'admin123',
    badge: 'Cocina KDS',
    badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
    icon: ChefHat,
  },
  {
    categoria: 'restaurante',
    modulo: 'Restaurante & Bar',
    nombre: 'Lucas Barman (Bar KDS)',
    rol: 'Bartender',
    email: 'bar@heis.pe',
    pass: 'admin123',
    badge: 'Bar KDS',
    badgeColor: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
    icon: Wine,
  },
  // Ferretería
  {
    categoria: 'ferreteria',
    modulo: 'Ferretería Retail',
    nombre: 'Admin Ferretería',
    rol: 'Admin Ferretería',
    email: 'admin.ferreteria@heis.pe',
    pass: 'admin123',
    badge: 'Admin Módulo',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
    icon: Wrench,
  },
  {
    categoria: 'ferreteria',
    modulo: 'Ferretería Retail',
    nombre: 'Cajero POS Retail',
    rol: 'Cajero',
    email: 'caja@admin.com',
    pass: 'admin123',
    badge: 'Caja & Cobros',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    icon: KeyRound,
  },
  {
    categoria: 'ferreteria',
    modulo: 'Ferretería Retail',
    nombre: 'Pedro Vendedor (Cotizador)',
    rol: 'Vendedor',
    email: 'vendedor@heis.pe',
    pass: 'admin123',
    badge: 'Cotizaciones',
    badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30',
    icon: ShoppingBag,
  },
  {
    categoria: 'ferreteria',
    modulo: 'Ferretería Retail',
    nombre: 'Roberto Almacenero',
    rol: 'Almacenero',
    email: 'almacen@heis.pe',
    pass: 'admin123',
    badge: 'Almacén & Kardex',
    badgeColor: 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border-amber-600/30',
    icon: Store,
  },
  // Botica
  {
    categoria: 'botica',
    modulo: 'Botica Farmacia',
    nombre: 'Dra. Elena (Regente Botica)',
    rol: 'Admin Botica',
    email: 'admin.botica@heis.pe',
    pass: 'admin123',
    badge: 'Admin / Regente',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    icon: Pill,
  },
  {
    categoria: 'botica',
    modulo: 'Botica Farmacia',
    nombre: 'Dispensador Farmacéutico',
    rol: 'Farmacéutico',
    email: 'farmaceutico@heis.pe',
    pass: 'admin123',
    badge: 'Dispensación',
    badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30',
    icon: Pill,
  },
  {
    categoria: 'botica',
    modulo: 'Botica Farmacia',
    nombre: 'Cajero de Botica',
    rol: 'Cajero',
    email: 'cajero.botica@heis.pe',
    pass: 'admin123',
    badge: 'Caja Farmacia',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    icon: KeyRound,
  },
  // Hospedaje
  {
    categoria: 'hospedaje',
    modulo: 'Hospedaje & Hotel',
    nombre: 'Gerente Hotel',
    rol: 'Admin Hospedaje',
    email: 'admin.hotel@heis.pe',
    pass: 'admin123',
    badge: 'Admin Módulo',
    badgeColor: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
    icon: Hotel,
  },
  {
    categoria: 'hospedaje',
    modulo: 'Hospedaje & Hotel',
    nombre: 'Recepción Hotel (Turno Día)',
    rol: 'Recepcionista',
    email: 'recepcion@heis.pe',
    pass: 'admin123',
    badge: 'Rack & Check-In',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
    icon: Hotel,
  },
  {
    categoria: 'hospedaje',
    modulo: 'Hospedaje & Hotel',
    nombre: 'Ana Limpieza (Housekeeping)',
    rol: 'Limpieza',
    email: 'limpieza@heis.pe',
    pass: 'admin123',
    badge: 'Housekeeping',
    badgeColor: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
    icon: Sparkles,
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('restaurante');
  const [searchParams] = useSearchParams();
  const empresaParam = searchParams.get('empresa') || localStorage.getItem('heis_empresa_id');
  const [brandConfig, setBrandConfig] = useState(null);

  const { login, isDark, toggleTheme } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const params = empresaParam ? { empresa_id: empresaParam } : {};
    api.get('/whitelabel/public', { params })
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setBrandConfig(res.data.data);
        }
      })
      .catch(() => {
        const key = `heis_whitelabel_${empresaParam || 'global'}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            setBrandConfig(JSON.parse(saved));
          } catch { }
        }
      });
  }, [empresaParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      toast.success('¡Bienvenido a HEIS Suite!');
      const loggedUser = res?.data?.user || useAuthStore.getState().user;
      const empresaData = res?.data?.empresa || useAuthStore.getState().empresa;
      let modulosActivos = [];
      if (empresaData?.modulos_activos) {
        if (typeof empresaData.modulos_activos === 'string') {
          try { modulosActivos = JSON.parse(empresaData.modulos_activos); } catch { modulosActivos = ['restaurante']; }
        } else if (Array.isArray(empresaData.modulos_activos)) {
          modulosActivos = empresaData.modulos_activos;
        }
      }
      const targetRoute = getRoleLandingRoute(loggedUser, modulosActivos);
      navigate(targetRoute);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        (err.message === 'Network Error'
          ? 'Error de conexión: No se pudo comunicar con el backend en el puerto 4000. Verifica que el servidor esté activo.'
          : err.message) ||
        'Error al iniciar sesión';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (cred) => {
    setEmail(cred.email);
    setPassword(cred.pass);
    toast.success(`Cargada credencial de ${cred.nombre}`);
  };

  const bgUrl = brandConfig?.bgPreset === 'custom'
    ? brandConfig?.bgCustomUrl
    : (brandConfig?.bgPreset ? PRESETS_FONDO[brandConfig.bgPreset] : null);

  const credencialesFiltradas = useMemo(() => {
    return CREDENCIALES_DEMO.filter((c) => c.categoria === filtroCategoria);
  }, [filtroCategoria]);

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center p-3 sm:p-5 relative overflow-y-auto transition-all duration-300"
      style={{
        backgroundColor: brandConfig?.colorFondoBody || (isDark ? '#0b0f19' : '#f1f5f9'),
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Capa de contraste según el tema activo */}
      {bgUrl && (
        <div
          className={`absolute inset-0 backdrop-blur-[2px] pointer-events-none transition-colors duration-300 ${
            isDark ? 'bg-slate-950/70' : 'bg-white/50'
          }`}
        />
      )}

      {/* Efectos de fondo ambiental */}
      {!bgUrl && (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Ventana de Inicio de Sesión (Estirada a los lados y Proporcionada) */}
      <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl z-10 my-auto bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl transition-all">
        {/* Cabecera de Marca DENTRO de la Ventana */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            {brandConfig?.logoUrl ? (
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.tituloLogin || 'Logo Corporativo'}
                style={{
                  maxWidth: `${Math.min(brandConfig.logoWidth || 190, 190)}px`,
                  maxHeight: `${Math.min(brandConfig.logoHeight || 46, 46)}px`,
                }}
                className="object-contain drop-shadow-sm mx-auto sm:mx-0 shrink-0"
              />
            ) : (
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src="/logo-dia.png"
                  alt="HEIS SAC"
                  className="h-10 sm:h-11 w-auto object-contain dark:hidden drop-shadow-sm"
                />
                <img
                  src="/logo-noche.png"
                  alt="HEIS SAC"
                  className="h-10 sm:h-11 w-auto object-contain hidden dark:block drop-shadow-md"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white font-heading leading-tight">
                {brandConfig?.tituloLogin || 'HEIS Suite Portal Central'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                {brandConfig?.subtituloLogin || 'Suite Multi-Empresa & Facturación Electrónica SUNAT'}
              </p>
            </div>
          </div>

          {/* Acciones de la Cabecera de la Ventana */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Acceso Seguro SSL
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all cursor-pointer shadow-xs"
              title="Alternar tema claro/oscuro"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Tarjeta Split: Formulario (4 Cols) + Selector de Credenciales (8 Cols para amplitud completa) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Formulario de Login (4 columnas) */}
          <div className="lg:col-span-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-white/10 pb-4 lg:pb-0 lg:pr-6">
            <div>
              <div className="mb-3">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-500" />
                  <span>Iniciar Sesión</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ingresa tus credenciales o selecciona un rol predefinido.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@heis.pe"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: brandConfig?.colorPrimario || undefined,
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-1 ${
                    brandConfig?.colorPrimario
                      ? 'hover:opacity-95'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 shadow-emerald-500/20'
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <Link
                    to="/registro"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400 hover:underline transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    ¿Nuevo en HEIS Suite? Prueba 14 días gratis
                  </Link>
                </div>
              </form>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400">
              <span className="font-bold text-slate-600 dark:text-slate-300">Tip de prueba:</span> Contraseña estándar <code className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded font-mono font-bold text-emerald-600 dark:text-emerald-400">admin123</code>.
            </div>
          </div>

          {/* Columna Derecha: Selector de Credenciales por Módulo / Sistema (8 columnas) */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Catálogo de Credenciales por Módulo</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Haz clic en cualquier rol para cargarlo automáticamente en el formulario.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                  {credencialesFiltradas.length} roles activos
                </span>
              </div>

              {/* Filtro de Categorías (Sin "Todos", espacioso y completamente visible) */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {[
                  { id: 'restaurante', label: 'Restaurante / Bar' },
                  { id: 'ferreteria', label: 'Ferretería Retail' },
                  { id: 'botica', label: 'Botica / Farmacia' },
                  { id: 'hospedaje', label: 'Hotel / Hospedaje' },
                  { id: 'admin', label: 'Admin / SaaS' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFiltroCategoria(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                      filtroCategoria === cat.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-200/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid Scrollable de Credenciales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                {credencialesFiltradas.map((cred, idx) => {
                  const Icon = cred.icon;
                  const isSelected = email === cred.email;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDemoLogin(cred)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {cred.nombre}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {cred.modulo}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 dark:border-white/5 text-[10px]">
                        <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {cred.email}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md font-bold uppercase text-[9px] border ${cred.badgeColor}`}
                        >
                          {cred.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer y Aviso de Copyright */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-white/5 text-center">
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
            {brandConfig?.mostrarCopyright && brandConfig?.textoCopyright
              ? brandConfig.textoCopyright
              : '© 2026 HEIS Suite SAC • Multi-Tenant Enterprise Architecture • SUNAT Facturación'}
          </p>
        </div>
      </div>
    </div>
  );
}
