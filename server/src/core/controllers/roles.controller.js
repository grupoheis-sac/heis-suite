import { Rol, Usuario } from '../models/index.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';

export async function listarRoles(req, res) {
  try {
    const roles = await Rol.findAll({
      where: { empresa_id: req.empresa_id },
      order: [['id', 'ASC']],
    });
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function crearRol(req, res) {
  try {
    const { nombre, descripcion, permisos } = req.body;

    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre del rol es requerido' });
    }

    const nuevo = await Rol.create({
      empresa_id: req.empresa_id,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      permisos: permisos || {},
      es_sistema: false,
    });

    await registrarAuditoria({
      modulo: 'seguridad',
      accion: 'CREAR_ROL',
      entidad: 'Rol',
      entidad_id: nuevo.id,
      detalles: { nombre: nuevo.nombre },
      req,
    });

    res.status(201).json({ success: true, data: nuevo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarRol(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, permisos } = req.body;

    const rol = await Rol.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!rol) {
      return res.status(404).json({ success: false, error: 'Rol no encontrado' });
    }

    if (nombre) rol.nombre = nombre.trim();
    if (descripcion !== undefined) rol.descripcion = descripcion?.trim() || null;
    if (permisos !== undefined) rol.permisos = permisos;

    await rol.save();

    await registrarAuditoria({
      modulo: 'seguridad',
      accion: 'ACTUALIZAR_ROL',
      entidad: 'Rol',
      entidad_id: rol.id,
      detalles: { nombre: rol.nombre },
      req,
    });

    res.json({ success: true, data: rol });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

