// server/src/core/services/sunat/greService.js
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { resolveSafeTenantPath, decryptCertPassword } from './certService.js';
import { generarQrBase64 } from './qrService.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');

// Caché en memoria de tokens OAuth2 por empresa_id para no autenticar en cada GRE
const greTokenCache = new Map();

/**
 * 1. Obtiene y cachea el Token OAuth2 del API REST de GRE SUNAT
 */
export async function obtenerTokenOAuth2Gre(empresa) {
  const cacheKey = `gre_token_${empresa.id}`;
  const cached = greTokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.accessToken;
  }

  const clientId = empresa.sunat_client_id;
  const clientSecret = empresa.sunat_client_secret_cifrado
    ? decryptCertPassword(empresa.sunat_client_secret_cifrado)
    : empresa.sunat_client_secret;
  const claveSol = empresa.clave_sol_cifrada
    ? decryptCertPassword(empresa.clave_sol_cifrada)
    : (empresa.clave_sol || empresa.sunat_clave_sol || 'moddatos');

  if (!clientId || !clientSecret || (!empresa.usuario_sol && !empresa.sunat_usuario_sol) || !claveSol) {
    throw new Error(
      'Faltan credenciales API SUNAT (client_id, client_secret o Clave SOL) en la configuración de la empresa.'
    );
  }

  const usuarioSol = empresa.usuario_sol || empresa.sunat_usuario_sol;

  const authUrl =
    empresa.modo_sunat === 'PRODUCCION'
      ? `https://api-seguridad.sunat.gob.pe/v1/clientessol/${clientId}/oauth2/token/`
      : `https://gre-test.nubefact.com/v1/clientessol/${clientId}/oauth2/token/`;

  const params = new URLSearchParams({
    grant_type: 'password',
    scope: 'https://api-cpe.sunat.gob.pe',
    client_id: clientId,
    client_secret: clientSecret,
    username: `${empresa.ruc}${usuarioSol}`,
    password: claveSol,
  });

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error OAuth2 GRE SUNAT (HTTP ${response.status}): ${errText}`);
  }

  const data = await response.json();
  const expiresInMs = Number(data.expires_in || 3600) * 1000;

  greTokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt: Date.now() + expiresInMs,
  });

  return data.access_token;
}

/**
 * 2. Construye el XML UBL 2.1 (CustomizationID 2.0) para:
 *    - GRE Remitente (tipo_comprobante = '09', serie = 'T001')
 *    - GRE Transportista (tipo_comprobante = '31', serie = 'V001')
 */
export function construirXmlGreUBL21(datos, empresa) {
  const {
    tipo_comprobante = '09', // '09' = Remitente | '31' = Transportista
    serie = tipo_comprobante === '31' ? 'V001' : 'T001',
    correlativo,
    fecha_emision = new Date().toISOString().slice(0, 10),
    hora_emision = new Date().toTimeString().slice(0, 8),
    motivo_traslado_codigo = '01', // Catálogo 20: '01'=Venta, '04'=Traslado entre establecimientos
    motivo_traslado_descripcion = 'VENTA',
    modalidad_traslado = '01', // Catálogo 18: '01'=Transporte Público, '02'=Transporte Privado
    fecha_inicio_traslado = fecha_emision,
    peso_bruto_total = 1.0,
    unidad_peso = 'KGM', // 'KGM' o 'TNE'
    numero_bultos = 1,
    destinatario, // { tipo_documento: '6', documento: '20...', razon_social: '...' }
    remitente_originario, // Requerido en GRE Transportista ('31')
    punto_partida, // { ubigeo: '150101', direccion: '...', ruc_asociado, cod_establecimiento: '0000' }
    punto_llegada, // { ubigeo: '150122', direccion: '...', ruc_asociado, cod_establecimiento: '0000' }
    transportista, // Para modalidad '01': { ruc: '20...', razon_social: '...', registro_mtc: '...' }
    vehiculo, // { placa_principal: 'ABC123', placa_secundaria: '', tuc_certificado: '' }
    conductor, // { tipo_documento: '1', documento: '44556677', nombres: '...', apellidos: '...', licencia: 'Q44556677' }
    documento_relacionado, // Opcional: { tipo: '01', numero: 'F001-00000123', ruc_emisor: empresa.ruc }
    items = [],
  } = datos;

  const numeroFormateado = `${serie}-${String(correlativo).padStart(8, '0')}`;
  const esTransportista = tipo_comprobante === '31';

  const docRelacionadoXml = documento_relacionado
    ? `<cac:AdditionalDocumentReference>
        <cbc:ID>${documento_relacionado.numero}</cbc:ID>
        <cbc:DocumentTypeCode listAgencyName="PE:SUNAT" listName="Documento relacionado al transporte" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo61">${documento_relacionado.tipo}</cbc:DocumentTypeCode>
        <cbc:DocumentType>Factura</cbc:DocumentType>
        <cac:IssuerParty>
          <cac:PartyIdentification>
            <cbc:ID schemeID="6" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${documento_relacionado.ruc_emisor || empresa.ruc}</cbc:ID>
          </cac:PartyIdentification>
        </cac:IssuerParty>
      </cac:AdditionalDocumentReference>`
    : '';

  // Bloque de Transporte Público ('01') vs Privado ('02') o GRE Transportista ('31')
  const shipmentStageXml =
    modalidad_traslado === '01' && !esTransportista
      ? `<cac:ShipmentStage>
          <cbc:TransportModeCode listName="Modalidad de Traslado" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo18">01</cbc:TransportModeCode>
          <cac:TransitPeriod>
            <cbc:StartDate>${fecha_inicio_traslado}</cbc:StartDate>
          </cac:TransitPeriod>
          <cac:CarrierParty>
            <cac:PartyIdentification>
              <cbc:ID schemeID="6" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${transportista?.ruc}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
              <cbc:RegistrationName><![CDATA[${transportista?.razon_social}]]></cbc:RegistrationName>
              ${transportista?.registro_mtc ? `<cbc:CompanyID>${transportista.registro_mtc}</cbc:CompanyID>` : ''}
            </cac:PartyLegalEntity>
          </cac:CarrierParty>
        </cac:ShipmentStage>`
      : `<cac:ShipmentStage>
          ${!esTransportista ? `<cbc:TransportModeCode listName="Modalidad de Traslado" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo18">02</cbc:TransportModeCode>` : ''}
          <cac:TransitPeriod>
            <cbc:StartDate>${fecha_inicio_traslado}</cbc:StartDate>
          </cac:TransitPeriod>
          <cac:DriverPerson>
            <cbc:ID schemeID="${conductor?.tipo_documento || '1'}" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${conductor?.documento}</cbc:ID>
            <cbc:FirstName><![CDATA[${conductor?.nombres || ''}]]></cbc:FirstName>
            <cbc:FamilyName><![CDATA[${conductor?.apellidos || ''}]]></cbc:FamilyName>
            <cbc:JobTitle>Principal</cbc:JobTitle>
            <cac:IdentityDocumentReference>
              <cbc:ID>${conductor?.licencia}</cbc:ID>
            </cac:IdentityDocumentReference>
          </cac:DriverPerson>
        </cac:ShipmentStage>`;

  const transportHandlingUnitXml =
    vehiculo?.placa_principal
      ? `<cac:TransportHandlingUnit>
          <cac:TransportEquipment>
            <cbc:ID>${String(vehiculo.placa_principal).replace(/[^A-Z0-9]/gi, '').toUpperCase()}</cbc:ID>
            ${
              vehiculo.tuc_certificado
                ? `<cac:ApplicableTransportMeans><cbc:RegistrationNationalityID>${vehiculo.tuc_certificado}</cbc:RegistrationNationalityID></cac:ApplicableTransportMeans>`
                : ''
            }
          </cac:TransportEquipment>
        </cac:TransportHandlingUnit>`
      : '';

  const lineasXml = items
    .map(
      (item, idx) => `<cac:DespatchLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:DeliveredQuantity unitCode="${item.unidad_medida || 'NIU'}" unitCodeListID="UN/ECE rec 20" unitCodeListAgencyName="United Nations Economic Commission for Europe">${Number(item.cantidad).toFixed(4)}</cbc:DeliveredQuantity>
      <cac:OrderLineReference>
        <cbc:LineID>${idx + 1}</cbc:LineID>
      </cac:OrderLineReference>
      <cac:Item>
        <cbc:Description><![CDATA[${item.descripcion || item.nombre}]]></cbc:Description>
        <cac:SellersItemIdentification>
          <cbc:ID>${item.codigo || `ITEM-${idx + 1}`}</cbc:ID>
        </cac:SellersItemIdentification>
      </cac:Item>
    </cac:DespatchLine>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
                xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
                xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${numeroFormateado}</cbc:ID>
  <cbc:IssueDate>${fecha_emision}</cbc:IssueDate>
  <cbc:IssueTime>${hora_emision}</cbc:IssueTime>
  <cbc:DespatchAdviceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">${tipo_comprobante}</cbc:DespatchAdviceTypeCode>
  ${docRelacionadoXml}
  <cac:Signature>
    <cbc:ID>SignHEIS</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${empresa.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${empresa.razon_social}]]></cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#SignHEIS</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:DespatchSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${empresa.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${empresa.razon_social}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DespatchSupplierParty>
  <cac:DeliveryCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${destinatario?.tipo_documento || '6'}" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${destinatario?.documento}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${destinatario?.razon_social}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DeliveryCustomerParty>
  <cac:Shipment>
    <cbc:ID>SUNAT_Envio</cbc:ID>
    ${
      !esTransportista
        ? `<cbc:HandlingCode listAgencyName="PE:SUNAT" listName="Motivo de Traslado" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo20">${motivo_traslado_codigo}</cbc:HandlingCode>
           <cbc:HandlingInstructions><![CDATA[${motivo_traslado_descripcion}]]></cbc:HandlingInstructions>`
        : ''
    }
    <cbc:GrossWeightMeasure unitCode="${unidad_peso}">${Number(peso_bruto_total).toFixed(3)}</cbc:GrossWeightMeasure>
    ${numero_bultos ? `<cbc:TotalTransportHandlingUnitQuantity>${Number(numero_bultos)}</cbc:TotalTransportHandlingUnitQuantity>` : ''}
    ${shipmentStageXml}
    <cac:Delivery>
      <cac:DeliveryAddress>
        <cbc:ID schemeName="Ubigeos" schemeAgencyName="PE:INEI">${punto_llegada?.ubigeo}</cbc:ID>
        <cac:AddressLine>
          <cbc:Line><![CDATA[${punto_llegada?.direccion}]]></cbc:Line>
        </cac:AddressLine>
      </cac:DeliveryAddress>
      <cac:Despatch>
        <cac:DespatchAddress>
          <cbc:ID schemeName="Ubigeos" schemeAgencyName="PE:INEI">${punto_partida?.ubigeo}</cbc:ID>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${punto_partida?.direccion}]]></cbc:Line>
          </cac:AddressLine>
        </cac:DespatchAddress>
        ${
          esTransportista && remitente_originario
            ? `<cac:DespatchParty>
                <cac:PartyIdentification>
                  <cbc:ID schemeID="6" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${remitente_originario.ruc}</cbc:ID>
                </cac:PartyIdentification>
                <cac:PartyLegalEntity>
                  <cbc:RegistrationName><![CDATA[${remitente_originario.razon_social}]]></cbc:RegistrationName>
                </cac:PartyLegalEntity>
              </cac:DespatchParty>`
            : ''
        }
      </cac:Despatch>
    </cac:Delivery>
    ${transportHandlingUnitXml}
  </cac:Shipment>
  ${lineasXml}
