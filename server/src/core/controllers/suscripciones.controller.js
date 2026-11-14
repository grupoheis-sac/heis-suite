import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Transaction } from 'sequelize';
import { sequelize } from '../../config/db.js';
import {
  Empresa,
  Sucursal,
  Rol,
  Usuario,
  PlanSaaS,
  PagoSuscripcionSaaS,
} from '../models/index.js';
import {
  evaluarVigenciaEmpresa,
  ejecutarBarridoCorteAutomatico,
  registrarRenovacionSuscripcion,
} from '../services/subscriptionGuard.service.js';
import { registrarAuditoria } from '../middleware/auditoria.middleware.js';
import {
  verifyMercadoPagoWebhook,
  verifyIzipayWebhook,
  verifyStripeWebhook,
} from '../services/paymentWebhookVerifier.js';
import {
  emitirFacturaSuscripcionSaaS,
  dispararEnvioInmediatoWorkerSunat,
} from '../services/saasBillingIssuer.service.js';
import { emitToTenantSucursal } from '../services/realtime.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'heis_suite_super_secure_jwt_token_key_2026_enterprise_saas';

/**
 * Algoritmo oficial SUNAT Módulo 11 para validar RUC peruano de 11 dígitos
 */
export function validarRucSunatModulo11(ruc) {
  const clean = String(ruc || '').trim();
  if (!/^(10|15|17|20)\d{9}$/.test(clean)) return false;

  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += Number(clean[i]) * factores[i];
  }
  const resto = 11 - (suma % 11);
  const digitoVerificador = resto === 10 ? 0 : resto === 11 ? 1 : resto;
  return digitoVerificador === Number(clean[10]);
}

/**
 * Normaliza el payload de Mercado Pago, Izipay o Stripe en un objeto estándar
 */
export function normalizarEventoPasarela(pasarela, req) {
  if (pasarela === 'MERCADOPAGO') {
    const body = req.body || {};
    return {
      txId: String(body.data?.id || req.query?.['data.id'] || ''),
      status: body.action === 'payment.created' || body.type === 'payment' ? 'APPROVED' : 'PENDING',
      empresaId: Number(body.metadata?.empresa_id || body.data?.metadata?.empresa_id),
      planCodigo: String(body.metadata?.plan_codigo || 'PRO').toUpperCase(),
      periodo: String(body.metadata?.periodo || 'MENSUAL').toUpperCase(),
      monto: Number(body.transaction_amount || body.data?.transaction_amount || 199.00),
    };
  }

  if (pasarela === 'IZIPAY') {
    const answer = typeof req.body?.['kr-answer'] === 'string'
      ? JSON.parse(req.body['kr-answer'] || '{}')
      : req.body?.['kr-answer'] || {};
    const tx = answer.transactions?.[0] || {};
    return {
      txId: String(tx.uuid || answer.orderDetails?.orderId || ''),
      status: answer.orderStatus === 'PAID' ? 'APPROVED' : 'REJECTED',
      empresaId: Number(answer.customer?.shoppingCart?.cartItemInfo?.[0]?.productRef || tx.metadata?.empresa_id),
      planCodigo: String(tx.metadata?.plan_codigo || 'PRO').toUpperCase(),
      periodo: String(tx.metadata?.periodo || 'MENSUAL').toUpperCase(),
      monto: Number((answer.orderDetails?.orderTotalAmount || 19900) / 100),
    };
  }

  if (pasarela === 'STRIPE') {
    const event = req.body || {};
    const session = event.data?.object || {};
    return {
      txId: String(session.id || event.id || ''),
      status:
        event.type === 'invoice.payment_succeeded' || event.type === 'checkout.session.completed'
          ? 'APPROVED'
          : 'IGNORED',
      empresaId: Number(session.metadata?.empresa_id || session.client_reference_id),
      planCodigo: String(session.metadata?.plan_codigo || 'PRO').toUpperCase(),
      periodo: String(session.metadata?.periodo || 'MENSUAL').toUpperCase(),
      monto: Number((session.amount_paid || session.amount_total || 19900) / 100),
    };
  }

  throw new Error(`Pasarela no soportada: ${pasarela}`);
}

/**
 * 1. POST /api/suscripciones/webhooks/:pasarela
 * Procesa renovaciones de suscripción con verificación HMAC, idempotencia y auto-facturación SUNAT
 */
