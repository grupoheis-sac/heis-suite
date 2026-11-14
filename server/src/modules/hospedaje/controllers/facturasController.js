import { Factura, Reserva, Huesped, Pago, CargoAdicional } from '../models/index.js';
import { CajaGeneral, CajaMovimientoGeneral } from '../../../core/models/index.js';
import { emitirComprobanteUniversal } from '../../../core/services/sunatUbl.service.js';

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

    // Registrar comprobante electrónico UBL 2.1 en el Core
    if (tipo_comprobante === 'Factura' || tipo_comprobante === 'Boleta') {
      try {
        const huespedObj = huesped_id ? await Huesped.findByPk(huesped_id) : null;
        await emitirComprobanteUniversal({
          empresaId,
          sucursalId: req.sucursal_id || null,
          usuarioId: req.user?.id || 1,
          origenModulo: 'hospedaje',
          origenId: factura.id,
          tipoComprobante: tipo_comprobante,
          seriePreferida: serie,
          clienteDocumento: huespedObj ? huespedObj.numero_documento : '00000000',
          clienteNombre: huespedObj ? `${huespedObj.nombres || ''} ${huespedObj.apellidos || ''}`.trim() : 'HUESPED VARIOS',
          items: [
            {
              descripcion: `ALOJAMIENTO HOTELERO (RESERVA #${reserva_id || 'GENERAL'})`,
              cantidad: 1,
              precio_unitario: parseFloat(total) || 0,
            },
          ],
        });
      } catch (cpeErr) {
        console.warn('⚠️ No se pudo generar CPE UBL 2.1 en facturación hotel:', cpeErr.message);
      }
    }

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

    // Impactar en Caja General activa (core_cajas)
    try {
      const cajaGeneralActiva = await CajaGeneral.findOne({
        where: {
          empresa_id: empresaId,
          estado: ['Abierta', 'abierta'],
          ...(req.sucursal_id ? { sucursal_id: req.sucursal_id } : {}),
        },
      });

      if (cajaGeneralActiva) {
        const totalNum = parseFloat(total) || 0;
        const esEfectivo = String(metodo_pago).toLowerCase() === 'efectivo' || String(metodo_pago).toLowerCase() === 'cash';
        if (esEfectivo) {
          cajaGeneralActiva.total_ventas_efectivo = parseFloat((parseFloat(cajaGeneralActiva.total_ventas_efectivo || 0) + totalNum).toFixed(2));
        } else {
          cajaGeneralActiva.total_ventas_digital = parseFloat((parseFloat(cajaGeneralActiva.total_ventas_digital || 0) + totalNum).toFixed(2));
        }
        await cajaGeneralActiva.save();

        await CajaMovimientoGeneral.create({
          empresa_id: empresaId,
          sucursal_id: req.sucursal_id || null,
          id_caja: cajaGeneralActiva.id,
          id_usuario: req.user?.id || 1,
          tipo: 'Ingreso',
          concepto: `Facturación Hospedaje ${numero}`,
          monto: totalNum,
          metodo_pago,
          origen_modulo: 'hospedaje',
          ref_legacy_id: factura.id,
        });
      }
    } catch (cajaGenErr) {
      console.warn('⚠️ No se pudo registrar en CajaGeneral hospedaje:', cajaGenErr.message);
    }

    res.status(201).json({ success: true, data: factura, message: 'Comprobante emitido con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

