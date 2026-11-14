import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const Empresa = sequelize.define('Empresa', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  ruc: {
    type: DataTypes.STRING(11),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  plan: {
    type: DataTypes.ENUM('starter', 'professional', 'enterprise'),
    defaultValue: 'professional',
  },
  plan_codigo: {
    type: DataTypes.ENUM('BASICO', 'PRO', 'ENTERPRISE'),
    allowNull: false,
    defaultValue: 'PRO',
  },
  estado_suscripcion: {
    type: DataTypes.ENUM('TRIAL', 'ACTIVA', 'PAST_DUE', 'SUSPENDIDA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'TRIAL',
  },
  trial_ends_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  suscripcion_vence_en: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  pasarela_customer_id: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  pasarela_subscription_id: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  precio_mensual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 199.00,
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  modulos_activos: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['restaurante'],
    // Ejemplo: ["restaurante", "ferreteria", "botica", "hospedaje"]
  },
  submodulos_activos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    // Matriz de feature flags { mesas: true, cocina: true, lotes_fefo: false, ... }
  },
  permisos_botones: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    // Matriz de permisos de botones / RBAC { [alias]: { roles: [...], activo: true, pin_requerido: true, riesgo: 'critico' } }
  },
  color_brand: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: '#f59e0b',
  },
  config_whitelabel: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    // Configuración White-Label del portal de login y marca propia
  },
  entorno_sunat: {
    type: DataTypes.ENUM('beta', 'produccion'),
    defaultValue: 'beta',
  },
  logo_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  sunat_clave_sol: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sunat_certificado_password: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sunat_certificado_base64: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  sunat_token_ose: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'empresas',
  defaultScope: {
    attributes: {
      exclude: [
        'sunat_clave_sol',
        'sunat_certificado_password',
        'sunat_certificado_base64',
        'sunat_token_ose',
      ],
    },
  },
  scopes: {
    withSunatSecrets: {
      attributes: { include: [] },
    },
  },
});

export default Empresa;

