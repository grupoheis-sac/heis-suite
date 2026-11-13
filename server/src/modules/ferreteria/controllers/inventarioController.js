import { Producto, InventarioMovimiento, Categoria } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getResumen = async (req, res, next) => {
  try {
    const productos = await Producto.findAll({
      where: { empresa_id: req.empresa_id, activo: true },
      attributes: ['id', 'stock', 'stock_minimo', 'precio_compra', 'precio_venta', 'unidad_medida'],
    });

    let totalProductos = productos.length;
    let totalStockFisico = 0;
    let valorCostoTotal = 0;
    let valorVentaTotal = 0;
    let quiebresStock = 0;
    let stockBajo = 0;
    let stockOptimo = 0;

    productos.forEach((p) => {
      const stock = parseFloat(p.stock) || 0;
      const min = parseFloat(p.stock_minimo) || 0;
      const pCompra = parseFloat(p.precio_compra) || 0;
      const pVenta = parseFloat(p.precio_venta) || 0;

      totalStockFisico += stock;
      valorCostoTotal += stock * pCompra;
      valorVentaTotal += stock * pVenta;

      if (stock <= 0) {
        quiebresStock++;
      } else if (stock <= min) {
        stockBajo++;
      } else {
        stockOptimo++;
      }
    });

    const gananciaPotencial = valorVentaTotal - valorCostoTotal;
    const margenPorcentaje = valorCostoTotal > 0 ? ((gananciaPotencial / valorCostoTotal) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      resumen: {
        totalProductos,
        totalStockFisico: parseFloat(totalStockFisico.toFixed(2)),
        valorCostoTotal: parseFloat(valorCostoTotal.toFixed(2)),
        valorVentaTotal: parseFloat(valorVentaTotal.toFixed(2)),
        gananciaPotencial: parseFloat(gananciaPotencial.toFixed(2)),
        margenPorcentaje: parseFloat(margenPorcentaje),
        quiebresStock,
        stockBajo,
        stockOptimo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getKardex = async (req, res, next) => {
  try {
    const { id_producto, limit = 100 } = req.query;
    const whereClause = { empresa_id: req.empresa_id };

    if (id_producto) {
      whereClause.id_producto = id_producto;
    }

    const movimientos = await InventarioMovimiento.findAll({
      where: whereClause,
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'codigo_barras', 'unidad_medida'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
    });

    res.json({ success: true, movimientos });
  } catch (error) {
    next(error);
  }
};

export const registrarAjusteStock = async (req, res, next) => {
  try {
    const { id_producto, tipo, cantidad, motivo } = req.body;

    const prod = await Producto.findOne({
      where: { id: id_producto, empresa_id: req.empresa_id },
    });

    if (!prod) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    const cantNum = parseFloat(cantidad);
    const stockAntes = parseFloat(prod.stock) || 0;
    let stockDespues = stockAntes;

    if (tipo === 'Entrada') {
      stockDespues = stockAntes + cantNum;
    } else if (tipo === 'Salida') {
      stockDespues = Math.max(0, stockAntes - cantNum);
    } else if (tipo === 'Ajuste') {
      stockDespues = cantNum;
    }

    await prod.update({ stock: stockDespues });

    const mov = await InventarioMovimiento.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      id_producto: prod.id,
      id_usuario: req.user ? req.user.id : 1,
      tipo,
      cantidad: cantNum,
      stock_antes: stockAntes,
      stock_despues: stockDespues,
      motivo: motivo || 'Ajuste manual de inventario',
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'AJUSTE_INVENTARIO',
      entidad: 'Producto',
      entidad_id: prod.id,
      detalles: { producto: prod.nombre, antes: stockAntes, despues: stockDespues, motivo },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Ajuste de inventario procesado.',
      movimiento: mov,
      nuevoStock: stockDespues,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getResumen,
  getKardex,
  registrarAjusteStock,
};

