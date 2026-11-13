/**
 * Middleware de Feature Flags / Módulos Activos
 * Valida que la empresa del usuario tenga contratado y activo el módulo solicitado.
 */
export function requireModulo(moduloNombre) {
  return (req, res, next) => {
    // Si es SuperAdmin, acceso irrestricto
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

    let modulos = [];
    if (empresa.modulos_activos) {
      modulos = typeof empresa.modulos_activos === 'string'
        ? JSON.parse(empresa.modulos_activos)
        : empresa.modulos_activos;
    }

    if (!Array.isArray(modulos) || !modulos.includes(moduloNombre)) {
      return res.status(403).json({
        success: false,
        error: `El módulo '${moduloNombre}' no está contratado o activo para esta empresa. Contáctese con soporte HEIS para activarlo.`,
      });
    }

    next();
  };
}

export default requireModulo;

