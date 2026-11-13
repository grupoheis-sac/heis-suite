import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Proveedor = sequelize.define('Proveedor', {
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
    type: DataTypes.STRING(20),
    defaultValue: 'RUC',
  },
  ruc: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  razon_social: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  categoria_rubro: {
    type: DataTypes.STRING(100),
    defaultValue: 'Ferretería General',
  },
  contacto: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  dias_credito: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  limite_credito: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  tiempo_entrega_dias: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  agente_percepcion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  porcentaje_percepcion: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 2.00,
  },
  banco: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  cuenta_bancaria: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  cci: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  estado_sunat: {
    type: DataTypes.STRING(50),
    defaultValue: 'ACTIVO',
  },
  condicion_sunat: {
    type: DataTypes.STRING(50),
    defaultValue: 'HABIDO',
  },
  ubigeo: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'ferreteria_proveedores',
  indexes: [
    { fields: ['ruc'] },
    { fields: ['numero_documento'] },
    { fields: ['empresa_id'] },
  ],
});

export default Proveedor;
