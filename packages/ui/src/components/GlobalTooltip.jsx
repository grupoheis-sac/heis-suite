import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  FileText,
  Printer,
  Boxes,
  Layers,
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Settings,
  User,
  CreditCard,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  BookOpen,
  CalendarCheck,
  TrendingDown,
  TrendingUp,
  Flame,
  LayoutDashboard,
  Wallet,
  Users,
  Building2,
  Pill,
  Hotel,
  ShieldAlert,
  Sliders,
  Sun,
  Moon,
  LogOut,
  Command,
  Key
} from 'lucide-react';

/**
 * Parser inteligente de Tooltips para HEIS Suite (Restaurante, Ferretería, Botica, Hospedaje, SaaS).
 * Descompone títulos, subtítulos, atajos de teclado [F1] / (Ctrl+K), badges de estado y selecciona
 * un icono contextual de alta fidelidad con micro-paleta armónica.
 */
function parseTooltipData(rawText, target) {
  let text = (rawText || '').trim();
  const explicitTitle = target?.getAttribute('data-tooltip-title') || '';
  const explicitDesc = target?.getAttribute('data-tooltip-desc') || '';
  const explicitBadge = target?.getAttribute('data-tooltip-badge') || '';
  const explicitShortcut = target?.getAttribute('data-tooltip-shortcut') || target?.getAttribute('data-tooltip-key') || '';
  const explicitFooter = target?.getAttribute('data-tooltip-footer') || '';
  const explicitIcon = target?.getAttribute('data-tooltip-icon') || '';

  let shortcut = explicitShortcut;
  if (!shortcut) {
    const keyMatch = text.match(/\[([A-Za-z0-9\+\-\_\s]+)\]|\(([Ff]\d+|Ctrl\+[A-Za-z]|Alt\+[A-Za-z])\)/);
    if (keyMatch) {
      shortcut = keyMatch[1] || keyMatch[2];
      text = text.replace(keyMatch[0], '').trim();
    }
  }

  // Detección contextual de badges
  let badge = explicitBadge;
  const lowerText = text.toLowerCase();
  if (!badge) {
    if (/kds|cocina|preparaci[oó]n/i.test(lowerText)) {
      badge = 'KDS en Vivo';
    } else if (/mesas?|sal[oó]n/i.test(lowerText)) {
      badge = 'Salón POS';
    } else if (/disponible|libre/i.test(lowerText)) {
      badge = 'Disponible';
    } else if (/ocupad[ao]/i.test(lowerText)) {
      badge = 'Ocupada';
    } else if (/dispensaci[oó]n|farmacia|receta/i.test(lowerText)) {
      badge = 'Farmacia POS';
    } else if (/fefo|lote/i.test(lowerText)) {
      badge = 'Control FEFO';
    } else if (/digemid/i.test(lowerText)) {
      badge = 'Catálogo OPM';
    } else if (/rack|habitaci[oó]n|hotel/i.test(lowerText)) {
      badge = 'PMS Hotelero';
    } else if (/ferreter[ií]a|retail/i.test(lowerText)) {
      badge = 'Retail POS';
    } else if (/superadmin|maestro/i.test(lowerText)) {
      badge = 'SaaS Maestro';
    } else if (shortcut && !text.includes('\n') && !text.includes(' - ')) {
      badge = 'Acceso Rápido';
    }
  }

  let title = explicitTitle;
  let subtitle = explicitDesc;
  let details = [];

  if (!title) {
    if (text.includes('\n')) {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      title = lines[0];
      if (lines.length > 1) {
        if (lines[1].startsWith('•') || lines[1].startsWith('-')) {
          details = lines.slice(1);
        } else {
          subtitle = lines[1];
          if (lines.length > 2) {
            details = lines.slice(2);
          }
        }
      }
    } else if (text.includes(' - ')) {
      const parts = text.split(' - ');
      title = parts[0];
      subtitle = parts.slice(1).join(' - ');
    } else if (text.includes(': ') && !text.toLowerCase().startsWith('http')) {
      const parts = text.split(': ');
      title = parts[0];
      subtitle = parts.slice(1).join(': ');
    } else {
      title = text;
      // Subtítulo contextual inteligente por vertical
      if (lowerText.includes('dashboard')) {
        subtitle = 'Métricas, KPIs y resumen operativo en tiempo real';
      } else if (lowerText.includes('mesa') || lowerText.includes('salón') || lowerText.includes('salon')) {
        subtitle = 'Plano visual de mesas, cuentas y despacho de comandas';
      } else if (lowerText.includes('cocina') || lowerText.includes('kds')) {
        subtitle = 'Pantalla KDS de preparación para chefs en vivo';
      } else if (lowerText.includes('comanda') || lowerText.includes('orden') || lowerText.includes('historial')) {
        subtitle = 'Historial de órdenes, estado de entrega y auditoría';
      } else if (lowerText.includes('carta') || lowerText.includes('menú') || lowerText.includes('menu')) {
        subtitle = 'Gestión de platos, precios, recetas y disponibilidad';
      } else if (lowerText.includes('reserva')) {
        subtitle = 'Agenda de reservaciones y asignación de espacios';
      } else if (lowerText.includes('gasto')) {
        subtitle = 'Control de salidas de dinero y arqueo de caja chica';
      } else if (lowerText.includes('pos ferreter') || lowerText.includes('punto de venta ferreter')) {
        subtitle = 'Facturación rápida, lectores de código de barra y boletas';
      } else if (lowerText.includes('inventario') || lowerText.includes('kardex')) {
        subtitle = 'Control de existencias valorizadas y reporte SUNAT';
      } else if (lowerText.includes('dispensaci') || lowerText.includes('farmacia')) {
        subtitle = 'Venta de fármacos, control DCI y validación DIGEMID';
      } else if (lowerText.includes('medicamento')) {
        subtitle = 'Vademécum oficial de productos farmacéuticos';
      } else if (lowerText.includes('lote') || lowerText.includes('vencimiento')) {
        subtitle = 'Semáforo de vencimientos por rotación FEFO';
      } else if (lowerText.includes('temperatura') || lowerText.includes('humedad')) {
        subtitle = 'Registro ambiental según normativas DIGEMID BPA';
      } else if (lowerText.includes('habitaci') || lowerText.includes('rack')) {
        subtitle = 'Matriz visual de habitaciones, check-in y checkout';
      } else if (lowerText.includes('huésped') || lowerText.includes('huesped')) {
        subtitle = 'Directorio de pasajeros y ficha técnica MINCETUR';
      } else if (lowerText.includes('limpieza') || lowerText.includes('housekeeping')) {
        subtitle = 'Mantenimiento de habitaciones y reporte de camareras';
      } else if (lowerText.includes('tarifa') || lowerText.includes('temporada')) {
        subtitle = 'Precios dinámicos por temporada y tipo de habitación';
      } else if (lowerText.includes('administraci') || lowerText.includes('sede')) {
        subtitle = 'Gestión multi-sucursal, roles, personal y auditoría';
      } else if (lowerText.includes('configuraci') || lowerText.includes('ajuste')) {
        subtitle = 'Parámetros del sistema, identidad y copias de seguridad';
      } else if (lowerText.includes('buscar') || lowerText.includes('quicksearch')) {
        subtitle = 'Búsqueda universal de módulos, accesos y comandos (Ctrl+K)';
      } else if (lowerText.includes('modo') || lowerText.includes('tema')) {
        subtitle = 'Alternar interfaz entre modo claro y nocturno';
      } else if (lowerText.includes('imprim') || lowerText.includes('ticket')) {
        subtitle = 'Envío a impresora térmica de 80mm o 58mm';
      }
    }
  }

  let footerLeft = explicitFooter;
  if (!footerLeft && shortcut) {
    footerLeft = 'Atajo de teclado';
  }

  // Selección de ícono y tema cromático HEIS
  let iconType = 'sparkles';
  let iconTheme = 'teal';
  const combined = (title + ' ' + subtitle).toLowerCase();

  if (explicitIcon) {
    iconType = explicitIcon;
  } else if (combined.includes('dashboard')) {
    iconType = 'dashboard';
    iconTheme = 'amber';
  } else if (combined.includes('mesa') || combined.includes('salón') || combined.includes('salon')) {
    iconType = 'mesas';
    iconTheme = 'amber';
  } else if (combined.includes('cocina') || combined.includes('kds') || combined.includes('chef')) {
    iconType = 'cocina';
    iconTheme = 'rose';
  } else if (combined.includes('comanda') || combined.includes('orden') || combined.includes('ticket') || combined.includes('historial')) {
    iconType = 'receipt';
    iconTheme = 'amber';
  } else if (combined.includes('carta') || combined.includes('menú') || combined.includes('menu') || combined.includes('plato')) {
    iconType = 'menu';
    iconTheme = 'amber';
  } else if (combined.includes('reserva') || combined.includes('agenda')) {
    iconType = 'reservas';
    iconTheme = 'emerald';
  } else if (combined.includes('gasto') || combined.includes('costo') || combined.includes('salida')) {
    iconType = 'gastos';
    iconTheme = 'rose';
  } else if (combined.includes('pos ferreter') || combined.includes('punto de venta ferreter')) {
    iconType = 'ferreteria-pos';
    iconTheme = 'indigo';
  } else if (combined.includes('ferreter') || combined.includes('retail')) {
    iconType = 'ferreteria-pos';
    iconTheme = 'indigo';
  } else if (combined.includes('inventario') || combined.includes('kardex') || combined.includes('stock')) {
    iconType = 'ferreteria-inv';
    iconTheme = 'indigo';
  } else if (combined.includes('caja') || combined.includes('finanza')) {
    iconType = 'ferreteria-caja';
    iconTheme = 'teal';
  } else if (combined.includes('cliente') || combined.includes('obra')) {
    iconType = 'ferreteria-clientes';
    iconTheme = 'indigo';
  } else if (combined.includes('cotizaci')) {
    iconType = 'ferreteria-cotizaciones';
    iconTheme = 'indigo';
  } else if (combined.includes('dispensaci') || combined.includes('botica') || combined.includes('farmacia')) {
    iconType = 'botica-pos';
    iconTheme = 'emerald';
  } else if (combined.includes('medicamento') || combined.includes('dci')) {
    iconType = 'botica-meds';
    iconTheme = 'emerald';
  } else if (combined.includes('lote') || combined.includes('fefo') || combined.includes('vencimiento')) {
    iconType = 'botica-lotes';
    iconTheme = 'emerald';
  } else if (combined.includes('temperatura') || combined.includes('humedad') || combined.includes('bpa')) {
    iconType = 'botica-temp';
    iconTheme = 'emerald';
  } else if (combined.includes('digemid')) {
    iconType = 'botica-digemid';
    iconTheme = 'emerald';
  } else if (combined.includes('habitaci') || combined.includes('rack') || combined.includes('hotel') || combined.includes('hospedaje')) {
    iconType = 'hospedaje-rack';
    iconTheme = 'violet';
  } else if (combined.includes('huésped') || combined.includes('huesped')) {
    iconType = 'hospedaje-huespedes';
    iconTheme = 'violet';
  } else if (combined.includes('limpieza') || combined.includes('housekeeping')) {
    iconType = 'hospedaje-limpieza';
    iconTheme = 'violet';
  } else if (combined.includes('tarifa') || combined.includes('temporada')) {
    iconType = 'hospedaje-tarifas';
    iconTheme = 'violet';
  } else if (combined.includes('superadmin') || combined.includes('saas')) {
    iconType = 'superadmin';
    iconTheme = 'purple';
  } else if (combined.includes('administraci') || combined.includes('sede')) {
    iconType = 'building';
    iconTheme = 'purple';
  } else if (combined.includes('config') || combined.includes('ajuste') || combined.includes('sistema')) {
    iconType = 'settings';
    iconTheme = 'slate';
  } else if (combined.includes('busc') || combined.includes('filtr')) {
    iconType = 'search';
    iconTheme = 'cyan';
  } else if (combined.includes('imprim') || combined.includes('ticket')) {
    iconType = 'printer';
    iconTheme = 'teal';
  } else if (combined.includes('tema') || combined.includes('modo')) {
    iconType = 'theme';
    iconTheme = 'cyan';
  } else if (combined.includes('cerrar') || combined.includes('logout') || combined.includes('salir')) {
    iconType = 'logout';
    iconTheme = 'rose';
  } else {
    iconType = 'sparkles';
    iconTheme = 'teal';
  }

  return {
    title,
    subtitle,
    details,
    badge,
    shortcut,
    footerLeft,
    iconType,
    iconTheme,
  };
}

