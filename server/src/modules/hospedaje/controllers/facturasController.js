import { Factura, Reserva, Huesped, Pago, CargoAdicional } from '../models/index.js';

export const getFacturas = async (req, res) => {
  try {
    const facturas = await Factura.findAll({
      where: {
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [
        { model: Huesped, as: 'huesped' },
        { model: Reserva, as: 'reserva' },
        { model: Pago, as: 'pagos' }
      ],
      order: [['fecha_emision', 'DESC']]
    });

    res.json({ success: true, data: facturas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearFactura = async (req, res) => {
  try {
    const { reserva_id, huesped_id, tipo_comprobante = 'Boleta', subtotal, igv, total, metodo_pago = 'efectivo' } = req.body;
    const empresaId = req.empresa_id || 1;
    const count = await Factura.count({ where: { empresa_id: empresaId } });
    const serie = tipo_comprobante === 'Factura' ? 'F001' : 'B001';
    const numero = `${serie}-${String(count + 1).padStart(8, '0')}`;

    const factura = await Factura.create({
      empresa_id: empresaId,
      sucursal_id: req.sucursal_id || 1,
      numero,
      serie_sunat: serie,
      correlativo_sunat: count + 1,
      tipo_comprobante,
      reserva_id,
      huesped_id,
      user_id: req.user?.id || 1,
      subtotal: parseFloat(subtotal) || 0,
      igv: parseFloat(igv) || 0,
      total: parseFloat(total) || 0,
      estado: 'pagada',
      fecha_emision: new Date()
    });

    // Registrar pago
    await Pago.create({
      empresa_id: empresaId,
      factura_id: factura.id,
      reserva_id,
      user_id: req.user?.id || 1,
      monto: parseFloat(total) || 0,
      metodo_pago,
      fecha_pago: new Date()
    });

    res.status(201).json({ success: true, data: factura, message: 'Comprobante emitido con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

