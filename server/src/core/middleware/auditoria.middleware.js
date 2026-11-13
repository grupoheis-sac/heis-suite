import { AuditoriaLog } from '../models/index.js';

export function normalizarIP(rawIp) {
  if (!rawIp) return '127.0.0.1';
  let ip = String(rawIp).trim();
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

export async function registrarAuditoria({
  empresa_id,
  usuario_id,
  usuario_nombre,
  usuario_rol,
  modulo,
  accion,
  entidad,
  entidad_id,
  detalles,
  req,
}) {
  try {
    const rawIp = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip) : null;
    const ip = normalizarIP(rawIp);
    const navegador = req ? req.headers['user-agent'] : null;

    await AuditoriaLog.create({
      empresa_id: empresa_id || (req ? req.empresa_id : null),
      usuario_id: usuario_id || (req && req.user ? req.user.id : null),
      usuario_nombre: usuario_nombre || (req && req.user ? req.user.nombre : 'Sistema'),
      usuario_rol: usuario_rol || (req && req.user ? req.user.rol : 'Sistema'),
      modulo,
      accion,
      entidad,
      entidad_id: entidad_id ? String(entidad_id) : null,
      detalles: typeof detalles === 'object' ? JSON.stringify(detalles) : detalles,
      ip,
      navegador,
    });
  } catch (error) {
    console.error('Error registrando auditoría:', error.message);
  }
}

