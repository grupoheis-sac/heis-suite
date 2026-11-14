import { Empresa } from '../models/index.js';
import {
  tenantStorage,
  getCachedEmpresa,
  setCachedEmpresa,
} from '../context/tenantContext.js';

export async function tenantContext(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    let empresaId = req.user.empresa_id;
    const headerSucursalId = req.headers['x-sucursal-id'];
    const sucursalId = headerSucursalId ? Number(headerSucursalId) : (req.user.sucursal_id || null);

    // Si es SuperAdmin, puede inspeccionar cualquier empresa enviando 'X-Empresa-ID'
    if (req.user.rol === 'superadmin') {
      const headerEmpresaId = req.headers['x-empresa-id'];
      if (
        headerEmpresaId &&
        headerEmpresaId !== 'null' &&
        headerEmpresaId !== 'undefined' &&
        headerEmpresaId !== 'global'
      ) {
        const parsed = Number(headerEmpresaId);
        empresaId = !isNaN(parsed) && parsed > 0 ? parsed : null;
      } else {
        empresaId = null;
      }
    }

    if (!empresaId) {
      if (req.user.rol === 'superadmin') {
        req.empresa_id = null;
        req.sucursal_id = sucursalId;
        req.empresa = null;
        return tenantStorage.run({ empresaId: null, sucursalId, isSuperAdmin: true }, () => next());
      }
      return res.status(403).json({ success: false, error: 'Usuario sin empresa asignada' });
    }

    let empresa = getCachedEmpresa(empresaId);
    if (!empresa) {
      const dbEmpresa = await Empresa.findByPk(empresaId, { skipTenant: true });
      if (dbEmpresa) {
        empresa = dbEmpresa.toJSON();
        setCachedEmpresa(empresaId, empresa);
      }
    }

    if (!empresa || !empresa.activo) {
      return res.status(403).json({
        success: false,
        error: 'Empresa no encontrada o con suscripción suspendida. Contacte a soporte HEIS.',
      });
    }

    req.empresa_id = empresa.id;
    req.sucursal_id = sucursalId;
    req.empresa = empresa;

    return tenantStorage.run(
      {
        empresaId: empresa.id,
        sucursalId,
        isSuperAdmin: req.user.rol === 'superadmin',
      },
      () => next()
    );
  } catch (error) {
    console.error('Error en tenantContext middleware:', error);
    res.status(500).json({ success: false, error: 'Error interno en contexto de empresa' });
  }
}
