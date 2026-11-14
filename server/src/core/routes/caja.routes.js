import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/empresa.middleware.js';
import {
  obtenerCajaActual,
  aperturarCajaGeneral,
  registrarMovimientoGeneral,
  cerrarCajaGeneral,
  obtenerHistorialCajasGeneral,
  obtenerUltimoCierre,
  obtenerDetalleCierreCaja,
} from '../controllers/caja.controller.js';

const router = Router();

router.use(verifyJWT, tenantContext);

router.get('/actual', obtenerCajaActual);
router.post('/abrir', aperturarCajaGeneral);
router.post('/movimiento', registrarMovimientoGeneral);
router.post('/cerrar', cerrarCajaGeneral);
router.post('/cerrar/:id', cerrarCajaGeneral);
router.post('/:id/cerrar', cerrarCajaGeneral);
router.get('/historial', obtenerHistorialCajasGeneral);
router.get('/ultimo-cierre', obtenerUltimoCierre);
router.get('/:id/cierre', obtenerDetalleCierreCaja);
router.get('/cierre/:id', obtenerDetalleCierreCaja);

export default router;
