import { CompraStock, Proveedor } from '../models/index.js';

export const getProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      where: {
        activo: true,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      order: [['razon_social', 'ASC']]
    });
    res.json({ success: true, data: proveedores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearProveedor = async (req, res) => {
  try {
    const nuevo = await Proveedor.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
    });
    res.status(201).json({ success: true, data: nuevo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompras = async (req, res) => {
  try {
    const compras = await CompraStock.findAll({
      where: {
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [{ model: Proveedor, as: 'proveedor' }],
      order: [['fecha', 'DESC']]
    });
    res.json({ success: true, data: compras });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearCompra = async (req, res) => {
  try {
    const compra = await CompraStock.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
      sucursal_id: req.sucursal_id || 1,
    });
    res.status(201).json({ success: true, data: compra });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

