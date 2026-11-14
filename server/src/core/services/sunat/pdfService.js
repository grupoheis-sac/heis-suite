import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { numeroALetras } from './numeroALetras.js';
import qrService from './qrService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🇵🇪 Servicio Oficial de Generación de Representación Impresa (PDF)
 * Cumplimiento Estándar SUNAT (RS 300-2014 / RS 193-2020)
 */
export class PdfService {
  constructor(storageDir = path.resolve(__dirname, '../../../../storage')) {
    this.storageDir = storageDir;
    this.pdfDir = path.join(this.storageDir, 'pdf');
    if (!fs.existsSync(this.pdfDir)) {
      fs.mkdirSync(this.pdfDir, { recursive: true });
    }
  }

  /**
   * Genera el archivo PDF de la Factura, Boleta, Nota de Crédito o Nota de Débito
   * @param {Object} data - Datos completos del comprobante emitido
   * @returns {Promise<{ pdfPath: string, pdfBuffer: Buffer, nombrePdf: string }>}
   */
  async generarPdfComprobante(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          tipoComprobante = 'Boleta',
          serie = 'B001',
          correlativo = 1,
          fechaEmision,
          horaEmision,
          fechaVencimiento,
          emisor = {},
          cliente = {},
          items = [],
          totales = {},
          formaPago = 'Contado',
          cuotas = [],
          documentoModificado = null,
          motivoNota = null,
          hash = '',
          cadenaQR = '',
          nombreArchivo = null
        } = data;

