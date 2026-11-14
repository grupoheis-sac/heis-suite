import { Router } from 'express';
import { login, getProfile } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { loginRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.get('/me', verifyJWT, getProfile);

export default router;

