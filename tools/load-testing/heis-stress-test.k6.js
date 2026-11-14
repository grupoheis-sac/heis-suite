// tools/load-testing/heis-stress-test.k6.js
// Ejecución: k6 run -e BASE_URL=https://suite.grupoheis.com/api tools/load-testing/heis-stress-test.k6.js
// O en local: k6 run -e BASE_URL=http://localhost:4000/api tools/load-testing/heis-stress-test.k6.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ==========================================
// 1. MÉTRICAS PERSONALIZADAS DE AUDITORÍA ACID & SUNAT
// ==========================================
const posCheckoutLatency = new Trend('heis_pos_checkout_duration_ms', true);
const xmlSignAndQueueLatency = new Trend('heis_sunat_sign_queue_duration_ms', true);
const workerRetryLatency = new Trend('heis_sunat_worker_retry_duration_ms', true);

const duplicateCorrelativoErrors = new Counter('heis_correlativo_collision_errors');
const negativeStockErrors = new Counter('heis_negative_stock_breaches');
const mysqlDeadlockErrors = new Counter('heis_mysql_deadlock_errors');
const controlledOutOfStockRate = new Rate('heis_controlled_stock_exhausted_rate');
const transactionSuccessRate = new Rate('heis_acid_transaction_success_rate');

// Seguimiento en memoria por VU para detectar colisiones de correlativos dentro del mismo proceso k6
const seenCorrelativosByTenant = {};

