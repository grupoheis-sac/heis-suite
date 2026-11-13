import { Caja, CajaMovimiento, Venta } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getCajaActual = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const caja = await Caja.findOne({
      where: {
        empresa_id: req.empresa_id,
        id_usuario: userId,
        estado: 'Abierta',
      },
      include: [
        {
          model: CajaMovimiento,
          as: 'movimientos',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
        },
      ],
      order: [[{ model: CajaMovimiento, as: 'movimientos' }, 'createdAt', 'DESC']],
    });

    if (!caja) {
      return res.json({
        success: true,
        cajaAbierta: false,
        caja: null,
      });
    }

    // Calcular totales en vivo
    const ventasEfectivo = await Venta.sum('monto_efectivo', {
      where: {
        id_caja: caja.id,
        empresa_id: req.empresa_id,
        estado: 'Completada',
      },
    }) || 0;

    const ventasDigitales = await Venta.sum('monto_digital', {
      where: {
        id_caja: caja.id,
        empresa_id: req.empresa_id,
        estado: 'Completada',
      },
    }) || 0;

    const egresosCaja = await CajaMovimiento.sum('monto', {
      where: {
        id_caja: caja.id,
        tipo: 'Egreso',
      },
    }) || 0;

    const ingresosExtra = await CajaMovimiento.sum('monto', {
      where: {
        id_caja: caja.id,
        tipo: 'Ingreso',
      },
    }) || 0;

    const saldoEsperado =
      parseFloat(caja.monto_inicial) +
      parseFloat(ventasEfectivo) +
      parseFloat(ingresosExtra) -
      parseFloat(egresosCaja);

    res.json({
      success: true,
      cajaAbierta: true,
      caja,
      resumen: {
        monto_inicial: parseFloat(caja.monto_inicial),
        ventas_efectivo: parseFloat(ventasEfectivo),
        ventas_digitales: parseFloat(ventasDigitales),
        ingresos_extra: parseFloat(ingresosExtra),
        egresos: parseFloat(egresosCaja),
        saldo_esperado: parseFloat(saldoEsperado.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const aperturarCaja = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const { monto_inicial = 0, observaciones } = req.body;

    // Verificar si ya tiene caja abierta
    const existente = await Caja.findOne({
      where: {
        empresa_id: req.empresa_id,
        id_usuario: userId,
        estado: 'Abierta',
      },
    });

    if (existente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un turno de caja abierto para este usuario.',
      });
    }

    const nueva = await Caja.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      id_usuario: userId,
      monto_inicial: parseFloat(monto_inicial) || 0,
      estado: 'Abierta',
      observaciones,
      fecha_apertura: new Date(),
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'APERTURA_CAJA',
      entidad: 'Caja',
      entidad_id: nueva.id,
      detalles: { monto_inicial: nueva.monto_inicial },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Caja aperturada exitosamente.',
      caja: nueva,
    });
  } catch (error) {
    next(error);
  }
};

export const cerrarCaja = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const { monto_final = 0, observaciones } = req.body;

    const caja = await Caja.findOne({
      where: {
        empresa_id: req.empresa_id,
        id_usuario: userId,
        estado: 'Abierta',
      },
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ninguna caja abierta para cerrar.',
      });
    }

    await caja.update({
      monto_final: parseFloat(monto_final) || 0,
      estado: 'Cerrada',
      fecha_cierre: new Date(),
      observaciones: observaciones || caja.observaciones,
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'CIERRE_CAJA',
      entidad: 'Caja',
      entidad_id: caja.id,
      detalles: { monto_final },
      req,
    });

    res.json({
      success: true,
      message: 'Caja cerrada y arqueo completado.',
      caja,
    });
  } catch (error) {
    next(error);
  }
};

export const registrarMovimiento = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const { tipo, concepto, monto } = req.body;

    const caja = await Caja.findOne({
      where: {
        empresa_id: req.empresa_id,
        id_usuario: userId,
        estado: 'Abierta',
      },
    });

    if (!caja) {
      return res.status(400).json({
        success: false,
        message: 'Debe tener una caja abierta para registrar movimientos de dinero.',
      });
    }

    const mov = await CajaMovimiento.create({
      empresa_id: req.empresa_id,
      id_caja: caja.id,
      id_usuario: userId,
      tipo, // 'Ingreso' o 'Egreso'
      concepto,
      monto: parseFloat(monto) || 0,
    });

    res.status(201).json({
      success: true,
      message: `${tipo} de caja registrado con éxito.`,
      movimiento: mov,
    });
  } catch (error) {
    next(error);
  }
};

export const getHistorialCajas = async (req, res, next) => {
  try {
    const cajas = await Caja.findAll({
      where: { empresa_id: req.empresa_id },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, cajas });
  } catch (error) {
    next(error);
  }
};

export default {
  getCajaActual,
  aperturarCaja,
  cerrarCaja,
  registrarMovimiento,
  getHistorialCajas,
};

