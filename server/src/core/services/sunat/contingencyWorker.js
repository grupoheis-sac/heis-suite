import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../../config/db.js';
import { ComprobanteElectronico, Empresa } from '../../models/index.js';
import { resolveSafeTenantPath, decryptCertPassword } from './certService.js';
import { enviarComprobanteSunatConResiliencia, consultarCdrSunat } from './soapService.js';
import { emitToTenantSucursal } from '../realtime.service.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const MAX_INTENTOS = 10;
const BATCH_SIZE = 15;
let workerTimer = null;
let isRunningBatch = false;

/**
 * Calcula el próximo reintento usando Backoff Exponencial + Jitter aleatorio
 * Intento 1: ~1m | 2: ~5m | 3: ~15m | 4: ~60m | 5: ~3h | 6+: ~6h
 */
function calcularProximoReintento(intentoActual) {
  const minutosBase = [1, 5, 15, 60, 180, 360, 360, 720, 720, 720];
  const minutos = minutosBase[Math.min(intentoActual - 1, minutosBase.length - 1)] || 360;
  const jitterMs = Math.floor(Math.random() * 30000); // +0 a 30s para evitar tormentas de peticiones
  return new Date(Date.now() + minutos * 60 * 1000 + jitterMs);
}

/**
 * Clasifica los códigos de respuesta de SUNAT según el Anexo de Códigos de Error UBL 2.1
 */
function clasificarCodigoSunat(codigoStr) {
  const codigo = Number(codigoStr);
  if (codigoStr === '0' || String(codigoStr).trim() === '0') return 'ACEPTADO';

  // Código 1033: El comprobante ya fue registrado previamente en SUNAT (requiere recuperar CDR con getStatusCdr)
  if (codigo === 1033) return 'YA_REGISTRADO_RECUPERAR_CDR';

  // Códigos 0100-0199 (ej. 0109 Servicio no disponible, 0130 Timeout interno SUNAT) -> Reintentables
  if (codigo >= 100 && codigo <= 199) return 'REINTENTABLE';

  // Excepciones de validación estructural (0200-1999) y Rechazos (2000-3999) -> No reintentables con el mismo XML
  if (codigo >= 200 && codigo <= 3999) return 'RECHAZADO_DEFINITIVO';

  // Observaciones (4000+) -> El comprobante es válido pero incluye advertencias
  if (codigo >= 4000) return 'ACEPTADO_CON_OBSERVACIONES';

  return 'REINTENTABLE';
}

/**
 * Reclama de forma atómica un lote de comprobantes pendientes usando FOR UPDATE SKIP LOCKED
 */
async function reclamarLotePendiente() {
  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      const ahora = new Date();

      const comprobantes = await ComprobanteElectronico.findAll({
        where: {
          estado_sunat: ['PENDIENTE', 'CONTINGENCIA_REINTENTAR'],
          intentos_envio: { [Op.lt]: MAX_INTENTOS },
          [Op.or]: [
            { proximo_reintento: null },
            { proximo_reintento: { [Op.lte]: ahora } },
          ],
        },
        order: [['proximo_reintento', 'ASC'], ['id', 'ASC']],
        limit: BATCH_SIZE,
        lock: {
          level: t.LOCK.UPDATE,
          of: ComprobanteElectronico,
        },
        skipLocked: true, // Evita colisión si hay múltiples contenedores corriendo en paralelo
        skipTenant: true,  // El Worker procesa todos los tenants activos
        skipTenantScope: true,
        transaction: t,
      });

      if (comprobantes.length === 0) return [];

      const ids = comprobantes.map((c) => c.id);
      await ComprobanteElectronico.update(
        { estado_sunat: 'PROCESANDO_ENVIO' },
        {
          where: { id: ids },
          skipTenant: true,
          skipTenantScope: true,
          transaction: t,
        }
      );

      return comprobantes;
    }
  );
}

/**
 * Procesa individualmente un comprobante reclamado
 */
