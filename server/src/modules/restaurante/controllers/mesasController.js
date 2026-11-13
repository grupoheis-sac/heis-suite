import { Area, Mesa, Orden, OrdenDetalle, Producto } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getAreas = async (req, res, next) => {
  try {
    const whereArea = { is_active: true };
    if (req.empresa_id) whereArea.empresa_id = req.empresa_id;

    const areas = await Area.findAll({
      where: whereArea,
      include: [
        {
          model: Mesa,
          as: 'mesas',
          include: [
            {
              model: Orden,
              as: 'ordenes',
              where: { status: ['pending', 'cooking', 'served'] },
              required: false,
              include: [
                { model: Usuario, as: 'mozo', attributes: ['id', 'nombre', 'email'] },
                {
                  model: OrdenDetalle,
                  as: 'detalles',
                  include: [{ model: Producto, as: 'producto', attributes: ['name', 'price'] }],
                },
              ],
            },
          ],
        },
      ],
      order: [['id', 'ASC']],
    });

    res.json({ success: true, areas });
  } catch (error) {
    next(error);
  }
};

export const getMesaDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const mesa = await Mesa.findOne({
      where,
      include: [
        { model: Area, as: 'area' },
        {
          model: Orden,
          as: 'ordenes',
          where: { status: ['pending', 'cooking', 'served'] },
          required: false,
          include: [
            { model: Usuario, as: 'mozo', attributes: ['id', 'nombre', 'email'] },
            {
              model: OrdenDetalle,
              as: 'detalles',
              include: [{ model: Producto, as: 'producto' }],
            },
          ],
        },
      ],
    });

    if (!mesa) {
      return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
    }

    res.json({ success: true, mesa });
  } catch (error) {
    next(error);
  }
};

export const crearMesa = async (req, res, next) => {
  try {
    const { area_id, name, seats = 4 } = req.body;
    const mesa = await Mesa.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      area_id,
      name,
      seats,
      status: 'available',
    });

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'CREAR_MESA',
      entidad: 'Mesa',
      entidad_id: mesa.id,
      detalles: { name: mesa.name, area_id },
      req,
    });

    res.status(201).json({ success: true, mesa });
  } catch (error) {
    next(error);
  }
};

export const actualizarMesa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const mesa = await Mesa.findOne({ where });
    if (!mesa) {
      return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
    }

    await mesa.update(req.body);
    res.json({ success: true, mesa });
  } catch (error) {
    next(error);
  }
};

export const crearArea = async (req, res, next) => {
  try {
    const { name } = req.body;
    const area = await Area.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      name,
    });

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'CREAR_AREA',
      entidad: 'Area',
      entidad_id: area.id,
      detalles: { name: area.name },
      req,
    });

    res.status(201).json({ success: true, area });
  } catch (error) {
    next(error);
  }
};

export default {
  getAreas,
  getMesaDetalle,
  crearMesa,
  actualizarMesa,
  crearArea,
};

