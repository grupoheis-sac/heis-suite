import { Op } from 'sequelize';
import sequelize from '../../../config/db.js';
import {
  Reserva,
  Habitacion,
  TipoHabitacion,
  Huesped,
  Acompanante,
  CargoAdicional,
  Factura,
  Pago
} from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getReservas = async (req, res) => {
  try {
    const { estado, fecha, habitacion_id } = req.query;
    const whereClause = {
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (estado) whereClause.estado = estado;
    if (habitacion_id) whereClause.habitacion_id = habitacion_id;

    const reservas = await Reserva.findAll({
      where: whereClause,
      include: [
        {
          model: Habitacion,
          as: 'habitacion',
          include: [{ model: TipoHabitacion, as: 'tipo' }]
        },
        { model: Huesped, as: 'huesped' },
        { model: Acompanante, as: 'acompanantes' },
        { model: CargoAdicional, as: 'cargos' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha_entrada', 'DESC']]
    });

    res.json({ success: true, data: reservas });
  } catch (error) {
    console.error('Error al listar reservas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearReserva = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      huesped_id,
      habitacion_id,
      fecha_entrada,
      fecha_salida,
      precio_noche,
      num_noches = 1,
      adelanto = 0,
      modalidad = 'noches',
      num_personas = 1,
      acompanantes = [],
      observaciones
    } = req.body;

    const subtotal = parseFloat(precio_noche) * parseInt(num_noches);
    const total = subtotal;
    const saldo = Math.max(0, total - (parseFloat(adelanto) || 0));

    const count = await Reserva.count({ where: { empresa_id: req.empresa_id || 1 } });
    const codigo = `RES-${String(count + 1).padStart(6, '0')}`;

    const reserva = await Reserva.create({
      empresa_id: req.empresa_id || 1,
      sucursal_id: req.sucursal_id || 1,
      codigo,
      huesped_id,
      habitacion_id,
      user_id: req.user?.id || 1,
      fecha_entrada,
      fecha_salida,
      num_personas,
      modalidad,
      precio_noche,
      num_noches,
      subtotal,
      total,
      adelanto: parseFloat(adelanto) || 0,
      saldo,
      estado: 'confirmada',
      observaciones
    }, { transaction: t });

    // Acompañantes
    for (const a of acompanantes) {
      await Acompanante.create({
        empresa_id: req.empresa_id || 1,
        reserva_id: reserva.id,
        nombre: a.nombre,
        apellido: a.apellido,
        tipo_documento: a.tipo_documento || 'DNI',
        num_documento: a.num_documento,
        nacionalidad: a.nacionalidad || 'Peruana',
        parentesco: a.parentesco || 'Acompañante'
      }, { transaction: t });
    }

    // Actualizar estado de habitación a reservada
    await Habitacion.update(
      { estado: 'reservada' },
      { where: { id: habitacion_id }, transaction: t }
    );

    await t.commit();
    res.status(201).json({ success: true, data: reserva, message: 'Reserva creada exitosamente' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkIn = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const reserva = await Reserva.findByPk(id, { transaction: t });
    if (!reserva) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    await reserva.update({
      estado: 'checkin',
      fecha_checkin: new Date(),
      tarjeta_llave_codigo: req.body.tarjeta_llave_codigo || reserva.tarjeta_llave_codigo
    }, { transaction: t });

    await Habitacion.update(
      { estado: 'ocupada' },
      { where: { id: reserva.habitacion_id }, transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: 'Check-In procesado. Habitación ocupada.' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkOut = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const reserva = await Reserva.findByPk(id, {
      include: [{ model: CargoAdicional, as: 'cargos' }],
      transaction: t
    });

    if (!reserva) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    await reserva.update({
      estado: 'checkout',
      fecha_checkout: new Date()
    }, { transaction: t });

    // Habitación pasa a sucia/limpieza pendiente
    await Habitacion.update(
      { estado: 'disponible', estado_limpieza: 'sucia' },
      { where: { id: reserva.habitacion_id }, transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: 'Check-Out completado. Habitación liberada para limpieza.' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

