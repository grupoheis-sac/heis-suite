import React, { createContext, useContext, useMemo, useCallback } from 'react';
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

    if (!Array.isArray(activos) || activos.length === 0) {
      if (empresa?.plan === 'enterprise') {
        activos = ['restaurante', 'ferreteria', 'botica', 'hospedaje'];
      } else {
        activos = ['restaurante'];
      }
    }

    let submodulos = {};
    if (empresa?.submodulos_activos) {
      if (typeof empresa.submodulos_activos === 'string') {
        try {
          submodulos = JSON.parse(empresa.submodulos_activos);
        } catch {
          submodulos = {};
        }
      } else if (typeof empresa.submodulos_activos === 'object') {
        submodulos = empresa.submodulos_activos;
      }
    }

    return {
      restaurante: activos.includes('restaurante'),
      ferreteria: activos.includes('ferreteria'),
      botica: activos.includes('botica'),
      hospedaje: activos.includes('hospedaje'),
      minimarket: activos.includes('minimarket'),
      lista: activos,
      submodulos,
    };
  }, [empresa]);

  const hasSubmodulo = useCallback(
    (submoduloId) => {
      if (user?.rol === 'superadmin' && !empresa) return true;
      if (!modulos.submodulos || modulos.submodulos[submoduloId] === undefined) {
        return true; // Por defecto activo si el módulo padre está contratado
      }
      return Boolean(modulos.submodulos[submoduloId]);
    },
    [modulos.submodulos, user?.rol, empresa]
  );

  const value = {
    empresa,
    empresaActiva: empresa,
    user,
    modulos,
    hasSubmodulo,
    sucursalActual,
    setSucursalActual,
  };

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}

export function useModulos() {
  const context = useContext(EmpresaContext);
  return (
    context?.modulos || {
      restaurante: true,
      ferreteria: false,
      botica: false,
      hospedaje: false,
      lista: ['restaurante'],
      submodulos: {},
    }
  );
}

export function useSubmodulo(submoduloId) {
  const context = useContext(EmpresaContext);
  if (!context?.hasSubmodulo) return true;
  return context.hasSubmodulo(submoduloId);
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  return context || {};
}

export function usePermiso(permisoRequerido) {
  const { user } = useAuthStore();
  if (!user) return false;

  if (
    user.rol === 'superadmin' ||
    user.rol === 'admin' ||
    user.rol === 'Administrador' ||
    user.role === 'admin'
  ) {
    return true;
  }

  const permisos = user.permisos || {};
  return Boolean(permisos[permisoRequerido]);
}
