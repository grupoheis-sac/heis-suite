/**
 * HEIS Suite v2.2 - Motor RBAC & Aislamiento de Navegación por Rol y Vertical
 * Garantiza que cada colaborador acceda única y exclusivamente a su sistema asignado
 * (Restaurante, Ferretería, Botica o Hospedaje) y a sus pantallas autorizadas.
 */

// 1. Identificar si es SuperAdmin de la Plataforma SaaS
export function isSuperAdminUser(user) {
  if (!user) return false;
  const rol = String(user.rol || user.role || '').toLowerCase().trim();
  return rol === 'superadmin';
}

// 2. Identificar si es Administrador General / Dueño / Gerente de la Empresa (Supervisión transversal de todos los módulos contratados)
export function isGeneralAdminUser(user) {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  const rol = String(user.rol || user.role || '').toLowerCase().trim();
  return (
    rol === 'administrador' ||
    rol === 'administrador general' ||
    rol === 'gerente' ||
    rol === 'gerencia' ||
    rol === 'gerente general' ||
    rol === 'dueño' ||
    rol === 'admin'
  );
}

// 3. Determinar la vertical de negocio asignada al usuario según su rol o email
export function getUserVertical(user) {
  if (!user) return 'general';
  if (isGeneralAdminUser(user)) return 'general';

  const rol = String(user.rol || user.role || '').toLowerCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // Botica & Farmacia
  if (
    rol.includes('botica') ||
    rol.includes('farmac') ||
    email.includes('botica') ||
    email.includes('farmaceutico')
  ) {
    return 'botica';
  }

  // Hospedaje & Hotel
  if (
    rol.includes('hotel') ||
    rol.includes('hospedaje') ||
    rol.includes('recepc') ||
    rol.includes('limpieza') ||
    email.includes('hotel') ||
    email.includes('hospedaje') ||
    email.includes('recepcion') ||
    email.includes('limpieza')
  ) {
    return 'hospedaje';
  }

  // Restaurante & Bar
  if (
    rol.includes('restaurante') ||
    rol.includes('mozo') ||
    rol.includes('mesero') ||
    rol.includes('cocin') ||
    rol.includes('chef') ||
    rol.includes('bar') ||
    email.includes('restaurante') ||
    email.includes('mozo') ||
    email.includes('mesero') ||
    email.includes('cocina') ||
    email.includes('bar@')
  ) {
    return 'restaurante';
  }

  // Ferretería & Retail Comercial
  if (
    rol.includes('ferreteria') ||
    rol.includes('vendedor') ||
    rol.includes('almacen') ||
    rol === 'cajero' ||
    email.includes('ferreteria') ||
    email.includes('vendedor') ||
    email.includes('almacen') ||
    email === 'caja@admin.com' ||
    email === 'cajero@heis.pe'
  ) {
    return 'ferreteria';
  }

  return 'general';
}

// 4. Módulos verticales a los que el usuario tiene acceso
export function getUserAllowedModules(user, modulosEmpresa = []) {
  if (!user) return [];
  if (isGeneralAdminUser(user)) {
    return modulosEmpresa && modulosEmpresa.length > 0
      ? modulosEmpresa
      : ['restaurante', 'ferreteria', 'botica', 'hospedaje'];
  }

  const vertical = getUserVertical(user);
  if (vertical === 'general') {
    return modulosEmpresa;
  }

  if (modulosEmpresa.length > 0 && !modulosEmpresa.includes(vertical)) {
    return [];
  }

  return [vertical];
}

// 5. Determinar si el usuario tiene permiso para ingresar a un módulo
export function canUserAccessModule(user, modulo, modulosEmpresa = []) {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;

  // Módulo Transversal Core (Caja, Facturación SUNAT, Administración)
  if (modulo === 'core') {
    if (isGeneralAdminUser(user)) return true;
    const rol = String(user.rol || user.role || '').toLowerCase();
    if (rol.includes('admin') || rol.includes('cajer')) return true;
    return false;
  }

  // Validar si la empresa contrató el módulo
  if (modulosEmpresa.length > 0 && !modulosEmpresa.includes(modulo)) {
    return false;
  }

  if (isGeneralAdminUser(user)) return true;

  const allowed = getUserAllowedModules(user, modulosEmpresa);
  return allowed.includes(modulo);
}

