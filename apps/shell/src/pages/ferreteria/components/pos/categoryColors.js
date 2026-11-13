/**
 * categoryColors.js — Sistema cromático y categorización visual para Ferretería
 * Asigna paletas contrastadas, accesibles y profesionales para las familias ferreteras.
 */
import {
  Package,
  Hammer,
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Disc,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  Boxes
} from 'lucide-react';

export const CATEGORY_PALETTES = {
  TODOS: {
    id: 'TODOS',
    nombre: 'Todos los Artículos',
    icon: Package,
    colorKey: 'slate',
    tag: 'General',
    activeTile: 'bg-slate-900 text-white shadow-xs',
    inactiveTile: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 shadow-2xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    cardBorder: 'border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600',
    borderLColor: 'border-l-slate-400',
    stripColor: 'bg-slate-700',
    btnCaja: 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20',
    accentText: 'text-slate-700 dark:text-slate-300'
  },
  CONSTRUCCION: {
    id: 'CONSTRUCCION',
    nombre: 'Construcción y Obra',
    icon: Hammer,
    colorKey: 'amber',
    tag: 'Cemento / Fierro / Arena',
    activeTile: 'bg-amber-600 text-white shadow-xs',
    inactiveTile: 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    cardBorder: 'border-amber-200 hover:border-amber-400 dark:border-amber-800/60 dark:hover:border-amber-600',
    borderLColor: 'border-l-amber-500',
    stripColor: 'bg-amber-500',
    btnCaja: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    accentText: 'text-amber-700 dark:text-amber-400'
  },
  HERRAMIENTAS: {
    id: 'HERRAMIENTAS',
    nombre: 'Herramientas y Equipos',
    icon: Wrench,
    colorKey: 'indigo',
    tag: 'Manuales / Eléctricas',
    activeTile: 'bg-indigo-600 text-white shadow-xs',
    inactiveTile: 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-300',
    badge: 'bg-indigo-50 text-indigo-800 border border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    cardBorder: 'border-indigo-200 hover:border-indigo-400 dark:border-indigo-800/60 dark:hover:border-indigo-600',
    borderLColor: 'border-l-indigo-500',
    stripColor: 'bg-indigo-600',
    btnCaja: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
    accentText: 'text-indigo-700 dark:text-indigo-400'
  },
  ELECTRICIDAD: {
    id: 'ELECTRICIDAD',
    nombre: 'Electricidad e Iluminación',
    icon: Zap,
    colorKey: 'yellow',
    tag: 'Cables / Llaves / Focos',
    activeTile: 'bg-yellow-500 text-slate-900 font-bold shadow-xs',
    inactiveTile: 'bg-yellow-50/80 hover:bg-yellow-100 text-yellow-900 border border-yellow-200 shadow-2xs dark:bg-yellow-950/40 dark:border-yellow-800/60 dark:text-yellow-300',
    badge: 'bg-yellow-50 text-yellow-800 border border-yellow-200/90 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/60',
    cardBorder: 'border-yellow-200 hover:border-yellow-400 dark:border-yellow-800/60 dark:hover:border-yellow-600',
    borderLColor: 'border-l-yellow-500',
    stripColor: 'bg-yellow-500',
    btnCaja: 'bg-yellow-500 hover:bg-yellow-600 text-slate-900 shadow-yellow-500/20 font-bold',
    accentText: 'text-yellow-700 dark:text-yellow-400'
  },
  GASFITERIA: {
    id: 'GASFITERIA',
    nombre: 'Gasfitería y Plomería',
    icon: Droplets,
    colorKey: 'sky',
    tag: 'Tubos / Pegamento / Válvulas',
    activeTile: 'bg-sky-600 text-white shadow-xs',
    inactiveTile: 'bg-sky-50/70 hover:bg-sky-100 text-sky-900 border border-sky-200 shadow-2xs dark:bg-sky-950/40 dark:border-sky-800/60 dark:text-sky-300',
    badge: 'bg-sky-50 text-sky-800 border border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    cardBorder: 'border-sky-200 hover:border-sky-400 dark:border-sky-800/60 dark:hover:border-sky-600',
    borderLColor: 'border-l-sky-500',
    stripColor: 'bg-sky-500',
    btnCaja: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20',
    accentText: 'text-sky-700 dark:text-sky-400'
  },
  PINTURAS: {
    id: 'PINTURAS',
    nombre: 'Pinturas y Acabados',
    icon: Paintbrush,
    colorKey: 'purple',
    tag: 'Látex / Esmalte / Brochas',
    activeTile: 'bg-purple-600 text-white shadow-xs',
    inactiveTile: 'bg-purple-50/70 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs dark:bg-purple-950/40 dark:border-purple-800/60 dark:text-purple-300',
    badge: 'bg-purple-50 text-purple-800 border border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    cardBorder: 'border-purple-200 hover:border-purple-400 dark:border-purple-800/60 dark:hover:border-purple-600',
    borderLColor: 'border-l-purple-500',
    stripColor: 'bg-purple-500',
    btnCaja: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
    accentText: 'text-purple-700 dark:text-purple-400'
  },
  TORNILLERIA: {
    id: 'TORNILLERIA',
    nombre: 'Tornillería y Fijaciones',
    icon: Disc,
    colorKey: 'zinc',
    tag: 'Pernos / Clavos / Remaches',
    activeTile: 'bg-zinc-700 text-white shadow-xs',
    inactiveTile: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 shadow-2xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200',
    badge: 'bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    cardBorder: 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500',
    borderLColor: 'border-l-zinc-500',
    stripColor: 'bg-zinc-600',
    btnCaja: 'bg-zinc-700 hover:bg-zinc-800 text-white shadow-zinc-600/20',
    accentText: 'text-zinc-700 dark:text-zinc-300'
  },
  SEGURIDAD: {
    id: 'SEGURIDAD',
    nombre: 'Seguridad Industrial / EPP',
    icon: ShieldCheck,
    colorKey: 'emerald',
    tag: 'Cascos / Guantes / Botas',
    activeTile: 'bg-emerald-600 text-white shadow-xs',
    inactiveTile: 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300',
    badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    cardBorder: 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-800/60 dark:hover:border-emerald-600',
    borderLColor: 'border-l-emerald-500',
    stripColor: 'bg-emerald-500',
    btnCaja: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
    accentText: 'text-emerald-700 dark:text-emerald-400'
  },
  CERRAJERIA: {
    id: 'CERRAJERIA',
    nombre: 'Cerrajería y Seguridad',
    icon: Lock,
    colorKey: 'teal',
    tag: 'Chapas / Candados / Bisagras',
    activeTile: 'bg-teal-600 text-white shadow-xs',
    inactiveTile: 'bg-teal-50/70 hover:bg-teal-100 text-teal-900 border border-teal-200 shadow-2xs dark:bg-teal-950/40 dark:border-teal-800/60 dark:text-teal-300',
    badge: 'bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
    cardBorder: 'border-teal-200 hover:border-teal-400 dark:border-teal-800/60 dark:hover:border-teal-600',
    borderLColor: 'border-l-teal-500',
    stripColor: 'bg-teal-500',
    btnCaja: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20',
    accentText: 'text-teal-700 dark:text-teal-400'
  }
};

