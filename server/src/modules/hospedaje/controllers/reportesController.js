import { Habitacion, Reserva, Factura } from '../models/index.js';

export const getDashboard = async (req, res) => {
  try {
    const empresaId = req.empresa_id || 1;
    const habitaciones = await Habitacion.findAll({ where: { empresa_id: empresaId, activa: true } });
    const reservasActivas = await Reserva.count({ where: { empresa_id: empresaId, estado: 'checkin' } });
    const reservasPendientes = await Reserva.count({ where: { empresa_id: empresaId, estado: 'confirmada' } });

    const totalHab = habitaciones.length || 1;
    const ocupadas = habitaciones.filter(h => h.estado === 'ocupada').length;
    const disponibles = habitaciones.filter(h => h.estado === 'disponible').length;
    const limpieza = habitaciones.filter(h => h.estado_limpieza === 'sucia' || h.estado_limpieza === 'en_limpieza').length;
    const tasaOcupacion = parseFloat(((ocupadas / totalHab) * 100).toFixed(1));

    const facturas = await Factura.findAll({ where: { empresa_id: empresaId, estado: 'pagada' } });
    let totalIngresos = 0;
    facturas.forEach(f => { totalIngresos += parseFloat(f.total || 0); });

    res.json({
      success: true,
      data: {
        totalHabitaciones: totalHab,
        disponibles,
        ocupadas,
        enLimpieza: limpieza,
        tasaOcupacion,
        reservasActivas,
        reservasPendientes,
        totalIngresos: parseFloat(totalIngresos.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

