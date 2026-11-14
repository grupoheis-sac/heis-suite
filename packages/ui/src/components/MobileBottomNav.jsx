import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  UtensilsCrossed,
  ChefHat,
  Receipt,
  CalendarCheck,
  Menu,
  ShoppingBag,
  Pill,
  Hotel,
  LayoutDashboard,
  Wallet,
  Boxes,
  Sparkles,
} from 'lucide-react';
import { getUserVertical, getUserPermissions, isGeneralAdminUser } from '@heis/core';

export default function MobileBottomNav({ onOpenMenu, user = null, modulosActivos = ['restaurante'] }) {
  const vertical = getUserVertical(user);
  const perms = getUserPermissions(user);
  const isGenAdmin = isGeneralAdminUser(user);

  let navItems = [];

  if (isGenAdmin) {
    navItems = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, isPrimary: true },
      modulosActivos.includes('restaurante') && { to: '/mesas', label: 'Mesas', icon: UtensilsCrossed },
      modulosActivos.includes('ferreteria') && { to: '/pos', label: 'POS Retail', icon: ShoppingBag },
      modulosActivos.includes('botica') && { to: '/dispensacion', label: 'Farmacia', icon: Pill },
      modulosActivos.includes('hospedaje') && { to: '/habitaciones', label: 'Hotel', icon: Hotel },
    ].filter(Boolean);
  } else if (vertical === 'restaurante') {
    if (perms.canViewCocina && !perms.canViewMesas) {
      navItems = [{ to: '/cocina', label: 'Cocina KDS', icon: ChefHat, isPrimary: true }];
    } else {
      navItems = [
        { to: '/mesas', label: 'Mesas', icon: UtensilsCrossed, isPrimary: true },
        perms.canViewCocina && { to: '/cocina', label: 'Cocina', icon: ChefHat },
        perms.canViewOrdenes && { to: '/ordenes', label: 'Comandas', icon: Receipt },
        perms.canViewReservas && { to: '/reservas', label: 'Reservas', icon: CalendarCheck },
      ].filter(Boolean);
    }
  } else if (vertical === 'ferreteria') {
    navItems = [
      perms.canViewPOS && { to: '/pos', label: 'POS Retail', icon: ShoppingBag, isPrimary: true },
      perms.canViewVentas && { to: '/ventas', label: 'Ventas', icon: Receipt },
      perms.canViewInventario && { to: '/inventario', label: 'Inventario', icon: Boxes },
      perms.canViewCaja && { to: '/caja', label: 'Caja', icon: Wallet },
    ].filter(Boolean);
  } else if (vertical === 'botica') {
    navItems = [
      perms.canViewDispensacion && { to: '/dispensacion', label: 'Dispensación', icon: Pill, isPrimary: true },
      perms.canViewMedicamentos && { to: '/medicamentos', label: 'Medicamentos', icon: Boxes },
      perms.canViewLotes && { to: '/lotes', label: 'Lotes FEFO', icon: CalendarCheck },
      perms.canViewCaja && { to: '/caja', label: 'Caja', icon: Wallet },
    ].filter(Boolean);
  } else if (vertical === 'hospedaje') {
    navItems = [
      perms.canViewRack && { to: '/habitaciones', label: 'Rack Hotel', icon: Hotel, isPrimary: true },
      perms.canViewReservasHotel && { to: '/reservas-hotel', label: 'Reservas', icon: CalendarCheck },
      perms.canViewLimpieza && { to: '/limpieza-hotel', label: 'Limpieza', icon: Sparkles },
      perms.canViewCaja && { to: '/caja-hotel', label: 'Caja Hotel', icon: Wallet },
    ].filter(Boolean);
  } else {
    navItems = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, isPrimary: true },
      { to: '/caja', label: 'Caja', icon: Wallet },
    ];
  }

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
