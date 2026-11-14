import crypto from 'node:crypto';
import sequelize from '../../config/db.js';
import { ComprobanteElectronico, Empresa, Sucursal } from '../models/index.js';
import cpeService from './sunat/cpeService.js';

const SUNAT_API_URL = process.env.SUNAT_API_URL || 'http://localhost:3080';
const SUNAT_API_KEY = process.env.SUNAT_API_KEY || 'heis_sunat_secret_key_2026';

/**
 * Escapa caracteres reservados XML para evitar inyecciones o problemas de formato
 */
export function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .trim();
}

/**
 * Redondeo seguro a N decimales evitando errores de punto flotante IEEE 754
 */
export function roundMoney(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(num) + Number.EPSILON) * factor) / factor;
}

/**
 * Valida reglas obligatorias de SUNAT antes de enviar al microservicio
 */
export function validarReglasSunat({ tipoComprobante, serie, cliente, total, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El comprobante debe contener al menos un ítem válido.');
  }

  // 1. Validación Factura (01)
  if (tipoComprobante === '01' || tipoComprobante === 'Factura') {
    if (!serie.startsWith('F')) {
      throw new Error('Las Facturas Electrónicas (01) deben utilizar una serie que inicie con la letra F.');
    }
    const ruc = String(cliente?.numero_documento || cliente?.num_doc || '').trim();
    const tipoDoc = String(cliente?.tipo_documento || cliente?.tipo_doc || '');
    if ((tipoDoc !== '6' && tipoDoc !== 'RUC') || !/^(10|15|17|20)\d{9}$/.test(ruc)) {
      throw new Error('Para emitir Factura Electrónica es obligatorio un RUC válido de 11 dígitos (Catálogo 06: código 6).');
    }
  }

  // 2. Validación Boleta de Venta (03) >= S/ 700.00
  if (tipoComprobante === '03' || tipoComprobante === 'Boleta') {
    if (!serie.startsWith('B')) {
      throw new Error('Las Boletas de Venta (03) deben utilizar una serie que inicie con la letra B.');
    }
    const docCliente = String(cliente?.numero_documento || cliente?.num_doc || '').trim();
    const tipoDoc = String(cliente?.tipo_documento || cliente?.tipo_doc || '');
    if (Number(total) >= 700 && (!docCliente || docCliente === '00000000' || tipoDoc === '0')) {
      throw new Error('Normativa SUNAT: Toda Boleta de Venta igual o mayor a S/ 700.00 requiere identificar el DNI/CE del cliente.');
    }
  }
}

/**
 * Calcula los subtotales de línea y totales del documento bajo estándar UBL 2.1 Perú
 * @param {Array} items - Lista de productos con { cantidad, precio_unitario, tipo_afectacion_igv ('10'=Gravado, '20'=Exonerado, '30'=Inafecto) }
 * @param {Number} igvPorcentaje - Por defecto 18 (18%)
 */
