import { Op } from 'sequelize';
import { Lote, Medicamento, KardexFarmacia } from '../models/index.js';

export const getLotes = async (req, res) => {
  try {
    const { id_medicamento, estado } = req.query;
    const whereClause = {
      activo: true,
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (id_medicamento) {
      whereClause.id_medicamento = id_medicamento;
    }

    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (estado === 'vencidos') {
      whereClause.fecha_vencimiento = { [Op.lt]: hoyStr };
    } else if (estado === 'por_vencer') {
      whereClause.fecha_vencimiento = { [Op.between]: [hoyStr, en30Dias] };
    } else if (estado === 'vigentes') {
      whereClause.fecha_vencimiento = { [Op.gt]: en30Dias };
    }

    const lotes = await Lote.findAll({
      where: whereClause,
      include: [
        {
          model: Medicamento,
          as: 'medicamento',
          attributes: ['id', 'nombre_comercial', 'nombre_generico', 'laboratorio', 'concentracion', 'presentacion']
        }
      ],
      order: [['fecha_vencimiento', 'ASC']] // FEFO
    });

    const lotesConDiagnostico = lotes.map(l => {
      const data = l.toJSON();
      const fVenc = new Date(data.fecha_vencimiento + 'T00:00:00');
      const diffMs = fVenc - hoy;
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      let semaforo = 'optimo';
      if (diffDias < 0) semaforo = 'vencido';
      else if (diffDias <= 30) semaforo = 'critico';
      else if (diffDias <= 90) semaforo = 'alerta';

      return {
        ...data,
        dias_restantes: diffDias,
        semaforo
      };
    });

    res.json({ success: true, data: lotesConDiagnostico });
  } catch (error) {
    console.error('Error al obtener lotes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearLote = async (req, res) => {
  try {
    const { id_medicamento, numero_lote, fecha_vencimiento, stock_cajas, stock_fraccion, costo_compra } = req.body;

    const lote = await Lote.create({
      empresa_id: req.empresa_id || 1,
      id_medicamento,
      numero_lote,
      fecha_vencimiento,
      stock_cajas: stock_cajas || 0,
      stock_fraccion: stock_fraccion || 0,
      costo_compra: costo_compra || 0
    });

    // Actualizar stock del medicamento padre
    const med = await Medicamento.findByPk(id_medicamento);
    if (med) {
      const nuevoStock = parseFloat(med.stock_cajas || 0) + parseFloat(stock_cajas || 0);
      await med.update({ stock_cajas: nuevoStock });

      await KardexFarmacia.create({
        empresa_id: req.empresa_id || 1,
        id_medicamento,
        id_lote: lote.id,
        tipo_movimiento: 'ENTRADA',
        cantidad_cajas: stock_cajas || 0,
        saldo_cajas: nuevoStock,
        motivo: `Ingreso Lote ${numero_lote}`,
        referencia_documento: 'INGRESO_LOTE',
        id_usuario: req.user?.id || 1
      });
    }

    res.status(201).json({ success: true, data: lote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

