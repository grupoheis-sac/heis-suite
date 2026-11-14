import { EventEmitter } from 'node:events';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'heis_suite_super_secure_jwt_token_key_2026_enterprise_saas';

class MultiTenantRealtimeHub extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
    // Mapa de clientes conectados: Map<clientId, { res, empresaId, sucursalId, userId, rol }>
    this.clients = new Map();
  }

  addClient(clientId, clientMeta) {
    this.clients.set(clientId, clientMeta);
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  /**
   * Emite un evento en vivo únicamente a los usuarios conectados del mismo Tenant (empresa_id)
   */
  emitToTenant(empresaId, eventName, payload = {}, sucursalId = null) {
    const targetEmpresa = String(empresaId || 'global');
    const packet = JSON.stringify({
      event: eventName,
      empresa_id: empresaId,
      sucursal_id: sucursalId,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    for (const [, client] of this.clients.entries()) {
      const sameTenant =
        String(client.empresaId) === targetEmpresa || client.rol === 'superadmin';

      if (sameTenant) {
        try {
          client.res.write(`event: ${eventName}\n`);
          client.res.write(`data: ${packet}\n\n`);
          // Mensaje en canal genérico para listeners universales
          client.res.write(`data: ${packet}\n\n`);
        } catch (_) {
          // Conexión cerrada
        }
      }
    }
  }

  getStats() {
    return {
      totalConnections: this.clients.size,
    };
  }
}

export const realtimeHub = new MultiTenantRealtimeHub();

export function emitTenantEvent(empresaId, eventName, payload = {}, sucursalId = null) {
  realtimeHub.emitToTenant(empresaId, eventName, payload, sucursalId);
}

/**
 * Controlador SSE (/api/core/realtime/stream)
 * Soporta token por query (?token=...) o cabecera Authorization
 */
export function streamRealtimeEvents(req, res) {
  try {
    const rawToken =
      req.query.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!rawToken) {
      return res.status(401).json({ success: false, error: 'Token requerido para canal en vivo' });
    }

    const decoded = jwt.verify(rawToken, JWT_SECRET);
    const empresaId = req.query.empresa_id || decoded.empresa_id || null;
    const sucursalId = req.query.sucursal_id || decoded.sucursal_id || null;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const clientId = `${decoded.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    realtimeHub.addClient(clientId, {
      res,
      empresaId,
      sucursalId,
      userId: decoded.id,
      rol: decoded.rol,
    });

    // Mensaje inicial de confirmación
    res.write(
      `data: ${JSON.stringify({
        event: 'connected',
        clientId,
        empresa_id: empresaId,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Heartbeat / ping cada 25s para mantener viva la conexión detrás de Nginx/Cloudflare
    const heartbeat = setInterval(() => {
      try {
        res.write(`: ping ${Date.now()}\n\n`);
      } catch (_) {
        clearInterval(heartbeat);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      realtimeHub.removeClient(clientId);
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Sesión inválida para stream en tiempo real' });
  }
}

export default {
  realtimeHub,
  emitTenantEvent,
  streamRealtimeEvents,
};
