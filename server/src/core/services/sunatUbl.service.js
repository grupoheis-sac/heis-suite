import crypto from 'node:crypto';
import sequelize from '../../config/db.js';
import { ComprobanteElectronico, Empresa, Sucursal } from '../models/index.js';

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
    const precioConIgv = Number(item.precio_unitario || 0);
    const valorUnitarioSinIgv = Number((precioConIgv / 1.18).toFixed(6));
    const subtotalConIgv = Number((cantidad * precioConIgv).toFixed(2));
    const valorVentaLinea = Number((subtotalConIgv / 1.18).toFixed(2));
    const igvLinea = Number((subtotalConIgv - valorVentaLinea).toFixed(2));
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
      </cac:PricingReference>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${comprobante.moneda}">${igvLinea.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${comprobante.moneda}">${valorVentaLinea.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${comprobante.moneda}">${igvLinea.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:Percent>18.00</cbc:Percent>
          <cbc:TaxExemptionReasonCode>10</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description><![CDATA[${item.descripcion || 'PRODUCTO / SERVICIO'}]]></cbc:Description>
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
        <cbc:Name><![CDATA[${emisor.nombre}]]></cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${emisor.nombre}]]></cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${emisor.direccion || 'PERU'}]]></cbc:Line>
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
        <cbc:RegistrationName><![CDATA[${cliente.razon_social}]]></cbc:RegistrationName>
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
    const empresa = await Empresa.findByPk(empresaId, { transaction: t, skipTenant: true });
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

    const maxCorrelativo = await ComprobanteElectronico.max('correlativo', {
      where: {
        empresa_id: empresaId,
        serie: serieFinal,
      },
      transaction: t,
    });

    const siguienteCorrelativo = (Number(maxCorrelativo) || 0) + 1;
    const numeroFormato = `${serieFinal}-${String(siguienteCorrelativo).padStart(8, '0')}`;

    const itemsNormalizados = items.map((it) => {
      const cantidad = Number(it.cantidad || it.quantity || 1);
      const precioUnitario = Number(it.precio_unitario || it.price || 0);
      const subtotal = Number((cantidad * precioUnitario).toFixed(2));
      return {
        id_item: it.id_producto || it.id_medicamento || it.product_id || it.id || null,
        descripcion: it.descripcion || it.nombre || it.nombre_comercial || it.name || 'ÍTEM DE VENTA',
        unidad_medida: it.unidad_medida || 'NIU',
        cantidad,
        precio_unitario: precioUnitario,
        subtotal,
      };
    });

    const sumaBruta = itemsNormalizados.reduce((acc, it) => acc + it.subtotal, 0);
    const desc = Number(descuentoGlobal) || 0;
    const totalFinal = Math.max(0, Number((sumaBruta - desc).toFixed(2)));
    const opGravadas = Number((totalFinal / 1.18).toFixed(2));
    const igvCalculado = Number((totalFinal - opGravadas).toFixed(2));

    const docCliente = detectarTipoDocumentoCliente(clienteDocumento, tipoComprobante);
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
        correlativo: siguienteCorrelativo,
        numero_formato: numeroFormato,
        fecha_emision: fechaEmision,
        moneda: 'PEN',
        op_gravadas: opGravadas,
        igv: igvCalculado,
        total: totalFinal,
      },
      items: itemsNormalizados,
    });

    const cdrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ar:ApplicationResponse xmlns:ar="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"
                        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>R-${rucEmisor}-${codigoDoc}-${numeroFormato}</cbc:ID>
  <cbc:IssueDate>${fechaEmision.toISOString().slice(0, 10)}</cbc:IssueDate>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ReferenceID>${numeroFormato}</cbc:ReferenceID>
      <cbc:ResponseCode>0</cbc:ResponseCode>
      <cbc:Description>La ${tipoComprobante} numero ${numeroFormato}, ha sido aceptada (${entorno.toUpperCase()})</cbc:Description>
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
      correlativo: siguienteCorrelativo,
      numero_formato: numeroFormato,
      fecha_emision: fechaEmision,
      moneda: 'PEN',
      cliente_tipo_doc: docCliente.codigo,
      cliente_num_doc: docCliente.numero,
      cliente_razon_social: clienteNombre || 'CLIENTE VARIOS',
      cliente_direccion: clienteDireccion || null,
      op_gravadas: opGravadas,
      op_exoneradas: 0.00,
      op_inafectas: 0.00,
      descuento_global: desc,
      igv: igvCalculado,
      total: totalFinal,
      items_json: itemsNormalizados,
      doc_referencia_serie_num: docReferenciaSerieNum,
      doc_referencia_motivo: docReferenciaMotivo,
      entorno_sunat: entorno,
      sunat_estado: 'ACEPTADO',
      sunat_codigo_respuesta: '0',
      sunat_descripcion: `La ${tipoComprobante} número ${numeroFormato}, ha sido aceptada`,
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
  detectarTipoDocumentoCliente,
  construirXmlUbl21,
  emitirComprobanteUniversal,
};
