import { Op } from 'sequelize';
import { KardexFarmacia, Medicamento, Lote, Venta, VentaDetalle } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

/**
 * Tabla 12 SUNAT: Tipo de Operación
 * 01: Venta nacional
 * 02: Compra nacional
 * 05: Devolución recibida por clientes
 * 06: Devolución entregada a proveedores
 * 07: Bonificación / Muestra médica
 * 99: Otros (Merma, desmedro, ajuste de inventario)
 */
function mapearTipoOperacionSunat(tipoMovimiento, motivo = '') {
  const tMov = String(tipoMovimiento || '').toUpperCase();
  const mot = String(motivo || '').toUpperCase();

  if (tMov === 'ENTRADA') {
    if (mot.includes('BONIFICAC') || mot.includes('MUESTRA')) return '07';
    if (mot.includes('DEVOLUC')) return '05';
    return '02'; // Compra nacional
  }
  if (tMov === 'SALIDA') {
    return '01'; // Venta
  }
  if (tMov === 'DEVOLUCION_PROVEEDOR') {
    return '06';
  }
  if (tMov.startsWith('MERMA') || tMov === 'AJUSTE_NEGATIVO' || tMov === 'AJUSTE_POSITIVO' || tMov.startsWith('TRASLADO')) {
    return '99';
  }
  return '99';
}

function parsearReferencia(refDoc) {
  let tipoComprobante = '00';
  let serie = '0000';
  let numero = '00000000';

  if (!refDoc) return { tipoComprobante, serie, numero };
  const ref = String(refDoc).trim();

  const match = ref.match(/([A-Z0-9]{4})-([0-9]+)/i);
  if (match) {
    serie = match[1].toUpperCase();
    numero = match[2].padStart(8, '0');
    if (serie.startsWith('F')) tipoComprobante = '01';
    else if (serie.startsWith('B')) tipoComprobante = '03';
    else if (serie.startsWith('T')) tipoComprobante = '09';
  } else {
    if (/factura/i.test(ref)) tipoComprobante = '01';
    else if (/boleta/i.test(ref)) tipoComprobante = '03';
    else if (/guia/i.test(ref)) tipoComprobante = '09';
    numero = ref.slice(0, 20);
  }

  return { tipoComprobante, serie, numero };
}

