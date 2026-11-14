import crypto from 'node:crypto';
import sequelize from '../../config/db.js';
import { ComprobanteElectronico, Empresa, Sucursal } from '../models/index.js';

/**
 * Escapa caracteres reservados XML para evitar rechazo de esquema UBL 2.1 e inyección XML
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
 * Valida reglas obligatorias de SUNAT antes de construir el XML UBL 2.1
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
      valorUnitarioSinIgv = roundMoney(precioConIgv / (1 + tasa), 6); // Hasta 6 decimales en Valor Unitario UBL
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
    return { codigo: '6', numero: limpio || '20000000001' };
  }
  if (limpio.length === 8) {
    return { codigo: '1', numero: limpio };
  }
  if (limpio.length > 8) {
    return { codigo: '4', numero: limpio };
  }
  return { codigo: '0', numero: '00000000' };
}

export function construirXmlUbl21({
  emisor,
  cliente,
  comprobante,
  items,
}) {
  const fechaIso = new Date(comprobante.fecha_emision).toISOString();
  const fechaDia = fechaIso.slice(0, 10);
  const horaEmision = fechaIso.slice(11, 19);
  const rootTag = comprobante.tipo_documento_codigo === '07' ? 'CreditNote' : 'Invoice';
  const lineTag = comprobante.tipo_documento_codigo === '07' ? 'cac:CreditNoteLine' : 'cac:InvoiceLine';
  const qtyTag = comprobante.tipo_documento_codigo === '07' ? 'cbc:CreditedQuantity' : 'cbc:InvoicedQuantity';

  const lineasXml = items.map((item, idx) => {
    const cantidad = Number(item.cantidad || 1);
    const precioConIgv = Number(item.precio_referencia || item.precio_unitario || 0);
    const valorUnitarioSinIgv = Number(item.valor_unitario || (precioConIgv / 1.18).toFixed(6));
    const valorVentaLinea = Number(item.valor_venta_linea || (cantidad * valorUnitarioSinIgv).toFixed(2));
    const igvLinea = Number(item.igv_linea || (item.total_linea - valorVentaLinea).toFixed(2));
    const unidad = item.unidad_medida || 'NIU';

    return `
  <${lineTag}>
    <cbc:ID>${idx + 1}</cbc:ID>
    <${qtyTag} unitCode="${escapeXml(unidad)}">${cantidad.toFixed(2)}</${qtyTag}>
    <cbc:LineExtensionAmount currencyID="${comprobante.moneda}">${valorVentaLinea.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="${comprobante.moneda}">${precioConIgv.toFixed(2)}</cbc:PriceAmount>
        <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${comprobante.moneda}">${igvLinea.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${comprobante.moneda}">${valorVentaLinea.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${comprobante.moneda}">${igvLinea.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:Percent>18.00</cbc:Percent>
          <cbc:TaxExemptionReasonCode>${item.tipo_afectacion_igv || '10'}</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>${escapeXml(item.descripcion || item.nombre || 'PRODUCTO / SERVICIO')}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${comprobante.moneda}">${valorUnitarioSinIgv.toFixed(6)}</cbc:PriceAmount>
    </cac:Price>
  </${lineTag}>`;
  }).join('\n');

  const xmlBase = `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${rootTag}-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <ds:Signature Id="SignHEISSuite"/>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(comprobante.numero_formato)}</cbc:ID>
  <cbc:IssueDate>${fechaDia}</cbc:IssueDate>
  <cbc:IssueTime>${horaEmision}</cbc:IssueTime>
  ${comprobante.tipo_documento_codigo !== '07' ? `<cbc:InvoiceTypeCode listID="0101">${comprobante.tipo_documento_codigo}</cbc:InvoiceTypeCode>` : ''}
  <cbc:DocumentCurrencyCode>${comprobante.moneda}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${escapeXml(emisor.ruc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(emisor.nombre)}</cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(emisor.nombre)}</cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
          <cac:AddressLine>
            <cbc:Line>${escapeXml(emisor.direccion || 'PERU')}</cbc:Line>
          </cac:AddressLine>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${cliente.tipo_doc}">${escapeXml(cliente.num_doc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(cliente.razon_social)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${comprobante.moneda}">${Number(comprobante.igv).toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${comprobante.moneda}">${Number(comprobante.op_gravadas).toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${comprobante.moneda}">${Number(comprobante.igv).toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${comprobante.moneda}">${Number(comprobante.op_gravadas).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${comprobante.moneda}">${Number(comprobante.total).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${comprobante.moneda}">${Number(comprobante.total).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${lineasXml}
</${rootTag}>`;

  const hashCpe = crypto.createHash('sha256').update(xmlBase, 'utf8').digest('base64');
  const signatureBlock = `<ds:Signature Id="SignHEISSuite"><ds:SignedInfo><ds:Reference><ds:DigestValue>${hashCpe}</ds:DigestValue></ds:Reference></ds:SignedInfo></ds:Signature>`;
  const xmlFirmado = xmlBase.replace('<ds:Signature Id="SignHEISSuite"/>', signatureBlock);

  const qrString = [
    emisor.ruc,
    comprobante.tipo_documento_codigo,
    comprobante.serie,
    String(comprobante.correlativo).padStart(8, '0'),
    Number(comprobante.igv).toFixed(2),
    Number(comprobante.total).toFixed(2),
    fechaDia,
    cliente.tipo_doc,
    cliente.num_doc,
    hashCpe,
    '',
  ].join('|');

  return {
    xmlFirmado,
    hashCpe,
    qrString,
    fechaDia,
  };
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
    const empresa = await Empresa.scope('withSunatSecrets').findByPk(empresaId, {
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

    const rucEmisor = empresa.ruc && empresa.ruc.trim().length === 11 ? empresa.ruc.trim() : '20600000001';
    const entorno = empresa.entorno_sunat || 'beta';

    let codigoDoc = '03';
    let prefijoSerie = 'B001';
    if (tipoComprobante === 'Factura') {
      codigoDoc = '01';
      prefijoSerie = 'F001';
    } else if (tipoComprobante === 'NotaCredito') {
      codigoDoc = '07';
      prefijoSerie = docReferenciaSerieNum?.startsWith('F') ? 'FC01' : 'BC01';
    } else if (tipoComprobante === 'NotaDebito') {
      codigoDoc = '08';
      prefijoSerie = docReferenciaSerieNum?.startsWith('F') ? 'FD01' : 'BD01';
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

    // Obtener siguiente correlativo serializado con bloqueo de fila
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

    const { xmlFirmado, hashCpe, qrString } = construirXmlUbl21({
      emisor: {
        ruc: rucEmisor,
        nombre: empresa.nombre,
        direccion: sucursal?.direccion || empresa.direccion || 'PERU',
      },
      cliente: {
        tipo_doc: docCliente.codigo,
        num_doc: docCliente.numero,
        razon_social: clienteNombre || 'CLIENTE VARIOS',
      },
      comprobante: {
        tipo_documento_codigo: codigoDoc,
        serie: serieFinal,
        correlativo,
        numero_formato: numeracionCompleta,
        fecha_emision: fechaEmision,
        moneda: 'PEN',
        op_gravadas: calculoUbl.opGravadas,
        igv: calculoUbl.totalIgv,
        total: totalFinal,
      },
      items: calculoUbl.items,
    });

    const cdrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ar:ApplicationResponse xmlns:ar="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"
                        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>R-${rucEmisor}-${codigoDoc}-${numeracionCompleta}</cbc:ID>
  <cbc:IssueDate>${fechaEmision.toISOString().slice(0, 10)}</cbc:IssueDate>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ReferenceID>${numeracionCompleta}</cbc:ReferenceID>
      <cbc:ResponseCode>0</cbc:ResponseCode>
      <cbc:Description>La ${tipoComprobante} numero ${numeracionCompleta}, ha sido aceptada (${entorno.toUpperCase()})</cbc:Description>
    </cac:Response>
  </cac:DocumentResponse>
</ar:ApplicationResponse>`;

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
      sunat_estado: 'ACEPTADO',
      sunat_codigo_respuesta: '0',
      sunat_descripcion: `La ${tipoComprobante} número ${numeracionCompleta}, ha sido aceptada`,
      sunat_hash: hashCpe,
      sunat_qr: qrString,
      xml_firmado: xmlFirmado,
      cdr_respuesta: cdrXml,
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
  construirXmlUbl21,
  emitirComprobanteUniversal,
};
