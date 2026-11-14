import { Op } from 'sequelize';
import sequelize from '../../../config/db.js';
import {
  Venta,
  VentaDetalle,
  Producto,
  Cliente,
  Caja,
  InventarioMovimiento,
} from '../models/index.js';
import { Usuario, CajaGeneral, CajaMovimientoGeneral } from '../../../core/models/index.js';
import { emitirComprobanteUniversal } from '../../../core/services/sunatUbl.service.js';
import { emitTenantEvent } from '../../../core/services/realtime.service.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getVentas = async (req, res, next) => {
  try {
    const { limit = 50, page = 1, fecha_inicio, fecha_fin, estado, tipo_comprobante, tipo_pago, search } = req.query;
    const whereClause = { empresa_id: req.empresa_id };

    if (estado && estado !== 'Todos') {
      whereClause.estado = estado;
    }
    if (tipo_comprobante && tipo_comprobante !== 'Todos') {
      whereClause.tipo_comprobante = tipo_comprobante;
    }
    if (tipo_pago && tipo_pago !== 'Todos') {
      whereClause.tipo_pago = tipo_pago;
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.createdAt = {
        [Op.between]: [new Date(`${fecha_inicio}T00:00:00`), new Date(`${fecha_fin}T23:59:59`)],
      };
    } else if (fecha_inicio) {
      whereClause.createdAt = {
        [Op.gte]: new Date(`${fecha_inicio}T00:00:00`),
      };
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { numero: { [Op.like]: q } },
        { serie: { [Op.like]: q } },
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows: ventas } = await Venta.findAndCountAll({
      where: whereClause,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'numero_documento', 'telefono', 'email'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        {
          model: VentaDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'codigo_barras', 'unidad_medida'] }],
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
      ventas,
    });
  } catch (error) {
    next(error);
  }
};

export const getVentaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const venta = await Venta.findOne({
      where: { id, empresa_id: req.empresa_id },
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        {
          model: VentaDetalle,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }],
        },
      ],
    });

    if (!venta) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada.' });
    }

    res.json({ success: true, venta });
  } catch (error) {
    next(error);
  }
};

