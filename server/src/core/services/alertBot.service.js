// server/src/core/services/alertBot.service.js
import { captureTenantException } from '../../config/sentry.js';

// Mapa de enfriamiento (Cooldown) para evitar tormentas de alertas repetidas
// Clave: dedupKey -> Valor: timestamp del último envío
const alertCooldownMap = new Map();
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos por tipo de incidente/comprobante

function shouldSendAlert(dedupKey, cooldownMs = DEFAULT_COOLDOWN_MS) {
  if (!dedupKey) return true;
  const now = Date.now();
  const lastSent = alertCooldownMap.get(dedupKey) || 0;
  if (now - lastSent < cooldownMs) {
    return false;
  }
  alertCooldownMap.set(dedupKey, now);
  return true;
}

/**
 * Canal 1: Envío a grupo de soporte vía Telegram Bot API
 */
async function sendTelegramMessage(htmlText) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('[ALERT_BOT_TELEGRAM_ERROR]:', err.message);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Canal 2: Envío a WhatsApp de Soporte (Compatible con WhatsApp Cloud API de Meta o Gateway REST/Evolution API)
 */
async function sendWhatsAppMessage(plainText) {
  const webhookUrl = process.env.WHATSAPP_API_URL; // Ej: https://graph.facebook.com/v20.0/{PHONE_ID}/messages o Evolution API
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const supportPhone = process.env.WHATSAPP_SUPPORT_PHONE; // Ej: 51999888777
  if (!webhookUrl || !apiToken || !supportPhone) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const isMetaCloud = webhookUrl.includes('graph.facebook.com');
    const payload = isMetaCloud
      ? {
          messaging_product: 'whatsapp',
          to: supportPhone,
          type: 'text',
          text: { body: plainText },
        }
      : {
          number: supportPhone,
          text: plainText,
        };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
        apikey: apiToken,
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[ALERT_BOT_WHATSAPP_ERROR]:', err.message);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 1. Alerta Inmediata por Comprobante Rechazado o Error Crítico SUNAT
 * Invocar desde server/src/core/services/sunat/contingencyWorker.js
 */
export async function notifySunatRejectionAlert({
  empresa,
  comprobante,
  codigoSunat,
  motivoSunat,
  esCriticoAgotado = false,
}) {
  const numeroSerie = `${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')}`;
  const dedupKey = `sunat_reject_${comprobante.empresa_id}_${numeroSerie}_${codigoSunat}`;

  if (!shouldSendAlert(dedupKey, 15 * 60 * 1000)) return;

  const icono = esCriticoAgotado ? '🚨 [ERROR CRÍTICO 10/10 INTENTOS]' : '⚠️ [RECHAZO TRIBUTARIO SUNAT]';
  const fechaLima = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

  const telegramHtml = [
    `<b>${icono} — HEIS Suite</b>`,
    `<b>Empresa:</b> ${empresa?.razon_social || `ID ${comprobante.empresa_id}`} (RUC: <code>${empresa?.ruc || 'N/A'}</code>)`,
    `<b>Comprobante:</b> <code>${numeroSerie}</code> (Tipo: ${comprobante.tipo_comprobante || comprobante.tipo_documento_codigo})`,
    `<b>Importe Total:</b> S/ ${Number(comprobante.total || 0).toFixed(2)}`,
    `<b>Código SUNAT:</b> <code>${codigoSunat || 'ERR_SOAP'}</code>`,
    `<b>Detalle:</b> ${motivoSunat}`,
    `<b>Hora (Lima):</b> ${fechaLima}`,
  ].join('\n');

  const whatsappText = [
    `${icono} - *HEIS Suite*`,
    `• *Empresa:* ${empresa?.razon_social || `ID ${comprobante.empresa_id}`} (${empresa?.ruc || 'N/A'})`,
    `• *Comprobante:* ${numeroSerie}`,
    `• *Total:* S/ ${Number(comprobante.total || 0).toFixed(2)}`,
    `• *Código SUNAT:* ${codigoSunat || 'ERR_SOAP'}`,
    `• *Motivo:* ${motivoSunat}`,
    `• *Hora:* ${fechaLima}`,
  ].join('\n');

  await Promise.allSettled([
    sendTelegramMessage(telegramHtml),
    sendWhatsAppMessage(whatsappText),
  ]);
}

/**
 * 2. Alerta de Infraestructura Crítica (Caída de MySQL, Excepciones Fatales, Presión de Memoria OOM)
 */
export async function notifyCriticalIncident({
  type = 'SYSTEM_ALERT',
  severity = 'CRITICAL',
  title,
  details,
  empresaId = null,
  dedupKey = null,
}) {
  if (!shouldSendAlert(dedupKey || `${type}_${title}`, DEFAULT_COOLDOWN_MS)) return;

  const fechaLima = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

  const telegramHtml = [
    `🛑 <b>[${severity}] ${title}</b>`,
    `<b>Tipo:</b> <code>${type}</code>`,
    empresaId ? `<b>Tenant ID:</b> <code>${empresaId}</code>` : null,
    `<b>Detalle Técnico:</b> <code>${String(details).slice(0, 600)}</code>`,
    `<b>Servidor:</b> ${process.env.HOSTNAME || 'heis_server'} (${fechaLima})`,
  ]
    .filter(Boolean)
    .join('\n');

  const whatsappText = [
    `🛑 *[${severity}] ${title}*`,
    `• *Tipo:* ${type}`,
    empresaId ? `• *Tenant ID:* ${empresaId}` : null,
    `• *Detalle:* ${String(details).slice(0, 500)}`,
    `• *Hora:* ${fechaLima}`,
  ]
    .filter(Boolean)
    .join('\n');

  captureTenantException(new Error(`[${type}] ${title}: ${details}`), { severity, type });

  await Promise.allSettled([
    sendTelegramMessage(telegramHtml),
    sendWhatsAppMessage(whatsappText),
  ]);
}

export default {
  notifySunatRejectionAlert,
  notifyCriticalIncident,
};
