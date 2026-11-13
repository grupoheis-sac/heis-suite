import { Orden, OrdenDetalle, Mesa, Producto } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getComandasCocina = async (req, res, next) => {
  try {
    const comandas = await Orden.findAll({
      where: {
        empresa_id: req.empresa_id,
        status: ['pending', 'cooking'],
      },
      include: [
        { model: Mesa, as: 'mesa', attributes: ['name'] },
        { model: Usuario, as: 'mozo', attributes: ['nombre'] },
        {
          model: OrdenDetalle,
          as: 'detalles',
          where: { status: ['pending', 'cooking', 'ready'] },
          required: true,
          include: [{ model: Producto, as: 'producto', attributes: ['name', 'destination'] }],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json({ success: true, comandas });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'cooking', 'ready', 'served'

    const detalle = await OrdenDetalle.findByPk(id, {
      include: [{ model: Orden, as: 'orden', where: { empresa_id: req.empresa_id } }],
    });

    if (!detalle) {
      return res.status(404).json({ success: false, message: 'Item no encontrado' });
    }

    await detalle.update({ status });

    // Revisar si todos los items de la orden están listos o servidos
    const otrosItems = await OrdenDetalle.findAll({ where: { order_id: detalle.order_id } });
    const todosServidos = otrosItems.every((i) => i.status === 'served');
    const todosListos = otrosItems.every((i) => ['ready', 'served'].includes(i.status));

    if (todosServidos) {
      await Orden.update({ status: 'served' }, { where: { id: detalle.order_id } });
    } else if (todosListos) {
      await Orden.update({ status: 'served' }, { where: { id: detalle.order_id } });
    }

    res.json({ success: true, detalle });
  } catch (error) {
    next(error);
  }
};

export default {
  getComandasCocina,
  cambiarEstadoItem,
};