export const crearVenta = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      tipo_comprobante = 'Boleta',
      id_cliente,
      tipo_pago = 'Efectivo',
      numero_operacion,
      monto_efectivo,
      monto_digital,
      billetera_digital,
      items,
      monto_recibido,
      descuento = 0,
      notas,
    } = req.body;

    if (!items || !items.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Debe agregar al menos un producto al carrito.' });
    }

    // Buscar caja abierta del usuario
    let id_caja = null;
    const cajaAbierta = await Caja.findOne({
      where: {
        empresa_id: req.empresa_id,
        id_usuario: req.user ? req.user.id : 1,
        estado: 'Abierta',
      },
      transaction: t,
    });
    if (cajaAbierta) {
      id_caja = cajaAbierta.id;
    }

    // Calcular totales y descontar stock
    let subtotalCalculado = 0;
    const itemsProcesados = [];
    const itemsOrdenados = [...items].sort((a, b) => Number(a.id_producto || a.id) - Number(b.id_producto || b.id));

    for (const it of itemsOrdenados) {
      const prodId = it.id_producto || it.id;
      const prod = await Producto.findOne({
        where: { id: prodId, empresa_id: req.empresa_id },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!prod) {
        await t.rollback();
        return res.status(404).json({ success: false, message: `Producto ID ${prodId} no encontrado.` });
      }

      const cant = parseFloat(it.cantidad) || 1;
      const stockActual = parseFloat(prod.stock) || 0;

      if (stockActual < cant) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${prod.nombre}". Stock disponible: ${stockActual} ${prod.unidad_medida}.`,
        });
      }

      const precio = parseFloat(it.precio_unitario || prod.precio_venta);
      const subtotalItem = parseFloat((cant * precio).toFixed(2));
      subtotalCalculado += subtotalItem;

      // Descontar stock de forma atómica
      const nuevoStock = parseFloat((stockActual - cant).toFixed(3));
      await prod.decrement('stock', { by: cant, transaction: t });

      // Registrar movimiento Kardex
      await InventarioMovimiento.create(
        {
          empresa_id: req.empresa_id,
          sucursal_id: req.sucursal_id || null,
          id_producto: prod.id,
          id_usuario: req.user ? req.user.id : 1,
          tipo: 'Salida',
          cantidad: cant,
          stock_antes: stockActual,
          stock_despues: nuevoStock,
          motivo: `Venta POS - ${tipo_comprobante}`,
        },
        { transaction: t }
      );

      itemsProcesados.push({
        id_producto: prod.id,
        cantidad: cant,
        precio_unitario: precio,
        subtotal: subtotalItem,
      });
    }

    const desc = parseFloat(descuento) || 0;
    const totalVenta = Math.max(0, parseFloat((subtotalCalculado - desc).toFixed(2)));
    const subtotalSinIgv = parseFloat((totalVenta / 1.18).toFixed(2));
    const igvCalculado = parseFloat((totalVenta - subtotalSinIgv).toFixed(2));

    const serie = tipo_comprobante === 'Factura' ? 'F001' : tipo_comprobante === 'Boleta' ? 'B001' : 'T001';
    const ultimoNum = await Venta.count({ where: { empresa_id: req.empresa_id, serie }, transaction: t });
    const numeroStr = String(ultimoNum + 1).padStart(8, '0');

    let vuelto = 0;
    const montoRec = parseFloat(monto_recibido) || totalVenta;
    if (tipo_pago === 'Efectivo') {
      vuelto = Math.max(0, parseFloat((montoRec - totalVenta).toFixed(2)));
    }

    // Crear la Venta
    const nuevaVenta = await Venta.create(
      {
        empresa_id: req.empresa_id,
        sucursal_id: req.sucursal_id || null,
        serie,
        numero: numeroStr,
        tipo_comprobante,
        id_cliente: id_cliente ? Number(id_cliente) : null,
        id_usuario: req.user ? req.user.id : 1,
        id_caja,
        tipo_pago,
        numero_operacion,
        subtotal: subtotalSinIgv,
        igv: igvCalculado,
        descuento: desc,
        total: totalVenta,
        monto_recibido: montoRec,
        vuelto,
        monto_efectivo: parseFloat(monto_efectivo) || (tipo_pago === 'Efectivo' ? totalVenta : 0),
        monto_digital: parseFloat(monto_digital) || 0,
        billetera_digital,
        notas,
        estado: 'Completada',
        sunat_estado: 'ACEPTADO',
        sunat_hash: 'c7d2e4f1a8b9e6',
        sunat_qr: `https://sunat.gob.pe/qr?s=${serie}&n=${numeroStr}&t=${totalVenta}`,
      },
      { transaction: t }
    );

    // Insertar detalles de venta
    for (const det of itemsProcesados) {
      await VentaDetalle.create(
        {
          id_venta: nuevaVenta.id,
          id_producto: det.id_producto,
          cantidad: det.cantidad,
          precio_unitario: det.precio_unitario,
          subtotal: det.subtotal,
        },
        { transaction: t }
      );
    }

    // Emitir comprobante electrónico UBL 2.1 en el Core si es Boleta o Factura
    if (tipo_comprobante === 'Boleta' || tipo_comprobante === 'Factura') {
      try {
        const cpe = await emitirComprobanteUniversal({
          empresaId: req.empresa_id,
          sucursalId: req.sucursal_id || null,
          usuarioId: req.user ? req.user.id : 1,
          origenModulo: 'ferreteria',
          origenId: nuevaVenta.id,
          tipoComprobante: tipo_comprobante,
          seriePreferida: serie,
          clienteDocumento: clienteRow ? clienteRow.numero_documento : '00000000',
          clienteNombre: clienteRow ? clienteRow.razon_social : 'CLIENTE VARIOS',
          clienteDireccion: clienteRow ? clienteRow.direccion : '',
          descuentoGlobal: desc,
          items: itemsProcesados.map((it) => ({
            id_producto: it.id_producto,
            descripcion: it.descripcion || 'ARTÍCULO FERRETERÍA',
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
          })),
          transaction: t,
        });

        await nuevaVenta.update(
          {
            sunat_hash: cpe.sunat_hash,
            sunat_qr: cpe.sunat_qr,
            sunat_estado: cpe.sunat_estado,
          },
          { transaction: t }
        );
      } catch (sunatErr) {
        console.warn('⚠️ No se pudo generar CPE UBL 2.1 en venta ferretería:', sunatErr.message);
      }
    }

    // Si hubo pago en efectivo y hay caja abierta legacy, registrar venta en caja legacy
    if (id_caja && (tipo_pago === 'Efectivo' || tipo_pago === 'Mixto')) {
      const efectivoSumar = tipo_pago === 'Efectivo' ? totalVenta : parseFloat(monto_efectivo) || 0;
      await cajaAbierta.increment('total_ventas_efectivo', { by: efectivoSumar, transaction: t });
    }

    // Impactar en Caja General transversal (core_cajas)
    try {
      const cajaGeneralActiva = await CajaGeneral.findOne({
        where: {
          empresa_id: req.empresa_id,
          estado: ['Abierta', 'abierta'],
          ...(req.sucursal_id ? { sucursal_id: req.sucursal_id } : {}),
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (cajaGeneralActiva) {
        const efectivoSumar = tipo_pago === 'Efectivo' ? totalVenta : (tipo_pago === 'Mixto' ? (parseFloat(monto_efectivo) || 0) : 0);
        const digitalSumar = tipo_pago !== 'Efectivo' ? (tipo_pago === 'Mixto' ? (parseFloat(monto_digital) || 0) : totalVenta) : 0;

        if (efectivoSumar > 0) {
          cajaGeneralActiva.total_ventas_efectivo = parseFloat((parseFloat(cajaGeneralActiva.total_ventas_efectivo || 0) + efectivoSumar).toFixed(2));
        }
        if (digitalSumar > 0) {
          cajaGeneralActiva.total_ventas_digital = parseFloat((parseFloat(cajaGeneralActiva.total_ventas_digital || 0) + digitalSumar).toFixed(2));
        }
        await cajaGeneralActiva.save({ transaction: t });

        await CajaMovimientoGeneral.create(
          {
            empresa_id: req.empresa_id,
            sucursal_id: req.sucursal_id || null,
            id_caja: cajaGeneralActiva.id,
            id_usuario: req.user ? req.user.id : 1,
            tipo: 'Ingreso',
            concepto: `Venta POS #${serie}-${numeroStr}`,
            monto: totalVenta,
            metodo_pago: tipo_pago,
            origen_modulo: 'ferreteria',
            ref_legacy_id: nuevaVenta.id,
          },
          { transaction: t }
        );
      }
    } catch (cajaGenErr) {
      console.warn('⚠️ No se pudo registrar venta ferretería en CajaGeneral:', cajaGenErr.message);
    }

    await t.commit();

    emitTenantEvent(req.empresa_id, 'caja:updated', { venta_id: nuevaVenta.id, total: totalVenta }, req.sucursal_id);
    emitTenantEvent(req.empresa_id, 'venta:created', { venta_id: nuevaVenta.id, modulo: 'ferreteria' }, req.sucursal_id);

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'VENTA_POS',
      entidad: 'Venta',
      entidad_id: nuevaVenta.id,
      detalles: { comprobante: `${serie}-${numeroStr}`, total: totalVenta, metodo: tipo_pago },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Venta procesada con éxito.',
      venta: nuevaVenta,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const anularVenta = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const venta = await Venta.findOne({
      where: { id, empresa_id: req.empresa_id },
      include: [{ model: VentaDetalle, as: 'detalles' }],
      transaction: t,
    });

    if (!venta) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Venta no encontrada.' });
    }

    if (venta.estado === 'Anulada') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'La venta ya se encuentra anulada.' });
    }

    // Revertir stock en Kardex
    for (const det of venta.detalles) {
      const prod = await Producto.findByPk(det.id_producto, { transaction: t });
      if (prod) {
        const stockAntes = parseFloat(prod.stock) || 0;
        const cantRevertir = parseFloat(det.cantidad) || 0;
        const stockDespues = parseFloat((stockAntes + cantRevertir).toFixed(3));

        await prod.update({ stock: stockDespues }, { transaction: t });

        await InventarioMovimiento.create(
          {
            empresa_id: req.empresa_id,
            sucursal_id: req.sucursal_id || null,
            id_producto: prod.id,
            id_usuario: req.user ? req.user.id : 1,
            tipo: 'Entrada',
            cantidad: cantRevertir,
            stock_antes: stockAntes,
            stock_despues: stockDespues,
            motivo: `Anulación de Venta ${venta.serie}-${venta.numero}`,
          },
          { transaction: t }
        );
      }
    }

    await venta.update({ estado: 'Anulada' }, { transaction: t });
    await t.commit();

    emitTenantEvent(req.empresa_id, 'caja:updated', { venta_id: nuevaVenta.id, total: totalVenta }, req.sucursal_id);
    emitTenantEvent(req.empresa_id, 'venta:created', { venta_id: nuevaVenta.id, modulo: 'ferreteria' }, req.sucursal_id);

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'ANULAR_VENTA',
      entidad: 'Venta',
      entidad_id: venta.id,
      detalles: { comprobante: `${venta.serie}-${venta.numero}`, total: venta.total },
      req,
    });

    res.json({ success: true, message: 'Venta anulada y stock devuelto a almacén.' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export default {
  getVentas,
  getVentaPorId,
  crearVenta,
  anularVenta,
};

