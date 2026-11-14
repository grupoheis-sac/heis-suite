import { Area, Mesa, Orden, OrdenDetalle, Producto } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';
import sequelize from '../../../config/db.js';
import { emitTenantEvent } from '../../../core/services/realtime.service.js';

export const getAreas = async (req, res, next) => {
  try {
    const whereArea = { is_active: true };
    if (req.empresa_id) whereArea.empresa_id = req.empresa_id;

    const areas = await Area.findAll({
      where: whereArea,
      include: [
        {
          model: Mesa,
          as: 'mesas',
          include: [
            {
              model: Orden,
              as: 'ordenes',
              where: { status: ['pending', 'cooking', 'served'] },
              required: false,
              include: [
                { model: Usuario, as: 'mozo', attributes: ['id', 'nombre', 'email'] },
                {
                  model: OrdenDetalle,
                  as: 'detalles',
                  include: [{ model: Producto, as: 'producto', attributes: ['name', 'price'] }],
                },
              ],
            },
          ],
        },
      ],
      order: [['id', 'ASC']],
    });

    res.json({ success: true, areas });
  } catch (error) {
    next(error);
  }
};

export const getMesaDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const mesa = await Mesa.findOne({
      where,
      include: [
        { model: Area, as: 'area' },
        {
          model: Orden,
          as: 'ordenes',
          where: { status: ['pending', 'cooking', 'served'] },
          required: false,
          include: [
            { model: Usuario, as: 'mozo', attributes: ['id', 'nombre', 'email'] },
            {
              model: OrdenDetalle,
              as: 'detalles',
              include: [{ model: Producto, as: 'producto' }],
            },
          ],
        },
      ],
    });

    if (!mesa) {
      return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
    }

    res.json({ success: true, mesa });
  } catch (error) {
    next(error);
  }
};

export const crearMesa = async (req, res, next) => {
  try {
    const { area_id, name, seats = 4 } = req.body;
    const mesa = await Mesa.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      area_id,
      name,
      seats,
      status: 'available',
    });

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'CREAR_MESA',
      entidad: 'Mesa',
      entidad_id: mesa.id,
      detalles: { name: mesa.name, area_id },
      req,
    });

    res.status(201).json({ success: true, mesa });
  } catch (error) {
    next(error);
  }
};

export const actualizarMesa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const mesa = await Mesa.findOne({ where });
    if (!mesa) {
      return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
    }

    await mesa.update(req.body);
    res.json({ success: true, mesa });
  } catch (error) {
    next(error);
  }
};

export const crearArea = async (req, res, next) => {
  try {
    const { name } = req.body;
    const area = await Area.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      name,
    });

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'CREAR_AREA',
      entidad: 'Area',
      entidad_id: area.id,
      detalles: { name: area.name },
      req,
    });

    res.status(201).json({ success: true, area });
  } catch (error) {
    next(error);
  }
};

