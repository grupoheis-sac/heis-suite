import { create } from 'zustand';
import api from '../services/api';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('heis_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialEmpresa = () => {
  try {
    const raw = localStorage.getItem('heis_empresa');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  empresa: getInitialEmpresa(),
  token: localStorage.getItem('heis_token') || null,
  isAuthenticated: !!localStorage.getItem('heis_token'),
  sucursalActual: null,
  isDark: localStorage.getItem('heis_theme') === 'dark',

  // Alternar tema oscuro/claro
  toggleTheme: () => {
    const current = get().isDark;
    const next = !current;
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('heis_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('heis_theme', 'light');
    }
    set({ isDark: next });
  },

  // Iniciar Sesión
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.success) {
      const { token, user, empresa } = res.data.data;
      localStorage.setItem('heis_token', token);
      localStorage.setItem('heis_user', JSON.stringify(user));
      if (empresa) {
        localStorage.setItem('heis_empresa', JSON.stringify(empresa));
        localStorage.setItem('heis_empresa_id', String(empresa.id));
      } else {
        localStorage.removeItem('heis_empresa');
        localStorage.removeItem('heis_empresa_id');
      }
      set({
        token,
        user,
        empresa,
        isAuthenticated: true,
      });
      return res.data;
    }
    throw new Error(res.data?.error || 'Error al iniciar sesión');
  },

  // Cerrar Sesión
  logout: () => {
    localStorage.removeItem('heis_token');
    localStorage.removeItem('heis_user');
    localStorage.removeItem('heis_empresa');
    localStorage.removeItem('heis_empresa_id');
    set({
      user: null,
      empresa: null,
      token: null,
      isAuthenticated: false,
      sucursalActual: null,
    });
    window.location.href = '/login';
  },

  // Cambiar Empresa (Exclusivo para SuperAdmin)
  setEmpresa: (empresa) => {
    if (empresa) {
      localStorage.setItem('heis_empresa', JSON.stringify(empresa));
      localStorage.setItem('heis_empresa_id', String(empresa.id));
    } else {
      localStorage.removeItem('heis_empresa');
      localStorage.removeItem('heis_empresa_id');
    }
    set({ empresa });
  },

  // Establecer Sucursal Activa
  setSucursalActual: (sucursal) => {
    set({ sucursalActual: sucursal });
  },
}));

