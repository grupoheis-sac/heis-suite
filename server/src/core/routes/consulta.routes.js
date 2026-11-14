import { Router } from 'express';
import { consultarDocumento } from '../controllers/consulta.controller.js';
import { consultaRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Endpoint público para autocompletar RUC / DNI en onboarding, POS y SuperAdmin
router.get('/:tipo/:numero', consultaRateLimiter, consultarDocumento);

export default router;