export const procesarWebhookPasarela = async (req, res, next) => {
  const pasarela = String(req.params.pasarela || '').toUpperCase();

  try {
    // Paso 1: Verificación criptográfica obligatoria
    let firmaValida = false;
    if (pasarela === 'MERCADOPAGO') firmaValida = verifyMercadoPagoWebhook(req);
    else if (pasarela === 'IZIPAY') firmaValida = verifyIzipayWebhook(req);
    else if (pasarela === 'STRIPE') firmaValida = verifyStripeWebhook(req);

    if (!firmaValida) {
      return res.status(401).json({
        ok: false,
        code: 'INVALID_WEBHOOK_SIGNATURE',
        message: 'Firma criptográfica del Webhook inválida o expirada.',
      });
    }

    const evento = normalizarEventoPasarela(pasarela, req);

    if (evento.status !== 'APPROVED' || !evento.txId || !evento.empresaId) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Paso 2: Transacción ACID (Idempotencia + Renovación de Tenant + Auto-Factura UBL 2.1)
    const resultado = await sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async (t) => {
        // Verificar si esta transacción de pasarela ya fue procesada antes (Idempotencia)
        const pagoExistente = await PagoSuscripcionSaaS.findOne({
          where: { pasarela, pasarela_tx_id: evento.txId },
          lock: t.LOCK.UPDATE,
          skipTenantScope: true,
          transaction: t,
        });

        if (pagoExistente) {
          return { yaProcesado: true, pago: pagoExistente };
        }

        const empresaCliente = await Empresa.findOne({
          where: { id: evento.empresaId },
          lock: t.LOCK.UPDATE,
          skipTenantScope: true,
          transaction: t,
        });

        if (!empresaCliente) {
          throw new Error(`Empresa cliente ID ${evento.empresaId} no encontrada.`);
        }

        const plan = await PlanSaaS.findOne({
          where: { codigo: evento.planCodigo },
          skipTenantScope: true,
          transaction: t,
        });

        // Calcular nueva fecha de vencimiento sumando sobre el vencimiento futuro o sobre hoy
        const baseDate =
          empresaCliente.suscripcion_vence_en &&
          new Date(empresaCliente.suscripcion_vence_en) > new Date()
            ? new Date(empresaCliente.suscripcion_vence_en)
            : new Date();

        const nuevoVencimiento = new Date(baseDate);
        if (evento.periodo === 'ANUAL') {
          nuevoVencimiento.setFullYear(nuevoVencimiento.getFullYear() + 1);
        } else {
          nuevoVencimiento.setMonth(nuevoVencimiento.getMonth() + 1);
        }

        // Actualizar estado de suscripción y límites del Tenant
        await empresaCliente.update(
          {
            plan_id: plan?.id || empresaCliente.plan_id,
            plan_codigo: evento.planCodigo,
            estado_suscripcion: 'ACTIVA',
            activo: true,
            suscripcion_vence_en: nuevoVencimiento,
            fecha_vencimiento: nuevoVencimiento.toISOString().slice(0, 10),
          },
          { skipTenantScope: true, transaction: t }
        );

        // Emitir automáticamente la Factura Electrónica UBL 2.1 de GRUPO HEIS S.A.C. al Tenant
        const { comprobante } = await emitirFacturaSuscripcionSaaS({
          empresaCliente,
          planCodigo: evento.planCodigo,
          periodo: evento.periodo,
          montoPagado: evento.monto,
          pasarela,
          pasarelaTxId: evento.txId,
          transaction: t,
        });

        // Registrar el pago vinculado al comprobante electrónico generado
        const nuevoPago = await PagoSuscripcionSaaS.create(
          {
            empresa_id: empresaCliente.id,
            plan_id: plan?.id || 'PRO',
            plan: evento.planCodigo,
            pasarela,
            pasarela_tx_id: evento.txId,
            monto: evento.monto,
            moneda: 'PEN',
            periodo: evento.periodo,
            periodo_meses: evento.periodo === 'ANUAL' ? 12 : 1,
            estado: 'CONFIRMADO',
            firma_verificada: true,
            comprobante_emitido_id: comprobante.id,
            fecha_pago: new Date(),
            vigencia_desde: baseDate.toISOString().slice(0, 10),
            vigencia_hasta: nuevoVencimiento.toISOString().slice(0, 10),
            observaciones: `Pasarela ${pasarela} - Ref: ${evento.txId}`,
          },
          { skipTenantScope: true, transaction: t }
        );

        return {
          yaProcesado: false,
          empresaId: empresaCliente.id,
          nuevoVencimiento,
          pago: nuevoPago,
          comprobante,
        };
      }
    );

    if (!resultado.yaProcesado) {
      // Disparar el Worker de Contingencia SUNAT y notificar por WebSocket al Tenant que su plan fue renovado
      dispararEnvioInmediatoWorkerSunat();
      emitToTenantSucursal(resultado.empresaId, null, 'suscripcion:renovada', {
        plan_codigo: evento.planCodigo,
        estado_suscripcion: 'ACTIVA',
        suscripcion_vence_en: resultado.nuevoVencimiento,
        factura_heis: `${resultado.comprobante.serie}-${String(resultado.comprobante.correlativo).padStart(8, '0')}`,
      });
    }

    return res.status(200).json({ ok: true, data: resultado });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/suscripciones/onboarding
 * Auto-Registro B2B con 14 Días de Prueba Gratis y generación automática de credenciales iniciales
 */
export const registrarOnboardingTrial = async (req, res, next) => {
  try {
    const {
      ruc,
      razon_social,
      nombre_comercial,
      direccion,
      telefono,
      vertical = 'restaurante', // 'restaurante' | 'botica' | 'ferreteria' | 'hospedaje'
      plan_codigo = 'PRO',
      admin_nombre,
      admin_email,
      admin_password, // Opcional: si no se envía, el sistema genera una clave segura aleatoria
    } = req.body;

    if (!validarRucSunatModulo11(ruc)) {
      return res.status(422).json({
        ok: false,
        message: 'El RUC ingresado no es válido según el algoritmo Módulo 11 de SUNAT.',
      });
    }

    if (!admin_email || !razon_social) {
      return res.status(422).json({
        ok: false,
        message: 'La Razón Social y el correo del administrador son obligatorios.',
      });
    }

    // Generar contraseña inicial aleatoria de alta entropía si el usuario no definió una
    const passwordInicialPlano =
      admin_password && String(admin_password).length >= 8
        ? String(admin_password)
        : `Heis-${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;

    const passwordHash = await bcrypt.hash(passwordInicialPlano, 12);

    const ahora = new Date();
    const trialEndsAt = new Date(ahora.getTime() + 14 * 24 * 60 * 60 * 1000); // Exactamente +14 días

    const resultado = await sequelize.transaction(async (t) => {
      // 1. Verificar que el RUC o el correo no estén ya registrados
      const empresaPrevia = await Empresa.findOne({
        where: { ruc: String(ruc).trim() },
        skipTenantScope: true,
        transaction: t,
      });
      if (empresaPrevia) {
        const err = new Error(`El RUC ${ruc} ya cuenta con una cuenta registrada en HEIS Suite.`);
        err.statusCode = 409;
        throw err;
      }

      const usuarioPrevio = await Usuario.findOne({
        where: { email: String(admin_email).trim().toLowerCase() },
        skipTenantScope: true,
        transaction: t,
      });
      if (usuarioPrevio) {
        const err = new Error(`El correo ${admin_email} ya está registrado.`);
        err.statusCode = 409;
        throw err;
      }

      const plan = await PlanSaaS.findOne({
        where: { codigo: plan_codigo },
        skipTenantScope: true,
        transaction: t,
      });

      // 2. Crear la Empresa con 14 días de Trial activo y el módulo del giro seleccionado
      const nuevaEmpresa = await Empresa.create(
        {
          nombre: String(nombre_comercial || razon_social).trim(),
          ruc: String(ruc).trim(),
          razon_social: String(razon_social).trim().toUpperCase(),
          nombre_comercial: String(nombre_comercial || razon_social).trim(),
          direccion: direccion || 'Lima, Perú',
          telefono: telefono || '',
          rubro: vertical,
          modulos_activos: JSON.stringify([vertical, 'facturacion_sunat']),
          plan_id: plan?.id || 'PRO',
          plan: 'professional',
          plan_codigo: plan_codigo,
          estado_suscripcion: 'TRIAL',
          trial_ends_at: trialEndsAt,
          suscripcion_vence_en: trialEndsAt,
          fecha_vencimiento: trialEndsAt.toISOString().slice(0, 10),
          entorno_sunat: 'beta', // Inicia en entorno BETA de SUNAT para pruebas sin riesgo fiscal
          activo: true,
        },
        { skipTenantScope: true, transaction: t }
      );

      // 3. Crear Sucursal Principal con series iniciales de Factura y Boleta
      const sucursalPrincipal = await Sucursal.create(
        {
          empresa_id: nuevaEmpresa.id,
          nombre: 'Sede Principal',
          codigo_sunat: '0000',
          direccion: direccion || 'Lima, Perú',
          serie_factura: 'F001',
          serie_boleta: 'B001',
          activo: true,
        },
        { skipTenantScope: true, transaction: t }
      );

      // 4. Crear Rol Administrador General del Tenant
      const rolAdmin = await Rol.create(
        {
          empresa_id: nuevaEmpresa.id,
          nombre: 'Administrador General',
          permisos: JSON.stringify(['*']),
        },
        { skipTenantScope: true, transaction: t }
      );

      // 5. Crear Usuario Administrador Inicial
      const usuarioAdmin = await Usuario.create(
        {
          empresa_id: nuevaEmpresa.id,
          sucursal_id: sucursalPrincipal.id,
          rol_id: rolAdmin.id,
          nombre: admin_nombre || 'Administrador Principal',
          email: String(admin_email).trim().toLowerCase(),
          password: passwordHash,
          es_superadmin: false,
          token_version: 1,
          activo: true,
        },
        { skipTenantScope: true, transaction: t }
      );

      return { nuevaEmpresa, sucursalPrincipal, usuarioAdmin };
    });

    // 6. Emitir JWT de acceso inmediato para redirigir directo al Dashboard
    const accessToken = jwt.sign(
      {
        sub: resultado.usuarioAdmin.id,
        id: resultado.usuarioAdmin.id,
        empresa_id: resultado.nuevaEmpresa.id,
        sucursal_id: resultado.sucursalPrincipal.id,
        rol_id: resultado.usuarioAdmin.rol_id,
        rol: 'admin',
        es_superadmin: false,
        tv: 1,
      },
      JWT_SECRET,
      { expiresIn: '12h', issuer: 'heis-suite-api' }
    );

    return res.status(201).json({
      ok: true,
      message: 'Cuenta empresarial creada con 14 días de prueba gratis.',
      data: {
        token: accessToken,
        credenciales_iniciales: {
          url_acceso: process.env.PUBLIC_APP_URL || 'https://suite.grupoheis.com',
          ruc: resultado.nuevaEmpresa.ruc,
          usuario_email: resultado.usuarioAdmin.email,
          password_temporal: admin_password ? undefined : passwordInicialPlano,
          modo_sunat_inicial: 'BETA (Pruebas SUNAT)',
        },
        suscripcion: {
          plan: plan_codigo,
          estado: 'TRIAL',
          dias_prueba: 14,
          vence_en: trialEndsAt.toISOString(),
        },
        empresa: {
          id: resultado.nuevaEmpresa.id,
          razon_social: resultado.nuevaEmpresa.razon_social,
          vertical,
        },
        sucursal_id: resultado.sucursalPrincipal.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Consultas y Gestión de Suscripciones (Existentes para Dashboard y SuperAdmin)
 */
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
        plan: empresa.plan_codigo || empresa.plan,
        plan_codigo: empresa.plan_codigo || 'PRO',
        estado_suscripcion: empresa.estado_suscripcion || 'TRIAL',
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
        plan: emp.plan_codigo || emp.plan,
        plan_codigo: emp.plan_codigo || 'PRO',
        estado_suscripcion: emp.estado_suscripcion || 'TRIAL',
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

export default {
  validarRucSunatModulo11,
  normalizarEventoPasarela,
  procesarWebhookPasarela,
  registrarOnboardingTrial,
  obtenerEstadoSuscripcionActual,
  listarCarteraCobranzasSaaS,
  renovarSuscripcionEmpresa,
  forzarBarridoMoraSaaS,
};