/**
 * Normaliza y clasifica cualquier categoría o producto de ferretería
 */
export function getCategoryConfig(cat) {
  if (!cat) return CATEGORY_PALETTES.TODOS;

  const raw = typeof cat === 'object' ? (cat.nombre || '') : String(cat);
  const clean = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (clean.includes('construc') || clean.includes('cement') || clean.includes('fierr') || clean.includes('aren') || clean.includes('ladrill') || clean.includes('yeso') || clean.includes('agregad')) {
    return CATEGORY_PALETTES.CONSTRUCCION;
  }
  if (clean.includes('herramient') || clean.includes('taladr') || clean.includes('amolad') || clean.includes('sierr') || clean.includes('martill') || clean.includes('alicate') || clean.includes('disco')) {
    return CATEGORY_PALETTES.HERRAMIENTAS;
  }
  if (clean.includes('electr') || clean.includes('cable') || clean.includes('foco') || clean.includes('enchufe') || clean.includes('termomagnet') || clean.includes('iluminac')) {
    return CATEGORY_PALETTES.ELECTRICIDAD;
  }
  if (clean.includes('gasfit') || clean.includes('plomer') || clean.includes('tub') || clean.includes('pvc') || clean.includes('valvul') || clean.includes('grif') || clean.includes('desague') || clean.includes('tanque')) {
    return CATEGORY_PALETTES.GASFITERIA;
  }
  if (clean.includes('pintur') || clean.includes('latex') || clean.includes('esmalte') || clean.includes('broch') || clean.includes('rodill') || clean.includes('thinner') || clean.includes('sellador')) {
    return CATEGORY_PALETTES.PINTURAS;
  }
  if (clean.includes('tornill') || clean.includes('perno') || clean.includes('clavo') || clean.includes('tuerc') || clean.includes('remache') || clean.includes('fijacion') || clean.includes('tarugo')) {
    return CATEGORY_PALETTES.TORNILLERIA;
  }
  if (clean.includes('segurid') || clean.includes('epp') || clean.includes('casco') || clean.includes('guante') || clean.includes('bota') || clean.includes('chaleco') || clean.includes('lente')) {
    return CATEGORY_PALETTES.SEGURIDAD;
  }
  if (clean.includes('cerraj') || clean.includes('chapa') || clean.includes('candad') || clean.includes('cerradur') || clean.includes('bisagr') || clean.includes('picaporte')) {
    return CATEGORY_PALETTES.CERRAJERIA;
  }

  // Coincidencia directa por id
  if (CATEGORY_PALETTES[raw]) {
    return CATEGORY_PALETTES[raw];
  }

  // Configuración genérica para categorías personalizadas
  return {
    id: clean,
    nombre: raw,
    icon: Boxes,
    colorKey: 'indigo',
    tag: 'Artículo Ferretero',
    activeTile: 'bg-indigo-600 text-white shadow-xs',
    inactiveTile: 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-300',
    badge: 'bg-indigo-50 text-indigo-800 border border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    cardBorder: 'border-indigo-200 hover:border-indigo-400 dark:border-indigo-800/60 dark:hover:border-indigo-600',
    borderLColor: 'border-l-indigo-500',
    stripColor: 'bg-indigo-500',
    btnCaja: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    accentText: 'text-indigo-700 dark:text-indigo-400'
  };
}
