import { Op } from 'sequelize';
import {
  OrdenCompra,
  OrdenCompraDetalle,
  Proveedor,
  Producto,
  Compra,
  CompraDetalle,
  InventarioMovimiento,
} from '../models/index.js';
import sequelize from '../../../config/db.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getOrdenesCompra = async (req, res, next) => {
  try {
    const whereClause = {};
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const { estado, busqueda } = req.query;

    if (estado && estado !== 'TODOS') {
      whereClause.estado = estado;
    }

    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim();
      whereClause[Op.or] = [
        { codigo: { [Op.like]: `%${q}%` } },
        { observaciones: { [Op.like]: `%${q}%` } },
        { almacen_destino: { [Op.like]: `%${q}%` } },
      ];
    }

    const ordenes = await OrdenCompra.findAll({
      where: whereClause,
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ['id', 'razon_social', 'ruc', 'telefono', 'email'],
        },
        {
          model: OrdenCompraDetalle,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'unidad_medida', 'marca', 'stock', 'precio_compra'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    res.json({ success: true, ordenes });
  } catch (error) {
    next(error);
  }
};

export const crearOrdenCompra = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      id_proveedor,
      fecha_entrega_esperada,
      condicion_pago = 'Contado',
      metodo_envio = 'Flete Proveedor',
      almacen_destino,
      lugar_entrega,
      observaciones,
      items = [],
    } = req.body;

    if (!id_proveedor) {
      return res.status(400).json({ success: false, message: 'El proveedor es requerido.' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe agregar al menos un ítem.' });
    }

    // Generar correlativo de Orden de Compra: OC-2026-0001
    const anio = new Date().getFullYear();
    const count = await OrdenCompra.count({ transaction: t });
    const numeroCorrelativo = String(count + 1).padStart(4, '0');
    const codigo = `OC-${anio}-${numeroCorrelativo}`;

    // Calcular montos
    let subtotal = 0;
    items.forEach((it) => {
      const cant = parseFloat(it.cantidad) || 0;
      const pu = parseFloat(it.precio_unitario) || 0;
      subtotal += cant * pu;
    });
    subtotal = parseFloat(subtotal.toFixed(2));
    const igv = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + igv).toFixed(2));

    const orden = await OrdenCompra.create(
      {
        empresa_id: req.empresa_id || 1,
        sucursal_id: req.sucursal_id || null,
        codigo,
        id_proveedor: Number(id_proveedor),
        id_usuario: req.user ? req.user.id : 1,
        fecha_emision: new Date(),
        fecha_entrega_esperada: fecha_entrega_esperada || null,
        condicion_pago,
        metodo_envio,
        almacen_destino: almacen_destino || null,
        lugar_entrega: lugar_entrega || null,
        observaciones: observaciones || null,
        subtotal,
        igv,
        total,
        estado: 'Pendiente',
      },
      { transaction: t }
    );

    // Crear detalles
    for (const it of items) {
      const cant = parseFloat(it.cantidad) || 0;
      const pu = parseFloat(it.precio_unitario) || 0;
      await OrdenCompraDetalle.create(
        {
          id_orden_compra: orden.id,
          id_producto: it.id_producto,
          cantidad: cant,
          cantidad_recibida: 0,
          precio_unitario: pu,
          subtotal: parseFloat((cant * pu).toFixed(2)),
        },
        { transaction: t }
      );
    }

    await t.commit();

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'CREAR_ORDEN_COMPRA',
      entidad: 'OrdenCompra',
      entidad_id: orden.id,
      detalles: { codigo, total },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Orden de compra ${codigo} generada exitosamente.`,
      orden,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const cambiarEstadoOrdenCompra = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const orden = await OrdenCompra.findOne({ where });
    if (!orden) {
      return res.status(404).json({ success: false, message: 'Orden de compra no encontrada.' });
    }

    await orden.update({ estado });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'ACTUALIZAR_ESTADO_OC',
      entidad: 'OrdenCompra',
      entidad_id: orden.id,
      detalles: { codigo: orden.codigo, nuevo_estado: estado },
      req,
    });

    res.json({ success: true, message: `Estado actualizado a "${estado}".` });
  } catch (error) {
    next(error);
  }
};

export const recepcionarOrdenCompra = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      tipo_comprobante = 'Factura',
      serie = 'F001',
      numero,
      guia_remision,
      items_recibidos = [],
    } = req.body;

    if (!numero || !numero.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Ingrese el número del comprobante emitido por el proveedor.',
      });
    }

    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const orden = await OrdenCompra.findOne({
      where,
      include: [{ model: OrdenCompraDetalle, as: 'detalles' }],
      transaction: t,
    });

    if (!orden) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Orden de compra no encontrada.' });
    }

    // Filtrar ítems recibidos con cantidad > 0
    const itemsValidos = items_recibidos.filter((it) => parseFloat(it.cantidad_recibida || 0) > 0);
    if (itemsValidos.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar una cantidad mayor a 0 en al menos un ítem.',
      });
    }

    // Crear la Compra vinculada
    let subtotalCompra = 0;
    const detallesParaCompra = [];

    for (const it of itemsValidos) {
      const detOC = orden.detalles.find((d) => d.id_producto === it.id_producto);
      const pu = detOC ? parseFloat(detOC.precio_unitario) : 0;
      const cantRecibida = parseFloat(it.cantidad_recibida);
      const subtotalItem = parseFloat((cantRecibida * pu).toFixed(2));
      subtotalCompra += subtotalItem;

      detallesParaCompra.push({
        id_producto: it.id_producto,
        cantidad: cantRecibida,
        costo_unitario: pu,
        subtotal: subtotalItem,
      });

      // Actualizar cantidad_recibida en el detalle de la Orden
      if (detOC) {
        const yaRecibida = parseFloat(detOC.cantidad_recibida || 0);
        await detOC.update(
          { cantidad_recibida: parseFloat((yaRecibida + cantRecibida).toFixed(3)) },
          { transaction: t }
        );
      }

      // Sumar al stock del producto
      const prod = await Producto.findByPk(it.id_producto, { transaction: t });
      if (prod) {
        const stockAntes = parseFloat(prod.stock) || 0;
        const stockDespues = parseFloat((stockAntes + cantRecibida).toFixed(3));
        await prod.update(
          {
            stock: stockDespues,
            precio_compra: pu > 0 ? pu : prod.precio_compra,
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
            cantidad: cantRecibida,
            stock_antes: stockAntes,
            stock_despues: stockDespues,
            motivo: `Recepción ${orden.codigo} - ${tipo_comprobante} ${serie}-${numero}`,
          },
          { transaction: t }
        );
      }
    }

    subtotalCompra = parseFloat(subtotalCompra.toFixed(2));
    const igvCompra = parseFloat((subtotalCompra * 0.18).toFixed(2));
    const totalCompra = parseFloat((subtotalCompra + igvCompra).toFixed(2));

    const nuevaCompra = await Compra.create(
      {
        empresa_id: req.empresa_id || 1,
        sucursal_id: req.sucursal_id || null,
        id_proveedor: orden.id_proveedor,
        id_orden_compra: orden.id,
        id_usuario: req.user ? req.user.id : 1,
        serie,
        numero,
        tipo_comprobante,
        guia_remision: guia_remision || null,
        observaciones: `Recepción física de mercadería de ${orden.codigo}`,
        subtotal: subtotalCompra,
        igv: igvCompra,
        total: totalCompra,
        estado: 'Registrada',
      },
      { transaction: t }
    );

    for (const d of detallesParaCompra) {
      await CompraDetalle.create(
        {
          id_compra: nuevaCompra.id,
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          costo_unitario: d.costo_unitario,
          subtotal: d.subtotal,
        },
        { transaction: t }
      );
    }

    // Verificar si la orden completa fue recepcionada
    const detallesActualizados = await OrdenCompraDetalle.findAll({
      where: { id_orden_compra: orden.id },
      transaction: t,
    });
    const todosRecibidos = detallesActualizados.every(
      (d) => parseFloat(d.cantidad_recibida || 0) >= parseFloat(d.cantidad || 0)
    );

    const nuevoEstado = todosRecibidos ? 'Recepcionada' : 'Recepcion Parcial';
    await orden.update({ estado: nuevoEstado }, { transaction: t });

    await t.commit();

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'RECEPCIONAR_ORDEN_COMPRA',
      entidad: 'OrdenCompra',
      entidad_id: orden.id,
      detalles: {
        codigo: orden.codigo,
        compra_id: nuevaCompra.id,
        comprobante: `${tipo_comprobante} ${serie}-${numero}`,
        nuevo_estado: nuevoEstado,
      },
      req,
    });

    res.json({
      success: true,
      message: `Recepción registrada en almacén e inventario actualizado (${nuevoEstado}).`,
      compra: nuevaCompra,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export default {
  getOrdenesCompra,
  crearOrdenCompra,
  cambiarEstadoOrdenCompra,
  recepcionarOrdenCompra,
};

