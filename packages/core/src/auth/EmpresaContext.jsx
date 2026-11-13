import React, { createContext, useContext, useMemo } from 'react';
import { useAuthStore } from './authStore';

const EmpresaContext = createContext(null);

export function EmpresaProvider({ children }) {
  const { empresa, user, sucursalActual, setSucursalActual } = useAuthStore();

  const modulos = useMemo(() => {
    let activos = [];
    if (empresa?.modulos_activos) {
      if (typeof empresa.modulos_activos === 'string') {
        try {
          activos = JSON.parse(empresa.modulos_activos);
        } catch {
          activos = ['restaurante'];
        }
      } else if (Array.isArray(empresa.modulos_activos)) {
        activos = empresa.modulos_activos;
      }
    }
    // Si no tiene ninguno configurado: en plan enterprise se habilitan todos, de lo contrario restaurante
    if (!Array.isArray(activos) || activos.length === 0) {
      if (empresa?.plan === 'enterprise') {
        activos = ['restaurante', 'ferreteria', 'botica', 'hospedaje'];
      } else {
        activos = ['restaurante'];
      }
    }

    return {
      restaurante: activos.includes('restaurante'),
      ferreteria: activos.includes('ferreteria'),
      botica: activos.includes('botica'),
      hospedaje: activos.includes('hospedaje'),
      minimarket: activos.includes('minimarket'),
      lista: activos,
    };
  }, [empresa]);

  const value = {
    empresa,
    user,
    modulos,
    sucursalActual,
    setSucursalActual,
  };

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}

export function useModulos() {
  const context = useContext(EmpresaContext);
  return context?.modulos || { restaurante: true, ferreteria: false, botica: false, hospedaje: false, lista: ['restaurante'] };
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  return context || {};
}

export function usePermiso(permisoRequerido) {
  const { user } = useAuthStore();
  if (!user) return false;

  // SuperAdmin y Administrador tienen acceso total
  if (user.rol === 'superadmin' || user.rol === 'admin' || user.rol === 'Administrador' || user.role === 'admin') {
    return true;
  }

  const permisos = user.permisos || {};
  return Boolean(permisos[permisoRequerido]);
}

