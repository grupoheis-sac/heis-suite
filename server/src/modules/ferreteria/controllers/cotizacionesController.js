import { Cotizacion, CotizacionDetalle, Cliente, Producto } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getCotizaciones = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: cotizaciones } = await Cotizacion.findAndCountAll({
      where: { empresa_id: req.empresa_id },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'numero_documento'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        {
          model: CotizacionDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'unidad_medida'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    res.json({
      success: true,
      total: count,
      paginas: Math.ceil(count / parseInt(limit, 10)),
      paginaActual: parseInt(page, 10),
      cotizaciones,
    });
  } catch (error) {
    next(error);
  }
};

export const crearCotizacion = async (req, res, next) => {
  try {
    const { id_cliente, obra, contacto_nombre, contacto_telefono, lugar_entrega, forma_pago, items = [], notas } = req.body;

    const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.cantidad) * parseFloat(it.precio_unitario)), 0);
    const igv = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + igv).toFixed(2));

    const totalCount = await Cotizacion.count({ where: { empresa_id: req.empresa_id } });
    const numero = String(totalCount + 1).padStart(6, '0');

    const nueva = await Cotizacion.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      serie: 'COT',
      numero,
      id_cliente: id_cliente ? Number(id_cliente) : null,
      id_usuario: req.user ? req.user.id : 1,
      obra,
      contacto_nombre,
      contacto_telefono,
      lugar_entrega,
      forma_pago,
      subtotal,
      igv,
      total,
      notas,
      estado: 'Pendiente',
    });

    for (const it of items) {
      await CotizacionDetalle.create({
        id_cotizacion: nueva.id,
        id_producto: it.id_producto || it.id,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        subtotal: parseFloat((it.cantidad * it.precio_unitario).toFixed(2)),
      });
    }

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'CREAR_COTIZACION',
      entidad: 'Cotizacion',
      entidad_id: nueva.id,
      detalles: { numero: `COT-${numero}`, total },
      req,
    });

    res.status(201).json({ success: true, cotizacion: nueva });
  } catch (error) {
    next(error);
  }
};

export default {
  getCotizaciones,
  crearCotizacion,
};

