import { Op } from 'sequelize';
import { Producto, Categoria } from '../models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getProductos = async (req, res, next) => {
  try {
    const { category_id, q } = req.query;
    const where = { is_active: true };

    if (req.empresa_id) {
      where.empresa_id = req.empresa_id;
    }

    if (category_id) {
      where.category_id = category_id;
    }

    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { barcode: { [Op.like]: `%${q}%` } },
      ];
    }

    const productos = await Producto.findAll({
      where,
      include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });

    res.json({ success: true, productos });
  } catch (error) {
    next(error);
  }
};

export const getCategorias = async (req, res, next) => {
  try {
    const where = { is_active: true };
    if (req.empresa_id) {
      where.empresa_id = req.empresa_id;
    }

    const categorias = await Categoria.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({ success: true, categorias });
  } catch (error) {
    next(error);
  }
};

export const crearProducto = async (req, res, next) => {
  try {
    const { category_id, name, price, cost = 0, stock = 999, destination = 'kitchen', barcode, description, image } = req.body;
    const prod = await Producto.create({
      empresa_id: req.empresa_id,
      category_id,
      name,
      description,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      stock: Number(stock) || 0,
      destination,
      barcode,
      image,
      is_active: true,
    });

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'CREAR_PRODUCTO_CARTA',
      entidad: 'Producto',
      entidad_id: prod.id,
      detalles: { name: prod.name, price: prod.price },
      req,
    });

    res.status(201).json({ success: true, producto: prod });
  } catch (error) {
    next(error);
  }
};

export const actualizarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prod = await Producto.findOne({
      where: { id, empresa_id: req.empresa_id },
    });
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }
    await prod.update(req.body);
    res.json({ success: true, producto: prod });
  } catch (error) {
    next(error);
  }
};

export const eliminarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prod = await Producto.findOne({
      where: { id, empresa_id: req.empresa_id },
    });
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }
    await prod.update({ is_active: false });
    res.json({ success: true, message: 'Producto deshabilitado de la carta.' });
  } catch (error) {
    next(error);
  }
};

export const crearCategoria = async (req, res, next) => {
  try {
    const { name, destination = 'kitchen' } = req.body;
    const cat = await Categoria.create({
      empresa_id: req.empresa_id,
      name,
      destination,
      is_active: true,
    });
    res.status(201).json({ success: true, categoria: cat });
  } catch (error) {
    next(error);
  }
};

export default {
  getProductos,
  getCategorias,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  crearCategoria,
};