        const correlativoStr = String(correlativo).padStart(8, '0');
        const numeroCompleto = `${serie}-${correlativoStr}`;
        const nombrePdf = nombreArchivo
          ? (nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`)
          : `${emisor.ruc || '20000000000'}-${tipoComprobante === 'Factura' ? '01' : tipoComprobante === 'Nota de Crédito' ? '07' : tipoComprobante === 'Nota de Débito' ? '08' : '03'}-${serie}-${correlativoStr}.pdf`;

        const rutaCompleta = path.join(this.pdfDir, nombrePdf);

        // Generar imagen QR en Buffer para incrustar en PDF
        let qrBuffer = null;
        if (cadenaQR) {
          try {
            const qrDataUrl = await qrService.generarImagenQR(cadenaQR);
            if (qrDataUrl) {
              const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
              qrBuffer = Buffer.from(base64Data, 'base64');
            }
          } catch (e) {
            console.warn('[PDF] No se pudo generar imagen QR:', e.message);
          }
        }

        // Crear documento PDF tamaño A4
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36, // 0.5 pulgada
          info: {
            Title: `${tipoComprobante} Electrónica ${numeroCompleto}`,
            Author: emisor.razonSocial || 'Sistemas HEIS',
            Subject: 'Comprobante de Pago Electrónico SUNAT'
          }
        });

        const writeStream = fs.createWriteStream(rutaCompleta);
        const buffers = [];

        doc.on('data', b => buffers.push(b));
        doc.pipe(writeStream);

        // ==========================================
        // COLORES Y ESTILOS
        // ==========================================
        const colorPrimario = '#0f766e'; // Teal / Verde Farmacia elegante
        const colorTexto = '#1e293b'; // Slate 800
        const colorGris = '#64748b'; // Slate 500
        const colorBorde = '#cbd5e1'; // Slate 300
        const colorFondo = '#f8fafc'; // Slate 50

        const margin = 36;
        const pageWidth = 595.28;
        const contentWidth = pageWidth - (margin * 2); // 523.28

        let y = 36;

        // ==========================================
        // 1. CABECERA: EMISOR (IZQ) Y CAJA SUNAT (DER)
        // ==========================================
        const boxWidth = 200;
        const boxHeight = 90;
        const boxX = pageWidth - margin - boxWidth;

        // Recuadro oficial del comprobante (Derecha)
        doc.roundedRect(boxX, y, boxWidth, boxHeight, 6)
          .lineWidth(1.5)
          .strokeColor(colorPrimario)
          .stroke();

        doc.rect(boxX, y + 26, boxWidth, 34)
          .fillColor(colorPrimario)
          .fill();

        doc.font('Helvetica-Bold')
          .fontSize(12)
          .fillColor(colorTexto)
          .text(`R.U.C. N° ${emisor.ruc || '20608945123'}`, boxX, y + 8, {
            width: boxWidth,
            align: 'center'
          });

        const tituloTipo = tipoComprobante === 'Factura'
          ? 'FACTURA ELECTRÓNICA'
          : tipoComprobante === 'Nota de Crédito'
          ? 'NOTA DE CRÉDITO ELECTRÓNICA'
          : tipoComprobante === 'Nota de Débito'
          ? 'NOTA DE DÉBITO ELECTRÓNICA'
          : 'BOLETA DE VENTA ELECTRÓNICA';

        doc.font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#ffffff')
          .text(tituloTipo, boxX, y + 37, {
            width: boxWidth,
            align: 'center'
          });

        doc.font('Helvetica-Bold')
          .fontSize(13)
          .fillColor(colorTexto)
          .text(numeroCompleto, boxX, y + 68, {
            width: boxWidth,
            align: 'center'
          });

        // Datos del Emisor (Izquierda)
        const emisorWidth = contentWidth - boxWidth - 20;

        doc.font('Helvetica-Bold')
          .fontSize(15)
          .fillColor(colorPrimario)
          .text(emisor.nombreComercial || emisor.razonSocial || 'BOTICA HEIS', margin, y, {
            width: emisorWidth
          });

        doc.moveDown(0.2);
        doc.font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(colorTexto)
          .text(emisor.razonSocial || 'BOTICA HEIS & SALUD S.A.C.', margin, doc.y, {
            width: emisorWidth
          });

        doc.font('Helvetica')
          .fontSize(8)
          .fillColor(colorGris)
          .text(emisor.direccion || 'Av. Principal 123, Lima', margin, doc.y + 2, {
            width: emisorWidth
          });

        if (emisor.telefono || emisor.email) {
          const contacto = [emisor.telefono ? `Telf: ${emisor.telefono}` : '', emisor.email ? `Email: ${emisor.email}` : ''].filter(Boolean).join(' | ');
          doc.text(contacto, margin, doc.y + 2, { width: emisorWidth });
        }

        y = Math.max(doc.y, y + boxHeight) + 14;

        // ==========================================
        // 2. DATOS DEL CLIENTE Y COMPROBANTE
        // ==========================================
        doc.roundedRect(margin, y, contentWidth, 68, 5)
          .lineWidth(0.8)
          .strokeColor(colorBorde)
          .fillColor(colorFondo)
          .fillAndStroke();

        const col1X = margin + 10;
        const col2X = margin + 280;
        let cy = y + 8;

        const docCliente = cliente.tipoDocumento === 'RUC' ? 'R.U.C.:' : 'D.N.I.:';
        const numDocCliente = cliente.numeroDocumento || cliente.numero_documento || '-';
        const nombreCliente = cliente.razonSocial || cliente.nombre || 'CLIENTE GENERAL';
        const dirCliente = cliente.direccion || '-';

        // Fila 1
        doc.font('Helvetica-Bold').fontSize(8).fillColor(colorTexto).text('CLIENTE:', col1X, cy);
        doc.font('Helvetica').text(nombreCliente, col1X + 50, cy, { width: 210, ellipsis: true });

        doc.font('Helvetica-Bold').text('FECHA EMISIÓN:', col2X, cy);
        doc.font('Helvetica').text(`${fechaEmision || new Date().toISOString().split('T')[0]} ${horaEmision || ''}`, col2X + 85, cy);

        cy += 14;
        // Fila 2
        doc.font('Helvetica-Bold').text(docCliente, col1X, cy);
        doc.font('Helvetica').text(numDocCliente, col1X + 50, cy);

        doc.font('Helvetica-Bold').text('MONEDA:', col2X, cy);
        doc.font('Helvetica').text('SOLES (PEN)', col2X + 85, cy);

        cy += 14;
        // Fila 3
        doc.font('Helvetica-Bold').text('DIRECCIÓN:', col1X, cy);
        doc.font('Helvetica').text(dirCliente, col1X + 50, cy, { width: 210, ellipsis: true });

        doc.font('Helvetica-Bold').text('FORMA DE PAGO:', col2X, cy);
        doc.font('Helvetica').text(formaPago.toUpperCase(), col2X + 85, cy);

        cy += 14;
        // Fila 4: Si es Nota de Crédito o Débito
        if (documentoModificado) {
          doc.font('Helvetica-Bold').fillColor('#b91c1c').text('DOC. MODIFICA:', col1X, cy);
          doc.font('Helvetica').text(`${documentoModificado.tipoDocumento || 'Comprobante'} ${documentoModificado.serie}-${documentoModificado.correlativo}`, col1X + 75, cy);

          doc.font('Helvetica-Bold').text('MOTIVO:', col2X, cy);
          doc.font('Helvetica').text(motivoNota || documentoModificado.motivo || 'Anulación de la operación', col2X + 50, cy, { width: 180, ellipsis: true });
        }

        y += 76;

        // ==========================================
        // 3. TABLA DE ÍTEMS / PRODUCTOS
        // ==========================================
        const thHeight = 18;
        doc.rect(margin, y, contentWidth, thHeight)
          .fillColor(colorPrimario)
          .fill();

        const colCant = margin + 6;
        const colUnd = margin + 45;
        const colCod = margin + 85;
        const colDesc = margin + 155;
        const colPUnit = margin + 390;
        const colTotal = margin + 465;

        doc.font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor('#ffffff')
          .text('CANT.', colCant, y + 5)
          .text('UND', colUnd, y + 5)
          .text('CÓDIGO', colCod, y + 5)
          .text('DESCRIPCIÓN', colDesc, y + 5)
          .text('P. UNIT.', colPUnit, y + 5, { width: 60, align: 'right' })
          .text('TOTAL (S/)', colTotal, y + 5, { width: 50, align: 'right' });

        y += thHeight;

        // Filas de productos
        let rowY = y;
        doc.font('Helvetica').fontSize(7.5);

        items.forEach((it, index) => {
          const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
          const cant = parseFloat(it.cantidad || 1).toFixed(2);
          const und = it.unidadMedida || 'NIU';
          const cod = it.codigo || it.codigo_interno || '-';
          const desc = it.descripcion || it.nombre_medicamento || 'PRODUCTO';
          const pUnit = parseFloat(it.precioUnitario || it.precio_unitario || 0).toFixed(2);
          const tot = parseFloat(it.total || (cant * pUnit)).toFixed(2);

          doc.rect(margin, rowY, contentWidth, 16)
            .fillColor(bg)
            .fill();

          doc.fillColor(colorTexto)
            .text(cant, colCant, rowY + 4)
            .text(und, colUnd, rowY + 4)
            .text(cod, colCod, rowY + 4, { width: 65, ellipsis: true })
            .text(desc, colDesc, rowY + 4, { width: 230, ellipsis: true })
            .text(pUnit, colPUnit, rowY + 4, { width: 60, align: 'right' })
            .text(tot, colTotal, rowY + 4, { width: 50, align: 'right' });

          rowY += 16;
        });

        // Borde inferior de la tabla
        doc.rect(margin, rowY, contentWidth, 0.5)
          .strokeColor(colorBorde)
          .stroke();

        y = rowY + 10;

        // ==========================================
        // 4. TOTALES Y MONTO EN LETRAS
        // ==========================================
        const totalVenta = totales.total !== undefined
          ? parseFloat(totales.total)
          : items.reduce((acc, it) => acc + (parseFloat(it.total) || 0), 0);

        const subtotalGravado = totales.gravado !== undefined
          ? parseFloat(totales.gravado)
          : parseFloat((totalVenta / 1.18).toFixed(2));

        const totalIgv = totales.igv !== undefined
          ? parseFloat(totales.igv)
          : parseFloat((totalVenta - subtotalGravado).toFixed(2));

        const textoLetras = numeroALetras(totalVenta, 'SOLES');

        // Cuadro de Monto en Letras (Izquierda)
        const letrasWidth = 320;
        doc.roundedRect(margin, y, letrasWidth, 42, 4)
          .lineWidth(0.8)
          .strokeColor(colorBorde)
          .fillColor(colorFondo)
          .fillAndStroke();

        doc.font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(colorTexto)
          .text('SON (Monto en letras):', margin + 8, y + 6);

        doc.font('Helvetica')
          .fontSize(7.5)
          .fillColor(colorPrimario)
          .text(textoLetras, margin + 8, y + 17, { width: letrasWidth - 16 });

        // Si es a crédito, mostrar cuotas debajo
        if (formaPago.toLowerCase() === 'credito' && cuotas.length > 0) {
          doc.font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(colorTexto)
            .text('INFORMACIÓN DEL CRÉDITO:', margin + 8, y + 48);

          let cuotaTxt = cuotas.map(c => `${c.cuota || 'Cuota 1'}: S/ ${parseFloat(c.monto).toFixed(2)} (Vence: ${c.fechaVencimiento || '-'})`).join(' | ');
          doc.font('Helvetica').text(cuotaTxt, margin + 8, y + 58, { width: letrasWidth - 16 });
        }

        // Cuadro de Resumen de Impuestos (Derecha)
        const totBoxWidth = contentWidth - letrasWidth - 12;
        const totBoxX = margin + letrasWidth + 12;

        let totY = y;
        const dibujarFilaTotal = (etiqueta, valor, esBold = false) => {
          doc.font(esBold ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(8)
            .fillColor(colorTexto)
            .text(etiqueta, totBoxX, totY);

          doc.font(esBold ? 'Helvetica-Bold' : 'Helvetica')
            .text(`S/ ${parseFloat(valor).toFixed(2)}`, totBoxX + 90, totY, { width: totBoxWidth - 90, align: 'right' });
          totY += 12;
        };

        dibujarFilaTotal('OP. GRAVADA:', subtotalGravado);
        dibujarFilaTotal('OP. INAFECTA:', totales.inafecto || 0.00);
        dibujarFilaTotal('OP. EXONERADA:', totales.exonerado || 0.00);
        dibujarFilaTotal('I.G.V. (18%):', totalIgv);

        // Barra de Total a Pagar
        doc.rect(totBoxX, totY + 2, totBoxWidth, 18)
          .fillColor(colorPrimario)
          .fill();

        doc.font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#ffffff')
          .text('TOTAL A PAGAR:', totBoxX + 6, totY + 6);

        doc.text(`S/ ${totalVenta.toFixed(2)}`, totBoxX + 80, totY + 6, {
          width: totBoxWidth - 86,
          align: 'right'
        });

        y = Math.max(y + 80, totY + 30);

        // ==========================================
        // 5. PIE DE PÁGINA: QR, HASH Y REGLAMENTACIÓN SUNAT
        // ==========================================
        const footerY = Math.max(y + 10, 710); // Asegurar posición al fondo de la hoja A4

        doc.rect(margin, footerY - 8, contentWidth, 0.8)
          .strokeColor(colorBorde)
          .stroke();

        // Incrustar imagen QR (Izquierda del footer)
        if (qrBuffer) {
          doc.image(qrBuffer, margin, footerY, { width: 68, height: 68 });
        }

        // Información de Hash y Leyendas SUNAT
        const infoX = margin + (qrBuffer ? 78 : 0);
        const infoWidth = contentWidth - (qrBuffer ? 78 : 0);

        doc.font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(colorTexto)
          .text('Código HASH SUNAT (DigestValue):', infoX, footerY + 4);

        doc.font('Courier')
          .fontSize(7)
          .fillColor(colorPrimario)
          .text(hash || 'N/A', infoX, footerY + 15, { width: infoWidth });

        doc.font('Helvetica')
          .fontSize(7)
          .fillColor(colorGris)
          .text('Representación impresa del Comprobante de Pago Electrónico, autorizada mediante Resolución de Superintendencia SUNAT N° 300-2014/SUNAT.', infoX, footerY + 28, {
            width: infoWidth
          });

        doc.font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(colorTexto)
          .text('Consulte la autenticidad y validez de este comprobante en www.sunat.gob.pe', infoX, footerY + 44);

        doc.font('Helvetica')
          .fontSize(6.5)
          .fillColor(colorGris)
          .text('Emitido a través del Sistema de Facturación Electrónica HEIS Multi-Empresa.', infoX, footerY + 54);

        // Finalizar PDF
        doc.end();

        writeStream.on('finish', () => {
          resolve({
            success: true,
            pdfPath: rutaCompleta,
            pdfBuffer: Buffer.concat(buffers),
            nombrePdf
          });
        });

        writeStream.on('error', err => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default new PdfService();
