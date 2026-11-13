import { create } from 'zustand';
import api from '../services/api';

const getInitialSucursal = () => {
  try {
    const raw = localStorage.getItem('heis_sucursal_activa');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useSucursalStore = create((set, get) => ({
  sucursales: [],
  sucursalActiva: getInitialSucursal(),
  cargando: false,

  fetchSucursales: async () => {
    set({ cargando: true });
    try {
      const res = await api.get('/admin/sucursales');
      const data = res.data?.data || res.data || [];
      const lista = Array.isArray(data) ? data : [];

      let activa = get().sucursalActiva;
      if (!activa || !lista.some((s) => s.id === activa.id)) {
        activa = lista.find((s) => s.es_principal) || lista[0] || null;
        if (activa) {
          localStorage.setItem('heis_sucursal_activa', JSON.stringify(activa));
        }
      }

      set({
        sucursales: lista,
        sucursalActiva: activa,
        cargando: false,
      });
      return lista;
    } catch (error) {
      console.error('Error al cargar sedes:', error);
      set({ cargando: false });
      return [];
    }
  },

  setSucursalActiva: (sucursal) => {
    localStorage.setItem('heis_sucursal_activa', JSON.stringify(sucursal));
    set({ sucursalActiva: sucursal });
    window.dispatchEvent(new CustomEvent('sucursal-cambiada', { detail: sucursal }));
  },
}));

