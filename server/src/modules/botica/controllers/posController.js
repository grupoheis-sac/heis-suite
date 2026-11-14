import { Op } from 'sequelize';
import sequelize from '../../../config/db.js';
import {
  Venta,
  VentaDetalle,
  Medicamento,
  Lote,
  Cliente,
  Caja,
  KardexFarmacia
} from '../models/index.js';
import { Usuario, CajaGeneral, CajaMovimientoGeneral } from '../../../core/models/index.js';
import { emitirComprobanteUniversal } from '../../../core/services/sunatUbl.service.js';
import { emitTenantEvent } from '../../../core/services/realtime.service.js';

export const getVentas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, tipo_comprobante, limit = 50, page = 1 } = req.query;
    const whereClause = {
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (tipo_comprobante) {
      whereClause.tipo_comprobante = tipo_comprobante;
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [new Date(`${fecha_inicio}T00:00:00`), new Date(`${fecha_fin}T23:59:59`)]
      };
    }

    const parsedLimit = parseInt(limit) || 50;
    const offset = ((parseInt(page) || 1) - 1) * parsedLimit;

    const { count, rows: ventas } = await Venta.findAndCountAll({
      where: whereClause,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'numero_documento'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        {
          model: VentaDetalle,
          as: 'detalles',
          include: [
            { model: Medicamento, as: 'medicamento', attributes: ['id', 'nombre_comercial', 'nombre_generico', 'concentracion', 'presentacion'] },
            { model: Lote, as: 'lote', attributes: ['id', 'numero_lote', 'fecha_vencimiento'] }
          ]
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parsedLimit,
      offset
    });

    res.json({
      success: true,
      data: ventas,
      total: count,
      page: parseInt(page) || 1,
      totalPages: Math.ceil(count / parsedLimit)
    });
  } catch (error) {
    console.error('Error al obtener ventas botica:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVentaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await Venta.findOne({
      where: {
        id,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        {
          model: VentaDetalle,
          as: 'detalles',
          include: [
            { model: Medicamento, as: 'medicamento' },
            { model: Lote, as: 'lote' }
          ]
        }
      ]
    });

    if (!venta) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada' });
    }

    res.json({ success: true, data: venta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearVenta = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      tipo_comprobante = 'Boleta',
      id_cliente = null,
      id_caja = null,
      tipo_pago = 'Efectivo',
      numero_operacion = null,
      medico_cmp = null,
      medico_nombre = null,
      numero_receta = null,
      paciente_dni = null,
      paciente_nombre = null,
      descuento = 0,
      monto_recibido = null,
      items = []
    } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'No hay productos en el pedido' });
    }

    const empresaId = req.empresa_id || 1;
    const userId = req.user?.id || 1;

    // Calcular totales
    let subtotal = 0;
    for (const item of items) {
      subtotal += parseFloat(item.subtotal || (item.cantidad * item.precio_unitario));
    }
    const igv = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal - (parseFloat(descuento) || 0)).toFixed(2));
    const vuelto = monto_recibido ? Math.max(0, parseFloat(monto_recibido) - total) : 0;

    // Generar correlativo
    const countVentas = await Venta.count({ where: { empresa_id: empresaId } });
    const serie = tipo_comprobante === 'Factura' ? 'F001' : tipo_comprobante === 'Boleta' ? 'B001' : 'T001';
    const numero = String(countVentas + 1).padStart(8, '0');

    // Crear cabecera
    const venta = await Venta.create({
      empresa_id: empresaId,
      id_sucursal: req.sucursal_id || 1,
      serie,
      numero,
      tipo_comprobante,
      id_cliente,
      id_usuario: userId,
      id_caja,
      tipo_pago,
      numero_operacion,
      medico_cmp,
      medico_nombre,
      numero_receta,
      paciente_dni,
      paciente_nombre,
      subtotal,
      igv,
      descuento: parseFloat(descuento) || 0,
      total,
      monto_recibido,
      vuelto,
      estado: 'Completada',
      fecha: new Date()
    }, { transaction: t });

    // Procesar detalles y descontar stock FEFO
    for (const item of items) {
      const medId = item.id_medicamento || item.id;
      const cant = parseFloat(item.cantidad);
      const formato = item.formato_venta || 'Caja';

      // Asignar o buscar Lote FEFO si no viene especificado
      let idLote = item.id_lote || null;
      if (!idLote) {
        const loteOptimo = await Lote.findOne({
          where: {
            id_medicamento: medId,
            activo: true,
            stock_cajas: { [Op.gt]: 0 }
          },
          order: [['fecha_vencimiento', 'ASC']],
          transaction: t
        });
        if (loteOptimo) idLote = loteOptimo.id;
      }

      await VentaDetalle.create({
        empresa_id: empresaId,
        id_venta: venta.id,
        id_medicamento: medId,
        id_lote: idLote,
        formato_venta: formato,
        cantidad: cant,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal || (cant * item.precio_unitario)
      }, { transaction: t });

      // Descontar medicamento con bloqueo atómico para prevenir concurrencia y sobreventa
      const med = await Medicamento.findByPk(medId, { transaction: t, lock: t.LOCK.UPDATE });
      if (med) {
        if (formato === 'Caja') {
          const stockActual = parseFloat(med.stock_cajas) || 0;
          if (stockActual < cant) {
            await t.rollback();
            return res.status(400).json({
              success: false,
              message: `Stock insuficiente para "${med.nombre_comercial}". Disponible: ${stockActual} cajas.`
            });
          }
          await med.decrement('stock_cajas', { by: cant, transaction: t });
          const nuevoStock = Math.max(0, stockActual - cant);

          // Descontar lote si existe con bloqueo
          if (idLote) {
            const loteRow = await Lote.findByPk(idLote, { transaction: t, lock: t.LOCK.UPDATE });
            if (loteRow) {
              await loteRow.decrement('stock_cajas', { by: cant, transaction: t });
            }
          }

          // Kardex
          await KardexFarmacia.create({
            empresa_id: empresaId,
            id_medicamento: medId,
            id_lote: idLote,
            tipo_movimiento: 'SALIDA',
            cantidad_cajas: cant,
            saldo_cajas: nuevoStock,
            motivo: `Venta ${serie}-${numero}`,
            referencia_documento: `${serie}-${numero}`,
            id_usuario: userId
          }, { transaction: t });
        } else {
          // Fracción (pastillas)
          const stockFracActual = parseFloat(med.stock_fraccion) || 0;
          if (stockFracActual < cant) {
            await t.rollback();
            return res.status(400).json({
              success: false,
              message: `Stock fraccionado insuficiente para "${med.nombre_comercial}". Disponible: ${stockFracActual} unidades.`
            });
          }
          await med.decrement('stock_fraccion', { by: cant, transaction: t });
        }
      }
    }

    // Emitir comprobante electrónico UBL 2.1 en el Core si es Boleta o Factura
    if (tipo_comprobante === 'Boleta' || tipo_comprobante === 'Factura') {
      try {
        const clienteObj = id_cliente ? await Cliente.findByPk(id_cliente, { transaction: t }) : null;
        await emitirComprobanteUniversal({
          empresaId,
          sucursalId: req.sucursal_id || null,
          usuarioId: userId || 1,
          origenModulo: 'botica',
          origenId: venta.id,
          tipoComprobante: tipo_comprobante,
          seriePreferida: serie,
          clienteDocumento: clienteObj ? clienteObj.numero_documento : (paciente_dni || '00000000'),
          clienteNombre: clienteObj ? clienteObj.razon_social : (paciente_nombre || 'CLIENTE VARIOS'),
          clienteDireccion: clienteObj ? clienteObj.direccion : '',
          descuentoGlobal: parseFloat(descuento) || 0,
          items: items.map((it) => ({
            id_medicamento: it.id_medicamento || it.id,
            descripcion: it.nombre || it.descripcion || 'MEDICAMENTO',
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
          })),
          transaction: t,
        });
      } catch (cpeErr) {
        console.warn('⚠️ No se pudo generar CPE UBL 2.1 en dispensación botica:', cpeErr.message);
      }
    }

    // Actualizar caja legacy si está abierta
    if (id_caja) {
      const caja = await Caja.findByPk(id_caja, { transaction: t });
      if (caja && caja.estado === 'Abierta') {
        const nuevoTotalVentas = parseFloat(caja.total_ventas || 0) + total;
        await caja.update({ total_ventas: nuevoTotalVentas }, { transaction: t });
      }
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
        const esEfectivo = tipo_pago === 'Efectivo';
        if (esEfectivo) {
          cajaGeneralActiva.total_ventas_efectivo = parseFloat((parseFloat(cajaGeneralActiva.total_ventas_efectivo || 0) + total).toFixed(2));
        } else {
          cajaGeneralActiva.total_ventas_digital = parseFloat((parseFloat(cajaGeneralActiva.total_ventas_digital || 0) + total).toFixed(2));
        }
        await cajaGeneralActiva.save({ transaction: t });

        await CajaMovimientoGeneral.create(
          {
            empresa_id: req.empresa_id,
            sucursal_id: req.sucursal_id || null,
            id_caja: cajaGeneralActiva.id,
            id_usuario: userId || 1,
            tipo: 'Ingreso',
            concepto: `Dispensación Botica #${serie}-${numero}`,
            monto: total,
            metodo_pago: tipo_pago,
            origen_modulo: 'botica',
            ref_legacy_id: venta.id,
          },
          { transaction: t }
        );
      }
    } catch (cajaGenErr) {
      console.warn('⚠️ No se pudo registrar venta botica en CajaGeneral:', cajaGenErr.message);
    }

    await t.commit();

    emitTenantEvent(req.empresa_id, 'caja:updated', { venta_id: venta.id, total }, req.sucursal_id);
    emitTenantEvent(req.empresa_id, 'venta:created', { venta_id: venta.id, modulo: 'botica' }, req.sucursal_id);

    // Retornar venta completa
    const ventaCreada = await Venta.findByPk(venta.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        {
          model: VentaDetalle,
          as: 'detalles',
          include: [{ model: Medicamento, as: 'medicamento' }]
        }
      ]
    });

    res.status(201).json({ success: true, data: ventaCreada, message: 'Dispensación registrada con éxito' });
  } catch (error) {
    await t.rollback();
    console.error('Error al registrar dispensación:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const anularVenta = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const venta = await Venta.findOne({
      where: {
        id,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [{ model: VentaDetalle, as: 'detalles' }],
      transaction: t
    });

    if (!venta) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Venta no encontrada' });
    }

    if (venta.estado === 'Anulada') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'La venta ya fue anulada' });
    }

    await venta.update({ estado: 'Anulada' }, { transaction: t });

    // Restaurar stock
    for (const d of venta.detalles) {
      const med = await Medicamento.findByPk(d.id_medicamento, { transaction: t });
      if (med) {
        if (d.formato_venta === 'Caja') {
          const nuevoStock = parseFloat(med.stock_cajas) + parseFloat(d.cantidad);
          await med.update({ stock_cajas: nuevoStock }, { transaction: t });

          if (d.id_lote) {
            const loteRow = await Lote.findByPk(d.id_lote, { transaction: t });
            if (loteRow) {
              await loteRow.update({
                stock_cajas: parseFloat(loteRow.stock_cajas) + parseFloat(d.cantidad)
              }, { transaction: t });
            }
          }

          await KardexFarmacia.create({
            empresa_id: req.empresa_id || 1,
            id_medicamento: d.id_medicamento,
            id_lote: d.id_lote,
            tipo_movimiento: 'AJUSTE_POSITIVO',
            cantidad_cajas: d.cantidad,
            saldo_cajas: nuevoStock,
            motivo: `Anulación Venta ${venta.serie}-${venta.numero}`,
            referencia_documento: `ANUL-${venta.serie}-${venta.numero}`,
            id_usuario: req.user?.id || 1
          }, { transaction: t });
        }
      }
    }

    await t.commit();

    emitTenantEvent(req.empresa_id, 'caja:updated', { venta_id: venta.id, total }, req.sucursal_id);
    emitTenantEvent(req.empresa_id, 'venta:created', { venta_id: venta.id, modulo: 'botica' }, req.sucursal_id);
    res.json({ success: true, message: 'Venta anulada correctamente y stock reincorporado' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

