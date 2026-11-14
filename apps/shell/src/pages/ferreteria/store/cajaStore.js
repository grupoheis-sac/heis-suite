import { create } from 'zustand';
import api from '../cajaApi';

export const useCajaStore = create((set, get) => ({
  cajaInfo: null,
  cajaAbierta: false,
  cargando: false,
  ultimaVerificacion: 0,

  fetchCaja: async (force = false) => {
    const ahora = Date.now();
    // Si ya se verificó hace menos de 800ms y no es forzado, evitar doble llamada simultánea
    if (!force && get().cargando) {
      return get().cajaInfo;
    }

    set({ cargando: true });
    try {
      const res = await api.get(`/caja/actual?_t=${ahora}`);
      const abierta = Boolean(res && res.success && res.cajaAbierta);
      const nuevaInfo = res && res.success ? res : { success: true, cajaAbierta: false, caja: null };

      set({
        cajaInfo: nuevaInfo,
        cajaAbierta: abierta,
        cargando: false,
        ultimaVerificacion: ahora
      });

      return nuevaInfo;
    } catch (error) {
      console.error('Error al obtener estado de caja:', error);
      set({
        cajaInfo: { success: true, cajaAbierta: false, caja: null },
        cajaAbierta: false,
        cargando: false,
        ultimaVerificacion: ahora
      });
      return null;
    }
  },

  aperturarCaja: async (montoInicial) => {
    set({ cargando: true });
    try {
      const res = await api.post('/caja/abrir', {
        monto_inicial: parseFloat(montoInicial) || 0
      });
      if (res && res.success) {
        // Actualizar estado local inmediatamente
        set({
          cajaAbierta: true,
          cajaInfo: {
            ...res,
            cajaAbierta: true,
            caja: res.caja
          }
        });
        window.dispatchEvent(new CustomEvent('caja-status-changed', {
          detail: { cajaAbierta: true, caja: res.caja }
        }));
        await get().fetchCaja(true);
      }
      return res;
    } finally {
      set({ cargando: false });
    }
  },

  cerrarCaja: async (idCaja, montoFinal, observaciones = '') => {
    set({ cargando: true });
    try {
      const res = await api.post(`/caja/${idCaja}/cerrar`, {
        monto_final: parseFloat(montoFinal) || 0,
        observaciones
      });
      if (res && res.success) {
        // Resetear inmediatamente a cerrada para eliminar cualquier retraso en el UI
        set({
          cajaInfo: { success: true, cajaAbierta: false, caja: null },
          cajaAbierta: false
        });
        window.dispatchEvent(new CustomEvent('caja-status-changed', {
          detail: { cajaAbierta: false, caja: null }
        }));
        await get().fetchCaja(true);
      }
      return res;
    } finally {
      set({ cargando: false });
    }
  },

  setCajaAbierta: (estado) => {
    set({ cajaAbierta: Boolean(estado) });
  }
}));
