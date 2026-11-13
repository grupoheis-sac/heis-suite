import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_documento: {
    type: DataTypes.ENUM('DNI', 'RUC', 'CE', 'PASAPORTE', 'OTRO'),
    defaultValue: 'DNI',
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  perfil_cliente: {
    type: DataTypes.STRING(60),
    defaultValue: 'Contratista / Maestro de Obra',
  },
  tipo_precio: {
    type: DataTypes.STRING(50),
    defaultValue: 'Mayorista',
  },
  telefono: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contacto_obra: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  telefono_obra: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  direccion_obra: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ubigeo_obra: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  acceso_vehicular: {
    type: DataTypes.STRING(50),
    defaultValue: 'Camión Mediano (8-10 Tn)',
  },
  horario_descarga: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  requiere_estiba: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  personal_autorizado: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  limite_credito: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  dias_credito: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
  },
  estado_credito: {
    type: DataTypes.STRING(30),
    defaultValue: 'Activo',
  },
  dia_pago_preferido: {
    type: DataTypes.STRING(50),
    defaultValue: 'Sábados Quincenales',
  },
  metodo_pago_habitual: {
    type: DataTypes.STRING(50),
    defaultValue: 'Transferencia BCP / BBVA',
  },
  agente_retencion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  porcentaje_retencion: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 3.00,
  },
  estado_sunat: {
    type: DataTypes.STRING(30),
    defaultValue: 'ACTIVO',
  },
  condicion_sunat: {
    type: DataTypes.STRING(30),
    defaultValue: 'HABIDO',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'ferreteria_clientes',
  indexes: [
    { fields: ['numero_documento'] },
    { fields: ['nombre'] },
    { fields: ['empresa_id'] },
  ],
});

export default Cliente;

