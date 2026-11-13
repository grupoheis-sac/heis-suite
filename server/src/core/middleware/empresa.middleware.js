import { Empresa } from '../models/index.js';

/**
 * Middleware Multi-Tenant que inyecta y valida el contexto de Empresa
 * Para SuperAdmin permite simular o actuar sobre cualquier empresa enviando 'X-Empresa-ID'
 * Para usuarios regulares aísla automáticamente a su propia empresa.
 */
export async function tenantContext(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    let empresaId = req.user.empresa_id;

    // Si es SuperAdmin, puede especificar una empresa objetivo en la cabecera
    if (req.user.rol === 'superadmin') {
      const headerEmpresaId = req.headers['x-empresa-id'];
      if (headerEmpresaId && headerEmpresaId !== 'null' && headerEmpresaId !== 'undefined' && headerEmpresaId !== 'global') {
        const parsed = Number(headerEmpresaId);
        if (!isNaN(parsed) && parsed > 0) {
          empresaId = parsed;
        } else {
          empresaId = null;
        }
      } else {
        empresaId = null;
      }
    }

    if (!empresaId) {
      if (req.user.rol === 'superadmin') {
        // SuperAdmin en modo plataforma global
        req.empresa_id = null;
        req.empresa = null;
        return next();
      }
      return res.status(403).json({ success: false, error: 'Usuario sin empresa asignada' });
    }

    const empresa = await Empresa.findByPk(empresaId);
    if (!empresa || !empresa.activo) {
      return res.status(403).json({ success: false, error: 'Empresa no encontrada o inactiva' });
    }

    req.empresa_id = empresa.id;
    req.empresa = empresa;
    next();
  } catch (error) {
    console.error('Error en tenantContext middleware:', error);
    res.status(500).json({ success: false, error: 'Error interno en contexto de empresa' });
  }
}

