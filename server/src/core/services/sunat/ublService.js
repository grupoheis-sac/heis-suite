import { createRequire } from 'module';
import handlebars from 'handlebars';
import { numeroALetras } from './numeroALetras.js';

const require = createRequire(import.meta.url);
const { invoiceTemplate } = require('nodefact/dist/xml/templates/invoice.xml');
const { creditNoteTemplate } = require('nodefact/dist/xml/templates/creditnote.xml');
const { debitNoteTemplate } = require('nodefact/dist/xml/templates/debitnote.xml');

// Registrar helpers útiles para Handlebars
handlebars.registerHelper('addOne', function(value) {
  return parseInt(value) + 1;
});

// SUNAT exige que el número de orden de ítem comience en 1 (1-based). Corregir {{@index}} por {{id}}
// y corregir cbc:DiscrepancyResponse a cac:DiscrepancyResponse (exigencia estricta UBL 2.1)
const fixedInvoiceTemplate = invoiceTemplate.replace('<cbc:ID>{{@index}}</cbc:ID>', '<cbc:ID>{{id}}</cbc:ID>');

const fixedCreditNoteTemplate = creditNoteTemplate
  .replace('<cbc:ID>{{@index}}</cbc:ID>', '<cbc:ID>{{id}}</cbc:ID>')
  .replace(/<cbc:DiscrepancyResponse>/g, '<cac:DiscrepancyResponse>')
  .replace(/<\/cbc:DiscrepancyResponse>/g, '</cac:DiscrepancyResponse>')
  .replace('<cbc:IssueDate>{{documentoReferencia.fechaEmision}}</cbc:IssueDate>', '');

const fixedDebitNoteTemplate = debitNoteTemplate
  .replace('<cbc:ID>{{@index}}</cbc:ID>', '<cbc:ID>{{id}}</cbc:ID>')
  .replace(/<cbc:DiscrepancyResponse>/g, '<cac:DiscrepancyResponse>')
  .replace(/<\/cbc:DiscrepancyResponse>/g, '</cac:DiscrepancyResponse>')
  .replace('<cbc:IssueDate>{{documentoReferencia.fechaEmision}}</cbc:IssueDate>', '')
  .replace(/<cac:LegalMonetaryTotal>/g, '<cac:RequestedMonetaryTotal>')
  .replace(/<\/cac:LegalMonetaryTotal>/g, '</cac:RequestedMonetaryTotal>');

const compilarFacturaBase = handlebars.compile(fixedInvoiceTemplate);
const compilarNotaCreditoBase = handlebars.compile(fixedCreditNoteTemplate);
const compilarNotaDebitoBase = handlebars.compile(fixedDebitNoteTemplate);

/**
 * 🇵🇪 Servicio Oficial de Construcción de Documentos UBL 2.1
 * Soporta:
 * - Factura Electrónica (01)
 * - Boleta de Venta Electrónica (03)
 * - Nota de Crédito Electrónica (07)
 * - Nota de Débito Electrónica (08)
 * Con Leyenda 1000 (Monto en letras) y Forma de Pago (RS 193-2020 SUNAT)
 */
