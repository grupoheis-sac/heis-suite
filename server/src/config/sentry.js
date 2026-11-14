// server/src/config/sentry.js
import { getTenantContext } from '../core/context/tenantContext.js';

let Sentry = null;
try {
  Sentry = await import('@sentry/node');
} catch (_) {
  // Sentry es opcional si no está instalado en el entorno
}

const SENSITIVE_KEYS = [
  'password',
  'admin_password',
  'clave_sol',
  'clave_sol_cifrada',
  'pfx_password',
  'cert_password',
  'rawEscPosBase64',
  'authorization',
  'cookie',
];

export function scrubSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(copy)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      copy[key] = '[REDACTED_BY_HEIS_SECOPS]';
    } else if (typeof copy[key] === 'object') {
      copy[key] = scrubSensitiveData(copy[key]);
    }
  }
  return copy;
}

export function initBackendSentry(app) {
  if (!process.env.SENTRY_DSN || !Sentry) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.IMAGE_TAG || 'heis-suite@1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      // 1. Etiquetar automáticamente el evento con el Tenant activo (AsyncLocalStorage)
      const tenantCtx = typeof getTenantContext === 'function' ? getTenantContext() : null;
      if (tenantCtx) {
        event.tags = {
          ...event.tags,
          empresa_id: String(tenantCtx.empresaId || 'none'),
          sucursal_id: String(tenantCtx.sucursalId || 'none'),
          is_superadmin: String(Boolean(tenantCtx.isSuperAdmin)),
        };
        event.user = {
          id: String(tenantCtx.userId || 'anonymous'),
        };
      }

      // 2. Sanitizar contraseñas, claves SOL y certificados .pfx del payload HTTP
      if (event.request?.data) {
        try {
          const parsed =
            typeof event.request.data === 'string'
              ? JSON.parse(event.request.data)
              : event.request.data;
          event.request.data = JSON.stringify(scrubSensitiveData(parsed));
        } catch {
          event.request.data = '[SCRUBBED_NON_JSON_BODY]';
        }
      }

      if (event.request?.headers) {
        event.request.headers = scrubSensitiveData(event.request.headers);
      }

      return event;
    },
  });

  if (app && typeof Sentry.setupExpressErrorHandler === 'function') {
    Sentry.setupExpressErrorHandler(app);
  }
}

export function captureTenantException(error, extraContext = {}) {
  if (!process.env.SENTRY_DSN || !Sentry) return;
  const tenantCtx = typeof getTenantContext === 'function' ? getTenantContext() : null;
  Sentry.withScope((scope) => {
    if (tenantCtx?.empresaId) scope.setTag('empresa_id', String(tenantCtx.empresaId));
    if (tenantCtx?.sucursalId) scope.setTag('sucursal_id', String(tenantCtx.sucursalId));
    scope.setExtras(scrubSensitiveData(extraContext));
    Sentry.captureException(error);
  });
}

export default {
  initBackendSentry,
  captureTenantException,
  scrubSensitiveData,
};
