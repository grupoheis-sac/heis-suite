import { Router } from 'express';
import { verifyJWT, requireRole } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/empresa.middleware.js';
import { obtenerDashboardEjecutivoBI } from '../controllers/bi.controller.js';
import { streamRealtimeEvents, realtimeHub } from '../services/realtime.service.js';
import {
  obtenerEstadoSuscripcionActual,
  listarCarteraCobranzasSaaS,
  renovarSuscripcionEmpresa,
  forzarBarridoMoraSaaS,
} from '../controllers/suscripciones.controller.js';

const router = Router();

// Stream SSE en tiempo real
router.get('/realtime/stream', streamRealtimeEvents);
router.get('/realtime/stats', verifyJWT, (req, res) => {
  res.json({ success: true, data: realtimeHub.getStats() });
});

// Dashboard Ejecutivo BI Multi-Tenant
router.get('/bi/dashboard', verifyJWT, tenantContext, obtenerDashboardEjecutivoBI);

// Estado de Suscripción del Cliente Actual
router.get('/suscripcion/estado', verifyJWT, tenantContext, obtenerEstadoSuscripcionActual);

// Operaciones de Cobranza Recurrente y Corte por Mora (Solo SuperAdmin)
router.get('/suscripcion/cartera', verifyJWT, requireRole('superadmin'), listarCarteraCobranzasSaaS);
router.post('/suscripcion/renovar/:empresaId', verifyJWT, requireRole('superadmin'), renovarSuscripcionEmpresa);
router.post('/suscripcion/barrido-mora', verifyJWT, requireRole('superadmin'), forzarBarridoMoraSaaS);

export default router;
