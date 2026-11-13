import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  X,
  Building2,
  Settings,
  ShieldCheck,
  Users,
  LayoutDashboard
} from 'lucide-react';

export default function QuickSearchModal({ isOpen, onClose, customActions = [] }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const defaultActions = [
    { id: 'dashboard', title: 'Dashboard Principal', desc: 'Métricas clave, ventas y estado general', icon: LayoutDashboard, path: '/dashboard', category: 'General' },
    { id: 'sedes', title: 'Sedes y Sucursales', desc: 'Gestión de locales y puntos de venta', icon: Building2, path: '/administracion', category: 'Administración' },
    { id: 'usuarios', title: 'Equipo y Usuarios', desc: 'Control de accesos y personal', icon: Users, path: '/administracion', category: 'Administración' },
    { id: 'auditoria', title: 'Auditoría y Seguridad', desc: 'Registro forense de cambios y acciones', icon: ShieldCheck, path: '/administracion', category: 'Seguridad' },
    { id: 'configuracion', title: 'Configuración del Sistema', desc: 'Datos de la empresa, facturación y tickets', icon: Settings, path: '/configuracion', category: 'Sistema' },
  ];

  const allActions = [...customActions, ...defaultActions];

  const filtered = allActions.filter(
    (a) =>
      a.title?.toLowerCase().includes(query.toLowerCase()) ||
      a.desc?.toLowerCase().includes(query.toLowerCase()) ||
      a.category?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-white/5">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Buscar páginas, acciones, módulos... (Esc para salir)"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No se encontraron resultados para &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {Icon && <Icon className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {item.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