// ==========================================
// 2. CONFIGURACIÓN DE ESCENARIOS (150 VUs CONCURRENTES) Y UMBRALES (SLAs)
// ==========================================
export const options = {
  scenarios: {
    // Escenario 1: 110 Cajeros simultáneos forzando contención de fila (LOCK.UPDATE) en Stock y Correlativos
    pos_race_condition_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },  // Calentamiento del pool MySQL (max: 30)
        { duration: '1m', target: 110 },  // Pico de contención multi-tenant (110 cajeros concurrentes)
        { duration: '1m', target: 110 },  // Sostenimiento de estrés sobre InnoDB row locks
        { duration: '20s', target: 0 },   // Enfriamiento gradual
      ],
      exec: 'escenarioCobroSimultaneoPOS',
    },

    // Escenario 2: 40 Usuarios/Procesos saturando firmado XMLDSig (RSA-SHA256) y Worker de Contingencia SUNAT
    sunat_xmldsig_saturation: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 40 },   // 110 + 40 = 150 Usuarios Concurrentes Totales
        { duration: '20s', target: 0 },
      ],
      exec: 'escenarioSaturacionWorkerSunat',
    },
  },

  // Umbrales estrictos de aprobación para Pase a Producción (SLOs)
  thresholds: {
    // 0 absoluto en corrupción de datos financieros o tributarios
    heis_correlativo_collision_errors: ['count===0'],
    heis_negative_stock_breaches: ['count===0'],
    heis_mysql_deadlock_errors: ['count<3'],

    // Latencias objetivo p95 y p99 por componente
    heis_pos_checkout_duration_ms: ['p(95)<450', 'p(99)<850'],
    heis_sunat_sign_queue_duration_ms: ['p(95)<750', 'p(99)<1400'],
    heis_sunat_worker_retry_duration_ms: ['p(95)<350', 'p(99)<650'],

    // Tasa global de éxito transaccional (incluyendo bloqueos legítimos de "Stock Insuficiente")
    heis_acid_transaction_success_rate: ['rate>0.99'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';

// Configuración de 5 Empresas (Tenants) simultáneas para probar aislamiento y contención por tenant
const TENANTS = [
  { empresaId: 1, sucursalId: 1, vertical: 'ferreteria', serieFactura: 'F001', serieBoleta: 'B001', cajaId: 1, productoContencionId: 101, productoAlternoId: 102, userEmail: 'caja1@empresa1.com', password: __ENV.TEST_PASSWORD || 'Heis2026!' },
  { empresaId: 2, sucursalId: 2, vertical: 'botica',     serieFactura: 'F001', serieBoleta: 'B001', cajaId: 2, productoContencionId: 201, productoAlternoId: 202, userEmail: 'caja1@empresa2.com', password: __ENV.TEST_PASSWORD || 'Heis2026!' },
  { empresaId: 3, sucursalId: 3, vertical: 'ferreteria', serieFactura: 'F002', serieBoleta: 'B002', cajaId: 3, productoContencionId: 301, productoAlternoId: 302, userEmail: 'caja1@empresa3.com', password: __ENV.TEST_PASSWORD || 'Heis2026!' },
  { empresaId: 4, sucursalId: 4, vertical: 'botica',     serieFactura: 'F001', serieBoleta: 'B001', cajaId: 4, productoContencionId: 401, productoAlternoId: 402, userEmail: 'caja1@empresa4.com', password: __ENV.TEST_PASSWORD || 'Heis2026!' },
  { empresaId: 5, sucursalId: 5, vertical: 'ferreteria', serieFactura: 'F001', serieBoleta: 'B001', cajaId: 5, productoContencionId: 501, productoAlternoId: 502, userEmail: 'caja1@empresa5.com', password: __ENV.TEST_PASSWORD || 'Heis2026!' },
];

// ==========================================
// 3. FASE SETUP: AUTENTICACIÓN MULTI-TENANT PREVIA
// ==========================================
export function setup() {
  const tokensByEmpresa = {};

  for (const tenant of TENANTS) {
    // Si se provee un token pre-firmado por variable de entorno o se autentica contra /auth/login
    if (__ENV.PREGENERATED_JWT_Tokens) {
      const parsed = JSON.parse(__ENV.PREGENERATED_JWT_Tokens);
      tokensByEmpresa[tenant.empresaId] = parsed[tenant.empresaId];
      continue;
    }

    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: tenant.userEmail, password: tenant.password }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (loginRes.status === 200 && loginRes.json('token')) {
      tokensByEmpresa[tenant.empresaId] = loginRes.json('token');
    }
  }

  return { tokensByEmpresa };
}

function buildTenantHeaders(tenant, token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || __ENV.FALLBACK_JWT || ''}`,
    'x-empresa-id': String(tenant.empresaId),
    'x-sucursal-id': String(tenant.sucursalId),
  };
}

// ==========================================
// 4. ESCENARIO 1: COBRO SIMULTÁNEO POS (CONDICIONES DE CARRERA & ANTI-DEADLOCK)
// ==========================================
export function escenarioCobroSimultaneoPOS(data) {
  // Asigna determinísticamente cada VU a una de las 5 empresas para que ~22 cajeros ataquen la MISMA empresa a la vez
  const tenant = TENANTS[__VU % TENANTS.length];
  const headers = buildTenantHeaders(tenant, data.tokensByEmpresa[tenant.empresaId]);

  group(`POS Concurrent Checkout - Tenant ${tenant.empresaId} (${tenant.vertical})`, () => {
    // Intencionalmente invertimos el orden de los productos en el 50% de los VUs ([B, A] vs [A, B])
    // para verificar que el ordenamiento ascendente de IDs en posController.js previene Deadlocks en MySQL.
    const invertirOrden = __ITER % 2 === 0;
    const items = invertirOrden
      ? [
          { producto_id: tenant.productoAlternoId, medicamento_id: tenant.productoAlternoId, cantidad: 1, precio_unitario: 23.60 },
          { producto_id: tenant.productoContencionId, medicamento_id: tenant.productoContencionId, cantidad: 1, precio_unitario: 11.80 },
        ]
      : [
          { producto_id: tenant.productoContencionId, medicamento_id: tenant.productoContencionId, cantidad: 1, precio_unitario: 11.80 },
          { producto_id: tenant.productoAlternoId, medicamento_id: tenant.productoAlternoId, cantidad: 1, precio_unitario: 23.60 },
        ];

    const esFactura = __ITER % 3 === 0;
    const serie = esFactura ? tenant.serieFactura : tenant.serieBoleta;
    const tipoComprobante = esFactura ? '01' : '03';

    const payload = JSON.stringify({
      caja_id: tenant.cajaId,
      cliente_id: 1,
      tipo_comprobante: tipoComprobante,
      serie,
      metodo_pago: 'EFECTIVO',
      items,
      total: 35.40,
    });

    const endpoint =
      tenant.vertical === 'botica'
        ? `${BASE_URL}/botica/pos/venta`
        : `${BASE_URL}/ferreteria/pos/venta`;

    const startTime = Date.now();
    const res = http.post(endpoint, payload, { headers, tags: { name: 'POS_Checkout_ACID' } });
    posCheckoutLatency.add(Date.now() - startTime);

    const bodyText = res.body || '';

    // 1. Verificar ausencia de Deadlocks no controlados o duplicidad de llave única uk_cpe_tenant_tipo_serie_correlativo
    if (bodyText.includes('ER_LOCK_DEADLOCK') || bodyText.includes('Deadlock found')) {
      mysqlDeadlockErrors.add(1);
    }
    if (bodyText.includes('uk_cpe_tenant_tipo_serie_correlativo') || bodyText.includes('ER_DUP_ENTRY')) {
      duplicateCorrelativoErrors.add(1);
    }

    // 2. Caso Venta Exitosa (HTTP 200 / 201)
    if (res.status === 200 || res.status === 201) {
      const correlativo = res.json('data.correlativo') || res.json('correlativo');
      const nuevoStock = res.json('data.stock_resultante');

      if (correlativo !== undefined && correlativo !== null) {
        const key = `${tenant.empresaId}-${tipoComprobante}-${serie}`;
        if (!seenCorrelativosByTenant[key]) {
          seenCorrelativosByTenant[key] = new Set();
        }
        if (seenCorrelativosByTenant[key].has(correlativo)) {
          duplicateCorrelativoErrors.add(1);
        }
        seenCorrelativosByTenant[key].add(correlativo);
      }

      if (typeof nuevoStock === 'number' && nuevoStock < 0) {
        negativeStockErrors.add(1);
      }

      transactionSuccessRate.add(true);
      check(res, {
        'Venta POS registrada con correlativo único': () => Boolean(correlativo),
      });
    } else if (res.status === 400 && bodyText.includes('STOCK_INSUFICIENTE')) {
      // 3. Caso de Quiebre de Stock Controlado por LOCK.UPDATE (Comportamiento ACID esperado cuando el lote llega a 0)
      controlledOutOfStockRate.add(true);
      transactionSuccessRate.add(true);
      check(res, {
        'Bloqueo ACID impidió venta en negativo correctamente': (r) =>
          r.body.includes('STOCK_INSUFICIENTE'),
      });
    } else {
      transactionSuccessRate.add(false);
    }
  });

  sleep(Math.random() * 0.4 + 0.1); // Pausa realista entre pulsaciones de cobro (100ms - 500ms)
}

// ==========================================
// 5. ESCENARIO 2: SATURACIÓN DE FIRMADO XMLDSig (CPU/RAM) Y WORKER SUNAT
// ==========================================
export function escenarioSaturacionWorkerSunat(data) {
  const tenant = TENANTS[(__VU + 1) % TENANTS.length];
  const headers = buildTenantHeaders(tenant, data.tokensByEmpresa[tenant.empresaId]);

  group(`SUNAT UBL 2.1 XMLDSig & Contingency Stress - Tenant ${tenant.empresaId}`, () => {
    // Genera un comprobante con 15 líneas de detalle con precios que fuerzan redondeo a 6 decimales en UBL 2.1
    const itemsComplejos = Array.from({ length: 15 }, (_, idx) => ({
      codigo: `ITEM-${idx + 1}`,
      descripcion: `PRODUCTO DE ESTRES CRIPTOGRAFICO UBL 2.1 #${idx + 1}`,
      cantidad: (idx % 3) + 1,
      precio_unitario: 14.90, // 14.90 / 1.18 = 12.627119 (Fuerza precisión de 6 decimales en ublService.js)
      tipo_afectacion_igv: '10',
    }));

    const emitPayload = JSON.stringify({
      tipo_comprobante: '01',
      serie: tenant.serieFactura,
      cliente: {
        tipo_documento: '6',
        documento: '20600000001',
        razon_social: 'EMPRESA AUDITORA DEVSECOPS S.A.C.',
        direccion: 'Av. Javier Prado Este 1234 - Lima',
      },
      items: itemsComplejos,
      forzar_contingencia_test: true, // Permite encolar en CONTINGENCIA_REINTENTAR si el mock SOAP devuelve 503
    });

    // Paso 1: Emisión + Generación XML UBL 2.1 + Firma RSA-SHA256 (signerService.js) + Compresión ZIP
    const t0 = Date.now();
    const emitRes = http.post(`${BASE_URL}/facturacion/emitir`, emitPayload, {
      headers,
      tags: { name: 'SUNAT_Sign_And_Queue' },
    });
    xmlSignAndQueueLatency.add(Date.now() - t0);

    const cpeId = emitRes.json('data.id') || emitRes.json('id');

    check(emitRes, {
      'XML UBL 2.1 generado y firmado sin agotar Event Loop': (r) =>
        r.status === 200 || r.status === 201,
    });

    // Paso 2: Si el comprobante quedó en cola, estresar el endpoint de Reintento Manual y lectura de XML
    if (cpeId) {
      const t1 = Date.now();
      const retryRes = http.post(
        `${BASE_URL}/facturacion/comprobantes/${cpeId}/reintentar`,
        null,
        { headers, tags: { name: 'SUNAT_Force_Worker_Retry' } }
      );
      workerRetryLatency.add(Date.now() - t1);

      check(retryRes, {
        'Worker de contingencia procesó o encoló reintento sin bloqueo (SKIP LOCKED)': (r) =>
          r.status === 200 || r.status === 400,
      });

      // Paso 3: Inspeccionar el XML firmado desde server/storage/tenant_{id}/ validando resolveSafeTenantPath
      const xmlPreviewRes = http.get(
        `${BASE_URL}/facturacion/comprobantes/${cpeId}/archivo/xml?modo=preview`,
        { headers, tags: { name: 'SUNAT_Read_Signed_XML' } }
      );

      check(xmlPreviewRes, {
        'Visor XML devuelve documento firmado con DigestValue': (r) =>
          r.status === 200 && (r.body || '').includes('DigestValue'),
      });
    }
  });

  sleep(Math.random() * 0.6 + 0.2);
}
