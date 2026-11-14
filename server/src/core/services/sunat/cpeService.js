import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import certService from './certService.js';
import ublService from './ublService.js';
import signerService from './signerService.js';
import qrService from './qrService.js';
import soapService from './soapService.js';
import pdfService from './pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🇵🇪 Servicio Orquestador de Comprobantes Electrónicos para SUNAT
 */
export class CpeService {
  constructor(storageDir = path.resolve(__dirname, '../../../../storage')) {
    this.storageDir = storageDir;
    this.xmlDir = path.join(this.storageDir, 'xml');
    this.cdrDir = path.join(this.storageDir, 'cdr');
    this.pdfDir = path.join(this.storageDir, 'pdf');

    if (!fs.existsSync(this.xmlDir)) fs.mkdirSync(this.xmlDir, { recursive: true });
    if (!fs.existsSync(this.cdrDir)) fs.mkdirSync(this.cdrDir, { recursive: true });
    if (!fs.existsSync(this.pdfDir)) fs.mkdirSync(this.pdfDir, { recursive: true });
  }

  /**
   * Emite un comprobante (Factura, Boleta, Nota de Crédito o Nota de Débito)
   */
  async emitirComprobante({
    tipoComprobante = 'Boleta', // 'Boleta' | 'Factura' | 'Nota de Crédito' | 'Nota de Débito' | '01' | '03' | '07' | '08'
    serie = 'B001',
    correlativo = 1,
    fechaEmision,
    horaEmision,
    fechaVencimiento,
    emisor,
    cliente,
    items,
    totales,
    formaPago = 'Contado',
    cuotas = [],
    documentoModificado = null,
    motivoNota = null,
    tipoNota = '01',
    credencialesSol = {},
    entorno = 'beta', // 'beta' | 'produccion'
    enviarASunat = true,
    baseUrl = ''
  }) {
    const rucEmisor = emisor.ruc;

    // 1. Obtener certificado digital (.pfx)
    let credencialesCert;
    try {
      credencialesCert = certService.obtenerCredencialesCertificado(rucEmisor);
    } catch (e) {
      if (entorno === 'beta' || process.env.NODE_ENV !== 'production') {
        console.warn(`[SUNAT] Certificado no encontrado para ${rucEmisor}. Autogenerando certificado de prueba...`);
        certService.generarCertificadoPrueba(rucEmisor, emisor.razonSocial);
        credencialesCert = certService.obtenerCredencialesCertificado(rucEmisor);
      } else {
        throw e;
      }
    }

    // 2. Generar XML UBL 2.1 (con Leyenda 1000 y Forma de Pago)
    const { xml, tipoCodigo, montoEnLetras } = ublService.construirXmlComprobante({
      tipoComprobante,
      serie,
      correlativo,
      fechaEmision,
      horaEmision,
      emisor,
      cliente,
      items,
      totales,
      formaPago,
      cuotas,
      documentoModificado,
      tipoNota,
      motivo: motivoNota
    });

    // 3. Firmar digitalmente el XML con XAdES-BES
    const resultadoFirma = signerService.firmarXml(
      xml,
      credencialesCert.privateKeyPem,
      credencialesCert.certificateBase64
    );

    // 4. Nombre estándar de archivo SUNAT: {RUC}-{TIPO}-{SERIE}-{CORRELATIVO}
    const numeroStr = String(correlativo).padStart(8, '0');
    const baseNombreArchivo = `${rucEmisor}-${tipoCodigo}-${serie}-${numeroStr}`;
    const nombreXml = `${baseNombreArchivo}.xml`;
    const nombreZip = `${baseNombreArchivo}.zip`;
    const nombrePdf = `${baseNombreArchivo}.pdf`;

    // 5. Guardar XML firmado en almacenamiento local
    const rutaXml = path.join(this.xmlDir, nombreXml);
    fs.writeFileSync(rutaXml, resultadoFirma.signedXml, 'utf8');

    // 6. Generar Cadena e Imagen QR oficial SUNAT
    const totalIgv = totales?.igv || items.reduce((acc, it) => acc + (it.igv || 0), 0);
    const totalVenta = totales?.total || items.reduce((acc, it) => acc + (it.total || 0), 0);

    const cadenaQR = qrService.generarCadenaQR({
      rucEmisor,
      tipoComprobante: tipoCodigo,
      serie,
      correlativo,
      totalIgv,
      totalVenta,
      fechaEmision: fechaEmision || new Date().toISOString().split('T')[0],
      tipoDocCliente: cliente?.tipoDocumento === 'RUC' ? '6' : '1',
      numDocCliente: cliente?.numeroDocumento || '00000000',
      hash: resultadoFirma.hash
    });

    const qrImagenDataUrl = await qrService.generarImagenQR(cadenaQR);

    // 7. Generar Representación Impresa Oficial (PDF) con QR y Hash
    let resultadoPdf = null;
    try {
      resultadoPdf = await pdfService.generarPdfComprobante({
        tipoComprobante,
        serie,
        correlativo,
        fechaEmision,
        horaEmision,
        fechaVencimiento,
        emisor,
        cliente,
        items,
        totales,
        formaPago,
        cuotas,
        documentoModificado,
        motivoNota,
        hash: resultadoFirma.hash,
        cadenaQR,
        nombreArchivo: nombrePdf
      });
    } catch (errPdf) {
      console.warn('[PDF] Advertencia al generar archivo PDF:', errPdf.message);
    }

    // 8. Enviar a SUNAT (si está activo el envío)
    let respuestaSunat = {
      estado: 'Pendiente',
      mensaje: 'XML firmado y PDF generado localmente (modo sin envío inmediato)',
      codigoRespuesta: '0'
    };

    if (enviarASunat) {
      const zipBuffer = soapService.comprimirXmlEnZip(nombreXml, resultadoFirma.signedXml);

      // Usar credenciales SOL del emisor o credenciales por defecto de pruebas (MODDATOS/moddatos)
      const usuarioSol = credencialesSol.usuario || (entorno === 'beta' ? 'MODDATOS' : '');
      const claveSol = credencialesSol.clave || (entorno === 'beta' ? 'moddatos' : '');

      const resSoap = await soapService.enviarComprobanteSunat({
        rucEmisor,
        usuarioSol,
        claveSol,
        nombreArchivoZip: nombreZip,
        zipBuffer,
        entorno
      });

      respuestaSunat = resSoap;

      // Guardar CDR recibido en storage
      if (resSoap.cdrZipBuffer) {
        const rutaCdr = path.join(this.cdrDir, `R-${nombreZip}`);
        fs.writeFileSync(rutaCdr, resSoap.cdrZipBuffer);
      }
    }

    // Armar URLs de descarga
    const prefix = baseUrl || '';
    const xmlUrl = `${prefix}/api/v1/cpe/descargar/${rucEmisor}/xml/${nombreXml}`;
    const pdfUrl = `${prefix}/api/v1/cpe/descargar/${rucEmisor}/pdf/${nombrePdf}`;
    const cdrUrl = `${prefix}/api/v1/cpe/descargar/${rucEmisor}/cdr/R-${nombreZip}`;

    return {
      success: respuestaSunat.success || respuestaSunat.estado === 'Aceptado',
      comprobante: `${serie}-${numeroStr}`,
      tipo_comprobante: tipoComprobante,
      tipo_codigo: tipoCodigo,
      monto_letras: montoEnLetras,
      sunat_estado: respuestaSunat.estado,
      sunat_codigo_respuesta: respuestaSunat.codigoRespuesta,
      sunat_hash: resultadoFirma.hash,
      sunat_qr: cadenaQR,
      sunat_qr_img: qrImagenDataUrl,
      sunat_cdr: respuestaSunat.mensaje,
      archivos: {
        xml_nombre: nombreXml,
        xml_url: xmlUrl,
        xml_contenido: resultadoFirma.signedXml,
        pdf_nombre: nombrePdf,
        pdf_url: pdfUrl,
        pdf_buffer: resultadoPdf ? resultadoPdf.pdfBuffer : null,
        cdr_nombre: `R-${nombreZip}`,
        cdr_url: cdrUrl,
        cdr_zip_base64: respuestaSunat.cdrZipBuffer ? respuestaSunat.cdrZipBuffer.toString('base64') : null
      }
    };
  }

