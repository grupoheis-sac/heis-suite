import { Empresa, PagoSuscripcionSaaS } from '../models/index.js';
import {
  evaluarVigenciaEmpresa,
  ejecutarBarridoCorteAutomatico,
  registrarRenovacionSuscripcion,
} from '../services/subscriptionGuard.service.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';

export async function obtenerEstadoSuscripcionActual(req, res) {
  try {
    const empresaId = req.empresa_id || req.query.empresa_id;
    if (!empresaId) {
      return res.json({
        success: true,
        data: { estado_ciclo: 'SUPERADMIN_GLOBAL', bloqueado: false },
      });
    }

    const empresa = await Empresa.findByPk(empresaId, { skipTenant: true });
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    const evaluacion = evaluarVigenciaEmpresa(empresa);
    const historialPagos = await PagoSuscripcionSaaS.findAll({
      where: { empresa_id: empresa.id },
      order: [['fecha_pago', 'DESC']],
      limit: 12,
      skipTenant: true,
    });

    return res.json({
      success: true,
      data: {
        empresa_id: empresa.id,
        nombre: empresa.nombre,
        plan: empresa.plan,
        precio_mensual: Number(empresa.precio_mensual || 199),
        ...evaluacion,
        historial_pagos: historialPagos,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function listarCarteraCobranzasSaaS(req, res) {
  try {
    const empresas = await Empresa.findAll({
      order: [['fecha_vencimiento', 'ASC']],
      skipTenant: true,
    });

    const cartera = empresas.map((emp) => {
      const ev = evaluarVigenciaEmpresa(emp);
      return {
        id: emp.id,
        nombre: emp.nombre,
        ruc: emp.ruc,
        telefono: emp.telefono,
        plan: emp.plan,
        precio_mensual: Number(emp.precio_mensual || 0),
        fecha_vencimiento: emp.fecha_vencimiento,
        activo: emp.activo,
        estado_ciclo: ev.estado_ciclo,
        dias_restantes: ev.dias_restantes,
        dias_mora: ev.dias_mora,
        mensaje: ev.mensaje,
      };
    });

    const resumen = {
      activos: cartera.filter((c) => c.estado_ciclo === 'ACTIVO' || c.estado_ciclo === 'ILIMITADO').length,
      por_vencer: cartera.filter((c) => c.estado_ciclo === 'POR_VENCER').length,
      en_gracia: cartera.filter((c) => c.estado_ciclo === 'EN_GRACIA').length,
      suspendidos: cartera.filter((c) => c.estado_ciclo === 'SUSPENDIDO' || c.estado_ciclo === 'SUSPENDIDO_MORA').length,
    };

    return res.json({
      success: true,
      resumen,
      data: cartera,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function renovarSuscripcionEmpresa(req, res) {
  try {
    const { empresaId } = req.params;
    const {
      periodo_meses = 1,
      monto,
      metodo_pago = 'Transferencia',
      numero_operacion,
      observaciones,
    } = req.body;

    const resultado = await registrarRenovacionSuscripcion({
      empresaId: Number(empresaId),
      periodoMeses: Number(periodo_meses) || 1,
      monto,
      metodoPago: metodo_pago,
      numeroOperacion: numero_operacion,
      observaciones,
      usuarioSuperAdmin: req.user?.nombre || 'SuperAdmin HEIS',
    });

    await registrarAuditoria({
      empresa_id: resultado.empresa.id,
      modulo: 'superadmin_billing',
      accion: 'RENOVAR_SUSCRIPCION_SAAS',
      entidad: 'Empresa',
      entidad_id: resultado.empresa.id,
      detalles: {
        periodo_meses,
        monto: resultado.pago.monto,
        nueva_vigencia: resultado.empresa.fecha_vencimiento,
      },
      req,
    });

    return res.json({
      success: true,
      message: `Suscripción de "${resultado.empresa.nombre}" renovada hasta ${resultado.empresa.fecha_vencimiento}`,
      data: resultado,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function forzarBarridoMoraSaaS(req, res) {
  try {
    const reporte = await ejecutarBarridoCorteAutomatico();
    return res.json({
      success: true,
      message: `Barrido completado: ${reporte.suspendidas_count} empresa(s) suspendidas por mora.`,
      data: reporte,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
