import { DeliveryPedido, Venta } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getDeliveries = async (req, res) => {
  try {
    const pedidos = await DeliveryPedido.findAll({
      where: {
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [
        { model: Venta, as: 'venta' },
        { model: Usuario, as: 'usuario_despacho', attributes: ['id', 'nombre'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: pedidos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearDelivery = async (req, res) => {
  try {
    const nuevo = await DeliveryPedido.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
      id_usuario_despacho: req.user?.id || 1
    });

    res.status(201).json({ success: true, data: nuevo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarEstadoDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const pedido = await DeliveryPedido.findByPk(id);
    if (!pedido) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    await pedido.update({ estado });
    res.json({ success: true, data: pedido });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

