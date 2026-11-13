import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';

/**
 * Toast Minimalista y Ejecutivo para HEIS Suite
 * Diseño ultra-compacto tipo Floating Capsule con Glassmorphism,
 * micro-iconografía limpia, eliminación de textos redundantes y máxima legibilidad.
 */
export function UnifiedToastItem({ t, isDark = false }) {
  const isDismissedRef = useRef(false);
  const duration = t.duration || 3500;

  useEffect(() => {
    // Timer de seguridad para garantizar auto-dismiss
    const fallbackTimer = setTimeout(() => {
      if (!isDismissedRef.current) {
        isDismissedRef.current = true;
        toast.dismiss(t.id);
      }
    }, duration + 400);

    return () => clearTimeout(fallbackTimer);
  }, [t.id, duration]);

  const handleDismiss = (e) => {
    if (e) e.stopPropagation();
    isDismissedRef.current = true;
    toast.dismiss(t.id);
  };

  const getConfig = () => {
    switch (t.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.2]" />,
          iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
          borderColor: isDark ? 'border-emerald-500/20' : 'border-emerald-500/30',
          glow: 'shadow-emerald-500/5',
          progressBar: 'bg-gradient-to-r from-emerald-400 to-[#02CBA9]',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.2]" />,
          iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
          borderColor: isDark ? 'border-rose-500/20' : 'border-rose-500/30',
          glow: 'shadow-rose-500/5',
          progressBar: 'bg-gradient-to-r from-rose-500 to-red-600',
        };
      case 'loading':
        return {
          icon: <Loader2 className="w-4 h-4 text-[#1CC0F9] shrink-0 animate-spin stroke-[2.2]" />,
          iconBg: 'bg-[#1CC0F9]/10 border-[#1CC0F9]/20 text-[#1CC0F9]',
          borderColor: isDark ? 'border-[#1CC0F9]/20' : 'border-[#1CC0F9]/30',
          glow: 'shadow-[#1CC0F9]/5',
          progressBar: 'bg-gradient-to-r from-[#1CC0F9] to-[#02CBA9]',
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-[#7D71EB] dark:text-[#1CC0F9] shrink-0 stroke-[2]" />,
          iconBg: 'bg-[#7D71EB]/10 border-[#7D71EB]/20 text-[#7D71EB] dark:text-[#1CC0F9]',
          borderColor: isDark ? 'border-[#7D71EB]/20' : 'border-[#7D71EB]/30',
          glow: 'shadow-[#7D71EB]/5',
          progressBar: 'bg-gradient-to-r from-[#7D71EB] to-[#1CC0F9]',
        };
    }
  };

  const config = getConfig();

  return (
    <div
      onClick={handleDismiss}
      className={`
        heis-toast group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border
        backdrop-blur-xl transition-all duration-200 cursor-pointer select-none
        ${config.borderColor} ${config.glow} shadow-xl
        ${isDark ? 'bg-[#130d33]/92 text-slate-100 shadow-black/40' : 'bg-white/95 text-slate-800 shadow-slate-900/10'}
        ${t.visible ? 'animate-in fade-in-0 slide-in-from-top-3' : 'animate-out fade-out-0 slide-out-to-top-1'}
      `}
      style={{
        minWidth: '260px',
        maxWidth: '380px',
      }}
    >
      {/* Icono compacto estilizado */}
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${config.iconBg}`}>
        {config.icon}
      </div>

      {/* Contenido del Mensaje conciso */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-xs sm:text-[12.5px] font-semibold leading-snug break-words">
          {typeof t.message === 'function' ? t.message(t) : t.message}
        </div>
      </div>

      {/* Botón Cerrar minimalista */}
      <button
        type="button"
        onClick={handleDismiss}
        className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all shrink-0 cursor-pointer"
        title="Cerrar notificación"
      >
        <X className="w-3 h-3 stroke-[2.2]" />
      </button>

      {/* Micro-línea de progreso ultra-fina (1.5px) */}
      {t.type !== 'loading' && (
        <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-slate-100/40 dark:bg-white/5 overflow-hidden rounded-full">
          <div
            className={`h-full ${config.progressBar} toast-progress-bar origin-left`}
            style={{
              animationDuration: `${duration}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default UnifiedToastItem;
