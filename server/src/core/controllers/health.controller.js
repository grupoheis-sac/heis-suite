// server/src/core/controllers/health.controller.js
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { Op, fn, col } from 'sequelize';
import { sequelize } from '../../config/db.js';
import { ComprobanteElectronico } from '../models/index.js';
import { getSunatWorkerHealth } from '../services/sunat/contingencyWorker.js';
import { notifyCriticalIncident } from '../services/alertBot.service.js';

// Monitor continuo de Event Loop Lag en resolución de milisegundos
const loopHistogram = monitorEventLoopDelay({ resolution: 20 });
loopHistogram.enable();

const V8_HEAP_LIMIT_MB = Number(process.env.V8_HEAP_LIMIT_MB || 768);
let sunatPingCache = { timestamp: 0, status: 'UNKNOWN', latencyMs: null, endpoint: null };

/**
 * Verifica conectividad TLS contra el WSDL de SUNAT con caché de 60s
 */
async function checkSunatWsdlConnectivity() {
  const now = Date.now();
  if (now - sunatPingCache.timestamp < 60000 && sunatPingCache.status !== 'UNKNOWN') {
    return sunatPingCache;
  }

  const baseUrl =
    process.env.SUNAT_ENDPOINT_PROD ||
    'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService';
  const wsdlUrl = `${baseUrl}?wsdl`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const t0 = performance.now();

  try {
    const res = await fetch(wsdlUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - t0);
    sunatPingCache = {
      timestamp: now,
      status: res.ok || res.status === 405 ? 'REACHABLE' : `HTTP_${res.status}`,
      latencyMs,
      endpoint: baseUrl,
    };
  } catch (err) {
    sunatPingCache = {
      timestamp: now,
      status: err.name === 'AbortError' ? 'TIMEOUT' : 'UNREACHABLE',
      latencyMs: Math.round(performance.now() - t0),
      endpoint: baseUrl,
      error: err.message,
    };
  } finally {
    clearTimeout(timeout);
  }

  return sunatPingCache;
}

/**
 * GET /api/health/deep
 * Protegido con token de monitoreo (X-Health-Token) o rol SuperAdmin
 */
export const deepHealthcheck = async (req, res) => {
  const expectedToken = process.env.HEALTHCHECK_SECRET_TOKEN;
  const providedToken = req.headers['x-health-token'];
  const isSuperAdmin = req.user?.es_superadmin || req.user?.rol === 'superadmin' || req.user?.role === 'superadmin';

  if (expectedToken && providedToken !== expectedToken && !isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'No autorizado para inspección profunda.' });
  }

  const report = {
    status: 'HEALTHY', // 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {},
  };

  // 1. Verificación de Base de Datos MySQL y Pool Sequelize
  const tDb = performance.now();
  try {
    await sequelize.query('SELECT 1 AS ping;');
    const dbLatencyMs = Math.round(performance.now() - tDb);
    const pool = sequelize.connectionManager?.pool;

    report.checks.mysql = {
      status: dbLatencyMs < 150 ? 'UP' : 'SLOW',
      latencyMs: dbLatencyMs,
      pool: {
        max: Number(process.env.DB_POOL_MAX || 30),
        size: pool?.size ?? null,
        available: pool?.available ?? null,
        using: pool?.using ?? null,
        waiting: pool?.waiting ?? null,
      },
    };

    if (dbLatencyMs >= 150 || (pool?.waiting ?? 0) > 5) {
      report.status = 'DEGRADED';
    }
  } catch (dbErr) {
    report.status = 'CRITICAL';
    report.checks.mysql = {
      status: 'DOWN',
      error: dbErr.message,
    };

    // Dispara alerta inmediata por caída de MySQL
    notifyCriticalIncident({
      type: 'MYSQL_DOWN',
      severity: 'CRITICAL',
      title: 'Caída de Base de Datos MySQL en Producción',
      details: dbErr.message,
      dedupKey: 'mysql_connection_down',
    }).catch(() => {});
  }

  // 2. Uso de Memoria V8 y Salud del Event Loop
  const mem = process.memoryUsage();
  const heapUsedMb = Number((mem.heapUsed / 1024 / 1024).toFixed(2));
  const rssMb = Number((mem.rss / 1024 / 1024).toFixed(2));
  const heapUsagePercent = Number(((heapUsedMb / V8_HEAP_LIMIT_MB) * 100).toFixed(1));
  const eventLoopP99Ms = Number((loopHistogram.percentile(99) / 1e6).toFixed(2));

  report.checks.runtime = {
    status: heapUsagePercent < 85 && eventLoopP99Ms < 120 ? 'OPTIMAL' : 'PRESSURE',
    memory: {
      rssMb,
      heapUsedMb,
      heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
      heapLimitMb: V8_HEAP_LIMIT_MB,
      heapUsagePercent,
    },
    eventLoop: {
      p50LagMs: Number((loopHistogram.percentile(50) / 1e6).toFixed(2)),
      p99LagMs: eventLoopP99Ms,
    },
  };

  if (heapUsagePercent >= 85 || eventLoopP99Ms >= 120) {
    if (report.status === 'HEALTHY') report.status = 'DEGRADED';
  }

  // 3. Estado del Worker de Contingencia SUNAT y Cola de Comprobantes
  try {
    const workerStats = typeof getSunatWorkerHealth === 'function'
      ? getSunatWorkerHealth()
      : { active: true };

    const conteos = await ComprobanteElectronico.findAll({
      attributes: ['estado_sunat', [fn('COUNT', col('id')), 'total']],
      group: ['estado_sunat'],
      raw: true,
      skipTenantScope: true,
    });

    const queueMap = Object.fromEntries(
      conteos.map((row) => [row.estado_sunat, Number(row.total)])
    );

    const masAntiguoPendiente = await ComprobanteElectronico.findOne({
      where: {
        estado_sunat: { [Op.in]: ['PENDIENTE', 'CONTINGENCIA_REINTENTAR'] },
      },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'empresa_id', 'serie', 'correlativo', 'createdAt', 'intentos_envio'],
      raw: true,
      skipTenantScope: true,
    });

    const minutosEstancado = masAntiguoPendiente
      ? Math.round((Date.now() - new Date(masAntiguoPendiente.createdAt).getTime()) / 60000)
      : 0;

    report.checks.sunatContingencyWorker = {
      ...workerStats,
      queue: {
        pendientes: queueMap.PENDIENTE || 0,
        enContingencia: queueMap.CONTINGENCIA_REINTENTAR || 0,
        procesando: queueMap.PROCESANDO_ENVIO || 0,
        rechazados: queueMap.RECHAZADO || 0,
        erroresCriticos: queueMap.ERROR_CRITICO || 0,
      },
      oldestPendingMinutes: minutosEstancado,
    };

    if ((queueMap.ERROR_CRITICO || 0) > 0 || !workerStats.active) {
      if (report.status === 'HEALTHY') report.status = 'DEGRADED';
    }
  } catch (workerErr) {
    report.checks.sunatContingencyWorker = {
      status: 'ERROR_QUERYING_QUEUE',
      error: workerErr.message,
    };
  }

  // 4. Conectividad en vivo hacia Web Services SUNAT / OSE
  const sunatWs = await checkSunatWsdlConnectivity();
  report.checks.sunatWebService = sunatWs;

  if (sunatWs.status !== 'REACHABLE' && report.status === 'HEALTHY') {
    report.status = 'DEGRADED';
  }

  const httpStatus = report.status === 'CRITICAL' ? 503 : 200;
  return res.status(httpStatus).json(report);
};

export default {
  deepHealthcheck,
};
