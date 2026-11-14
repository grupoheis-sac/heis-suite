// server/src/core/services/sunat/validezCpeService.js
import { decryptCertPassword } from './certService.js';

const validezTokenCache = new Map();

const MAPA_ESTADO_COMPROBANTE = {
  '0': 'NO_EXISTE',
  '1': 'ACEPTADO',
  '2': 'ANULADO',
  '3': 'AUTORIZADO',
  '4': 'NO_AUTORIZADO',
};

const MAPA_ESTADO_RUC = {
  '00': 'ACTIVO',
  '01': 'BAJA_PROVISIONAL',
  '02': 'BAJA_PROV_POR_OFICIO',
  '03': 'SUSPENSION_TEMPORAL',
  '10': 'BAJA_DEFINITIVA',
  '11': 'BAJA_DE_OFICIO',
  '22': 'INAFECTO',
};

const MAPA_CONDICION_DOMICILIO = {
  '00': 'HABIDO',
  '09': 'PENDIENTE',
  '11': 'POR_VERIFICAR',
  '12': 'NO_HABIDO',
  '20': 'NO_HALLADO',
};

/**
 * Convierte cualquier fecha ISO (YYYY-MM-DD) al formato estricto DD/MM/YYYY requerido por el API de Validez SUNAT
 */
function formatearFechaSunatDDMMYYYY(fechaInput) {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(fechaInput).trim())) {
    return String(fechaInput).trim();
  }
  const iso = String(fechaInput || new Date().toISOString()).slice(0, 10);
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * 1. Obtiene y cachea el token OAuth2 (client_credentials) para el API de Consulta de Validez
 */
async function obtenerTokenValidezOAuth2(empresa) {
  const cacheKey = `validez_token_${empresa.id}`;
  const cached = validezTokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.accessToken;
  }

  const clientId = empresa.sunat_client_id || process.env.SUNAT_VALIDEZ_CLIENT_ID;
  const clientSecret = empresa.sunat_client_secret_cifrado
    ? decryptCertPassword(empresa.sunat_client_secret_cifrado)
    : empresa.sunat_client_secret || process.env.SUNAT_VALIDEZ_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Credenciales OAuth2 de SUNAT (SUNAT_VALIDEZ_CLIENT_ID / CLIENT_SECRET) no configuradas.'
    );
  }

  const tokenUrl = `https://api-seguridad.sunat.gob.pe/v1/clientesextranet/${clientId}/oauth2/token/`;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'https://api.sunat.gob.pe/v1/contribuyente/contribuyentes',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fallo de autenticación OAuth2 Validez SUNAT (${response.status}): ${errText}`);
  }

  const data = await response.json();
  validezTokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  });

  return data.access_token;
}

/**
 * 2. Consulta en tiempo real la validez de un CPE en los servidores de SUNAT
 * @param {Object} empresa Instancia del Tenant que realiza la consulta
 * @param {Object} cpeQuery { ruc_emisor, tipo_comprobante, serie, correlativo, fecha_emision, total }
 */
export async function consultarValidezComprobanteSunat(empresa, cpeQuery) {
  const token = await obtenerTokenValidezOAuth2(empresa);

  const payload = {
    numRuc: String(cpeQuery.ruc_emisor || empresa.ruc).trim(),
    codComp: String(cpeQuery.tipo_comprobante || '01').padStart(2, '0'),
    numeroSerie: String(cpeQuery.serie).trim().toUpperCase(),
    numero: String(Number(cpeQuery.correlativo)),
    fechaEmision: formatearFechaSunatDDMMYYYY(cpeQuery.fecha_emision),
    monto: Number(cpeQuery.total || 0).toFixed(2),
  };

  const url = `https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/${empresa.ruc}/validarcomprobante`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`SUNAT API respondió HTTP ${response.status}: ${errText}`);
    }

    const body = await response.json();
    const data = body.data || {};
    const estadoCpCodigo = String(data.estadoCp ?? '0');
    const estadoRucCodigo = String(data.estadoRuc ?? '');
    const condDomiCodigo = String(data.condDomiRuc ?? '');

    return {
      success: Boolean(body.success),
      es_valido_fiscalmente:
        estadoCpCodigo === '1' && estadoRucCodigo === '00' && condDomiCodigo === '00',
      estado_comprobante: {
        codigo: estadoCpCodigo,
        descripcion: MAPA_ESTADO_COMPROBANTE[estadoCpCodigo] || 'DESCONOCIDO',
      },
      estado_contribuyente: {
        codigo: estadoRucCodigo,
        descripcion: MAPA_ESTADO_RUC[estadoRucCodigo] || 'NO_DISPONIBLE',
      },
      condicion_domicilio: {
        codigo: condDomiCodigo,
        descripcion: MAPA_CONDICION_DOMICILIO[condDomiCodigo] || 'NO_DISPONIBLE',
      },
      observaciones: data.observaciones || [],
      consultado_en: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  consultarValidezComprobanteSunat,
};
