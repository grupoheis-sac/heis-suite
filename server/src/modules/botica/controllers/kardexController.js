import { Op } from 'sequelize';
import { KardexFarmacia, Medicamento, Lote } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getKardex = async (req, res) => {
  try {
    const { id_medicamento, fecha_inicio, fecha_fin, limit = 100 } = req.query;
    const whereClause = {
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (id_medicamento) {
      whereClause.id_medicamento = id_medicamento;
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [new Date(`${fecha_inicio}T00:00:00`), new Date(`${fecha_fin}T23:59:59`)]
      };
    }

    const movimientos = await KardexFarmacia.findAll({
      where: whereClause,
      include: [
        { model: Medicamento, as: 'medicamento', attributes: ['id', 'nombre_comercial', 'nombre_generico', 'concentracion'] },
        { model: Lote, as: 'lote', attributes: ['id', 'numero_lote', 'fecha_vencimiento'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit) || 100
    });

    res.json({ success: true, data: movimientos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumen = async (req, res) => {
  try {
    const meds = await Medicamento.findAll({
      where: {
        activo: true,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      }
    });

    let totalProductos = meds.length;
    let stockBajo = 0;
    let valorizadoCompra = 0;
    let valorizadoVenta = 0;

    for (const m of meds) {
      const stock = parseFloat(m.stock_cajas || 0);
      const min = parseFloat(m.stock_minimo || 0);
      if (stock <= min) stockBajo++;
      valorizadoCompra += stock * parseFloat(m.precio_compra || 0);
      valorizadoVenta += stock * parseFloat(m.precio_venta || 0);
    }

    res.json({
      success: true,
      data: {
        totalProductos,
        stockBajo,
        valorizadoCompra: parseFloat(valorizadoCompra.toFixed(2)),
        valorizadoVenta: parseFloat(valorizadoVenta.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

