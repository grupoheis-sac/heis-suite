import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Custodia = sequelize.define('Custodia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  nombre_cliente: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  telefono_cliente: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  direccion_obra: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha_emision: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_estimada_entrega: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  chofer_flete: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  vehiculo_placa: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Entrega Parcial', 'Completado', 'Cancelado', 'En Custodia'),
    defaultValue: 'Pendiente',
  },
  total_bultos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'ferreteria_custodias',
  indexes: [
    { fields: ['empresa_id'] },
    { fields: ['codigo'] },
    { fields: ['id_cliente'] },
    { fields: ['estado'] },
  ],
});

export default Custodia;

