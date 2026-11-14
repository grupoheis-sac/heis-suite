import fs from 'fs';
import fsPromises from 'node:fs/promises';
import path from 'path';
import { Op, Transaction } from 'sequelize';
import sequelize from '../../config/db.js';
import { ComprobanteElectronico, Usuario, Sucursal, Empresa } from '../models/index.js';
import {
  emitirComprobanteUniversal,
  obtenerSiguienteCorrelativo,
} from '../services/sunatUbl.service.js';
import pdfService from '../services/sunat/pdfService.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';
import { resolveSafeTenantPath, decryptCertPassword } from '../services/sunat/certService.js';
import { ejecutarCicloContingenciaSunat } from '../services/sunat/contingencyWorker.js';
import {
  construirXmlGreUBL21,
  enviarGreApiRest,
  consultarTicketGreApiRest,
} from '../services/sunat/greService.js';
import {
  construirXmlResumenDiarioRC,
  construirXmlComunicacionBajaRA,
} from '../services/sunat/resumenBajaService.js';
import {
  enviarResumenSoapSunat,
  consultarTicketSoapSunat,
} from '../services/sunat/soapService.js';
import { consultarValidezComprobanteSunat } from '../services/sunat/validezCpeService.js';
import { signXmlAndCompressZip } from '../services/sunat/signerService.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');

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

/**
 * POST /api/facturacion/comprobantes/:id/reintentar
 * Fuerza el reenvío inmediato a SUNAT reseteando la ventana de espera (backoff)
 */
export async function forzarReintentoSunat(req, res, next) {
  try {
    const cpe = await ComprobanteElectronico.findOne({
      where: { id: req.params.id, empresa_id: req.empresa_id },
    });

    if (!cpe) {
      return res.status(404).json({ ok: false, success: false, message: 'Comprobante no encontrado.' });
    }

    if (['ACEPTADO', 'ACEPTADO_CON_OBSERVACIONES'].includes(cpe.estado_sunat)) {
      return res.status(400).json({
        ok: false,
        success: false,
        message: 'El comprobante ya fue aceptado por SUNAT y no requiere reenvío.',
      });
    }

    await cpe.update({
      estado_sunat: 'CONTINGENCIA_REINTENTAR',
      proximo_reintento: new Date(),
      intentos_envio: Math.min(Number(cpe.intentos_envio || 0), 9), // Garantiza al menos 1 intento adicional si estaba en ERROR_CRITICO
    });

    // Dispara ciclo asíncrono del worker inmediatamente sin bloquear el hilo HTTP
    setImmediate(() => {
      ejecutarCicloContingenciaSunat().catch(() => {});
    });

    return res.json({
      ok: true,
      success: true,
      message: 'Reenvío a SUNAT encolado para ejecución inmediata.',
      data: cpe,
    });
  } catch (error) {
    if (next) next(error);
    else res.status(500).json({ ok: false, success: false, error: error.message });
  }
}

/**
 * GET /api/facturacion/comprobantes/:id/archivo/:tipo
 * :tipo = 'xml' | 'cdr'
 * Devuelve el contenido XML extraído o el archivo binario para descarga segura
 */
export async function obtenerArchivoComprobante(req, res, next) {
  try {
    const { id, tipo } = req.params;
    const modo = req.query.modo || 'preview'; // 'preview' | 'download'

    const cpe = await ComprobanteElectronico.findOne({
      where: { id, empresa_id: req.empresa_id },
    });

    if (!cpe) {
      return res.status(404).json({ ok: false, success: false, message: 'Comprobante no encontrado.' });
    }

    const filename = tipo === 'cdr' ? cpe.cdr_filename : cpe.xml_firmado_filename;
    let fileBuffer = null;

    if (filename) {
      try {
        const safeFilePath = resolveSafeTenantPath(STORAGE_ROOT, req.empresa_id, filename);
        fileBuffer = await fsPromises.readFile(safeFilePath);
      } catch (e) {
        console.warn(`[FACTURACION] Archivo no encontrado en disco: ${filename}, buscando en BD`);
      }
    }

    if (!fileBuffer) {
      const dbContent = tipo === 'cdr' ? cpe.cdr_respuesta : (cpe.xml_firmado || cpe.xml_generado);
      if (dbContent) {
        fileBuffer = Buffer.from(dbContent, 'utf8');
      }
    }

    if (!fileBuffer) {
      return res.status(404).json({
        ok: false,
        success: false,
        message: `El archivo ${tipo.toUpperCase()} aún no ha sido generado o registrado para este comprobante.`,
      });
    }

    const defaultName = `${tipo === 'cdr' ? 'R-' : ''}${cpe.serie}-${cpe.correlativo}.${filename?.endsWith('.zip') ? 'zip' : 'xml'}`;
    const finalFilename = filename ? path.basename(filename) : defaultName;

    if (modo === 'download') {
      res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
      res.setHeader('Content-Type', finalFilename.endsWith('.zip') ? 'application/zip' : 'application/xml');
      return res.send(fileBuffer);
    }

    // Modo preview para el visor modal del frontend
    return res.json({
      ok: true,
      success: true,
      filename: finalFilename,
      tipo: tipo.toUpperCase(),
      content: fileBuffer.toString('utf8'),
      base64: fileBuffer.toString('base64'),
    });
  } catch (error) {
    if (next) next(error);
    else res.status(500).json({ ok: false, success: false, error: error.message });
  }
}

