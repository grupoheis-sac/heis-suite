import { Op } from 'sequelize';
import { Venta, VentaDetalle, Medicamento, ActaBaja } from '../models/index.js';

export const getReporteGeneral = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const whereClause = {
      estado: 'Completada',
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [new Date(`${fecha_inicio}T00:00:00`), new Date(`${fecha_fin}T23:59:59`)]
      };
    }

    const ventas = await Venta.findAll({
      where: whereClause,
      include: [
        {
          model: VentaDetalle,
          as: 'detalles',
          include: [{ model: Medicamento, as: 'medicamento', attributes: ['id', 'nombre_comercial'] }]
        }
      ]
    });

    let totalVendido = 0;
    let totalOperaciones = ventas.length;
    const productosMap = {};

    ventas.forEach(v => {
      totalVendido += parseFloat(v.total || 0);
      (v.detalles || []).forEach(d => {
        const nombre = d.medicamento?.nombre_comercial || 'Producto';
        if (!productosMap[nombre]) productosMap[nombre] = { nombre, cantidad: 0, total: 0 };
        productosMap[nombre].cantidad += parseFloat(d.cantidad || 0);
        productosMap[nombre].total += parseFloat(d.subtotal || 0);
      });
    });

    const topProductos = Object.values(productosMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalVendido: parseFloat(totalVendido.toFixed(2)),
        totalOperaciones,
        topProductos
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

