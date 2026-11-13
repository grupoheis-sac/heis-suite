import { CargoAdicional, Reserva } from '../models/index.js';

export const getCargosPorReserva = async (req, res) => {
  try {
    const { reserva_id } = req.params;
    const cargos = await CargoAdicional.findAll({
      where: {
        reserva_id,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      order: [['fecha', 'DESC']]
    });

    res.json({ success: true, data: cargos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const agregarCargo = async (req, res) => {
  try {
    const { reserva_id, concepto, categoria, precio_unitario, cantidad, observaciones } = req.body;
    const cant = parseInt(cantidad) || 1;
    const precio = parseFloat(precio_unitario);
    const subtotal = cant * precio;

    const cargo = await CargoAdicional.create({
      empresa_id: req.empresa_id || 1,
      reserva_id,
      concepto,
      categoria: categoria || 'minibar',
      precio_unitario: precio,
      cantidad: cant,
      subtotal,
      fecha: new Date(),
      observaciones
    });

    // Actualizar total y saldo de la reserva
    const reserva = await Reserva.findByPk(reserva_id);
    if (reserva) {
      const nuevoTotal = parseFloat(reserva.total) + subtotal;
      const nuevoSaldo = parseFloat(reserva.saldo) + subtotal;
      await reserva.update({ total: nuevoTotal, saldo: nuevoSaldo });
    }

    res.status(201).json({ success: true, data: cargo, message: 'Cargo agregado a la habitación' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