  /**
   * Emite Nota de Crédito Electrónica para anulaciones o descuentos
   */
  async emitirNotaCredito(params) {
    return this.emitirComprobante({
      ...params,
      tipoComprobante: 'Nota de Crédito'
    });
  }

  /**
   * Emite Nota de Débito Electrónica para penalidades o aumentos de valor
   */
  async emitirNotaDebito(params) {
    return this.emitirComprobante({
      ...params,
      tipoComprobante: 'Nota de Débito'
    });
  }

  /**
   * Consulta si existen los archivos locales de un comprobante
   */
  consultarComprobanteLocal(ruc, tipo, serie, correlativo) {
    const correlativoStr = String(correlativo).padStart(8, '0');
    const baseNombre = `${ruc}-${tipo}-${serie}-${correlativoStr}`;

    const rutaXml = path.join(this.xmlDir, `${baseNombre}.xml`);
    const rutaPdf = path.join(this.pdfDir, `${baseNombre}.pdf`);
    const rutaCdr = path.join(this.cdrDir, `R-${baseNombre}.zip`);

    return {
      existeXml: fs.existsSync(rutaXml),
      existePdf: fs.existsSync(rutaPdf),
      existeCdr: fs.existsSync(rutaCdr),
      rutas: {
        xml: fs.existsSync(rutaXml) ? rutaXml : null,
        pdf: fs.existsSync(rutaPdf) ? rutaPdf : null,
        cdr: fs.existsSync(rutaCdr) ? rutaCdr : null
      }
    };
  }
}

export default new CpeService();