async function procesarComprobante(cpe) {
  const intentoActual = Number(cpe.intentos_envio || 0) + 1;

  try {
    const empresa = await Empresa.scope('withSunatSecrets').findOne({
      where: { id: cpe.empresa_id, activo: true },
      skipTenant: true,
      skipTenantScope: true,
    });

    if (!empresa || !empresa.ruc) {
      await cpe.update(
        {
          estado_sunat: 'ERROR_CRITICO',
          ultimo_error_sunat: 'Empresa sin RUC configurado o inactiva.',
        },
        { skipTenant: true, skipTenantScope: true }
      );
      return;
    }

    // Lectura segura contra Path Traversal desde server/storage/tenant_{id}/
    const xmlFilename = cpe.xml_firmado_filename || `${empresa.ruc}-${cpe.tipo_documento_codigo || '03'}-${cpe.serie}-${String(cpe.correlativo).padStart(8, '0')}.xml`;
    const zipFilename = xmlFilename.endsWith('.zip') ? xmlFilename : `${xmlFilename.replace(/\.xml$/, '')}.zip`;

    let zipBuffer = null;
    try {
      const zipFilePath = resolveSafeTenantPath(STORAGE_ROOT, cpe.empresa_id, zipFilename);
      zipBuffer = await fs.readFile(zipFilePath);
    } catch (_) {
      // Fallback: Si no está en disco pero el XML firmado está en base de datos
      if (cpe.xml_firmado) {
        const zip = new AdmZip();
        zip.addFile(xmlFilename.endsWith('.xml') ? xmlFilename : `${xmlFilename}.xml`, Buffer.from(cpe.xml_firmado, 'utf8'));
        zipBuffer = zip.toBuffer();
      } else {
        throw new Error(`Archivo ZIP/XML no encontrado para comprobante ID ${cpe.id}`);
      }
    }

    const zipBase64 = zipBuffer.toString('base64');

    const credencialesSol = {
      ruc: empresa.ruc,
      usuarioSol: empresa.usuario_sol || empresa.sunat_usuario_sol || 'MODDATOS',
      claveSol: empresa.clave_sol_cifrada
        ? decryptCertPassword(empresa.clave_sol_cifrada)
        : (empresa.clave_sol || empresa.sunat_clave_sol || 'moddatos'),
    };

    const isProd = (empresa.modo_sunat || empresa.entorno_sunat || '').toUpperCase() === 'PRODUCCION';
    const endpointUrl = isProd
      ? (process.env.SUNAT_ENDPOINT_PROD || 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService')
      : (process.env.SUNAT_ENDPOINT_BETA || 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService');

    const respuesta = await enviarComprobanteSunatConResiliencia(
      zipBase64,
      zipFilename.replace('.zip', ''),
      credencialesSol,
      endpointUrl
    );

    // 1. Caso de Caída de Red / Timeout / HTTP 5xx
    if (respuesta.estado === 'CONTINGENCIA_REINTENTAR') {
      const proximo = calcularProximoReintento(intentoActual);
      const agotado = intentoActual >= MAX_INTENTOS;

      await cpe.update(
        {
          estado_sunat: agotado ? 'ERROR_CRITICO' : 'CONTINGENCIA_REINTENTAR',
          intentos_envio: intentoActual,
          proximo_reintento: agotado ? null : proximo,
          ultimo_error_sunat: `[Intento ${intentoActual}/${MAX_INTENTOS}] ${respuesta.motivo}`,
        },
        { skipTenant: true, skipTenantScope: true }
      );
      return;
    }

    const clasificacion = clasificarCodigoSunat(respuesta.codigoSunat);

    // 2. Caso Especial 1033: El comprobante ya se había registrado en un intento previo
    if (clasificacion === 'YA_REGISTRADO_RECUPERAR_CDR') {
      const cdrRecuperado = await consultarCdrSunat(
        {
          rucComprobante: empresa.ruc,
          tipoComprobante: cpe.tipo_documento_codigo || (cpe.tipo_comprobante === 'Factura' ? '01' : '03'),
          serieComprobante: cpe.serie,
          numeroComprobante: cpe.correlativo,
        },
        credencialesSol,
        endpointUrl
      );

      if (cdrRecuperado?.cdrBase64) {
        respuesta.cdrBase64 = cdrRecuperado.cdrBase64;
        respuesta.codigoSunat = '0';
        respuesta.mensajeSunat = 'Recuperado vía getStatusCdr tras código 1033.';
      }
    }

    // 3. Caso Aceptado o Aceptado con Observaciones
    if (
      clasificacion === 'ACEPTADO' ||
      clasificacion === 'ACEPTADO_CON_OBSERVACIONES' ||
      respuesta.codigoSunat === '0'
    ) {
      const cdrFileName = `R-${zipFilename}`;
      const cdrSafePath = resolveSafeTenantPath(STORAGE_ROOT, cpe.empresa_id, cdrFileName);

      if (respuesta.cdrBase64) {
        await fs.mkdir(path.dirname(cdrSafePath), { recursive: true });
        await fs.writeFile(cdrSafePath, Buffer.from(respuesta.cdrBase64, 'base64'));
      }

      const estadoFinal =
        clasificacion === 'ACEPTADO_CON_OBSERVACIONES'
          ? 'ACEPTADO_CON_OBSERVACIONES'
          : 'ACEPTADO';

      await cpe.update(
        {
          estado_sunat: estadoFinal,
          sunat_estado: estadoFinal === 'ACEPTADO' ? 'ACEPTADO' : 'OBSERVADO',
          intentos_envio: intentoActual,
          proximo_reintento: null,
          codigo_sunat: respuesta.codigoSunat || '0',
          ultimo_error_sunat: respuesta.mensajeSunat || 'Aceptado por SUNAT',
          cdr_filename: cdrFileName,
          cdr_respuesta: respuesta.cdrXml || cpe.cdr_respuesta,
        },
        { skipTenant: true, skipTenantScope: true }
      );

      emitToTenantSucursal(cpe.empresa_id, cpe.sucursal_id, 'sunat:comprobante_actualizado', {
        comprobante_id: cpe.id,
        serie: cpe.serie,
        correlativo: cpe.correlativo,
        estado_sunat: estadoFinal,
      });
      return;
    }

    // 4. Caso Rechazo Tributario Definitivo (Códigos 2000-3999)
    if (clasificacion === 'RECHAZADO_DEFINITIVO') {
      await cpe.update(
        {
          estado_sunat: 'RECHAZADO',
          sunat_estado: 'RECHAZADO',
          intentos_envio: intentoActual,
          proximo_reintento: null,
          codigo_sunat: String(respuesta.codigoSunat),
          ultimo_error_sunat: respuesta.mensajeSunat,
        },
        { skipTenant: true, skipTenantScope: true }
      );

      emitToTenantSucursal(cpe.empresa_id, cpe.sucursal_id, 'sunat:alerta_rechazo', {
        comprobante_id: cpe.id,
        comprobante: `${cpe.serie}-${cpe.correlativo}`,
        codigo: respuesta.codigoSunat,
        motivo: respuesta.mensajeSunat,
      });
      return;
    }

    // 5. Otros códigos temporales (0100-0199)
    await cpe.update(
      {
        estado_sunat: intentoActual >= MAX_INTENTOS ? 'ERROR_CRITICO' : 'CONTINGENCIA_REINTENTAR',
        intentos_envio: intentoActual,
        proximo_reintento: calcularProximoReintento(intentoActual),
        codigo_sunat: String(respuesta.codigoSunat || 'ERR'),
        ultimo_error_sunat: respuesta.mensajeSunat || 'Error temporal reportado por SUNAT',
      },
      { skipTenant: true, skipTenantScope: true }
    );
  } catch (err) {
    await cpe.update(
      {
        estado_sunat: intentoActual >= MAX_INTENTOS ? 'ERROR_CRITICO' : 'CONTINGENCIA_REINTENTAR',
        intentos_envio: intentoActual,
        proximo_reintento: calcularProximoReintento(intentoActual),
        ultimo_error_sunat: `Excepción interna Worker: ${err.message}`,
      },
      { skipTenant: true, skipTenantScope: true }
    );
  }
}

/**
 * Ejecuta un ciclo del barrido de contingencia
 */
export async function ejecutarCicloContingenciaSunat() {
  if (isRunningBatch) return;
  isRunningBatch = true;

  try {
    const lote = await reclamarLotePendiente();
    if (lote && lote.length > 0) {
      await Promise.allSettled(lote.map((cpe) => procesarComprobante(cpe)));
    }
  } catch (error) {
    console.error('[SUNAT_WORKER_ERROR]:', error.message);
  } finally {
    isRunningBatch = false;
  }
}

/**
 * Inicia el Demonio en background desde server/src/index.js
 */
export function startSunatContingencyWorker(intervalMs = 30000) {
  if (workerTimer) return;
  console.log(`[SUNAT_WORKER] Iniciado con intervalo de ${intervalMs / 1000}s`);
  workerTimer = setInterval(ejecutarCicloContingenciaSunat, intervalMs);
  workerTimer.unref();
}

export function stopSunatContingencyWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

export default {
  startSunatContingencyWorker,
  stopSunatContingencyWorker,
  ejecutarCicloContingenciaSunat,
};
