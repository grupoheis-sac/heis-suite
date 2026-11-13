import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  UtensilsCrossed,
  ChefHat,
  Receipt,
  CalendarCheck,
  Menu
} from 'lucide-react';

export default function MobileBottomNav({ onOpenMenu }) {
  const navItems = [
    { to: '/mesas', label: 'Mesas', icon: UtensilsCrossed, isPrimary: true },
    { to: '/cocina', label: 'Cocina', icon: ChefHat },
    { to: '/ordenes', label: 'Comandas', icon: Receipt },
    { to: '/reservas', label: 'Reservas', icon: CalendarCheck }
  ];

  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-3 max-w-md mx-auto z-40 bg-white/90 dark:bg-[#110C2B]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-full px-3 py-1.5 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 select-none">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all cursor-pointer ${isActive
                  ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                } ${item.isPrimary ? 'relative' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-full transition-transform ${isActive
                        ? 'bg-amber-500/10 scale-110'
                        : ''
                      } ${item.isPrimary ? 'ring-2 ring-amber-500/20' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Botón para abrir el Menú / Sidebar Completo */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <div className="p-1 rounded-full">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Menú</span>
        </button>
      </div>
    </nav>
  );
}
