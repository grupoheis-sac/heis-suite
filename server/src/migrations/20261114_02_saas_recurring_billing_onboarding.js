import { DataTypes } from 'sequelize';

/**
 * Migración: Monetización SaaS - Suscripciones y Auto-Facturación a Inquilinos
 * 1. Control de Trial y Suscripción en 'empresas'
 * 2. Idempotencia y Auto-Facturación en 'pagos_suscripcion_saas'
 * 3. Catálogo oficial de Planes SaaS en 'planes_saas'
 */
export async function up({ Sequelize = DataTypes, queryInterface, transaction, helpers }) {
  console.log('🚀 [MIGRATION] Iniciando 20261114_02_saas_recurring_billing_onboarding...');

  const allTables = await queryInterface.showAllTables({ transaction });
  const tableNames = allTables.map((t) => (typeof t === 'object' ? Object.values(t)[0] : t));

  // 1. Determinar tabla de empresas
  const empresaTable = tableNames.includes('empresas')
    ? 'empresas'
    : tableNames.includes('core_empresas')
    ? 'core_empresas'
    : 'empresas';

  if (tableNames.includes(empresaTable)) {
    console.log(`  -> Configurando campos de Trial y Suscripción en: ${empresaTable}`);

    await helpers.safeAddColumn(empresaTable, 'plan_codigo', {
      type: Sequelize.ENUM('BASICO', 'PRO', 'ENTERPRISE'),
      allowNull: false,
      defaultValue: 'PRO',
    });

    await helpers.safeAddColumn(empresaTable, 'estado_suscripcion', {
      type: Sequelize.ENUM('TRIAL', 'ACTIVA', 'PAST_DUE', 'SUSPENDIDA', 'CANCELADA'),
      allowNull: false,
      defaultValue: 'TRIAL',
    });

    await helpers.safeAddColumn(empresaTable, 'trial_ends_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await helpers.safeAddColumn(empresaTable, 'suscripcion_vence_en', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await helpers.safeAddColumn(empresaTable, 'pasarela_customer_id', {
      type: Sequelize.STRING(128),
      allowNull: true,
    });

    await helpers.safeAddColumn(empresaTable, 'pasarela_subscription_id', {
      type: Sequelize.STRING(128),
      allowNull: true,
    });
  }

  // 2. Determinar tabla de pagos de suscripción
  const pagosTable = tableNames.includes('pagos_suscripcion_saas')
    ? 'pagos_suscripcion_saas'
    : tableNames.includes('core_pagos_suscripcion_saas')
    ? 'core_pagos_suscripcion_saas'
    : 'pagos_suscripcion_saas';

  if (tableNames.includes(pagosTable)) {
    console.log(`  -> Configurando campos de Idempotencia y Pasarela en: ${pagosTable}`);

    await helpers.safeAddColumn(pagosTable, 'pasarela', {
      type: Sequelize.ENUM('MERCADOPAGO', 'IZIPAY', 'STRIPE', 'TRANSFERENCIA'),
      allowNull: false,
      defaultValue: 'MERCADOPAGO',
    });

    await helpers.safeAddColumn(pagosTable, 'pasarela_tx_id', {
      type: Sequelize.STRING(128),
      allowNull: true,
    });

    await helpers.safeAddColumn(pagosTable, 'comprobante_emitido_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await helpers.safeAddColumn(pagosTable, 'firma_verificada', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await helpers.safeAddColumn(pagosTable, 'periodo', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: 'MENSUAL',
    });

    // Índice único estricto: impide que un reintento de Webhook de Mercado Pago/Stripe/Izipay duplique el cobro o la factura
    await helpers.safeAddIndex(pagosTable, ['pasarela', 'pasarela_tx_id'], {
      name: 'uk_pago_saas_pasarela_tx_id',
      unique: true,
    });
  }

  // 3. Determinar tabla de planes SaaS y sembrar planes oficiales
  const planesTable = tableNames.includes('planes_saas')
    ? 'planes_saas'
    : tableNames.includes('core_planes_saas')
    ? 'core_planes_saas'
    : 'planes_saas';

  if (tableNames.includes(planesTable)) {
    console.log(`  -> Asegurando columnas de catálogo en: ${planesTable}`);

    await helpers.safeAddColumn(planesTable, 'codigo', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await helpers.safeAddColumn(planesTable, 'precio_anual', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 990.00,
    });

    await helpers.safeAddColumn(planesTable, 'max_sucursales', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });

    await helpers.safeAddColumn(planesTable, 'max_usuarios', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 5,
    });

    await helpers.safeAddColumn(planesTable, 'max_comprobantes_mes', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1000,
    });

    // Semilla idempotente de los 3 Planes Oficiales
    await queryInterface.bulkInsert(
      planesTable,
      [
        {
          id: 'BASICO',
          codigo: 'BASICO',
          nombre: 'Plan Básico',
          precio_mensual: 99.00,
          precio_anual: 990.00,
          max_sucursales: 1,
          max_usuarios: 5,
          max_comprobantes_mes: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'PRO',
          codigo: 'PRO',
          nombre: 'Plan Pro Multi-Módulo',
          precio_mensual: 199.00,
          precio_anual: 1990.00,
          max_sucursales: 3,
          max_usuarios: 20,
          max_comprobantes_mes: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ENTERPRISE',
          codigo: 'ENTERPRISE',
          nombre: 'Plan Enterprise Corporativo',
          precio_mensual: 399.00,
          precio_anual: 3990.00,
          max_sucursales: 99,
          max_usuarios: 999,
          max_comprobantes_mes: 999999,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { transaction, ignoreDuplicates: true }
    ).catch(() => {});
  }

  console.log('✅ [MIGRATION] 20261114_02_saas_recurring_billing_onboarding completada.');
}

