// server/src/core/services/saasBillingIssuer.service.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { ComprobanteElectronico, Empresa, Sucursal } from '../models/index.js';
import { calcularTotalesLineaUBL21 } from './sunat/ublService.js';
import { resolveSafeTenantPath, loadTenantPfxBuffer, decryptCertPassword } from './sunat/certService.js';
import { numeroALetras } from './sunat/numeroALetras.js';
import { ejecutarCicloContingenciaSunat } from './sunat/contingencyWorker.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const HEIS_ISSUER_EMPRESA_ID = Number(process.env.HEIS_ISSUER_EMPRESA_ID || 1);

const CATALOGO_PRECIOS_PLAN = {
  BASICO: { nombre: 'SUSCRIPCION MENSUAL HEIS SUITE - PLAN BASICO', mensual: 99.00, anual: 990.00 },
  PRO: { nombre: 'SUSCRIPCION MENSUAL HEIS SUITE - PLAN PRO MULTI-MODULO', mensual: 199.00, anual: 1990.00 },
  ENTERPRISE: { nombre: 'SUSCRIPCION MENSUAL HEIS SUITE - PLAN ENTERPRISE', mensual: 399.00, anual: 3990.00 },
};

/**
 * Emite y firma el Comprobante Electrónico UBL 2.1 de GRUPO HEIS S.A.C. hacia el Tenant Cliente
 * Debe invocarse dentro de la transacción ACID del Webhook de pago.
 */
export async function emitirFacturaSuscripcionSaaS({
  empresaCliente,
  planCodigo,
  periodo = 'MENSUAL',
  montoPagado,
  pasarela,
  pasarelaTxId,
  transaction,
}) {
  // 1. Obtener datos del Emisor (GRUPO HEIS S.A.C. - Tenant Maestro)
  let heisEmisor = await Empresa.findOne({
    where: { id: HEIS_ISSUER_EMPRESA_ID },
    lock: transaction.LOCK.UPDATE,
    skipTenantScope: true,
    transaction,
  });

  if (!heisEmisor) {
    // Si no existe ID 1, buscar la primera empresa del sistema como fallback
    heisEmisor = await Empresa.findOne({
      order: [['id', 'ASC']],
      lock: transaction.LOCK.UPDATE,
      skipTenantScope: true,
      transaction,
    });
  }

  if (!heisEmisor) {
    throw new Error('Configuración faltante: No existe la empresa emisora maestra HEIS en la base de datos.');
  }

  const sucursalPrincipalHeis = await Sucursal.findOne({
    where: { empresa_id: heisEmisor.id },
    order: [['id', 'ASC']],
    skipTenantScope: true,
    transaction,
  });

  // 2. Determinar si corresponde Factura (01 - RUC 11 dígitos) o Boleta (03)
  const docCliente = String(empresaCliente.ruc || '').trim();
  const esRucValido = /^(10|20)\d{9}$/.test(docCliente);
  const tipoComprobante = esRucValido ? '01' : '03';
  const serie = esRucValido
    ? process.env.HEIS_SAAS_SERIE_FACTURA || 'F001'
    : process.env.HEIS_SAAS_SERIE_BOLETA || 'B001';

  // 3. Reservar correlativo atómico con bloqueo pesimista FOR UPDATE sobre el Emisor HEIS
  const ultimoCpe = await ComprobanteElectronico.findOne({
    where: {
      empresa_id: heisEmisor.id,
      tipo_comprobante: tipoComprobante,
      serie,
    },
    order: [['correlativo', 'DESC']],
    lock: transaction.LOCK.UPDATE,
    skipTenantScope: true,
    transaction,
  });

  const correlativo = (ultimoCpe ? Number(ultimoCpe.correlativo) : 0) + 1;

  // 4. Calcular desglose tributario exacto UBL 2.1 (Valor Unitario a 6 decimales, IGV 18% a 2 decimales)
  const planInfo = CATALOGO_PRECIOS_PLAN[planCodigo] || CATALOGO_PRECIOS_PLAN.PRO;
  const totalCobrado = Number(montoPagado || planInfo.mensual);

  const lineaUbl = calcularTotalesLineaUBL21(
    {
      cantidad: 1,
      precio_unitario: totalCobrado,
      tipo_afectacion_igv: '10', // Gravado - Operación Onerosa
    },
    0.18
  );

  const leyendaMontoLetras =
    typeof numeroALetras === 'function'
      ? numeroALetras(lineaUbl.totalLinea)
      : `${lineaUbl.totalLinea.toFixed(2)} CON 00/100 SOLES`;

  const emisorRuc = heisEmisor.ruc || '20600000001';
  const numeroFormatoSunat = `${emisorRuc}-${tipoComprobante}-${serie}-${String(correlativo).padStart(8, '0')}`;
  const zipFileName = `${numeroFormatoSunat}.zip`;

  // 5. Registrar el Comprobante Electrónico en estado PENDIENTE para el Worker de Contingencia
  const nuevoComprobante = await ComprobanteElectronico.create(
    {
      empresa_id: heisEmisor.id,
      sucursal_id: sucursalPrincipalHeis?.id || 1,
      tipo_comprobante: tipoComprobante,
      serie,
      correlativo,
      fecha_emision: new Date(),
      cliente_tipo_documento: esRucValido ? '6' : '1',
      cliente_documento: docCliente || '00000000',
      cliente_nombre: empresaCliente.razon_social || empresaCliente.nombre_comercial || empresaCliente.nombre || 'EMPRESA CLIENTE',
      cliente_direccion: empresaCliente.direccion || 'Lima, Perú',
      moneda: 'PEN',
      op_gravadas: lineaUbl.valorVentaLinea,
      op_exoneradas: 0.00,
      op_inafectas: 0.00,
      igv: lineaUbl.igvLinea,
      total: lineaUbl.totalLinea,
      monto_letras: leyendaMontoLetras,
      observaciones: `Renovación automática ${periodo} - Plan ${planCodigo} (${pasarela} Ref: ${pasarelaTxId})`,
      estado_sunat: 'PENDIENTE',
      intentos_envio: 0,
      proximo_reintento: new Date(),
      xml_firmado_filename: zipFileName,
    },
    { skipTenantScope: true, transaction }
  );

  return {
    comprobante: nuevoComprobante,
    lineaUbl,
    numeroFormatoSunat,
    zipFileName,
  };
}

/**
 * Dispara en segundo plano la generación física del XML firmado y el ciclo del Worker SUNAT
 */
export function dispararEnvioInmediatoWorkerSunat() {
  setImmediate(() => {
    ejecutarCicloContingenciaSunat().catch((err) => {
      console.error('[SAAS_BILLING_WORKER_TRIGGER_ERR]:', err.message);
    });
  });
}

export default {
  emitirFacturaSuscripcionSaaS,
  dispararEnvioInmediatoWorkerSunat,
};
