// server/src/core/services/paymentWebhookVerifier.js
import crypto from 'node:crypto';

const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000; // Tolerancia máxima de 5 minutos contra Replay Attacks

function safeCompareHex(expectedHex, receivedHex) {
  const a = Buffer.from(String(expectedHex || ''), 'hex');
  const b = Buffer.from(String(receivedHex || ''), 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * 1. MERCADO PAGO: Valida header x-signature (formato: ts=...,v1=...)
 * Manifiesto oficial MP: "id:[data.id];request-id:[x-request-id];ts:[ts];"
 */
export function verifyMercadoPagoWebhook(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  const xSignature = req.headers['x-signature'] || '';
  const xRequestId = req.headers['x-request-id'] || '';
  const dataId = req.query?.['data.id'] || req.body?.data?.id || '';

  if (!secret || !xSignature || !dataId) return false;

  const parts = Object.fromEntries(
    xSignature.split(',').map((item) => item.trim().split('='))
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // Protección contra Replay Attack (> 5 min)
  if (Math.abs(Date.now() - Number(ts) * 1000) > MAX_WEBHOOK_AGE_MS) {
    return false;
  }

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  return safeCompareHex(expectedHmac, v1);
}

/**
 * 2. IZIPAY (Perú - API REST v4 Krypton IPN): Valida kr-hash con HMAC-SHA256 sobre kr-answer
 */
export function verifyIzipayWebhook(req) {
  const hmacKey = process.env.IZIPAY_HMAC_SHA256_KEY;
  const krAnswer = req.body?.['kr-answer'];
  const krHash = req.body?.['kr-hash'];
  const krAlgorithm = req.body?.['kr-hash-algorithm'];

  if (!hmacKey || !krAnswer || !krHash || krAlgorithm !== 'sha256_hmac') {
    return false;
  }

  const expectedHmac = crypto
    .createHmac('sha256', hmacKey)
    .update(String(krAnswer), 'utf8')
    .digest('hex');

  return safeCompareHex(expectedHmac, krHash);
}

/**
 * 3. STRIPE: Valida header stripe-signature (t=...,v1=...) sobre el rawBody
 */
export function verifyStripeWebhook(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sigHeader = req.headers['stripe-signature'] || '';
  const rawBody = req.rawBody;

  if (!secret || !sigHeader || !rawBody) return false;

  const parts = Object.fromEntries(
    sigHeader.split(',').map((item) => item.trim().split('='))
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  if (Math.abs(Date.now() - Number(timestamp) * 1000) > MAX_WEBHOOK_AGE_MS) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return safeCompareHex(expectedHmac, signature);
}

export default {
  verifyMercadoPagoWebhook,
  verifyIzipayWebhook,
  verifyStripeWebhook,
};