export function calcularTotalesUbl(items, igvPorcentaje = 18) {
  const tasa = igvPorcentaje / 100;
  let opGravadas = 0;
  let opExoneradas = 0;
  let opInafectas = 0;
  let totalIgv = 0;

  const itemsCalculados = items.map((item, idx) => {
    const cantidad = Number(item.cantidad || item.quantity || 1);
    const precioConIgv = Number(item.precio_unitario || item.precio_venta || item.price || 0);
    const afectacion = String(item.tipo_afectacion_igv || '10'); // Catálogo 07 SUNAT

    let valorUnitarioSinIgv = precioConIgv;
    let igvLinea = 0;
    let valorVentaLinea = 0;
    const totalLinea = roundMoney(cantidad * precioConIgv, 2);

    if (afectacion === '10') {
      // Operación Gravada - Onerosa
      valorUnitarioSinIgv = roundMoney(precioConIgv / (1 + tasa), 6);
      valorVentaLinea = roundMoney(totalLinea / (1 + tasa), 2);
      igvLinea = roundMoney(totalLinea - valorVentaLinea, 2);
      opGravadas = roundMoney(opGravadas + valorVentaLinea, 2);
      totalIgv = roundMoney(totalIgv + igvLinea, 2);
    } else if (afectacion === '20') {
      // Operación Exonerada
      valorUnitarioSinIgv = roundMoney(precioConIgv, 6);
      valorVentaLinea = totalLinea;
      opExoneradas = roundMoney(opExoneradas + valorVentaLinea, 2);
    } else {
      // Operación Inafecta ('30')
      valorUnitarioSinIgv = roundMoney(precioConIgv, 6);
      valorVentaLinea = totalLinea;
      opInafectas = roundMoney(opInafectas + valorVentaLinea, 2);
    }

    return {
      ...item,
      numero_orden: idx + 1,
      descripcion_sanitizada: escapeXml(item.descripcion || item.nombre || item.name || 'ÍTEM'),
      codigo_producto: escapeXml(item.codigo || `ITEM-${idx + 1}`),
      unidad_medida: item.unidad_medida || 'NIU',
      tipo_afectacion_igv: afectacion,
      valor_unitario: valorUnitarioSinIgv,
      precio_referencia: roundMoney(precioConIgv, 2),
      valor_venta_linea: valorVentaLinea,
      igv_linea: igvLinea,
      total_linea: totalLinea,
      cantidad,
      precio_unitario: precioConIgv,
      subtotal: totalLinea,
    };
  });

  const importeTotal = roundMoney(opGravadas + opExoneradas + opInafectas + totalIgv, 2);

  return {
    items: itemsCalculados,
    opGravadas,
    opExoneradas,
    opInafectas,
    totalIgv,
    importeTotal,
  };
}

/**
 * Obtiene el siguiente correlativo serializado con bloqueo de fila pesimista
 */
export async function obtenerSiguienteCorrelativo({ empresaId, sucursalId, tipoComprobante, serie }, transaction) {
  const where = {
    empresa_id: empresaId,
    serie,
  };
  if (tipoComprobante) {
    where.tipo_comprobante = tipoComprobante;
  }

  const ultimo = await ComprobanteElectronico.findOne({
    where,
    order: [['correlativo', 'DESC']],
    lock: transaction?.LOCK?.UPDATE,
    transaction,
  });

  const siguienteNumero = ultimo ? Number(ultimo.correlativo) + 1 : 1;
  return {
    correlativo: siguienteNumero,
    correlativoFormateado: String(siguienteNumero).padStart(8, '0'),
    numeracionCompleta: `${serie}-${String(siguienteNumero).padStart(8, '0')}`,
  };
}

export function detectarTipoDocumentoCliente(documento, tipoComprobante) {
  const limpio = String(documento || '').trim();
  if (tipoComprobante === 'Factura' || limpio.length === 11) {
    return { codigo: '6', texto: 'RUC', numero: limpio || '20000000001' };
  }
  if (limpio.length === 8) {
    return { codigo: '1', texto: 'DNI', numero: limpio };
  }
  if (limpio.length > 8) {
    return { codigo: '4', texto: 'CE', numero: limpio };
  }
  return { codigo: '0', texto: '-', numero: '00000000' };
}

/**
 * Envía el comprobante electrónico al microservicio local api-sunat-cpe (Puerto 3080)
 */
async function emitirEnMicroservicioSunat(payload) {
  const res = await fetch(`${SUNAT_API_URL}/api/v1/cpe/emitir`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SUNAT_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.error || `Error HTTP ${res.status} desde el microservicio SUNAT CPE`;
    throw new Error(errorMsg);
  }
  return data;
}

