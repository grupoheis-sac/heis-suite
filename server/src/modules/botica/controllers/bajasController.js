import { ActaBaja, ActaBajaDetalle, Medicamento, Lote, KardexFarmacia } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getActasBaja = async (req, res) => {
  try {
    const actas = await ActaBaja.findAll({
      where: {
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [
        { model: Usuario, as: 'usuario_qf', attributes: ['id', 'nombre'] },
        {
          model: ActaBajaDetalle,
          as: 'detalles',
          include: [{ model: Medicamento, as: 'medicamento' }, { model: Lote, as: 'lote' }]
        }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json({ success: true, data: actas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearActaBaja = async (req, res) => {
  try {
    const { motivo, observaciones, items = [] } = req.body;
    const empresaId = req.empresa_id || 1;
    const count = await ActaBaja.count({ where: { empresa_id: empresaId } });
    const numero_acta = `ACTA-${String(count + 1).padStart(6, '0')}`;

    const acta = await ActaBaja.create({
      empresa_id: empresaId,
      id_sucursal: req.sucursal_id || 1,
      numero_acta,
      motivo: motivo || 'Vencimiento',
      id_usuario_qf: req.user?.id || 1,
      fecha: new Date().toISOString().split('T')[0],
      observaciones,
      estado: 'Aprobada'
    });

    for (const item of items) {
      const cant = parseFloat(item.cantidad);
      const costo = parseFloat(item.costo_unitario || 0);
      await ActaBajaDetalle.create({
        empresa_id: empresaId,
        id_acta_baja: acta.id,
        id_medicamento: item.id_medicamento,
        id_lote: item.id_lote || null,
        formato: item.formato || 'Caja',
        cantidad: cant,
        costo_unitario: costo,
        total_perdida: cant * costo
      });

      // Descontar medicamento
      const med = await Medicamento.findByPk(item.id_medicamento);
      if (med) {
        const nuevoStock = Math.max(0, parseFloat(med.stock_cajas) - cant);
        await med.update({ stock_cajas: nuevoStock });

        if (item.id_lote) {
          const lote = await Lote.findByPk(item.id_lote);
          if (lote) {
            await lote.update({ stock_cajas: Math.max(0, parseFloat(lote.stock_cajas) - cant) });
          }
        }

        await KardexFarmacia.create({
          empresa_id: empresaId,
          id_medicamento: item.id_medicamento,
          id_lote: item.id_lote || null,
          tipo_movimiento: 'MERMA_VENCIMIENTO',
          cantidad_cajas: cant,
          saldo_cajas: nuevoStock,
          motivo: `Baja ${numero_acta} - ${motivo}`,
          referencia_documento: numero_acta,
          id_usuario: req.user?.id || 1
        });
      }
    }

    res.status(201).json({ success: true, data: acta, message: 'Acta de baja registrada y stock descontado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

