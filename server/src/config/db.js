import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { getCurrentTenant } from '../core/context/tenantContext.js';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_NAME = process.env.DB_NAME || 'heis_suite_db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 25,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// ============================================================================
// HOOKS GLOBALES DE AISLAMIENTO MULTI-TENANT (ROW-LEVEL SECURITY AUTOMÁTICO)
// ============================================================================
function applyTenantWhere(options, model) {
  if (options?.skipTenant) return;
  const store = getCurrentTenant();
  if (!store || !store.empresaId) return;

  // No filtrar la propia tabla Empresas ni PlanesSaaS
  if (!model || model.name === 'Empresa' || model.name === 'PlanSaaS') return;

  if (model.rawAttributes && model.rawAttributes.empresa_id) {
    options.where = {
      ...(options.where || {}),
      empresa_id: store.empresaId,
    };
  }
}

sequelize.addHook('beforeFind', function (options) {
  applyTenantWhere(options, this);
});

sequelize.addHook('beforeCount', function (options) {
  applyTenantWhere(options, this);
});

sequelize.addHook('beforeCreate', function (instance, options) {
  if (options?.skipTenant) return;
  const store = getCurrentTenant();
  if (!store) return;

  if (store.empresaId && this.rawAttributes?.empresa_id && !instance.empresa_id) {
    instance.empresa_id = store.empresaId;
  }
  if (store.sucursalId && this.rawAttributes?.sucursal_id && !instance.sucursal_id) {
    instance.sucursal_id = store.sucursalId;
  }
});

sequelize.addHook('beforeBulkCreate', function (instances, options) {
  if (options?.skipTenant) return;
  const store = getCurrentTenant();
  if (!store || !store.empresaId) return;

  if (this.rawAttributes?.empresa_id) {
    for (const inst of instances) {
      if (!inst.empresa_id) inst.empresa_id = store.empresaId;
    }
  }
});

sequelize.addHook('beforeBulkUpdate', function (options) {
  applyTenantWhere(options, this);
});

sequelize.addHook('beforeBulkDestroy', function (options) {
  applyTenantWhere(options, this);
});

export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`✅ Base de Datos Multi-Tenant conectada con Row-Level Isolation: ${DB_NAME} en ${DB_HOST}:${DB_PORT}`);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    return false;
  }
}

export default sequelize;
