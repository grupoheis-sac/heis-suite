/**
 * categoryColors.js — Sistema de codificación cromática y diseño táctil para farmacia/botica
 * Asigna paletas contrastadas, accesibles y vibrantes según la categoría farmacológica
 */
import {
  Pill, Sparkles, ShieldAlert, Activity, HeartPulse,
  Stethoscope, Zap, Sun, Cross, Package, Clock,
  Wind, Shield
} from 'lucide-react';

export const CATEGORY_PALETTES = {
  TODOS: {
    id: 'TODOS',
    nombre: 'Todos los Fármacos',
    icon: Package,
    colorKey: 'slate',
    tag: 'General',
    activeTile: 'bg-slate-900 text-white shadow-xs',
    inactiveTile: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 shadow-2xs',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    cardBorder: 'border-slate-200 hover:border-slate-400',
    borderLColor: 'border-l-slate-400',
    stripColor: 'bg-slate-700',
    btnCaja: 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20',
    accentText: 'text-slate-700'
  },
  ANALGESICOS: {
    id: 'ANALGESICOS',
    nombre: 'Analgésicos y Dolor',
    icon: Zap,
    colorKey: 'blue',
    tag: 'Dolor / Inflamación',
    activeTile: 'bg-blue-600 text-white shadow-xs',
    inactiveTile: 'bg-blue-50/70 hover:bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs',
    badge: 'bg-blue-50 text-blue-800 border border-blue-200/90',
    cardBorder: 'border-blue-200 hover:border-blue-400',
    borderLColor: 'border-l-blue-500',
    stripColor: 'bg-blue-500',
    btnCaja: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
    accentText: 'text-blue-700'
  },
  ANTIBIOTICOS: {
    id: 'ANTIBIOTICOS',
    nombre: 'Antibióticos (Receta)',
    icon: ShieldAlert,
    colorKey: 'rose',
    tag: 'Uso Controlado',
    activeTile: 'bg-rose-600 text-white shadow-xs',
    inactiveTile: 'bg-rose-50/70 hover:bg-rose-100 text-rose-900 border border-rose-200 shadow-2xs',
    badge: 'bg-rose-50 text-rose-800 border border-rose-200/90',
    cardBorder: 'border-rose-200 hover:border-rose-400',
    borderLColor: 'border-l-rose-500',
    stripColor: 'bg-rose-500',
    btnCaja: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
    accentText: 'text-rose-700'
  },
  GASTROINTESTINALES: {
    id: 'GASTROINTESTINALES',
    nombre: 'Gastrointestinales',
    icon: HeartPulse,
    colorKey: 'emerald',
    tag: 'Digestivo / Antiácido',
    activeTile: 'bg-emerald-600 text-white shadow-xs',
    inactiveTile: 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs',
    badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    borderLColor: 'border-l-emerald-500',
    stripColor: 'bg-emerald-500',
    btnCaja: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
    accentText: 'text-emerald-700'
  },
  ANTIHISTAMINICOS: {
    id: 'ANTIHISTAMINICOS',
    nombre: 'Antihistamínicos',
    icon: Sparkles,
    colorKey: 'purple',
    tag: 'Alergias / Rinitis',
    activeTile: 'bg-purple-600 text-white shadow-xs',
    inactiveTile: 'bg-purple-50/70 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs',
    badge: 'bg-purple-50 text-purple-800 border border-purple-200/90',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    borderLColor: 'border-l-purple-500',
    stripColor: 'bg-purple-500',
    btnCaja: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
    accentText: 'text-purple-700'
  },
  RESPIRATORIOS: {
    id: 'RESPIRATORIOS',
    nombre: 'Respiratorios / Gripe',
    icon: Wind,
    colorKey: 'sky',
    tag: 'Bronquios / Tos',
    activeTile: 'bg-sky-600 text-white shadow-xs',
    inactiveTile: 'bg-sky-50/70 hover:bg-sky-100 text-sky-900 border border-sky-200 shadow-2xs',
    badge: 'bg-sky-50 text-sky-800 border border-sky-200/90',
    cardBorder: 'border-sky-200 hover:border-sky-400',
    borderLColor: 'border-l-sky-500',
    stripColor: 'bg-sky-500',
    btnCaja: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20',
    accentText: 'text-sky-700'
  },
  VITAMINAS: {
    id: 'VITAMINAS',
    nombre: 'Vitaminas y Suplementos',
    icon: Sun,
    colorKey: 'amber',
    tag: 'Nutrición / Vigor',
    activeTile: 'bg-amber-500 text-white shadow-xs',
    inactiveTile: 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200/90',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    borderLColor: 'border-l-amber-500',
    stripColor: 'bg-amber-500',
    btnCaja: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    accentText: 'text-amber-700'
  },
  INSUMOS: {
    id: 'INSUMOS',
    nombre: 'Insumos y Curación',
    icon: Cross,
    colorKey: 'teal',
    tag: 'Algodón / Gasas',
    activeTile: 'bg-teal-600 text-white shadow-xs',
    inactiveTile: 'bg-teal-50/70 hover:bg-teal-100 text-teal-900 border border-teal-200 shadow-2xs',
    badge: 'bg-teal-50 text-teal-800 border border-teal-200/90',
    cardBorder: 'border-teal-200 hover:border-teal-400',
    borderLColor: 'border-l-teal-500',
    stripColor: 'bg-teal-500',
    btnCaja: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20',
    accentText: 'text-teal-700'
  },
  CARDIOVASCULAR: {
    id: 'CARDIOVASCULAR',
    nombre: 'Cardiovasculares',
    icon: Activity,
    colorKey: 'red',
    tag: 'Presión / Corazón',
    activeTile: 'bg-red-600 text-white shadow-xs',
    inactiveTile: 'bg-red-50/70 hover:bg-red-100 text-red-900 border border-red-200 shadow-2xs',
    badge: 'bg-red-50 text-red-800 border border-red-200/90',
    cardBorder: 'border-red-200 hover:border-red-400',
    borderLColor: 'border-l-red-500',
    stripColor: 'bg-red-600',
    btnCaja: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20',
    accentText: 'text-red-700'
  },
  RECETA: {
    id: 'RECETA',
    nombre: 'Con Receta Médica',
    icon: Stethoscope,
    colorKey: 'rose',
    tag: 'Filtro Clínico',
    activeTile: 'bg-rose-600 text-white shadow-xs',
    inactiveTile: 'bg-rose-50/80 hover:bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs',
    badge: 'bg-rose-50 text-rose-800 border border-rose-200',
    cardBorder: 'border-rose-200 hover:border-rose-400',
    borderLColor: 'border-l-rose-500',
    stripColor: 'bg-rose-600',
    btnCaja: 'bg-rose-600 text-white',
    accentText: 'text-rose-700'
  },
  FRACCION: {
    id: 'FRACCION',
    nombre: 'Fraccionables (Unidad)',
    icon: Pill,
    colorKey: 'cyan',
    tag: 'Filtro Clínico',
    activeTile: 'bg-cyan-600 text-white shadow-xs',
    inactiveTile: 'bg-cyan-50/80 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-2xs',
    badge: 'bg-cyan-50 text-cyan-800 border border-cyan-200',
    cardBorder: 'border-cyan-200 hover:border-cyan-400',
    borderLColor: 'border-l-cyan-500',
    stripColor: 'bg-cyan-600',
    btnCaja: 'bg-cyan-600 text-white',
    accentText: 'text-cyan-700'
  },
  FEFO: {
    id: 'FEFO',
    nombre: 'Próximos a Vencer (FEFO)',
    icon: Clock,
    colorKey: 'amber',
    tag: 'Filtro FEFO',
    activeTile: 'bg-amber-600 text-white shadow-xs',
    inactiveTile: 'bg-amber-50/80 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    borderLColor: 'border-l-amber-500',
    stripColor: 'bg-amber-500',
    btnCaja: 'bg-amber-600 text-white',
    accentText: 'text-amber-700'
  }
};