export class UblService {
  /**
   * Transforma el payload de venta estándar en el modelo de datos UBL 2.1 y compila el XML
   */
  construirXmlComprobante({
    tipoComprobante, // 'Boleta' | 'Factura' | 'Nota de Crédito' | 'Nota de Débito' | '01' | '03' | '07' | '08'
    serie,
    correlativo,
    fechaEmision,
    horaEmision,
    emisor,
    cliente,
    items,
    totales,
    formaPago = 'Contado', // 'Contado' | 'Credito'
    cuotas = [],           // [ { cuota: 'Cuota001', monto: 50.00, fechaVencimiento: '2026-11-06' } ]
    documentoModificado = null, // { tipoDocumento: '01'|'03', serie: 'F001', correlativo: '00000001', motivo: '...', codigoMotivo: '01' }
    tipoNota = '01',       // Código según catálogo 09 (NC) o catálogo 10 (ND)
    motivo = 'Anulación de la operación'
  }) {
    const esFactura = tipoComprobante === 'Factura' || tipoComprobante === '01';
    const esNotaCredito = tipoComprobante === 'Nota de Crédito' || tipoComprobante === '07';
    const esNotaDebito = tipoComprobante === 'Nota de Débito' || tipoComprobante === '08';
    const esBoleta = tipoComprobante === 'Boleta' || tipoComprobante === '03' || (!esFactura && !esNotaCredito && !esNotaDebito);

    let tipoCodigo = '03';
    if (esFactura) tipoCodigo = '01';
    else if (esNotaCredito) tipoCodigo = '07';
    else if (esNotaDebito) tipoCodigo = '08';

    const correlativoStr = String(correlativo).padStart(8, '0');
    const fechaStr = fechaEmision || new Date().toISOString().split('T')[0];
    const ahora = new Date();
    const horaStr = horaEmision || ahora.toTimeString().split(' ')[0];

    // 1. Mapeo del Emisor
    const datosEmisor = {
      ruc: emisor.ruc,
      razonSocial: emisor.razonSocial || emisor.nombreComercial || 'BOTICA HEIS & SALUD S.A.C.',
      nombreComercial: emisor.nombreComercial || emisor.razonSocial || 'BOTICA HEIS',
      direccion: {
        direccion: emisor.direccion || 'Dirección Principal',
        ubigeo: emisor.ubigeo || '150101',
        departamento: emisor.departamento || 'LIMA',
        provincia: emisor.provincia || 'LIMA',
        distrito: emisor.distrito || 'LIMA'
      },
      codigoEstablecimiento: emisor.codigoEstablecimiento || '0000'
    };

    // 2. Mapeo del Receptor
    let tipoDocCliente = '1'; // Default DNI
    if (cliente?.tipoDocumento === 'RUC' || cliente?.tipo_documento === 'RUC' || (cliente?.numeroDocumento && String(cliente.numeroDocumento).length === 11)) {
      tipoDocCliente = '6';
    } else if (cliente?.tipoDocumento === 'DNI' || cliente?.tipo_documento === 'DNI' || (cliente?.numeroDocumento && String(cliente.numeroDocumento).length === 8)) {
      tipoDocCliente = '1';
    } else if (!cliente?.numeroDocumento || cliente.numeroDocumento === '00000000') {
      tipoDocCliente = '-';
    }

    const datosReceptor = {
      tipoDocumento: tipoDocCliente,
      numeroDocumento: cliente?.numeroDocumento || cliente?.numero_documento || '00000000',
      razonSocial: cliente?.razonSocial || cliente?.nombre || 'CLIENTE GENERAL',
      direccion: {
        direccion: cliente?.direccion || '-'
      }
    };

    // 3. Mapeo de Items
    const itemsUbl = items.map((item, index) => {
      const cantidad = parseFloat(item.cantidad || 1);
      const precioUnitario = parseFloat(item.precioUnitario || item.precio_unitario || 0);

      const valorUnitario = item.valorUnitario !== undefined
        ? parseFloat(item.valorUnitario)
        : parseFloat((precioUnitario / 1.18).toFixed(4));

      const subtotal = parseFloat((valorUnitario * cantidad).toFixed(2));
      const total = parseFloat((precioUnitario * cantidad).toFixed(2));
      const igv = parseFloat((total - subtotal).toFixed(2));

      return {
        id: index + 1,
        codigo: item.codigo || item.codigo_interno || `ITEM-${index + 1}`,
        descripcion: item.descripcion || item.nombre_medicamento || 'PRODUCTO O SERVICIO',
        unidadMedida: item.unidadMedida || (item.formato === 'Fraccion' ? 'NIU' : 'BX'),
        cantidad: cantidad.toFixed(2),
        valorUnitario: valorUnitario.toFixed(4),
        precioUnitario: precioUnitario.toFixed(2),
        tipoIGV: '10', // Gravado - Operación Onerosa
        porcentajeIGV: '18.00',
        igv: igv.toFixed(2),
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2)
      };
    });

