import { Empresa, PagoSuscripcionSaaS } from '../models/index.js';
import { invalidateEmpresaCache } from '../context/tenantContext.js';
import { emitTenantEvent } from './realtime.service.js';

export const DIAS_AVISO_PREVENTIVO = 5;
export const DIAS_PERIODO_GRACIA = 3;

/**
 * Evalúa el estado financiero y de vigencia de una empresa cliente
 */
export function evaluarVigenciaEmpresa(empresa) {
  if (!empresa) {
    return { estado_ciclo: 'DESCONOCIDO', bloqueado: true };
  }

  if (!empresa.activo) {
    return {
      estado_ciclo: 'SUSPENDIDO',
      dias_restantes: null,
      dias_mora: 0,
      bloqueado: true,
      mensaje: 'Su cuenta empresarial se encuentra suspendida. Contacte a facturación de HEIS SAC.',
    };
  }

  // Si no tiene fecha_vencimiento, es licencia vitalicia / ilimitada
  if (!empresa.fecha_vencimiento) {
    return {
      estado_ciclo: 'ILIMITADO',
      dias_restantes: null,
      dias_mora: 0,
      bloqueado: false,
      mensaje: 'Suscripción activa sin fecha de caducidad.',
    };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [y, m, d] = String(empresa.fecha_vencimiento).split('-').map(Number);
  const fechaVenc = new Date(y, (m || 1) - 1, d || 1);
  fechaVenc.setHours(0, 0, 0, 0);

  const diffMs = fechaVenc.getTime() - hoy.getTime();
  const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diasRestantes > DIAS_AVISO_PREVENTIVO) {
    return {
      estado_ciclo: 'ACTIVO',
      dias_restantes: diasRestantes,
      dias_mora: 0,
      fecha_vencimiento: empresa.fecha_vencimiento,
      bloqueado: false,
      mensaje: `Suscripción activa (${diasRestantes} días disponibles).`,
    };
  }

  if (diasRestantes >= 0 && diasRestantes <= DIAS_AVISO_PREVENTIVO) {
    return {
      estado_ciclo: 'POR_VENCER',
      dias_restantes: diasRestantes,
      dias_mora: 0,
      fecha_vencimiento: empresa.fecha_vencimiento,
      bloqueado: false,
      mensaje:
        diasRestantes === 0
          ? 'Su suscripción vence el día de hoy. Renueve para evitar recargos o interrupciones.'
          : `Su suscripción vence en ${diasRestantes} día(s) (${empresa.fecha_vencimiento}).`,
    };
  }

  const diasMora = Math.abs(diasRestantes);
  const diasGraciaRestantes = DIAS_PERIODO_GRACIA - diasMora;

  if (diasMora <= DIAS_PERIODO_GRACIA) {
    return {
      estado_ciclo: 'EN_GRACIA',
      dias_restantes: diasRestantes,
      dias_mora: diasMora,
      dias_gracia_restantes: Math.max(0, diasGraciaRestantes),
      fecha_vencimiento: empresa.fecha_vencimiento,
      bloqueado: false,
      mensaje: `Suscripción vencida hace ${diasMora} día(s). Se encuentra en Período de Gracia (${Math.max(0, diasGraciaRestantes)} día(s) antes del corte automático).`,
    };
  }

  return {
    estado_ciclo: 'SUSPENDIDO_MORA',
    dias_restantes: diasRestantes,
    dias_mora: diasMora,
    fecha_vencimiento: empresa.fecha_vencimiento,
    bloqueado: true,
    mensaje: `Servicio suspendido automáticamente por facturación vencida (${empresa.fecha_vencimiento}). Comuníquese con soporte HEIS SAC para reactivar su acceso.`,
  };
}

/**
 * Procesa el barrido automático de todas las empresas y aplica el corte a aquellas que superaron los días de gracia
 */
export async function ejecutarBarridoCorteAutomatico() {
  const empresasActivas = await Empresa.findAll({
    where: { activo: true },
    skipTenant: true,
  });

  const suspendidasAhora = [];

  for (const emp of empresasActivas) {
    const evalResult = evaluarVigenciaEmpresa(emp);
    if (evalResult.estado_ciclo === 'SUSPENDIDO_MORA') {
      emp.activo = false;
      await emp.save({ skipTenant: true });
      invalidateEmpresaCache(emp.id);

      emitTenantEvent(emp.id, 'suscripcion:suspendida', {
        empresa_id: emp.id,
        mensaje: evalResult.mensaje,
      });

      suspendidasAhora.push({
        id: emp.id,
        nombre: emp.nombre,
        ruc: emp.ruc,
        fecha_vencimiento: emp.fecha_vencimiento,
        dias_mora: evalResult.dias_mora,
      });
    }
  }

  return {
    revisadas: empresasActivas.length,
    suspendidas_count: suspendidasAhora.length,
    suspendidas: suspendidasAhora,
  };
}

/**
 * Registra un pago de renovación SaaS, reactiva automáticamente a la empresa y extiende su fecha de vencimiento
 */
export async function registrarRenovacionSuscripcion({
  empresaId,
  periodoMeses = 1,
  monto = null,
  metodoPago = 'Transferencia',
  numeroOperacion = null,
  observaciones = null,
  usuarioSuperAdmin = 'SuperAdmin HEIS',
}) {
  const empresa = await Empresa.findByPk(empresaId, { skipTenant: true });
  if (!empresa) {
    throw new Error('Empresa no encontrada');
  }

  const meses = Math.max(1, Number(periodoMeses) || 1);
  const importe = monto !== null && monto !== undefined && monto !== ''
    ? Number(monto)
    : Number((Number(empresa.precio_mensual || 199) * meses).toFixed(2));

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let baseDate = new Date(hoy);
  if (empresa.fecha_vencimiento) {
    const [y, m, d] = String(empresa.fecha_vencimiento).split('-').map(Number);
    const vencActual = new Date(y, (m || 1) - 1, d || 1);
    if (vencActual > hoy) {
      baseDate = vencActual;
    }
  }

  const vigenciaDesdeStr = baseDate.toISOString().slice(0, 10);
  const nuevaFecha = new Date(baseDate);
  nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
  const vigenciaHastaStr = nuevaFecha.toISOString().slice(0, 10);

  const pago = await PagoSuscripcionSaaS.create({
    empresa_id: empresa.id,
    plan: empresa.plan || 'professional',
    periodo_meses: meses,
    monto: importe,
    moneda: 'PEN',
    metodo_pago: metodoPago,
    numero_operacion: numeroOperacion,
    fecha_pago: new Date(),
    vigencia_desde: vigenciaDesdeStr,
    vigencia_hasta: vigenciaHastaStr,
    estado: 'CONFIRMADO',
    registrado_por: usuarioSuperAdmin,
    observaciones,
  }, { skipTenant: true });

  empresa.fecha_vencimiento = vigenciaHastaStr;
  empresa.activo = true;
  await empresa.save({ skipTenant: true });

  invalidateEmpresaCache(empresa.id);

  emitTenantEvent(empresa.id, 'suscripcion:renovada', {
    empresa_id: empresa.id,
    fecha_vencimiento: vigenciaHastaStr,
    mensaje: `Suscripción renovada hasta el ${vigenciaHastaStr}`,
  });

  return {
    empresa,
    pago,
  };
}