/**
 * Normaliza y clasifica cualquier categoría (sea texto de BD o ID)
 */
export function getCategoryConfig(cat) {
  if (!cat) return CATEGORY_PALETTES.TODOS;

  const raw = typeof cat === 'object' ? (cat.nombre || '') : String(cat);
  const clean = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (clean.includes('analges') || clean.includes('inflam') || clean.includes('dolor')) {
    return CATEGORY_PALETTES.ANALGESICOS;
  }
  if (clean.includes('antibiot') || clean.includes('antimicrob') || clean.includes('bacter')) {
    return CATEGORY_PALETTES.ANTIBIOTICOS;
  }
  if (clean.includes('gastro') || clean.includes('digest') || clean.includes('estom')) {
    return CATEGORY_PALETTES.GASTROINTESTINALES;
  }
  if (clean.includes('antihist') || clean.includes('alerg')) {
    return CATEGORY_PALETTES.ANTIHISTAMINICOS;
  }
  if (clean.includes('respirat') || clean.includes('pulmon') || clean.includes('gripe') || clean.includes('tos')) {
    return CATEGORY_PALETTES.RESPIRATORIOS;
  }
  if (clean.includes('vitam') || clean.includes('suplement') || clean.includes('mineral')) {
    return CATEGORY_PALETTES.VITAMINAS;
  }
  if (clean.includes('insumo') || clean.includes('curac') || clean.includes('auxil') || clean.includes('material')) {
    return CATEGORY_PALETTES.INSUMOS;
  }
  if (clean.includes('cardio') || clean.includes('presion') || clean.includes('hipertens')) {
    return CATEGORY_PALETTES.CARDIOVASCULAR;
  }

  // Si coincide con alguna clave directa
  if (CATEGORY_PALETTES[raw]) {
    return CATEGORY_PALETTES[raw];
  }

  // Configuración genérica para categorías personalizadas
  return {
    id: clean,
    nombre: raw,
    icon: Pill,
    colorKey: 'indigo',
    tag: 'Fármaco',
    activeTile: 'bg-indigo-600 text-white shadow-xs',
    inactiveTile: 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs',
    badge: 'bg-indigo-50 text-indigo-800 border border-indigo-200/90',
    cardBorder: 'border-indigo-200 hover:border-indigo-400',
    borderLColor: 'border-l-indigo-500',
    stripColor: 'bg-indigo-500',
    btnCaja: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    accentText: 'text-indigo-700'
  };
}
