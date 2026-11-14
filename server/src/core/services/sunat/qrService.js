import QRCode from 'qrcode';

/**
 * 🇵🇪 Generador de Cadena y Código QR Estándar SUNAT
 */
export class QrService {
  /**
   * Genera la cadena de texto para el código QR según resolución de SUNAT
   */
  generarCadenaQR({
    rucEmisor,
    tipoComprobante, // '01' | '03' | '07' | 'Factura' | 'Boleta'
    serie,
    correlativo,
    totalIgv,
    totalVenta,
    fechaEmision, // YYYY-MM-DD
    tipoDocCliente = '1', // 1: DNI, 6: RUC, -: Varios
    numDocCliente = '00000000',
    hash
  }) {
    let codigoTipo = tipoComprobante;
    if (tipoComprobante === 'Factura' || tipoComprobante === '1') codigoTipo = '01';
    else if (tipoComprobante === 'Boleta' || tipoComprobante === '2') codigoTipo = '03';
    else if (tipoComprobante === 'Nota de Crédito' || tipoComprobante === '3') codigoTipo = '07';

    const numPadded = String(correlativo).padStart(8, '0');
    const igvStr = parseFloat(totalIgv || 0).toFixed(2);
    const totalStr = parseFloat(totalVenta || 0).toFixed(2);
    const fechaStr = fechaEmision || new Date().toISOString().split('T')[0];

    return `${rucEmisor}|${codigoTipo}|${serie}|${numPadded}|${igvStr}|${totalStr}|${fechaStr}|${tipoDocCliente}|${numDocCliente}|${hash}|`;
  }

  /**
   * Genera el QR en imagen PNG (Base64 DataURL)
   */
  async generarImagenQR(cadenaQR) {
    try {
      return await QRCode.toDataURL(cadenaQR, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 250
      });
    } catch (error) {
      console.warn('Error al generar imagen QR:', error.message);
      return null;
    }
  }
}

export default new QrService();
