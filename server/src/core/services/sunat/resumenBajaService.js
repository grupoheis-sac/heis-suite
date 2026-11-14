// server/src/core/services/sunat/resumenBajaService.js

/**
 * 1. Genera el XML SummaryDocuments (RC-YYYYMMDD-#####) para envío o anulación masiva de Boletas (03)
 * @param {Object} params
 * @param {Object} params.empresa           Instancia del Tenant emisor
 * @param {string} params.identificadorLote Formato: RC-20261114-00001
 * @param {string} params.fechaReferencia   Fecha de emisión de las boletas (YYYY-MM-DD)
 * @param {string} params.fechaGeneracion   Fecha de generación del resumen (YYYY-MM-DD)
 * @param {Array}  params.comprobantes      Lista de boletas/notas (máx. 500 por lote)
 * @param {number} params.conditionCode     1 = Adicionar | 2 = Modificar | 3 = Anular (Baja de Boleta)
 */
export function construirXmlResumenDiarioRC({
  empresa,
  identificadorLote,
  fechaReferencia,
  fechaGeneracion = new Date().toISOString().slice(0, 10),
  comprobantes = [],
  conditionCode = 3, // Por defecto 3 = Anulación masiva de Boletas
}) {
  if (comprobantes.length === 0 || comprobantes.length > 500) {
    throw new Error('Un Resumen Diario (RC) debe contener entre 1 y 500 comprobantes.');
  }

  const lineasXml = comprobantes
    .map((cpe, idx) => {
      const numeroSerieCorrelativo = `${cpe.serie}-${String(cpe.correlativo).padStart(8, '0')}`;
      const moneda = cpe.moneda || 'PEN';
      const total = Number(cpe.total || 0).toFixed(2);
      const gravadas = Number(cpe.op_gravadas ?? (Number(cpe.total || 0) / 1.18)).toFixed(2);
      const exoneradas = Number(cpe.op_exoneradas || 0).toFixed(2);
      const inafectas = Number(cpe.op_inafectas || 0).toFixed(2);
      const igv = Number(cpe.igv ?? (Number(total) - Number(gravadas))).toFixed(2);
      const estadoItem = Number(cpe.condition_code || conditionCode);

      return `<sac:SummaryDocumentsLine>
    <cbc:LineID>${idx + 1}</cbc:LineID>
    <cbc:DocumentTypeCode>${cpe.tipo_comprobante || '03'}</cbc:DocumentTypeCode>
    <cbc:ID>${numeroSerieCorrelativo}</cbc:ID>
    <cac:AccountingCustomerParty>
      <cbc:CustomerAssignedAccountID>${cpe.cliente_documento || '00000000'}</cbc:CustomerAssignedAccountID>
      <cbc:AdditionalAccountID>${cpe.cliente_tipo_documento || '1'}</cbc:AdditionalAccountID>
    </cac:AccountingCustomerParty>
    <sac:Status>
      <cbc:ConditionCode>${estadoItem}</cbc:ConditionCode>
    </sac:Status>
    <sac:TotalAmount currencyID="${moneda}">${total}</sac:TotalAmount>
    ${
      Number(gravadas) > 0
        ? `<sac:BillingPayment>
            <cbc:PaidAmount currencyID="${moneda}">${gravadas}</cbc:PaidAmount>
            <cbc:InstructionID>01</cbc:InstructionID>
          </sac:BillingPayment>`
        : ''
    }
    ${
      Number(exoneradas) > 0
        ? `<sac:BillingPayment>
            <cbc:PaidAmount currencyID="${moneda}">${exoneradas}</cbc:PaidAmount>
            <cbc:InstructionID>02</cbc:InstructionID>
          </sac:BillingPayment>`
        : ''
    }
    ${
      Number(inafectas) > 0
        ? `<sac:BillingPayment>
            <cbc:PaidAmount currencyID="${moneda}">${inafectas}</cbc:PaidAmount>
            <cbc:InstructionID>03</cbc:InstructionID>
          </sac:BillingPayment>`
        : ''
    }
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${moneda}">${igv}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxAmount currencyID="${moneda}">${igv}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </sac:SummaryDocumentsLine>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<SummaryDocuments xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1"
                  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
                  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
                  xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.1</cbc:CustomizationID>
  <cbc:ID>${identificadorLote}</cbc:ID>
  <cbc:ReferenceDate>${fechaReferencia}</cbc:ReferenceDate>
  <cbc:IssueDate>${fechaGeneracion}</cbc:IssueDate>
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
  <cac:AccountingSupplierParty>
    <cbc:CustomerAssignedAccountID>${empresa.ruc}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${empresa.razon_social}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  ${lineasXml}
</SummaryDocuments>`;
}

/**
 * 2. Genera el XML VoidedDocuments (RA-YYYYMMDD-#####) para Comunicación de Baja de Facturas (01)
 */
export function construirXmlComunicacionBajaRA({
  empresa,
  identificadorLote, // Formato: RA-20261114-00001
  fechaReferencia,   // Fecha de emisión de las facturas a anular (YYYY-MM-DD)
  fechaGeneracion = new Date().toISOString().slice(0, 10),
  comprobantes = [], // [{ tipo_comprobante: '01', serie: 'F001', correlativo: 120, motivo_baja: 'ERROR EN RUC' }]
}) {
  if (comprobantes.length === 0 || comprobantes.length > 500) {
    throw new Error('Una Comunicación de Baja (RA) debe contener entre 1 y 500 comprobantes.');
  }

  const lineasXml = comprobantes
    .map(
      (cpe, idx) => `<sac:VoidedDocumentsLine>
    <cbc:LineID>${idx + 1}</cbc:LineID>
    <cbc:DocumentTypeCode>${cpe.tipo_comprobante || '01'}</cbc:DocumentTypeCode>
    <sac:DocumentSerialID>${cpe.serie}</sac:DocumentSerialID>
    <sac:DocumentNumberID>${Number(cpe.correlativo)}</sac:DocumentNumberID>
    <sac:VoidReasonDescription><![CDATA[${cpe.motivo_baja || 'ANULACION DE LA OPERACION'}]]></sac:VoidReasonDescription>
  </sac:VoidedDocumentsLine>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<VoidedDocuments xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:VoidedDocuments-1"
                 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
                 xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                 xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
                 xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.0</cbc:CustomizationID>
  <cbc:ID>${identificadorLote}</cbc:ID>
  <cbc:ReferenceDate>${fechaReferencia}</cbc:ReferenceDate>
  <cbc:IssueDate>${fechaGeneracion}</cbc:IssueDate>
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
  <cac:AccountingSupplierParty>
    <cbc:CustomerAssignedAccountID>${empresa.ruc}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${empresa.razon_social}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  ${lineasXml}
</VoidedDocuments>`;
}

export default {
  construirXmlResumenDiarioRC,
  construirXmlComunicacionBajaRA,
};
