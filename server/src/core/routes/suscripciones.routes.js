import { Router } from 'express';
import {
  procesarWebhookPasarela,
  registrarOnboardingTrial,
  procesarCheckoutDirecto,
  obtenerEstadoSuscripcionActual,
  listarCarteraCobranzasSaaS,
  renovarSuscripcionEmpresa,
  forzarBarridoMoraSaaS,
} from '../controllers/suscripciones.controller.js';
import { rateLimiterEsticto } from '../middleware/rateLimiter.middleware.js';
import { verifyJWT, requireSuperAdmin } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/empresa.middleware.js';

const router = Router();

// Endpoint público de Auto-Registro con 14 días de prueba gratis (protegido con rate limiter)
router.post('/onboarding', rateLimiterEsticto, registrarOnboardingTrial);

// Endpoint público para Webhooks de Pasarelas (Mercado Pago, Izipay, Stripe) con verificación criptográfica HMAC
router.post('/webhooks/:pasarela', procesarWebhookPasarela);

// Checkout directo desde el modal de suscripciones del frontend
router.post('/checkout', verifyJWT, procesarCheckoutDirecto);

// Consulta de suscripción para el tenant actual
router.get('/estado', verifyJWT, tenantContext, obtenerEstadoSuscripcionActual);

// Gestión de cartera de cobranzas SaaS (SuperAdmin)
router.get('/cartera', verifyJWT, requireSuperAdmin, listarCarteraCobranzasSaaS);
router.post('/renovar/:empresaId', verifyJWT, requireSuperAdmin, renovarSuscripcionEmpresa);
router.post('/barrido-mora', verifyJWT, requireSuperAdmin, forzarBarridoMoraSaaS);

export default router;
