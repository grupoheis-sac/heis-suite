import { ProductoHotel } from '../models/index.js';

export const getProductos = async (req, res) => {
  try {
    const { categoria } = req.query;
    const whereClause = {
      activo: true,
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (categoria) whereClause.categoria = categoria;

    const productos = await ProductoHotel.findAll({
      where: whereClause,
      order: [['categoria', 'ASC'], ['nombre', 'ASC']]
    });

    res.json({ success: true, data: productos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearProducto = async (req, res) => {
  try {
    const prod = await ProductoHotel.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
      sucursal_id: req.sucursal_id || 1,
    });
    res.status(201).json({ success: true, data: prod });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

