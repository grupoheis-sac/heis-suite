import { Sucursal } from '../models/index.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';

export async function listarSucursales(req, res) {
  try {
    const sucursales = await Sucursal.findAll({
      where: { empresa_id: req.empresa_id },
      order: [['es_principal', 'DESC'], ['created_at', 'ASC']],
    });
    res.json({ success: true, data: sucursales });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function crearSucursal(req, res) {
  try {
    const { nombre, codigo, direccion, telefono, email, ciudad, es_principal } = req.body;

    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre de la sede es obligatorio' });
    }

    if (es_principal) {
      await Sucursal.update(
        { es_principal: false },
        { where: { empresa_id: req.empresa_id } }
      );
    }

    const nueva = await Sucursal.create({
      empresa_id: req.empresa_id,
      nombre: nombre.trim(),
      codigo: codigo?.trim() || null,
      direccion: direccion?.trim() || null,
      telefono: telefono?.trim() || null,
      email: email?.trim() || null,
      ciudad: ciudad?.trim() || null,
      es_principal: Boolean(es_principal),
      activo: true,
    });

    await registrarAuditoria({
      modulo: 'administracion',
      accion: 'CREAR_SEDE',
      entidad: 'Sucursal',
      entidad_id: nueva.id,
      detalles: { nombre: nueva.nombre, es_principal: nueva.es_principal },
      req,
    });

    res.status(201).json({ success: true, data: nueva });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarSucursal(req, res) {
  try {
    const { id } = req.params;
    const { nombre, codigo, direccion, telefono, email, ciudad, es_principal, activo } = req.body;

    const sucursal = await Sucursal.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!sucursal) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada' });
    }

    if (es_principal && !sucursal.es_principal) {
      await Sucursal.update(
        { es_principal: false },
        { where: { empresa_id: req.empresa_id } }
      );
    }

    await sucursal.update({
      nombre: nombre !== undefined ? nombre.trim() : sucursal.nombre,
      codigo: codigo !== undefined ? codigo.trim() : sucursal.codigo,
      direccion: direccion !== undefined ? direccion.trim() : sucursal.direccion,
      telefono: telefono !== undefined ? telefono.trim() : sucursal.telefono,
      email: email !== undefined ? email.trim() : sucursal.email,
      ciudad: ciudad !== undefined ? ciudad.trim() : sucursal.ciudad,
      es_principal: es_principal !== undefined ? Boolean(es_principal) : sucursal.es_principal,
      activo: activo !== undefined ? Boolean(activo) : sucursal.activo,
    });

    await registrarAuditoria({
      modulo: 'administracion',
      accion: 'ACTUALIZAR_SEDE',
      entidad: 'Sucursal',
      entidad_id: sucursal.id,
      detalles: req.body,
      req,
    });

    res.json({ success: true, data: sucursal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function eliminarSucursal(req, res) {
  try {
    const { id } = req.params;

    const sucursal = await Sucursal.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!sucursal) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada' });
    }

    if (sucursal.es_principal) {
      return res.status(400).json({ success: false, error: 'No se puede eliminar la sede principal' });
    }

    await sucursal.destroy();

    await registrarAuditoria({
      modulo: 'administracion',
      accion: 'ELIMINAR_SEDE',
      entidad: 'Sucursal',
      entidad_id: id,
      detalles: { nombre: sucursal.nombre },
      req,
    });

    res.json({ success: true, message: 'Sede eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

