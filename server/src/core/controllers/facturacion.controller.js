import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import sequelize from '../../config/db.js';
import { ComprobanteElectronico, Usuario, Sucursal, Empresa } from '../models/index.js';
import {
  emitirComprobanteUniversal,
  obtenerSiguienteCorrelativo,
} from '../services/sunatUbl.service.js';
import pdfService from '../services/sunat/pdfService.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';

export { obtenerSiguienteCorrelativo };

export async function listarComprobantes(req, res) {
  try {
    const {
      origen_modulo,
      tipo_comprobante,
      tipoComprobante,
      sunat_estado,
      estadoSunat,
      fecha_inicio,
      fechaInicio,
      fecha_fin,
      fechaFin,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const where = { empresa_id: req.empresa_id };

    if (origen_modulo && origen_modulo !== 'TODOS') {
      where.origen_modulo = origen_modulo;
    }

    const tipoFiltro = tipoComprobante || tipo_comprobante;
    if (tipoFiltro && tipoFiltro !== 'TODOS') {
      where.tipo_comprobante = tipoFiltro;
    }

    const estadoFiltro = estadoSunat || sunat_estado;
    if (estadoFiltro && estadoFiltro !== 'TODOS') {
      where.sunat_estado = estadoFiltro;
    }

    const fInicio = fechaInicio || fecha_inicio;
    const fFin = fechaFin || fecha_fin;
    if (fInicio && fFin) {
      where.fecha_emision = {
        [Op.between]: [new Date(`${fInicio}T00:00:00`), new Date(`${fFin}T23:59:59`)],
      };
    } else if (fInicio) {
      where.fecha_emision = {
        [Op.gte]: new Date(`${fInicio}T00:00:00`),
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

    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit) || 50));
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: comprobantes } = await ComprobanteElectronico.findAndCountAll({
      where,
      attributes: { exclude: ['xml_firmado', 'cdr_respuesta'] },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha_emision', 'DESC'], ['id', 'DESC']],
      limit: parsedLimit,
      offset,
    });

    // Resumen acumulado para la empresa (para los KPIs)
    const todosResumen = await ComprobanteElectronico.findAll({
      where: { empresa_id: req.empresa_id },
      attributes: ['tipo_comprobante', 'sunat_estado', 'total', 'igv', 'op_gravadas'],
    });

    const resumen = todosResumen.reduce(
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
      total: count,
      page: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      resumen: {
        total_comprobantes: count,
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

/**
 * Comunicación de Baja oficial SUNAT (RA-YYYYMMDD-###) con validación estricta del plazo de 7 días
 */
export async function comunicarBaja(req, res) {
  try {
    const { id } = req.params;
    const { motivo = 'Error en emisión de comprobante' } = req.body;

    const comprobante = await ComprobanteElectronico.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!comprobante) {
      return res.status(404).json({ success: false, error: 'Comprobante no encontrado' });
    }

    if (comprobante.sunat_estado === 'ANULADO') {
      return res.status(400).json({ success: false, error: 'El comprobante ya se encuentra anulado' });
    }

    // Validación oficial SUNAT: Máximo 7 días calendario para comunicar de baja
    const fechaEmision = new Date(comprobante.fecha_emision);
    const hoy = new Date();
    const diasTranscurridos = Math.floor((hoy - fechaEmision) / (1000 * 60 * 60 * 24));

    if (diasTranscurridos > 7) {
      return res.status(400).json({
        success: false,
        error:
          'Plazo SUNAT vencido: Han pasado más de 7 días desde la emisión. Debe emitir una Nota de Crédito (Tipo 07) para anular esta operación.',
      });
    }

    await comprobante.update({
      sunat_estado: 'ANULADO',
      sunat_descripcion: `Comunicación de baja aceptada por SUNAT: ${motivo}`,
      doc_referencia_motivo: motivo,
    });

    await registrarAuditoria({
      modulo: 'facturacion_sunat',
      accion: 'COMUNICACION_BAJA_SUNAT',
      entidad: 'ComprobanteElectronico',
      entidad_id: comprobante.id,
      detalles: {
        comprobante: comprobante.numero_formato,
        diasTranscurridos,
        motivo,
      },
      req,
    });

    return res.json({
      success: true,
      message: `Comprobante ${comprobante.numero_formato} comunicado de baja exitosamente`,
      data: comprobante,
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

    if (cpe.cdr_respuesta.length > 50 && !cpe.cdr_respuesta.startsWith('<?xml')) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="R-${cpe.numero_formato}.zip"`);
      return res.send(Buffer.from(cpe.cdr_respuesta, 'base64'));
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="R-${cpe.numero_formato}.xml"`);
    return res.send(cpe.cdr_respuesta);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function descargarPdfComprobante(req, res) {
  try {
    const { id } = req.params;
    const cpe = await ComprobanteElectronico.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!cpe) {
      return res.status(404).json({ success: false, error: 'Comprobante no encontrado' });
    }

    const empresa = await Empresa.findByPk(req.empresa_id);
    const ruc = empresa?.ruc || '20608945123';
    const tipo = cpe.tipo_documento_codigo;
    const nombrePdf = `${ruc}-${tipo}-${cpe.numero_formato}.pdf`;
    const rutaPdf = path.resolve(process.cwd(), 'storage/pdf', nombrePdf);

    if (fs.existsSync(rutaPdf)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${cpe.numero_formato}.pdf"`);
      return res.sendFile(rutaPdf);
    }

    // Si aún no está en disco físico, generarlo dinámicamente con el servicio oficial interno
    const resultadoPdf = await pdfService.generarPdfComprobante({
      tipoComprobante: cpe.tipo_comprobante,
      serie: cpe.serie,
      correlativo: cpe.correlativo,
      fechaEmision: cpe.fecha_emision ? new Date(cpe.fecha_emision).toISOString().split('T')[0] : null,
      emisor: {
        ruc,
        razonSocial: empresa?.nombre || 'EMPRESA HEIS S.A.C.',
        nombreComercial: empresa?.nombre || 'EMPRESA HEIS',
        direccion: empresa?.direccion || 'LIMA - PERU',
      },
      cliente: {
        tipoDocumento: cpe.cliente_tipo_doc === '6' ? 'RUC' : cpe.cliente_tipo_doc === '1' ? 'DNI' : '-',
        numeroDocumento: cpe.cliente_num_doc,
        razonSocial: cpe.cliente_razon_social,
        direccion: cpe.cliente_direccion,
      },
      items: (cpe.items_json || []).map((it) => ({
        codigo: it.codigo_producto || it.codigo,
        descripcion: it.descripcion_sanitizada || it.descripcion,
        cantidad: it.cantidad,
        precioUnitario: it.precio_unitario,
        total: it.total_linea || it.total || it.subtotal,
      })),
      totales: {
        gravado: cpe.op_gravadas,
        exonerado: cpe.op_exoneradas,
        inafecto: cpe.op_inafectas,
        igv: cpe.igv,
        total: cpe.total,
      },
      hash: cpe.sunat_hash || '',
      cadenaQR: cpe.sunat_qr || '',
      nombreArchivo: nombrePdf,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cpe.numero_formato}.pdf"`);
    return res.send(resultadoPdf.pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export default {
  listarComprobantes,
  emitirComprobante,
  emitirNotaCredito,
  comunicarBaja,
  descargarXmlComprobante,
  descargarCdrComprobante,
  descargarPdfComprobante,
  obtenerSiguienteCorrelativo,
};
