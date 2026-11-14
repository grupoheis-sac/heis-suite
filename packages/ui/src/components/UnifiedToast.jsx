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
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.2]" />,
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          glow: 'shadow-emerald-500/10',
          progressBar: 'bg-gradient-to-r from-emerald-500 to-[#02CBA9]',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2.2]" />,
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
          glow: 'shadow-rose-500/10',
          progressBar: 'bg-gradient-to-r from-rose-500 to-red-600',
        };
      case 'loading':
        return {
          icon: <Loader2 className="w-4 h-4 text-[#1CC0F9] shrink-0 animate-spin stroke-[2.2]" />,
          iconBg: 'bg-[#1CC0F9]/15 border-[#1CC0F9]/30 text-[#1CC0F9]',
          glow: 'shadow-[#1CC0F9]/10',
          progressBar: 'bg-gradient-to-r from-[#1CC0F9] to-[#02CBA9]',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 stroke-[2.2]" />,
          iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400',
          glow: 'shadow-sky-500/10',
          progressBar: 'bg-gradient-to-r from-sky-500 to-indigo-500',
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
        ${isDark
          ? 'bg-[#130d33]/95 text-slate-100 border-white/10 ring-1 ring-white/5 shadow-2xl shadow-black/50'
          : 'bg-white text-slate-900 border-slate-200/90 ring-1 ring-slate-900/10 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.18),0_4px_12px_-2px_rgba(15,23,42,0.08)]'}
        ${t.visible ? 'animate-in fade-in-0 slide-in-from-bottom-2' : 'animate-out fade-out-0 slide-out-to-bottom-1'}
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

      {/* Barra de progreso de descarga / temporizador */}
      {t.type !== 'loading' && (
        <div className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-slate-100 dark:bg-white/10 overflow-hidden rounded-full">
          <div
            className={`h-full ${config.progressBar} toast-progress-bar origin-left rounded-full`}
            style={{
              animationDuration: `${duration}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Componente Toast / Banner flotante para uso directo en vistas con estado local
 */
export function UnifiedToast({ type = 'info', message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!onClose || !duration) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.2]" />,
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2.2]" />,
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
        };
      case 'loading':
        return {
          icon: <Loader2 className="w-4 h-4 text-[#1CC0F9] shrink-0 animate-spin stroke-[2.2]" />,
          iconBg: 'bg-[#1CC0F9]/15 border-[#1CC0F9]/30 text-[#1CC0F9]',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 stroke-[2.2]" />,
          iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400',
        };
    }
  };

  const config = getConfig();

  return (
    <div
      className={`
        heis-toast relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border
        backdrop-blur-xl transition-all duration-200 select-none shadow-lg
        ${isDark
          ? 'bg-[#130d33]/95 text-slate-100 border-white/10 ring-1 ring-white/5'
          : 'bg-white text-slate-900 border-slate-200/90 ring-1 ring-slate-900/10'}
      `}
    >
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${config.iconBg}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-xs sm:text-[12.5px] font-semibold leading-snug break-words">
          {message}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all shrink-0 cursor-pointer"
          title="Cerrar notificación"
        >
          <X className="w-3 h-3 stroke-[2.2]" />
        </button>
      )}
    </div>
  );
}

export default UnifiedToastItem;
