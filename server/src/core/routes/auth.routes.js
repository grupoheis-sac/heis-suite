import { Router } from 'express';
import { login, getProfile } from '../controllers/auth.controller.js';
import { registrarOnboardingTrial } from '../controllers/suscripciones.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { loginRateLimiter, rateLimiterEsticto } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.post('/onboarding', rateLimiterEsticto, registrarOnboardingTrial);
router.get('/me', verifyJWT, getProfile);

export default router;

