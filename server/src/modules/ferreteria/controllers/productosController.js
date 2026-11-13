import { Op, col, where as seqWhere } from 'sequelize';
import { Producto, Categoria, Proveedor, InventarioMovimiento } from '../models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getProductos = async (req, res, next) => {
  try {
    const { busqueda, id_categoria, stock_bajo, es_material, limit = 100, page = 1 } = req.query;
    const whereClause = { activo: true };

    if (req.empresa_id) {
      whereClause.empresa_id = req.empresa_id;
    }

    if (es_material === 'true' || es_material === true) {
      whereClause.es_material_construccion = true;
    }

    if (busqueda) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { codigo_barras: { [Op.like]: `%${busqueda}%` } },
        { descripcion: { [Op.like]: `%${busqueda}%` } },
        { marca: { [Op.like]: `%${busqueda}%` } },
      ];
    }

    if (id_categoria) {
      whereClause.id_categoria = id_categoria;
    }

    if (stock_bajo === 'true') {
      whereClause[Op.and] = seqWhere(col('stock'), '<=', col('stock_minimo'));
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: productos } = await Producto.findAndCountAll({
      where: whereClause,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social', 'ruc'] },
      ],
      order: [['nombre', 'ASC']],
      limit: parseInt(limit, 10),
      offset,
    });

    res.json({
      success: true,
      total: count,
      paginas: Math.ceil(count / parseInt(limit, 10)),
      paginaActual: parseInt(page, 10),
      productos,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategorias = async (req, res, next) => {
  try {
    const whereClause = { activo: true };
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const categorias = await Categoria.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']],
    });
    res.json({ success: true, categorias });
  } catch (error) {
    next(error);
  }
};

export const getProductoPorCodigo = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const whereClause = { codigo_barras: codigo, activo: true };
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const producto = await Producto.findOne({
      where: whereClause,
      include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }],
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `No se encontró ningún producto con el código "${codigo}".`,
      });
    }

    res.json({ success: true, producto });
  } catch (error) {
    next(error);
  }
};

export const getProductoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id, activo: true };
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const producto = await Producto.findOne({
      where: whereClause,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social', 'ruc'] },
      ],
    });

    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    res.json({ success: true, producto });
  } catch (error) {
    next(error);
  }
};

export const crearProducto = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      stock: parseFloat(req.body.stock) || 0,
      stock_minimo: parseFloat(req.body.stock_minimo) || 5,
      precio_compra: parseFloat(req.body.precio_compra) || 0,
      precio_venta: parseFloat(req.body.precio_venta) || 0,
      precio_mayorista: req.body.precio_mayorista ? parseFloat(req.body.precio_mayorista) : null,
      activo: true,
    };

    const nuevo = await Producto.create(payload);

    // Registro en Kardex si hubo stock inicial
    if (nuevo.stock > 0) {
      await InventarioMovimiento.create({
        empresa_id: req.empresa_id,
        sucursal_id: req.sucursal_id || null,
        id_producto: nuevo.id,
        id_usuario: req.user ? req.user.id : 1,
        tipo: 'Entrada',
        cantidad: nuevo.stock,
        stock_antes: 0,
        stock_despues: nuevo.stock,
        motivo: 'Inventario Inicial al dar de alta el producto',
      });
    }

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'CREAR_PRODUCTO',
      entidad: 'Producto',
      entidad_id: nuevo.id,
      detalles: { nombre: nuevo.nombre, stock: nuevo.stock, precio: nuevo.precio_venta },
      req,
    });

    res.status(201).json({ success: true, producto: nuevo });
  } catch (error) {
    next(error);
  }
};

export const actualizarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereClause = { id };
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const prod = await Producto.findOne({ where: whereClause });
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
    const whereClause = { id };
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const prod = await Producto.findOne({ where: whereClause });
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    await prod.update({ activo: false });
    res.json({ success: true, message: 'Producto deshabilitado del catálogo.' });
  } catch (error) {
    next(error);
  }
};

export const crearCategoria = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const cat = await Categoria.create({
      empresa_id: req.empresa_id,
      nombre,
      descripcion,
      activo: true,
    });
    res.status(201).json({ success: true, categoria: cat });
  } catch (error) {
    next(error);
  }
};

export default {
  getProductos,
  getCategorias,
  getProductoPorCodigo,
  getProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  crearCategoria,
};

