/**
 * HEIS Suite - In-Memory Rate Limiter Middleware
 * Mitiga ataques de fuerza bruta y abuso de APIs externas sin dependencias externas obligatorias.
 */

export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Demasiadas solicitudes desde esta IP, por favor inténtelo más tarde.',
  statusCode = 429,
  skipSuccessfulRequests = false,
} = {}) {
  const hits = new Map();

  // Limpieza periódica de IPs inactivas para evitar fugas de memoria
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits.entries()) {
      if (now > entry.resetTime) {
        hits.delete(ip);
      }
    }
  }, Math.max(windowMs, 60000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiter(req, res, next) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown-ip';

    const now = Date.now();
    let entry = hits.get(ip);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(ip, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, max - entry.count);
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(statusCode).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        error: message,
        retryAfterSeconds: retryAfter,
      });
    }

    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400 && hits.has(ip)) {
          const current = hits.get(ip);
          if (current && current.count > 0) {
            current.count -= 1;
          }
        }
      });
    }

    next();
  };
}

// Limiter para /api/auth/login: máx 10 peticiones cada 5 minutos
export const loginRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de inicio de sesión. Por favor espere 5 minutos antes de reintentar.',
});

// Limiter para /api/consulta: máx 30 consultas cada 1 minuto
export const consultaRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Límite de consultas de DNI/RUC alcanzado. Por favor espere un minuto.',
});