/**
 * 1. POST /api/facturacion/gre/emitir
 * Emite GRE Remitente ('09') o Transportista ('31') por API REST y devuelve el ticket + estado
 */
export const emitirGuiaRemision = async (req, res, next) => {
  try {
    const tipo_comprobante = req.body.tipo_comprobante === '31' ? '31' : '09';
    const serie = req.body.serie || (tipo_comprobante === '31' ? 'V001' : 'T001');

    const { empresa, cpeGre, nombreBaseCpe, zipBuffer } = await sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async (t) => {
        const emp = await Empresa.findOne({
          where: { id: req.empresa_id },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (!emp) {
          throw new Error(`Empresa ID ${req.empresa_id} no encontrada.`);
        }

        const ultimo = await ComprobanteElectronico.findOne({
          where: { empresa_id: req.empresa_id, tipo_comprobante, serie },
          order: [['correlativo', 'DESC']],
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        const correlativo = (ultimo ? Number(ultimo.correlativo) : 0) + 1;
        const baseName = `${emp.ruc}-${tipo_comprobante}-${serie}-${String(correlativo).padStart(8, '0')}`;
        const numeroFormato = `${serie}-${String(correlativo).padStart(8, '0')}`;

        const xmlSinFirma = construirXmlGreUBL21({ ...req.body, tipo_comprobante, serie, correlativo }, emp);
        const zipBuf = await signXmlAndCompressZip(xmlSinFirma, `${baseName}.xml`, emp);

        const zipSafePath = resolveSafeTenantPath(STORAGE_ROOT, req.empresa_id, `${baseName}.zip`);
        await fsPromises.mkdir(path.dirname(zipSafePath), { recursive: true });
        await fsPromises.writeFile(zipSafePath, zipBuf);

        const nuevoCpe = await ComprobanteElectronico.create(
          {
            empresa_id: req.empresa_id,
            sucursal_id: req.user?.sucursal_id || null,
            tipo_documento_codigo: tipo_comprobante,
            tipo_comprobante,
            serie,
            correlativo,
            numero_formato: numeroFormato,
            fecha_emision: new Date(),
            cliente_tipo_documento: req.body.destinatario?.tipo_documento || '6',
            cliente_documento: req.body.destinatario?.documento || '',
            cliente_nombre: req.body.destinatario?.razon_social || '',
            total: 0,
            estado_sunat: 'PROCESANDO_ENVIO',
            xml_firmado_filename: `${baseName}.zip`,
          },
          { transaction: t }
        );

        return { empresa: emp, cpeGre: nuevoCpe, nombreBaseCpe: baseName, zipBuffer: zipBuf };
      }
    );

    // Envío al API REST de GRE SUNAT
    const ticketData = await enviarGreApiRest(empresa, nombreBaseCpe, zipBuffer);
    const estadoTicket = await consultarTicketGreApiRest(
      empresa,
      ticketData.numTicket,
      nombreBaseCpe
    );

    await cpeGre.update({
      estado_sunat: estadoTicket.estado_sunat,
      codigo_sunat: estadoTicket.codigo_sunat || '98',
      cdr_filename: estadoTicket.cdr_filename || null,
      ultimo_error_sunat: `Ticket GRE: ${ticketData.numTicket} | ${estadoTicket.mensaje}`,
    });

    return res.status(201).json({
      ok: true,
      data: {
        id: cpeGre.id,
        comprobante: `${cpeGre.serie}-${String(cpeGre.correlativo).padStart(8, '0')}`,
        numTicket: ticketData.numTicket,
        ...estadoTicket,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/facturacion/anulacion-masiva
 * Genera y envía automáticamente un Resumen Diario (RC con ConditionCode=3 para Boletas)
 * o una Comunicación de Baja (RA para Facturas) según el tipo de los comprobantes seleccionados.
 */
export const emitirAnulacionMasivaRcRa = async (req, res, next) => {
  try {
    const { comprobante_ids = [], motivo_baja = 'ANULACION DE LA OPERACION' } = req.body;

    if (!Array.isArray(comprobante_ids) || comprobante_ids.length === 0) {
      return res.status(422).json({
        ok: false,
        message: 'Debe enviar al menos un ID en comprobante_ids para anular.',
      });
    }

    const empresa = await Empresa.findOne({ where: { id: req.empresa_id } });
    if (!empresa) {
      return res.status(404).json({ ok: false, message: 'Empresa no encontrada.' });
    }

    const comprobantes = await ComprobanteElectronico.findAll({
      where: {
        id: { [Op.in]: comprobante_ids },
        empresa_id: req.empresa_id,
      },
    });

    if (comprobantes.length === 0) {
      return res.status(404).json({ ok: false, message: 'No se encontraron comprobantes válidos.' });
    }

    const fechaHoyCompacta = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fechaReferencia = new Date(comprobantes[0].fecha_emision).toISOString().slice(0, 10);

    // Separar Facturas ('01' -> RA) de Boletas ('03' -> RC con ConditionCode = 3)
    const esLoteFacturas = comprobantes.every((c) => c.tipo_comprobante === '01' || c.tipo_documento_codigo === '01' || c.tipo_comprobante === 'Factura');
    const prefijo = esLoteFacturas ? 'RA' : 'RC';
    const correlativoLote = String(Math.floor(Date.now() / 1000) % 99999).padStart(5, '0');
    const identificadorLote = `${prefijo}-${fechaHoyCompacta}-${correlativoLote}`;
    const nombreBaseArchivo = `${empresa.ruc}-${identificadorLote}`;

    const xmlLote = esLoteFacturas
      ? construirXmlComunicacionBajaRA({
          empresa,
          identificadorLote,
          fechaReferencia,
          comprobantes: comprobantes.map((c) => ({
            ...c.toJSON(),
            motivo_baja,
          })),
        })
      : construirXmlResumenDiarioRC({
          empresa,
          identificadorLote,
          fechaReferencia,
          comprobantes: comprobantes.map((c) => c.toJSON()),
          conditionCode: 3, // 3 = Anulación de Boleta
        });

    const zipBuffer = await signXmlAndCompressZip(xmlLote, `${nombreBaseArchivo}.xml`, empresa);
    const zipSafePath = resolveSafeTenantPath(
      STORAGE_ROOT,
      req.empresa_id,
      `${nombreBaseArchivo}.zip`
    );
    await fsPromises.mkdir(path.dirname(zipSafePath), { recursive: true });
    await fsPromises.writeFile(zipSafePath, zipBuffer);

    const credencialesSol = {
      ruc: empresa.ruc,
      usuarioSol: empresa.usuario_sol || empresa.sunat_usuario_sol,
      claveSol: empresa.clave_sol_cifrada
        ? decryptCertPassword(empresa.clave_sol_cifrada)
        : (empresa.clave_sol || empresa.sunat_clave_sol),
    };

    const endpointUrl =
      empresa.modo_sunat === 'PRODUCCION'
        ? process.env.SUNAT_ENDPOINT_PROD
        : process.env.SUNAT_ENDPOINT_BETA;

    const { ticket } = await enviarResumenSoapSunat(
      zipBuffer.toString('base64'),
      `${nombreBaseArchivo}.zip`,
      credencialesSol,
      endpointUrl
    );

    const statusTicket = await consultarTicketSoapSunat(ticket, credencialesSol, endpointUrl);

    if (statusTicket.statusCode === '0') {
      await ComprobanteElectronico.update(
        {
          estado_sunat: 'ANULADO_SUNAT',
          ultimo_error_sunat: `Anulado vía ${identificadorLote} (Ticket: ${ticket})`,
        },
        { where: { id: comprobantes.map((c) => c.id), empresa_id: req.empresa_id } }
      );
    }

    return res.status(200).json({
      ok: true,
      data: {
        tipo_proceso: prefijo,
        identificador_lote: identificadorLote,
        ticket_sunat: ticket,
        status_code: statusTicket.statusCode,
        total_comprobantes_procesados: comprobantes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/facturacion/validar-cpe
 * Consulta en tiempo real en SUNAT si un comprobante propio o de proveedor es VÁLIDO, ANULADO o NO EXISTE
 */
export const validarComprobanteTiempoReal = async (req, res, next) => {
  try {
    const empresa = await Empresa.findOne({ where: { id: req.empresa_id } });
    if (!empresa) {
      return res.status(404).json({ ok: false, message: 'Empresa no encontrada.' });
    }
    const resultado = await consultarValidezComprobanteSunat(empresa, req.body);

    return res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listarComprobantes,
  emitirComprobante,
  emitirNotaCredito,
  comunicarBaja,
  descargarXmlComprobante,
  descargarCdrComprobante,
  descargarPdfComprobante,
  obtenerSiguienteCorrelativo,
  forzarReintentoSunat,
  obtenerArchivoComprobante,
  emitirGuiaRemision,
  emitirAnulacionMasivaRcRa,
  validarComprobanteTiempoReal,
};