function getTooltipIcon(iconType) {
  switch (iconType) {
    case 'dashboard': return <LayoutDashboard className="w-3.5 h-3.5" />;
    case 'mesas': return <UtensilsCrossed className="w-3.5 h-3.5" />;
    case 'cocina': return <ChefHat className="w-3.5 h-3.5" />;
    case 'receipt': return <Receipt className="w-3.5 h-3.5" />;
    case 'menu': return <BookOpen className="w-3.5 h-3.5" />;
    case 'reservas': return <CalendarCheck className="w-3.5 h-3.5" />;
    case 'gastos': return <TrendingDown className="w-3.5 h-3.5" />;
    case 'ferreteria-pos': return <ShoppingBag className="w-3.5 h-3.5" />;
    case 'ferreteria-inv': return <Boxes className="w-3.5 h-3.5" />;
    case 'ferreteria-caja': return <Wallet className="w-3.5 h-3.5" />;
    case 'ferreteria-clientes': return <Users className="w-3.5 h-3.5" />;
    case 'ferreteria-cotizaciones': return <FileText className="w-3.5 h-3.5" />;
    case 'botica-pos': return <Pill className="w-3.5 h-3.5" />;
    case 'botica-meds': return <Boxes className="w-3.5 h-3.5" />;
    case 'botica-lotes': return <CalendarCheck className="w-3.5 h-3.5" />;
    case 'botica-temp': return <Flame className="w-3.5 h-3.5" />;
    case 'botica-digemid': return <FileText className="w-3.5 h-3.5" />;
    case 'hospedaje-rack': return <Hotel className="w-3.5 h-3.5" />;
    case 'hospedaje-huespedes': return <Users className="w-3.5 h-3.5" />;
    case 'hospedaje-limpieza': return <Sparkles className="w-3.5 h-3.5" />;
    case 'hospedaje-tarifas': return <Sliders className="w-3.5 h-3.5" />;
    case 'superadmin': return <ShieldAlert className="w-3.5 h-3.5" />;
    case 'building': return <Building2 className="w-3.5 h-3.5" />;
    case 'settings': return <Settings className="w-3.5 h-3.5" />;
    case 'search': return <Search className="w-3.5 h-3.5" />;
    case 'printer': return <Printer className="w-3.5 h-3.5" />;
    case 'theme': return <Sun className="w-3.5 h-3.5" />;
    case 'logout': return <LogOut className="w-3.5 h-3.5" />;
    case 'flame': return <Flame className="w-3.5 h-3.5" />;
    default: return <Sparkles className="w-3.5 h-3.5" />;
  }
}

