import sequelize from '../../../config/db.js';
import { Orden, OrdenDetalle, Mesa, Producto } from '../models/index.js';
import { Usuario, CajaGeneral, CajaMovimientoGeneral } from '../../../core/models/index.js';
import { emitirComprobanteUniversal } from '../../../core/services/sunatUbl.service.js';
import { emitTenantEvent } from '../../../core/services/realtime.service.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const agregarItemsAMesa = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { table_id, items, client_name = 'Público General', notes = '' } = req.body;

    if (!table_id || !items || !items.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Datos incompletos.' });
    }

    const mesa = await Mesa.findOne({
      where: { id: table_id, empresa_id: req.empresa_id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!mesa) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Mesa no encontrada.' });
    }

    let orden = await Orden.findOne({
      where: {
        table_id,
        empresa_id: req.empresa_id,
        status: ['pending', 'cooking', 'served'],
      },
      transaction: t,
    });

    if (!orden) {
      orden = await Orden.create(
        {
          empresa_id: req.empresa_id,
          sucursal_id: req.sucursal_id || null,
          table_id,
          user_id: req.user ? req.user.id : null,
          status: 'pending',
          client_name,
          notes,
          subtotal: 0,
          total: 0,
        },
        { transaction: t }
      );

      await mesa.update({ status: 'occupied' }, { transaction: t });
    }

    for (const item of items) {
      const prod = await Producto.findOne({
        where: { id: item.product_id, empresa_id: req.empresa_id },
        transaction: t,
      });
      if (!prod) continue;

      const precio = parseFloat(prod.price);
      const cant = parseInt(item.quantity, 10) || 1;
      const sub = parseFloat((precio * cant).toFixed(2));

      await OrdenDetalle.create(
        {
          order_id: orden.id,
          product_id: prod.id,
          quantity: cant,
          price: precio,
          subtotal: sub,
          note: item.note || null,
          status: 'pending',
        },
        { transaction: t }
      );
    }

    const todosDetalles = await OrdenDetalle.findAll({
      where: { order_id: orden.id },
      transaction: t,
    });

    const nuevoSubtotal = todosDetalles.reduce((acc, d) => acc + parseFloat(d.subtotal), 0);
    const desc = parseFloat(orden.discount) || 0;
    const propina = parseFloat(orden.tip) || 0;
    const nuevoTotal = parseFloat((nuevoSubtotal - desc + propina).toFixed(2));

    await orden.update(
      {
        subtotal: nuevoSubtotal,
        total: Math.max(0, nuevoTotal),
      },
      { transaction: t }
    );

    await t.commit();

    // Emitir evento en tiempo real a Cocina KDS y Salón
    emitTenantEvent(
      req.empresa_id,
      'kds:new_order',
      {
        order_id: orden.id,
        mesa: mesa.name,
        items_count: items.length,
        mozo: req.user?.nombre || 'Sala',
      },
      req.sucursal_id
    );
    emitTenantEvent(req.empresa_id, 'kds:updated', { order_id: orden.id }, req.sucursal_id);

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'AGREGAR_ITEMS_MESA',
      entidad: 'Orden',
      entidad_id: orden.id,
      detalles: { mesa: mesa.name, items_count: items.length, total: nuevoTotal },
      req,
    });

    res.json({
      success: true,
      message: 'Comanda registrada en mesa.',
      orden,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const enviarACocina = async (req, res, next) => {
  try {
    const { order_id } = req.body;
    await OrdenDetalle.update(
      { status: 'cooking' },
      { where: { order_id, status: 'pending' } }
    );
    await Orden.update(
      { status: 'cooking' },
      { where: { id: order_id, empresa_id: req.empresa_id, status: 'pending' } }
    );

    emitTenantEvent(
      req.empresa_id,
      'kds:new_order',
      {
        order_id,
        accion: 'ENVIAR_A_COCINA',
      },
      req.sucursal_id
    );
    emitTenantEvent(req.empresa_id, 'kds:updated', { order_id }, req.sucursal_id);

    res.json({ success: true, message: 'Comanda enviada a Cocina y Bar.' });
  } catch (error) {
    next(error);
  }
};

export const pedirCuenta = async (req, res, next) => {
  try {
    const { table_id } = req.body;
    const mesa = await Mesa.findOne({
      where: { id: table_id, empresa_id: req.empresa_id },
    });
    if (!mesa) return res.status(404).json({ success: false, message: 'Mesa no encontrada.' });

    await mesa.update({ status: 'billed' });
    emitTenantEvent(req.empresa_id, 'mesas:updated', { table_id, status: 'billed' }, req.sucursal_id);

    res.json({ success: true, message: 'Pre-cuenta solicitada. Mesa en cobro.' });
  } catch (error) {
    next(error);
  }
};

export const cobrarOrden = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      order_id,
      document_type = 'Ticket',
      client_name = 'Público General',
      client_document = null,
      payment_method = 'cash',
      discount = 0,
      tip = 0,
      received_amount,
      monto_efectivo = 0,
      monto_digital = 0,
      billetera_digital = null,
    } = req.body;

    const orden = await Orden.findOne({
      where: { id: order_id, empresa_id: req.empresa_id },
      include: [
        { model: Mesa, as: 'mesa' },
        { model: OrdenDetalle, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
      ],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!orden) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    }

    const subtotal = parseFloat(orden.subtotal);
    const desc = parseFloat(discount) || 0;
    const propina = parseFloat(tip) || 0;
    const totalFinal = parseFloat((subtotal - desc + propina).toFixed(2));

    let vuelto = 0;
    const montoRecibido = parseFloat(received_amount) || totalFinal;
    if (payment_method === 'cash' || payment_method === 'Efectivo') {
      vuelto = parseFloat(Math.max(0, montoRecibido - totalFinal).toFixed(2));
    }

    await orden.update(
      {
        status: 'completed',
        document_type,
        client_name,
        client_document,
        payment_method,
        discount: desc,
        tip: propina,
        total: totalFinal,
        received_amount: montoRecibido,
        change_amount: vuelto,
        monto_efectivo: parseFloat(monto_efectivo) || 0,
        monto_digital: parseFloat(monto_digital) || 0,
        billetera_digital,
      },
      { transaction: t }
    );

    if (orden.table_id) {
      await Mesa.update(
        { status: 'available' },
        { where: { id: orden.table_id, empresa_id: req.empresa_id }, transaction: t }
      );
    }

    for (const det of orden.detalles) {
      const prod = await Producto.findByPk(det.product_id, { transaction: t });
      if (prod && prod.stock !== null && prod.stock > 0) {
        await prod.decrement('stock', { by: det.quantity, transaction: t });
      }
    }

    if (document_type === 'Boleta' || document_type === 'Factura') {
      try {
        const cpe = await emitirComprobanteUniversal({
          empresaId: req.empresa_id,
          sucursalId: req.sucursal_id || null,
          usuarioId: req.user?.id || orden.user_id || 1,
          origenModulo: 'restaurante',
          origenId: orden.id,
          tipoComprobante: document_type,
          clienteDocumento: client_document || '00000000',
          clienteNombre: client_name || 'Público General',
          descuentoGlobal: desc,
          items: (orden.detalles || []).map((d) => ({
            id_producto: d.product_id,
            descripcion: d.producto?.name || 'CONSUMO RESTAURANTE',
            cantidad: d.quantity,
            precio_unitario: d.price,
          })),
          transaction: t,
        });
        await orden.update(
          {
            serie: cpe.serie,
            correlativo: cpe.correlativo,
          },
          { transaction: t }
        );
      } catch (sunatErr) {
        console.warn('⚠️ Advertencia generando CPE UBL 2.1 en cobro de orden:', sunatErr.message);
      }
    }

    try {
      const cajaActiva = await CajaGeneral.findOne({
        where: {
          empresa_id: req.empresa_id,
          estado: 'Abierta',
          ...(req.sucursal_id ? { sucursal_id: req.sucursal_id } : {}),
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (cajaActiva) {
        let efectivoSumar = 0;
        let digitalSumar = 0;
        if (payment_method === 'cash' || payment_method === 'Efectivo') {
          efectivoSumar = totalFinal;
        } else if (payment_method === 'mixto' || payment_method === 'split') {
          efectivoSumar = parseFloat(monto_efectivo) || 0;
          digitalSumar = parseFloat(monto_digital) || 0;
        } else {
          digitalSumar = totalFinal;
        }

        if (efectivoSumar > 0) {
          cajaActiva.total_ventas_efectivo = parseFloat((parseFloat(cajaActiva.total_ventas_efectivo || 0) + efectivoSumar).toFixed(2));
        }
        if (digitalSumar > 0) {
          cajaActiva.total_ventas_digital = parseFloat((parseFloat(cajaActiva.total_ventas_digital || 0) + digitalSumar).toFixed(2));
        }
        await cajaActiva.save({ transaction: t });

        await CajaMovimientoGeneral.create(
          {
            empresa_id: req.empresa_id,
            sucursal_id: req.sucursal_id || null,
            id_caja: cajaActiva.id,
            id_usuario: req.user?.id || orden.user_id || 1,
            tipo: 'Ingreso',
            concepto: `Cobro Orden #${orden.id} (${document_type}) - ${client_name}`,
            monto: totalFinal,
            metodo_pago: payment_method,
            origen_modulo: 'restaurante',
          },
          { transaction: t }
        );
      }
    } catch (cajaErr) {
      console.warn('⚠️ No se pudo registrar automáticamente en Caja General:', cajaErr.message);
    }

    await t.commit();

    emitTenantEvent(req.empresa_id, 'kds:updated', { order_id: orden.id, status: 'completed' }, req.sucursal_id);
    emitTenantEvent(req.empresa_id, 'caja:updated', { origen: 'restaurante', total: totalFinal }, req.sucursal_id);

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'COBRAR_ORDEN',
      entidad: 'Orden',
      entidad_id: orden.id,
      detalles: { total: totalFinal, metodo: payment_method, comprobante: document_type },
      req,
    });

    res.json({
      success: true,
      message: 'Cuenta cobrada con éxito. Mesa liberada.',
      orden,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const emitirSunatOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orden = await Orden.findOne({
      where: { id, empresa_id: req.empresa_id },
      include: [
        { model: Mesa, as: 'mesa' },
        { model: OrdenDetalle, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
      ],
    });

    if (!orden) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    }

    const tipoDoc = orden.document_type === 'Factura' ? 'Factura' : 'Boleta';
    const cpe = await emitirComprobanteUniversal({
      empresaId: req.empresa_id,
      sucursalId: req.sucursal_id || orden.sucursal_id || null,
      usuarioId: req.user?.id || orden.user_id || 1,
      origenModulo: 'restaurante',
      origenId: orden.id,
      tipoComprobante: tipoDoc,
      clienteDocumento: orden.client_document || '00000000',
      clienteNombre: orden.client_name || 'Público General',
      items: (orden.detalles || []).map((d) => ({
        id_producto: d.product_id,
        descripcion: d.producto?.name || 'CONSUMO RESTAURANTE',
        cantidad: d.quantity,
        precio_unitario: d.price,
      })),
    });

    await orden.update({
      serie: cpe.serie,
      correlativo: cpe.correlativo,
    });

    res.json({
      success: true,
      message: `Comprobante ${cpe.numero_formato} emitido a SUNAT exitosamente.`,
      sunat: {
        success: true,
        sunat_estado: cpe.sunat_estado,
        serie: cpe.serie,
        correlativo: cpe.correlativo,
        numero_formato: cpe.numero_formato,
        sunat_hash: cpe.sunat_hash,
        sunat_qr: cpe.sunat_qr,
      },
      orden,
    });
  } catch (error) {
    next(error);
  }
};

export const anularOrden = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const orden = await Orden.findOne({
      where: { id, empresa_id: req.empresa_id },
      transaction: t,
    });
    if (!orden) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    }

    await orden.update({ status: 'cancelled' }, { transaction: t });
    if (orden.table_id) {
      await Mesa.update(
        { status: 'available' },
        { where: { id: orden.table_id, empresa_id: req.empresa_id }, transaction: t }
      );
    }

    await t.commit();
    emitTenantEvent(req.empresa_id, 'kds:updated', { order_id: orden.id, status: 'cancelled' }, req.sucursal_id);

    res.json({ success: true, message: 'Orden anulada y mesa liberada.' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const getHistorialOrdenes = async (req, res, next) => {
  try {
    const { limit = 50, page = 1, status = 'completed' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = { empresa_id: req.empresa_id };
    if (status && status !== 'all') {
      where.status = status;
    }

    const { count, rows: ordenes } = await Orden.findAndCountAll({
      where,
      include: [
        { model: Mesa, as: 'mesa', attributes: ['name'] },
        { model: Usuario, as: 'mozo', attributes: ['nombre', 'email'] },
        {
          model: OrdenDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['name', 'price'] }],
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
      ordenes,
    });
  } catch (error) {
    next(error);
  }
};

export const separarCuenta = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      order_id,
      items_separados = [],
      client_name = 'Comensal Cuenta Separada',
      client_document = null,
      document_type = 'Ticket',
      payment_method = 'Efectivo',
      monto_efectivo = 0,
      monto_digital = 0,
      billetera_digital = null,
      received_amount = 0,
      tip = 0,
      discount = 0,
    } = req.body;

    if (!order_id || !Array.isArray(items_separados) || items_separados.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Debe especificar los ítems a separar para el cobro parcial.' });
    }

    const ordenOriginal = await Orden.findOne({
      where: { id: order_id, empresa_id: req.empresa_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!ordenOriginal) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Orden original no encontrada.' });
    }

    let subtotalSeparado = 0;
    const detallesSeparados = [];

    for (const item of items_separados) {
      const detalle = await OrdenDetalle.findOne({
        where: { id: item.detalle_id, order_id: ordenOriginal.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!detalle) continue;

      const cantASeparar = Math.min(detalle.quantity, parseInt(item.quantity, 10) || detalle.quantity);
      const sub = parseFloat((parseFloat(detalle.price) * cantASeparar).toFixed(2));
      subtotalSeparado += sub;

      detallesSeparados.push({
        product_id: detalle.product_id,
        quantity: cantASeparar,
        price: detalle.price,
        subtotal: sub,
        note: detalle.note,
        status: detalle.status,
      });

      if (cantASeparar >= detalle.quantity) {
        await detalle.destroy({ transaction: t });
      } else {
        const restanteCant = detalle.quantity - cantASeparar;
        const restanteSub = parseFloat((parseFloat(detalle.price) * restanteCant).toFixed(2));
        await detalle.update({ quantity: restanteCant, subtotal: restanteSub }, { transaction: t });
      }
    }

    const propina = parseFloat(tip) || 0;
    const desc = parseFloat(discount) || 0;
    const totalSeparadoFinal = parseFloat(Math.max(0, subtotalSeparado - desc + propina).toFixed(2));

    const nuevaOrden = await Orden.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      table_id: ordenOriginal.table_id,
      user_id: req.user?.id || null,
      status: 'completed',
      document_type,
      client_name,
      client_document,
      payment_method,
      subtotal: subtotalSeparado,
      total: totalSeparadoFinal,
      discount: desc,
      tip: propina,
      received_amount: received_amount || totalSeparadoFinal,
      monto_efectivo: parseFloat(monto_efectivo) || 0,
      monto_digital: parseFloat(monto_digital) || 0,
      billetera_digital,
      notes: `Cuenta dividida / separada de comanda #${ordenOriginal.id}`,
    }, { transaction: t });

    for (const det of detallesSeparados) {
      await OrdenDetalle.create({
        order_id: nuevaOrden.id,
        ...det,
      }, { transaction: t });
    }

    // Recalcular orden original
    const restantesDetalles = await OrdenDetalle.findAll({
      where: { order_id: ordenOriginal.id },
      transaction: t,
    });

    const restanteSubtotal = restantesDetalles.reduce((acc, d) => acc + parseFloat(d.subtotal || 0), 0);
    const restanteTotal = parseFloat(Math.max(0, restanteSubtotal - (ordenOriginal.discount || 0) + (ordenOriginal.tip || 0)).toFixed(2));

    await ordenOriginal.update({
      subtotal: restanteSubtotal,
      total: restanteTotal,
    }, { transaction: t });

    if (restantesDetalles.length === 0) {
      await ordenOriginal.update({ status: 'completed' }, { transaction: t });
      if (ordenOriginal.table_id) {
        await Mesa.update({ status: 'available' }, { where: { id: ordenOriginal.table_id }, transaction: t });
      }
    }

    await t.commit();

    emitTenantEvent(req.empresa_id, 'mesas:updated', {
      split: true,
      originalId: ordenOriginal.id,
      nuevaOrdenId: nuevaOrden.id,
    }, req.sucursal_id);

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'SEPARAR_CUENTA_ORDEN',
      entidad: 'Orden',
      entidad_id: nuevaOrden.id,
      detalles: { ordenOriginal: ordenOriginal.id, totalCobrado: totalSeparadoFinal, restante: restanteTotal },
      req,
    });

    res.json({
      success: true,
      message: `Sub-cuenta cobrada exitosamente (S/ ${totalSeparadoFinal.toFixed(2)}). Total restante en mesa: S/ ${restanteTotal.toFixed(2)}.`,
      nuevaOrden,
      ordenOriginalRestante: ordenOriginal,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const anularItem = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { detalle_id, motivo = 'Cancelado por el cliente', pin_supervisor = '' } = req.body;

    if (!detalle_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'ID de detalle requerido.' });
    }

    const detalle = await OrdenDetalle.findByPk(detalle_id, {
      include: [
        { model: Orden, as: 'orden' },
        { model: Producto, as: 'producto' },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!detalle) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Ítem no encontrado.' });
    }

    const orden = detalle.orden;
    if (orden.empresa_id !== req.empresa_id) {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'No autorizado.' });
    }

    const esAdminOSupervisor = req.user?.rol === 'admin' || req.user?.rol === 'superadmin';
    const pinValido = pin_supervisor === '1234' || pin_supervisor === '4321';

    if (detalle.status !== 'pending' && !esAdminOSupervisor && !pinValido) {
      await t.rollback();
      return res.status(401).json({
        success: false,
        requires_pin: true,
        message: 'Este plato ya está en preparación en cocina. Se requiere PIN de supervisor para anularlo.',
      });
    }

    const nombrePlato = detalle.producto?.name || 'Ítem';
    const cantEliminada = detalle.quantity;

    await detalle.destroy({ transaction: t });

    const restantes = await OrdenDetalle.findAll({ where: { order_id: orden.id }, transaction: t });
    const nuevoSub = restantes.reduce((acc, d) => acc + parseFloat(d.subtotal || 0), 0);
    const desc = parseFloat(orden.discount) || 0;
    const tip = parseFloat(orden.tip) || 0;
    const nuevoTotal = parseFloat(Math.max(0, nuevoSub - desc + tip).toFixed(2));

    await orden.update({
      subtotal: nuevoSub,
      total: nuevoTotal,
      notes: `${orden.notes || ''} | [Anulado: ${cantEliminada}x ${nombrePlato} - ${motivo}]`.trim(),
    }, { transaction: t });

    if (restantes.length === 0) {
      await orden.update({ status: 'cancelled' }, { transaction: t });
      if (orden.table_id) {
        await Mesa.update({ status: 'available' }, { where: { id: orden.table_id }, transaction: t });
      }
    }

    await t.commit();

    emitTenantEvent(req.empresa_id, 'kds:updated', {
      order_id: orden.id,
      accion: 'ITEM_ANULADO',
      plato: nombrePlato,
    }, req.sucursal_id);

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'ANULAR_ITEM_COMANDA',
      entidad: 'OrdenDetalle',
      entidad_id: detalle_id,
      detalles: { plato: nombrePlato, cantidad: cantEliminada, motivo, nuevoTotal },
      req,
    });

    res.json({
      success: true,
      message: `Plato "${nombrePlato}" anulado de la comanda.`,
      nuevoTotal,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export default {
  agregarItemsAMesa,
  enviarACocina,
  pedirCuenta,
  cobrarOrden,
  emitirSunatOrden,
  anularOrden,
  getHistorialOrdenes,
  separarCuenta,
  anularItem,
};
