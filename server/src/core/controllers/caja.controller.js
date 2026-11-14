import { Op } from 'sequelize';
import { CajaGeneral, CajaMovimientoGeneral, Usuario } from '../models/index.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';

export async function obtenerCajaActual(req, res) {
  try {
    const caja = await CajaGeneral.findOne({
      where: {
        empresa_id: req.empresa_id,
        estado: 'Abierta',
      },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        {
          model: CajaMovimientoGeneral,
          as: 'movimientos',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
        },
      ],
      order: [['fecha_apertura', 'DESC']],
    });

    if (!caja) {
      return res.json({ success: true, cajaAbierta: false, caja: null, data: null });
    }

    const ingresosExtra = (caja.movimientos || [])
      .filter((m) => m.tipo === 'Ingreso')
      .reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);

    const egresosCaja = (caja.movimientos || [])
      .filter((m) => m.tipo === 'Egreso')
      .reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);

    const saldoEsperado =
      parseFloat(caja.monto_inicial || 0) +
      parseFloat(caja.total_ventas_efectivo || 0) +
      ingresosExtra -
      egresosCaja;

    return res.json({
      success: true,
      cajaAbierta: true,
      caja,
      data: caja,
      resumen: {
        monto_inicial: parseFloat(caja.monto_inicial || 0),
        ventas_efectivo: parseFloat(caja.total_ventas_efectivo || 0),
        ventas_digitales: parseFloat(caja.total_ventas_digital || 0),
        ingresos_extra: parseFloat(ingresosExtra.toFixed(2)),
        egresos: parseFloat(egresosCaja.toFixed(2)),
        saldo_esperado: parseFloat(saldoEsperado.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function aperturarCajaGeneral(req, res) {
  try {
    const { monto_inicial = 0, monto_apertura, observaciones = '', origen_modulo = 'general' } = req.body;
    const montoBase = parseFloat(monto_apertura !== undefined ? monto_apertura : monto_inicial) || 0;

    const abierta = await CajaGeneral.findOne({
      where: { empresa_id: req.empresa_id, estado: 'Abierta' },
    });

    if (abierta) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un turno de caja abierto en esta empresa.',
      });
    }

    const nueva = await CajaGeneral.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      id_usuario: req.user.id,
      origen_modulo,
      monto_inicial: montoBase,
      estado: 'Abierta',
      observaciones,
      fecha_apertura: new Date(),
    });

    await registrarAuditoria({
      modulo: origen_modulo,
      accion: 'APERTURA_CAJA_UNIFICADA',
      entidad: 'CajaGeneral',
      entidad_id: nueva.id,
      detalles: { monto_inicial: nueva.monto_inicial, origen_modulo },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Caja aperturada exitosamente',
      caja: nueva,
      data: nueva,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function registrarMovimientoGeneral(req, res) {
  try {
    const { id_caja, turno_id, tipo, concepto, motivo, monto, comprobante, origen_modulo = 'general' } = req.body;
    const targetCajaId = id_caja || turno_id;

    const caja = targetCajaId
      ? await CajaGeneral.findByPk(targetCajaId)
      : await CajaGeneral.findOne({ where: { empresa_id: req.empresa_id, estado: 'Abierta' } });

    if (!caja || caja.estado !== 'Abierta') {
      return res.status(400).json({ success: false, message: 'No hay una caja abierta válida' });
    }

    const tipoNorm = String(tipo).toLowerCase() === 'ingreso' ? 'Ingreso' : 'Egreso';
    const mov = await CajaMovimientoGeneral.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      id_caja: caja.id,
      id_usuario: req.user.id,
      origen_modulo,
      tipo: tipoNorm,
      concepto: concepto || motivo || 'Movimiento de caja',
      comprobante: comprobante || null,
      monto: parseFloat(monto) || 0,
      fecha: new Date(),
    });

    if (tipoNorm === 'Ingreso') {
      await caja.update({ total_ingresos: parseFloat(caja.total_ingresos || 0) + parseFloat(monto || 0) });
    } else {
      await caja.update({ total_egresos: parseFloat(caja.total_egresos || 0) + parseFloat(monto || 0) });
    }

    res.status(201).json({ success: true, data: mov, movimiento: mov });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function cerrarCajaGeneral(req, res) {
  try {
    const { id } = req.params;
    const { monto_final, monto_cierre_real, observaciones = '' } = req.body;
    const real = parseFloat(monto_cierre_real !== undefined ? monto_cierre_real : monto_final) || 0;

    const caja = id
      ? await CajaGeneral.findByPk(id)
      : await CajaGeneral.findOne({ where: { empresa_id: req.empresa_id, estado: 'Abierta' } });

    if (!caja || caja.estado !== 'Abierta') {
      return res.status(404).json({ success: false, message: 'Caja no encontrada o ya cerrada' });
    }

    const esperado =
      parseFloat(caja.monto_inicial || 0) +
      parseFloat(caja.total_ventas_efectivo || 0) +
      parseFloat(caja.total_ingresos || 0) -
      parseFloat(caja.total_egresos || 0);

    const diferencia = parseFloat((real - esperado).toFixed(2));

    await caja.update({
      fecha_cierre: new Date(),
      monto_final: real,
      saldo_esperado: parseFloat(esperado.toFixed(2)),
      diferencia,
      estado: 'Cerrada',
      observaciones: observaciones || caja.observaciones,
    });

    res.json({
      success: true,
      message: 'Turno de caja cerrado y arqueado correctamente',
      caja,
      data: caja,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerHistorialCajasGeneral(req, res) {
  try {
    const { fecha_inicio, fecha_fin, estado, origen_modulo } = req.query;
    const where = { empresa_id: req.empresa_id };

    if (estado && estado !== 'Todos') where.estado = estado;
    if (origen_modulo) where.origen_modulo = origen_modulo;
    if (fecha_inicio && fecha_fin) {
      where.fecha_apertura = {
        [Op.between]: [new Date(`${fecha_inicio}T00:00:00`), new Date(`${fecha_fin}T23:59:59`)],
      };
    }

    const cajas = await CajaGeneral.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        { model: CajaMovimientoGeneral, as: 'movimientos' },
      ],
      order: [['fecha_apertura', 'DESC']],
      limit: 100,
    });

    res.json({ success: true, cajas, data: cajas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerUltimoCierre(req, res) {
  try {
    const caja = await CajaGeneral.findOne({
      where: {
        empresa_id: req.empresa_id,
        estado: 'Cerrada',
      },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
      order: [['fecha_cierre', 'DESC']],
    });

    res.json({ success: true, caja, data: { caja } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerDetalleCierreCaja(req, res) {
  try {
    const { id } = req.params;
    const caja = await CajaGeneral.findOne({
      where: {
        id,
        empresa_id: req.empresa_id,
      },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        {
          model: CajaMovimientoGeneral,
          as: 'movimientos',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
        },
      ],
    });

    if (!caja) {
      return res.status(404).json({ success: false, message: 'Caja no encontrada' });
    }

    const ingresosExtra = (caja.movimientos || [])
      .filter((m) => m.tipo === 'Ingreso')
      .reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);

    const egresosCaja = (caja.movimientos || [])
      .filter((m) => m.tipo === 'Egreso')
      .reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);

    const saldoEsperado =
      parseFloat(caja.monto_inicial || 0) +
      parseFloat(caja.total_ventas_efectivo || 0) +
      ingresosExtra -
      egresosCaja;

    const cajaData = caja.toJSON();
    cajaData.saldo_esperado = parseFloat(saldoEsperado.toFixed(2));

    res.json({
      success: true,
      caja: cajaData,
      data: cajaData,
      resumen: {
        monto_inicial: parseFloat(caja.monto_inicial || 0),
        ventas_efectivo: parseFloat(caja.total_ventas_efectivo || 0),
        ventas_digitales: parseFloat(caja.total_ventas_digital || 0),
        ingresos_extra: parseFloat(ingresosExtra.toFixed(2)),
        egresos: parseFloat(egresosCaja.toFixed(2)),
        saldo_esperado: parseFloat(saldoEsperado.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
