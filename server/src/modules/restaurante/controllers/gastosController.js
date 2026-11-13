import { Gasto } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';
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

