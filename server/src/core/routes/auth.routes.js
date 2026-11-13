import { Router } from 'express';
import { login, getProfile } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', verifyJWT, getProfile);

export default router;