</DespatchAdvice>`;
}

/**
 * 3. Envía el ZIP firmado al API REST de GRE SUNAT y obtiene el numTicket
 */
export async function enviarGreApiRest(empresa, nombreBaseCpe, zipBuffer) {
  const token = await obtenerTokenOAuth2Gre(empresa);

  // El API REST de GRE exige el hash SHA-256 en hexadecimal del archivo .zip completo
  const hashZip = crypto.createHash('sha256').update(zipBuffer).digest('hex');
  const arcGreZip = zipBuffer.toString('base64');

  const baseUrl =
    empresa.modo_sunat === 'PRODUCCION'
      ? 'https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes'
      : 'https://gre-test.nubefact.com/v1/contribuyente/gem/comprobantes';

  const response = await fetch(`${baseUrl}/${nombreBaseCpe}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      archivo: {
        nomArchivo: `${nombreBaseCpe}.zip`,
        arcGreZip,
        hashZip,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Error al enviar GRE ${nombreBaseCpe} (HTTP ${response.status}): ${errBody}`);
  }

  // Devuelve { numTicket: '...', fecRecepcion: '...' }
  return response.json();
}

/**
 * 4. Consulta el estado del numTicket de la GRE, guarda el CDR y extrae la URL oficial del QR de SUNAT
 */
export async function consultarTicketGreApiRest(empresa, numTicket, nombreBaseCpe, xmlCdrExtractorFn) {
  const token = await obtenerTokenOAuth2Gre(empresa);

  const enviosUrl =
    empresa.modo_sunat === 'PRODUCCION'
      ? `https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes/envios/${numTicket}`
      : `https://gre-test.nubefact.com/v1/contribuyente/gem/comprobantes/envios/${numTicket}`;

  const response = await fetch(enviosUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Error al consultar ticket GRE ${numTicket}: HTTP ${response.status}`);
  }

  const data = await response.json();

  // codRespuesta: '98' = En proceso | '0' = Aceptado | '99' = Proceso con error
  if (data.codRespuesta === '98') {
    return {
      estado_sunat: 'PROCESANDO_ENVIO',
      numTicket,
      mensaje: 'El ticket GRE sigue en procesamiento por SUNAT (Código 98).',
    };
  }

  if (data.codRespuesta === '99' && !data.arcCdr) {
    return {
      estado_sunat: 'RECHAZADO',
      codigo_sunat: data.error?.numError || '99',
      mensaje: data.error?.desError || 'Rechazo reportado en ticket GRE.',
    };
  }

  let cdrFilename = null;
  let qrUrlOficialSunat = null;
  let qrImagenBase64 = null;

  if (data.arcCdr) {
    cdrFilename = `R-${nombreBaseCpe}.zip`;
    const cdrSafePath = resolveSafeTenantPath(STORAGE_ROOT, empresa.id, cdrFilename);
    await fs.mkdir(path.dirname(cdrSafePath), { recursive: true });

    const cdrZipBuffer = Buffer.from(data.arcCdr, 'base64');
    await fs.writeFile(cdrSafePath, cdrZipBuffer);

    // Extraer el contenido XML del CDR para leer el nodo <cbc:DocumentDescription> con la URL del QR oficial
    let cdrXmlText = '';
    try {
      const zip = new AdmZip(cdrZipBuffer);
      const entries = zip.getEntries();
      for (const entry of entries) {
        if (entry.entryName.endsWith('.xml')) {
          cdrXmlText = zip.readAsText(entry);
          break;
        }
      }
    } catch (_) {
      cdrXmlText =
        typeof xmlCdrExtractorFn === 'function'
          ? await xmlCdrExtractorFn(cdrZipBuffer)
          : cdrZipBuffer.toString('utf8');
    }

    const qrMatch = cdrXmlText.match(
      /<cbc:DocumentDescription>\s*(https?:\/\/[^\s<]+)\s*<\/cbc:DocumentDescription>/i
    );
    if (qrMatch?.[1]) {
      qrUrlOficialSunat = qrMatch[1].trim();
      if (typeof generarQrBase64 === 'function') {
        qrImagenBase64 = await generarQrBase64(qrUrlOficialSunat);
      }
    }
  }

  return {
    estado_sunat: data.codRespuesta === '0' ? 'ACEPTADO' : 'RECHAZADO',
    codigo_sunat: data.codRespuesta,
    cdr_filename: cdrFilename,
    qr_url_oficial_sunat: qrUrlOficialSunat,
    qr_imagen_base64: qrImagenBase64,
    mensaje:
      data.codRespuesta === '0'
        ? 'Guía de Remisión Electrónica aceptada con QR oficial SUNAT.'
        : data.error?.desError || 'Observada/Rechazada',
  };
}

export default {
  obtenerTokenOAuth2Gre,
  construirXmlGreUBL21,
  enviarGreApiRest,
  consultarTicketGreApiRest,
};