export const cambiarMesa = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { mesaOrigenId, mesaDestinoId, motivo = 'Solicitado por el cliente' } = req.body;

    if (!mesaOrigenId || !mesaDestinoId) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Se requiere mesa de origen y mesa de destino.' });
    }

    if (String(mesaOrigenId) === String(mesaDestinoId)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'La mesa destino no puede ser la misma que la de origen.' });
    }

    const mesaOrigen = await Mesa.findOne({
      where: { id: mesaOrigenId, empresa_id: req.empresa_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const mesaDestino = await Mesa.findOne({
      where: { id: mesaDestinoId, empresa_id: req.empresa_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!mesaOrigen || !mesaDestino) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Una o ambas mesas no fueron encontradas.' });
    }

    if (mesaDestino.status !== 'available') {
      await t.rollback();
      return res.status(400).json({ success: false, message: `La mesa destino "${mesaDestino.name}" no está disponible (estado actual: ${mesaDestino.status}).` });
    }

    // Buscar orden activa en mesa de origen
    const orden = await Orden.findOne({
      where: {
        table_id: mesaOrigenId,
        empresa_id: req.empresa_id,
        status: ['pending', 'cooking', 'served', 'billed'],
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!orden) {
      await t.rollback();
      return res.status(400).json({ success: false, message: `La mesa "${mesaOrigen.name}" no tiene ninguna comanda activa para transferir.` });
    }

    const estadoPrevioOrigen = mesaOrigen.status;

    // Transferir orden a la nueva mesa
    await orden.update({
      table_id: mesaDestinoId,
      notes: orden.notes ? `${orden.notes} | Cambio de mesa: ${mesaOrigen.name} -> ${mesaDestino.name} (${motivo})` : `Cambio de mesa: ${mesaOrigen.name} -> ${mesaDestino.name}`,
    }, { transaction: t });

    // Actualizar estados de mesas
    await mesaDestino.update({ status: estadoPrevioOrigen || 'occupied' }, { transaction: t });
    await mesaOrigen.update({ status: 'available' }, { transaction: t });

    await t.commit();

    emitTenantEvent(req.empresa_id, 'mesas:updated', {
      cambio: true,
      origenId: mesaOrigenId,
      destinoId: mesaDestinoId,
      nombreOrigen: mesaOrigen.name,
      nombreDestino: mesaDestino.name,
    }, req.sucursal_id);

    emitTenantEvent(req.empresa_id, 'kds:updated', {
      order_id: orden.id,
      mesa: mesaDestino.name,
      accion: 'CAMBIO_MESA',
    }, req.sucursal_id);

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'CAMBIAR_MESA',
      entidad: 'Mesa',
      entidad_id: mesaDestinoId,
      detalles: { de: mesaOrigen.name, a: mesaDestino.name, motivo, orden_id: orden.id },
      req,
    });

    res.json({
      success: true,
      message: `Comanda transferida exitosamente de ${mesaOrigen.name} a ${mesaDestino.name}.`,
      mesaOrigen,
      mesaDestino,
      orden,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const unirMesas = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { mesaPrincipalId, mesasSecundariasIds = [] } = req.body;

    if (!mesaPrincipalId || !Array.isArray(mesasSecundariasIds) || mesasSecundariasIds.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Debe seleccionar una mesa principal y al menos una mesa secundaria para unir.' });
    }

    const mesaPrincipal = await Mesa.findOne({
      where: { id: mesaPrincipalId, empresa_id: req.empresa_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!mesaPrincipal) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Mesa principal no encontrada.' });
    }

    // Obtener u originar orden activa en mesa principal
    let ordenPrincipal = await Orden.findOne({
      where: {
        table_id: mesaPrincipalId,
        empresa_id: req.empresa_id,
        status: ['pending', 'cooking', 'served'],
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!ordenPrincipal) {
      ordenPrincipal = await Orden.create({
        empresa_id: req.empresa_id,
        sucursal_id: req.sucursal_id || null,
        table_id: mesaPrincipalId,
        user_id: req.user?.id || null,
        status: 'pending',
        client_name: `Grupo Mesas (Mesa ${mesaPrincipal.name})`,
        notes: `Mesa unificada`,
        subtotal: 0,
        total: 0,
      }, { transaction: t });
    }

    const nombresSecundarias = [];

    for (const secId of mesasSecundariasIds) {
      if (String(secId) === String(mesaPrincipalId)) continue;

      const mesaSec = await Mesa.findOne({
        where: { id: secId, empresa_id: req.empresa_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!mesaSec) continue;
      nombresSecundarias.push(mesaSec.name);

      const ordenSec = await Orden.findOne({
        where: {
          table_id: secId,
          empresa_id: req.empresa_id,
          status: ['pending', 'cooking', 'served', 'billed'],
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (ordenSec) {
        // Mover todos los detalles a la orden principal
        await OrdenDetalle.update(
          { order_id: ordenPrincipal.id, note: sequelize.literal(`CONCAT(COALESCE(note, ''), ' [De Mesa ${mesaSec.name}]')`) },
          { where: { order_id: ordenSec.id }, transaction: t }
        );

        // Cancelar orden secundaria marcada como unida
        await ordenSec.update({
          status: 'cancelled',
          notes: `Unida a orden #${ordenPrincipal.id} (Mesa ${mesaPrincipal.name})`,
        }, { transaction: t });
      }

      // Liberar mesa secundaria
      await mesaSec.update({ status: 'available' }, { transaction: t });
    }

    // Recalcular totales de la orden principal
    const todosDetalles = await OrdenDetalle.findAll({
      where: { order_id: ordenPrincipal.id },
      transaction: t,
    });

    const nuevoSubtotal = todosDetalles.reduce((acc, d) => acc + parseFloat(d.subtotal || 0), 0);
    const desc = parseFloat(ordenPrincipal.discount) || 0;
    const propina = parseFloat(ordenPrincipal.tip) || 0;
    const nuevoTotal = parseFloat(Math.max(0, nuevoSubtotal - desc + propina).toFixed(2));

    await ordenPrincipal.update({
      subtotal: nuevoSubtotal,
      total: nuevoTotal,
      notes: `${ordenPrincipal.notes || ''} | Unida con mesas: ${nombresSecundarias.join(', ')}`.trim(),
    }, { transaction: t });

    await mesaPrincipal.update({ status: 'occupied' }, { transaction: t });

    await t.commit();

    emitTenantEvent(req.empresa_id, 'mesas:updated', {
      unir: true,
      principalId: mesaPrincipalId,
      secundarias: mesasSecundariasIds,
    }, req.sucursal_id);

    emitTenantEvent(req.empresa_id, 'kds:updated', {
      order_id: ordenPrincipal.id,
      mesa: mesaPrincipal.name,
      accion: 'UNIR_MESAS',
    }, req.sucursal_id);

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'UNIR_MESAS',
      entidad: 'Mesa',
      entidad_id: mesaPrincipalId,
      detalles: { mesaPrincipal: mesaPrincipal.name, mesasSecundarias: nombresSecundarias, nuevoTotal },
      req,
    });

    res.json({
      success: true,
      message: `Mesas unidas exitosamente a ${mesaPrincipal.name}. Total unificado: S/ ${nuevoTotal.toFixed(2)}.`,
      mesaPrincipal,
      orden: ordenPrincipal,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export default {
  getAreas,
  getMesaDetalle,
  crearMesa,
  actualizarMesa,
  crearArea,
  cambiarMesa,
  unirMesas,
};

