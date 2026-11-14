function parseModulos(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseSubmodulos(val) {
  if (!val) return {};
  if (typeof val === 'object' && !Array.isArray(val) && val !== null) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Middleware de Feature Flags / Módulos y Submódulos Activos
 * Valida que la empresa tenga activo tanto el giro/módulo como el submódulo granular.
 */
export function requireModulo(moduloNombre, submoduloId = null) {
  return (req, res, next) => {
    if (req.user && req.user.rol === 'superadmin') {
      return next();
    }

    const empresa = req.empresa;
    if (!empresa) {
      return res.status(403).json({
        success: false,
        error: 'No hay contexto de empresa válido para verificar módulos',
      });
    }

    // El módulo 'core' (Caja transversal, Clientes, Administración) está disponible para toda empresa activa
    if (moduloNombre !== 'core') {
      const modulos = parseModulos(empresa.modulos_activos);

      if (!modulos.includes(moduloNombre)) {
        return res.status(403).json({
          success: false,
          error: `El módulo '${moduloNombre}' no está contratado para esta empresa. Contáctese con soporte HEIS para activarlo.`,
        });
      }
    }

    // Validación granular de submódulo si se especifica
    if (submoduloId && empresa.submodulos_activos) {
      const submodulos = parseSubmodulos(empresa.submodulos_activos);

      if (submodulos && submodulos[submoduloId] === false) {
        return res.status(403).json({
          success: false,
          error: `La función '${submoduloId}' está deshabilitada por el administrador de la plataforma.`,
        });
      }
    }

    next();
  };
}

export default requireModulo;