    // 4. Totales
    const totalGravado = totales?.gravado !== undefined
      ? parseFloat(totales.gravado)
      : itemsUbl.reduce((acc, i) => acc + parseFloat(i.subtotal), 0);

    const totalIgv = totales?.igv !== undefined
      ? parseFloat(totales.igv)
      : itemsUbl.reduce((acc, i) => acc + parseFloat(i.igv), 0);

    const totalPagar = totales?.total !== undefined
      ? parseFloat(totales.total)
      : itemsUbl.reduce((acc, i) => acc + parseFloat(i.total), 0);

    const montoEnLetras = numeroALetras(totalPagar, 'SOLES');

    const dataContext = {
      serie,
      correlativo: correlativoStr,
      fechaEmision: fechaStr,
      horaEmision: horaStr,
      tipoDocumento: tipoCodigo,
      moneda: 'PEN',
      signatureID: `Sign${serie}${correlativoStr}`,
      signatureURI: `#Sign${serie}${correlativoStr}`,
      emisor: datosEmisor,
      receptor: datosReceptor,
      totalValorVenta: totalGravado.toFixed(2),
      totalPrecioVenta: totalPagar.toFixed(2),
      impuestos: {
        total: totalIgv.toFixed(2),
        igv: totalIgv.toFixed(2)
      },
      items: itemsUbl
    };

    // Mapeo específico para Nota de Crédito o Nota de Débito
    if ((esNotaCredito || esNotaDebito) && documentoModificado) {
      const docRefTipo = documentoModificado.tipoDocumento === 'Factura' || documentoModificado.tipoDocumento === '01' ? '01' : '03';
      const docRefSerie = documentoModificado.serie || 'B001';
      const docRefCorrelativo = String(documentoModificado.correlativo || 1).padStart(8, '0');
      const codMotivo = documentoModificado.codigoMotivo || tipoNota || '01';
      const descMotivo = documentoModificado.motivo || motivo || (esNotaCredito ? 'Anulación de la operación' : 'Aumento en el valor');

      dataContext.documentoModificado = {
        tipoDocumento: docRefTipo,
        serie: docRefSerie,
        correlativo: docRefCorrelativo,
        motivo: descMotivo,
        codigoMotivo: codMotivo
      };

      dataContext.documentoReferencia = {
        tipoDocumento: docRefTipo,
        serie: docRefSerie,
        correlativo: docRefCorrelativo,
        fechaEmision: documentoModificado.fechaEmision || fechaStr
      };

      dataContext.tipoNota = codMotivo;
      dataContext.motivo = descMotivo;
    }

    // 5. Compilar base XML
    let xmlGenerado = '';
    if (esNotaDebito) {
      xmlGenerado = compilarNotaDebitoBase(dataContext);
    } else if (esNotaCredito) {
      xmlGenerado = compilarNotaCreditoBase(dataContext);
    } else {
      xmlGenerado = compilarFacturaBase(dataContext);
    }

    // 6. Inyección de Leyenda 1000 (Monto en Letras) y Forma de Pago (RS 193-2020)
    xmlGenerado = this.inyectarLeyendaYFormaPago({
      xml: xmlGenerado,
      tipoCodigo,
      montoEnLetras,
      formaPago,
      cuotas,
      totalPagar,
      moneda: 'PEN',
      fechaEmision: fechaStr
    });

