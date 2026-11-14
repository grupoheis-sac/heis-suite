import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/empresa.middleware.js';
import { obtenerDashboardEjecutivoBI } from '../controllers/bi.controller.js';
import { streamRealtimeEvents, realtimeHub } from '../services/realtime.service.js';

const router = Router();

// Stream SSE en tiempo real (autenticado por query ?token= o Header)
router.get('/realtime/stream', streamRealtimeEvents);

// Estado del bus de eventos
router.get('/realtime/stats', verifyJWT, (req, res) => {
  res.json({ success: true, data: realtimeHub.getStats() });
});

// Dashboard Ejecutivo BI Multi-Tenant
router.get('/bi/dashboard', verifyJWT, tenantContext, obtenerDashboardEjecutivoBI);

export default router;
