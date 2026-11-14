import { Reserva, Huesped, Pago } from '../models/index.js';
import { ComprobanteElectronico, CajaGeneral, CajaMovimientoGeneral } from '../../../core/models/index.js';
import { emitirComprobanteUniversal } from '../../../core/services/sunatUbl.service.js';
import { Op } from 'sequelize';

export const getFacturas = async (req, res) => {
  try {
    const { tipo_comprobante } = req.query;
    const empresaId = req.empresa_id;

    const where = {
      empresa_id: empresaId,
      origen_modulo: { [Op.in]: ['hospedaje', 'HOSPEDAJE'] },
    };

    if (tipo_comprobante && tipo_comprobante !== 'todos') {
      where.tipo_comprobante = { [Op.like]: `%${tipo_comprobante}%` };
    }

    const cpes = await ComprobanteElectronico.findAll({
      where,
      order: [['fecha_emision', 'DESC']],
    });

    const facturas = cpes.map((c) => ({
      id: c.id,
      numero: c.numero_formato,
      serie_sunat: c.serie,
      correlativo_sunat: c.correlativo,
      tipo_comprobante: c.tipo_comprobante.toLowerCase() === 'notacredito' ? 'nota_credito' : c.tipo_comprobante.toLowerCase(),
      tipo_comprobante_display: c.tipo_comprobante,
      reserva_id: c.origen_id,
      reserva: { id: c.origen_id },
      huesped_id: null,
      huesped: {
        nombre: c.cliente_razon_social,
        apellido: '',
        num_documento: c.cliente_num_doc,
      },
      cliente_num_doc: c.cliente_num_doc,
      cliente_razon_social: c.cliente_razon_social,
      subtotal: parseFloat(c.op_gravadas || 0),
      igv: parseFloat(c.igv || 0),
      total: parseFloat(c.total || 0),
      estado: c.sunat_estado === 'ANULADO' ? 'anulada' : 'pagada',
      fecha_emision: c.fecha_emision ? new Date(c.fecha_emision).toISOString().split('T')[0] : '',
      items: c.items_json || [],
      sunat_hash: c.sunat_hash,
      sunat_qr: c.sunat_qr,
      sunat_estado: c.sunat_estado,
    }));

    res.json({ success: true, data: facturas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await ComprobanteElectronico.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!c) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }

    const data = {
      id: c.id,
      numero: c.numero_formato,
      serie_sunat: c.serie,
      correlativo_sunat: c.correlativo,
      tipo_comprobante: c.tipo_comprobante.toLowerCase() === 'notacredito' ? 'nota_credito' : c.tipo_comprobante.toLowerCase(),
      tipo_comprobante_display: c.tipo_comprobante,
      reserva_id: c.origen_id,
      reserva: { id: c.origen_id },
      huesped: {
        nombre: c.cliente_razon_social,
        apellido: '',
        num_documento: c.cliente_num_doc,
      },
      subtotal: parseFloat(c.op_gravadas || 0),
      igv: parseFloat(c.igv || 0),
      total: parseFloat(c.total || 0),
      estado: c.sunat_estado === 'ANULADO' ? 'anulada' : 'pagada',
      fecha_emision: c.fecha_emision ? new Date(c.fecha_emision).toISOString().split('T')[0] : '',
      items: c.items_json || [],
      sunat_hash: c.sunat_hash,
      sunat_qr: c.sunat_qr,
    };

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearFactura = async (req, res) => {
  try {
    const {
      reserva_id,
      huesped_id,
      tipo_comprobante = 'Boleta',
      subtotal,
      igv,
      total,
      metodo_pago = 'efectivo',
    } = req.body;
    const empresaId = req.empresa_id || 1;
    const totalNum = parseFloat(total) || 0;

    const huespedObj = huesped_id ? await Huesped.findByPk(huesped_id) : null;
    const clienteDoc = huespedObj?.numero_documento || '00000000';
    const clienteNombre = huespedObj
      ? `${huespedObj.nombres || ''} ${huespedObj.apellidos || ''}`.trim()
      : 'HUESPED VARIOS';

    const serie = tipo_comprobante === 'Factura' ? 'F001' : 'B001';

    // Emisión delegada al motor central ComprobanteElectronico
    const cpe = await emitirComprobanteUniversal({
      empresaId,
      sucursalId: req.sucursal_id || null,
      usuarioId: req.user?.id || 1,
      origenModulo: 'HOSPEDAJE',
      origenId: reserva_id || null,
      tipoComprobante,
      seriePreferida: serie,
      clienteDocumento: clienteDoc,
      clienteNombre,
      items: [
        {
          descripcion: `ALOJAMIENTO HOTELERO (RESERVA #${reserva_id || 'GENERAL'})`,
          cantidad: 1,
          precio_unitario: totalNum,
        },
      ],
    });

    // Registrar pago de la reserva si corresponde
    if (reserva_id) {
      await Pago.create({
        empresa_id: empresaId,
        reserva_id,
        user_id: req.user?.id || 1,
        monto: totalNum,
        metodo_pago,
        fecha_pago: new Date(),
      }).catch(() => {});
    }

    // Impactar en Caja General activa
    try {
      const cajaGeneralActiva = await CajaGeneral.findOne({
        where: {
          empresa_id: empresaId,
          estado: ['Abierta', 'abierta'],
          ...(req.sucursal_id ? { sucursal_id: req.sucursal_id } : {}),
        },
      });

      if (cajaGeneralActiva) {
        const esEfectivo =
          String(metodo_pago).toLowerCase() === 'efectivo' ||
          String(metodo_pago).toLowerCase() === 'cash';

        if (esEfectivo) {
          cajaGeneralActiva.total_ventas_efectivo = parseFloat(
            (parseFloat(cajaGeneralActiva.total_ventas_efectivo || 0) + totalNum).toFixed(2)
          );
        } else {
          cajaGeneralActiva.total_ventas_digital = parseFloat(
            (parseFloat(cajaGeneralActiva.total_ventas_digital || 0) + totalNum).toFixed(2)
          );
        }
        await cajaGeneralActiva.save();

        await CajaMovimientoGeneral.create({
          empresa_id: empresaId,
          sucursal_id: req.sucursal_id || null,
          id_caja: cajaGeneralActiva.id,
          id_usuario: req.user?.id || 1,
          tipo: 'Ingreso',
          concepto: `Facturación Hospedaje ${cpe.numero_formato}`,
          monto: totalNum,
          metodo_pago,
          origen_modulo: 'hospedaje',
          ref_legacy_id: cpe.id,
        });
      }
    } catch (cajaGenErr) {
      console.warn('⚠️ No se pudo registrar en CajaGeneral hospedaje:', cajaGenErr.message);
    }

    res.status(201).json({
      success: true,
      data: {
        id: cpe.id,
        numero: cpe.numero_formato,
        tipo_comprobante: cpe.tipo_comprobante.toLowerCase(),
        total: cpe.total,
        estado: 'pagada',
        fecha_emision: cpe.fecha_emision,
        sunat_hash: cpe.sunat_hash,
        sunat_qr: cpe.sunat_qr,
      },
      message: 'Comprobante emitido con éxito',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const emitirNotaCredito = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_codigo = '01', motivo_descripcion = 'Anulación de la operación' } = req.body;

    const original = await ComprobanteElectronico.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!original) {
      return res.status(404).json({ success: false, message: 'Comprobante original no encontrado' });
    }

    if (original.sunat_estado === 'ANULADO') {
      return res.status(400).json({ success: false, message: 'El comprobante ya fue anulado previamente' });
    }

    const notaCredito = await emitirComprobanteUniversal({
      empresaId: req.empresa_id,
      sucursalId: original.sucursal_id,
      usuarioId: req.user?.id || 1,
      origenModulo: 'HOSPEDAJE',
      origenId: original.origen_id,
      tipoComprobante: 'NotaCredito',
      clienteDocumento: original.cliente_num_doc,
      clienteNombre: original.cliente_razon_social,
      clienteDireccion: original.cliente_direccion,
      descuentoGlobal: original.descuento_global,
      items: Array.isArray(original.items_json) ? original.items_json : [],
      docReferenciaSerieNum: original.numero_formato,
      docReferenciaMotivo: `${motivo_codigo} - ${motivo_descripcion}`,
    });

    await original.update({ sunat_estado: 'ANULADO' });

    res.status(201).json({
      success: true,
      data: {
        id: notaCredito.id,
        numero: notaCredito.numero_formato,
        tipo_comprobante: 'nota_credito',
        total: notaCredito.total,
        estado: 'emitida',
        fecha_emision: notaCredito.fecha_emision,
        sunat_hash: notaCredito.sunat_hash,
        sunat_qr: notaCredito.sunat_qr,
      },
      message: 'Nota de Crédito emitida con éxito',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getFacturas,
  getFacturaPorId,
  crearFactura,
  emitirNotaCredito,
};
