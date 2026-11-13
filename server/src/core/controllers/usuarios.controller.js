import bcrypt from 'bcryptjs';
import { Usuario, Sucursal, Rol } from '../models/index.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';

export async function listarUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      where: { empresa_id: req.empresa_id },
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Rol, as: 'rol_obj', attributes: ['id', 'nombre', 'permisos'] },
      ],
      order: [['created_at', 'ASC']],
    });
    res.json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function crearUsuario(req, res) {
  try {
    const {
      nombre,
      email,
      password,
      rol,
      sucursal_id,
      tipo_documento,
      numero_documento,
      telefono,
    } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nombre, email y contraseña son obligatorios' });
    }

    const emailExistente = await Usuario.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (emailExistente) {
      return res.status(400).json({ success: false, error: 'El correo electrónico ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const nuevo = await Usuario.create({
      empresa_id: req.empresa_id,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      rol: rol || 'Operador',
      sucursal_id: sucursal_id ? Number(sucursal_id) : null,
      tipo_documento: tipo_documento || 'DNI',
      numero_documento: numero_documento?.trim() || null,
      telefono: telefono?.trim() || null,
      activo: true,
    });

    await registrarAuditoria({
      modulo: 'administracion',
      accion: 'CREAR_USUARIO',
      entidad: 'Usuario',
      entidad_id: nuevo.id,
      detalles: { nombre: nuevo.nombre, email: nuevo.email, rol: nuevo.rol },
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        id: nuevo.id,
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
        activo: nuevo.activo,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre,
      email,
      password,
      rol,
      sucursal_id,
      tipo_documento,
      numero_documento,
      telefono,
      activo,
    } = req.body;

    const usuario = await Usuario.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (email && email.trim().toLowerCase() !== usuario.email) {
      const emailDuplicado = await Usuario.findOne({
        where: { email: email.trim().toLowerCase() },
      });
      if (emailDuplicado) {
        return res.status(400).json({ success: false, error: 'El correo ya pertenece a otro usuario' });
      }
      usuario.email = email.trim().toLowerCase();
    }

    if (password && password.trim().length > 0) {
      usuario.password_hash = await bcrypt.hash(password, 10);
    }

    if (nombre) usuario.nombre = nombre.trim();
    if (rol) usuario.rol = rol;
    if (sucursal_id !== undefined) usuario.sucursal_id = sucursal_id ? Number(sucursal_id) : null;
    if (tipo_documento) usuario.tipo_documento = tipo_documento;
    if (numero_documento !== undefined) usuario.numero_documento = numero_documento?.trim() || null;
    if (telefono !== undefined) usuario.telefono = telefono?.trim() || null;
    if (activo !== undefined) usuario.activo = Boolean(activo);

    await usuario.save();

    await registrarAuditoria({
      modulo: 'administracion',
      accion: 'ACTUALIZAR_USUARIO',
      entidad: 'Usuario',
      entidad_id: usuario.id,
      detalles: { nombre: usuario.nombre, rol: usuario.rol, activo: usuario.activo },
      req,
    });

    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Evitar que el usuario se elimine a sí mismo
    if (req.user.id === usuario.id) {
      return res.status(400).json({ success: false, error: 'No puedes eliminar tu propio usuario' });
    }

    await usuario.destroy();

    await registrarAuditoria({
      modulo: 'administracion',
      accion: 'ELIMINAR_USUARIO',
      entidad: 'Usuario',
      entidad_id: id,
      detalles: { nombre: usuario.nombre, email: usuario.email },
      req,
    });

    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

