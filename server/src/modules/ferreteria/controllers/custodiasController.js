import { Custodia, CustodiaDetalle, Producto, Cliente, InventarioMovimiento } from '../models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getCustodias = async (req, res, next) => {
  try {
    const where = { activo: true };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const custodias = await Custodia.findAll({
      where,
      include: [
        {
          model: CustodiaDetalle,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'unidad_medida', 'stock'],
            },
          ],
        },
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'telefono', 'direccion'],
        },
      ],
      order: [['id', 'DESC']],
    });

    res.json({ success: true, custodias });
  } catch (error) {
    next(error);
  }
};

export const crearCustodia = async (req, res, next) => {
  try {
    const {
      id_cliente,
      nombre_cliente,
      telefono_cliente,
      direccion_obra,
      fecha_estimada_entrega,
      chofer_flete,
      vehiculo_placa,
      observaciones,
      items = [],
    } = req.body;

    if (!nombre_cliente || !nombre_cliente.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del cliente o contratista es obligatorio.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe ingresar al menos un material a custodiar en patio.' });
    }

    // Generar correlativo
    const count = await Custodia.count({
      where: req.empresa_id ? { empresa_id: req.empresa_id } : {},
    });
    const codigo = `CUST-${String(count + 1).padStart(4, '0')}`;

    const totalBultos = items.reduce(
      (acc, item) => acc + (parseFloat(item.cantidad) || 0),
      0
    );

    const custodia = await Custodia.create({
      empresa_id: req.empresa_id || 1,
      sucursal_id: req.sucursal_id || null,
      codigo,
      id_cliente: id_cliente ? parseInt(id_cliente, 10) : null,
      nombre_cliente: nombre_cliente.trim(),
      telefono_cliente: telefono_cliente ? telefono_cliente.trim() : null,
      direccion_obra: direccion_obra ? direccion_obra.trim() : null,
      fecha_emision: new Date(),
      fecha_estimada_entrega: fecha_estimada_entrega || null,
      chofer_flete: chofer_flete ? chofer_flete.trim() : null,
      vehiculo_placa: vehiculo_placa ? vehiculo_placa.trim() : null,
      observaciones: observaciones ? observaciones.trim() : null,
      estado: 'Pendiente',
      total_bultos: totalBultos,
      activo: true,
    });

    const detallesData = items.map((i) => {
      const cant = parseFloat(i.cantidad) || 0;
      return {
        id_custodia: custodia.id,
        id_producto: parseInt(i.id_producto, 10),
        cantidad_total: cant,
        cantidad_entregada: 0,
        cantidad_pendiente: cant,
        unidad_medida: i.unidad_medida || 'Unidad',
        observaciones: i.observaciones ? i.observaciones.trim() : null,
      };
    });

    await CustodiaDetalle.bulkCreate(detallesData);

    const custodiaCompleta = await Custodia.findByPk(custodia.id, {
      include: [
        {
          model: CustodiaDetalle,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'unidad_medida', 'stock'],
            },
          ],
        },
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'telefono', 'direccion'],
        },
      ],
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'CREAR_CUSTODIA',
      entidad: 'Custodia',
      entidad_id: custodia.id,
      detalles: { codigo, cliente: nombre_cliente, bultos: totalBultos },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Orden de custodia registrada exitosamente.',
      custodia: custodiaCompleta,
    });
  } catch (error) {
    next(error);
  }
};

