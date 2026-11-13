import { Op } from 'sequelize';
import { Caja, CajaMovimiento, Venta } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getCajaActual = async (req, res) => {
  try {
    const caja = await Caja.findOne({
      where: {
        estado: 'Abierta',
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        { model: CajaMovimiento, as: 'movimientos' }
      ],
      order: [['fecha_apertura', 'DESC']]
    });

    res.json({ success: true, data: caja });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const aperturarCaja = async (req, res) => {
  try {
    const { monto_inicial = 0, observaciones = '' } = req.body;
    const empresaId = req.empresa_id || 1;
    const userId = req.user?.id || 1;

    // Verificar si ya hay caja abierta
    const abierta = await Caja.findOne({
      where: {
        estado: 'Abierta',
        empresa_id: empresaId
      }
    });

    if (abierta) {
      return res.status(400).json({ success: false, message: 'Ya existe una caja abierta' });
    }

    const nueva = await Caja.create({
      empresa_id: empresaId,
      id_sucursal: req.sucursal_id || 1,
      id_usuario: userId,
      fecha_apertura: new Date(),
      monto_inicial: parseFloat(monto_inicial) || 0,
      total_ventas: 0,
      total_ingresos: 0,
      total_egresos: 0,
      estado: 'Abierta',
      observaciones
    });

    res.status(201).json({ success: true, data: nueva, message: 'Caja aperturada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cerrarCaja = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto_final = 0, observaciones = '' } = req.body;

    const caja = await Caja.findByPk(id);
    if (!caja || caja.estado !== 'Abierta') {
      return res.status(400).json({ success: false, message: 'Caja no encontrada o ya cerrada' });
    }

    const esperado = parseFloat(caja.monto_inicial) + parseFloat(caja.total_ventas) + parseFloat(caja.total_ingresos) - parseFloat(caja.total_egresos);
    const real = parseFloat(monto_final);
    const diferencia = parseFloat((real - esperado).toFixed(2));

    await caja.update({
      fecha_cierre: new Date(),
      monto_final: real,
      saldo_esperado: esperado,
      saldo_real: real,
      diferencia,
      estado: 'Cerrada',
      observaciones: observaciones || caja.observaciones
    });

    res.json({ success: true, data: caja, message: 'Caja cerrada y arqueada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registrarMovimiento = async (req, res) => {
  try {
    const { id_caja, tipo, motivo, monto, comprobante } = req.body;
    const caja = await Caja.findByPk(id_caja);
    if (!caja || caja.estado !== 'Abierta') {
      return res.status(400).json({ success: false, message: 'Caja inválida o cerrada' });
    }

    const mov = await CajaMovimiento.create({
      empresa_id: req.empresa_id || 1,
      id_caja,
      id_usuario: req.user?.id || 1,
      tipo,
      motivo,
      monto: parseFloat(monto),
      comprobante,
      fecha: new Date()
    });

    if (tipo === 'Ingreso') {
      await caja.update({ total_ingresos: parseFloat(caja.total_ingresos) + parseFloat(monto) });
    } else {
      await caja.update({ total_egresos: parseFloat(caja.total_egresos) + parseFloat(monto) });
    }

    res.status(201).json({ success: true, data: mov });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHistorialCajas = async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const cajas = await Caja.findAll({
      where: {
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
      order: [['fecha_apertura', 'DESC']],
      limit: parseInt(limit) || 30
    });

    res.json({ success: true, data: cajas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

