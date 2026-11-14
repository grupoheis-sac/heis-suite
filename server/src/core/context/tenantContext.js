import { AsyncLocalStorage } from 'node:async_hooks';

export const tenantStorage = new AsyncLocalStorage();

// Caché en memoria (TTL 5 min) para evitar consultar la tabla `empresas` en cada request
const tenantCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function getCurrentTenant() {
  return tenantStorage.getStore() || null;
}

export function getCachedEmpresa(empresaId) {
  if (!empresaId) return null;
  const key = String(empresaId);
  const item = tenantCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    tenantCache.delete(key);
    return null;
  }
  return item.data;
}

export function setCachedEmpresa(empresaId, data) {
  if (!empresaId || !data) return;
  tenantCache.set(String(empresaId), {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateEmpresaCache(empresaId = null) {
  if (empresaId) {
    tenantCache.delete(String(empresaId));
  } else {
    tenantCache.clear();
  }
}
