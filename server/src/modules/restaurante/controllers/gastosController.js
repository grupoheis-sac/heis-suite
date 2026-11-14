import { Gasto } from '../models/index.js';
import { Usuario, CajaGeneral, CajaMovimientoGeneral } from '../../../core/models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getGastos = async (req, res, next) => {
  try {
    const where = {};
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const gastos = await Gasto.findAll({
      where,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, gastos });
  } catch (error) {
    next(error);
  }
};

export const registrarGasto = async (req, res, next) => {
  try {
    const { description, amount, category = 'Insumos Frescos' } = req.body;
    const gasto = await Gasto.create({
      empresa_id: req.empresa_id,
      sucursal_id: req.sucursal_id || null,
      user_id: req.user ? req.user.id : null,
      description,
      amount: parseFloat(amount),
      category,
    });

    // Impactar en Caja General activa (core_cajas)
    try {
      const cajaActiva = await CajaGeneral.findOne({
        where: {
          empresa_id: req.empresa_id,
          estado: 'abierta',
          ...(req.sucursal_id ? { sucursal_id: req.sucursal_id } : {}),
        },
      });
      if (cajaActiva) {
        cajaActiva.total_gastos = parseFloat((parseFloat(cajaActiva.total_gastos || 0) + parseFloat(amount)).toFixed(2));
        await cajaActiva.save();

        await CajaMovimientoGeneral.create({
          empresa_id: req.empresa_id,
          sucursal_id: req.sucursal_id || null,
          id_caja: cajaActiva.id,
          id_usuario: req.user ? req.user.id : null,
          tipo: 'egreso',
          concepto: `Gasto: ${description} (${category})`,
          monto: parseFloat(amount),
          metodo_pago: 'Efectivo',
          origen_modulo: 'restaurante',
          ref_legacy_id: gasto.id,
        });
      }
    } catch (cajaErr) {
      console.warn('⚠️ No se pudo registrar gasto en Caja General:', cajaErr.message);
    }

    await registrarAuditoria({
      modulo: 'restaurante',
      accion: 'REGISTRAR_GASTO',
      entidad: 'Gasto',
      entidad_id: gasto.id,
      detalles: { description, amount, category },
      req,
    });

    res.status(201).json({ success: true, gasto });
  } catch (error) {
    next(error);
  }
};

export const actualizarGasto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const gasto = await Gasto.findOne({
      where: { id, empresa_id: req.empresa_id },
    });
    if (!gasto) {
      return res.status(404).json({ success: false, message: 'Gasto no encontrado.' });
    }

    const { description, amount, category } = req.body;
    await gasto.update({
      description: description !== undefined ? description : gasto.description,
      amount: amount !== undefined ? parseFloat(amount) : gasto.amount,
      category: category !== undefined ? category : gasto.category,
    });

    res.json({ success: true, gasto });
  } catch (error) {
    next(error);
  }
};

export const eliminarGasto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const gasto = await Gasto.findOne({
      where: { id, empresa_id: req.empresa_id },
    });
    if (!gasto) {
      return res.status(404).json({ success: false, message: 'Gasto no encontrado.' });
    }

    await gasto.destroy();
    res.json({ success: true, message: 'Gasto eliminado con éxito.' });
  } catch (error) {
    next(error);
  }
};

export default {
  getGastos,
  registrarGasto,
  actualizarGasto,
  eliminarGasto,
};

