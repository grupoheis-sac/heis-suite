import AdmZip from 'adm-zip';
import { DOMParser } from 'xmldom';

/**
 * 🇵🇪 Servicio de Comunicación SOAP Directo y Ultrarrápido con Servidores SUNAT
 * Implementado vía HTTPS nativo (sin dependencias de WSDL externos que puedan bloquearse)
 */
export class SoapService {
  constructor() {
    this.ENDPOINTS = {
      beta: 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
      produccion: 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService',
      homologacion: 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem-sqa/billService'
    };
  }

  /**
   * Empaqueta el XML firmado en un archivo ZIP listo para SUNAT
   */
  comprimirXmlEnZip(nombreXml, xmlFirmado) {
    const zip = new AdmZip();
    zip.addFile(nombreXml, Buffer.from(xmlFirmado, 'utf8'));
    return zip.toBuffer();
  }

  /**
   * Envía un comprobante electrónico (Factura, Boleta, Nota de Crédito, Nota de Débito) a SUNAT
   */
  async enviarComprobanteSunat({
    rucEmisor,
    usuarioSol,
    claveSol,
    nombreArchivoZip, // Ejemplo: 20608945123-03-B001-00000001.zip
    zipBuffer,
    entorno = 'beta',
    timeoutMs = 45000
  }) {
    const endpoint = this.ENDPOINTS[entorno] || this.ENDPOINTS.beta;
    const credencialesAuth = `${rucEmisor}${usuarioSol}:${claveSol}`;
    const authBase64 = Buffer.from(credencialesAuth).toString('base64');
    const zipBase64 = zipBuffer.toString('base64');

    const soapEnvelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
        <soapenv:Header/>
        <soapenv:Body>
          <ser:sendBill>
            <fileName>${nombreArchivoZip}</fileName>
            <contentFile>${zipBase64}</contentFile>
          </ser:sendBill>
        </soapenv:Body>
      </soapenv:Envelope>
    `.trim();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': '',
          'Authorization': `Basic ${authBase64}`
        },
        body: soapEnvelope,
        signal: controller.signal
      });

      clearTimeout(timer);

      const responseText = await response.text();

      // Caso 1: SUNAT devolvió aplicación con CDR (Aceptación o Observación)
      const appResponseMatch = responseText.match(/<applicationResponse>(.*?)<\/applicationResponse>/);
      if (appResponseMatch && appResponseMatch[1]) {
        const cdrZipBuffer = Buffer.from(appResponseMatch[1], 'base64');
        const zipCdr = new AdmZip(cdrZipBuffer);
        const zipEntries = zipCdr.getEntries();

        let cdrXmlString = '';
        for (const entry of zipEntries) {
          if (entry.entryName.endsWith('.xml')) {
            cdrXmlString = zipCdr.readAsText(entry);
            break;
          }
        }

        const infoCdr = this.parsearCdr(cdrXmlString);
        const esAceptado = infoCdr.codigoRespuesta === '0';

        return {
          success: esAceptado,
          estado: esAceptado ? 'Aceptado' : 'Rechazado',
          codigoRespuesta: infoCdr.codigoRespuesta,
          mensaje: infoCdr.descripcion,
          observaciones: infoCdr.observaciones,
          cdrZipBuffer,
          cdrXml: cdrXmlString
        };
      }

      // Caso 2: Error / Fault de SUNAT (soap-env:Fault)
      const faultCodeMatch = responseText.match(/<faultcode>(.*?)<\/faultcode>/);
      const faultStringMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/);

      if (faultCodeMatch || faultStringMatch) {
        const faultCode = faultCodeMatch ? faultCodeMatch[1].replace(/.*:/, '') : 'FAULT';
        const faultString = faultStringMatch ? faultStringMatch[1] : 'Error en procesamiento SUNAT';

        return {
          success: false,
          estado: 'Rechazado',
          codigoRespuesta: faultCode,
          mensaje: `SUNAT ${faultCode}: ${faultString}`,
          cdrZipBuffer: null,
          cdrXml: null
        };
      }

      // Caso 3: Respuesta inesperada
      return {
        success: false,
        estado: 'Error_Envio',
        codigoRespuesta: String(response.status),
        mensaje: `Respuesta desconocida de SUNAT (HTTP ${response.status})`,
        cdrZipBuffer: null,
        cdrXml: null
      };

    } catch (error) {
      console.error('Error en comunicación directa con SUNAT:', error.message);
      return {
        success: false,
        estado: 'Error_Envio',
        codigoRespuesta: 'TIMEOUT_OR_NETWORK',
        mensaje: `Error al conectar con SUNAT: ${error.message}`,
        errorTecnico: error.message
      };
    }
  }

  /**
   * Parsea la Constancia de Recepción (CDR) de SUNAT
   */
  parsearCdr(cdrXmlString) {
    if (!cdrXmlString) {
      return { codigoRespuesta: '-1', descripcion: 'CDR no disponible', observaciones: [] };
    }

    try {
      const doc = new DOMParser().parseFromString(cdrXmlString, 'text/xml');

      const responseCodeNode = doc.getElementsByTagNameNS('*', 'ResponseCode')[0] || doc.getElementsByTagName('cbc:ResponseCode')[0];
      const descriptionNode = doc.getElementsByTagNameNS('*', 'Description')[0] || doc.getElementsByTagName('cbc:Description')[0];

      const codigoRespuesta = responseCodeNode ? responseCodeNode.textContent : '-1';
      const descripcion = descriptionNode ? descriptionNode.textContent : 'Sin descripción';

      // Observaciones adicionales si existen
      const noteNodes = doc.getElementsByTagNameNS('*', 'Note') || [];
      const observaciones = [];
      for (let i = 0; i < noteNodes.length; i++) {
        if (noteNodes[i].textContent) {
          observaciones.push(noteNodes[i].textContent.trim());
        }
      }

      return {
        codigoRespuesta,
        descripcion,
        observaciones
      };
    } catch (err) {
      return {
        codigoRespuesta: '-1',
        descripcion: 'Error al interpretar XML de CDR: ' + err.message,
        observaciones: []
      };
    }
  }
}

/**
 * Envío SOAP con Timeout estricto de 12s y clasificación de contingencia
 */
export async function enviarComprobanteSunatConResiliencia(zipBase64, fileName, credenciales, endpointUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // Timeout máximo de 12s para no bloquear el POS

  try {
    const credencialesAuth = `${credenciales.ruc}${credenciales.usuarioSol}:${credenciales.claveSol}`;
    const authBase64 = Buffer.from(credencialesAuth).toString('base64');
    const zipFileName = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`;

    const soapEnvelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
        <soapenv:Header/>
        <soapenv:Body>
          <ser:sendBill>
            <fileName>${zipFileName}</fileName>
            <contentFile>${zipBase64}</contentFile>
          </ser:sendBill>
        </soapenv:Body>
      </soapenv:Envelope>
    `.trim();

    const targetUrl = endpointUrl || 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService';

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': '',
        'Authorization': `Basic ${authBase64}`,
      },
      body: soapEnvelope,
      signal: controller.signal,
    });

    const xmlResponse = await response.text();

    if (response.status >= 500 || response.status === 429) {
      return {
        estado: 'CONTINGENCIA_REINTENTAR',
        reintentable: true,
        motivo: `SUNAT HTTP ${response.status} (Servicio temporalmente no disponible)`,
      };
    }

    // 1. Caso Aceptado con CDR en applicationResponse
    const appResponseMatch = xmlResponse.match(/<applicationResponse>(.*?)<\/applicationResponse>/);
    if (appResponseMatch && appResponseMatch[1]) {
      const cdrZipBuffer = Buffer.from(appResponseMatch[1], 'base64');
      const zipCdr = new AdmZip(cdrZipBuffer);
      let cdrXmlString = '';
      for (const entry of zipCdr.getEntries()) {
        if (entry.entryName.endsWith('.xml')) {
          cdrXmlString = zipCdr.readAsText(entry);
          break;
        }
      }
      const soap = new SoapService();
      const infoCdr = soap.parsearCdr(cdrXmlString);
      return {
        estado: infoCdr.codigoRespuesta === '0' ? 'ACEPTADO' : 'ACEPTADO_CON_OBSERVACIONES',
        codigoSunat: infoCdr.codigoRespuesta || '0',
        mensajeSunat: infoCdr.descripcion,
        cdrBase64: appResponseMatch[1],
        cdrXml: cdrXmlString,
      };
    }

    // 2. Caso Fault / Error de SUNAT
    const faultCodeMatch = xmlResponse.match(/<faultcode>(.*?)<\/faultcode>/);
    const faultStringMatch = xmlResponse.match(/<faultstring>(.*?)<\/faultstring>/);
    if (faultCodeMatch || faultStringMatch) {
      const faultCode = faultCodeMatch ? faultCodeMatch[1].replace(/.*:/, '') : 'FAULT';
      const faultString = faultStringMatch ? faultStringMatch[1] : 'Error en procesamiento SUNAT';
      return {
        estado: 'RECHAZADO',
        codigoSunat: faultCode,
        mensajeSunat: faultString,
      };
    }

    return {
      estado: 'CONTINGENCIA_REINTENTAR',
      reintentable: true,
      motivo: `Respuesta desconocida de SUNAT (HTTP ${response.status})`,
    };
  } catch (error) {
    return {
      estado: 'CONTINGENCIA_REINTENTAR',
      reintentable: true,
      motivo: error.name === 'AbortError' ? 'Timeout SUNAT (>12s)' : `Error de red: ${error.message}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Consulta de CDR mediante getStatusCdr (recuperación de comprobantes previamente enviados, ej. código 1033)
 */
export async function consultarCdrSunat({ rucComprobante, tipoComprobante, serieComprobante, numeroComprobante }, credenciales, endpointUrl) {
  try {
    const credencialesAuth = `${credenciales.ruc}${credenciales.usuarioSol}:${credenciales.claveSol}`;
    const authBase64 = Buffer.from(credencialesAuth).toString('base64');
    const targetUrl = endpointUrl || 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService';

    const soapEnvelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
        <soapenv:Header/>
        <soapenv:Body>
          <ser:getStatusCdr>
            <rucComprobante>${rucComprobante}</rucComprobante>
            <tipoComprobante>${tipoComprobante}</tipoComprobante>
            <serieComprobante>${serieComprobante}</serieComprobante>
            <numeroComprobante>${numeroComprobante}</numeroComprobante>
          </ser:getStatusCdr>
        </soapenv:Body>
      </soapenv:Envelope>
    `.trim();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': '',
        'Authorization': `Basic ${authBase64}`,
      },
      body: soapEnvelope,
    });

    const xmlResponse = await response.text();
    const cdrMatch = xmlResponse.match(/<content>(.*?)<\/content>/) || xmlResponse.match(/<applicationResponse>(.*?)<\/applicationResponse>/);
    if (cdrMatch && cdrMatch[1]) {
      return {
        success: true,
        cdrBase64: cdrMatch[1],
      };
    }
    return { success: false, mensaje: 'No se encontró CDR registrado.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default new SoapService();