/**
 * GlobalTooltip: Motor global de tooltips para HEIS Suite (Pill & Floating Island)
 * Renderiza tarjetas de micro-ayuda de alta fidelidad con iconos de vertical, badges, atajos y flecha de precisión.
 */
export default function GlobalTooltip() {
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: '',
    parsed: null,
    targetRect: null,
    position: 'top', // 'top' | 'bottom' | 'right'
    id: 0,
  });

  const [coords, setCoords] = useState({
    boxLeft: 0,
    boxTop: 0,
    arrowLeft: '50%',
    arrowTop: '50%',
    actualPosition: 'top',
    ready: false,
  });

  const tooltipRef = useRef(null);
  const timerRef = useRef(null);
  const currentTargetRef = useRef(null);
  const idCounterRef = useRef(0);

  useEffect(() => {
    const handlePointerOver = (e) => {
      const target = e.target.closest('[data-tooltip], [title]');
      if (!target || target.closest('[data-no-tooltip]')) return;

      if (currentTargetRef.current === target && tooltip.visible) {
        return;
      }

      let text = target.getAttribute('data-tooltip');
      if (!text && target.hasAttribute('title')) {
        text = target.getAttribute('title');
        if (text && text.trim()) {
          target.setAttribute('data-tooltip', text.trim());
          target.setAttribute('data-original-title', text.trim());
          target.removeAttribute('title');
        }
      }

      if (!text || !text.trim()) return;

      currentTargetRef.current = target;

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!currentTargetRef.current) return;
        const rect = currentTargetRef.current.getBoundingClientRect();

        if (rect.width === 0 && rect.height === 0) return;

        let position = 'top';
        const inSidebar = Boolean(currentTargetRef.current?.closest('aside')) || rect.left < 120;
        if (inSidebar) {
          position = 'right';
        } else if (rect.top < 64) {
          position = 'bottom';
        } else {
          position = 'top';
        }

        const parsed = parseTooltipData(text, currentTargetRef.current);

        idCounterRef.current += 1;
        setCoords({
          boxLeft: 0,
          boxTop: 0,
          arrowLeft: '50%',
          arrowTop: '50%',
          actualPosition: position,
          ready: false,
        });

        setTooltip({
          visible: true,
          text: text.trim(),
          parsed,
          targetRect: {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          },
          position,
          id: idCounterRef.current,
        });
      }, 70);
    };

    const hideTooltip = () => {
      clearTimeout(timerRef.current);
      currentTargetRef.current = null;
      setTooltip({
        visible: false,
        text: '',
        parsed: null,
        targetRect: null,
        position: 'top',
        id: 0,
      });
      setCoords({
        boxLeft: 0,
        boxTop: 0,
        arrowLeft: '50%',
        arrowTop: '50%',
        actualPosition: 'top',
        ready: false,
      });
    };

    const handlePointerOut = (e) => {
      if (!currentTargetRef.current || !document.body.contains(currentTargetRef.current)) {
        hideTooltip();
        return;
      }
      if (!currentTargetRef.current.contains(e.relatedTarget)) {
        hideTooltip();
      }
    };

    const handlePointerDown = () => {
      hideTooltip();
    };

    const handleClick = () => {
      hideTooltip();
    };

    const handleScroll = () => {
      hideTooltip();
    };

    const handleResize = () => {
      hideTooltip();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        hideTooltip();
      }
    };

    document.addEventListener('pointerover', handlePointerOver, true);
    document.addEventListener('pointerout', handlePointerOut, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointercancel', hideTooltip, true);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener('pointerover', handlePointerOver, true);
      document.removeEventListener('pointerout', handlePointerOut, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointercancel', hideTooltip, true);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  useLayoutEffect(() => {
    if (!tooltip.visible || !tooltip.targetRect || !tooltipRef.current) return;

    // Si el elemento objetivo ya no está conectado al DOM (fue desmontado o colapsado), ocultar inmediatamente
    if (currentTargetRef.current && !document.body.contains(currentTargetRef.current)) {
      hideTooltip();
      return;
    }

    const rect = tooltip.targetRect;
    const tooltipEl = tooltipRef.current;

    const w = tooltipEl.offsetWidth || 230;
    const h = tooltipEl.offsetHeight || 50;

    const margin = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let boxLeft = 0;
    let boxTop = 0;
    let arrowLeft = '50%';
    let arrowTop = '50%';
    let actualPosition = tooltip.position;

    if (tooltip.position === 'top' || tooltip.position === 'bottom') {
      const targetCenterX = rect.left + rect.width / 2;
      const idealLeft = targetCenterX - w / 2;

      const minLeft = margin;
      const maxLeft = Math.max(margin, viewportWidth - w - margin);
      boxLeft = Math.max(minLeft, Math.min(maxLeft, idealLeft));

      if (tooltip.position === 'top') {
        if (rect.top - h - 10 < margin) {
          actualPosition = 'bottom';
          boxTop = rect.bottom + 10;
        } else {
          boxTop = rect.top - h - 10;
        }
      } else {
        if (rect.bottom + 10 + h > viewportHeight - margin) {
          actualPosition = 'top';
          boxTop = rect.top - h - 10;
        } else {
          boxTop = rect.bottom + 10;
        }
      }

      const targetArrowX = targetCenterX - boxLeft;
      const clampedArrowX = Math.max(16, Math.min(w - 16, targetArrowX));
      arrowLeft = `${clampedArrowX}px`;
    } else if (tooltip.position === 'right') {
      const asideEl = currentTargetRef.current?.closest('aside');
      const asideRight = asideEl ? asideEl.getBoundingClientRect().right : 0;
      boxLeft = Math.max(rect.right + 12, asideRight + 12);
      const targetCenterY = rect.top + rect.height / 2;
      const idealTop = targetCenterY - h / 2;

      if (boxLeft + w > viewportWidth - margin) {
        actualPosition = rect.top < 64 ? 'bottom' : 'top';
        const targetCenterX = rect.left + rect.width / 2;
        boxLeft = Math.max(margin, Math.min(viewportWidth - w - margin, targetCenterX - w / 2));
        boxTop = actualPosition === 'bottom' ? rect.bottom + 10 : rect.top - h - 10;
        arrowLeft = `${Math.max(16, Math.min(w - 16, targetCenterX - boxLeft))}px`;
      } else {
        const minTop = margin;
        const maxTop = Math.max(margin, viewportHeight - h - margin);
        boxTop = Math.max(minTop, Math.min(maxTop, idealTop));

        const targetArrowY = targetCenterY - boxTop;
        const clampedArrowY = Math.max(12, Math.min(h - 12, targetArrowY));
        arrowTop = `${clampedArrowY}px`;
      }
    }

    setCoords({
      boxLeft,
      boxTop,
      arrowLeft,
      arrowTop,
      actualPosition,
      ready: true,
    });
  }, [tooltip.visible, tooltip.id]);

  if (!tooltip.visible || !tooltip.text || typeof document === 'undefined') {
    return null;
  }

  const parsed = tooltip.parsed || {
    title: tooltip.text,
    subtitle: '',
    details: [],
    badge: '',
    shortcut: '',
    footerLeft: '',
    iconType: 'sparkles',
    iconTheme: 'teal',
  };

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      aria-hidden="true"
      style={{
        left: coords.ready ? `${coords.boxLeft}px` : '0px',
        top: coords.ready ? `${coords.boxTop}px` : '0px',
        opacity: coords.ready ? 1 : 0,
        visibility: coords.ready ? 'visible' : 'hidden',
      }}
      className="fixed z-[99999] pointer-events-none select-none transition-opacity duration-150 w-max"
    >
      {/* Tarjeta de Tooltip Flotante tipo Píldora — 100% Opaco, Texto Completo y Centrado */}
      <div className="relative rounded-2xl bg-white dark:bg-[#151036] text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-white/15 shadow-xl shadow-slate-900/15 dark:shadow-[0_15px_45px_rgba(0,0,0,0.7)] p-2.5 sm:p-3 min-w-[160px] max-w-[360px] w-auto animate-in fade-in-0 zoom-in-95 duration-150 select-none">
        <div className={`flex gap-2.5 ${parsed.subtitle ? 'items-start' : 'items-center'}`}>
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border ${
              parsed.iconTheme === 'emerald'
                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                : parsed.iconTheme === 'rose'
                ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                : parsed.iconTheme === 'indigo'
                ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                : parsed.iconTheme === 'violet'
                ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30'
                : parsed.iconTheme === 'purple'
                ? 'bg-[#7D71EB]/10 dark:bg-[#7D71EB]/20 text-[#7D71EB] dark:text-[#7D71EB] border-[#7D71EB]/25 dark:border-[#7D71EB]/30'
                : parsed.iconTheme === 'teal'
                ? 'bg-[#02CBA9]/10 dark:bg-[#02CBA9]/20 text-[#02CBA9] dark:text-[#02CBA9] border-[#02CBA9]/25 dark:border-[#02CBA9]/30'
                : parsed.iconTheme === 'cyan'
                ? 'bg-[#1CC0F9]/10 dark:bg-[#1CC0F9]/20 text-[#1CC0F9] dark:text-[#1CC0F9] border-[#1CC0F9]/25 dark:border-[#1CC0F9]/30'
                : parsed.iconTheme === 'amber'
                ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
            }`}
          >
            {getTooltipIcon(parsed.iconType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black tracking-tight font-heading text-slate-900 dark:text-white leading-snug break-words">
                {parsed.title}
              </span>
              {parsed.shortcut && (
                <kbd className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 border border-slate-200/90 dark:border-white/10 text-[9.5px] font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs shrink-0">
                  {parsed.shortcut}
                </kbd>
              )}
              {parsed.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border shrink-0 shadow-2xs ${
                    parsed.badge.toLowerCase().includes('kds') || parsed.badge.toLowerCase().includes('vivo') || parsed.badge.toLowerCase().includes('crítico')
                      ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                      : parsed.badge.toLowerCase().includes('pos') || parsed.badge.toLowerCase().includes('retail')
                      ? 'bg-[#02CBA9]/10 text-[#02CBA9] dark:text-[#1CC0F9] border-[#02CBA9]/30'
                      : parsed.badge.toLowerCase().includes('digemid') || parsed.badge.toLowerCase().includes('fefo')
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                      : parsed.badge.toLowerCase().includes('pms') || parsed.badge.toLowerCase().includes('hotel')
                      ? 'bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                  }`}
                >
                  {parsed.badge}
                </span>
              )}
            </div>
            {parsed.subtitle && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1 font-medium break-words">
                {parsed.subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Detalles extendidos en viñetas si existen */}
        {parsed.details && parsed.details.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10 text-[10px] space-y-1 text-slate-600 dark:text-slate-300 font-medium">
            {parsed.details.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#02CBA9] shrink-0" />
                <span className="break-words">{detail.replace(/^[•\-\*]\s*/, '')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer si hay información complementaria */}
        {parsed.footerLeft && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-400 font-medium text-[9.5px] truncate">
              {parsed.footerLeft}
            </span>
          </div>
        )}

        {/* Flechita indicadora con exactitud de ángulo y soporte Dark Mode */}
        {coords.actualPosition === 'top' && (
          <div
            style={{ left: coords.arrowLeft }}
            className="absolute top-full -translate-x-1/2 -mt-px w-2.5 h-2.5 overflow-hidden pointer-events-none"
          >
            <div className="w-1.5 h-1.5 bg-white dark:bg-[#151036] border-r border-b border-slate-200/90 dark:border-white/15 rotate-45 mx-auto -translate-y-1/2 shadow-2xs" />
          </div>
        )}

        {coords.actualPosition === 'bottom' && (
          <div
            style={{ left: coords.arrowLeft }}
            className="absolute bottom-full -translate-x-1/2 -mb-px w-2.5 h-2.5 overflow-hidden pointer-events-none"
          >
            <div className="w-1.5 h-1.5 bg-white dark:bg-[#151036] border-l border-t border-slate-200/90 dark:border-white/15 rotate-45 mx-auto translate-y-1/2 shadow-2xs" />
          </div>
        )}

        {coords.actualPosition === 'right' && (
          <div
            style={{ top: coords.arrowTop }}
            className="absolute right-full -translate-y-1/2 -mr-px w-2.5 h-2.5 overflow-hidden pointer-events-none"
          >
            <div className="w-1.5 h-1.5 bg-white dark:bg-[#151036] border-l border-b border-slate-200/90 dark:border-white/15 rotate-45 my-auto translate-x-1/2 shadow-2xs" />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