export async function emitirComprobanteUniversal({
  empresaId,
  sucursalId = null,
  usuarioId = null,
  origenModulo = 'general',
  origenId = null,
  tipoComprobante = 'Boleta',
  seriePreferida = null,
  clienteDocumento = '00000000',
  clienteNombre = 'CLIENTE VARIOS',
  clienteDireccion = '',
  descuentoGlobal = 0,
  items = [],
  docReferenciaSerieNum = null,
  docReferenciaMotivo = null,
  transaction = null,
}) {
  const ownTransaction = !transaction;
  const t = transaction || (await sequelize.transaction());

  try {
    const empresa = await Empresa.findByPk(empresaId, {
      transaction: t,
      skipTenant: true,
    });
    if (!empresa) {
      throw new Error('Empresa emisora no encontrada');
    }

    let sucursal = null;
    if (sucursalId) {
      sucursal = await Sucursal.findByPk(sucursalId, { transaction: t });
    }

    const rucEmisor = empresa.ruc && empresa.ruc.trim().length === 11 ? empresa.ruc.trim() : '20608945123';
    const entorno = empresa.entorno_sunat || 'beta';

    let codigoDoc = '03';
    let prefijoSerie = 'B001';
    let tipoCpeMicroservicio = 'Boleta';

    if (tipoComprobante === 'Factura') {
      codigoDoc = '01';
      prefijoSerie = 'F001';
      tipoCpeMicroservicio = 'Factura';
    } else if (tipoComprobante === 'NotaCredito') {
      codigoDoc = '07';
      prefijoSerie = docReferenciaSerieNum?.startsWith('F') ? 'FC01' : 'BC01';
      tipoCpeMicroservicio = 'Nota de Crédito';
    } else if (tipoComprobante === 'NotaDebito') {
      codigoDoc = '08';
      prefijoSerie = docReferenciaSerieNum?.startsWith('F') ? 'FD01' : 'BD01';
      tipoCpeMicroservicio = 'Nota de Débito';
    }

    const serieFinal = (seriePreferida || prefijoSerie).toUpperCase();

    // Cálculo y normalización UBL de totales
    const calculoUbl = calcularTotalesUbl(items);
    const desc = roundMoney(Number(descuentoGlobal) || 0, 2);
    const totalFinal = Math.max(0, roundMoney(calculoUbl.importeTotal - desc, 2));

    const docCliente = detectarTipoDocumentoCliente(clienteDocumento, tipoComprobante);

    // Validación de reglas tributarias obligatorias SUNAT
    validarReglasSunat({
      tipoComprobante: codigoDoc,
      serie: serieFinal,
      cliente: {
        tipo_documento: docCliente.codigo,
        numero_documento: docCliente.numero,
      },
      total: totalFinal,
      items: calculoUbl.items,
    });

    // Obtener siguiente correlativo serializado con bloqueo de fila pesimista
    const { correlativo, correlativoFormateado, numeracionCompleta } =
      await obtenerSiguienteCorrelativo(
        {
          empresaId,
          sucursalId,
          tipoComprobante,
          serie: serieFinal,
        },
        t
      );

    const fechaEmision = new Date();
    const fechaEmisionIso = fechaEmision.toISOString().split('T')[0];
    const horaEmisionIso = fechaEmision.toTimeString().split(' ')[0];

    // Payload para el microservicio api-sunat-cpe
    const payloadSunat = {
      tipoComprobante: tipoCpeMicroservicio,
      serie: serieFinal,
      correlativo: correlativo,
      fechaEmision: fechaEmisionIso,
      horaEmision: horaEmisionIso,
      formaPago: 'Contado',
      emisor: {
        ruc: rucEmisor,
        razonSocial: empresa.nombre || 'EMPRESA HEIS S.A.C.',
        nombreComercial: empresa.nombre || 'EMPRESA HEIS',
        direccion: sucursal?.direccion || empresa.direccion || 'LIMA - PERU',
        ubigeo: '150101',
        departamento: 'LIMA',
        provincia: 'LIMA',
        distrito: 'LIMA',
      },
      cliente: {
        tipoDocumento: docCliente.texto,
        numeroDocumento: docCliente.numero,
        razonSocial: clienteNombre || 'CLIENTE VARIOS',
        direccion: clienteDireccion || '',
      },
      items: calculoUbl.items.map((it) => ({
        codigo: it.codigo_producto,
        descripcion: it.descripcion_sanitizada || it.descripcion,
        unidadMedida: it.unidad_medida || 'NIU',
        cantidad: it.cantidad,
        precioUnitario: it.precio_unitario,
        valorUnitario: it.valor_unitario,
        subtotal: it.valor_venta_linea,
        igv: it.igv_linea,
        total: it.total_linea,
      })),
      totales: {
        gravado: calculoUbl.opGravadas,
        exonerado: calculoUbl.opExoneradas,
        inafecto: calculoUbl.opInafectas,
        igv: calculoUbl.totalIgv,
        total: totalFinal,
      },
      enviarASunat: true,
      entorno: entorno,
    };

    if (tipoComprobante === 'NotaCredito' && docReferenciaSerieNum) {
      const partesRef = String(docReferenciaSerieNum).split('-');
      payloadSunat.documentoModificado = {
        tipoDocumento: docReferenciaSerieNum.startsWith('F') ? '01' : '03',
        serie: partesRef[0] || 'B001',
        correlativo: partesRef[1] || '00000001',
        motivo: docReferenciaMotivo || 'Anulación de la operación',
        codigoMotivo: '01',
      };
    }

    let sunatEstado = 'ACEPTADO';
    let sunatCodigoRespuesta = '0';
    let sunatDescripcion = `La ${tipoComprobante} número ${numeracionCompleta}, ha sido emitida`;
    let sunatHash = null;
    let sunatQr = null;
    let xmlFirmado = null;
    let cdrRespuesta = null;

    try {
      // Emisión nativa integrada en memoria (CPE UBL 2.1 + Firma XAdES-BES + SOAP SUNAT)
      const resSunat = await cpeService.emitirComprobante(payloadSunat);
      if (resSunat) {
        sunatEstado = resSunat.sunat_estado === 'Aceptado' ? 'ACEPTADO' : (resSunat.sunat_estado?.toUpperCase() || (resSunat.success ? 'ACEPTADO' : 'OBSERVADO'));
        sunatCodigoRespuesta = String(resSunat.sunat_codigo_respuesta || '0');
        sunatDescripcion = resSunat.sunat_cdr || `Emitido ante SUNAT (${sunatEstado})`;
        sunatHash = resSunat.sunat_hash || null;
        sunatQr = resSunat.sunat_qr || null;
        xmlFirmado = resSunat.archivos?.xml_contenido || null;
        cdrRespuesta = resSunat.archivos?.cdr_zip_base64 || null;
      }
    } catch (apiErr) {
      console.warn(`[SUNAT] Advertencia en emisión SUNAT: ${apiErr.message}`);
      // Contingencia: si SUNAT está fuera de servicio o error temporal, queda en PENDIENTE
      sunatEstado = 'PENDIENTE';
      sunatDescripcion = `Pendiente de sincronización SUNAT: ${apiErr.message}`;
    }

    const registro = await ComprobanteElectronico.create({
      empresa_id: empresaId,
      sucursal_id: sucursalId,
      id_usuario: usuarioId,
      origen_modulo: origenModulo,
      origen_id: origenId,
      tipo_documento_codigo: codigoDoc,
      tipo_comprobante: tipoComprobante,
      serie: serieFinal,
      correlativo,
      numero_formato: numeracionCompleta,
      fecha_emision: fechaEmision,
      moneda: 'PEN',
      cliente_tipo_doc: docCliente.codigo,
      cliente_num_doc: docCliente.numero,
      cliente_razon_social: clienteNombre || 'CLIENTE VARIOS',
      cliente_direccion: clienteDireccion || null,
      op_gravadas: calculoUbl.opGravadas,
      op_exoneradas: calculoUbl.opExoneradas,
      op_inafectas: calculoUbl.opInafectas,
      descuento_global: desc,
      igv: calculoUbl.totalIgv,
      total: totalFinal,
      items_json: calculoUbl.items,
      doc_referencia_serie_num: docReferenciaSerieNum,
      doc_referencia_motivo: docReferenciaMotivo,
      entorno_sunat: entorno,
      sunat_estado: sunatEstado,
      sunat_codigo_respuesta: sunatCodigoRespuesta,
      sunat_descripcion: sunatDescripcion,
      sunat_hash: sunatHash,
      sunat_qr: sunatQr,
      xml_firmado: xmlFirmado,
      cdr_respuesta: cdrRespuesta,
    }, { transaction: t });

    if (ownTransaction) {
      await t.commit();
    }

    return registro;
  } catch (error) {
    if (ownTransaction) {
      await t.rollback();
    }
    throw error;
  }
}

export default {
  escapeXml,
  roundMoney,
  validarReglasSunat,
  calcularTotalesUbl,
  obtenerSiguienteCorrelativo,
  detectarTipoDocumentoCliente,
  emitirComprobanteUniversal,
};
