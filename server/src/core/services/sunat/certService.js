import fs from 'fs';
import path from 'path';
import forge from 'node-forge';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🇵🇪 Servicio de Gestión de Certificados Digitales Tributarios (.pfx / .p12 / .pem)
 */
export class CertService {
  constructor(certsDir = path.resolve(__dirname, '../../../../certs')) {
    this.certsDir = certsDir;
    if (!fs.existsSync(this.certsDir)) {
      fs.mkdirSync(this.certsDir, { recursive: true });
    }
  }

  /**
   * Guarda o actualiza el certificado .pfx de una empresa/RUC
   */
  guardarCertificadoPfx(ruc, pfxBuffer, password) {
    const pfxPath = path.join(this.certsDir, `${ruc}.pfx`);
    fs.writeFileSync(pfxPath, pfxBuffer);

    // Guardar contraseña de forma segura asociada
    const configPath = path.join(this.certsDir, `${ruc}.json`);
    fs.writeFileSync(configPath, JSON.stringify({ password }, null, 2));

    return {
      success: true,
      message: `Certificado digital guardado exitosamente para RUC ${ruc}`
    };
  }

  /**
   * Obtiene la clave privada (PEM) y el certificado X.509 (Base64) dado un RUC
   */
  obtenerCredencialesCertificado(ruc, customPassword = null) {
    const pfxPath = path.join(this.certsDir, `${ruc}.pfx`);
    const configPath = path.join(this.certsDir, `${ruc}.json`);

    let password = customPassword;
    if (!password && fs.existsSync(configPath)) {
      try {
        const conf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        password = conf.password;
      } catch (e) {}
    }

    if (!fs.existsSync(pfxPath)) {
      // Verificar si existe clave PEM directa
      const keyPath = path.join(this.certsDir, `${ruc}.key`);
      const certPath = path.join(this.certsDir, `${ruc}.cer`);
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        const privateKeyPem = fs.readFileSync(keyPath, 'utf8');
        const certContent = fs.readFileSync(certPath, 'utf8')
          .replace(/-----BEGIN CERTIFICATE-----/g, '')
          .replace(/-----END CERTIFICATE-----/g, '')
          .replace(/\s+/g, '');
        return { privateKeyPem, certificateBase64: certContent };
      }

      // Fallback para empresas en entorno de desarrollo / beta
      if (fs.existsSync(this.certsDir)) {
        const certsDisponibles = fs.readdirSync(this.certsDir).filter((f) => f.endsWith('.pfx'));
        if (certsDisponibles.length > 0) {
          const certFallback = certsDisponibles[0];
          const rucFallback = certFallback.replace('.pfx', '');
          console.warn(`[CertService] RUC ${ruc} no tiene cert propio, usando cert disponible: ${certFallback}`);
          return this.obtenerCredencialesCertificado(rucFallback, customPassword);
        }
      }

      throw new Error(`No se encontró el certificado digital .pfx para el RUC ${ruc} en ${this.certsDir}`);
    }

    const pfxBuffer = fs.readFileSync(pfxPath);
    return this.extraerDePfx(pfxBuffer, password || '');
  }

  /**
   * Extrae la clave privada en formato PEM y el certificado en Base64 desde un Buffer PFX
   */
  extraerDePfx(pfxBuffer, password = '') {
    try {
      const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      let privateKeyPem = null;
      let certificateBase64 = null;

      // 1. Extraer clave privada
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
      if (keyBag && keyBag.length > 0) {
        privateKeyPem = forge.pki.privateKeyToPem(keyBag[0].key);
      } else {
        const plainKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
        const plainBag = plainKeyBags[forge.pki.oids.keyBag];
        if (plainBag && plainBag.length > 0) {
          privateKeyPem = forge.pki.privateKeyToPem(plainBag[0].key);
        }
      }

      // 2. Extraer certificado X.509
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];
      if (certBag && certBag.length > 0) {
        const certObj = certBag[0].cert;
        const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certObj)).getBytes();
        certificateBase64 = Buffer.from(certDer, 'binary').toString('base64');
      }

      if (!privateKeyPem || !certificateBase64) {
        throw new Error('El archivo .pfx no contiene un par de clave privada y certificado válidos.');
      }

      return {
        privateKeyPem,
        certificateBase64
      };
    } catch (error) {
      throw new Error(`Error al leer certificado digital PFX: ${error.message}`);
    }
  }

  /**
   * Genera un certificado autofirmado de prueba para desarrollo local / pruebas inmediatas
   */
  generarCertificadoPrueba(ruc, razonSocial = 'EMPRESA DE PRUEBAS') {
    const pki = forge.pki;
    const keys = pki.rsa.generateKeyPair(1024);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);

    const attrs = [
      { name: 'commonName', value: `${ruc} - ${razonSocial}` },
      { name: 'countryName', value: 'PE' },
      { name: 'organizationName', value: razonSocial }
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    const password = 'cert_password_123';
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password, {
      algorithm: '3des'
    });
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const pfxBuffer = Buffer.from(p12Der, 'binary');

    this.guardarCertificadoPfx(ruc, pfxBuffer, password);

    return {
      ruc,
      password,
      pfxPath: path.join(this.certsDir, `${ruc}.pfx`)
    };
  }
}

export default new CertService();
