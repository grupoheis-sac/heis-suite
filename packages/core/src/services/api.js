import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor para inyectar token JWT y Empresa ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('heis_token');
    const empresaId = localStorage.getItem('heis_empresa_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (empresaId) {
      config.headers['X-Empresa-ID'] = empresaId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para manejo global de 401 (Sesión expirada)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('heis_token');
        localStorage.removeItem('heis_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Crea un cliente API con namespace específico para un módulo vertical
 * Por ejemplo: createModuleApi('restaurante') antepone /restaurante a cada ruta
 */
export function createModuleApi(prefix) {
  const p = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return {
    get: async (url, config) => {
      const res = await api.get(`${p}${url.startsWith('/') ? url : '/' + url}`, config);
      return res.data;
    },
    post: async (url, data, config) => {
      const res = await api.post(`${p}${url.startsWith('/') ? url : '/' + url}`, data, config);
      return res.data;
    },
    put: async (url, data, config) => {
      const res = await api.put(`${p}${url.startsWith('/') ? url : '/' + url}`, data, config);
      return res.data;
    },
    patch: async (url, data, config) => {
      const res = await api.patch(`${p}${url.startsWith('/') ? url : '/' + url}`, data, config);
      return res.data;
    },
    delete: async (url, config) => {
      const res = await api.delete(`${p}${url.startsWith('/') ? url : '/' + url}`, config);
      return res.data;
    },
  };
}

/**
 * Consulta de RUC y DNI (SUNAT / RENIEC) centralizada
 */
export async function consultarDocumento(tipo, numero) {
  try {
    const res = await api.get(`/consulta/${tipo}/${numero}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export default api;
