import { Op } from 'sequelize';
import { Huesped, Reserva, Habitacion } from '../models/index.js';

export const getHuespedes = async (req, res) => {
  try {
    const { busqueda, clasificacion } = req.query;
    const whereClause = {
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (clasificacion) whereClause.clasificacion = clasificacion;

    if (busqueda) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { num_documento: { [Op.like]: `%${busqueda}%` } },
        { telefono: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const huespedes = await Huesped.findAll({
      where: whereClause,
      include: [
        {
          model: Reserva,
          as: 'reservas',
          limit: 5,
          order: [['fecha_entrada', 'DESC']],
          include: [{ model: Habitacion, as: 'habitacion' }]
        }
      ],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });

    res.json({ success: true, data: huespedes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearHuesped = async (req, res) => {
  try {
    const huesped = await Huesped.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
    });
    res.status(201).json({ success: true, data: huesped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHuespedPorDocumento = async (req, res) => {
  try {
    const { doc } = req.params;
    const huesped = await Huesped.findOne({
      where: {
        num_documento: doc,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      }
    });

    if (!huesped) return res.status(404).json({ success: false, message: 'Huésped no registrado' });
    res.json({ success: true, data: huesped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLibroMincetur = async (req, res) => {
  try {
    const { anio, mes } = req.query;
    // Registro oficial de huéspedes MINCETUR
    const huespedes = await Huesped.findAll({
      where: {
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [{ model: Reserva, as: 'reservas', include: [{ model: Habitacion, as: 'habitacion' }] }]
    });

    res.json({ success: true, data: huespedes, total: huespedes.length, fuente: 'Libro Oficial de Huéspedes MINCETUR / PNP' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

