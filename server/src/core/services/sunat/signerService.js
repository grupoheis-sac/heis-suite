import { SignedXml } from 'xml-crypto';
import AdmZip from 'adm-zip';
import certService, { decryptCertPassword } from './certService.js';

/**
 * 🇵🇪 Servicio Oficial de Firma Digital XML XAdES-BES para SUNAT UBL 2.1
 */
export class SignerService {
  /**
   * Firma digitalmente un documento XML según el estándar SUNAT / UBL 2.1
   * @param {string} xmlString - Documento XML en texto plano
   * @param {string} privateKeyPem - Clave privada RSA en formato PEM
   * @param {string} certificateBase64 - Certificado X.509 en Base64 o PEM
   * @returns {{ success: boolean, signedXml: string, hash: string, signatureValue: string }}
   */
  firmarXml(xmlString, privateKeyPem, certificateBase64) {
    try {
      // 1. Limpiar cualquier firma previa dentro de <ext:ExtensionContent>
      const cleanedXml = xmlString.replace(
        /<ext:ExtensionContent>[\s\S]*?<\/ext:ExtensionContent>/,
        '<ext:ExtensionContent></ext:ExtensionContent>'
      );

      // 2. Extraer el ID de firma configurado en el documento (ej. SignB00100000105 o SignF00100000001)
      const sigMatch = cleanedXml.match(/<cac:Signature>[\s\S]*?<cbc:ID>(.*?)<\/cbc:ID>/);
      const signatureId = sigMatch ? sigMatch[1] : 'SignKG';

      // 3. Normalizar formato PEM del certificado público X.509
      let pemCert = certificateBase64.trim();
      if (!pemCert.includes('-----BEGIN CERTIFICATE-----')) {
        pemCert = `-----BEGIN CERTIFICATE-----\n${pemCert}\n-----END CERTIFICATE-----`;
      }

      // 4. Configurar SignedXml con los algoritmos y namespaces requeridos por SUNAT
      const sig = new SignedXml({
        privateKey: privateKeyPem,
        publicCert: pemCert,
        signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
        canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      });

      // 5. Agregar referencia canónica con URI="" (enveloped) requerida por UBL 2.1 SUNAT
      sig.addReference({
        xpath: '/*',
        isEmptyUri: true,
        transforms: [
          'http://www.w3.org/2000/09/xmldsig#enveloped-signature'
        ],
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1'
      });

      // 6. Computar firma e insertar directamente en el nodo <ext:ExtensionContent>
      sig.computeSignature(cleanedXml, {
        attrs: {
          Id: signatureId
        },
        location: {
          reference: "//*[local-name(.)='ExtensionContent'][1]",
          action: 'append'
        }
      });

      const signedXml = sig.getSignedXml();
      const signatureXml = sig.getSignatureXml();

      // 7. Extraer el DigestValue (Código Hash oficial SUNAT) y SignatureValue
      const digestMatch = signatureXml.match(/<DigestValue>(.*?)<\/DigestValue>/);
      const signatureValueMatch = signatureXml.match(/<SignatureValue>(.*?)<\/SignatureValue>/);

      const hash = digestMatch ? digestMatch[1] : '';
      const signatureValue = signatureValueMatch ? signatureValueMatch[1] : '';

      return {
        success: true,
        signedXml,
        hash,
        signatureValue
      };
    } catch (error) {
      throw new Error(`Error en el proceso de firma digital XAdES-BES: ${error.message}`);
    }
  }
}

export default new SignerService();

/**
 * Firma digitalmente un XML y lo comprime en formato ZIP estándar SUNAT
 * @param {string} xmlString Contenido XML sin firmar
 * @param {string} xmlFileName Nombre del XML dentro del ZIP (ej. 20601234567-09-T001-00000001.xml)
 * @param {Object} empresa Objeto Empresa con datos de certificado digital
 * @returns {Promise<Buffer>} Buffer del archivo .zip listo para envío
 */
export async function signXmlAndCompressZip(xmlString, xmlFileName, empresa) {
  const ruc = empresa?.ruc || '20000000001';
  let password = null;
  if (empresa?.certificado_password_cifrado) {
    password = decryptCertPassword(empresa.certificado_password_cifrado);
  } else if (empresa?.certificado_password) {
    password = empresa.certificado_password;
  } else if (empresa?.cert_password) {
    password = empresa.cert_password;
  }

  let creds;
  try {
    if (empresa?.certificado_pfx && Buffer.isBuffer(empresa.certificado_pfx)) {
      creds = certService.extraerDePfx(empresa.certificado_pfx, password || '');
    } else {
      creds = certService.obtenerCredencialesCertificado(ruc, password);
    }
  } catch (err) {
    if (
      process.env.NODE_ENV !== 'production' ||
      (empresa?.modo_sunat || '').toUpperCase() !== 'PRODUCCION'
    ) {
      try {
        certService.generarCertificadoPrueba(ruc, empresa?.razon_social || 'PRUEBAS');
        creds = certService.obtenerCredencialesCertificado(ruc);
      } catch (_) {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const signer = new SignerService();
  const { signedXml } = signer.firmarXml(xmlString, creds.privateKeyPem, creds.certificateBase64);

  const zip = new AdmZip();
  const entryName = xmlFileName.endsWith('.xml') ? xmlFileName : `${xmlFileName}.xml`;
  zip.addFile(entryName, Buffer.from(signedXml, 'utf8'));
  return zip.toBuffer();
}
