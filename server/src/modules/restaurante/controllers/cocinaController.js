import { Orden, OrdenDetalle, Mesa, Producto } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';
import { emitTenantEvent } from '../../../core/services/realtime.service.js';

export const getComandasCocina = async (req, res, next) => {
  try {
    const ordenes = await Orden.findAll({
      where: {
        empresa_id: req.empresa_id,
        status: ['pending', 'cooking'],
      },
      include: [
        { model: Mesa, as: 'mesa', attributes: ['id', 'name'] },
        { model: Usuario, as: 'mozo', attributes: ['id', 'nombre'] },
        {
          model: OrdenDetalle,
          as: 'detalles',
          where: { status: ['pending', 'cooking', 'ready'] },
          required: true,
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      comandas: ordenes,
    });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const detalle = await OrdenDetalle.findByPk(id, {
      include: [{ model: Orden, as: 'orden', where: { empresa_id: req.empresa_id } }],
    });

    if (!detalle) {
      return res.status(404).json({ success: false, message: 'Item de comanda no encontrado.' });
    }

    await detalle.update({ status });

    const hermanos = await OrdenDetalle.findAll({
      where: { order_id: detalle.order_id },
    });

    const todosListos = hermanos.every((h) => h.status === 'ready' || h.status === 'served');
    if (todosListos) {
      await Orden.update(
        { status: 'served' },
        { where: { id: detalle.order_id, empresa_id: req.empresa_id } }
      );
    }

    // Notificar en tiempo real a todas las pantallas KDS y Salón del restaurante
    emitTenantEvent(req.empresa_id, 'kds:updated', {
      order_id: detalle.order_id,
      item_id: detalle.id,
      status,
      todos_listos: todosListos,
    }, req.sucursal_id);

    res.json({
      success: true,
      message: `Estado de plato actualizado a ${status}`,
      detalle,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getComandasCocina,
  cambiarEstadoItem,
};
