import { TurnoCaja, MovimientoCaja, Pago } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getCajaActual = async (req, res) => {
  try {
    const turno = await TurnoCaja.findOne({
      where: {
        estado: 'abierto',
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        { model: MovimientoCaja, as: 'movimientos' },
        { model: Pago, as: 'pagos' }
      ],
      order: [['fecha_apertura', 'DESC']]
    });

    res.json({ success: true, data: turno });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const abrirCaja = async (req, res) => {
  try {
    const { monto_apertura = 0, observaciones = '' } = req.body;
    const empresaId = req.empresa_id || 1;

    const abierto = await TurnoCaja.findOne({
      where: { estado: 'abierto', empresa_id: empresaId }
    });

    if (abierto) {
      return res.status(400).json({ success: false, message: 'Ya existe un turno de caja abierto' });
    }

    const nuevo = await TurnoCaja.create({
      empresa_id: empresaId,
      sucursal_id: req.sucursal_id || 1,
      user_id: req.user?.id || 1,
      monto_apertura: parseFloat(monto_apertura) || 0,
      estado: 'abierto',
      observaciones
    });

    res.status(201).json({ success: true, data: nuevo, message: 'Turno de caja aperturado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cerrarCaja = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto_cierre_real = 0, observaciones = '' } = req.body;

    const turno = await TurnoCaja.findByPk(id, {
      include: [{ model: MovimientoCaja, as: 'movimientos' }, { model: Pago, as: 'pagos' }]
    });

    if (!turno || turno.estado !== 'abierto') {
      return res.status(400).json({ success: false, message: 'Turno no encontrado o cerrado' });
    }

    let totalPagos = 0;
    (turno.pagos || []).forEach(p => { totalPagos += parseFloat(p.monto || 0); });
    let totalIngresos = 0;
    let totalEgresos = 0;
    (turno.movimientos || []).forEach(m => {
      if (m.tipo === 'ingreso') totalIngresos += parseFloat(m.monto || 0);
      else totalEgresos += parseFloat(m.monto || 0);
    });

    const esperado = parseFloat(turno.monto_apertura) + totalPagos + totalIngresos - totalEgresos;
    const real = parseFloat(monto_cierre_real);
    const diferencia = parseFloat((real - esperado).toFixed(2));

    await turno.update({
      fecha_cierre: new Date(),
      monto_cierre_sistema: esperado,
      monto_cierre_real: real,
      diferencia,
      estado: 'cerrado',
      observaciones: observaciones || turno.observaciones
    });

    res.json({ success: true, data: turno, message: 'Turno de caja cerrado con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registrarMovimiento = async (req, res) => {
  try {
    const { turno_id, tipo, monto, motivo, comprobante } = req.body;
    const mov = await MovimientoCaja.create({
      empresa_id: req.empresa_id || 1,
      turno_id,
      tipo,
      monto: parseFloat(monto),
      motivo,
      comprobante,
      fecha: new Date()
    });

    res.status(201).json({ success: true, data: mov });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

