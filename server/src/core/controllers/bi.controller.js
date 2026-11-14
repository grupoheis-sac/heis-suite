import { Op } from 'sequelize';
import sequelize from '../../config/db.js';
import {
  CajaGeneral,
  CajaMovimientoGeneral,
  ComprobanteElectronico,
  Sucursal,
} from '../models/index.js';

async function safeQuery(sql, replacements) {
  try {
    const [rows] = await sequelize.query(sql, { replacements });
    return rows || [];
  } catch (_) {
    return [];
  }
}

export async function obtenerDashboardEjecutivoBI(req, res) {
  try {
    const empresaId = req.empresa_id;
    const dias = Math.min(90, Math.max(7, Number(req.query.dias) || 30));

    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - dias);
    fechaDesde.setHours(0, 0, 0, 0);

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    // 1. Movimientos de Caja General Transversal en el período
    const movimientosPeriodo = await CajaMovimientoGeneral.findAll({
      where: {
        empresa_id: empresaId,
        fecha: { [Op.gte]: fechaDesde },
      },
      order: [['fecha', 'ASC']],
    });

    let ingresosPeriodo = 0;
    let egresosPeriodo = 0;
    let ingresosHoy = 0;
    let egresosHoy = 0;

    const ingresosPorModulo = {
      restaurante: 0,
      ferreteria: 0,
      botica: 0,
      hospedaje: 0,
      general: 0,
    };

    const serieDiariaMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      serieDiariaMap.set(key, { fecha: key, ingresos: 0, egresos: 0 });
    }

    for (const m of movimientosPeriodo) {
      const monto = Number(m.monto || 0);
      const esIngreso = String(m.tipo).toLowerCase() === 'ingreso';
      const fechaMov = new Date(m.fecha || m.createdAt);
      const diaKey = fechaMov.toISOString().slice(0, 10);
      const mod = (m.origen_modulo || 'general').toLowerCase();

      if (esIngreso) {
        ingresosPeriodo += monto;
        if (fechaMov >= hoyInicio) ingresosHoy += monto;
        if (ingresosPorModulo[mod] !== undefined) {
          ingresosPorModulo[mod] += monto;
        } else {
          ingresosPorModulo.general += monto;
        }
      } else {
        egresosPeriodo += monto;
        if (fechaMov >= hoyInicio) egresosHoy += monto;
      }

      if (serieDiariaMap.has(diaKey)) {
        const entry = serieDiariaMap.get(diaKey);
        if (esIngreso) entry.ingresos = Number((entry.ingresos + monto).toFixed(2));
        else entry.egresos = Number((entry.egresos + monto).toFixed(2));
      }
    }

    // 2. Estado de Cajas Abiertas en vivo
    const cajasAbiertas = await CajaGeneral.count({
      where: { empresa_id: empresaId, estado: ['Abierta', 'abierta'] },
    });

    // 3. Resumen de Comprobantes Electrónicos SUNAT UBL 2.1
    let cpeStats = { total_emitidos: 0, total_facturado: 0, total_igv: 0 };
    try {
      const cpes = await ComprobanteElectronico.findAll({
        where: {
          empresa_id: empresaId,
          fecha_emision: { [Op.gte]: fechaDesde },
          sunat_estado: 'ACEPTADO',
        },
        attributes: ['id', 'total', 'igv', 'tipo_comprobante'],
      });
      cpeStats.total_emitidos = cpes.length;
      for (const c of cpes) {
        if (c.tipo_comprobante !== 'NotaCredito') {
          cpeStats.total_facturado += Number(c.total || 0);
          cpeStats.total_igv += Number(c.igv || 0);
        }
      }
    } catch (_) {}

    // 4. Indicadores Operativos en Vivo por Giro Vertical
    // 4.1 Restaurante: Mesas ocupadas y Platos Top
    const mesasRows = await safeQuery(
      `SELECT status, COUNT(*) as total FROM restaurante_mesas WHERE empresa_id = :empresaId GROUP BY status`,
      { empresaId }
    );
    const kdsRows = await safeQuery(
      `SELECT COUNT(*) as pendientes FROM restaurante_ordenes WHERE empresa_id = :empresaId AND status IN ('pending', 'cooking')`,
      { empresaId }
    );

    // 4.2 Hospedaje: Ocupación Hotelera en Vivo
    const habRows = await safeQuery(
      `SELECT estado, COUNT(*) as total FROM hospedaje_habitaciones WHERE empresa_id = :empresaId GROUP BY estado`,
      { empresaId }
    );

    // 4.3 Ferretería: Productos con Stock Crítico
    const stockFerreteriaRows = await safeQuery(
      `SELECT id, nombre, stock, stock_minimo, unidad_medida FROM ferreteria_productos WHERE empresa_id = :empresaId AND activo = 1 AND stock <= COALESCE(stock_minimo, 5) ORDER BY stock ASC LIMIT 8`,
      { empresaId }
    );

    // 4.4 Botica: Lotes próximos a vencer (FEFO <= 60 días) y Stock crítico
    const lotesPorVencerRows = await safeQuery(
      `SELECT l.id, l.numero_lote, l.fecha_vencimiento, l.stock_cajas, m.nombre_comercial 
       FROM botica_lotes l
       LEFT JOIN botica_medicamentos m ON m.id = l.id_medicamento
       WHERE l.empresa_id = :empresaId AND l.activo = 1 AND l.stock_cajas > 0
         AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
       ORDER BY l.fecha_vencimiento ASC LIMIT 8`,
      { empresaId }
    );

    // Calcular métricas de ocupación hotelera
    let totalHabitaciones = 0;
    let habitacionesOcupadas = 0;
    habRows.forEach((r) => {
      const cant = Number(r.total || 0);
      totalHabitaciones += cant;
      if (String(r.estado).toLowerCase() === 'ocupada') {
        habitacionesOcupadas += cant;
      }
    });
    const tasaOcupacionHotel =
      totalHabitaciones > 0 ? Math.round((habitacionesOcupadas / totalHabitaciones) * 100) : 0;

    // Calcular métricas de salón restaurante
    let totalMesas = 0;
    let mesasOcupadas = 0;
    mesasRows.forEach((r) => {
      const cant = Number(r.total || 0);
      totalMesas += cant;
      if (String(r.status).toLowerCase() !== 'available') {
        mesasOcupadas += cant;
      }
    });

    const utilidadNetaPeriodo = Number((ingresosPeriodo - egresosPeriodo).toFixed(2));
    const margenOperativoPct =
      ingresosPeriodo > 0 ? Math.round((utilidadNetaPeriodo / ingresosPeriodo) * 100) : 0;

    const sucursales = await Sucursal.count({ where: { empresa_id: empresaId, activo: true } });

    return res.json({
      success: true,
      data: {
        periodo_dias: dias,
        kpis: {
          ingresos_periodo: Number(ingresosPeriodo.toFixed(2)),
          egresos_periodo: Number(egresosPeriodo.toFixed(2)),
          utilidad_neta: utilidadNetaPeriodo,
          margen_operativo_pct: margenOperativoPct,
          ingresos_hoy: Number(ingresosHoy.toFixed(2)),
          egresos_hoy: Number(egresosHoy.toFixed(2)),
          cajas_abiertas: cajasAbiertas,
          sucursales_activas: sucursales || 1,
          cpe_emitidos: cpeStats.total_emitidos,
          cpe_total_facturado: Number(cpeStats.total_facturado.toFixed(2)),
          cpe_total_igv: Number(cpeStats.total_igv.toFixed(2)),
        },
        ingresos_por_modulo: Object.entries(ingresosPorModulo).map(([modulo, monto]) => ({
          modulo,
          monto: Number(monto.toFixed(2)),
        })),
        serie_ultimos_7_dias: Array.from(serieDiariaMap.values()),
        operacion_en_vivo: {
          restaurante: {
            total_mesas: totalMesas,
            mesas_ocupadas: mesasOcupadas,
            comandas_kds_activas: Number(kdsRows[0]?.pendientes || 0),
          },
          hospedaje: {
            total_habitaciones: totalHabitaciones,
            habitaciones_ocupadas: habitacionesOcupadas,
            tasa_ocupacion_pct: tasaOcupacionHotel,
          },
          alertas_ferreteria: stockFerreteriaRows,
          alertas_fefo_botica: lotesPorVencerRows,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export default {
  obtenerDashboardEjecutivoBI,
};
