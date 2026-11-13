import { Reserva, Mesa } from '../models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getReservas = async (req, res, next) => {
  try {
    const where = {};
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const reservas = await Reserva.findAll({
      where,
      include: [{ model: Mesa, as: 'mesa', attributes: ['name', 'seats'] }],
      order: [['reservation_time', 'ASC']],
    });
    res.json({ success: true, reservas });
  } catch (error) {
    next(error);
  }
};

export const crearReserva = async (req, res, next) => {
  try {
    const { client_name, phone, reservation_time, people = 2, table_id = null, note = '' } = req.body;
    const reserva = await Reserva.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      client_name,
      phone,
      reservation_time,
      people: Number(people) || 2,
      table_id: table_id ? table_id : null,
      note,
      status: 'pending',
    });

    if (table_id) {
      await Mesa.update(
        { status: 'reserved' },
        { where: { id: table_id, empresa_id: req.empresa_id } }
      );
    }

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'CREAR_RESERVA',
      entidad: 'Reserva',
      entidad_id: reserva.id,
      detalles: { cliente: client_name, fecha: reservation_time, personas: people },
      req,
    });

    res.status(201).json({ success: true, reserva });
  } catch (error) {
    next(error);
  }
};

export const actualizarReserva = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const reserva = await Reserva.findOne({ where });
    if (!reserva) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
    }

    const previousTableId = reserva.table_id;
    const newTableId = req.body.table_id !== undefined ? (req.body.table_id ? req.body.table_id : null) : previousTableId;

    await reserva.update({
      ...req.body,
      table_id: newTableId,
    });

    // Actualizar estado de mesas si hubo cambio
    if (newTableId !== previousTableId) {
      if (previousTableId) {
        const mesaPrevWhere = { id: previousTableId };
        if (req.empresa_id) mesaPrevWhere.empresa_id = req.empresa_id;
        await Mesa.update({ status: 'available' }, { where: mesaPrevWhere });
      }
      if (newTableId) {
        const mesaNewWhere = { id: newTableId };
        if (req.empresa_id) mesaNewWhere.empresa_id = req.empresa_id;
        await Mesa.update({ status: 'reserved' }, { where: mesaNewWhere });
      }
    }

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'ACTUALIZAR_RESERVA',
      entidad: 'Reserva',
      entidad_id: reserva.id,
      detalles: { cliente: reserva.client_name, mesa: newTableId },
      req,
    });

    res.json({ success: true, reserva });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoReserva = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed', 'cancelled', 'completed', 'pending'

    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const reserva = await Reserva.findOne({ where });
    if (!reserva) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
    }

    await reserva.update({ status });

    if (reserva.table_id) {
      const mesaWhere = { id: reserva.table_id };
      if (req.empresa_id) mesaWhere.empresa_id = req.empresa_id;

      if (status === 'cancelled' || status === 'completed') {
        await Mesa.update({ status: 'available' }, { where: mesaWhere });
      } else if (status === 'confirmed' || status === 'pending') {
        await Mesa.update({ status: 'reserved' }, { where: mesaWhere });
      }
    }

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'CAMBIAR_ESTADO_RESERVA',
      entidad: 'Reserva',
      entidad_id: reserva.id,
      detalles: { cliente: reserva.client_name, nuevo_estado: status },
      req,
    });

    res.json({ success: true, reserva });
  } catch (error) {
    next(error);
  }
};

export const eliminarReserva = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const reserva = await Reserva.findOne({ where });
    if (!reserva) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
    }

    if (reserva.table_id) {
      const mesaWhere = { id: reserva.table_id };
      if (req.empresa_id) mesaWhere.empresa_id = req.empresa_id;
      await Mesa.update({ status: 'available' }, { where: mesaWhere });
    }

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'ELIMINAR_RESERVA',
      entidad: 'Reserva',
      entidad_id: id,
      detalles: { cliente: reserva.client_name },
      req,
    });

    await reserva.destroy();
    res.json({ success: true, message: 'Reserva eliminada con éxito.' });
  } catch (error) {
    next(error);
  }
};

export default {
  getReservas,
  crearReserva,
  actualizarReserva,
  cambiarEstadoReserva,
  eliminarReserva,
};