    return {
      xml: xmlGenerado,
      modelo: dataContext,
      tipoCodigo,
      montoEnLetras
    };
  }

  /**
   * Inyecta de forma estricta los bloques UBL 2.1 exigidos por SUNAT:
   * 1. Leyenda 1000 (<cbc:Note languageLocaleID="1000">)
   * 2. Forma de Pago (<cac:PaymentTerms>) según RS 193-2020
   */
  inyectarLeyendaYFormaPago({ xml, tipoCodigo, montoEnLetras, formaPago, cuotas, totalPagar, moneda = 'PEN', fechaEmision }) {
    let xmlModificado = xml;

    // 1. Inyectar <cbc:Note languageLocaleID="1000"> si no está presente
    if (!xmlModificado.includes('languageLocaleID="1000"')) {
      const tagNote = `    <cbc:Note languageLocaleID="1000"><![CDATA[${montoEnLetras}]]></cbc:Note>\n`;
      if (xmlModificado.includes('<cbc:DocumentCurrencyCode')) {
        xmlModificado = xmlModificado.replace('<cbc:DocumentCurrencyCode', `${tagNote}    <cbc:DocumentCurrencyCode`);
      }
    }

    // 2. Inyectar <cac:PaymentTerms> para Facturas (01) y Boletas (03)
    if ((tipoCodigo === '01' || tipoCodigo === '03') && !xmlModificado.includes('<cac:PaymentTerms>')) {
      let paymentTermsXml = '';

      const esCredito = formaPago.toLowerCase() === 'credito';
      if (esCredito) {
        paymentTermsXml += `    <cac:PaymentTerms>\n`;
        paymentTermsXml += `        <cbc:ID>FormaPago</cbc:ID>\n`;
        paymentTermsXml += `        <cbc:PaymentMeansID>Credito</cbc:PaymentMeansID>\n`;
        paymentTermsXml += `        <cbc:Amount currencyID="${moneda}">${parseFloat(totalPagar).toFixed(2)}</cbc:Amount>\n`;
        paymentTermsXml += `    </cac:PaymentTerms>\n`;

        if (Array.isArray(cuotas) && cuotas.length > 0) {
          cuotas.forEach((cuota, idx) => {
            const numCuota = String(idx + 1).padStart(3, '0');
            const montoCuota = parseFloat(cuota.monto || (totalPagar / cuotas.length)).toFixed(2);
            const vencCuota = cuota.fechaVencimiento || fechaEmision;

            paymentTermsXml += `    <cac:PaymentTerms>\n`;
            paymentTermsXml += `        <cbc:ID>FormaPago</cbc:ID>\n`;
            paymentTermsXml += `        <cbc:PaymentMeansID>Cuota${numCuota}</cbc:PaymentMeansID>\n`;
            paymentTermsXml += `        <cbc:Amount currencyID="${moneda}">${montoCuota}</cbc:Amount>\n`;
            paymentTermsXml += `        <cbc:PaymentDueDate>${vencCuota}</cbc:PaymentDueDate>\n`;
            paymentTermsXml += `    </cac:PaymentTerms>\n`;
          });
        } else {
          // Cuota única por defecto a 30 días
          const fechaVenc = new Date();
          fechaVenc.setDate(fechaVenc.getDate() + 30);
          const fechaVencStr = fechaVenc.toISOString().split('T')[0];

          paymentTermsXml += `    <cac:PaymentTerms>\n`;
          paymentTermsXml += `        <cbc:ID>FormaPago</cbc:ID>\n`;
          paymentTermsXml += `        <cbc:PaymentMeansID>Cuota001</cbc:PaymentMeansID>\n`;
          paymentTermsXml += `        <cbc:Amount currencyID="${moneda}">${parseFloat(totalPagar).toFixed(2)}</cbc:Amount>\n`;
          paymentTermsXml += `        <cbc:PaymentDueDate>${fechaVencStr}</cbc:PaymentDueDate>\n`;
          paymentTermsXml += `    </cac:PaymentTerms>\n`;
        }
      } else {
        // Contado
        paymentTermsXml += `    <cac:PaymentTerms>\n`;
        paymentTermsXml += `        <cbc:ID>FormaPago</cbc:ID>\n`;
        paymentTermsXml += `        <cbc:PaymentMeansID>Contado</cbc:PaymentMeansID>\n`;
        paymentTermsXml += `    </cac:PaymentTerms>\n`;
      }

      // Inyectar antes de <cac:TaxTotal>
      if (xmlModificado.includes('<cac:TaxTotal>')) {
        xmlModificado = xmlModificado.replace('<cac:TaxTotal>', `${paymentTermsXml}    <cac:TaxTotal>`);
      }
    }

    return xmlModificado;
  }
}

export default new UblService();
