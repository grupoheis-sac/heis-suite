import { Op } from 'sequelize';
import { Cliente, Venta } from '../models/index.js';

export const getClientes = async (req, res) => {
  try {
    const { busqueda } = req.query;
    const whereClause = {
      activo: true,
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (busqueda) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { numero_documento: { [Op.like]: `%${busqueda}%` } },
        { telefono: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const clientes = await Cliente.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    res.json({ success: true, data: clientes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const cliente = await Cliente.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
    });
    res.status(201).json({ success: true, data: cliente });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findOne({
      where: {
        id,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [{ model: Venta, as: 'ventas', limit: 10, order: [['fecha', 'DESC']] }]
    });

    if (!cliente) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data: cliente });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    await cliente.update(req.body);
    res.json({ success: true, data: cliente });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

