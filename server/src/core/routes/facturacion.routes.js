import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/empresa.middleware.js';
import {
  listarComprobantes,
  emitirComprobante,
  emitirNotaCredito,
  comunicarBaja,
  descargarXmlComprobante,
  descargarCdrComprobante,
  descargarPdfComprobante,
  forzarReintentoSunat,
  obtenerArchivoComprobante,
  emitirGuiaRemision,
  emitirAnulacionMasivaRcRa,
  validarComprobanteTiempoReal,
} from '../controllers/facturacion.controller.js';
import {
  obtenerResumenContableMes,
  exportarRegistroVentas141Csv,
  exportarPleVentasTxt,
  exportarKardexSunat131Csv,
  exportarArqueosCajaCsv,
} from '../controllers/reportesContables.controller.js';

const router = Router();

router.use(verifyJWT, tenantContext);

// Emisión y gestión de Comprobantes Electrónicos UBL 2.1
router.get('/comprobantes', listarComprobantes);
router.post('/emitir', emitirComprobante);
router.post('/comprobantes/:id/nota-credito', emitirNotaCredito);
router.post('/comprobantes/:id/comunicar-baja', comunicarBaja);
router.get('/comprobantes/:id/xml', descargarXmlComprobante);
router.get('/comprobantes/:id/cdr', descargarCdrComprobante);
router.get('/comprobantes/:id/pdf', descargarPdfComprobante);
router.post('/comprobantes/:id/reintentar', forzarReintentoSunat);
router.get('/comprobantes/:id/archivo/:tipo', obtenerArchivoComprobante);

// Guías de Remisión Electrónica (GRE Remitente '09' y Transportista '31') vía API REST SUNAT
router.post('/gre/emitir', emitirGuiaRemision);

// Resumen Diario de Boletas (RC) y Comunicación de Bajas (RA) para anulaciones masivas
router.post('/anulacion-masiva', emitirAnulacionMasivaRcRa);

// Consulta de Validez de Comprobantes en Tiempo Real contra API SUNAT
router.post('/validar-cpe', validarComprobanteTiempoReal);

// Libros Contables y Exportaciones Tributarias SUNAT (14.1, 13.1, PLE y Arqueos)
router.get('/reportes/resumen-mes', obtenerResumenContableMes);
router.get('/reportes/ventas-14-1-csv', exportarRegistroVentas141Csv);
router.get('/reportes/ple-14-1-txt', exportarPleVentasTxt);
router.get('/reportes/kardex-13-1-csv', exportarKardexSunat131Csv);
router.get('/reportes/arqueos-caja-csv', exportarArqueosCajaCsv);

export default router;