export const despacharCustodia = async (req, res, next) => {
  try {
    const {
      id_custodia,
      chofer_flete,
      vehiculo_placa,
      observaciones_despacho,
      items_despacho = [],
    } = req.body;

    const where = { id: id_custodia };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const custodia = await Custodia.findOne({
      where,
      include: [{ model: CustodiaDetalle, as: 'detalles' }],
    });

    if (!custodia) {
      return res.status(404).json({ success: false, message: 'Orden de custodia no encontrada.' });
    }

    if (!Array.isArray(items_despacho) || items_despacho.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe ingresar al menos una cantidad a despachar.' });
    }

    // Procesar cada detalle a despachar
    for (const itemD of items_despacho) {
      const cantEntrega = parseFloat(itemD.cantidad_a_entregar) || 0;
      if (cantEntrega <= 0) continue;

      const detalle = custodia.detalles.find((d) => d.id === parseInt(itemD.id_detalle, 10));
      if (detalle) {
        const nuevaEntregada = (parseFloat(detalle.cantidad_entregada) || 0) + cantEntrega;
        const nuevaPendiente = Math.max(0, (parseFloat(detalle.cantidad_total) || 0) - nuevaEntregada);

        await detalle.update({
          cantidad_entregada: nuevaEntregada,
          cantidad_pendiente: nuevaPendiente,
        });

        // Descontar del stock del producto y registrar movimiento en Kardex
        const prod = await Producto.findByPk(detalle.id_producto);
        if (prod) {
          const stockAntes = parseFloat(prod.stock) || 0;
          const stockDespues = Math.max(0, stockAntes - cantEntrega);
          await prod.update({ stock: stockDespues });

          await InventarioMovimiento.create({
            empresa_id: req.empresa_id || 1,
            sucursal_id: req.sucursal_id || null,
            id_producto: prod.id,
            id_usuario: req.user ? req.user.id : 1,
            tipo: 'Salida',
            cantidad: cantEntrega,
            stock_antes: stockAntes,
            stock_despues: stockDespues,
            motivo: `Despacho Custodia ${custodia.codigo} a Obra: ${custodia.direccion_obra || 'Destino'}`,
          });
        }
      }
    }

    // Recalcular estado global de la custodia
    const detallesActualizados = await CustodiaDetalle.findAll({
      where: { id_custodia: custodia.id },
    });

    const totalPendiente = detallesActualizados.reduce(
      (acc, d) => acc + (parseFloat(d.cantidad_pendiente) || 0),
      0
    );
    const totalEntregado = detallesActualizados.reduce(
      (acc, d) => acc + (parseFloat(d.cantidad_entregada) || 0),
      0
    );

    let nuevoEstado = 'Pendiente';
    if (totalPendiente === 0 && totalEntregado > 0) {
      nuevoEstado = 'Completado';
    } else if (totalEntregado > 0) {
      nuevoEstado = 'Entrega Parcial';
    }

    await custodia.update({
      estado: nuevoEstado,
      chofer_flete: chofer_flete ? chofer_flete.trim() : custodia.chofer_flete,
      vehiculo_placa: vehiculo_placa ? vehiculo_placa.trim() : custodia.vehiculo_placa,
      observaciones: observaciones_despacho
        ? (custodia.observaciones ? `${custodia.observaciones} | Despacho: ${observaciones_despacho}` : observaciones_despacho)
        : custodia.observaciones,
    });

    const custodiaRecargada = await Custodia.findByPk(custodia.id, {
      include: [
        {
          model: CustodiaDetalle,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'unidad_medida', 'stock'],
            },
          ],
        },
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'telefono', 'direccion'],
        },
      ],
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'DESPACHO_CUSTODIA',
      entidad: 'Custodia',
      entidad_id: custodia.id,
      detalles: { codigo: custodia.codigo, estado: nuevoEstado, items: items_despacho },
      req,
    });

    res.json({
      success: true,
      message: 'Despacho a obra registrado exitosamente.',
      custodia: custodiaRecargada,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarCustodia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const custodia = await Custodia.findOne({ where });
    if (!custodia) {
      return res.status(404).json({ success: false, message: 'Custodia no encontrada.' });
    }

    await custodia.update({ activo: false, estado: 'Cancelado' });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'ELIMINAR_CUSTODIA',
      entidad: 'Custodia',
      entidad_id: id,
      detalles: { codigo: custodia.codigo },
      req,
    });

    res.json({ success: true, message: 'Orden de custodia cancelada.' });
  } catch (error) {
    next(error);
  }
};

export default {
  getCustodias,
  crearCustodia,
  despacharCustodia,
  eliminarCustodia,
};

