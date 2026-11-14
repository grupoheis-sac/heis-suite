import { Op } from 'sequelize';
import { ComprobanteElectronico, Usuario, Sucursal } from '../models/index.js';
import { emitirComprobanteUniversal } from '../services/sunatUbl.service.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';

export async function listarComprobantes(req, res) {
  try {
    const {
      origen_modulo,
      tipo_comprobante,
      sunat_estado,
      fecha_inicio,
      fecha_fin,
      search,
      limit = 80,
    } = req.query;

    const where = { empresa_id: req.empresa_id };

    if (origen_modulo && origen_modulo !== 'TODOS') {
      where.origen_modulo = origen_modulo;
    }
    if (tipo_comprobante && tipo_comprobante !== 'TODOS') {
      where.tipo_comprobante = tipo_comprobante;
    }
    if (sunat_estado && sunat_estado !== 'TODOS') {
      where.sunat_estado = sunat_estado;
    }
    if (fecha_inicio && fecha_fin) {
      where.fecha_emision = {
        [Op.between]: [new Date(`${fecha_inicio}T00:00:00`), new Date(`${fecha_fin}T23:59:59`)],
      };
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { numero_formato: { [Op.like]: q } },
        { cliente_razon_social: { [Op.like]: q } },
        { cliente_num_doc: { [Op.like]: q } },
      ];
    }

    const comprobantes = await ComprobanteElectronico.findAll({
      where,
      attributes: { exclude: ['xml_firmado', 'cdr_respuesta'] },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha_emision', 'DESC'], ['id', 'DESC']],
      limit: Number(limit) || 80,
    });

    const resumen = comprobantes.reduce(
      (acc, c) => {
        if (c.sunat_estado !== 'ANULADO' && c.tipo_comprobante !== 'NotaCredito') {
          acc.total_facturado += Number(c.total || 0);
          acc.total_igv += Number(c.igv || 0);
          acc.total_gravadas += Number(c.op_gravadas || 0);
        }
        if (c.sunat_estado === 'ACEPTADO') acc.aceptados += 1;
        if (c.tipo_comprobante === 'NotaCredito') acc.notas_credito += 1;
        return acc;
      },
      { total_facturado: 0, total_igv: 0, total_gravadas: 0, aceptados: 0, notas_credito: 0 }
    );

    return res.json({
      success: true,
      data: comprobantes,
      resumen: {
        total_comprobantes: comprobantes.length,
        total_facturado: Number(resumen.total_facturado.toFixed(2)),
        total_igv: Number(resumen.total_igv.toFixed(2)),
        total_gravadas: Number(resumen.total_gravadas.toFixed(2)),
        aceptados: resumen.aceptados,
        notas_credito: resumen.notas_credito,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function emitirComprobante(req, res) {
  try {
    const {
      origen_modulo = 'general',
      origen_id = null,
      tipo_comprobante = 'Boleta',
      serie = null,
      cliente_documento = '00000000',
      cliente_nombre = 'CLIENTE VARIOS',
      cliente_direccion = '',
      descuento = 0,
      items = [],
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos un ítem para emitir el comprobante electrónico.',
      });
    }

    const cpe = await emitirComprobanteUniversal({
      empresaId: req.empresa_id,
      sucursalId: req.sucursal_id || null,
      usuarioId: req.user?.id || null,
      origenModulo: origen_modulo,
      origenId: origen_id,
      tipoComprobante: tipo_comprobante,
      seriePreferida: serie,
      clienteDocumento: cliente_documento,
      clienteNombre: cliente_nombre,
      clienteDireccion: cliente_direccion,
      descuentoGlobal: descuento,
      items,
    });

    await registrarAuditoria({
      modulo: 'facturacion_sunat',
      accion: 'EMITIR_CPE_UBL21',
      entidad: 'ComprobanteElectronico',
      entidad_id: cpe.id,
      detalles: {
        comprobante: cpe.numero_formato,
        tipo: cpe.tipo_comprobante,
        total: cpe.total,
        origen_modulo,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `${cpe.tipo_comprobante} ${cpe.numero_formato} aceptada por SUNAT`,
      data: cpe,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function emitirNotaCredito(req, res) {
  try {
    const { id } = req.params;
    const { motivo = 'Anulación de la operación' } = req.body;

    const original = await ComprobanteElectronico.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!original) {
      return res.status(404).json({ success: false, error: 'Comprobante original no encontrado' });
    }

    if (original.sunat_estado === 'ANULADO') {
      return res.status(400).json({ success: false, error: 'El comprobante ya fue anulado previamente' });
    }

    const notaCredito = await emitirComprobanteUniversal({
      empresaId: req.empresa_id,
      sucursalId: original.sucursal_id,
      usuarioId: req.user?.id || null,
      origenModulo: original.origen_modulo,
      origenId: original.origen_id,
      tipoComprobante: 'NotaCredito',
      clienteDocumento: original.cliente_num_doc,
      clienteNombre: original.cliente_razon_social,
      clienteDireccion: original.cliente_direccion,
      descuentoGlobal: original.descuento_global,
      items: Array.isArray(original.items_json) ? original.items_json : [],
      docReferenciaSerieNum: original.numero_formato,
      docReferenciaMotivo: motivo,
    });

    await original.update({ sunat_estado: 'ANULADO' });

    await registrarAuditoria({
      modulo: 'facturacion_sunat',
      accion: 'EMITIR_NOTA_CREDITO',
      entidad: 'ComprobanteElectronico',
      entidad_id: notaCredito.id,
      detalles: {
        nota_credito: notaCredito.numero_formato,
        afecta_a: original.numero_formato,
        motivo,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Nota de Crédito ${notaCredito.numero_formato} emitida y vinculada a ${original.numero_formato}`,
      data: notaCredito,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function descargarXmlComprobante(req, res) {
  try {
    const { id } = req.params;
    const cpe = await ComprobanteElectronico.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!cpe || !cpe.xml_firmado) {
      return res.status(404).json({ success: false, error: 'XML no disponible para este comprobante' });
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${cpe.numero_formato}.xml"`);
    return res.send(cpe.xml_firmado);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function descargarCdrComprobante(req, res) {
  try {
    const { id } = req.params;
    const cpe = await ComprobanteElectronico.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!cpe || !cpe.cdr_respuesta) {
      return res.status(404).json({ success: false, error: 'CDR no disponible para este comprobante' });
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="R-${cpe.numero_formato}.xml"`);
    return res.send(cpe.cdr_respuesta);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export default {
  listarComprobantes,
  emitirComprobante,
  emitirNotaCredito,
  descargarXmlComprobante,
  descargarCdrComprobante,
};
