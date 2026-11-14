import { Op } from 'sequelize';
import sequelize from '../../config/db.js';
import {
  ComprobanteElectronico,
  CajaGeneral,
  Empresa,
  Usuario,
} from '../models/index.js';

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function buildPeriodoRange(periodo) {
  // periodo formato YYYY-MM
  const [yearStr, monthStr] = String(periodo || new Date().toISOString().slice(0, 7)).split('-');
  const year = Number(yearStr) || new Date().getFullYear();
  const month = Number(monthStr) || new Date().getMonth() + 1;

  const inicio = new Date(year, month - 1, 1, 0, 0, 0);
  const fin = new Date(year, month, 0, 23, 59, 59);
  return { inicio, fin, year, month: String(month).padStart(2, '0') };
}

/**
 * Vista previa JSON consolidada para la interfaz contable
 */
export async function obtenerResumenContableMes(req, res) {
  try {
    const empresaId = req.empresa_id;
    const { periodo = new Date().toISOString().slice(0, 7), origen_modulo = 'TODOS' } = req.query;
    const { inicio, fin } = buildPeriodoRange(periodo);

    const whereCpe = {
      empresa_id: empresaId,
      fecha_emision: { [Op.between]: [inicio, fin] },
    };
    if (origen_modulo && origen_modulo !== 'TODOS') {
      whereCpe.origen_modulo = origen_modulo;
    }

    const comprobantes = await ComprobanteElectronico.findAll({
      where: whereCpe,
      attributes: { exclude: ['xml_firmado', 'cdr_respuesta'] },
      order: [['fecha_emision', 'ASC'], ['serie', 'ASC'], ['correlativo', 'ASC']],
    });

    let baseImponibleTotal = 0;
    let igvTotal = 0;
    let importeTotal = 0;
    let totalFacturas = 0;
    let totalBoletas = 0;
    let totalNotasCredito = 0;

    for (const c of comprobantes) {
      if (c.sunat_estado === 'ANULADO') continue;
      const factor = c.tipo_documento_codigo === '07' ? -1 : 1;
      baseImponibleTotal += Number(c.op_gravadas || 0) * factor;
      igvTotal += Number(c.igv || 0) * factor;
      importeTotal += Number(c.total || 0) * factor;

      if (c.tipo_documento_codigo === '01') totalFacturas += 1;
      else if (c.tipo_documento_codigo === '03') totalBoletas += 1;
      else if (c.tipo_documento_codigo === '07') totalNotasCredito += 1;
    }

    return res.json({
      success: true,
      data: {
        periodo,
        totales: {
          registros: comprobantes.length,
          facturas: totalFacturas,
          boletas: totalBoletas,
          notas_credito: totalNotasCredito,
          base_imponible: Number(baseImponibleTotal.toFixed(2)),
          igv_debito_fiscal: Number(igvTotal.toFixed(2)),
          total_neto: Number(importeTotal.toFixed(2)),
        },
        comprobantes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Exportación CSV compatible con Excel del Registro de Ventas SUNAT Formato 14.1
 */
export async function exportarRegistroVentas141Csv(req, res) {
  try {
    const empresaId = req.empresa_id;
    const { periodo = new Date().toISOString().slice(0, 7), origen_modulo = 'TODOS' } = req.query;
    const { inicio, fin, year, month } = buildPeriodoRange(periodo);

    const empresa = await Empresa.findByPk(empresaId, { skipTenant: true });
    const rucEmisor = empresa?.ruc || '20600000001';

    const whereCpe = {
      empresa_id: empresaId,
      fecha_emision: { [Op.between]: [inicio, fin] },
    };
    if (origen_modulo && origen_modulo !== 'TODOS') {
      whereCpe.origen_modulo = origen_modulo;
    }

    const comprobantes = await ComprobanteElectronico.findAll({
      where: whereCpe,
      attributes: { exclude: ['xml_firmado', 'cdr_respuesta'] },
      order: [['fecha_emision', 'ASC'], ['serie', 'ASC'], ['correlativo', 'ASC']],
    });

    const headers = [
      'CUO',
      'PERIODO',
      'FECHA_EMISION',
      'TIPO_CP',
      'SERIE',
      'CORRELATIVO',
      'TIPO_DOC_CLIENTE',
      'NUM_DOC_CLIENTE',
      'RAZON_SOCIAL_CLIENTE',
      'BASE_IMPONIBLE_GRAVADA',
      'DESCUENTO_BASE',
      'IGV_18',
      'EXONERADA',
      'INAFECTA',
      'IMPORTE_TOTAL',
      'MONEDA',
      'ESTADO_SUNAT',
      'MODULO_ORIGEN',
      'DOC_REFERENCIA',
    ];

    const rows = [headers.map(escapeCsv).join(',')];

    comprobantes.forEach((c, index) => {
      const esAnulado = c.sunat_estado === 'ANULADO';
      const factor = c.tipo_documento_codigo === '07' ? -1 : 1;
      const base = esAnulado ? 0 : Number(c.op_gravadas || 0) * factor;
      const igv = esAnulado ? 0 : Number(c.igv || 0) * factor;
      const total = esAnulado ? 0 : Number(c.total || 0) * factor;
      const fechaEmision = new Date(c.fecha_emision).toISOString().slice(0, 10);

      const cols = [
        `M${String(index + 1).padStart(5, '0')}`,
        `${year}${month}00`,
        fechaEmision,
        c.tipo_documento_codigo,
        c.serie,
        String(c.correlativo).padStart(8, '0'),
        c.cliente_tipo_doc,
        esAnulado ? '00000000' : c.cliente_num_doc,
        esAnulado ? 'COMPROBANTE ANULADO' : c.cliente_razon_social,
        base.toFixed(2),
        Number(c.descuento_global || 0).toFixed(2),
        igv.toFixed(2),
        Number(c.op_exoneradas || 0).toFixed(2),
        Number(c.op_inafectas || 0).toFixed(2),
        total.toFixed(2),
        c.moneda || 'PEN',
        c.sunat_estado,
        c.origen_modulo,
        c.doc_referencia_serie_num || '',
      ];
      rows.push(cols.map(escapeCsv).join(','));
    });

    // UTF-8 con BOM para que Microsoft Excel abra tildes y caracteres correctamente
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const filename = `FORMATO_14_1_VENTAS_${rucEmisor}_${year}${month}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Exportación TXT con estructura oficial PLE 14.1 SUNAT (34 campos separados por pipe |)
 */
export async function exportarPleVentasTxt(req, res) {
  try {
    const empresaId = req.empresa_id;
    const { periodo = new Date().toISOString().slice(0, 7) } = req.query;
    const { inicio, fin, year, month } = buildPeriodoRange(periodo);

    const empresa = await Empresa.findByPk(empresaId, { skipTenant: true });
    const rucEmisor = empresa?.ruc && empresa.ruc.trim().length === 11 ? empresa.ruc.trim() : '20600000001';

    const comprobantes = await ComprobanteElectronico.findAll({
      where: {
        empresa_id: empresaId,
        fecha_emision: { [Op.between]: [inicio, fin] },
      },
      attributes: { exclude: ['xml_firmado', 'cdr_respuesta'] },
      order: [['fecha_emision', 'ASC'], ['serie', 'ASC'], ['correlativo', 'ASC']],
    });

    const lines = comprobantes.map((c, idx) => {
      const d = new Date(c.fecha_emision);
      const fechaSlash = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const esAnulado = c.sunat_estado === 'ANULADO';
      const factor = c.tipo_documento_codigo === '07' ? -1 : 1;

      const base = esAnulado ? '0.00' : (Number(c.op_gravadas || 0) * factor).toFixed(2);
      const igv = esAnulado ? '0.00' : (Number(c.igv || 0) * factor).toFixed(2);
      const total = esAnulado ? '0.00' : (Number(c.total || 0) * factor).toFixed(2);
      const estadoPle = esAnulado ? '2' : '1';

      return [
        `${year}${month}00`,
        `CUO${String(idx + 1).padStart(6, '0')}`,
        `M${String(idx + 1).padStart(5, '0')}`,
        fechaSlash,
        '',
        c.tipo_documento_codigo,
        c.serie,
        String(c.correlativo),
        '',
        c.cliente_tipo_doc,
        esAnulado ? '0' : c.cliente_num_doc,
        esAnulado ? 'ANULADO' : (c.cliente_razon_social || 'CLIENTE VARIOS').slice(0, 100),
        '0.00',
        base,
        '0.00',
        igv,
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        total,
        c.moneda || 'PEN',
        '1.000',
        '',
        '',
        '',
        '',
        '',
        '1',
        estadoPle,
        '',
      ].join('|');
    });

    const tieneDatos = lines.length > 0 ? '1' : '0';
    // Nombre normado por SUNAT: LE + RUC(11) + AAAAMM00 + 140100 + 00 + OIM + Contenido + Moneda + 1.txt
    const pleFilename = `LE${rucEmisor}${year}${month}00140100001${tieneDatos}11.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${pleFilename}"`);
    return res.send(lines.join('\r\n'));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Exportación CSV del Kardex Físico y Valorizado SUNAT Formato 13.1 (Ferretería + Botica)
 */
export async function exportarKardexSunat131Csv(req, res) {
  try {
    const empresaId = req.empresa_id;
    const { periodo = new Date().toISOString().slice(0, 7) } = req.query;
    const { inicio, fin, year, month } = buildPeriodoRange(periodo);

    const headers = [
      'PERIODO',
      'FECHA_MOVIMIENTO',
      'MODULO',
      'CODIGO_ITEM',
      'DESCRIPCION_PRODUCTO',
      'UNIDAD_MEDIDA',
      'TIPO_OPERACION',
      'CANTIDAD_ENTRADA',
      'CANTIDAD_SALIDA',
      'SALDO_FINAL',
      'COSTO_UNITARIO_EST',
      'COSTO_TOTAL_SALDO',
      'MOTIVO_GLOSA',
    ];

    const rows = [headers.map(escapeCsv).join(',')];

    // 1. Movimientos de Ferretería
    try {
      const [ferreMovs] = await sequelize.query(
        `SELECT m.created_at as fecha, m.tipo, m.cantidad, m.stock_despues, m.motivo,
                p.codigo_barras, p.nombre, p.unidad_medida, p.precio_compra
         FROM ferreteria_inventario_movimientos m
         LEFT JOIN ferreteria_productos p ON p.id = m.id_producto
         WHERE m.empresa_id = :empresaId AND m.created_at BETWEEN :inicio AND :fin
         ORDER BY m.created_at ASC`,
        { replacements: { empresaId, inicio, fin } }
      );

      for (const m of ferreMovs) {
        const esEntrada = String(m.tipo).toLowerCase() === 'entrada';
        const cant = Number(m.cantidad || 0);
        const saldo = Number(m.stock_despues || 0);
        const costoUnit = Number(m.precio_compra || 0);

        rows.push(
          [
            `${year}${month}00`,
            new Date(m.fecha).toISOString().slice(0, 19).replace('T', ' '),
            'FERRETERIA',
            m.codigo_barras || 'SIN-COD',
            m.nombre || 'PRODUCTO FERRETERIA',
            m.unidad_medida || 'NIU',
            esEntrada ? '02 - COMPRA / ENTRADA' : '01 - VENTA / SALIDA',
            esEntrada ? cant.toFixed(2) : '0.00',
            !esEntrada ? cant.toFixed(2) : '0.00',
            saldo.toFixed(2),
            costoUnit.toFixed(2),
            (saldo * costoUnit).toFixed(2),
            m.motivo || '',
          ]
            .map(escapeCsv)
            .join(',')
        );
      }
    } catch (_) {}

    // 2. Movimientos de Botica (Kardex Farmacéutico)
    try {
      const [boticaMovs] = await sequelize.query(
        `SELECT k.created_at as fecha, k.tipo_movimiento, k.cantidad_cajas, k.saldo_cajas, k.motivo,
                m.codigo_digemid, m.nombre_comercial, m.precio_compra
         FROM botica_kardex k
         LEFT JOIN botica_medicamentos m ON m.id = k.id_medicamento
         WHERE k.empresa_id = :empresaId AND k.created_at BETWEEN :inicio AND :fin
         ORDER BY k.created_at ASC`,
        { replacements: { empresaId, inicio, fin } }
      );

      for (const b of boticaMovs) {
        const esSalida = String(b.tipo_movimiento).toUpperCase().includes('SALIDA');
        const cant = Number(b.cantidad_cajas || 0);
        const saldo = Number(b.saldo_cajas || 0);
        const costoUnit = Number(b.precio_compra || 0);

        rows.push(
          [
            `${year}${month}00`,
            new Date(b.fecha).toISOString().slice(0, 19).replace('T', ' '),
            'BOTICA',
            b.codigo_digemid || 'FARM-ITEM',
            b.nombre_comercial || 'MEDICAMENTO',
            'CAJA',
            esSalida ? '01 - DISPENSACIÓN / SALIDA' : '02 - INGRESO LOTE',
            !esSalida ? cant.toFixed(2) : '0.00',
            esSalida ? cant.toFixed(2) : '0.00',
            saldo.toFixed(2),
            costoUnit.toFixed(2),
            (saldo * costoUnit).toFixed(2),
            b.motivo || '',
          ]
            .map(escapeCsv)
            .join(',')
        );
      }
    } catch (_) {}

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const filename = `FORMATO_13_1_KARDEX_VALORIZADO_${year}${month}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Exportación CSV de Arqueos y Cierres de Caja (Core Cajas)
 */
export async function exportarArqueosCajaCsv(req, res) {
  try {
    const empresaId = req.empresa_id;
    const { periodo = new Date().toISOString().slice(0, 7) } = req.query;
    const { inicio, fin, year, month } = buildPeriodoRange(periodo);

    const cajas = await CajaGeneral.findAll({
      where: {
        empresa_id: empresaId,
        fecha_apertura: { [Op.between]: [inicio, fin] },
      },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
      order: [['fecha_apertura', 'ASC']],
    });

    const headers = [
      'ID_TURNO',
      'MODULO_ORIGEN',
      'CAJERO_RESPONSABLE',
      'FECHA_APERTURA',
      'FECHA_CIERRE',
      'ESTADO',
      'FONDO_INICIAL',
      'VENTAS_EFECTIVO',
      'VENTAS_DIGITALES',
      'INGRESOS_EXTRA',
      'EGRESOS_GASTOS',
      'SALDO_ESPERADO',
      'SALDO_CONTADO_REAL',
      'DIFERENCIA_DESCUADRE',
      'OBSERVACIONES',
    ];

    const rows = [headers.map(escapeCsv).join(',')];

    for (const c of cajas) {
      rows.push(
        [
          c.id,
          c.origen_modulo || 'general',
          c.usuario?.nombre || 'Cajero',
          c.fecha_apertura ? new Date(c.fecha_apertura).toISOString().slice(0, 19).replace('T', ' ') : '',
          c.fecha_cierre ? new Date(c.fecha_cierre).toISOString().slice(0, 19).replace('T', ' ') : 'EN TURNO',
          c.estado,
          Number(c.monto_inicial || 0).toFixed(2),
          Number(c.total_ventas_efectivo || 0).toFixed(2),
          Number(c.total_ventas_digital || 0).toFixed(2),
          Number(c.total_ingresos || 0).toFixed(2),
          Number(c.total_egresos || 0).toFixed(2),
          Number(c.saldo_esperado || 0).toFixed(2),
          c.monto_final !== null ? Number(c.monto_final).toFixed(2) : '',
          c.diferencia !== null ? Number(c.diferencia).toFixed(2) : '0.00',
          c.observaciones || '',
        ]
          .map(escapeCsv)
          .join(',')
      );
    }

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const filename = `LIBRO_CAJA_ARQUEOS_${year}${month}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
