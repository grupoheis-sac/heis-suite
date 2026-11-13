/**
 * hotelCategoryColors.js — Sistema cromático, sensorial y táctil para POS Hotelero
 * Diseñado con paletas vibrantes, de alto contraste y legibilidad Neo-SaaS.
 */
import {
  Package, Wine, Utensils, Shirt, Sparkles,
  BedDouble, Compass, ShoppingBag
} from 'lucide-react';

export const HOTEL_CATEGORY_PALETTES = {
  TODOS: {
    id: 'TODOS',
    nombre: 'Todo el Catálogo',
    icon: Package,
    colorKey: 'slate',
    tag: 'General',
    activeTile: 'bg-slate-900 text-white shadow-xs',
    inactiveTile: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 shadow-2xs',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    cardBorder: 'border-slate-200 hover:border-slate-400',
    borderLColor: 'border-l-slate-400',
    stripColor: 'bg-slate-700',
    accentText: 'text-slate-700 dark:text-slate-200'
  },
  MINIBAR: {
    id: 'MINIBAR',
    nombre: 'Minibar & Snacks',
    icon: Wine,
    colorKey: 'amber',
    tag: 'Bebidas & Golosinas',
    activeTile: 'bg-amber-600 text-white shadow-xs',
    inactiveTile: 'bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200/90',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    borderLColor: 'border-l-amber-500',
    stripColor: 'bg-amber-500',
    accentText: 'text-amber-700 dark:text-amber-300'
  },
  RESTAURANTE: {
    id: 'RESTAURANTE',
    nombre: 'Cafetería & Room Service',
    icon: Utensils,
    colorKey: 'emerald',
    tag: 'Platos & Desayunos',
    activeTile: 'bg-emerald-600 text-white shadow-xs',
    inactiveTile: 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs',
    badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    borderLColor: 'border-l-emerald-500',
    stripColor: 'bg-emerald-500',
    accentText: 'text-emerald-700 dark:text-emerald-300'
  },
  LAVANDERIA: {
    id: 'LAVANDERIA',
    nombre: 'Lavandería & Tintorería',
    icon: Shirt,
    colorKey: 'sky',
    tag: 'Prendas & Planchado',
    activeTile: 'bg-sky-600 text-white shadow-xs',
    inactiveTile: 'bg-sky-50/80 hover:bg-sky-100 text-sky-900 border border-sky-200 shadow-2xs',
    badge: 'bg-sky-50 text-sky-800 border border-sky-200/90',
    cardBorder: 'border-sky-200 hover:border-sky-400',
    borderLColor: 'border-l-sky-500',
    stripColor: 'bg-sky-500',
    accentText: 'text-sky-700 dark:text-sky-300'
  },
  SPA: {
    id: 'SPA',
    nombre: 'Spa & Bienestar',
    icon: Sparkles,
    colorKey: 'rose',
    tag: 'Masajes & Sauna',
    activeTile: 'bg-rose-600 text-white shadow-xs',
    inactiveTile: 'bg-rose-50/80 hover:bg-rose-100 text-rose-900 border border-rose-200 shadow-2xs',
    badge: 'bg-rose-50 text-rose-800 border border-rose-200/90',
    cardBorder: 'border-rose-200 hover:border-rose-400',
    borderLColor: 'border-l-rose-500',
    stripColor: 'bg-rose-500',
    accentText: 'text-rose-700 dark:text-rose-300'
  },
  EXTRAS: {
    id: 'EXTRAS',
    nombre: 'Amenidades & Habitación',
    icon: BedDouble,
    colorKey: 'purple',
    tag: 'Toallas, Kits & Almohadas',
    activeTile: 'bg-purple-600 text-white shadow-xs',
    inactiveTile: 'bg-purple-50/80 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs',
    badge: 'bg-purple-50 text-purple-800 border border-purple-200/90',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    borderLColor: 'border-l-purple-500',
    stripColor: 'bg-purple-500',
    accentText: 'text-purple-700 dark:text-purple-300'
  },
  TOURS: {
    id: 'TOURS',
    nombre: 'Tours & Movilidad',
    icon: Compass,
    colorKey: 'indigo',
    tag: 'Traslados & Excursiones',
    activeTile: 'bg-indigo-600 text-white shadow-xs',
    inactiveTile: 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs',
    badge: 'bg-indigo-50 text-indigo-800 border border-indigo-200/90',
    cardBorder: 'border-indigo-200 hover:border-indigo-400',
    borderLColor: 'border-l-indigo-500',
    stripColor: 'bg-indigo-500',
    accentText: 'text-indigo-700 dark:text-indigo-300'
  },
  OTROS: {
    id: 'OTROS',
    nombre: 'Otros Servicios',
    icon: ShoppingBag,
    colorKey: 'slate',
    tag: 'Misceláneos',
    activeTile: 'bg-gray-800 text-white shadow-xs',
    inactiveTile: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 shadow-2xs',
    badge: 'bg-gray-100 text-gray-800 border border-gray-200',
    cardBorder: 'border-gray-200 hover:border-gray-400',
    borderLColor: 'border-l-gray-400',
    stripColor: 'bg-gray-500',
    accentText: 'text-gray-700 dark:text-gray-300'
  }
};

export const getHotelCategoryConfig = (catName) => {
  if (!catName) return HOTEL_CATEGORY_PALETTES.TODOS;
  const upper = String(catName).toUpperCase().trim();
  return HOTEL_CATEGORY_PALETTES[upper] || HOTEL_CATEGORY_PALETTES.TODOS;
};
