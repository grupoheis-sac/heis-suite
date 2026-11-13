import { Habitacion, TipoHabitacion, Reserva, Huesped } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getHabitaciones = async (req, res) => {
  try {
    const { piso, estado, tipo_id } = req.query;
    const whereClause = {
      activa: true,
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (piso) whereClause.piso = piso;
    if (estado) whereClause.estado = estado;
    if (tipo_id) whereClause.tipo_habitacion_id = tipo_id;

    const habitaciones = await Habitacion.findAll({
      where: whereClause,
      include: [
        { model: TipoHabitacion, as: 'tipo' },
        { model: Usuario, as: 'camarera', attributes: ['id', 'nombre'] },
        {
          model: Reserva,
          as: 'reservas',
          where: { estado: 'checkin' },
          required: false,
          include: [{ model: Huesped, as: 'huesped', attributes: ['id', 'nombre', 'apellido', 'num_documento'] }]
        }
      ],
      order: [['piso', 'ASC'], ['numero', 'ASC']]
    });

    res.json({ success: true, data: habitaciones });
  } catch (error) {
    console.error('Error al listar habitaciones:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHabitacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const hab = await Habitacion.findOne({
      where: {
        id,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [{ model: TipoHabitacion, as: 'tipo' }]
    });

    if (!hab) return res.status(404).json({ success: false, message: 'Habitación no encontrada' });
    res.json({ success: true, data: hab });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, estado_limpieza, notas } = req.body;

    const hab = await Habitacion.findByPk(id);
    if (!hab) return res.status(404).json({ success: false, message: 'Habitación no encontrada' });

    const updateData = {};
    if (estado) updateData.estado = estado;
    if (estado_limpieza) {
      updateData.estado_limpieza = estado_limpieza;
      updateData.limpieza_actualizado = new Date();
      updateData.limpieza_user_id = req.user?.id || null;
    }
    if (notas !== undefined) updateData.limpieza_notas = notas;

    await hab.update(updateData);
    res.json({ success: true, data: hab, message: 'Estado actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTipos = async (req, res) => {
  try {
    const tipos = await TipoHabitacion.findAll({
      where: {
        activo: true,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      order: [['precio_base', 'ASC']]
    });
    res.json({ success: true, data: tipos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearHabitacion = async (req, res) => {
  try {
    const hab = await Habitacion.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
      sucursal_id: req.sucursal_id || 1,
    });
    res.status(201).json({ success: true, data: hab });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