export async function down({ queryInterface, transaction, helpers }) {
  console.log('↩️ [MIGRATION ROLLBACK] Revertiendo 20261114_02_saas_recurring_billing_onboarding...');

  const allTables = await queryInterface.showAllTables({ transaction });
  const tableNames = allTables.map((t) => (typeof t === 'object' ? Object.values(t)[0] : t));

  const pagosTable = tableNames.includes('pagos_suscripcion_saas')
    ? 'pagos_suscripcion_saas'
    : tableNames.includes('core_pagos_suscripcion_saas')
    ? 'core_pagos_suscripcion_saas'
    : null;

  if (pagosTable) {
    try {
      await queryInterface.removeIndex(pagosTable, 'uk_pago_saas_pasarela_tx_id', { transaction });
    } catch (_) {}
    await helpers.safeRemoveColumn(pagosTable, 'comprobante_emitido_id');
    await helpers.safeRemoveColumn(pagosTable, 'pasarela_tx_id');
    await helpers.safeRemoveColumn(pagosTable, 'pasarela');
    await helpers.safeRemoveColumn(pagosTable, 'firma_verificada');
  }

  const empresaTable = tableNames.includes('empresas')
    ? 'empresas'
    : tableNames.includes('core_empresas')
    ? 'core_empresas'
    : null;

  if (empresaTable) {
    await helpers.safeRemoveColumn(empresaTable, 'pasarela_subscription_id');
    await helpers.safeRemoveColumn(empresaTable, 'pasarela_customer_id');
    await helpers.safeRemoveColumn(empresaTable, 'suscripcion_vence_en');
    await helpers.safeRemoveColumn(empresaTable, 'trial_ends_at');
    await helpers.safeRemoveColumn(empresaTable, 'estado_suscripcion');
    await helpers.safeRemoveColumn(empresaTable, 'plan_codigo');
  }

  console.log('✅ [MIGRATION ROLLBACK] Reversión completada.');
}

export default { up, down };