// 6. Matriz de permisos detallados por componente y botón
export function getUserPermissions(user) {
  const base = {
    isGeneralAdmin: false,
    canViewDashboard: false,
    canViewMesas: false,
    canViewCocina: false,
    canViewOrdenes: false,
    canViewMenu: false,
    canViewReservas: false,
    canViewGastos: false,
    canViewPOS: false,
    canViewInventario: false,
    canViewVentas: false,
    canViewCaja: false,
    canViewClientes: false,
    canViewCotizaciones: false,
    canViewCompras: false,
    canViewDispensacion: false,
    canViewMedicamentos: false,
    canViewLotes: false,
    canViewTemperatura: false,
    canViewDigemid: false,
    canViewBajas: false,
    canViewRack: false,
    canViewReservasHotel: false,
    canViewHuespedes: false,
    canViewLimpieza: false,
    canViewTarifas: false,
    canViewPisos: false,
    canViewPosHotel: false,
    canViewFacturacionSunat: false,
    canViewAdministracion: false,
    canViewConfiguracion: false,
  };

  if (!user) return base;

  if (isGeneralAdminUser(user)) {
    return {
      isGeneralAdmin: true,
      canViewDashboard: true,
      canViewMesas: true,
      canViewCocina: true,
      canViewOrdenes: true,
      canViewMenu: true,
      canViewReservas: true,
      canViewGastos: true,
      canViewPOS: true,
      canViewInventario: true,
      canViewVentas: true,
      canViewCaja: true,
      canViewClientes: true,
      canViewCotizaciones: true,
      canViewCompras: true,
      canViewDispensacion: true,
      canViewMedicamentos: true,
      canViewLotes: true,
      canViewTemperatura: true,
      canViewDigemid: true,
      canViewBajas: true,
      canViewRack: true,
      canViewReservasHotel: true,
      canViewHuespedes: true,
      canViewLimpieza: true,
      canViewTarifas: true,
      canViewPisos: true,
      canViewPosHotel: true,
      canViewFacturacionSunat: true,
      canViewAdministracion: true,
      canViewConfiguracion: true,
    };
  }

  const rol = String(user.rol || user.role || '').toLowerCase();
  const email = String(user.email || '').toLowerCase();
  const vertical = getUserVertical(user);

  // RESTAURANTE
  if (vertical === 'restaurante') {
    if (rol.includes('admin')) {
      return {
        ...base,
        canViewDashboard: true,
        canViewMesas: true,
        canViewCocina: true,
        canViewOrdenes: true,
        canViewMenu: true,
        canViewReservas: true,
        canViewGastos: true,
        canViewCaja: true,
        canViewFacturacionSunat: true,
        canViewConfiguracion: true,
      };
    }
    if (rol.includes('cocin') || rol.includes('chef') || rol.includes('bar') || email.includes('cocina') || email.includes('bar@')) {
      return {
        ...base,
        canViewCocina: true,
      };
    }
    if (rol.includes('mozo') || rol.includes('mesero') || email.includes('mozo') || email.includes('mesero')) {
      return {
        ...base,
        canViewMesas: true,
        canViewOrdenes: true,
      };
    }
  }

  // FERRETERÍA & RETAIL
  if (vertical === 'ferreteria') {
    if (rol.includes('admin')) {
      return {
        ...base,
        canViewDashboard: true,
        canViewPOS: true,
        canViewInventario: true,
        canViewVentas: true,
        canViewCaja: true,
        canViewClientes: true,
        canViewCotizaciones: true,
        canViewCompras: true,
        canViewFacturacionSunat: true,
        canViewConfiguracion: true,
      };
    }
    if (rol.includes('cajer') || email.includes('caja')) {
      return {
        ...base,
        canViewPOS: true,
        canViewVentas: true,
        canViewCaja: true,
      };
    }
    if (rol.includes('vendedor') || email.includes('vendedor')) {
      return {
        ...base,
        canViewCotizaciones: true,
        canViewVentas: true,
        canViewClientes: true,
      };
    }
    if (rol.includes('almacen') || email.includes('almacen')) {
      return {
        ...base,
        canViewInventario: true,
        canViewCompras: true,
      };
    }
  }

  // BOTICA FARMACIA
  if (vertical === 'botica') {
    if (rol.includes('admin')) {
      return {
        ...base,
        canViewDashboard: true,
        canViewDispensacion: true,
        canViewMedicamentos: true,
        canViewLotes: true,
        canViewInventario: true,
        canViewTemperatura: true,
        canViewDigemid: true,
        canViewBajas: true,
        canViewVentas: true,
        canViewCaja: true,
        canViewFacturacionSunat: true,
        canViewConfiguracion: true,
      };
    }
    if (rol.includes('farmac') || email.includes('farmaceutico')) {
      return {
        ...base,
        canViewDispensacion: true,
        canViewMedicamentos: true,
        canViewLotes: true,
        canViewInventario: true,
        canViewTemperatura: true,
        canViewDigemid: true,
        canViewBajas: true,
      };
    }
    if (rol.includes('cajer') || email.includes('cajero')) {
      return {
        ...base,
        canViewDispensacion: true,
        canViewVentas: true,
        canViewCaja: true,
      };
    }
  }

  // HOSPEDAJE HOTEL
  if (vertical === 'hospedaje') {
    if (rol.includes('admin')) {
      return {
        ...base,
        canViewDashboard: true,
        canViewRack: true,
        canViewReservasHotel: true,
        canViewHuespedes: true,
        canViewLimpieza: true,
        canViewTarifas: true,
        canViewPisos: true,
        canViewCaja: true,
        canViewPosHotel: true,
        canViewFacturacionSunat: true,
        canViewConfiguracion: true,
      };
    }
    if (rol.includes('recepc') || email.includes('recepcion')) {
      return {
        ...base,
        canViewRack: true,
        canViewReservasHotel: true,
        canViewHuespedes: true,
        canViewLimpieza: true,
        canViewCaja: true,
        canViewPosHotel: true,
      };
    }
    if (rol.includes('limpieza') || email.includes('limpieza')) {
      return {
        ...base,
        canViewLimpieza: true,
        canViewRack: true,
      };
    }
  }

  return base;
}

// 7. Ruta de destino operacional inicial según el rol del usuario
export function getRoleLandingRoute(user, modulosEmpresa = []) {
  if (!user) return '/login';
  if (isSuperAdminUser(user)) return '/superadmin';

  const rol = String(user.rol || user.role || '').toLowerCase();
  const email = String(user.email || '').toLowerCase();
  const vertical = getUserVertical(user);

  if (vertical === 'restaurante') {
    if (rol.includes('cocin') || rol.includes('chef') || rol.includes('bar') || email.includes('cocina') || email.includes('bar@')) {
      return '/cocina';
    }
    return '/mesas';
  }

  if (vertical === 'ferreteria') {
    if (rol.includes('vendedor') || email.includes('vendedor')) {
      return '/cotizaciones';
    }
    if (rol.includes('almacen') || email.includes('almacen')) {
      return '/inventario';
    }
    return '/pos';
  }

  if (vertical === 'botica') {
    return '/dispensacion';
  }

  if (vertical === 'hospedaje') {
    if (rol.includes('limpieza') || email.includes('limpieza')) {
      return '/limpieza-hotel';
    }
    return '/habitaciones';
  }

  return '/dashboard';
}
