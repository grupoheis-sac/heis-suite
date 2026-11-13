import { Op } from 'sequelize';
import { AuditoriaLog } from '../models/index.js';

export async function listarAuditoria(req, res) {
  try {
    const { modulo, accion, fecha_desde, fecha_hasta, limit = 50, page = 1 } = req.query;

    const where = {
      empresa_id: req.empresa_id,
    };

    if (modulo && modulo !== 'TODOS') {
      where.modulo = modulo;
    }

    if (accion && accion !== 'TODAS') {
      where.accion = { [Op.like]: `%${accion}%` };
    }

    if (fecha_desde && fecha_hasta) {
      where.created_at = {
        [Op.between]: [new Date(fecha_desde), new Date(fecha_hasta)],
      };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await AuditoriaLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

