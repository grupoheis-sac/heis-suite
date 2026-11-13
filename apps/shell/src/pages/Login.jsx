import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, api } from '@heis/core';
import toast from 'react-hot-toast';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Layers,
  UtensilsCrossed,
  ShoppingBag,
  Pill,
  Hotel
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
      if (loggedUser?.rol === 'superadmin' || loggedUser?.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/dashboard');
      }
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

  const handleDemoLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const bgUrl = brandConfig?.bgPreset === 'custom'
    ? brandConfig?.bgCustomUrl
    : (brandConfig?.bgPreset ? PRESETS_FONDO[brandConfig.bgPreset] : null);

  return (
    <div
      className="min-h-screen w-screen flex flex-col justify-center items-center p-4 relative overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: brandConfig?.colorFondoBody || (isDark ? '#110C2B' : '#f0f3f9'),
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Capa de soporte o contraste según el tema activo */}
      {bgUrl && (
        <div
          className={`absolute inset-0 backdrop-blur-[2px] pointer-events-none transition-colors duration-300 ${isDark ? 'bg-slate-950/60' : 'bg-white/40'
            }`}
        />
      )}

      {/* Botón flotante tema oscuro */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 shadow-md backdrop-blur-md hover:scale-105 transition-all z-20 cursor-pointer"
        title="Alternar tema"
      >
        {isDark ? <Sun className="w-5 h-5 text-[#1CC0F9]" /> : <Moon className="w-5 h-5 text-slate-700" />}
      </button>

      {/* Efectos de luz de fondo con paleta oficial HEIS SAC (solo si no hay imagen de fondo) */}
      {!bgUrl && (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#02CBA9]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#7D71EB]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1CC0F9]/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Contenedor Login */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header con Logos Oficiales Día / Noche o Logo Personalizado */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            {brandConfig?.logoUrl ? (
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.tituloLogin || 'Logo Corporativo'}
                style={{
                  maxWidth: `${brandConfig.logoWidth || 240}px`,
                  maxHeight: `${brandConfig.logoHeight || 68}px`,
                }}
                className="object-contain drop-shadow-md mx-auto"
              />
            ) : (
              <>
                <img
                  src="/logo-dia.png"
                  alt="HEIS SAC"
                  className="h-20 w-auto object-contain dark:hidden drop-shadow-md"
                />
                <img
                  src="/logo-noche.png"
                  alt="HEIS SAC"
                  className="h-20 w-auto object-contain hidden dark:block drop-shadow-lg"
                />
              </>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
            {brandConfig?.tituloLogin || 'HEIS SAC'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {brandConfig?.subtituloLogin || 'Plataforma Cloud Multi-Tenant Enterprise'}
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-white/85 dark:bg-[#18123B]/85 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#02CBA9]/50 transition-all text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#02CBA9]/50 transition-all text-slate-900 dark:text-white"
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
              className={`w-full py-3 px-4 rounded-xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer ${brandConfig?.colorPrimario
                  ? 'hover:opacity-95 shadow-md'
                  : 'bg-gradient-to-r from-[#02CBA9] via-[#1CC0F9] to-[#7D71EB] hover:opacity-95 shadow-[#02CBA9]/25'
                }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Accesos Rápidos Demo */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Cuentas Demo para Pruebas
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@admin.com', 'admin123')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-[#02CBA9]/10 hover:text-[#02CBA9] transition-colors text-left"
              >
                <div className="font-bold">Administrador</div>
                <div className="text-[10px] text-slate-400">admin@admin.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('caja@admin.com', 'caja123')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-[#02CBA9]/10 hover:text-[#02CBA9] transition-colors text-left"
              >
                <div className="font-bold">Cajero POS</div>
                <div className="text-[10px] text-slate-400">caja@admin.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('mozo@admin.com', 'mozo123')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-[#02CBA9]/10 hover:text-[#02CBA9] transition-colors text-left"
              >
                <div className="font-bold">Mozo Salón</div>
                <div className="text-[10px] text-slate-400">mozo@admin.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('superadmin@heissuite.com', 'admin123')}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-[#7D71EB]/10 hover:text-[#7D71EB] dark:hover:text-[#1CC0F9] transition-colors text-left"
              >
                <div className="font-bold text-[#7D71EB] dark:text-[#1CC0F9]">SuperAdmin</div>
                <div className="text-[10px] text-slate-400">superadmin@heis</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer y Aviso de Copyright */}
        {brandConfig?.mostrarCopyright && brandConfig?.textoCopyright ? (
          <p className="text-center text-xs text-slate-400 mt-6">
            {brandConfig.textoCopyright}
          </p>
        ) : (
          <p className="text-center text-xs text-slate-400 mt-6">
            HEIS SAC &bull; Multi-Tenant Enterprise Architecture &bull; 2026
          </p>
        )}
      </div>
    </div>
  );
}
