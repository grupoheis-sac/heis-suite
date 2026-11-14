import sequelize from '../config/db.js';
import { CajaGeneral, CajaMovimientoGeneral } from '../core/models/index.js';

export async function ejecutarMigracionUnificarCajas() {
  console.log('🔄 Iniciando sincronización y migración de Cajas Multi-Tenant hacia Core...');
  try {
    await CajaGeneral.sync({ alter: true });
    await CajaMovimientoGeneral.sync({ alter: true });

    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map((t) => Object.values(t)[0]);

    // 1. Ferretería
    if (tableNames.includes('ferreteria_cajas')) {
      const [fCajas] = await sequelize.query('SELECT * FROM ferreteria_cajas');
      for (const fc of fCajas) {
        const [, created] = await CajaGeneral.findOrCreate({
          where: { origen_modulo: 'ferreteria', ref_legacy_id: fc.id },
          defaults: {
            empresa_id: fc.empresa_id || 1,
            sucursal_id: fc.sucursal_id || null,
            id_usuario: fc.id_usuario || 1,
            origen_modulo: 'ferreteria',
            ref_legacy_id: fc.id,
            monto_inicial: fc.monto_inicial || 0,
            monto_final: fc.monto_final,
            total_ventas_efectivo: fc.total_ventas_efectivo || 0,
            total_ingresos: fc.total_ingresos_abonos || 0,
            total_egresos: fc.total_egresos || 0,
            fecha_apertura: fc.fecha_apertura,
            fecha_cierre: fc.fecha_cierre,
            estado: fc.estado || 'Abierta',
            observaciones: fc.observaciones,
          },
          skipTenant: true,
        });

        if (created && tableNames.includes('ferreteria_caja_movimientos')) {
          const cajaCore = await CajaGeneral.findOne({
            where: { origen_modulo: 'ferreteria', ref_legacy_id: fc.id },
            skipTenant: true,
          });
          const [movs] = await sequelize.query(
            `SELECT * FROM ferreteria_caja_movimientos WHERE id_caja = ${Number(fc.id)}`
          );
          for (const m of movs) {
            await CajaMovimientoGeneral.create({
              empresa_id: m.empresa_id || fc.empresa_id || 1,
              id_caja: cajaCore.id,
              id_usuario: m.id_usuario || fc.id_usuario || 1,
              origen_modulo: 'ferreteria',
              tipo: m.tipo,
              concepto: m.concepto,
              monto: m.monto,
              fecha: m.fecha,
            }, { skipTenant: true });
          }
        }
      }
      console.log(`✅ Historial de ferreteria_cajas sincronizado (${fCajas.length} registros revisados).`);
    }

    // 2. Botica
    if (tableNames.includes('botica_cajas')) {
      const [bCajas] = await sequelize.query('SELECT * FROM botica_cajas');
      for (const bc of bCajas) {
        const [, created] = await CajaGeneral.findOrCreate({
          where: { origen_modulo: 'botica', ref_legacy_id: bc.id },
          defaults: {
            empresa_id: bc.empresa_id || 1,
            sucursal_id: bc.id_sucursal || null,
            id_usuario: bc.id_usuario || 1,
            origen_modulo: 'botica',
            ref_legacy_id: bc.id,
            monto_inicial: bc.monto_inicial || 0,
            monto_final: bc.monto_final,
            total_ventas_efectivo: bc.total_ventas || 0,
            total_ingresos: bc.total_ingresos || 0,
            total_egresos: bc.total_egresos || 0,
            saldo_esperado: bc.saldo_esperado,
            diferencia: bc.diferencia,
            fecha_apertura: bc.fecha_apertura,
            fecha_cierre: bc.fecha_cierre,
            estado: bc.estado || 'Abierta',
            observaciones: bc.observaciones,
          },
          skipTenant: true,
        });

        if (created && tableNames.includes('botica_caja_movimientos')) {
          const cajaCore = await CajaGeneral.findOne({
            where: { origen_modulo: 'botica', ref_legacy_id: bc.id },
            skipTenant: true,
          });
          const [movs] = await sequelize.query(
            `SELECT * FROM botica_caja_movimientos WHERE id_caja = ${Number(bc.id)}`
          );
          for (const m of movs) {
            await CajaMovimientoGeneral.create({
              empresa_id: m.empresa_id || bc.empresa_id || 1,
              id_caja: cajaCore.id,
              id_usuario: m.id_usuario || bc.id_usuario || 1,
              origen_modulo: 'botica',
              tipo: m.tipo,
              concepto: m.motivo || 'Movimiento botica',
              comprobante: m.comprobante,
              monto: m.monto,
              fecha: m.fecha,
            }, { skipTenant: true });
          }
        }
      }
      console.log(`✅ Historial de botica_cajas sincronizado (${bCajas.length} registros revisados).`);
    }

    // 3. Hospedaje
    if (tableNames.includes('hospedaje_cajas')) {
      const [hCajas] = await sequelize.query('SELECT * FROM hospedaje_cajas');
      for (const hc of hCajas) {
        const [, created] = await CajaGeneral.findOrCreate({
          where: { origen_modulo: 'hospedaje', ref_legacy_id: hc.id },
          defaults: {
            empresa_id: hc.empresa_id || 1,
            sucursal_id: hc.sucursal_id || null,
            id_usuario: hc.user_id || 1,
            origen_modulo: 'hospedaje',
            ref_legacy_id: hc.id,
            monto_inicial: hc.monto_apertura || 0,
            monto_final: hc.monto_cierre_real,
            saldo_esperado: hc.monto_cierre_sistema,
            diferencia: hc.diferencia,
            fecha_apertura: hc.fecha_apertura,
            fecha_cierre: hc.fecha_cierre,
            estado: hc.estado === 'cerrado' ? 'Cerrada' : 'Abierta',
            observaciones: hc.observaciones,
          },
          skipTenant: true,
        });

        if (created && tableNames.includes('hospedaje_caja_movimientos')) {
          const cajaCore = await CajaGeneral.findOne({
            where: { origen_modulo: 'hospedaje', ref_legacy_id: hc.id },
            skipTenant: true,
          });
          const [movs] = await sequelize.query(
            `SELECT * FROM hospedaje_caja_movimientos WHERE turno_id = ${Number(hc.id)}`
          );
          for (const m of movs) {
            await CajaMovimientoGeneral.create({
              empresa_id: m.empresa_id || hc.empresa_id || 1,
              id_caja: cajaCore.id,
              id_usuario: hc.user_id || 1,
              origen_modulo: 'hospedaje',
              tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
              concepto: m.motivo || 'Movimiento recepción',
              comprobante: m.comprobante,
              monto: m.monto,
              fecha: m.fecha,
            }, { skipTenant: true });
          }
        }
      }
      console.log(`✅ Historial de hospedaje_cajas sincronizado (${hCajas.length} registros revisados).`);
    }

    console.log('🎉 Migración de Cajas Multi-Tenant finalizada con éxito.');
  } catch (error) {
    console.error('❌ Error en migración de cajas:', error.message);
  }
}

if (process.argv[1] && process.argv[1].includes('migration_unificar_cajas')) {
  ejecutarMigracionUnificarCajas().then(() => process.exit(0));
}
