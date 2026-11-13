import { Op } from 'sequelize';
import {
  Proveedor,
  Compra,
  CompraDetalle,
  Producto,
  InventarioMovimiento,
  OrdenCompra,
  OrdenCompraDetalle,
} from '../models/index.js';
import sequelize from '../../../config/db.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

// ================= PROVEEDORES =================

export const getProveedores = async (req, res, next) => {
  try {
    const whereClause = { activo: true };
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const { busqueda } = req.query;
    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim();
      whereClause[Op.or] = [
        { razon_social: { [Op.like]: `%${q}%` } },
        { ruc: { [Op.like]: `%${q}%` } },
        { numero_documento: { [Op.like]: `%${q}%` } },
        { contacto: { [Op.like]: `%${q}%` } },
        { categoria_rubro: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { telefono: { [Op.like]: `%${q}%` } },
      ];
    }

    const proveedores = await Proveedor.findAll({
      where: whereClause,
      order: [['razon_social', 'ASC']],
    });

    const resultado = proveedores.map((p) => {
      const data = p.toJSON();
      if (!data.numero_documento && data.ruc) {
        data.numero_documento = data.ruc;
      }
      return data;
    });

    res.json({ success: true, proveedores: resultado });
  } catch (error) {
    next(error);
  }
};

export const crearProveedor = async (req, res, next) => {
  try {
    const numDoc = req.body.numero_documento || req.body.ruc || '';
    const prov = await Proveedor.create({
      ...req.body,
      ruc: numDoc,
      numero_documento: numDoc,
      empresa_id: req.empresa_id || 1,
      activo: true,
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'CREAR_PROVEEDOR',
      entidad: 'Proveedor',
      entidad_id: prov.id,
      detalles: { razon_social: prov.razon_social, ruc: prov.ruc },
      req,
    });

    res.status(201).json({ success: true, proveedor: prov });
  } catch (error) {
    next(error);
  }
};

export const actualizarProveedor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const prov = await Proveedor.findOne({ where });
    if (!prov) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
    }

    const numDoc = req.body.numero_documento || req.body.ruc || prov.ruc;
    await prov.update({
      ...req.body,
      ruc: numDoc,
      numero_documento: numDoc,
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'ACTUALIZAR_PROVEEDOR',
      entidad: 'Proveedor',
      entidad_id: prov.id,
      detalles: { razon_social: prov.razon_social, ruc: prov.ruc },
      req,
    });

    res.json({ success: true, proveedor: prov });
  } catch (error) {
    next(error);
  }
};

export const eliminarProveedor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const prov = await Proveedor.findOne({ where });
    if (!prov) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
    }

    await prov.update({ activo: false });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'ELIMINAR_PROVEEDOR',
      entidad: 'Proveedor',
      entidad_id: prov.id,
      detalles: { razon_social: prov.razon_social },
      req,
    });

    res.json({ success: true, message: 'Proveedor dado de baja exitosamente.' });
  } catch (error) {
    next(error);
  }
};

// ================= COMPRAS =================

export const getCompras = async (req, res, next) => {
  try {
    const whereClause = {};
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const compras = await Compra.findAll({
      where: whereClause,
      include: [
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social', 'ruc'] },
        {
          model: CompraDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'unidad_medida'] }],
        },
        { model: OrdenCompra, as: 'orden_compra', attributes: ['id', 'codigo'], required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    res.json({ success: true, compras });
  } catch (error) {
    next(error);
  }
};

export const crearCompra = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      id_proveedor,
      serie,
      numero,
      tipo_comprobante = 'Factura',
      guia_remision,
      id_orden_compra,
      observaciones,
      items = [],
    } = req.body;

    const subtotal = items.reduce(
      (acc, it) => acc + parseFloat(it.cantidad || 0) * parseFloat(it.costo_unitario || it.precio_unitario || 0),
      0
    );
    const igv = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + igv).toFixed(2));

    const compra = await Compra.create(
      {
        empresa_id: req.empresa_id || 1,
        sucursal_id: req.sucursal_id || null,
        id_proveedor: Number(id_proveedor),
        id_orden_compra: id_orden_compra ? Number(id_orden_compra) : null,
        id_usuario: req.user ? req.user.id : 1,
        serie: serie || 'F001',
        numero,
        tipo_comprobante,
        guia_remision: guia_remision || null,
        observaciones: observaciones || null,
        subtotal,
        igv,
        total,
        estado: 'Registrada',
      },
      { transaction: t }
    );

    // Sumar stock de cada producto ingresado y registrar en Kardex
    for (const it of items) {
      const prod = await Producto.findByPk(it.id_producto, { transaction: t });
      if (prod) {
        const stockAntes = parseFloat(prod.stock) || 0;
        const cant = parseFloat(it.cantidad);
        const costoUnit = parseFloat(it.costo_unitario || it.precio_unitario || prod.precio_compra);
        const stockDespues = parseFloat((stockAntes + cant).toFixed(3));

        await prod.update(
          {
            stock: stockDespues,
            precio_compra: costoUnit,
          },
          { transaction: t }
        );

        await InventarioMovimiento.create(
          {
            empresa_id: req.empresa_id || 1,
            sucursal_id: req.sucursal_id || null,
            id_producto: prod.id,
            id_usuario: req.user ? req.user.id : 1,
            tipo: 'Entrada',
            cantidad: cant,
            stock_antes: stockAntes,
            stock_despues: stockDespues,
            motivo: `Compra ${tipo_comprobante} ${serie || 'F001'}-${numero}`,
          },
          { transaction: t }
        );

        await CompraDetalle.create(
          {
            id_compra: compra.id,
            id_producto: prod.id,
            cantidad: cant,
            costo_unitario: costoUnit,
            subtotal: parseFloat((cant * costoUnit).toFixed(2)),
          },
          { transaction: t }
        );
      }
    }

    // Si la compra proviene de una Orden de Compra, actualizar la orden
    if (id_orden_compra) {
      const oc = await OrdenCompra.findByPk(id_orden_compra, {
        include: [{ model: OrdenCompraDetalle, as: 'detalles' }],
        transaction: t,
      });

      if (oc) {
        for (const it of items) {
          const det = (oc.detalles || []).find((d) => d.id_producto === it.id_producto);
          if (det) {
            const yaRec = parseFloat(det.cantidad_recibida || 0);
            const cantNueva = parseFloat(it.cantidad || 0);
            await det.update(
              { cantidad_recibida: parseFloat((yaRec + cantNueva).toFixed(3)) },
              { transaction: t }
            );
          }
        }

        // Revisar si todos los ítems fueron recibidos
        const detallesActualizados = await OrdenCompraDetalle.findAll({
          where: { id_orden_compra: oc.id },
          transaction: t,
        });
        const todosRecibidos = detallesActualizados.every(
          (d) => parseFloat(d.cantidad_recibida || 0) >= parseFloat(d.cantidad || 0)
        );

        await oc.update(
          { estado: todosRecibidos ? 'Recepcionada' : 'Recepcion Parcial' },
          { transaction: t }
        );
      }
    }

    await t.commit();

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'REGISTRAR_COMPRA',
      entidad: 'Compra',
      entidad_id: compra.id,
      detalles: { comprobante: `${tipo_comprobante} ${serie}-${numero}`, total },
      req,
    });

    res.status(201).json({ success: true, compra });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export default {
  getProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  getCompras,
  crearCompra,
};
