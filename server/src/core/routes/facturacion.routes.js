import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/empresa.middleware.js';
import {
  listarComprobantes,
  emitirComprobante,
  emitirNotaCredito,
  descargarXmlComprobante,
  descargarCdrComprobante,
} from '../controllers/facturacion.controller.js';

const router = Router();

router.use(verifyJWT, tenantContext);

router.get('/comprobantes', listarComprobantes);
router.post('/emitir', emitirComprobante);
router.post('/comprobantes/:id/nota-credito', emitirNotaCredito);
router.get('/comprobantes/:id/xml', descargarXmlComprobante);
router.get('/comprobantes/:id/cdr', descargarCdrComprobante);

export default router;
