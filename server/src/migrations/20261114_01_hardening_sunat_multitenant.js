import { DataTypes } from 'sequelize';

/**
 * Migración de Hardening:
 * 1. Columnas de control de contingencia y resiliencia SUNAT en Comprobantes Electrónicos
 * 2. Índices únicos compuestos y de barrido de alto rendimiento para el Contingency Worker
 * 3. Columna e índice de token_version en Usuarios para invalidación atómica de sesiones JWT
 */
export async function up({ queryInterface, Sequelize = DataTypes, transaction, helpers }) {
  console.log('🚀 [MIGRATION] Iniciando 20261114_01_hardening_sunat_multitenant...');

  const allTables = await queryInterface.showAllTables({ transaction });
  const tableNames = allTables.map((t) => (typeof t === 'object' ? Object.values(t)[0] : t));

  // 1. Determinar tabla de comprobantes electrónicos
  let cpeTable = 'core_comprobantes_electronicos';
  if (!tableNames.includes(cpeTable)) {
    if (tableNames.includes('comprobantes_electronicos')) {
      cpeTable = 'comprobantes_electronicos';
    }
  }

  if (tableNames.includes(cpeTable)) {
    console.log(`  -> Aplicando hardening sobre tabla: ${cpeTable}`);

    // Columnas de contingencia SUNAT
    await helpers.safeAddColumn(cpeTable, 'estado_sunat', {
      type: Sequelize.ENUM(
        'PENDIENTE',
        'PROCESANDO_ENVIO',
        'CONTINGENCIA_REINTENTAR',
        'ACEPTADO',
        'ACEPTADO_CON_OBSERVACIONES',
        'RECHAZADO',
        'ERROR_CRITICO'
      ),
      defaultValue: 'PENDIENTE',
      allowNull: false,
    });

    await helpers.safeAddColumn(cpeTable, 'intentos_envio', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });

    await helpers.safeAddColumn(cpeTable, 'proximo_reintento', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await helpers.safeAddColumn(cpeTable, 'codigo_sunat', {
      type: Sequelize.STRING(16),
      allowNull: true,
    });

    await helpers.safeAddColumn(cpeTable, 'ultimo_error_sunat', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await helpers.safeAddColumn(cpeTable, 'xml_firmado_filename', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await helpers.safeAddColumn(cpeTable, 'cdr_filename', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // Índices de alta concurrencia
    await helpers.safeAddIndex(
      cpeTable,
      ['empresa_id', 'tipo_comprobante', 'serie', 'correlativo'],
      {
        name: 'uk_cpe_tenant_tipo_serie_correlativo',
        unique: true,
      }
    );

    await helpers.safeAddIndex(
      cpeTable,
      ['estado_sunat', 'proximo_reintento', 'intentos_envio'],
      {
        name: 'idx_cpe_contingency_worker_scan',
      }
    );
  } else {
    console.warn(`  [!] Tabla ${cpeTable} aún no creada en BD; se crearán columnas al sincronizar modelos.`);
  }

  // 2. Determinar tabla de usuarios
  let userTable = 'usuarios';
  if (!tableNames.includes(userTable)) {
    if (tableNames.includes('core_usuarios')) {
      userTable = 'core_usuarios';
    }
  }

  if (tableNames.includes(userTable)) {
    console.log(`  -> Aplicando hardening sobre tabla: ${userTable}`);

    await helpers.safeAddColumn(userTable, 'token_version', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    });

    await helpers.safeAddIndex(userTable, ['id', 'token_version'], {
      name: 'idx_usuarios_token_version',
    });
  }

  console.log('✅ [MIGRATION] 20261114_01_hardening_sunat_multitenant completada exitosamente.');
}

export async function down({ queryInterface, transaction, helpers }) {
  console.log('↩️ [MIGRATION ROLLBACK] Revertiendo 20261114_01_hardening_sunat_multitenant...');

  const allTables = await queryInterface.showAllTables({ transaction });
  const tableNames = allTables.map((t) => (typeof t === 'object' ? Object.values(t)[0] : t));

  const cpeTable = tableNames.includes('core_comprobantes_electronicos')
    ? 'core_comprobantes_electronicos'
    : 'comprobantes_electronicos';

  if (tableNames.includes(cpeTable)) {
    try {
      await queryInterface.removeIndex(cpeTable, 'idx_cpe_contingency_worker_scan', { transaction });
    } catch (_) {}
    try {
      await queryInterface.removeIndex(cpeTable, 'uk_cpe_tenant_tipo_serie_correlativo', { transaction });
    } catch (_) {}

    await helpers.safeRemoveColumn(cpeTable, 'cdr_filename');
    await helpers.safeRemoveColumn(cpeTable, 'xml_firmado_filename');
    await helpers.safeRemoveColumn(cpeTable, 'ultimo_error_sunat');
    await helpers.safeRemoveColumn(cpeTable, 'codigo_sunat');
    await helpers.safeRemoveColumn(cpeTable, 'proximo_reintento');
    await helpers.safeRemoveColumn(cpeTable, 'intentos_envio');
    await helpers.safeRemoveColumn(cpeTable, 'estado_sunat');
  }

  const userTable = tableNames.includes('usuarios') ? 'usuarios' : 'core_usuarios';
  if (tableNames.includes(userTable)) {
    try {
      await queryInterface.removeIndex(userTable, 'idx_usuarios_token_version', { transaction });
    } catch (_) {}
    await helpers.safeRemoveColumn(userTable, 'token_version');
  }

  console.log('✅ [MIGRATION ROLLBACK] Reversión completada.');
}

export default { up, down };
