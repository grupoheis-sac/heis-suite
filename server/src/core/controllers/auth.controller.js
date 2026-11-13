import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario, Empresa, Sucursal, Rol } from '../models/index.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'heis_suite_super_secure_jwt_token_key_2026_enterprise_saas';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
    }

    const usuario = await Usuario.findOne({
      where: { email: email.trim().toLowerCase() },
      include: [
        { model: Empresa, as: 'empresa' },
        { model: Sucursal, as: 'sucursal' },
        { model: Rol, as: 'rol_obj' },
      ],
    });

    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ success: false, error: 'Usuario deshabilitado en el sistema' });
    }

    // Verificar si la empresa está activa (si no es SuperAdmin)
    if (usuario.empresa && !usuario.empresa.activo) {
      return res.status(403).json({ success: false, error: 'La suscripción de la empresa se encuentra suspendida' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Actualizar último acceso
    usuario.ultimo_acceso = new Date();
    await usuario.save();

    // Generar Token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        empresa_id: usuario.empresa_id,
        sucursal_id: usuario.sucursal_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Registrar en auditoría
    await registrarAuditoria({
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre,
      usuario_rol: usuario.rol,
      modulo: 'seguridad',
      accion: 'LOGIN',
      entidad: 'Usuario',
      entidad_id: usuario.id,
      detalles: { mensaje: 'Inicio de sesión exitoso' },
      req,
    });

    const userPayload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      tipo_documento: usuario.tipo_documento,
      numero_documento: usuario.numero_documento,
      telefono: usuario.telefono,
      empresa_id: usuario.empresa_id,
      sucursal_id: usuario.sucursal_id,
      sucursal: usuario.sucursal,
      permisos: usuario.rol_obj?.permisos || {},
    };

    return res.json({
      success: true,
      data: {
        token,
        user: userPayload,
        empresa: usuario.empresa,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error interno en el servidor' });
  }
}

export async function getProfile(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Empresa, as: 'empresa' },
        { model: Sucursal, as: 'sucursal' },
        { model: Rol, as: 'rol_obj' },
      ],
    });

    res.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