export const getKardex = async (req, res) => {
  try {
    const empresaId = req.tenant?.empresaId || req.empresa_id || req.user?.empresa_id;
    const sucursalId = req.query.sucursal_id || req.headers['x-sucursal-id'] || req.sucursal_id;
    const { id_medicamento, fecha_inicio, fecha_fin, limit = 100 } = req.query;

    const whereClause = {};
    if (empresaId) whereClause.empresa_id = empresaId;
    if (sucursalId) whereClause.id_sucursal = sucursalId;

    if (id_medicamento) {
      whereClause.id_medicamento = id_medicamento;
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha = {
        [Op.between]: [new Date(`${fecha_inicio}T00:00:00`), new Date(`${fecha_fin}T23:59:59`)],
      };
    }

    const movimientos = await KardexFarmacia.findAll({
      where: whereClause,
      include: [
        { model: Medicamento, as: 'medicamento', attributes: ['id', 'nombre_comercial', 'nombre_generico', 'concentracion'] },
        { model: Lote, as: 'lote', attributes: ['id', 'numero_lote', 'fecha_vencimiento'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limit) || 100,
    });

    res.json({ success: true, data: movimientos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumen = async (req, res) => {
  try {
    const empresaId = req.tenant?.empresaId || req.empresa_id || req.user?.empresa_id;
    const whereMeds = { activo: true };
    if (empresaId) whereMeds.empresa_id = empresaId;

    const meds = await Medicamento.findAll({ where: whereMeds });

    let totalProductos = meds.length;
    let stockBajo = 0;
    let valorizadoCompra = 0;
    let valorizadoVenta = 0;

    for (const m of meds) {
      const stock = parseFloat(m.stock_cajas || 0);
      const min = parseFloat(m.stock_minimo || 0);
      if (stock <= min) stockBajo++;
      valorizadoCompra += stock * parseFloat(m.precio_compra || 0);
      valorizadoVenta += stock * parseFloat(m.precio_venta || 0);
    }

    res.json({
      success: true,
      data: {
        totalProductos,
        stockBajo,
        valorizadoCompra: parseFloat(valorizadoCompra.toFixed(2)),
        valorizadoVenta: parseFloat(valorizadoVenta.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Kardex Valorizado SUNAT Formato 13.1 con Costo Promedio Ponderado
 */
export const getKardexValorizado = async (req, res) => {
  try {
    const empresaId = req.tenant?.empresaId || req.empresa_id || req.user?.empresa_id;
    const sucursalId = req.query.sucursal_id || req.headers['x-sucursal-id'] || req.sucursal_id;
    const { id_medicamento, fecha_inicio, fecha_fin } = req.query;

    const whereMed = { activo: true };
    if (empresaId) whereMed.empresa_id = empresaId;
    if (id_medicamento) whereMed.id = id_medicamento;

    let medicamento = await Medicamento.findOne({ where: whereMed });
    if (!medicamento && !id_medicamento) {
      medicamento = await Medicamento.findOne({ where: empresaId ? { empresa_id: empresaId } : {} });
    }

    if (!medicamento) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el medicamento solicitado para el Kardex.',
      });
    }

    const whereKardex = { id_medicamento: medicamento.id };
    if (empresaId) whereKardex.empresa_id = empresaId;
    if (sucursalId) whereKardex.id_sucursal = sucursalId;

    const movimientosRaw = await KardexFarmacia.findAll({
      where: whereKardex,
      include: [
        { model: Lote, as: 'lote', attributes: ['id', 'numero_lote', 'fecha_vencimiento'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha', 'ASC'], ['id', 'ASC']],
    });

    const precioCompraBase = parseFloat(medicamento.precio_compra || 0);
    const unidadesPorCaja = Number(medicamento.unidades_por_caja) || 1;

    let saldoCantidad = 0;
    let costoPromedio = precioCompraBase;
    let saldoValor = 0;

    const movimientosCalculados = [];

    const fInicio = fecha_inicio ? new Date(`${fecha_inicio}T00:00:00`) : null;
    const fFin = fecha_fin ? new Date(`${fecha_fin}T23:59:59`) : null;

    for (const mov of movimientosRaw) {
      const fechaMov = new Date(mov.fecha || mov.createdAt);
      const tMov = String(mov.tipo_movimiento || '').toUpperCase();
      const esEntrada = ['ENTRADA', 'AJUSTE_POSITIVO', 'TRASLADO_ENTRADA'].includes(tMov);

      const cantCajas = parseFloat(mov.cantidad_cajas || 0);
      const cantFrac = parseInt(mov.cantidad_fraccion || 0);
      const cantTotal = cantCajas + (cantFrac / unidadesPorCaja);

      let entradas = { cantidad: 0, costoUnitario: 0, costoTotal: 0 };
      let salidas = { cantidad: 0, costoUnitario: 0, costoTotal: 0 };

      if (esEntrada) {
        const costoUnitarioEntrada = precioCompraBase > 0 ? precioCompraBase : (costoPromedio || 0);
        const costoTotalEntrada = cantTotal * costoUnitarioEntrada;
        const nuevoSaldoCantidad = saldoCantidad + cantTotal;
        const nuevoSaldoValor = saldoValor + costoTotalEntrada;

        costoPromedio = nuevoSaldoCantidad > 0 ? nuevoSaldoValor / nuevoSaldoCantidad : costoUnitarioEntrada;
        saldoCantidad = nuevoSaldoCantidad;
        saldoValor = nuevoSaldoValor;

        entradas = {
          cantidad: Number(cantTotal.toFixed(2)),
          costoUnitario: Number(costoUnitarioEntrada.toFixed(4)),
          costoTotal: Number(costoTotalEntrada.toFixed(2)),
        };
      } else {
        const costoTotalSalida = cantTotal * costoPromedio;
        saldoCantidad = Math.max(0, saldoCantidad - cantTotal);
        saldoValor = Math.max(0, saldoValor - costoTotalSalida);
        if (saldoCantidad === 0) saldoValor = 0;

        salidas = {
          cantidad: Number(cantTotal.toFixed(2)),
          costoUnitario: Number(costoPromedio.toFixed(4)),
          costoTotal: Number(costoTotalSalida.toFixed(2)),
        };
      }

      const saldoFinal = {
        cantidad: Number(saldoCantidad.toFixed(2)),
        costoPromedio: Number(costoPromedio.toFixed(4)),
        costoTotal: Number(saldoValor.toFixed(2)),
      };

      // Si está en el rango solicitado
      const dentroDeRango = (!fInicio || fechaMov >= fInicio) && (!fFin || fechaMov <= fFin);

      if (dentroDeRango) {
        const { tipoComprobante, serie, numero } = parsearReferencia(mov.referencia_documento);
        const tipoOperacion = mapearTipoOperacionSunat(mov.tipo_movimiento, mov.motivo);

        movimientosCalculados.push({
          id: mov.id,
          fechaStr: fechaMov.toISOString().slice(0, 10),
          tipoComprobante,
          serie,
          numero,
          tipoOperacion,
          lote: mov.lote?.numero_lote || 'SIN LOTE',
          entradas,
          salidas,
          saldoFinal,
        });
      }
    }

    res.json({
      success: true,
      cabeceraSunat: {
        codigoExistencia: medicamento.codigo_digemid || medicamento.codigo_barras || `MED-${String(medicamento.id).padStart(5, '0')}`,
        tipoExistencia: '01', // Mercaderías
        descripcion: `${medicamento.nombre_comercial} ${medicamento.concentracion || ''}`.trim(),
        unidadMedida: medicamento.unidad_medida || 'NIU',
        metodoValuacion: 'PROMEDIO PONDERADO',
      },
      resumen: {
        saldoActualCantidad: Number(saldoCantidad.toFixed(2)),
        costoPromedioActual: Number(costoPromedio.toFixed(4)),
        valorTotalInventario: Number(saldoValor.toFixed(2)),
      },
      movimientos: movimientosCalculados,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Exportar CSV Formato 13.1 Kardex Valorizado
 */
export const exportarKardexSunat = async (req, res) => {
  try {
    const empresaId = req.tenant?.empresaId || req.empresa_id || req.user?.empresa_id;
    const { id_medicamento, fecha_inicio, fecha_fin } = req.query;

    const whereMed = { activo: true };
    if (empresaId) whereMed.empresa_id = empresaId;
    if (id_medicamento) whereMed.id = id_medicamento;

    const medicamento = await Medicamento.findOne({ where: whereMed });
    if (!medicamento) {
      return res.status(404).send('Medicamento no encontrado.');
    }

    const whereKardex = { id_medicamento: medicamento.id };
    if (empresaId) whereKardex.empresa_id = empresaId;

    const movimientosRaw = await KardexFarmacia.findAll({
      where: whereKardex,
      include: [{ model: Lote, as: 'lote', attributes: ['numero_lote'] }],
      order: [['fecha', 'ASC'], ['id', 'ASC']],
    });

    const precioCompraBase = parseFloat(medicamento.precio_compra || 0);
    const unidadesPorCaja = Number(medicamento.unidades_por_caja) || 1;

    let saldoCantidad = 0;
    let costoPromedio = precioCompraBase;
    let saldoValor = 0;

    const fInicio = fecha_inicio ? new Date(`${fecha_inicio}T00:00:00`) : null;
    const fFin = fecha_fin ? new Date(`${fecha_fin}T23:59:59`) : null;

    const csvLines = [
      'FECHA,TIPO_CP,SERIE,NUMERO,TIPO_OPERACION,LOTE,ENTRADA_CANT,ENTRADA_COSTO_UNIT,ENTRADA_TOTAL,SALIDA_CANT,SALIDA_COSTO_UNIT,SALIDA_TOTAL,SALDO_CANT,SALDO_COSTO_UNIT,SALDO_TOTAL',
    ];

    for (const mov of movimientosRaw) {
      const fechaMov = new Date(mov.fecha || mov.createdAt);
      const tMov = String(mov.tipo_movimiento || '').toUpperCase();
      const esEntrada = ['ENTRADA', 'AJUSTE_POSITIVO', 'TRASLADO_ENTRADA'].includes(tMov);

      const cantCajas = parseFloat(mov.cantidad_cajas || 0);
      const cantFrac = parseInt(mov.cantidad_fraccion || 0);
      const cantTotal = cantCajas + (cantFrac / unidadesPorCaja);

      let entCant = 0, entCUnit = 0, entTotal = 0;
      let salCant = 0, salCUnit = 0, salTotal = 0;

      if (esEntrada) {
        entCant = cantTotal;
        entCUnit = precioCompraBase > 0 ? precioCompraBase : (costoPromedio || 0);
        entTotal = entCant * entCUnit;

        const nuevoSaldoCantidad = saldoCantidad + entCant;
        const nuevoSaldoValor = saldoValor + entTotal;
        costoPromedio = nuevoSaldoCantidad > 0 ? nuevoSaldoValor / nuevoSaldoCantidad : entCUnit;
        saldoCantidad = nuevoSaldoCantidad;
        saldoValor = nuevoSaldoValor;
      } else {
        salCant = cantTotal;
        salCUnit = costoPromedio;
        salTotal = salCant * salCUnit;

        saldoCantidad = Math.max(0, saldoCantidad - salCant);
        saldoValor = Math.max(0, saldoValor - salTotal);
        if (saldoCantidad === 0) saldoValor = 0;
      }

      const dentroDeRango = (!fInicio || fechaMov >= fInicio) && (!fFin || fechaMov <= fFin);
      if (dentroDeRango) {
        const { tipoComprobante, serie, numero } = parsearReferencia(mov.referencia_documento);
        const tipoOp = mapearTipoOperacionSunat(mov.tipo_movimiento, mov.motivo);
        const lote = mov.lote?.numero_lote || 'S/L';

        csvLines.push(
          [
            fechaMov.toISOString().slice(0, 10),
            tipoComprobante,
            serie,
            numero,
            tipoOp,
            `"${lote}"`,
            entCant > 0 ? entCant.toFixed(2) : '0.00',
            entCUnit > 0 ? entCUnit.toFixed(4) : '0.0000',
            entTotal > 0 ? entTotal.toFixed(2) : '0.00',
            salCant > 0 ? salCant.toFixed(2) : '0.00',
            salCUnit > 0 ? salCUnit.toFixed(4) : '0.0000',
            salTotal > 0 ? salTotal.toFixed(2) : '0.00',
            saldoCantidad.toFixed(2),
            costoPromedio.toFixed(4),
            saldoValor.toFixed(2),
          ].join(',')
        );
      }
    }

    const codMed = medicamento.codigo_digemid || medicamento.id;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="KARDEX_13.1_${codMed}.csv"`);
    return res.send(`\uFEFF${csvLines.join('\r\n')}`);
  } catch (error) {
    res.status(500).send(`Error exportando kardex: ${error.message}`);
  }
};

/**
 * Libro de Recetas Retenidas y Psicotrópicos DIGEMID (D.S. 023-2001-SA)
 */
export const getLibroRecetas = async (req, res) => {
  try {
    const empresaId = req.tenant?.empresaId || req.empresa_id || req.user?.empresa_id;
    const { fecha_inicio, fecha_fin } = req.query;

    const whereVenta = {
      numero_receta: { [Op.ne]: null },
    };
    if (empresaId) whereVenta.empresa_id = empresaId;
    if (fecha_inicio && fecha_fin) {
      whereVenta.fecha = {
        [Op.between]: [new Date(`${fecha_inicio}T00:00:00`), new Date(`${fecha_fin}T23:59:59`)],
      };
    }

    const ventas = await Venta.findAll({
      where: whereVenta,
      include: [
        {
          model: VentaDetalle,
          as: 'detalles',
          include: [
            {
              model: Medicamento,
              as: 'medicamento',
              attributes: ['id', 'nombre_comercial', 'nombre_generico', 'concentracion', 'tipo_controlado'],
            },
            {
              model: Lote,
              as: 'lote',
              attributes: ['numero_lote', 'fecha_vencimiento'],
            },
          ],
        },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha', 'DESC']],
    });

    const registros = [];

    for (const v of ventas) {
      const fechaStr = new Date(v.fecha || v.createdAt).toISOString().slice(0, 10);
      const comprobante = `${v.tipo_comprobante || 'BV'} ${v.serie || 'B001'}-${String(v.correlativo || v.id).padStart(8, '0')}`;

      for (const d of v.detalles || []) {
        registros.push({
          id: `${v.id}-${d.id}`,
          fecha: fechaStr,
          comprobante,
          numeroReceta: v.numero_receta || 'S/R',
          pacienteNombre: v.paciente_nombre || 'PACIENTE VARIOS',
          pacienteDni: v.paciente_dni || '00000000',
          medicoNombre: v.medico_nombre || 'MEDICO NO ESPECIFICADO',
          medicoCmp: v.medico_cmp || '00000',
          medicamento: d.medicamento?.nombre_comercial || 'MEDICAMENTO',
          dci: d.medicamento?.nombre_generico || '',
          tipoControlado: d.medicamento?.tipo_controlado || 'No_Controlado',
          lote: d.lote?.numero_lote || 'S/L',
          vence: d.lote?.fecha_vencimiento || '-',
          cantidad: parseFloat(d.cantidad_cajas || 0) + (parseInt(d.cantidad_fraccion || 0) > 0 ? ` + ${d.cantidad_fraccion} f.` : ''),
          dispensadoPor: v.usuario?.nombre || 'FARMACÉUTICO',
        });
      }
    }

    res.json({ success: true, registros });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
